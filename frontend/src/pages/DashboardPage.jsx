import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  FolderGit2,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { get } from "../services/api/api";
import Spinner from "../components/Spinner";
import FormMessage from "../components/ui/FormMessage";
import CreateOrganizationModal from "../components/organization/CreateOrganizationModal";
import CreateProjectModal from "../components/project/CreateProjectModal";
import { getInitials } from "../utils/getInitials";
import "./css/dashboardPage.css";

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState(null);

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  })();

  // Fetch Dashboard Stats
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => get("/projects/overview/stats"),
    staleTime: 1000 * 60 * 2,
  });

  // Fetch Recent Projects
  const { data: recentData, isLoading: isProjectsLoading, isError: isProjectsError, error: projectsError } = useQuery({
    queryKey: ["recent-projects"],
    queryFn: () => get("/projects/overview/recent"),
    staleTime: 1000 * 60 * 2,
  });

  // Fetch User Organizations (owned + member)
  const { data: orgsData, isLoading: isOrgsLoading } = useQuery({
    queryKey: ["user-organizations"],
    queryFn: () => get("/organizations"),
    staleTime: 1000 * 60 * 2,
  });

  const stats = statsData?.data || { totalOrganizations: 0, totalProjects: 0, totalTeammates: 0 };
  const recentProjects = recentData?.data || [];
  const organizations = orgsData?.data || [];

  const defaultOrgId = selectedOrgId || organizations[0]?._id;

  const handleOpenCreateProject = (orgId) => {
    setSelectedOrgId(orgId || organizations[0]?._id);
    setIsCreateProjectOpen(true);
  };

  const isLoading = isStatsLoading && isProjectsLoading && isOrgsLoading;

  if (isLoading) {
    return (
      <div className="dashboard-page-container">
        <Spinner label="Loading your dashboard..." fullScreen={false} />
      </div>
    );
  }

  return (
    <div className="dashboard-page-container">
      {/* Welcome Hero Banner */}
      <div className="dashboard-welcome-banner">
        <div className="dashboard-welcome-text">
          <h1>Welcome back, {currentUser.name || "Explorer"}! 👋</h1>
          <p>
            Track your projects, collaborate with teammates in real-time, and ship your goals with OrbitPM.
          </p>
        </div>

        <div className="dashboard-welcome-actions">
          {organizations.length > 0 ? (
            <button
              type="button"
              className="org-btn org-btn--primary"
              style={{ background: "#2563eb", borderColor: "#2563eb" }}
              onClick={() => handleOpenCreateProject()}
            >
              <Plus size={16} />
              <span>New Project</span>
            </button>
          ) : (
            <button
              type="button"
              className="org-btn org-btn--primary"
              style={{ background: "#2563eb", borderColor: "#2563eb" }}
              onClick={() => setIsCreateOrgOpen(true)}
            >
              <Plus size={16} />
              <span>Create Organization</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card">
          <div
            className="dashboard-stat-icon-wrapper"
            style={{ background: "#eff6ff", color: "#2563eb" }}
          >
            <Building2 size={24} />
          </div>
          <div className="dashboard-stat-info">
            <span className="dashboard-stat-label">Organizations</span>
            <span className="dashboard-stat-value">{stats.totalOrganizations}</span>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div
            className="dashboard-stat-icon-wrapper"
            style={{ background: "#f0fdf4", color: "#16a34a" }}
          >
            <FolderGit2 size={24} />
          </div>
          <div className="dashboard-stat-info">
            <span className="dashboard-stat-label">Active Projects</span>
            <span className="dashboard-stat-value">{stats.totalProjects}</span>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div
            className="dashboard-stat-icon-wrapper"
            style={{ background: "#faf5ff", color: "#9333ea" }}
          >
            <Users size={24} />
          </div>
          <div className="dashboard-stat-info">
            <span className="dashboard-stat-label">Teammates</span>
            <span className="dashboard-stat-value">{stats.totalTeammates}</span>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div
            className="dashboard-stat-icon-wrapper"
            style={{ background: "#fff7ed", color: "#ea580c" }}
          >
            <Sparkles size={24} />
          </div>
          <div className="dashboard-stat-info">
            <span className="dashboard-stat-label">Platform Status</span>
            <span className="dashboard-stat-value" style={{ fontSize: "1.2rem", color: "#16a34a" }}>
              Operational
            </span>
          </div>
        </div>
      </div>

      {/* Organization Switcher Bar */}
      {organizations.length > 0 && (
        <div className="dashboard-switcher-bar">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#475569" }}>
              YOUR ORGANIZATIONS:
            </span>
            <div className="dashboard-org-pills">
              {organizations.map((org) => (
                <button
                  key={org._id}
                  type="button"
                  className="dashboard-org-pill"
                  onClick={() => navigate(`/organization/${org.slug}`)}
                  title={`Go to ${org.name}`}
                >
                  {org.logo ? (
                    <img src={org.logo} alt="" className="dashboard-org-pill-logo" />
                  ) : (
                    <span className="dashboard-org-pill-initials">
                      {org.name[0]?.toUpperCase()}
                    </span>
                  )}
                  <span>{org.name}</span>
                  <ArrowRight size={13} style={{ opacity: 0.6 }} />
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="org-btn org-btn--secondary"
            style={{ padding: "6px 12px", fontSize: "0.8rem", whiteSpace: "nowrap" }}
            onClick={() => setIsCreateOrgOpen(true)}
          >
            <Plus size={14} />
            <span>New Organization</span>
          </button>
        </div>
      )}

      {/* Recent Projects Section */}
      <div>
        <div className="dashboard-section-header">
          <div className="dashboard-section-title">
            <FolderGit2 size={20} color="#2563eb" />
            <h2>Recent Projects</h2>
            <span className="dashboard-section-badge">{recentProjects.length}</span>
          </div>

          {organizations.length > 0 && (
            <button
              type="button"
              className="org-btn org-btn--primary"
              style={{ fontSize: "0.82rem", padding: "6px 14px" }}
              onClick={() => handleOpenCreateProject()}
            >
              <Plus size={14} />
              <span>Create Project</span>
            </button>
          )}
        </div>

        {isProjectsError && (
          <FormMessage type="error" text={projectsError?.message || "Failed to load recent projects."} />
        )}

        {recentProjects.length > 0 ? (
          <div className="dashboard-recent-grid">
            {recentProjects.map((project) => {
              const org = typeof project.organization === "object" ? project.organization : {};
              const owner = typeof project.owner === "object" ? project.owner : {};
              const ownerName = owner?.name || "Member";
              const ownerAvatar = owner?.avathar;
              const statusClass = `project-status--${project.status || "active"}`;

              return (
                <div
                  key={project._id}
                  className="dashboard-project-card"
                  onClick={() => navigate(`/project/${project._id}`)}
                >
                  <div className="dashboard-project-top">
                    <div>
                      <div className="dashboard-project-org-badge">
                        <Building2 size={12} />
                        <span>{org?.name || "Organization"}</span>
                      </div>
                      <h3 className="dashboard-project-title">{project.name}</h3>
                    </div>

                    <span className={`project-card-status-badge ${statusClass}`}>
                      {project.status}
                    </span>
                  </div>

                  <p className="dashboard-project-desc">
                    {project.description || "No description provided for this project."}
                  </p>

                  <div className="dashboard-project-bottom">
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {ownerAvatar ? (
                        <img
                          src={ownerAvatar}
                          alt={ownerName}
                          style={{ width: "20px", height: "20px", borderRadius: "50%", objectFit: "cover" }}
                        />
                      ) : (
                        <span
                          style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                            background: "#e2e8f0",
                            fontSize: "10px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "600",
                          }}
                        >
                          {getInitials(ownerName)}
                        </span>
                      )}
                      <span>{ownerName}</span>
                    </div>

                    <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#2563eb", fontWeight: "600" }}>
                      Open Board <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="dashboard-empty-card">
            <div className="dashboard-empty-icon">
              <FolderGit2 size={28} />
            </div>
            <h3>No projects yet</h3>
            <p>
              Projects hold your boards, task lists, and team progress. Create your first project to get started.
            </p>
            {organizations.length > 0 ? (
              <button
                type="button"
                className="org-btn org-btn--primary"
                onClick={() => handleOpenCreateProject()}
              >
                <Plus size={15} />
                <span>Create Your First Project</span>
              </button>
            ) : (
              <button
                type="button"
                className="org-btn org-btn--primary"
                onClick={() => setIsCreateOrgOpen(true)}
              >
                <Plus size={15} />
                <span>Create Organization First</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Organization Modal */}
      <CreateOrganizationModal
        isOpen={isCreateOrgOpen}
        onClose={() => setIsCreateOrgOpen(false)}
      />

      {/* Create Project Modal */}
      {defaultOrgId && (
        <CreateProjectModal
          isOpen={isCreateProjectOpen}
          onClose={() => setIsCreateProjectOpen(false)}
          organizationId={defaultOrgId}
        />
      )}
    </div>
  );
};

export default DashboardPage;
