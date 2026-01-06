import {
  getClientData,
  getContinuityPackageData,
  getContinuityTimeInfo,
  getTimeLogs,
} from "../appwrite/db";
import { applyTextBindings } from "../utils/dataBinding";
import {
  daysUntil,
  formatFullDate,
  formatFullDayDate,
  isBetweenDates,
} from "../utils/helpers";

let timelogDocs;
let periodStart;
let periodEnd;

// Hero
async function processContinuityInfo() {
  try {
    const response = await getClientData();
    const data = response.client.documents[0];
    const continuityTimeInfo = await getContinuityTimeInfo();
    const subscriptionData = continuityTimeInfo.subscriptionData.documents[0];

    const packageData =
      continuityTimeInfo.subscriptionData.documents[0].continuityPackage;

    const spentHours = continuityTimeInfo.spentHours;
    const spentConsultingHours = continuityTimeInfo.spentConsultingHours;

    // Set global variables
    timelogDocs = continuityTimeInfo.timelogs.documents;
    periodStart = subscriptionData.billing_period_start_date;
    periodEnd = subscriptionData.billing_period_end_date;

    applyTextBindings($(".continuity-hero"), {});

    gsap
      .timeline()
      .to(".dashboard-hero-continuity-progressbar.reserved", {
        width: `${
          (packageData.reserved_consulting_hours / packageData.total_hours) *
          100
        }%`,
      })
      .to(
        "#reservedProgress",
        {
          width: `${
            (spentConsultingHours / packageData.reserved_consulting_hours) * 100
          }%`,
        },
        "<50%"
      )
      .to(
        "#freeProgress",
        {
          width: `${
            (spentConsultingHours / packageData.reserved_consulting_hours) * 100
          }%`,
        },
        "<50%"
      );

    const totalHours = continuityTimeInfo.totalFreeHours;

    applyTextBindings($(".continuity-hero"), {
      "package-name": subscriptionData.continuityPackage.name,
      "spent-hours": spentHours.toString(),
      "free-hours": totalHours,
      "days-left": daysUntil(subscriptionData.billing_period_end_date),
      "contract-end": formatFullDate(data.contract_end),
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
