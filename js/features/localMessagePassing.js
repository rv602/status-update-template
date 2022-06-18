chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log(sender.tab ? 'from a content script:' + sender.tab.url : 'from the extension');
    if (!sender.tab) {
        if (request.action == 'createReadReceiptLabels') {
            if (ReadReceiptUtils !== undefined && ReadReceiptUtils.ReadReceiptLabelsCreated !== true) {
                ReadReceiptUtils.createReadReceiptsLabels()
                    .then(result => sendResponse(result), error => sendResponse(error))
                    .catch(error => sendResponse(error));
            }
        } else if (request.action == 'updateReadReceipts') {
            DOMHandler.updateReadReceiptStatus(request.messageObject && request.messageObject.message_id);
        }
    }
});

function sendMessageToBackgroundPromise(oRequestBody) {
    return new Promise((resolve, reject) => {
        if (!chrome.runtime.lastError) {
            chrome.runtime.sendMessage(oRequestBody, function(response, isRejected) {
                if (isRejected) {
                    reject(response);
                }
                if (!response.error) {
                    resolve(response);
                } else {
                    // As our existing code always looks for success, we can not reject this Promise
                    // reject(response);
                    resolve(response);
                }
            });
        }
    });
}
