import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Building2, RotateCcw, Trash2 } from "lucide-react";
import { get, patch } from "../services/api/api";
import Spinner from "../components/Spinner";
import FormMessage from "../components/ui/FormMessage";
import ButtonSpinner from "../components/ui/ButtonSpinner";
import "./css/restoreResourcesPage.css";

export function RestoreResourcesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("organizations");
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["deleted-organizations"],
    queryFn: () => get("/organizations?isDeleted=true"),
  });

  const deletedOrgs = data?.data || [];

  const restoreMutation = useMutation({
    mutationFn: async (orgId) => {
      const res = await patch(`/organizations/${orgId}/restore`);
      return res;
    },
    onSuccess: (responseData) => {
      setFeedback({
        type: "success",
        text: responseData?.message || "Organization restored successfully!",
      });

      queryClient.invalidateQueries({ queryKey: ["user-organizations"] });
      queryClient.invalidateQueries({ queryKey: ["deleted-organizations"] });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["auth-me"] });
    },
    onError: (err) => {
      setFeedback({
        type: "error",
        text: err?.message || "Failed to restore organization.",
      });
    },
  });

  if (isLoading) {
    return <Spinner label="Loading trash items..." fullScreen={false} />;
  }

  return (
    <div className="restore-container">
      {/* Back Link */}
      <Link to="/profile" className="restore-back-link">
        <ArrowLeft size={16} />
        <span>Back to Profile</span>
      </Link>

      <div className="restore-header">
        <h1 className="restore-title">Restore Deleted Resources</h1>
        <p className="restore-subtitle">
          View and restore soft-deleted organizations, projects, or items.
        </p>
      </div>

      {feedback.text && (
        <div style={{ marginBottom: "16px" }}>
          <FormMessage type={feedback.type} text={feedback.text} />
        </div>
      )}

      {/* Tabs Bar */}
      <div className="restore-tabs">
        <button
          type="button"
          className={`restore-tab-btn ${activeTab === "organizations" ? "is-active" : ""}`}
          onClick={() => setActiveTab("organizations")}
        >
          <Building2 size={15} />
          <span>Organizations</span>
          <span className="restore-tab-count">{deletedOrgs.length}</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === "organizations" && (
        <>
          {deletedOrgs.length === 0 ? (
            <div className="restore-empty">
              <div className="restore-empty-icon">
                <Trash2 size={24} />
              </div>
              <h3 className="restore-empty-title">Trash is Empty</h3>
              <p className="restore-empty-text">
                No deleted organizations found. Items you delete will appear here for recovery.
              </p>
            </div>
          ) : (
            <div className="restore-grid">
              {deletedOrgs.map((org) => {
                const deletedDate = org.updatedAt
                  ? new Date(org.updatedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "";

                const isRestoring =
                  restoreMutation.isPending &&
                  restoreMutation.variables === org._id;

                return (
                  <div className="restore-card" key={org._id}>
                    <div>
                      <div className="restore-card-top">
                        <div className="restore-card-info">
                          {org.logo ? (
                            <img
                              src={org.logo}
                              alt={org.name}
                              className="restore-logo-img"
                            />
                          ) : (
                            <div className="restore-logo-fallback">
                              {org.name[0]?.toUpperCase()}
                            </div>
                          )}
                          <div className="restore-card-titles">
                            <h3 className="restore-card-name" title={org.name}>
                              {org.name}
                            </h3>
                            <span className="restore-card-slug">
                              /{org.slug}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="restore-action-btn"
                          onClick={() => restoreMutation.mutate(org._id)}
                          disabled={restoreMutation.isPending}
                        >
                          {isRestoring ? (
                            <ButtonSpinner label="Restoring..." />
                          ) : (
                            <>
                              <RotateCcw size={14} />
                              <span>Restore</span>
                            </>
                          )}
                        </button>
                      </div>

                      {org.description && (
                        <p className="restore-card-desc">{org.description}</p>
                      )}
                    </div>

                    <div className="restore-card-footer">
                      <span className="restore-badge">In Trash</span>
                      {deletedDate && <span>Deleted: {deletedDate}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default RestoreResourcesPage;
