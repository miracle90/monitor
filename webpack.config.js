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
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/index.html",
      inject: "head", // head or body,
      scriptLoading: 'blocking'
    }),
  ],
};
