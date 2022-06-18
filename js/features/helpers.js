let PLATFORM_URLS = {
    QA: 'https://qaapi3.cultofpassion.com',
    NET: 'https://platform2.saleshandy.com',
    COM: 'https://platform.saleshandy.com',
    LEARNER: 'https://platform.lifeisgoodforlearner.com',
    DOER: 'https://platform.lifeisgoodfordoer.com',
    RISE_BY_LEARNING: 'https://platform.risebylearning.com',
    RISE_BY_HELPING: 'https://platform.risebyhelping.com',
    RISE_BY_HUSTLING: 'https://platform.risebyhustling.com'
};
let crossPlatformURL = PLATFORM_URLS[ENVIRONMENT];

let butterBarMsgInstance;
function getWaitingTimer() {
    return new Promise((resolve, reject) => {
        let timeleft = 2;
        var waitTimer = setInterval(function() {
            timeleft = timeleft - 1;
            if (timeleft <= 0) {
                clearInterval(waitTimer);
                resolve(true);
            }
        }, 1000);
    });
}

function checkToAndSequenceBothPresent(to, attachedSequenceId) {
    if (to.length <= 0 && attachedSequenceId) return false;
    return true;
}

function checkPresenceOfPropertyInObject(object, property) {
    let finalStatus = true;
    if (_.has(object, property)) {
        finalStatus = object[property] == '' ? false : true;
    } else {
        finalStatus = false;
    }
    return finalStatus;
}

function resetPluginForAccount(bReload = true) {
    let mainUserInfoObj = JSON.parse(localStorage.getItem('mainUserInfoObj')) || {};
    delete mainUserInfoObj[btoa(currentUserEmail)];
    sendMessageToBackground({
        userID: userPreferencesRes.id,
        startNotify: false,
        shref: userPreferencesRes.shref
    });
    window.localStorage.setItem('mainUserInfoObj', JSON.stringify(mainUserInfoObj));
    if (bReload) {
        window.location.href = `https://mail.google.com/mail/u/0/?authuser=${currentUserEmail}`;
    }
}

function absolutePosition(el) {
    var found,
        left = 0,
        top = 0,
        width = 0,
        height = 0,
        offsetBase = absolutePosition.offsetBase;
    if (!offsetBase && document.body) {
        offsetBase = absolutePosition.offsetBase = document.createElement('div');
        offsetBase.style.cssText = 'position:absolute;left:0;top:0';
        document.body.appendChild(offsetBase);
    }
    if (el && el.ownerDocument === document && 'getBoundingClientRect' in el && offsetBase) {
        var boundingRect = el.getBoundingClientRect();
        var baseRect = offsetBase.getBoundingClientRect();
        found = true;
        left = boundingRect.left - baseRect.left;
        top = boundingRect.top - baseRect.top;
        width = boundingRect.right - boundingRect.left;
        height = boundingRect.bottom - boundingRect.top;
    }
    return {
        found: found,
        left: left,
        top: top,
        width: width,
        height: height,
        right: left + width,
        bottom: top + height
    };
}

function debounce(func, wait, immediate) {
    // 'private' variable for instance
    // The returned function will be able to reference this due to closure.
    // Each call to the returned function will share this common timer.
    var timeout;

    // Calling debounce returns a new anonymous function
    return function() {
        // reference the context and args for the setTimeout function
        var context = this,
            args = arguments;

        // Should the function be called now? If immediate is true
        //   and not already in a timeout then the answer is: Yes
        var callNow = immediate && !timeout;

        // This is the basic debounce behaviour where you can call this
        //   function several times, but it will only execute once
        //   [before or after imposing a delay].
        //   Each time the returned function is called, the timer starts over.
        clearTimeout(timeout);

        // Set the new timeout
        timeout = setTimeout(function() {
            // Inside the timeout function, clear the timeout variable
            // which will let the next execution run when in 'immediate' mode
            timeout = null;

            // Check if the function already ran with the immediate flag
            if (!immediate) {
                // Call the original function with apply
                // apply lets you define the 'this' object as well as the arguments
                //    (both captured before setTimeout)
                func.apply(context, args);
            }
        }, wait);

        // Immediate mode and no wait timer? Execute the function..
        if (callNow) func.apply(context, args);
    };
}

function validateRegex(expression) {
    var isValid = true;
    try {
        new RegExp(expression);
    } catch (e) {
        isValid = false;
    }
    return isValid;
}

function defineNativeRouteIDs(sdk) {
    NativeListRouteIDs = sdk.Router.NativeListRouteIDs;
}

function hideDropUps() {
    let divsToClose = ['.dropup-content', '.seq-temp-dropup-container', '.schedule-dropup'];
    document.querySelectorAll('.activeBarIcon').forEach(oNode => {
        oNode.classList.remove('activeBarIcon');
    });
    divsToClose.forEach(divToClose => {
        let dropUpContents = document.querySelectorAll(divToClose);
        if (dropUpContents.length <= 0) return;
        [...dropUpContents].forEach(d => {
            d.style.display = 'none';
        });
    });
}

function openClosedComposeView(composeView) {
    tempThreadID = composeView.tempThreadID;
    tempDraftID = composeView.tempDraftID;
    let isInlineReply = composeView.isInlineReplyForm();
    let urlParamToOpen = isInlineReply ? tempThreadID.replace('#', '') : tempThreadID.replace('#', '') + '+' + tempDraftID.replace('#', '');
    let oURLParams = getURLParameters(window.location.href);
    let newURLForComposeBoxes;
    if (oURLParams && oURLParams.compose && !isInlineReply) {
        let alreadyOpenComposeBoxes = decode(oURLParams.compose);
        let newURLForComposeBoxes = alreadyOpenComposeBoxes;
        if (alreadyOpenComposeBoxes.indexOf(urlParamToOpen) === -1) {
            newURLForComposeBoxes = urlParamToOpen;
            newURLForComposeBoxes = encode(newURLForComposeBoxes);
            oURLParams.compose = newURLForComposeBoxes;
        }
    } else {
        oURLParams = oURLParams !== null ? oURLParams : {};
        newURLForComposeBoxes = encode(urlParamToOpen);
        oURLParams.compose = newURLForComposeBoxes;
    }
    let applicationURL = getCurrentGmailInstanceURL();
    let baseURL = isInlineReply ? applicationURL + '/#inbox/' + newURLForComposeBoxes : window.location.href.split('?')[0];
    newURL = makeURL(baseURL, oURLParams);
    window.location.href = newURL;
}

function highlightChanges(oNode) {
    oNode.classList.remove('highlightYellow');
    void oNode.offsetWidth;
    oNode.classList.add('highlightYellow');
}

function getURLParameters(sURL) {
    var oURLParams = {};
    sURL.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(notUsedParam, sParamKey, sParamValue) {
        oURLParams[sParamKey] = sParamValue;
    });
    return oURLParams;
}

function makeURL(sOriginURL, oURLParams) {
    // We'll need to stringify if we've been given an object
    // If we have a string, this is skipped.
    let sURLQureyParams = Object.keys(oURLParams)
        .map(function(sParamKey) {
            return encodeURIComponent(sParamKey) + '=' + encodeURIComponent(oURLParams[sParamKey]);
        })
        .join('&');

    return sOriginURL + '?' + sURLQureyParams;
}

function splitStringAtNthOccurrence(sStringToSplit, sDelimiter, iOccurrence) {
    let tokens;
    tokens = sStringToSplit.split(sDelimiter);
    return [tokens.slice(0, iOccurrence), tokens.slice(iOccurrence)].map(function(item) {
        return item.join(sDelimiter);
    });
}

function getCurrentGmailInstanceURL() {
    let applicationURL = document.querySelector("meta[name='application-url']");
    applicationURL = applicationURL && applicationURL.getAttribute('content');
    return applicationURL;
}

function GoBackToListView() {
    let timeleft = 1;
    let navigateInterval = setInterval(function() {
        if (timeleft-- > 0) {
            let GmailBackBtn = document.querySelector('div.T-I.J-J5-Ji.lS.T-I-ax7.mA');
            if (GmailBackBtn) {
                simulateClick(GmailBackBtn);
            }
        } else {
            clearInterval(navigateInterval);
        }
    }, 500);
}

/**
 * Simulate a click event.
 * @public
 * @param {Element} elem  the element to simulate a click on
 */
var simulateClick = function(elem) {
    // Create our event (with options)
    var down = new MouseEvent('mousedown', {
        bubbles: true,
        view: window,
        button: 0,
        buttons: 0,
        cancelBubble: false,
        cancelable: true,
        composed: true,
        which: 1,
        defaultPrevented: false,
        detail: 1
    });
    var up = new MouseEvent('mouseup', {
        bubbles: true,
        view: window,
        button: 0,
        buttons: 0,
        cancelBubble: false,
        cancelable: true,
        composed: true,
        which: 1,
        defaultPrevented: false,
        detail: 1
    });
    elem.dispatchEvent(down);
    elem.dispatchEvent(up);
};

function renderCrossPlatformModal(entity, composeView, origin) {
    if (composeView) {
        window.sessionStorage.setItem('activeComposeBoxID', composeView.composeBoxID);
    }
    let crossPlatformModalOptions;
    if (entity === 'documents' && origin === 'editor') {
        crossPlatformModalOptions = getCrossPlatformModalOptions(entity, 'editor');
        document.body.appendChild(crossPlatformModalOptions.el);
        return;
    } else {
        crossPlatformModalOptions = getCrossPlatformModalOptions(entity);
        crossPlatformModalView = Object.create(sdkMain).Widgets.showModalView(crossPlatformModalOptions);
        crossPlatformModalView.on('destroy', function() {
            getUserPreferences();
        });
    }

    let CrossModalContainer = crossPlatformModalView._modalViewDriver._modalContainerElement;
    let modalBtnContainer = CrossModalContainer.querySelector('.inboxsdk__modal_buttons');
    let closeBtnContainer = CrossModalContainer.querySelector('.inboxsdk__modal_close');
    const modalTopRow = CrossModalContainer.querySelector('.inboxsdk__modal_toprow');
    let modalContentContainer = CrossModalContainer.querySelector('.inboxsdk__modal_content');
    let modalContainer = CrossModalContainer.querySelector('.inboxsdk__modal_container');

    modalTopRow.classList.add('CrossHead');
    modalBtnContainer.classList.add('CrossBtnContainer');
    closeBtnContainer.classList.add('CrossCloseBtnContainer');
    modalContentContainer.classList.add('CrossMainContentContainer');
    modalContainer.classList.add('CrossMainContainer');
    closeBtnContainer.setAttribute('data-tooltip', 'Close');

    if (crossPlatformModalView) {
        let templateFrame = document.getElementById('tempFrame');
        templateFrame.closest('.inboxsdk__modal_container').style.padding = '0px';
    }
}

function getCrossPlatformModalOptions(entity, origin = 'composeview') {
    let crossPlatformModalOptions = {};
    let { auth_token } = getUserInfoFromLocal();
    let modal_el = getNewElement();
    modal_el.classList.add('crossPlatformModal', entity + 'CPModal');
    let crossPlatformIframe;
    if (origin === 'editor') {
        modal_el.classList.add('crossPlatformModal', entity + 'CPModal', 'cpModalFromEditor');
        crossPlatformIframe = `
                   <span class="close-crossplatform-popup" aria-label="Close" data-tooltip-delay="800" data-tooltip="Close" "></span>
                   <iframe
                       id="tempFrame"
                       src=${crossPlatformURL}/${entity}?auth_token=${auth_token}&app_source=CHROME_PLUGIN
                       width="100%" height="100%" scrolling="no">
                      You have to update your browser to use this feature.
                   </iframe>`;
    } else {
        crossPlatformIframe = `
                   <iframe
                       id="tempFrame"
                       src=${crossPlatformURL}/${entity}?auth_token=${auth_token}&app_source=CHROME_PLUGIN
                       width="100%" height="100%" scrolling="no">
                      You have to update your browser to use this feature.
                   </iframe>`;
    }
    modal_el.innerHTML = crossPlatformIframe;
    closeBtn = modal_el.querySelector('.close-crossplatform-popup');
    closeBtn &&
        closeBtn.addEventListener('click', event => {
            targetElement = event && event.target;
            let crossPlatformModal = targetElement.closest('.crossPlatformModal');
            crossPlatformModal && crossPlatformModal.parentElement && crossPlatformModal.parentElement.removeChild(crossPlatformModal);
        });
    crossPlatformModalOptions = {
        el: modal_el
    };
    return crossPlatformModalOptions;
}

TimeHandler = {
    roundingDefault: moment.relativeTimeRounding(),
    modify: function() {
        // Round relative time evaluation down
        moment.relativeTimeRounding(Math.floor);

        moment.relativeTimeThreshold('s', 60);
        moment.relativeTimeThreshold('m', 60);
        moment.relativeTimeThreshold('h', 24);
        moment.relativeTimeThreshold('d', 31);
        moment.relativeTimeThreshold('M', 12);
    },
    reset: function() {
        // back to default
        moment.relativeTimeRounding(TimeHandler.roundingDefault);
    },
    humanize: function(date) {
        // Make a fuzzy time
        let delta = Math.round((+new Date() - date) / 1000);
        let humanized;
        let second = 1,
            minute = second * 60,
            hour = minute * 60,
            day = hour * 24,
            week = day * 7,
            month = day * 30,
            year = month * 12;

        let years, months, weeks, days, hours, minutes, seconds;

        years = Math.floor(delta / year);
        new_delta = delta % year;
        months = Math.floor(new_delta / month);
        new_delta = new_delta % month;
        weeks = Math.floor(new_delta / week);
        new_delta = new_delta % week;
        days = Math.floor(new_delta / day);
        new_delta = new_delta % day;
        hours = Math.floor(new_delta / hour);
        new_delta = new_delta % hour;
        minutes = Math.floor(new_delta / minute);
        new_delta = new_delta % minute;

        if (delta < 30) {
            humanized = 'a few seconds ago';
        } else if (delta < minute) {
            humanized = delta + ' seconds ago';
        } else if (delta < 2 * minute) {
            humanized = 'a minute ago';
        } else if (delta < hour) {
            humanized = minutes + ' minutes ago';
        } else if (delta < day) {
            if (hours == 1) {
                humanized = (minutes > 0 ? '1 hour and ' + minutes + ' minutes' : 'an hour') + ' ago';
            } else {
                humanized = hours + ' hours' + (minutes > 0 ? ' and ' + minutes + ' minutes' : '') + ' ago';
            }
        } else {
            humanized = moment(date).fromNow();
        }

        return humanized;
    }
};

TimeHandler.modify();

function setSelectOption(selectObj, valueToSet) {
    for (var i = 0; i < selectObj.length; i++) {
        if (selectObj[i].id == valueToSet) {
            return selectObj[i].name;
        }
    }
    return 'Not_Found';
}

function areSHReadReceiptsOff(currentUserEmail) {
    let currentState = getReadReceiptStatus(currentUserEmail);
    return currentState === '1';
}

function getReadReceiptStatus(currentUserEmail) {
    let statusObject = localStorage.getItem('U_READ_RECEIPTS_OFF');
    statusObject = statusObject && JSON.parse(statusObject);
    return statusObject && statusObject[currentUserEmail];
}

function setReadReceiptStatus(status, currentUserEmail) {
    let statusObject = localStorage.getItem('U_READ_RECEIPTS_OFF');
    statusObject = (statusObject && JSON.parse(statusObject)) || {};
    statusObject[currentUserEmail] = status;
    localStorage.setItem('U_READ_RECEIPTS_OFF', JSON.stringify(statusObject));
}

function changeReadReceiptStatus() {
    let currentState = getReadReceiptStatus(currentUserEmail);

    if (currentState === '1') {
        setReadReceiptStatus('0', currentUserEmail);
    } else {
        setReadReceiptStatus('1', currentUserEmail);
    }
    let oData = {
        message: 'You need to reload Gmail for the changes to take effect.',
        message_title: 'Reload Gmail'
    };
    let popUpBtns = [
        {
            text: 'Reload now',
            orderHint: 0,
            type: 'PRIMARY_ACTION',
            onClick: e => {
                SHModalViewGlobal.close();
                reloadTab();
            }
        },
        {
            text: 'Later',
            orderHint: 1,
            onClick: e => {
                SHModalViewGlobal.close();
            }
        }
    ];
    SHPopup(oData, popUpBtns);
}

function reloadTab() {
    window.setTimeout(() => {
        window.location.reload();
    }, 1000);
}

function SHPopup(oData, popUpBtns) {
    let mainDiv = getNewElement();
    mainDiv.innerHTML = oData.message;
    title = oData.message_title;
    let modalOptions = {
        title: title,
        el: mainDiv,
        buttons: popUpBtns
    };
    SHModalViewGlobal = sdkMain.Widgets.showModalView(modalOptions);

    if (usingNewGmail) {
        let SHModalContainer = SHModalViewGlobal._modalViewDriver._modalContainerElement;
        let modalBtnContainer = SHModalContainer.querySelector('.inboxsdk__modal_buttons');
        let closeBtnContainer = SHModalContainer.querySelector('.inboxsdk__modal_close');
        const modalTopRow = SHModalContainer.querySelector('.inboxsdk__modal_toprow');
        let modalContentContainer = SHModalContainer.querySelector('.inboxsdk__modal_content');
        let modalContainer = SHModalContainer.querySelector('.inboxsdk__modal_container');

        modalTopRow.classList.add('ErrorHead');
        modalBtnContainer.classList.add('ErrorBtnContainer');
        closeBtnContainer.classList.add('ErrorCloseBtnContainer');
        modalContentContainer.classList.add('ErrorMainContentContainer');
        modalContainer.classList.add('ErrorMainContainer');
        closeBtnContainer.setAttribute('data-tooltip', 'Close');

        modalBtnContainer.style.setProperty('display', 'block', 'important');
        modalTopRow.style.setProperty('margin-top', '16px');
        modalBtnContainer.children[0].focus();
        [...modalBtnContainer.children].forEach(child => {
            child.style.setProperty('margin-left', '0', 'important');
            child.style.setProperty('margin-right', '10px', 'important');
            child.classList.add('GmailButtoncolour');
        });
    }
}

function showButterBarMsg(msg, time, type, buttonsArray) {
    let showForSeconds = time ? time : 4000;
    let butterBarMessageOptions = {
        priority: 1,
        html: msg,
        time: showForSeconds,
        hideOnViewChanged: false
    };
    if (type == 'forFetchFailed') {
        butterBarMessageOptions.hideOnViewChanged = false;
    }
    if (buttonsArray) {
        butterBarMessageOptions.buttons = buttonsArray;
    }
    butterBarMsgInstance = sdkMain.ButterBar.showMessage(butterBarMessageOptions);
    return butterBarMsgInstance;
}

function saveCaretPosition(context) {
    let selection = window.getSelection();
    let range = selection.getRangeAt(0);
    context && context.classList.add('hideSelection');
    range.setStart(context, 0);
    let len = range.toString().length;
    range.setEnd(context, 0);

    return function restore() {
        let pos = getTextNodeAtPosition(context, len);
        return pos;
    };
}

function getTextNodeAtPosition(root, index) {
    let lastNode = null;

    let treeWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, function next(elem) {
        if (index >= elem.textContent.length) {
            index -= elem.textContent.length;
            lastNode = elem;
            return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
    });
    let currentNode = treeWalker.nextNode();
    root && root.classList.remove('hideSelection');
    let isLastNode = index !== 0;
    let nodeToReturn = isLastNode ? currentNode : lastNode;
    return {
        currentNode: nodeToReturn,
        position: isLastNode ? index : (nodeToReturn && nodeToReturn.length) || 0,
        gmail_suggestion: currentNode
    };
}

function replaceSnippet(context, composeView) {
    let selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
        return;
    }
    let range = selection.getRangeAt(0);
    context && context.classList.add('hideSelection');
    range.setStart(context, 0);
    let len = range.toString().length;

    // let { currentNode, position, gmail_suggestion } = getTextNodeAtPosition(context, len);
    let { currentNode, position } = restoreRangePosition(context);
    if (!currentNode) {
        selection.removeAllRanges();
        context && context.classList.remove('hideSelection');
        return;
    }
    // // let isGmailSuggestion = getContentEditableStatus(gmail_suggestion && gmail_suggestion.parentElement);
    // // if (isGmailSuggestion) {
    // //     // return;
    // // }
    let textToMatch = currentNode.textContent;
    if (!currentNode.textContent && position === 0) {
        textToMatch = currentNode.wholeText;
        if (!textToMatch) {
            let messageBody = composeView.getBodyElement();
            textToMatch = messageBody.innerText;
        }
        position = textToMatch.length;
    }
    textToMatch = textToMatch.substring(0, position);
    let words = textToMatch.split(/\s/g);
    let wordToMatch = words && words[words.length - 1] && words[words.length - 1].toLowerCase();
    wordToMatch = wordToMatch.replace(/\s/g, '');
    let templateID = templatesDataStore.snippetTemplateIDMapping && templatesDataStore.snippetTemplateIDMapping[wordToMatch];
    if (!templateID) {
        context && context.classList.remove('hideSelection');
        return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    let rangeEnd = position;
    let rangeStart = position - ((wordToMatch && wordToMatch.length) || 0);
    let newRange = document.createRange();
    if (currentNode.length === 0) {
        while (
            currentNode &&
            currentNode.previousSibling &&
            (textToMatch == currentNode.previousSibling.wholeText || textToMatch == currentNode.previousSibling.textContent)
        ) {
            currentNode = currentNode.previousSibling;
        }
    }
    if (currentNode.length === 0) {
        rangeStart = 0;
        rangeEnd = 0;
    }
    try {
        newRange.setStart(currentNode, rangeStart);
        newRange.setEnd(currentNode, rangeEnd);
    } catch (e) {
        newRange.setStart(currentNode, 0);
        newRange.setEnd(currentNode, 0);
    }
    let sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(newRange);
    getTemplateContent(templateID).then(res => {
        template_icon = 3;
        butterBarMsgInstance && butterBarMsgInstance.destroy();
        if (res.error) return onError(res);
        hideAllTemplatePopOut();
        finalTemplateID = res.id;
        if (!composeView.snippetsUsedCount) {
            composeView.snippetsUsedCount = 1;
        } else {
            composeView.snippetsUsedCount = composeView.snippetsUsedCount + 1;
        }
        if (!composeView.getSubject()) composeView.setSubject(res.subject);
        let messageBody = composeView.getBodyElement();
        pasteHtmlAtCaret(res.content, composeView);
        context && context.classList.remove('hideSelection');
        restoreRangePosition(messageBody);
        updateIncludedDocumentAndSpace(composeView);
    });
}

function pasteHtmlAtCaret(html, composeView) {
    var sel, range;
    html = html.concat('<br/>');
    let messageBody = composeView && composeView.getBodyElement();
    html = html.concat('<br/>');
    if (window.getSelection) {
        // IE9 and non-IE
        sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
            range = sel.getRangeAt(0);
            range.deleteContents();

            // Range.createContextualFragment() would be useful here but is
            // non-standard and not supported in all browsers (IE9, for one)
            var el = document.createElement('div');
            el.innerHTML = html;
            var frag = document.createDocumentFragment(),
                node,
                lastNode;
            while ((node = el.firstChild)) {
                lastNode = frag.appendChild(node);
            }
            range.insertNode(frag);

            // Preserve the selection
            if (lastNode) {
                range = range.cloneRange();
                range.setStartAfter(lastNode);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
    } else if (document.selection && document.selection.type != 'Control') {
        // IE < 9
        document.selection.createRange().pasteHTML(html);
    }
    if ('createEvent' in document) {
        var chnageEvt = new Event('HTMLEvents');
        messageBody && messageBody.dispatchEvent(chnageEvt);
        var keydownEvt = new Event('HTMLEvents');
        messageBody && messageBody.dispatchEvent(keydownEvt);
        var pasteEvt = new Event('HTMLEvents');
        messageBody && messageBody.dispatchEvent(pasteEvt);
    } else {
        messageBody && messageBody.fireEvent('onchange');
    }
}
function getEmailAddressFromContact(contact) {
    return contact.emailAddress;
}

function deleteExtraRecipients(composeView) {
    let toRecipients = composeView.getToRecipients();
    let ccRecipients = composeView.getCcRecipients();
    let bccRecipients = composeView.getBccRecipients();

    toRecipients = toRecipients.map(getEmailAddressFromContact);
    ccRecipients = ccRecipients.map(getEmailAddressFromContact);
    bccRecipients = bccRecipients.map(getEmailAddressFromContact);

    let toCount = toRecipients.length;
    let ccCount = ccRecipients.length;
    let bccCount = bccRecipients.length;

    if (toCount > 50) {
        toRecipients = toRecipients.slice(0, 50);
        composeView.setToRecipients(toRecipients);
        composeView.setCcRecipients([]);
        composeView.setBccRecipients([]);
    } else if (ccCount > 50) {
        let ccEmailsToKeep = 50 - toCount;
        if (ccEmailsToKeep > 0) {
            ccRecipients = ccRecipients.slice(0, ccEmailsToKeep);
            composeView.setCcRecipients(ccRecipients);
        } else {
            composeView.setCcRecipients([]);
        }
        composeView.setBccRecipients([]);
    } else if (bccCount > 50) {
        let bccEmailsToKeep = 50 - toCount - ccCount;
        if (bccEmailsToKeep > 0) {
            bccRecipients = bccRecipients.slice(0, bccEmailsToKeep);
            composeView.setBccRecipients(bccRecipients);
        } else {
            composeView.setBccRecipients([]);
        }
    } else if (toCount + ccCount > 50) {
        let ccEmailsToKeep = 50 - toCount;
        if (ccEmailsToKeep > 0) {
            ccRecipients = ccRecipients.slice(0, ccEmailsToKeep);
            composeView.setCcRecipients(ccRecipients);
        } else {
            composeView.setCcRecipients([]);
        }
        composeView.setBccRecipients([]);
    } else if (toCount + bccCount > 50) {
        let bccEmailsToKeep = 50 - toCount - ccCount;
        if (bccEmailsToKeep > 0) {
            bccRecipients = bccRecipients.slice(0, bccEmailsToKeep);
            composeView.setBccRecipients(bccRecipients);
        } else {
            composeView.setBccRecipients([]);
        }
    } else if (ccCount + bccCount > 50) {
        let bccEmailsToKeep = 50 - ccCount;
        if (bccEmailsToKeep > 0) {
            bccRecipients = bccRecipients.slice(0, bccEmailsToKeep);
            composeView.setBccRecipients(bccRecipients);
        } else {
            composeView.setBccRecipients([]);
        }
    } else if (toCount + ccCount + bccCount > 50) {
        let bccEmailsToKeep = 50 - ccCount;
        if (bccEmailsToKeep > 0) {
            bccRecipients = bccRecipients.slice(0, bccEmailsToKeep);
            composeView.setBccRecipients(bccRecipients);
        } else {
            composeView.setBccRecipients([]);
        }
    }
}

function isCharacterKeyPress() {
    if (typeof event.which == 'undefined') {
        // This is IE, which only fires keypress events for printable keys
        return true;
    } else if (typeof event.which == 'number' && event.which > 0) {
        // In other browsers except old versions of WebKit, event.which is
        // only greater than zero if the keypress is a printable key.
        // We need to filter out backspace and ctrl/alt/meta key combinations
        return event.key && event.key.length === 1;
    }
    return false;
}

function getContentEditableStatus(element, counter = 0) {
    if (counter > 5) {
        return false;
    }
    if (element && element.contentEditable === 'inherit') {
        return getContentEditableStatus(element.parentElement, ++counter);
    }
    return element && element.contentEditable === 'false';
}

// node_walk: walk the element tree, stop when func(node) returns false
function node_walk(node, func) {
    var result = func(node);
    for (node = node.firstChild; result !== false && node; node = node.nextSibling) result = node_walk(node, func);
    return result;
}

function saveRangePosition(textArea) {
    let selection = window.getSelection();
    let range;
    if (selection && selection.rangeCount === 0) {
        return;
    }
    range = selection.getRangeAt(0);
    let rangeStartContainer = range.startContainer,
        rangeEndContainer = range.endContainer;

    let startNodeIndexes = [];
    while (rangeStartContainer !== null && rangeStartContainer !== textArea) {
        startNodeIndexes.push(getNodeIndex(rangeStartContainer));
        rangeStartContainer = rangeStartContainer.parentNode;
    }
    let endNodeIndexes = [];
    while (rangeEndContainer !== null && rangeEndContainer !== textArea) {
        endNodeIndexes.push(getNodeIndex(rangeEndContainer));
        rangeEndContainer = rangeEndContainer.parentNode;
    }

    window.rangePosition = { sC: startNodeIndexes, sO: range.startOffset, eC: endNodeIndexes, eO: range.endOffset };
}

function restoreRangePosition(textArea) {
    textArea.focus();
    var sel = window.getSelection(),
        range = sel.getRangeAt(0);
    var rpStartContainerLen,
        rpStartContainer,
        rangeStartContainer = textArea,
        rangeEndContainer = textArea;
    let rangePosition = window.rangePosition;

    if (rangePosition && rangePosition.sC && rangePosition.eC) {
        rpStartContainer = rangePosition.sC;
        rpStartContainerLen = rpStartContainer.length;
        while (rpStartContainerLen--)
            rangeStartContainer =
                rangeStartContainer &&
                rangeStartContainer.childNodes &&
                rangeStartContainer.childNodes[rpStartContainer[rpStartContainerLen]];
        rpStartContainer = rangePosition.eC;
        rpStartContainerLen = rpStartContainer.length;
        while (rpStartContainerLen--)
            rangeEndContainer = rangeEndContainer && rangeEndContainer.childNodes[rpStartContainer[rpStartContainerLen]];

        if (rpStartContainer && rangeEndContainer) {
            try {
                range.setStart(rangeStartContainer, rangePosition.sO);
                range.setEnd(rangeEndContainer, rangePosition.eO);
            } catch (e) {}
            sel.removeAllRanges();
            sel.addRange(range);
            let len = range.toString().length;
            return {
                currentNode: range.startContainer || range.endContainer || range.commonAncestorContainer,
                position: rangePosition.sO || rangePosition.eO || 0
            };
        }
    }
}

function getNodeIndex(n) {
    var i = 0;
    while ((n = n && n.previousSibling)) i++;
    return i;
}
