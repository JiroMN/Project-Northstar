import { logOut } from "../appwrite/auth";
import APPWRITE, { CONFIG } from "../config/public";
import {
  formatShortDate,
  getErrorMessage,
  getCssValueFromVarName,
} from "../utils/helpers";
import { renderModal } from "./modal";
import { renderToast } from "./toast";
import { getClientData, getContinuityPackageData } from "../appwrite/db";
import { applyTextBindings } from "../utils/dataBinding";
import { getFilePreview } from "../appwrite/storage";

const sidebarMaxWidth = $(".sidebar").css("width");

function setNavButtonState($btn, state) {
  const targetBgColor = getCssValueFromVarName(
    "var(--_all-colors---dark--backgroundtones--80)"
  );
  const targetFgColor = getCssValueFromVarName(
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
$("#logOutButton")
  .off("click.logout")
  .on("click.logout", async function (e) {
    try {
      e.preventDefault();
      renderModal(
        "Just Checking",
        "Are you sure you want to log out?",
        "Cancel",
        "Confirm",
        async () => {
          const response = await logOut();
          if (response) {
            window.location.href = CONFIG.baseUrl;
          }
        }
      );
    } catch (err) {
      renderToast("Oops!", getErrorMessage(err), "negative");
      throw err;
    }
  });

//   Info Cards
gsap.set(".sidebar-info-wrapper", {
  display: "flex",
  autoAlpha: 0,
  pointerEvents: "none",
});

// Show cards
$("#infoCardsButton")
  .off("click.infoCards")
  .on("click.infoCards", function () {
    gsap
      .timeline({
        onStart: () => {
          gsap.set(".sidebar-info-wrapper", { autoAlpha: 1 });
        },
        onComplete: () => {
          gsap.set(".sidebar-info-wrapper", {
            pointerEvents: "auto",
          });
        },
        defaults: { duration: 0.75 },
      })
      .to(".sidebar", { width: 280 })
      .fromTo(
        ".sidebar-info-card",
        { autoAlpha: 0, filter: "blur(5px)", yPercent: 50 },
        {
          autoAlpha: 1,
          filter: "blur(0px)",
          yPercent: 0,
          stagger: 0.1,
        },
        "<"
      );
  });

//   close info cards
$(".sidebar-info-wrapper")
  .find(".sidebar-info-card-close-icon")
  .off("click.infoCardsClose")
  .on("click.infoCardsClose", function () {
    gsap
      .timeline({
        onComplete: () => {
          gsap.set(".sidebar-info-wrapper", { autoAlpha: 0 });
        },
        onStart: () => {
          gsap.set(".sidebar-info-wrapper", {
            pointerEvents: "auto",
          });
        },
        defaults: { duration: 0.5 },
      })
      .to(".sidebar", {
        width: sidebarMaxWidth,
        ease: "power4.out",
      })
      .fromTo(
        ".sidebar-info-card",
        { autoAlpha: 1, filter: "blur(0px)", yPercent: 0 },
        {
          autoAlpha: 0,
          filter: "blur(5px)",
          yPercent: 50,
          stagger: 0.1,
        },
        "<"
      );
  });

//   hover states
$(".sidebar-info-list-item").each((index, elem) => {
  const $elem = $(elem);

  // Hover In
  $elem
    .off("mouseenter.hoverInfoListItem")
    .on("mouseenter.hoverInfoListItem", function () {
      if ($elem.is("a, a *")) {
        gsap
          .timeline()
          .to($(".sidebar-info-list-item").not($elem), { autoAlpha: 0.65 })
          .to(
            $elem.find(".sidebar-info-card-list-item-icon"),
            {
              x: 2,
              y: -2,
            },
            "<"
          );
      }
    });

  // Hover Out
  $elem
    .off("mouseleave.hoverInfoListItem")
    .on("mouseleave.hoverInfoListItem", function () {
      if ($elem.is("a, a *")) {
        gsap.timeline().to($(".sidebar-info-list-item"), { autoAlpha: 1 }).to(
          $elem.find(".sidebar-info-card-list-item-icon"),
          {
            x: 0,
            y: 0,
          },
          "<"
        );
      }
    });
});

// Bind data to info cards
async function bindDataToInfoCards() {
  try {
    const response = await getClientData();
    const data = response.client.documents[0];
    const avatar = await getFilePreview(
      APPWRITE.buckets.logos.id,
      data.avatar_file_id
    );
    const subscriptionsRes = await getContinuityPackageData();
    const subscriptionData = subscriptionsRes.documents[0];

    applyTextBindings($(".sidebar-info-card"), {
      "client-info-name": data.name,
      "client-info-partner-since": formatShortDate(data.collab_start),
      "client-info-continuity-package": subscriptionData.continuityPackage.name,
      "client-info-contract-period-start": formatShortDate(data.contract_start),
      "client-info-contract-period-end": formatShortDate(data.contract_end),
      "client-info-billing-period-end": formatShortDate(
        subscriptionData.billing_period_end_date
      ),
    });

    // Set images
    // —— Fetch from storage bucket
    $(".sidebar-info-card-list-item-client-avatar-badge").css(
      "backgroundImage",
      `url(${avatar})`
    );
    // —— Change bg image
    const pkgBadge = $(".continuity-package-badge");
    switch (subscriptionData.continuityPackage.name) {
      case "Continuity Essential":
        pkgBadge.addClass("essential");
        break;
      case "Continuity Core":
        pkgBadge.addClass("core");
        break;
      case "Continuity Plus":
        pkgBadge.addClass("plus");
        break;
    }
  } catch (err) {
    console.error(err);
    renderToast("Oops!", getErrorMessage(err), "negative");
  }
}

await bindDataToInfoCards();

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

  const targetFgColor = getCssValueFromVarName(
    "var(--_all-colors---dark--foreground)"
  );
  const originalFgColor = getCssValueFromVarName(
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
  targetRegularBg: getCssValueFromVarName(
    "var(--_all-colors---dark--backgroundtones--75)"
  ),
  targetRegularFg: getCssValueFromVarName(
    "var(--_all-colors---dark--foreground)"
  ),
  targetLogOutBg: getCssValueFromVarName(
    "var(--_all-colors---feedback--negative--background)"
  ),
  targetLogOutFg: getCssValueFromVarName(
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
