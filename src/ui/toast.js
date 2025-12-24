// Dynamic Toast Component
import { applyTextBindings } from "../utils/dataBinding";
import { appearFromRight, disappearToRight } from "../animations/helpers/micro";

// Template toasts
const toast = $(".toast");

const positiveToast = toast.filter('[data-wf--toast--variant="positive"]');
const negativeToast = toast.filter('[data-wf--toast--variant="negative"]');
const warningToast = toast.filter('[data-wf--toast--variant="warning"]');
const announcementToast = toast.filter(
  '[data-wf--toast--variant="announcement"]'
);

gsap.set(toast, { display: "flex", autoAlpha: 0 });

export function renderToast(heading, body, state, displayDuration = 5000) {
  applyTextBindings(toast, {
    "toast-heading": heading,
    "toast-body": body,
  });
  switch (state) {
    case "positive":
      // Appear
      appearFromRight(positiveToast);
      //   Timer
      gsap.fromTo(
        positiveToast.find(".toast-close-timer-bar-progress"),
        { width: "0%" },
        { width: "100%", duration: displayDuration / 1000, ease: "none" }
      );
      //   Hide
      setTimeout(() => {
        disappearToRight(positiveToast);
      }, displayDuration);
      break;
    case "negative":
      // Appear
      appearFromRight(negativeToast);
      //   Timer
      gsap.fromTo(
        negativeToast.find(".toast-close-timer-bar-progress"),
        { width: "0%" },
        { width: "100%", duration: displayDuration / 1000, ease: "none" }
      );
      //   Hide
      setTimeout(() => {
        disappearToRight(negativeToast);
      }, displayDuration);
      break;
    case "warning":
      // Appear
      appearFromRight(warningToast);
      //   Timer
      gsap.fromTo(
        warningToast.find(".toast-close-timer-bar-progress"),
        { width: "0%" },
        { width: "100%", duration: displayDuration / 1000, ease: "none" }
      );
      //   Hide
      setTimeout(() => {
        disappearToRight(warningToast);
      }, displayDuration);
      break;
    case "annoucement":
      // Appear
      appearFromRight(announcementToast);
      //   Timer
      gsap.fromTo(
        announcementToast.find(".toast-close-timer-bar-progress"),
        { width: "0%" },
        { width: "100%", duration: displayDuration / 1000, ease: "none" }
      );
      //   Hide
      setTimeout(() => {
        disappearToRight(announcementToast);
      }, displayDuration);
      break;
  }
}
