import { getAllClients } from "../../appwrite/db";
import { getFilePreview } from "../../appwrite/storage";
import APPWRITE from "../../config/public";
import { applyTextBindings } from "../../utils/dataBinding";
import { getCssValueFromVarName } from "../../utils/helpers";

// Client Selector
const clientSelector = $(".client-selector");
const clientSelectorList = $(".client-selector-list");
const listItemTemplate = $("#clientListItemTemplate");
const clientSelectorInfo = $(".client-selector-info");
const clientSelectorPlaceholder = $(".client-selector-placeholder");

let selectedClient = "";

gsap.set(clientSelectorList, { display: "flex", autoAlpha: 0 });
gsap.set(clientSelectorInfo, { autoAlpha: 0, yPercent: 100 });

clientSelector.each(async (__, selector) => {
  const $clientSelector = $(selector);
  const $container = $clientSelector.parent();
  const $avatar = $container.find(".client-selector-avatar");
  const $list = $container.find(".client-selector-list");
  let $listItems = $container.find(".client-selector-list-item");
  // Attributes
  const isOpenedAttr = $clientSelector.attr("data-is-opened");
  let isOpened = isOpenedAttr === "true";
  // Data
  const allClients = await getAllClients();

  $(allClients.database).each((__, client) => {
    const clone = listItemTemplate.clone(true);

    clone
      .attr("id", "")
      .css("display", "flex")
      .attr("data-client-id", client.$id)
      .appendTo($list);

    applyTextBindings(clone, {
      label: client.name,
      id: client.$id,
    });
  });

  async function handleSelect(clientId) {
    const client = $(allClients.database).filter((__, client) => {
      return client.$id === clientId;
    });
    const avatar = await getFilePreview(
      APPWRITE.buckets.clientFiles.id,
      client[0].avatar_file_id,
    );
    $("body").attr("data-selected-client-id", client[0].$id);

    applyTextBindings($clientSelector, {
      "selected-client-name": client[0].name,
    });
    $avatar.css("background-image", `url('${avatar}')`);

    if (!selectedClient) {
      gsap
        .timeline({ defaults: { duration: 0.3, ease: "back.out" } })
        .to(clientSelectorPlaceholder, { yPercent: -100, autoAlpha: 0 })
        .to(clientSelectorInfo, { yPercent: 0, autoAlpha: 1 }, "<");
    }

    selectedClient = client[0].$id;
  }

  $clientSelector.off("click.openOptions").on("click.openOptions", function () {
    // Re-select list items because they are created async
    $listItems = $container.find(".client-selector-list-item");

    let tl = gsap
      .timeline({
        onStart: () => {
          $clientSelector.css("pointer-events", "none");
          $listItems.css("pointer-events", "none");
        },
        onComplete: () => {
          $clientSelector.attr("data-is-opened", "true");
          isOpened ? (isOpened = false) : (isOpened = true);
          $clientSelector.css("pointer-events", "auto");
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
    .off("mouseenter.hoverListItem", ".client-selector-list-item")
    .on("mouseenter.hoverListItem", ".client-selector-list-item", function () {
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
    });

  $list
    .off("mouseleave.hoverListItem", ".client-selector-list-item")
    .on("mouseleave.hoverListItem", ".client-selector-list-item", function () {
      const $item = $(this);
      if ($item.hasClass("selected")) return;

      gsap.to($item, {
        backgroundColor: $item.data("originalBg"),
        color: $item.data("originalFg"),
      });
    });

  $list
    .off("click.selectListItem", ".client-selector-list-item")
    .on("click.selectListItem", ".client-selector-list-item", function () {
      const $item = $(this);

      // Stop hover tweens
      gsap.killTweensOf($item);

      const $others = $list
        .find(".client-selector-list-item.selected")
        .not($item);

      if ($others.length) {
        gsap.killTweensOf($others);
        $others.removeClass("selected");
        gsap.set($others, { clearProps: "backgroundColor,color" });
      }

      // Toggle selected on clicked item
      $item.toggleClass("selected");

      gsap.set($item, { clearProps: "backgroundColor,color" });

      // Update input value
      handleSelect($item.attr("data-client-id"));
    });
});
