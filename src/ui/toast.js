// Dynamic Toast Component
import { applyTextBindings } from "../utils/dataBinding";
import { appearFromRight, disappearToRight } from "../animations/helpers/micro";

// Template toasts
const toast = $(".toast");

const positiveToast = toast.filter('[data-wf--toast--variant="positive"]');
const negativeToast = toast.filter('[data-wf--toast--variant="negative"]');
const warningToast = toast.filter('[data-wf--toast--variant="warning"]');
const announcementToast = toast.filter(
  '[data-wf--toast--variant="announcement"]'
);

// The parent element that already contains the 4 template toasts
const toastContainer = toast.parent();

// Ensure container can anchor absolutely positioned toast instances
if (toastContainer.css("position") === "static") {
  toastContainer.css({ position: "relative" });
}

gsap.set(toast, { display: "none", autoAlpha: 0 });

// Layout helper: stack visible toast instances top-to-bottom
function layoutToastStack() {
  let y = 0;

  const $instances = toastContainer.children(".toast.toast-instance");

  $instances.each((_, el) => {
    const $el = $(el);
    const h = el.getBoundingClientRect().height;
    const mb = parseFloat(getComputedStyle(el).marginBottom) || 0;

    gsap.to($el, {
      y,
      duration: 0.25,
      ease: "power2.out",
      overwrite: "auto",
    });

    y += h + mb;
  });
}

function createToastInstance($template) {
  // Clone template and make it an instance
  const $instance = $template.clone(true, true);
  $instance.addClass("toast-instance");

  // Absolutely position instances so we control stacking via GSAP (prevents double spacing)
  $instance.css({ position: "absolute", top: 0, right: 0, left: "auto" });

  // Start hidden; appearFromRight will animate it in
  gsap.set($instance, { display: "flex", autoAlpha: 0, y: 0 });

  // Reset timer bar if present
  $instance.find(".toast-close-timer-bar-progress").css("width", "0%");

  // Inject into the same container as the templates
  // Newest on top
  toastContainer.prepend($instance);

  // Recompute stack positions
  layoutToastStack();

  return $instance;
}

function destroyToastInstance($instance) {
  $instance.remove();
  layoutToastStack();
}

export function renderToast(heading, body, state, displayDuration = 2000) {
  let $template;

  switch (state) {
    case "positive":
      $template = positiveToast;
      break;
    case "negative":
      $template = negativeToast;
      break;
    case "warning":
      $template = warningToast;
      break;
    case "announcement":
      $template = announcementToast;
      break;
    default:
      $template = positiveToast;
      break;
  }

  const $instance = createToastInstance($template);

  // Bind ONLY within this toast instance
  applyTextBindings($instance, {
    "toast-heading": heading,
    "toast-body": body,
  });

  // Appear
  appearFromRight($instance);

  // Timer bar (if present)
  const $bar = $instance.find(".toast-close-timer-bar-progress");
  if ($bar.length) {
    gsap.fromTo(
      $bar,
      { width: "0%" },
      { width: "100%", duration: displayDuration / 1000, ease: "none" }
    );
  }

  // Hide + cleanup
  setTimeout(() => {
    // Play out animation, then remove the node and re-layout
    disappearToRight($instance);

    // Remove after the out animation has had time to complete
    // (micro helpers typically use ~0.25-0.5s)
    setTimeout(() => {
      destroyToastInstance($instance);
    }, 600);
  }, displayDuration);
}
