const path = require("path");

module.exports = {
  mode: "production", // Minified
  entry: {
    ["animations/global/buttons"]: "./src/animations/global/buttons.js",
    ["animations/global/gsapDefaults"]:
      "./src/animations/global/gsapDefaults.js",
    ["animations/micro"]: "./src/animations/micro.js",
    ["animations/page"]: "./src/animations/page.js",
    ["config/public"]: "./src/config/public.js",
    ["global/globals"]: "./src/global/globals.js",
    ["index"]: "./src/index.js",
    ["pages/dashboard"]: "./src/pages/dashboard.js",
    ["pages/login/activateMagicUrl"]: "./src/pages/login/activateMagicUrl.js",
    ["pages/login/login"]: "./src/pages/login/login.js",
    ["ui/toast"]: "./src/ui/toast.js",
    ["utils/fromat"]: "./src/utils/fromat.js",
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
