import { applyTextBindings } from "../utils/dataBinding";

const $container = $(".modal-container");
const $backdrop = $(".modal-backdrop");
const $modal = $(".modal");

gsap.set($container, { display: "flex", pointerEvents: "none" });
gsap.set($backdrop, { autoAlpha: 0 });
gsap.set($modal, { autoAlpha: 0, y: 8, scale: 0.95 });

export function renderModal(heading, body, cancelText, confirmText, fn) {
  const confirmButton = $modal
    .find(".button-md")
    .filter("[data-wf--default-button--variant='base']");
  const cancelButton = $modal
    .find(".button-md")
    .filter("[data-wf--default-button--variant='secondary']");

  if (cancelText == "") {
    cancelButton.css("display", "none");
  }

  applyTextBindings($(".modal"), {
    "modal-heading": heading,
    "modal-body": body,
    "modal-primary-button": confirmText,
    "modal-secondary-button": cancelText,
  });

  let tl = gsap
    .timeline({
      paused: true,
      onComplete: () => gsap.set($backdrop, { pointerEvents: "auto" }),
    })
    .to($backdrop, { autoAlpha: 1 })
    .to($modal, { autoAlpha: 1, scale: 1 }, "<0.2");

  tl.play();

  // Prevent stacking listeners when renderModal() is called multiple times
  $(confirmButton).off("click.modalConfirm");
  $(cancelButton).off("click.modalCancel");

  $(confirmButton).on("click.modalConfirm", function (e) {
    e.preventDefault();
    gsap
      .timeline()
      .to($modal, { autoAlpha: 0, scale: 0.95 })
      .to($backdrop, { autoAlpha: 0, pointerEvents: "none" }, "<0.2");

    fn?.();
  });

  $(cancelButton).on("click.modalCancel", function (e) {
    e.preventDefault();
    gsap
      .timeline()
      .to($modal, { autoAlpha: 0, scale: 0.95 })
      .to($backdrop, { autoAlpha: 0, pointerEvents: "none" }, "<0.2");
  });
}
