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
  getRelationIds,
  onDataChange,
  onClientSelect,
  onPreviewItemEdit,
  setFormData,
  triggerDataChange,
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
const writeCfg = WRITE_CONFIG.typographySystem;

async function gatherTypoSystemData(clientId) {
  try {
    const fontsResponse = await getCollection(
      APPWRITE.databases.typographySystem.id,
      APPWRITE.databases.typographySystem.collections.fonts.id,
      [
        Query.equal("client_id", clientId),
        Query.orderDesc("$updatedAt"),
        Query.select(["*", "fontWeights.*", "typographyRules.*"]),
      ],
    );
    const weightsResponse = await getCollection(
      APPWRITE.databases.typographySystem.id,
      APPWRITE.databases.typographySystem.collections.weights.id,
      [
        Query.equal("client_id", clientId),
        Query.orderDesc("$updatedAt"),
        Query.select(["*", "fonts.*"]),
      ],
    );
    const rulesResponse = await getCollection(
      APPWRITE.databases.typographySystem.id,
      APPWRITE.databases.typographySystem.collections.rules.id,
      [
        Query.equal("client_id", clientId),
        Query.orderDesc("$updatedAt"),
        Query.select(["*", "fonts.*"]),
      ],
    );
    const clientScaleResponse = await getCollection(
      APPWRITE.databases.typographySystem.id,
      APPWRITE.databases.typographySystem.collections.clientTypographyScale.id,
      [
        Query.equal("client_id", clientId),
        Query.orderDesc("$updatedAt"),
        Query.select(["*", "typographyScale.*"]),
      ],
    );

    // Store fetched data for reset/prefill
    return {
      fontsResponse,
      weightsResponse,
      rulesResponse,
      clientScaleResponse,
    };
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
  initialData = await gatherTypoSystemData(clientId);
  console.log("Initial Data: ", initialData);
});

onDataChange(async ({ clientId }) => {
  if (!selectedClientId) return;
  if (clientId && clientId !== selectedClientId) return;
  initialData = await gatherTypoSystemData(selectedClientId);
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
  setButtonState($form.find(".relation-input-wrapper > *"), "disable", false);
  setInitialData(toBeEditedItem.item, toBeEditedItem.formId);
});

function setInitialData(data, formId) {
  // We always work with the most recent document; if none exist, the form stays empty.
  //   data = data.documents[0];

  // Default (empty) values per form section, used when no data exists or when resetting.
  let pairs = {
    fontsForm: {
      fontName: "",
      fontRole: "",
      fontNotes: "",
      fontWeights: "",
      typographyRules: "",
      fontSortOrder: "",
    },
    weightsForm: {
      weightNumber: "",
      weightText: "",
      fontStyle: "",
      fontNotes: "",
      weightSortOrder: "",
      fonts: "",
    },
    rulesForm: {
      letterSpacingPercent: "",
      lineHeightPercent: "",
      fonts: "",
    },
    clientScaleForm: {
      basePx: "",
      typographyScale: "",
    },
  };

  if (data) {
    // Translate DB column names back into form field names (inverse of writeCfg.mapToDb).
    switch (formId) {
      case "fontsForm":
        pairs.fontsForm = {
          fontName: data.name,
          fontRole: data.role,
          fontNotes: data.notes,
          fontWeights: JSON.stringify(getRelationIds(data.fontWeights)),
          typographyRules: JSON.stringify(getRelationIds(data.typographyRules)),
          fontSortOrder: data.sort_order,
        };
        break;
      case "weightsForm":
        pairs.weightsForm = {
          weightNumber: data.weight_num,
          weightText: data.weight_txt,
          fontStyle: data.style,
          fontNotes: data.notes,
          weightSortOrder: data.sort_order,
          fonts: JSON.stringify(getRelationIds(data.fonts)),
        };
        break;
      case "rulesForm":
        pairs.rulesForm = {
          letterSpacingPercent: data.letterspacing_percent,
          lineHeightPercent: data.line_height_percent,
          fonts: JSON.stringify(getRelationIds(data.fonts)),
        };
        break;
      case "clientScaleForm":
        pairs.clientScaleForm = {
          basePx: data.base_px,
          typographyScale: JSON.stringify(getRelationIds(data.typographyScale)),
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

        console.log(
          "Submitted data: ",
          writeCfg[relatedForm].mapToDb(
            submittedData.data,
            selectedClientId,
            {},
            {},
          ),
        );

        if (isEditing && isEditing !== "") {
          console.log("Update document");

          response = await updateDocument({
            databaseId: APPWRITE.databases.typographySystem.id,
            documentId: isEditing,
            collectionId: writeCfg[relatedForm].collectionId,
            data: writeCfg[relatedForm].mapToDb(
              submittedData.data,
              selectedClientId,
              {},
              {},
            ),
          });
        } else {
          console.log("Create document");

          // Block when user wants to create second typography scale
          if (
            relatedForm === "clientScaleForm" &&
            initialData.clientScaleResponse.total > 0
          ) {
            renderToast(
              "Onuitvoerbare actie!",
              "Je kan niet meer dan één typografieschaal toevoegen.",
              "warning",
              3500,
            );
            return;
          }

          response = await createDocument({
            databaseId: APPWRITE.databases.typographySystem.id,
            collectionId: writeCfg[relatedForm].collectionId,
            data: writeCfg[relatedForm].mapToDb(
              submittedData.data,
              selectedClientId,
              {},
              {},
            ),
            permissions: [
              Permission.read(Role.team(teamId)),
              Permission.update(Role.team(teamId)),
              Permission.delete(Role.team(teamId)),
            ],
          });
        }

        if (response) {
          renderToast("Gelukt!", `Typography System is aangepast.`, "positive");
          triggerDataChange({ clientId: selectedClientId });
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
  let sheetTitle = "";
  let labelKeys;
  let secondaryLabelKeys;

  switch (relatedForm) {
    case "fontsForm":
      sheetTitle = "Alle Fonts";
      labelKeys = ["name"];
      secondaryLabelKeys = "role";
      break;
    case "weightsForm":
      sheetTitle = "Alle Stijlen";
      labelKeys = ["weight_txt"];
      secondaryLabelKeys = "style";
      break;
    case "rulesForm":
      sheetTitle = "Font Regels";
      labelKeys = ["letterspacing_percent", "line_height_percent"];
      break;
    case "clientScaleForm":
      sheetTitle = "Typografie schaal";
      labelKeys = ["base_px"];
      secondaryLabelKeys = {
        relation: "typographyScale",
        key: "name",
      };
      break;
  }

  openPreviewSheet({
    sheetTitle: sheetTitle,
    data: initialData[writeCfg[relatedForm].initialDataKey].documents,
    labelKeys: labelKeys,
    secondaryLabelKey: secondaryLabelKeys,
    canRemove: true,
    canEdit: true,
    formId: relatedForm,
  });
});

resetBtn.each((__, btn) => {
  const $btn = $(btn);
  $btn.remove();
});
