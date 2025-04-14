const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const { webpackFederationConfig } = require("@my/core");

module.exports = async () => {

  const { plugins } = await webpackFederationConfig({
    packageName: "app1",
    entry: "remoteEntry.js",
    publicPath: "http://localhost:3001/",
  });

  return {
    mode: "development",
    devtool: "source-map",
    plugins: [
      ...plugins,
      // 添加HTML插件
      new HtmlWebpackPlugin({
        template: "./src/index.html", // 使用项目中的HTML模板
        filename: "index.html",
        title: "App1 - Module Federation Demo",
        // 其他选项
        meta: {
          viewport: "width=device-width, initial-scale=1",
          description: "Webpack Module Federation Demo - App1",
        },
      }),
    ],
    // 添加开发服务器配置
    devServer: {
      static: {
        directory: path.join(__dirname, "dist"),
      },
      port: 3001,
      hot: true,
    },
  };
};
