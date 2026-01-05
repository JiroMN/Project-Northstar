import {
  getClientData,
  getContinuityPackageData,
  getContinuityTimeInfo,
  getTimeLogs,
} from "../appwrite/db";
import { applyTextBindings } from "../utils/dataBinding";
import { daysUntil, formatFullDate } from "../utils/helpers";

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

    console.log(continuityTimeInfo);

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
