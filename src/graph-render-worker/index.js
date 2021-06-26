import PromiseWorker from "promise-worker";
import Worker from "worker-loader!./graph-render.worker";

const promiseWorker = new PromiseWorker(new Worker());

export default {
  send(msg) {
    return promiseWorker.postMessage({
      type: "message",
      msg,
    });
  },
  init(cnavas) {
    return promiseWorker.postMessage(
      {
        type: "initCanvas",
        cnavas,
      },
      [cnavas]
    );
  },
};
