import { applyTextBindings } from "../utils/dataBinding";
import { FORM_MODALS } from "../config/formModal";
import { setButtonState } from "../animations/global/buttons";

const $container = $(".form-modal-container");
const $backdrop = $(".form-modal-backdrop");
const $modal = $(".form-modal");

const $formWrapper = $modal.find(".form-modal-form-wrapper");

gsap.set($container, { display: "flex", pointerEvents: "none" });
gsap.set($backdrop, { autoAlpha: 0 });
gsap.set($modal, { autoAlpha: 0, y: 8, scale: 0.95 });

let formModalCfg = { ...FORM_MODALS };

export function initFormModal(config = {}) {
  formModalCfg = { ...formModalCfg, ...config };
}

function getButtons() {
  const confirmButton = $modal
    .find(".button-md")
    .filter("[data-wf--default-button--variant='base']")
    .first();
  const cancelButton = $modal
    .find(".button-md")
    .filter("[data-wf--default-button--variant='secondary']")
    .first();

  return { confirmButton, cancelButton };
}

function closeFormModal() {
  gsap
    .timeline()
    .to($modal, { autoAlpha: 0, scale: 0.95 })
    .to($backdrop, { autoAlpha: 0, pointerEvents: "none" }, "<0.2")
    .add(() => {
      $container.css("pointer-events", "none");
    });
}

function openFormModal() {
  gsap
    .timeline({
      onStart: () => $container.css("pointer-events", "auto"),
      onComplete: () => gsap.set($backdrop, { pointerEvents: "auto" }),
    })
    .to($backdrop, { autoAlpha: 1 })
    .to($modal, { autoAlpha: 1, scale: 1 }, "<0.2");
}

function createField(field) {
  const {
    type = "text",
    name = "",
    placeholder = "",
    required = false,
    readonly = false,
    min,
    max,
  } = field;

  const safeType = ["text", "textarea", "date", "number"].includes(type)
    ? type
    : "text";

  if (safeType === "textarea") {
    const $textarea = $("<textarea/>")
      .addClass("text-area")
      .attr("name", name)
      .attr("placeholder", placeholder);

    if (required) {
      $textarea.attr("required", "required");
    }
    if (readonly) {
      $textarea
        .attr("readonly", "readonly")
        .css("opacity", "0.6")
        .css("cursor", "not-allowed")
        .css("pointer-events", "none");
    }

    return $textarea;
  }

  const $input = $("<input/>")
    .addClass("input")
    .attr("type", safeType)
    .attr("name", name)
    .attr("placeholder", placeholder);

  if (safeType === "number") {
    if (min !== undefined && min !== null && min !== "") {
      $input.attr("min", min);
    }

    if (max !== undefined && max !== null && max !== "") {
      $input.attr("max", max);
    }
  }

  if (required) {
    $input.attr("required", "required");
  }
  if (readonly) {
    $input
      .attr("readonly", "readonly")
      .css("opacity", "0.4")
      .css("cursor", "not-allowed")
      .css("pointer-events", "none");
  }

  return $input;
}

function renderFieldsInForm($form, config) {
  if (!$form.length) return;

  const inputs = Array.isArray(config.inputs) ? config.inputs : [];
  $form.empty();

  inputs.forEach((field) => {
    $form.append(createField(field));
  });
}

function gatherModalFormData($form) {
  const formData = new FormData($form[0]);
  const data = {};

  for (const [key, value] of formData.entries()) {
    data[key] = value;
  }

  return data;
}

export function renderFormModal(entryKey, options = {}) {
  const cfg = formModalCfg[entryKey];

  if (!cfg) {
    console.error(`[formModal] Config entry "${entryKey}" niet gevonden.`);
    return;
  }

  const heading = options.heading ?? cfg.heading ?? "Formulier";
  const body = options.body ?? cfg.body ?? "";
  const cancelText = options.cancelText ?? cfg.cancelText ?? "Annuleer";
  const confirmText = options.confirmText ?? cfg.confirmText ?? "Verstuur";
  const onSubmit = options.onSubmit ?? cfg.onSubmit;
  const onCancel = options.onCancel ?? cfg.onCancel;
  const initialData = options.initialData ?? {};

  const { confirmButton, cancelButton } = getButtons();

  if (cancelText === "") {
    cancelButton.css("display", "none");
  } else {
    cancelButton.css("display", "flex");
  }

  applyTextBindings($modal, {
    "modal-heading": heading,
    "modal-body": body,
    "modal-primary-button": confirmText,
    "modal-secondary-button": cancelText,
  });

  const $form = $formWrapper.find("form").first();
  if (!$form.length) {
    console.error("[formModal] Geen form gevonden in .form-modal-form-wrapper");
    return;
  }

  if (cfg.formId) {
    $form
      .attr("id", cfg.formId)
      .attr("name", cfg.formId)
      .attr("data-name", cfg.formId);
  }

  renderFieldsInForm($form, cfg);
  Object.entries(initialData).forEach(([name, value]) => {
    $form.find(`[name='${name}']`).val(value ?? "");
  });

  $(confirmButton).off("click.formModalConfirm");
  $(cancelButton).off("click.formModalCancel");

  $(confirmButton).on("click.formModalConfirm", async function (e) {
    e.preventDefault();
    if ($(this).attr("data-disable") === "true") return;

    if (!$form[0].checkValidity()) {
      $form[0].reportValidity();
      return;
    }

    try {
      setButtonState($(this), "loading", false);

      const data = gatherModalFormData($form);

      await onSubmit?.({
        key: entryKey,
        formId: cfg.formId,
        resendTemplate: cfg.resendTemplate ?? "",
        data,
        config: cfg,
      });

      closeFormModal();
    } catch (err) {
      console.error(err);
    } finally {
      setButtonState($(this), "enable", true);
    }
  });

  $(cancelButton).on("click.formModalCancel", function (e) {
    e.preventDefault();
    closeFormModal();
    onCancel?.();
  });

  openFormModal();
}
