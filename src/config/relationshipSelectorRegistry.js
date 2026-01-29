import APPWRITE from "./public";

export const RELATIONSHIPSELECTORS = {
  testRelation: {
    databaseId: APPWRITE.databases.colorSystem.id,
    collectionId: APPWRITE.databases.colorSystem.collections.palettes.id,
    placeholder: "Kleuren Palette", // The placeholder that gets rendered in the selector
    labelKey: "title", // The column name of document that gets shown in the list
  },
};
