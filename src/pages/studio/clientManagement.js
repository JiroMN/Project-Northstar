import APPWRITE from "../../config/public";
import { gatherFormData } from "../../utils/studioHelpers";
import { checkAuth } from "../../appwrite/auth";
import { uploadFile } from "../../appwrite/storage";
import logUploadProgress from "../../ui/fileUploadProgress";
import { addCompany } from "../../appwrite/functions";
import { setButtonState } from "../../animations/global/buttons";
import { renderToast } from "../../ui/toast";
import { renderModal } from "../../ui/modal";
import { getErrorMessage } from "../../utils/helpers";
import { openPreviewSheet } from "../../ui/studio/previewSheet";
import { getAllClients } from "../../appwrite/db";

const submitBtn = $("#submitForm");
const resetBtn = $("#resetForm");
const showDataBtn = $("#showData");

// const addCompany = await addCompany(await check);

let initialData = await getAllClients();
let submittedData = {};

submitBtn.off("click.submit").on("click.submit", function (e) {
  e.preventDefault();
  try {
    renderModal(
      "Weet je het zeker?",
      "Je gaat iets aanpassen dat niet terug gedraaid kan worden.",
      "Annuleer",
      "Ga Door",
      async () => {
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
      },
    );
  } catch (err) {
    renderToast("Oeps!", getErrorMessage(err), "negative");
    console.error(err);
  } finally {
    setButtonState($(this), "enable", true);
  }
});

showDataBtn.off("click.showData").on("click.showData", function () {
  const previewData = initialData.database;
  openPreviewSheet("Clients", previewData, ["name"], "", false);
});
resetBtn.off("click.reset").on("click.reset", function () {
  console.log("Clicked Reset...");
});
