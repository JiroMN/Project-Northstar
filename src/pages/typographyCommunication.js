import { checkAuth } from "../appwrite/auth";
import { getTypographyCommuncationData } from "../appwrite/db";
import { withLoader } from "../ui/loader";
import { renderToast } from "../ui/toast";
import { applyTextBindings } from "../utils/dataBinding";
import { getErrorMessage, getCssValueFromVarName } from "../utils/helpers";

await checkAuth();

async function gatherCommuncationData() {
  try {
    const res = await getTypographyCommuncationData();
    return res;
  } catch (err) {
    console.error(err);
    renderToast("Oeps!", getErrorMessage(err), "negative");
  }
}

const comData = await withLoader(gatherCommuncationData());

function renderTraits() {
  const $traitCardTemplate = $("#typographyCommunicationCardTemplate");
  $traitCardTemplate.css("display", "none");
  $(comData.traits).each((__, trait) => {
    const traitCardClone = $traitCardTemplate.clone(true);

    traitCardClone.css("display", "flex");
    traitCardClone.attr("id", "");

    traitCardClone.appendTo(".communication-bento-grid");

    applyTextBindings(traitCardClone, {
      "trait-title": trait.name,
      "trait-description": trait.description,
    });
  });
}

renderTraits();

function groupExamplesByTraitSet(records) {
  const groups = {};

  records.forEach((rec) => {
    const traits = rec.toVTraits || [];

    const traitIds = traits
      .map((t) => t.$id)
      .filter(Boolean)
      .sort();

    const key = traitIds.join("|"); // combinatie-key

    if (!groups[key]) {
      groups[key] = {
        key,
        traits, // je kunt ook traits sorteren als je wil
        items: [], // hier komen de examples
      };
    }

    groups[key].items.push({
      link: rec, // originele koppeltabel record
      example: rec.toVExample, // het voorbeeldobject
      text: rec.toVExample?.example ?? "",
    });
  });

  return Object.values(groups);
}

const groupedExamples = groupExamplesByTraitSet(comData.examples);

function renderExamples() {
  const $exampleCardTemplate = $("#typographyCommunicationExampleCardTemplate");
  const $traitBadgeTemplate = $("#exampleTraitBadge");
  const $exampleListItemTemplate = $("#exampleListItemTemplate");

  $exampleCardTemplate.css("display", "none");
  $traitBadgeTemplate.css("display", "none");
  $exampleListItemTemplate.css("display", "none");

  $(groupedExamples).each((__, group) => {
    const exampleCardClone = $exampleCardTemplate.clone(true);

    exampleCardClone.css("display", "flex");
    exampleCardClone.attr("id", "");

    exampleCardClone.appendTo(".communication-example-grid");

    $(group.items).each((__, example) => {
      const exampleListItemClone = $exampleListItemTemplate.clone(true);

      exampleListItemClone.css("display", "flex");
      exampleListItemClone.attr("id", "");

      exampleListItemClone.appendTo(
        exampleCardClone.find(".communication-example-card-examples-list")
      );

      applyTextBindings(exampleListItemClone, {
        example: example.text,
      });
    });

    $(group.traits).each((__, trait) => {
      const traitBadgeClone = $traitBadgeTemplate.clone(true);

      traitBadgeClone.css("display", "flex");
      traitBadgeClone.attr("id", "");
      traitBadgeClone.appendTo(
        exampleCardClone.find(".communication-example-card-badge-container")
      );

      applyTextBindings(traitBadgeClone, {
        "trait-badge": trait.name,
      });
    });
  });
}

renderExamples();

function applyRandomBentoWidths({
  selector = ".communication-bento-grid-card",
  baseMinWidth = 300,
  widthOptions = [420, 480, 560],
  chance = 0.35,
} = {}) {
  const cards = document.querySelectorAll(selector);

  cards.forEach((card) => {
    // reset eerst
    card.style.minWidth = `${baseMinWidth}px`;

    // bepaal of deze card breder mag worden
    if (Math.random() < chance) {
      const randomWidth =
        widthOptions[Math.floor(Math.random() * widthOptions.length)];
      card.style.minWidth = `${randomWidth}px`;
    }
  });
}
applyRandomBentoWidths();

// Hover listeners
const comBentoCard = $(".communication-bento-grid-card");
const targetBg = getCssValueFromVarName(
  "var(--_all-colors---light--background)"
);
const originalBg = comBentoCard.css("background-color");
const targetFg = getCssValueFromVarName(
  "var(--_all-colors---light--foreground)"
);
const targetFg75 = getCssValueFromVarName(
  "var(--_all-colors---light--foreground)"
);
const originalFgH1 = comBentoCard.find("h1").css("color");
const originalFgP = comBentoCard.find("p").css("color");

comBentoCard.each((__, card) => {
  const $card = $(card);

  $card
    .off("mouseenter.hoverTraitCard")
    .on("mouseenter.hoverTraitCard", function () {
      gsap
        .timeline()
        .to($card, { background: targetBg })
        .to($card.find("h1"), { color: targetFg }, "<")
        .to($card.find("p"), { color: targetFg75 }, "<");
    });
  $card
    .off("mouseleave.hoverTraitCard")
    .on("mouseleave.hoverTraitCard", function () {
      gsap
        .timeline()
        .to($card, { background: originalBg })
        .to($card.find("h1"), { color: originalFgH1 }, "<")
        .to($card.find("p"), { color: originalFgP }, "<");
    });
});
