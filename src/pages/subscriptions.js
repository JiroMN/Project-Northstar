import { checkAuth, checkContinuityAccess } from "../appwrite/auth";
import { getAllStripeProducts } from "../appwrite/functions";
import { applyTextBindings } from "../utils/dataBinding";

await checkAuth();
const continuityAccess = await checkContinuityAccess(false, false, true);
const stripeProducts = await getAllStripeProducts();

console.log(continuityAccess);
console.log(stripeProducts);

function renderData() {
  if (continuityAccess) {
    const packageElem = $(".package-offering");
    const appwrite = continuityAccess.appwrite.documents[0];
    const stripe = continuityAccess.stripe;

    packageElem.each((__, pkg) => {
      applyTextBindings($(pkg), {
        title: "",
        description: "",
        "total-hours": "",
        "reserved-consulting": "",
        "free-hours": "",
        "eur-per-hour": "",
        "price-per-3-months": "",
      });
    });
  }
}

// renderData();
