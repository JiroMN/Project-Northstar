import { checkAuth } from "../appwrite/auth";
import { getGalleryAlbums, getGalleryData } from "../appwrite/db";
import { renderToast } from "../ui/toast";
import { applyTextBindings } from "../utils/dataBinding";
import { withLoader } from "../ui/loader";
import {
  convertRemToPx,
  copyToClipboard,
  formatBytes,
  getCssValueFromVarName,
  getErrorMessage,
} from "../utils/helpers";

await checkAuth();

let selectedAlbumId = null;

const PAGE_SIZE = 15;
let currentOffset = 0;
let currentPageNumber = 1;

let albumsData = null;
let data = null;

// Masonry
const $grid = $(".gallery-grid");
let msnry = null;

$grid.prepend('<div class="grid-sizer"></div>');

function initMasonry() {
  if (msnry) return msnry;

  $grid.masonry({
    itemSelector: ".gallery-item[data-file-id]",
    columnWidth: ".grid-sizer",
    gutter: convertRemToPx(getCssValueFromVarName("var(--_sizing---gap--sm)")),
    percentPosition: true,
    transitionDuration: 0,
  });

  console.log("Initializing Masonry");
  msnry = $grid.data("masonry");
  return msnry;
}

function layoutMasonryAfterRender() {
  setTimeout(() => {
    initMasonry();

    // 1) Masonry opnieuw laten scannen
    $grid.masonry("reloadItems"); // docs: reloadItems recollects all items

    // 2) imagesLoaded: layout na elke image load (aanrader van docs)
    $grid.imagesLoaded().progress(function () {
      $grid.masonry("layout"); // docs: layout herpositioneert items
    });

    // 3) eventueel alvast 1 keer layouten (kan fijn zijn voor placeholders)
    $grid.masonry("layout");
  }, 0);
}

// Database etc.
async function gatherGalleryInfo(albumId, limit, offset) {
  try {
    const dbRes = await getGalleryData(albumId, limit, offset);
    return dbRes;
  } catch (err) {
    console.error(err);
    renderToast("Oeps!", getErrorMessage(err), "negative");
    throw err;
  }
}

// Render Albums
function renderAlbums(albums) {
  const $activePageSelector = $("#activePageSelectorTemplate");
  const $inactivePageSelector = $("#inactivePageSelectorTemplate");

  $activePageSelector.css("display", "none");
  $inactivePageSelector.css("display", "none");

  $(".page-selector").empty();

  const allClone = $activePageSelector.clone(true);
  allClone.css("display", "flex");
  allClone.attr("id", "");
  allClone.attr("data-is-selected-page", "true");
  allClone.attr("data-related-content-id", ""); // leeg = ALL
  allClone.appendTo(".page-selector");

  applyTextBindings(allClone, {
    "page-selector-title": "All",
  });

  applyTextBindings($(".gallery-wrapper"), {
    "album-name": "All",
  });

  $(albums).each((__, album) => {
    const pageSelectorClone = $inactivePageSelector.clone(true);

    pageSelectorClone.css("display", "flex");
    pageSelectorClone.attr("id", "");
    pageSelectorClone.attr("data-related-content-id", album.$id);
    pageSelectorClone.appendTo(".page-selector");

    applyTextBindings(pageSelectorClone, {
      "page-selector-title": album.name,
    });
  });
}

// Render gallery items
function renderGalleryItems(files) {
  const $galleryItemTemplate = $("#galleryItemTemplate");

  $galleryItemTemplate.css("display", "none");

  // Remove old gallery items
  const $grid = $(".gallery-grid");
  $grid.find(".gallery-item").not("#galleryItemTemplate").remove();

  // Render Files
  files.forEach((file) => {
    const galleryItemClone = $galleryItemTemplate.clone(true);
    let isPreviewable = true;

    galleryItemClone.css("display", "flex");
    galleryItemClone.attr("id", "");
    galleryItemClone.attr("data-related-album", file.album.$id);
    galleryItemClone.attr("data-file-id", file.file.$id);
    gsap.set(galleryItemClone, {
      autoAlpha: 0,
      yPercent: 0,
      scale: 0.9,
      filter: "blur(5px)",
    });
    galleryItemClone.appendTo(".gallery-grid");

    // Set data-bind Information
    applyTextBindings(galleryItemClone, {
      "file-name": file.file.name,
    });

    switch (file.file.mimeType) {
      case "image/png":
      case "image/jpeg":
      case "image/jpg":
      case "image/webp":
      case "image/svg+xml":
        break;
      default:
        isPreviewable = false;
        break;
    }

    const MAX_PREVIEW_SIZE = 10 * 1024 * 1024;

    if (file.file.sizeOriginal > MAX_PREVIEW_SIZE) {
      isPreviewable = false;
    }

    // Set Image Preview
    if (isPreviewable) {
      galleryItemClone
        .find(".gallery-item-image")
        .attr("src", file.sources.previews.high)
        .attr(
          "srcset",
          `${file.sources.previews.high} 100w, ${file.sources.previews.high} 400w, ${file.sources.previews.high} 800w`.trim()
        )
        .attr("sizes", "100vw");
    }

    // Set Download data
    galleryItemClone
      .find("[data-bind='download-button']")
      .attr("data-download-source", file.sources.download);
  });

  const $renderedItems = $(".gallery-grid .gallery-item").not(
    "#galleryItemTemplate"
  );

  // Animate rendered items in
  gsap.timeline().to($renderedItems, {
    autoAlpha: 1,
    filter: "blur(0px)",
    scale: 1,
    stagger: 0.05,
    overwrite: true,
  });
}

// Inits
albumsData = await getGalleryAlbums();
renderAlbums(albumsData.documents);

data = await withLoader(
  gatherGalleryInfo(selectedAlbumId, PAGE_SIZE, currentOffset)
);
renderGalleryItems(data.files);
layoutMasonryAfterRender();

$(".page-selector-item").each((__, selector) => {
  const $selector = $(selector);

  $selector.off("click.changeAlbum").on("click.changeAlbum", async function () {
    const targetAlbumId = $selector.attr("data-related-content-id");
    selectedAlbumId =
      targetAlbumId && targetAlbumId.trim() !== "" ? targetAlbumId : null;

    gsap
      .timeline({
        onComplete: async () => {
          // Reset pagination when switching albums
          resetPagination();

          data = await gatherGalleryInfo(
            selectedAlbumId,
            PAGE_SIZE,
            currentOffset
          );
          renderGalleryItems(data.files);
          layoutMasonryAfterRender();

          // Update next/prev styling based on new album payload
          const total = Number.isFinite(data.total) ? data.total : null;
          const hasNext =
            total !== null
              ? currentOffset + data.files.length < total
              : data.files.length === PAGE_SIZE;

          setPaginationStyling(!hasNext, currentPageNumber);

          const label = $selector
            .find("[data-bind='page-selector-title']")
            .text()
            .trim();
          applyTextBindings($(".gallery-wrapper"), { "album-name": label });
        },
      })
      .to($(".gallery-item"), {
        autoAlpha: 0,
        filter: "blur(5px)",
        scale: 0.9,
        stagger: 0.05,
      });
  });
});

// Lightbox logic
// —— Lightbox base states
gsap.set($(".gallery-lightbox"), { display: "flex", autoAlpha: 0 });

function openLightbox() {
  const lightbox = $(".gallery-lightbox");
  const imageWrapper = $(".gallery-lightbox-image-wrapper");

  gsap
    .timeline()
    .to(lightbox, { autoAlpha: 1 })
    .fromTo(
      imageWrapper,
      { scale: 0.9, autoAlpha: 0, filter: "blur(5px)" },
      { scale: 1, autoAlpha: 1, filter: "blur(0px)", duration: 1 }
    );
}
function closeLightbox() {
  const lightbox = $(".gallery-lightbox");
  const imageWrapper = $(".gallery-lightbox-image-wrapper");

  gsap
    .timeline()
    .to(lightbox, { autoAlpha: 0 })
    .fromTo(
      imageWrapper,
      { scale: 1, autoAlpha: 1, filter: "blur(0px)", duration: 1 },
      { scale: 0.9, autoAlpha: 0, filter: "blur(5px)" }
    );
}

$(".gallery-item").each((__, media) => {
  const $media = $(media);

  $media.off("click.openLightbox").on("click.openLightbox", function (e) {
    if ($(e.target).closest(".icon-button").length) return;
    const fileId = $(this).attr("data-file-id");
    const image = $(".gallery-lightbox-image");
    const downloadButton = $("#lightboxImageDownload");

    const relatedFileData = $(data.files).filter((_, file) => {
      return file.file.$id === fileId;
    });

    if (!relatedFileData.length) {
      renderToast(
        "Oeps!",
        "Kon geen informatie van bestand ophalen",
        "warning"
      );
    } else {
      // Get sources of clicked gallery item
      applyTextBindings($(".gallery-lightbox-properties"), {
        "lightbox-filename": relatedFileData[0].file.name,
        "lightbox-filesize": formatBytes(relatedFileData[0].file.sizeOriginal),
        "lightbox-album": relatedFileData[0].album.name,
      });

      // Assign Data
      image
        .attr("src", relatedFileData[0].sources.previews.high)
        .attr(
          "srcset",
          `${relatedFileData[0].sources.previews.high} 100w, ${relatedFileData[0].sources.previews.high} 400w, ${relatedFileData[0].sources.previews.high} 800w`.trim()
        )
        .attr("sizes", "100vw");

      downloadButton.attr(
        "data-download-source",
        relatedFileData[0].sources.download
      );
      // Open
      openLightbox();
    }
  });
});

function resetPagination() {
  currentOffset = 0;
  currentPageNumber = 1;

  setPaginationStyling(false, 1);
}

function updatePageNumber(nextPage) {
  currentPageNumber = nextPage;
  applyTextBindings($(".pagination-selector"), {
    "page-number": nextPage,
  });
}

function setPaginationStyling(isLastPage = false, nextPage = 1) {
  const prevBtn = $(".pagination-selector").find(
    "[data-pagination-direction='prev']"
  );
  const nextBtn = $(".pagination-selector").find(
    "[data-pagination-direction='next']"
  );

  if (currentPageNumber > 1) {
    prevBtn.addClass("active");
  } else {
    prevBtn.removeClass("active");
  }
  if (!isLastPage) {
    nextBtn.addClass("active");
  } else {
    nextBtn.removeClass("active");
  }

  updatePageNumber(nextPage);
}

setPaginationStyling();

async function paginate(isForward) {
  try {
    if (!isForward && currentPageNumber === 1) return;

    const nextOffset = isForward
      ? currentOffset + PAGE_SIZE
      : Math.max(0, currentOffset - PAGE_SIZE);

    const nextPageNumber = isForward
      ? currentPageNumber + 1
      : Math.max(1, currentPageNumber - 1);

    const newPayload = await gatherGalleryInfo(
      selectedAlbumId,
      PAGE_SIZE,
      nextOffset
    );

    // If forward but no results: we're at the end -> don't move
    if (isForward && newPayload.files.length === 0) {
      setPaginationStyling(true, currentPageNumber); // stay on current page
      return;
    }

    // commit state
    currentOffset = nextOffset;
    currentPageNumber = nextPageNumber;

    data = newPayload;
    renderGalleryItems(newPayload.files);
    layoutMasonryAfterRender();

    // Determine last page using total (best) or fallback
    const total = Number.isFinite(newPayload.total) ? newPayload.total : null;
    const hasNext =
      total !== null
        ? currentOffset + newPayload.files.length < total
        : newPayload.files.length === PAGE_SIZE; // fallback if no total

    setPaginationStyling(!hasNext, currentPageNumber);
  } catch (err) {
    console.error(err);
    renderToast("Oeps!", getErrorMessage(err), "negative");
  }
}

// Event listeners
$(".gallery-lightbox-closing-listener").each((__, closeListener) => {
  const $closeListener = $(closeListener);

  $closeListener
    .off("click.closeLightbox")
    .on("click.closeLightbox", () => closeLightbox());
});

$(".lightbox-property-file-name")
  .off("click.copyFileName")
  .on("click.copyFileName", async function () {
    await copyToClipboard($(this), "Bestandnaam is gekopieerd.");
  });

$("#lightboxImageDownload")
  .off("click.downloadFromLightbox")
  .on("click.downloadFromLightbox", function () {
    try {
      window.open($(this).attr("data-download-source"), "_blank");
    } catch (err) {
      renderToast("Oeps!", getErrorMessage(err), "Negative");
    }
  });

$("[data-download-source]").each((__, btn) => {
  const $btn = $(btn);

  $btn
    .off("click.downloadFromLightbox")
    .on("click.downloadFromLightbox", function () {
      try {
        window.open($(this).attr("data-download-source"), "_blank");
      } catch (err) {
        renderToast("Oeps!", getErrorMessage(err), "Negative");
      }
    });
});

$(".pagination-selector-item").each((__, btn) => {
  const $btn = $(btn);
  const direction = $btn.attr("data-pagination-direction");

  $btn.off("click.paginate").on("click.paginate", async function () {
    await paginate(direction === "next");
  });
});
