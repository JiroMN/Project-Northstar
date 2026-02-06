import APPWRITE from "./public";

export const RELATIONSHIPSELECTORS = {
  testRelation: {
    databaseId: APPWRITE.databases.colorSystem.id,
    collectionId: APPWRITE.databases.colorSystem.collections.palettes.id,
    placeholder: "Kleuren Palet", // The placeholder that gets rendered in the selector
    labelKey: "title", // The column name of document that gets shown in the list
  },
  logoSets: {
    databaseId: APPWRITE.databases.logoSystem.id,
    collectionId: APPWRITE.databases.logoSystem.collections.sets.id,
    placeholder: "Logo Set",
    labelKey: "title",
  },
};

export const SELECTS = {
  testSelect: {
    placeholder: "Selecteer een project status",
    options: [
      {
        value: "draft",
        label: "Concept",
      },
      {
        value: "active",
        label: "Actief",
      },
      {
        value: "paused",
        label: "Gepauzeerd",
      },
      {
        value: "completed",
        label: "Afgerond",
      },
    ],
  },
};
