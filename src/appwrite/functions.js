import { Functions } from "appwrite";
import { client } from "./client";
import APPWRITE from "../config/public";

export const functions = new Functions(client);

export async function getSubscription(clientId) {
  const execution = await functions.createExecution(
    APPWRITE.functions.getSubscription,
    JSON.stringify({
      testMessage: `Ik wil graag van ${clientId} de data hebben!`,
    }),
  );

  const data = execution.responseBody && JSON.parse(execution.responseBody);

  return data;
}
