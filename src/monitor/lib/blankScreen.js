import tracker from "../utils/tracker";
import onload from "../utils/onload";

export function blankScreen() {
  // 控制密集度，如只有10密度，则无法检测到
  let NUM = 20;
  // 白屏过滤名单
  let wrapperElements = ["html", "body", "#container"];
  let emptyPoints = 0;
  function getSelector(element) {
    const { id, className, nodeName } = element;
    if (id) {
      return "#" + id;
    } else if (className) {
      // 过滤空白符 + 拼接
      return (
        "." +
        className
          .split(" ")
          .filter((item) => !!item)
          .join(".")
      );
    } else {
      return nodeName.toLowerCase();
    }
  }
  function isWrapper(element) {
    if (!element) {
      emptyPoints++;
      return;
    }
    let selector = getSelector(element);

    if (wrapperElements.indexOf(selector) !== -1) {
      emptyPoints++;
    }
  }
  // 刚开始页面内容为空，等页面渲染完成，再去做判断
  onload(function () {
    let xElements, yElements, xyDownElements, xyUpElements;
    const portion = NUM + 1
    const xPortion = window.innerWidth / portion;
    const yPortion = window.innerHeight / portion;
    for (let i = 0; i < NUM; i++) {
      xElements = document.elementFromPoint(
        xPortion * i,
        window.innerHeight / 2
      );
      yElements = document.elementFromPoint(
        window.innerWidth / 2,
        yPortion * i
      );
      xyDownElements = document.elementFromPoint(
        xPortion * i,
        yPortion * i
      );
      xyUpElements = document.elementFromPoint(
        xPortion * i,
        yPortion * (NUM - i)
      );

      isWrapper(xElements);
      isWrapper(yElements);
      isWrapper(xyDownElements);
      isWrapper(xyUpElements);
    }

    // 白屏
    if (emptyPoints == 4 * NUM) {
      const centerElements = document.elementsFromPoint(
        window.innerWidth / 2,
        window.innerHeight / 2
      );
      console.log("emptyPoints++++++++++++++", getSelector(centerElements[0]));
      tracker.send({
        kind: "stability",
        type: "blank",
        emptyPoints: emptyPoints + "",
        screen: window.screen.width + "X" + window.screen.height,
        viewPoint: window.innerWidth + "X" + window.innerHeight,
        selector: getSelector(centerElements[0]),
      });
    }
  });
}
