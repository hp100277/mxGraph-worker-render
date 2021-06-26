const zrender = require("zrender");

module.exports = {
  test(msg) {
    return `Test OK!\n${JSON.stringify(msg)}`;
  },
  initCanvas(canvas) {
    const zr = zrender.init(canvas);
    const circle = new zrender.Circle({
      shape: {
        cx: 150,
        cy: 50,
        r: 40,
      },
      style: {
        fill: "none",
        stroke: "#F00",
      },
    });
    zr.add(circle);
  },
};
