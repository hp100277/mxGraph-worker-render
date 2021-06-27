const zrender = require("zrender/lib/zrender");
const _export = require("zrender/lib/export");
const mxUtils = require("./lib/util/mxUtils");
const mxCodec = require("./lib/io/mxCodec");
const mxGraphModel = require("./lib/model/mxGraphModel");
require("./lib/io/mxCellCodec");
require("./lib/io/mxModelCodec");

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
  const xml = `<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="2" vertex="1" parent="1" value="Interval 1"><mxGeometry x="380" y="0" width="140" height="30" as="geometry"/></mxCell><mxCell id="3" vertex="1" parent="1" value="Interval 2"><mxGeometry x="200" y="80" width="380" height="30" as="geometry"/></mxCell><mxCell id="4" vertex="1" parent="1" value="Interval 3"><mxGeometry x="40" y="140" width="260" height="30" as="geometry"/></mxCell><mxCell id="5" vertex="1" parent="1" value="Interval 4"><mxGeometry x="120" y="200" width="240" height="30" as="geometry"/></mxCell><mxCell id="6" vertex="1" parent="1" value="Interval 5"><mxGeometry x="420" y="260" width="80" height="30" as="geometry"/></mxCell><mxCell id="7" edge="1" source="2" target="3" parent="1" value="Transfer1"><mxGeometry as="geometry"><Array as="points"><Object x="420" y="60"/></Array></mxGeometry></mxCell><mxCell id="8" edge="1" source="2" target="6" parent="1" value=""><mxGeometry as="geometry" relative="1" y="-30"><Array as="points"><Object x="600" y="60"/></Array></mxGeometry></mxCell><mxCell id="9" edge="1" source="3" target="4" parent="1" value="Transfer3"><mxGeometry as="geometry"><Array as="points"><Object x="260" y="120"/></Array></mxGeometry></mxCell><mxCell id="10" edge="1" source="4" target="5" parent="1" value="Transfer4"><mxGeometry as="geometry"><Array as="points"><Object x="200" y="180"/></Array></mxGeometry></mxCell><mxCell id="11" edge="1" source="4" target="6" parent="1" value="Transfer5"><mxGeometry as="geometry" relative="1" y="-10"><Array as="points"><Object x="460" y="155"/></Array></mxGeometry></mxCell></root></mxGraphModel>`;
  const xmlDocument = mxUtils.parseXml(xml);

  if (
    xmlDocument.documentElement != null &&
    xmlDocument.documentElement.nodeName == "mxGraphModel"
  ) {
    const decoder = new mxCodec(xmlDocument);
    const node = xmlDocument.documentElement;
    const model = new mxGraphModel();
    decoder.decode(node, model);
    console.log(model);
  }

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
