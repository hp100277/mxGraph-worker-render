const zrender = require("zrender/lib/zrender");
const _export = require("zrender/lib/export");

(function () {
  for (var key in _export) {
    if (
      _export == null ||
      // eslint-disable-next-line no-prototype-builtins
      !_export.hasOwnProperty(key) ||
      key === "default" ||
      key === "__esModule"
    )
      return;
    zrender[key] = _export[key];
  }
})();

const CanvasPainter = require("zrender/lib/canvas/Painter");
zrender.registerPainter("canvas", CanvasPainter.default);

function test(msg) {
  return `Test OK!\n${JSON.stringify(msg)}`;
}

function initCanvas({ canvas }) {
  const zr = zrender.init(canvas);
  var w = zr.getWidth();
  var h = zr.getHeight();

  var r = 30;
  var circle = new zrender.Circle({
    shape: {
      cx: r,
      cy: h / 2,
      r: r,
    },
    style: {
      fill: "transparent",
      stroke: "#FF6EBE",
    },
    silent: true,
  });

  circle
    .animate("shape", true)
    .when(5000, {
      cx: w - r,
    })
    .when(10000, {
      cx: r,
    })
    .start();

  zr.add(circle);
}

module.exports = {
  test,
  initCanvas,
};
