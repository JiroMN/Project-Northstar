import { checkAuth, checkContinuityAccess } from "../appwrite/auth";
import { getAllContinuityPackages, getClientData } from "../appwrite/db";
import {
  createPortalSession,
  getAllStripeProducts,
} from "../appwrite/functions";
import { CONFIG } from "../config/public";
import { renderToast } from "../ui/toast";
import { applyTextBindings } from "../utils/dataBinding";
import { getErrorMessage, stripePriceToEuroFormat } from "../utils/helpers";

await checkAuth();
const clientData = await getClientData();
const continuityAccess = await checkContinuityAccess(false, false, true);
const stripeProducts = await getAllStripeProducts();
const allPackages = await getAllContinuityPackages();
const portalSession = await createPortalSession(
  clientData.client.documents[0].stripe_customer_id,
  window.location.href,
);
console.log(portalSession);

const template = $("#offeringCardTemplate");

// console.log(continuityAccess);
// console.log(stripeProducts);

function renderData() {
  try {
    const currentProduct = continuityAccess.appwrite.documents[0];
    const currentStripeProduct = continuityAccess.stripe.product;

    $(allPackages.documents).each((__, pkg) => {
      const clone = template.clone(false);
      clone
        .attr("id", "")
        .css("display", "flex")
        .attr("stripe-product-id", pkg.stripe_product_id);

      clone.appendTo(".package-offerings-container");

      const freeHours = pkg.total_hours - pkg.reserved_consulting_hours;

      applyTextBindings(clone, {
        "total-hours": pkg.total_hours,
        "reserved-consulting": pkg.reserved_consulting_hours,
        "free-hours": freeHours,
      });
    });

    const renderedOfferings = $(".package-offering");

    $(stripeProducts.products).each((__, product) => {
      const productPrice = stripePriceToEuroFormat(
        product.default_price.unit_amount,
      );

      const correspondingOfferingCard = renderedOfferings.filter((__, card) => {
        return $(card).attr("stripe-product-id") === product.id;
      });

      applyTextBindings(correspondingOfferingCard, {
        title: product.name,
        description: product.description,
        price: productPrice,
        "recurring-interval": product.default_price.recurring.interval_count,
      });

      $(correspondingOfferingCard)
        .find(".package-offering-icon")
        .css("background-image", `url(${product.images[0]})`);

      if (continuityAccess) {
        if (currentStripeProduct.id.id == product.id) {
          const button = correspondingOfferingCard.find(".button");
          const buttonPrimary = correspondingOfferingCard.find(
            ".package-offering-info-button-wrapper.primary",
          );
          const buttonSecondary = correspondingOfferingCard.find(
            ".package-offering-info-button-wrapper.secondary",
          );

          buttonPrimary.hide();
          buttonSecondary.show();

          button.on("click", function () {
            window.location.href = portalSession.session.url;
          });

          applyTextBindings(correspondingOfferingCard, {
            action: "beheer",
          });
        }
      }
    });
  } catch (err) {
    console.error(err);
    renderToast("Oeps!", getErrorMessage(err), "negative");
  }
}

renderData();
