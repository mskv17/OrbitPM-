import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Building2, FolderGit2, Plus, Users } from "lucide-react";
import { get } from "../services/api/api";
import Spinner from "../components/Spinner";
import FormMessage from "../components/ui/FormMessage";
import CreateOrganizationModal from "../components/organization/CreateOrganizationModal";
import "./css/organizationsPage.css";

export function OrganizationsPage() {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["user-organizations"],
    queryFn: () => get("/organizations"),
  });

  const organizations = data?.data || [];

  if (isLoading) {
    return <Spinner label="Fetching your organizations..." fullScreen={false} />;
  }

  if (isError) {
    return (
      <div className="orgs-container">
        <FormMessage
          type="error"
          text={error?.message || "Failed to load organizations."}
        />
      </div>
    );
  }

  return (
    <div className="orgs-container">
      {/* Header Bar */}
      <div className="orgs-header">
        <div className="orgs-header-title-group">
          <h1 className="orgs-title">Organizations</h1>
          <span className="orgs-count-badge">{organizations.length}</span>
        </div>

        <button
          type="button"
          className="orgs-create-btn"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus size={15} />
          <span>Create Organization</span>
        </button>
      </div>

      {/* Organizations Grid or Empty State */}
      {organizations.length === 0 ? (
        <div className="orgs-empty-state">
          <div className="orgs-empty-icon">
            <Building2 size={24} />
          </div>
          <h3 className="orgs-empty-title">No Organizations Yet</h3>
          <p className="orgs-empty-text">
            Create an organization to start collaborating with your team and managing projects.
          </p>
          <button
            type="button"
            className="orgs-create-btn"
            style={{ marginTop: "6px" }}
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={15} />
            <span>Create Organization</span>
          </button>
        </div>
      ) : (
        <div className="orgs-grid">
          {organizations.map((org) => {
            const formattedDate = org.createdAt
              ? new Date(org.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "";

            return (
              <div
                className="org-card"
                key={org._id}
                onClick={() => navigate(`/organization/${org.slug}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    navigate(`/organization/${org.slug}`);
                  }
                }}
              >
                <div>
                  {/* Card Top: Logo, Name */}
                  <div className="org-card-top">
                    <div className="org-card-info">
                      {org.logo ? (
                        <img
                          src={org.logo}
                          alt={org.name}
                          className="org-logo-img"
                        />
                      ) : (
                        <div className="org-logo-fallback">
                          {org.name[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="org-name-block">
                        <h2 className="org-name" title={org.name}>
                          {org.name}
                        </h2>
                        <span className="org-slug" title={`/${org.slug}`}>
                          /{org.slug}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {org.description && (
                    <p className="org-description">{org.description}</p>
                  )}
                </div>

                {/* Card Footer Stats */}
                <div className="org-card-footer">
                  <div className="org-stats">
                    <span className="org-stat-item" title="Team members">
                      <Users size={13} />
                      <span>{org.totalTeamMembers ?? 1}</span>
                    </span>
                    <span className="org-stat-item" title="Projects">
                      <FolderGit2 size={13} />
                      <span>{org.totalProjects ?? 0}</span>
                    </span>
                  </div>
                  {formattedDate && (
                    <span className="org-date">{formattedDate}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Organization Modal */}
      <CreateOrganizationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}

export default OrganizationsPage;
