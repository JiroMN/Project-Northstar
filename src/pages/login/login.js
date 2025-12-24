import { requestMagicUrlToken, logOut, checkAuth } from "../../appwrite/auth";
import { account } from "../../appwrite/client";
import { renderToast } from "../../ui/toast";

checkAuth();

const logInButton = $("#submitLogIn");
const input = $("#email");
let isLoggedIn = false;

async () => {
  try {
    await account().get();
    isLoggedIn = true;
  } catch (err) {
    isLoggedIn = false;
  }
};

if (isLoggedIn) {
  console.log("account detected");
  // input.children(0).text("Enter");
}

logInButton.on("click", async function () {
  console.log("Trying to log in...");
  if (input.val() !== "") {
    try {
      await requestMagicUrlToken(input.val());
    } catch (err) {
      console.error(err);
    }
  } else {
    console.log("no input");
    renderToast("I'm missing something", "Fill in you email", "negative");
  }
});
