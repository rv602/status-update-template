let recentlySentEmails = {};
let ThreadStore = {
    threadDataFromDOM: {},
    createAndSaveThreadInfoObject: function(oThreadRow) {
        let threadInnerHTML = oThreadRow.innerHTML,
            threadInfo = {
                threadRow: oThreadRow
            },
            result,
            keyValueExtractorRegEx = /(\S+)="(.*?)"/g,
            threadInfoText = threadInnerHTML.match(
                /(?:data-thread-id|data-legacy-thread-id|data-legacy-last-message-id|data-legacy-last-non-draft-message-id)([\s='"./]+)([\w-./?=&\\#"]+)((['#\\&?=/".\w\d]+|[\w)('-.:"\s]+)['"]|)/gi
            ),
            allEmailIDs = oThreadRow.querySelectorAll(GMAIL_NodeSelectors.ThreadViewSenderDetails),
            lastNonDraftEmailSender = allEmailIDs[allEmailIDs.length - 1],
            lastNonDraftEmailSenderEmail =
                lastNonDraftEmailSender && lastNonDraftEmailSender.getAttribute('email')
                    ? lastNonDraftEmailSender.getAttribute('email')
                    : '',
            tickNode = document.createElement('div');

        if (threadInfoText === null) {
            return;
        }
        threadInfoText = threadInfoText.join(' ');
        tickNode.innerHTML = `<span class='ReadReceiptIcon ${
            lastNonDraftEmailSenderEmail === currentUserEmail || currentRouteID === NativeListRouteIDs.SENT ? 'ListViewIconHover' : ''
        } ReadReceiptListView'></span>`;
        tickNode.classList.add('RRIconContainer', 'xY', 'ListViewRRIcon');
        if (oThreadRow.querySelectorAll('.ReadReceiptIcon').length === 0) {
            // oThreadRow.insertBefore(tickNode, oThreadRow.childNodes[4]);
            const childNodes = Array.from(oThreadRow.childNodes);
            let index = ReadReceiptUtils.getSenderNameNodeIndex(childNodes);
            if (index === -1) {
                index = 3;
            }
            oThreadRow.insertBefore(tickNode, childNodes[index]);
        }
        if (lastNonDraftEmailSenderEmail === currentUserEmail || currentRouteID === NativeListRouteIDs.SENT) {
            while ((result = keyValueExtractorRegEx.exec(threadInfoText))) {
                let key = result[1],
                    value = result[2];
                switch (key) {
                    case 'data-thread-id':
                        threadInfo['threadId'] = value;
                        break;
                    case 'data-legacy-thread-id':
                        threadInfo['threadIdLegacy'] = value;
                        break;
                    case 'data-legacy-last-message-id':
                        threadInfo['LastMessageIdLegacy'] = value;
                        break;
                    case 'data-legacy-last-non-draft-message-id':
                        threadInfo['LastNonDraftMessageIdLegacy'] = value;
                        break;
                }
            }

            if (!threadInfo['threadIdLegacy']) {
                threadInfoText = threadInnerHTML.match(
                    /(?:data-legacy-thread-id)([\s='"./]+)([\w-./?=&\\#"]+)((['#\\&?=/".\w\d]+|[\w)('-.:"\s]+)['"]|)/gi
                );
                if (threadInfoText && threadInfoText.length > 0) {
                    threadInfoText = threadInfoText.join(' ');
                    result = keyValueExtractorRegEx.exec(threadInfoText);
                    if (result) {
                        threadInfo['threadIdLegacy'] = result[2];
                    }
                }
            }

            let lastNonDraftMsgID = threadInfo['LastNonDraftMessageIdLegacy'];
            ReadReceiptUtils.recentThreadWithMessageID.push({
                message_id: threadInfo['LastNonDraftMessageIdLegacy'],
                thread_id: threadInfo['threadIdLegacy'],
                draft_id: threadInfo['LastMessageIdLegacy']
            });
            if (lastNonDraftMsgID == undefined && recentlySentEmails[threadInfo.threadIdLegacy]) {
                let ReadReceiptIcon = threadInfo.threadRow.querySelector('.ReadReceiptIcon');
                if (ReadReceiptIcon) {
                    ReadReceiptIcon.classList.add(EMAIL_READ_STATUS_ICON_CLASSES._PAINTED, EMAIL_READ_STATUS_ICON_CLASSES._SENT_UNREAD);
                }
            }
            ThreadStore.threadDataFromDOM[lastNonDraftMsgID] = threadInfo;
        }
    }
};

let MessageStore = {
    MessageDataFromDOM: {}
};
