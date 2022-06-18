let getCaretPosition;
template_icon = 0;
function setupQuickTeamplates(composeView) {
    getSnippetTemplatesMapping();
    let composeBody = composeView.getElement();
    let messageBody = composeView.getBodyElement();
    let iconAlreadyExists =
        composeBody.querySelector('.QuickTeamplatesContainer') && composeBody.querySelector('.QuickTeamplatesContainer').length > 0;
    if (iconAlreadyExists) {
        return;
    }
    setUpHideOnOutsideClick();
    composeBody.addEventListener('keyup', keyUpToggleTemplatePopOut, true);
    composeBody.addEventListener('keydown', keyDownToggleTemplatePopOut, true);
    let node = document.createElement('DIV'); // Create a <div> node
    let tableNode = composeBody && composeBody.querySelector('table.iN');
    node.classList.add('QuickTeamplatesContainer');
    if(showInsertTemplateIcon){
        node.innerHTML = `<div data-tippy='Browse templates (Ctrl+Space)' class='stickyTemplateIconContainer'></div>`;
        let stickyTemplateIconContainer = node.querySelector('.stickyTemplateIconContainer');
        stickyTemplateIconContainer.addEventListener('click', toggleTemplatePopOut);
    }
    if (tableNode) {
        tableNode.parentNode.insertBefore(node, tableNode);
        if(showInsertTemplateIcon){
            tippy('.stickyTemplateIconContainer', {
                theme: 'google',
                content(reference) {
                    const container = document.createElement('div');
                    if (reference.classList.contains('templateIconClose')) {
                        const node = `Close`;
                        container.innerHTML = node;
                    } else if (reference.classList.contains('stickyTemplateIconContainer')) {
                        const node = `Browse templates (Ctrl+Space)`;
                        container.innerHTML = node;
                    }
                    return container;
                },
                onTrigger: function(tippyInstance, event) {
                    let reference = tippyInstance.reference;
                    if (reference.classList.contains('templateIconClose')) {
                        tippyInstance.setContent('Close');
                    } else if (reference.classList.contains('stickyTemplateIconContainer')) {
                        tippyInstance.setContent('Browse templates (Ctrl+Space)');
                    }
                }
            });
        }
    }
}

function toggleTemplatePopOut(event) {
    template_icon = 0;
    event && event.stopImmediatePropagation();
    let targetNode = event && event.target;
    let container_node = targetNode && targetNode.closest('.inboxsdk__compose');
    let section;
    let popOutNode = container_node && container_node.querySelector('.QuickTeamplatesPopOut');
    if(event.ctrlKey && event.code === 'Space'){
        template_icon = 1;
    } else if(!getNodeIfClicked(targetNode, 'sh_toolbar_option') && !event.ctrlKey && event.code !== 'Space'){
        template_icon = 2;
    }
    if (showInsertTemplateIcon && getNodeIfClicked(targetNode, 'sh_toolbar_option')) {
        targetNode = container_node.querySelector('.stickyTemplateIconContainer');
    }
    if (getNodeIfClicked(targetNode, 'note-insert-template')) {
        container_node = targetNode.closest('#CreateBodyCustom');
        section = 'templateModal';
    }
    let popOutAlreadyExists = popOutNode !== null;
    if (popOutAlreadyExists) {
        hideTemplatePopOut(popOutNode, targetNode);
    } else {
        hideAllTemplatePopOut();
        showTemplatePopOut(targetNode, container_node, section);
    }
}

function keyUpToggleTemplatePopOut(event) {
    if (event.ctrlKey) {
        switch (event.keyCode) {
            case KEY_NAME_CODE.SPACE:
                let targetNode = event && event.target;
                let composeBoxDiv = targetNode.closest('.inboxsdk__compose');
                let messageBody = composeBoxDiv && composeBoxDiv.querySelector("div[aria-label='Message Body']");
                saveRangePosition(messageBody);
                getCaretPosition = restoreRangePosition;
                toggleTemplatePopOut(event);
                event.preventDefault();
                event.stopImmediatePropagation();
                break;
        }
    }
}

function keyDownToggleTemplatePopOut(event) {
    if (event.ctrlKey) {
        switch (event.keyCode) {
            case KEY_NAME_CODE.SPACE:
                event.preventDefault();
                event.stopImmediatePropagation();
                break;
        }
    }
    switch (event.keyCode) {
        case KEY_NAME_CODE.TAB:
            let targetNode = event && event.target;
            let composeBoxDiv = targetNode.closest('.inboxsdk__compose');
            let messageBody = composeBoxDiv && composeBoxDiv.querySelector("div[aria-label='Message Body']");
            if (!targetNode || !targetNode.closest("div[aria-label='Message Body']")) {
                return;
            }
            saveRangePosition(messageBody);
            let composeBoxUniqueID = composeBoxDiv.id;
            let composeView = composeViews[composeBoxUniqueID];
            replaceSnippet(messageBody, composeView);
            break;
    }
}

function showTemplatePopOut(targetNode, container_node, section) {
    getTemplates(0, 0);
    let popOutNode = document.createElement('DIV'); // Create a <div> node
    let bIsTempateModalRequest = false;
    if (section && section === 'templateModal') {
        bIsTempateModalRequest = true;
    }
    popOutNode.classList.add('QuickTeamplatesPopOut');
    renderHomeView(popOutNode, bIsTempateModalRequest);

    getTemplateCounts(popOutNode);
    if (bIsTempateModalRequest) {
        container_node.append(popOutNode);
        popOutNode.classList.add('templateModalBody');
        new Popper(targetNode, popOutNode, {
            placement: 'bottom',
            positionFixed: true,
            modifiers: {
                offset: {
                    enabled: true,
                    offset: '0,5'
                },
                preventOverflow: {
                    boundariesElement: 'viewport'
                }
            }
        });
    } else {
        container_node.append(popOutNode);
        switchCreateAndSaveButton(popOutNode);
        adjustTemplatePopOut(targetNode);
    }
    addPopoutEventListners(popOutNode);
    if (showInsertTemplateIcon && !targetNode.classList.contains('stickyTemplateIconContainer')) {
        targetNode = container_node.querySelector('.stickyTemplateIconContainer');
    }
    let searchInput = popOutNode && popOutNode.querySelector('.QuickTemplateSearch');
    if (searchInput && !(event.altKey && event.ctrlKey)) {
        searchInput.focus();
    }
    if(showInsertTemplateIcon){
        targetNode && (targetNode.innerHTML = 'BETA');
        targetNode && targetNode.classList.add('templateIconClose');
    }
}

function adjustTemplatePopOut(targetNode) {
    let composeBoxDiv = targetNode.closest('.inboxsdk__compose');
    let popOutNode = composeBoxDiv && composeBoxDiv.querySelector('.QuickTeamplatesPopOut');

    let compose_rect = absolutePosition(composeBoxDiv);
    let isInlineReply = composeBoxDiv && composeBoxDiv.classList.contains('inboxsdk__compose_inlineReply');

    let messageBody = composeBoxDiv.querySelector("div[aria-label='Message Body']");
    let messageBody_rect = absolutePosition(messageBody);

    let popout_rect = absolutePosition(popOutNode);

    let top = 'unset',
        right = 'unset',
        bottom = 'unset',
        left = 'unset';
    if (getCaretPosition) {
        let caretPosition = getCaretPosition(messageBody);
        var currentNode, position;
        if(caretPosition){
            currentNode = caretPosition.currentNode;
            position = caretPosition.position;
        } else {
            currentNode = messageBody;
            position = 0;
        }
        saveRangePosition(messageBody);
        getCaretPosition = undefined;
        currentNode = currentNode ? currentNode : messageBody;
        let sh_temp = document.createElement('span');
        currentNode && currentNode.parentNode.insertBefore(sh_temp, currentNode);
        sh_temp.appendChild(currentNode);
        let sh_temp_rect = absolutePosition(sh_temp);
        while (sh_temp.firstChild) {
            sh_temp.parentNode.insertBefore(sh_temp.firstChild, sh_temp);
        }
        sh_temp.parentNode.removeChild(sh_temp);
        if (messageBody === currentNode) {
            sh_temp_rect.bottom = sh_temp_rect.top + 22;
        }
        let char_width = currentNode && currentNode.length !== undefined ? sh_temp_rect.width / (currentNode.length + 1) : 5;
        if (popout_rect.height < compose_rect.bottom - sh_temp_rect.bottom) {
            bottom = compose_rect.bottom - sh_temp_rect.bottom - popout_rect.height + 27;
        } else {
            bottom = compose_rect.bottom - sh_temp_rect.bottom;
        }
        if (popout_rect.width < compose_rect.width - (messageBody_rect.left - compose_rect.left + sh_temp_rect.width)) {
            left = sh_temp_rect.left + (messageBody_rect.left - 2 * compose_rect.left) + char_width * position;
        } else {
            // left = sh_temp_rect.left + (messageBody_rect.left - 2 * compose_rect.left) - popout_rect.width + char_width * position + 80;
            left = messageBody_rect.left - compose_rect.left;
            // bottom = bottom - 20;
        }
        if (popout_rect.width > messageBody_rect.width - left) {
            left = messageBody_rect.left - compose_rect.left + 'px';
            bottom = bottom - 35;
        }
        if (isInlineReply) {
            bottom += 20;
            left -= 70;
        }
        bottom = (bottom > 0 ? bottom : compose_rect.bottom - sh_temp_rect.bottom) + 'px';
        left = (left > 0 ? left : 0) + 'px';
    } else {
        new Popper(targetNode, popOutNode, {
            placement: 'bottom-end',
            positionFixed: true,
            modifiers: {
                offset: {
                    enabled: true,
                    offset: '0,5'
                }
            }
        });
        return;
    }
    Object.assign(popOutNode.style, {
        top: top,
        right: right,
        bottom: bottom,
        left: left
    });
}

function hideTemplatePopOut(popOutNode, targetNode) {
    let composeBox = popOutNode.closest('.inboxsdk__compose');
    let composeBoxUniqueID = composeBox && composeBox.id;
    let composeView = composeViews[composeBoxUniqueID];
    let messageBody = composeView && composeView.getBodyElement();
    messageBody && restoreRangePosition(messageBody);
    if(showInsertTemplateIcon){
        if (!targetNode) {
            targetNode = composeBox && composeBox.querySelector('.stickyTemplateIconContainer');
        }
        if (targetNode && !targetNode.classList.contains('templateIconClose')) {
            targetNode = composeBox && composeBox.querySelector('.stickyTemplateIconContainer');
        }
        targetNode && (targetNode.innerHTML = '');
        targetNode && targetNode.classList.remove('templateIconClose');    
    }
    popOutNode.parentNode.removeChild(popOutNode);
}

function hideAllTemplatePopOut() {
    Array.from(document.querySelectorAll('.QuickTeamplatesPopOut')).forEach(popOutNode => {
        let composeBox = popOutNode.closest('.inboxsdk__compose');
        let composeBoxUniqueID = composeBox && composeBox.id;
        let composeView = composeViews[composeBoxUniqueID];
        let messageBody = composeView && composeView.getBodyElement();
        messageBody && restoreRangePosition(messageBody);
        popOutNode.parentNode.removeChild(popOutNode);
    });
    if(showInsertTemplateIcon){
        Array.from(document.querySelectorAll('.stickyTemplateIconContainer')).forEach(iconContainer => {
            iconContainer && (iconContainer.innerHTML = '');
            iconContainer.classList.remove('templateIconClose');
        });
    }
}

function hideTemplatePopOutIfOpen(event) {
    if (document.querySelector('.inboxsdk__modal_fullscreen') !== null && document.querySelector('#CreateBodyCustom') === null) {
        return;
    }
    Array.from(document.querySelectorAll('.QuickTeamplatesPopOut')).forEach(oPopOutNode => {
        if (event && event.target && !oPopOutNode.contains(event.target)) {
            hideTemplatePopOut(oPopOutNode);
        }
    });
    let editorNode = document.querySelector('.note-editable');
    Array.from(document.querySelectorAll('.note-popover.note-link-popover, .note-popover.note-table-popover')).forEach(oPopoverNode => {
        if (event && event.target && !oPopoverNode.contains(event.target) && (!editorNode || !editorNode.contains(event.target))) {
            oPopoverNode && (oPopoverNode.style.display = 'none');
        }
    });
}

function setUpHideOnOutsideClick() {
    document.removeEventListener('click', hideTemplatePopOutIfOpen);
    document.addEventListener('click', hideTemplatePopOutIfOpen);
}

function renderHomeView(PopOutBodyEle, bIsTempateModalRequest = false) {
    PopOutBodyEle.innerHTML = `
<div class='QuickTeamplatesPopOutBody'>
    <div class='QuickTemplatePopOutSection header'>
        <div class="QuickTemplateNavIcon SearchIcon"></div>
        <input class='QuickTemplateSearch' type="text" autocomplete="off" name="search" placeholder="Search all templates..." />
        <span class="QuickTemplateDivider"></span>
        <span class="QuickTemplateFilter"></span>
    </div>
    <div class="QuickTemplatePopOutSection SHProgressbar invisible">
        <div class="line"></div>
        <div class="subline inc"></div>
        <div class="subline dec"></div>
    </div>
    <div class='QuickTemplatePopOutSection body'>
        <div class='TeamplatesSearchContainer hidden'>
        </div>
    </div>
    ${
        bIsTempateModalRequest
            ? ''
            : `<div class="QuickTemplatePopOutSection footer">
                <div tabindex="0" class="QuickTemplateBtn2 SaveBtn">
                    + Save template
                </div>
                <div tabindex="0" class="QuickTemplateBtn2 CreateBtn">
                    + Create template
                </div>
            </div>`
    }
    
</div>`;

    let serachInput = PopOutBodyEle.querySelector('.QuickTemplateSearch');
    let QuickTeamplatesPopOutBody = serachInput.closest('.QuickTeamplatesPopOutBody');
    let QuickTemplateFolderSlider = QuickTeamplatesPopOutBody && QuickTeamplatesPopOutBody.querySelector('.QuickTemplateFolderSlider');
    QuickTemplateFolderSlider && QuickTemplateFolderSlider.classList.add('hidden');
    serachInput && serachInput.addEventListener('input', onSearchInput);
    serachInput && serachInput.addEventListener('focus', onSearchFocus, true);
    serachInput && serachInput.addEventListener('blur', onSearchBlur, true);
    let homeIcon = PopOutBodyEle.querySelector('.QuickTemplateFilter');
    homeIcon && homeIcon.addEventListener('click', navigateHome);
}

function onSearchInput(event) {
    event.stopImmediatePropagation();
    abortTemplatesSearchRequest();
    let targetNode = event.target;
    let QuickTeamplatesPopOutBody = targetNode.closest('.QuickTeamplatesPopOutBody');
    let serachInput = QuickTeamplatesPopOutBody && QuickTeamplatesPopOutBody.querySelector('.QuickTemplateSearch');
    let searchText = serachInput && serachInput.value;
    let QuickTemplateFolderSlider = QuickTeamplatesPopOutBody && QuickTeamplatesPopOutBody.querySelector('.QuickTemplateFolderSlider');
    let QuickTemplateNavIcon = QuickTeamplatesPopOutBody.querySelector('.QuickTemplateNavIcon');
    let searchContainer = QuickTeamplatesPopOutBody && QuickTeamplatesPopOutBody.querySelector('.TeamplatesSearchContainer');
    searchContainer.innerHTML = '';
    if (searchText && searchText.length > 2) {
        QuickTemplateFolderSlider && QuickTemplateFolderSlider.classList.add('hidden');
        QuickTemplateNavIcon && QuickTemplateNavIcon.classList.add('CloseSearchIcon');
        searchContainer && searchContainer.classList.remove('hidden');
        if (templatesDataStore.allTemplatesTotalRecords > 80) {
            window.fetchTemplatesDataTimeOut = setTimeout(() => {
                getTemplates(0, 1, targetNode, searchText, false, searchContainer);
            }, 1000);
            return;
        }
        filterTemplates(searchText, searchContainer);
    } else {
        QuickTemplateFolderSlider && QuickTemplateFolderSlider.classList.remove('hidden');
        QuickTemplateNavIcon && QuickTemplateNavIcon.classList.remove('CloseSearchIcon');
        searchContainer && searchContainer.classList.add('hidden');
        serachInput && serachInput.focus();
    }
}

function abortTemplatesSearchRequest() {
    if (window.fetchTemplatesDataTimeOut) {
        window.clearTimeout(window.fetchTemplatesDataTimeOut);
    }
    let abortControllerName = 'fetchTemplatesData';
    let oRequestBody = {
        action: 'callFunction',
        function: 'abortPostData',
        bDontWaitForResponse: true,
        parameters: [abortControllerName]
    };
    sendMessageToBackgroundPromise(oRequestBody);
}

function onSearchFocus(event) {
    event.stopImmediatePropagation();
    let serachInput = event.target;
    let QuickTeamplatesPopOutBody = serachInput.closest('.QuickTeamplatesPopOutBody');
    let QuickTemplatePopOutHeaderSection =
        QuickTeamplatesPopOutBody && QuickTeamplatesPopOutBody.querySelector('.QuickTemplatePopOutSection.header');
    QuickTemplatePopOutHeaderSection && QuickTemplatePopOutHeaderSection.classList.add('blueBorder');
}

function onSearchBlur(event) {
    event.stopImmediatePropagation();
    let serachInput = event.target;
    let QuickTeamplatesPopOutBody = serachInput.closest('.QuickTeamplatesPopOutBody');
    let QuickTemplatePopOutHeaderSection =
        QuickTeamplatesPopOutBody && QuickTeamplatesPopOutBody.querySelector('.QuickTemplatePopOutSection.header');
    QuickTemplatePopOutHeaderSection && QuickTemplatePopOutHeaderSection.classList.remove('blueBorder');
}

function filterTemplates(sSearchString, searchContainer, oData) {
    sSearchString = sSearchString.toLowerCase();
    sSearchString = sSearchString.split(' ').reduce((acc, item, index) => {
        if (item !== '') {
            if (index > 0) {
                acc.push(acc[index - 1] + ' ' + item);
            }
            acc.push(item);
        }
        return acc;
    }, []);
    sSearchString = sSearchString.sort(function(str1, str2) {
        return str2.length - str1.length;
    });

    let matches = {
        matched: [],
        notMatched: oData ? oData : templatesDataStore.allTemplatesData80
    };
    let searchResults = sSearchString.reduce((matches, textToMacth) => {
        if (textToMacth !== '') {
            let oTemplatesToCheck = matches.notMatched;
            matches.notMatched = [];
            oTemplatesToCheck &&
                oTemplatesToCheck.forEach(oTemplateItem => {
                    let template_title = oTemplateItem.title || '';
                    let template_subject = oTemplateItem.subject || '';
                    let template_title_match = template_title;
                    let template_subject_match = template_subject;
                    let sValueToMatch = template_title.toLowerCase() + ' ' + template_subject.toLowerCase();
                    template_title_match = template_title.replace(new RegExp(textToMacth, 'ig'), match => {
                        return "<span class='sh_highlight'>" + match + '</span>';
                    });
                    template_subject_match = template_subject.replace(new RegExp(textToMacth, 'ig'), match => {
                        return "<span class='sh_highlight'>" + match + '</span>';
                    });
                    oTemplateItem.title_modified = template_title_match;
                    oTemplateItem.subject_modified = template_subject_match;
                    if (new RegExp('\\b' + textToMacth + '\\b') && new RegExp('\\b' + textToMacth + '\\b').test(sValueToMatch)) {
                        matches.matched.push(oTemplateItem);
                    } else if (validateRegex('\\b' + textToMacth) && new RegExp('\\b' + textToMacth).test(sValueToMatch)) {
                        matches.matched.push(oTemplateItem);
                    } else if (validateRegex(textToMacth) && new RegExp(textToMacth).test(sValueToMatch)) {
                        matches.matched.push(oTemplateItem);
                    } else {
                        matches.notMatched.push(oTemplateItem);
                    }
                });
        }
        return matches;
    }, matches);

    let QuickTeamplatesPopOutBody = searchContainer.closest('.QuickTeamplatesPopOutBody');
    let QuickTemplateFolderSlider = QuickTeamplatesPopOutBody && QuickTeamplatesPopOutBody.querySelector('.QuickTemplateFolderSlider');
    QuickTemplateFolderSlider && QuickTemplateFolderSlider.classList.add('hidden');
    if (searchResults && searchResults.matched) {
        if (searchResults.matched.length === 0) {
            searchContainer.innerHTML = getNoTemplatesView('search');
        } else {
            searchContainer.innerHTML = oTemplatesListComplied({
                oTemplatesData: searchResults.matched,
                sView: 'search',
                sUserId: userPreferencesRes && userPreferencesRes.id
            });
            let first_node = searchContainer && searchContainer.querySelector('.TemplateContainer');
            first_node && first_node.focus();
            first_node && first_node.classList.add('Selected');
            setUpToolTips();
        }
    }
}

function navigateHome(event) {
    event.stopImmediatePropagation();
    let targetNode = event.target;
    let QuickTeamplatesPopOutBody = targetNode.closest('.QuickTeamplatesPopOutBody');
    let QuickTemplateNavIcon = QuickTeamplatesPopOutBody.querySelector('.QuickTemplateNavIcon');
    let oViewsContainer = QuickTeamplatesPopOutBody.querySelector('.QuickTemplateFolderViews');

    if (oViewsContainer) {
        let new_translate_x = 0;
        Array.from(oViewsContainer.querySelectorAll('.SingleView:not(:first-child)')).forEach(oSingleView =>
            oViewsContainer.removeChild(oSingleView)
        );
        updateNavWidth(oViewsContainer);
        QuickTemplateNavIcon && QuickTemplateNavIcon.classList.remove('NavigateBackIcon');
        oViewsContainer.style.transform = 'translateX(' + new_translate_x + 'px)';
    }
    let searchContainer = QuickTeamplatesPopOutBody && QuickTeamplatesPopOutBody.querySelector('.TeamplatesSearchContainer');
    if (!searchContainer || !searchContainer.classList.contains('hidden')) {
        let QuickTemplateFolderSlider = QuickTeamplatesPopOutBody && QuickTeamplatesPopOutBody.querySelector('.QuickTemplateFolderSlider');
        QuickTemplateFolderSlider && QuickTemplateFolderSlider.classList.remove('hidden');
        QuickTemplateNavIcon && QuickTemplateNavIcon.classList.remove('CloseSearchIcon');
        searchContainer && searchContainer.classList.add('hidden');
        let serachInput = QuickTeamplatesPopOutBody.querySelector('.QuickTemplateSearch');
        serachInput && (serachInput.value = '') && serachInput.focus();
    }
}

function addPopoutEventListners(oPopOutNode) {
    let oPopOutBodySection = oPopOutNode && oPopOutNode.querySelector('.QuickTeamplatesPopOutBody');
    oPopOutBodySection.removeEventListener('click', onPopoutItemClicked);
    oPopOutBodySection.addEventListener('click', onPopoutItemClicked);
    oPopOutBodySection.removeEventListener('mouseover', onPopoutItemMouseover);
    oPopOutBodySection.addEventListener('mouseover', onPopoutItemMouseover);
    oPopOutBodySection.removeEventListener('mouseout', onPopoutItemMouseout);
    oPopOutBodySection.addEventListener('mouseout', onPopoutItemMouseout);
    oPopOutBodySection.removeEventListener('keydown', onKeyDownPopup, true);
    oPopOutBodySection.addEventListener('keydown', onKeyDownPopup, true);
    oPopOutBodySection.removeEventListener('keyup', onKeyUpPopup, true);
    oPopOutBodySection.addEventListener('keyup', onKeyUpPopup, true);
}

function onKeyDownPopup(event) {
    let targetNode = event && event.target;
    let QuickTeamplatesPopOutBody = targetNode && targetNode.closest('.QuickTeamplatesPopOutBody');
    let lastSingleView = QuickTeamplatesPopOutBody && QuickTeamplatesPopOutBody.querySelector('.SingleView:last-child');
    let activeElement = lastSingleView && lastSingleView.querySelector('.Selected');
    let TeamplatesSearchContainer = QuickTeamplatesPopOutBody && QuickTeamplatesPopOutBody.querySelector('.TeamplatesSearchContainer');
    let searchInput = QuickTeamplatesPopOutBody && QuickTeamplatesPopOutBody.querySelector('.QuickTemplateSearch');
    if (
        (targetNode && targetNode.classList.contains('QuickTemplateSearch') && targetNode.value !== '') ||
        (TeamplatesSearchContainer && !TeamplatesSearchContainer.classList.contains('hidden'))
    ) {
        let bPerformEarlyExit = true;
        switch (event.keyCode) {
            case KEY_NAME_CODE.ESCAPE:
                targetNode.value = '';
                onSearchInput(event);
                event.preventDefault();
                event.stopImmediatePropagation();
                break;
            case KEY_NAME_CODE.DOWN_ARROW:
                if (TeamplatesSearchContainer && !TeamplatesSearchContainer.classList.contains('hidden')) {
                    activeElement =
                        TeamplatesSearchContainer.querySelector('.Selected') ||
                        TeamplatesSearchContainer.querySelector('.TemplateContainer');
                }
                activeElement && activeElement.focus();
                ArrowDownEvent(activeElement);
                event.preventDefault();
                event.stopImmediatePropagation();
                break;
            case KEY_NAME_CODE.UP_ARROW:
                if (TeamplatesSearchContainer && !TeamplatesSearchContainer.classList.contains('hidden')) {
                    activeElement =
                        TeamplatesSearchContainer.querySelector('.Selected') ||
                        TeamplatesSearchContainer.querySelector('.TemplateContainer');
                }
                activeElement && activeElement.focus();
                ArrowUpEvent(activeElement);
                event.preventDefault();
                event.stopImmediatePropagation();
                break;
            case KEY_NAME_CODE.DOWN_ARROW:
            case KEY_NAME_CODE.UP_ARROW:
            case KEY_NAME_CODE.ENTER:
            case KEY_NAME_CODE.SHIFT:
                bPerformEarlyExit = false;
                break;
            case KEY_NAME_CODE.RIGHT_ARROW:
                activeElement = document.activeElement;
                if (!activeElement.classList.contains('QuickTemplateSearch')) {
                    bPerformEarlyExit = false;
                }
                break;
            case KEY_NAME_CODE.TAB:
                bPerformEarlyExit = false;
                break;
            case KEY_NAME_CODE.BACKSPACE:
            case KEY_NAME_CODE.LEFT_ARROW:
                searchInput.focus();
                break;
            default:
                if (isCharacterKeyPress()) {
                    searchInput.focus();
                }
                break;
        }
        if (bPerformEarlyExit) {
            return;
        }
    }
    if (QuickTeamplatesPopOutBody) {
        if (
            !QuickTeamplatesPopOutBody.classList.contains('disableClicks') &&
            !QuickTeamplatesPopOutBody.classList.contains('loadingData')
        ) {
            if (TeamplatesSearchContainer && !TeamplatesSearchContainer.classList.contains('hidden')) {
                activeElement =
                    TeamplatesSearchContainer.querySelector('.Selected') || TeamplatesSearchContainer.querySelector('.TemplateContainer');
            } else {
                activeElement = lastSingleView && lastSingleView.querySelector('.Selected');
            }
            switch (event.keyCode) {
                case KEY_NAME_CODE.BACKSPACE:
                case KEY_NAME_CODE.LEFT_ARROW:
                    QuickTeamplatesPopOutBody.classList.add('disableClicks');
                    Array.from(QuickTeamplatesPopOutBody.querySelectorAll('.SingleView')).forEach(oSingleView => {
                        oSingleView.classList.add('HideScroll');
                    });
                    navigateBack(event);
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    break;
                case KEY_NAME_CODE.DOWN_ARROW:
                    if (document.activeElement.classList.contains('SaveBtn')) {
                        let CreateBtn = QuickTeamplatesPopOutBody && QuickTeamplatesPopOutBody.querySelector('.CreateBtn');
                        CreateBtn && CreateBtn.focus();
                        break;
                    } else if (document.activeElement.classList.contains('CreateBtn')) {
                        searchInput && searchInput.focus();
                        break;
                    } else if (document.activeElement.classList.contains('QuickTemplateSearch')) {
                        activeElement && activeElement.focus();
                        event.preventDefault();
                        event.stopImmediatePropagation();
                        break;
                    }
                    activeElement && activeElement.focus();
                    ArrowDownEvent(activeElement);
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    break;
                case KEY_NAME_CODE.UP_ARROW:
                    if (document.activeElement.classList.contains('SaveBtn')) {
                        activeElement && activeElement.focus();
                        break;
                    } else if (document.activeElement.classList.contains('CreateBtn')) {
                        let SaveBtn = QuickTeamplatesPopOutBody && QuickTeamplatesPopOutBody.querySelector('.SaveBtn');
                        SaveBtn && SaveBtn.focus();
                        if (!SaveBtn) {
                            activeElement && activeElement.focus();
                        }
                        break;
                    }
                    activeElement && activeElement.focus();
                    ArrowUpEvent(activeElement);
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    break;
                case KEY_NAME_CODE.SHIFT:
                case KEY_NAME_CODE.ENTER:
                    event.preventDefault();
                    event.stopImmediatePropagation();
                case KEY_NAME_CODE.DELETE:
                case KEY_NAME_CODE.RIGHT_ARROW:
                    break;
                case KEY_NAME_CODE.ESCAPE:
                    hideAllTemplatePopOut();
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    break;
                case KEY_NAME_CODE.TAB:
                    if (
                        document.activeElement.classList.contains('Selected') ||
                        document.activeElement.classList.contains('TemplateContainer') ||
                        document.activeElement.classList.contains('FolderContainer')
                    ) {
                        if (event.shiftKey) {
                            ArrowUpEvent(activeElement);
                        } else {
                            let SaveBtn = QuickTeamplatesPopOutBody && QuickTeamplatesPopOutBody.querySelector('.SaveBtn');
                            if (SaveBtn) {
                                SaveBtn.focus();
                            } else {
                                let CreateBtn = QuickTeamplatesPopOutBody && QuickTeamplatesPopOutBody.querySelector('.CreateBtn');
                                CreateBtn && CreateBtn.focus();
                            }
                        }
                        event.preventDefault();
                        event.stopImmediatePropagation();
                    } else if (event.shiftKey) {
                        let SaveBtn = QuickTeamplatesPopOutBody && QuickTeamplatesPopOutBody.querySelector('.SaveBtn');
                        if (
                            (SaveBtn && document.activeElement.classList.contains('SaveBtn')) ||
                            document.activeElement.classList.contains('CreateBtn')
                        ) {
                            activeElement =
                                lastSingleView &&
                                (lastSingleView.querySelector('.Selected') || lastSingleView.querySelector('.noTemplateFAQ'));
                            activeElement && activeElement.focus();
                            event.preventDefault();
                            event.stopImmediatePropagation();
                        } else if (document.activeElement.classList.contains('noTemplateFAQ')) {
                            searchInput.focus();
                            event.preventDefault();
                            event.stopImmediatePropagation();
                        }
                        break;
                    } else if (document.activeElement.classList.contains('QuickTemplateSearch')) {
                        if (TeamplatesSearchContainer && !TeamplatesSearchContainer.classList.contains('hidden')) {
                            activeElement =
                                TeamplatesSearchContainer.querySelector('.Selected') ||
                                TeamplatesSearchContainer.querySelector('.TemplateContainer');
                        } else {
                            activeElement =
                                lastSingleView &&
                                (lastSingleView.querySelector('.Selected') || lastSingleView.querySelector('.noTemplateFAQ'));
                        }
                        activeElement && activeElement.focus();
                        event.preventDefault();
                        event.stopImmediatePropagation();
                    } else if (document.activeElement.classList.contains('CreateBtn')) {
                        searchInput.focus();
                        event.preventDefault();
                        event.stopImmediatePropagation();
                    }
                    break;
                default:
                    searchInput = QuickTeamplatesPopOutBody && QuickTeamplatesPopOutBody.querySelector('.QuickTemplateSearch');
                    if (searchInput && !(event.altKey && event.ctrlKey)) {
                        if (isCharacterKeyPress()) {
                            searchInput.focus();
                        }
                    }
            }
            setTimeout(function() {
                QuickTeamplatesPopOutBody.classList.remove('disableClicks');
                Array.from(QuickTeamplatesPopOutBody.querySelectorAll('.SingleView')).forEach(oSingleView => {
                    oSingleView.classList.remove('HideScroll');
                });
            }, 350);
        } else {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    }
}

function onKeyUpPopup(event) {
    let targetNode = event && event.target;
    let QuickTeamplatesPopOutBody = targetNode && targetNode.closest('.QuickTeamplatesPopOutBody');
    let TeamplatesSearchContainer = QuickTeamplatesPopOutBody && QuickTeamplatesPopOutBody.querySelector('.TeamplatesSearchContainer');
    let searchInput = QuickTeamplatesPopOutBody && QuickTeamplatesPopOutBody.querySelector('.QuickTemplateSearch');
    if (
        (targetNode && targetNode.classList.contains('QuickTemplateSearch') && targetNode.value !== '') ||
        (TeamplatesSearchContainer && !TeamplatesSearchContainer.classList.contains('hidden'))
    ) {
        let bPerformEarlyExit = true;
        switch (event.keyCode) {
            case KEY_NAME_CODE.ESCAPE:
                searchInput.value = '';
                event.preventDefault();
                event.stopImmediatePropagation();
                onSearchInput(event);
                break;
            case KEY_NAME_CODE.ENTER:
                if (TeamplatesSearchContainer && !TeamplatesSearchContainer.classList.contains('hidden')) {
                    activeElement =
                        TeamplatesSearchContainer.querySelector('.Selected') ||
                        TeamplatesSearchContainer.querySelector('.TemplateContainer');
                }
                activeElement && activeElement.focus();
                insertTemplateContent(activeElement);
                event.preventDefault();
                event.stopImmediatePropagation();
                break;
            case KEY_NAME_CODE.RIGHT_ARROW:
                activeElement = document.activeElement;
                if (!activeElement.classList.contains('QuickTemplateSearch')) {
                    bPerformEarlyExit = false;
                }
                break;
            case KEY_NAME_CODE.ENTER:
            case KEY_NAME_CODE.DELETE:
            case KEY_NAME_CODE.EDIT_e:
            case KEY_NAME_CODE.ESCAPE:
            case KEY_NAME_CODE.TAB:
            case KEY_NAME_CODE.SHIFT:
                bPerformEarlyExit = false;
                break;
        }
        if (bPerformEarlyExit) {
            return;
        }
    }
    if (QuickTeamplatesPopOutBody) {
        if (
            !QuickTeamplatesPopOutBody.classList.contains('disableClicks') &&
            !QuickTeamplatesPopOutBody.classList.contains('loadingData')
        ) {
            let lastSingleView = QuickTeamplatesPopOutBody && QuickTeamplatesPopOutBody.querySelector('.SingleView:last-child');
            if (TeamplatesSearchContainer && !TeamplatesSearchContainer.classList.contains('hidden')) {
                activeElement =
                    TeamplatesSearchContainer.querySelector('.Selected') || TeamplatesSearchContainer.querySelector('.TemplateContainer');
            } else {
                activeElement = lastSingleView && lastSingleView.querySelector('.Selected');
            }
            // activeElement && activeElement.focus();
            switch (event.keyCode) {
                case KEY_NAME_CODE.RIGHT_ARROW:
                case KEY_NAME_CODE.ENTER:
                    onPopoutItemClicked(event);
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    // event.preventDefault();
                    // event.stopImmediatePropagation();
                    break;
                case KEY_NAME_CODE.DELETE:
                    deleteTheTemplate(event);
                    event.preventDefault();
                    break;
                case KEY_NAME_CODE.EDIT_e:
                    if (event.ctrlKey && event.altKey) {
                        editTheTemplate(event);
                        event.preventDefault();
                    }
                    break;
                case KEY_NAME_CODE.ESCAPE:
                    targetNode.value = '';
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    hideAllTemplatePopOut();
                    break;
            }
            setTimeout(function() {
                QuickTeamplatesPopOutBody.classList.remove('disableClicks');
                Array.from(QuickTeamplatesPopOutBody.querySelectorAll('.SingleView')).forEach(oSingleView => {
                    oSingleView.classList.remove('HideScroll');
                });
            }, 350);
        }
    }
}

function getNodeIfClicked(oClickedNode, sClassname) {
    return oClickedNode && oClickedNode.classList.contains(sClassname) ? oClickedNode : oClickedNode.closest('.' + sClassname);
}

function onPopoutItemClicked(event) {
    let targetNode = event && event.target;
    let oFolderNode = getNodeIfClicked(targetNode, 'FolderContainer');
    let closeSearchIcon = getNodeIfClicked(targetNode, 'CloseSearchIcon');
    let navigateBackIcon = getNodeIfClicked(targetNode, 'NavigateBackIcon');
    let FavoriteIcon = getNodeIfClicked(targetNode, 'TemplateFavourite');
    let DeleteIcon = getNodeIfClicked(targetNode, 'TemplateDelete');
    let EditIcon = getNodeIfClicked(targetNode, 'TemplateEdit');
    let TemplateContainer = getNodeIfClicked(targetNode, 'TemplateContainer');
    let SaveThisAsATemplate = getNodeIfClicked(targetNode, 'SaveBtn');
    let createANewTemplate = getNodeIfClicked(targetNode, 'CreateBtn');
    let QuickTeamplatesPopOutBody = targetNode && targetNode.closest('.QuickTeamplatesPopOutBody');

    if (QuickTeamplatesPopOutBody) {
        if (
            !QuickTeamplatesPopOutBody.classList.contains('disableClicks') &&
            !QuickTeamplatesPopOutBody.classList.contains('loadingData')
        ) {
            if (oFolderNode) {
                QuickTeamplatesPopOutBody.classList.add('disableClicks');
                Array.from(QuickTeamplatesPopOutBody.querySelectorAll('.SingleView')).forEach(oSingleView => {
                    oSingleView.classList.add('HideScroll');
                });
                navigateIn(oFolderNode);
            } else if (closeSearchIcon) {
                let serachInput = QuickTeamplatesPopOutBody.querySelector('.QuickTemplateSearch');
                serachInput && (serachInput.value = '');
                onSearchInput(event);
            } else if (navigateBackIcon) {
                QuickTeamplatesPopOutBody.classList.add('disableClicks');
                Array.from(QuickTeamplatesPopOutBody.querySelectorAll('.SingleView')).forEach(oSingleView => {
                    oSingleView.classList.add('HideScroll');
                });
                navigateBack(event);
            } else if (DeleteIcon) {
                deleteTheTemplate(event);
            } else if (EditIcon) {
                editTheTemplate(event);
            } else if (FavoriteIcon) {
                FavouriteTemplate(event);
            } else if (createANewTemplate) {
                createANewTemplateDialog(event);
                hideAllTemplatePopOut();
            } else if (SaveThisAsATemplate) {
                SaveEmailAsTemplateDialog(SaveThisAsATemplate);
            } else if (EditIcon) {
                editTheTemplate(event);
            } else if (TemplateContainer) {
                insertTemplateContent(TemplateContainer);
            }
            setTimeout(function() {
                QuickTeamplatesPopOutBody.classList.remove('disableClicks');
                Array.from(QuickTeamplatesPopOutBody.querySelectorAll('.SingleView')).forEach(oSingleView => {
                    oSingleView.classList.remove('HideScroll');
                });
            }, 350);
        }
    }
}

function ArrowUpEvent(target) {
    if(!target) return;
    let previous_node = target && target.previousElementSibling;
    if (previous_node) {
        target.classList.remove('Selected');
        previous_node && previous_node.classList.add('Selected');
        previous_node && previous_node.focus();
    } else if (
        (target && target.classList.contains('Selected')) ||
        (target && target.classList.contains('TemplateContainer')) ||
        (target && target.classList.contains('FolderContainer'))
    ) {
        let QuickTeamplatesPopOutBody = target && target.closest('.QuickTeamplatesPopOutBody');
        let serachInput = QuickTeamplatesPopOutBody.querySelector('.QuickTemplateSearch');
        serachInput.focus();
    }
}

function CreatePopUpFolderDisplay(SingleView) {
    let ExistingPopUp = SingleView.querySelector('.template-modal-folder-dropdown');
    if (ExistingPopUp) {
        if (ExistingPopUp.classList.contains('hidden')) {
            ExistingPopUp.classList.remove('hidden');
            let searchBox = ExistingPopUp.querySelector('.TemplateModalFolderSearch');
            searchBox.focus();
            return;
        } else {
            ExistingPopUp.classList.add('hidden');
            return;
        }
    }
}

function editTheTemplate(event) {
    let targetNode = event && event.target;
    let TemplateContainer = targetNode.closest('.TemplateContainer');
    let oTemplateData = TemplateContainer.getAttribute('data-template-id');
    let butterBarMsgInstance = showButterBarMsg('Fetching template', 1000);
    if (oTemplateData) {
        Promise.all([getTemplateContent(oTemplateData), getTeamList()]).then(function(values) {
            templateResponse = values[0];
            teamList = values[1];
            butterBarMsgInstance && butterBarMsgInstance.destroy();
            if (templateResponse.error) return onError(templateResponse);
            finalTemplateID = templateResponse.id;
            SHTemplateModal('update', templateResponse, teamList);
            let popUpView = document.querySelector('.inboxsdk__modal_container');
            let CreateTemplateBody = popUpView.querySelector('.template-modal-body');
            let shareTab = popUpView.querySelector('.template-modal-tab.share-tab');
            if (!templateResponse.is_template_owner) {
                CreateTemplateBody.setAttribute('is_template_owner', 'false');
                shareTab && shareTab.classList.add('LockonShared');
            }
            let openFolderId = (templateResponse && templateResponse.folder_id) || '0';
            let FolderSelect = popUpView.querySelector('.template-modal-select-container');
            openFolderId && FolderSelect.setAttribute('folder_id', openFolderId);
            let SelectedFolderName = FolderSelect.querySelector('.SelectedFolderName');
            SelectedFolderName.innerHTML = templateResponse.folder_name || 'All templates';
            let titileTemplateUpdate = popUpView.querySelector('.template-title-input');
            titileTemplateUpdate.value = templateResponse.title;
            let subjectTemplateUpdate = popUpView.querySelector('.template-subject-input');
            subjectTemplateUpdate.value = templateResponse.subject;
            let snippet = popUpView.querySelector('.template-shortcut-input');
            let snippetWrapper = popUpView.querySelector('.template-modal-input-wrapper');
            snippet.value = templateResponse.snippet;
            if (!templateResponse.is_template_owner) {
                FolderSelect.classList.add('LockonShared');
                snippet.classList.add('LockonShared');
                tippy(FolderSelect, {
                    content: 'Only the template owner can change the folder',
                    placement: 'bottom-start',
                    interactive: true,
                    maxWidth: 400
                });
                tippy(snippetWrapper, {
                    content: 'Only the template owner can edit the shortcut',
                    placement: 'bottom-end',
                    interactive: true,
                    maxWidth: 400
                });
                tippy(shareTab, {
                    content: 'Only the template owner can change the access permissions',
                    placement: 'bottom-start',
                    interactive: true,
                    maxWidth: 400,
                    triggerTarget: shareTab.parentNode
                });
                snippet.disabled = true;
            } else {
                tippy(snippetWrapper, {
                    content: 'Whitespace is not allowed as the shortcut',
                    placement: 'bottom',
                    interactive: false,
                    maxWidth: 400,
                    a11y: false
                });
            }
            $('#summernote').summernote('code', templateResponse.content);
            hideAllTemplatePopOut();
        });
    }
}

function ArrowDownEvent(target) {
    if(!target) return;
    let next_node = target && target.nextElementSibling;
    if (next_node) {
        target.classList.remove('Selected');
        next_node && next_node.classList.add('Selected');
        next_node && next_node.focus();
    } else if (
        target.classList.contains('Selected') ||
        target.classList.contains('TemplateContainer') ||
        target.classList.contains('FolderContainer')
    ) {
        let QuickTeamplatesPopOutBody = target && target.closest('.QuickTeamplatesPopOutBody');
        let footer = QuickTeamplatesPopOutBody && QuickTeamplatesPopOutBody.querySelector('.footer');
        let firstButton = footer && footer.firstElementChild;
        if (firstButton && firstButton.classList.contains('hidden')) firstButton = footer.lastElementChild;
        firstButton && firstButton.focus();
    }
}

function navigateIn(oFolderNode) {
    let sFolderID = oFolderNode && oFolderNode.getAttribute('data-folder-id');
    let sFolderName = oFolderNode && oFolderNode.getAttribute('data-folder-name');
    let isCategoryFolder = oFolderNode && oFolderNode.getAttribute('data-is-category-folder');
    let sFolderCategory = oFolderNode && oFolderNode.getAttribute('data-folder-category');
    sFolderCategory = sFolderCategory && sFolderCategory.toUpperCase();
    if (!sFolderID) {
        return;
    }
    let QuickTeamplatesPopOutBody = oFolderNode.closest('.QuickTeamplatesPopOutBody');
    let QuickTemplateNavIcon = QuickTeamplatesPopOutBody.querySelector('.QuickTemplateNavIcon');
    let SingleView = oFolderNode.closest('.SingleView');
    let oViewsContainer = QuickTeamplatesPopOutBody.querySelector('.QuickTemplateFolderViews');
    let [scaleX, skewY, skewX, scaleY, translateX, translateY] = window
        .getComputedStyle(oViewsContainer)
        .getPropertyValue('transform')
        .match(/(-?[0-9\.]+)/g) || [0, 0, 0, 0, 0, 0];

    if (SingleView && oViewsContainer) {
        let current_view_rect = absolutePosition(SingleView);
        let new_translate_x = Math.abs(Math.round(Math.abs(translateX) + current_view_rect.width));
        let oNextNode = `<div class="SingleView" data-open-folder-id=${sFolderID} data-open-folder-name='${sFolderName}'></div>`;
        if (new_translate_x % 271 == 0) {
            oViewsContainer.insertAdjacentHTML('beforeend', oNextNode);
            updateNavWidth(oViewsContainer);
            SingleView = oViewsContainer.querySelector('.SingleView:last-child');
            if (isCategoryFolder === 'true') {
                if (sFolderCategory === 'ALL') {
                    getTemplateFolders(1, SingleView, 'MainPopUp');
                } else {
                    getTemplates(sFolderID, 1, SingleView, undefined, false, undefined, sFolderCategory);
                }
            } else {
                getTemplates(sFolderID, 1, SingleView, undefined, false);
            }
            SingleView.addEventListener('scroll', lazyLoadMoreData);
            oViewsContainer.style.transform = 'translateX(-' + new_translate_x + 'px)';
            QuickTemplateNavIcon && QuickTemplateNavIcon.classList.add('NavigateBackIcon');
        }
    }
}

function navigateBack(event) {
    let targetNode = event.target;
    let QuickTeamplatesPopOutBody = targetNode.closest('.QuickTeamplatesPopOutBody');
    let TeamplatesSearchContainer = QuickTeamplatesPopOutBody && QuickTeamplatesPopOutBody.querySelector('.TeamplatesSearchContainer');
    // if (TeamplakeyuptesSearchContainer && !TeamplatesSearchContainer.classList.contains('hidden')) {
    //     let serachInput = QuickTeamplatesPopOutBody.querySelector('.QuickTemplateSearch');
    //     serachInput && (serachInput.value = '');
    //     onSearchInput(event);
    //     return;
    // }
    let QuickTemplateNavIcon = QuickTeamplatesPopOutBody.querySelector('.QuickTemplateNavIcon');
    let oViewsContainer = QuickTeamplatesPopOutBody.querySelector('.QuickTemplateFolderViews');
    let SingleView = oViewsContainer.lastElementChild;
    let [scaleX, skewY, skewX, scaleY, translateX, translateY] = window
        .getComputedStyle(oViewsContainer)
        .getPropertyValue('transform')
        .match(/(-?[0-9\.]+)/g) || [0, 0, 0, 0, 0, 0];

    if (SingleView && oViewsContainer) {
        let current_view_rect = absolutePosition(SingleView);
        let new_translate_x = Math.abs(Math.round(Math.abs(translateX) - current_view_rect.width));
        if (translateX < 0) {
            oViewsContainer.removeChild(oViewsContainer.lastChild);
            updateNavWidth(oViewsContainer);
            if (new_translate_x === 0) {
                QuickTemplateNavIcon && QuickTemplateNavIcon.classList.remove('NavigateBackIcon');
            } else {
                QuickTemplateNavIcon && QuickTemplateNavIcon.classList.add('NavigateBackIcon');
            }
            oViewsContainer.style.transform = 'translateX(-' + new_translate_x + 'px)';
            let selectedFolder = oViewsContainer.lastElementChild && oViewsContainer.lastElementChild.querySelector('.Selected');
            selectedFolder && selectedFolder.focus();
        }
    }
}

function updateNavWidth(oViewsContainer) {
    let oAllSingleViews = Array.from(oViewsContainer.querySelectorAll('.SingleView'));
    let width_factor = oAllSingleViews.length;
    if (width_factor > 0) {
        oViewsContainer.style.width = width_factor * 100 + '%';
        oAllSingleViews.forEach(oSingleView => {
            oSingleView.style.width = 100 / width_factor + '%';
        });
    }
}

function getTemplateFolders(page = 1, SingleView, identifier, openFolderId) {
    let userInfoObj = getUserInfoFromLocal();
    if (currentUserEmail && userInfoObj && userInfoObj.isPluginActivated && userInfoObj.auth_token) {
        let auth_token = userInfoObj.auth_token;
        let data = {
            auth_token: auth_token
        };
        let getTemplateFoldersURL = '/templates/folders/list?per_page=25&all=1' + (page ? '&page=' + page + '' : '');
        oRequestBody = {
            action: 'callFunction',
            function: 'getData',
            parameters: [getTemplateFoldersURL, data]
        };
        sendMessageToBackgroundPromise(oRequestBody).then(res => {
            if (identifier == 'MainPopUp') {
                let oPopOutBody = SingleView && SingleView.closest('.QuickTeamplatesPopOutBody');
                let oProgressBar = oPopOutBody && oPopOutBody.querySelector('.SHProgressbar');
                oProgressBar && oProgressBar.classList.remove('invisible');
                if (!res.error && auth_token) {
                    templatesDataStore.templatesFolderData = res && res.rows;
                    if (SingleView) {
                        SingleView.setAttribute('data-is-loading', false);
                        SingleView.setAttribute('data-folders-current-page', res.current_page);
                        SingleView.setAttribute('data-folders-total-pages', res.total_pages);
                        SingleView.insertAdjacentHTML('beforeend', oFoldersTemplateCompiled({ oFoldersData: res.rows }));
                        if (res.total_records !== undefined && res.total_records <= 4) {
                            getTemplates('0', 1, SingleView, undefined, true, undefined, undefined, res.total_records);
                            return;
                        }
                        oProgressBar && oProgressBar.classList.add('invisible');
                        oPopOutBody && oPopOutBody.classList.remove('loadingData');
                    }
                    let first_node = SingleView && SingleView.querySelector('.FolderContainer');
                    first_node && first_node.focus();
                    first_node && first_node.classList.add('Selected');
                } else {
                    onError(res);
                    oProgressBar && oProgressBar.classList.add('invisible');
                    oPopOutBody && oPopOutBody.classList.remove('loadingData');
                }
            }
        });
    }
}

function getSnippetTemplatesMappingRecur(data, page = 1, per_page, total_pages = 1) {
    if (page > total_pages) {
        templatesDataStore.snippetTemplateIDValues = templatesDataStore.snippetTemplateIDValuesStaging.reverse();
        templatesDataStore.snippetTemplateIDMapping = templatesDataStore.snippetTemplateIDValues.reduce(function(map, obj) {
            map[obj['snippet'] && obj['snippet'].toLowerCase()] = obj['id'];
            return map;
        }, {});
        return;
    }
    let getTemplateFoldersURL = '/templates/snippet-list?all=1&page=' + page + '&per_page=' + per_page;
    oRequestBody = {
        action: 'callFunction',
        function: 'getData',
        parameters: [getTemplateFoldersURL, data]
    };
    sendMessageToBackgroundPromise(oRequestBody).then(res => {
        if (!res.error && data.auth_token) {
            let response = (res && res.rows) || [];
            total_pages = res.total_pages;
            templatesDataStore.snippetTemplateIDValuesStaging = templatesDataStore.snippetTemplateIDValuesStaging.concat(response);
            getSnippetTemplatesMappingRecur(data, ++page, 50, total_pages);
        } else {
            onError(res);
            return false;
        }
    });
}

function getSnippetTemplatesMapping() {
    templatesDataStore.snippetTemplateIDValuesStaging = [];
    let userInfoObj = getUserInfoFromLocal();
    if (currentUserEmail && userInfoObj && userInfoObj.isPluginActivated && userInfoObj.auth_token) {
        let auth_token = userInfoObj.auth_token;
        let data = {
            auth_token: auth_token
        };
        getSnippetTemplatesMappingRecur(data, 1, 50);
    }
}

function hideCreateTemplateFolderSearchPopUp() {
    let popupBodyInst = document.querySelector('.template-modal-folder-dropdown');
    popupBodyInst && popupBodyInst.classList.add('hidden');
}

let oFoldersTemplateCreate = _.template(`
<div class="template-modal-folder-dropdown">
    <div class="SearchBoxCreateTemplate">
        <div class="SearchBoxCreateIcon"></div>
        <input class="TemplateModalFolderSearch" type="text" autocomplete="off" name="search" placeholder="Search Folders...">
    </div>
    <div class="template-modal-select">
        <% if(openFolderId === 0 || openFolderId === null) {%>
            <div value="a" class="optionFolder Selected" folder-name="My templates">
            <div class="template-modal-folder-icon template-modal-my-template-icon"></div>
            <div class="CreateTemplateFolderTitle" folder-id="0" folder-name="My templates">My templates</div>
            </div>
        <%} else {%>
            <div value="a" class="optionFolder" id="myTemplatesOption" folder-name="My templates">
            <div class="template-modal-folder-icon template-modal-my-template-icon"></div>
            <div class="CreateTemplateFolderTitle" folder-id="0" folder-name="My templates">My templates</div>
            </div>
        <%} %>
        <% for(a=0; a<oFoldersData.length;a++){%>
            <%= FoldersTemplateCreate({oFoldersData:oFoldersData[a],openFolderId:openFolderId})%>
        <%} %>
    </div>
    <div class="template-modal-folder-dropdown-footer">
            <button class="folderSelectBtn">OK</button>
    </div>
</div>`);

let FoldersTemplateCreate = _.template(`
        <% if(oFoldersData.id === openFolderId) {%>
            <div value="a" class="optionFolder Selected" folder-name="<%= oFoldersData.name %>">
                <% if(oFoldersData.shared) {%>
                    <div class="template-modal-shared-folder"></div>
                <%} else {%>
                    <div class="template-modal-folder-icon"></div>
                <%} %>
                <div class="CreateTemplateFolderTitle" folder-id="<%= oFoldersData.id %>" folder-name="<%= oFoldersData.name %>"><%= oFoldersData.name %></div>
                <div class="templateCount"><%= oFoldersData.total_templates %></div>
            </div>
        <%} else {%>
            <div value="a" class="optionFolder" folder-name="<%= oFoldersData.name %>">
                <% if(oFoldersData.shared) {%>
                    <div class="template-modal-shared-folder"></div>
                <%} else {%>
                    <div class="template-modal-folder-icon"></div>
                <%} %>
                <div class="CreateTemplateFolderTitle" folder-id="<%= oFoldersData.id %>" folder-name="<%= oFoldersData.name %>"><%= oFoldersData.name %></div>
                <div class="templateCount"><%= oFoldersData.total_templates %></div>
            </div>
        <%} %>
        `);

function selectFolder(targetNode) {
    let ContainerPopView = targetNode.closest('.template-modal-container');
    let previouslySelected = ContainerPopView.querySelector('.optionFolder.Selected');
    previouslySelected && previouslySelected.classList.remove('Selected');
    targetNode.classList.add('Selected');
}

function setTemplateFolder(targetNode) {
    let ContainerPopView = targetNode.closest('.template-modal-container');
    let FolderElement = ContainerPopView && ContainerPopView.querySelector('.optionFolder.Selected');
    let folderText = FolderElement && FolderElement.querySelector('.CreateTemplateFolderTitle');
    let FolderIdentify = folderText && folderText.getAttribute('folder-name');
    let FolderIdIdentify = folderText && folderText.getAttribute('folder-id');
    let SelectedFolderName = ContainerPopView && ContainerPopView.querySelector('.SelectedFolderName');
    let SelectedFolderIcon = ContainerPopView && ContainerPopView.querySelector('.SelectedFolderIcon');
    let SelectedFolderContainer = ContainerPopView && ContainerPopView.querySelector('.template-modal-select-container');

    if (FolderElement && FolderElement.querySelector('.template-modal-shared-folder')) {
        SelectedFolderIcon && SelectedFolderIcon.classList.remove('MyTemplatesIcon');
        SelectedFolderIcon && SelectedFolderIcon.classList.add('SharedFolderIcon');
    } else if (FolderElement && FolderElement.querySelector('.template-modal-folder-icon.template-modal-my-template-icon')) {
        SelectedFolderIcon && SelectedFolderIcon.classList.remove('SharedFolderIcon');
        SelectedFolderIcon && SelectedFolderIcon.classList.add('MyTemplatesIcon');
    } else if (FolderElement && FolderElement.querySelector('.template-modal-folder-icon')) {
        SelectedFolderIcon && SelectedFolderIcon.classList.remove('SharedFolderIcon', 'MyTemplatesIcon');
    }
    SelectedFolderName.innerHTML = FolderIdentify;
    SelectedFolderContainer.setAttribute('folder_id', FolderIdIdentify);
    let popupBody = ContainerPopView && ContainerPopView.querySelector('.template-modal-folder-dropdown');
    popupBody.classList.add('hidden');
}

function selectTemplateFolder(templateFolderToSelect) {
    templateFolderToSelect = templateFolderToSelect ? templateFolderToSelect : $('#myTemplatesOption')[0];
    selectFolder(templateFolderToSelect);
    setTemplateFolder(templateFolderToSelect);
}

function getTemplateCounts(oPopOutNode) {
    let oProgressBar = oPopOutNode && oPopOutNode.querySelector('.SHProgressbar');
    let oPopOutBody = oPopOutNode && oPopOutNode.querySelector('.QuickTemplatePopOutSection.body');
    oProgressBar && oProgressBar.classList.remove('invisible');
    oPopOutBody && oPopOutBody.classList.add('loadingData');
    let userInfoObj = getUserInfoFromLocal();
    if (currentUserEmail && userInfoObj && userInfoObj.isPluginActivated && userInfoObj.auth_token) {
        let auth_token = userInfoObj.auth_token;
        let data = {
            auth_token: auth_token
        };
        let getTemplateFoldersURL = '/templates/count';
        oRequestBody = {
            action: 'callFunction',
            function: 'getData',
            parameters: [getTemplateFoldersURL, data]
        };
        sendMessageToBackgroundPromise(oRequestBody).then(res => {
            if (res && res.rows && !res.error && auth_token) {
                let { all, best_performance, recently_used } = res && res.rows;
                oPopOutBody &&
                    oPopOutBody.insertAdjacentHTML(
                        'afterbegin',
                        defaultFoldersViewCompiled({
                            all: all,
                            best_performance: best_performance,
                            recently_used: recently_used
                        })
                    );
                oProgressBar && oProgressBar.classList.add('invisible');
                oPopOutBody && oPopOutBody.classList.remove('loadingData');
                oPopOutBody &&
                    oPopOutBody.querySelectorAll('.FolderContainer') &&
                    oPopOutBody.querySelectorAll('.FolderContainer')[0] &&
                    oPopOutBody.querySelectorAll('.FolderContainer')[0].classList.add('Selected');
            } else {
                oPopOutBody &&
                    oPopOutBody.insertAdjacentHTML(
                        'afterbegin',
                        defaultFoldersViewCompiled({
                            all: 0,
                            best_performance: 0,
                            recently_used: 0
                        })
                    );
                oProgressBar && oProgressBar.classList.add('invisible');
                oPopOutBody && oPopOutBody.classList.remove('loadingData');
                oPopOutBody &&
                    oPopOutBody.querySelectorAll('.FolderContainer') &&
                    oPopOutBody.querySelectorAll('.FolderContainer')[0] &&
                    oPopOutBody.querySelectorAll('.FolderContainer')[0].classList.add('Selected');

                let QuickTeamplatesPopOutBody = oPopOutBody.closest('.QuickTeamplatesPopOutBody');
                let searchContainer = QuickTeamplatesPopOutBody && QuickTeamplatesPopOutBody.querySelector('.TeamplatesSearchContainer');
                if (!searchContainer || !searchContainer.classList.contains('hidden')) {
                    let QuickTemplateFolderSlider =
                        QuickTeamplatesPopOutBody && QuickTeamplatesPopOutBody.querySelector('.QuickTemplateFolderSlider');
                    QuickTemplateFolderSlider && QuickTemplateFolderSlider.classList.add('hidden');
                }
            }
        });
    }
}

function getTemplates(sFolderId, page, targetView, searchQuery, isLoadMore = false, searchContainer, sDataType, iFoldersCount) {
    let oPopOutBody = targetView && targetView.closest('.QuickTeamplatesPopOutBody');
    let oProgressBar = oPopOutBody && oPopOutBody.querySelector('.SHProgressbar');
    oProgressBar && oProgressBar.classList.remove('invisible');
    oPopOutBody && oPopOutBody.classList.add('loadingData');
    let userInfoObj = getUserInfoFromLocal();
    if (currentUserEmail && userInfoObj && userInfoObj.isPluginActivated && userInfoObj.auth_token) {
        let auth_token = userInfoObj.auth_token;
        let data = {
            auth_token: auth_token
        };
        sFolderId = sDataType || !(page !== undefined && page !== 0) ? '' : sFolderId;
        let getTemplatesURL = '/templates/list';
        let queryParams =
            '?minimal=1&all=1' +
            (sDataType ? `&data_type=${sDataType}` : '') +
            (sFolderId ? `&folder=${sFolderId}` : '') +
            (page !== undefined && page !== 0 ? '&page=' + page + '' : '&page=' + page + '&per_page=80') +
            (searchQuery ? '&query=' + searchQuery + '' : '');
        let abortControllerName = 'fetchTemplatesData';
        getTemplatesURL += queryParams;
        let oRequestBody = {
            action: 'callFunction',
            function: 'getDataAbortable',
            parameters: [getTemplatesURL, data, abortControllerName]
        };
        sendMessageToBackgroundPromise(oRequestBody).then(res => {
            if (!res.error && auth_token) {
                if (page === 0) {
                    templatesDataStore.allTemplatesData80 = res && res.rows;
                    templatesDataStore.allTemplatesTotalRecords = res && res.total_records;
                }
                if (searchQuery) {
                    filterTemplates(searchQuery, searchContainer, res && res.rows);
                    oProgressBar && oProgressBar.classList.add('invisible');
                    oPopOutBody && oPopOutBody.classList.remove('loadingData');
                    return;
                }
                if (targetView) {
                    if (res.total_records === 0 && (isLoadMore === false || iFoldersCount === 0)) {
                        targetView.innerHTML = getNoTemplatesView();
                        let footer = oPopOutBody && oPopOutBody.querySelector('.footer');
                        let firstButton = footer && footer.firstElementChild;
                        if (firstButton && firstButton.classList.contains('hidden')) firstButton = footer.lastElementChild;
                        firstButton && firstButton.focus();
                    } else {
                        targetView.setAttribute('data-is-loading', false);
                        targetView.setAttribute('data-templates-current-page', res.current_page);
                        targetView.setAttribute('data-templates-total-pages', res.total_pages);
                        targetView.insertAdjacentHTML(
                            'beforeend',
                            oTemplatesListComplied({
                                oTemplatesData: res.rows,
                                sView: '',
                                sUserId: userPreferencesRes && userPreferencesRes.id
                            })
                        );
                        setUpToolTips();
                        if(iFoldersCount !== 0){
                            let first_node = targetView && targetView.querySelector('.FolderContainer');
                            first_node && first_node.focus();
                            first_node && first_node.classList.add('Selected');
                        }
                    }
                }
                if (isLoadMore === false || iFoldersCount === 0) {
                    let first_node = targetView && targetView.querySelector('.TemplateContainer');
                    first_node && first_node.focus();
                    first_node && first_node.classList.add('Selected');
                }
            } else {
                onError(res);
            }
            oProgressBar && oProgressBar.classList.add('invisible');
            oPopOutBody && oPopOutBody.classList.remove('loadingData');
        });
    }
}

let templatesDataStore = {
    allTemplatesData: [],
    templatesFolderData: [],
    snippetTemplateIDValues: [],
    snippetTemplateIDValuesStaging: [],
    snippetTemplateIDMapping: {}
};

let oTemplatesListComplied = _.template(`
<% for(a=0; a<oTemplatesData.length;a++){%>
    <%= oTemplateComplied({oTemplateData:oTemplatesData[a], sView:sView, sUserId:sUserId})%>
<%} %>`);

let oTemplateComplied = _.template(`
<%
let isShared = oTemplateData.shared;
let {can_delete, can_edit} = oTemplateData.shared_access;
let isOwner = (oTemplateData && oTemplateData.created_by_id === sUserId) || false;
let openedInPopup = (document.querySelector('#CreateBodyCustom') !== null)
%>
<div class="TemplateContainer sh_tippy" data-template-id="<%= oTemplateData.id %>" data-template-title="<%= oTemplateData.title %>" data-folder-name="<%= (oTemplateData.folder_name || 'All templates')%>" data-is-owner="<%= isOwner %>" data-is-shared="<%= isShared %>">
    <div class="TemplateDesc">
        <% if(oTemplateData.snippet) { %>
            <div class="TemplateName"> <%= sView && sView === 'search' ? oTemplateData.title_modified : oTemplateData.title %> </div>
            <div class="TemplateSnippet"><%= oTemplateData.snippet %></div>
        <% } else { %>
            <div class="TemplateName NoSnippet"> <%= sView && sView === 'search' ? oTemplateData.title_modified : oTemplateData.title %> </div>
        <% } %>
    </div>
    <% if(!openedInPopup) { %>
        <% if(can_delete || isOwner) { %>
            <div class="TemplateOptionContainer sh_tippy sh_tippy_delete">
                <div class="TemplateDelete OptionIcon" data-template-id="<%= oTemplateData.id %>" data-template-title="<%= oTemplateData.title %>"></div>
            </div>
        <% } %>
        <%/*<div class="TemplateOptionContainer hidden sh_tippy sh_tippy_favorite">
            <div class="TemplateFavourite OptionIcon"></div>
        </div>*/ %>
        <% if(can_edit || isOwner) { %>
            <div class="TemplateOptionContainer sh_tippy sh_tippy_edit">
                <div class="TemplateEdit OptionIcon" ></div>
            </div>
        <% } %>
    <% } %>
</div>
`);

let oFolderViewTemplate = `
<div class="SingleView">
<%= oFoldersTemplateCompiled({oFoldersData:oFoldersData}) %>
</div>`;

let oFoldersTemplateCompiled = _.template(`
<% for(i=0; i< oFoldersData.length; i++) {
let template_count = oFoldersData[i].total_templates;
let is_shared = oFoldersData[i].shared;
let folder_id = oFoldersData[i].id;
let folder_name = oFoldersData[i].name;
%>
<div class="FolderContainer" tabindex='0' data-folder-id="<%= folder_id ? folder_id : '0' %>" data-folder-name="<%= folder_name ? folder_name : '0' %>">
        <div class="FolderIcon <%= is_shared? 'sharedFolder' : 'myFolder'%>"></div>
        <div class="FolderDesc">
            <div class="FolderName"><%= folder_name %></div>
            <div class="FolderContents"><%= template_count%> <%= template_count > 1 ? 'templates' : 'template' %></div>
        </div>
        <div class="FolderArrowContainer">
            <div class="FolderArrow"></div>
        </div>
        </span>
    </div>
<% } %>`);

let defaultFoldersViewCompiled = _.template(`
<div class="QuickTemplateFolderSlider">
    <div class="QuickTemplateFolderViews">
        <div class="QuickTemplateHomeView SingleView" data-open-folder-id="-1" data-open-folder-name="">
            <div class="FolderContainer" tabindex='0' data-folder-category="BEST_PERFORMANCE" data-is-category-folder="true" data-folder-id="0">
                <div class="FolderIcon BestPerformanceFolder"></div>
                <div class="FolderDesc">
                    <div class="FolderName">Best in Performance</div>
                    <div class="FolderContents"><%= best_performance && best_performance || 0 %> templates</div>
                </div>
                <div class="FolderArrowContainer">
                    <div class="FolderArrow"></div>
                </div>
                </span>
            </div>
            <div class="FolderContainer" tabindex='0' data-folder-category="RECENTLY_USED" data-is-category-folder="true" data-folder-id="0">
                <div class="FolderIcon RecentTemplatesFolder"></div>
                <div class="FolderDesc">
                    <div class="FolderName">Recently Used</div>
                    <div class="FolderContents"><%= recently_used && recently_used || 0 %> templates</div>
                </div>
                <div class="FolderArrowContainer">
                    <div class="FolderArrow"></div>
                </div>
                </span>
            </div>
            <div class="FolderContainer" tabindex='0' data-folder-category="ALL" data-is-category-folder="true" data-folder-id="0">
                <div class="FolderIcon AllTemplatesFolder"></div>
                <div class="FolderDesc">
                    <div class="FolderName">All templates</div>
                    <div class="FolderContents"><%= all && all || 0 %> templates</div>
                </div>
                <div class="FolderArrowContainer">
                    <div class="FolderArrow"></div>
                </div>
                </span>
            </div>
        </div>
    </div>
</div>
`);

function getNoTemplatesView(sView) {
    return `<div class="NoTemplatesContainer">
                <div class="NoTemplatesIcon ${sView === 'search' ? 'noMatchSearch' : ''}">
                </div>
                <div class="NoTemplatesText">No templates found</div>
                ${
                    sView !== 'search'
                        ? '<a href="' +
                          HELP_URL.TEMPLATES +
                          '" target="_blank" tab-index="0" class="noTemplateFAQ">How to use the templates?</a>'
                        : ''
                }
                </div>`;
}

let lastScrollTop = 0;
let oFolderViewTemplateCompiled = _.template(oFolderViewTemplate);
let executeOnce = false;

function lazyLoadMoreData(event) {
    tippy.hideAll({ duration: 0 });
    let SingleView = event && event.target;
    let scrollTop = SingleView.scrollTop;

    let currentScroll = scrollTop;
    if (currentScroll > lastScrollTop) {
        let viewHeight = SingleView.offsetHeight;
        let viewScrollHeight = SingleView.scrollHeight;
        let bodyHeight = viewScrollHeight - viewHeight;
        let scrollPercentage = scrollTop / bodyHeight;
        let scrollIndex = viewHeight != 0 ? bodyHeight / viewHeight : 0;
        let dynamicScrollThreshold = scrollIndex / (scrollIndex + 1);
        let currentFoldersPage = SingleView.getAttribute('data-folders-current-page') || 0;
        let totalFoldersPages = SingleView.getAttribute('data-folders-total-pages') || 0;
        let isDataStillLoading = SingleView.getAttribute('data-is-loading') || 'false';
        currentFoldersPage = parseInt(currentFoldersPage);
        totalFoldersPages = parseInt(totalFoldersPages);
        // if the scroll is more than dynamicScrollThreshold from the top, load more content
        if (isDataStillLoading !== 'true' && scrollPercentage > dynamicScrollThreshold) {
            if (currentFoldersPage < totalFoldersPages) {
                SingleView.setAttribute('data-is-loading', true);
                getTemplateFolders(++currentFoldersPage, SingleView);
            } else {
                let totalTemplatesPages = SingleView.getAttribute('data-templates-total-pages') || 1;
                let currentTemplatesPage = SingleView.getAttribute('data-templates-current-page') || 0;
                let sFolderID = SingleView.getAttribute('data-folder-id') || '0';
                currentTemplatesPage = parseInt(currentTemplatesPage);
                totalTemplatesPages = parseInt(totalTemplatesPages);
                if (currentTemplatesPage < totalTemplatesPages) {
                    SingleView.setAttribute('data-is-loading', true);
                    getTemplates(sFolderID, ++currentTemplatesPage, SingleView, undefined, true);
                }
            }
        }
    } else {
        // upscroll code
    }
    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll; // For Mobile or negative scrolling
}

function FavouriteTemplate(event) {
    let targetNode = event && event.target;
    if (targetNode) {
        if (targetNode.classList.contains('TemplateFavouriteFill')) {
            targetNode.classList.remove('TemplateFavouriteFill');
        } else {
            targetNode.classList.add('TemplateFavouriteFill');
        }
    }
}

function SaveEmailAsTemplateDialog(targetNode) {
    let composeBox = targetNode.closest('.inboxsdk__compose');
    let composeBoxUniqueID = composeBox.id;
    let composeView = composeViews[composeBoxUniqueID];
    hideAllTemplatePopOut();
    if (targetNode) {
        let subject = composeView.getSubject();
        if (subject.trim() === '') {
            onError({
                error: true,
                error_code: 'No_subject',
                error_message: 'Please provide subject in the email.'
            });
            hideAllTemplatePopOut();
            return;
        }
        getTeamList().then(res => {
            let QuickTeamplatesPopOutBody = targetNode.closest('.QuickTeamplatesPopOutBody');
            let lastSingleView = QuickTeamplatesPopOutBody && QuickTeamplatesPopOutBody.querySelector('.SingleView:last-child');
            let openFolderId = lastSingleView && lastSingleView.getAttribute('data-open-folder-id');
            let openFolderName = lastSingleView && lastSingleView.getAttribute('data-open-folder-name');
            SHTemplateModal('add', { folder_id: openFolderId, folder_name: openFolderName }, res);
            let content = composeView.getBodyElement();
            let shBrand = content.querySelector("[id$='saleshandy_branding']");
            let tempContent = composeView.getHTMLContent();
            const detectGmailImageBlobRegExp = new RegExp(
                /<img.*?src="(((blob:)?http(s?):)([/|.|\w|\s|-])\/mail.google.com\/.*?)"[^\>]+>/g
            );
            if (detectGmailImageBlobRegExp.test(tempContent)) {
                WarningPopUp({
                    error: true,
                    error_title: 'Info',
                    error_message: `Uploading images from Gmail is not allowed.<br>Please use the <i class="note-icon-picture"></i> (insert image) option of the editor.`
                });
                tempContent = tempContent.replace(detectGmailImageBlobRegExp, '');
            }
            if (shBrand) shBrand.parentNode.removeChild(shBrand);
            let popUpView = document.querySelector('.inboxsdk__modal_container');
            const templateSubject = composeView.getSubject();
            let subjectTemplateUpdate = popUpView.querySelector('.template-subject-input');
            subjectTemplateUpdate.value = templateSubject;
            if (templateSubject) {
                let TemplateTitle = popUpView.querySelector('.template-title-input');
                TemplateTitle.value = templateSubject;
            }
            $('#summernote').summernote('code', tempContent);
            hideAllTemplatePopOut();
        });
    }
}

function createANewTemplateDialog(event) {
    let targetNode = event && event.target;
    let QuickTeamplatesPopOutBody = targetNode.closest('.QuickTeamplatesPopOutBody');
    let lastSingleView = QuickTeamplatesPopOutBody && QuickTeamplatesPopOutBody.querySelector('.SingleView:last-child');
    let openFolderId = lastSingleView && lastSingleView.getAttribute('data-open-folder-id');
    let openFolderName = lastSingleView && lastSingleView.getAttribute('data-open-folder-name');
    getTeamList().then(res => {
        SHTemplateModal('add', { folder_id: openFolderId, folder_name: openFolderName }, res);
        hideAllTemplatePopOut();
    });
}

function switchCreateAndSaveButton(targetNode) {
    let composeBox = targetNode.closest('.inboxsdk__compose');
    let composeBoxUniqueID = composeBox.id;
    let composeView = composeViews[composeBoxUniqueID];
    let QuickCreateTemplateBtn = targetNode.querySelector('.QuickTemplateBtn2:last-child');
    let QuickSaveTemplateBtn = targetNode.querySelector('.QuickTemplateBtn2');
    if (targetNode && QuickCreateTemplateBtn && QuickSaveTemplateBtn && composeView) {
        let contentExists = checkIfContentExists(composeView);
        if (contentExists) {
            QuickCreateTemplateBtn.innerHTML =
                '<div class="CreateTemplateIconContainer"><div class="CreateTemplateIcon"></div><div class="CreateTemplateText">Create</div></div>';
            QuickCreateTemplateBtn.classList.add('QuickTemplateBtn2');
            QuickCreateTemplateBtn.classList.remove('QuickTemplateBtn');
            QuickSaveTemplateBtn.innerHTML =
                '<div class="SaveTemplateIconContainer"><div class="SaveTemplateIconContainer SaveTemplateIcon"></div><div class="SaveTemplateText">Save</div></div>';
            QuickSaveTemplateBtn.classList.add('SaveBtn');
            QuickSaveTemplateBtn.classList.remove('hidden');
            QuickSaveTemplateBtn.classList.add('QuickTemplateBtn2');
        } else {
            QuickCreateTemplateBtn.innerHTML =
                '<div class="CreateTemplateIconContainer"><div class="CreateTemplateIconContainer CreateTemplateIcon"></div><div class="CreateTemplateText">Create template</div></div>';
            QuickCreateTemplateBtn.classList.add('QuickTemplateBtn');
            QuickCreateTemplateBtn.classList.remove('QuickTemplateBtn2');
            QuickSaveTemplateBtn.innerHTML = '';
            QuickSaveTemplateBtn.classList.add('hidden');
            QuickSaveTemplateBtn.classList.remove('SaveBtn');
            QuickSaveTemplateBtn.classList.remove('QuickTemplateBtn2');
        }
    }
}

function checkIfContentExists(composeView) {
    let emailBody = composeView && composeView.getBodyElement();
    if (emailBody) {
        emailBody = emailBody.cloneNode(true);
        let ignoreNodes = emailBody.querySelectorAll(
            '[class$="gmail_signature"][data-smartmail="gmail_signature"], .gmail_quote, .sh_branding_footer'
        );
        Array.from(ignoreNodes).forEach(ignoreNode => {
            ignoreNode && ignoreNode.parentNode.removeChild(ignoreNode);
        });
        let emailBodyText = emailBody.innerText;
        emailBodyText = emailBodyText && emailBodyText.trim();
        if (emailBodyText && emailBodyText.length > 0) {
            return true;
        }
    }
    return false;
}

function deleteTheTemplate(event) {
    let targetNode = event && event.target;
    let templateID = targetNode && targetNode.getAttribute('data-template-id');
    let templateTitle = targetNode && targetNode.getAttribute('data-template-title');
    if (!templateID || !templateTitle) {
        return;
    }
    let oData = {
        message: `Are you sure you want to delete this template?<br><b>${templateTitle}</b>`,
        message_title: 'Delete Template'
    };
    let popUpBtns = [
        {
            text: 'Delete',
            orderHint: 0,
            templateID: templateID,
            type: 'PRIMARY_ACTION',
            onClick: deleteTemplate.bind(null, templateID)
        },
        {
            text: 'Cancel',
            orderHint: 1,
            onClick: e => {
                SHModalViewGlobal.close();
            }
        }
    ];
    SHPopup(oData, popUpBtns);
}

function deleteTemplate(templateID) {
    SHModalViewGlobal.close();
    let { auth_token } = getUserInfoFromLocal();
    let url = '/templates/' + templateID + '/delete';
    let data = {
        auth_token
    };
    let oRequestBody = {
        action: 'callFunction',
        function: 'deleteData',
        parameters: [url, data]
    };
    return sendMessageToBackgroundPromise(oRequestBody).then(res => {
        if (!res.error && auth_token) {
            hideAllTemplatePopOut();
            showButterBarMsg('Template Deleted', 1000);
        } else {
            onError(res);
        }
    });
}

function setUpComposeViewEvents() {
    composeView.on('sent', eventDetails => {
        hideAllTemplatePopOut();
    });
    composeView.on('discard', event => {
        hideAllTemplatePopOut();
    });
}

function setUpToolTips() {
    let tippyInstance = tippy('.sh_tippy', {
        theme: 'google',
        boundary: 'viewport',
        placement: 'bottom',
        onTrigger: function(tippyInstance, e) {
            let reference = tippyInstance.reference;
            if (reference.classList.contains('TemplateContainer')) {
                const template_title = reference.getAttribute('data-template-title');
                const folder_name = reference.getAttribute('data-folder-name');
                const is_user_owned = reference.getAttribute('data-is-owner') === 'true';
                const is_shared = reference.getAttribute('data-is-shared') === 'true';
                const is_shared_with_me = is_shared && !is_user_owned;
                const node = `<div class='template_name_tooltip'><b>${template_title}</b></div><div class='folder_name_tooltip'>Folder: ${folder_name}${
                    is_shared_with_me ? ' (shared with me)' : ''
                }</div>`;
                tippyInstance.setContent(node);
            } else if (reference.classList.contains('sh_tippy_edit')) {
                const node = `Edit`;
                tippyInstance.setContent(node);
            } else if (reference.classList.contains('sh_tippy_delete')) {
                const node = `Delete`;
                tippyInstance.setContent(node);
            } else if (reference.classList.contains('sh_tippy_favorite')) {
                const node = `Add to favorites`;
                tippyInstance.setContent(node);
            } else if (reference.classList.contains('sh_tippy_filter')) {
                const node = `Go back to default view`;
                tippyInstance.setContent(node);
            }
            tippy.hideAll({ duration: 0 });
        },
        onShow: function(tippyInstance, e) {
            tippy.hideAll({ duration: 0 });
        }
    });
}

function getTemplateFolderList() {
    let { auth_token } = getUserInfoFromLocal();
    let url = '/list/template-folders';
    let data = {
        auth_token
    };
    let oRequestBody = {
        action: 'callFunction',
        function: 'getData',
        parameters: [url, data]
    };
    return sendMessageToBackgroundPromise(oRequestBody);
}

var tmpl_add_template_as_email = `
  <div class="add_temp_modal_row">
    <span class="add_temp_span_comm" style="margin: 6px 0;width: 60px;color:#202124;">
      Name<i style="color: #e71f63">*</i>
    </span>
    <span class="add_temp_span_comm" style="width:calc(100% - 60px);">
      <input type="text" id="template_name" style="width: calc(100% - 60px)" value="<%= subject%>"></input>
    </span>
  </div>

  <div class="add_temp_modal_row">
    <span class="add_temp_span_comm" style="margin: 6px 0;width:60px;color:#202124;">Folder</span>
    <span class="add_temp_span_comm" style="width:calc(100% - 60px);">
      <select style="width: calc(100% - 60px)" id="template_folder" >
        <option value="0">All templates</option>
        <% for(i=0; i< folderList.length; i++) {%>  
          <option value="<%= folderList[i].id %>"><%= folderList[i].name %></option>
        <% } %>
      </select>
    </span>
  </div>

  <div id="error_log" style="color: #e71f63; margin-top: 10px"></div>
`;

function getTemplateContent(id) {
    let { auth_token } = getUserInfoFromLocal();
    let url = '/templates/' + id + '/view';
    let data = {
        auth_token
    };
    let oRequestBody = {
        action: 'callFunction',
        function: 'getData',
        parameters: [url, data]
    };
    return sendMessageToBackgroundPromise(oRequestBody);
}

function insertTemplateContent(oTemplateContainer) {
    let composeBox = oTemplateContainer.closest('.inboxsdk__compose');
    let composeBoxUniqueID = composeBox && composeBox.id;
    let composeView = composeViews[composeBoxUniqueID];
    let templateID = oTemplateContainer.getAttribute('data-template-id');
    let butterBarMsgInstance = showButterBarMsg('Fetching template', 1000);
    if (composeView && templateID) {
        getTemplateContent(templateID).then(res => {
            butterBarMsgInstance && butterBarMsgInstance.destroy();
            if (res.error) return onError(res);
            hideAllTemplatePopOut();
            restoreRangePosition(composeView.getBodyElement());
            finalTemplateID = res.id;
            if (!composeView.getSubject()) composeView.setSubject(res.subject);
            pasteHtmlAtCaret(res.content, composeView);
            updateIncludedDocumentAndSpace(composeView);
        });
    } else if (oTemplateContainer && oTemplateContainer.closest('#CreateBodyCustom') !== null) {
        getTemplateContent(templateID).then(res => {
            butterBarMsgInstance && butterBarMsgInstance.destroy();
            if (res.error) return onError(res);
            hideAllTemplatePopOut();
            let wrapperRange = $('#summernote').summernote('editor.getLastRange');
            if (
                wrapperRange &&
                wrapperRange.ec &&
                wrapperRange.ec.classList &&
                wrapperRange.ec.classList.contains('QuickTemplatePopOutSection')
            ) {
                wrapperRange && wrapperRange.pasteHTML(res.content);
                $('#summernote').summernote('editor.focus');
            } else {
                let editorContent = $('#summernote').summernote('code');
                editorContent = editorContent.concat(res.content);
                $('#summernote').summernote('code', editorContent);
                $('#summernote').summernote('editor.focus');
            }
        });
    }
}

function updateIncludedDocumentAndSpace(composeView) {
    let emailBody = composeView.getBodyElement();
    let getAllBodyUrls = emailBody.querySelectorAll('a');
    [...getAllBodyUrls].forEach(url => {
        if (url.outerHTML.includes('{{file:')) {
            let docID = url.outerHTML.match(new RegExp('{{file:' + '(.*)' + '}}'));
            url.href = docID[1];
            url.className = 'sh_doc';
            url.isLink = false;
        }
    });
}

function onPopoutItemMouseover(event) {
    let targetNode = event && event.target;
    let TemplateContainer = getNodeIfClicked(targetNode, 'TemplateContainer');
    if (TemplateContainer) {
        adjustWidthOfTemplateName(TemplateContainer, MOUSE_ACTION.OVER); // conditionOverOut is given 1 to identify mouseover event
    }
}

function adjustWidthOfTemplateName(TemplateContainer, conditionOverOut) {
    let allTemplateOptionContainer = Array.from(TemplateContainer.querySelectorAll('.TemplateOptionContainer'));
    let nTemplateOptionContainer = allTemplateOptionContainer.length;
    let TemplateName = TemplateContainer.querySelector('.TemplateName');
    let TemplateSnippet = TemplateContainer.querySelector('.TemplateSnippet');
    let finalWidthTemplateName = 245;
    let finalWidthTemplateSnippet = 230;
    if (conditionOverOut == 1) {
        finalWidthTemplateName = finalWidthTemplateName - 35 * nTemplateOptionContainer;
        finalWidthTemplateSnippet = finalWidthTemplateSnippet - 35 * nTemplateOptionContainer;
    }
    TemplateName && (TemplateName.style.width = finalWidthTemplateName + 'px');
    TemplateSnippet && (TemplateSnippet.style.maxWidth = finalWidthTemplateSnippet + 'px');
}

function onPopoutItemMouseout(event) {
    let targetNode = event && event.target;
    let TemplateContainer = getNodeIfClicked(targetNode, 'TemplateContainer');
    if (TemplateContainer) {
        adjustWidthOfTemplateName(TemplateContainer, MOUSE_ACTION.OUT); //conditionOverOut is given to identify the mouseout event
    }
}

function CreateEmailAsTemplateDialog(identifier) {
    let CreateTemplatePopUp = document.querySelector('#CreateBodyCustom');
    let templateTitleInput = CreateTemplatePopUp.querySelector('.template-title-input');
    let templateSubjectInput = CreateTemplatePopUp.querySelector('.template-subject-input');
    if (templateTitleInput.value === '' || (templateTitleInput.value && templateTitleInput.value.trim() === '')) {
        WarningPopUp({
            error: true,
            error_title: 'Error',
            error_message: 'Please provide title for the Template.'
        });
        hideAllTemplatePopOut();
        return;
    }
    let isErrorOccured = false;
    if (templateSubjectInput) {
        if (templateSubjectInput.value === '' || (templateSubjectInput.value && templateSubjectInput.value.trim() === '')) {
            WarningPopUp({
                error: true,
                error_title: 'Error',
                error_message: 'Please provide subject for the Template.'
            });
            hideAllTemplatePopOut();
            return;
        }
        if (isErrorOccured) return;
        let TemplateContent = $('#summernote').summernote('code');
        let CreateTemplateBody = CreateTemplatePopUp.querySelector('.template-modal-body');
        let FolderIdentify = CreateTemplatePopUp.querySelector('.template-modal-select-container');
        let shareTemplatePopUpView = document.querySelector('.MainSharePopUpDiv');
        let blurView = document.querySelector('#blur');
        let teams = [],
            public = false,
            shareCanEdit = false,
            folderid = 0,
            templateId = '',
            snippet = '';
        is_template_owner = true;
        folderid = FolderIdentify.getAttribute('folder_id');
        snippet = validateSnippet();
        if (snippet === '#whiteSpaceNotAllowed') {
            WarningPopUp({
                error: true,
                error_title: 'Error',
                error_message: 'Whitespace is not allowed in the shortcurt.'
            });
            hideAllTemplatePopOut();
            return;
        } else if (snippet === '#maxCharLengthReached') {
            WarningPopUp({
                error: true,
                error_title: 'Error',
                error_message: 'The shortcut can have maximum 50 characters.'
            });
            hideAllTemplatePopOut();
            return;
        }
        templateId = FolderIdentify.getAttribute('template_id');
        if (CreateTemplateBody.getAttribute('is_template_owner') === 'false') {
            is_template_owner = false;
        }
        let radioViewandEdit = shareTemplatePopUpView.querySelector('#edit');
        if (radioViewandEdit.checked) {
            shareCanEdit = true;
        }
        let AllOrg = shareTemplatePopUpView.querySelector('.ShareWithAllOrganization');
        if (AllOrg.checked) {
            public = true;
            teams = [];
        } else {
            public = false;
            let selectedTeamCheckBoxes = shareTemplatePopUpView.querySelectorAll('input.Team_Share_With:checked');
            teams = Array.from(selectedTeamCheckBoxes).map(function(selectedTeamCheckBox) {
                return selectedTeamCheckBox.getAttribute('team_id');
            });
        }
        let templatePayload = {
            content: TemplateContent,
            folder: folderid,
            subject: templateSubjectInput.value,
            title: templateTitleInput.value,
            public: public,
            teams: teams,
            can_edit: shareCanEdit,
            can_delete: false,
            snippet: snippet,
            id: templateId == 'undefined' ? 0 : templateId,
            is_template_owner: is_template_owner
        };
        if (identifier === 'add') {
            addTemplateToDB(templatePayload).then(res => {
                // Add Subscription pause logic
                if (res.error) {
                    if (HAS_PAUSED_SUBSCRIPTION) {
                        showPricingPopUp(PAUSED_SUBSCRIPTION_POPUP_MSG, { error_code: PAUSED_SUBSCRIPTION_ERR_CODE });
                    }else{
                        WarningPopUp(res)
                    }
                    return ;
                }
                getSnippetTemplatesMapping();
                showButterBarMsg(res.message);
                SHCreateTemplateView && SHCreateTemplateView.close();
                shareTemplatePopUpView && shareTemplatePopUpView.remove();
                blurView && blurView.remove();
            });
        } else if (identifier === 'update') {
            updateTemplateToDB(templatePayload, templateId).then(res => {
                if (res.error) {
                    return WarningPopUp(res);
                }
                getSnippetTemplatesMapping();
                showButterBarMsg(res.message);
                SHCreateTemplateView && SHCreateTemplateView.close();
                shareTemplatePopUpView && shareTemplatePopUpView.remove();
                blurView && blurView.remove();
            });
        }
    }
}

function onTeamOptionToggle(event, targetNode) {
    targetNode = targetNode ? targetNode : event && event.target;
    let ShareMainDiv = targetNode.closest('.MainSharePopUpDiv');
    let teamList = ShareMainDiv.querySelectorAll('.sh_team_select_box');
    let teamLabel = ShareMainDiv.querySelector('.teamLabel');
    let ShareRadio = ShareMainDiv.querySelectorAll('.md-radio');
    if (targetNode.className === 'ShareWithAllOrganization') {
        if (targetNode.checked) {
            teamLabel && teamLabel.classList.add('hidden');
            Array.from(teamList).forEach(teamWrapper => {
                teamWrapper && teamWrapper.classList.add('hidden');
            });
            let teamCheckboxes = ShareMainDiv.querySelectorAll('.sh_team_select_box input');
            Array.from(teamCheckboxes).forEach(teamCheckbox => {
                teamCheckbox && (teamCheckbox.checked = false);
            });
        } else {
            teamLabel && teamLabel.classList.remove('hidden');
            Array.from(teamList).forEach(teamWrapper => {
                teamWrapper && teamWrapper.classList.remove('hidden');
            });
        }
    }
    let checkedOptions = ShareMainDiv && ShareMainDiv.querySelectorAll('.Team_Share_With:checked, .ShareWithAllOrganization:checked');
    if (checkedOptions && checkedOptions.length > 0) {
        ShareRadio &&
            Array.from(ShareRadio).forEach(radioSelect => {
                radioSelect && radioSelect.classList.remove('disableRadio');
            });
    } else {
        ShareRadio &&
            Array.from(ShareRadio).forEach(radioSelect => {
                radioSelect && radioSelect.classList.add('disableRadio');
            });
    }
}

function getTeamList() {
    let userInfoObj = getUserInfoFromLocal();
    if (currentUserEmail && userInfoObj && userInfoObj.isPluginActivated && userInfoObj.auth_token) {
        let auth_token = userInfoObj.auth_token;
        let data = {
            auth_token: auth_token
        };
        let getTeamsURL = '/list/my-teams';
        let queryParams = '?order_by=id' + '&order=DESC';
        getTeamsURL += queryParams;
        let oRequestBody = {
            action: 'callFunction',
            function: 'getDataAbortable',
            parameters: [getTeamsURL, data]
        };
        return sendMessageToBackgroundPromise(oRequestBody);
    }
}

let oTeamListView = _.template(`
    <% for(a=0; a<oTeamData.length;a++){%>
        <%= TeamListView({oTeamData:oTeamData[a], sView:sView})%>
    <%} %>
    `);

let TeamListView = _.template(`
    <div class="sh_sidebar_pref_wrapper sh_team_select_box">
        <label class="switch">
            <input  type="checkbox" class="Team_Share_With" team_id="<%= oTeamData.id %>">
            <span class="slider round"></span>
            <span class="sh_slider_caption" data-tooltip="<%= oTeamData.name %>"><%= oTeamData.name %></span>
        </label>
    </div>`);

function FolderSearchOption() {
    var TemplateModalFolderSearch, sSearchText;
    TemplateModalFolderSearch = document.querySelector('.TemplateModalFolderSearch');
    let templateModalFolderSelectDropDown = document.querySelector('.template-modal-folder-dropdown');
    let noMatchingFolder = templateModalFolderSelectDropDown.querySelector('#noMatchingFolder');
    noMatchingFolder && templateModalFolderSelectDropDown && templateModalFolderSelectDropDown.removeChild(noMatchingFolder);
    sSearchText = TemplateModalFolderSearch && TemplateModalFolderSearch.value && TemplateModalFolderSearch.value.toLowerCase();
    let oFolderOptions = templateModalFolderSelectDropDown.querySelectorAll('.optionFolder');
    let countOfResults = 0;
    Array.from(oFolderOptions).forEach(oFolderOption => {
        let folderName = oFolderOption && oFolderOption.getAttribute('folder-name');
        folderName = folderName.toLowerCase();
        if (folderName.indexOf(sSearchText) > -1) {
            oFolderOption && oFolderOption.classList.remove('hidden');
            countOfResults++;
        } else {
            oFolderOption && oFolderOption.classList.add('hidden');
        }
    });
    if (countOfResults === 0) {
        let SearchBoxCreateTemplate = templateModalFolderSelectDropDown.querySelector('.SearchBoxCreateTemplate');
        SearchBoxCreateTemplate &&
            SearchBoxCreateTemplate.insertAdjacentHTML('afterEnd', '<div id="noMatchingFolder">No folders found</div>');
    }
}
function changeShareRadioSel(event) {
    let mdRadio = getNodeIfClicked(event && event.target, 'md-radio');
    let mdRadioInput = mdRadio && mdRadio.querySelector('input');
    mdRadioInput && (mdRadioInput.checked = true);
}

function hideShareEmailTemplatePopUp() {
    let MainSharePopUpDiv = document.querySelector('.MainSharePopUpDiv');
    let SharePopUpBody = MainSharePopUpDiv.querySelector('.SharePopUpBody');
    let ShareTemplateFooter = MainSharePopUpDiv.querySelector('.ShareTemplateFooter');
    let isPublic = SharePopUpBody.getAttribute('is_public') || 'false';
    let originalCreateBody = document.querySelector('.template-modal-body');
    let shareEditPermission = (originalCreateBody && originalCreateBody.getAttribute('shareCanEdit')) || 'false';
    let radioViewandEdit = ShareTemplateFooter.querySelector('#edit');
    let radioViewandView = ShareTemplateFooter.querySelector('#view');
    if (shareEditPermission && shareEditPermission === 'true') {
        radioViewandEdit && (radioViewandEdit.checked = true);
        radioViewandView && (radioViewandView.checked = false);
    } else {
        radioViewandEdit && (radioViewandEdit.checked = false);
        radioViewandView && (radioViewandView.checked = true);
    }
    let shareWithOrgFlag = SharePopUpBody.querySelector('.ShareWithAllOrganization');
    shareWithOrgFlag && (shareWithOrgFlag.checked = isPublic === 'true');
    let teamList = SharePopUpBody.getAttribute('team_list');
    teamList = teamList && teamList.split(',');
    teamList &&
        teamList.forEach(team => {
            let teamCheckBox = SharePopUpBody.querySelector('input[team_id="' + team + '"]');
            teamCheckBox && (teamCheckBox.checked = true);
        });
    if (isPublic !== 'true' && !(teamList && teamList.length > 0 && teamList[0])) {
        Array.from(ShareTemplateFooter && ShareTemplateFooter.querySelectorAll('.md-radio')).forEach(radioBtn => {
            radioBtn && radioBtn.classList && radioBtn.classList.add('disableRadio');
        });
    }
    if (isPublic === 'false') {
        onTeamOptionToggle(event, shareWithOrgFlag);
    }

    // SharePopUpBody.setAttribute('team_list', '');
    MainSharePopUpDiv.classList.add('hidden');
    let blurScreen = document.querySelector('#blur');
    blurScreen.classList.add('hidden');
}

function validateSnippet() {
    var isErrored = false;
    let error = '';
    var letters = /[\s]/g;
    let Snippet = document.querySelector('.template-shortcut-input');
    if (Snippet.value === '') {
        return '';
    }
    let SnippetValue = Snippet.value;
    let whiteSpaceMatch = SnippetValue.match(letters);
    if (whiteSpaceMatch !== null) {
        isErrored = true;
        error = '#whiteSpaceNotAllowed';
    }
    if (SnippetValue.length > 50) {
        isErrored = true;
        error = '#maxCharLengthReached';
    }
    if (isErrored) {
        return error;
    } else {
        return Snippet.value;
    }
}

function WarningPopUp(error) {
    let mainDiv = getNewElement();
    let hideWarningPopup = function() {
        let existingMainDiv = document.querySelector('.WarningPopUpDiv');
        existingMainDiv && existingMainDiv.parentNode && existingMainDiv.parentNode.removeChild(existingMainDiv);
        let screen = document.getElementById('blur');
        screen && screen.classList.add('hidden');
    };
    error.okay_btn = error.okay_btn
        ? error.okay_btn
        : {
              text: 'OK',
              class: 'WarningOkButton',
              onClick: hideWarningPopup
          };
    mainDiv.innerHTML = `<div class="WarningPopUpHeader">
        <div class="WarningTitle">${error.error_title || 'Error'}</div>
        <div class="template-modal-header-btns">
            <span
                class="WarningClose template-modal-header-btn-share template-modal-close-btn-share"
                aria-label="close"
                data-tooltip-delay="800"
                data-tooltip="close"
            ></span>
        </div>
    </div>
    <div class="WarningPopUpBody">
        <div class="WarningMessage">
            ${error.error_message}
        </div>
    </div>
    <div class="WarningPopUpFooter">
        ${
            error.cancel_btn
                ? '<button class="WarningButton WarningCancelButton ' + error.cancel_btn.class + '">' + error.cancel_btn.text + '</button>'
                : ''
        }
        ${'<button class="WarningButton WarningOkButton ' + (error.okay_btn.class || '') + '">' + error.okay_btn.text + '</button>'}
    </div>`;
    mainDiv.classList.add('WarningPopUpDiv');
    document.body.append(mainDiv);
    let closeBtnContainer = mainDiv.querySelector('.template-modal-close-btn-share');
    closeBtnContainer && closeBtnContainer.addEventListener('click', hideWarningPopup);
    let screen = document.getElementById('blur');
    screen.classList.remove('hidden');

    let okayBtnSelector = '.' + (error.okay_btn.class || 'WarningOkButton') + '';
    let okayBtnContainer = mainDiv.querySelector(okayBtnSelector);
    okayBtnContainer &&
        okayBtnContainer.addEventListener('click', () => {
            error.okay_btn && typeof error.okay_btn.onClick === 'function' && error.okay_btn.onClick();
            hideWarningPopup();
        });
    if (error.cancel_btn) {
        let cancelBtnSelector = '.' + (error.cancel_btn.class || 'WarningOkButton') + '';
        let cancelBtnContainer = mainDiv.querySelector(cancelBtnSelector);
        cancelBtnContainer &&
            cancelBtnContainer.addEventListener('click', () => {
                error.cancel_btn && typeof error.cancel_btn.onClick === 'function' && error.cancel_btn.onClick();
                hideWarningPopup();
            });
    }
}

function onSubjectInputBlur(event) {
    let templateSubjectInput = event && event.target;
    let templateSubject = templateSubjectInput && templateSubjectInput.value;
    let templateModalBody = templateSubjectInput.closest('#CreateBodyCustom');
    let headerContainer = templateModalBody.querySelector('.template-modal-header');
    let defaultTemplateName = 'Template - ' + moment().format('DD MMM YYYY');
    let title_node = headerContainer.querySelector('.template-title-input');
    if (templateSubject && templateSubject.trim() && title_node && (title_node.value === '' || title_node.value === defaultTemplateName)) {
        title_node.value = templateSubject;
    }
}

function onShortcutChange(event) {
    let targetNode = event && event.target;
    let currentValue = targetNode.value || '';
    const whiteSpaceRegexp = new RegExp(/\s/g);
    if (whiteSpaceRegexp.test(currentValue)) {
        setTimeout(function() {
            currentValue = targetNode.value || '';
            let updatedValue = currentValue.replace(/\s/g, '');
            targetNode.value = updatedValue;
        }, 200);
    }
}
