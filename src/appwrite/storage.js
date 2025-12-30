import { Storage } from "appwrite";
import { client } from "./client";

const storage = new Storage(client);

export async function getFile(bucketId, fileId) {
  try {
    return storage.getFilePreview(bucketId, fileId);
  } catch (err) {
    console.log(err);
    throw err;
  }
}
