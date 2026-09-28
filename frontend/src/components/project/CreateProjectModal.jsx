import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FolderGit2 } from "lucide-react";
import Modal from "../ui/Modal";
import FormMessage from "../ui/FormMessage";
import ButtonSpinner from "../ui/ButtonSpinner";
import { patch, post } from "../../services/api/api";

export function CreateProjectModal({
  isOpen,
  onClose,
  organizationId,
  project = null,
  onSuccess,
}) {
  const queryClient = useQueryClient();
  const isEditMode = Boolean(project?._id);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  useEffect(() => {
    if (isOpen) {
      setName(project?.name || "");
      setDescription(project?.description || "");
      setStatus(project?.status || "active");
      setFeedback({ type: "", text: "" });
    }
  }, [isOpen, project]);

  const projectMutation = useMutation({
    mutationFn: async () => {
      if (isEditMode) {
        return await patch(`/projects/${project._id}`, {
          name: name.trim(),
          description: description.trim(),
          status,
        });
      } else {
        return await post("/projects", {
          name: name.trim(),
          description: description.trim(),
          organizationId,
        });
      }
    },
    onSuccess: (resData) => {
      queryClient.invalidateQueries({
        queryKey: ["organization-projects", organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["dashboard-projects"],
      });
      queryClient.invalidateQueries({
        queryKey: ["recent-projects"],
      });
      setFeedback({
        type: "success",
        text: resData?.message || (isEditMode ? "Project updated successfully!" : "Project created successfully!"),
      });
      onSuccess?.(resData?.data);
      setTimeout(() => {
        onClose();
      }, 800);
    },
    onError: (err) => {
      setFeedback({
        type: "error",
        text: err?.message || "Failed to save project.",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setFeedback({ type: "error", text: "Project name is required." });
      return;
    }
    projectMutation.mutate();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? "Edit Project" : "Create New Project"}
    >
      <div style={{ padding: "8px 0" }}>
        {feedback.text && (
          <div style={{ marginBottom: "16px" }}>
            <FormMessage type={feedback.type} text={feedback.text} />
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label
              htmlFor="project-name"
              style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "var(--text-primary, #0f172a)" }}
            >
              Project Name <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              id="project-name"
              type="text"
              className="invite-email-input"
              style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-color, #e2e8f0)", fontSize: "14px" }}
              placeholder="e.g. Website Redesign, Mobile App v2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={projectMutation.isPending}
              maxLength={100}
            />
          </div>

          <div>
            <label
              htmlFor="project-description"
              style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "var(--text-primary, #0f172a)" }}
            >
              Description
            </label>
            <textarea
              id="project-description"
              rows={3}
              style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-color, #e2e8f0)", fontSize: "14px", resize: "vertical", fontFamily: "inherit" }}
              placeholder="Brief overview of goals, scope, and deliverables..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={projectMutation.isPending}
              maxLength={500}
            />
          </div>

          {isEditMode && (
            <div>
              <label
                htmlFor="project-status"
                style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "var(--text-primary, #0f172a)" }}
              >
                Status
              </label>
              <select
                id="project-status"
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-color, #e2e8f0)", fontSize: "14px" }}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={projectMutation.isPending}
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
            <button
              type="button"
              className="org-btn org-btn--secondary"
              onClick={onClose}
              disabled={projectMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="org-btn org-btn--primary"
              disabled={projectMutation.isPending || !name.trim()}
            >
              {projectMutation.isPending ? (
                <ButtonSpinner />
              ) : (
                <>
                  <FolderGit2 size={16} />
                  <span>{isEditMode ? "Save Changes" : "Create Project"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export default CreateProjectModal;
