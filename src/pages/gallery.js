import { checkAuth } from "../appwrite/auth";
import { getGalleryAlbums, getGalleryData } from "../appwrite/db";
import { renderToast } from "../ui/toast";
import { applyTextBindings } from "../utils/dataBinding";
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

// Masonry
// Helpers
function afterPaint(cb) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      cb();
    });
  });
}
function debugLogs(label = "") {
  console.log("— DEBUG:", label);

  console.log("items in DOM:", $(".gallery-grid .gallery-item").length);
  console.log("template exists:", $("#galleryItemTemplate").length);
  console.log(
    "items that Masonry sees:",
    $masonryGrid.data("masonry")?.items?.length
  );
  console.log("grid height before:", $(".gallery-grid").height());
  $masonryGrid.masonry("layout");
  console.log("grid height after:", $(".gallery-grid").height());
}
// Loads Masonry + imagesLoaded from CDN only if they are not already present.
function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      // If it was already loaded, resolve immediately.
      if (existing.dataset.loaded === "true") resolve();
      return;
    }

    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => {
      s.dataset.loaded = "true";
      resolve();
    };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function ensureMasonryLoaded() {
  // If Masonry is already available, do nothing.
  const hasMasonry =
    typeof window.Masonry !== "undefined" ||
    typeof $.fn.masonry !== "undefined";
  const hasImagesLoaded = typeof $.fn.imagesLoaded !== "undefined";

  const promises = [];

  if (!hasMasonry) {
    promises.push(
      loadScriptOnce(
        "https://unpkg.com/masonry-layout@4/dist/masonry.pkgd.min.js"
      )
    );
  }

  if (!hasImagesLoaded) {
    promises.push(
      loadScriptOnce(
        "https://unpkg.com/imagesloaded@5/imagesloaded.pkgd.min.js"
      )
    );
  }

  if (promises.length) await Promise.all(promises);
}

let $masonryGrid = null;
let masonryInitialized = false;

async function initMasonry() {
  try {
    await ensureMasonryLoaded();

    const $grid = $(".gallery-grid");
    if (!$grid.length) return;

    // Add a sizer element if it doesn't exist yet.
    if (!$grid.find(".grid-sizer").length) {
      $grid.prepend('<div class="grid-sizer"></div>');
    }

    // Ensure items exist before initializing
    const $items = $grid.find(".gallery-item");
    if (!$items.length) return;

    // Prefer the jQuery plugin API (works when masonry.pkgd + jQuery are present)
    if (typeof $.fn.masonry === "function") {
      $grid.masonry({
        itemSelector: ".gallery-item.not-template",
        columnWidth: ".grid-sizer",
        percentPosition: true,
        gutter: convertRemToPx(
          getCssValueFromVarName("var(--_sizing---gap--sm)")
        ),

        transitionDuration: 0,
      });

      // Re-layout as images load to prevent gaps/overlap
      if (typeof $.fn.imagesLoaded === "function") {
        $grid.imagesLoaded().progress(() => {
          $grid.masonry("layout");
        });
      } else {
        // Fallback: do a couple of delayed layouts
        setTimeout(() => $grid.masonry("layout"), 0);
        setTimeout(() => $grid.masonry("layout"), 250);
      }

      $masonryGrid = $grid;
      masonryInitialized = true;
      return;
    }

    // Fallback to vanilla Masonry if needed
    if (typeof window.Masonry !== "undefined") {
      const msnry = new window.Masonry($grid.get(0), {
        itemSelector: ".gallery-item.not-template",
        columnWidth: ".grid-sizer",
        percentPosition: true,
        gutter: convertRemToPx(
          getCssValueFromVarName("var(--_sizing---gap--sm)")
        ),
      });

      $masonryGrid = $grid;
      masonryInitialized = true;

      if (window.imagesLoaded) {
        window.imagesLoaded($grid.get(0)).on("progress", () => msnry.layout());
      } else {
        setTimeout(() => msnry.layout(), 0);
        setTimeout(() => msnry.layout(), 250);
      }
    }
  } catch (err) {
    console.error("Failed to initialize Masonry", err);
  }
}

function relayoutMasonry() {
  if (!masonryInitialized || !$masonryGrid) return;
  if (typeof $.fn.masonry === "function") {
    $masonryGrid.masonry("layout");
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

  let $newItems = $();

  $galleryItemTemplate.css("display", "none");

  // Remove old gallery items
  const $grid = $(".gallery-grid");

  // Remove old gallery items (Masonry-safe)
  if (
    masonryInitialized &&
    $masonryGrid &&
    typeof $.fn.masonry === "function"
  ) {
    const $oldItems = $grid.find(".gallery-item").not("#galleryItemTemplate");
    if ($oldItems.length) {
      $masonryGrid.masonry("remove", $oldItems);
      $masonryGrid.masonry("layout");
    }
  } else {
    $grid.find(".gallery-item").not("#galleryItemTemplate").remove();
  }

  // Render Files
  files.forEach((file) => {
    const galleryItemClone = $galleryItemTemplate.clone(true);
    let isPreviewable = true;

    galleryItemClone.css("display", "flex");
    galleryItemClone.attr("id", "");
    galleryItemClone.attr("data-related-album", file.album.$id);
    galleryItemClone.attr("data-file-id", file.file.$id);
    galleryItemClone.addClass("not-template");
    gsap.set(galleryItemClone, { autoAlpha: 0, yPercent: 50 });
    galleryItemClone.appendTo(".gallery-grid");

    $newItems = $newItems.add(galleryItemClone);

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

  // Masonry refresh
  // Tell masonry what that there are new items
  if (
    masonryInitialized &&
    $masonryGrid &&
    typeof $.fn.masonry === "function"
  ) {
    console.log($newItems);
    if ($newItems.length) {
      //   $masonryGrid.masonry("appended", $newItems);
    }
  }
  const $renderedItems = $(".gallery-grid .gallery-item").not(
    "#galleryItemTemplate"
  );

  const doLayoutAndAnimate = () => {
    afterPaint(() => {
      if (
        masonryInitialized &&
        $masonryGrid &&
        typeof $.fn.masonry === "function"
      ) {
        $masonryGrid.masonry("reloadItems");
        $masonryGrid.masonry("layout");
      }

      gsap.to($renderedItems, {
        autoAlpha: 1,
        yPercent: 0,
        stagger: 0.05,
        overwrite: true,
      });
    });
  };

  if (
    masonryInitialized &&
    $masonryGrid &&
    typeof $.fn.imagesLoaded === "function"
  ) {
    $masonryGrid.imagesLoaded().progress(() => {
      $masonryGrid.masonry("layout");
    });

    $masonryGrid.imagesLoaded().always(() => {
      doLayoutAndAnimate();
    });
  } else {
    // fallback
    setTimeout(doLayoutAndAnimate, 0);
    setTimeout(() => {
      if (
        masonryInitialized &&
        $masonryGrid &&
        typeof $.fn.masonry === "function"
      ) {
        $masonryGrid.masonry("layout");
      }
    }, 250);
  }
}

// Inits
albumsData = await getGalleryAlbums();
renderAlbums(albumsData.documents);

data = await gatherGalleryInfo(selectedAlbumId, PAGE_SIZE, currentOffset);
renderGalleryItems(data.files);

await initMasonry();

debugLogs("Init");

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
          debugLogs("Album Switch");

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

          afterPaint(() => relayoutMasonry());
        },
      })
      .to($(".gallery-item"), { autoAlpha: 0, yPercent: -50, stagger: 0.05 });
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
        console.log("Clicked on dwnld listener");
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
