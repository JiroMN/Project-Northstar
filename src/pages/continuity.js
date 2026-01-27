import { checkAuth, checkContinuityAccess } from "../appwrite/auth";
import {
  getClientData,
  getContinuityPackageData,
  getContinuityTimeInfo,
  getTimeLogs,
} from "../appwrite/db";
import { withLoader } from "../ui/loader";
import { applyTextBindings } from "../utils/dataBinding";
import {
  daysUntil,
  formatFullDate,
  formatFullDayDate,
  getCssValueFromVarName,
  isBetweenDates,
} from "../utils/helpers";

await checkAuth();
const continuityAccess = await checkContinuityAccess(true, false);

let timelogDocs;
let periodStart;
let periodEnd;

// Hero
async function processContinuityInfo() {
  try {
    const response = await getClientData();
    const data = response.client.documents[0];
    const continuityTimeInfo = await getContinuityTimeInfo();
    const stripeData = continuityTimeInfo.continuityPackageRes.stripe;
    const packageData =
      continuityTimeInfo.continuityPackageRes.appwrite.documents[0]
        .continuityPackage;

    const spentHours = continuityTimeInfo.spentHours;
    const spentConsultingHours = continuityTimeInfo.spentConsultingHours;

    // Set global variables
    timelogDocs = continuityTimeInfo.timelogs.documents;
    periodStart = stripeData.currentPeriodStart;
    periodEnd = stripeData.currentPeriodEnd;

    gsap
      .timeline()
      .to(".dashboard-hero-continuity-progressbar.reserved", {
        width: `${
          (continuityTimeInfo.reservedConsultingHours /
            continuityTimeInfo.totalHours) *
          100
        }%`,
      })
      .to(
        "#reservedProgress",
        {
          width: `${
            (spentConsultingHours /
              continuityTimeInfo.reservedConsultingHours) *
            100
          }%`,
        },
        "<50%",
      )
      .to(
        "#freeProgress",
        {
          width: `${(spentHours / continuityTimeInfo.totalFreeHours) * 100}%`,
        },
        "<50%",
      );

    const totalHours = continuityTimeInfo.totalFreeHours;

    applyTextBindings($(".continuity-hero"), {
      "package-name": packageData.name,
      "spent-hours": spentHours.toString(),
      "free-hours": totalHours,
      "days-left": daysUntil(periodEnd),
    });
  } catch (err) {
    console.error(err);
  }
}
await processContinuityInfo();

// Timelogs
function getGroupDate(iso) {
  return iso.slice(0, 10);
}

function groupByDay() {
  const grouped = {};

  $(timelogDocs).each((index, doc) => {
    const groupDate = getGroupDate(doc.date);

    if (!grouped[groupDate]) {
      grouped[groupDate] = { groupDate: groupDate, logs: [] };
    }

    grouped[groupDate].logs.push(doc);
  });
  return Object.values(grouped).sort((a, b) => {
    return new Date(b.groupDate) - new Date(a.groupDate);
  });
}

const groupedDays = groupByDay();

function renderLogs() {
  const $dayTemplate = $("#continuity-timelog-day-template");
  const $logTemplate = $("#continuity-timelog-log-template");
  const $thisPeriod = $(".continuity-period.current");
  const $previousPeriods = $(".continuity-period.previous");

  // Make sure templates are hidden
  $dayTemplate.css("display", "none");
  $logTemplate.css("display", "none");

  $(groupedDays).each((__, group) => {
    const copiedDay = $dayTemplate.clone(true);
    copiedDay.css("display", "flex");
    copiedDay.attr("id", "");
    let totalHoursInDay = 0;

    $(group.logs).each((__, log) => {
      // increment total hours
      totalHoursInDay += log.hours;

      // render logs
      const copiedLog = $logTemplate.clone(true);
      copiedLog.css("display", "flex");
      copiedLog.attr("id", "");
      copiedLog.appendTo(copiedDay.find(".continuity-timelogs-list"));
      applyTextBindings(copiedLog, {
        "timelog-title": log.title,
        "timelog-description": log.description,
        "timelog-hours": log.hours,
        "timelog-type": log.work_type,
      });
      if (log.isReservedConsultingSessions) {
        copiedLog
          .find(".continuity-timelog-info-badge.title")
          .css(
            "backgroundColor",
            getCssValueFromVarName(
              "var(--_all-colors---service-color--continuity--background)",
            ),
          );
        copiedLog
          .find(".continuity-timelog-info-badge.title")
          .children()
          .css(
            "color",
            getCssValueFromVarName(
              "var(--_all-colors---service-color--continuity--foreground)",
            ),
          );
      }
    });

    // Decide which period
    if (isBetweenDates(group.groupDate, periodStart, periodEnd)) {
      copiedDay.appendTo($thisPeriod);
    } else {
      copiedDay.appendTo($previousPeriods);
    }

    applyTextBindings(copiedDay, {
      date: formatFullDayDate(group.groupDate),
      "total-hours": `${totalHoursInDay}h`,
    });
  });
}
renderLogs();
