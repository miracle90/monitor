let lastEvent;

["click", "touchstart", "mousedown", "keydown", "mouseover"].forEach(
  (eventType) => {
    document.addEventListener(
      eventType,
      (event) => {
        lastEvent = event;
      },
      {
        capture: true, // 是在捕获阶段还是冒泡阶段执行
        passive: true, // 默认不阻止默认事件
      }
    );
  }
);

export default function () {
  return lastEvent;
}
