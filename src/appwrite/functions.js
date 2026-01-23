import { Functions } from "appwrite";
import { client } from "./client";
import APPWRITE from "../config/public";

export const functions = new Functions(client);

export async function getSubscriptionFromStripe(subscriptionId) {
  try {
    const execution = await functions.createExecution(
      APPWRITE.functions.getSubscription,
      JSON.stringify({ subscriptionId: subscriptionId }),
      false,
    );

    const data = execution.responseBody && JSON.parse(execution.responseBody);

    return data;
  } catch (err) {
    throw err;
  }
}

export async function createPortalSession(customerId, returnUrl) {
  try {
    const execution = await functions.createExecution(
      APPWRITE.functions.createPortalSession,
      JSON.stringify({ customerId: customerId, returnUrl: returnUrl }),
      false,
    );

    const data = execution.responseBody && JSON.parse(execution.responseBody);

    return data;
  } catch (err) {
    throw err;
  }
}
