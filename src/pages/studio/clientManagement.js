import { Query } from "appwrite";
import APPWRITE from "../../config/public";
import { openPreviewSheet } from "../../ui/studio/previewSheet";
import { gatherFormData } from "../../utils/studioHelpers";
import { addCompany } from "../../appwrite/functions";
import { checkAuth } from "../../appwrite/auth";

const submitBtn = $("#submitForm");
const resetBtn = $("#resetForm");
const showDataBtn = $("#showData");

console.log("Hello from cMan.js");
console.log(await checkAuth());

// const addCompany = await addCompany(await check);

let initialData = {};
let submittedData = {};

submitBtn.off("click.submit").on("click.submit", function (e) {
  e.preventDefault();
  const relatedForm = $(this).attr("data-related-form");
  const form = $(`#${relatedForm}`);

  submittedData = gatherFormData(form);
});

showDataBtn.off("click.showData").on("click.showData", function () {
  console.log("Clicked ShowData...");
});
resetBtn.off("click.reset").on("click.reset", function () {
  console.log("Clicked Reset...");
});
