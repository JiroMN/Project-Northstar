const path = require("path");

module.exports = {
  mode: "production", // Minified
  entry: {
    ["animations/global/buttons"]: "./src/animations/global/buttons.js",
    ["animations/global/gsapDefaults"]:
      "./src/animations/global/gsapDefaults.js",
    ["animations/page"]: "./src/animations/page.js",
    ["config/public"]: "./src/config/public.js",
    ["global/globals"]: "./src/global/globals.js",
    ["index"]: "./src/index.js",
    ["pages/studio/testPage"]: "./src/pages/studio/testPage.js",
    ["pages/dashboard"]: "./src/pages/dashboard.js",
    ["pages/continuity"]: "./src/pages/continuity.js",
    ["pages/colorSystem"]: "./src/pages/colorSystem.js",
    ["pages/logoSystem"]: "./src/pages/logoSystem.js",
    ["pages/typographySystem"]: "./src/pages/typographySystem.js",
    ["pages/typographyCommunication"]: "./src/pages/typographyCommunication.js",
    ["pages/gallery"]: "./src/pages/gallery.js",
    ["pages/brandEssence"]: "./src/pages/brandEssence.js",
    ["pages/brandStory"]: "./src/pages/brandStory.js",
    ["pages/subscriptions"]: "./src/pages/subscriptions.js",
    ["pages/login/activateMagicUrl"]: "./src/pages/login/activateMagicUrl.js",
    ["pages/login"]: "./src/pages/login.js",
    ["ui/studio"]: "./src/ui/studio.js",
    ["ui/toast"]: "./src/ui/toast.js",
    ["ui/modal"]: "./src/ui/modal.js",
    ["ui/sidebar"]: "./src/ui/sidebar.js",
    ["ui/screenSize"]: "./src/ui/screenSize.js",
    ["utils/helpers"]: "./src/utils/helpers.js",
    ["utils/dataBinding"]: "./src/utils/dataBinding.js",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js", // Creates file name in 'dist' folder
    library: "[name]",
    libraryTarget: "umd",
    globalObject: "this",
    umdNamedDefine: true,
    clean: true,
  },
};
