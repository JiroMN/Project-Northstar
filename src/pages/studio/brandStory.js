import { Permission, Query, Role } from "appwrite";
import {
  createDocument,
  getClientById,
  getCollection,
  updateDocument,
} from "../../appwrite/db";
import APPWRITE from "../../config/public";
import {
  gatherFormData,
  getUploadTargetsFromForm,
  onClientSelect,
  setFormData,
  uploadFilesFromForm,
} from "../../utils/studioHelpers";
import { renderToast } from "../../ui/toast";
import { renderModal } from "../../ui/modal";
import { getErrorMessage } from "../../utils/helpers";
import { setButtonState } from "../../animations/global/buttons";
import { WRITE_CONFIG, UPLOAD_PLAN } from "../../config/studio";
import { removeFile } from "../../appwrite/storage";

// Webflow duplicates IDs across repeated cards; selecting by attribute ensures we target all matching buttons.
const submitBtn = $("[id='submitForm']");
const resetBtn = $("[id='resetForm']");
const showDataBtn = $("[id='showData']");

// Configuration mapping form IDs to database collections and data mapping functions
const writeCfg = WRITE_CONFIG.brandStory;
const uploadPlan = UPLOAD_PLAN.brandStory;

// Page-level state: initialData is used for prefill/reset, submittedData for the last submit,
// and selectedClientId is the active client context for all forms on this page.
let initialData;
let submittedData = {};
let selectedClientId;

// React to client selection: set active client context, fetch latest data per form,
// then prefill each form so the UI reflects the current client state.
onClientSelect(async (clientId) => {
  selectedClientId = clientId;
  const visionResponse = await getCollection(
    APPWRITE.databases.brandStory.id,
    APPWRITE.databases.brandStory.collections.vision.id,
    [Query.equal("client_id", clientId), Query.orderDesc("$updatedAt")],
  );
  const obituaryResponse = await getCollection(
    APPWRITE.databases.brandStory.id,
    APPWRITE.databases.brandStory.collections.obituary.id,
    [Query.equal("client_id", clientId), Query.orderDesc("$updatedAt")],
  );

  // Store fetched data for reset/prefill
  initialData = { visionResponse, obituaryResponse };

  console.log(initialData);

  setInitialData(visionResponse, "visionForm");
  setInitialData(obituaryResponse, "obituaryForm");
});

function setInitialData(data, formId) {
  // We always work with the most recent document; if none exist, the form stays empty.
  data = data.documents[0];

  // Default (empty) values per form section, used when no data exists or when resetting.
  let pairs = {
    visionForm: {
      visionDescription: "",
    },
    obituaryForm: {
      obituary: "",
    },
  };

  if (data) {
    // Translate DB column names back into form field names (inverse of writeCfg.mapToDb).
    switch (formId) {
      case "visionForm":
        pairs.visionForm = {
          visionDescription: data.description,
        };

        break;
      case "obituaryForm":
        pairs.obituaryForm = {
          obituary: data.obituary,
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

// Single submit handler for all form cards; the clicked button decides which form and config to use.
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

        // Collect current form values; text inputs go to `data`, file inputs to `files`.
        submittedData = gatherFormData(form);

        let response;
        const clientData = await getClientById(selectedClientId);
        const teamId = clientData.auth.$id;

        // Check if there are any documents already in collection
        if (initialData[writeCfg[relatedForm].initialDataKey].total >= 1) {
          console.log("Updating Document");

          const doc =
            initialData[writeCfg[relatedForm].initialDataKey].documents[0];

          // Upload new files
          const uploadedIds = await uploadFilesFromForm(
            submittedData.files,
            teamId,
            uploadPlan,
          );

          // Remove old file
          const target = getUploadTargetsFromForm(
            submittedData.files,
            uploadPlan,
          );

          if (target.length > 0) {
            await removeFile(target[0].bucketId, doc.attachment_id);
          }

          console.log(uploadedIds);
          console.log(
            "Submitted data: ",
            writeCfg[relatedForm].mapToDb(
              submittedData.data,
              selectedClientId,
              uploadedIds,
              doc.attachment_id ?? "",
            ),
          );

          // Update the existing document with the newly submitted form values.
          response = await updateDocument({
            databaseId: APPWRITE.databases.brandStory.id,
            collectionId: writeCfg[relatedForm].collectionId,
            documentId: doc.$id,
            data: writeCfg[relatedForm].mapToDb(
              submittedData.data,
              selectedClientId,
              uploadedIds,
            ),
          });
        } else {
          console.log("Adding document");
          // Create a new document and assign team-based permissions so the client team owns the data.

          const uploadedIds = await uploadFilesFromForm(
            submittedData.files,
            teamId,
            uploadPlan,
          );

          console.log(uploadedIds);
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
            databaseId: APPWRITE.databases.brandStory.id,
            collectionId: writeCfg[relatedForm].collectionId,
            data: writeCfg[relatedForm].mapToDb(
              submittedData.data,
              selectedClientId,
              uploadedIds,
            ),
            permissions: [
              Permission.read(Role.team(teamId)),
              Permission.update(Role.team(teamId)),
              Permission.delete(Role.team(teamId)),
            ],
          });
        }

        if (response) {
          renderToast("Gelukt!", `Brand story is aangepast.`, "positive");
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

// This page does not expose raw data previews; the button is removed intentionally.
showDataBtn.remove();

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
