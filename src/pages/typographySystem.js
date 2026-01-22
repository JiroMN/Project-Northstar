import { checkAuth } from "../appwrite/auth";
import {
  gatherGoogleDriveURL,
  getTypographyFontData,
  getTypographyScaleData,
} from "../appwrite/db";
import { withLoader } from "../ui/loader";
import { renderToast } from "../ui/toast";
import { applyTextBindings } from "../utils/dataBinding";
import {
  buildTypographyScale,
  copyToClipboard,
  formatPx,
  formatRem,
  getErrorMessage,
} from "../utils/helpers";

await checkAuth();

// Hide pages according to Tab Page Selector
$(".page-selector-item").each((__, tab) => {
  const relatedPageId = $(tab).attr("data-related-content-id");
  const isSelectedPage = $(tab).attr("data-is-selected-page") == "true";

  const relatedPageElement = $(relatedPageId);

  if (!isSelectedPage) {
    relatedPageElement.hide();
  }
});

async function gatherTypographyFontData() {
  try {
    const response = await getTypographyFontData();
    return response.documents;
  } catch (err) {
    renderToast("Oeps!", getErrorMessage(err), "negative");
    console.error(err);
  }
}

const typographyFontData = await withLoader(gatherTypographyFontData());

function renderFonts() {
  const $cardTemplate = $("#typographyCardTemplate");
  const $weightTemplate = $("#typographyWeightTemplate");

  $cardTemplate.css("display", "none");
  $weightTemplate.css("display", "none");

  $(typographyFontData).each((__, font) => {
    const fontCardClone = $cardTemplate.clone(true);

    fontCardClone.appendTo(".typo-page.fonts");
    fontCardClone.css("display", "flex");
    fontCardClone.attr("id", "");

    applyTextBindings(fontCardClone.find(".typo-font-card-top"), {
      "font-name": font.name,
      "font-role": font.role,
      "font-notes": font.notes,
      "font-letter-spacing": `${font.typographyRules[0].letterspacing_percent}%`,
      "font-line-height": `${font.typographyRules[0].line_height_percent}%`,
    });

    const sortedWeights = [...(font.fontWeights || [])].sort((a, b) => {
      const aOrder = Number(a.sort_order ?? a.sortOrder ?? 0);
      const bOrder = Number(b.sort_order ?? b.sortOrder ?? 0);
      return aOrder - bOrder;
    });

    $(sortedWeights).each((__, weight) => {
      const weightCardClone = $weightTemplate.clone(true);
      const titleContainer = weightCardClone.find(
        ".typo-font-card-weight-title-container"
      );

      weightCardClone.appendTo(".typo-font-card-weight-grid");
      weightCardClone.css("display", "flex");
      weightCardClone.attr("id", "");

      // Hide Style Badge when none or null
      (weight.style === "None" || !weight.style) &&
        titleContainer.find(".badge").hide();

      // Set Font weight to relevant weight num
      titleContainer.find("h2").css("font-weight", weight.weight_num);

      // Set text styling
      switch (weight.style) {
        case "Italic":
          titleContainer.find("h2").css("font-style", "italic");
          break;

        case "Underline":
          titleContainer.find("h2").css("text-decoration", "underline");
          break;

        case "Italic-underline":
          titleContainer.find("h2").css({
            "font-style": "italic",
            "text-decoration": "underline",
          });
          break;
        case "Strike-through":
          titleContainer.find("h2").css("text-decoration", "line-through");
          break;
        default:
          break;
      }

      applyTextBindings(weightCardClone, {
        "weight-title": `${weight.weight_txt.toUpperCase()} (${
          weight.weight_num
        })`,
        "weight-notes": weight.Notes,
        "font-weight-style": weight.style,
      });
    });
  });
}

renderFonts();

async function gatherTypographyScaleData() {
  try {
    const response = await getTypographyScaleData();
    return response.documents;
  } catch (err) {
    renderToast("Oeps!", getErrorMessage(err), "negative");
    console.error(err);
  }
}
const typographyScaleData = await withLoader(gatherTypographyScaleData());

function renderScaleSteps() {
  const scaleStepTemplate = $("#typographyScaleStepTemplate");

  // Base states
  scaleStepTemplate.css("display", "none");
  gsap.set(scaleStepTemplate.find(".typography-scale-step-col-icon"), {
    display: "block",
    autoAlpha: 0,
  });

  applyTextBindings($(".typography-scale-properties"), {
    "base-px": `${typographyScaleData[0].base_px}px`,
  });

  $(typographyScaleData[0].typographyScale).each((__, scale) => {
    const steps = buildTypographyScale({
      basePx: typographyScaleData[0].base_px,
      factor: scale.factor,
      stepsUp: 6,
      stepsDown: 1,
    });

    // Title + factor display
    applyTextBindings($(".typography-scale-title-container"), {
      "scale-title": scale.name,
      "scale-factor": `${scale.factor}`,
    });

    $(steps).each((__, step) => {
      const stepClone = scaleStepTemplate.clone(true);

      stepClone.appendTo(".typography-scale-step-list");
      stepClone.css("display", "flex");
      stepClone.attr("id", "");

      const clampedRem = Math.min(3, Math.max(1, Number(step.rem) || 1));

      stepClone
        .find("[data-bind='scale-title']")
        .css("font-size", `${clampedRem}rem`);

      applyTextBindings(stepClone, {
        "scale-value-px": formatPx(step.px),
        "scale-value-rem": formatRem(step.rem),
        "scale-title": step.label,
      });

      // Set data attributes to value for copy click listener
      stepClone
        .find(".typography-scale-step-col")
        .attr("data-scale-step-copy-value-px", formatPx(step.px).slice(0, -2));
      stepClone
        .find(".typography-scale-step-col")
        .attr(
          "data-scale-step-copy-value-rem",
          formatRem(step.rem).slice(0, -3)
        );
    });
  });
}

renderScaleSteps();

$(".typography-scale-step").each((__, scaleStep) => {
  const $step = $(scaleStep);

  $step
    .find(".typography-scale-step-col")
    .off("click.click")
    .on("click.click", function () {
      const copyFormat = $(this).attr("data-scale-step-copy");
      const copyValuePx = $(this).attr("data-scale-step-copy-value-px");
      const copyValueRem = $(this).attr("data-scale-step-copy-value-rem");

      switch (copyFormat) {
        case "px":
          copyToClipboard(copyValuePx, `${copyValuePx}px is gekopieerd.`);
          break;
        case "rem":
          copyToClipboard(copyValueRem, `${copyValueRem}rem is gekopieerd.`);
          break;
      }
    });

  $step.off("mouseenter.hoverStep").on("mouseenter.hoverStep", function () {
    gsap
      .timeline()
      .to($(".typography-scale-step").not($step), {
        autoAlpha: 0.65,
      })
      .to(
        $step.find(".typography-scale-step-col-icon"),
        {
          autoAlpha: 1,
        },
        "<"
      );
  });
  $step.off("mouseleave.hoverStep").on("mouseleave.hoverStep", function () {
    gsap
      .timeline()
      .to($(".typography-scale-step"), {
        autoAlpha: 1,
      })
      .to(
        $(".typography-scale-step-col-icon"),
        {
          autoAlpha: 0,
        },
        "<"
      );
  });
});

const googleDriveURL = await gatherGoogleDriveURL();

$("#downloadAllFonts")
  .off("click.downloadFonts")
  .on("click.downloadFonts", async function () {
    try {
      window.open(googleDriveURL, "_blank");
    } catch (err) {
      renderToast("Oeps!", getErrorMessage(err), "Negative");
    }
  });
