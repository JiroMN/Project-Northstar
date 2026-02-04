import { Permission, Query, Role } from "appwrite";
import {
  createDocument,
  getClientById,
  getCollection,
  updateDocument,
} from "../../appwrite/db";
import APPWRITE from "../../config/public";
import {
  gatherFormData,
  onClientSelect,
  setFormData,
} from "../../utils/studioHelpers";
import { renderToast } from "../../ui/toast";
import { getErrorMessage } from "../../utils/helpers";
import { setButtonState } from "../../animations/global/buttons";

const submitBtn = $("#submitForm");
const resetBtn = $("#resetForm");
const showDataBtn = $("#showData");

let initialData;
let submittedData = {};
let selectedClientId;

onClientSelect(async (clientId) => {
  selectedClientId = clientId;
  const resourcesResponse = await getCollection(
    APPWRITE.databases.general.id,
    APPWRITE.databases.general.collections.resources.id,
    [Query.equal("client_id", clientId), Query.orderDesc("$updatedAt")],
  );
  initialData = resourcesResponse;
  setInitialData(resourcesResponse);
});

function setInitialData(data) {
  data = data.documents[0];

  let pairs;

  if (data) {
    pairs = {
      website: data.website_url,
      googleDrive: data.googledrive_url,
      webflowDesigner: data.webflow_designer_url,
      webflowAnalytics: data.webflow_analytics_url,
      figma: data.figma_url,
    };
  } else {
    pairs = {
      website: "",
      googleDrive: "",
      webflowDesigner: "",
      webflowAnalytics: "",
      figma: "",
    };
  }

  setFormData($("#resourcesForm"), pairs);
}

submitBtn.off("click.submit").on("click.submit", async function (e) {
  e.preventDefault();
  try {
    if (!selectedClientId || selectedClientId == "") {
      renderToast("Onvolledig!", "Selecteer een bedrijf", "warning");
      return;
    }

    if ($(this).attr("data-disable") === "true") return;
    setButtonState($(this), "loading", false);

    const relatedForm = $(this).attr("data-related-form");
    const form = $(`#${relatedForm}`);

    submittedData = gatherFormData(form);

    let response;
    const doc = initialData.documents[0];

    if (initialData.total < 1) {
      // Run addDocument
      const clientData = await getClientById(selectedClientId);
      const teamId = clientData.auth.$id;
      response = await createDocument({
        databaseId: APPWRITE.databases.general.id,
        collectionId: APPWRITE.databases.general.collections.resources.id,
        data: {
          client_id: selectedClientId,
          website_url: submittedData.data.website,
          webflow_designer_url: submittedData.data.webflowDesigner,
          webflow_analytics_url: submittedData.data.webflowAnalytics,
          googledrive_url: submittedData.data.googleDrive,
          figma_url: submittedData.data.figma,
        },
        permissions: [
          Permission.read(Role.team(teamId)),
          Permission.update(Role.team(teamId)),
          Permission.delete(Role.team(teamId)),
        ],
      });
    } else {
      // Run updateDocument
      response = await updateDocument({
        databaseId: APPWRITE.databases.general.id,
        collectionId: APPWRITE.databases.general.collections.resources.id,
        documentId: doc.$id,
        data: {
          website_url: submittedData.data.website,
          webflow_designer_url: submittedData.data.webflowDesigner,
          webflow_analytics_url: submittedData.data.webflowAnalytics,
          googledrive_url: submittedData.data.googleDrive,
          figma_url: submittedData.data.figma,
        },
      });
    }

    if (response) {
      renderToast("Gelukt!", `Resources zijn aangepast van.`, "positive");
    }
  } catch (err) {
    console.error(err);
    renderToast("Oeps!", getErrorMessage(err), "negative");
  } finally {
    setButtonState($(this), "enable", true);
  }
});

showDataBtn.remove();

resetBtn.off("click.reset").on("click.reset", function () {
  setInitialData(initialData);
});
