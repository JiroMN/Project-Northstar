let pending = 0;

// Anti-flicker timing
const HIDE_GRACE_MS = 220; // small delay to prevent off/on flashes
const MIN_VISIBLE_MS = 450; // once shown, keep visible at least this long

let shownAt = 0;
let hideTimer = null;

function cancelScheduledHide() {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
}

function scheduleHide() {
  cancelScheduledHide();

  hideTimer = setTimeout(() => {
    // If something started loading again, do nothing
    if (pending !== 0) return;

    const elapsed = Date.now() - shownAt;
    const waitForMin = Math.max(0, MIN_VISIBLE_MS - elapsed);

    hideTimer = setTimeout(() => {
      if (pending !== 0) return;
      hideLoader();
      console.log("done");
    }, waitForMin);
  }, HIDE_GRACE_MS);
}

const getOverlay = $(".ui-content-overlay");
const $loader = getOverlay.find(".loader");
const $spinner = $loader.find(".loader-icon");

let loadingTl = gsap
  .timeline({ paused: true, defaults: { overwrite: true } })
  .add(() => $loader.css("display", "flex"))
  .fromTo(
    $loader,
    {
      autoAlpha: 0,
    },
    {
      autoAlpha: 1,
    },
    "<"
  )
  .fromTo(
    $spinner,
    {
      rotate: 0,
    },
    {
      rotate: 360,
      ease: "none",
      repeat: -1,
      duration: 0.5,
    },
    "<"
  );

let hideLoaderTl = gsap
  .timeline({ paused: true, defaults: { overwrite: false } })
  .fromTo($spinner, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.5 }, "<")
  .add(() => gsap.killTweensOf($spinner))
  .fromTo(
    $loader,
    {
      autoAlpha: 1,
    },
    {
      autoAlpha: 0,
      duration: 0.75,
    },
    "<50%"
  )
  .add(() => $loader.css("display", "none"), ">");

function showLoader() {
  console.log("Showing Loader", $loader.length);
  if (!$loader.length) return;

  // Already visible: don't restart the show animation
  if ($loader.attr("is-loading") === "true") return;

  // Stop any hide animation mid-flight
  //   hideLoaderTl.pause();

  $loader.attr("is-loading", "true");
  loadingTl.play(0);
}

function hideLoader() {
  console.log($loader.length);
  if (!$loader.length) return;
  $loader.attr("is-loading", "false");

  // Pause the spinner timeline without jumping back to the start (prevents snap-to-hidden)
  //   loadingTl.pause();

  // Replay hide from the start every time
  hideLoaderTl.play(0);
}

// Wrap any async call with loader handling
export async function withLoader(promise) {
  // Cancel any pending hide because we're loading again
  cancelScheduledHide();

  pending += 1;
  console.log("loader called", pending);

  if (pending === 1) {
    shownAt = Date.now();
    showLoader();
  }

  try {
    return await promise;
  } finally {
    pending -= 1;

    if (pending === 0) {
      // Hide with grace + minimum visible time
      scheduleHide();
    }
  }
}
