const path = require("path");

module.exports = {
    mode: "production",
    entry: "./src/server.ts",
    target: "node",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader"
            }
        ]
    },
    resolve: {
        extensions: [ ".tsx", ".ts", ".js" ],
        modules: ["node_modules"]
    },
    output: {
        filename: "api.js",
        path: path.resolve(__dirname, "netlify", "functions")
    },
    optimization:{
        minimize: false
    }
};