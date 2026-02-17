import { Query } from "appwrite";
import { checkAuth, checkContinuityAccess } from "../appwrite/auth";
import {
  getBrandEssenceData,
  getBrandStoryData,
  getClientData,
  getClientId,
  getCollection,
  getContinuityTimeInfo,
} from "../appwrite/db";
import { getFileDownload } from "../appwrite/storage";
import APPWRITE from "../config/public";
import { renderToast } from "../ui/toast";
import { applyTextBindings } from "../utils/dataBinding";
import { daysUntil, getCssValueFromVarName } from "../utils/helpers";
import { renderModal } from "../ui/modal";
import { withLoader } from "../ui/loader";
import { behindContinuityPaywall } from "../ui/paywall";
import { initFormModal, renderFormModal } from "../ui/formModal";
import FORM_MODALS from "../config/formModal";
import { sendResendEmail } from "../appwrite/functions";

const auth = await checkAuth();
const continuityAccess = await withLoader(checkContinuityAccess(false, false));
if (!continuityAccess) {
  behindContinuityPaywall($("[data-action-card-variant='continuity-hours']"));
}

// Get continuity hours for in 'hero' and 'actions'
export async function processContinuityInfo() {
  try {
    if (!continuityAccess) {
      $(".dashboard-hero-continuity").remove();
      $(".dashboard-hero")
        .css("flex-grow", "0")
        .css("height", "max-content")
        .css("min-height", "25vh")
        .css("max-height", "30vh");
      $(".dashboard-hero-inner-container").css("justify-content", "end");

      return;
    }
    const continuityTimeInfo = await getContinuityTimeInfo();

    const packageData =
      continuityTimeInfo.continuityPackageRes.appwrite.documents[0];

    const spentHours = continuityTimeInfo.spentHours;
    const spentConsultingHours = continuityTimeInfo.spentConsultingHours;

    gsap
      .timeline()
      .to(".dashboard-hero-continuity-progressbar.reserved", {
        width: `${
          (continuityTimeInfo.reservedConsultingHours /
            continuityTimeInfo.totalHours) *
          100
        }%`,
      })
      .to(
        "#reservedProgress",
        {
          width: `${
            (spentConsultingHours /
              continuityTimeInfo.reservedConsultingHours) *
            100
          }%`,
        },
        "<50%",
      )
      .to(
        "#freeProgress",
        {
          width: `${(spentHours / continuityTimeInfo.totalFreeHours) * 100}%`,
        },
        "<50%",
      );

    const totalHours = continuityTimeInfo.totalFreeHours;

    applyTextBindings($(".dashboard-hero"), {
      "hero-package": packageData.continuityPackage.name,
      "spent-hours": spentHours.toString(),
      "free-hours": totalHours.toString(),
    });

    const hoursLeft = totalHours - spentHours;
    const billingPeriodEnd =
      continuityTimeInfo.continuityPackageRes.stripe.currentPeriodEnd;

    applyTextBindings($(".action-card-top.continuity"), {
      "action-card-continuity-hours-left": hoursLeft.toString(),
      "action-card-continuity-days-left":
        daysUntil(billingPeriodEnd).toString(),
    });
  } catch (err) {
    console.error(err);
    renderToast(
      "Oops!",
      "Can't gather your continuity information.",
      "warning",
    );
  }
}

await processContinuityInfo();

// Resources
async function setResourceData() {
  try {
    const clientIdRes = await getClientId();
    if (!clientIdRes) throw { message: "No client ID found" };
    const response = await getCollection(
      APPWRITE.databases.general.id,
      APPWRITE.databases.general.collections.resources.id,
      [Query.equal("client_id", clientIdRes)],
    );
    let resources = response.documents[0];

    function assignLink(elem, url) {
      elem.attr("href", url);
      elem.attr("target", "_blank");
    }

    $(".resource-card").each((__, elem) => {
      const variant = $(elem).attr("data-wf--resource-card--variant");
      switch (variant) {
        case "website":
          assignLink($(elem), resources.website_url);
          break;
        case "webflow-designer":
          assignLink($(elem), resources.webflow_designer_url);
          break;
        case "webflow-analytics":
          assignLink($(elem), resources.webflow_analytics_url);
          break;
        case "figma":
          assignLink($(elem), resources.figma_url);
          break;
        case "google-drive":
          assignLink($(elem), resources.googledrive_url);
          break;
      }
    });
  } catch (err) {
    console.error(err);
  }
}
setResourceData();

$(".resource-card").each((__, elem) => {
  const $elem = $(elem);

  const originalStrokeColor = getCssValueFromVarName("var(--background)");
  const targetStrokeColor = getCssValueFromVarName("var(--background--75)");

  $elem
    .off("mouseenter.resourceCard")
    .on("mouseenter.resourceCard", function () {
      gsap.to($elem, { borderColor: targetStrokeColor });
    });
  $elem
    .off("mouseleave.resourceCard")
    .on("mouseleave.resourceCard", function () {
      gsap.to($elem, { borderColor: originalStrokeColor });
    });
});

// Visual Resources
$(".visual-resources-card").each((index, elem) => {
  const $elem = $(elem);
  const $backdropShapeContainer = $elem.find(
    ".visual-resource-backdrop-icon-container",
  );

  const backdropImage = $elem.css("backgroundImage");
  const originalBg = getCssValueFromVarName("var(--background--90)");
  const targetBg = getCssValueFromVarName("var(--translucents--bg-100-20)");

  $elem.css("backgroundImage", "none");

  //   Variant Icon init states
  gsap.set($backdropShapeContainer, {
    display: "block",
    autoAlpha: 0,
    yPercent: 50,
  });

  $elem
    .off("mouseenter.visualResource")
    .on("mouseenter.visualResource", function () {
      gsap
        .timeline({
          onStart: () => $elem.css("backgroundImage", backdropImage),
        })
        .add(() => $elem.css("backgroundImage", backdropImage))
        .to($elem.find(".visual-resources-card-inner-container"), {
          width: "70%",
          backgroundColor: targetBg,
          duration: 0.75,
        })
        .to($backdropShapeContainer, { autoAlpha: 1, yPercent: 0 }, "<");
    });

  $elem
    .off("mouseleave.visualResource")
    .on("mouseleave.visualResource", function () {
      gsap
        .timeline({
          onComplete: () => $elem.css("backgroundImage", "none"),
        })
        .to($elem.find(".visual-resources-card-inner-container"), {
          width: "100%",
          backgroundColor: originalBg,
          duration: 0.75,
        })
        .to($backdropShapeContainer, { autoAlpha: 0, yPercent: 50 }, "<");
    });
});

// Brand Essence
async function processEssenceData() {
  try {
    const res = await withLoader(getBrandEssenceData());

    res.trueline.trueline &&
      applyTextBindings($(".dashboard-hero"), {
        trueline: res.trueline.trueline,
      });
  } catch (err) {
    renderToast(
      "Oeps!",
      "Kon geen Brand Essence informatie ophalen",
      "negative",
    );
  }
}

await processEssenceData();

// Actions
// Hover animations
$(".action-card").each((__, elem) => {
  const $card = $(elem);
  const variant = $card.attr("data-action-card-variant");

  // Collect top-foreground elements that should animate color on hover
  // and remember each element's original color so we can restore correctly.
  let topFgElements = {
    icon: $card.find(".action-card-top-icon"),
  };
  let topFgTargets = [];

  let targetBgColor;
  let targetBgToneColor;
  let targetFgColor;

  let originalBgColor = $card.css("backgroundColor");
  let originalBgToneColor = $card
    .find(".action-card-top-icon-wrapper")
    .css("backgroundColor");

  // Store original title color separately (title may not match icon-wrapper color)
  let originalTitleColor = $card.find("h2").css("color");

  switch (variant) {
    case "download-brandbook":
      targetBgColor = getCssValueFromVarName("var(--foreground)");
      targetFgColor = getCssValueFromVarName("var(--background)");
      targetBgToneColor = getCssValueFromVarName(
        "var(--_all-colors---light--backgroundtones--50)",
      );
      break;
    case "obituary":
      targetBgColor = getCssValueFromVarName(
        "var(--_all-colors---service-color--strategy--background)",
      );
      targetFgColor = getCssValueFromVarName(
        "var(--_all-colors---service-color--strategy--foreground)",
      );
      targetBgToneColor = getCssValueFromVarName(
        "var(--_all-colors---service-color--strategy--background)",
      );
      break;
    case "continuity-hours":
      topFgElements = {
        ...topFgElements,
        text: $card.find(".sm.fg-75"),
      };
      // (Top-foreground text is added for continuity-hours)
      targetBgColor = getCssValueFromVarName(
        "var(--_all-colors---service-color--continuity--background)",
      );
      targetFgColor = getCssValueFromVarName(
        "var(--_all-colors---service-color--continuity--foreground)",
      );
      targetBgToneColor = getCssValueFromVarName(
        "var(--_all-colors---service-color--continuity--background)",
      );
      break;
  }

  // Build the target list once per card and store each element's original color.
  topFgTargets = Object.values(topFgElements)
    .filter(($el) => $el && $el.length)
    .map(($el) => $el.get(0));

  topFgTargets.forEach((el) => {
    // Store per-element original color for accurate restore on mouseleave
    const $el = $(el);
    if ($el.data("originalColor") == null) {
      $el.data("originalColor", $el.css("color"));
    }
  });

  $card
    .off("mouseenter.actionCardHover")
    .on("mouseenter.actionCardHover", function () {
      gsap
        .timeline()
        .to($card, { backgroundColor: targetBgColor })
        .to($card.find("h2"), { color: targetFgColor }, "<")
        .to(
          $card.find(".action-card-top-icon-wrapper"),
          {
            backgroundColor: targetBgToneColor,
          },
          "<",
        )
        .to(
          topFgTargets,
          {
            color: targetFgColor,
          },
          "<",
        );
    });

  $card
    .off("mouseleave.actionCardHover")
    .on("mouseleave.actionCardHover", function () {
      gsap
        .timeline()
        .to($card, { backgroundColor: originalBgColor })
        .to($card.find("h2"), { color: originalTitleColor }, "<")
        .to(
          $card.find(".action-card-top-icon-wrapper"),
          {
            backgroundColor: originalBgToneColor,
          },
          "<",
        )
        .to(
          topFgTargets,
          {
            // Restore each element to its own original color
            color: (i, target) => $(target).data("originalColor"),
          },
          "<",
        );
    });
});
// —— Download Brandbook
const brandbookCard = $("[data-action-card-variant='download-brandbook']");
// ApplyDatabinds
async function getBrandbookDownload() {
  try {
    const dbRes = await getClientData();
    if (dbRes) {
      const storageRes = await getFileDownload(
        APPWRITE.buckets.brandbooks.id,
        dbRes.client.documents[0].brandbook_file_id,
      );
      if (storageRes) {
        brandbookCard.attr("href", storageRes);
        brandbookCard.attr("download", "proposed_file_name");
        brandbookCard.attr("target", "_blank");
      }
    }
  } catch (err) {
    console.error(err);
  }
}
await getBrandbookDownload();
brandbookCard.off("click.brandbook").on("click.brandbook", function (e) {
  e.preventDefault();

  const href = $(this).attr("href");
  if (!href) return;

  renderModal(
    "Download Brandbook",
    "Do you wish to continue and download your brandbook?",
    "Cancel",
    "Download",
    () => {
      window.open(href, "_blank");
    },
  );
});

// —— Listen to obituary
const obituaryAudio = new Audio();
obituaryAudio.preload = "none";

async function bindObituaryFile() {
  try {
    const res = await getBrandStoryData();
    const obituary = res.obituary;

    if (obituary.file) {
      const fileDwnld = obituary.file;
      obituaryAudio.src = fileDwnld;
    } else {
      console.error("No obituary data found");
    }
  } catch (err) {
    console.error(err);
  }
}
await bindObituaryFile();
// onclick
const obituaryCard = $("[data-action-card-variant='obituary']");
const pauseIcon = obituaryCard.find(".action-card-top-icon.pause");
const playIcon = obituaryCard.find(".action-card-top-icon.play");
gsap.set(pauseIcon, { display: "block", autoAlpha: 0 });

obituaryAudio.onended = () => {
  gsap
    .timeline({
      onStart: () => {
        obituaryAudio.currentTime = 0;
        obituaryCard.attr("data-is-playing", "false");
      },
    })
    .fromTo(
      pauseIcon,
      { yPercent: 0, autoAlpha: 1 },
      { yPercent: -100, autoAlpha: 0 },
    )
    .fromTo(
      playIcon,
      { yPercent: 100, autoAlpha: 0 },
      { yPercent: 0, autoAlpha: 1 },
      "<",
    );
};

obituaryCard.off("click.toggleplayer").on("click.toggleplayer", function () {
  const $card = $(this);
  if ($card.attr("data-is-playing") === "false") {
    gsap
      .timeline({
        onStart: async () => {
          await obituaryAudio.play();
        },
        onComplete: () => {
          $card.attr("data-is-playing", "true");
        },
      })
      .fromTo(
        pauseIcon,
        { yPercent: -100, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1 },
      )
      .fromTo(
        playIcon,
        { yPercent: 0, autoAlpha: 1 },
        { yPercent: 100, autoAlpha: 0 },
        "<",
      );
  } else if ($card.attr("data-is-playing") === "true") {
    gsap
      .timeline({
        onStart: async () => {
          await obituaryAudio.pause();
        },
        onComplete: () => {
          $card.attr("data-is-playing", "false");
        },
      })
      .fromTo(
        pauseIcon,
        { yPercent: 0, autoAlpha: 1 },
        { yPercent: -100, autoAlpha: 0 },
      )
      .fromTo(
        playIcon,
        { yPercent: 100, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1 },
        "<",
      );
  }
});

// –— Redeem Continuity
initFormModal(FORM_MODALS);
$("#redeemContinuityHours")
  .off("click.redeemHours")
  .on("click.redeemHours", function () {
    renderFormModal("redeemContinuityHours", {
      onSubmit: async ({ resendTemplate, data }) => {
        const resendPayload = {
          // Required by function
          from: "TheBrand.Estate <jiro@thebrand.estate>",
          customerEmail: auth.email,
          internalTemplateId: "external-redeem-continuity-hours",
          customerTemplateId: "external-redeem-continuity-hours",

          // Template variables for Resend template
          templateVariables: {
            Deadline: Number(data.deadline ?? 1),
            Description:
              data.description ?? "Omschrijving van werkzaamheden.",
            Ontvanger: data.ontvanger ?? "Klant",
            Title: data.title ?? "Titel van werkzaamheid",
            resendTemplate,
          },
        };

        const resendExecution = await sendResendEmail(resendPayload);
        console.log("sendResendEmail response:", resendExecution);
      },
    });
  });
