const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
// user agent 把浏览器的 ua 转成一个对象

module.exports = {
  entry: "./src/index.js",
  // 上下文目录
  context: process.cwd(),
  mode: "development",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "monitor.js",
  },
  devServer: {
    // devServer静态文件根目录
    // contentBase: path.resolve(__dirname, "dist"),
    // setupMiddlewares
    onBeforeSetupMiddleware: (devServer) => {
      if (!devServer) {
        throw new Error("webpack-dev-server is not defined");
      }

      devServer.app.get("/success", function (req, res) {
        res.json({ id: 1 });
      });

      devServer.app.post("/error", function (req, res) {
        res.sendStatus(500);
      });
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/index.html",
      inject: "head", // head or body,
      scriptLoading: "blocking",
    }),
  ],
};
