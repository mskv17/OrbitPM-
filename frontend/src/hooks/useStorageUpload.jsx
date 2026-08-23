import { useState } from "react";
import { post } from "../services/api/api";

/**
 * Requests a signed storage upload path from backend (/storage/create-path).
 *
 * @param {string} toStore - Storage category (e.g. "avathar").
 * @param {string} fileName - Original file name.
 * @param {string} [extension] - Optional file extension.
 * @returns {Promise<object>} Server response data ({ signedUrl, publicUrl, path, token, bucket }).
 */
export async function getStoragePath(toStore, fileName, extension) {
  if (!toStore || !fileName) {
    throw new Error("Storage destination (toStore) and fileName are required.");
  }

  const ext =
    extension ||
    (typeof fileName === "string" && fileName.includes(".")
      ? fileName.split(".").pop()
      : "");

  return await post("/storage/create-path", {
    toStore,
    fileName,
    extension: ext,
  });
}

/**
 * Uploads a raw File/Blob to a signed storage URL.
 *
 * @param {string} signedUrl - The signed storage upload URL.
 * @param {string} [token] - Optional authorization token.
 * @param {File|Blob} file - The file object to upload.
 * @returns {Promise<Response>} The HTTP upload response.
 */
export async function uploadToSignedUrl(signedUrl, token, file) {
  if (!signedUrl || !file) {
    throw new Error("Signed URL and file are required for upload.");
  }

  const headers = {
    "Content-Type": file.type || "application/octet-stream",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(signedUrl, {
    method: "PUT",
    headers,
    body: file,
  });

  if (!response.ok) {
    let errorMsg = `Upload failed with status ${response.status}`;
    try {
      const errorJson = await response.json();
      errorMsg = errorJson?.message || errorJson?.error || errorMsg;
    } catch {
      const text = await response.text();
      if (text) errorMsg = text;
    }
    throw new Error(errorMsg);
  }

  return response;
}

/**
 * Custom React Hook for storage uploads.
 */
export function useStorageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const uploadFile = async (toStore, file) => {
    if (!file) return null;
    setIsUploading(true);
    setError(null);

    try {
      // 1. Get signed path from server
      const pathRes = await getStoragePath(toStore, file.name);
      const { signedUrl, token, publicUrl } = pathRes?.data || {};

      if (!signedUrl || !publicUrl) {
        throw new Error("Failed to generate storage upload URL.");
      }

      // 2. Upload file binary to signed URL
      await uploadToSignedUrl(signedUrl, token, file);

      setIsUploading(false);
      return publicUrl;
    } catch (err) {
      setIsUploading(false);
      const msg = err?.message || "Storage upload failed.";
      setError(msg);
      throw new Error(msg);
    }
  };

  return {
    getStoragePath,
    uploadToSignedUrl,
    uploadFile,
    isUploading,
    error,
  };
}

export default useStorageUpload;
