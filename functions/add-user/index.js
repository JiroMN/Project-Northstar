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
    const clientId = req.bodyJson.clientId;
    const userData = req.bodyJson.userData;

    return res.json({
      ok: true,
      clientId,
      userData,
    });

    // const newAuthUser = await users.create({
    //   userId: ID.unique(),
    //   email: userData.email,
    //   name: userData.name,
    // });

    // const newDatabaseUser = await databases.createDocument({
    //   databaseId: "6943e20e0018e70785f8",
    //   collectionId: "users",
    //   documentId: ID.unique(),
    //   data: {
    //     user_id: newAuthUser.$id,
    //     email: newAuthUser.email,
    //     name: newAuthUser.name,
    //     client: clientId,
    //   },
    // });

    // return res.json({
    //   ok: true,
    //   newAuthUser,
    //   newDatabaseUser,
    // });
  } catch (error) {
    log("Appwrite error:", error.message);

    return res.json({
      ok: false,
      error: error.message,
    });
  }
};
