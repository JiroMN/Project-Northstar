import { Permission, Query, Role } from "appwrite";
import {
  createDocument,
  getClientById,
  getCollection,
  updateDocument,
} from "../../appwrite/db";
import APPWRITE from "../../config/public";
import { openPreviewSheet } from "../../ui/studio/previewSheet";
import {
  gatherFormData,
  onDataChange,
  onClientSelect,
  onPreviewItemEdit,
  setFormData,
  triggerDataChange,
} from "../../utils/studioHelpers";
import { renderToast } from "../../ui/toast";
import { renderModal } from "../../ui/modal";
import { getErrorMessage } from "../../utils/helpers";
import { setButtonState } from "../../animations/global/buttons";
import { WRITE_CONFIG } from "../../config/studio";

const submitBtn = $("[id='submitForm']");
const resetBtn = $("[id='resetForm']");
const showDataBtn = $("[id='showData']");

let selectedClientId;
let initialData;
let submittedData = {};

const writeCfg = WRITE_CONFIG.continuity;

async function gatherContinuityData(clientId) {
  try {
    const timelogsResponse = await getCollection(
      APPWRITE.databases.continuity.id,
      APPWRITE.databases.continuity.collections.timelogs.id,
      [Query.equal("client_id", clientId), Query.orderDesc("$updatedAt")],
    );

    return { timelogsResponse };
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
  initialData = await gatherContinuityData(clientId);
});

onDataChange(async ({ clientId }) => {
  if (!selectedClientId) return;
  if (clientId && clientId !== selectedClientId) return;
  initialData = await gatherContinuityData(selectedClientId);
});

onPreviewItemEdit((toBeEditedItem) => {
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
  let pairs = {
    timelogsForm: {
      timelogTitle: "",
      timelogDescription: "",
      timelogWorkType: "",
      timelogDate: "",
      timelogWorkedHours: "",
      timelogReservedContinuityHours: false,
    },
  };

  if (data) {
    switch (formId) {
      case "timelogsForm":
        pairs.timelogsForm = {
          timelogTitle: data.title,
          timelogDescription: data.description,
          timelogWorkType: data.work_type,
          timelogDate: data.date,
          timelogWorkedHours: data.hours,
          timelogReservedContinuityHours: Boolean(
            data.isReservedConsultingSessions,
          ),
        };
        break;
    }
  } else {
    Object.keys(pairs[formId]).forEach((column) => {
      pairs[formId][column] = "";
    });
  }

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
        if (relatedForm !== "timelogsForm") {
          renderToast(
            "Niet beschikbaar",
            "Abonnementen en pakketten worden volledig via Stripe beheerd.",
            "announcement",
          );
          return;
        }
        const form = $(`#${relatedForm}`);
        const isEditing = form.attr("data-is-editing");
        submittedData = gatherFormData(form);

        const clientData = await getClientById(selectedClientId);
        const teamId = clientData.auth.$id;

        let response;
        if (isEditing && isEditing !== "") {
          response = await updateDocument({
            databaseId: APPWRITE.databases.continuity.id,
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
          response = await createDocument({
            databaseId: APPWRITE.databases.continuity.id,
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
          renderToast("Gelukt!", `Continuity is aangepast.`, "positive");
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
  if (relatedForm !== "timelogsForm") {
    renderToast(
      "Niet beschikbaar",
      "Abonnementen en pakketten worden volledig via Stripe beheerd.",
      "announcement",
    );
    return;
  }
  let sheetTitle;
  let labelKeys;
  let secondaryLabelKeys;
  let canEdit = true;

  switch (relatedForm) {
    case "timelogsForm":
      sheetTitle = "Time Logs";
      labelKeys = ["title"];
      secondaryLabelKeys = "work_type";
      break;
  }

  openPreviewSheet({
    sheetTitle: sheetTitle,
    data: initialData?.[writeCfg[relatedForm].initialDataKey]?.documents ?? [],
    labelKeys: labelKeys,
    secondaryLabelKey: secondaryLabelKeys,
    canRemove: true,
    canEdit: canEdit,
    formId: relatedForm,
  });
});

resetBtn.each((__, btn) => {
  const $btn = $(btn);
  $btn.remove();
});

// Deprecated in favor of Stripe source of truth for products/subscriptions
$("[data-related-form='subscriptionsForm']")
  .closest(".studio-card")
  .remove();
$("#subscriptionsForm").remove();
