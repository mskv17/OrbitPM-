import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { get, patch } from "../services/api/api";
import { getSocket, joinUser, leaveUser } from "../services/socket";

export function NotificationBell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Unread Count
  const { data: countData } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: () => get("/notifications/unread-count"),
    refetchInterval: 15000,
  });

  // Notifications List
  const { data: notifData } = useQuery({
    queryKey: ["notifications-list"],
    queryFn: () => get("/notifications"),
    enabled: isOpen,
  });

  const unreadCount = countData?.data?.count || 0;
  const notifications = notifData?.data || [];

  const markReadMutation = useMutation({
    mutationFn: (id) => patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-list"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => patch("/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-list"] });
    },
  });

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Real-time notification updates via Socket.io
  useEffect(() => {
    let userId = null;
    try {
      userId = JSON.parse(localStorage.getItem("user"))?._id;
    } catch {
      userId = null;
    }

    if (!userId) return;

    const socket = getSocket();
    joinUser(userId);

    const handleNewNotification = () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-list"] });
    };

    socket.on("notification:new", handleNewNotification);

    return () => {
      leaveUser(userId);
      socket.off("notification:new", handleNewNotification);
    };
  }, [queryClient]);

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      markReadMutation.mutate(notif._id);
    }
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    } else if (notif.project) {
      navigate(`/project/${notif.project}`);
    }
  };

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          background: "transparent",
          border: "none",
          padding: "8px",
          borderRadius: "8px",
          cursor: "pointer",
          color: "#475569",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "4px",
              right: "4px",
              background: "#ef4444",
              color: "#ffffff",
              fontSize: "10px",
              fontWeight: "700",
              minWidth: "16px",
              height: "16px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "42px",
            width: "320px",
            maxHeight: "420px",
            background: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.12)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: "0.88rem", fontWeight: "700", color: "#0f172a" }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllReadMutation.mutate()}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#2563eb",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <CheckCheck size={12} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: "auto", display: "flex", flexDirection: "column" }}>
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  style={{
                    padding: "10px 16px",
                    borderBottom: "1px solid #f8fafc",
                    cursor: "pointer",
                    background: notif.isRead ? "#ffffff" : "#f0f7ff",
                    transition: "background 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2px" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: notif.isRead ? "600" : "700", color: "#0f172a" }}>
                      {notif.title}
                    </span>
                    {!notif.isRead && (
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "#2563eb",
                        }}
                      />
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "#475569", lineHeight: "1.35" }}>
                    {notif.message}
                  </p>
                  <span style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "4px", display: "block" }}>
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "#94a3b8", fontSize: "0.82rem" }}>
                No notifications right now.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
