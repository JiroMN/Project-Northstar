import { checkAuth, checkContinuityAccess } from "../appwrite/auth";
import { getAllContinuityPackages, getClientData } from "../appwrite/db";
import {
  createPortalSession,
  getAllStripeProducts,
} from "../appwrite/functions";
import { withLoader } from "../ui/loader";
import { renderToast } from "../ui/toast";
import { applyTextBindings } from "../utils/dataBinding";
import { getErrorMessage, stripePriceToEuroFormat } from "../utils/helpers";

await checkAuth();
const clientData = await getClientData();
const continuityAccess = await withLoader(
  checkContinuityAccess(false, false, true),
);
const stripeProducts = await withLoader(getAllStripeProducts());
const allPackages = await getAllContinuityPackages();
const portalSession = await createPortalSession(
  clientData.client.documents[0].stripe_customer_id,
  window.location.href,
);

let currentlyActivePackage;

const template = $("#offeringCardTemplate");

// console.log(continuityAccess);
// console.log(stripeProducts);

function renderData() {
  try {
    const currentStripeProduct = continuityAccess
      ? continuityAccess.stripe.product
      : null;

    // Render all packages into HTML based on Appwrite database response
    $(allPackages.documents).each((__, pkg) => {
      const clone = template.clone(true);
      clone.attr("id", "").attr("stripe-product-id", pkg.stripe_product_id);

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
      const correspondingOfferingCard = renderedOfferings.filter((__, card) => {
        return $(card).attr("stripe-product-id") === product.id;
      });
      const productPrice = stripePriceToEuroFormat(
        product.default_price.unit_amount,
      );
      const effectiveHourlyRate =
        productPrice /
        parseInt(
          correspondingOfferingCard.find("[data-bind='total-hours']").text(),
        );

      //   Only show card when there is a matching Stripe Product & Create price attribute
      correspondingOfferingCard
        .css("display", "flex")
        .attr("data-price-amount", productPrice);

      applyTextBindings(correspondingOfferingCard, {
        title: product.name,
        description: product.description,
        price: productPrice,
        "recurring-interval": product.default_price.recurring.interval_count,
        "eur-per-hour": effectiveHourlyRate,
      });

      // Set product image
      $(correspondingOfferingCard)
        .find(".package-offering-icon")
        .css("background-image", `url(${product.images[0]})`);

      // Check which package is active on account and handle button styling
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
          correspondingOfferingCard.attr("data-current-package", "true");
          currentlyActivePackage = product;
        }
      }
    });

    // Set button text values
    renderedOfferings.not(template).each((__, offeringsCard) => {
      const $card = $(offeringsCard);
      const price = $card.attr("data-price-amount");
      const currentlyActivePackagePrice =
        continuityAccess && currentlyActivePackage
          ? stripePriceToEuroFormat(
              currentlyActivePackage.default_price.unit_amount,
            )
          : null;
      let text = "Selecteer";

      if ($card.attr("data-current-package") === "true") {
        applyTextBindings($card, {
          action: "beheer",
        });
      } else {
        if (price < currentlyActivePackagePrice) {
          //   Check if offering is an upgrade or a downgrade based on value
          text = "Downgrade";
        } else if (price > currentlyActivePackagePrice) {
          text = "Upgrade";
        }
        applyTextBindings($card, {
          action: text,
        });
      }
    });
  } catch (err) {
    console.error(err);
    renderToast("Oeps!", getErrorMessage(err), "negative");
  }
}

renderData();
