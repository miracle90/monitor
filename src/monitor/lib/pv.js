import tracker from "../utils/tracker";
export function pv() {
  var connection = navigator.connection;
  tracker.send({
    kind: "business",
    type: "pv",
    effectiveType: connection.effectiveType, //网络环境
    rtt: connection.rtt, //往返时间
    screen: `${window.screen.width}x${window.screen.height}`, //设备分辨率
  });
  let startTime = Date.now();
  window.addEventListener(
    "unload",
    () => {
      let stayTime = Date.now() - startTime;
      tracker.send({
        kind: "business",
        type: "stayTime",
        stayTime,
      });
    },
    false
  );
}
