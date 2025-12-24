import { checkAuth } from "../../appwrite/auth";
import { account } from "../../appwrite/client";

checkAuth();

const urlParams = new URLSearchParams(window.location.search);
const secret = urlParams.get("secret");
const userId = urlParams.get("userId");

if (!secret || !userId) {
  window.location.href = `${CONFIG.baseUrl}/login/login`;
}

$("#activateButton").on("click", async function () {
  try {
    const response = await account.createSession({ userId, secret });
    if (response) {
      console.log(response);
    }
  } catch (err) {
    console.error(err);
  }
});
