import { Query } from "appwrite";
import { getClientById, getCollection } from "../../appwrite/db";
import APPWRITE from "../../config/public";
import { openPreviewSheet } from "../../ui/studio/previewSheet";
import { gatherFormData } from "../../utils/studioHelpers";
import { addUser } from "../../appwrite/functions";

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
  const selectedClientId = $("body").attr("data-selected-client-id");
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

  addUser(
    {
      teamId: selectedClientData.auth.$id,
      clientId: selectedClientData.database.$id,
    },
    submittedData.data,
  );
});

showDataBtn.off("click.showData").on("click.showData", function () {
  console.log("Clicked ShowData...");
  openPreviewSheet("Gebruikers", initialData.documents, ["name"], {
    relation: "client",
    key: "name",
  });
});

resetBtn.off("click.reset").on("click.reset", function () {
  console.log("Clicked Reset...");
});
