import { getCollection } from "../appwrite/db";
import { RELATIONSHIPSELECTORS, SELECTS } from "../config/optionRegistry";
import { applyTextBindings } from "../utils/dataBinding";
import { getCssValueFromVarName } from "../utils/helpers";

// Client Selector
const clientSelector = $(".client-selector");

// Relationship Selectors
const relationshipSelector = $(".relationship-input");
const relationshipSelectorList = $(".relationship-input-list");
const listItemTemplate = $("#relationshipListItemTemplate");

gsap.set(relationshipSelectorList, { display: "flex", autoAlpha: 0 });

relationshipSelector.each(async (__, relationshipSelector) => {
  const $relationshipSelector = $(relationshipSelector);
  const $container = $relationshipSelector.parent();
  const $input = $container.find("input");
  const $list = $container.find(".relationship-input-list");
  let $listItems = $container.find(".relationship-input-list-item");
  // Attributes
  const isMultipleAttr = $relationshipSelector.attr("data-rel-multiple");
  const isOpenedAttr = $relationshipSelector.attr("data-is-opened");
  let isOpened = isOpenedAttr === "true";
  let isMultiple = isMultipleAttr === "true";
  // Relationregistry
  const relKey = $relationshipSelector.attr("data-rel-key");
  const relRegistryItem = RELATIONSHIPSELECTORS[relKey];
  // Data
  let selectedItems = [];
  const response = await getCollection(
    relRegistryItem.databaseId,
    relRegistryItem.collectionId,
  );

  // Relationship Logic
  function handleSelect(id) {
    if (isMultiple) {
      if (!selectedItems.includes(id)) {
        selectedItems.push(id);
      } else {
        const index = selectedItems.indexOf(id);
        if (index > -1) {
          selectedItems.splice(index, 1);
        }
      }
    } else {
      selectedItems = [id];
    }
    if (selectedItems.length > 0) {
      applyTextBindings($relationshipSelector, {
        placeholder: `${selectedItems.length} relatie${selectedItems.length > 1 ? "s" : ""}`,
      });
    } else {
      applyTextBindings($relationshipSelector, {
        placeholder: relRegistryItem.placeholder,
      });
    }
    $input.val(selectedItems.toString());
  }

  applyTextBindings($relationshipSelector, {
    placeholder: relRegistryItem.placeholder,
  });
  $input.attr("name", relKey); // Set input name to relationRegistry key

  $(response.documents).each((__, doc) => {
    const listItemClone = listItemTemplate.clone(true);

    listItemClone
      .attr("id", "")
      .css("display", "flex")
      .attr("data-document-id", doc.$id);
    listItemClone.appendTo($list);
    applyTextBindings(listItemClone, {
      label: doc[relRegistryItem.labelKey],
      id: doc.$id,
    });
  });

  $listItems = $container.find(".relationship-input-list-item");

  // Event Handlers
  $relationshipSelector
    .off("click.openOptions")
    .on("click.openOptions", function () {
      // Re-select list items because they are created async
      $listItems = $container.find(".relationship-input-list-item");

      let tl = gsap
        .timeline({
          onStart: () => {
            $relationshipSelector.css("pointer-events", "none");
            $listItems.css("pointer-events", "none");
          },
          onComplete: () => {
            $relationshipSelector.attr("data-is-opened", "true");
            isOpened ? (isOpened = false) : (isOpened = true);
            $relationshipSelector.css("pointer-events", "auto");
            $listItems.css("pointer-events", "auto");
          },
        })
        .set($listItems, { autoAlpha: 0, yPercent: 50 })
        .fromTo(
          $list,
          {
            yPercent: isOpened ? 0 : -25,
            filter: isOpened ? "blur(0px)" : "blur(5px)",
          },
          {
            yPercent: isOpened ? -25 : 0,
            filter: isOpened ? "blur(5px)" : "blur(0px)",
            autoAlpha: isOpened ? 0 : 1,
            duration: 0.35,
          },
        )
        .add(() => {
          !isOpened &&
            tl.to($listItems, {
              autoAlpha: 1,
              yPercent: 0,
              stagger: 0.1,
              duration: 0.35,
            });
        }, "<25%");
    });

  // Hover State for ListItems (delegated; works with async appended items)
  $list
    .off("mouseenter.hoverListItem", ".relationship-input-list-item")
    .on(
      "mouseenter.hoverListItem",
      ".relationship-input-list-item",
      function () {
        const $item = $(this);
        if ($item.hasClass("selected")) return;

        // Store originals once per item.
        // Use the computed values before we apply any hover tween.
        if ($item.data("originalBg") == null) {
          $item.data("originalBg", $item.css("background-color"));
          $item.data("originalFg", $item.css("color"));
        }

        gsap.to($item, {
          backgroundColor: getCssValueFromVarName("var(--background--75)"),
          color: getCssValueFromVarName("var(--foreground--75)"),
        });
      },
    );

  $list
    .off("mouseleave.hoverListItem", ".relationship-input-list-item")
    .on(
      "mouseleave.hoverListItem",
      ".relationship-input-list-item",
      function () {
        const $item = $(this);
        if ($item.hasClass("selected")) return;

        gsap.to($item, {
          backgroundColor: $item.data("originalBg"),
          color: $item.data("originalFg"),
        });
      },
    );

  $list
    .off("click.selectListItem", ".relationship-input-list-item")
    .on("click.selectListItem", ".relationship-input-list-item", function () {
      const $item = $(this);

      // Stop hover tweens
      gsap.killTweensOf($item);

      if (!isMultiple) {
        const $others = $list
          .find(".relationship-input-list-item.selected")
          .not($item);

        if ($others.length) {
          gsap.killTweensOf($others);
          $others.removeClass("selected");
          gsap.set($others, { clearProps: "backgroundColor,color" });
        }
      }

      // Toggle selected on clicked item
      $item.toggleClass("selected");

      gsap.set($item, { clearProps: "backgroundColor,color" });

      // Update input value
      handleSelect($item.attr("data-document-id"));
    });
});

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
