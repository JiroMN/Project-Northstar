import { Storage } from "appwrite";
import { client } from "./client";

const storage = new Storage(client);

export async function getFile(bucketId, fileId) {
  try {
    return storage.getFile(bucketId, fileId);
  } catch (err) {
    console.log(err);
    throw err;
  }
}
export async function getFilePreview(bucketId, fileId) {
  try {
    return storage.getFilePreview(bucketId, fileId);
  } catch (err) {
    console.log(err);
    throw err;
  }
}
export async function getFileDownload(bucketId, fileId) {
  try {
    return storage.getFileDownload(bucketId, fileId);
  } catch (err) {
    console.log(err);
    throw err;
  }
}
