import { Client, Databases, ID, Teams } from "node-appwrite";

const sdkClient = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const teams = new Teams(sdkClient);
const databases = new Databases(sdkClient);

export default async ({ req, res, log }) => {
  try {
    const documentData = req.bodyJson.documentData;
    const brandDirector = req.bodyJson.brandDirector;

    const teamName = documentData.name;

    log("Running...");
    log(req.bodyJson);

    // Create team
    const createTeam = await teams.create({
      teamId: ID.unique(),
      name: teamName,
      roles: ["Brand_Director", "Beheerder", "Medewerker"],
    });
    log("Created Team:");
    log(createTeam);

    // Add Brand Director Membership
    const createMembership = await teams.createMembership({
      teamId: createTeam.$id,
      roles: ["Brand_Director"],
      email: brandDirector.email,
      userId: brandDirector.$id,
      name: brandDirector.name,
    });
    log("Created Membership:");
    log(createMembership);

    // Add row to accounts.clients
    const createDocument = await databases.createDocument({
      databaseId: "6943e20e0018e70785f8",
      collectionId: "clients",
      documentId: ID.unique(),
      data: {
        team_id: createTeam.$id,
        ...documentData,
      },
    });
    log("Created Document:");
    log(createDocument);

    // Add Team Permission based on FileId

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
