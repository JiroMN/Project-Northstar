import { gatherFormData } from "../../utils/studioHelpers";

const submitBtn = $("#submitForm");
const resetBtn = $("#resetForm");
const showDataBtn = $("#showData");

let initialData = {};
let submittedData = {};

submitBtn.off("click.submit").on("click.submit", function (e) {
  e.preventDefault();
  const relatedForm = $(this).attr("data-related-form");
  const form = $(`#${relatedForm}`);

  submittedData = gatherFormData(form);
});

resetBtn.off("click.reset").on("click.reset", function () {
  console.log("Clicked Reset...");
});
