import { ID } from "appwrite";
import { account } from "./client";
import { CONFIG } from "../config/public";

export async function checkAuth() {
  try {
    await account().get();
    console.log("Logged in");
  } catch (err) {
    console.log("Not logged in");
    if (!window.location.href.startsWith(`${CONFIG.baseUrl}/login`)) {
      window.location.href = `${CONFIG.baseUrl}/login/login`;
    }
  }
}

export async function requestMagicUrlToken(email) {
  return await account.createMagicURLToken(
    ID.unique(),
    email,
    `${CONFIG.baseUrl}/login/activate`
  );
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
