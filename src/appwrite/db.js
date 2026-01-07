import { AppwriteException, Databases, Query } from "appwrite";
import { client } from "./client";
import { getMyTeams } from "./auth";
import APPWRITE from "../config/public";
import { getFile } from "./storage";

const databases = new Databases(client);

// General
export async function getCollection(databaseId, collectionId, queries) {
  try {
    return await databases.listDocuments(databaseId, collectionId, queries);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

// Account
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

// Continuity
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
export async function getTimeLogs(includeSub = false) {
  try {
    let queries = [Query.equal("client_id", await getClientId())];
    if (includeSub) {
      queries.push(Query.select(["*", "clientContinuitySubscriptions.*"]));
    }

    const subsRes = await getCollection(
      APPWRITE.databases.continuity.id,
      APPWRITE.databases.continuity.collections.timelogs.id,
      queries
    );

    return subsRes;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function getContinuityTimeInfo() {
  try {
    // Fetch raw data
    const timelogs = await getTimeLogs();
    const subscriptionData = await getContinuityPackageData();

    // Shortcut (geen extra call)
    const packageData =
      subscriptionData?.documents?.[0]?.continuityPackage ?? null;

    let spentHours = 0;
    let spentConsultingHours = 0;

    const logs = timelogs?.documents ?? [];

    for (const log of logs) {
      const hours = parseFloat(log?.hours ?? 0);

      if (log?.isReservedConsultingSessions) {
        spentConsultingHours += hours;
      } else {
        spentHours += hours;
      }
    }

    const totalHours = Number(packageData?.total_hours ?? 0);
    const reservedConsultingHours = Number(
      packageData?.reserved_consulting_hours ?? 0
    );

    const totalFreeHours = totalHours - reservedConsultingHours;
    spentHours - spentConsultingHours;

    return {
      // Raw data (no duplication)
      timelogs,
      subscriptionData,

      // Aggregates
      spentHours,
      spentConsultingHours,

      // Derived totals
      totalHours,
      reservedConsultingHours,
      totalFreeHours,
    };
  } catch (err) {
    console.error(err);
    throw err;
  }
}

// Brand Story
export async function getBrandStoryData() {
  try {
    const clientId = await getClientId();
    if (clientId) {
      const visionRes = await getCollection(
        APPWRITE.databases.brandStory.id,
        APPWRITE.databases.brandStory.collections.vision.id
      );
      const obituaryRes = await getCollection(
        APPWRITE.databases.brandStory.id,
        APPWRITE.databases.brandStory.collections.obituary.id
      );

      return { vision: visionRes, obituary: obituaryRes };
    } else {
      throw { message: "No client ID found." };
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
}

// Brand Essence
export async function getBrandEssenceData() {
  try {
    const clientId = await getClientId();
    if (clientId) {
      const cpRes = await getCollection(
        APPWRITE.databases.brandEssence.id,
        APPWRITE.databases.brandEssence.collections.corePurpose.id
      );
      const osRes = await getCollection(
        APPWRITE.databases.brandEssence.id,
        APPWRITE.databases.brandEssence.collections.onliness.id
      );
      const tlRes = await getCollection(
        APPWRITE.databases.brandEssence.id,
        APPWRITE.databases.brandEssence.brandEssence.trueline.id
      );
      return { corePurpose: cpRes, onliness: osRes, trueline: tlRes };
    } else {
      throw { message: "No client ID found." };
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
}

// Logo System
export async function getLogoSystemData() {
  try {
    const dbRes = await getCollection(
      APPWRITE.databases.logoSystem.id,
      APPWRITE.databases.logoSystem.collections.sets.id,
      [
        Query.equal("client_id", await getClientId()),
        Query.select(["*", "logoVariants.*"]),
        Query.orderAsc("sort_order"),
        // Hoe ook logoVariants te sorteren?
      ]
    );
    return dbRes;
  } catch (err) {
    throw err;
  }
}

// Typography System
export async function getTypographyData() {
  try {
    const res = await getCollection(
      APPWRITE.databases.typographySystem.id,
      APPWRITE.databases.typographySystem.collections.fonts.id,
      [
        Query.equal("client_id", await getClientId()),
        Query.orderAsc("sort_order"),
        Query.select(["*", "fontWeights.*"]),
        Query.select(["*", "typographyRules.*"]),
      ]
    );
    return res;
  } catch (err) {
    throw err;
  }
}
