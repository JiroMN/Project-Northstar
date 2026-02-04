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
  onClientSelect,
  setFormData,
} from "../../utils/studioHelpers";
import { renderToast } from "../../ui/toast";
import { renderModal } from "../../ui/modal";
import { getErrorMessage } from "../../utils/helpers";
import { setButtonState } from "../../animations/global/buttons";

// Webflow duplicates IDs across repeated cards; selecting by attribute ensures we target all matching buttons.
const submitBtn = $("[id='submitForm']");
const resetBtn = $("[id='resetForm']");
const showDataBtn = $("[id='showData']");

// Configuration mapping form IDs to database collections and data mapping functions
const WRITE_CONFIG = {
  corePurposeForm: {
    collectionId: APPWRITE.databases.brandEssence.collections.corePurpose.id,
    initialDataKey: "corePurposeResponse",
    mapToDb: (data) => ({
      client_id: selectedClientId,
      purpose: data.corePurpose,
      purpose_secondary_lang: data.secondaryCorePurpose,
      explanation: data.corePurposeDescription,
    }),
  },
  onlinessForm: {
    collectionId: APPWRITE.databases.brandEssence.collections.onliness.id,
    initialDataKey: "onlinessResponse",
    mapToDb: (data) => ({
      client_id: selectedClientId,
      short_statement: data.shortOnliness,
      full_statement: data.fullOnliness,
      what: data.whatOnliness,
      how: data.howOnliness,
      who: data.whoOnliness,
      where: data.whereOnliness,
      why: data.whyOnliness,
      when: data.whenOnliness,
    }),
  },
  truelineForm: {
    collectionId: APPWRITE.databases.brandEssence.collections.trueline.id,
    initialDataKey: "truelineResponse",
    mapToDb: (data) => ({
      client_id: selectedClientId,
      trueline: data.trueline,
      trueline_secondary_lang: data.secondaryTrueline,
      explanation: data.truelineDescription,
    }),
  },
};

// Page-level state: initialData is used for prefill/reset, submittedData for the last submit,
// and selectedClientId is the active client context for all forms on this page.
let initialData;
let submittedData = {};
let selectedClientId;

// React to client selection: set active client context, fetch latest data per form,
// then prefill each form so the UI reflects the current client state.
onClientSelect(async (clientId) => {
  selectedClientId = clientId;
  const corePurposeResponse = await getCollection(
    APPWRITE.databases.brandEssence.id,
    APPWRITE.databases.brandEssence.collections.corePurpose.id,
    [Query.equal("client_id", clientId), Query.orderDesc("$updatedAt")],
  );
  const onlinessResponse = await getCollection(
    APPWRITE.databases.brandEssence.id,
    APPWRITE.databases.brandEssence.collections.onliness.id,
    [Query.equal("client_id", clientId), Query.orderDesc("$updatedAt")],
  );
  const truelineResponse = await getCollection(
    APPWRITE.databases.brandEssence.id,
    APPWRITE.databases.brandEssence.collections.trueline.id,
    [Query.equal("client_id", clientId), Query.orderDesc("$updatedAt")],
  );

  // Store fetched data for reset/prefill
  initialData = { corePurposeResponse, onlinessResponse, truelineResponse };

  setInitialData(corePurposeResponse, "corePurposeForm");
  setInitialData(onlinessResponse, "onlinessForm");
  setInitialData(truelineResponse, "truelineForm");
});

function setInitialData(data, formId) {
  // We always work with the most recent document; if none exist, the form stays empty.
  data = data.documents[0];

  // Default (empty) values per form section, used when no data exists or when resetting.
  let pairs = {
    corePurposeForm: {
      corePurpose: "",
      secondaryCorePurpose: "",
      corePurposeDescription: "",
    },
    onlinessForm: {
      shortOnliness: "",
      fullOnliness: "",
      whatOnliness: "",
      howOnliness: "",
      whoOnliness: "",
      whereOnliness: "",
      whyOnliness: "",
      whenOnliness: "",
    },
    truelineForm: {
      trueline: "",
      secondaryTrueline: "",
      truelineDescription: "",
    },
  };

  if (data) {
    // Translate DB column names back into form field names (inverse of WRITE_CONFIG.mapToDb).
    switch (formId) {
      case "corePurposeForm":
        pairs.corePurposeForm = {
          corePurpose: data.purpose,
          secondaryCorePurpose: data.purpose_secondary_lang,
          corePurposeDescription: data.explanation,
        };

        break;
      case "onlinessForm":
        pairs.onlinessForm = {
          shortOnliness: data.short_statement,
          fullOnliness: data.full_statement,
          whatOnliness: data.what,
          howOnliness: data.how,
          whoOnliness: data.who,
          whereOnliness: data.where,
          whyOnliness: data.why,
          whenOnliness: data.when,
        };

        break;
      case "truelineForm":
        pairs.truelineForm = {
          trueline: data.trueline,
          secondaryTrueline: data.trueline_secondary_lang,
          truelineDescription: data.explanation,
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
        // Check if there are any documents already in collection
        if (initialData[WRITE_CONFIG[relatedForm].initialDataKey].total >= 1) {
          console.log("Updating Document");
          // Check initialData to see if a document already exists for this form (update vs create).
          const doc =
            initialData[WRITE_CONFIG[relatedForm].initialDataKey].documents[0];
          // Update the existing document with the newly submitted form values.
          response = await updateDocument({
            databaseId: APPWRITE.databases.brandEssence.id,
            collectionId: WRITE_CONFIG[relatedForm].collectionId,
            documentId: doc.$id,
            data: WRITE_CONFIG[relatedForm].mapToDb(submittedData.data),
          });
        } else {
          console.log("Adding document");
          // Create a new document and assign team-based permissions so the client team owns the data.
          const clientData = await getClientById(selectedClientId);
          const teamId = clientData.auth.$id;

          response = await createDocument({
            databaseId: APPWRITE.databases.brandEssence.id,
            collectionId: WRITE_CONFIG[relatedForm].collectionId,
            data: WRITE_CONFIG[relatedForm].mapToDb(submittedData.data),
            permissions: [
              Permission.read(Role.team(teamId)),
              Permission.update(Role.team(teamId)),
              Permission.delete(Role.team(teamId)),
            ],
          });
        }

        if (response) {
          renderToast("Gelukt!", `Brand essence is aangepast.`, "positive");
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

// This page does not expose raw data previews; the button is removed intentionally.
showDataBtn.remove();

resetBtn.each((__, btn) => {
  const $btn = $(btn);

  // Reset restores the form back to the last fetched state for the currently selected client.
  $btn.off("click.reset").on("click.reset", function () {
    const relatedForm = $(this).attr("data-related-form");

    setInitialData(
      initialData[WRITE_CONFIG[relatedForm].initialDataKey],
      relatedForm,
    );
  });
});
