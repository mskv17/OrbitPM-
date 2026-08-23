import { getSupabaseClient } from "../config/supabase.js";
import AppError from "../utils/AppError.js";
import Registry from "../utils/Registry.js";
import sendResponse from "../utils/sendResponse.js";

const registry = new Registry("storageController");

function getFileExtension({ fileName, extension }) {
  const value = extension || fileName?.split(".").pop() || "jpg";
  const safeExtension = String(value).toLowerCase().replace(/[^a-z0-9]/g, "");
  return safeExtension || "jpg";
}

async function createSignedUploadPath(path) {
  const supabase = getSupabaseClient();
  const bucketName = process.env.SUPABASE_BUCKET_NAME;
  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUploadUrl(path, { upsert: true });

  if (error) {
    throw new AppError(error.message || "Failed to create upload path", 400);
  }

  const publicUrl = supabase.storage.from(bucketName).getPublicUrl(path);

  return {
    bucket: bucketName,
    path,
    signedUrl: data.signedUrl,
    token: data.token,
    publicUrl: publicUrl.data.publicUrl,
  };
}

registry.register("avathar", async ({ user, body }) => {
  const extension = getFileExtension(body);
  const path = `avathars/${user._id}/profile.${extension}`;
  return createSignedUploadPath(path);
});

export async function createPath(req, res) {
  const { toStore } = req.body;
  if (!toStore) {
    throw new AppError("toStore is required", 400);
  }

  let createStoragePath;
  try {
    createStoragePath = registry.get(toStore);
  } catch {
    throw new AppError("Invalid storage type", 400);
  }

  const data = await createStoragePath({
    user: req.user,
    body: req.body,
  });

  sendResponse(res, 201, "Storage upload path created", data);
}
