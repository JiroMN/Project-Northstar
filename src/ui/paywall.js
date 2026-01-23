const template = $("#partialPaywallTemplate");

export function behindContinuityPaywall(target, options = {}) {
  $(target).each((_, el) => {
    const $root = $(el);

    if ($root.css("position") === "static") {
      $root.css("position", "relative");
    }

    // Kill navigation inside this block
    $root.find("a").addBack("a").removeAttr("href");

    // Add overlay (no event cloning)
    const $overlay = template.clone(false).attr("id", "");

    $overlay.css("pointer-events", "auto");

    // Swallow ALL mouse/hover events so delegated hover handlers never fire.
    // Allow ONLY a click on the CTA button.
    const swallow = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    };

    $overlay.on(
      "mouseenter mouseleave mouseover mouseout mousemove mousedown mouseup",
      swallow,
    );

    $overlay.on("click", (e) => {
      if ($(e.target).closest(".partial-paywall-button").length) {
        // Let the CTA work.
        return;
      }
      swallow(e);
    });

    // Avoid stacking overlays
    $root.find("> .partial-paywall").remove();

    // Disable interaction underneath
    $root.children().css("pointer-events", "none");

    $root.append($overlay);
  });
}
