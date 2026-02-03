import { appearFromTop, disappearToTop } from "../animations/helpers/micro";
import { applyTextBindings } from "../utils/dataBinding";

export default function logUploadProgress(label = "upload") {
  const uploadCard = $(".upload-progress-card");
  const uploadCardProgress = uploadCard.find(".upload-progress-bar-inner");

  gsap.set(uploadCard, { display: "flex", autoAlpha: 0 });
  gsap.to(uploadCardProgress, { width: "0%" });

  return function onProgress(progress) {
    if (uploadCard.attr("data-showing") !== "true") {
      appearFromTop(uploadCard);
      uploadCard.attr("data-showing", "true");
    }

    const percent = Math.round(progress.progress);
    gsap.to(uploadCardProgress, { width: `${percent}%` });

    console.log(`[${label}] ${percent}%`);

    if (percent >= 100) {
      disappearToTop(uploadCard);
      uploadCard.attr("data-showing", "false");
    }
  };
}
