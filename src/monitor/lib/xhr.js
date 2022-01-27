import tracker from "../utils/tracker";

export function injectXHR() {
  let XMLHttpRequest = window.XMLHttpRequest;
  let oldOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, async) {
    // 把上报接口过滤掉
    if (!url.match(/logstores/) && !url.match(/sockjs/)) {
      this.logData = { method, url, async };
    }
    return oldOpen.apply(this, arguments);
  };
  let oldSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (body) {
    if (this.logData) {
      let startTime = Date.now();
      let handler = (type) => (event) => {
        // 持续时间
        let duration = Date.now() - startTime;
        let status = this.status;
        let statusText = this.statusText;
        tracker.send({
          kind: "stability",
          type: "xhr",
          eventType: type,
          pathname: this.logData.url,
          status: status + "-" + statusText, // 状态码
          duration,
          response: this.response ? JSON.stringify(this.response) : "", // 响应体
          params: body || "", // 入参
        });
      };
      this.addEventListener("load", handler("load"), false);
      this.addEventListener("error", handler, false);
      this.addEventListener("abort", handler, false);
    }
    return oldSend.apply(this, arguments);
  };
}
