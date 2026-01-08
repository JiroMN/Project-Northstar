import { Query } from "appwrite";
import { checkAuth } from "../appwrite/auth";
import {
  gatherGoogleDriveURL,
  getClientId,
  getCollection,
  getLogoSystemData,
} from "../appwrite/db";
import { getFileDownload, getFilePreview } from "../appwrite/storage";
import APPWRITE from "../config/public";
import { renderToast } from "../ui/toast";
import { applyTextBindings } from "../utils/dataBinding";
import { getErrorMessage } from "../utils/helpers";

await checkAuth();

const fileTypeDwnlds = $(".logo-system-variant-showcase-action.file-types");

// templates
const $logoSetTemplate = $("#logoSetTemplate");
const $variantSelectorTemplate = $("#variantTemplate");
$logoSetTemplate.css("display", "none");
$variantSelectorTemplate.css("display", "none");

gsap.set(fileTypeDwnlds, {
  autoAlpha: 0,
  pointerEvents: "none",
});

async function processLogoData() {
  try {
    const res = await getLogoSystemData();
    return res.documents;
  } catch (err) {
    console.error(err);
    renderToast("Oeps!", getErrorMessage(err), "negative");
  }
}

const logoData = await processLogoData();

async function changeToVariant(logoSetId, variantId, logoSetElem) {
  try {
    const $logoSetElem = $(logoSetElem);
    // Find LogoSet
    let logoSet = $(logoData).filter((__, set) => {
      return set.$id === logoSetId;
    });
    logoSet = logoSet[0];

    // Find Variant
    let variant = $(logoSet.logoVariants).filter((__, variant) => {
      return variant.$id === variantId;
    });
    variant = variant[0];

    // Fetch file sources
    const file = {
      previews: {
        low: await getFilePreview(
          APPWRITE.buckets.logos.id,
          variant.png_file_id,
          100
        ),
        mid: await getFilePreview(
          APPWRITE.buckets.logos.id,
          variant.png_file_id,
          400
        ),
        high: await getFilePreview(
          APPWRITE.buckets.logos.id,
          variant.png_file_id,
          800
        ),
      },
      downloads: {
        png: await getFileDownload(
          APPWRITE.buckets.logos.id,
          variant.png_file_id
        ),
        svg: await getFileDownload(
          APPWRITE.buckets.logos.id,
          variant.svg_file_id
        ),
      },
    };

    // Bind Data
    // —— Change showcase source
    $logoSetElem
      .find(".logo-system-variant-showcase-image")
      .attr("src", file.previews.high)
      .attr(
        "srcset",
        `${file.previews.high} 100w, ${file.previews.high} 400w, ${file.previews.high} 800w`.trim()
      )
      .attr("sizes", "100vw");

    // Style image container
    $logoSetElem
      .find(".logo-system-variant-showcase-image-backdrop")
      .css("backgroundColor", variant.preview_bg_hex);
    // —— Style Selectors
    $logoSetElem
      .find(".logo-system-variant-selector")
      .children()
      .each((__, variantSelector) => {
        const $variantSelector = $(variantSelector);
        if ($variantSelector.attr("data-variant-id") !== variantId) {
          gsap.to($variantSelector, { autoAlpha: 0.5 });
        } else {
          gsap.to($variantSelector, { autoAlpha: 1 });
        }
      });

    // —— Bind download URI to buttons
    $logoSetElem
      .find("[data-bind='png-download-link']")
      .attr("href", file.downloads.png);
    $logoSetElem
      .find("[data-bind='svg-download-link']")
      .attr("href", file.downloads.svg);
  } catch (err) {
    console.error(err);
    renderToast("Oeps!", getErrorMessage(err), "negative");
  }
}

function renderLogoSets() {
  $(logoData).each((__, set) => {
    const logoSetClone = $logoSetTemplate.clone(true);

    logoSetClone.css("display", "flex");
    logoSetClone.attr("id", "");
    logoSetClone.attr("data-logo-set-id", set.$id);

    applyTextBindings(logoSetClone, {
      "set-title": set.title,
      "set-description": set.notes,
    });

    logoSetClone.appendTo($(".logo-system-content"));

    // Render variants in the correct order (sort_order asc)
    const sortedVariants = [...(set.logoVariants || [])].sort((a, b) => {
      const aOrder = Number(a.sort_order ?? a.sortOrder ?? 0);
      const bOrder = Number(b.sort_order ?? b.sortOrder ?? 0);
      return aOrder - bOrder;
    });

    // Set default variant
    changeToVariant(set.$id, sortedVariants[0].$id, logoSetClone);

    $(sortedVariants).each((__, variant) => {
      const variantSelectorContainer = logoSetClone.find(
        ".logo-system-variant-selector"
      );
      const variantSelectorClone = $variantSelectorTemplate.clone(true);

      variantSelectorClone.css("display", "flex");
      variantSelectorClone.css("cursor", "pointer");
      variantSelectorClone.attr("id", "");

      variantSelectorClone.appendTo(variantSelectorContainer);
      variantSelectorClone.text(variant.variant_name);
      variantSelectorClone.attr("data-variant-id", variant.$id);
    });
  });
}

renderLogoSets();

// Variant selection listener
$("[data-variant-selector]")
  .off("click.selectVariant")
  .on("click.selectVariant", function () {
    const $variant = $(this);
    const $variantId = $variant.attr("data-variant-id");
    const $logoSet = $variant.parents(".logo-system-set-container");
    const $logoSetId = $logoSet.attr("data-logo-set-id");

    changeToVariant($logoSetId, $variantId, $logoSet);
  });

// Download Opener
const originalBorderRadius = gsap.getProperty(
  ".logo-system-variant-showcase-action.download-button",
  "borderTopLeftRadius"
);

$(".logo-system-variant-showcase-action-wrapper").each((__, elem) => {
  const $elem = $(elem);
  $elem.off("click.pressDownload").on("click.pressDownload", function () {
    const downloadBtn = $elem.find(
      ".logo-system-variant-showcase-action.download-button"
    );
    const fileTypes = $elem.find(
      ".logo-system-variant-showcase-action.file-types"
    );

    if (
      $elem.attr("data-is-unfolded") === "false" ||
      !$elem.attr("data-is-unfolded")
    ) {
      gsap
        .timeline()
        .to(downloadBtn, {
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
        })
        .to(
          fileTypes,
          {
            autoAlpha: 1,
            xPercent: -99,
            pointerEvents: "auto",
            duration: 0.5,
          },
          "<"
        );
      $elem.attr("data-is-unfolded", "true");
    } else {
      gsap
        .timeline()
        .to(downloadBtn, {
          borderTopLeftRadius: originalBorderRadius,
          borderBottomLeftRadius: originalBorderRadius,
        })
        .to(
          fileTypes,
          {
            autoAlpha: 0,
            xPercent: 0,
            pointerEvents: "none",
            duration: 0.5,
          },
          "<"
        );
      $elem.attr("data-is-unfolded", "false");
    }
  });
});

const googleDriveURL = await gatherGoogleDriveURL();

$("#downloadAllLogos")
  .off("click.downloadLogos")
  .on("click.downloadLogos", async function () {
    try {
      window.open(googleDriveURL, "_blank");
    } catch (err) {
      renderToast("Oeps!", getErrorMessage(err), "Negative");
    }
  });
