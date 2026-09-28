import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Mail, Search, UserPlus } from "lucide-react";
import Modal from "../ui/Modal";
import FormMessage from "../ui/FormMessage";
import { get, post } from "../../services/api/api";
import { getInitials } from "../../utils/getInitials";
import "./css/inviteMemberModal.css";
import ButtonSpinner from "../ui/ButtonSpinner";

export function InviteMemberModal({
  isOpen,
  onClose,
  organizationId,
  onInviteSuccess,
}) {
  const [email, setEmail] = useState("");
  const [searchedUser, setSearchedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("editor");
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const [isSearching, setIsSearching] = useState(false);

  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setEmail("");
      setSearchedUser(null);
      setSelectedRole("editor");
      setFeedback({ type: "", text: "" });
      setIsSearching(false);
    }
  }

  const handleSearch = async (e) => {
    e?.preventDefault();
    setFeedback({ type: "", text: "" });
    setSearchedUser(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFeedback({ type: "error", text: "Please enter an email address." });
      return;
    }

    try {
      setIsSearching(true);
      const res = await get(
        `/search/users-by-email?email=${encodeURIComponent(trimmedEmail)}`
      );
      const foundUser = res?.data?.user;
      if (foundUser) {
        setSearchedUser(foundUser);
      } else {
        setFeedback({ type: "error", text: "User not found with this email." });
      }
    } catch (err) {
      setFeedback({
        type: "error",
        text: err?.message || "No user found with this email address.",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId || !searchedUser?._id) return;
      return await post("/organizations/invite/member", {
        organizationId,
        memberId: searchedUser._id,
        role: selectedRole,
      });
    },
    onSuccess: (resData) => {
      setFeedback({
        type: "success",
        text: resData?.message || "Invitation sent successfully!",
      });
      onInviteSuccess?.();
    },
    onError: (err) => {
      setFeedback({
        type: "error",
        text: err?.message || "Failed to send invitation.",
      });
    },
  });



  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Teammate">
      <div className="invite-modal-content">
        {feedback.text && (
          <div style={{ marginBottom: "16px" }}>
            <FormMessage type={feedback.type} text={feedback.text} />
          </div>
        )}

        <form onSubmit={handleSearch} className="invite-search-form">
          <label htmlFor="invite-email-input" className="invite-field-label">
            User Email Address
          </label>
          <div className="invite-search-input-group">
            <input
              id="invite-email-input"
              type="email"
              className="invite-email-input"
              placeholder="Enter email to search user..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSearching || inviteMutation.isPending}
            />
            <button
              type="submit"
              className="org-btn org-btn--primary invite-search-btn"
              disabled={isSearching || inviteMutation.isPending}
            >
              {isSearching ? <ButtonSpinner label="" /> : <Search size={16} />}
              <span>Search</span>
            </button>
          </div>
        </form>

        {searchedUser && (
          <div className="invite-user-result-tile">
            <div className="invite-user-avatar-wrapper">
              {searchedUser.avathar ? (
                <img
                  src={searchedUser.avathar}
                  alt={searchedUser.name}
                  className="invite-user-avatar-img"
                />
              ) : (
                <div className="invite-user-avatar-initials">
                  {getInitials(searchedUser.name)}
                </div>
              )}
            </div>

            <div className="invite-user-info">
              <h4 className="invite-user-name">{searchedUser.name}</h4>
              <div className="invite-user-email">
                <Mail size={12} />
                <span>{searchedUser.email}</span>
              </div>
            </div>

            <div className="invite-user-actions">
              <select
                className="invite-role-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                disabled={inviteMutation.isPending}
              >
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>

              <button
                type="button"
                className="org-btn org-btn--primary invite-send-btn"
                onClick={() => inviteMutation.mutate()}
                disabled={inviteMutation.isPending}
              >
                {inviteMutation.isPending ? (
                  <ButtonSpinner />
                ) : (
                  <>
                    <UserPlus size={15} />
                    <span>Invite</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default InviteMemberModal;
