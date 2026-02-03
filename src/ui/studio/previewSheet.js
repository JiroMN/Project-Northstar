import { disappearToRight } from "../../animations/helpers/micro";
import { removeRow } from "../../appwrite/db";
import { applyTextBindings } from "../../utils/dataBinding";
import { formatDateTime } from "../../utils/helpers";
import { renderModal } from "../modal";
import { renderToast } from "../toast";

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

function renderDataInSheet({
  data,
  labelKeys = [],
  secondaryLabelKey = "",
  canRemove,
  alternativeRemovalFunction,
}) {
  const $data = $(data);

  dataList.children().not(dataListItemTemplate).remove();

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

    let secondaryLabel = "";

    // Secondary label can be:
    // - "" (disabled)
    // - a direct key string (e.g. "collab_start")
    // - a relationship descriptor: { relation: "company", key: "name" }
    if (typeof secondaryLabelKey === "string") {
      if (secondaryLabelKey === "") {
        secondaryLabel = `${formatDateTime(item.$updatedAt)}`;
      } else {
        secondaryLabel = `${item[secondaryLabelKey]}  •  ${formatDateTime(item.$updatedAt)}`;
      }
    } else if (secondaryLabelKey && typeof secondaryLabelKey === "object") {
      const relation = secondaryLabelKey.relation;
      const key = secondaryLabelKey.key;

      if (relation && key && item[relation]) {
        secondaryLabel = `${relation}: ${item[relation][key]}  •  ${formatDateTime(item.$updatedAt)}`;
      }
    }

    applyTextBindings(clone, {
      "primary-label": primaryLabel,
      "secondary-label": secondaryLabel,
    });

    if (canRemove) {
      clone
        .find(".studio-preview-sheet-list-item-button.remove")
        .off("click.removeItem")
        .on("click.removeItem", function () {
          renderModal(
            "Weet je het zeker?",
            `Je wilt ${primaryLabel} verwijderen. Deze actie kan niet worden teruggedraaid.`,
            "Annuleer",
            "Verwijder",
            async () => {
              let response;
              if (alternativeRemovalFunction) {
                response = await alternativeRemovalFunction(item.$id);
              } else {
                response = await removeRow(
                  item.$databaseId,
                  item.$collectionId,
                  item.$id,
                );
              }
              if (response) {
                renderToast(
                  "Gelukt!",
                  `${primaryLabel} is verwijderd.`,
                  "positive",
                );
                clone.remove();
              }
            },
          );
        });
    } else {
      clone.find(".studio-preview-sheet-list-item-button.remove").remove();
    }
  });
}
/**
 * @param {string} params.sheetTitle - Title that shows on top
 * @param {object} params.data - Title that shows on top
 * @param {array} params.labelKeys - Array of key name inside of data param. This decides what labels get shown
 * @param {string|object} params.secondaryLabelKey - Optional. Either a direct key string (e.g. "collab_start"), a relationship descriptor { relation, key }, or "" to disable.
 * @param {boolean} params.canRemove - Shows remove button based on value
 * **/
export function openPreviewSheet({
  sheetTitle,
  data,
  labelKeys,
  secondaryLabelKey,
  canRemove = true,
  alternativeRemovalFunction,
}) {
  renderDataInSheet({
    data,
    labelKeys,
    secondaryLabelKey,
    canRemove,
    alternativeRemovalFunction,
  });

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
