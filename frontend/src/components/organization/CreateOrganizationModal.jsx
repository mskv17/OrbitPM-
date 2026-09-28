import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Modal from "../ui/Modal";
import { ImageCropperModal } from "../ui/ImageCropperModal";
import FormMessage from "../ui/FormMessage";
import ButtonSpinner from "../ui/ButtonSpinner";
import { patch, post } from "../../services/api/api";
import { useStorageUpload } from "../../hooks/useStorageUpload";
import "./css/createOrganizationModal.css";

export const CreateOrganizationModal = ({
  isOpen,
  onClose,
  onSuccess,
  organization = null,
}) => {
  const queryClient = useQueryClient();
  const { uploadFile } = useStorageUpload();

  const isEditMode = Boolean(organization?._id);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  // Interactive 500x500 cropper states
  const [tempRawImageSrc, setTempRawImageSrc] = useState(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  const [prevResetKey, setPrevResetKey] = useState(null);
  const currentResetKey = isOpen ? `${organization?._id || "new"}` : "closed";

  if (currentResetKey !== prevResetKey) {
    setPrevResetKey(currentResetKey);
    if (isOpen) {
      setName(organization?.name || "");
      setDescription(organization?.description || "");
      setLogoPreview(organization?.logo || "");
      setLogoFile(null);
      setTempRawImageSrc(null);
      setIsCropperOpen(false);
      setFeedback({ type: "", text: "" });
    }
  }

  const orgMutation = useMutation({
    mutationFn: async () => {
      let logoUrl = logoPreview;

      if (logoFile) {
        logoUrl = await uploadFile("logo", logoFile);
      }

      if (isEditMode) {
        const payload = {
          description: description.trim(),
          logo: logoUrl || "",
        };
        const res = await patch(`/organizations/${organization._id}`, payload);
        return res;
      } else {
        const payload = {
          name: name.trim(),
          description: description.trim(),
          logo: logoUrl || "",
        };
        const res = await post("/organizations", payload);
        return res;
      }
    },
    onSuccess: (responseData) => {
      setFeedback({
        type: "success",
        text:
          responseData?.message ||
          (isEditMode
            ? "Organization updated successfully!"
            : "Organization created successfully!"),
      });

      queryClient.invalidateQueries({ queryKey: ["user-organizations"] });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["auth-me"] });
      if (organization?.slug) {
        queryClient.invalidateQueries({
          queryKey: ["organization", organization.slug],
        });
      }

      if (onSuccess) {
        onSuccess(responseData?.data);
      }

      setTimeout(() => {
        onClose();
      }, 1000);
    },
    onError: (err) => {
      setFeedback({
        type: "error",
        text:
          err?.message ||
          (isEditMode
            ? "Failed to update organization. Please try again."
            : "Failed to create organization. Please try again."),
      });
    },
  });

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFeedback({
          type: "error",
          text: "Logo file size should be less than 5MB.",
        });
        return;
      }
      setFeedback({ type: "", text: "" });
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempRawImageSrc(reader.result);
        setIsCropperOpen(true);
      };
      reader.readAsDataURL(file);

      // Reset file input value so selecting the same file again triggers onChange
      e.target.value = "";
    }
  };

  const handleCropperComplete = ({ file, dataUrl }) => {
    setLogoFile(file);
    setLogoPreview(dataUrl);
    setIsCropperOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFeedback({ type: "", text: "" });

    if (!isEditMode) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        setFeedback({
          type: "error",
          text: "Please enter an organization name.",
        });
        return;
      }

      if (trimmedName.length < 2 || trimmedName.length > 50) {
        setFeedback({
          type: "error",
          text: "Name must be between 2 and 50 characters.",
        });
        return;
      }
    }

    orgMutation.mutate();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={isEditMode ? "Edit Organization" : "Create Organization"}
      >
        <form className="create-org-form" onSubmit={handleSubmit}>
          {feedback.text && (
            <FormMessage type={feedback.type} text={feedback.text} />
          )}

          {/* Logo Upload Section */}
          <div className="logo-upload-group">
            <div className="logo-preview-container">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo Preview"
                  className="logo-preview-img"
                />
              ) : (
                <div className="logo-preview-placeholder">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                    <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
                    <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
                    <path d="M10 6h4" />
                    <path d="M10 10h4" />
                    <path d="M10 14h4" />
                    <path d="M10 18h4" />
                  </svg>
                  <span>Logo</span>
                </div>
              )}
              <label
                htmlFor="org-logo-upload-input"
                className="logo-upload-badge"
                title="Upload Organization Logo"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </label>
              <input
                id="org-logo-upload-input"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                disabled={orgMutation.isPending}
                style={{ display: "none" }}
              />
            </div>
            <span className="logo-upload-hint">
              Click camera icon to select and crop a 500x500 logo
            </span>
          </div>

          {/* Name Field */}
          <div className="form-group">
            <label htmlFor="org-name-input">
              Organization Name {isEditMode && "(Read-only)"}
            </label>
            <input
              type="text"
              id="org-name-input"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corporation"
              required
              disabled={isEditMode || orgMutation.isPending}
              className="profile-input"
              style={isEditMode ? { opacity: 0.7, cursor: "not-allowed" } : {}}
            />
          </div>

          {/* Description Field */}
          <div className="form-group">
            <label htmlFor="org-description-input">Description (Optional)</label>
            <textarea
              id="org-description-input"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this organization do?"
              rows={3}
              disabled={orgMutation.isPending}
              className="profile-input"
              style={{ resize: "vertical", minHeight: "70px" }}
            />
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="profile-btn profile-btn--secondary"
              onClick={onClose}
              disabled={orgMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="profile-btn profile-btn--primary"
              disabled={orgMutation.isPending}
            >
              {orgMutation.isPending ? (
                <ButtonSpinner
                  label={isEditMode ? "Saving..." : "Creating..."}
                />
              ) : isEditMode ? (
                "Save Changes"
              ) : (
                "Create Organization"
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Interactive 500x500 Image Cropper Modal */}
      <ImageCropperModal
        isOpen={isCropperOpen}
        imageSrc={tempRawImageSrc}
        onClose={() => setIsCropperOpen(false)}
        onCropComplete={handleCropperComplete}
        outputSize={500}
        quality={0.9}
      />
    </>
  );
};

export default CreateOrganizationModal;
