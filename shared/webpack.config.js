const path = require("path");
const { webpackFederationConfig } = require("@my/core");

module.exports = async () => {
  const packageName = "shared_vendors";
  // 导出的包列表
  const sharedPackages = {
    react: "react",
    "react-dom": "react-dom",
    "react-dom/client": "react-dom/client",
    lodash: "lodash",
  };

  const publicPath = "http://localhost:3000/";

  const { plugins } = await webpackFederationConfig({
    packageName,
    sharedPackages,
    entry: "remoteEntry.js",
    publicPath,
    remote: false,
  });

  return {
    mode: "development",
    devtool: "source-map",
    output: {
      path: path.resolve(__dirname, "dist"),
      publicPath: publicPath,
    },
    plugins: [
      ...plugins,
    ],
    // 添加开发服务器配置
    devServer: {
      static: {
        directory: path.join(__dirname, "dist"),
      },
      port: 3000,
      hot: true,
    },
  };
};
