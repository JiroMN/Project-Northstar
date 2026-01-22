import { Functions } from "appwrite";
import { client } from "./client";
import APPWRITE from "../config/public";

export const functions = new Functions(client);

export async function getSubscriptionFromStripe() {
  try {
    const execution = await functions.createExecution(
      APPWRITE.functions.getSubscription,
    );

    const data = execution.responseBody && JSON.parse(execution.responseBody);

    return data;
  } catch (err) {
    throw err;
  }
}
