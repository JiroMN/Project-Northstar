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
      opacity: 0.65,
      duration: 0.2,
      ease: "power1.out",
      overwrite: "auto",
    });
  });

  $btn.on(`mouseleave${NS}`, function () {
    // If disabled/loading, keep the disabled alpha (setButtonState handles it)
    if ($btn.attr("data-disabled") === "true") return;

    gsap.to($btn, {
      opacity: 1,
      duration: 0.2,
      ease: "power1.out",
      overwrite: "auto",
    });
  });
});

// Page Tabs
$(document)
  .off("click.clickTab", ".page-selector-item")
  .on("click.clickTab", ".page-selector-item", function () {
    const $elem = $(this);
    const $siblings = $elem.siblings(".page-selector-item");

    const isCurrentlySelected = $elem.attr("data-is-selected-page") === "true";
    if (isCurrentlySelected) return;

    const targetTabId = $elem.attr("data-related-content-id") || "";

    // Handle tabs styling
    $elem.addClass("active");
    $elem.attr("data-is-selected-page", "true");

    $siblings.removeClass("active");
    $siblings.attr("data-is-selected-page", "false");

    // Change page ONLY when the attribute is a real selector (e.g. "#tab-1")
    // Gallery uses this attribute for Appwrite album ids, so we must NOT run show/hide there.
    if (targetTabId.trim().startsWith("#")) {
      $(targetTabId).show();

      $siblings.each((__, sibling) => {
        const siblingChangeToId =
          $(sibling).attr("data-related-content-id") || "";
        if (siblingChangeToId.trim().startsWith("#")) {
          $(siblingChangeToId).hide();
        }
      });
    }
  });
