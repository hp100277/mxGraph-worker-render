module.exports = {
  chainWebpack: (config) => {
    config.output.globalObject("this");

    // config.module
    //   .rule("worker")
    //   .test(/\.worker\.js$/)
    //   .use("worker-loader")
    //   .loader("worker-loader")
    //   .options({
    //     inline: true,
    //   })
    //   .end();
    config.module.rule("js").exclude.add(/\.worker\.js$/);
  },
};
