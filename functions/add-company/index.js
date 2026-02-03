import {
  Client,
  Databases,
  ID,
  Storage,
  Teams,
  Permission,
} from "node-appwrite";

const sdkClient = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const teams = new Teams(sdkClient);
const databases = new Databases(sdkClient);
const storage = new Storage(sdkClient);

export default async ({ req, res, log }) => {
  try {
    const documentData = req.bodyJson.documentData;
    const brandDirector = req.bodyJson.brandDirector;

    const teamName = documentData.name;

    if (!documentData || !brandDirector)
      return res.json({
        ok: false,
        message: "No document data and/or brand director passed.",
      });

    log("Running...");

    // Create team
    const createTeam = await teams.create({
      teamId: ID.unique(),
      name: teamName,
      roles: ["Brand_Director", "Beheerder", "Medewerker"],
    });
    log("Created Team...");

    // Add Brand Director Membership
    const createMembership = await teams.createMembership({
      teamId: createTeam.$id,
      roles: ["Brand_Director"],
      email: brandDirector.email,
      userId: brandDirector.$id,
      name: brandDirector.name,
    });
    log("Created Membership...");

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
    log("Created Document...");

    // Add Team Permission based on FileId
    const grantedBrandbookPermissions = await storage.updateFile({
      bucketId: "6953c5e200333444aafc",
      fileId: documentData.brandbook_file_id,
      permissions: [
        Permission.read([createTeam.$id]),
        Permission.update([createTeam.$id]),
        Permission.delete([createTeam.$id]),
      ],
    });
    const grantedAvatarPermissions = await storage.updateFile({
      bucketId: "6971ef4b003440c686a1",
      fileId: documentData.avatar_file_id,
      permissions: [
        Permission.read([createTeam.$id]),
        Permission.update([createTeam.$id]),
        Permission.delete([createTeam.$id]),
      ],
    });
    const grantedLogoSystemBackdropPermissions = await storage.updateFile({
      bucketId: "6971ef4b003440c686a1",
      fileId: documentData.logo_system_backdrop_file_id,
      permissions: [
        Permission.read(Role.team(createTeam.$id)),
        Permission.update(Role.team(createTeam.$id)),
        Permission.delete(Role.team(createTeam.$id)),
      ],
    });

    return res.json({
      ok: true,
      team: createTeam,
      documents: createDocument,
      brandDirector: createMembership,
      grantedPermissions: [
        grantedBrandbookPermissions,
        grantedAvatarPermissions,
        grantedLogoSystemBackdropPermissions,
      ],
    });
  } catch (error) {
    log("Appwrite error:", error.message);

    return res.json({
      ok: false,
      error: error.message,
    });
  }
};
