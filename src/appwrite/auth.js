import { Query } from "appwrite";
import { account, teams } from "./client";
import { CONFIG, APPWRITE } from "../config/public";
import { getCollection, getContinuityPackageData } from "./db";
import { renderToast } from "../ui/toast";
import { getErrorMessage } from "../utils/helpers";

export async function checkAuth() {
  try {
    const response = await account.get();
    if (response) {
      // renderToast(
      //   "Logged In!",
      //   "Welcome to TheBrand.Book",
      //   "announcement",
      //   1500
      // );
      return response;
    }
  } catch (err) {
    if (!window.location.href.startsWith(`${CONFIG.baseUrl}/login`)) {
      renderToast("Geen account gevonden", getErrorMessage(err), "negative");
      window.location.href = `${CONFIG.baseUrl}/login`;
    }
    return false;
  }
}

export async function checkContinuityAccess(
  redirectToDashboard = false,
  toast = false,
  withData = false,
) {
  try {
    await account.get();

    const data = await getContinuityPackageData();
    const status = data?.stripe?.status ?? null;
    const hasSubscription = Boolean(status);
    const accessAllowedStatuses = ["active", "trialing", "past_due"];
    const hasAccess = accessAllowedStatuses.includes(status);

    console.log(data);

    if (!hasAccess) {
      if (toast) {
        renderToast(
          "Geen Toegang!",
          hasSubscription
            ? `Continuity status: ${status}.`
            : "Continuity is niet actief voor dit account.",
          "announcement",
          3000,
        );
      }
      if (redirectToDashboard) {
        window.location.href = `${CONFIG.baseUrl}/?toast_title=Geen toegang!&toast_message=Continuity is niet actief voor dit account.&toast_variant=announcement`;
      }
    }

    if (withData) {
      return {
        ...data,
        status,
        hasSubscription,
        hasAccess,
      };
    } else {
      return hasAccess;
    }
  } catch (err) {
    if (toast) {
      renderToast("Geen toegang", getErrorMessage(err), "negative");
    }
    // Keep login redirect for auth/session failures only.
    if (err?.code === 401 || err?.code === 403 || err?.type?.includes("auth")) {
      window.location.href = `${CONFIG.baseUrl}/login?toast_title=Er is iets mis gegaan!&toast_message=${getErrorMessage(err)}&toast_variant=announcement`;
    }
    return false;
  }
}

export async function requestMagicUrlToken(email) {
  try {
    const dbResponse = await getCollection(
      APPWRITE.databases.accounts.id,
      APPWRITE.databases.accounts.collections.users.id,
      [Query.equal("email", email)],
    );
    if (dbResponse.documents.length > 0) {
      return await account.createMagicURLToken(
        dbResponse.documents[0].user_id,
        email,
        `${CONFIG.baseUrl}/login/activate`,
      );
    } else {
      throw {
        code: 401,
      };
    }
  } catch (err) {
    throw err;
  }
}
export async function logOut() {
  try {
    if (await account.deleteSessions()) {
      return true;
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function getMyTeams() {
  try {
    const me = await account.get();

    const response = await teams.list();
    return { me, team: response.teams };
  } catch (err) {
    console.error(err);
    throw err;
  }
}
