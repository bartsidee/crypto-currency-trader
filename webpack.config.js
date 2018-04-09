var path = require("path");
var nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: {
    "function-timer-fee": "./function-timer-fee/index.ts",
    "function-timer-markets": "./function-timer-markets/index.ts",
    "function-timer-portfolio": "./function-timer-portfolio/index.ts",
    "function-timer-trade": "./function-timer-trade/index.ts",
    "function-http-current": "./function-http-current/index.ts",
    "function-http-directsell": "./function-http-directsell/index.ts",
    "function-http-history": "./function-http-history/index.ts"
  }, 
  target: "node",
  externals: [nodeExternals()],
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'awesome-typescript-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  },
  output: {
    path: path.resolve(__dirname),
    filename: "[name]/index.bundle.js",
    library: "index",
    libraryTarget: "commonjs2",
  },
  node: {
    __dirname: false,
    __filename: false,
  }
};
