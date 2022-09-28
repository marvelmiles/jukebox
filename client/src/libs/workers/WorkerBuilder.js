// source = mdn + stackoverflow
export default class WorkerBuilder extends Worker {
  constructor(worker) {
    super(generateWorkerURL(worker));
    this.terminated = false;
    this.addEventListener("error", (evt) => {
      if (evt.message && evt.message.endsWith("closing")) {
        evt.stopImmediatePropagation(); // don't let other scripts know about it
        evt.preventDefault(); // don't verbose in console
        Object.defineProperty(this, "terminated", { value: true });
      }
    });
  }
  createFnMap(fn) {
    if (typeof fn === "string") {
      let args = fn.indexOf("(");
      args =
        args >= 0
          ? fn.substring(args + 1, fn.indexOf(")"))
          : fn.substring(0, fn.indexOf("=>") - 1);
      return {
        name: "anonymous",
        args,
        body: fn.substring(fn.indexOf("{") + 1, fn.lastIndexOf("}")),
      };
    }
  }
  postMessage(data) {
    if (data.callback) data.callback = this.createFnMap(data.callback);
    Worker.prototype.postMessage.call(this, data);
  }
  terminate() {
    Object.defineProperty(this, "terminated", { value: true });
    Worker.prototype.terminate.call(this);
  }
}

export const generateWorkerURL = (worker) => {
  const blob = new Blob([`(${worker.toString()})()`]);
  return URL.createObjectURL(blob);
};
