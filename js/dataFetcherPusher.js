chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // console.log(sender.tab ? 'from a content script:' + sender.tab.url : 'from the extension');
    if (sender.tab) {
        if (request.action == 'callFunction') {
            let functionToCall = request.function;
            let parameters = request.parameters;
            if (request.bDontWaitForResponse) {
                window[functionToCall].apply(null, parameters);
            } else {
                window[functionToCall]
                    .apply(null, parameters)
                    .then(result => sendResponse(result, false), error => sendResponse(error, true))
                    .catch(error => sendResponse(error, true));
            }
            return true;
        }
    }
});

const dbApiEndPts = {
    QA: 'https://api.cultofpassion.com',
    NET: 'https://api2.saleshandy.com',
    COM: 'https://api.saleshandy.com',
    LEARNER: 'https://api.lifeisgoodforlearner.com',
    DOER: 'https://api.lifeisgoodfordoer.com',
    RISE_BY_LEARNING: 'https://api.risebylearning.com',
    RISE_BY_HELPING: 'https://api.risebyhelping.com',
    RISE_BY_HUSTLING: 'https://api.risebyhustling.com'
};
/*Helper Code Section */
apiEndpoint = dbApiEndPts[ENVIRONMENT];
AbortControllers = {};

function getBasicHeaders() {
    return {
        'content-type': 'application/json;charset=UTF-8',
        'x-sh-source': 'CHROME_PLUGIN',
        accept: 'application/json'
    };
}

function getOptions(basicHeaders) {
    return {
        method: 'GET',
        headers: new Headers(basicHeaders),
        credentials: 'include'
    };
}

function getData(url, data) {
    url = apiEndpoint + url;
    let basicHeaders = getBasicHeaders();
    if (data) basicHeaders['x-authorization-token'] = data.auth_token;
    let options = getOptions(basicHeaders);

    return fetch(url, options).then(res => {
        return res.json();
    });
}

function postData(url, data) {
    url = apiEndpoint + url;
    let basicHeaders = getBasicHeaders();
    basicHeaders['x-authorization-token'] = data.auth_token;

    return fetch(url, {
        method: 'post',
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify(data.opts),
        headers: new Headers(basicHeaders)
    })
        .then(res => {
            return res.json();
        })
        .catch(error => {
            return {
                error: true,
                error_message: error,
                fetchFailed: true,
                error_code: '524'
            };
        });
}

function postDataAbortable(url, data, abortControllerName) {
    url = apiEndpoint + url;
    let basicHeaders = getBasicHeaders();
    basicHeaders['x-authorization-token'] = data.auth_token;

    let abortSignal;
    let currentAbortController = AbortControllers[abortControllerName];
    if (currentAbortController !== undefined) {
        // Cancel the previous request
        currentAbortController.abort();
    }
    // Feature detect
    if ('AbortController' in window) {
        currentAbortController = new AbortController();
        AbortControllers[abortControllerName] = currentAbortController;
        abortSignal = currentAbortController.signal;
    }

    return fetch(url, {
        method: 'post',
        mode: 'cors',
        credentials: 'include',
        body: JSON.stringify(data.opts),
        headers: new Headers(basicHeaders),
        signal: abortSignal
    })
        .then(res => {
            return res.json();
        })
        .catch(error => {
            return {
                error: true,
                error_message: error,
                fetchFailed: true,
                error_code: '524'
            };
        });
}

function abortPostData(abortControllerName) {
    let currentAbortController = AbortControllers[abortControllerName];
    if (currentAbortController !== undefined) {
        // Cancel the previous request
        currentAbortController.abort();
    }
}

function getDataAbortable(url, data, abortControllerName) {
    url = apiEndpoint + url;
    let basicHeaders = getBasicHeaders();
    basicHeaders['x-authorization-token'] = data.auth_token;

    let abortSignal;
    let currentAbortController = AbortControllers[abortControllerName];
    if (currentAbortController !== undefined) {
        // Cancel the previous request
        currentAbortController.abort();
    }
    // Feature detect
    if ('AbortController' in window) {
        currentAbortController = new AbortController();
        AbortControllers[abortControllerName] = currentAbortController;
        abortSignal = currentAbortController.signal;
    }
    return fetch(url, {
        method: 'get',
        mode: 'cors',
        credentials: 'include',
        body: JSON.stringify(data.opts),
        headers: new Headers(basicHeaders),
        signal: abortSignal
    })
        .then(res => {
            return res.json();
        })
        .catch(error => {
            return {
                error: true,
                error_message: error,
                fetchFailed: true,
                error_code: '524'
            };
        });
}

function abortGetData(abortControllerName) {
    let currentAbortController = AbortControllers[abortControllerName];
    if (currentAbortController !== undefined) {
        // Cancel the previous request
        currentAbortController.abort();
    }
}

function deleteData(url, data) {
    url = apiEndpoint + url;
    let basicHeaders = getBasicHeaders();
    basicHeaders['x-authorization-token'] = data.auth_token;

    return fetch(url, {
        method: 'delete',
        credentials: 'include',
        mode: 'cors',
        headers: new Headers(basicHeaders)
    }).then(function(res) {
        return res.json();
    });
}
