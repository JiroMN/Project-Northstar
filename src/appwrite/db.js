import { Databases, ID, Query } from "appwrite";
import { client } from "./client";
import { getSubscriptionFromStripe } from "./functions";
import { getMyTeams } from "./auth";
import APPWRITE from "../config/public";
import { getFile, getFileDownload, getFilePreview } from "./storage";
import { isBetweenDates } from "../utils/helpers";
import { pickContextTeam } from "../utils/databaseHelpers";

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

export async function createDocument({
  databaseId,
  collectionId,
  data,
  permissions,
}) {
  try {
    return await databases.createDocument({
      databaseId: databaseId,
      collectionId: collectionId,
      documentId: ID.unique(),
      data: data,
      permissions: permissions,
    });
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function updateDocument({
  databaseId,
  collectionId,
  documentId,
  data,
}) {
  try {
    return await databases.updateDocument({
      databaseId: databaseId,
      collectionId: collectionId,
      documentId: documentId,
      data: data,
    });
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function removeRow(databaseId, collectionId, rowId) {
  try {
    return await databases.deleteDocument(databaseId, collectionId, rowId);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

// Resources
export async function gatherGoogleDriveURL() {
  try {
    const clientId = await getClientId();
    const resources = await getCollection(
      APPWRITE.databases.general.id,
      APPWRITE.databases.general.collections.resources.id,
      [Query.equal("client_id", clientId)],
    );
    return resources.documents[0].googledrive_url;
    // TODO: Navigating to specific folder
  } catch (err) {
    throw err;
  }
}

// Account
export async function getClientData() {
  try {
    const myTeamRes = await getMyTeams();
    const contextTeam = pickContextTeam(myTeamRes.team);
    const teamId = contextTeam?.$id;
    if (myTeamRes.team.length > 0) {
      const clientTableResponse = await getCollection(
        APPWRITE.databases.accounts.id,
        APPWRITE.databases.accounts.collections.clients.id,
        [Query.equal("team_id", teamId)],
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
    const contextTeam = pickContextTeam(myTeamRes.team);
    const teamId = contextTeam?.$id;
    if (myTeamRes.team.length > 0) {
      const clientTableResponse = await getCollection(
        APPWRITE.databases.accounts.id,
        APPWRITE.databases.accounts.collections.clients.id,
        [Query.equal("team_id", teamId)],
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

export async function getClientById(clientId) {
  try {
    const myTeams = await getMyTeams();

    const res = await getCollection(
      APPWRITE.databases.accounts.id,
      APPWRITE.databases.accounts.collections.clients.id,
      [Query.equal("$id", clientId)],
    );

    const filteredTeam = $(myTeams.team).filter((__, team) => {
      return team.$id === res.documents[0].team_id;
    });

    return { auth: filteredTeam[0], database: res.documents[0] };
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function getAllClients() {
  try {
    const myTeams = await getMyTeams();
    const teamIds = myTeams.team.map((t) => t.$id);

    const res = await getCollection(
      APPWRITE.databases.accounts.id,
      APPWRITE.databases.accounts.collections.clients.id,
      [Query.equal("team_id", teamIds)],
    );

    return { auth: myTeams.team, database: res.documents };
  } catch (err) {
    console.error(err);
    throw err;
  }
}

// Continuity
export async function getContinuityPackageData() {
  try {
    const clientData = await getClientData();
    const stripeCustomerId = clientData?.client?.documents?.[0]?.stripe_customer_id;
    if (!stripeCustomerId) {
      throw { message: "No stripe_customer_id found for this client." };
    }

    const stripeResponse = await getSubscriptionFromStripe(stripeCustomerId);
    if (!stripeResponse?.ok) {
      throw { message: stripeResponse?.error ?? "Failed to fetch subscription." };
    }
    if (!stripeResponse?.subscription) {
      throw { message: "No Stripe subscription found for this customer." };
    }

    const stripeSubscription = stripeResponse.subscription;
    const product = stripeSubscription?.product ?? {};
    const metadata = product?.metadata ?? {};

    const packageData = {
      name: product?.name ?? "",
      description: product?.description ?? "",
      stripe_product_id: product?.id ?? "",
      total_hours: Number(metadata.total_hours ?? 0),
      reserved_consulting_hours: Number(
        metadata.reserved_consulting_hours ?? 0,
      ),
    };

    return { stripe: stripeSubscription, package: packageData };
  } catch (err) {
    console.error(err);
    throw err;
  }
}
export async function getTimeLogs() {
  try {
    const queries = [
      Query.equal("client_id", await getClientId()),
      Query.limit(9999),
    ];

    const subsRes = await getCollection(
      APPWRITE.databases.continuity.id,
      APPWRITE.databases.continuity.collections.timelogs.id,
      queries,
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
    const continuityPackageRes = await getContinuityPackageData();
    const subscriptionStripeRes = continuityPackageRes.stripe;

    const packageData = continuityPackageRes.package ?? null;

    let spentHours = 0;
    let spentConsultingHours = 0;

    const logs = timelogs?.documents ?? [];

    for (const log of logs) {
      const hours = parseFloat(log?.hours ?? 0);
      if (
        isBetweenDates(
          log?.date,
          subscriptionStripeRes?.currentPeriodStart,
          subscriptionStripeRes?.currentPeriodEnd,
        )
      ) {
        if (log?.isReservedConsultingSessions) {
          spentConsultingHours += hours;
        } else {
          spentHours += hours;
        }
      }
    }

    const totalHours = Number(packageData?.total_hours ?? 0);
    const reservedConsultingHours = Number(
      packageData?.reserved_consulting_hours ?? 0,
    );

    const totalFreeHours = totalHours - reservedConsultingHours;
    spentHours - spentConsultingHours;

    return {
      // Raw data (no duplication)
      timelogs,
      continuityPackageRes,

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
        APPWRITE.databases.brandStory.collections.vision.id,
      );
      const obituaryRes = await getCollection(
        APPWRITE.databases.brandStory.id,
        APPWRITE.databases.brandStory.collections.obituary.id,
      );
      const obituaryAudio = await getFileDownload(
        APPWRITE.buckets.obituary.id,
        obituaryRes.documents[0].attachment_id,
      );

      const visionPreviewRes = {
        high: await getFilePreview(
          APPWRITE.buckets.vision.id,
          visionRes.documents[0].attachment_id,
          800,
        ),
        mid: await getFilePreview(
          APPWRITE.buckets.vision.id,
          visionRes.documents[0].attachment_id,
          400,
        ),
        low: await getFilePreview(
          APPWRITE.buckets.vision.id,
          visionRes.documents[0].attachment_id,
          100,
        ),
      };

      return {
        vision: {
          document: visionRes.documents[0],
          files: {
            low: visionPreviewRes.low,
            mid: visionPreviewRes.mid,
            high: visionPreviewRes.high,
          },
        },
        obituary: { document: obituaryRes.documents[0], file: obituaryAudio },
      };
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
        APPWRITE.databases.brandEssence.collections.corePurpose.id,
        [Query.equal("client_id", await getClientId())],
      );
      const osRes = await getCollection(
        APPWRITE.databases.brandEssence.id,
        APPWRITE.databases.brandEssence.collections.onliness.id,
        [Query.equal("client_id", await getClientId())],
      );
      const tlRes = await getCollection(
        APPWRITE.databases.brandEssence.id,
        APPWRITE.databases.brandEssence.collections.trueline.id,
        [Query.equal("client_id", await getClientId())],
      );
      return {
        corePurpose: cpRes.documents[0],
        onliness: osRes.documents[0],
        trueline: tlRes.documents[0],
      };
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
      ],
    );
    return dbRes;
  } catch (err) {
    throw err;
  }
}

// Typography System
export async function getTypographyFontData() {
  try {
    const res = await getCollection(
      APPWRITE.databases.typographySystem.id,
      APPWRITE.databases.typographySystem.collections.fonts.id,
      [
        Query.equal("client_id", await getClientId()),
        Query.orderAsc("sort_order"),
        Query.select(["*", "fontWeights.*"]),
        Query.select(["*", "typographyRules.*"]),
      ],
    );
    return res;
  } catch (err) {
    throw err;
  }
}

export async function getTypographyScaleData() {
  try {
    const res = await getCollection(
      APPWRITE.databases.typographySystem.id,
      APPWRITE.databases.typographySystem.collections.clientTypographyScale.id,
      [
        Query.equal("client_id", await getClientId()),
        Query.select(["*", "typographyScale.*"]),
      ],
    );
    return res;
  } catch (err) {
    throw err;
  }
}

// Typography Communication
export async function getTypographyCommuncationData() {
  try {
    const examplesRes = await getCollection(
      APPWRITE.databases.toneOfVoice.id,
      APPWRITE.databases.toneOfVoice.collections.examplesTraits.id,
      [
        // No equal query! Let appwrite row security handle permission based returns
        // Query.equal("client_id", await getClientId()),
        Query.select(["*", "toVExample.*"]),
        Query.select(["*", "toVTraits.*"]),
      ],
    );
    const traitsRes = await getCollection(
      APPWRITE.databases.toneOfVoice.id,
      APPWRITE.databases.toneOfVoice.collections.traits.id,
    );
    return { traits: traitsRes.documents, examples: examplesRes.documents };
  } catch (err) {
    throw err;
  }
}

// Gallery
export async function getGalleryData(albumId, limit = 25, offset = 0) {
  try {
    const queries = [
      Query.equal("client_id", await getClientId()),
      // Include the related album on each gallery item (two-way relationship)
      Query.select(["*", "galleryCategory.*"]),
      Query.limit(limit),
      Query.offset(offset),
      Query.orderAsc("$createdAt"),
    ];

    if (albumId) {
      queries.push(Query.equal("galleryCategory", albumId));
    }

    const itemsRes = await getCollection(
      APPWRITE.databases.gallery.id,
      APPWRITE.databases.gallery.collections.images.id,
      queries,
    );

    const files = await Promise.all(
      (itemsRes.documents ?? []).map(async (item) => {
        const storageRes = await getFile(
          APPWRITE.buckets.gallery.id,
          item.file_id,
        );

        const previewRes = {
          high: await getFilePreview(
            APPWRITE.buckets.gallery.id,
            item.file_id,
            800,
          ),
          mid: await getFilePreview(
            APPWRITE.buckets.gallery.id,
            item.file_id,
            400,
          ),
          low: await getFilePreview(
            APPWRITE.buckets.gallery.id,
            item.file_id,
            100,
          ),
        };

        const downloadRes = await getFileDownload(
          APPWRITE.buckets.gallery.id,
          item.file_id,
        );

        const album = item.galleryCategory;

        return {
          album,
          document: item,
          file: storageRes,
          sources: { previews: previewRes, download: downloadRes },
        };
      }),
    );

    return {
      files,
      total: itemsRes.total,
      limit,
      offset,
    };
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function getGalleryAlbums() {
  try {
    const res = await getCollection(
      APPWRITE.databases.gallery.id,
      APPWRITE.databases.gallery.collections.albums.id,
      [Query.equal("client_id", await getClientId())],
    );
    return res;
  } catch (err) {
    console.error(err);
    throw err;
  }
}
