import APPWRITE from "./public";

export const RELATIONSHIPSELECTORS = {
  testRelation: {
    databaseId: APPWRITE.databases.colorSystem.id,
    collectionId: APPWRITE.databases.colorSystem.collections.palettes.id,
    placeholder: "Kleuren Palet", // The placeholder that gets rendered in the selector
    labelKey: "title", // The column name of document that gets shown in the list
    boundToClient: true, // if boundToClient is true, database call will add a Query.equal() for client_id
  },
  logoSets: {
    databaseId: APPWRITE.databases.logoSystem.id,
    collectionId: APPWRITE.databases.logoSystem.collections.sets.id,
    placeholder: "Logo Set",
    labelKey: "title",
    boundToClient: true,
  },
  colorPalettes: {
    databaseId: APPWRITE.databases.colorSystem.id,
    collectionId: APPWRITE.databases.colorSystem.collections.palettes.id,
    placeholder: "Kleuren Palet",
    labelKey: "title",
    boundToClient: true,
  },
  galleryAlbums: {
    databaseId: APPWRITE.databases.gallery.id,
    collectionId: APPWRITE.databases.gallery.collections.albums.id,
    placeholder: "Album",
    labelKey: "name",
    boundToClient: true,
  },
  fontWeights: {
    databaseId: APPWRITE.databases.typographySystem.id,
    collectionId: APPWRITE.databases.typographySystem.collections.weights.id,
    placeholder: "Font Gewicht",
    labelKey: "weight_txt",
    boundToClient: true,
  },
  typographyRules: {
    databaseId: APPWRITE.databases.typographySystem.id,
    collectionId: APPWRITE.databases.typographySystem.collections.rules.id,
    placeholder: "Regels",
    labelKey: "line_height_percent",
    boundToClient: true,
  },
  fonts: {
    databaseId: APPWRITE.databases.typographySystem.id,
    collectionId: APPWRITE.databases.typographySystem.collections.fonts.id,
    placeholder: "Fonts",
    labelKey: "name",
    boundToClient: true,
  },
  typographyScale: {
    databaseId: APPWRITE.databases.typographySystem.id,
    collectionId: APPWRITE.databases.typographySystem.collections.scales.id,
    placeholder: "Typography Scale",
    labelKey: "name",
    boundToClient: false,
  },
  traits: {
    databaseId: APPWRITE.databases.toneOfVoice.id,
    collectionId: APPWRITE.databases.toneOfVoice.collections.traits.id,
    placeholder: "Persoonlijkheidseigenschap",
    labelKey: "name",
    boundToClient: true,
  },
  example: {
    databaseId: APPWRITE.databases.toneOfVoice.id,
    collectionId: APPWRITE.databases.toneOfVoice.collections.examples.id,
    placeholder: "Voorbeeld",
    labelKey: "example",
    boundToClient: true,
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
  fontStyle: {
    placeholder: "Selecteer een font stijl",
    options: [
      {
        value: "None",
        label: "Geen",
      },
      {
        value: "Italic",
        label: "Italic",
      },
      {
        value: "Underline",
        label: "Underline",
      },
      {
        value: "Strike-through",
        label: "Strike-through",
      },
    ],
  },
};
