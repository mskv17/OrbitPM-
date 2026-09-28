import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mail, UserCheck, XCircle } from "lucide-react";
import Spinner from "../components/Spinner";
import FormMessage from "../components/ui/FormMessage";
import { patch, post } from "../services/api/api";
import { getInitials } from "../utils/getInitials";
import RoleBadge from "../components/ui/RoleBadge";
import { PageErrorState, PageLoadingState } from "../components/ui/PageStateCard";
import "./css/acceptInvitationPage.css";

export function AcceptInvitationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const verifyMutation = useMutation({
    mutationFn: (verificationToken) =>
      post("/invites/verify-token", { token: verificationToken }),
  });

  useEffect(() => {
    if (token) {
      verifyMutation.mutate(token);
    }
  }, [token]);

  const updateStatusMutation = useMutation({
    mutationFn: (status) => patch("/invites/update-status", { token, status }),
    onSuccess: (resData, status) => {
      queryClient.invalidateQueries({ queryKey: ["user-organizations"] });
      queryClient.invalidateQueries({ queryKey: ["auth-me"] });
      setFeedback({
        type: "success",
        text: resData?.message || `Invitation ${status} successfully!`,
      });
    },
    onError: (err) => {
      setFeedback({
        type: "error",
        text: err?.message || "Failed to update invitation status.",
      });
    },
  });

  const handleUpdateStatus = (status) => {
    if (!token || updateStatusMutation.isPending) return;
    setFeedback({ type: "", text: "" });
    updateStatusMutation.mutate(status);
  };

  if (verifyMutation.isPending) {
    return <PageLoadingState label="Verifying invitation link..." />;
  }

  const invitation = verifyMutation.data?.data;
  const organization = invitation?.organization;
  const invitedUser = invitation?.to;

  if (!token || verifyMutation.isError || !invitation) {
    return (
      <PageErrorState
        message={
          !token
            ? "Invitation link token is missing. Please use the complete link sent to your email."
            : verifyMutation.error?.message || "Invalid or expired invitation link."
        }
      />
    );
  }

  const isCompleted = updateStatusMutation.isSuccess;

  return (
    <main className="accept-invite-page">
      <div className="accept-invite-card">
        {/* Banner */}
        <div className="accept-invite-banner" />

        {/* Header Content */}
        <div className="accept-invite-header-content">
          <div className="accept-invite-org-logo">
            {organization?.logo ? (
              <img
                src={organization.logo}
                alt={organization.name}
                className="accept-invite-logo-img"
              />
            ) : (
              <div className="accept-invite-logo-initials">
                {getInitials(organization?.name)}
              </div>
            )}
          </div>

          <span className="accept-invite-eyebrow">Organization Invitation</span>
          <h1 className="accept-invite-title">{organization?.name}</h1>
          {organization?.slug && (
            <span className="accept-invite-slug">/{organization.slug}</span>
          )}

          {organization?.description && (
            <p className="accept-invite-desc">{organization.description}</p>
          )}
        </div>

        {/* Body */}
        <div className="accept-invite-body">
          {feedback.text && (
            <div style={{ marginBottom: "16px" }}>
              <FormMessage type={feedback.type} text={feedback.text} />
            </div>
          )}

          {/* Details Box */}
          <div className="accept-invite-details-box">
            {invitedUser && (
              <div className="accept-invite-user-row">
                <div className="accept-invite-user-avatar">
                  {invitedUser.avathar ? (
                    <img
                      src={invitedUser.avathar}
                      alt={invitedUser.name}
                      className="accept-invite-user-avatar-img"
                    />
                  ) : (
                    <div className="accept-invite-user-avatar-initials">
                      {getInitials(invitedUser.name)}
                    </div>
                  )}
                </div>
                <div className="accept-invite-user-info">
                  <span className="accept-invite-user-name">
                    {invitedUser.name}
                  </span>
                  <div className="accept-invite-user-email">
                    <Mail size={12} />
                    <span>{invitedUser.email}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="accept-invite-meta-row">
              <span className="accept-invite-meta-label">Invited Role:</span>
              <RoleBadge role={invitation.role} />
            </div>

            <div className="accept-invite-meta-row">
              <span className="accept-invite-meta-label">Status:</span>
              <span
                className="member-role-badge"
                style={{
                  background: isCompleted ? "#dcfce7" : "#fef3c7",
                  color: isCompleted ? "#16a34a" : "#d97706",
                  border: isCompleted ? "1px solid #bbf7d0" : "1px solid #fde68a",
                }}
              >
                {isCompleted
                  ? updateStatusMutation.variables === "accepted"
                    ? "Accepted"
                    : "Rejected"
                  : "Pending Action"}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          {isCompleted ? (
            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <button
                type="button"
                className="org-btn org-btn--primary"
                onClick={() =>
                  navigate(
                    updateStatusMutation.variables === "accepted"
                      ? `/organization/${organization?.slug || ""}`
                      : "/dashboard"
                  )
                }
              >
                {updateStatusMutation.variables === "accepted"
                  ? "View Organization"
                  : "Go to Dashboard"}
              </button>
            </div>
          ) : (
            <div className="accept-invite-actions">
              <button
                type="button"
                className="accept-invite-btn accept-invite-btn--reject"
                onClick={() => handleUpdateStatus("rejected")}
                disabled={updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending &&
                updateStatusMutation.variables === "rejected" ? (
                  <Spinner label="" />
                ) : (
                  <>
                    <XCircle size={18} />
                    <span>Reject</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="accept-invite-btn accept-invite-btn--accept"
                onClick={() => handleUpdateStatus("accepted")}
                disabled={updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending &&
                updateStatusMutation.variables === "accepted" ? (
                  <Spinner label="" />
                ) : (
                  <>
                    <UserCheck size={18} />
                    <span>Accept</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default AcceptInvitationPage;
