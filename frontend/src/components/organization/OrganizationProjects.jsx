import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Archive,
  ArchiveRestore,
  ExternalLink,
  FolderGit2,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { del, get, patch } from "../../services/api/api";
import Spinner from "../Spinner";
import FormMessage from "../ui/FormMessage";
import { PopupConform } from "../popup";
import CreateProjectModal from "../project/CreateProjectModal";
import { getInitials } from "../../utils/getInitials";
import "./css/organizationMembers.css";

export function OrganizationProjects({ organizationId, actorRole, orgSlug }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["organization-projects", organizationId],
    queryFn: () => get(`/projects?organizationId=${organizationId}&isArchived=all`),
    enabled: Boolean(organizationId),
    staleTime: 1000 * 60 * 2,
  });

  const projects = data?.data || [];

  const deleteMutation = useMutation({
    mutationFn: (projectId) => del(`/projects/${projectId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-projects", organizationId] });
      queryClient.invalidateQueries({ queryKey: ["organization", orgSlug] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-projects"] });
      setFeedback({ type: "success", text: "Project deleted successfully." });
      setTimeout(() => setFeedback({ type: "", text: "" }), 4000);
    },
    onError: (err) => {
      setFeedback({ type: "error", text: err?.message || "Failed to delete project." });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (projectId) => patch(`/projects/${projectId}/archive`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["organization-projects", organizationId] });
      setFeedback({
        type: "success",
        text: res?.message || "Project archive status updated.",
      });
      setTimeout(() => setFeedback({ type: "", text: "" }), 4000);
    },
    onError: (err) => {
      setFeedback({ type: "error", text: err?.message || "Failed to update project." });
    },
  });

  const canManageProjects = actorRole === "owner" || actorRole === "admin" || actorRole === "editor";
  const canDeleteProjects = actorRole === "owner" || actorRole === "admin";

  const filteredProjects = projects.filter((project) => {
    const nameMatches = (project.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const descMatches = (project.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = nameMatches || descMatches;

    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "archived"
        ? project.isArchived
        : !project.isArchived && project.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  function handleConfirmAction() {
    if (!pendingAction) return;
    if (pendingAction.type === "delete") {
      deleteMutation.mutate(pendingAction.project._id);
    } else if (pendingAction.type === "archive") {
      archiveMutation.mutate(pendingAction.project._id);
    }
    setPendingAction(null);
  }

  if (isLoading) {
    return (
      <div className="org-members-loading">
        <Spinner label="Loading projects..." fullScreen={false} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="org-members-error">
        <FormMessage type="error" text={error?.message || "Failed to load projects."} />
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

  return (
    <div className="org-projects-container">
      {feedback.text && <FormMessage type={feedback.type} text={feedback.text} />}

      {/* Toolbar */}
      <div className="org-members-toolbar">
        <div className="org-members-search-wrapper">
          <Search size={16} className="org-members-search-icon" />
          <input
            type="text"
            className="org-members-search-input"
            placeholder="Search projects by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="org-members-filter-group">
          <select
            className="org-members-role-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Projects ({projects.length})</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="on-hold">On Hold</option>
            <option value="archived">Archived</option>
          </select>

          {canManageProjects && (
            <button
              type="button"
              className="org-btn org-btn--primary"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus size={15} />
              <span>New Project</span>
            </button>
          )}
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="org-members-grid">
          {filteredProjects.map((project) => {
            const owner = typeof project.owner === "object" ? project.owner : {};
            const ownerName = owner?.name || "Member";
            const ownerAvatar = owner?.avathar;
            const statusClass = project.isArchived
              ? "project-status--archived"
              : `project-status--${project.status || "active"}`;

            return (
              <div key={project._id} className="project-card">
                <div className="project-card-header">
                  <div className="project-card-title-group">
                    <span
                      className="project-card-name"
                      style={{ cursor: "pointer" }}
                      onClick={() => navigate(`/project/${project._id}`)}
                      title="Open project board"
                    >
                      {project.name}
                    </span>
                    <span className="project-card-slug">/{project.slug}</span>
                  </div>

                  <span className={`project-card-status-badge ${statusClass}`}>
                    {project.isArchived ? "Archived" : project.status}
                  </span>
                </div>

                <p className="project-card-desc">
                  {project.description || "No description provided for this project."}
                </p>

                <div className="project-card-footer">
                  <div className="project-card-owner">
                    {ownerAvatar ? (
                      <img src={ownerAvatar} alt={ownerName} className="project-owner-avatar" />
                    ) : (
                      <div className="project-owner-initials">{getInitials(ownerName)}</div>
                    )}
                    <span>{ownerName}</span>
                  </div>

                  <div className="project-card-actions">
                    <button
                      type="button"
                      className="org-btn org-btn--secondary"
                      style={{ padding: "6px 10px", fontSize: "0.8rem", gap: "4px" }}
                      onClick={() => navigate(`/project/${project._id}`)}
                      title="Open project board"
                    >
                      <ExternalLink size={13} />
                      <span>Board</span>
                    </button>

                    {canManageProjects && (
                      <div style={{ position: "relative" }}>
                        <button
                          type="button"
                          className="member-tile-menu-btn"
                          onClick={() =>
                            setActiveMenuId((prev) => (prev === project._id ? null : project._id))
                          }
                          aria-label="More project actions"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {activeMenuId === project._id && (
                          <div className="member-tile-dropdown" role="menu">
                            <button
                              type="button"
                              className="member-dropdown-item"
                              onClick={() => {
                                setActiveMenuId(null);
                                setEditingProject(project);
                              }}
                            >
                              <Pencil size={14} />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              className="member-dropdown-item"
                              onClick={() => {
                                setActiveMenuId(null);
                                setPendingAction({
                                  type: "archive",
                                  project,
                                  title: project.isArchived ? "Restore Project" : "Archive Project",
                                  message: project.isArchived
                                    ? `Restore "${project.name}" to active projects?`
                                    : `Archive "${project.name}"? It will be hidden from active lists.`,
                                });
                              }}
                            >
                              {project.isArchived ? (
                                <>
                                  <ArchiveRestore size={14} />
                                  <span>Restore</span>
                                </>
                              ) : (
                                <>
                                  <Archive size={14} />
                                  <span>Archive</span>
                                </>
                              )}
                            </button>

                            {canDeleteProjects && (
                              <button
                                type="button"
                                className="member-dropdown-item member-dropdown-item--danger"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setPendingAction({
                                    type: "delete",
                                    project,
                                    title: "Delete Project",
                                    message: `Are you sure you want to delete project "${project.name}"? This action moves the project to trash.`,
                                  });
                                }}
                              >
                                <Trash2 size={14} />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="org-members-empty">
          <div className="org-members-empty-icon">
            <FolderGit2 size={32} />
          </div>
          <h3>No projects found</h3>
          <p>
            {searchQuery || statusFilter !== "all"
              ? "No projects matched your search criteria."
              : "No projects have been created in this organization yet."}
          </p>
          {canManageProjects && !searchQuery && statusFilter === "all" && (
            <button
              type="button"
              className="org-btn org-btn--primary"
              style={{ marginTop: "12px" }}
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus size={15} />
              <span>Create First Project</span>
            </button>
          )}
        </div>
      )}

      {/* Create / Edit Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen || Boolean(editingProject)}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingProject(null);
        }}
        organizationId={organizationId}
        project={editingProject}
      />

      {/* Confirmation Popup */}
      {pendingAction && (
        <PopupConform
          message={pendingAction.message}
          onConfirmed={handleConfirmAction}
          onDenied={() => setPendingAction(null)}
        />
      )}
    </div>
  );
}

export default OrganizationProjects;
