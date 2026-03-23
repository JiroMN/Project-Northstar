import { Permission, Query, Role } from "appwrite";
import {
  createDocument,
  getClientById,
  getCollection,
  getAllClients,
  updateDocument,
} from "../../appwrite/db";
import APPWRITE from "../../config/public";
import { checkAuth } from "../../appwrite/auth";
import { openPreviewSheet } from "../../ui/studio/previewSheet";
import {
  gatherFormData,
  onDataChange,
  onClientSelect,
  onPreviewItemEdit,
  setFormData,
  triggerDataChange,
} from "../../utils/studioHelpers";
import { getSubscriptionFromStripe } from "../../appwrite/functions";
import { getFilePreview } from "../../appwrite/storage";
import { renderToast } from "../../ui/toast";
import { renderModal } from "../../ui/modal";
import { getErrorMessage, isBetweenDates } from "../../utils/helpers";
import { applyTextBindings } from "../../utils/dataBinding";
import { setButtonState } from "../../animations/global/buttons";
import { WRITE_CONFIG } from "../../config/studio";

await checkAuth();

// Continuity Overview
const $overviewContainer = $("[data-continuity-clients-overview]");
const $overviewTemplate = $("#continuityPackageClientTemplate");

$overviewTemplate.css("display", "none");

async function renderContinuityOverview() {
  try {
    const allClients = await getAllClients();
    const clients = allClients.database ?? [];

    const results = await Promise.all(
      clients.map(async (client) => {
        if (!client.stripe_customer_id) return null;
        try {
          const stripeResponse = await getSubscriptionFromStripe(
            client.stripe_customer_id,
          );
          if (!stripeResponse?.ok || !stripeResponse?.subscription) return null;

          const stripe = stripeResponse.subscription;
          const eligibleStatuses = ["active", "trialing", "past_due"];
          if (!eligibleStatuses.includes(stripe?.status)) return null;

          const metadata = stripe?.product?.metadata ?? {};
          const totalHours = Number(metadata.total_hours ?? 0);
          const reservedConsultingHours = Number(
            metadata.reserved_consulting_hours ?? 0,
          );
          const totalFreeHours = totalHours - reservedConsultingHours;

          const timelogsRes = await getCollection(
            APPWRITE.databases.continuity.id,
            APPWRITE.databases.continuity.collections.timelogs.id,
            [Query.equal("client_id", client.$id), Query.limit(9999)],
          );

          let spentHours = 0;
          let spentConsultingHours = 0;

          for (const log of timelogsRes?.documents ?? []) {
            const hours = parseFloat(log?.hours ?? 0);
            if (
              isBetweenDates(
                log?.date,
                stripe.currentPeriodStart,
                stripe.currentPeriodEnd,
              )
            ) {
              if (log?.isReservedConsultingSessions) {
                spentConsultingHours += hours;
              } else {
                spentHours += hours;
              }
            }
          }

          return {
            client,
            spentHours,
            spentConsultingHours,
            totalHours,
            totalFreeHours,
            reservedConsultingHours,
          };
        } catch (err) {
          console.error(
            `[continuityOverview] Failed for client ${client.$id}:`,
            err,
          );
          return null;
        }
      }),
    );

    for (const entry of results.filter(Boolean)) {
      const $card = $overviewTemplate.clone(true);
      $card.attr("id", "").css("display", "flex");

      applyTextBindings($card, {
        "client-name": entry.client.name,
        "spent-reserved-hours": entry.spentConsultingHours,
        "total-reserved-hours": entry.reservedConsultingHours,
        "spent-free-hours": entry.spentHours,
        "total-free-hours": entry.totalFreeHours,
      });

      $card.appendTo($overviewContainer);

      const avatar = await getFilePreview(
        APPWRITE.buckets.clientFiles.id,
        entry.client.avatar_file_id,
      );
      $card.find(".continuity-package-client-avatar").css(
        "backgroundImage",
        `url(${avatar})`,
      );

      const $sections = $card.find(".continuity-package-client-progress-section");
      const $bars = $card.find(".continuity-package-client-progress-inner");

      const reservedSectionPct =
        entry.totalHours > 0
          ? (entry.reservedConsultingHours / entry.totalHours) * 100
          : 0;
      const reservedPct =
        entry.reservedConsultingHours > 0
          ? (entry.spentConsultingHours / entry.reservedConsultingHours) * 100
          : 0;
      const freePct =
        entry.totalFreeHours > 0
          ? (entry.spentHours / entry.totalFreeHours) * 100
          : 0;

      gsap.to($sections.eq(0), {
        width: `${reservedSectionPct}%`,
        duration: 0.8,
        ease: "power2.out",
      });
      gsap.to($bars.eq(0), {
        width: `${Math.min(reservedPct, 100)}%`,
        duration: 0.8,
        ease: "power2.out",
      });
      gsap.to($bars.eq(1), {
        width: `${Math.min(freePct, 100)}%`,
        duration: 0.8,
        ease: "power2.out",
      });
    }
  } catch (err) {
    console.error(err);
    renderToast("Oeps!", getErrorMessage(err), "negative");
  }
}

await renderContinuityOverview();

const submitBtn = $("[id='submitForm']");
const resetBtn = $("[id='resetForm']");
const showDataBtn = $("[id='showData']");

let selectedClientId;
let initialData;
let submittedData = {};

const writeCfg = WRITE_CONFIG.continuity;

async function gatherContinuityData(clientId) {
  try {
    const timelogsResponse = await getCollection(
      APPWRITE.databases.continuity.id,
      APPWRITE.databases.continuity.collections.timelogs.id,
      [Query.equal("client_id", clientId), Query.orderDesc("$updatedAt")],
    );

    return { timelogsResponse };
  } catch (err) {
    console.error(err);
    renderToast(
      "Oeps!",
      "Er is iets mis gegaan met het ophalen van de bedrijfsinformatie.",
      "negative",
    );
  }
}

onClientSelect(async (clientId) => {
  selectedClientId = clientId;
  initialData = await gatherContinuityData(clientId);
});

onDataChange(async ({ clientId }) => {
  if (!selectedClientId) return;
  if (clientId && clientId !== selectedClientId) return;
  initialData = await gatherContinuityData(selectedClientId);
});

onPreviewItemEdit((toBeEditedItem) => {
  const $form = $(`#${toBeEditedItem.formId}`);
  const $cardTitle = $form
    .closest(".studio-card")
    .find(".studio-card-text")
    .find("h1")
    .first();

  $form.attr("data-is-editing", toBeEditedItem.item.$id);
  $cardTitle.find("span").remove();
  $cardTitle.append(
    `<span class='fg-50'> • ${toBeEditedItem.primaryLabel} wordt aangepast</span>`,
  );
  setButtonState($form.find(".relation-input-wrapper > *"), "disable", false);
  setInitialData(toBeEditedItem.item, toBeEditedItem.formId);
});

function setInitialData(data, formId) {
  let pairs = {
    timelogsForm: {
      timelogTitle: "",
      timelogDescription: "",
      timelogWorkType: "",
      timelogDate: "",
      timelogWorkedHours: "",
      timelogReservedContinuityHours: false,
    },
  };

  if (data) {
    switch (formId) {
      case "timelogsForm":
        pairs.timelogsForm = {
          timelogTitle: data.title,
          timelogDescription: data.description,
          timelogWorkType: data.work_type,
          timelogDate: data.date,
          timelogWorkedHours: data.hours,
          timelogReservedContinuityHours: Boolean(
            data.isReservedConsultingSessions,
          ),
        };
        break;
    }
  } else {
    Object.keys(pairs[formId]).forEach((column) => {
      pairs[formId][column] = "";
    });
  }

  setFormData($(`#${formId}`), pairs[formId]);
}

submitBtn.off("click.submit").on("click.submit", function (e) {
  e.preventDefault();
  renderModal(
    "Weet je het zeker?",
    "Je gaat iets aanpassen dat niet terug gedraaid kan worden.",
    "Annuleer",
    "Ga Door",
    async () => {
      try {
        if (!selectedClientId || selectedClientId == "") {
          renderToast("Onvolledig!", "Selecteer een bedrijf", "warning");
          return;
        }

        if ($(this).attr("data-disable") === "true") return;
        setButtonState($(this), "loading", false);

        const relatedForm = $(this).attr("data-related-form");
        if (relatedForm !== "timelogsForm") {
          renderToast(
            "Niet beschikbaar",
            "Abonnementen en pakketten worden volledig via Stripe beheerd.",
            "announcement",
          );
          return;
        }
        const form = $(`#${relatedForm}`);
        const isEditing = form.attr("data-is-editing");
        submittedData = gatherFormData(form);

        const clientData = await getClientById(selectedClientId);
        const teamId = clientData.auth.$id;

        let response;
        if (isEditing && isEditing !== "") {
          response = await updateDocument({
            databaseId: APPWRITE.databases.continuity.id,
            documentId: isEditing,
            collectionId: writeCfg[relatedForm].collectionId,
            data: writeCfg[relatedForm].mapToDb(
              submittedData.data,
              selectedClientId,
              {},
              {},
            ),
          });
        } else {
          response = await createDocument({
            databaseId: APPWRITE.databases.continuity.id,
            collectionId: writeCfg[relatedForm].collectionId,
            data: writeCfg[relatedForm].mapToDb(
              submittedData.data,
              selectedClientId,
              {},
              {},
            ),
            permissions: [
              Permission.read(Role.team(teamId)),
              Permission.update(Role.team(teamId)),
              Permission.delete(Role.team(teamId)),
            ],
          });
        }

        if (response) {
          renderToast("Gelukt!", `Continuity is aangepast.`, "positive");
          triggerDataChange({ clientId: selectedClientId });
          setButtonState($(this), "enable", true);
        }
      } catch (err) {
        console.error(err);
        renderToast("Oeps!", getErrorMessage(err), "negative");
      } finally {
        setButtonState($(this), "enable", true);
      }
    },
  );
});

showDataBtn.off("click.showData").on("click.showData", function () {
  if (!selectedClientId || selectedClientId == "") {
    renderToast("Onvolledig!", "Selecteer een bedrijf", "warning");
    return;
  }

  const relatedForm = $(this).attr("data-related-form");
  if (relatedForm !== "timelogsForm") {
    renderToast(
      "Niet beschikbaar",
      "Abonnementen en pakketten worden volledig via Stripe beheerd.",
      "announcement",
    );
    return;
  }
  let sheetTitle;
  let labelKeys;
  let secondaryLabelKeys;
  let canEdit = true;

  switch (relatedForm) {
    case "timelogsForm":
      sheetTitle = "Time Logs";
      labelKeys = ["title"];
      secondaryLabelKeys = "work_type";
      break;
  }

  openPreviewSheet({
    sheetTitle: sheetTitle,
    data: initialData?.[writeCfg[relatedForm].initialDataKey]?.documents ?? [],
    labelKeys: labelKeys,
    secondaryLabelKey: secondaryLabelKeys,
    canRemove: true,
    canEdit: canEdit,
    formId: relatedForm,
  });
});

resetBtn.each((__, btn) => {
  const $btn = $(btn);
  $btn.remove();
});

// Deprecated in favor of Stripe source of truth for products/subscriptions
$("[data-related-form='subscriptionsForm']")
  .closest(".studio-card")
  .remove();
$("#subscriptionsForm").remove();
