import { Query } from "appwrite";
import { account } from "./client";
import { CONFIG, APPWRITE } from "../config/public";
import { getCollection } from "./db";
import { renderToast } from "../ui/toast";
import { getErrorMessage } from "../utils/helpers";

export async function checkAuth() {
  try {
    const response = await account.get();
    if (response) {
      renderToast("Logged In!", "Welcome to TheBrand.Book", "positive");
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

export async function requestMagicUrlToken(email) {
  try {
    const dbResponse = await getCollection(
      APPWRITE.databases.accounts.id,
      APPWRITE.databases.accounts.collections.users.id,
      [Query.equal("email", email)]
    );
    if (dbResponse.documents.length > 0) {
      return await account.createMagicURLToken(
        dbResponse.documents[0].user_id,
        email,
        `${CONFIG.baseUrl}/login/activate`
      );
    } else {
      console.log(dbResponse);
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
      console.log("Logged Out");
      return true;
    }
  } catch (err) {
    console.error(err);
  }
}
