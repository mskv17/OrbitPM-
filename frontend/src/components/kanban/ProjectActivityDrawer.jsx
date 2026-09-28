import { useQuery } from "@tanstack/react-query";
import { Activity, Clock, X } from "lucide-react";
import { get } from "../../services/api/api";
import Spinner from "../Spinner";
import { getInitials } from "../../utils/getInitials";

export function ProjectActivityDrawer({ isOpen, onClose, projectId }) {
  const { data, isLoading } = useQuery({
    queryKey: ["project-activities", projectId],
    queryFn: () => get(`/activities?projectId=${projectId}`),
    enabled: Boolean(projectId && isOpen),
    refetchInterval: isOpen ? 10000 : false,
  });

  const activities = data?.data || [];

  if (!isOpen) return null;

  return (
    <div className="activity-drawer-overlay" onClick={onClose}>
      <div className="activity-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="activity-drawer-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Activity size={18} color="#2563eb" />
            <h3 style={{ fontSize: "1.05rem", fontWeight: "700", margin: 0, color: "#0f172a" }}>
              Project Activity
            </h3>
          </div>
          <button
            type="button"
            className="member-tile-menu-btn"
            onClick={onClose}
            aria-label="Close activity drawer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="activity-drawer-body">
          {isLoading ? (
            <Spinner label="Loading project activity..." fullScreen={false} />
          ) : activities.length > 0 ? (
            activities.map((act) => {
              const u = typeof act.user === "object" ? act.user : {};
              const userName = u.name || "Member";

              return (
                <div key={act._id} className="activity-item">
                  {u.avathar ? (
                    <img
                      src={u.avathar}
                      alt=""
                      style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }}
                    />
                  ) : (
                    <span
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: "#e2e8f0",
                        color: "#334155",
                        fontSize: "11px",
                        fontWeight: "700",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {getInitials(userName)}
                    </span>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <div style={{ color: "#1e293b", lineHeight: "1.35" }}>
                      <strong style={{ color: "#0f172a" }}>{userName}</strong>{" "}
                      <span>{act.details}</span>
                    </div>
                    <span className="activity-item-time" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={11} />
                      <span>{new Date(act.createdAt).toLocaleString()}</span>
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: "center", color: "#94a3b8", padding: "40px 10px" }}>
              No recent activity recorded for this project.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectActivityDrawer;
