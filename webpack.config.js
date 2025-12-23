const path = require("path");

module.exports = {
  mode: "production", // Minified
  entry: {
    ["animations/gsapDefaults"]: "./src/animations/gsapDefaults.js",
    ["animations/micro"]: "./src/animations/micro.js",
    ["animations/page"]: "./src/animations/page.js",
    ["appwrite/auth"]: "./src/appwrite/auth.js",
    ["appwrite/client"]: "./src/appwrite/client.js",
    ["appwrite/db"]: "./src/appwrite/db.js",
    ["appwrite/storage"]: "./src/appwrite/storage.js",
    ["index"]: "./src/index.js",
    ["pages/dashboard"]: "./src/pages/dashboard.js",
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
