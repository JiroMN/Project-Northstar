import { Client, Account } from "appwrite";
import APPWRITE from "../config/public";

export const client = new Client()
  .setEndpoint(APPWRITE.endpoint)
  .setProject(APPWRITE.projectId);

export const account = new Account(client);
