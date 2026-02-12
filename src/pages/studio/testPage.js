import { Query } from "appwrite";
import { getCollection } from "../../appwrite/db";
import APPWRITE from "../../config/public";
import { openPreviewSheet } from "../../ui/studio/previewSheet";
import { gatherFormData } from "../../utils/studioHelpers";

const submitBtn = $("#submitForm");
const resetBtn = $("#resetForm");
const showDataBtn = $("#showData");

const colorTokens = await getCollection(
  APPWRITE.databases.colorSystem.id,
  APPWRITE.databases.colorSystem.collections.tokens.id,
  [Query.select(["*", "colorPalette.title"]), Query.orderDesc("$updatedAt")],
);

let initialData = {};
let submittedData = {};

submitBtn.off("click.submit").on("click.submit", function (e) {
  e.preventDefault();
  const relatedForm = $(this).attr("data-related-form");
  const form = $(`#${relatedForm}`);

  submittedData = gatherFormData(form);
});

showDataBtn.off("click.showData").on("click.showData", function () {
  const selectedClientId = $("body").attr("data-selected-client-id");
  if (!selectedClientId || selectedClientId == "") {
    renderToast("Onvolledig!", "Selecteer een bedrijf", "warning");
    return;
  }
  console.log("Clicked ShowData...");
  openPreviewSheet("Kleuren", colorTokens.documents, ["title", "tone"], {
    relation: "colorPalette",
    key: "title",
  });
});
resetBtn.off("click.reset").on("click.reset", function () {
  console.log("Clicked Reset...");
});
