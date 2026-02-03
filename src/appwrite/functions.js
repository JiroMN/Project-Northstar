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

export async function addUser(clientIds, data) {
  try {
    const execution = await functions.createExecution(
      APPWRITE.functions.addCompany,
      JSON.stringify({
        clientIds: { teamId: clientIds.teamId, clientId: clientIds.clientId },
        userData: data,
      }),
      false,
    );

    const responseData =
      execution.responseBody && JSON.parse(execution.responseBody);

    return responseData;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function addCompany(data) {
  try {
    const documentData = {
      name: data.form.companyName,
      stripe_customer_id: data.form.stripeCustomerId,
      collab_start: data.form.collabStart,
      brandbook_file_id: data.files.brandbook.$id,
      avatar_file_id: data.files.logoAvatar.$id,
      logo_system_backdrop_file_id: data.files.logoSystemBackdrop.$id,
    };

    const execution = await functions.createExecution(
      APPWRITE.functions.addCompany,
      JSON.stringify({
        documentData: documentData,
        brandDirector: data.brandDirector,
      }),
      false,
    );

    const responseData =
      execution.responseBody && JSON.parse(execution.responseBody);

    return responseData;
  } catch (err) {
    throw err;
  }
}

export async function getAllStripeProducts() {
  try {
    const execution = await functions.createExecution(
      APPWRITE.functions.getStripeProducts,
    );
    const data = execution.responseBody && JSON.parse(execution.responseBody);

    return data;
  } catch (err) {
    throw err;
  }
}
