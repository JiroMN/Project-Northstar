import { SELECTS } from "../../config/optionRegistry";
import { applyTextBindings } from "../../utils/dataBinding";
import { getCssValueFromVarName } from "../../utils/helpers";

// File Uploaders
const uploadContainer = $(".file-upload-ui");

uploadContainer.each((__, container) => {
  const $container = $(container);
  const $uploader = $container.find(".file-upload-ui-element");
  const $uploaderInput = $container.find(".file-upload-input");

  $uploaderInput.off("change.upload").on("change.upload", function () {
    const files = $uploaderInput[0].files;
    applyTextBindings($uploader, {
      "file-name": files[0].name,
    });
  });
});

// Checkbox
const checkboxes = $(".checkbox");
gsap.set(".checkbox-ui-icon", {
  display: "inline-block",
  autoAlpha: 0,
  yPercent: 100,
});

function toggleCheckboxAnim(iconContainer, isChecked) {
  const $iconContainer = $(iconContainer);
  const $icon = $iconContainer.find(".checkbox-ui-icon");

  if ($iconContainer.data("originalBg") == null) {
    $iconContainer.data("originalBg", $iconContainer.css("background-color"));
  }

  const originalBg = $iconContainer.data("originalBg");
  const checkedBg = getCssValueFromVarName(
    "var(--_all-colors---light--background)",
  );

  gsap.killTweensOf([$iconContainer[0], $icon[0]]);

  return gsap
    .timeline({})
    .to($iconContainer, {
      backgroundColor: isChecked ? checkedBg : originalBg,
      duration: 0.2,
    })
    .to(
      $icon,
      {
        yPercent: isChecked ? 0 : 100,
        autoAlpha: isChecked ? 1 : 0,
        duration: 0.35,
        ease: "back.out",
      },
      "<75%",
    );
}

checkboxes.each((__, checkbox) => {
  const $checkbox = $(checkbox);
  const $input = $checkbox.find(".checkbox-input");
  const $button = $checkbox.find(".checkbox-ui");
  const $buttonIndicator = $button.find(".checkbox-ui-icon-container");

  // Initial UI sync (supports Webflow default checked)
  toggleCheckboxAnim($buttonIndicator, $input.prop("checked"));

  // Keep UI in sync whenever the real input changes (keyboard/label/programmatic)
  $input.off("change.checkbox").on("change.checkbox", function () {
    const isChecked = $(this).prop("checked");
    toggleCheckboxAnim($buttonIndicator, isChecked);
  });

  // Prevent container click from also toggling the native input when you click the input itself
  $input.off("click.stopPropagation").on("click.stopPropagation", function (e) {
    e.stopPropagation();
  });

  // Toggle via the custom UI (and manually trigger change so the animation always runs)
  $button.off("click.check").on("click.check", function (e) {
    e.preventDefault();
    const nextChecked = !$input.prop("checked");
    $input.prop("checked", nextChecked).trigger("change");
  });
});

// Select Input
const selects = $(".select");

selects.each((__, select) => {
  const $select = $(select);
  const selectKey = $select.attr("data-select-key");
  const selectObj = SELECTS[selectKey];
  const options = selectObj.options;

  applyTextBindings($select.find("option"), {
    "select-placeholder": selectObj.placeholder,
  });

  $(options).each((__, option) => {
    $select.append(`<option value='${option.value}' >${option.label}</option>`);
  });
});
