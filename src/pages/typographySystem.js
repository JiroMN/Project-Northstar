import { getAspectRatioUtilityClass } from "@mui/joy";
import { checkAuth } from "../appwrite/auth";
import { getTypographyData } from "../appwrite/db";
import { renderToast } from "../ui/toast";
import { applyTextBindings } from "../utils/dataBinding";
import { getErrorMessage } from "../utils/helpers";

await checkAuth();

async function gatherTypographyData() {
  try {
    const response = await getTypographyData();
    return response.documents;
  } catch (err) {
    renderToast("Oeps!", getErrorMessage(err), "negative");
    console.error(err);
  }
}

const typographyData = await gatherTypographyData();

function renderFonts() {
  const $cardTemplate = $("#typographyCardTemplate");
  const $weightTemplate = $("#typographyWeightTemplate");

  $cardTemplate.css("display", "none");
  $weightTemplate.css("display", "none");

  $(typographyData).each((__, font) => {
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
      console.log(weight);

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
          weightCardClone.css("font-style", "italic");
          break;

        case "Underline":
          weightCardClone.css("text-decoration", "underline");
          break;

        case "Italic-underline":
          weightCardClone.css({
            "font-style": "italic",
            "text-decoration": "underline",
          });
          break;
        case "Strike-through":
          weightCardClone.css("text-decoration", "line-through");
          break;
        default:
          console.warn(
            `Unknown font style "${weight.style}" for weight`,
            weight
          );
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
