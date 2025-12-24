import { Databases } from "appwrite";
import { client } from "./client";

const databases = new Databases(client);

export async function getCollection(databaseId, collectionId, queries) {
  try {
    return await databases.listDocuments(databaseId, collectionId, queries);
  } catch (err) {
    console.error(err);
    throw err;
  }
}
