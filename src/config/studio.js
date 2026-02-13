import { Permission, Role } from "appwrite";
import APPWRITE from "./public";

function parseRelationInput(value, returnSingle = false) {
  if (Array.isArray(value)) {
    return returnSingle ? (value[0] ?? "") : value;
  }

  if (value == null) {
    return returnSingle ? "" : [];
  }

  const raw = String(value).trim();
  if (raw === "") {
    return returnSingle ? "" : [];
  }

  // Supports both JSON strings (e.g. ["id1","id2"]) and plain comma strings (e.g. id1,id2)
  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      const arr = Array.isArray(parsed) ? parsed : [];
      return returnSingle ? (arr[0] ?? "") : arr;
    } catch (err) {
      // Fall through to comma-split parsing below.
    }
  }

  const arr = raw
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item !== "");

  return returnSingle ? (arr[0] ?? "") : arr;
}

export const WRITE_CONFIG = {
  brandEssence: {
    corePurposeForm: {
      collectionId: APPWRITE.databases.brandEssence.collections.corePurpose.id,
      initialDataKey: "corePurposeResponse",
      mapToDb: (data, selectedClientId) => ({
        client_id: selectedClientId,
        purpose: data.corePurpose,
        purpose_secondary_lang: data.secondaryCorePurpose,
        explanation: data.corePurposeDescription,
      }),
    },
    onlinessForm: {
      collectionId: APPWRITE.databases.brandEssence.collections.onliness.id,
      initialDataKey: "onlinessResponse",
      mapToDb: (data, selectedClientId) => ({
        client_id: selectedClientId,
        short_statement: data.shortOnliness,
        full_statement: data.fullOnliness,
        what: data.whatOnliness,
        how: data.howOnliness,
        who: data.whoOnliness,
        where: data.whereOnliness,
        why: data.whyOnliness,
        when: data.whenOnliness,
      }),
    },
    truelineForm: {
      collectionId: APPWRITE.databases.brandEssence.collections.trueline.id,
      initialDataKey: "truelineResponse",
      mapToDb: (data, selectedClientId) => ({
        client_id: selectedClientId,
        trueline: data.trueline,
        trueline_secondary_lang: data.secondaryTrueline,
        explanation: data.truelineDescription,
      }),
    },
  },
  brandStory: {
    visionForm: {
      collectionId: APPWRITE.databases.brandStory.collections.vision.id,
      initialDataKey: "visionResponse",
      mapToDb: (
        data,
        selectedClientId,
        uploadedFileIds,
        existingAttachmentId,
      ) => ({
        client_id: selectedClientId,
        attachment_id: uploadedFileIds.visionAttachment ?? existingAttachmentId,
        description: data.visionDescription,
      }),
    },
    obituaryForm: {
      collectionId: APPWRITE.databases.brandStory.collections.obituary.id,
      initialDataKey: "obituaryResponse",
      mapToDb: (
        data,
        selectedClientId,
        uploadedFileIds,
        existingAttachmentId,
      ) => ({
        client_id: selectedClientId,
        attachment_id:
          uploadedFileIds.obituaryAttachment ?? existingAttachmentId,
        obituary: data.obituary,
      }),
    },
  },
  logoSystem: {
    logoSetForm: {
      collectionId: APPWRITE.databases.logoSystem.collections.sets.id,
      initialDataKey: "logoSetResponse",
      mapToDb: (
        data,
        selectedClientId,
        uploadedFileIds,
        existingAttachmentIds,
      ) => ({
        client_id: selectedClientId,
        title: data.logoSetTitle,
        notes: data.logoSetDescription,
        sort_order: parseInt(data.logoSetSortingOrder),
      }),
    },
    logoVariantForm: {
      collectionId: APPWRITE.databases.logoSystem.collections.variants.id,
      initialDataKey: "logoVariantResponse",
      mapToDb: (
        data,
        selectedClientId,
        uploadedFileIds,
        existingAttachmentIds,
      ) => ({
        client_id: selectedClientId,
        logoSet: data.logoSets,
        variant_name: data.logoVariant,
        preview_bg_hex: data.logoSetPreviewBg,
        png_file_id:
          uploadedFileIds.logoVariantPngVariant ??
          existingAttachmentIds.logoVariantPngVariant,
        svg_file_id:
          uploadedFileIds.logoVariantSvgVariant ??
          existingAttachmentIds.logoVariantSvgVariant,
        sort_order: parseInt(data.logoVariantSortingOrder),
      }),
    },
  },
  colorSystem: {
    colorPaletteForm: {
      collectionId: APPWRITE.databases.colorSystem.collections.palettes.id,
      initialDataKey: "colorPalettesResponse",
      mapToDb: (data, selectedClientId) => ({
        client_id: selectedClientId,
        title: data.colorPaletteName,
        notes: data.colorPaletteDescription,
      }),
    },
    colorTokenForm: {
      collectionId: APPWRITE.databases.colorSystem.collections.tokens.id,
      initialDataKey: "colorTokensResponse",
      mapToDb: (data, selectedClientId) => ({
        client_id: selectedClientId,
        colorPalette: parseRelationInput(data.colorPalettes, true),
        title: data.colorTokenTitle,
        tone: data.colorTokenTone,
        hex: data.colorTokenHex,
        rgba: data.colorTokenRGBA,
        cmyk: data.colorTokenCMYK,
        hsl: data.colorTokenHSL,
      }),
    },
  },
  continuity: {
    subscriptionsForm: {
      collectionId: APPWRITE.databases.continuity.collections.subscriptions.id,
      initialDataKey: "subscriptionsResponse",
      mapToDb: (data, selectedClientId) => ({
        client_id: selectedClientId,
        continuityPackage: parseRelationInput(data.subscriptions, true),
        stripe_subscription_id: data.stripeSubscriptionId,
      }),
    },
    timelogsForm: {
      collectionId: APPWRITE.databases.continuity.collections.timelogs.id,
      initialDataKey: "timelogsResponse",
      mapToDb: (data, selectedClientId) => ({
        client_id: selectedClientId,
        title: data.timelogTitle,
        description: data.timelogDescription,
        work_type: data.timelogWorkType,
        date: data.timelogDate,
        hours: parseFloat(data.timelogWorkedHours),
        isReservedConsultingSessions: Boolean(
          data.timelogReservedContinuityHours,
        ),
      }),
    },
  },
  typographySystem: {
    fontsForm: {
      collectionId: APPWRITE.databases.typographySystem.collections.fonts.id,
      initialDataKey: "fontsResponse",
      mapToDb: (
        data,
        selectedClientId,
        uploadedFileIds,
        existingAttachmentIds,
      ) => ({
        client_id: selectedClientId,
        name: data.fontName,
        role: data.fontRole,
        notes: data.fontNotes,
        fontWeights: parseRelationInput(data.fontWeights),
        typographyRules: parseRelationInput(data.typographyRules),
        sort_order: parseInt(data.fontSortOrder),
      }),
    },
    weightsForm: {
      collectionId: APPWRITE.databases.typographySystem.collections.weights.id,
      initialDataKey: "weightsResponse",
      mapToDb: (
        data,
        selectedClientId,
        uploadedFileIds,
        existingAttachmentIds,
      ) => ({
        client_id: selectedClientId,
        weight_num: parseInt(data.weightNumber),
        weight_txt: data.weightText,
        style: data.fontStyle,
        notes: data.fontNotes,
        sort_order: parseInt(data.weightSortOrder),
        fonts: parseRelationInput(data.fonts),
      }),
    },
    rulesForm: {
      collectionId: APPWRITE.databases.typographySystem.collections.rules.id,
      initialDataKey: "rulesResponse",
      mapToDb: (
        data,
        selectedClientId,
        uploadedFileIds,
        existingAttachmentIds,
      ) => ({
        client_id: selectedClientId,
        letterspacing_percent: parseFloat(data.letterSpacingPercent),
        line_height_percent: parseFloat(data.lineHeightPercent),
        fonts: parseRelationInput(data.fonts),
      }),
    },
    clientScaleForm: {
      collectionId:
        APPWRITE.databases.typographySystem.collections.clientTypographyScale
          .id,
      initialDataKey: "clientScaleResponse",
      mapToDb: (
        data,
        selectedClientId,
        uploadedFileIds,
        existingAttachmentIds,
      ) => ({
        client_id: selectedClientId,
        base_px: parseInt(data.basePx),
        typographyScale: parseRelationInput(data.typographyScale, true), // Single relation expected by Appwrite schema.
      }),
    },
  },
  typographyCommunication: {
    traitsForm: {
      collectionId: APPWRITE.databases.toneOfVoice.collections.traits.id,
      initialDataKey: "traitsResponse",
      mapToDb: (data, selectedClientId) => ({
        client_id: selectedClientId,
        name: data.traitName,
        description: data.traitDescription,
      }),
    },
    examplesForm: {
      collectionId: APPWRITE.databases.toneOfVoice.collections.examples.id,
      initialDataKey: "examplesResponse",
      mapToDb: (
        data,
        selectedClientId,
        uploadedFileIds,
        existingAttachmentIds,
      ) => ({
        client_id: selectedClientId,
        example: data.example,
      }),
    },
    traitsExampleForm: {
      collectionId:
        APPWRITE.databases.toneOfVoice.collections.examplesTraits.id,
      initialDataKey: "traitsExamplesResponse",
      mapToDb: (
        data,
        selectedClientId,
        uploadedFileIds,
        existingAttachmentIds,
      ) => ({
        client_id: selectedClientId,
        toVExample: parseRelationInput(data.example, true),
        toVTraits: parseRelationInput(data.traits),
      }),
    },
  },
};

export const UPLOAD_PLAN = {
  brandStory: {
    // Name of input field
    visionAttachment: {
      bucketId: APPWRITE.buckets.vision.id,
      permissions: (teamId) => [
        Permission.read(Role.team(teamId)),
        Permission.update(Role.team(teamId)),
        Permission.delete(Role.team(teamId)),
      ],
    },
    obituaryAttachment: {
      bucketId: APPWRITE.buckets.obituary.id,
      permissions: (teamId) => [
        Permission.read(Role.team(teamId)),
        Permission.update(Role.team(teamId)),
        Permission.delete(Role.team(teamId)),
      ],
    },
  },
  logoSystem: {
    // Name of input field
    logoVariantPngVariant: {
      bucketId: APPWRITE.buckets.logos.id,
      permissions: (teamId) => [
        Permission.read(Role.team(teamId)),
        Permission.update(Role.team(teamId)),
        Permission.delete(Role.team(teamId)),
      ],
    },
    logoVariantSvgVariant: {
      bucketId: APPWRITE.buckets.logos.id,
      permissions: (teamId) => [
        Permission.read(Role.team(teamId)),
        Permission.update(Role.team(teamId)),
        Permission.delete(Role.team(teamId)),
      ],
    },
  },
};
