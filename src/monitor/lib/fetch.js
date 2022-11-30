import tracker from "../utils/tracker";

export function injectFetch () {
    let oldFetch = window.fetch;

    function hijackFetch (url, options) {
        let startTime = Date.now();
        return new Promise((resolve, reject) => {
            oldFetch.apply(this, [url, options]).then(async response => {
                // response 为流数据
                const oldResponseJson = response.__proto__.json;
                response.__proto__.json = function(...responseRest) {
                    return new Promise((responseResolve, responseReject) => {
                        oldResponseJson.apply(this, responseRest).then(result => {
                            responseResolve(result);
                        }, (responseRejection) => {
                            // 接口
                            sendLogData({
                                url,
                                startTime,
                                statusText: response.statusText,
                                status: response.status,
                                eventType: 'error',
                                response: responseRejection.stack,
                                options
                            })
                            responseReject(responseRejection)
                        })
                    })
                }
                resolve(response)
            }, rejection => {
                // 连接未连接上
                sendLogData({
                    url,
                    startTime,
                    eventType: 'load',
                    response: rejection.stack,
                    options
                })
                reject(rejection)
            })
        })
    }
    window.fetch = hijackFetch;
}

const sendLogData = ({
    startTime,
    statusText = '',
    status = '',
    eventType,
    url,
    options,
    response,
}) => {
    // 持续时间
    let duration = Date.now() - startTime;
    const { method = 'get', body } = options || {}
    tracker.send({
        kind: "stability",
        type: "fetch",
        eventType: eventType,
        pathname: url,
        status: status + "-" + statusText, // 状态码
        duration,
        response: response ? JSON.stringify(response) : "", // 响应体
        method,
        params: body || "", // 入参
    });
}