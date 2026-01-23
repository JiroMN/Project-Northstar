import { renderToast } from "../ui/toast";

setTimeout(() => {
  try {
    const rawSearch = window.location.search || "";

    const params = new URLSearchParams(rawSearch);

    const title = params.get("toast_title");
    const message = params.get("toast_message");
    const variant = params.get("toast_variant");
    const shown = params.get("shown");

    if (!title || !message || !variant || shown) return;

    renderToast(title, message, variant, 3000);

    console.log("Showed toast");
    params.append("shown", "1");

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
  } catch (_) {}
}, 3000);
