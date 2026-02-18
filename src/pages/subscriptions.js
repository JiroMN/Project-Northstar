import { checkAuth, checkContinuityAccess } from "../appwrite/auth";
import { getAllContinuityPackages, getClientData } from "../appwrite/db";
import {
  createPortalSession,
  getAllStripeProducts,
  sendResendEmail,
} from "../appwrite/functions";
import FORM_MODALS from "../config/formModal";
import { initFormModal, renderFormModal } from "../ui/formModal";
import { withLoader } from "../ui/loader";
import { renderToast } from "../ui/toast";
import { applyTextBindings } from "../utils/dataBinding";
import {
  convertStripeStatus,
  formatFullDate,
  getErrorMessage,
  stripePriceToEuroFormat,
} from "../utils/helpers";

const auth = await checkAuth();
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
const currentPeriodEnd = continuityAccess?.stripe?.currentPeriodEnd;

const template = $("#offeringCardTemplate");
const statusBadge = ".package-offering-status-badge";

gsap.set(statusBadge, { autoAlpha: 0 });

console.log(continuityAccess);
console.log(stripeProducts);

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

          // Show Subscription Status
          correspondingOfferingCard.css(
            "z-index",
            renderedOfferings.length + 10,
          );
          const statusBadge = correspondingOfferingCard.find(
            ".package-offering-status-badge",
          );
          const { string, badge } = convertStripeStatus(
            continuityAccess.stripe.status,
          );

          applyTextBindings(statusBadge, {
            status: string,
          });

          gsap.set(statusBadge, { autoAlpha: 1 });
          statusBadge
            .css("backgroundColor", badge.background)
            .css("color", badge.foreground);
        }
      }
    });

    // Set button text values
    renderedOfferings.not(template).each((__, offeringsCard) => {
      const $card = $(offeringsCard);
      const price = Number($card.attr("data-price-amount"));
      const currentlyActivePackagePrice =
        continuityAccess && currentlyActivePackage
          ? stripePriceToEuroFormat(
              currentlyActivePackage.default_price.unit_amount,
            )
          : null;
      let text = "Selecteer";
      const isDowngrade =
        currentlyActivePackagePrice !== null &&
        price < currentlyActivePackagePrice;
      const isUpgrade =
        currentlyActivePackagePrice !== null &&
        price > currentlyActivePackagePrice;

      if ($card.attr("data-current-package") === "true") {
        applyTextBindings($card, {
          action: "beheer",
        });
      } else {
        if (isDowngrade) {
          text = "Downgrade";
        } else if (isUpgrade) {
          text = "Upgrade";
        }
        applyTextBindings($card, {
          action: text,
        });
      }

      $card
        .find(".package-offering-info-button-wrapper.primary")
        .attr("data-is-downgrade", isDowngrade ? "true" : "false")
        .attr("data-is-upgrade", isUpgrade ? "true" : "false");
    });
  } catch (err) {
    console.error(err);
    renderToast("Oeps!", getErrorMessage(err), "negative");
  }
}

renderData();

initFormModal(FORM_MODALS);

$(".package-offering-info-button-wrapper")
  .off("click.changePackage")
  .on("click.changePackage", function () {
    const $wrapper = $(this);
    const isDowngrade = $wrapper.attr("data-is-downgrade") === "true";
    const isUpgrade = $wrapper.attr("data-is-upgrade") === "true";
    if (!isDowngrade && !isUpgrade) return;

    const $card = $wrapper.closest(".package-offering");
    const newPackageName = $card
      .find("[data-bind='title']")
      .first()
      .text()
      .trim();
    const effectiveFrom = currentPeriodEnd
      ? formatFullDate(currentPeriodEnd)
      : "";
    const allChangePackageInputs = FORM_MODALS.changeContinuityPackage.inputs;
    FORM_MODALS.changeContinuityPackage.inputs = isDowngrade
      ? allChangePackageInputs
      : allChangePackageInputs.filter(
          (field) => field.name !== "downgradeReason",
        );

    renderFormModal("changeContinuityPackage", {
      heading: isDowngrade ? "Downgrade aanvragen" : "Upgrade aanvragen",
      onSubmit: async ({ data }) => {
        try {
          const resendPayload = {
            from: "Jiro Niedeveld | TheBrand.Estate <jiro@thebrand.estate>",
            customerEmail: auth.email,
            brandDirectorEmail: "jiro@thebrand.estate",
            internalTemplateId: isDowngrade
              ? "downgrade-continuity-package"
              : "upgrade-continuity-package",
            customerTemplateId: isDowngrade
              ? "downgrade-continuity-package"
              : "upgrade-continuity-package",
            templateVariables: {
              NewPackageName: data.newPackageName ?? "Naam van nieuw pakket",
              StartDate: data.effectiveFrom ?? "00-00-0000",
              DowngradeReason: data.downgradeReason ?? "Geen reden opgegeven.",
              Ontvanger: auth.name,
            },
          };

          const response = await sendResendEmail(resendPayload);
          if (!response?.ok) {
            throw new Error(response?.error ?? "Versturen is mislukt.");
          }

          renderToast("Gelukt!", "Aanvraag is verstuurd.", "positive");
        } catch (err) {
          console.error(err);
          renderToast("Oeps!", getErrorMessage(err), "negative");
        }
      },
      initialData: {
        newPackageName: newPackageName,
        effectiveFrom: effectiveFrom,
      },
    });
  });
