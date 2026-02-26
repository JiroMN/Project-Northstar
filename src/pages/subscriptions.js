import { checkAuth, checkContinuityAccess } from "../appwrite/auth";
import { getClientData } from "../appwrite/db";
import {
  createPortalSession,
  getAllStripeProducts,
} from "../appwrite/functions";
import FORM_MODALS from "../config/formModal";
import { PRODUCTS } from "../config/public";
import { initFormModal } from "../ui/formModal";
import { withLoader } from "../ui/loader";
import { renderToast } from "../ui/toast";
import { applyTextBindings } from "../utils/dataBinding";
import {
  convertStripeStatus,
  getErrorMessage,
  stripePriceToEuroFormat,
} from "../utils/helpers";

await checkAuth();
const clientData = await getClientData();
const continuityAccess = await withLoader(
  checkContinuityAccess(false, false, true),
);
const stripeProducts = await withLoader(getAllStripeProducts());
const portalSession = await createPortalSession(
  clientData.client.documents[0].stripe_customer_id,
  window.location.href,
);

let currentlyActivePackage;

const template = $("#offeringCardTemplate");
const statusBadge = ".package-offering-status-badge";

gsap.set(statusBadge, { autoAlpha: 0 });

console.log(continuityAccess);
console.log(stripeProducts);

function renderData() {
  try {
    const currentStripeProduct = continuityAccess?.stripe?.product ?? null;
    const currentStripeStatus = continuityAccess?.status ?? null;
    const sortedProducts = [...(stripeProducts.products ?? [])].sort(
      (a, b) =>
        Number(a?.default_price?.unit_amount ?? 0) -
        Number(b?.default_price?.unit_amount ?? 0),
    );

    // Render all packages into HTML directly from Stripe products
    $(sortedProducts).each((__, product) => {
      const totalHours = Number(product?.metadata?.total_hours ?? 0);
      const reservedConsultingHours = Number(
        product?.metadata?.reserved_consulting_hours ?? 0,
      );
      const freeHours = totalHours - reservedConsultingHours;
      const productPrice = stripePriceToEuroFormat(
        product?.default_price?.unit_amount ?? 0,
      );
      const effectiveHourlyRate =
        totalHours > 0 ? productPrice / totalHours : 0;

      const clone = template.clone(true);
      clone
        .attr("id", "")
        .attr("stripe-product-id", product.id)
        .attr("data-price-amount", productPrice)
        .css("display", "flex");

      clone.appendTo(".package-offerings-container");

      applyTextBindings(clone, {
        title: product?.name ?? "",
        description: product?.description ?? "",
        price: productPrice,
        "recurring-interval":
          product?.default_price?.recurring?.interval_count ?? 1,
        "eur-per-hour": effectiveHourlyRate,
        "total-hours": totalHours,
        "reserved-consulting": reservedConsultingHours,
        "free-hours": freeHours,
      });

      // Set product image
      $(clone)
        .find(".package-offering-icon")
        .css("background-image", `url(${product?.images?.[0] ?? ""})`);

      // Check which package is active on account and handle button styling
      if (currentStripeProduct?.id === product.id) {
        const buttonPrimary = clone.find(
          ".package-offering-info-button-wrapper.primary",
        );
        const buttonSecondary = clone.find(
          ".package-offering-info-button-wrapper.secondary",
        );

        buttonPrimary.hide();
        buttonSecondary.show();

        clone.attr("data-current-package", "true");
        currentlyActivePackage = product;

        // Show subscription status whenever we have one.
        clone.css("z-index", sortedProducts.length + 10);
        const statusBadge = clone.find(".package-offering-status-badge");
        if (currentStripeStatus) {
          const { string, badge } = convertStripeStatus(currentStripeStatus);
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

    const renderedOfferings = $(".package-offering");

    // Set button text values
    renderedOfferings.not(template).each((__, offeringsCard) => {
      const $card = $(offeringsCard);
      const price = Number($card.attr("data-price-amount"));
      const currentlyActivePackagePrice =
        currentlyActivePackage
          ? stripePriceToEuroFormat(
              currentlyActivePackage?.default_price?.unit_amount ?? 0,
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

    const $card = $wrapper.closest(".package-offering");
    const newPackageName = $card
      .find("[data-bind='title']")
      .first()
      .text()
      .trim();
    const productEntry = PRODUCTS[newPackageName];

    if (continuityAccess?.hasAccess) {
      window.open(portalSession.session.url, "_blank");
    } else {
      if (!productEntry?.paymentLink) {
        renderToast(
          "Oeps!",
          "Geen payment link gevonden voor dit pakket.",
          "negative",
        );
        return;
      }
      window.open(productEntry.paymentLink, "_blank");
    }

    // ———  old formModal Logic ———
    // const effectiveFrom = currentPeriodEnd
    //   ? formatFullDate(currentPeriodEnd)
    //   : "";
    // const allChangePackageInputs = FORM_MODALS.changeContinuityPackage.inputs;
    // FORM_MODALS.changeContinuityPackage.inputs = isDowngrade
    //   ? allChangePackageInputs
    //   : allChangePackageInputs.filter(
    //       (field) => field.name !== "downgradeReason",
    //     );

    // renderFormModal("changeContinuityPackage", {
    //   heading: isDowngrade ? "Downgrade aanvragen" : "Upgrade aanvragen",
    //   onSubmit: async ({ data }) => {
    //     try {
    //       const resendPayload = {
    //         from: "Jiro Niedeveld | TheBrand.Estate <jiro@thebrand.estate>",
    //         customerEmail: auth.email,
    //         brandDirectorEmail: "jiro@thebrand.estate",
    //         internalTemplateId: isDowngrade
    //           ? "downgrade-continuity-package"
    //           : "upgrade-continuity-package",
    //         customerTemplateId: isDowngrade
    //           ? "downgrade-continuity-package"
    //           : "upgrade-continuity-package",
    //         templateVariables: {
    //           NewPackageName: data.newPackageName ?? "Naam van nieuw pakket",
    //           StartDate: data.effectiveFrom ?? "00-00-0000",
    //           DowngradeReason: data.downgradeReason ?? "Geen reden opgegeven.",
    //           Ontvanger: auth.name,
    //         },
    //       };

    //       const response = await sendResendEmail(resendPayload);
    //       if (!response?.ok) {
    //         throw new Error(response?.error ?? "Versturen is mislukt.");
    //       }

    //       renderToast("Gelukt!", "Aanvraag is verstuurd.", "positive");
    //     } catch (err) {
    //       console.error(err);
    //       renderToast("Oeps!", getErrorMessage(err), "negative");
    //     }
    //   },
    //   initialData: {
    //     newPackageName: newPackageName,
    //     effectiveFrom: effectiveFrom,
    //   },
    // });
  });
