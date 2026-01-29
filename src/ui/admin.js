// Handles (custom) inputs such as relationship selectors

import { getCollection } from "../appwrite/db";
import { RELATIONSHIPSELECTORS } from "../config/relationshipSelectorRegistry";
import { applyTextBindings } from "../utils/dataBinding";
import { getCssValueFromVarName } from "../utils/helpers";

// Relationship Selector
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

  // Logic
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
