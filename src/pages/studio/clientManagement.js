import { Query } from "appwrite";
import APPWRITE from "../../config/public";
import { gatherFormData } from "../../utils/studioHelpers";
import { checkAuth } from "../../appwrite/auth";
import { uploadFile } from "../../appwrite/storage";
import logUploadProgress from "../../ui/fileUploadProgress";
import { addCompany } from "../../appwrite/functions";

const submitBtn = $("#submitForm");
const resetBtn = $("#resetForm");
const showDataBtn = $("#showData");

// const addCompany = await addCompany(await check);

let initialData = {};
let submittedData = {};

submitBtn.off("click.submit").on("click.submit", async function (e) {
  e.preventDefault();
  const relatedForm = $(this).attr("data-related-form");
  const form = $(`#${relatedForm}`);

  submittedData = gatherFormData(form);

  const logoAvatarUpload = await uploadFile(
    APPWRITE.buckets.clientFiles.id,
    submittedData.files.logoAvatar,
    [],
    logUploadProgress(),
  );
  const brandbookUpload = await uploadFile(
    APPWRITE.buckets.brandbooks.id,
    submittedData.files.brandBook,
    [],
    logUploadProgress(),
  );
  const logoSystemBackdropUpload = await uploadFile(
    APPWRITE.buckets.clientFiles.id,
    submittedData.files.logoSystemBackdrop,
    [],
    logUploadProgress(),
  );

  // console.log(submittedData);
  // console.log(logoAvatarUpload, brandbookUpload, logoSystemBackdropUpload);

  // const addCompanyRes =
  await addCompany({
    form: submittedData.data,
    files: {
      logoAvatar: logoAvatarUpload,
      brandbook: brandbookUpload,
      logoSystemBackdrop: logoSystemBackdropUpload,
    },
    brandDirector: await checkAuth(),
  });
});

showDataBtn.off("click.showData").on("click.showData", function () {
  console.log("Clicked ShowData...");
});
resetBtn.off("click.reset").on("click.reset", function () {
  console.log("Clicked Reset...");
});
