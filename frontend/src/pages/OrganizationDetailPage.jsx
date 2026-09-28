import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  FolderGit2,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import { del, get } from "../services/api/api";
import Spinner from "../components/Spinner";
import FormMessage from "../components/ui/FormMessage";
import { PopupConform } from "../components/popup";
import CreateOrganizationModal from "../components/organization/CreateOrganizationModal";
import InviteMemberModal from "../components/organization/InviteMemberModal";
import OrganizationMembers from "../components/organization/OrganizationMembers";
import OrganizationProjects from "../components/organization/OrganizationProjects";
import "./css/organizationDetailPage.css";

export function OrganizationDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("members");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["organization", slug],
    queryFn: () => get(`/organizations/${slug}`),
    enabled: Boolean(slug),
    staleTime: 0,
  });

  const org = data?.data;

  // Current user id comes from localStorage — ProtectedRoute writes it on every auth check.
  // No extra network call needed; the role is derived from the members list below.
  const currentUserId = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"))?._id || null;
    } catch {
      return null;
    }
  })();

  // Fetch members list (React Query deduplicates — OrganizationMembers child uses the same key)
  const { data: membersData } = useQuery({
    queryKey: ["organization-members", org?._id],
    queryFn: () => get(`/organizations/members/${org._id}`),
    enabled: Boolean(org?._id),
    staleTime: 1000 * 60 * 2,
  });

  const members = membersData?.data || [];
  const actorMember = members.find(
    (m) => String(typeof m.user === "object" ? m.user._id : m.user) === String(currentUserId)
  );
  const actorRole = actorMember?.role || null;
  const actorUserId = currentUserId;

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!org?._id) return;
      const res = await del(`/organizations/${org._id}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-organizations"] });
      queryClient.invalidateQueries({ queryKey: ["organizations", org?.slug] });
      queryClient.invalidateQueries({ queryKey: ["auth-me"] });
      queryClient.invalidateQueries({ queryKey: ["deleted-organizations"] });
      navigate("/organizations");
    },
    onError: (err) => {
      setShowDeleteConfirm(false);
      setFeedback({
        type: "error",
        text: err?.message || "Failed to delete organization.",
      });
    },
  });

  const handleDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    deleteMutation.mutate();
  };

  if (isLoading) {
    return <Spinner label="Loading organization details..." fullScreen={false} />;
  }

  if (isError || !org) {
    return (
      <div className="org-detail-container">
        <Link to="/organizations" className="org-detail-back-link">
          <ArrowLeft size={16} />
          <span>Back to Organizations</span>
        </Link>
        <FormMessage
          type="error"
          text={error?.message || "Organization not found or has been deleted."}
        />
      </div>
    );
  }

  const formattedDate = org.createdAt
    ? new Date(org.createdAt).toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    : "N/A";

  const ownerName = org.owner?.name || "Owner";
  const ownerAvatar = org.owner?.avathar;

  return (
    <div className="org-detail-container">
      {/* Back Link */}
      <Link to="/organizations" className="org-detail-back-link">
        <ArrowLeft size={16} />
        <span>Back to Organizations</span>
      </Link>

      {feedback.text && (
        <div style={{ marginBottom: "16px" }}>
          <FormMessage type={feedback.type} text={feedback.text} />
        </div>
      )}

      {/* Main Profile Card */}
      <div className="org-detail-card">
        {/* Banner */}
        <div className="org-detail-banner" />

        {/* Header Content */}
        <div className="org-detail-header-content">
          <div className="org-detail-logo-wrapper">
            {org.logo ? (
              <img
                src={org.logo}
                alt={org.name}
                className="org-detail-logo-img"
              />
            ) : (
              <div className="org-detail-logo-initials">
                {org.name[0]?.toUpperCase()}
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="org-detail-actions">

            <button
              type="button"
              className="org-btn org-btn--secondary"
              onClick={() => setIsEditModalOpen(true)}
              title="Edit Organization"
            >
              <Pencil size={15} />
              <span>Edit</span>
            </button>

            <button
              type="button"
              className="org-btn org-btn--danger"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleteMutation.isPending}
              title="Delete Organization"
            >
              <Trash2 size={15} />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Identity & Description */}
        <div className="org-detail-info">
          <div className="org-detail-title-row">
            <h1 className="org-detail-name">{org.name}</h1>
            <span className="org-detail-slug-tag">/{org.slug}</span>
          </div>

          {org.description && (
            <p className="org-detail-desc">{org.description}</p>
          )}

          {/* Owner Tag */}
          <div className="org-owner-badge">
            <span>Created by</span>
            {ownerAvatar ? (
              <img
                src={ownerAvatar}
                alt={ownerName}
                className="org-owner-avatar"
              />
            ) : (
              <span className="org-owner-initials">
                {ownerName[0]?.toUpperCase()}
              </span>
            )}
            <strong style={{ color: "var(--secondary, #1e293b)" }}>
              {ownerName}
            </strong>
          </div>
        </div>

        {/* Stats Bar Grid */}
        <div className="org-detail-stats-grid">
          <div className="org-stat-card">
            <div className="org-stat-icon">
              <Users size={18} />
            </div>
            <div className="org-stat-content">
              <span className="org-stat-label">Teammates</span>
              <span className="org-stat-val">{org.totalTeamMembers ?? 1}</span>
            </div>
          </div>

          <div className="org-stat-card">
            <div className="org-stat-icon">
              <FolderGit2 size={18} />
            </div>
            <div className="org-stat-content">
              <span className="org-stat-label">Projects</span>
              <span className="org-stat-val">{org.totalProjects ?? 0}</span>
            </div>
          </div>

          <div className="org-stat-card">
            <div className="org-stat-icon">
              <Calendar size={18} />
            </div>
            <div className="org-stat-content">
              <span className="org-stat-label">Created</span>
              <span className="org-stat-val">{formattedDate}</span>
            </div>
          </div>

          <div className="org-stat-card">
            <div className="org-stat-icon" style={{ color: "#16a34a", background: "#dcfce7" }}>
              <CheckCircle2 size={18} />
            </div>
            <div className="org-stat-content">
              <span className="org-stat-label">Status</span>
              <span className="org-stat-val" style={{ color: "#16a34a" }}>Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Tabs Section */}
      <div className="org-detail-tabs-container">
        <div className="org-detail-tabs-header">
          <button
            type="button"
            className={`org-tab-btn ${activeTab === "members" ? "is-active" : ""}`}
            onClick={() => setActiveTab("members")}
          >
            <Users size={14} />
            <span>Members ({org.totalTeamMembers ?? 1})</span>
          </button>
          <button
            type="button"
            className={`org-tab-btn ${activeTab === "projects" ? "is-active" : ""}`}
            onClick={() => setActiveTab("projects")}
          >
            <FolderGit2 size={14} />
            <span>Projects ({org.totalProjects ?? 0})</span>
          </button>
        </div>

        {activeTab === "members" && (
          <OrganizationMembers
            organizationId={org._id}
            actorRole={actorRole}
            actorUserId={actorUserId}
            onAddMemberClick={
              actorRole === "owner" || actorRole === "admin"
                ? () => setIsInviteModalOpen(true)
                : undefined
            }
          />
        )}

        {activeTab === "projects" && (
          <OrganizationProjects
            organizationId={org._id}
            actorRole={actorRole}
            orgSlug={org.slug}
          />
        )}
      </div>

      {/* Delete Confirmation Popup */}
      {showDeleteConfirm && (
        <PopupConform
          message={`Are you sure you want to delete "${org.name}"? This action moves the organization to trash.`}
          onConfirmed={handleDeleteConfirm}
          onDenied={() => setShowDeleteConfirm(false)}
        />
      )}

      {/* Edit Organization Modal Popup */}
      <CreateOrganizationModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        organization={org}
      />

      {/* Invite Member Modal Popup */}
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        organizationId={org._id}
      />
    </div>
  );
}

export default OrganizationDetailPage;
