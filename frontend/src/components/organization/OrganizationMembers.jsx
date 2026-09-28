import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, UserPlus, Users } from "lucide-react";
import { get, patch } from "../../services/api/api";
import Spinner from "../Spinner";
import FormMessage from "../ui/FormMessage";
import { PopupConform } from "../popup";
import { MemberTile } from "./MemberTile";
import { useRemoveMember } from "../../hooks/useRemoveMember";
import ChangeRoleMemberModal from "./ChangeRoleMemberModal";
import "./css/organizationMembers.css";

/**
 * @param {string}   organizationId   - Mongo _id of the organization
 * @param {string}   actorRole        - Role of the currently logged-in user ("owner"|"admin"|"editor"|"viewer")
 * @param {string}   actorUserId      - _id of the currently logged-in user
 * @param {function} onAddMemberClick - Opens the invite modal (owner/admin only — parent decides whether to pass it)
 */
export function OrganizationMembers({
  organizationId,
  actorRole,
  actorUserId,
  onAddMemberClick,
}) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Pending confirmation state: null | { member, actionType }
  const [pendingAction, setPendingAction] = useState(null);
  const [roleModalMember, setRoleModalMember] = useState(null);
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["organization-members", organizationId],
    queryFn: () => get(`/organizations/members/${organizationId}`),
    enabled: Boolean(organizationId),
    staleTime: 1000 * 60 * 2,
  });

  const members = data?.data || [];

  const removeMutation = useRemoveMember(organizationId, {
    onSuccess: (res) => {
      setFeedback({
        type: "success",
        text: res?.message || "Member removed successfully.",
      });
      setTimeout(() => setFeedback({ type: "", text: "" }), 4000);
    },
    onError: (err) => {
      setFeedback({
        type: "error",
        text: err?.message || "Failed to remove member.",
      });
    },
  });

  const suspendMutation = useMutation({
    mutationFn: async (targetUserId) => {
      return await patch(`/organizations/members/${organizationId}/${targetUserId}/suspend`);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({
        queryKey: ["organization-members", organizationId],
      });
      setFeedback({
        type: "success",
        text: res?.message || "Member status updated successfully.",
      });
      setTimeout(() => setFeedback({ type: "", text: "" }), 4000);
    },
    onError: (err) => {
      setFeedback({
        type: "error",
        text: err?.message || "Failed to update member status.",
      });
    },
  });

  const filteredMembers = members.filter((member) => {
    const user = typeof member.user === "object" ? member.user : {};
    const name = (user.name || "").toLowerCase();
    const email = (user.email || "").toLowerCase();
    const title = (member.title || "").toLowerCase();
    const matchesSearch =
      name.includes(searchQuery.toLowerCase()) ||
      email.includes(searchQuery.toLowerCase()) ||
      title.includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  /**
   * Called by MemberTile when the user clicks an action.
   */
  function handleMemberAction(actionType, member) {
    if (actionType === "remove" || actionType === "leave") {
      setPendingAction({ member, actionType });
      return;
    }
    if (actionType === "toggle-suspend") {
      setPendingAction({
        member,
        actionType: member.isSuspended ? "unsuspend" : "suspend",
      });
      return;
    }
    if (actionType === "change-role") {
      setRoleModalMember(member);
      return;
    }
  }

  function handleConfirmAction() {
    if (!pendingAction) return;
    const targetUserId =
      typeof pendingAction.member.user === "object"
        ? pendingAction.member.user._id
        : pendingAction.member.user;

    if (pendingAction.actionType === "remove" || pendingAction.actionType === "leave") {
      removeMutation.mutate(targetUserId);
    } else if (
      pendingAction.actionType === "suspend" ||
      pendingAction.actionType === "unsuspend"
    ) {
      suspendMutation.mutate(targetUserId);
    }
    setPendingAction(null);
  }

  if (isLoading) {
    return (
      <div className="org-members-loading">
        <Spinner label="Fetching organization members..." fullScreen={false} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="org-members-error">
        <FormMessage
          type="error"
          text={error?.message || "Failed to load organization members."}
        />
        <button
          type="button"
          className="org-btn org-btn--secondary"
          onClick={() => refetch()}
          style={{ marginTop: "12px" }}
        >
          Try Again
        </button>
      </div>
    );
  }

  const confirmMessage = (() => {
    if (!pendingAction) return "";
    const user =
      typeof pendingAction.member?.user === "object"
        ? pendingAction.member.user
        : {};
    const memberName = user.name || "this member";

    switch (pendingAction.actionType) {
      case "leave":
        return "Are you sure you want to leave this organization? You will lose access immediately.";
      case "suspend":
        return `Are you sure you want to suspend "${memberName}"? They will lose access to organization resources until unsuspended.`;
      case "unsuspend":
        return `Are you sure you want to unsuspend "${memberName}"? Their access will be restored.`;
      case "remove":
      default:
        return `Are you sure you want to remove "${memberName}" from the organization?`;
    }
  })();

  return (
    <div className="org-members-container">
      {/* Feedback banner */}
      {feedback.text && (
        <FormMessage type={feedback.type} text={feedback.text} />
      )}

      {/* Top Filter and Actions Bar */}
      <div className="org-members-toolbar">
        <div className="org-members-search-wrapper">
          <Search size={16} className="org-members-search-icon" />
          <input
            type="text"
            className="org-members-search-input"
            placeholder="Search by name, email or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="org-members-filter-group">
          <select
            className="org-members-role-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles ({members.length})</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>

          {onAddMemberClick && (
            <button
              type="button"
              className="org-btn org-btn--primary"
              onClick={onAddMemberClick}
            >
              <UserPlus size={15} />
              <span>Invite Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Members List Grid */}
      {filteredMembers.length > 0 ? (
        <div className="org-members-grid">
          {filteredMembers.map((member) => (
            <MemberTile
              key={member._id}
              member={member}
              actorRole={actorRole}
              actorUserId={actorUserId}
              onAction={handleMemberAction}
            />
          ))}
        </div>
      ) : (
        <div className="org-members-empty">
          <div className="org-members-empty-icon">
            <Users size={32} />
          </div>
          <h3>No members found</h3>
          <p>
            {searchQuery || roleFilter !== "all"
              ? "No team members matched your search criteria."
              : "This organization has no other team members yet."}
          </p>
        </div>
      )}

      {/* Action confirmation popup */}
      {pendingAction && (
        <PopupConform
          message={confirmMessage}
          onConfirmed={handleConfirmAction}
          onDenied={() => setPendingAction(null)}
        />
      )}

      {/* Change Role Modal */}
      <ChangeRoleMemberModal
        isOpen={Boolean(roleModalMember)}
        onClose={() => setRoleModalMember(null)}
        organizationId={organizationId}
        member={roleModalMember}
        actorRole={actorRole}
        onRoleUpdated={() => {
          setFeedback({
            type: "success",
            text: "Member role updated successfully.",
          });
          setTimeout(() => setFeedback({ type: "", text: "" }), 4000);
        }}
      />
    </div>
  );
}

export default OrganizationMembers;
