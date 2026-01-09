import { Query } from "appwrite";
import { checkAuth } from "../appwrite/auth";
import { getClientId, getCollection } from "../appwrite/db";
import APPWRITE from "../config/public";
import { applyTextBindings } from "../utils/dataBinding";
import {
  copyToClipboard,
  formatColorFormats,
  isLightHexColor,
} from "../utils/helpers";
import { withLoader } from "../ui/loader";

await checkAuth();

// Set base states
gsap.set($(".color-token-card").find(".color-format"), {
  yPercent: -50,
  autoAlpha: 0,
});
gsap.set($(".color-token-card").find(".color-token-card-top-icon"), {
  autoAlpha: 0,
});

async function gatherColorInformation() {
  try {
    const clientId = await getClientId();
    const res = await getCollection(
      APPWRITE.databases.colorSystem.id,
      APPWRITE.databases.colorSystem.collections.palettes.id,
      [Query.equal("client_id", clientId), Query.select(["*", "colorTokens.*"])]
    );
    return res.documents;
  } catch (err) {
    console.error(err);
  }
}

let colorData = await withLoader(gatherColorInformation());

function convertColorCodes() {
  $(colorData).each((__, color) => {
    $(color.colorTokens).each((__, token) => {
      const formatted = formatColorFormats({
        hex: token.hex,
        rgba: token.rgba,
        hsl: token.hsl,
        cmyk: token.cmyk,
      });

      token.hex = formatted.hex;
      token.rgba = formatted.rgba;
      token.hsl = formatted.hsl;
      token.cmyk = formatted.cmyk;
    });
  });
}

convertColorCodes();

function renderColorComponents() {
  const palettesWrapper = $(".color-palettes-wrapper");

  const $paletteTemplate = $("#color-palette-template");
  const $tokenTemplate = $("#color-token-card-template");

  // Make sure templates are hidden
  $paletteTemplate.css("display", "none");
  $tokenTemplate.css("display", "none");

  $(colorData).each((__, palette) => {
    const paletteCopy = $paletteTemplate.clone(true);

    paletteCopy.css("display", "flex");
    paletteCopy.attr("id", "");

    paletteCopy.appendTo(palettesWrapper);

    applyTextBindings(paletteCopy, {
      "section-divider-title": palette.title,
    });

    $(palette.colorTokens).each((__, token) => {
      const tokenCopy = $tokenTemplate.clone(true);

      const lightFg = "white";
      const darkFg = "black";

      tokenCopy.css("display", "flex");
      tokenCopy.attr("id", "");

      tokenCopy.css("backgroundColor", token.hex);
      if (isLightHexColor(token.hex)) {
        tokenCopy.attr("data-isLightHexColor", "true");
        tokenCopy.css("color", darkFg);
      } else {
        tokenCopy.attr("data-isLightHexColor", "false");
        tokenCopy.css("color", lightFg);
      }

      tokenCopy.appendTo(paletteCopy.find(".color-token-grid"));

      tokenCopy.attr("data-copy-hex", token.hex);
      tokenCopy.attr("data-copy-rgba", token.rgba);
      tokenCopy.attr("data-copy-hsl", token.hsl);
      tokenCopy.attr("data-copy-cmyk", token.cmyk);

      applyTextBindings(tokenCopy, {
        "token-name": `${token.title} ${token.tone ? token.tone : ""}`,
        hex: token.hex,
        rgba: token.rgba,
        hsl: token.hsl,
        cmyk: token.cmyk,
      });
    });
  });
}

renderColorComponents();

$(".color-token-card").each((__, card) => {
  const $card = $(card);

  $card.off("mouseenter.hoverToken").on("mouseenter.hoverToken", function () {
    gsap
      .timeline()
      // Color Formats
      .to($card.find(".color-format"), {
        yPercent: 0,
        autoAlpha: 1,
        stagger: 0.05,
      })
      // Copy Icon
      .to(
        $card.find(".color-token-card-top-icon"),
        {
          autoAlpha: 1,
        },
        "<"
      );
  });

  $card.off("mouseleave.hoverToken").on("mouseleave.hoverToken", function () {
    gsap
      .timeline()
      .to($card.find(".color-format"), {
        yPercent: -50,
        autoAlpha: 0,
        stagger: 0.05,
      })
      .to(
        $card.find(".color-token-card-top-icon"),
        {
          autoAlpha: 0,
        },
        "<"
      );
  });
});

$(".color-token-card").each((__, card) => {
  const $card = $(card);

  $card.off("click.clickToken").on("click.clickToken", function (e) {
    if ($(e.target).closest(".color-format").length) return;

    copyToClipboard(
      $card.attr("data-copy-hex"),
      `Je hebt de kleur '${$card
        .find("[data-bind='token-name']")
        .text()}' gekopieerd.`
    );
  });

  const colorFormat = $card.find(".color-format");

  colorFormat.each((__, format) => {
    const $format = $(format);

    const isLightHexColor = $card.attr("data-isLightHexColor") === "true";
    const dynamicBorderColor = isLightHexColor ? "black" : "white";

    $format
      .off("mouseenter.hoverFormat")
      .on("mouseenter.hoverFormat", function () {
        gsap.timeline().fromTo(
          $format,
          {
            borderColor: "transparent",
          },
          {
            borderColor: dynamicBorderColor,
          },
          "<"
        );
      });
    $format
      .off("mouseleave.hoverFormat")
      .on("mouseleave.hoverFormat", function () {
        gsap.timeline().fromTo(
          $format,
          {
            borderColor: dynamicBorderColor,
          },
          {
            borderColor: "transparent",
          },
          "<"
        );
      });

    $format.off("click.clickFormat").on("click.clickFormat", function (e) {
      // Prevent bubbling to card click
      e.stopPropagation();

      switch ($format.attr("data-bind")) {
        case "hex":
          copyToClipboard(
            $card.attr("data-copy-hex"),
            "Hex kleur is gekopieerd."
          );
          break;
        case "rgba":
          copyToClipboard(
            $card.attr("data-copy-rgba"),
            "RGBA kleur is gekopieerd."
          );
          break;
        case "hsl":
          copyToClipboard(
            $card.attr("data-copy-hsl"),
            "HSL kleur is gekopieerd."
          );
          break;
        case "cmyk":
          copyToClipboard(
            $card.attr("data-copy-cmyk"),
            "CMYK kleur is gekopieerd."
          );
          break;
        default:
          break;
      }
    });
  });
});
