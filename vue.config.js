module.exports = {
  transpileDependencies: [
    'vuetify',
  ],
  devServer: {
    proxy: {
      "^/api": {
        target: process.env.VUE_APP_API_URL || "http://localhost:3000/",
        ws: true, // proxy websockets
        changeOrigin: true,
        pathRewrite: { "^/api": "" },
        // onProxyReq: (proxyReq) => {},
        logLevel: "debug",
      },
    }

  }
};
