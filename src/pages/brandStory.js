import { checkAuth } from "../appwrite/auth";
import { getBrandStoryData } from "../appwrite/db";
import { renderToast } from "../ui/toast";
import { applyTextBindings } from "../utils/dataBinding";
import { getCssValueFromVarName, getErrorMessage } from "../utils/helpers";
import { withLoader } from "../ui/loader";

await checkAuth();

const brandStoryCard = $(".brand-story-card");
const visionBackdropImage = $(".brand-story-vision-image");
gsap.set(visionBackdropImage, { display: "block", autoAlpha: 0, scale: 0.9 });
const contentWrapper = $(".brand-story-content-wrapper");
const contentObituary = $(".brand-story-content-obituary");
const contentVision = $(".brand-story-content-vision");
const contentVisionImage = $(".brand-story-content-vision-image");

// Audio progress bar
const obituaryProgressBar = $(".obituary-audio-card-progress");
gsap.set(obituaryProgressBar, { width: "0%" });

let obituaryProgressRafId = null;

function updateObituaryProgress() {
  // Guard: duration can be NaN/Infinity before metadata is loaded
  const duration = obituaryAudio.duration;
  if (!duration || !isFinite(duration) || duration <= 0) {
    obituaryProgressBar.css("width", "0%");
  } else {
    const pct = Math.min(
      100,
      Math.max(0, (obituaryAudio.currentTime / duration) * 100)
    );
    obituaryProgressBar.css("width", `${pct}%`);
  }

  // Keep tracking while playing
  if (!obituaryAudio.paused && !obituaryAudio.ended) {
    obituaryProgressRafId = requestAnimationFrame(updateObituaryProgress);
  } else {
    obituaryProgressRafId = null;
  }
}

function startObituaryProgress() {
  stopObituaryProgress();
  obituaryProgressRafId = requestAnimationFrame(updateObituaryProgress);
}

function stopObituaryProgress() {
  if (obituaryProgressRafId) {
    cancelAnimationFrame(obituaryProgressRafId);
    obituaryProgressRafId = null;
  }
}

function resetObituaryProgress() {
  stopObituaryProgress();
  obituaryProgressBar.css("width", "0%");
}

let styling = {
  original: {
    background: brandStoryCard.css("backgroundColor"),
    foreground: brandStoryCard.css("color"),
    foreground75: $(".fg-75").css("color"),
  },
  obituary: {
    backgroundTarget: getCssValueFromVarName(
      "var(--_all-colors---service-color--strategy--background)"
    ),
    foregroundTarget: getCssValueFromVarName(
      "var(--_all-colors---service-color--strategy--foreground)"
    ),
  },
  vision: {
    backgroundTarget: "",
  },
};

const obituaryAudio = new Audio();
obituaryAudio.preload = "none";

async function setBrandStoryData() {
  try {
    const res = await getBrandStoryData();

    // Vision
    styling.vision.backgroundTarget = res.vision.files.high;
    visionBackdropImage.css(
      "backgroundImage",
      `url(${styling.vision.backgroundTarget})`
    );

    contentVisionImage
      .attr("src", res.vision.files.high)
      .attr(
        "srcset",
        `${res.vision.files.low} 100w, ${res.vision.files.mid} 400w, ${res.vision.files.high} 800w`.trim()
      )
      .attr("sizes", "100vw");

    // Obituary (Audio)
    const fileDwnld = res.obituary.file;
    obituaryAudio.src = fileDwnld;
    // —— Reset progress when a new audio source is assigned
    resetObituaryProgress();

    applyTextBindings($(".brand-story-content-wrapper"), {
      "obituary-body": res.obituary.document.obituary,
      "vision-body": res.vision.document.description,
    });
  } catch (err) {
    console.error(err);
    renderToast("Oeps!", getErrorMessage(err), "negative");
  }
}

await withLoader(setBrandStoryData());

// Audio Card Click Handlers
const obituaryCard = $(".obituary-audio-card");
const pauseIcon = obituaryCard.find(".action-card-top-icon.pause");
const playIcon = obituaryCard.find(".action-card-top-icon.play");
gsap.set(pauseIcon, { display: "block", autoAlpha: 0 });

obituaryAudio.onended = () => {
  gsap
    .timeline({
      onStart: () => {
        obituaryAudio.currentTime = 0;
        obituaryCard.attr("data-is-playing", "false");
        resetObituaryProgress();
      },
    })
    .fromTo(
      pauseIcon,
      { yPercent: 0, autoAlpha: 1 },
      { yPercent: -100, autoAlpha: 0 }
    )
    .fromTo(
      playIcon,
      { yPercent: 100, autoAlpha: 0 },
      { yPercent: 0, autoAlpha: 1 },
      "<"
    );
};

obituaryCard.off("click.toggleplayer").on("click.toggleplayer", function () {
  const $card = $(this);
  if ($card.attr("data-is-playing") === "false") {
    gsap
      .timeline({
        onStart: async () => {
          await obituaryAudio.play();
          startObituaryProgress();
        },
        onComplete: () => {
          $card.attr("data-is-playing", "true");
        },
      })
      .fromTo(
        pauseIcon,
        { yPercent: -100, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1 }
      )
      .fromTo(
        playIcon,
        { yPercent: 0, autoAlpha: 1 },
        { yPercent: 100, autoAlpha: 0 },
        "<"
      );
  } else if ($card.attr("data-is-playing") === "true") {
    gsap
      .timeline({
        onStart: async () => {
          await obituaryAudio.pause();
          stopObituaryProgress();
        },
        onComplete: () => {
          $card.attr("data-is-playing", "false");
        },
      })
      .fromTo(
        pauseIcon,
        { yPercent: 0, autoAlpha: 1 },
        { yPercent: -100, autoAlpha: 0 }
      )
      .fromTo(
        playIcon,
        { yPercent: 100, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1 },
        "<"
      );
  }
});

brandStoryCard.each((__, card) => {
  const $card = $(card);

  $card.off("mouseenter.hover").on("mouseenter.hover", function () {
    switch ($card.attr("id")) {
      case "vision":
        gsap
          .timeline({ defaults: { duration: 0.5 } })
          .to($card.find(visionBackdropImage), {
            scale: 1,
            autoAlpha: 0.2,
          })
          .to(
            $card,
            {
              yPercent: -5,
            },
            "<"
          );
        break;
      case "obituary":
        gsap
          .timeline({ defaults: { duration: 0.5 } })
          .to($card, {
            backgroundColor: styling.obituary.backgroundTarget,
            color: styling.obituary.foregroundTarget,
            yPercent: -5,
          })
          .to(
            $card.find("p"),
            {
              color: styling.obituary.foregroundTarget,
            },
            "<"
          );
        break;
    }
  });
  $card.off("mouseleave.hover").on("mouseleave.hover", function () {
    switch ($card.attr("id")) {
      case "vision":
        gsap
          .timeline({ defaults: { duration: 0.5 } })
          .to($card.find(visionBackdropImage), {
            scale: 0.9,
            autoAlpha: 0,
          })
          .to(
            $card,
            {
              yPercent: 0,
            },
            "<"
          );
        break;
      case "obituary":
        gsap
          .timeline({ defaults: { duration: 0.5 } })
          .to($card, {
            backgroundColor: styling.original.background,
            color: styling.original.foreground,
            yPercent: 0,
          })
          .to(
            $card.find("p"),
            {
              color: styling.original.foreground75,
            },
            "<"
          );
        break;
    }
  });

  $card.off("click.openStory").on("click.openStory", function () {
    switch ($card.attr("id")) {
      case "vision":
        gsap
          .timeline({
            onStart: () =>
              gsap.set(contentVision, { display: "flex", autoAlpha: 1 }),
          })
          .to([$(".brand-story-title-container"), brandStoryCard], {
            yPercent: -20,
            autoAlpha: 0,
            overwrite: true,
            stagger: 0.1,
          })
          .fromTo(
            contentWrapper,
            { scale: 0.9, autoAlpha: 0 },
            { scale: 1, autoAlpha: 1 }
          );
        break;
      case "obituary":
        gsap
          .timeline({
            onStart: () =>
              gsap.set(contentObituary, { display: "flex", autoAlpha: 1 }),
          })
          .to([$(".brand-story-title-container"), brandStoryCard], {
            yPercent: -20,
            autoAlpha: 0,
            overwrite: true,
            stagger: 0.1,
          })
          .fromTo(
            contentWrapper,
            { scale: 0.9, autoAlpha: 0 },
            { scale: 1, autoAlpha: 1 }
          );
        break;
    }
  });
});

const closeBtn = $(".brand-essence-info-card-close-button");

closeBtn.each((__, btn) => {
  const $btn = $(btn);

  $btn.off("click.closeStory").on("click.closeStory", function () {
    switch ($btn.attr("id")) {
      case "closeObituary":
        gsap
          .timeline({
            onComplete: () =>
              gsap.set(contentObituary, { display: "none", autoAlpha: 0 }),
          })
          .fromTo(
            contentWrapper,
            { scale: 1, autoAlpha: 1 },
            { scale: 0.9, autoAlpha: 0 }
          )
          .to([$(".brand-story-title-container"), brandStoryCard], {
            yPercent: 0,
            autoAlpha: 1,
            overwrite: true,
            stagger: 0.1,
          });
        break;
      case "closeVision":
        gsap
          .timeline({
            onComplete: () =>
              gsap.set(contentVision, { display: "none", autoAlpha: 0 }),
          })
          .fromTo(
            contentWrapper,
            { scale: 1, autoAlpha: 1 },
            { scale: 0.9, autoAlpha: 0 }
          )
          .to([$(".brand-story-title-container"), brandStoryCard], {
            yPercent: 0,
            autoAlpha: 1,
            overwrite: true,
            stagger: 0.1,
          });
        break;
    }
  });
});
