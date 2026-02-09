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

// Configuration mapping form IDs to database collections and data mapping functions
const writeCfg = WRITE_CONFIG.logoSystem;
const uploadPlan = UPLOAD_PLAN.logoSystem;

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

    const removePngRes = await removeFile(
      APPWRITE.buckets.logos.id,
      doc.png_file_id,
    );
    const removeSvgRes = await removeFile(
      APPWRITE.buckets.logos.id,
      doc.svg_file_id,
    );
    const docRemoveRes = await removeRow(
      APPWRITE.databases.logoSystem.id,
      APPWRITE.databases.logoSystem.collections.variants.id,
      doc.$id,
    );

    if (removePngRes && removeSvgRes && docRemoveRes) {
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

  /* 
TODO:
1. Set initialData() (need to know formId based on payload)
2. Create function to manually set relationSelector through code or disable selector
3. Create update logic in submitBtn handler
*/
  setInitialData(toBeEditedItem);
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
          logoSets: data.logoSet,
          logoVariant: data.variant_name,
          logoSetPreviewBg: data.preview_bg_hex,
          logoVariantSortingOrder: data.sort_order,
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
  try {
    renderModal(
      "Weet je het zeker?",
      "Je gaat iets aanpassen dat niet terug gedraaid kan worden.",
      "Annuleer",
      "Ga Door",
      async () => {
        if (!selectedClientId || selectedClientId == "") {
          renderToast("Onvolledig!", "Selecteer een bedrijf", "warning");
          return;
        }

        if ($(this).attr("data-disable") === "true") return;
        setButtonState($(this), "loading", false);

        const relatedForm = $(this).attr("data-related-form");
        const form = $(`#${relatedForm}`);

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
            "",
          ),
        );

        response = await createDocument({
          databaseId: APPWRITE.databases.logoSystem.id,
          collectionId: writeCfg[relatedForm].collectionId,
          data: writeCfg[relatedForm].mapToDb(
            submittedData.data,
            selectedClientId,
            uploadedIds,
            {
              logoVariantPngVariant:
                initialData.logoVariantResponse.png_file_id,
              logoVariantSvgVariant:
                initialData.logoVariantResponse.svg_file_id,
            },
          ),
          permissions: [
            Permission.read(Role.team(teamId)),
            Permission.update(Role.team(teamId)),
            Permission.delete(Role.team(teamId)),
          ],
        });

        if (response) {
          renderToast("Gelukt!", `Logo System is aangepast.`, "positive");
        }
      },
    );
  } catch (err) {
    console.error(err);
    renderToast("Oeps!", getErrorMessage(err), "negative");
  } finally {
    setButtonState($(this), "enable", true);
  }
});

showDataBtn.off("click.showData").on("click.showData", function () {
  const relatedForm = $(this).attr("data-related-form");
  console.log(writeCfg[relatedForm], relatedForm);
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
  });
});

resetBtn.each((__, btn) => {
  const $btn = $(btn);

  // Reset restores the form back to the last fetched state for the currently selected client.
  $btn.off("click.reset").on("click.reset", function () {
    const relatedForm = $(this).attr("data-related-form");

    setInitialData(
      initialData[writeCfg[relatedForm].initialDataKey],
      relatedForm,
    );
  });
});
