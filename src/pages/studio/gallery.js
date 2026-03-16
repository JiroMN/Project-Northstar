import { Permission, Query, Role } from "appwrite";
import {
  createDocument,
  getClientById,
  getCollection,
  removeRow,
  updateDocument,
} from "../../appwrite/db";
import APPWRITE from "../../config/public";
import { checkAuth } from "../../appwrite/auth";
import { openPreviewSheet } from "../../ui/studio/previewSheet";
import {
  gatherFormData,
  onDataChange,
  onClientSelect,
  onPreviewItemEdit,
  setFormData,
  triggerDataChange,
  uploadFilesFromForm,
} from "../../utils/studioHelpers";
import { renderToast } from "../../ui/toast";
import { renderModal } from "../../ui/modal";
import { getErrorMessage } from "../../utils/helpers";
import { setButtonState } from "../../animations/global/buttons";
import { UPLOAD_PLAN, WRITE_CONFIG } from "../../config/studio";
import { removeFile } from "../../appwrite/storage";

await checkAuth();

const submitBtn = $("[id='submitForm']");
const resetBtn = $("[id='resetForm']");
const showDataBtn = $("[id='showData']");

let selectedClientId;
let initialData;
let submittedData = {};
let existingAttachmentIds = {};

const writeCfg = WRITE_CONFIG.gallery;
const uploadPlan = UPLOAD_PLAN.gallery;

async function removeGalleryFile(fileId = "") {
  try {
    const removeRes =
      fileId !== "" && (await removeFile(APPWRITE.buckets.gallery.id, fileId));

    if (removeRes) {
      return true;
    } else {
      renderToast("Oeps!", "Het is niet gelukt om het bestand te verwijderen.");
      return false;
    }
  } catch (err) {
    console.error(err);
    renderToast("Oeps!", getErrorMessage(err), "negative");
  }
}

async function removeGalleryItem(docId) {
  try {
    const doc = initialData.filesResponse.documents.find(
      (d) => d.$id === docId,
    );

    if (!doc) {
      renderToast("Oeps!", "Kon het item niet vinden.", "negative");
      return;
    }

    const removeStorageFile = await removeGalleryFile(doc.file_id);
    const removeDocRes = await removeRow(
      APPWRITE.databases.gallery.id,
      APPWRITE.databases.gallery.collections.images.id,
      doc.$id,
    );

    if (removeStorageFile && removeDocRes) {
      initialData.filesResponse.documents =
        initialData.filesResponse.documents.filter((d) => d.$id !== docId);

      return true;
    } else {
      renderToast(
        "Oeps!",
        "Het is (deels) mislukt om het item te verwijderen.",
        "negative",
      );
      return;
    }
  } catch (err) {
    console.error(err);
    renderToast("Oeps!", getErrorMessage(err), "negative");
  }
}

async function gatherGalleryData(clientId) {
  try {
    const albumsResponse = await getCollection(
      APPWRITE.databases.gallery.id,
      APPWRITE.databases.gallery.collections.albums.id,
      [Query.equal("client_id", clientId), Query.orderDesc("$updatedAt")],
    );

    const filesResponse = await getCollection(
      APPWRITE.databases.gallery.id,
      APPWRITE.databases.gallery.collections.images.id,
      [
        Query.equal("client_id", clientId),
        Query.orderDesc("$updatedAt"),
        Query.select(["*", "galleryCategory.*"]),
      ],
    );

    return { albumsResponse, filesResponse };
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
  initialData = await gatherGalleryData(clientId);

  console.log(initialData);
});

onDataChange(async ({ clientId }) => {
  if (!selectedClientId) return;
  if (clientId && clientId !== selectedClientId) return;
  initialData = await gatherGalleryData(selectedClientId);
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
    albumForm: {
      albumName: "",
    },
    fileForm: {
      galleryAlbums: "",
      galleryFile: "",
    },
  };

  if (data) {
    switch (formId) {
      case "albumForm":
        pairs.albumForm = {
          albumName: data.name,
        };
        break;
      case "fileForm":
        pairs.fileForm = {
          galleryAlbums: data.galleryCategory?.$id ?? "",
          galleryFile: data.file_id ?? "",
        };
        existingAttachmentIds = {
          galleryFile: data.file_id,
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
        const form = $(`#${relatedForm}`);
        const isEditing = form.attr("data-is-editing");
        submittedData = gatherFormData(form);

        const clientData = await getClientById(selectedClientId);
        const teamId = clientData.auth.$id;

        let uploadedIds = {};
        if (relatedForm === "fileForm") {
          uploadedIds = await uploadFilesFromForm(
            submittedData.files,
            teamId,
            uploadPlan,
          );
        }

        let response;
        if (isEditing && isEditing !== "") {
          if (
            relatedForm === "fileForm" &&
            uploadedIds.galleryFile &&
            existingAttachmentIds.galleryFile
          ) {
            const removed = await removeGalleryFile(
              existingAttachmentIds.galleryFile,
            );
            if (!removed) {
              setButtonState($(this), "enable", true);
              return;
            }
          }

          response = await updateDocument({
            databaseId: APPWRITE.databases.gallery.id,
            documentId: isEditing,
            collectionId: writeCfg[relatedForm].collectionId,
            data: writeCfg[relatedForm].mapToDb(
              submittedData.data,
              selectedClientId,
              uploadedIds,
              {
                galleryFile: existingAttachmentIds.galleryFile,
              },
            ),
          });
        } else {
          response = await createDocument({
            databaseId: APPWRITE.databases.gallery.id,
            collectionId: writeCfg[relatedForm].collectionId,
            data: writeCfg[relatedForm].mapToDb(
              submittedData.data,
              selectedClientId,
              uploadedIds,
              {
                galleryFile: existingAttachmentIds.galleryFile,
              },
            ),
            permissions: [
              Permission.read(Role.team(teamId)),
              Permission.update(Role.team(teamId)),
              Permission.delete(Role.team(teamId)),
            ],
          });
        }

        if (response) {
          renderToast("Gelukt!", `Gallery is aangepast.`, "positive");
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
  let sheetTitle;
  let labelKeys;
  let secondaryLabelKeys;

  switch (relatedForm) {
    case "albumForm":
      sheetTitle = "Albums";
      labelKeys = ["name"];
      secondaryLabelKeys = "";
      break;
    case "fileForm":
      sheetTitle = "Bestanden";
      labelKeys = ["file_id"];
      secondaryLabelKeys = { relation: "galleryCategory", key: "name" };
      break;
  }

  openPreviewSheet({
    sheetTitle: sheetTitle,
    data: initialData?.[writeCfg[relatedForm].initialDataKey]?.documents ?? [],
    labelKeys: labelKeys,
    secondaryLabelKey: secondaryLabelKeys,
    canRemove: true,
    alternativeRemovalFunction:
      relatedForm === "fileForm" ? removeGalleryItem : null,
    canEdit: true,
    formId: relatedForm,
  });
});

resetBtn.each((__, btn) => {
  const $btn = $(btn);
  $btn.remove();
});
