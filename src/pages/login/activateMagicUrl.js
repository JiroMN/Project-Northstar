import { checkAuth } from "../../appwrite/auth";
import { account } from "../../appwrite/client";
import { CONFIG } from "../../config/public";
import { renderToast } from "../../ui/toast";
import { getErrorMessage } from "../../utils/helpers";

checkAuth();

const urlParams = new URLSearchParams(window.location.search);
const secret = urlParams.get("secret");
const userId = urlParams.get("userId");

if (!secret || !userId) {
  window.location.href = `${CONFIG.baseUrl}/login`;
}

$("#activateButton").on("click", async function () {
  try {
    const response = await account.updateMagicURLSession({ userId, secret });

    if (response) {
      renderToast(
        "Ingelogd!",
        "Je wordt doorgestuurd naar het dashboard...",
        "positive",
      );
      setTimeout(() => {
        window.location.href = CONFIG.baseUrl;
      }, 2000);
    }
  } catch (err) {
    renderToast("Oops!", getErrorMessage(err), "negative");
  }
});
