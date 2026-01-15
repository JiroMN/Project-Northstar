import { appearFromBottom } from "../animations/helpers/micro";
import { checkAuth } from "../appwrite/auth";
import { getBrandEssenceData } from "../appwrite/db";
import { renderToast } from "../ui/toast";
import { applyTextBindings } from "../utils/dataBinding";
import { getErrorMessage } from "../utils/helpers";

await checkAuth();

const cards = $(".brand-essence-card");

const infoCards = $(".brand-essence-info-cards").find(
  ".brand-essence-info-card-wrapper"
);
const purposeInfoCard = $("[data-related-to-card='corePurpose']");
const onlinessInfoCard = $("[data-related-to-card='onlinessStatement']");
const truelineInfoCard = $("[data-related-to-card='trueline']");

// Base States
gsap.set(infoCards, { display: "flex", autoAlpha: 0, pointerEvents: "none" });

// Animate on load
appearFromBottom([$(".brand-essence-title-container"), cards], {
  onStart: () => {
    cards.css("pointerEvents", "none");
  },
  onComplete: () => {
    cards.css("pointerEvents", "auto");
  },
  duration: 1,
  stagger: 0.2,
});

async function gatherBrandEssenceData() {
  try {
    const res = await getBrandEssenceData();
    return res;
  } catch (err) {
    console.error(err);
    renderToast("Oeps!", getErrorMessage(err), "negative");
  }
}

const data = await gatherBrandEssenceData();

function handleInfoCardAnimation(elem, animation = "") {
  let relatedInfoCard;
  let isOpen;

  switch (elem.attr("id")) {
    case "corePurpose":
      relatedInfoCard = purposeInfoCard;
      break;
    case "onlinessStatement":
      relatedInfoCard = onlinessInfoCard;
      break;
    case "trueline":
      relatedInfoCard = truelineInfoCard;
      break;
  }

  switch (animation) {
    case "open":
      isOpen = true;
      break;
    case "close":
      isOpen = false;
      break;
    case "":
      console.warn("No animation target state set");
      break;
  }

  // Animate

  if (relatedInfoCard) {
    const essenceCardId = relatedInfoCard.attr("data-related-to-card");
    const baseY = $(`#${essenceCardId}`).data("baseYPercent");

    gsap
      .timeline({
        onStart: () => {
          isOpen && cards.css("pointerEvents", "none");
        },
        onComplete: () => {
          !isOpen && cards.css("pointerEvents", "auto");
          isOpen
            ? relatedInfoCard.css("pointerEvents", "auto")
            : relatedInfoCard.css("pointerEvents", "none");
        },
      })
      .to(cards, {
        yPercent: isOpen ? -20 : baseY,
        autoAlpha: isOpen ? 0 : 1,
        filter: isOpen ? "blur(5px)" : "blur(0px)",
        overwrite: true,
        stagger: 0.1,
      })
      .fromTo(
        relatedInfoCard,
        {
          yPercent: isOpen ? 100 : 0,
          autoAlpha: isOpen ? 0 : 1,
          filter: isOpen ? "blur(5px)" : "blur(0px)",
        },
        {
          yPercent: isOpen ? 0 : 100,
          autoAlpha: isOpen ? 1 : 0,
          filter: isOpen ? "blur(0px)" : "blur(5px)",
          duration: 1,
        },
        isOpen ? "<0.2" : "<"
      );
  } else {
    return;
  }
}

function procesBrandEssenceData() {
  applyTextBindings($(".brand-essence-info-cards"), {
    // ————
    "core-purpose-sentence": data.corePurpose.purpose,
    "core-purpose-explanation": data.corePurpose.explanation,
    // —————
    "onliness-short": data.onliness.short_statement,
    "onliness-full": data.onliness.full_statement,
    "onliness-what": data.onliness.what,
    "onliness-how": data.onliness.how,
    "onliness-who": data.onliness.who,
    "onliness-where": data.onliness.where,
    "onliness-why": data.onliness.why,
    "onliness-when": data.onliness.when,
    // —————
    "trueline-sentence": data.trueline.trueline,
    "trueline-explanation": data.trueline.explanation,
  });
}

procesBrandEssenceData();

cards.each((__, card) => {
  const $card = $(card);
  const el = card;

  const baseZ = gsap.getProperty(el, "zIndex");
  const baseY = gsap.getProperty(el, "yPercent");
  $card.data("baseZIndex", baseZ);
  $card.data("baseYPercent", baseY);

  const lift = -10;

  function setHover(state) {
    const y0 = $card.data("baseYPercent");
    const z0 = $card.data("baseZIndex");

    gsap.to(el, {
      yPercent: state === "in" ? y0 + lift : y0,
      zIndex: state === "in" ? 5 : z0,
      ease: "back.out",
    });
  }

  $card.off("click.openInfoCard").on("click.openInfoCard", function () {
    handleInfoCardAnimation($(this), "open");
  });

  $card.off("mouseenter.hoverCard").on("mouseenter.hoverCard", function () {
    setHover("in");
  });

  $card.off("mouseleave.hoverCard").on("mouseleave.hoverCard", function () {
    setHover("out");
  });
});

$(".brand-essence-info-card-close-button").each((__, btn) => {
  const $btn = $(btn);

  $btn.off("click.closeInfoCard").on("click.closeInfoCard", function () {
    const relatedCardId = $(this)
      .parents(".brand-essence-info-card-wrapper")
      .attr("data-related-to-card");
    const relatedCardElement = $("#" + relatedCardId);

    handleInfoCardAnimation(relatedCardElement, "close");
  });
});
