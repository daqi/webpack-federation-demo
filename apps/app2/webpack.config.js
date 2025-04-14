const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const { webpackFederationConfig } = require("@my/core");

module.exports = async () => {
  // 导出的包列表
  const sharedPackages = {
    Button: "./src/Button",
  };

  const publicPath = "http://localhost:3002/";

  const { plugins } = await webpackFederationConfig({
    packageName: 'app2',
    sharedPackages,
    entry: "remoteEntry.js",
    publicPath,
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
      // 添加HTML插件
      new HtmlWebpackPlugin({
        template: "./src/index.html", // 使用项目中的HTML模板
        filename: "index.html",
        title: "App2 - Module Federation Demo",
        // 其他选项
        meta: {
          viewport: "width=device-width, initial-scale=1",
          description: "Webpack Module Federation Demo - App2",
        },
      }),
    ],
    // 添加开发服务器配置
    devServer: {
      static: {
        directory: path.join(__dirname, "dist"),
      },
      port: 3002,
      hot: true,
    },
  };
};
