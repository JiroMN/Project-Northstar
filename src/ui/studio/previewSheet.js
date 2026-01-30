import { removeRow } from "../../appwrite/db";
import { applyTextBindings } from "../../utils/dataBinding";
import { formatDateTime } from "../../utils/helpers";
import { renderModal } from "../modal";

const previewSheetContainer = $(".studio-preview-sheet-container");
const previewSheet = $(".studio-preview-sheet");
const closeButton = $("#closePreviewSheet");
const dataList = $(".studio-preview-sheet-list");
const dataListItemTemplate = $("#previewSheetListItemTemplate");

gsap.set(previewSheetContainer, {
  display: "flex",
  autoAlpha: 0,
  pointerEvents: "none",
});

function renderDataInSheet(
  data,
  labelKeys,
  secondaryLabelKey = {
    relation: "",
    key: "",
  },
) {
  const $data = $(data);

  $data.each((__, item) => {
    const clone = dataListItemTemplate.clone(true);
    clone
      .attr("id", "")
      .css("display", "flex")
      .appendTo(dataList)
      .attr("data-row-id", item.$id);

    const primaryLabel = labelKeys
      .map((key) => item[key])
      .filter((val) => val !== undefined && val !== null && val !== "")
      .join(" ");

    applyTextBindings(clone, {
      "primary-label": primaryLabel,
      "secondary-label": `${secondaryLabelKey.relation}: ${item[secondaryLabelKey.relation][secondaryLabelKey.key]}  •  ${formatDateTime(item.$updatedAt)}`,
    });

    clone
      .find(".studio-preview-sheet-list-item-button")
      .off("click.removeItem")
      .on("click.removeItem", function () {
        renderModal(
          "Weet je het zeker?",
          `Je wilt ${primaryLabel} verwijderen. Deze actie kan niet worden teruggedraaid.`,
          "Annuleer",
          "Verwijder",
          async () =>
            await removeRow(item.$databaseId, item.$collectionId, item.$id),
        );
      });
  });
}

export function openPreviewSheet(
  sheetTitle,
  data,
  labelKeys,
  secondaryLabelKey,
) {
  renderDataInSheet(data, labelKeys, secondaryLabelKey);

  applyTextBindings(previewSheet, {
    "preview-sheet-title": sheetTitle,
  });

  gsap
    .timeline()
    .to(previewSheetContainer, {
      autoAlpha: 1,
      pointerEvents: "auto",
    })
    .fromTo(
      previewSheet,
      {
        xPercent: 100,
        autoAlpha: 0,
        filter: "blur(5px)",
      },
      {
        xPercent: 0,
        autoAlpha: 1,
        filter: "blur(0px)",
      },
      "<50%",
    );
}

function closePreviewSheet() {
  gsap
    .timeline()
    .to(previewSheet, {
      xPercent: 100,
      autoAlpha: 0,
      filter: "blur(5px)",
    })
    .to(
      previewSheetContainer,
      {
        autoAlpha: 0,
        pointerEvents: "none",
      },
      "<50%",
    );
}

closeButton.off("click.closeSheet").on("click.closeSheet", function () {
  closePreviewSheet();
});
