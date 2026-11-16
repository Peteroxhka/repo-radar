const path = require("node:path");
module.exports = {
  mode: "production",
  target: ["web", "es5"],
  entry: ["core-js/stable", "whatwg-fetch", "./lib/browser-compat.js", "./app.js"],
  output: { path: path.resolve(__dirname, "assets"), filename: "catalog.bundle.js" },
  resolve: { mainFields: ["browser", "module", "main"] },
  module: {
    rules: [{
      test: /\.(?:mjs|js)$/,
      type: "javascript/auto",
      exclude: /node_modules[\\/](?:core-js|whatwg-fetch)[\\/]/,
      use: { loader: "babel-loader", options: {
        presets: [["@babel/preset-env", { targets: { ie: "11" }, modules: false, bugfixes: true }]]
      }}
    }]
  },
  performance: { hints: false }
};
