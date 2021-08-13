console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
console.log('CUSTOM ENV');
console.log(`${(keys=>keys.map(key=>`${key} : ${process.env[key]}`).join("\n"))(Object.keys(process.env).filter(x=>x.startsWith('VUE_APP_')))}`);
console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');

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
