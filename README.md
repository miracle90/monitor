### 概览
> * 为什么要做前端监控
> * 前端监控目标
> * 前端监控流程
> * 编写采集脚本
>   * 日志系统监控
>   * 错误监控
>   * 接口异常
>   * 白屏监控
>   * 加载时间
>   * 性能指标
>   * 卡顿
>   * pv
> * [扩展问题](#qa)
>   1. 性能监控指标
>   1. 前端怎么做性能监控
>   1. 线上错误监控怎么做
>   1. 导致内存泄漏的方法，怎么监控内存泄漏
>   1. Node 怎么做性能监控

## 1. 为什么要做前端监控

* 更快的发现问题和解决问题
* 做产品的决策依据
* 为业务扩展提供了更多可能性
* 提升前端工程师的技术深度和广度，打造简历亮点

## 2. 前端监控目标

### 2.1 稳定性 stability

* js错误：js执行错误、promise异常
* 资源错误：js、css资源加载异常
* 接口错误：ajax、fetch请求接口异常
* 白屏：页面空白

### 2.2 用户体验 experience

### 2.3 业务 business

* pv：页面浏览量和点击量
* uv：访问某个站点的不同ip的人数
* 用户在每一个页面的停留时间

## 3. 前端监控流程

1. 前端埋点
1. 数据上报
1. 加工汇总
1. 可视化展示
1. 监控报警

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/bd91043540624db19d7bb390ee9752e4~tplv-k3u1fbpfcp-watermark.image?)

### 3.1 常见的埋点方案

#### 3.1.1 代码埋点

* 嵌入代码的形式
* 优点：精确（任意时刻，数据量全面）
* 缺点：代码工作量点

#### 3.1.2 可视化埋点

* 通过可视化交互的手段，代替代码埋点
* 将业务代码和埋点代码分离，提供一个可视化交互的页面，输入为业务代码，通过这个系统，可以在业务代码中自定义的增加埋点事件等等，最后输出的代码耦合了业务代码和埋点代码
* 用系统来代替手工插入埋点代码

#### 3.1.3 无痕埋点

* 前端的任意一个事件被绑定一个标识，所有的事件都被记录下来
* 通过定期上传记录文件，配合文件解析，解析出来我们想要的数据，并生成可视化报告供专业人员分析
* 无痕埋点的优点是采集全量数据，不会出现漏埋和误埋等现象
* 缺点是给数据传输和服务器增加压力，也无法灵活定制数据结构

## 4. 编写采集脚本

### 4.1 接入日志系统

* 各公司一般都有自己的日志系统，接收数据上报，例如：阿里云

### 4.2 监控错误

#### 4.2.1 错误分类

* js错误（js执行错误，promise异常）
* 资源加载异常：监听error

#### 4.2.2 数据结构分析

##### 1. jsError

```json
{
    "title": "前端监控系统", // 页面标题
    "url": "http://localhost:8080/", // 页面URL
    "timestamp": "1590815288710", // 访问时间戳
    "userAgent": "Chrome", // 用户浏览器类型
    "kind": "stability", // 大类
    "type": "error", // 小类
    "errorType": "jsError", // 错误类型
    "message": "Uncaught TypeError: Cannot set property 'error' of undefined", // 类型详情
    "filename": "http://localhost:8080/", // 访问的文件名
    "position": "0:0", // 行列信息
    "stack": "btnClick (http://localhost:8080/:20:39)^HTMLInputElement.onclick (http://localhost:8080/:14:72)", // 堆栈信息
    "selector": "HTML BODY #container .content INPUT" // 选择器
}
```

##### 2. promiseError

```json
{
    ...
    "errorType": "promiseError",//错误类型 
    "message": "someVar is not defined",//类型详情
    "stack": "http://localhost:8080/:24:29^new Promise (<anonymous>)^btnPromiseClick (http://localhost:8080/:23:13)^HTMLInputElement.onclick (http://localhost:8080/:15:86)",//堆栈信息 
    "selector": "HTML BODY #container .content INPUT"//选择器
}
```

##### 3. resourceError

```json
    ...
    "errorType": "resourceError",//错误类型
    "filename": "http://localhost:8080/error.js",//访问的文件名
    "tagName": "SCRIPT",//标签名
    "timeStamp": "76",//时间 
```

#### 4.2.3 实现

##### 1. 资源加载错误 + js执行错误

```js
//一般JS运行时错误使用window.onerror捕获处理
window.addEventListener(
  "error",
  function (event) {
    let lastEvent = getLastEvent();
    // 有 e.target.src(href) 的认定为资源加载错误
    if (event.target && (event.target.src || event.target.href)) {
      tracker.send({
        //资源加载错误
        kind: "stability", //稳定性指标
        type: "error", //resource
        errorType: "resourceError",
        filename: event.target.src || event.target.href, //加载失败的资源
        tagName: event.target.tagName, //标签名
        timeStamp: formatTime(event.timeStamp), //时间
        selector: getSelector(event.path || event.target), //选择器
      });
    } else {
      tracker.send({
        kind: "stability", //稳定性指标
        type: "error", //error
        errorType: "jsError", //jsError
        message: event.message, //报错信息
        filename: event.filename, //报错链接
        position: (event.lineNo || 0) + ":" + (event.columnNo || 0), //行列号
        stack: getLines(event.error.stack), //错误堆栈
        selector: lastEvent
          ? getSelector(lastEvent.path || lastEvent.target)
          : "", //CSS选择器
      });
    }
  },
  true
); // true代表在捕获阶段调用,false代表在冒泡阶段捕获,使用true或false都可以
```
##### 2. promise异常

```js
//当Promise 被 reject 且没有 reject 处理器的时候，会触发 unhandledrejection 事件
window.addEventListener(
  "unhandledrejection",
  function (event) {
    let lastEvent = getLastEvent();
    let message = "";
    let line = 0;
    let column = 0;
    let file = "";
    let stack = "";
    if (typeof event.reason === "string") {
      message = event.reason;
    } else if (typeof event.reason === "object") {
      message = event.reason.message;
    }
    let reason = event.reason;
    if (typeof reason === "object") {
      if (reason.stack) {
        var matchResult = reason.stack.match(/at\s+(.+):(\d+):(\d+)/);
        if (matchResult) {
          file = matchResult[1];
          line = matchResult[2];
          column = matchResult[3];
        }
        stack = getLines(reason.stack);
      }
    }
    tracker.send({
      //未捕获的promise错误
      kind: "stability", //稳定性指标
      type: "error", //jsError
      errorType: "promiseError", //unhandledrejection
      message: message, //标签名
      filename: file,
      position: line + ":" + column, //行列
      stack,
      selector: lastEvent
        ? getSelector(lastEvent.path || lastEvent.target)
        : "",
    });
  },
  true
); // true代表在捕获阶段调用,false代表在冒泡阶段捕获,使用true或false都可以
```

### 4.3 接口异常采集脚本

#### 4.3.1 数据设计

```json
{
  "title": "前端监控系统", //标题
  "url": "http://localhost:8080/", //url
  "timestamp": "1590817024490", //timestamp
  "userAgent": "Chrome", //浏览器版本
  "kind": "stability", //大类
  "type": "xhr", //小类
  "eventType": "load", //事件类型
  "pathname": "/success", //路径
  "status": "200-OK", //状态码
  "duration": "7", //持续时间
  "response": "{\"id\":1}", //响应内容
  "params": "" //参数
}
```

```json
{
  "title": "前端监控系统",
  "url": "http://localhost:8080/",
  "timestamp": "1590817025617",
  "userAgent": "Chrome",
  "kind": "stability",
  "type": "xhr",
  "eventType": "load",
  "pathname": "/error",
  "status": "500-Internal Server Error",
  "duration": "7",
  "response": "",
  "params": "name=zhufeng"
}
```

#### 4.3.2 实现

使用webpack devServer模拟请求

* 重写xhr的open、send方法
* 监听load、error、abort事件

```js
import tracker from "../util/tracker";
export function injectXHR() {
  let XMLHttpRequest = window.XMLHttpRequest;
  let oldOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (
    method,
    url,
    async,
    username,
    password
  ) {
    // 上报的接口不用处理
    if (!url.match(/logstores/) && !url.match(/sockjs/)) {
      this.logData = {
        method,
        url,
        async,
        username,
        password,
      };
    }
    return oldOpen.apply(this, arguments);
  };
  let oldSend = XMLHttpRequest.prototype.send;
  let start;
  XMLHttpRequest.prototype.send = function (body) {
    if (this.logData) {
      start = Date.now();
      let handler = (type) => (event) => {
        let duration = Date.now() - start;
        let status = this.status;
        let statusText = this.statusText;
        tracker.send({
          //未捕获的promise错误
          kind: "stability", //稳定性指标
          type: "xhr", //xhr
          eventType: type, //load error abort
          pathname: this.logData.url, //接口的url地址
          status: status + "-" + statusText,
          duration: "" + duration, //接口耗时
          response: this.response ? JSON.stringify(this.response) : "",
          params: body || "",
        });
      };
      this.addEventListener("load", handler("load"), false);
      this.addEventListener("error", handler("error"), false);
      this.addEventListener("abort", handler("abort"), false);
    }
    oldSend.apply(this, arguments);
  };
}
```

### 4.4 白屏

- 白屏就是页面上什么都没有

#### 4.4.1 数据设计

```js
{
  "title": "前端监控系统",
  "url": "http://localhost:8080/",
  "timestamp": "1590822618759",
  "userAgent": "chrome",
  "kind": "stability", //大类
  "type": "blank", //小类
  "emptyPoints": "0", //空白点
  "screen": "2049x1152", //分辨率
  "viewPoint": "2048x994", //视口
  "selector": "HTML BODY #container" //选择器
}
```

#### 4.4.2 实现

-   [elementsFromPoint](https://developer.mozilla.org/zh-CN/docs/Web/API/Document/elementsFromPoint)方法可以获取到当前视口内指定坐标处，由里到外排列的所有元素
- 根据 elementsFromPoint api，获取屏幕水平中线和竖直中线所在的元素

```js
import tracker from "../util/tracker";
import onload from "../util/onload";
function getSelector(element) {
  var selector;
  if (element.id) {
    selector = `#${element.id}`;
  } else if (element.className && typeof element.className === "string") {
    selector =
      "." +
      element.className
        .split(" ")
        .filter(function (item) {
          return !!item;
        })
        .join(".");
  } else {
    selector = element.nodeName.toLowerCase();
  }
  return selector;
}
export function blankScreen() {
  const wrapperSelectors = ["body", "html", "#container", ".content"];
  let emptyPoints = 0;
  function isWrapper(element) {
    let selector = getSelector(element);
    if (wrapperSelectors.indexOf(selector) >= 0) {
      emptyPoints++;
    }
  }
  onload(function () {
    let xElements, yElements;
    debugger;
    for (let i = 1; i <= 9; i++) {
      xElements = document.elementsFromPoint(
        (window.innerWidth * i) / 10,
        window.innerHeight / 2
      );
      yElements = document.elementsFromPoint(
        window.innerWidth / 2,
        (window.innerHeight * i) / 10
      );
      isWrapper(xElements[0]);
      isWrapper(yElements[0]);
    }
    if (emptyPoints >= 0) {
      let centerElements = document.elementsFromPoint(
        window.innerWidth / 2,
        window.innerHeight / 2
      );
      tracker.send({
        kind: "stability",
        type: "blank",
        emptyPoints: "" + emptyPoints,
        screen: window.screen.width + "x" + window.screen.height,
        viewPoint: window.innerWidth + "x" + window.innerHeight,
        selector: getSelector(centerElements[0]),
      });
    }
  });
}
//screen.width  屏幕的宽度   screen.height 屏幕的高度
//window.innerWidth 去除工具条与滚动条的窗口宽度 window.innerHeight 去除工具条与滚动条的窗口高度
```

### 4.5 加载时间

-   [PerformanceTiming](https://developer.mozilla.org/zh-CN/docs/Web/API/PerformanceTiming)
-   [DOMContentLoaded](https://developer.mozilla.org/zh-CN/docs/Web/Events/DOMContentLoaded)
-   [FMP](https://docs.google.com/document/d/1BR94tJdZLsin5poeet0XoTW60M0SjvOJQttKT-JK8HI/view#)

#### 4.5.1 阶段含义

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7d30801313694b8bbf1e8977b8d8bd45~tplv-k3u1fbpfcp-watermark.image?)

字段                         | 含义                                                                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| navigationStart            | 初始化页面，在同一个浏览器上下文中前一个页面unload的时间戳，如果没有前一个页面的unload,则与fetchStart值相等                                                          |
| redirectStart              | 第一个HTTP重定向发生的时间,有跳转且是同域的重定向,否则为0                                                                                           |
| redirectEnd                | 最后一个重定向完成时的时间,否则为0                                                                                                         |
| fetchStart                 | 浏览器准备好使用http请求获取文档的时间,这发生在检查缓存之前                                                                                           |
| domainLookupStart          | DNS域名开始查询的时间,如果有本地的缓存或keep-alive则时间为0                                                                                      |
| domainLookupEnd            | DNS域名结束查询的时间                                                                                                               |
| connectStart               | TCP开始建立连接的时间,如果是持久连接,则与`fetchStart`值相等                                                                                     |
| secureConnectionStart      | https 连接开始的时间,如果不是安全连接则为0                                                                                                  |
| connectEnd                 | TCP完成握手的时间，如果是持久连接则与`fetchStart`值相等                                                                                        |
| requestStart               | HTTP请求读取真实文档开始的时间,包括从本地缓存读取                                                                                                |
| requestEnd                 | HTTP请求读取真实文档结束的时间,包括从本地缓存读取                                                                                                |
| responseStart              | 返回浏览器从服务器收到（或从本地缓存读取）第一个字节时的Unix毫秒时间戳                                                                                      |
| responseEnd                | 返回浏览器从服务器收到（或从本地缓存读取，或从本地资源读取）最后一个字节时的Unix毫秒时间戳                                                                            |
| unloadEventStart           | 前一个页面的unload的时间戳 如果没有则为0                                                                                                   |
| unloadEventEnd             | 与`unloadEventStart`相对应，返回的是`unload`函数执行完成的时间戳                                                                              |
| domLoading                 | 返回当前网页DOM结构开始解析时的时间戳,此时`document.readyState`变成loading,并将抛出`readyStateChange`事件                                             |
| domInteractive             | 返回当前网页DOM结构结束解析、开始加载内嵌资源时时间戳,`document.readyState` 变成`interactive`，并将抛出`readyStateChange`事件(注意只是DOM树解析完成,这时候并没有开始加载网页内的资源) |
| domContentLoadedEventStart | 网页domContentLoaded事件发生的时间                                                                                                  |
| domContentLoadedEventEnd   | 网页domContentLoaded事件脚本执行完毕的时间,domReady的时间                                                                                  |
| domComplete                | DOM树解析完成,且资源也准备就绪的时间,`document.readyState`变成`complete`.并将抛出`readystatechange`事件                                            |
| loadEventStart             | load 事件发送给文档，也即load回调函数开始执行的时间                                                                                             |
| loadEventEnd               | load回调函数执行完成的时间

#### 4.5.2 阶段计算

字段        | 描述                             | 计算方式                                                  | 意义                                                               |
| --------- | ------------------------------ | ----------------------------------------------------- | ---------------------------------------------------------------- |
| unload    | 前一个页面卸载耗时                      | unloadEventEnd – unloadEventStart                     | -                                                                |
| redirect  | 重定向耗时                          | redirectEnd – redirectStart                           | 重定向的时间                                                           |
| appCache  | 缓存耗时                           | domainLookupStart – fetchStart                        | 读取缓存的时间                                                          |
| dns       | DNS 解析耗时                       | domainLookupEnd – domainLookupStart                   | 可观察域名解析服务是否正常                                                    |
| tcp       | TCP 连接耗时                       | connectEnd – connectStart                             | 建立连接的耗时                                                          |
| ssl       | SSL 安全连接耗时                     | connectEnd – secureConnectionStart                    | 反映数据安全连接建立耗时                                                     |
| ttfb      | Time to First Byte(TTFB)网络请求耗时 | responseStart – requestStart                          | TTFB是发出页面请求到接收到应答数据第一个字节所花费的毫秒数                                  |
| response  | 响应数据传输耗时                       | responseEnd – responseStart                           | 观察网络是否正常                                                         |
| dom       | DOM解析耗时                        | domInteractive – responseEnd                          | 观察DOM结构是否合理，是否有JS阻塞页面解析                                          |
| dcl       | DOMContentLoaded 事件耗时          | domContentLoadedEventEnd – domContentLoadedEventStart | 当 HTML 文档被完全加载和解析完成之后，DOMContentLoaded 事件被触发，无需等待样式表、图像和子框架的完成加载 |
| resources | 资源加载耗时                         | domComplete – domContentLoadedEventEnd                | 可观察文档流是否过大                                                       |
| domReady  | DOM阶段渲染耗时                      | domContentLoadedEventEnd – fetchStart                 | DOM树和页面资源加载完成时间，会触发`domContentLoaded`事件                          |
| 首次渲染耗时    | 首次渲染耗时                         | responseEnd-fetchStart                                | 加载文档到看到第一帧非空图像的时间，也叫白屏时间                                         |
| 首次可交互时间   | 首次可交互时间                        | domInteractive-fetchStart                             | DOM树解析完成时间，此时document.readyState为interactive                     |
| 首包时间耗时    | 首包时间                           | responseStart-domainLookupStart                       | DNS解析到响应返回给浏览器第一个字节的时间                                           |
| 页面完全加载时间  | 页面完全加载时间                       | loadEventStart - fetchStart                           | -                                                                |
| onLoad    | onLoad事件耗时                     | loadEventEnd – loadEventStart

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/19ac271140f74522b13dabe05cb4a0c8~tplv-k3u1fbpfcp-watermark.image?)

#### 4.5.3 数据结构

```json
{
  "title": "前端监控系统",
  "url": "http://localhost:8080/",
  "timestamp": "1590828364183",
  "userAgent": "chrome",
  "kind": "experience",
  "type": "timing",
  "connectTime": "0",
  "ttfbTime": "1",
  "responseTime": "1",
  "parseDOMTime": "80",
  "domContentLoadedTime": "0",
  "timeToInteractive": "88",
  "loadTime": "89"
}
```

#### 4.5.4 实现

```js
import onload from "../util/onload";
import tracker from "../util/tracker";
import formatTime from "../util/formatTime";
import getLastEvent from "../util/getLastEvent";
import getSelector from "../util/getSelector";
export function timing() {
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
      } = performance.timing;
      tracker.send({
        kind: "experience",
        type: "timing",
        connectTime: connectEnd - connectStart, //TCP连接耗时
        ttfbTime: responseStart - requestStart, //ttfb
        responseTime: responseEnd - responseStart, //Response响应耗时
        parseDOMTime: loadEventStart - domLoading, //DOM解析渲染耗时
        domContentLoadedTime:
          domContentLoadedEventEnd - domContentLoadedEventStart, //DOMContentLoaded事件回调耗时
        timeToInteractive: domInteractive - fetchStart, //首次可交互时间
        loadTime: loadEventStart - fetchStart, //完整的加载时间
      });
    }, 3000);
  });
}

```

### 4.6 性能指标

-   [PerformanceObserver.observe](https://developer.mozilla.org/zh-CN/docs/Web/API/PerformanceObserver/observe)方法用于观察传入的参数中指定的性能条目类型的集合。当记录一个指定类型的性能条目时，性能监测对象的回调函数将会被调用
-   [entryType](https://developer.mozilla.org/zh-CN/docs/Web/API/PerformanceEntry/entryType)
-   [paint-timing](https://w3c.github.io/paint-timing/)
-   [event-timing](https://wicg.github.io/event-timing/)
-   [LCP](https://wicg.github.io/largest-contentful-paint/)
-   [FMP](https://docs.google.com/document/d/1BR94tJdZLsin5poeet0XoTW60M0SjvOJQttKT-JK8HI/view)
-   [time-to-interactive](https://github.com/WICG/time-to-interactive)

| 字段  | 描述                                 | 备注                                                                 | 计算方式 |
| --- | ---------------------------------- | ------------------------------------------------------------------ | ---- |
| FP  | First Paint(首次绘制)                  | 包括了任何用户自定义的背景绘制，它是首先将像素绘制到屏幕的时刻                                    |      |
| FCP | First Content Paint(首次内容绘制)        | 是浏览器将第一个 DOM 渲染到屏幕的时间,可能是文本、图像、SVG等,这其实就是白屏时间                      |      |
| FMP | First Meaningful Paint(首次有意义绘制)    | 页面有意义的内容渲染的时间                                                      |      |
| LCP | (Largest Contentful Paint)(最大内容渲染) | 代表在viewport中最大的页面元素加载的时间                                           |      |
| DCL | (DomContentLoaded)(DOM加载完成)        | 当 HTML 文档被完全加载和解析完成之后, DOMContentLoaded 事件被触发，无需等待样式表、图像和子框架的完成加载 |      |
| L   | (onLoad)                           | 当依赖的资源全部加载完毕之后才会触发                                                 |      |
| TTI | (Time to Interactive) 可交互时间        | 用于标记应用已进行视觉渲染并能可靠响应用户输入的时间点                                        |      |
| FID | First Input Delay(首次输入延迟)          | 用户首次和页面交互(单击链接，点击按钮等)到页面响应交互的时间


![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3421a08b415145a08d438dc457b57860~tplv-k3u1fbpfcp-watermark.image?)


![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b9a4cc37d8eb44be883fc40f2d0093e1~tplv-k3u1fbpfcp-watermark.image?)

#### 4.6.1 数据结构设计

##### 1. paint

```json
{
  "title": "前端监控系统",
  "url": "http://localhost:8080/",
  "timestamp": "1590828364186",
  "userAgent": "chrome",
  "kind": "experience",
  "type": "paint",
  "firstPaint": "102",
  "firstContentPaint": "2130",
  "firstMeaningfulPaint": "2130",
  "largestContentfulPaint": "2130"
}
```

##### 2. firstInputDelay

```json
{
  "title": "前端监控系统",
  "url": "http://localhost:8080/",
  "timestamp": "1590828477284",
  "userAgent": "chrome",
  "kind": "experience",
  "type": "firstInputDelay",
  "inputDelay": "3",
  "duration": "8",
  "startTime": "4812.344999983907",
  "selector": "HTML BODY #container .content H1"
}
```

#### 4.6.2 实现

关键时间节点通过window.performance.timing获取

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9369074ff2554710abad169c8ba772ba~tplv-k3u1fbpfcp-watermark.image?)

```js
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
```


#### 

### 4.7 卡顿

-   响应用户交互的响应时间如果大于100ms,用户就会感觉卡顿

#### 4.7.1 数据设计 longTask

```json
{
  "title": "前端监控系统",
  "url": "http://localhost:8080/",
  "timestamp": "1590828656781",
  "userAgent": "chrome",
  "kind": "experience",
  "type": "longTask",
  "eventType": "mouseover",
  "startTime": "9331",
  "duration": "200",
  "selector": "HTML BODY #container .content"
}
```

#### 4.7.2 实现

* new PerformanceObserver
* entry.duration > 100 判断大于100ms，即可认定为长任务
* 使用 requestIdleCallback上报数据

```js
import tracker from "../util/tracker";
import formatTime from "../util/formatTime";
import getLastEvent from "../util/getLastEvent";
import getSelector from "../util/getSelector";
export function longTask() {
  new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.duration > 100) {
        let lastEvent = getLastEvent();
        requestIdleCallback(() => {
          tracker.send({
            kind: "experience",
            type: "longTask",
            eventType: lastEvent.type,
            startTime: formatTime(entry.startTime), // 开始时间
            duration: formatTime(entry.duration), // 持续时间
            selector: lastEvent
              ? getSelector(lastEvent.path || lastEvent.target)
              : "",
          });
        });
      }
    });
  }).observe({ entryTypes: ["longtask"] });
}
```

### 4.8 PV、UV、用户停留时间

#### 4.8.1 数据设计 business

```json
{
  "title": "前端监控系统",
  "url": "http://localhost:8080/",
  "timestamp": "1590829304423",
  "userAgent": "chrome",
  "kind": "business",
  "type": "pv",
  "effectiveType": "4g",
  "rtt": "50",
  "screen": "2049x1152"
}
```

#### 4.8.2 PV、UV、用户停留时间

PV(page view) 是页面浏览量，UV(Unique visitor)用户访问量。PV 只要访问一次页面就算一次，UV 同一天内多次访问只算一次。

对于前端来说，只要每次进入页面上报一次 PV 就行，UV 的统计放在服务端来做，主要是分析上报的数据来统计得出 UV。

```js
import tracker from "../util/tracker";
export function pv() {
  tracker.send({
    kind: "business",
    type: "pv",
    startTime: performance.now(),
    pageURL: getPageURL(),
    referrer: document.referrer,
    uuid: getUUID(),
  });
  let startTime = Date.now();
  window.addEventListener(
    "beforeunload",
    () => {
      let stayTime = Date.now() - startTime;
      tracker.send({
        kind: "business",
        type: "stayTime",
        stayTime,
        pageURL: getPageURL(),
        uuid: getUUID(),
      });
    },
    false
  );
}
```

<hr/>

### <a id="qa">扩展问题</a>

1. 性能监控指标
1. 前端怎么做性能监控
1. 线上错误监控怎么做
1. 导致内存泄漏的方法，怎么监控内存泄漏
1. Node 怎么做性能监控

#### 1. 性能监控指标

| 指标 | 名称 | 解释 |
| --------- | ----- | ----- |
| FP | First-Paint 首次渲染 |表示浏览器从开始请求网站到屏幕渲染第一个像素点的时间|
| FCP | First-Contentful-Paint 首次内容渲染| 表示浏览器渲染出第一个内容的时间，这个内容可以是文本、图片或SVG元素等等，不包括iframe和白色背景的canvas元素|
| SI | Speed Index 速度指数| 表明了网页内容的可见填充速度|
| LCP | Largest Contentful Paint 最大内容绘制 | 标记了渲染出最大文本或图片的时间|
| TTI | Time to Interactive 可交互时间 | 页面从开始加载到主要子资源完成渲染，并能够快速、可靠的响应用户输入所需的时间|
| TBT | Total Blocking Time 总阻塞时间 | 测量 FCP 与 TTI 之间的总时间，这期间，主线程被阻塞的时间过长，无法作出输入响应|
| FID | First Input Delay 首次输入延迟 | 测量加载响应度的一个以用户为中心的重要指标|
| CLS | Cumulative Layout Shift 累积布局偏移 | 测量的是整个页面生命周期内发生的所有意外布局偏移中最大一连串的布局偏移分数|
| DCL | DOMContentLoaded | 当初始的 HTML 文档被完全加载和解析完成之后，DOMContentLoaded 事件被触发，而无需等待样式表、图像和子框架的完成加载|
| L | Load | 检测一个完全加载的页面，页面的html、css、js、图片等资源都已经加载完之后才会触发 load 事件|


#### 2. 前端怎么做性能监控

* FP、FCP、LCP、CLS、FID、FMP 可通过 PerformanceObserver获取
* TCP连接耗时、首字节到达时间、response响应耗时、DOM解析渲染的时间、TTI、DCL、L等可通过performance.timing获取
* 长任务监听，PerformanceObserver 监听 longTask

```js
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
const obj = {
    kind: "experience", // 用户体验指标
    type: "timing", // 统计每个阶段的时间
    dnsTime: domainLookupEnd - domainLookupStart, // DNS查询时间
    connectTime: connectEnd - connectStart, // TCP连接耗时
    ttfbTime: responseStart - requestStart, // 首字节到达时间
    responseTime: responseEnd - responseStart, // response响应耗时
    parseDOMTime: loadEventStart - domLoading, // DOM解析渲染的时间
    domContentLoadedTime:
      domContentLoadedEventEnd - domContentLoadedEventStart, // DOMContentLoaded事件回调耗时
    timeToInteractive: domInteractive - fetchStart, // 首次可交互时间
    loadTime: loadEventStart - fetchStart, // 完整的加载时间
}
```

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b004ba190b0c49a99959539bc7e79a8c~tplv-k3u1fbpfcp-watermark.image?)

#### 3. 线上错误监控怎么做

* 资源加载错误 window.addEventListener('error') 判断e.target.src || href
* js运行时错误 window.addEventListener('error')
* promise异常 window.addEventListener('unhandledrejection')
* 接口异常 重写xhr 的 open send方法，监控 load、error、abort，进行上报

#### 4. 导致内存泄漏的方法，怎么监控内存泄漏

* 全局变量
* 被遗忘的定时器
* 脱离Dom的引用
* 闭包

监控内存泄漏

* window.performance.memory
* 开发阶段
  * 浏览器的 Performance
  * 移动端可使用 PerformanceDog
  
![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/090ce23e973e4a29820d2f1027736dc9~tplv-k3u1fbpfcp-watermark.image?)

#### 5. Node 怎么做性能监控

1. **日志监控** 可以通过监控异常日志的变动，将新增的异常类型和数量反映出来 监控日志可以实现pv和uv的监控，通过pv/uv的监控，可以知道使用者们的使用习惯，预知访问高峰
2. **响应时间** 响应时间也是一个需要监控的点。一旦系统的某个子系统出现异常或者性能瓶颈将会导致系统的响应时间变长。响应时间可以在nginx一类的反向代理上监控，也可以通过应用自己产生访问日志来监控
3. **进程监控** 监控日志和响应时间都能较好地监控到系统的状态，但是它们的前提是系统是运行状态的，所以监控进程是比前两者更为紧要的任务。监控进程一般是检查操作系统中运行的应用进程数，比如对于采用多进程架构的web应用，就需要检查工作进程的数，如果低于低估值，就应当发出警报
4. **磁盘监控** 磁盘监控主要是监控磁盘的用量。由于写日志频繁的缘故，磁盘空间渐渐被用光。一旦磁盘不够用将会引发系统的各种问题，给磁盘的使用量设置一个上限，一旦磁盘用量超过警戒值，服务器的管理者应该整理日志或者清理磁盘
5. **内存监控** 对于node而言，一旦出现内存泄漏，不是那么容易排查的。监控服务器的内存使用情况。如果内存只升不降，那么铁定存在内存泄漏问题。符合正常的内存使用应该是有升有降，在访问量大的时候上升，在访问量回落的时候，占用量也随之回落。监控内存异常时间也是防止系统出现异常的好方法。如果突然出现内存异常，也能够追踪到近期的哪些代码改动导致的问题
6. **cpu占用监控** 服务器的cpu占用监控也是必不可少的项，cpu的使用分为用户态、内核态、IOWait等。如果用户态cpu使用率较高，说明服务器上的应用需要大量的cpu开销；如果内核态cpu使用率较高，说明服务器需要花费大量时间进行进程调度或者系统调用；IOWait使用率反映的是cpu等待磁盘I/O操作；cpu的使用率中，用户态小于70%，内核态小于35%且整体小于70%，处于正常范围。监控cpu占用情况，可以帮助分析应用程序在实际业务中的状况。合理设置监控阈值能够很好地预警
7. **cpu load监控** cpu load又称cpu平均负载。它用来描述操作系统当前的繁忙程度，又简单地理解为cpu在单位时间内正在使用和等待使用cpu的平均任务数。它有3个指标，即1分钟的平均负载、5分钟的平均负载，15分钟的平均负载。cpu load过高说明进程数量过多，这在node中可能体现在用于进程模块反复启动新的进程。监控该值可以防止意外发生
8. **I/O负载** I/O负载指的主要是磁盘I/O。反应的是磁盘上的读写情况，对于node编写的应用，主要是面向网络业务，是不太可能出现I/O负载过高的情况，大多数的I/O压力来自于数据库。不管node进程是否与数据库或其他I/O密集的应用共同处理相同的服务器，我们都应该监控该值防止意外情况
9. **网络监控** 虽然网络流量监控的优先级没有上述项目那么高，但还是需要对流量进行监控并设置流量上限值。即便应用突然受到用户的青睐，流量暴涨的时候也可以通过数值感知到网站的宣传是否有效。一旦流量超过警戒值，开发者就应当找出流量增长的原因。对于正常增长，应当评估是否该增加硬件设备来为更多用户提供服务。网络流量监控的两个主要指标是流入流量和流出流量
    * 应用状态监控 除了这些硬性需要检测的指标之外，应用还应该提供一种机制来反馈其自身的状态信息，外部监控将会持续性地调用应用地反馈接口来检查它地健康状态。
    * dns监控 dns是网络应用的基础，在实际的对外服务产品中，多数都对域名有依赖。dns故障导致产品出现大面积影响的事件并不少见。由于dns服务通常是稳定的，容易让人忽略，但是一旦出现故障，就可能是史无前例的故障。对于产品的稳定性，域名dns状态也需要加入监控。

