import tracker from "../utils/tracker";
import onload from "../utils/onload";
import getLastEvent from "../utils/getLastEvent";
import getSelector from "../utils/getSelector";

export function timing() {
  let FMP, LCP;
  // 增加一个性能条目的观察者
  new PerformanceObserver((entryList, observer) => {
    const perfEntries = entryList.getEntries();
    FMP = perfEntries[0];
    observer.disconnect(); // 不再观察了
  }).observe({ entryTypes: ["element"] }); // 观察页面中有意义的元素
  // 增加一个性能条目的观察者
  new PerformanceObserver((entryList, observer) => {
    const perfEntries = entryList.getEntries();
    const lastEntry = perfEntries[perfEntries.length - 1];
    LCP = lastEntry;
    observer.disconnect(); // 不再观察了
  }).observe({ entryTypes: ["largest-contentful-paint"] }); // 观察页面中最大的元素
  // 增加一个性能条目的观察者
  new PerformanceObserver((entryList, observer) => {
    const lastEvent = getLastEvent();
    const firstInput = entryList.getEntries()[0];
    if (firstInput) {
      // 开始处理的时间 - 开始点击的时间，差值就是处理的延迟
      let inputDelay = firstInput.processingStart - firstInput.startTime;
      let duration = firstInput.duration; // 处理的耗时
      if (inputDelay > 0 || duration > 0) {
        tracker.send({
          kind: "experience", // 用户体验指标
          type: "firstInputDelay", // 首次输入延迟
          inputDelay: inputDelay ? formatTime(inputDelay) : 0, // 延迟的时间
          duration: duration ? formatTime(duration) : 0,
          startTime: firstInput.startTime, // 开始处理的时间
          selector: lastEvent
            ? getSelector(lastEvent.path || lastEvent.target)
            : "",
        });
      }
    }
    observer.disconnect(); // 不再观察了
  }).observe({ type: "first-input", buffered: true }); // 第一次交互

  // 刚开始页面内容为空，等页面渲染完成，再去做判断
  onload(function () {
    setTimeout(() => {
      const {
        fetchStart,
        connectStart,
        connectEnd,
        requestStart,
        responseStart,
        responseEnd,
        domLoading,
        domInteractive,
        domContentLoadedEventStart,
        domContentLoadedEventEnd,
        loadEventStart,
      } = window.performance.timing;
      // 发送时间指标
      tracker.send({
        kind: "experience", // 用户体验指标
        type: "timing", // 统计每个阶段的时间
        connectTime: connectEnd - connectStart, // TCP连接耗时
        ttfbTime: responseStart - requestStart, // 首字节到达时间
        responseTime: responseEnd - responseStart, // response响应耗时
        parseDOMTime: loadEventStart - domLoading, // DOM解析渲染的时间
        domContentLoadedTime:
          domContentLoadedEventEnd - domContentLoadedEventStart, // DOMContentLoaded事件回调耗时
        timeToInteractive: domInteractive - fetchStart, // 首次可交互时间
        loadTime: loadEventStart - fetchStart, // 完整的加载时间
      });
      // 发送性能指标
      let FP = performance.getEntriesByName("first-paint")[0];
      let FCP = performance.getEntriesByName("first-contentful-paint")[0];
      console.log("FP", FP);
      console.log("FCP", FCP);
      console.log("FMP", FMP);
      console.log("LCP", LCP);
      tracker.send({
        kind: "experience",
        type: "paint",
        firstPaint: FP ? formatTime(FP.startTime) : 0,
        firstContentPaint: FCP ? formatTime(FCP.startTime) : 0,
        firstMeaningfulPaint: FMP ? formatTime(FMP.startTime) : 0,
        largestContentfulPaint: LCP
          ? formatTime(LCP.renderTime || LCP.loadTime)
          : 0,
      });
    }, 3000);
  });
}
