import { applyTextBindings } from "../utils/dataBinding";

const $container = $(".modal-container");
const $backdrop = $(".modal-backdrop");
const $modal = $(".modal");

gsap.set($container, { display: "flex", pointerEvents: "none" });
gsap.set($backdrop, { autoAlpha: 0 });
gsap.set($modal, { autoAlpha: 0, y: 8, scale: 0.95 });

function closeModal(onComplete) {
  gsap.killTweensOf([$backdrop, $modal]);

  gsap
    .timeline({
      onComplete: () => {
        $container.css("pointer-events", "none");
        onComplete?.();
      },
    })
    .fromTo($modal, { autoAlpha: 1, scale: 1, y: 0 }, { autoAlpha: 0, scale: 0.95, y: 8 })
    .fromTo(
      $backdrop,
      { autoAlpha: 1, pointerEvents: "auto" },
      { autoAlpha: 0, pointerEvents: "none" },
      "<0.2",
    );
}

function openModal() {
  gsap.killTweensOf([$backdrop, $modal]);

  gsap
    .timeline({
      onStart: () => $container.css("pointer-events", "auto"),
      onComplete: () => gsap.set($backdrop, { pointerEvents: "auto" }),
    })
    .fromTo($backdrop, { autoAlpha: 0, pointerEvents: "none" }, { autoAlpha: 1 }, 0)
    .fromTo($modal, { autoAlpha: 0, scale: 0.95, y: 8 }, { autoAlpha: 1, scale: 1, y: 0 }, "<0.2");
}

export function renderModal(heading, body, cancelText, confirmText, fn) {
  const confirmButton = $modal
    .find(".button-md")
    .filter("[data-wf--default-button--variant='base']");
  const cancelButton = $modal
    .find(".button-md")
    .filter("[data-wf--default-button--variant='secondary']");

  if (cancelText == "") {
    cancelButton.css("display", "none");
  } else {
    cancelButton.css("display", "");
  }

  applyTextBindings($(".modal"), {
    "modal-heading": heading,
    "modal-body": body,
    "modal-primary-button": confirmText,
    "modal-secondary-button": cancelText,
  });

  openModal();

  // Prevent stacking listeners when renderModal() is called multiple times
  $(confirmButton).off("click.modalConfirm");
  $(cancelButton).off("click.modalCancel");

  $(confirmButton).on("click.modalConfirm", function (e) {
    e.preventDefault();
    closeModal(fn);
  });

  $(cancelButton).on("click.modalCancel", function (e) {
    e.preventDefault();
    closeModal();
  });
}
