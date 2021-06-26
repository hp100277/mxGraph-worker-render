import registerPromiseWorker from "promise-worker/register";
const core = require("./core");

registerPromiseWorker((msg) => {
  if (msg.type === "message") {
    return core.test(msg);
  } else if (msg.type === "initCanvas") {
    return core.initCanvas(msg);
  }
});
