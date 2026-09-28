import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, UserCheck } from "lucide-react";
import Modal from "../ui/Modal";
import FormMessage from "../ui/FormMessage";
import ButtonSpinner from "../ui/ButtonSpinner";
import { patch } from "../../services/api/api";
import { getInitials } from "../../utils/getInitials";
import RoleBadge from "../ui/RoleBadge";

export function ChangeRoleMemberModal({
  isOpen,
  onClose,
  organizationId,
  member,
  actorRole,
  onRoleUpdated,
}) {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState("editor");
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const user = typeof member?.user === "object" ? member.user : {};
  const targetUserId = user._id || member?.user;
  const currentRole = member?.role || "viewer";

  useEffect(() => {
    if (isOpen && member) {
      setSelectedRole(member.role || "editor");
      setFeedback({ type: "", text: "" });
    }
  }, [isOpen, member]);

  const updateRoleMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId || !targetUserId) return;
      return await patch(`/organizations/members/${organizationId}/${targetUserId}/role`, {
        role: selectedRole,
      });
    },
    onSuccess: (resData) => {
      queryClient.invalidateQueries({
        queryKey: ["organization-members", organizationId],
      });
      setFeedback({
        type: "success",
        text: resData?.message || "Member role updated successfully!",
      });
      onRoleUpdated?.();
      setTimeout(() => {
        onClose();
      }, 1000);
    },
    onError: (err) => {
      setFeedback({
        type: "error",
        text: err?.message || "Failed to update member role.",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedRole === currentRole) {
      setFeedback({
        type: "error",
        text: "Please select a different role than the member's current role.",
      });
      return;
    }
    updateRoleMutation.mutate();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Member Role">
      <div className="invite-modal-content">
        {feedback.text && (
          <div style={{ marginBottom: "16px" }}>
            <FormMessage type={feedback.type} text={feedback.text} />
          </div>
        )}

        <div className="invite-user-result-tile" style={{ marginBottom: "20px" }}>
          <div className="invite-user-avatar-wrapper">
            {user.avathar ? (
              <img
                src={user.avathar}
                alt={user.name || "Member"}
                className="invite-user-avatar-img"
              />
            ) : (
              <div className="invite-user-avatar-initials">
                {getInitials(user.name || "Member")}
              </div>
            )}
          </div>
          <div className="invite-user-info">
            <h4 className="invite-user-name">{user.name || "Member"}</h4>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted, #64748b)" }}>Current:</span>
              <RoleBadge role={currentRole} />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="member-role-select" className="invite-field-label" style={{ marginBottom: "8px", display: "block" }}>
            Select New Role
          </label>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <select
              id="member-role-select"
              className="invite-role-select"
              style={{ flex: 1, padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-color, #e2e8f0)", fontSize: "14px" }}
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              disabled={updateRoleMutation.isPending}
            >
              {actorRole === "owner" && <option value="admin">Admin (Manage members & projects)</option>}
              <option value="editor">Editor (Can create & manage tasks/boards)</option>
              <option value="viewer">Viewer (Read-only access)</option>
            </select>

            <button
              type="submit"
              className="org-btn org-btn--primary"
              disabled={updateRoleMutation.isPending || selectedRole === currentRole}
              style={{ whiteSpace: "nowrap" }}
            >
              {updateRoleMutation.isPending ? (
                <ButtonSpinner />
              ) : (
                <>
                  <UserCheck size={16} />
                  <span>Update Role</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export default ChangeRoleMemberModal;
