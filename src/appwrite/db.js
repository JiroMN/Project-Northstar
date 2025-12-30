import { Databases, Query } from "appwrite";
import { client } from "./client";
import { getMyTeams } from "./auth";
import APPWRITE from "../config/public";

const databases = new Databases(client);

export async function getCollection(databaseId, collectionId, queries) {
  try {
    return await databases.listDocuments(databaseId, collectionId, queries);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function getClientData() {
  try {
    const myTeamRes = await getMyTeams();
    if (myTeamRes.team.length > 0) {
      const clientTableResponse = await getCollection(
        APPWRITE.databases.accounts.id,
        APPWRITE.databases.accounts.collections.clients.id,
        [Query.equal("team_id", myTeamRes.team[0].$id)]
      );

      return { client: clientTableResponse, teams: myTeamRes };
    } else {
      throw { message: "No teams assigned to this client." };
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function getClientId() {
  try {
    const myTeamRes = await getMyTeams();
    if (myTeamRes.team.length > 0) {
      const clientTableResponse = await getCollection(
        APPWRITE.databases.accounts.id,
        APPWRITE.databases.accounts.collections.clients.id,
        [Query.equal("team_id", myTeamRes.team[0].$id)]
      );

      return clientTableResponse.documents[0].$id;
    } else {
      throw { message: "No teams assigned to this client." };
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function getContinuityPackageData() {
  try {
    const subsRes = await getCollection(
      APPWRITE.databases.continuity.id,
      APPWRITE.databases.continuity.collections.subscriptions.id,
      [
        Query.equal("client_id", await getClientId()),
        Query.select(["*", "continuityPackage.*"]),
      ]
    );

    return subsRes;
  } catch (err) {
    console.error(err);
    throw err;
  }
}
