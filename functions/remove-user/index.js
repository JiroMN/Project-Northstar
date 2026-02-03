import { ID, Client, Databases, Teams, Users } from "node-appwrite";

const sdkClient = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const teams = new Teams(sdkClient);
const databases = new Databases(sdkClient);
const users = new Users(sdkClient);

export default async ({ req, res, log }) => {
  try {
    const userDocId = req.bodyJson.userDocId;
    log(userDocId);

    // Fetch clientdata
    const clientData = await databases.getDocument({
      databaseId: "6943e20e0018e70785f8",
      collectionId: "users",
      documentId: userDocId,
    });
    log(`Fetched clientData`);

    // Remove from auth
    const removeAuthUser = await users.delete({ userId: clientData.user_id });
    log(`Removed auth user (204 expected)`);

    // Remove from database
    const removeDatabaseUser = await databases.deleteDocument({
      databaseId: "6943e20e0018e70785f8",
      collectionId: "users",
      documentId: userDocId,
    });
    log(`Removed db user (204 expected)`);

    return res.json({
      ok: true,
    });
  } catch (error) {
    log(`Appwrite error: ${error?.message ?? String(error)}`);
    log(
      `Appwrite error (raw): ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`,
    );

    return res.json({
      ok: false,
      error: `[Appwrite function error] ${error.message}`,
    });
  }
};
