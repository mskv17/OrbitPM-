import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "../ui/Modal";
import { ImageCropperModal } from "../ui/ImageCropperModal";
import FormMessage from "../ui/FormMessage";
import Spinner from "../Spinner";
import { patch } from "../../services/api/api";
import { useStorageUpload } from "../../hooks/useStorageUpload";
import "./css/editProfileModal.css";

export const EditProfileModal = ({ isOpen, onClose, user = {}, onSave }) => {
  const queryClient = useQueryClient();
  const { uploadFile } = useStorageUpload();

  const [name, setName] = useState(user.name || "");
  const [selectedFile, setSelectedFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user.avathar || "");
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  // Interactive 500x500 cropper states
  const [tempRawImageSrc, setTempRawImageSrc] = useState(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  useEffect(() => {
    setName(user.name || "");
    setAvatarPreview(user.avathar || "");
    setSelectedFile(null);
    setTempRawImageSrc(null);
    setIsCropperOpen(false);
    setFeedback({ type: "", text: "" });
  }, [user, isOpen]);

  const updateProfileMutation = useMutation({
    mutationFn: async ({ nameInput, fileToUpload }) => {
      const updates = {};
      const trimmedName = nameInput.trim();

      // 1. If a new cropped 500x500 avatar file was selected, get signed URL & upload to storage
      if (fileToUpload) {
        const publicAvatarUrl = await uploadFile("avathar", fileToUpload);
        if (publicAvatarUrl) {
          updates.avathar = publicAvatarUrl;
        }
      }

      // 2. Add name update if name has changed
      if (trimmedName && trimmedName !== user.name) {
        updates.name = trimmedName;
      }

      // If no changes at all, return early
      if (Object.keys(updates).length === 0) {
        return { message: "No changes detected.", noOp: true };
      }

      // 3. Send direct PATCH request to /auth/profile/update
      const res = await patch("/auth/profile/update", { updates });
      return res;
    },
    onSuccess: (responseData) => {
      if (responseData?.noOp) {
        setFeedback({
          type: "info",
          text: "No changes were made.",
        });
        setTimeout(() => onClose(), 1000);
        return;
      }

      setFeedback({
        type: "success",
        text: responseData?.message || "Profile updated successfully!",
      });

      if (responseData?.data?.user) {
        localStorage.setItem("user", JSON.stringify(responseData.data.user));
        if (onSave) {
          onSave(responseData.data.user);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["auth-me"] });

      setTimeout(() => {
        onClose();
      }, 1200);
    },
    onError: (err) => {
      setFeedback({
        type: "error",
        text: err?.message || "Failed to update profile. Please try again.",
      });
    },
  });

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setFeedback({
          type: "error",
          text: "Image file size should be less than 10MB.",
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
    setSelectedFile(file);
    setAvatarPreview(dataUrl);
    setIsCropperOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFeedback({ type: "", text: "" });

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFeedback({
        type: "error",
        text: "Please enter a valid name.",
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

    updateProfileMutation.mutate({
      nameInput: trimmedName,
      fileToUpload: selectedFile,
    });
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile">
        <form className="edit-profile-form" onSubmit={handleSubmit}>
          {feedback.text && (
            <FormMessage type={feedback.type} text={feedback.text} />
          )}

          {/* Avatar Upload Section */}
          <div className="avatar-upload-group">
            <div className="avatar-preview-container">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar Preview"
                  className="avatar-preview-img"
                />
              ) : (
                <div className="avatar-preview-initials">
                  {name ? name[0]?.toUpperCase() : "U"}
                </div>
              )}
              <label
                htmlFor="avatar-upload-input"
                className="avatar-upload-badge"
                title="Upload & crop avatar photo"
              >
                <svg
                  width="16"
                  height="16"
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
                id="avatar-upload-input"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={updateProfileMutation.isPending}
                style={{ display: "none" }}
              />
            </div>
            <span className="avatar-upload-hint">
              Click camera icon to select and crop a 500x500 profile photo
            </span>
          </div>

          {/* Name Field */}
          <div className="form-group">
            <label htmlFor="edit-profile-name">Full Name</label>
            <input
              type="text"
              id="edit-profile-name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
              disabled={updateProfileMutation.isPending}
              className="profile-input"
            />
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="profile-btn profile-btn--secondary"
              onClick={onClose}
              disabled={updateProfileMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="profile-btn profile-btn--primary"
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? (
                <Spinner label="Saving..." />
              ) : (
                "Save Changes"
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

export default EditProfileModal;
