import { getFile, getFilePreview, uploadFile } from "../appwrite/storage";
import logUploadProgress from "../ui/fileUploadProgress";
import { selectRelations } from "../ui/studio/relationshipSelector";
import { UPLOAD_PLAN } from "../config/studio";

function applyLiveFileUploadPreview($field, file) {
  if (!file) return;

  const $uploadUI = $field.closest(".file-upload-ui");
  const $preview = $uploadUI
    .find(".file-upload-ui-elements-preview, .file-upload-ui-element-preview")
    .first();
  const $previewImage = $preview.is("img")
    ? $preview
    : $preview.find("img").first();
  const $icon = $uploadUI
    .find(".file-upload-ui-elements-icon, .file-upload-ui-element-icon")
    .first();

  const objectUrl = URL.createObjectURL(file);

  if ($previewImage.length) {
    $previewImage
      .attr("src", objectUrl)
      .attr("srcset", `${objectUrl} 100w, ${objectUrl} 400w, ${objectUrl} 800w`)
      .attr("sizes", "100vw")
      .css("display", "block");
  } else if ($preview.length) {
    $preview.css("background-image", `url('${objectUrl}')`);
  }

  $preview.css("display", "block");
  $icon.css("display", "none");
  $uploadUI.find("[data-bind='file-name']").text(file.name);
}

$(document)
  .off("change.studioFileUploadPreview", "input[type='file']")
  .on("change.studioFileUploadPreview", "input[type='file']", function () {
    const file = this?.files?.[0];
    if (!file) return;
    applyLiveFileUploadPreview($(this), file);
  });

// Reads a Webflow form and splits the result into:
// - `data`: all non-file inputs (text, select, checkbox, radio)
// - `files`: file inputs grouped by their input `name`
export function gatherFormData(form) {
  const formData = new FormData(form[0]);
  const data = {};
  const files = {};

  for (const [key, value] of formData.entries()) {
    // If this entry is a File, store it separately under its input name
    if (value instanceof File) {
      if (!files[key]) files[key] = [];
      files[key].push(value);
      continue;
    }

    // Multiple values → array
    if (data[key]) {
      if (!Array.isArray(data[key])) {
        data[key] = [data[key]];
      }
      data[key].push(value);
    } else {
      data[key] = value;
    }

    if (value == "on") {
      data[key] = true;
    } else if (value == "off") {
      data[key] = false;
    }
  }

  return { data, files };
}

// Writes values back into a form by matching object keys to input `name` attributes
// Handles different input types (checkbox, radio, select, text)
export function setFormData($form, data) {
  function resolveBucketIdForField(fieldName) {
    for (const plan of Object.values(UPLOAD_PLAN)) {
      if (plan?.[fieldName]?.bucketId) {
        return plan[fieldName].bucketId;
      }
    }

    return null;
  }

  async function renderFilePreviewInField($field, fileId) {
    if (!fileId) return;

    const bucketId = resolveBucketIdForField($field.attr("name"));
    if (!bucketId) return;

    try {
      console.log("[setFormData:file-preview] start", {
        fieldName: $field.attr("name"),
        fileId,
        bucketId,
      });

      const previewLow = await getFilePreview(bucketId, fileId, 100);
      const previewMid = await getFilePreview(bucketId, fileId, 400);
      const previewHigh = await getFilePreview(bucketId, fileId, 800);
      const file = await getFile(bucketId, fileId);

      console.log("[setFormData:file-preview] sources", {
        previewLow,
        previewMid,
        previewHigh,
        fileName: file?.name,
      });

      const $uploadUI = $field.closest(".file-upload-ui");
      const $preview = $uploadUI
        .find(".file-upload-ui-elements-preview, .file-upload-ui-element-preview")
        .first();
      const $previewImage = $preview.is("img")
        ? $preview
        : $preview.find("img").first();
      const $icon = $uploadUI
        .find(".file-upload-ui-elements-icon, .file-upload-ui-element-icon")
        .first();

      console.log("[setFormData:file-preview] dom", {
        uploadUiFound: $uploadUI.length > 0,
        previewFound: $preview.length > 0,
        previewIsImage: $preview.is("img"),
        previewImageFound: $previewImage.length > 0,
        iconFound: $icon.length > 0,
      });

      if ($preview.length) {
        if ($previewImage.length) {
          console.log("[setFormData:file-preview] applying image src/srcset");
          $previewImage
            .attr("src", previewHigh)
            .attr(
              "srcset",
              `${previewLow} 100w, ${previewMid} 400w, ${previewHigh} 800w`.trim(),
            )
            .attr("sizes", "100vw");
          $previewImage.css("display", "block");
        } else {
          console.log("[setFormData:file-preview] applying background-image");
          $preview
            .css("background-image", `url('${previewHigh}')`)
            .attr(
              "data-srcset",
              `${previewLow} 100w, ${previewMid} 400w, ${previewHigh} 800w`.trim(),
            );
        }

        $preview.css("display", "block");
      }

      if ($icon.length) {
        $icon.css("display", "none");
      } else {
        $uploadUI.find("svg").first().css("display", "none");
      }

      if (file?.name) {
        $uploadUI.find("[data-bind='file-name']").text(file.name);
      }
    } catch (err) {
      console.error("[setFormData:file-preview]", err);
    }
  }

  function bindLiveFilePreview($field) {
    $field.off("change.liveFilePreview").on("change.liveFilePreview", function () {
      const input = this;
      const file = input?.files?.[0];
      if (!file) return;
      applyLiveFileUploadPreview($field, file);
    });
  }

  Object.entries(data).forEach(([name, value]) => {
    const $field = $form.find(`[name='${name}']`);
    // console.log("Setting form data for: " + name + " value: " + value);

    if (!$field.length) return;

    const type = $field.attr("type");

    if (type === "checkbox") {
      const nextChecked = Boolean(value);
      $field.prop("checked", nextChecked).trigger("change");
      return;
    }

    if (type === "date") {
      const dateValue =
        typeof value === "string" && value.length >= 10
          ? value.slice(0, 10)
          : value;
      $field.val(dateValue);
      return;
    }

    if (type === "radio") {
      $field.filter(`[value="${value}"]`).prop("checked", true);
      return;
    }

    if ($field.is("select")) {
      $field.val(value).trigger("change");
      return;
    }

    if (type === "file") {
      bindLiveFilePreview($field);
      renderFilePreviewInField($field, value);
      return;
    }

    $field.val(value);
  });
}

// Normalizes Appwrite relationship values to an array of IDs.
// Supports:
// - string -> ["id"]
// - { $id } -> ["id"]
// - ["id", { $id }, ...] -> ["id", ...]
// - null/undefined/empty -> []
export function getRelationIds(value) {
  if (value == null || value === "") return [];

  const values = Array.isArray(value) ? value : [value];

  return values
    .map((entry) => {
      if (typeof entry === "string") return entry;
      if (entry && typeof entry === "object" && entry.$id) return entry.$id;
      return "";
    })
    .filter((id) => id !== "");
}

const clientSelectSubscribers = new Set();
let clientSelectListenerAttached = false;

function attachClientSelectListener() {
  if (clientSelectListenerAttached) return;
  clientSelectListenerAttached = true;

  $(document).on("client:selected.onClientSelect", (__, clientId) => {
    // console.log("[onClientSelect] event fired:", clientId);
    if (!clientId) return;

    clientSelectSubscribers.forEach((cb) => {
      try {
        cb(clientId);
      } catch (err) {
        console.error("[onClientSelect] subscriber error", err);
      }
    });
  });
}

export function onClientSelect(fn) {
  if (typeof fn !== "function") return () => {};

  attachClientSelectListener();
  clientSelectSubscribers.add(fn);

  const id = $("body").attr("data-selected-client-id");
  if (id) fn(id);

  // Optional cleanup: caller can unsubscribe if needed
  return () => clientSelectSubscribers.delete(fn);
}

const previewItemEditSubscribers = new Set();
let previewItemEditListenerAttached = false;
let lastPreviewItemEditPayload = null;

function attachPreviewItemEditListener() {
  if (previewItemEditListenerAttached) return;
  previewItemEditListenerAttached = true;

  $(document).on("preview:itemEdit.onPreviewItemEdit", (__, payload) => {
    // console.log("[onPreviewItemEdit] event fired:", payload);
    if (!payload) return;

    lastPreviewItemEditPayload = payload;

    previewItemEditSubscribers.forEach((cb) => {
      try {
        cb(payload);
      } catch (err) {
        console.error("[onPreviewItemEdit] subscriber error", err);
      }
    });
  });
}

export function onPreviewItemEdit(fn) {
  if (typeof fn !== "function") return () => {};

  attachPreviewItemEditListener();
  previewItemEditSubscribers.add(fn);

  if (lastPreviewItemEditPayload) fn(lastPreviewItemEditPayload);

  return () => previewItemEditSubscribers.delete(fn);
}

const dataChangeSubscribers = new Set();
let dataChangeListenerAttached = false;

function attachDataChangeListener() {
  if (dataChangeListenerAttached) return;
  dataChangeListenerAttached = true;

  $(document).on("studio:dataChange.onDataChange", (__, payload) => {
    dataChangeSubscribers.forEach((cb) => {
      try {
        cb(payload ?? {});
      } catch (err) {
        console.error("[onDataChange] subscriber error", err);
      }
    });
  });
}

export function onDataChange(fn) {
  if (typeof fn !== "function") return () => {};

  attachDataChangeListener();
  dataChangeSubscribers.add(fn);

  return () => dataChangeSubscribers.delete(fn);
}

export function triggerDataChange(payload = {}) {
  $(document).trigger("studio:dataChange", [payload]);
}

// Determines which file inputs actually contain a selected file and
// resolves where each file should be uploaded based on the upload plan
export function getUploadTargetsFromForm(submittedFiles, plan) {
  const targets = [];

  // Loop over every file field defined in the upload plan (not over the form itself)
  for (const [fieldName, cfg] of Object.entries(plan)) {
    // Grab the first file for this input (single-file uploads are treated as arrays)
    const files = submittedFiles?.[fieldName] ?? [];
    const file = Array.isArray(files) ? files[0] : files;

    // Skip this field if no real file was selected
    if (!(file instanceof File) || file.size <= 0) continue;

    // Store everything needed later to upload or replace this file
    targets.push({
      fieldName,
      file,
      bucketId: cfg.bucketId,
      permissions: cfg.permissions,
    });
  }

  return targets;
}

// Uploads all selected files from a form according to the upload plan
// Returns an object mapping input names to newly created Appwrite file IDs
export async function uploadFilesFromForm(submittedFiles, teamId, plan) {
  const uploaded = {};
  const targets = getUploadTargetsFromForm(submittedFiles, plan);

  // Upload each resolved file target one by one
  for (const target of targets) {
    const permissions = target.permissions ? target.permissions(teamId) : [];

    const res = await uploadFile(
      target.bucketId,
      target.file,
      permissions,
      logUploadProgress(target.file.name),
    );

    uploaded[target.fieldName] = res.$id;
  }

  return uploaded;
}
