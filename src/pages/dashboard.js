import { checkAuth } from "../appwrite/auth";
import {
  getContinuityPackageData,
  getContinuityTimeInfo,
  getTimeLogs,
} from "../appwrite/db";
import { renderToast } from "../ui/toast";
import { applyTextBindings } from "../utils/dataBinding";
import { getHexFromVarName } from "../utils/helpers";

await checkAuth();

// Get continuity hours for in 'hero' and 'actions'
async function processContinuityInfo() {
  try {
    const continuityTimeInfo = await getContinuityTimeInfo();

    const packageData =
      continuityTimeInfo.subscriptionData.documents[0].continuityPackage;

    const spentHours = continuityTimeInfo.spentHours;
    const spentConsultingHours = continuityTimeInfo.spentConsultingHours;

    gsap
      .timeline()
      .to(".dashboard-hero-continuity-progressbar.reserved", {
        width: `${
          (packageData.reserved_consulting_hours / packageData.total_hours) *
          100
        }%`,
      })
      .to(
        "#reservedProgress",
        {
          width: `${
            (spentConsultingHours / packageData.reserved_consulting_hours) * 100
          }%`,
        },
        "<50%"
      )
      .to(
        "#freeProgress",
        {
          width: `${
            (spentConsultingHours / packageData.reserved_consulting_hours) * 100
          }%`,
        },
        "<50%"
      );

    const totalHours = continuityTimeInfo.totalFreeHours;

    applyTextBindings($(".dashboard-hero"), {
      "hero-package": packageData.name,
      "spent-hours": spentHours.toString(),
      "free-hours": totalHours,
    });
  } catch (err) {
    console.error(err);
    renderToast(
      "Oops!",
      "Can't gather your continuity information.",
      "warning"
    );
  }
}

processContinuityInfo();

// Resources
$(".resource-card").each((index, elem) => {
  const $elem = $(elem);

  const originalStrokeColor = getHexFromVarName("var(--background)");
  const targetStrokeColor = getHexFromVarName("var(--background--75)");

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
    ".visual-resource-backdrop-icon-container"
  );

  const backdropImage = $elem.css("backgroundImage");
  const originalBg = getHexFromVarName("var(--background--90)");
  const targetBg = getHexFromVarName("var(--translucents--bg-100-20)");

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

// Actions
// —— Download Brandbook

// —— Listen to obituary

// —— Set Continuity Hours
