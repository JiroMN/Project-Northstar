import { Query } from "appwrite";
import APPWRITE from "../../config/public";
import { gatherFormData } from "../../utils/studioHelpers";
import { checkAuth } from "../../appwrite/auth";
import { uploadFile } from "../../appwrite/storage";
import logUploadProgress from "../../ui/fileUploadProgress";
import { addCompany } from "../../appwrite/functions";
import { setButtonState } from "../../animations/global/buttons";
import { renderToast } from "../../ui/toast";
import { getErrorMessage } from "../../utils/helpers";

const submitBtn = $("#submitForm");
const resetBtn = $("#resetForm");
const showDataBtn = $("#showData");

// const addCompany = await addCompany(await check);

let initialData = {};
let submittedData = {};

submitBtn.off("click.submit").on("click.submit", async function (e) {
  e.preventDefault();
  try {
    // Handle button states
    if ($(this).attr("data-disable") === "true") return;
    setButtonState($(this), "loading", false);

    const relatedForm = $(this).attr("data-related-form");
    const form = $(`#${relatedForm}`);

    submittedData = gatherFormData(form);

    const logoAvatarUpload = await uploadFile(
      APPWRITE.buckets.clientFiles.id,
      submittedData.files.logoAvatar,
      [],
      logUploadProgress(submittedData.files.logoAvatar[0].name),
    );
    const brandbookUpload = await uploadFile(
      APPWRITE.buckets.brandbooks.id,
      submittedData.files.brandBook,
      [],
      logUploadProgress(submittedData.files.brandBook[0].name),
    );
    const logoSystemBackdropUpload = await uploadFile(
      APPWRITE.buckets.clientFiles.id,
      submittedData.files.logoSystemBackdrop,
      [],
      logUploadProgress(submittedData.files.logoSystemBackdrop[0].name),
    );

    const addCompanyRes = await addCompany({
      form: submittedData.data,
      files: {
        logoAvatar: logoAvatarUpload,
        brandbook: brandbookUpload,
        logoSystemBackdrop: logoSystemBackdropUpload,
      },
      brandDirector: await checkAuth(),
    });

    console.log(addCompanyRes);

    if (addCompanyRes.ok) {
      renderToast(
        "Success!",
        "Bedrijf is toegevoegd aan TheBrand.Book",
        "positive",
      );
    } else {
      throw {
        message: addCompanyRes.message,
      };
    }
    setButtonState($(this), "enable", true);
  } catch (err) {
    renderToast("Oeps!", getErrorMessage(err), "negative");
    console.error(err);
  }
});

showDataBtn.off("click.showData").on("click.showData", function () {
  console.log("Clicked ShowData...");
  openPreview();
});
resetBtn.off("click.reset").on("click.reset", function () {
  console.log("Clicked Reset...");
});
