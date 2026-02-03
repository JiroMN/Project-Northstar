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
    const userId = req.bodyJson.userId;
    log(userId);

    // Remove from team

    // Remove form database

    return res.json({
      ok: true,
      userId,
    });
  } catch (error) {
    log("Appwrite error:", error.message);

    return res.json({
      ok: false,
      error: `[Appwrite function error] ${error.message}`,
    });
  }
};
