import { setButtonState } from "../../animations/global/buttons";
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
  canEdit,
  formId,
}) {
  const $data = $(data);

  dataList.children().not(dataListItemTemplate).remove();

  function resolveLabelValue(item, keyDef) {
    if (!keyDef) return "";

    if (typeof keyDef === "string") {
      return item[keyDef] ?? "";
    }

    if (typeof keyDef === "object") {
      const relation = keyDef.relation;
      const key = keyDef.key;
      const join = keyDef.join ?? ", ";

      if (!relation || !key || !item[relation]) return "";

      if (Array.isArray(item[relation])) {
        return item[relation]
          .map((row) => row?.[key])
          .filter((val) => val !== undefined && val !== null && val !== "")
          .join(join);
      }

      if (typeof item[relation] === "object") {
        return item[relation][key] ?? "";
      }
    }

    return "";
  }

  if (!$data || $data.length < 1) {
    dataList.html(
      "<p class='sm fg-50 text-align-center'>Er is nog geen data</p>",
    );
  }
  let lastGroupKey = null;

  $data.each((__, item) => {
    const clone = dataListItemTemplate.clone(true);
    clone.attr("id", "").css("display", "flex").attr("data-row-id", item.$id);

    const primaryLabel = labelKeys
      .map((keyDef) => resolveLabelValue(item, keyDef))
      .filter((val) => val !== undefined && val !== null && val !== "")
      .join(" ");

    let secondaryLabel = "";
    let groupLabel = "";

    // Secondary label can be:
    // - "" (date only)
    // - a direct key string (e.g. "collab_start")
    // - a relationship descriptor: { relation, key, join? }
    if (typeof secondaryLabelKey === "string") {
      if (secondaryLabelKey === "") {
        secondaryLabel = `${formatDateTime(item.$updatedAt)}`;
      } else {
        secondaryLabel = `${formatDateTime(item.$updatedAt)}  •  ${item[secondaryLabelKey]}`;
      }
    } else if (secondaryLabelKey && typeof secondaryLabelKey === "object") {
      const resolved = resolveLabelValue(item, secondaryLabelKey);
      secondaryLabel =
        resolved !== ""
          ? `${formatDateTime(item.$updatedAt)}  •  ${resolved}`
          : `${formatDateTime(item.$updatedAt)}`;
      groupLabel = resolved !== "" ? resolved : "Onbekend";
    }

    if (groupLabel && groupLabel !== lastGroupKey) {
      lastGroupKey = groupLabel;
      const $groupHeading = $(
        `<h2 class="studio-preview-sheet-list-group-title sm fg-50">[${secondaryLabelKey.relation}] ${groupLabel}</h2>`,
      );
      $groupHeading.appendTo(dataList);
    }

    clone.appendTo(dataList);

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
              if (previewSheet.attr("data-disabled") === "true") return;
              setButtonState(previewSheet, "loading", false);
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
                setButtonState($(previewSheet), "enable", true);
              }
            },
          );
        });
    } else {
      clone.find(".studio-preview-sheet-list-item-button.remove").remove();
    }
    if (canEdit) {
      clone
        .find(".studio-preview-sheet-list-item-button.edit")
        .off("click.editItem")
        .on("click.editItem", async function () {
          $(document).trigger("preview:itemEdit", [
            { item, formId, primaryLabel },
          ]);
          closePreviewSheet();
        });
    } else {
      clone.find(".studio-preview-sheet-list-item-button.edit").remove();
    }
  });
}

/**
 * @param {string} params.sheetTitle - Title that shows on top
 * @param {object[]} params.data - Data records that get rendered in the list
 * @param {(string|object)[]} params.labelKeys - Primary label resolvers.
 *  - Top-level keys: ["name", "tone"]
 *  - Relation (single): [{ relation: "company", key: "name" }]
 *  - Relation (array): [{ relation: "toVTraits", key: "name", join: " • " }]
 * @param {string|object} params.secondaryLabelKey - Optional secondary resolver.
 *  - "" renders updated date only
 *  - "description" reads a top-level value
 *  - { relation, key, join? } reads relation data (also supports relation arrays)
 * @param {boolean} params.canRemove - Shows remove button based on value
 * **/

export function openPreviewSheet({
  sheetTitle,
  data,
  labelKeys,
  secondaryLabelKey,
  canRemove = true,
  alternativeRemovalFunction,
  canEdit,
  formId,
}) {
  console.log(`Opening sheet ${data?.length ?? 0}`);
  const selectedClientId = $("body").attr("data-selected-client-id");
  if (!selectedClientId || selectedClientId === "") {
    renderToast("Onvolledig!", "Selecteer een bedrijf", "warning");
    return;
  }
  if (!data || data.length < 1) {
    renderToast("Ik mis wat!", "Er is nog geen data.", "warning");
    return;
  }

  renderDataInSheet({
    data,
    labelKeys,
    secondaryLabelKey,
    canRemove,
    alternativeRemovalFunction,
    canEdit,
    formId,
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
