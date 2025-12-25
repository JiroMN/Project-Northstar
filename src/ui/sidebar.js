import { getHexFromVarName } from "../utils/helpers";

function setNavButtonState($btn, state) {
  const targetBgColor = getHexFromVarName(
    "var(--_all-colors---dark--backgroundtones--80)"
  );
  const targetFgColor = getHexFromVarName(
    "var(--_all-colors---dark--foreground)"
  );

  switch (state) {
    case "visiting":
      gsap.set($btn, { background: targetBgColor, color: targetFgColor });
      $btn.attr("data-isvisiting-nav-button", "true");
      break;
  }
}

$(".sidebar-nav-button").each((index, elem) => {
  const $btn = $(elem);
  const $relatedSlug = $btn.attr("data-related-slug");

  const currentSlug = location.pathname.slice(1);

  if ($relatedSlug == currentSlug) {
    setNavButtonState($btn, "visiting");
  } else if ($relatedSlug == "index" && currentSlug == "") {
    setNavButtonState($btn, "visiting");
  } else {
    return;
  }
});

// Hover Handling
const NS = ".btnHover";

$(".sidebar-nav-button").each((index, elem) => {
  const $btn = $(elem);

  const targetFgColor = getHexFromVarName(
    "var(--_all-colors---dark--foreground)"
  );
  const originalFgColor = getHexFromVarName(
    "var(--_all-colors---dark--foregroundtones--75)"
  );

  $btn.on(`mouseenter${NS}`, function () {
    // Skip hover animation when disabled/loading
    if (
      $btn.attr("data-disabled") === "true" ||
      $btn.attr("data-isvisiting-nav-button") === "true"
    )
      return;

    gsap.to($btn, {
      color: targetFgColor,
      duration: 0.2,
      ease: "power1.out",
      overwrite: "auto",
    });
  });

  $btn.on(`mouseleave${NS}`, function () {
    // If disabled/loading, keep the disabled alpha (setButtonState handles it)
    if (
      $btn.attr("data-disabled") === "true" ||
      $btn.attr("data-isvisiting-nav-button") === "true"
    )
      return;

    gsap.to($btn, {
      backgroundColor: "transparent",
      color: originalFgColor,
      duration: 0.2,
      ease: "power1.out",
      overwrite: "auto",
    });
  });
});
