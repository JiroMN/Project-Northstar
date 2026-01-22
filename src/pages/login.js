import { setButtonState } from "../animations/global/buttons";
import { appearFromBottom, disappearToTop } from "../animations/helpers/micro";
import { requestMagicUrlToken, logOut, checkAuth } from "../appwrite/auth";
import { CONFIG } from "../config/public";
import { renderToast } from "../ui/toast";
import { getErrorMessage } from "../utils/helpers";

const authUser = await checkAuth();

const logInButton = $("#submitLogIn");
const input = $("#email");
const submitResponse = $(".login-card-form-submit-response");

gsap.set(submitResponse, { display: "flex", autoAlpha: 0 });

if (authUser) {
  logInButton.find(".button-text").text("Enter");
  gsap.set(input, {
    autoAlpha: 0.5,
    pointerEvents: "none",
  });
  input.attr("placeholder", authUser.email);
}

logInButton.on("click", async function () {
  if ($(this).attr("data-disable") == "true") return;

  if (!authUser && input.val() !== "") {
    try {
      setButtonState($(this), "loading", false);
      const response = await requestMagicUrlToken(input.val());
      if (response) {
        // Set email adress in feedback
        $("#magicUrlSentTo").text(input.val());
        // Animate to feedback screen
        disappearToTop($(".login-card-form-wrapper").children(), {
          stagger: 0.1,
        });
        appearFromBottom(submitResponse, { delay: 0.5 });
      }
    } catch (err) {
      renderToast("Oops!", getErrorMessage(err), "negative");
      setButtonState($(this), "enable", true);
    }
  } else if (authUser) {
    window.location.href = CONFIG.baseUrl;
  } else {
    renderToast(
      "I'm missing something",
      "You have to fill in your email.",
      "warning"
    );
  }
});
