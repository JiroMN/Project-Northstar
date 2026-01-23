import { Query } from "appwrite";
import { account, teams } from "./client";
import { CONFIG, APPWRITE } from "../config/public";
import { getCollection, getContinuityPackageData } from "./db";
import { renderToast } from "../ui/toast";
import { getErrorMessage } from "../utils/helpers";
import { getSubscriptionFromStripe } from "./functions";
import { getContainerUtilityClass } from "@mui/joy";

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
      renderToast("No account detected", getErrorMessage(err), "negative");
      window.location.href = `${CONFIG.baseUrl}/login`;
    }
    return false;
  }
}

export async function checkContinuityAccess(
  redirectToDashboard = false,
  toast = false,
) {
  try {
    await account.get();

    const data = await getContinuityPackageData();

    const status = data.stripe.status;

    if (status !== "active") {
      if (toast) {
        renderToast(
          "Geen Toegang!",
          "Continuity is niet actief voor dit account.",
          "announcement",
          3000,
        );
      }
      if (redirectToDashboard) {
        window.location.href = `${CONFIG.baseUrl}/?toast_title=Geen toegang!&toast_message=Continuity is niet actief voor dit account.&toast_variant=announcement`;
      }
      return false;
    }

    return true;
  } catch (err) {
    if (toast) {
      renderToast("Geen toegang", getErrorMessage(err), "negative");
    }
    window.location.href = `${CONFIG.baseUrl}/login`;
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
    throw err;
  }
}
