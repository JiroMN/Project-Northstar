import { Storage } from "appwrite";
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

export async function uploadFile(buckedId, clientId) {
  try {
    const response = storage.createFile(buckedId, clientId);
  } catch (err) {
    console.error(err);
    throw err;
  }
}
