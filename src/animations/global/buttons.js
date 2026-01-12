import { getCssValueFromVarName } from "../../utils/helpers";

// Button Helpers
export function setButtonState($btn, state, isClickable) {
  // Timeline used only for disabled/loading visual feedback
  const tl = gsap.timeline({ paused: true }).to($btn, {
    autoAlpha: 0.5,
    duration: 0.75,
    overwrite: "auto",
  });

  isClickable
    ? $btn.attr("data-disable", "false")
    : $btn.attr("data-disable", "true");

  switch (state) {
    case "enable":
      // Kill any running opacity animation and fully restore button
      tl.kill();
      gsap.set($btn, {
        autoAlpha: 1,
        cursor: "pointer",
        overwrite: "auto",
      });
      $btn.attr("data-disabled", "false");
      break;

    case "disable":
      $btn.attr("data-disabled", "true");
      gsap.set($btn, { cursor: "not-allowed" });
      tl.play(0);
      break;

    case "loading":
      $btn.attr("data-disabled", "true");
      gsap.set($btn, { cursor: "wait" });
      tl.play(0);
      break;

    default:
      break;
  }
}

// Button Animations
const NS = ".btnHover";

$(".button, .button-md, .icon-button").each(function () {
  const $btn = $(this);

  // Prevent duplicate bindings if this file runs more than once
  $btn.off(NS);

  $btn.on(`mouseenter${NS}`, function () {
    // Skip hover animation when disabled/loading
    if ($btn.attr("data-disabled") === "true") return;

    gsap.to($btn, {
      autoAlpha: 0.65,
      duration: 0.2,
      ease: "power1.out",
      overwrite: "auto",
    });
  });

  $btn.on(`mouseleave${NS}`, function () {
    // If disabled/loading, keep the disabled alpha (setButtonState handles it)
    if ($btn.attr("data-disabled") === "true") return;

    gsap.to($btn, {
      autoAlpha: 1,
      duration: 0.2,
      ease: "power1.out",
      overwrite: "auto",
    });
  });
});

// Page Tabs
$(".page-selector-item")
  .off("click.clickTab")
  .on("click.clickTab", function () {
    const elem = $(this);
    const siblings = elem.siblings();

    const isCurrentlySelected = elem.attr("data-is-selected-page") === "true";

    if (!isCurrentlySelected) {
      const targetTabId = elem.attr("data-related-content-id");

      // Handle tabs styling
      elem.addClass("active");
      elem.attr("data-is-selected-page", "true");
      siblings.removeClass("active");
      siblings.attr("data-is-selected-page", "false");

      // Change page
      $(targetTabId).show();

      siblings.each((__, sibling) => {
        const siblingChangeToId = $(sibling).attr("data-related-content-id");
        $(siblingChangeToId).hide();
      });
    }
  });
