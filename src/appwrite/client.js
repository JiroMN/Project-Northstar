import { Client, Account, Teams } from "appwrite";
import APPWRITE from "../config/public";

export const client = new Client()
  .setEndpoint(APPWRITE.endpoint)
  .setProject(APPWRITE.projectId);

export const account = new Account(client);
export const teams = new Teams(client);
