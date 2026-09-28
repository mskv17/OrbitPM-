import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlignLeft,
  Archive,
  CheckSquare,
  FileText,
  MessageSquare,
  Paperclip,
  Plus,
  Send,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Modal from "../ui/Modal";
import Spinner from "../Spinner";
import FormMessage from "../ui/FormMessage";
import ButtonSpinner from "../ui/ButtonSpinner";
import { del, get, patch, post } from "../../services/api/api";
import { useStorageUpload } from "../../hooks/useStorageUpload";
import { getInitials } from "../../utils/getInitials";
import { getSocket, joinCard, leaveCard } from "../../services/socket";

const PRESET_LABEL_COLORS = [
  { color: "#ef4444", name: "Red" },
  { color: "#f97316", name: "Orange" },
  { color: "#eab308", name: "Yellow" },
  { color: "#22c55e", name: "Green" },
  { color: "#06b6d4", name: "Cyan" },
  { color: "#3b82f6", name: "Blue" },
  { color: "#a855f7", name: "Purple" },
  { color: "#ec4899", name: "Pink" },
];

export function CardDetailsModal({
  isOpen,
  onClose,
  cardId,
  orgMembers = [],
  canEdit = true,
  onCardUpdated,
}) {
  const queryClient = useQueryClient();
  const { uploadFile, isUploading } = useStorageUpload();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [newChecklistText, setNewChecklistText] = useState("");
  const [newCommentText, setNewCommentText] = useState("");
  const [newLabelText, setNewLabelText] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(PRESET_LABEL_COLORS[0].color);
  const [isAddingLabel, setIsAddingLabel] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  })();

  // Fetch full card data
  const { data: cardData, isLoading: isCardLoading, refetch: refetchCard } = useQuery({
    queryKey: ["card-details", cardId],
    queryFn: () => get(`/cards/${cardId}`),
    enabled: Boolean(cardId && isOpen),
  });

  // Fetch comments
  const { data: commentsData, refetch: refetchComments } = useQuery({
    queryKey: ["card-comments", cardId],
    queryFn: () => get(`/comments?cardId=${cardId}`),
    enabled: Boolean(cardId && isOpen),
  });

  const card = cardData?.data;
  const comments = commentsData?.data || [];

  const [prevCard, setPrevCard] = useState(null);
  if (card && card !== prevCard) {
    setPrevCard(card);
    setTitle(card.title || "");
    setDescription(card.description || "");
    setPriority(card.priority || "medium");
    setDueDate(card.dueDate ? new Date(card.dueDate).toISOString().split("T")[0] : "");
  }

  // Real-time synchronization for open card details and comments
  useEffect(() => {
    if (!isOpen || !cardId) return;

    const socket = getSocket();
    joinCard(cardId);

    const handleCommentChange = () => {
      refetchComments();
    };

    const handleCardChange = () => {
      refetchCard();
    };

    socket.on("comment:created", handleCommentChange);
    socket.on("comment:updated", handleCommentChange);
    socket.on("comment:deleted", handleCommentChange);
    socket.on("card:checklist-updated", handleCardChange);
    socket.on("card:attachments-updated", handleCardChange);
    socket.on("card:updated", handleCardChange);

    return () => {
      leaveCard(cardId);
      socket.off("comment:created", handleCommentChange);
      socket.off("comment:updated", handleCommentChange);
      socket.off("comment:deleted", handleCommentChange);
      socket.off("card:checklist-updated", handleCardChange);
      socket.off("card:attachments-updated", handleCardChange);
      socket.off("card:updated", handleCardChange);
    };
  }, [isOpen, cardId, refetchCard, refetchComments]);

  // Card update mutation
  const updateCardMutation = useMutation({
    mutationFn: (updates) => patch(`/cards/${cardId}`, updates),
    onSuccess: () => {
      refetchCard();
      queryClient.invalidateQueries({ queryKey: ["project-cards"] });
      onCardUpdated?.();
    },
    onError: (err) => {
      setFeedback({ type: "error", text: err?.message || "Failed to update card." });
    },
  });

  // Checklist mutations
  const addChecklistMutation = useMutation({
    mutationFn: (text) => post(`/cards/${cardId}/checklist`, { text }),
    onSuccess: () => {
      setNewChecklistText("");
      refetchCard();
      queryClient.invalidateQueries({ queryKey: ["project-cards"] });
    },
  });

  const toggleChecklistMutation = useMutation({
    mutationFn: (itemId) => patch(`/cards/${cardId}/checklist/${itemId}`),
    onSuccess: () => {
      refetchCard();
      queryClient.invalidateQueries({ queryKey: ["project-cards"] });
    },
  });

  const deleteChecklistMutation = useMutation({
    mutationFn: (itemId) => del(`/cards/${cardId}/checklist/${itemId}`),
    onSuccess: () => {
      refetchCard();
      queryClient.invalidateQueries({ queryKey: ["project-cards"] });
    },
  });

  // Comment mutations
  const addCommentMutation = useMutation({
    mutationFn: (text) => post(`/comments`, { cardId, text }),
    onSuccess: () => {
      setNewCommentText("");
      refetchComments();
      refetchCard();
      queryClient.invalidateQueries({ queryKey: ["project-cards"] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId) => del(`/comments/${commentId}`),
    onSuccess: () => {
      refetchComments();
      refetchCard();
      queryClient.invalidateQueries({ queryKey: ["project-cards"] });
    },
  });

  // Attachment mutations
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setFeedback({ type: "", text: "" });
      const url = await uploadFile("attachments", file);
      await post(`/cards/${cardId}/attachments`, {
        name: file.name,
        url,
        fileType: file.type,
        size: file.size,
      });
      refetchCard();
      queryClient.invalidateQueries({ queryKey: ["project-cards"] });
    } catch (err) {
      setFeedback({ type: "error", text: err?.message || "Failed to upload file." });
    }
  };

  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId) => del(`/cards/${cardId}/attachments/${attachmentId}`),
    onSuccess: () => {
      refetchCard();
      queryClient.invalidateQueries({ queryKey: ["project-cards"] });
    },
  });

  // Label handlers
  const handleAddLabel = () => {
    if (!newLabelText.trim()) return;
    const existingLabels = card?.labels || [];
    const updated = [...existingLabels, { text: newLabelText.trim(), color: newLabelColor }];
    updateCardMutation.mutate({ labels: updated });
    setNewLabelText("");
    setIsAddingLabel(false);
  };

  const handleRemoveLabel = (labelId) => {
    const updated = (card?.labels || []).filter((l) => l._id !== labelId);
    updateCardMutation.mutate({ labels: updated });
  };

  // Assignee handlers
  const handleToggleAssignee = (userId) => {
    const currentAssigneeIds = (card?.assignees || []).map((a) =>
      typeof a === "object" ? a._id : a
    );
    const exists = currentAssigneeIds.includes(userId);
    const updated = exists
      ? currentAssigneeIds.filter((id) => id !== userId)
      : [...currentAssigneeIds, userId];
    updateCardMutation.mutate({ assignees: updated });
  };

  // Archive & Delete
  const deleteCardMutation = useMutation({
    mutationFn: () => del(`/cards/${cardId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-cards"] });
      onCardUpdated?.();
      onClose();
    },
  });

  const archiveCardMutation = useMutation({
    mutationFn: () => patch(`/cards/${cardId}/archive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-cards"] });
      onCardUpdated?.();
      onClose();
    },
  });

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={card?.title || "Task Details"}>
      {isCardLoading || !card ? (
        <div style={{ padding: "40px 20px" }}>
          <Spinner label="Loading card details..." fullScreen={false} />
        </div>
      ) : (
        <div>
          {feedback.text && (
            <div style={{ marginBottom: "16px" }}>
              <FormMessage type={feedback.type} text={feedback.text} />
            </div>
          )}

          <div className="card-details-layout">
            {/* Left Column: Title, Description, Checklist, Attachments, Comments */}
            <div>
              {/* Editable Title */}
              <div style={{ marginBottom: "16px" }}>
                <input
                  type="text"
                  value={title}
                  disabled={!canEdit}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => {
                    if (title.trim() && title.trim() !== card.title) {
                      updateCardMutation.mutate({ title: title.trim() });
                    }
                  }}
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "800",
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    color: "#0f172a",
                    outline: "none",
                    borderBottom: "2px solid transparent",
                    paddingBottom: "4px",
                  }}
                  onFocus={(e) => (e.target.style.borderBottomColor = "#2563eb")}
                />
              </div>

              {/* Description */}
              <div className="card-details-section">
                <div className="card-details-section-title">
                  <AlignLeft size={15} />
                  <span>Description</span>
                </div>
                <textarea
                  rows={3}
                  disabled={!canEdit}
                  placeholder="Add a detailed description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => {
                    if (description !== (card.description || "")) {
                      updateCardMutation.mutate({ description });
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.88rem",
                    resize: "vertical",
                    fontFamily: "inherit",
                    background: "#f8fafc",
                  }}
                />
              </div>

              {/* Checklist Section */}
              <div className="card-details-section">
                <div className="card-details-section-title">
                  <CheckSquare size={15} />
                  <span>
                    Checklist (
                    {(card.checklist || []).filter((i) => i.isCompleted).length}/
                    {(card.checklist || []).length})
                  </span>
                </div>

                {/* Progress bar */}
                {(card.checklist || []).length > 0 && (
                  <div
                    style={{
                      height: "6px",
                      background: "#e2e8f0",
                      borderRadius: "999px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        background: "#16a34a",
                        width: `${
                          ((card.checklist || []).filter((i) => i.isCompleted).length /
                            (card.checklist || []).length) *
                          100
                        }%`,
                        transition: "width 0.2s ease",
                      }}
                    />
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {(card.checklist || []).map((item) => (
                    <div
                      key={item._id}
                      className={`card-checklist-item ${item.isCompleted ? "is-done" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={item.isCompleted}
                        disabled={!canEdit}
                        onChange={() => toggleChecklistMutation.mutate(item._id)}
                        style={{ cursor: "pointer", width: "16px", height: "16px" }}
                      />
                      <span style={{ flex: 1, fontSize: "0.88rem" }}>{item.text}</span>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => deleteChecklistMutation.mutate(item._id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#94a3b8",
                            cursor: "pointer",
                          }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {canEdit && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (newChecklistText.trim()) {
                        addChecklistMutation.mutate(newChecklistText.trim());
                      }
                    }}
                    style={{ display: "flex", gap: "8px", marginTop: "4px" }}
                  >
                    <input
                      type="text"
                      placeholder="Add an item..."
                      value={newChecklistText}
                      onChange={(e) => setNewChecklistText(e.target.value)}
                      style={{
                        flex: 1,
                        padding: "6px 10px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.85rem",
                      }}
                    />
                    <button
                      type="submit"
                      className="org-btn org-btn--primary"
                      disabled={!newChecklistText.trim()}
                      style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                    >
                      Add
                    </button>
                  </form>
                )}
              </div>

              {/* Attachments Section */}
              <div className="card-details-section">
                <div className="card-details-section-title">
                  <Paperclip size={15} />
                  <span>Attachments ({(card.attachments || []).length})</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {(card.attachments || []).map((att) => (
                    <div
                      key={att._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        background: "#f8fafc",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        fontSize: "0.85rem",
                      }}
                    >
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          color: "#2563eb",
                          textDecoration: "none",
                          fontWeight: "600",
                        }}
                      >
                        <FileText size={15} />
                        <span>{att.name}</span>
                      </a>

                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => deleteAttachmentMutation.mutate(att._id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {canEdit && (
                  <label
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 14px",
                      borderRadius: "8px",
                      border: "1px dashed #cbd5e1",
                      cursor: isUploading ? "not-allowed" : "pointer",
                      fontSize: "0.82rem",
                      fontWeight: "600",
                      color: "#475569",
                      marginTop: "6px",
                      width: "fit-content",
                    }}
                  >
                    {isUploading ? (
                      <ButtonSpinner label="Uploading..." />
                    ) : (
                      <>
                        <Upload size={14} />
                        <span>Upload File (PDF or Image)</span>
                      </>
                    )}
                    <input
                      type="file"
                      style={{ display: "none" }}
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                  </label>
                )}
              </div>

              {/* Comments Section */}
              <div className="card-details-section">
                <div className="card-details-section-title">
                  <MessageSquare size={15} />
                  <span>Discussion ({comments.length})</span>
                </div>

                {/* New Comment Input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newCommentText.trim()) {
                      addCommentMutation.mutate(newCommentText.trim());
                    }
                  }}
                  style={{ display: "flex", gap: "8px", marginBottom: "16px" }}
                >
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.85rem",
                    }}
                  />
                  <button
                    type="submit"
                    className="org-btn org-btn--primary"
                    disabled={!newCommentText.trim()}
                    style={{ padding: "8px 14px", fontSize: "0.8rem", gap: "4px" }}
                  >
                    <Send size={13} />
                    <span>Send</span>
                  </button>
                </form>

                {/* Comments List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {comments.map((comment) => {
                    const author = typeof comment.user === "object" ? comment.user : {};
                    const isSelf = String(author._id) === String(currentUser._id);

                    return (
                      <div key={comment._id} className="card-comment-box">
                        <div className="card-comment-header">
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {author.avathar ? (
                              <img
                                src={author.avathar}
                                alt=""
                                style={{ width: "20px", height: "20px", borderRadius: "50%" }}
                              />
                            ) : (
                              <span
                                style={{
                                  width: "20px",
                                  height: "20px",
                                  borderRadius: "50%",
                                  background: "#e2e8f0",
                                  fontSize: "9px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                {getInitials(author.name || "User")}
                              </span>
                            )}
                            <span className="card-comment-author">{author.name || "Member"}</span>
                            <span className="card-comment-time">
                              {new Date(comment.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          {(isSelf || canEdit) && (
                            <button
                              type="button"
                              onClick={() => deleteCommentMutation.mutate(comment._id)}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "#94a3b8",
                                cursor: "pointer",
                              }}
                              title="Delete comment"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>

                        <p className="card-comment-text">{comment.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Meta details & controls */}
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Priority */}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                  PRIORITY
                </label>
                <select
                  disabled={!canEdit}
                  value={priority}
                  onChange={(e) => {
                    setPriority(e.target.value);
                    updateCardMutation.mutate({ priority: e.target.value });
                  }}
                  className="kanban-board-select"
                  style={{ width: "100%" }}
                >
                  <option value="low">🟢 Low</option>
                  <option value="medium">🔵 Medium</option>
                  <option value="high">🟡 High</option>
                  <option value="urgent">🔴 Urgent</option>
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                  DUE DATE
                </label>
                <input
                  type="date"
                  disabled={!canEdit}
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    updateCardMutation.mutate({ dueDate: e.target.value || null });
                  }}
                  className="kanban-board-select"
                  style={{ width: "100%" }}
                />
              </div>

              {/* Labels */}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                  LABELS
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                  {(card.labels || []).map((label) => (
                    <span
                      key={label._id}
                      className="kanban-label-pill"
                      style={{
                        backgroundColor: label.color || "#3b82f6",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "3px 8px",
                      }}
                    >
                      <span>{label.text}</span>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLabel(label._id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#ffffff",
                            cursor: "pointer",
                            padding: 0,
                            lineHeight: 1,
                          }}
                        >
                          <X size={10} />
                        </button>
                      )}
                    </span>
                  ))}
                </div>

                {canEdit && (
                  <>
                    {isAddingLabel ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", background: "#f8fafc", padding: "8px", borderRadius: "8px" }}>
                        <input
                          type="text"
                          placeholder="Label name..."
                          value={newLabelText}
                          onChange={(e) => setNewLabelText(e.target.value)}
                          style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                        />
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {PRESET_LABEL_COLORS.map((c) => (
                            <button
                              key={c.color}
                              type="button"
                              onClick={() => setNewLabelColor(c.color)}
                              style={{
                                width: "18px",
                                height: "18px",
                                borderRadius: "4px",
                                background: c.color,
                                border: newLabelColor === c.color ? "2px solid #0f172a" : "none",
                                cursor: "pointer",
                              }}
                            />
                          ))}
                        </div>
                        <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                          <button
                            type="button"
                            className="org-btn org-btn--primary"
                            style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                            onClick={handleAddLabel}
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            className="org-btn org-btn--secondary"
                            style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                            onClick={() => setIsAddingLabel(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="org-btn org-btn--secondary"
                        style={{ fontSize: "0.8rem", padding: "4px 8px", width: "100%", justifyContent: "center" }}
                        onClick={() => setIsAddingLabel(true)}
                      >
                        <Plus size={13} />
                        <span>Add Label</span>
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Assignees */}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                  ASSIGNEES
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "160px", overflowY: "auto" }}>
                  {orgMembers.map((member) => {
                    const u = typeof member.user === "object" ? member.user : {};
                    const uid = u._id || member.user;
                    const isAssigned = (card.assignees || []).some(
                      (a) => (typeof a === "object" ? a._id : a) === uid
                    );

                    return (
                      <div
                        key={member._id}
                        onClick={() => canEdit && handleToggleAssignee(uid)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "5px 8px",
                          borderRadius: "6px",
                          cursor: canEdit ? "pointer" : "default",
                          background: isAssigned ? "#eff6ff" : "transparent",
                          fontSize: "0.82rem",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          readOnly
                          style={{ pointerEvents: "none" }}
                        />
                        <span>{u.name || "Member"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions Divider */}
              <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "8px 0" }} />

              {/* Archive / Delete Card */}
              {canEdit && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <button
                    type="button"
                    className="org-btn org-btn--secondary"
                    style={{ justifyContent: "center", fontSize: "0.82rem" }}
                    onClick={() => archiveCardMutation.mutate()}
                  >
                    <Archive size={14} />
                    <span>{card.isArchived ? "Restore Card" : "Archive Card"}</span>
                  </button>

                  <button
                    type="button"
                    className="org-btn org-btn--danger"
                    style={{ justifyContent: "center", fontSize: "0.82rem" }}
                    onClick={() => {
                      if (window.confirm(`Delete card "${card.title}"?`)) {
                        deleteCardMutation.mutate();
                      }
                    }}
                  >
                    <Trash2 size={14} />
                    <span>Delete Card</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default CardDetailsModal;
