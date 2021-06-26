let messageIds = 0;

function onMessage(self, e) {
  var message = e.data;
  if (!Array.isArray(message) || message.length < 2) {
    // Ignore - this message is not for us.
    return;
  }
  var messageId = message[0];
  var error = message[1];
  var result = message[2];

  var callback = self._callbacks[messageId];

  if (!callback) {
    // Ignore - user might have created multiple WorkerPromises.
    // This message is not for us.
    return;
  }

  delete self._callbacks[messageId];
  callback(error, result);
}

function WorkerPromise(worker) {
  var self = this;
  self._worker = worker;
  self._callbacks = {};

  worker.addEventListener("message", function (e) {
    onMessage(self, e);
  });
}

WorkerPromise.prototype.postMessage = function (
  userMessage,
  transferList = []
) {
  var self = this;
  var messageId = messageIds++;

  var messageToSend = [messageId, userMessage];

  return new Promise(function (resolve, reject) {
    self._callbacks[messageId] = function (error, result) {
      if (error) {
        return reject(new Error(error.message));
      }
      resolve(result);
    };

    // web worker
    self._worker.postMessage(messageToSend, transferList);
  });
};

module.exports = WorkerPromise;
