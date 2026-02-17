export const ERRORS = {
  codes: {
    400: "Invalid request. Please check your input.",
    401: "You are not authorized. Please log in again.",
    403: "You don't have permission to perform this action.",
    404: "The requested resource was not found.",
    409: "This already exists.",
    429: "Too many requests. Please try again shortly.",
    500: "Something went wrong on our side. Please try again later.",
  },

  types: {
    user_invalid_credentials: "Invalid email address.",
    user_not_found: "We couldn't find an account with this email address.",
    user_already_exists: "An account with this email already exists.",
    general_rate_limit_exceeded:
      "Too many attempts. Please slow down and try again.",
    general_unauthorized_scope: "You are not allowed to perform this action.",
  },

  fallback: "Something went wrong. Please try again.",
};

export const CONFIG = {
  baseUrl: "https://thebrand-book.webflow.io",
};

export const APPWRITE = {
  endpoint: "https://fra.cloud.appwrite.io/v1",
  projectId: "6940136600382a052352",

  functions: {
    getSubscription: "69722558002ef4dae81e",
    createPortalSession: "69738875002716066928",
    getStripeProducts: "6974b9800007630ad391",
    addCompany: "6980a1d00007b504bd1b",
    addUser: "6981ec6b001556993df5",
    removeUser: "6981ffe2000e07638e0b",
    sendResendEmail: "69943fde000436c205b8",
  },

  databases: {
    continuity: {
      id: "6943fd3500265a51fec6",
      collections: {
        timelogs: {
          id: "continuity_time_logs",
        },
        subscriptions: {
          id: "client_continuity_subscriptions",
        },
        packages: {
          id: "continuity_packages",
        },
      },
    },

    gallery: {
      id: "6943fb88000ea3c2bd0c",
      collections: {
        images: { id: "gallery_items" },
        albums: { id: "gallery_category" },
      },
    },

    toneOfVoice: {
      id: "6943f91a001f7850c28a",
      collections: {
        traits: { id: "tov_traits" },
        examples: { id: "tov_examples" },
        examplesTraits: { id: "tov_examples_traits" },
      },
    },

    typographySystem: {
      id: "6943f5e0000fdaf78b87",
      collections: {
        fonts: { id: "fonts" },
        weights: { id: "font_weights" },
        rules: { id: "typography_rules" },
        scales: { id: "typography_scale" },
        clientTypographyScale: { id: "client_typography_scale" },
      },
    },

    logoSystem: {
      id: "6943e602000575097a20",
      collections: {
        sets: { id: "logo_sets" },
        variants: { id: "logo_variants" },
      },
    },

    brandStory: {
      id: "6943e48e002d2989d8db",
      collections: {
        obituary: { id: "orbituary" },
        vision: { id: "vision" },
      },
    },

    brandEssence: {
      id: "6943e3650014a2570d31",
      collections: {
        corePurpose: { id: "core_purpose" },
        onliness: { id: "onliness_statement" },
        trueline: { id: "trueline" },
      },
    },

    general: {
      id: "6943e2e80021713989fd",
      collections: {
        resources: { id: "resources" },
      },
    },

    accounts: {
      id: "6943e20e0018e70785f8",
      collections: {
        clients: { id: "clients" },
        users: { id: "users" },
      },
    },

    colorSystem: {
      id: "694018ce00385f47dafe",
      collections: {
        palettes: { id: "color_palettes" },
        tokens: { id: "color_tokens" },
      },
    },
  },

  buckets: {
    logos: {
      id: "694400790025690e2c19",
    },
    clientFiles: {
      id: "6971ef4b003440c686a1",
    },
    gallery: {
      id: "694400c1003113933eb3",
    },
    vision: {
      id: "69440036002d5adaef9e",
    },
    obituary: {
      id: "6943ffe2000bd3dbf9c3",
    },
    brandbooks: {
      id: "6953c5e200333444aafc",
    },
  },
};

export default APPWRITE;
