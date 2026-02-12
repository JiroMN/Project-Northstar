import { Permission, Query, Role } from "appwrite";
import {
  createDocument,
  getClientById,
  getCollection,
  removeRow,
  updateDocument,
} from "../../appwrite/db";
import APPWRITE from "../../config/public";
import { openPreviewSheet } from "../../ui/studio/previewSheet";
import {
  gatherFormData,
  onClientSelect,
  onPreviewItemEdit,
  setFormData,
  uploadFilesFromForm,
} from "../../utils/studioHelpers";
import { renderToast } from "../../ui/toast";
import { renderModal } from "../../ui/modal";
import { getErrorMessage } from "../../utils/helpers";
import { setButtonState } from "../../animations/global/buttons";
import { UPLOAD_PLAN, WRITE_CONFIG } from "../../config/studio";
import { removeFile } from "../../appwrite/storage";

const submitBtn = $("[id='submitForm']");
const resetBtn = $("[id='resetForm']");
const showDataBtn = $("[id='showData']");

let selectedClientId;
let initialData;
let submittedData = {};
let existingAttachmentIds = {};

// Configuration mapping form IDs to database collections and data mapping functions
const writeCfg = WRITE_CONFIG.logoSystem;
const uploadPlan = UPLOAD_PLAN.logoSystem;

async function removeLogoFiles({ pngFileId = "", svgFileId = "" }) {
  try {
    const removePngRes =
      pngFileId !== "" &&
      (await removeFile(APPWRITE.buckets.logos.id, pngFileId));
    const removeSvgRes =
      svgFileId !== "" &&
      (await removeFile(APPWRITE.buckets.logos.id, svgFileId));

    if (removePngRes || removeSvgRes) {
      return true;
    } else {
      renderToast(
        "Oeps!",
        "Het is (deels) niet gelukt om de bestanden te verwijderen.",
      );
      return false;
    }
  } catch (err) {
    console.error(err);
    renderToast("Oeps!", getErrorMessage(err), "negative");
  }
}

async function removeLogoVariant(docId) {
  try {
    // Get the matching variant document from the cached initialData
    const doc = initialData.logoVariantResponse.documents.find(
      (d) => d.$id === docId,
    );

    if (!doc) {
      renderToast("Oeps!", "Kon de logo variant niet vinden.", "negative");
      return;
    }

    const removeFiles = await removeLogoFiles({
      pngFileId: doc.png_file_id,
      svgFileId: doc.svg_file_id,
    });

    const docRemoveRes = await removeRow(
      APPWRITE.databases.logoSystem.id,
      APPWRITE.databases.logoSystem.collections.variants.id,
      doc.$id,
    );

    if (removeFiles && docRemoveRes) {
      // Remove the deleted variant from the cached list so the UI stays in sync
      initialData.logoVariantResponse.documents =
        initialData.logoVariantResponse.documents.filter(
          (d) => d.$id !== docId,
        );

      return true;
    } else {
      renderToast(
        "Oeps!",
        "Het is (deels) mislukt om de logo variant te verwijderen.",
        "negative",
      );
      return;
    }
  } catch (err) {
    console.error(err);
    renderToast("Oeps!", getErrorMessage(err), "negative");
  }
}

async function gatherLogoSystemData(clientId) {
  try {
    const logoSetResponse = await getCollection(
      APPWRITE.databases.logoSystem.id,
      APPWRITE.databases.logoSystem.collections.sets.id,
      [Query.equal("client_id", clientId), Query.orderDesc("$updatedAt")],
    );
    const logoVariantResponse = await getCollection(
      APPWRITE.databases.logoSystem.id,
      APPWRITE.databases.logoSystem.collections.variants.id,
      [
        Query.equal("client_id", clientId),
        Query.select(["*", "logoSet.title"]),
        Query.orderDesc("$updatedAt"),
      ],
    );

    // Store fetched data for reset/prefill
    return { logoSetResponse, logoVariantResponse };
  } catch (err) {
    console.error(err);
    renderToast(
      "Oeps!",
      "Er is iets mis gegaan met het ophalen van de bedrijfsinformatie.",
      "negative",
    );
  }
}

onClientSelect(async (clientId) => {
  selectedClientId = clientId;
  initialData = await gatherLogoSystemData(clientId);
  console.log(initialData);
});

onPreviewItemEdit((toBeEditedItem) => {
  console.log("I got this from the callback: ", toBeEditedItem);

  const $form = $(`#${toBeEditedItem.formId}`);
  const $cardTitle = $form
    .closest(".studio-card")
    .find(".studio-card-text")
    .find("h1")
    .first();

  $form.attr("data-is-editing", toBeEditedItem.item.$id);
  $cardTitle.find("span").remove();
  $cardTitle.append(
    `<span class='fg-50'> • ${toBeEditedItem.primaryLabel} wordt aangepast</span>`,
  );
  setButtonState($(".relation-input-wrapper > *"), "disable", false);
  setInitialData(toBeEditedItem.item, toBeEditedItem.formId);
});

function setInitialData(data, formId) {
  // We always work with the most recent document; if none exist, the form stays empty.
  //   data = data.documents[0];

  // Default (empty) values per form section, used when no data exists or when resetting.
  let pairs = {
    logoSetForm: {
      logoSetTitle: "",
      logoSetDescription: "",
      logoSetSortingOrder: "",
    },
    logoVariantForm: {
      logoSets: "",
      logoVariant: "",
      logoSetPreviewBg: "",
      logoVariantSortingOrder: "",
    },
  };

  if (data) {
    // Translate DB column names back into form field names (inverse of writeCfg.mapToDb).
    switch (formId) {
      case "logoSetForm":
        pairs.logoSetForm = {
          logoSetTitle: data.title,
          logoSetDescription: data.notes,
          logoSetSortingOrder: data.sort_order,
        };
        break;
      case "logoVariantForm":
        pairs.logoVariantForm = {
          logoSets: data.logoSet.$id,
          logoVariant: data.variant_name,
          logoSetPreviewBg: data.preview_bg_hex,
          logoVariantSortingOrder: data.sort_order,
        };
        existingAttachmentIds = {
          logoVariantPngVariant: data.png_file_id,
          logoVariantSvgVariant: data.svg_file_id,
        };
        break;
    }
  } else {
    // Empty
    Object.keys(pairs[formId]).forEach((column) => {
      pairs[formId][column] = "";
    });
  }

  // Push the resolved values into the correct form fields in the DOM.
  setFormData($(`#${formId}`), pairs[formId]);
}

submitBtn.off("click.submit").on("click.submit", function (e) {
  e.preventDefault();
  renderModal(
    "Weet je het zeker?",
    "Je gaat iets aanpassen dat niet terug gedraaid kan worden.",
    "Annuleer",
    "Ga Door",
    async () => {
      try {
        if (!selectedClientId || selectedClientId == "") {
          renderToast("Onvolledig!", "Selecteer een bedrijf", "warning");
          return;
        }

        if ($(this).attr("data-disable") === "true") return;
        setButtonState($(this), "loading", false);

        const relatedForm = $(this).attr("data-related-form");
        const form = $(`#${relatedForm}`);
        const isEditing = form.attr("data-is-editing");

        // Collect current form values; text inputs go to `data`, file inputs to `files`.
        submittedData = gatherFormData(form);

        let response;

        const clientData = await getClientById(selectedClientId);
        const teamId = clientData.auth.$id;

        // Create a new document and assign team-based permissions so the client team owns the data.
        let uploadedIds = {};

        if (relatedForm === "logoVariantForm") {
          uploadedIds = await uploadFilesFromForm(
            submittedData.files,
            teamId,
            uploadPlan,
          );
          console.log("Uploaded Files: ", uploadedIds);
        }

        console.log(
          "Submitted data: ",
          writeCfg[relatedForm].mapToDb(
            submittedData.data,
            selectedClientId,
            uploadedIds,
            {
              logoVariantPngVariant:
                existingAttachmentIds.logoVariantPngVariant,
              logoVariantSvgVariant:
                existingAttachmentIds.logoVariantSvgVariant,
            },
          ),
        );

        if (isEditing && isEditing !== "") {
          console.log("Update document");

          // If new files were uploaded during edit, remove the previous files first.
          // Only remove a file type if a replacement was uploaded.
          if (relatedForm === "logoVariantForm") {
            const toRemove = {};

            if (
              uploadedIds.logoVariantPngVariant &&
              existingAttachmentIds.logoVariantPngVariant
            ) {
              toRemove.pngFileId = existingAttachmentIds.logoVariantPngVariant;
            }

            if (
              uploadedIds.logoVariantSvgVariant &&
              existingAttachmentIds.logoVariantSvgVariant
            ) {
              toRemove.svgFileId = existingAttachmentIds.logoVariantSvgVariant;
            }

            if (toRemove.pngFileId || toRemove.svgFileId) {
              const removed = await removeLogoFiles(toRemove);
              if (!removed) {
                // Stop the update if we couldn't clean up the old assets.
                setButtonState($(this), "enable", true);
                return;
              }
            }
          }

          response = await updateDocument({
            databaseId: APPWRITE.databases.logoSystem.id,
            documentId: isEditing,
            collectionId: writeCfg[relatedForm].collectionId,
            data: writeCfg[relatedForm].mapToDb(
              submittedData.data,
              selectedClientId,
              uploadedIds,
              {
                logoVariantPngVariant:
                  existingAttachmentIds.logoVariantPngVariant,
                logoVariantSvgVariant:
                  existingAttachmentIds.logoVariantSvgVariant,
              },
            ),
          });
        } else {
          console.log("Create document");
          response = await createDocument({
            databaseId: APPWRITE.databases.logoSystem.id,
            collectionId: writeCfg[relatedForm].collectionId,
            data: writeCfg[relatedForm].mapToDb(
              submittedData.data,
              selectedClientId,
              uploadedIds,
              {
                logoVariantPngVariant:
                  existingAttachmentIds.logoVariantPngVariant,
                logoVariantSvgVariant:
                  existingAttachmentIds.logoVariantSvgVariant,
              },
            ),
            permissions: [
              Permission.read(Role.team(teamId)),
              Permission.update(Role.team(teamId)),
              Permission.delete(Role.team(teamId)),
            ],
          });
        }

        if (response) {
          renderToast("Gelukt!", `Logo System is aangepast.`, "positive");
          setButtonState($(this), "enable", true);
        }
      } catch (err) {
        console.error(err);
        renderToast("Oeps!", getErrorMessage(err), "negative");
      } finally {
        setButtonState($(this), "enable", true);
      }
    },
  );
});

showDataBtn.off("click.showData").on("click.showData", function () {
  if (!selectedClientId || selectedClientId == "") {
    renderToast("Onvolledig!", "Selecteer een bedrijf", "warning");
    return;
  }
  const relatedForm = $(this).attr("data-related-form");

  const labelKeys =
    relatedForm === "logoVariantForm" ? ["variant_name"] : ["title"];
  const secondaryLabelKeys =
    relatedForm === "logoVariantForm"
      ? {
          relation: "logoSet",
          key: "title",
        }
      : "";
  openPreviewSheet({
    sheetTitle: "Logo System",
    data: initialData[writeCfg[relatedForm].initialDataKey].documents,
    labelKeys: labelKeys,
    secondaryLabelKey: secondaryLabelKeys,
    canRemove: true,
    alternativeRemovalFunction: removeLogoVariant,
    canEdit: true,
    formId: relatedForm,
  });
});

resetBtn.each((__, btn) => {
  const $btn = $(btn);
  $btn.remove();
});
