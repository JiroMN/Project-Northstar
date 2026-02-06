import { ID, Storage } from "appwrite";
import { client } from "./client";

const storage = new Storage(client);

export async function getFile(bucketId, fileId) {
  try {
    return storage.getFile(bucketId, fileId);
  } catch (err) {
    console.error(err);
    throw err;
  }
}
export async function getFilePreview(bucketId, fileId, width) {
  try {
    if (!width) {
      return storage.getFilePreview(bucketId, fileId);
    }

    return storage.getFilePreview(bucketId, fileId, width);
  } catch (err) {
    console.error(err);
    throw err;
  }
}
export async function getFileDownload(bucketId, fileId) {
  try {
    return storage.getFileDownload(bucketId, fileId);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function uploadFile(
  bucketId,
  file,
  permissions = [],
  onProgress = undefined,
) {
  try {
    // Accept File | FileList | File[]
    const resolvedFile = Array.isArray(file) ? file[0] : (file?.[0] ?? file);

    if (!resolvedFile) {
      throw new Error("uploadFile: missing file");
    }

    const response = await storage.createFile({
      bucketId,
      fileId: ID.unique(),
      file: resolvedFile,
      permissions,
      // Appwrite Web SDK supports a progress callback; it updates in ~5MB steps for chunked uploads.
      onProgress,
    });

    return response;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function removeFile(buckedId, fileId) {
  try {
    return storage.deleteFile(buckedId, fileId);
  } catch (err) {
    console.error(err);
    throw err;
  }
}
