/**
 * ----------------------------
 * - background.js
 * ----------------------------
 *
 * This file contains the core logic of the application. It listens to the events / actions from the
 * other pages like content, popup, options etc to perform some tasks.
 */

/**
 * Listen to the events / actions of the extension from other pages
 */
const ENVIRONMENT = 'COM';
const ENVS = {
    QA: 'cultofpassion.com',
    NET: 'saleshandy.com',
    COM: 'saleshandy.com',
    LEARNER: 'lifeisgoodforlearner.com',
    DOER: 'lifeisgoodfordoer.com',
    RISE_BY_LEARNING: 'risebylearning.com',
    RISE_BY_HELPING: 'risebyhelping.com',
    RISE_BY_HUSTLING: 'risebyhustling.com'
};

const DataURLS = {
    QA: 'https://data.cultofpassion.com/plugin-event',
    NET: 'https://data.saleshandy.com/plugin-event',
    COM: 'https://data.saleshandy.com/plugin-event',
    LEARNER: 'https://data.lifeisgoodforlearner.com/plugin-event',
    DOER: 'https://data.lifeisgoodfordoer.com/plugin-event',
    RISE_BY_LEARNING: 'https://data.risebylearning.com/plugin-event',
    RISE_BY_HELPING: 'https://data.risebyhelping.com/plugin-event',
    RISE_BY_HUSTLING: 'https://data.risebyhustling.com/plugin-event'
};

const mainApplicationEndPts = {
    QA: 'https://qaapi2.cultofpassion.com/',
    NET: 'https://app2.saleshandy.com/',
    COM: 'https://app.saleshandy.com/',
    LEARNER: 'https://app.lifeisgoodforlearner.com/',
    DOER: 'https://app.lifeisgoodfordoer.com/',
    RISE_BY_LEARNING: 'https://app.risebylearning.com/',
    RISE_BY_HELPING: 'https://app.risebyhelping.com/',
    RISE_BY_HUSTLING: 'https://app.risebyhustling.com/'
};

const PLUGIN_EVENTS = {
    INSTALL: 1,
    UNINSTALL: 2,
    UPDATE: 3
};

const domainToUse = ENVS[ENVIRONMENT];
const dataURL = DataURLS[ENVIRONMENT];
let userIDsToBlock = [];
const SOCKET_DISCONNECT_REASONS = {
    PING_TIMEOUT: 'ping timeout',
    TRANSPORT_CLOSE: 'transport close',
    FORCED_CLOSE: 'forced close',
    TRANSPORT_ERROR: 'transport error',
    IO_SERVER_DISCONNECT: 'io server disconnect',
    IO_CLIENT_DISCONNECT: 'io client disconnect'
};

const NO_ACTIVE_USER = 'RKY5nl8zv8bNg1L2';

socketurl = `https://appsocket.${domainToUse}:8443/`;
oldTrackingUrl = 'app.saleshandy.com/web/email/countopened';

objSocket = undefined;
socketAuthToken = '';
sourceId = {
    CHROME_PLUGIN: 2
};
currentUserID = undefined;
oldShRef = undefined;
allConnectedUsers = [];
allPluginUsers = [];
allNotConnectedUsers = [];
chromeStorageHandler = chrome.storage;
sDisconnectReason = '';
allConnectedUserslocalStorage = localStorage.getItem('allConnectedUsers');
allConnectedUserslocalStorage = allConnectedUserslocalStorage ? allConnectedUserslocalStorage.split(',') : [];
allPluginUserslocalStorage = localStorage.getItem('allPluginUsers');
allPluginUserslocalStorage = allPluginUserslocalStorage ? allPluginUserslocalStorage.split(',') : [];
socketAuthToken = localStorage.getItem('socketAuthToken') || '';
notificationData = {};
userIdEmailIdMapping = {};
userIdToTeamMapping = {};

// Open new tab when SH ICON is clicked
chrome.browserAction.onClicked.addListener(() => {
    window.open('https://app.saleshandy.com/');
});

if (allConnectedUserslocalStorage && allConnectedUserslocalStorage.length) {
    allConnectedUsers = allConnectedUserslocalStorage.filter(function(value, index, self) {
        return self.indexOf(value) === index;
    });
    allConnectedUsers.forEach(function(userID) {
        currentUserID = userID;
        initNotificationWatch(userID);
    });
}

if (allPluginUserslocalStorage && allPluginUserslocalStorage.length) {
    allPluginUsers = allPluginUserslocalStorage.filter(function(value, index, self) {
        return self.indexOf(value) === index;
    });
}

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    let { data } = request;
    if (!data) {
        return;
    }
    if (data && data.shref) {
        oldShRef = atob(data.shref);
    }
    if (data.userID) {
        currentUserID = data.userID;
        storeUserID(currentUserID);
        if(!userIDsToBlock.includes(currentUserID)){
            addUserToBlock([currentUserID]);
        }
    }
    if (data.userEmail) {
        userIdEmailIdMapping[data.userID] = data.userEmail;
    }
    if (data.startTeamActivityBlock === undefined && data.startNotify === undefined) return;
    if (data.startTeamActivityBlock !== undefined) {
        addUserToTeamMapping(currentUserID, data.team_open_block_members || []);
        setTimeout(() => {
            handleOpenBlock(userIDsToBlock);
        }, 50);
    }
    if (data.startNotify) {
        initNotificationWatch(data.userID);
    } else if (data.startNotify === false) {
        removeUserFromSocket(data.userID);
    }
    return true;
});

function addUserToTeamMapping(userId, teamList){
    userIdToTeamMapping[userId] = teamList;
    userIDsToBlock = [];
    for(var keys in userIdToTeamMapping){
        addUserToBlock([keys]);
        addUserToBlock(userIdToTeamMapping[keys]);
    }
}

function addUserToBlock(array_data){
    if(array_data.length){
        array_data.forEach(element => {
            if(!userIDsToBlock.includes(element)){
                userIDsToBlock.push(element);
            }
        });
    }
}

function storeUserID(userID) {
    if (!allPluginUsers.includes(userID)) {
        allPluginUsers.push(userID);
        localStorage.setItem('allPluginUsers', allPluginUsers);
    }
    createUninstallURL();
}

function createUninstallURL() {
    let source = 2;
    let eventType = PLUGIN_EVENTS.UNINSTALL;
    let version = getManifestVersion();
    let recently_active_users = allPluginUsers.length > 0 ? allPluginUsers.slice(0, Math.min(allPluginUsers.length, 10)) : [];
    let users = recently_active_users.length > 0 ? recently_active_users.join(',') : NO_ACTIVE_USER;
    let params = {
        user_id: users,
        source: source,
        type: eventType,
        v: version
    };
    let uninstallURL = makeURL(dataURL, params);
    chrome.runtime.setUninstallURL(uninstallURL);
}

function getManifestVersion() {
    let manifestData = chrome.runtime.getManifest();
    return manifestData.version;
}

function makeURL(url, params) {
    url += '?';
    for (var param in params) {
        url += encodeURIComponent(param) + '=' + params[param] + '&';
    }
    return url.substring(0, url.length - 1);
}

function initNotificationWatch(userId) {
    if (!objSocket || !objSocket.connected) {
        createConnection().then(res => {
            addUserToSocket(userId);
        });
    }
    if (objSocket.connected) {
        addUserToSocket(userId);
    }
}

function createConnection() {
    return new Promise((resolve, reject) => {
        socketAuthToken = localStorage.getItem('socketAuthToken') || '';
        objSocket = io(socketurl, {
            query: 'socketAuthToken=' + socketAuthToken
        });
        if (Object.keys(objSocket).length === 0) {
            console.log('Socket Not Connected.');
        } else {
            console.log('Socket Already Connected.');
            objSocket.off('eventHandshake');
            objSocket.on('eventHandshake', function(data) {
                socketAuthToken = JSON.parse(data).socketAuthToken;
                localStorage.setItem('socketAuthToken', socketAuthToken);
                objSocket.query = 'socketAuthToken=' + socketAuthToken;
                objSocket.io.opts.query = 'socketAuthToken=' + socketAuthToken;
                objSocket.io.engine.query.socketAuthToken = socketAuthToken;
                console.log('Socket AuthToken recieved. : ' + socketAuthToken);
                resolve(true);
            });
            objSocket.off('disconnect');
            objSocket.on('disconnect', function(disconnectReason) {
                allNotConnectedUsers = allConnectedUsers;
                allConnectedUsers = [];
                sDisconnectReason = disconnectReason;
                console.log('Socket disconnected due to: ' + disconnectReason);
            });
            objSocket.off('reconnect');
            objSocket.on('reconnect', function() {
                if (
                    sDisconnectReason === SOCKET_DISCONNECT_REASONS.TRANSPORT_CLOSE ||
                    sDisconnectReason === SOCKET_DISCONNECT_REASONS.PING_TIMEOUT ||
                    sDisconnectReason === SOCKET_DISCONNECT_REASONS.TRANSPORT_ERROR
                ) {
                    addRemainingUser();
                    sDisconnectReason = '';
                }
            });
            objSocket.off('connect_timeout');
            objSocket.on('connect_timeout', function() {
                // console.log('connect_timeout event fired');
            });
            objSocket.off('error');
            objSocket.on('error', function() {
                // console.log('error event fired');
            });
            objSocket.off('reconnect_error');
            objSocket.on('reconnect_error', function() {
                // console.log('reconnect_error event fired');
            });
        }
    });
}

function addUserToSocket(userId) {
    let dataToSend = {
        arrUserId: userId,
        socketAuthToken,
        sourceId: sourceId.CHROME_PLUGIN
    };
    objSocket.emit('eventRegisterUsers', JSON.stringify(dataToSend));
    objSocket.off('eventRegisterUsersAck');
    objSocket.on('eventRegisterUsersAck', function(data) {
        data = JSON.parse(data);
        let handleAddUserAgain;
        let { arrUsersAdded, arrUsersNotAdded } = data;

        if (arrUsersAdded.length) {
            arrUsersAdded.forEach(user => {
                // console.log(`User with id: ${user} is added to socket ${socketAuthToken}`);
            });
            if (allConnectedUsers.indexOf(arrUsersAdded[0]) == -1) {
                allConnectedUsers.push(arrUsersAdded[0]);
                localStorage.setItem('allConnectedUsers', allConnectedUsers);
            }
            readyToRecieveNoftifcationData();
        }
    });
}

function addRemainingUser() {
    allNotConnectedUsers.forEach(u => addUserToSocket(u));
}

function removeUserFromSocket(userId) {
    if (!objSocket || !objSocket.connected) return;

    let dataToSend = {
        arrUserId: userId,
        socketAuthToken,
        sourceId: sourceId.CHROME_PLUGIN
    };

    objSocket.emit('eventRemoveUsersFromSocket', JSON.stringify(dataToSend));
    objSocket.off('eventRemoveUsersFromSocketAck');
    objSocket.on('eventRemoveUsersFromSocketAck', function(data) {
        data = JSON.parse(data);
        let { arrUsersNotRemoved, arrUsersRemoved } = data;
        arrUsersRemoved.forEach(user => {
            // console.log(`User with id: ${user} is removed from socket ${socketAuthToken}`);
        });
        allConnectedUsers = allConnectedUsers.filter(u => u != arrUsersRemoved[0]);
        localStorage.setItem('allConnectedUsers', allConnectedUsers);
        if (!allConnectedUsers.length) disconnectSocket();
    });
}

function readyToRecieveNoftifcationData() {
    // console.log('Ready to recieve notification data');
    objSocket.off('pushData');
    objSocket.on('pushData', function(data) {
        console.log('Data recieved from nodepubsub - data: ', data);
        data = JSON.parse(data);
        notifyMe_sh(data);
    });
}

function notifyMe_sh(data) {
    sendMessageToContentScript('updateReadReceipts', data);
    ctr = new Date();
    let { title, message, encUserId } = data;
    let btns = getNotificationButtons(encUserId);
    let notificationObj = {
        type: 'basic',
        title,
        message,
        iconUrl: 'images/48.png'
    };
    if (btns.length > 0) notificationObj.buttons = btns;
    encUserId = encUserId ? encUserId : 'initUserId';

    chrome.notifications.create(`${encUserId}-${ctr}`, notificationObj, crCallback);

    function crCallback(notID) {
        shnotificationid = notID;
        notificationData[notID] = data;
    }
    ctr++;
}

function getNotificationButtons(encUserId) {
    let btns = [];
    if (!encUserId) return [];
    btns.push({
        title: 'Block all notifications',
        iconUrl: 'images/block.png'
    });
    return btns;
}

function disconnectSocket() {
    if (objSocket && objSocket.connected) {
        objSocket.disconnect();
        allConnectedUsers = [];
        localStorage.setItem('allConnectedUsers', allConnectedUsers);
    }
}

chrome.notifications.onClicked.addListener(function(notificationId) {
    openGmailThread(notificationId);
    chrome.notifications.clear(notificationId);
});

chrome.notifications.onClosed.addListener(function(notificationId) {
    notificationData[notificationId] && delete notificationData[notificationId];
});

chrome.notifications.onButtonClicked.addListener(function(notificationId, btnIdx) {
    if (!currentUserID) return;
    let userIDToRemove = notificationId.substring(0, notificationId.indexOf('-'));
    chrome.notifications.clear(notificationId);
    switch (btnIdx) {
        case 0:
            chromeStorageHandler.sync.get(['showLocalNotification'], function(items) {
                showLocalNotification = items.showLocalNotification;
                let newNotifyObject = {
                    showNotLocal: false,
                    userID: userIDToRemove
                };
                let userIndexInLocalNotArray = -1;
                let userSpecificLocalNotData = showLocalNotification.find((notLocal, index) => {
                    userIndexInLocalNotArray = index;
                    return notLocal.userID == userIDToRemove;
                });
                showLocalNotification[userIndexInLocalNotArray] = newNotifyObject;
                chromeStorageHandler.sync.set({
                    showLocalNotification: showLocalNotification
                });
                removeUserFromSocket(userIDToRemove);
                // console.log('Block all notification and store value with local storage');
            });
    }
});

if (chrome.runtime.setUninstallURL) {
    chromeStorageHandler.sync.clear();
    disconnectSocket();
    createUninstallURL();
}

function getUserIDToCompare(url) {
    //Get Tracking Pixel Url from GMAIL provided URL - tracking pixel present after #
    let trackingPixelUrl = url.substr(url.indexOf('#') + 1);
    if (trackingPixelUrl.includes(oldTrackingUrl)) {
        return userIDFromOld(trackingPixelUrl);
    } else {
        return userIDFromNew(trackingPixelUrl);
    }
}

function userIDFromNew(url) {
    let arr = [];
    for (i = 0; i < url.length; i++) {
        if (url[i] == '/') arr.push(i);
    }
    let arrLength = arr.length;
    return url.substring(arr[arrLength - 2] + 1, arr[arrLength - 1]);
}

function userIDFromOld(url) {
    return url.substr(url.indexOf('=') + 1);
}

//Self block section
handleOpenBlock();
function handleOpenBlock(arrTeamAccounts) {
    // console.log('handleSelfBlock Called');
    arrTeamAccounts = arrTeamAccounts || [];
    let listofUrlsToBlock = [
        'https://*.googleusercontent.com/proxy/*',
        'http://*.googleusercontent.com/proxy/*',
        'https://*/*/*/*/' + currentUserID + '*',
        'http://*/*/*/*/' + currentUserID + '*'
    ];
    listofUrlsToBlock.concat(
        arrTeamAccounts.map(userID => {
            return 'https://*/*/*/*/' + userID + '*';
        })
    );
    listofUrlsToBlock.concat(
        arrTeamAccounts.map(userID => {
            return 'http://*/*/*/*/' + userID + '*';
        })
    );
    console.log('SELF_BLOCK: onBeforeRequest event listner removed');
    chrome.webRequest.onBeforeRequest.removeListener(onBeforeRequest);
    console.log('SELF_BLOCK: onBeforeRequest event listner added');
    chrome.webRequest.onBeforeRequest.addListener(
        onBeforeRequest,
        {
            urls: listofUrlsToBlock,
            types: ['image']
        },
        ['blocking']
    );
}

chrome.runtime.onInstalled.addListener(function(details) {
    // console.log(details.reason);
    if (details.reason == 'install') {
        notifyMe_sh({
            title: 'Hey there !',
            message: 'This is a sample notification.\nYou will receive all the activity notifications here.'
        });
        let mainAppURL = 'https://mail.google.com/mail/u';
        redirectAfterInstallation(mainAppURL);
    } else if(details.reason == 'update'){
        gmailReloadAfterUpdate();
    }
});

function redirectAfterInstallation(url){ 
    chrome.windows.getAll({
        populate: true
    }, function (windows) {
        var i = 0, w = windows.length, currentWindow;
        for( ; i < w; i++ ) {
            currentWindow = windows[i];
            var j = 0, t = currentWindow.tabs.length, currentTab;
            for( ; j < t; j++ ) {
                currentTab = currentWindow.tabs[j];
                if(currentTab.active){
                    chrome.tabs.update({ url: url });
                }
            }
        }
    });
}

function gmailReloadAfterUpdate(){
    chrome.windows.getAll({
        populate: true
    }, function (windows) {
        var i = 0, w = windows.length, currentWindow;
        for( ; i < w; i++ ) {
            currentWindow = windows[i];
            var j = 0, t = currentWindow.tabs.length, currentTab;
            for( ; j < t; j++ ) {
                currentTab = currentWindow.tabs[j];
                if(currentTab.url && currentTab.url.includes('mail.google.com')) {
                   chrome.tabs.reload(currentTab.id);
                }
            }
        }
    });
}

function doesURLIncludeTeamUserId(url, currentUserID) {
    return (
        userIDsToBlock.filter(function(userID) {
            return url.includes(userID) === true;
        }).length > 0
    );
}

function sendMessageToContentScript(action, messageObject) {
    chrome.tabs.query({}, function(tabs) {
        tabs.forEach(function(tab) {
            if (!chrome.runtime.lastError) {
                chrome.tabs.sendMessage(
                    tab.id,
                    {
                        action: action,
                        messageObject: messageObject
                    },
                    function(response) {
                        if (chrome.runtime.lastError === undefined) {
                            success = true;
                        }
                    }
                );
            }
        });
    });
}

function onBeforeRequest(details) {
    console.log('SELF_BLOCK: onBeforeRequest function called');
    if (currentUserID) {
        console.log('SELF_BLOCK: onBeforeRequest function > currentUserID found : ', currentUserID);
        if (doesURLIncludeTeamUserId(details.url, currentUserID) || details.url.includes('web/email/countopened')) {
            console.log('SELF_BLOCK: onBeforeRequest function > doesURLIncludeTeamUserId successful');
            let extractedUID = getUserIDToCompare(details.url);
            if (userIDsToBlock.includes(extractedUID) || extractedUID == oldShRef) {
                console.log('SELF_BLOCK: onBeforeRequest function > userIDsToBlock includes currentUserId');
                console.log('SELF_BLOCK: redirect complete');
                return {
                    redirectUrl:
                        'data:image/png;base64,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/GMzLdsAADhcaVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/Pgo8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjUtYzAyMSA3OS4xNTQ5MTEsIDIwMTMvMTAvMjktMTE6NDc6MTYgICAgICAgICI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgICAgICAgICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICAgICAgICAgICB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIKICAgICAgICAgICAgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIKICAgICAgICAgICAgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyIKICAgICAgICAgICAgeG1sbnM6ZXhpZj0iaHR0cDovL25zLmFkb2JlLmNvbS9leGlmLzEuMC8iPgogICAgICAgICA8eG1wOkNyZWF0b3JUb29sPkFkb2JlIFBob3Rvc2hvcCBDQyAoV2luZG93cyk8L3htcDpDcmVhdG9yVG9vbD4KICAgICAgICAgPHhtcDpDcmVhdGVEYXRlPjIwMTYtMDYtMTZUMTY6MTg6MjkrMDU6MzA8L3htcDpDcmVhdGVEYXRlPgogICAgICAgICA8eG1wOk1ldGFkYXRhRGF0ZT4yMDE2LTA2LTE2VDE2OjE4OjMwKzA1OjMwPC94bXA6TWV0YWRhdGFEYXRlPgogICAgICAgICA8eG1wOk1vZGlmeURhdGU+MjAxNi0wNi0xNlQxNjoxODozMCswNTozMDwveG1wOk1vZGlmeURhdGU+CiAgICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2UvcG5nPC9kYzpmb3JtYXQ+CiAgICAgICAgIDx4bXBNTTpJbnN0YW5jZUlEPnhtcC5paWQ6ODA4ZjI5MmEtY2E1ZC1mNzQxLTk5MGItZDc5NzhkMmMzMTAxPC94bXBNTTpJbnN0YW5jZUlEPgogICAgICAgICA8eG1wTU06RG9jdW1lbnRJRD54bXAuZGlkOjgwOGYyOTJhLWNhNWQtZjc0MS05OTBiLWQ3OTc4ZDJjMzEwMTwveG1wTU06RG9jdW1lbnRJRD4KICAgICAgICAgPHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD54bXAuZGlkOjgwOGYyOTJhLWNhNWQtZjc0MS05OTBiLWQ3OTc4ZDJjMzEwMTwveG1wTU06T3JpZ2luYWxEb2N1bWVudElEPgogICAgICAgICA8eG1wTU06SGlzdG9yeT4KICAgICAgICAgICAgPHJkZjpTZXE+CiAgICAgICAgICAgICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2UiPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPmNyZWF0ZWQ8L3N0RXZ0OmFjdGlvbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0Omluc3RhbmNlSUQ+eG1wLmlpZDo4MDhmMjkyYS1jYTVkLWY3NDEtOTkwYi1kNzk3OGQyYzMxMDE8L3N0RXZ0Omluc3RhbmNlSUQ+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDp3aGVuPjIwMTYtMDYtMTZUMTY6MTg6MjkrMDU6MzA8L3N0RXZ0OndoZW4+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDpzb2Z0d2FyZUFnZW50PkFkb2JlIFBob3Rvc2hvcCBDQyAoV2luZG93cyk8L3N0RXZ0OnNvZnR3YXJlQWdlbnQ+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgICAgICAgICA8L3JkZjpTZXE+CiAgICAgICAgIDwveG1wTU06SGlzdG9yeT4KICAgICAgICAgPHBob3Rvc2hvcDpDb2xvck1vZGU+MzwvcGhvdG9zaG9wOkNvbG9yTW9kZT4KICAgICAgICAgPHBob3Rvc2hvcDpJQ0NQcm9maWxlPnNSR0IgSUVDNjE5NjYtMi4xPC9waG90b3Nob3A6SUNDUHJvZmlsZT4KICAgICAgICAgPHRpZmY6T3JpZW50YXRpb24+MTwvdGlmZjpPcmllbnRhdGlvbj4KICAgICAgICAgPHRpZmY6WFJlc29sdXRpb24+NzIwMDAwLzEwMDAwPC90aWZmOlhSZXNvbHV0aW9uPgogICAgICAgICA8dGlmZjpZUmVzb2x1dGlvbj43MjAwMDAvMTAwMDA8L3RpZmY6WVJlc29sdXRpb24+CiAgICAgICAgIDx0aWZmOlJlc29sdXRpb25Vbml0PjI8L3RpZmY6UmVzb2x1dGlvblVuaXQ+CiAgICAgICAgIDxleGlmOkNvbG9yU3BhY2U+MTwvZXhpZjpDb2xvclNwYWNlPgogICAgICAgICA8ZXhpZjpQaXhlbFhEaW1lbnNpb24+MTwvZXhpZjpQaXhlbFhEaW1lbnNpb24+CiAgICAgICAgIDxleGlmOlBpeGVsWURpbWVuc2lvbj4xPC9leGlmOlBpeGVsWURpbWVuc2lvbj4KICAgICAgPC9yZGY6RGVzY3JpcHRpb24+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgCjw/eHBhY2tldCBlbmQ9InciPz77G4FdAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAASSURBVHjaYvj//z8AAAD//wMABf4C/l4RpL4AAAAASUVORK5CYII='
                };
            }
        } else {
            console.log('onBeforeRequest function > url doesn"t contain userid ', details.url);
        }
    } else {
        console.log('SELF_BLOCK_FAIL: onBeforeRequest function > currentUserID not found');
    }
}

function openGmailThread(notificationId) {
    if (!notificationData || !notificationData[notificationId]) {
        return;
    }
    const data = notificationData[notificationId];
    const campaignId = data.campaign_id;
    if (campaignId) {
        const urlToNavigateTo = mainApplicationEndPts[ENVIRONMENT] + 'campaigns/' + campaignId + '/view';
        chrome.tabs.create({ url: urlToNavigateTo });
    }
    const messageId = data.message_id;
    const userEmail = userIdEmailIdMapping[data.encUserId];
    if (userEmail && messageId) {
        const urlToNavigateTo = 'https://mail.google.com/mail/u/' + userEmail + '/#inbox/' + messageId;
        chrome.tabs.create({ url: urlToNavigateTo });
    }
}
