import { Query } from "appwrite";
import { getClientById, getCollection } from "../../appwrite/db";
import APPWRITE from "../../config/public";
import { openPreviewSheet } from "../../ui/studio/previewSheet";
import { gatherFormData } from "../../utils/studioHelpers";
import { addUser, removeUser } from "../../appwrite/functions";
import { renderToast } from "../../ui/toast";
import { getErrorMessage } from "../../utils/helpers";
import { setButtonState } from "../../animations/global/buttons";

const submitBtn = $("#submitForm");
const resetBtn = $("#resetForm");
const showDataBtn = $("#showData");

let initialData = await getCollection(
  APPWRITE.databases.accounts.id,
  APPWRITE.databases.accounts.collections.users.id,
  [Query.select(["*", "client.name"]), Query.orderDesc("$updatedAt")],
);
let submittedData = {};

submitBtn.off("click.submit").on("click.submit", async function (e) {
  e.preventDefault();
  try {
    const selectedClientId = $("body").attr("data-selected-client-id");
    if (!selectedClientId || selectedClientId == "") {
      renderToast("Onvolledig!", "Selecteer een bedrijf", "warning");
      return;
    }

    if ($(this).attr("data-disable") === "true") return;
    setButtonState($(this), "loading", false);

    const selectedClientData = await getClientById(selectedClientId);
    const relatedForm = $(this).attr("data-related-form");
    const form = $(`#${relatedForm}`);
    let teamRoles = [];

    submittedData = gatherFormData(form);

    if (submittedData.data.isBeheerder) {
      teamRoles.push("Beheerder");
    }
    if (submittedData.data.isMedewerker) {
      teamRoles.push("Medewerker");
    }
    submittedData.data = { ...submittedData.data, roles: teamRoles };

    const response = await addUser(
      {
        teamId: selectedClientData.auth.$id,
        clientId: selectedClientData.database.$id,
      },
      submittedData.data,
    );
    if (response) {
      renderToast(
        "Gelukt!",
        `Gebruiker is toegevoegd aan ${selectedClientData.database.name}`,
        "positive",
      );
    }
    setButtonState($(this), "enable", true);
  } catch (err) {
    console.error(err);
    renderToast("Oeps!", getErrorMessage(err), "negative");
  }
});

showDataBtn.off("click.showData").on("click.showData", async function () {
  console.log("Clicked ShowData...");
  openPreviewSheet({
    sheetTitle: "Gebruikers",
    data: initialData.documents,
    labelKeys: ["name"],
    secondaryLabelKey: {
      relation: "client",
      key: "name",
    },
    canRemove: true,
    alternativeRemovalFunction: await removeUser(),
  });
});

resetBtn.off("click.reset").on("click.reset", function () {
  console.log("Clicked Reset...");
});
