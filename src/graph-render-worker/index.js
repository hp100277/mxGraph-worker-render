import WorkerPromise from "./worker-promise";
import Worker from "worker-loader!./graph-render.worker";

const promise = new WorkerPromise(new Worker());

export default {
  send(msg) {
    return promise.postMessage({
      type: "message",
      msg,
    });
  },
  initCanvas(canvas) {
    return promise.postMessage(
      {
        type: "initCanvas",
        canvas,
      },
      [canvas]
    );
  },
};
