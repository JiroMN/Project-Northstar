import { Query } from "appwrite";
import { getCollection } from "../../appwrite/db";
import { RELATIONSHIPSELECTORS } from "../../config/optionRegistry";
import { applyTextBindings } from "../../utils/dataBinding";
import { getCssValueFromVarName } from "../../utils/helpers";
import { onClientSelect } from "../../utils/studioHelpers";

// Relationship Selectors
const relationshipSelector = $(".relationship-input");
const relationshipSelectorList = $(".relationship-input-list");
const listItemTemplate = $("#relationshipListItemTemplate").detach();
const RELATIONSHIP_BASE_Z_INDEX = 10;
let highestRelationshipZIndex = RELATIONSHIP_BASE_Z_INDEX;

gsap.set(relationshipSelectorList, { display: "flex", autoAlpha: 0 });

relationshipSelector.each(async (index, relationshipSelector) => {
  const $relationshipSelector = $(relationshipSelector);
  const $container = $relationshipSelector.parent();
  $container.css("z-index", RELATIONSHIP_BASE_Z_INDEX);
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
  if (!relRegistryItem) {
    console.warn(
      `[relationshipSelector] No relation config found for key "${relKey}". Skipping.`,
    );
    return;
  }
  const boundToClient = relRegistryItem.boundToClient;
  // ClientData
  let selectedClientId = "";
  // Data
  let selectedItems = [];
  let relationResponse;

  function resetSelectorState() {
    selectedItems = [];
    $input.val("");
    applyTextBindings($relationshipSelector, {
      placeholder: relRegistryItem.placeholder,
    });

    $list.find(".relationship-input-list-item").removeClass("selected");
    gsap.set($list.find(".relationship-input-list-item"), {
      clearProps: "backgroundColor,color",
    });

    isOpened = false;
    $relationshipSelector.attr("data-is-opened", "false");
    gsap.set($list, { autoAlpha: 0 });
  }

  onClientSelect(async (clientId) => {
    try {
      selectedClientId = clientId;
      resetSelectorState();
      const queries = boundToClient ? [Query.equal("client_id", clientId)] : [];
      relationResponse = await getCollection(
        relRegistryItem.databaseId,
        relRegistryItem.collectionId,
        queries,
      );

      setTimeout(() => {
        renderOptions(relationResponse);
      }, 500);
    } catch (err) {
      console.error("[relationshipSelector.js]", err);
    }
  });

function renderOptions(res) {
    $list.html("");

    let message =
      selectedClientId == ""
        ? "Selecteer eerst een bedrijf"
        : `Geen data gevonden voor ${relRegistryItem.placeholder}`;

    if (!res || !res.documents || res.documents.length === 0) {
      $list.html(
        `<div class='sm fg-50 text-align-center line-height-large'>${message}</div>`,
      );
      $listItems = $container.find(".relationship-input-list-item");
      return;
    }

    $(res.documents).each((__, doc) => {
      const fallbackLabel =
        doc?.[relRegistryItem.labelKey] ?? doc?.title ?? doc?.name ?? doc?.$id;
      let listItemClone = listItemTemplate.clone(true);

      if (!listItemClone.length) {
        listItemClone = $(`
          <div class="relationship-input-list-item">
            <div class="sm weight-regular fg-inherit truncate-2" data-bind="label"></div>
            <div class="sm weight-regular fg-inherit" data-bind="id"></div>
          </div>
        `);
      }

      listItemClone
        .attr("id", "")
        .css("display", "flex")
        .attr("data-document-id", doc.$id);
      listItemClone.appendTo($list);
      applyTextBindings(listItemClone, {
        label: fallbackLabel,
        id: doc.$id,
      });

      if (!listItemClone.find("[data-bind='label']").length) {
        listItemClone.text(fallbackLabel);
      }
    });

    $listItems = $container.find(".relationship-input-list-item");
  }

  // Relationship Logic
  function handleSelect(id) {
    console.log(id);

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
  $input.attr("name", relKey).attr("id", relKey); // Set input name to relationRegistry key

  renderOptions(relationResponse);

  // Event Handlers
  function toggleOptions() {
    const isDisabled = $relationshipSelector.attr("data-disabled");
    if (isDisabled) return;

    highestRelationshipZIndex += 1;
    $container.css("z-index", highestRelationshipZIndex);

    // Re-select list items because they are created async
    $listItems = $container.find(".relationship-input-list-item");

    const tl = gsap.timeline({
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
    });

    tl.set($listItems, { autoAlpha: 0, yPercent: 50 });

    tl.fromTo(
      $list,
      {
        yPercent: isOpened ? 0 : -25,
        filter: isOpened ? "blur(0px)" : "blur(5px)",
      },
      {
        yPercent: 0,
        filter: isOpened ? "blur(5px)" : "blur(0px)",
        autoAlpha: isOpened ? 0 : 1,
        duration: 0.35,
      },
    );

    tl.add(() => {
      if (!isOpened) {
        const itemCount = $listItems.length;
        const stagger = itemCount > 10 ? 0.015 : 0.05;
        tl.to($listItems, {
          autoAlpha: 1,
          yPercent: 0,
          stagger: stagger,
          duration: 0.35,
        });
      }
    }, "<25%");
  }

  $relationshipSelector
    .off("click.openOptions")
    .on("click.openOptions", function () {
      toggleOptions();
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
      !isMultiple && toggleOptions();
    });
});
