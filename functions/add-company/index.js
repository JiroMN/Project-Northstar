import { Client, Teams } from "node-appwrite";

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const teams = new Teams(client);

export default async ({ req, res, log }) => {
  try {
    const session = req.bodyJson.session;
    const teamName = req.bodyJson.teamName;

    log(session, teamName);

    return res.json({
      ok: true,
    });
  } catch (error) {
    log("Appwrite error:", error.message);

    return res.json({
      ok: false,
      error: error.message,
    });
  }
};
