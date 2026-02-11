import { Permission, Role } from "appwrite";
import APPWRITE from "./public";

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
        fontWeights: data.fontWeights,
        typographyRules: data.typographyRules,
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
        weight_num: data.weightNumber,
        weight_txt: data.weightText,
        style: data.fontStyle,
        notes: data.fontNotes,
        fonts: data.fonts,
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
        letterspacing_percent: data.logoSets,
        line_height_percent: data.logoSets,
        fonts: data.logoSets,
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
        base_px: data.basePx,
        typographyScale: data.typographyScale,
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
