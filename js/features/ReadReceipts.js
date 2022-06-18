let message_Ids = [];
let currentRouteID;
/**
 * @description:
 * Sets up Dom Mutation observers which does below functions
 *      - Creates placeholder spaces for the read-receipt icons
 *      - Gets message-ids for each thread and send them to  API to get read information
 *      - Prevents Gmail to remove our placeholder spaces on refresh
 * @param {*} sdk Instance of InboxSDK
 */
function registerThreadRowViewHandlerSH(sdk) {
    // Execute setUpMutationObserverForListView whereve the when our extension gets loaded
    let observers = DOMHandler.setUpMutationObserverForListView();
    // Handle changes of UI on all route change
    sdk.Router.handleAllRoutes(function(routeView) {
        // Hide read-receipt labels for all routes
        ReadReceiptUtils.hideReadReceiptLabels();
        currentRouteID = routeView.getRouteID();
        // Disconnet the previos route's mutation obsreveres and to prevent overload on browser
        observers.UIobserver.disconnect();
        observers.RowsObserverer.disconnect();
        // Create observes using current route
        observers = DOMHandler.setUpMutationObserverForListView();
    });

    // Whenever a thread-view is opened, get all message-ids and get read data for all messages in thread
    sdk.Conversations.registerThreadViewHandler(function() {
        DOMHandler.addReadReceiptsPlaceHoldersInThreadView();
    });
    // Wheneve a message-view is opened, bind a function that gets the details for a message when it gets expanded
    sdk.Conversations.registerMessageViewHandlerAll(function(MessageView) {
        MessageView.on('viewStateChange', () => {
            DOMHandler.addReadReceiptsPlaceHoldersInThreadView();
        });
    });
}

let ReadReceiptDataStore = {
    data: {},
    saveReadReceiptData: function(newData) {
        Object.keys(newData).forEach(sMessageID => {
            ReadReceiptDataStore.data[sMessageID] = newData[sMessageID];
        });
    },
    filterRequestedData: function(oRequestedData) {
        let oFilteredData = [];
        oRequestedData.forEach(oPayLoad => {
            if (
                oPayLoad.message_id &&
                (ReadReceiptDataStore.data[oPayLoad.message_id] === undefined ||
                    (ReadReceiptDataStore.data[oPayLoad.message_id] &&
                        ReadReceiptDataStore.data[oPayLoad.message_id].id === undefined &&
                        ReadReceiptDataStore.data[oPayLoad.message_id].status !== 0) ||
                    ReadReceiptDataStore.data[oPayLoad.message_id].status === 1)
            ) {
                oFilteredData.push(oPayLoad);
            }
        });
        return oFilteredData;
    },
    paintWithKnownData: function(oRequestedData, sRenderedView) {
        let oKnownData = {};
        oRequestedData.forEach(oPayLoad => {
            if (ReadReceiptDataStore.data[oPayLoad.message_id] !== undefined && ReadReceiptDataStore.data[oPayLoad.message_id] !== 1) {
                oKnownData[oPayLoad.message_id] = ReadReceiptDataStore.data[oPayLoad.message_id];
            }
        });
        DOMHandler.paintDOM(oKnownData, sRenderedView);
    }
};

let DataFetcher = {
    fetchAndBindReadReceiptsData: function(recentThreadWithMessageIDs, sRenderedView) {
        ReadReceiptDataStore.paintWithKnownData(recentThreadWithMessageIDs, sRenderedView);
        recentThreadWithMessageIDs = ReadReceiptDataStore.filterRequestedData(recentThreadWithMessageIDs);
        if (recentThreadWithMessageIDs.length === 0) {
            return;
        }
        let userInfoObj = getUserInfoFromLocal();
        if (currentUserEmail && userInfoObj && userInfoObj.isPluginActivated && userInfoObj.auth_token) {
            let auth_token = userInfoObj.auth_token;
            let data = {
                auth_token: auth_token,
                opts: {
                    ids: recentThreadWithMessageIDs
                }
            };
            let getReadReceiptsDataURL = '/email-track/get-email-status';
            let oRequestBody = {
                action: 'callFunction',
                function: 'postData',
                parameters: [getReadReceiptsDataURL, data]
            };
            sendMessageToBackgroundPromise(oRequestBody).then(res => {
                if (!res.error && auth_token) {
                    ReadReceiptDataStore.saveReadReceiptData(res);
                    DOMHandler.paintDOM(res, sRenderedView);
                } else {
                    console.log(res);
                }
            });
        }
    },
    fetchAndBindReadInformationTimeOut: '',
    fetchAndBindReadInformationOnTimeOut: function(event) {
        let ReadReceiptIcon = event.target;
        let internalID = ReadReceiptIcon.getAttribute('data-internal-id');
        if (ReadReceiptIcon.classList.contains('ReadReceiptIcon')) {
            DataFetcher.fetchAndBindReadInformationTimeOut = setTimeout(() => {
                DOMHandler.ReadDetailsFlyout.hideAll();
                DataFetcher.fetchAndBindDetailedReadData(internalID, event);
            }, 300);
        }
    },
    fetchAndBindDetailedReadData: function(internalID, event) {
        if (!internalID) {
            return;
        }
        let abortControllerName = 'fetchDetailedReadData';
        let userInfoObj = getUserInfoFromLocal();
        if (currentUserEmail && userInfoObj && userInfoObj.isPluginActivated && userInfoObj.auth_token) {
            let auth_token = userInfoObj.auth_token;
            let data = {
                auth_token: auth_token,
                opts: {
                    id: internalID
                }
            };
            let getReadReceiptsDataURL = '/email-track/get-email-activity';
            let oRequestBody = {
                action: 'callFunction',
                function: 'postDataAbortable',
                parameters: [getReadReceiptsDataURL, data, abortControllerName]
            };
            sendMessageToBackgroundPromise(oRequestBody).then(res => {
                if (!res.error && auth_token) {
                    DOMHandler.ReadDetailsFlyout.show(res, event);
                } else {
                    console.log(res);
                }
            });
        }
    },
    abortFetchDetailedReadInformation: function(event) {
        if (DataFetcher.fetchAndBindReadInformationTimeOut) {
            window.clearTimeout(DataFetcher.fetchAndBindReadInformationTimeOut);
        }
        DOMHandler.ReadDetailsFlyout.hide(event);
        let abortControllerName = 'fetchDetailedReadData';
        let oRequestBody = {
            action: 'callFunction',
            function: 'abortPostData',
            bDontWaitForResponse: true,
            parameters: [abortControllerName]
        };
        sendMessageToBackgroundPromise(oRequestBody);
    }
};

let DOMHandler = {
    paintDOM: function(ReadReceiptData, sRenderedView) {
        if (sRenderedView === 'ThreadView') {
            Object.keys(ReadReceiptData).forEach(messageId => {
                let readStatusObject = ReadReceiptData[messageId];
                let MessageNodes = MessageStore.MessageDataFromDOM[messageId];
                MessageStore.MessageDataFromDOM[messageId]
                    ? (MessageStore.MessageDataFromDOM[messageId].LastPaintTimeStamp = moment().format('YYYY/MM/DD HH:mm:ss'))
                    : true;
                ['collapsedEmailNode', 'expandedEmailNode'].forEach(key => {
                    oMessageNode = MessageNodes && MessageNodes[key];
                    if (readStatusObject) {
                        if (oMessageNode) {
                            let ReadReceiptIcon = oMessageNode.querySelector('.ReadReceiptIcon');
                            if (ReadReceiptIcon) {
                                if (readStatusObject.id) {
                                    ReadReceiptIcon.setAttribute('data-internal-id', readStatusObject.id);
                                    ReadReceiptIcon.setAttribute('data-message-id-sh', messageId);
                                }
                                if (readStatusObject.status == EMAIL_READ_STATUS._NOT_TRACKED || readStatusObject.is_own_info === false) {
                                    ReadReceiptIcon.classList.remove(
                                        EMAIL_READ_STATUS_ICON_CLASSES._SENT_UNREAD,
                                        EMAIL_READ_STATUS_ICON_CLASSES._READ,
                                        EMAIL_READ_STATUS_ICON_CLASSES._NOT_DELIVERED
                                    );
                                    ReadReceiptIcon.classList.add(
                                        EMAIL_READ_STATUS_ICON_CLASSES._PAINTED,
                                        EMAIL_READ_STATUS_ICON_CLASSES._NOT_TRACKED
                                    );
                                    ReadReceiptIcon.removeEventListener('mouseover', DOMHandler.ReadDetailsFlyout.show);
                                    ReadReceiptIcon.addEventListener('mouseover', DOMHandler.ReadDetailsFlyout.show);
                                    ReadReceiptIcon.removeEventListener('click', DOMHandler.PreventRRIconClick, true);
                                    ReadReceiptIcon.addEventListener('click', DOMHandler.PreventRRIconClick, true);
                                    ReadReceiptIcon.removeEventListener('mouseleave', DataFetcher.abortFetchDetailedReadInformation);
                                    ReadReceiptIcon.addEventListener('mouseleave', DataFetcher.abortFetchDetailedReadInformation);
                                } else if (readStatusObject.status == EMAIL_READ_STATUS._SENT_UNREAD) {
                                    ReadReceiptIcon.classList.remove(
                                        EMAIL_READ_STATUS_ICON_CLASSES._NOT_TRACKED,
                                        EMAIL_READ_STATUS_ICON_CLASSES._READ,
                                        EMAIL_READ_STATUS_ICON_CLASSES._NOT_DELIVERED
                                    );
                                    ReadReceiptIcon.classList.add(
                                        EMAIL_READ_STATUS_ICON_CLASSES._PAINTED,
                                        EMAIL_READ_STATUS_ICON_CLASSES._SENT_UNREAD
                                    );
                                    ReadReceiptIcon.removeEventListener('mouseover', DataFetcher.fetchAndBindReadInformationOnTimeOut);
                                    ReadReceiptIcon.addEventListener('mouseover', DataFetcher.fetchAndBindReadInformationOnTimeOut);
                                    ReadReceiptIcon.removeEventListener('click', DOMHandler.PreventRRIconClick, true);
                                    ReadReceiptIcon.addEventListener('click', DOMHandler.PreventRRIconClick, true);
                                    ReadReceiptIcon.removeEventListener('mouseleave', DataFetcher.abortFetchDetailedReadInformation);
                                    ReadReceiptIcon.addEventListener('mouseleave', DataFetcher.abortFetchDetailedReadInformation);
                                } else if (readStatusObject.status == EMAIL_READ_STATUS._READ) {
                                    ReadReceiptIcon.classList.remove(
                                        EMAIL_READ_STATUS_ICON_CLASSES._SENT_UNREAD,
                                        EMAIL_READ_STATUS_ICON_CLASSES._NOT_TRACKED,
                                        EMAIL_READ_STATUS_ICON_CLASSES._NOT_DELIVERED
                                    );
                                    ReadReceiptIcon.classList.add(
                                        EMAIL_READ_STATUS_ICON_CLASSES._PAINTED,
                                        EMAIL_READ_STATUS_ICON_CLASSES._READ
                                    );
                                    ReadReceiptIcon.removeEventListener('mouseover', DataFetcher.fetchAndBindReadInformationOnTimeOut);
                                    ReadReceiptIcon.addEventListener('mouseover', DataFetcher.fetchAndBindReadInformationOnTimeOut);
                                    ReadReceiptIcon.removeEventListener('click', DOMHandler.PreventRRIconClick, true);
                                    ReadReceiptIcon.addEventListener('click', DOMHandler.PreventRRIconClick, true);
                                    ReadReceiptIcon.removeEventListener('mouseleave', DataFetcher.abortFetchDetailedReadInformation);
                                    ReadReceiptIcon.addEventListener('mouseleave', DataFetcher.abortFetchDetailedReadInformation);
                                } else if (readStatusObject.status == EMAIL_READ_STATUS._NOT_DELIVERED) {
                                    ReadReceiptIcon.classList.remove(
                                        EMAIL_READ_STATUS_ICON_CLASSES._NOT_TRACKED,
                                        EMAIL_READ_STATUS_ICON_CLASSES._SENT_UNREAD,
                                        EMAIL_READ_STATUS_ICON_CLASSES._READ
                                    );
                                    ReadReceiptIcon.classList.add(
                                        EMAIL_READ_STATUS_ICON_CLASSES._PAINTED,
                                        EMAIL_READ_STATUS_ICON_CLASSES._NOT_DELIVERED
                                    );
                                    ReadReceiptIcon.removeEventListener('mouseover', DOMHandler.ReadDetailsFlyout.show);
                                    ReadReceiptIcon.addEventListener('mouseover', DOMHandler.ReadDetailsFlyout.show);
                                    ReadReceiptIcon.removeEventListener('click', DOMHandler.PreventRRIconClick, true);
                                    ReadReceiptIcon.addEventListener('click', DOMHandler.PreventRRIconClick, true);
                                    ReadReceiptIcon.removeEventListener('mouseleave', DataFetcher.abortFetchDetailedReadInformation);
                                    ReadReceiptIcon.addEventListener('mouseleave', DataFetcher.abortFetchDetailedReadInformation);
                                }
                            }
                        }
                    }
                });
            });
        } else {
            Object.keys(ReadReceiptData).forEach(messageId => {
                let readStatusObject = ReadReceiptData[messageId];
                let ThreadObject = ThreadStore.threadDataFromDOM[messageId];
                ThreadStore && ThreadStore.threadDataFromDOM[messageId]
                    ? (ThreadStore.threadDataFromDOM[messageId].LastPaintTimeStamp = moment().format('YYYY/MM/DD HH:mm:ss'))
                    : true;
                if (readStatusObject) {
                    if (ThreadObject && ThreadObject.threadRow) {
                        let threadRow = ThreadObject.threadRow;
                        let ReadReceiptIcon = threadRow.querySelector('.ReadReceiptIcon');
                        if (ReadReceiptIcon) {
                            if (readStatusObject.id) {
                                ReadReceiptIcon.setAttribute('data-internal-id', readStatusObject.id);
                                ReadReceiptIcon.setAttribute('data-message-id-sh', messageId);
                            }
                            if (readStatusObject.status == EMAIL_READ_STATUS._NOT_TRACKED) {
                                ReadReceiptIcon.classList.remove(
                                    EMAIL_READ_STATUS_ICON_CLASSES._SENT_UNREAD,
                                    EMAIL_READ_STATUS_ICON_CLASSES._READ,
                                    EMAIL_READ_STATUS_ICON_CLASSES._NOT_DELIVERED
                                );
                                ReadReceiptIcon.classList.add(
                                    EMAIL_READ_STATUS_ICON_CLASSES._PAINTED,
                                    EMAIL_READ_STATUS_ICON_CLASSES._NOT_TRACKED
                                );
                                ReadReceiptIcon.removeEventListener('mouseover', DOMHandler.ReadDetailsFlyout.show);
                                ReadReceiptIcon.addEventListener('mouseover', DOMHandler.ReadDetailsFlyout.show);
                                ReadReceiptIcon.removeEventListener('click', DOMHandler.PreventRRIconClick, true);
                                ReadReceiptIcon.addEventListener('click', DOMHandler.PreventRRIconClick, true);
                                ReadReceiptIcon.removeEventListener('mouseleave', DataFetcher.abortFetchDetailedReadInformation);
                                ReadReceiptIcon.addEventListener('mouseleave', DataFetcher.abortFetchDetailedReadInformation);
                            } else if (readStatusObject.status == EMAIL_READ_STATUS._SENT_UNREAD) {
                                ReadReceiptIcon.classList.remove(
                                    EMAIL_READ_STATUS_ICON_CLASSES._READ,
                                    EMAIL_READ_STATUS_ICON_CLASSES._NOT_TRACKED,
                                    EMAIL_READ_STATUS_ICON_CLASSES._NOT_DELIVERED
                                );
                                ReadReceiptIcon.classList.add(
                                    EMAIL_READ_STATUS_ICON_CLASSES._PAINTED,
                                    EMAIL_READ_STATUS_ICON_CLASSES._SENT_UNREAD
                                );
                                ReadReceiptIcon.removeEventListener('mouseover', DataFetcher.fetchAndBindReadInformationOnTimeOut);
                                ReadReceiptIcon.addEventListener('mouseover', DataFetcher.fetchAndBindReadInformationOnTimeOut);
                                ReadReceiptIcon.removeEventListener('click', DOMHandler.PreventRRIconClick, true);
                                ReadReceiptIcon.addEventListener('click', DOMHandler.PreventRRIconClick, true);
                                ReadReceiptIcon.removeEventListener('mouseleave', DataFetcher.abortFetchDetailedReadInformation);
                                ReadReceiptIcon.addEventListener('mouseleave', DataFetcher.abortFetchDetailedReadInformation);
                            } else if (readStatusObject.status == EMAIL_READ_STATUS._READ) {
                                ReadReceiptIcon.classList.remove(
                                    EMAIL_READ_STATUS_ICON_CLASSES._SENT_UNREAD,
                                    EMAIL_READ_STATUS_ICON_CLASSES._NOT_TRACKED,
                                    EMAIL_READ_STATUS_ICON_CLASSES._NOT_DELIVERED
                                );
                                ReadReceiptIcon.classList.add(
                                    EMAIL_READ_STATUS_ICON_CLASSES._PAINTED,
                                    EMAIL_READ_STATUS_ICON_CLASSES._READ
                                );
                                ReadReceiptIcon.removeEventListener('mouseover', DataFetcher.fetchAndBindReadInformationOnTimeOut);
                                ReadReceiptIcon.addEventListener('mouseover', DataFetcher.fetchAndBindReadInformationOnTimeOut);
                                ReadReceiptIcon.removeEventListener('click', DOMHandler.PreventRRIconClick, true);
                                ReadReceiptIcon.addEventListener('click', DOMHandler.PreventRRIconClick, true);
                                ReadReceiptIcon.removeEventListener('mouseleave', DataFetcher.abortFetchDetailedReadInformation);
                                ReadReceiptIcon.addEventListener('mouseleave', DataFetcher.abortFetchDetailedReadInformation);
                            } else if (readStatusObject.status == EMAIL_READ_STATUS._NOT_DELIVERED) {
                                ReadReceiptIcon.classList.remove(
                                    EMAIL_READ_STATUS_ICON_CLASSES._NOT_TRACKED,
                                    EMAIL_READ_STATUS_ICON_CLASSES._SENT_UNREAD,
                                    EMAIL_READ_STATUS_ICON_CLASSES._READ
                                );
                                ReadReceiptIcon.classList.add(
                                    EMAIL_READ_STATUS_ICON_CLASSES._PAINTED,
                                    EMAIL_READ_STATUS_ICON_CLASSES._NOT_DELIVERED
                                );
                                ReadReceiptIcon.removeEventListener('mouseover', DOMHandler.ReadDetailsFlyout.show);
                                ReadReceiptIcon.addEventListener('mouseover', DOMHandler.ReadDetailsFlyout.show);
                                ReadReceiptIcon.removeEventListener('click', DOMHandler.PreventRRIconClick, true);
                                ReadReceiptIcon.addEventListener('click', DOMHandler.PreventRRIconClick, true);
                                ReadReceiptIcon.removeEventListener('mouseleave', DataFetcher.abortFetchDetailedReadInformation);
                                ReadReceiptIcon.addEventListener('mouseleave', DataFetcher.abortFetchDetailedReadInformation);
                            }
                        }
                    }
                }
            });
        }
    },
    paintForJustSentEmailInterval: '',
    paintForJustSentEmail: function() {
        if (DOMHandler.paintForJustSentEmailInterval) {
            window.clearInterval(DOMHandler.paintForJustSentEmailInterval);
        }
        DOMHandler.paintForJustSentEmailInterval = setInterval(function() {
            if (sdkMain.Router.getCurrentRouteView().getRouteType() === 'THREAD') {
                let targetNodes = document.querySelectorAll('.ThreadViewRRIcon:not(.ReadReceiptPainted)');
                if (targetNodes.length === 0 && DOMHandler.paintForJustSentEmailInterval) {
                    window.clearInterval(DOMHandler.paintForJustSentEmailInterval);
                }
                DOMHandler.addReadReceiptsPlaceHoldersInThreadView();
            } else if (sdkMain.Router.getCurrentRouteView().getRouteType() === 'LIST') {
                ReadReceiptUtils.recentThreadWithMessageID = [];
                let targetNodes = document.querySelectorAll('.ReadReceiptIcon:not(.ReadReceiptPainted)');
                Array.from(targetNodes).forEach(function(oReadReceiptIconNode) {
                    let oThreadRow = oReadReceiptIconNode.closest('tr');
                    ThreadStore.createAndSaveThreadInfoObject(oThreadRow);
                });
                if (targetNodes.length === 0 && DOMHandler.paintForJustSentEmailInterval) {
                    window.clearInterval(DOMHandler.paintForJustSentEmailInterval);
                }
                DataFetcher.fetchAndBindReadReceiptsData(ReadReceiptUtils.recentThreadWithMessageID);
            }
        }, 500);
    },
    updateReadReceiptStatus: function(sMessageID) {
        if (!sMessageID) {
            return;
        }
        let originalData = ReadReceiptDataStore.data[sMessageID];
        let oDataToPaint = {};
        oDataToPaint[sMessageID] = {
            status: 2,
            id: originalData && originalData.id
        };
        ReadReceiptDataStore.saveReadReceiptData(oDataToPaint);
        DOMHandler.paintDOM(oDataToPaint);
        DOMHandler.paintDOM(oDataToPaint, 'ThreadView');
    },
    setUpMutationObserverToPreventRemoval: function() {
        // target element that we will observe
        const targets = document.querySelectorAll('tr');

        // config object
        const config = {
            childList: true,
            subtree: true
        };

        // subscriber function
        function subscriber(mutations) {
            mutations.forEach(mutation => {
                // Prevent removal of our read-receipt container node by Gmail
                if (mutation.removedNodes) {
                    if (
                        mutation.removedNodes[4] &&
                        mutation.removedNodes[4].classList &&
                        mutation.removedNodes[4].classList.contains('RRIconContainer')
                    ) {
                        mutation.target.insertBefore(mutation.removedNodes[4], mutation.target.childNodes[4]);
                    } else if (
                        mutation.removedNodes[0] &&
                        mutation.removedNodes[0].classList &&
                        mutation.removedNodes[0].classList.contains('ReadReceiptIcon')
                    ) {
                        mutation.target.insertBefore(mutation.removedNodes[0], mutation.target.childNodes[0]);
                        let rrIcon = mutation.target.closest('.RRIconContainer');
                        let notRequiredNodes = rrIcon && rrIcon.querySelectorAll('.yW, .afn');
                        notRequiredNodes.forEach(oNode => {
                            rrIcon.removeChild(oNode);
                        });
                    } else {
                        // The sender name node's index seems to be changed to 3, hence the .RRIconContainer is added
                        // before the sender name node, i.e. at the index 3 instead of 4 (previous). Hence the first
                        // if condition (with index = 4) won't get satisfied anymore.
                        const removedNodes = Array.from(mutation.removedNodes);
                        const index = ReadReceiptUtils.getSenderNameNodeIndex(removedNodes);
                        const rrIconIndex = index > 0 ? index - 1 : 3;
                        if (
                          mutation.removedNodes[rrIconIndex] &&
                          mutation.removedNodes[rrIconIndex].classList &&
                          mutation.removedNodes[rrIconIndex].classList.contains('RRIconContainer')
                        ) {
                            mutation.target.insertBefore(mutation.removedNodes[rrIconIndex], mutation.target.childNodes[rrIconIndex]);
                        }
                    }
                }
            });
        }

        // instantiating observer
        const observer = new MutationObserver(subscriber);

        // observing target
        Array.from(targets).forEach(target => {
            observer.observe(target, config);
        });
        return observer;
    },
    setUpMutationObserverForListView: function() {
        // target element that we will observe
        let RowsObserverer = DOMHandler.setUpMutationObserverToPreventRemoval();
        const targets = document.querySelectorAll('.UI');

        // config object
        const config = {
            attributes: true,
            attributeOldValue: true,
            subtree: true,
            attributeFilter: ['data-inboxsdk-thread-row']
            // attributeFilter: ['class']
        };

        // subscriber function
        function subscriber(mutations) {
            if (mutations.length) {
                let mutationObj = mutations[0];
                let mutationTarget = mutationObj.target;
                // When any thread-row in any List gets loaded, InboxSDK adds `inboxsdk__thread_row` class to each thread-row,
                // we take advantage of this and observe when this happens, to bind our read-receipt data to that thread-row
                // Update: the InboxSDK no longer seem to be adding the `inboxsdk__thread_row` class.
                // We're listening on the `data-inboxsdk-thread-row` attribute change.
                if (
                  //   mutationObj.type == 'attributes' &&
                  //   (!mutationObj.oldValue || !mutationObj.oldValue.match(/\binboxsdk__thread_row\b/)) &&
                  //   mutationTarget.classList
                  // && mutationTarget.classList.contains('inboxsdk__thread_row')
                  mutationObj.type === 'attributes'
                ) {
                    ReadReceiptUtils.recentThreadWithMessageID = [];
                    // Disconnet the previous row observer
                    RowsObserverer.disconnect();
                    // Setup a new row observer for the new(current) ListView
                    RowsObserverer = DOMHandler.setUpMutationObserverToPreventRemoval();
                    mutations.forEach(mutation => {
                        if (mutation.type == 'attributes') {
                            const oThreadRow = mutation.target;
                            ThreadStore.createAndSaveThreadInfoObject(oThreadRow);
                        }
                    });
                    // Get read-receipt data for all relevant thread-rows and bind it to DOM
                    DataFetcher.fetchAndBindReadReceiptsData(ReadReceiptUtils.recentThreadWithMessageID);
                }
            }
        }

        // instantiating observer
        const observer = new MutationObserver(subscriber);

        // observing target
        Array.from(targets).forEach(target => {
            observer.observe(target, config);
        });
        return {
            RowsObserverer: RowsObserverer,
            UIobserver: observer
        };
    },
    addReadReceiptsPlaceHoldersInThreadView: function() {
        // Get all visible collapsed email nodes in DOM and put read receipt placeholders in them
        let visibleCollapsedEmailNodes = document.querySelectorAll(GMAIL_NodeSelectors.ThreadViewMessageCollapsed);
        let visibleThreadSubject = document.querySelector(GMAIL_NodeSelectors.ThreadViewSubject);
        let legacyThreadID = visibleThreadSubject && visibleThreadSubject.getAttribute('data-legacy-thread-id');
        Array.from(visibleCollapsedEmailNodes).forEach(oNode => {
            // Only insert placeholders if it doesn't exist
            if (
                oNode.querySelector('.ReadReceiptIcon') === null &&
                oNode.querySelector(GMAIL_NodeSelectors.ThreadViewSenderDetails).getAttribute('email') === currentUserEmail
            ) {
                ReadReceiptUtils.loadMessageNodes(oNode);
            }
        });
        // Get all expanded email nodes in DOM and put read receipt placeholders in them
        let expandedEmailNodes = document.querySelectorAll(GMAIL_NodeSelectors.ThreadViewMessageExpanded);
        message_Ids = [];
        Array.from(expandedEmailNodes).forEach(oNode => {
            // Only insert placeholders if it doesn't exist
            if (
                oNode.querySelector('.ReadReceiptIcon') === null ||
                oNode.querySelector('.ReadReceiptIcon:not(.ReadReceiptPainted)') !== null
            ) {
                let message_id = oNode.getAttribute('data-legacy-message-id');
                let draft_id = oNode.getAttribute('data-message-id');
                draft_id = draft_id.split('#msg-a:');
                draft_id = draft_id.length > 0 && draft_id[1];
                // Get the sender's email id from DOM and if the email is sent by the current user then only add the placeholder
                if (oNode.querySelector(GMAIL_NodeSelectors.ThreadViewSenderDetails).getAttribute('email') === currentUserEmail) {
                    // Get DOM elements for expanded and collapsed nodes
                    let expandedEmailNode = oNode;
                    let collapsedEmailNode = oNode.closest('.kv,.h7').querySelector(GMAIL_NodeSelectors.ThreadViewMessageCollapsed);
                    // Insert placeholder nodes
                    if (expandedEmailNode.querySelector('.ReadReceiptIcon') === null) {
                        let sInnerClassList = 'emailExpandedView';
                        ReadReceiptUtils.insertPlaceholderNode(expandedEmailNode, sInnerClassList);
                    }
                    if (collapsedEmailNode && collapsedEmailNode.querySelector('.ReadReceiptIcon') === null) {
                        let sInnerClassList = 'DTHoverIcon emailCollapsedView';
                        ReadReceiptUtils.insertPlaceholderNode(collapsedEmailNode, sInnerClassList);
                    }
                    // Store DOM nodes in the MessageStore
                    MessageStore.MessageDataFromDOM[message_id] = {
                        expandedEmailNode: expandedEmailNode,
                        collapsedEmailNode: collapsedEmailNode
                    };
                    if (message_id && legacyThreadID) {
                        message_Ids.push({
                            message_id: message_id,
                            thread_id: legacyThreadID,
                            draft_id: draft_id
                        });
                    }
                }
            }
        });
        // Get read-receipt details for all nodes observed in the current thread
        DataFetcher.fetchAndBindReadReceiptsData(message_Ids, 'ThreadView');
    },
    ReadDetailsFlyout: {
        show: function(data, sourceEvent) {
            sourceEvent = sourceEvent ? sourceEvent : event;
            let targetNode = sourceEvent.target;
            if (targetNode && targetNode.classList.contains('ReadReceiptIcon')) {
                if (data.open_count > 0 && targetNode.classList.contains(EMAIL_READ_STATUS_ICON_CLASSES._SENT_UNREAD)) {
                    let messageId = targetNode.getAttribute('data-message-id-sh');
                    if (messageId) {
                        DOMHandler.updateReadReceiptStatus(messageId);
                    }
                }
                let ReadDetailsPopUp = _.template(ReadDetailsFlyoutBuilder.ReadDetailsPopUpContent);
                let readDetailsPopupElement = getNewElement();
                readDetailsPopupElement.classList.add('DTouter');
                let eventTarget = targetNode.closest('.ReadReceiptIcon');
                if (eventTarget && eventTarget.classList.contains('ThreadViewRRIcon')) {
                    readDetailsPopupElement.classList.add('DTouterLeft');
                    data.view = 'threadView';
                } else {
                    readDetailsPopupElement.classList.add('DTouterRight');
                    data.view = 'listView';
                }
                data.isTracked = true;
                if (eventTarget.classList.contains(EMAIL_READ_STATUS_ICON_CLASSES._NOT_TRACKED)) {
                    data = {};
                    data.isTracked = false;
                } else if (eventTarget.classList.contains(EMAIL_READ_STATUS_ICON_CLASSES._NOT_DELIVERED)) {
                    data = {};
                    data.isBounced = true;
                }
                readDetailsPopupElement.innerHTML = ReadDetailsPopUp({
                    oReadDetails: data
                });
                let ReadReceiptIcon = eventTarget;
                DOMHandler.ReadDetailsFlyout.hideAll();
                ReadReceiptIcon.appendChild(readDetailsPopupElement);
                readDetailsPopupElement.addEventListener('mouseover', DOMHandler.ReadDetailsFlyout.clearTimeOut);
                readDetailsPopupElement.addEventListener('mouseleave', DOMHandler.ReadDetailsFlyout.hideOnTimeOut);
            }
        },
        hideAll: function() {
            Array.from(document.querySelectorAll('.ReadReceiptIcon')).forEach(oNode => {
                oNode.innerHTML = '';
            });
        },
        hide: function(eventSource) {
            let oFlyout = eventSource && eventSource.target && eventSource.target.querySelector('.DTouter');
            if (oFlyout) {
                DOMHandler.ReadDetailsFlyout.hidePopUp = true;
                setTimeout(DOMHandler.ReadDetailsFlyout.removeNode.bind(null, oFlyout), 1000);
            }
        },
        hidePopUp: true,
        timeoutThreshold: 1000,
        hideOnTimeOut: function() {
            DOMHandler.ReadDetailsFlyout.clearTimeOut();
            DOMHandler.ReadDetailsFlyout.hidePopUp = true;
            DOMHandler.ReadDetailsFlyout.timeoutFucnt = setTimeout(() => {
                if (DOMHandler.ReadDetailsFlyout.hidePopUp) {
                    DOMHandler.ReadDetailsFlyout.hideAll();
                }
            }, DOMHandler.ReadDetailsFlyout.timeoutThreshold);
        },
        clearTimeOut: function() {
            DOMHandler.ReadDetailsFlyout.hidePopUp = false;
        },
        removeNode: function(oFlyout) {
            if (DOMHandler.ReadDetailsFlyout.hidePopUp) {
                oFlyout.parentNode && oFlyout.parentNode.removeChild(oFlyout);
            }
        }
    },
    PreventRRIconClick: function(event) {
        event.stopImmediatePropagation();
        event.preventDefault();
    }
};

let ReadDetailsFlyoutBuilder = {
    ReadDetailsPopUpContent: `<% 
        let isTracked = oReadDetails.isTracked || false; 
        let iReadCount =  oReadDetails.open_count;
        let arrRecipients = oReadDetails.recipients || [];
        let countOfRecipients = arrRecipients.length;
    %>
    <div class="dt-main">
        <div class="dt-body">
            <%= ReadDetailsFlyoutBuilder.getHeader(oReadDetails) %>
        </div>
        <%= ReadDetailsFlyoutBuilder.getActivities(oReadDetails) %>
    </div>`,
    getHeader: function(oReadDetails) {
        let isTracked = oReadDetails.isTracked || false;
        let isBounced = oReadDetails.isBounced || false;
        let iReadCount = oReadDetails.open_count || 0;
        oReadDetails.activity = oReadDetails.activity || [];
        let activityCount = oReadDetails.activity.length;
        if (oReadDetails.view === 'listView' && activityCount > 3) {
            oReadDetails.activity = oReadDetails.activity.slice(0, 3);
        } else if (oReadDetails.view === 'threadView' && activityCount > 6) {
            oReadDetails.activity = oReadDetails.activity.slice(0, 6);
        }
        if (oReadDetails.first_open) {
            oReadDetails.first_open.isFirstOpen = true;
            oReadDetails.activity.push(oReadDetails.first_open);
            activityCount += 1;
        }
        let arrRecipients = oReadDetails.recipients || [];
        let countOfRecipients = arrRecipients.length;
        let sHeaderHTML = '';
        sHeaderHTML = `<div class='dt-icon ${activityCount > 1 ? 'nrb' : ''}'>
                <span class=${
                    isBounced
                        ? READ_DETAILS_ELE_CLASSES._VIEW_NOT_DELIVERED
                        : !isTracked || (isTracked && iReadCount === 0)
                        ? READ_DETAILS_ELE_CLASSES._VIEW_DISABLED
                        : READ_DETAILS_ELE_CLASSES._VIEW_ENABLED
                }></span>
                <small>${iReadCount > 0 ? iReadCount : ''}</small>
            </div>
            <div class = 'dt-desc ${activityCount > 1 ? 'nplr' : ''}'>
            <p>${(() => {
                if (isBounced) {
                    return `Your email was not delivered`;
                } else if (!isTracked) {
                    return `Email sent without SalesHandy Chrome extension`;
                } else if (iReadCount === 1 && countOfRecipients === 1 && activityCount !== 1) {
                    return arrRecipients[0];
                } else if (countOfRecipients === 1 && activityCount !== 1) {
                    return arrRecipients[0];
                } else if (iReadCount === 0 && countOfRecipients === 1) {
                    return arrRecipients[0];
                } else if (iReadCount === 0 && countOfRecipients > 1) {
                    return 'No one has read your email yet';
                } else {
                    return '';
                }
            })()}</p>
            <span class=${iReadCount === 1 && countOfRecipients === 1 && activityCount === 1 ? 'single-activity' : ''}>${(() => {
            if (isTracked) {
                if (iReadCount === 0) {
                    if (countOfRecipients === 1) {
                        return 'Has not read your email yet';
                    }
                } else if (activityCount === 1 && countOfRecipients === 1) {
                    return arrRecipients[0] + ` ${ReadDetailsFlyoutBuilder.getSingleActivityString(oReadDetails.first_open)}`;
                } else if (iReadCount === 1 && countOfRecipients === 1) {
                    return 'Your email was read ' + (iReadCount > 1 ? iReadCount + ' times' : ' once');
                } else {
                    return 'Your email was read ' + (iReadCount > 1 ? iReadCount + ' times' : '');
                }
            }
            return '';
        })()}</span>
            </div>
            `;
        return sHeaderHTML;
    },
    getActivities: function(oReadDetails) {
        let sHeaderHTML = '';
        if (oReadDetails.open_count > 1 || oReadDetails.activity.length > 1) {
            let allActivities = oReadDetails.activity;
            let allActivitiesSorted = ReadDetailsFlyoutBuilder.sortActivities(allActivities);
            sHeaderHTML = `<div class = "activityList"><ul>${allActivitiesSorted
                .map(ReadDetailsFlyoutBuilder.getActivityString)
                .join('')}</ul></div>`;
        }
        return sHeaderHTML;
    },
    getActivityString: function(oActivity) {
        let action_time_date = new Date(oActivity.acted_at * 1000);
        let action_time = moment(action_time_date);
        let action_time_string = `<span class="ReadDetailsTime" data-tooltip="${action_time.format(
            'dddd, DD MMM YYYY, LT '
        )}">${TimeHandler.humanize(action_time_date)}</span></p>`;
        let action = `<li><p>${oActivity.isFirstOpen ? 'First read' : 'Read'}`;
        let clickCountIndicator = '';
        if (oActivity.url) {
            action = `<li><p>Link<a class="ReadDetailsURL" href="${oActivity.url}" data-tooltip="${oActivity.url}">${oActivity.url &&
                oActivity.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a>clicked `;
            clickCountIndicator =
                oActivity.click_count > 0
                    ? `<a data-tooltip = "link ${oActivity.url} was clicked ${
                          oActivity.click_count > 1 ? oActivity.click_count + ' times' : ''
                      }"><span class="urlClickCount">${oActivity.click_count}</span></a >`
                    : '';
        }

        let actionIcons = `<div class="pull-right-icon">
            ${clickCountIndicator}
        </div>`;
        return action + action_time_string + actionIcons + `</li>`;
    },
    getSingleActivityString: function(oActivity) {
        let action_time_date = new Date(oActivity.acted_at * 1000);
        let action_time = moment(action_time_date);
        let action_time_string = `<span class="ReadDetailsTime single-activity" data-tooltip="${action_time.format(
            'dddd, DD MMM YYYY, LT '
        )}">${TimeHandler.humanize(action_time_date)}</span>`;
        let action = `read your email`;
        if (oActivity.url) {
            action = `clicked link <a class="ReadDetailsURL" href="${oActivity.url}" data-tooltip="${oActivity.url}">${oActivity.url}</a> `;
        }

        return action + action_time_string;
    },
    sortActivities: function(allActivities) {
        return allActivities.sort(function(activity1, activity2) {
            return (activity1.acted_at < activity2.acted_at) - (activity1.acted_at > activity2.acted_at);
        });
    }
};

let ReadReceiptUtils = {
    recentThreadWithMessageID: [],
    /**
     * Insert placeholder nodes for thread-view
     */
    insertPlaceholderNode: function(oNode, sInnerClassList) {
        let tickNode = document.createElement('div');
        tickNode.innerHTML = `<span class='ReadReceiptIcon gH ThreadViewRRIcon ${sInnerClassList}'></span>`;
        tickNode.classList.add('RRIconContainer');
        let starNode = oNode.querySelector(GMAIL_NodeSelectors.ThreadViewStarIcon);
        starNode = starNode.closest('td');
        starNode.parentNode.insertBefore(tickNode, starNode.nextSibling);
    },
    /**
     * By default, the email nodes in thread-view are collapsed,
     * and respective expanded node for the same email is not loaded
     * If the message is not loaded, we can not get it's message-id from DOM
     * Below function gets the messages loaded,
     */
    loadMessageNodes: function(oNode) {
        let event = new MouseEvent('auxclick', {
            view: window,
            bubbles: true,
            cancelable: false
        });
        oNode.dispatchEvent(event);
        oNode.dispatchEvent(event);
    },
    hideReadReceiptLabelsOnInterval: function() {
        if (ReadReceiptUtils.hideReadReceiptLabelsInterval) {
            window.clearInterval(ReadReceiptUtils.hideReadReceiptLabelsInterval);
        }
        ReadReceiptUtils.hideReadReceiptLabelsInterval = setInterval(ReadReceiptUtils.hideReadReceiptLabels, 100);
    },
    hideReadReceiptLabels: function() {
        let nodesToHide = document.querySelectorAll("div[title='✔✔'], div[title='✔'], div[name='✔✔'], div[name='✔']");
        nodesToHide.forEach(function(nodeToHide) {
            nodeToHide = nodeToHide.closest('.ar.as') || nodeToHide.closest('table.cf');
            nodeToHide && (nodeToHide.style.display = 'none');
        });
        ReadReceiptUtils.hideReadReceiptLabelsOnInterval();
    },
    hideReadReceiptLabelsInterval: '',
    ReadReceiptLabelsCreated: false,
    createReadReceiptsLabels: function(iTimesExecutedThreshHold) {
        return new Promise((resolve, reject) => {
            let hideReadReceipts = areSHReadReceiptsOff(currentUserEmail);
            if (hideReadReceipts === true) {
                ReadReceiptUtils.ReadReceiptLabelsCreated = true;
                resolve({
                    success: true
                });
                return;
            }
            if (ReadReceiptUtils.ReadReceiptLabelsCreated === true) {
                resolve({
                    success: true
                });
                return;
            }
            let iTimesExecuted = 0;
            let CreateLabelsOnInterval = setInterval(function() {
                iTimesExecuted++;
                let userInfoObj = getUserInfoFromLocal();
                if (currentUserEmail && userInfoObj && userInfoObj.isPluginActivated && userInfoObj.auth_token) {
                    let auth_token = userInfoObj.auth_token;
                    clearInterval(CreateLabelsOnInterval);
                    let data = {
                        auth_token: auth_token,
                        opts: {
                            email_address: currentUserEmail
                        }
                    };
                    let createReadReceiptLabelsUrl = '/user/create-label';
                    let oRequestBody = {
                        action: 'callFunction',
                        function: 'postData',
                        parameters: [createReadReceiptLabelsUrl, data]
                    };
                    sendMessageToBackgroundPromise(oRequestBody).then(res => {
                        if (!res.error && auth_token) {
                            ReadReceiptUtils.ReadReceiptLabelsCreated = true;
                            resolve({
                                success: true
                            });
                        }
                    });
                }
                if (iTimesExecuted > iTimesExecutedThreshHold) {
                    resetPluginForAccount();
                    clearInterval(CreateLabelsOnInterval);
                    ReadReceiptUtils.ReadReceiptLabelsCreated = true;
                    reject({
                        success: false
                    });
                }
            }, 500);
        });
    },
    getSenderNameNodeIndex: (nodes) => {
        return nodes.findIndex(node => {
            if (!node.classList) {
                return false;
            }
            const classList = Array.from(node.classList);
            return classList && classList.includes('yX') && classList.includes('xY');
        });
    }
  }
;
