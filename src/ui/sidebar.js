import { logOut } from "../appwrite/auth";
import { CONFIG } from "../config/public";
import { getErrorMessage, getHexFromVarName } from "../utils/helpers";
import { renderToast } from "./toast";

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

// Log Out
$("#logOutButton").on("click", async function () {
  try {
    const response = await logOut();
    if (response) {
      window.location.href = CONFIG.baseUrl;
    }
  } catch (err) {
    renderToast("Oops!", getErrorMessage(err), "negative");
    throw err;
  }
});

// Set Visiting State
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

// —— Bottom Action Buttons
const hoverDefaults = {
  ease: "power2.out",
  overwrite: "auto",
};

const colors = {
  targetRegularBg: getHexFromVarName(
    "var(--_all-colors---dark--backgroundtones--75)"
  ),
  targetRegularFg: getHexFromVarName("var(--_all-colors---dark--foreground)"),
  targetLogOutBg: getHexFromVarName(
    "var(--_all-colors---feedback--negative--background)"
  ),
  targetLogOutFg: getHexFromVarName(
    "var(--_all-colors---feedback--negative--foreground)"
  ),
};

$(".sidebar-bottom-action-button").each((index, elem) => {
  const $btn = $(elem);

  // Store originals per button (computed values)
  const original = {
    bg: $btn.css("backgroundColor"),
    fg: $btn.css("color"),
  };

  $btn.on("mouseenter", function () {
    if ($btn.attr("id") == "logOutButton") {
      gsap.to($btn, {
        backgroundColor: colors.targetLogOutBg,
        color: colors.targetLogOutFg,
        ...hoverDefaults,
      });
    } else {
      gsap.to($btn, {
        backgroundColor: colors.targetRegularBg,
        color: colors.targetRegularFg,
        ...hoverDefaults,
      });
    }
  });

  $btn.on("mouseleave", function () {
    gsap.to($btn, {
      backgroundColor: original.bg,
      color: original.fg,
      ...hoverDefaults,
    });
  });
});
