import getLastEvent from "../utils/getLastEvent";
import getSelector from "../utils/getSelector";
import tracker from "../utils/tracker";

export function injectJsError() {
  // 监听全局未捕获的错误
  window.addEventListener("error", function (event) {
    console.log(event);
    let lastEvent = getLastEvent();
    console.log(lastEvent);
    let log = {
      kind: "stability", // 监控指标的大类
      type: "error", // 小类型，这是一个错误
      errorType: "jsError", // js执行错误
      url: "", // 访问哪个路径错误
      message: event.message, // 报错信息
      filename: event.filename, // 哪个文件报错了
      position: `${event.lineno}:${event.colno}`, // 报错的行列位置
      stack: getLines(event.error.stack),
      selector: lastEvent ? getSelector(lastEvent.path) : "", // 代表最后一个操作的元素
    };
    console.log(log);
    tracker.send(log)
  });
}

function getLines(stack) {
  return stack
    .split("\n")
    .slice(1)
    .map((item) => item.replace(/^\s+at\s+/g, ""))
    .join("^");
}
