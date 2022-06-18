/**
 * ----------------------------
 * - content.js
 * ----------------------------
 *
 * This file contains the on page extension logic. This script is appended inside the targeted pages
 * to perform some actions or extend page functionality.
 */

/**********************************
*   All static variables         **
/*********************************/
timeZoneAutoComplete = {};
timeZoneAutoCompleteSB = {};
crossPlatformEndPoint = crossPlatformEndPts[ENVIRONMENT];
authApiEndPoint = authApiEndPts[ENVIRONMENT];
mainApplication = mainApplicationEndPts[ENVIRONMENT];
isUserExist = '';
currentUserEmail = undefined;
userAuthToken = 'fake_token';
currentUserRec = undefined;
modalView = undefined;
globalTrackingStatus = true;
trackingPixelInserted = false;
preferencesChanged = false;
userPreferencesRes = {};
isUserPreferencesLatest = false;
sdkMain = undefined;
Router = undefined;
composeBoxID = 0;
lastEmailSentInfo = {};
showLocalNotification = undefined;
popOutBySH = false;
previousResult = undefined;
previousLocalNot = undefined;
finalTemplateID = undefined;
checkPoweredByTagInterval = undefined;
allFeeds = undefined;
isPluginTempDeactivated = undefined;
usingNewGmail = undefined;
isMailAReply = false;
trackBtnOffset = 0;
replyWindowClass = '.Tm';
replyMsgContent = '';
undoListnerAdded = false;
baseErrorBtnCaption = 'OK';
seqAttachedWithReplyAndForwardSchedule = '';
defaultSchTimeAndTimezone = {};
composeViews = {};
crossPlatformModalView = {};
bIsMessageListnerAdded = false;
feedsMessageListenerAdded = false;
showInsertTemplateIcon = true;
isEligibleForBFCFOffer = false;
bfCmDetails = null;
bfCmOfferTimerRef = null;
hideDocument = true;
/**
 * Register InboxSDK to listen gmail events
 */

/*******************FETCH USER PREFERENCE ON PLUGIN INIT STARTS ****************/
//#region

function getDataToken(event) {
    if (event.origin == authApiEndPoint || event.origin == 'http://localhost') {
        let mainUserInfoObj = JSON.parse(localStorage.getItem('mainUserInfoObj')) || {};
        event.email = currentUserEmail;
        let emailFromAuthSide = event.email;
        let userInfoObj = getUserInfoFromLocal(emailFromAuthSide);
        let defaultValuesToAdd = {
            disableWelcomeModal: true,
            isPluginActivated: true,
            auth_token: event.data,
            isUserExist: true,
            firstLoadAfterAuth: true
        };
        if (!userInfoObj) {
            userInfoObj = defaultValuesToAdd;
        } else {
            _.extend(userInfoObj, defaultValuesToAdd);
        }
        mainUserInfoObj[btoa(emailFromAuthSide)] = userInfoObj;
        window.localStorage.setItem('mainUserInfoObj', JSON.stringify(mainUserInfoObj));
        window.location.href = `https://mail.google.com/mail/u/?authuser=${currentUserEmail}`;
        ReadReceiptUtils.createReadReceiptsLabels()
            .then(result => console.log(result), error => console.log(error))
            .catch(error => console.log(error));
    }
}
//#endregion
/*******************FETCH USER PREFERENCE ON PLUGIN INIT STOPS  ****************/

// Error fixed
// "errors": [
//     "failed to find timeSpan",
//     "failed to find peopleDiv"
// ]
document.addEventListener('inboxSDKtellMeThisThreadIdByDatabase', function(e){
    const targetElement = e.target;
    const getAllSpanInTraget = targetElement.getElementsByTagName('span') || [];
    var found;
    (Array.from(getAllSpanInTraget)).forEach((spanElement) => {
        if (spanElement.textContent == 'Ad') {
            found = spanElement;
            return;
        }
    });
    if(found){
        e.preventDefault();
        e.stopImmediatePropagation();
    }
})

InboxSDK.load(2, SH_APP_ID).then(function(sdk) {
    if (document.URL.includes('&view=btop')) return;
    console.log('Inbox SDK Activated', InboxSDK);
    sdkMain = sdk;
    Router = sdkMain.Router;
    currentUserEmail = sdk.User.getEmailAddress();
    usingNewGmail = sdk.User.isUsingGmailMaterialUI();

    window.authenticateUser = authenticateUser;

    /*Authenticate and fetch Token for User*/
    authenticateUser().then((res) => {

        createMainUserInfoObj();

        // Chrome-Feed Cross-Platform message listener
        if (!feedsMessageListenerAdded) {
            window.removeEventListener('message', messageListenerFeed, false);
            window.addEventListener('message', messageListenerFeed, false);
            feedsMessageListenerAdded = true;
        }

        // TODO: Remove older feeds data.
        let feedResponse = getUserFeeds();
        feedResponse &&
        feedResponse.then(res => {
            let userInfoObj = getUserInfoFromLocal();
            if (res.error && userInfoObj && userInfoObj.auth_token) return;
            allFeeds = res;
        });

        // let auth_token = getUserInfoFromLocal() && getUserInfoFromLocal().auth_token;
        // let timeout = 0;
        // if(!auth_token && res['auth_token']) {
        //     showWelcomeMessage(true);
        //     timeout = 2000;
        // } else {
        //     showWelcomeMessage();
        // }

        showWelcomeMessage();

        setTimeout(function(){
            getUserPreferences();
            getTimezoneData();
            checkForWelcomeCompose();

            setupTabMonitoring();
            defineNativeRouteIDs(sdk);

            checkPluginActivateOrNot();

            renderUserFeeds();

            /******************************************************************************* */
            /*               BUTTER BAR RELATED FUNCTIONS STARTS                             */
            /******************************************************************************* */
            //#region
            showButterBarMsg('Activating SalesHandy');

            //#endregion
            /******************************************************************************* */
            /*               BUTTER BAR RELATED FUNCTIONS ENDS                               */
            /******************************************************************************* */

            /**
             * Add toolbar to Gmail
             */
            renderAppToolBarSection();
            /**
             * Extend compose box
             */
            renderComposeBoxSection();

            renderMessageOpenSection();
        }, 1000);
    });

    function checkForWelcomeCompose() {
        let userInfoObj = getUserInfoFromLocal();
        if (userInfoObj && userInfoObj.isPluginActivated) {
            getUserPreferencesViaPromise().then(res => {
                let stopOnBoardMail = res.preferences.STOP_ONBOARD_MAIL || 0;
                // Double negation to turn 1 to boolean  = true
                if (!!!stopOnBoardMail) {
                    showWelcomeCompose(sdk);
                }
            });
            window.addEventListener(
                'keydown',
                function(event) {
                    if (event.defaultPrevented) {
                        return; // Should do nothing if the default action has been cancelled
                    }
                    var handled = false;
                    if (event.key === 'Escape') {
                        if (event.target && event.target.id === 'TimeZonePickerInput') {
                            // return;
                        } else {
                            hideDropUps();
                            event.preventDefault();
                            event.stopImmediatePropagation();
                        }
                        handled = true;
                    }
                    if (handled) {
                        // Suppress "double action" if event handled
                        event.preventDefault();
                    }
                },
                true
            );
        }
    }

    function checkPluginActivateOrNot(){
        isPluginTempDeactivated = (getUserInfoFromLocal() && getUserInfoFromLocal().isPluginTempDeactivated) || false;
    }

    function renderUserFeeds() {
        let feedResponse = getUserFeeds();
        feedResponse &&
            feedResponse.then(res => {
                let userInfoObj = getUserInfoFromLocal();
                if (res.error && userInfoObj && userInfoObj.auth_token) return;
                allFeeds = res;
            });
    }

    function delayFunction(callback) {
        if (!isUserPreferencesLatest) {
            setTimeout(delayFunction, 100, callback);
        } else {
            callback();
        }
    }

    /******************************************************************************* */
    /*                WELCOME MODAL / USER AUTH RELATED FUNCTIONS START              */
    /******************************************************************************* */
    //#region
    function authenticateUser() {
        return new Promise((resolve, reject) => {
            checkUserExist(currentUserEmail).then(res => {
                if (res.error){
                    onError(res);
                    reject(res);
                }
                isUserExist = res.exists;
                let mainUserInfoObj = JSON.parse(localStorage.getItem('mainUserInfoObj')) || {};

                // Is the email blacklisted or not.
                let isBlacklisted = false;

                // Prevent plugin activation for blacklisted error only if the auth token doesn't exists.

                // Check if the auth token doesn't not exists.
                if (!mainUserInfoObj[btoa(currentUserEmail)] || !mainUserInfoObj[btoa(currentUserEmail)].auth_token) {
                    // Check if the auth token doesn't exists in the /account-exists response either.
                    if (res['auth_token']) {
                        setAuthTokenForNewUser({ auth_token: res['auth_token'], email: currentUserEmail });
                    } else {
                        // Is the error code for blacklisted error?
                        isBlacklisted = isBlacklistedErrorCode(res.error_code);
                    }
                }

                const data = { isBlacklisted };

                // Check if response contains blacklisted error.
                if (isBlacklisted && res.error_code && res.error_message) {
                    data.error = {
                        error_code: res.error_code,
                        error_message: res.error_message
                    };
                }

                // Set blacklisted data.
                setBlacklistedError(data);

                resolve(res);
            }).catch((error) => {
                resolve(error);
            });
        });
    }

    /**
     * Set blacklisted error.
     *
     * Store blacklisted error data in local storage.
     *
     * @param {Object} data Error data to be stored.
     */
    function setBlacklistedError(data) {
        const { isBlacklisted, error } = data;

        // Prepare an object to add to an existing user data object.
        let valuesToAdd = {
            isBlacklisted
        };

        if (error) {
            // Attach error object.
            valuesToAdd.blacklistedError = error;
        }

        // Get exiting user data stored in local storage.
        let userInfo = getUserInfoFromLocal();

        if (!userInfo) {
            userInfo = valuesToAdd;
        } else {
            // Add new data to be stored to an existing data.
            _.extend(userInfo, valuesToAdd);
        }

        // Store the updated data to local storage.
        setUserInfoInLocal(userInfo);
    }

    function setAuthTokenForNewUser(data){
        let { auth_token, email} = data;
        let mainUserInfoObj = JSON.parse(localStorage.getItem('mainUserInfoObj')) || {};
        let emailFromAuthSide = email;
        let userInfoObj = getUserInfoFromLocal(emailFromAuthSide);
        let defaultValuesToAdd = {
            isPluginActivated: true,
            auth_token: auth_token,
            isUserExist: true,
            firstLoadAfterAuth: true
        };
        if (!userInfoObj) {
            userInfoObj = defaultValuesToAdd;
        } else {
            _.extend(userInfoObj, defaultValuesToAdd);
        }
        mainUserInfoObj[btoa(emailFromAuthSide)] = userInfoObj;
        window.localStorage.setItem('mainUserInfoObj', JSON.stringify(mainUserInfoObj));
    }

    window.showWelcomeMessage = showWelcomeMessage;

    let welcomeSliderIntervalRef = null;
        setInterval(() => {
        if (false) {
            showSlides();
        }
    }, 5000);

    function showWelcomeMessage(forcedOpen) {
        if (isEmailBlacklisted() || isUserDeactivatedModal() && !forcedOpen) return;

        let modalOptions = getWelcomeModalOptions();
        modalView = sdk.Widgets.showModalView(modalOptions);

        let activateModalContainer = modalView._modalViewDriver._modalContainerElement;
        let modalBtnContainer = activateModalContainer.querySelector('.inboxsdk__modal_buttons');
        let closeBtnContainer = activateModalContainer.querySelector('.inboxsdk__modal_close');
        const modalTopRow = activateModalContainer.querySelector('.inboxsdk__modal_toprow');
        let modalContentContainer = activateModalContainer.querySelector('.inboxsdk__modal_content');
        let modalContainer = activateModalContainer.querySelector('.inboxsdk__modal_container');
        modalTopRow.classList.add('ActiveHead');
        modalBtnContainer.classList.add('ActiveContainer');
        closeBtnContainer.classList.add('ActiveContainerClose');
        modalContentContainer.classList.add('ActiveContentContainer');
        modalContainer.classList.add('ActiveMainContainer');
        modalContainer.id = 'remove-active-plugin-focus';
        closeBtnContainer.setAttribute('data-tooltip', 'Close');

        let isPluginActivated = getUserInfoFromLocal() && getUserInfoFromLocal().isPluginActivated;

        if(isPluginActivated){
            document.getElementById('lets-get-started').addEventListener('click', letgetStartedClick);
        } else {
            document.getElementById('activate_plugin').addEventListener('click', setAuthToken);
            document.getElementById('dont_show_again').addEventListener('click', setupDontShowAgain);
        }

        let dots = document.querySelector("#dotContainer");
        dots.addEventListener('click', sliderHandler, false);
        document.getElementById("remove-active-plugin-focus").focus();
        modalView.on('destroy', function() {
            dots.removeEventListener('click', sliderHandler, false);
            setupDontShowAgain();
            clearInterval(welcomeSliderIntervalRef);
        });

        gotoSlide(0);
        addSlideImage();
        welcomeSliderIntervalRef = setInterval(() => {
            if (true) {
                gotoSlide((slideIndex + 1) % 4);
            }
        }, 5000);
    }

    const sliderHandler = (evt) => {
        if (!evt.target.matches('.dot')) return;
        let p = evt.target.id.slice(-1);
        if (p) {
            gotoSlide(+p-1)
        }
        evt.preventDefault();
    }

    var slideIndex = 0;
    function gotoSlide(index) {
        var slides = document.getElementsByClassName("mySlides");
        var dots = document.getElementsByClassName("dot");
        for (i = 0; i < slides.length; i++) {
            slides[i].style.display = "none";
        }
        slideIndex = index;
        if (slideIndex > slides.length) {slideIndex = 0}
        for (i = 0; i < dots.length; i++) {
            dots[i].className = dots[i].className.replace(" active", "");
        }
        slides[slideIndex].style.display = "block";
        dots[slideIndex].className += " active";
    }


    function addSlideImage() {
        var imgOne = new Image();
        imgOne.src = chrome.extension.getURL('images/1.png');
        document.getElementById('obSlideOne').appendChild(imgOne);

        var imgTwo = new Image();
        imgTwo.src = chrome.extension.getURL('images/2.png');
        document.getElementById('obSlideTwo').appendChild(imgTwo);

        var imgThree = new Image();
        imgThree.src = chrome.extension.getURL('images/3.png');
        document.getElementById('obSlideThree').appendChild(imgThree);

        var imgFour = new Image();
        imgFour.src = chrome.extension.getURL('images/4.png');
        document.getElementById('obSlideFour').appendChild(imgFour);
    }

    // BF-CM - Offer - Start
    function openBFMFModal(){
        let modalOptions = getBFCMModalOptions();
        modalView = sdk.Widgets.showModalView(modalOptions);
        const get_bf_cf_modal_btn_ref = document.getElementById('get-bf-cm_offer-button');

        const getBFCMOfferRes = getBFCMOfferObject();
        const bf_cm_offer_text_ref = document.getElementById('bf-cm-offer-text');

        let specialOfferModal = modalView._modalViewDriver._modalContainerElement;
        let closeBtnContainer = specialOfferModal.querySelector('.inboxsdk__modal_close');
        const modalTopRow = specialOfferModal.querySelector('.inboxsdk__modal_toprow');
        let modalContentContainer = specialOfferModal.querySelector('.inboxsdk__modal_content');
        let modalContainer = specialOfferModal.querySelector('.inboxsdk__modal_container');

        modalTopRow.classList.add('offerTopRow');
        closeBtnContainer.classList.add('offerCloseBtnContainer');
        modalContentContainer.classList.add('offerMainContentContainer');
        modalContainer.classList.add('offerMainContainer');

        if(bf_cm_offer_text_ref){
            bf_cm_offer_text_ref.innerText = getBFCMOfferRes.offerName;
        }

        if(get_bf_cf_modal_btn_ref){
            get_bf_cf_modal_btn_ref.addEventListener('click', function () {
                openSpecialOffer();
                setTimeout(function () {
                    modalView.close();
                }, 1000);
            });
        }

        startBFCMRemainingTimeOffer();
        modalView.on('destroy', function() {
            localStorage.setItem('bf_cf_popup_time', Date.now().toString());
            stopCountDownTimer();
        });
    }

    function getBFCMOfferObject() {
        const currentDate = new Date().getTime();
        const offerStartDate = new Date('Dec 15, 2019 23:59:00').getTime();
        const christmasOfferEndDate = new Date('Dec 27, 2019 23:59:00').getTime();
        const extendedChristmasOfferEndDate = new Date('Dec 31, 2019 23:59:00').getTime();

        let currentOfferDate;
        let offerName;

        if(currentDate < offerStartDate) {
            currentOfferDate = '';
            offerName = '';
        } else if (currentDate <= christmasOfferEndDate) {
            offerName = 'Christmas offer is valid until December 27, 2019';
            currentOfferDate = christmasOfferEndDate;
        } else if (currentDate > christmasOfferEndDate && currentDate <= extendedChristmasOfferEndDate) {
            offerName = 'Extended Christmas offer is valid until December 31, 2019';
            currentOfferDate = extendedChristmasOfferEndDate;
        } else {
            offerName = '';
            currentOfferDate = '';
        }
        return { offerName, currentOfferDate };
    }

    function stopCountDownTimer() {
        if(bfCmOfferTimerRef) {
            clearInterval(bfCmOfferTimerRef);
        }
    }

    function startCountDownTimer(countDownDate) {
        bfCmOfferTimerRef = setInterval(function() {
            const now = new Date().getTime();
            let distance = 0;
            if(countDownDate > now){
                distance = countDownDate - now;
            }
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / (1000));

            const counterBlockElementref = document.getElementById('timer-container-id');
            if (counterBlockElementref){
                counterBlockElementref.innerHTML = '<span>' + days + 'd </span>' +
                    '<span>' + hours + 'h</span>' +
                    '<span>' + minutes + 'm</span>' +
                    '<span>' + seconds + 's</span>';
                if ((distance - 1000) < 1) {
                    clearInterval(bfCmOfferTimerRef);
                    startBFCMClock();
                }
            }
        }, 1000);
    }

    function startBFCMClock() {
        const getBFCMOffer = getBFCMOfferObject();
        if(getBFCMOffer.currentOfferDate){
            startCountDownTimer(getBFCMOffer.currentOfferDate);
        }
    }

    function openSpecialOffer() {
        if(!bfCmDetails) return;
        let { plan_name, plan_code } = bfCmDetails;
        let plan_type = 'FREE';
        if(plan_code === 'FREE'){
            plan_type = 'FREE';
        }  else if(plan_code.includes('TRIAL')) {
            plan_type = 'TRIAL';
        } else {
            plan_type = 'PAID';
        }

        if (plan_name.indexOf('Monthly') !== -1 && plan_type !== 'TRIAL') {
            window.open(`${mainApplication}billing/special-offer/christmas-offer?app_source=CHROME_PLUGIN`);
        } else if ((plan_type === 'FREE' || plan_type === 'TRIAL')) {
            window.open(`${mainApplication}billing/information?action=subscribe&period=1&plan=2&app_source=CHROME_PLUGIN`);
        } else {
            window.open(`${mainApplication}billing/information?action=upgrade&period=1&app_source=CHROME_PLUGIN`);
        }
    }

    function startBFCMRemainingTimeOffer() {
        if(isEligibleForBFCFOffer){
            const sh_sidebar_bf_cf_ref = document.getElementById('sh_sidebar_bf_cf');
            if(sh_sidebar_bf_cf_ref){
                sh_sidebar_bf_cf_ref.addEventListener('click', function () {
                    openSpecialOffer();
                });
                startBFCMClock();
            }

            const popup_timer_container_ref = document.getElementById('timer-container-id');
            if(popup_timer_container_ref){
                startBFCMClock();
            }
        }
    }

    function checkBGMFPermission(){
        let getBFCMOfferDetail = getBFCMOfferObject();
        let { auth_token } = getUserInfoFromLocal();
        if(auth_token && getBFCMOfferDetail.currentOfferDate){
            getBFCMPermission(currentUserEmail).then((res) => {
                if(res.is_email_exist && !res.is_yearly && !res.cancel_applied && res.billing_permission){
                    bfCmDetails = res;
                    isEligibleForBFCFOffer = true;

                    const localStorageValue = localStorage.getItem('bf_cf_popup_time');
                    const bf_cf_popup =  new Date(+localStorageValue);

                    var showPopUp = false;
                    let currentTime = new Date();

                    if(!localStorageValue) {
                        showPopUp = true;
                    } else if(localStorageValue && (
                        currentTime.getDate() > bf_cf_popup.getDate() &&
                        currentTime.getMonth() == bf_cf_popup.getMonth() &&
                        currentTime.getFullYear() == bf_cf_popup.getFullYear())){
                            showPopUp = true;
                    }
                    if(showPopUp) {
                        openBFMFModal();
                    }

                    let x = document.querySelector('.sh_toolbar_pref_icon');
                    if(x){
                        x.classList.add('sh_toolbar_offer_badge');
                    }
                }
            }, error => {
                isEligibleForBFCFOffer = false;
            })
        }
    }

    function getBFCMModalOptions() {
        let modalOptions = {};
        let modal_el = getNewElement();
        modal_el.style = 'width: 585px;height:500px';

        let tmpl_modal_complied = _.template(bg_cm_offer_popup);
        modal_el.innerHTML = tmpl_modal_complied();

        modalOptions.el = modal_el;
        return modalOptions;
    }
    // BF-CM - Offer - End

    function isUserDeactivatedModal() {
        let userInfoObj = getUserInfoFromLocal();
        return userInfoObj && userInfoObj.disableWelcomeModal;
    }

    function getWelcomeModalOptions() {
        let modal_template_vars = {
            currentUserEmail
        };
        let modalOptions = {};
        let tmpl_modal_complied;
        let modal_el = getNewElement();

        if (usingNewGmail) {
            modal_el.style = 'width: 665px;float: left;';
        } else {
            modal_el.style = 'width: 665px;float: left;';
        }

        tmpl_modal_complied = _.template(tmpl_welcome_modal_activated);
        modal_el.innerHTML = tmpl_modal_complied(modal_template_vars);

        modalOptions.el = modal_el;
        return modalOptions;
    }

    function signInWithGoogleFromPlugin() {
        let mainUserInfoObj = JSON.parse(window.localStorage.getItem('mainUserInfoObj')) || {};
        let userInfoObj = getUserInfoFromLocal();
        _.extend(userInfoObj, {
            isJustRegistered: true
        });
        mainUserInfoObj[btoa(currentUserEmail)] = userInfoObj;
        window.localStorage.setItem('mainUserInfoObj', JSON.stringify(mainUserInfoObj));
        setAuthToken();
    }

    function setupDontShowAgain() {
        let userInfoObj = getUserInfoFromLocal();
        const { auth_token } = userInfoObj;
        _.extend(userInfoObj, {
            disableWelcomeModal: true
        });
        setUserInfoInLocal(userInfoObj);
        if(!auth_token){
            let activateDiv = document.querySelector('.sh_sidebar');
            if (activateDiv) activateDiv.textContent = 'Activate SalesHandy';
        }
        modalView.close();
    }

    function createMainUserInfoObj() {
        let mainUserInfoObj = JSON.parse(window.localStorage.getItem('mainUserInfoObj')) || {};
        let userInfoObj = getUserInfoFromLocal();
        let initValue = {
            isUserExist
        };
        if (userInfoObj) {
            _.extend(userInfoObj, initValue);
        } else {
            userInfoObj = initValue;
        }
        mainUserInfoObj[btoa(currentUserEmail)] = userInfoObj;
        console.log(' Create Main User Info Object :: ', userInfoObj);
        window.localStorage.setItem('mainUserInfoObj', JSON.stringify(mainUserInfoObj));
    }

    function setUserInfoInLocal(userInfoObj) {
        let mainUserInfoObj = JSON.parse(window.localStorage.getItem('mainUserInfoObj')) || {};
        mainUserInfoObj[btoa(currentUserEmail)] = userInfoObj;
        window.localStorage.setItem('mainUserInfoObj', JSON.stringify(mainUserInfoObj));
    }
    //#endregion
    /******************************************************************************* */
    /*                WELCOME MODAL / USER AUTH RELATED FUNCTIONS ENDS               */
    /******************************************************************************* */

    /******************************************************************************* */
    /*                APPLICATION TOOLBAR RELATED FUNCTIONS STARTS                   */
    /******************************************************************************* */
    //#region
    /* toolbar section which show Activate and Feeds buttons */
    function renderAppToolBarSection() {
        let isPluginActivated = getUserInfoFromLocal() && getUserInfoFromLocal().isPluginActivated;
        let toolBarButtonForPreferences = getToolbarButtonDescriptorForPreferences();
        let toolBarViewForPreferences = sdk.Toolbars.addToolbarButtonForApp(toolBarButtonForPreferences);
        if (toolBarViewForPreferences) {
            attachStyleToActivateBtn();
        }

        if (!isPluginActivated) return;

        // Chrome Feed visibility based on preferences
        getUserPreferencesViaPromise().then(res=>{
            const canShowNewFeed = !!res.preferences.NEWFEEDS || false;
            let toolbarButtonDescriptorForFeeds = getToolbarButtonDescriptorForFeeds(canShowNewFeed);
                let toolbarButtonViewForFeeds = sdk.Toolbars.addToolbarButtonForApp(toolbarButtonDescriptorForFeeds);
                if (toolbarButtonViewForFeeds) {
                    attachStyleToFeedBtn();
                }
        })


    }

    function getToolbarButtonDescriptorForPreferences() {
        return (objAppToolbarButtonDescriptorForOptions = {
            title: getToolBarBtnTitle(),
            titleClass: 'sh_menubar_option sh_sidebar sh_toolbar_pref_button',
            iconUrl: chrome.extension.getURL('images/sh_logo_main.png'),
            iconClass: 'sh_toolbar_pref_icon',
            onClick: function(event) {
                event.dropdown.close();
                if (!getUserInfoFromLocal()) return;

                if (isEmailBlacklisted()) {
                    const error = getBlacklistedError();
                    error.title = 'Email Blacklisted';
                    // Show blacklisted error popup.
                    onError(error);
                    return;
                }

                let { disableWelcomeModal, isPluginActivated, error } = getUserInfoFromLocal();
                if (disableWelcomeModal && !isPluginActivated) {
                    if (error && ACC_NOT_WORKING_CODE.includes(error.error_code)) {
                        error.showErrorWithSudo = true;
                        return onError(error);
                    }
                    showWelcomeMessage(true);
                } else {
                    if (!isPluginActivated) return;
                    delayFunction(renderSideDrawerContentForPref);
                }
            }
        });
    }

    function getToolBarBtnTitle() {
        let userInfoObj = getUserInfoFromLocal();
        if (!userInfoObj) return '';
        let { disableWelcomeModal, isPluginActivated } = userInfoObj;

        if (isEmailBlacklisted() || disableWelcomeModal && !isPluginActivated) {
            return 'Activate SalesHandy';
        } else {
            return '';
        }
    }

    function getToolbarButtonDescriptorForFeeds(canShowNewFeed) {
        const iconName = canShowNewFeed ? 'NewFeed.png' : 'feed.png'
        return {
            title: 'Feeds',
            titleClass: 'sh_menubar_option sh_feeds_button',
            iconUrl: chrome.extension.getURL(`images/${iconName}`),
            iconClass: 'sh_toolbar_feed_icon',
            onClick: function(event) {
                event.dropdown.close();
                if(canShowNewFeed){
                    onChromeFeedIconClick();
                }else{
                    gotUserFeeds().then(() => renderSideDrawerContentForFeeds());
                }
            }
        };
    }

    function renderSideDrawerContentForPref() {
        try {
            chrome.storage.sync.get(['showLocalNotification'], function(items) {
                showLocalNotification = items.showLocalNotification;
                let sideDrawerOptions = getSideDrawerOptionsForPref();
                let sideDrawerView = sdk.Widgets.showDrawerView(sideDrawerOptions);

                startBFCMRemainingTimeOffer();

                let tempDeactivateBtn = document.getElementById('deactivate_plugin_btn');
                tempDeactivateBtn.prefSideDrawerView = sideDrawerView;
                tempDeactivateBtn.addEventListener('click', tempDeactivatePlugin);

                let helpSideBar = document.getElementById('help-side-bar-wrapper');

                if (isPluginTempDeactivated) {
                    helpSideBar.classList.remove('help-side-bar-wrapper-class');
                } else {
                    helpSideBar.classList.add('help-side-bar-wrapper-class');
                }

                if (isPluginTempDeactivated) return;

                showDefaultTimeAndTimezoneSetting();
                setupUpMsgForDisabledPowerBySwitch();

                document.getElementById('use_current_time_timezone').addEventListener('change', showHideTimeAndTimeZoneArea);

                document.getElementById('toggle_isAlwaysTrackLink').addEventListener('change', toggleLinkTrackingPref);
                if (FEATURE_FLAGS.POWERED_BY_SIGNATURE) {
                    document.getElementById('toggle_isPoweredBy').addEventListener('change', updatePreferences);
                }
                document.getElementById('toggle_isShowAll').addEventListener('change', updatePreferences);
                document.getElementById('toggle_isAlwaysTrackEmail').addEventListener('change', updatePreferences);
                document.getElementById('chromeTemplateIcon').addEventListener('change', updatePreferences);
                document.getElementById('toggle_isAutoFillBCC').addEventListener('change', updatePreferences);
                document.getElementById('toggle_isTeamTrackingOn').addEventListener('change', updatePreferences);
                document.getElementById('toggle_isDoubleTickOff') &&
                    document.getElementById('toggle_isDoubleTickOff').addEventListener('change', changeReadReceiptStatus);
                document.getElementById('reset_plugin').addEventListener('click', resetPluginForAccount);
                let upgradeBtnSideDrawerElement = document.getElementById('upgradeBtnSideDrawer');
                if(upgradeBtnSideDrawerElement){
                    upgradeBtnSideDrawerElement.addEventListener('click', showcrossPlatformPricing);
                }

                sideDrawerView.on('destroy', () => {
                    let { preferences } = userPreferencesRes;

                    //Check presence of field
                    if (_.has(defaultSchTimeAndTimezone, 'defaultTimeForSch')) {
                        // Check if same as previous value,
                        if (_.has(preferences, 'U_DEFAULT_ESCH_TIME')) {
                            //compare - if different - update
                            if (preferences.U_DEFAULT_ESCH_TIME != defaultSchTimeAndTimezone.defaultTimeForSch)
                                updatePrefInDB('defaultTimeForSch');
                        } else {
                            updatePrefInDB('defaultTimeForSch');
                        }
                    }

                    if (_.has(defaultSchTimeAndTimezone, 'defaultTimezoneForSch')) {
                        if (_.has(preferences, 'U_DEFAULT_ESCH_TIMEZONE')) {
                            if (preferences.U_DEFAULT_ESCH_TIMEZONE != defaultSchTimeAndTimezone.defaultTimezoneForSch)
                                updatePrefInDB('defaultTimezoneForSch');
                        } else {
                            updatePrefInDB('defaultTimezoneForSch');
                        }
                    }
                    defaultSchTimeAndTimezone = {};
                    stopCountDownTimer();
                });
            });
        } catch (e) {
            console.log(e);
            if (e) location.reload();
        }
    }

    function renderSideDrawerContentForFeeds() {
        let sideDrawerOptions = getSideDrawerOptionsForFeeds();
        let feedsDrawer = sdk.Widgets.showDrawerView(sideDrawerOptions);
        let nodes = document.querySelectorAll('#refresh-feeds-icon');
        nodes[nodes.length - 1].addEventListener('click', handleRefreshFeed);
        let drawerView = document.querySelector('.inboxsdk__drawer_view_container');
        let upgrade_btns = drawerView && drawerView.querySelectorAll('.upgrade_now, .upgrade_plan_link');
        upgrade_btns &&
            Array.from(upgrade_btns).forEach(upgrade_btn => {
                upgrade_btn && upgrade_btn.removeEventListener('click', showcrossPlatformPricing);
                upgrade_btn && upgrade_btn.addEventListener('click', showcrossPlatformPricing);
            });
    }

    function handleRefreshFeed() {
        this.style.pointerEvents = 'none';
        allFeeds = undefined;
        gotUserFeeds().then(() => {
            renderSideDrawerContentForFeeds();
        });
    }

    function getSideDrawerOptionsForPref() {
        preference_sidebar_template_vars = getSideBarTemplateVars();
        let preference_sidebar_template_compiled = _.template(tmpl_preference_sidebar);
        let preference_sidebar_el = getNewElement();
        preference_sidebar_el.innerHTML = preference_sidebar_template_compiled(preference_sidebar_template_vars);

        return (sideDrawerOptions = {
            el: preference_sidebar_el,
            title: 'SalesHandy'
        });
    }

    function getSideDrawerOptionsForFeeds() {
        let { rows, subscription_button, is_user_free, total_records } = allFeeds;
        let { can_upgrade } = userPreferencesRes;

        if (can_upgrade) {
            subscription_button = true;
            is_user_free = true;
        }

        let feeds_sidebar_template_vars = {
            rows: rows || [],
            is_user_free: is_user_free || false,
            total_records,
            subscription_button: subscription_button || false,
            current_version: CURRENT_CHROME_VERSION
        };

        let feeds_sidebar_template_compiled = _.template(tmpl_feeds_sidebar);
        let feeds_sidebar_el = getNewElement();
        feeds_sidebar_el.innerHTML = feeds_sidebar_template_compiled(feeds_sidebar_template_vars);

        return (sideDrawerOptions = {
            el: feeds_sidebar_el,
            title: 'SalesHandy'
        });
    }

    function checkAutoFillCcBccValue(preferences) {
        let isCCPresent = _.has(preferences, 'U_CC') && !!preferences.U_CC.length;
        let isCcBccPresent = isCCPresent || (_.has(preferences, 'U_BCC') && !!preferences.U_BCC.length);
        let turnCcBccActive = false;
        if (isCcBccPresent || isCCPresent) turnCcBccActive = true;
        if (_.has(preferences, 'U_AUTO_FILL_BCC')) {
            let autoFillPrefValue = !!+preferences.U_AUTO_FILL_BCC;
            if (!autoFillPrefValue) {
                turnCcBccActive = false;
            }
        }
        return {
            isCcBccPresent,
            turnCcBccActive: turnCcBccActive
        };
    }

    function getBCCListToDisplayInSidebar() {
        let bccList = userPreferencesRes.preferences.U_BCC || '';
        let ccList = userPreferencesRes.preferences.U_CC || '';
        bccList = bccList.split(',') || [];
        ccList = ccList.split(',') || [];
        bccList = ccList.concat(bccList);
        return bccList.length > 1 ? `${bccList[0]}...` : bccList[0];
    }

    function getBFCMCountDownSection() {
        let modal_el = getNewElement();

        let tmpl_modal_complied = _.template(bf_cm_offer_coutdown);
        modal_el.innerHTML = tmpl_modal_complied();
        return modal_el;
    }

    function getSideBarTemplateVars() {
        let { preferences, can_upgrade, current_plan, days_left, branding_change_disable, id, plan_code } = userPreferencesRes;
        if (!preferences) preferences = getDefaultPreferences();
        let isPoweredBy = getPoweredByValueForSidebar();
        let userSpecificLocalNotData = showLocalNotification.find(notLocal => notLocal.userID == id);
        let showDaysLeft = _.has(userPreferencesRes, 'days_left') ? true : false;
        let bccRelatedValue = checkAutoFillCcBccValue(preferences);
        HAS_PAUSED_SUBSCRIPTION = userPreferencesRes.has_paused;

        return (preference_sidebar_template_vars = {
            currentUserName: userPreferencesRes.first_name + ' ' + userPreferencesRes.last_name,
            currentUserEmail,
            toggle_isPoweredBy: isPoweredBy,
            toggle_isShowAll: userSpecificLocalNotData.showNotLocal,
            toggle_isAlwaysTrackEmail: preferences.U_TRACK_EMAILS === '1' ? true : false,
            chromeTemplateIcon: preferences.CHROME_TEMPLATE_ICON == '1' ? true : false,
            toggle_isAlwaysTrackLink:
                CURRENT_PRICING_PLAN_CODE !== 'FREE' && !HAS_PAUSED_SUBSCRIPTION && preferences && preferences.U_TRACK_CLICKS == '1' ? true : false,
            toggle_isAutoFillBCC: bccRelatedValue.turnCcBccActive,
            bccEmail: bccRelatedValue.isCcBccPresent ? getBCCListToDisplayInSidebar() : 'Add Cc/Bcc to turn on',
            CcBccList: ((preferences.U_BCC && preferences.U_BCC.split(',')) || []).concat(
                (preferences.U_CC && preferences.U_CC.split(',')) || []
            ),
            toggle_isTeamTrackingOn: preferences.TRACKING_FOR_MY_TEAM === '0' ? false : true,
            toggle_isDoubleTickOff: areSHReadReceiptsOff(currentUserEmail),
            allow_doubletick_disable: preferences.ALLOW_DOUBLE_TICK_DISABLE === '1',
            mainApplication,
            can_upgrade,
            current_plan,
            days_left,
            showDaysLeft,
            branding_change_disable,
            isPluginTempDeactivated,
            current_version: CURRENT_CHROME_VERSION,
            isEligibleForBFCFOffer,
            hasPausedSubscription: HAS_PAUSED_SUBSCRIPTION
        });
    }

    function getPoweredByValueForSidebar() {
        if (FEATURE_FLAGS.POWERED_BY_SIGNATURE) {
            return false;
        }
        let { preferences, branding_change_disable } = userPreferencesRes;
        if (!preferences) preferences = getDefaultPreferences();
        if (branding_change_disable) return true;
        return preferences.U_POWERED_BY_SH === '1' ? true : false;
    }

    function updatePreferences(event) {
        this.checked = preference_sidebar_template_vars[this.id] ? false : true;
        preference_sidebar_template_vars[this.id] = !preference_sidebar_template_vars[this.id];
        if (this.id == 'toggle_isShowAll') return toggleNotificationSetting();
        preferencesChanged = true;
        this.disabled = true;
        const prefWrapper = this.closest('.sh_sidebar_pref_wrapper');
        if (prefWrapper) {
            prefWrapper.classList.add('prefChangeDisabled');
        }
        updatePrefInDB(this.id, undefined, prefWrapper);
    }

    function toggleLinkTrackingPref() {
        // Check for plan paused
        if (CURRENT_PRICING_PLAN_CODE === 'FREE' || HAS_PAUSED_SUBSCRIPTION) {
            if (CURRENT_PRICING_PLAN_CODE === 'FREE') {
                showPricingPopUp();
            }
            if (HAS_PAUSED_SUBSCRIPTION) {
                showPricingPopUp(PAUSED_SUBSCRIPTION_POPUP_MSG, { error_code: PAUSED_SUBSCRIPTION_ERR_CODE });
            }

            this.checked = false;
            return;
        }
        this.checked = preference_sidebar_template_vars[this.id] ? false : true;
        preference_sidebar_template_vars[this.id] = !preference_sidebar_template_vars[this.id];
        preferencesChanged = true;
        const prefWrapper = this.closest('.sh_sidebar_pref_wrapper');
        if (prefWrapper) {
            prefWrapper.classList.add('prefChangeDisabled');
        }
        updatePrefInDB(this.id, undefined, prefWrapper);
    }

    function toggleNotificationSetting() {
        let { id } = userPreferencesRes;
        let userIndexInLocalNotArray = -1;
        let userSpecificLocalNotData = showLocalNotification.find((notLocal, index) => {
            userIndexInLocalNotArray = index;
            return notLocal.userID == id;
        });
        let { showNotLocal } = userSpecificLocalNotData;
        userSpecificLocalNotData.showNotLocal = !showNotLocal;
        showLocalNotification[userIndexInLocalNotArray].showNotLocal = !showNotLocal;
        chrome.storage.sync.set({
            showLocalNotification: showLocalNotification
        });
        let objToBackground = {
            userID: userPreferencesRes.id,
            shref: userPreferencesRes.shref
        };
        objToBackground = _.extend(
            {
                startNotify: !showNotLocal
            },
            objToBackground
        );
        sendMessageToBackground(objToBackground);
    }

    function showDefaultTimeAndTimezoneSetting() {
        let { preferences } = userPreferencesRes;
        let time_and_timezone_setting_template_compiled_vars = getDefaultTimeAndTimezoneSettingVars();
        let time_and_timezone_setting_template_compiled = _.template(tmpl_schedule_time);
        document.getElementById('sidebar_default_time_timezone_setting').innerHTML = time_and_timezone_setting_template_compiled(
            time_and_timezone_setting_template_compiled_vars
        );
        let presenceOfDefaultTime = checkPresenceOfPropertyInObject(preferences, 'U_DEFAULT_ESCH_TIME');
        let presenceOfDefaultTimezone = checkPresenceOfPropertyInObject(preferences, 'U_DEFAULT_ESCH_TIMEZONE');
        if (presenceOfDefaultTime || presenceOfDefaultTimezone) {
            showHideTimeAndTimeZoneArea(true);
        }
    }

    function getDefaultTimeAndTimezoneSettingVars() {
        let { preferences } = userPreferencesRes;
        let defaultTimeAndTimezonePresent = false;
        let presenceOfDefaultTime = checkPresenceOfPropertyInObject(preferences, 'U_DEFAULT_ESCH_TIME');
        let presenceOfDefaultTimezone = checkPresenceOfPropertyInObject(preferences, 'U_DEFAULT_ESCH_TIMEZONE');
        if (presenceOfDefaultTime || presenceOfDefaultTimezone) {
            defaultTimeAndTimezonePresent = true;
        }
        return {
            oTimeZones,
            mainApplication,
            defaultTimeAndTimezonePresent
        };
    }

    function showHideTimeAndTimeZoneArea(checkedValue) {
        if (this.checked !== undefined) checkedValue = this.checked;
        let timeAndTimeZoneArea = document.getElementById('time_and_timezone_area');
        timeAndTimeZoneArea.style.display = checkedValue ? 'block' : 'none';

        if (checkedValue) {
            populateTimeSection();
            populateTimezoneSection();
        } else {
            updatePrefInDB('defaultTimeForSch', true);
            updatePrefInDB('defaultTimezoneForSch', true);
        }
    }

    function populateTimeSection() {
        let setDefaultDate = getDefaultDateForSidebar();
        timePickerInSch = flatpickr('#sidebar-timepicker', {
            enableTime: true,
            noCalendar: true,
            defaultDate: setDefaultDate,
            dateFormat: 'h:i K',
            static: true,
            minuteIncrement: 15,
            onChange: function(s, timePicked, t) {
                timePicked = moment(timePicked, 'hh:mm A').format('HH:mm:ss');
                defaultSchTimeAndTimezone.defaultTimeForSch = timePicked;
            }
        });

        defaultSchTimeAndTimezone.defaultTimeForSch = moment(timePickerInSch.element.value, 'hh:mm A').format('HH:mm:ss');
    }

    function getDefaultDateForSidebar() {
        let { preferences } = userPreferencesRes;
        let setDefaultDate = new Date();
        let valueofTimeFromDB = preferences.U_DEFAULT_ESCH_TIME;
        let presenceOfDefaultTime = checkPresenceOfPropertyInObject(preferences, 'U_DEFAULT_ESCH_TIME');

        if (presenceOfDefaultTime) {
            let [hourToSet, minuteToSet] = valueofTimeFromDB.split(':');
            setDefaultDate.setMinutes(minuteToSet);
            setDefaultDate.setHours(hourToSet);
        } else {
            let minuteToSet = Math.ceil(new Date().getMinutes() / 15) * 15;
            setDefaultDate.setMinutes(minuteToSet);
        }
        return setDefaultDate;
    }

    function populateTimezoneSection() {
        let { preferences } = userPreferencesRes;
        let sidebarTimezone = document.getElementById('sidebar-timezone');
        let presenceOfDefaultTimezone = checkPresenceOfPropertyInObject(preferences, 'U_DEFAULT_ESCH_TIMEZONE');
        if (presenceOfDefaultTimezone) {
            sidebarTimezone.value = checkAndGetCorrectTz(preferences.U_DEFAULT_ESCH_TIMEZONE);
        } else {
            sidebarTimezone.value = checkAndGetCorrectTz();
        }
        defaultSchTimeAndTimezone.defaultTimezoneForSch = sidebarTimezone.value;
        if (typeof timeZoneAutoCompleteSB.destroy === 'function') {
            timeZoneAutoCompleteSB.destroy();
        }
        timeZoneAutoCompleteSB = new autoComplete({
            selector: '#sidebar-timezone',
            minChars: 0,
            menuClass: ' sidebar-autocomplete-tz',
            selectedTimezone: defaultSchTimeAndTimezone.defaultTimezoneForSch,
            source: function(sSearchString, suggest) {
                sSearchString = sSearchString.trim().toLowerCase();
                choices = groupedByCategory;
                var suggestions = [];
                if (sSearchString.length === 0) {
                    Object.keys(groupedByCategory)
                        .sort(function(a, b) {
                            if (a.toLowerCase() === 'popular timezone' || a < b) {
                                return -1;
                            } else if (a > b) {
                                return 1;
                            }
                            return 0;
                        })
                        .forEach(category => {
                            suggestions.push({
                                type: 'category',
                                category: category
                            });
                            groupedByCategory[category].forEach(oTimeZone => {
                                suggestions.push(oTimeZone);
                            });
                        });
                } else {
                    let wholeWordMatches = [];
                    let startsWithMatches = [];
                    let partialMatches = [];
                    oTimeZones.forEach(oTimeZone => {
                        if (sSearchString.length > 0 && oTimeZone.category === 'Popular Timezone') {
                            return true;
                        }
                        let sValueToMatch = (
                            oTimeZone.category +
                            ' ' +
                            oTimeZone.cities +
                            ' ' +
                            oTimeZone.city +
                            ' ' +
                            oTimeZone.country +
                            ' ' +
                            oTimeZone.gmt +
                            ' ' +
                            oTimeZone.local_timezone
                        ).toLowerCase();
                        if (validateRegex('\\b' + sSearchString + '\\b') && new RegExp('\\b' + sSearchString + '\\b').test(sValueToMatch)) {
                            wholeWordMatches.push(oTimeZone);
                        } else if (validateRegex('\\b' + sSearchString) && new RegExp('\\b' + sSearchString).test(sValueToMatch)) {
                            startsWithMatches.push(oTimeZone);
                        } else if (sValueToMatch.indexOf(sSearchString) > -1) {
                            partialMatches.push(oTimeZone);
                        }
                    });
                    suggestions = wholeWordMatches.concat(startsWithMatches.concat(partialMatches));
                }
                this.selectedTimezone = '';
                suggest(suggestions);
            },
            renderItem: function(oTimeZone, search) {
                let selectedTimezone = defaultSchTimeAndTimezone.defaultTimezoneForSch;
                if (!selectedTimezone) {
                    let composeBoxDiv = document.getElementById(this.composeBoxID);
                    if (
                        composeBoxDiv &&
                        composeBoxDiv.querySelector('#datepicker1') &&
                        composeBoxDiv.querySelector('#datepicker1')._flatpickr
                    ) {
                        let flatpickrInstance = composeBoxDiv.querySelector('#datepicker1')._flatpickr;
                        selectedTimezone = flatpickrInstance.config.selectedTimezone;
                        this.selectedTimezone = selectedTimezone;
                    }
                }
                search = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&amp;');
                if (oTimeZone.type === 'category') {
                    return `<div class="timezone-category">${oTimeZone.category}</div>`;
                } else {
                    let sTimezoneKey = `${oTimeZone.city}, ${oTimeZone.country}`;
                    let sClass = 'autocomplete-suggestion';
                    let [sTime, sAMPM, sLocalTimeZone] = moment()
                        .tz(oTimeZone.timezone_name)
                        .format('LT z')
                        .split(' ');
                    sLocalTimeZone = sLocalTimeZone.indexOf('0') > -1 ? oTimeZone.local_timezone : sLocalTimeZone;
                    if (oTimeZone.timezone_name === selectedTimezone) {
                        sClass += ' selected';
                    }
                    if (oTimeZone.category !== 'Popular Timezone') {
                        sClass += ' popular';
                    }

                    return `<div class="${sClass}" data-timezone="${oTimeZone.timezone_name}" data-cityname="${
                        oTimeZone.city
                    }" data-countryname="${oTimeZone.country}" data-val="${search}">
                            <div class="zoneName">${sTimezoneKey}</div>
                                <div class="zoneDetails">
                                    <span class="zoneLocalName">${sLocalTimeZone}</span>
                                    <span class="timePipe"> | </span>
                                    <span class="gmtName">${oTimeZone.gmt}</span>
                                    <span class="zoneTime">${sTime + ' ' + sAMPM}</span>
                                </div>
                            </div>`;
                }
            },
            onSelect: function(e, term, item) {
                let timezone_name = `${item.getAttribute('data-timezone')}`;
                // let selectedValue = `${item.getAttribute('data-cityname')}, ${item.getAttribute('data-countryname')}`;
                document.getElementById('sidebar-timezone').value = timezone_name;
                window.setTimeout(function() {
                    document.getElementById('sidebar-timezone').blur();
                }, 500);
                this.selectedTimezone = timezone_name;
                defaultSchTimeAndTimezone.defaultTimezoneForSch = timezone_name;
                updatePrefInDB('defaultTimezoneForSch');
            }
        });
        document.querySelector('#sidebar-timezone').addEventListener('mousedown', function() {
            let selectedTimezone = defaultSchTimeAndTimezone.defaultTimezoneForSch || getSystemTimezone();
            let currentValue = selectedTimezone || 'Select Timezone';
            this.setAttribute('placeholder', currentValue);
            this.value = '';
        });
    }

    function setupUpMsgForDisabledPowerBySwitch() {
        let { branding_change_disable } = userPreferencesRes;
        if (!branding_change_disable) return;
        let powered_by_sidebar_label = document.getElementById('powered_by_sidebar_label');
        powered_by_sidebar_label &&
            powered_by_sidebar_label.addEventListener('click', () => {
                showPricingPopUp();
            });
    }

    function attachStyleToFeedBtn() {
        setTimeout(() => {
            let feedsIconWrapper = document.querySelector('.sh_feeds_button').parentElement.parentElement;
            if (isPluginTempDeactivated) {
                feedsIconWrapper.style.display = 'none';
            } else {
                feedsIconWrapper.setAttribute('data-tooltip', 'View all activities');
                feedsIconWrapper.style.marginLeft = usingNewGmail ? '0px' : '-85px';
                feedsIconWrapper.style.zIndex = 100;
            }
            attachStyleToInputBtn(feedsIconWrapper);
        }, 100);
    }

    function attachStyleToActivateBtn() {
        let userInfoObj = getUserInfoFromLocal();
        let disableWelcomeModal = userInfoObj ? userInfoObj.disableWelcomeModal : true;
        let isPluginActivated = userInfoObj ? userInfoObj.isPluginActivated : false;

        if (isPluginActivated) {
            setTimeout(() => {
                let activateIconWrapper = document.querySelector('.sh_toolbar_pref_button').parentElement.parentElement;
                activateIconWrapper.setAttribute('data-tooltip', 'SalesHandy');
                let shIconWrapper = document.querySelector('.sh_toolbar_pref_icon').parentElement.parentElement;
                shIconWrapper.style.setProperty('margin-right', '0px', 'important');
                if (usingNewGmail) {
                    shIconWrapper.style.setProperty('margin-left', '5px', 'important');
                }
            }, 100);
        }

        if (isEmailBlacklisted() || disableWelcomeModal && !isPluginActivated) {
            setTimeout(() => {
                let activateIconWrapper = document.querySelector('.sh_toolbar_pref_button').parentElement.parentElement;
                activateIconWrapper.setAttribute('data-tooltip', 'Activate');
                activateIconWrapper.style.setProperty('margin-right', '0px', 'important');
                attachStyleToInputBtn(activateIconWrapper);
            }, 100);
        }
    }

    function tempDeactivatePlugin(event) {
        //Toggle isPluginTempDeactivated value
        setIsPluginTempDeactivateValue();
        //Close Sidebar
        this.prefSideDrawerView.close();
        //Hide Feeds Button
        hideFeedsButtonWhenTemDeactivated();
    }

    function setIsPluginTempDeactivateValue() {
        isPluginTempDeactivated = isPluginTempDeactivated ? false : true;
        let mainUserInfoObj = JSON.parse(localStorage.getItem('mainUserInfoObj')) || {};
        let userInfoObj = getUserInfoFromLocal();
        _.extend(userInfoObj, {
            isPluginTempDeactivated
        });
        mainUserInfoObj[btoa(currentUserEmail)] = userInfoObj;
        localStorage.setItem('mainUserInfoObj', JSON.stringify(mainUserInfoObj));
    }

    function hideFeedsButtonWhenTemDeactivated() {
        let feedsIconWrapper = document.querySelector('.sh_feeds_button').parentElement.parentElement;
        feedsIconWrapper.style.display = isPluginTempDeactivated ? 'none' : 'block';
    }
    //#endregion
    /******************************************************************************* */
    /*                APPLICATION TOOLBAR RELATED FUNCTIONS ENDS                     */
    /******************************************************************************* */

    /******************************************************************************* */
    /*                COMPOSE BOX RELATED FUNCTIONS STARTS                           */
    /******************************************************************************* */
    //#region
    function renderMessageOpenSection() {
        sdk.Conversations.registerMessageViewHandler(function(messageView) {
            if (isPluginTempDeactivated) return;
            sendMessageToBackground({
                userID: userPreferencesRes.id,
                shref: userPreferencesRes.shref
            });
        });
    }

    function renderComposeBoxSection() {
        let isPluginActivated = getUserInfoFromLocal() && getUserInfoFromLocal().isPluginActivated;
        if (!isPluginActivated) return;
        let HideReadReceipts = areSHReadReceiptsOff(currentUserEmail);
        if (HideReadReceipts === false) {
            registerThreadRowViewHandlerSH(sdk);
        }
        sdk.Compose.registerComposeViewHandler(function(composeView) {
            if (isPluginTempDeactivated) return;
            composeBoxID++;
            composeView.composeBoxID = composeBoxID;
            let composeBoxElement = composeView.getElement();
            let composeBoxUniqueID = composeBoxElement.id;
            if (!composeBoxUniqueID) {
                composeBoxElement.id = composeBoxID;
                composeBoxUniqueID = composeBoxID.toString();
            }
            composeViews[composeBoxUniqueID] = composeView;
            composeView.currentEmailID = undefined;
            composeView.previousScheduledDraftObj = undefined;
            assignUniqueIdToComposeWindow(composeBoxID);
            if (!bIsMessageListnerAdded) {
                window.addEventListener('message', getIDFromFrame, false);
                bIsMessageListnerAdded = true;
            }
            let sequenceIdAttachedToMail = undefined;
            let pixelInfo = undefined;
            let { preferences } = userPreferencesRes;
            if(preferences){
                showInsertTemplateIcon = preferences.CHROME_TEMPLATE_ICON == "1" ? true : false;
            }
            let shouldWeTrackLocal = undefined;
            let datePickerInSch, timePickerInSch, timezoneInSch, dateSelectedWhenScheduled;
            let trackBtn, setupLaterBtn, addTemplateBtn, addSequenceTemplateBtn, upgradeBtnStatusBar;
            let localPoweredSignCheck, localClickTrack, localNotCheck;
            let infoInEmail, trackingPixelInserted;
            let currentEmailID1 = undefined;
            let isScheduleForLater = undefined;
            let deleteSchMailWithTrackOff = undefined;
            let schMoment;
            composeView.scheduleDraftObj = {};
            let localEmailOptions = {
                localClickTrack: undefined,
                localPoweredSign: undefined,
                localNot: undefined
            };
            let mailWithNoTrackButDocumentSendingDone = false;
            composeView.initLocalEmailOptionSetup = true;
            const DOCS = 'docs',
                LINKS = 'links';
            let serverTimeoutOccured = false;

            shouldWeArchive = false;
            finalTemplateID = null;

            setupQuickTeamplates(composeView);
            setupLocalEmailOptionsAsPref();
            attachMouseOverToSendButtons();
            addScheduleDropup(composeView);
            if (composeView.isReply()) {
                isMailAReply = true;
            }
            /**************** DELAY FUNCTIONS STARTS *************** */
            //#region
            function delayTillEmailID(callback, composeViewInstance) {
                let timeoutRef;
                if (composeViewInstance && composeViewInstance.currentEmailID) {
                    currentEmailID1 = composeViewInstance.currentEmailID;
                }
                if (!currentEmailID1) {
                    timeoutRef = setTimeout(delayTillEmailID.bind(null, callback, composeViewInstance), 100, callback);
                } else {
                    clearTimeout(timeoutRef);
                    callback();
                }
            }

            function checkifScheduled(composeViewInstance, executionCount = 0) {
                let timeoutRef;
                let draftIDFromDOM;
                let sendLaterBtn;
                if (composeViewInstance) {
                    currentEmailID1 = composeViewInstance.currentEmailID;
                    let composeBoxDiv = composeViewInstance.getElement();
                    sendLaterBtn = composeBoxDiv && composeBoxDiv.querySelector('#sh_send_later_option');
                    draftIDFromDOM = composeBoxDiv && composeBoxDiv.querySelector("input[name='draft'][value^='#msg-a']");
                    draftIDFromDOM = (draftIDFromDOM && draftIDFromDOM.getAttribute('value')) || '';
                    draftIDFromDOM = draftIDFromDOM.split(':')[1] || currentEmailID1;
                }
                if (executionCount > 15 && sendLaterBtn) {
                    sendLaterBtn.innerHTML = 'Send Later';
                }
                if (!draftIDFromDOM) {
                    timeoutRef = setTimeout(checkifScheduled.bind(null, composeViewInstance, ++executionCount), 100);
                } else {
                    clearTimeout(timeoutRef);
                    let isMailAScheduledEmail = false; //_isMailAScheduledEmail(draftIDFromDOM);
                    //Check if opened draft ID is in the list of scheduled drafts
                    let clearLoadingBtnInterval = setInterval(function() {
                        let composeBoxDiv = composeViewInstance.getElement();
                        sendLaterBtn = composeBoxDiv && composeBoxDiv.querySelector('#sh_send_later_option');
                        if (sendLaterBtn) {
                            if (sendLaterBtn.querySelectorAll('.SHloadingIcon').length > 0) {
                                sendLaterBtn.innerHTML = isMailAScheduledEmail ? 'Reschedule' : 'Send Later';
                                window.clearInterval(clearLoadingBtnInterval);
                            }
                        }
                    }, 200);
                }
            }
            //#endregion
            /**************** DELAY FUNCTIONS ENDS *************** */
            // Add status bar below Send button
            let objStatusBarView = composeView.addStatusBar({
                height: 36
            });

            function executeWhenEmailUndoClicked() {
                delayTillEmailID(executeIfEmailSendUndo);
            }

            window.executeWhenEmailUndoClicked = executeWhenEmailUndoClicked;

            function executeIfEmailSendUndo() {
                undoListnerAdded = false;
                let getPixelImage = composeView.getBodyElement().querySelectorAll('[id$="shtracking_1s2"]');
                getPixelImage = getPixelImage[getPixelImage.length - 1];

                if (!getPixelImage) return;
                let pixelSrcInBody = getPixelImage.src;
                let { id, tracking_pixel } = lastEmailSentInfo;

                if (!id || !tracking_pixel) return;

                if (pixelSrcInBody.includes(id)) {
                    getPixelImage.parentNode.removeChild(getPixelImage);
                    if (id) {
                        deleteEmail(id).then(res => {
                            console.log(res);
                            removeFromLocalStorageArray('scheduledDrafts', composeView.currentEmailID);
                        });
                    }
                    if (FEATURE_FLAGS.POWERED_BY_SIGNATURE) {
                        let poweredBySign = composeView.getBodyElement().querySelector('[id$="saleshandy_branding"]');
                        poweredBySign.parentElement.removeChild(poweredBySign);
                        showPoweredBySign();
                    }
                }
            }

            //if (!isThisReplyPopUp) {
            delayFunction(renderButtons);
            if (FEATURE_FLAGS.POWERED_BY_SIGNATURE) {
                if (!composeView.getInitialMessageID()) {
                    delayFunction(showPoweredBySign);
                } else {
                    delayFunction(addMonitoringForPoweredTag);
                }
            }
            delayTillEmailID(viewScheduleInDraft, composeView);
            checkifScheduled(composeView);
            composeView.getDraftID().then(res => {
                currentEmailID1 = res;
                composeView.currentEmailID = res;
                let composeBoxDiv = composeView.getElement();
                let draftidFromDOM = composeBoxDiv.querySelector("input[value^='#msg-a']");
                draftidFromDOM = draftidFromDOM && draftidFromDOM.getAttribute('value');
                let isInlineReply = composeView.isInlineReplyForm();
                let threadidFromDOM = composeBoxDiv.querySelector("input[value^='#thread-a']");
                threadidFromDOM = (threadidFromDOM && threadidFromDOM.getAttribute('value')) || '#thread-a:' + composeView.getThreadID();
                if (isInlineReply) {
                    threadidFromDOM = document.querySelector('tr[data-inboxsdk-currentthreadid]');
                    threadidFromDOM =
                        (threadidFromDOM && threadidFromDOM.getAttribute('data-inboxsdk-currentthreadid')) ||
                        '#thread-f:' + composeView.getThreadID();
                }
                composeView.tempDraftID = draftidFromDOM;
                composeView.tempThreadID = threadidFromDOM;
                composeBoxDiv.setAttribute('data-draft-id', res);
            });

            function hideComposeView() {
                let composeViewEle = document.querySelectorAll('.inboxsdk__compose');
                [...composeViewEle].forEach(e => {
                    if (e.sh_compose_id === composeView.composeBoxID) {
                        e.style.display = 'none';
                        if (composeView.isFullscreen()) {
                            composeView.setFullscreen(false);
                        }
                    }
                });
            }

            function showComposeView() {
                let composeViewEle = document.querySelectorAll('.inboxsdk__compose');
                [...composeViewEle].forEach(e => {
                    if (e.sh_compose_id === composeView.composeBoxID) {
                        e.style.display = 'block';
                    }
                });
            }

            /******************** ADD BCC TO CRM IN COMPOSE************** */
            let bccRelatedValue = checkAutoFillCcBccValue(userPreferencesRes.preferences);
            if (bccRelatedValue.isCcBccPresent && bccRelatedValue.turnCcBccActive) {
                let existingCc = composeView.getCcRecipients();
                existingCc =
                    (existingCc &&
                        existingCc.map(currentValue => {
                            return currentValue.emailAddress;
                        })) ||
                    [];
                let existingBcc = composeView.getBccRecipients();
                existingBcc =
                    (existingBcc &&
                        existingBcc.map(currentValue => {
                            return currentValue.emailAddress;
                        })) ||
                    [];

                const preferenceBccEmail = preferences.U_BCC;
                const preferenceCcEmail = preferences.U_CC;

                const preferenceBccEmails = preferenceBccEmail ? [preferenceBccEmail] : [];
                const preferenceCcEmails = preferenceCcEmail ? [preferenceCcEmail] : [];

                let bccEmails = _.union(existingBcc, preferenceBccEmails);
                let ccEmails = _.union(existingCc, preferenceCcEmails);
                composeView.setBccRecipients(bccEmails);
                composeView.setCcRecipients(ccEmails);
                // Move focus to "To" field.
                let allToEmails = composeView.getToRecipients();
                if (allToEmails.length <= 0) {
                  const composeViewElement = composeView.getElement();
                  const toElement = composeViewElement?.querySelector('textarea[name="to"]');
                  toElement?.focus();
                }
            }
            /******************** ADD BCC TO CRM IN COMPOSE************** */

            /********************ADD SUBJECT BODY IN FIRST COMPOSE************** */
            const userInfoObj = getUserInfoFromLocal() || {};
            const { firstLoadAfterAuth } = userInfoObj;
            if (userInfoObj && userInfoObj.isPluginActivated) {
                getUserPreferencesViaPromise().then(res => {
                    let stopOnBoardMail = res.preferences.STOP_ONBOARD_MAIL || 0;
                    // Double negation to turn 1 to boolean  = true
                    if (!!!stopOnBoardMail) {
                        if (firstLoadAfterAuth) addSubjectAndBody(composeView);
                    }
                });
            }
            //******************************************************************* */
            //*********************SENDING OF MAIL BEGINS ********************** */
            //******************************************************************* */
            //#region
            composeView.on('presending', function(event) {
                if (shouldWeTrackLocal && !isContactListInLimit()) {
                    event.cancel();
                    // composeView.toggleLocalEmailTrack();
                    return;
                }
                let { to, cc, bcc, subject } = getInfoInMail();
                if (!Boolean(to.length) && !Boolean(cc.length) && !Boolean(bcc.length)) return;
                if (serverTimeoutOccured) return;
                if (composeView.sendingWhenAccountNotConnected) return;

                let pixelImageEle = composeView.getBodyElement().querySelector('[id$="shtracking_1s2"]');

                // Track document inserted when email tracking  is off.
                if (mailWithNoTrackButDocumentSendingDone) return;
                if (!shouldWeTrackLocal) {
                    trackingObject = getLinkFromBody();
                    if (trackingObject && trackingObject.docs && trackingObject.docs.length > 0) {
                        event.cancel();
                        hideComposeView();
                        let { docs } = trackingObject;
                        let opts = {
                            track_docs: docs,
                            subject
                        };

                        getDocumentLinkWhenEmailNotTracked(opts).then(res => {
                            if (!res.error && res.track_docs) {
                                addTrackingDetails(res.track_docs, DOCS);
                                // Fucntion to send mail using compose view
                                sendEmailNow();
                                mailWithNoTrackButDocumentSendingDone = true;
                            }
                        });
                    }
                }

                /***************************************************************
                 * If tracking is switched off in a scheduled mail and send it *
                 ***************************************************************/
                if (!shouldWeTrackLocal && pixelImageEle) {
                    // We should not allow this mail to get tracked - REMOVE TRACKING PIXEL
                    deleteSchMailWithTrackOff = true;
                    return pixelImageEle.parentElement.removeChild(pixelImageEle);
                }
                /**************************************************************************
                 * Send a scheduled mail - user can add more urls or documents            *
                 * Tracking Pixel will be there but value of trackingPixelInserted        *
                 * will be false                                                          *
                 **************************************************************************/
                if (isScheduleForLater && !trackingPixelInserted && shouldWeTrackLocal) {
                    if (pixelImageEle) {
                        event.cancel();
                        let getPixelImage = pixelImageEle && pixelImageEle.outerHTML;
                        pixelInfo = {
                            id: composeView.scheduleDraftObj.emailID,
                            tracking_pixel: getPixelImage
                        };
                        trackingPixelInserted = true;
                        hideComposeView();
                        let infoInEmail = getInfoInMail();
                        let { localClickTrack, localNot } = localEmailOptions;
                        trackingObject = getLinkFromBody(localClickTrack) || [];
                        infoInEmail.track_click = localClickTrack ? 1 : 0;
                        /* Include links in email body */
                        if (trackingObject && trackingObject.links && trackingObject.links.length > 0) {
                            infoInEmail.track_links = trackingObject.links;
                        }
                        /* Include documents in email body */
                        if (trackingObject && trackingObject.docs && trackingObject.docs.length > 0) {
                            infoInEmail.track_docs = trackingObject.docs;
                        }
                        /* Include Sequence Template If any */
                        if (sequenceIdAttachedToMail || composeView.scheduleDraftObj.attachedSeqId) {
                            const attachedSeqId = sequenceIdAttachedToMail || composeView.scheduleDraftObj.attachedSeqId;
                            const isToPresentWithSequence = checkToAndSequenceBothPresent(to, attachedSeqId);
                            if (!isToPresentWithSequence) {
                                onError({
                                    error: true,
                                    error_code: 'No_To_With_Sequence',
                                    error_message: 'To field is mandatory with sequence attached.'
                                });
                                showComposeView();
                                return;
                            }
                            infoInEmail.sequence_template = attachedSeqId;
                        }

                        infoInEmail.emailID = composeView.scheduleDraftObj.emailID;
                        infoInEmail.is_draft = 1;
                        updateEmailData(infoInEmail).then(res => {
                            if (res.error && isBlacklistedErrorCode(res.error_code)) {
                                // Show blacklisted error popup.
                                onError(res, composeView);
                                showComposeView();
                                trackingPixelInserted = false;
                                return;
                            }
                            let { tracked_links, track_docs } = res;
                            addTrackingDetails(tracked_links, LINKS);
                            addTrackingDetails(track_docs, DOCS);
                            if (!localNot) setSnoozeEmail(res.id);
                            // Fucntion to send mail using compose view
                            sendEmailNow();
                        });
                    }
                }

                /************** Sending a normal email **************/
                if (!trackingPixelInserted && shouldWeTrackLocal) {
                    event.cancel();
                    hideComposeView();
                    infoInEmail = getInfoInMail();
                    infoInEmail.is_draft = 1;
                    createEmailNow();
                }
            });

            composeView.on('sendCanceled', function(event) {
                removeMouseOverToSendButtons();
            });

            composeView.on('destroy', function() {
                hideDropUps();
                delete composeViews[composeView.uniqueid];
            });
            composeView.on('minimized', function() {
                hideDropUps();
            });
            composeView.on('fullscreenChanged', function() {
                hideDropUps();
            });

            function createEmailNow() {
                infoInEmail.sent_message_id = '';
                let { preferences } = userPreferencesRes;
                if (!preferences) preferences = getDefaultPreferences();
                let { localClickTrack, localNot } = localEmailOptions;
                let trackingObject;
                /*************************************************************************
                 * if tracklink is on
                 * fetch links from body in array track_links and include track_click = 1
                 *************************************************************************/
                trackingObject = getLinkFromBody(localClickTrack) || [];
                if (trackingObject && trackingObject.links && trackingObject.links.length > 0) {
                    infoInEmail.track_click = 1;
                    infoInEmail.track_links = trackingObject.links;
                }
                if (trackingObject && trackingObject.docs && trackingObject.docs.length > 0) {
                    infoInEmail.track_click = 1;
                    infoInEmail.track_docs = trackingObject.docs;
                }

                /* Attach Email Sequence Template If any */
                if (sequenceIdAttachedToMail) {
                    const isToPresentWithSequence = checkToAndSequenceBothPresent(infoInEmail.to, sequenceIdAttachedToMail);
                    if (!isToPresentWithSequence) {
                        onError({
                            error: true,
                            error_code: 'No_To_With_Sequence',
                            error_message: 'To field is mandatory with sequence attached.'
                        });
                        showComposeView();
                        return;
                    }
                    infoInEmail.sequence_template = sequenceIdAttachedToMail;
                }
                let sendingMailButterBar = showButterBarMsg('Sending...', 100000, 'forFetchFailed');
                if (!trackingPixelInserted) {
                    createEmailToAddPixel(infoInEmail).then(response => {
                        let { fetchFailed } = response;
                        if (fetchFailed) {
                            serverTimeoutOccured = fetchFailed;
                            sendingMailButterBar.destroy();
                            showServerTimeOutModal();
                            return;
                        }
                        let { error, error_code } = response;
                        if (response.error) {
                            sendingMailButterBar.destroy();
                            onError(response, composeView);
                            showComposeView();
                        } else {
                            pixelInfo = response;
                            let { tracking_pixel, tracked_links, track_docs } = response;
                            addTrackingPixel(tracking_pixel);
                            addTrackingDetails(tracked_links, LINKS);
                            addTrackingDetails(track_docs, DOCS);
                            if (!localNot) setSnoozeEmail(response.id);
                            sendingMailButterBar.destroy();
                            // Fucntion to send mail using compose view
                            sendEmailNow();
                        }
                    });
                }
            }

            function sendEmailNow() {
                shouldWeArchive
                    ? composeView.send({
                            sendAndArchive: true
                        })
                    : composeView.send();
            }

            composeView.on('sent', eventDetails => {
                if (composeView.previousScheduledDraftObj && composeView.scheduleDraftObj) {
                    if (composeView.previousScheduledDraftObj.emailID == composeView.scheduleDraftObj.emailID) clearPreviousEmailValues();
                }
                if (deleteSchMailWithTrackOff) {
                    let { emailID } = composeView.scheduleDraftObj;
                    if (emailID) {
                        deleteEmail(emailID).then(res => {
                            console.log(res);
                            removeFromLocalStorageArray('scheduledDrafts', composeView.currentEmailID);
                        });
                    }
                    deleteSchMailWithTrackOff = undefined;
                }
                if (!pixelInfo) return;
                let { id, tracking_pixel: trackP } = pixelInfo;
                lastEmailSentInfo = {
                    id,
                    tracking_pixel: trackP.substring(trackP.indexOf('https'), trackP.indexOf('" style'))
                };
                if (DOMHandler.paintForJustSentEmailInterval) {
                    window.clearInterval(DOMHandler.paintForJustSentEmailInterval);
                }
                eventDetails.getMessageID().then(sentEmailID => {
                    emailDraftToSent(lastEmailSentInfo.id, sentEmailID).then(res => {
                        let HideReadReceipts = areSHReadReceiptsOff(currentUserEmail);
                        if (HideReadReceipts === false) {
                            DOMHandler.paintForJustSentEmail();
                        }
                    });
                });
                delete composeViews[composeView.uniqueid];
            });

            composeView.on('destroy', () => {
                clearInterval(checkPoweredByTagInterval);
                composeView.previousScheduledDraftObj = null;
                delete composeViews[composeView.uniqueid];
            });

            composeView.on('discard', event => {
                clearInterval(checkPoweredByTagInterval);
                let composeBoxDiv = composeView.getElement();
                if (composeBoxDiv && composeBoxDiv.id) {
                    delete composeViews[composeBoxDiv.id];
                }
                if (composeView.scheduleDraftObj && composeView.scheduleDraftObj.emailID) {
                    deleteEmail(composeView.scheduleDraftObj.emailID).then(res => {
                        if (res.error) {
                            console.log(res.error_message);
                        }
                        removeFromLocalStorageArray('scheduledDrafts', composeView.currentEmailID);
                    });
                }
            });

            composeView.on('bodyChanged', event => {
                let messageBody = composeView.getBodyElement();
                saveRangePosition(messageBody);
            });

            function isContactListInLimit() {
                let toRecipients = composeView.getToRecipients();
                let ccRecipients = composeView.getCcRecipients();
                let bccRecipients = composeView.getBccRecipients();

                let toCount = toRecipients.length;
                let ccCount = ccRecipients.length;
                let bccCount = bccRecipients.length;

                if (toCount + ccCount + bccCount > 50) {
                    onError(
                        {
                            error: true,
                            error_code: 2904,
                            error_message:
                                "The number of recipients in your email is more than 50. Tracking data won't be available for this email."
                        },
                        composeView
                    );
                    return false;
                }
                return true;
            }

            //#endregion
            //******************************************************************* */
            //*********************SENDING OF MAIL ENDS ********************** */
            //******************************************************************* */

            function getInfoInMail() {
                return {
                    to: composeView.getToRecipients(),
                    cc: composeView.getCcRecipients(),
                    bcc: composeView.getBccRecipients(),
                    subject: composeView.getSubject(),
                    from_account: currentUserEmail
                };
            }

            function showServerTimeOutModal() {
                let el = getNewElement();
                el.innerHTML = 'Due to temporary error email tracking request is failed.<br>Please select next step.';
                el.style.marginBottom = '-1px';
                let modalOptions = {
                    title: 'Email tracking failed',
                    el,
                    buttons: [
                        {
                            text: 'Retry',
                            onClick: e => {
                                createEmailNow();
                                trackingTimeModalView.buttonClicked = true;
                                trackingTimeModalView.close();
                            }
                        },
                        {
                            text: 'Send it anyway',
                            onClick: e => {
                                sendEmailNow();
                                trackingTimeModalView.buttonClicked = true;
                                trackingTimeModalView.close();
                            }
                        }
                    ]
                };

                trackingTimeModalView = sdkMain.Widgets.showModalView(modalOptions);
                let trackingTimeContainer = trackingTimeModalView._modalViewDriver._modalContainerElement;
                let modalContainer = trackingTimeContainer.querySelector('.inboxsdk__modal_container');
                let modalBtnContainer = trackingTimeContainer.querySelector('.inboxsdk__modal_buttons');
                let closeBtnContainer = trackingTimeContainer.querySelector('.inboxsdk__modal_close');
                let modalContentContainer = trackingTimeContainer.querySelector('.inboxsdk__modal_content');
                let modalTopRowContainer = trackingTimeContainer.querySelector('.inboxsdk__modal_toprow');

                if (usingNewGmail) {
                    modalBtnContainer.style.setProperty('display', 'block', 'important');
                    modalTopRowContainer.style.setProperty('padding', '3px 24px 3px 24px', 'important');
                    closeBtnContainer.style.setProperty('margin', '11px 12px 16px 12px', 'important');
                } else {
                    closeBtnContainer.style.setProperty('margin', '11px 0px 16px 0px', 'important');
                }

                modalContentContainer.style.setProperty('margin-bottom', '3px', 'important');

                [...modalBtnContainer.children].forEach(child => {
                    if (child.textContent == 'Retry') {
                        child.style.setProperty('background', '#005ebf', 'important');
                        child.style.setProperty('color', 'white', 'important');
                        child.style.setProperty('margin-left', '0px', 'important');
                    } else {
                        child.style.setProperty('border', '1px solid grey', 'important');
                    }
                    child.style.setProperty('margin-right', '10px', 'important');
                });

                modalContainer.style.width = '400px';
                modalContainer.style.height = usingNewGmail ? '165px' : '125px';
                if (!usingNewGmail) {
                    modalContainer.style.setProperty('padding', '14px 30px 24px 30px', 'important');
                } else {
                    modalContainer.style.paddingTop = '14px';
                }

                trackingTimeModalView.on('destroy', () => {
                    if (!_.has(trackingTimeModalView, 'buttonClicked')) {
                        if (composeView.isInlineReplyForm()) {
                            GoBackToListView();
                        } else {
                            composeView.close();
                        }
                    }
                });
            }

            function addTrackingPixel(tracking_pixel) {
                //Add Tracking pixel
                let htmlObject = getNewElement();
                let emailBody = composeView.getBodyElement();
                htmlObject.innerHTML = tracking_pixel;
                emailBody.appendChild(htmlObject);
                trackingPixelInserted = true;
            }

            function addTrackingDetails(tracked_links, linkType) {
                // Check if we have custom links/docs with us
                if (!tracked_links) return;
                let emailBody = composeView.getBodyElement();
                // Different selection of URL for different case
                let urlLinks = linkType == DOCS ? emailBody.querySelectorAll('a.sh_doc') : emailBody.querySelectorAll('a:not(.sh_doc)');
                // Remove poweredby TAG
                let validLinks = [...urlLinks].filter(u => {
                    return !u.id.includes(POWERED_BY_BRAND);
                });
                validLinks.forEach(u => {
                    if (u.isLink) return;
                    let href = u.href;
                    if (linkType == DOCS) {
                        href = getDocumentID(href);
                    }
                    if (tracked_links[href]) u.href = tracked_links[href];
                });
            }

            function getLinkFromBody(localClickTrack) {
                // Change StringUrl to Proper Url
                let result = changeStringToUrl();
                let emailBody = composeView.getBodyElement();
                if (result) {
                    emailBody = result.emailBody;
                }

                let urlLinks = emailBody.querySelectorAll('a');

                let entityLinks = {
                    links: [],
                    docs: []
                };

                if (urlLinks.length <= 0) {
                    attachForwardReplyContent(result);
                    return [];
                }

                let withoutbrand = [...urlLinks].filter(u => {
                    return !u.id.includes(POWERED_BY_BRAND);
                });

                [...withoutbrand].forEach(u => {
                    if (u.className == 'sh_doc' && !u.isLink) {
                        entityLinks.docs.push(getDocumentID(u.href, 'fromGetLinkFunction'));
                    } else {
                        // Check for subscription pause
                        if (!u.href.includes('https://shdocs') && localClickTrack && CURRENT_PRICING_PLAN_CODE !== 'FREE' && !HAS_PAUSED_SUBSCRIPTION) {
                            entityLinks.links.push(u.href);
                        }
                    }
                });
                attachForwardReplyContent(result);
                return entityLinks;
            }

            function attachForwardReplyContent(result) {
                if (!result) return;
                let { gmailQuoteContent } = result;
                let parentDomNode = composeView.getBodyElement().querySelector('[class$="sh_tag"]');
                gmailQuoteContent.innerHTML = '<br>' + gmailQuoteContent.innerHTML;
                parentDomNode.insertBefore(gmailQuoteContent, parentDomNode.firstChild);
            }

            function removeClassWithGmailQuote(emailBody) {
                let gmailQuoteDiv = emailBody.querySelector('[class$="gmail_quote"]');
                if (!gmailQuoteDiv) return;
                gmailQuoteDiv.insertAdjacentHTML('beforebegin', '<div class="sh_tag"></div>');
                let gmailQuoteParent = gmailQuoteDiv.parentElement;
                if (!gmailQuoteParent) return;
                let gmailQuoteContent = gmailQuoteParent.removeChild(gmailQuoteDiv);
                return {
                    emailBody,
                    gmailQuoteContent,
                    gmailQuoteParent
                };
            }

            function changeStringToUrl() {
                let emailBody = composeView.getBodyElement();
                let result = removeClassWithGmailQuote(emailBody);
                if (result) emailBody = result.emailBody;

                let allUrls = emailBody.innerHTML.match(REG_URL);
                let links = {};
                if (allUrls != null) {
                    let wordsToTest = allUrls.filter(url => {
                        let urlToReturn;
                        let correctUrl = true;
                        let leaveOutPartPresent = false;
                        leaveOutUrlPart.forEach(leaveOutPart => {
                            if (url.includes(leaveOutPart)) {
                                leaveOutPartPresent = true;
                            }
                        });
                        if (!leaveOutPartPresent) urlToReturn = url;
                        if (urlToReturn) {
                            allImgExtensions.forEach(e => {
                                if (urlToReturn.includes(`.${e}`)) {
                                    correctUrl = false;
                                }
                            });
                            if (correctUrl) return urlToReturn;
                        }
                    });
                    wordsToTest.forEach(word => {
                        let isAlreadyUrl = isAlreadyProperUrl(word);
                        if (!isAlreadyUrl) {
                            let hrefValue = getHrefValueToAdd(word);
                            links[word] = hrefValue;
                        }
                    });
                }
                if (Object.keys(links).length <= 0) {
                    return result;
                }

                const re = new RegExp(Object.keys(links).join('|'), 'gi');
                const matchedKeys = [];
                let str = composeView.getHTMLContent().replace(re, function(matched) {
                    matchedKeys.push(matched);
                    return links[matched];
                });

                // if some of links were not matched using regex then replace the using exact match
                if (Object.keys(links).length !== matchedKeys.length) {
                    Object.keys(links).forEach(i=> {
                        if (matchedKeys.indexOf(i) === -1) {
                            str = str.replace(i, links[i]);
                        }
                    });
                }
                composeView.setBodyHTML(str);
                return result;
            }

            function getHrefValueToAdd(word) {
                if (word.includes('http') || word.includes('https')) {
                    word = `<a href="${word}" target="_blank">${word}</a>`;
                } else {
                    word = `<a href="http://${word}" target="_blank">${word}</a>`;
                }
                return word;
            }

            function isAlreadyProperUrl(word) {
                let emailBody = composeView.getBodyElement();
                let properUrlLinks = emailBody.querySelectorAll('a');
                let urlFound = false;
                [...properUrlLinks].forEach(fromProperUrl => {
                    if (fromProperUrl.textContent.trim() == word.trim() && !urlFound) {
                        urlFound = true;
                    }
                });
                return urlFound;
            }

            /******************************************************************************* */
            //Code associated with View of Compose Window Starts
            /******************************************************************************* */
            //#region
            function renderButtons() {
                let toolbar_template_vars = getToolbarTemplateVars();
                let toolbar_template_compiled = _.template(tmpl_compose_statusbar);
                objStatusBarView.el.innerHTML = toolbar_template_compiled(toolbar_template_vars);

                setUpComposeBtnRefrences();

                if (toolbar_template_vars.trackingStatus) {
                    setupLaterBtn.addEventListener('click', renderScheduleMailDialog);
                    addSequenceTemplateBtn.addEventListener('click', showHideAddSequenceDropup);
                }
                trackBtn.closest('#sh_track_div').addEventListener('click', onTrackToggle);
                addTemplateBtn.addEventListener('click', toggleTemplatePopOut);
                if(!hideDocument) {
                    addDocumentBtn.entity = 'documents';
                    if (!composeView.renderCrossPlatformModalDocuments) {
                        composeView.renderCrossPlatformModalDocuments = renderCrossPlatformModal.bind(null, 'documents', composeView);
                    }
                    addDocumentBtn.removeEventListener('click', composeView.renderCrossPlatformModalDocuments);

                    addDocumentBtn.addEventListener('click', composeView.renderCrossPlatformModalDocuments);
                }
                upgradeBtnStatusBar && upgradeBtnStatusBar.removeEventListener('click', showcrossPlatformPricing);
                upgradeBtnStatusBar && upgradeBtnStatusBar.addEventListener('click', showcrossPlatformPricing);
                addSequenceTemplateBtn.closest('#sh_sequence_list').addEventListener('click', function() {
                    if (event.target === this) {
                        addSequenceTemplateBtn.click();
                    }
                });

                if (!shouldWeTrackLocal) {
                    setupLaterBtn.classList.add('sh_toolbar_icon_click_disable');
                    addSequenceTemplateBtn.parentElement.classList.add('sh_toolbar_icon_click_disable');
                    setupLaterBtn.style.fill = COLORS.SH_GREY;
                    // trackBtn.style.color = COLORS.SH_GREY;
                    trackBtn.setAttribute('data-tooltip', 'Email tracking is off');
                    addSequenceTemplateBtn.querySelector('#attach-seq-img').style.fill = COLORS.SH_GREY;

                    addSequenceTemplateBtn.children[0].style.pointerEvents = 'none';
                    addSequenceTemplateBtn.style.cursor = 'pointer';
                }
                setupSequenceTemplateListInDropUp();
            }

            function setupSequenceTemplateListInDropUp() {
                getSequenceTemplateList()
                    .then(res => {
                        let seqTemplateDropUpVar = {
                            res
                        };
                        let seqTemplateDropUpVar_compiled = _.template(seq_temp_list_content);
                        let sequenceDropupContent = objStatusBarView.el.querySelector('#sequence-dropup-content');
                        sequenceDropupContent.innerHTML = seqTemplateDropUpVar_compiled(seqTemplateDropUpVar);
                        Array.from(sequenceDropupContent.querySelectorAll('input.check-custom')).forEach(checkBox => {
                            checkBox.addEventListener('change', event => {
                                if (event.target.checked) {
                                    performAttachmentOfSeqToMail();
                                } else {
                                    performAttachmentOfSeqToMail();
                                }
                            });
                        });
                        setupSequenceDropupContent(res);
                    })
                    .catch(err => {
                        console.log(err);
                        res = {
                            error: true,
                            error_message: err
                        };
                        let seqTemplateDropUpVar = {
                            res
                        };
                        let seqTemplateDropUpVar_compiled = _.template(seq_temp_list_content);
                        objStatusBarView.el.querySelector('#sequence-dropup-content').innerHTML = seqTemplateDropUpVar_compiled(
                            seqTemplateDropUpVar
                        );
                        setupSequenceDropupContent(res);
                    });
            }

            function setupSequenceDropupContent(res) {
                let totalLink = 4;
                if (res.length == 0) totalLink = 2.1;
                if (res.error) totalLink = 0.8;
                let seqTemplateDropupContent = objStatusBarView.el.querySelector('.seq-temp-dropup-container');
                seqTemplateDropupContent.style.display = 'none';
                let attachSequenceBtn = objStatusBarView.el.querySelector('.attach-sequence-btn');
                attachSequenceBtn.addEventListener('click', performAttachmentOfSeqToMail);

                let toolActBtn = document.querySelector('.sequence_dropup');
                if (seqTemplateDropupContent.style.display == 'block') {
                    toolActBtn && toolActBtn.classList.add('activeBarIcon');
                } else {
                    toolActBtn && toolActBtn.classList.remove('activeBarIcon');
                }

                document.addEventListener('click', function() {
                    if (seqTemplateDropupContent.style.display == 'block') {
                        toolActBtn && toolActBtn.classList.add('activeBarIcon');
                    } else {
                        toolActBtn && toolActBtn.classList.remove('activeBarIcon');
                    }
                });

                let ClosePopbutton = document.getElementById('ClosePopbuttonSequence');
                ClosePopbutton &&
                    ClosePopbutton.addEventListener('click', function() {
                        seqTemplateDropupContent.style.display = 'none';
                        toolActBtn && toolActBtn.classList.remove('activeBarIcon');
                    });
            }

            function showHideAddSequenceDropup() {
                let hasAccess = userPreferencesRes && userPreferencesRes.has_email_sequence_access ? true : false;
                if (!hasAccess || HAS_PAUSED_SUBSCRIPTION) {
                    if (HAS_PAUSED_SUBSCRIPTION) {
                        showPricingPopUp(PAUSED_SUBSCRIPTION_POPUP_MSG, { error_code: PAUSED_SUBSCRIPTION_ERR_CODE });
                    }else{
                        showPricingPopUp(ERROR_MESSAGES.ERR_USE_SEQUENCE_DENIED);
                    }

                    return;
                }
                let seqTemplateDropupContent = objStatusBarView.el.querySelector('.seq-temp-dropup-container');
                let { display } = seqTemplateDropupContent.style;
                if (display == 'none') {
                    seqTemplateDropupContent.style.display = 'block';
                    addClickEventListenerForCheckBoxes(seqTemplateDropupContent);
                } else {
                    objStatusBarView.el.querySelector('#sh_sequence_list').classList.remove('activeBarIcon');
                    seqTemplateDropupContent.style.display = 'none';
                }
                if (!sequenceIdAttachedToMail) return;
                let allCheckBoxes = seqTemplateDropupContent.querySelectorAll('.check-custom');
                [...allCheckBoxes].forEach(checkEle => {
                    if (checkEle.id == sequenceIdAttachedToMail) {
                        checkEle.checked = true;
                    } else {
                        checkEle.checked = false;
                    }
                });
            }

            function setUpComposeBtnRefrences() {
                setupLaterBtn = objStatusBarView.el.querySelector('#ShContainer');
                trackBtn = objStatusBarView.el.querySelector('#sh_track_option');
                addTemplateBtn = objStatusBarView.el.querySelector('#sh_add_template_option');
                upgradeBtnStatusBar = objStatusBarView.el.querySelector('.upgrade_in_statusbar');
                if (!hideDocument) {
                    addDocumentBtn = objStatusBarView.el.querySelector('#sh_add_document_option');
                }
                //mainSendBtn = objStatusBarView.el.querySelector('[data-tooltip^="Send"]');
                addSequenceTemplateBtn = objStatusBarView.el.querySelector('#seqTooltip');
                document.addEventListener('click', hideDropUpDialog, true);
                document.querySelector(replyWindowClass).addEventListener('scroll', () => {
                    let dropupContent = document.querySelector('.dropup-content');
                    if (!dropupContent || !usingNewGmail) return;
                    dropupContent.style.display = 'none';
                });
            }

            function performAttachmentOfSeqToMail() {
                let hasAccess = userPreferencesRes && userPreferencesRes.has_email_sequence_access ? true : false;
                if (!hasAccess || HAS_PAUSED_SUBSCRIPTION) {
                    if (HAS_PAUSED_SUBSCRIPTION) {
                        showPricingPopUp(PAUSED_SUBSCRIPTION_POPUP_MSG, { error_code: PAUSED_SUBSCRIPTION_ERR_CODE });
                    }else{
                        showPricingPopUp(ERROR_MESSAGES.ERR_USE_SEQUENCE_DENIED);
                    }

                    return;
                }
                sequenceIdAttachedToMail = objStatusBarView.el.querySelector('input[name="check-group"]:checked');
                let sequenceNotAttached = !sequenceIdAttachedToMail;
                let addSequenceTemplateBtn = objStatusBarView.el.querySelector('#seqTooltip');
                if (sequenceNotAttached) {
                    sequenceIdAttachedToMail = null;
                    addSequenceTemplateBtn.querySelector('#attach-seq-img').style.fill = '';
                    objStatusBarView.el.querySelector('#seqTooltip').setAttribute('data-tooltip', 'Attach sequence');
                } else {
                    sequenceIdAttachedToMail = sequenceIdAttachedToMail.id;
                    if (composeView.isReply()) seqAttachedWithReplyAndForwardSchedule = sequenceIdAttachedToMail;
                    let labelForCheckBox = objStatusBarView.el.querySelector(`label[for="${sequenceIdAttachedToMail}"]`);
                    let sequenceNameAttachedToMail = labelForCheckBox.textContent.trim();
                    addSequenceTemplateBtn.querySelector('#attach-seq-img').style.fill = COLORS.SH_BLUE_GMAIL;
                    objStatusBarView.el.querySelector('#seqTooltip').setAttribute('data-tooltip', `${sequenceNameAttachedToMail}`);
                }
                showHideAddSequenceDropup();
            }

            function addClickEventListenerForCheckBoxes(sequenceWrapper) {
                let allCheckBoxes = sequenceWrapper.querySelectorAll('.check-custom');
                [...allCheckBoxes].forEach(checkEle => {
                    checkEle.addEventListener('click', onSequenceEntitySelected);
                });
            }

            function onSequenceEntitySelected() {
                let seqTemplateDropupContent = objStatusBarView.el.querySelector('.seq-temp-dropup-container');
                let allCheckBoxes = seqTemplateDropupContent.querySelectorAll('.check-custom');
                [...allCheckBoxes].forEach(checkEle => {
                    if (checkEle.id == this.id) return;
                    checkEle.checked = false;
                });
            }

            function setupTrackPopupCheckBox() {
                let DROP_UP_HEIGHT = -265;
                let DROP_UP_TRAIANGLE = 228;
                let isCCMissing = false;
                let isBCCMissing = false;

                if (composeView.initLocalEmailOptionSetup && !isScheduleForLater) {
                    setupLocalEmailOptionsAsPref();
                    composeView.initLocalEmailOptionSetup = false;
                }

                let { preferences } = userPreferencesRes;
                let { localPoweredSign, localClickTrack, localNot } = localEmailOptions;

                let localTrackEmailCheck = objStatusBarView.el.querySelector('input[name=localTrackEmail]');
                localTrackEmailCheck.addEventListener('change', composeView.toggleLocalEmailTrack);
                localTrackEmailCheck.checked = shouldWeTrackLocal ? true : false;

                localPoweredSignCheck = objStatusBarView.el.querySelector('input[name=localPoweredSign]');
                localPoweredSignCheck && localPoweredSignCheck.addEventListener('change', toggleLocalPoweredSig);
                localPoweredSignCheck && (localPoweredSignCheck.checked = localPoweredSign ? true : false);

                localClickTrackCheck = objStatusBarView.el.querySelector('input[name=localClickTrack]');
                localClickTrackCheck.addEventListener('change', toggleLocalClickTrack);
                localClickTrackCheck.checked = localClickTrack ? true : false;

                if (preferences && !preferences.U_CC) {
                    DROP_UP_HEIGHT = DROP_UP_HEIGHT + 115;
                    DROP_UP_TRAIANGLE = DROP_UP_TRAIANGLE - 38;
                    if (document.querySelector('.triangle')) {
                        document.querySelector('.triangle').style.top = `${DROP_UP_TRAIANGLE}px`;
                        document.querySelector('.triangle').style.left = `8px`;
                    }
                    isCCMissing = true;
                }

                if (preferences && !preferences.U_BCC) {
                    DROP_UP_HEIGHT = DROP_UP_HEIGHT + 115;
                    DROP_UP_TRAIANGLE = DROP_UP_TRAIANGLE - 38;
                    if (document.querySelector('.triangle')) document.querySelector('.triangle').style.top = `${DROP_UP_TRAIANGLE}px`;
                    isBCCMissing = true;
                }

                if (isMailAReply && usingNewGmail) {
                    let basicOptions = 4;
                    if (isBCCMissing && !isCCMissing) basicOptions++;
                    if (isCCMissing && !isBCCMissing) basicOptions++;
                    if (!isCCMissing && !isBCCMissing) basicOptions = basicOptions + 2;
                }

                localNotCheck = objStatusBarView.el.querySelector('input[name=localNot]');
                localNotCheck.addEventListener('change', toggleLocalSnooze);
                localNotCheck.checked = localNot;

                if (document.querySelector('.dropup-content')) {
                    document.querySelector('.dropup-content').addEventListener('click', function(event) {
                        event.stopPropagation();
                    });
                }
            }

            function setupLocalEmailOptionsAsPref() {
                let { preferences, id } = userPreferencesRes;
                if (preferences && preferences.U_TRACK_EMAILS && preferences.U_TRACK_EMAILS == '1') shouldWeTrackLocal = true;
                if (showLocalNotification) {
                    let userSpecificLocalNotData = showLocalNotification.find(notLocal => notLocal.userID == id);

                    //Return if local email track is off because if that is off everything should also be off;
                    if (!shouldWeTrackLocal && !isScheduleForLater) return;
                    localEmailOptions.localClickTrack =
                        CURRENT_PRICING_PLAN_CODE !== 'FREE' && !HAS_PAUSED_SUBSCRIPTION && preferences && preferences.U_TRACK_CLICKS == '1' ? true : false;
                    localEmailOptions.localPoweredSign = preferences && preferences.U_POWERED_BY_SH == '1' ? true : false;
                    localEmailOptions.localNot = preferences && preferences.PUSH_NOTF_EMAIL_TRACKING == '1' ? true : false;
                }
            }

            function onTrackToggle() {
                trackBtnOffset = this.offsetTop;
                let dropUpContent = objStatusBarView.el.querySelector('.dropup-content');
                let displayOfDropUpContent = dropUpContent.style.display;
                if (displayOfDropUpContent == 'block') {
                    dropUpContent.style.display = 'none';
                } else {
                    setupTrackPopupCheckBox();
                    dropUpContent.style.display = 'block';
                }

                let toolActBtn = document.querySelector('.trackActive');
                if (dropUpContent.style.display == 'block') {
                    toolActBtn.classList.add('activeBarIcon');
                } else {
                    toolActBtn.classList.remove('activeBarIcon');
                }

                document.addEventListener('click', function() {
                    if (dropUpContent.style.display == 'block') {
                        toolActBtn.classList.add('activeBarIcon');
                    } else {
                        toolActBtn.classList.remove('activeBarIcon');
                    }
                });

                let ClosePopbutton = document.getElementById('ClosePopoutBtnTrack');
                ClosePopbutton.addEventListener('click', function() {
                    dropUpContent.style.display = 'none';
                    toolActBtn.classList.remove('activeBarIcon');
                });
            }

            composeView.toggleLocalEmailTrack = function(bDontEnableAllLocalOptions, bForceDisable = false) {
                setupLaterBtn.removeEventListener('click', renderScheduleMailDialog);
                addSequenceTemplateBtn.removeEventListener('click', showHideAddSequenceDropup);
                let trackBtnClasses = trackBtn.children[0].classList;
                let imageAttached = objStatusBarView.el.querySelector('#attach-seq-img');
                if (trackBtnClasses.contains('sh_active_track') || bForceDisable) {
                    trackBtnClasses.remove('sh_active_track');
                    trackBtn.setAttribute('data-tooltip', 'Email tracking is off');
                    trackBtn.querySelector('svg').style.fill = COLORS.SH_GREY;
                    shouldWeTrackLocal = false;
                } else {
                    trackBtnClasses.add('sh_active_track');
                    trackBtn.setAttribute('data-tooltip', 'Email tracking is on');
                    shouldWeTrackLocal = true;
                }
                if (!shouldWeTrackLocal) {
                    imageAttached.style.fill = COLORS.SH_GREY;
                    imageAttached.style.pointerEvents = 'none';
                    addSequenceTemplateBtn.style.cursor = 'pointer';
                    setupLaterBtn.style.fill = COLORS.SH_GREY;
                    setupLaterBtn.setAttribute('data-tooltip', 'Turn on email tracking (✓✓), to schedule email');
                    addSequenceTemplateBtn.setAttribute('data-tooltip', 'Turn on email tracking (✓✓), to attach sequence');
                    setupLaterBtn.classList.add('sh_toolbar_icon_click_disable');
                    addSequenceTemplateBtn.parentElement.classList.add('sh_toolbar_icon_click_disable');
                    disableAllLocalOptions();
                } else {
                    setupLaterBtn.addEventListener('click', renderScheduleMailDialog);
                    addSequenceTemplateBtn.addEventListener('click', showHideAddSequenceDropup);
                    setupLaterBtn.style.fill = ''; //COLORS.SH_RED_GMAIL;
                    imageAttached.style.fill = sequenceIdAttachedToMail ? COLORS.SH_BLUE_GMAIL : '';
                    imageAttached.style.pointerEvents = 'auto';
                    addSequenceTemplateBtn.style.cursor = 'pointer';
                    let composeBoxDiv = setupLaterBtn.closest('.inboxsdk__compose');
                    let selectedDateTime = composeBoxDiv && composeBoxDiv.getAttribute('data-selected_datetime');
                    if (selectedDateTime) {
                        let selectedTimeZone = composeBoxDiv.getAttribute('data-selected_timezone');
                        let selectedMoment = moment(selectedDateTime, 'YYYY-MM-DD HH:mm');
                        setupLaterBtn.setAttribute(
                            'data-tooltip',
                            `Email scheduled on - ${selectedMoment.format('ddd, DD MMM YYYY, LT, ')} ${selectedTimeZone}`
                        );
                    } else {
                        setupLaterBtn.setAttribute('data-tooltip', 'Schedule email');
                    }
                    if (!sequenceIdAttachedToMail) {
                        addSequenceTemplateBtn.querySelector('#attach-seq-img').style.fill = '';
                        addSequenceTemplateBtn.setAttribute('data-tooltip', 'Attach sequence');
                    } else {
                        let labelForCheckBox = objStatusBarView.el.querySelector(`label[for="${sequenceIdAttachedToMail}"]`);
                        let sequenceNameAttachedToMail = labelForCheckBox ? labelForCheckBox.textContent.trim() : 'Attach sequence';
                        addSequenceTemplateBtn.querySelector('#attach-seq-img').style.fill = COLORS.SH_BLUE_GMAIL;
                        addSequenceTemplateBtn.setAttribute('data-tooltip', `${sequenceNameAttachedToMail}`);
                    }
                    setupLaterBtn.classList.remove('sh_toolbar_icon_click_disable');
                    addSequenceTemplateBtn.parentElement.classList.remove('sh_toolbar_icon_click_disable');
                    if (bDontEnableAllLocalOptions !== true) {
                        enableAllLocalOptions();
                    }
                }

                if (FEATURE_FLAGS.POWERED_BY_SIGNATURE) {
                    delayFunction(showPoweredBySign);
                }
            };

            function toggleLocalPoweredSig() {
                if (!FEATURE_FLAGS.POWERED_BY_SIGNATURE) {
                    return;
                }
                let { branding_change_disable } = userPreferencesRes;
                if (branding_change_disable) {
                    let poweredInputCheck = document.querySelector('input[name=localPoweredSign]');
                    poweredInputCheck.checked = !this.checked;
                    showPricingPopUp();
                    return;
                }

                let { localPoweredSign } = localEmailOptions;
                // localEmailOptions.localPoweredSign = localPoweredSign ? false : true;
                if (localPoweredSign) {
                    if (branding_change_disable) {
                        let poweredInputCheck = document.querySelector('input[name=localPoweredSign]');
                        poweredInputCheck.checked = !this.checked;
                        let error = {
                            error_code: 'CHR_1001',
                            error_message: 'Upgrade your current plan to remove powered by signature.\n Plan starts from $7/mo.'
                        };
                        onError(error);
                        return;
                    }
                    localEmailOptions.localPoweredSign = false;
                } else {
                    if (event && event.target && event.target.closest('.trackBody')) {
                        let trackSwitch = event.target.closest('.trackBody').querySelector("input[name='localTrackEmail']");
                        let isTrackingEnabled = trackSwitch ? trackSwitch.checked : false;
                        if (!isTrackingEnabled) {
                            trackSwitch.checked = true;
                            composeView.toggleLocalEmailTrack(true);
                        }
                    }
                    localEmailOptions.localPoweredSign = true;
                }
                if (FEATURE_FLAGS.POWERED_BY_SIGNATURE) {
                    showPoweredBySign();
                }
            }

            function toggleLocalClickTrack() {
                let { localClickTrack } = localEmailOptions;
                //Check if subscription is paused
                if (CURRENT_PRICING_PLAN_CODE === 'FREE' || HAS_PAUSED_SUBSCRIPTION ) {
                    let LinkTrackInputCheck = document.querySelector('input[name=localClickTrack]');
                    LinkTrackInputCheck && (LinkTrackInputCheck.checked = false);
                    localEmailOptions && (localEmailOptions.localClickTrack = false);
                    if (HAS_PAUSED_SUBSCRIPTION) {
                        showPricingPopUp(PAUSED_SUBSCRIPTION_POPUP_MSG, { error_code: PAUSED_SUBSCRIPTION_ERR_CODE });
                    }else{
                        showPricingPopUp();
                    }

                    return;
                }
                if (localClickTrack) {
                    localEmailOptions.localClickTrack = false;
                } else {
                    if (event && event.target && event.target.closest('.trackBody')) {
                        let trackSwitch = event.target.closest('.trackBody').querySelector("input[name='localTrackEmail']");
                        let isTrackingEnabled = trackSwitch ? trackSwitch.checked : false;
                        if (!isTrackingEnabled) {
                            trackSwitch.checked = true;
                            let { branding_change_disable } = userPreferencesRes;
                            if (branding_change_disable) {
                                let poweredBySwitch = event.target.closest('.trackBody').querySelector("input[name='localPoweredSign']");
                                poweredBySwitch.checked = true;
                                localEmailOptions.localPoweredSign = true;
                            }
                            composeView.toggleLocalEmailTrack(true);
                        }
                    }
                    // TODO: Check for pause subscription
                    if (CURRENT_PRICING_PLAN_CODE !== 'FREE' && !HAS_PAUSED_SUBSCRIPTION) {
                        localEmailOptions.localClickTrack = true;
                    }
                }
            }

            function toggleLocalSnooze() {
                let { localNot } = localEmailOptions;
                if (localNot) {
                    localEmailOptions.localNot = false;
                } else {
                    if (event && event.target && event.target.closest('.trackBody')) {
                        let trackSwitch = event.target.closest('.trackBody').querySelector("input[name='localTrackEmail']");
                        let isTrackingEnabled = trackSwitch ? trackSwitch.checked : false;
                        if (!isTrackingEnabled) {
                            trackSwitch.checked = true;
                            let { branding_change_disable } = userPreferencesRes;
                            if (branding_change_disable) {
                                let poweredBySwitch = event.target.closest('.trackBody').querySelector("input[name='localPoweredSign']");
                                poweredBySwitch.checked = true;
                                localEmailOptions.localPoweredSign = true;
                            }
                            composeView.toggleLocalEmailTrack(true);
                        }
                    }
                    localEmailOptions.localNot = true;
                }
            }

            function hideDropUpDialog(event) {
                if (document.body == event.target) return;
                //sequence-dropup-content
                let divsToClose = ['.dropup-content', '.seq-temp-dropup-container', '.schedule-dropup'];
                let ele = event.target.parentElement;
                let clickedElementID = ele && ele.id;
                while (!clickedElementID) {
                    if (!ele) {
                        clickedElementID = 'fake';
                    } else {
                        ele = ele.parentElement;
                        clickedElementID = ele && ele.id;
                    }
                }

                if (
                    clickedElementID == 'sh_add_sequence_template' ||
                    clickedElementID === 'sh_seq_div' ||
                    clickedElementID === 'sh_sequence_list'
                ) {
                    divsToClose = ['.dropup-content', '.schedule-dropup'];
                } else if (
                    clickedElementID == 'ShContainer' ||
                    clickedElementID == 'sh_schedule_div' ||
                    clickedElementID === 'sh_setup_send_later'
                ) {
                    divsToClose = ['.dropup-content', '.seq-temp-dropup-container'];
                } else if (clickedElementID === 'sh_track_option' || clickedElementID === 'sh_track_div') {
                    divsToClose = ['.seq-temp-dropup-container', '.schedule-dropup'];
                }

                divsToClose.forEach(divToClose => {
                    let clickInsideDropUp = event.target.closest(divToClose);
                    if (clickInsideDropUp) {
                        return;
                    }
                    let dropUpContents = document.querySelectorAll(divToClose);
                    if (dropUpContents.length <= 0) return;

                    [...dropUpContents].forEach(d => {
                        d.style.display = 'none';
                    });
                });
            }

            function getToolbarTemplateVars() {
                let { preferences, branding_change_disable, current_plan } = userPreferencesRes;
                if (!preferences) preferences = getDefaultPreferences();
                let toolbar_template_vars = {
                    trackingStatus: preferences.U_TRACK_EMAILS === '1' ? true : false,
                    branding_change_disable,
                    usingNewGmail,
                    mainApplication,
                    current_plan,
                    hideDocument
                };
                shouldWeTrackLocal = toolbar_template_vars.trackingStatus;
                return toolbar_template_vars;
            }

            function disableAllLocalOptions() {
                let allCheckBoxes = objStatusBarView.el.querySelectorAll('input[type="checkbox"]');
                [...allCheckBoxes].forEach(c => {
                    if (c.name == 'localTrackEmail') return;
                    c.checked = false;
                    // c.disabled = true;
                });
                _.keys(localEmailOptions).forEach(key => {
                    localEmailOptions[key] = false;
                });
                if (isScheduleForLater) {
                    composeView.initLocalEmailOptionSetup = false;
                }
            }

            function enableAllLocalOptions() {
                if (composeView.initLocalEmailOptionSetup) return;
                let { branding_change_disable } = userPreferencesRes;
                let allCheckBoxes = objStatusBarView.el.querySelectorAll('input[type="checkbox"]');
                [...allCheckBoxes].forEach(c => {
                    if (c.name == 'localTrackEmail') return;
                    c.disabled = false;
                });
                composeView.initLocalEmailOptionSetup = true;
                setupLocalEmailOptionsAsPref();
                setupTrackPopupCheckBox();
            }

            function showPoweredBySign() {
                let { localPoweredSign } = localEmailOptions;
                let emailBody = composeView.getBodyElement();
                let poweredBySign = emailBody.querySelector('[id$="saleshandy_branding"]');
                if (!shouldWeTrackLocal && poweredBySign) {
                    poweredBySign.parentElement.removeChild(poweredBySign);
                    return;
                }
                if (localPoweredSign === false && poweredBySign) {
                    return poweredBySign.parentElement.removeChild(poweredBySign);
                }

                if (!localPoweredSign) return;
                if (poweredBySign) return;
                let { preferences, branding_change_disable } = userPreferencesRes;
                if (!preferences) preferences = getDefaultPreferences();
                if (!localPoweredSign || (preferences.U_TRACK_EMAILS !== '1' && !shouldWeTrackLocal)) return;
                var htmlObject = getNewElement();
                htmlObject.innerHTML = tmpl_powered_by_SalesHandyTag;
                emailBody.appendChild(htmlObject);
                if (branding_change_disable) addMonitoringForPoweredTag();
            }

            function addMonitoringForPoweredTag() {
                let { branding_change_disable } = userPreferencesRes;
                if (!branding_change_disable) return;
                checkPoweredByTagInterval = setInterval(() => {
                    let composeWrapper = document.querySelector('.Tm, .aeJ');
                    if (usingNewGmail) {
                        composeWrapper.addEventListener('scroll', () => {
                            let dropUpContent = objStatusBarView.el.querySelector('.dropup-content');
                            dropUpContent.style.display = 'none';
                        });
                    }

                    if (!shouldWeTrackLocal) return;
                    let originalPoweredBrand = 'PoweredBySalesHandy';
                    let emailBody = composeView.getBodyElement();
                    let brandingEle = emailBody.querySelector('[id$="saleshandy_branding"]');
                    let brandInfo = brandingEle && brandingEle.textContent.replace(/[^A-Z0-9]/gi, '');
                    if (originalPoweredBrand != brandInfo) {
                        let brand = document.querySelector('[id$="saleshandy_branding"]');
                        if (brand) brand.parentElement.removeChild(brand);
                        var htmlObject = getNewElement();
                        htmlObject.innerHTML = tmpl_powered_by_SalesHandyTag;
                        emailBody.appendChild(htmlObject);
                    }
                }, 1000);
            }

            function set_CC_and_BCC() {
                let nameOfEle = this.attributes['name'].value;
                let { preferences } = userPreferencesRes;
                if (!preferences) preferences = getDefaultPreferences();
                let { U_CC, U_BCC } = preferences;
                if (U_CC && nameOfEle == 'localCC') setCcValues(U_CC);
                if (U_BCC && nameOfEle == 'localBCC') setBccValues(U_BCC);
            }

            function setCcValues(U_CC) {
                let oldCCString = changeToString(composeView.getCcRecipients()).toString();
                let oldCCArray = changeToString(composeView.getCcRecipients());
                if (!oldCCString.includes(U_CC)) {
                    oldCCArray.push(U_CC);
                }
                composeView.setCcRecipients(oldCCArray);
            }

            function setBccValues(U_BCC) {
                let oldBCCString = changeToString(composeView.getBccRecipients()).toString();
                let oldBCCArray = changeToString(composeView.getBccRecipients());
                if (!oldBCCString.includes(U_BCC)) {
                    oldBCCArray.push(U_BCC);
                }
                composeView.setBccRecipients(oldBCCArray);
            }

            //#endregion
            /******************************************************************************* */
            //Code associated with View of Compose Window Ends
            /******************************************************************************* */

            /******************************************************************************* */
            //Code associated with Mail Schedular of Compose Window Starts
            /******************************************************************************* */
            //#region

            function openScheduleScreen() {
                let composeBoxDiv = event.target.closest('.inboxsdk__compose');
                var scheduleDropUp = composeBoxDiv.querySelector('#sh_schedule_dropup_option');
                var _iconEle = event.target.closest('#ShContainer');
                var { left, top } = _iconEle.getBoundingClientRect();
                let scheduleIconRect = absolutePosition(_iconEle);
                let composeBoxRect = absolutePosition(composeBoxDiv);
                let scheduleDropUpRect = absolutePosition(scheduleDropUp);
                scheduleDropUp.souceBtn = composeBoxDiv;
                // Do not modify below two lines if you don't know what you are doing
                let offSet = 30;
                if (composeBoxDiv.classList.contains('inboxsdk__compose_inlineReply')) {
                    offSet = 45;
                }
                scheduleDropUp.style.left =
                    scheduleIconRect.left +
                    scheduleIconRect.width / 2 -
                    composeBoxRect.left -
                    (scheduleDropUpRect.width / 2 + 3) +
                    92 +
                    'px';
                scheduleDropUp.style.bottom =
                    composeBoxRect.bottom - scheduleIconRect.bottom + scheduleIconRect.height + offSet - 25 + 'px';

                let toolActBtn = document.querySelector('.scheduleIconContainer');
                if (scheduleDropUp.style.display == 'block') {
                    toolActBtn.classList.add('activeBarIcon');
                } else {
                    toolActBtn.classList.remove('activeBarIcon');
                }

                document.addEventListener('click', function() {
                    if (scheduleDropUp.style.display == 'block') {
                        toolActBtn.classList.add('activeBarIcon');
                    } else {
                        toolActBtn.classList.remove('activeBarIcon');
                    }
                });
            }

            function attachEventsToButton(composeView) {
                let composeBoxDiv = event.target.closest('.inboxsdk__compose');
                let scheduleDropupContent = composeBoxDiv.querySelector('.schedule-dropup');
                let schCloseBtn = scheduleDropupContent.querySelectorAll('.schCloseBtn');
                let schToggleScreen = scheduleDropupContent.querySelectorAll('.schToggleScreen');
                let schCustomTimeCaptions = scheduleDropupContent.querySelectorAll('.custom_time_ele');

                addButtonEvent(schCloseBtn, closeSchedule);
                addButtonEvent(schToggleScreen, togglScheduleDateTime);
            }

            function setInputLimits(oElement, iMinValue, iMaxValue) {
                oElement.addEventListener(
                    'keyup',
                    function(event) {
                        if (event.keyCode !== 46 && event.keyCode !== 8) {
                            if (event.target.value > iMaxValue) {
                                event.preventDefault();
                                event.target.value = iMaxValue;
                            } else if (event.target.value < iMinValue) {
                                event.preventDefault();
                                event.target.value = iMinValue;
                            }
                        }
                    },
                    true
                );
            }

            function setupDatePicker() {
                let composeBoxDiv = event.target.closest('.inboxsdk__compose');
                let { datetime, timezone } = getSelectedTime(composeBoxDiv);
                let minDate = moment(
                    moment()
                        .tz(timezone)
                        .add(1, 'minutes')
                        .format('YYYY-MM-DD HH:mm'),
                    'YYYY-MM-DD HH:mm'
                );
                let selectedDate = moment(datetime, 'YYYY-MM-DD HH:mm');
                selectedDate = selectedDate.isBefore(minDate) ? minDate : selectedDate;
                selectedDate = selectedDate.format('YYYY-MM-DD hh:mm A');
                minDate = minDate.format('YYYY-MM-DD hh:mm A');
                datePickerInSch = flatpickr('#datepicker1', {
                    altInput: true,
                    enableTime: true,
                    altFormat: 'l, j M Y, h:i K',
                    changeAltInput: false,
                    dateFormat: 'Y-m-d h:i K',
                    selectedTimezone: timezone,
                    inline: true,
                    minDate: minDate,
                    allowInput: false,
                    mode: 'single',
                    defaultDate: selectedDate,
                    onValueUpdate: function(s, selectedDate, flatpickrInstance) {
                        let selectedTimeZone = flatpickrInstance.config.selectedTimezone;
                        let tzMoment = moment()
                            .tz(selectedTimeZone)
                            .add(1, 'minutes')
                            .format('YYYY-MM-DD hh:mm A');
                        let composeBoxDiv = flatpickrInstance.element.closest('.inboxsdk__compose');
                        let prevDate = composeBoxDiv.getAttribute('data-selected_datetime');
                        let isScheduledDraft = false;
                        let prevTimeZone = composeBoxDiv.getAttribute('data-selected_timezone') || getSystemTimezone();
                        let scheduleBtn = composeBoxDiv.querySelector('.schedule-confirm-btn');
                        if (prevDate) {
                            prevDate = moment(prevDate, 'YYYY-MM-DD HH:mm');
                            prevDate = prevDate.format('YYYY-MM-DD hh:mm A');
                            isScheduledDraft = true;
                        } else {
                            prevDate = flatpickrInstance.config.defaultDate;
                        }
                        if (prevDate !== selectedDate || prevTimeZone !== selectedTimeZone) {
                            scheduleBtn.classList.add('schedule-btn');
                            scheduleBtn.classList.remove('unschedule-btn');
                            scheduleBtn.innerHTML = 'Schedule';
                            if (prevDate !== selectedDate) {
                                flatpickrInstance.altInput.classList.remove('redText', 'blueText');
                                flatpickrInstance.altInput.classList.add('blueText');
                            }
                        } else {
                            if (isScheduledDraft) {
                                scheduleBtn.classList.remove('schedule-btn');
                                scheduleBtn.classList.add('unschedule-btn');
                                scheduleBtn.innerHTML = 'Unschedule';
                            }
                            if (prevDate === selectedDate) {
                                flatpickrInstance.altInput.classList.remove('blueText', 'redText');
                            }
                        }
                        if (moment(selectedDate, 'YYYY-MM-DD hh:mm A').isBefore(moment(tzMoment, 'YYYY-MM-DD hh:mm A'))) {
                            flatpickrInstance.setDate(tzMoment, true, 'Y-m-d h:i K');
                            highlightChanges(flatpickrInstance.altInput);
                        }
                    },
                    onMonthChange: function(a, selectedDate, flatpickrInstance) {
                        let calendarInstance = flatpickrInstance.innerContainer.closest('.flatpickr-calendar');
                        Array.from(calendarInstance.querySelectorAll('.flatpickr-day')).forEach(oDateNode =>
                            oDateNode.classList.remove('notCurrentMonthDays')
                        );
                        Array.from(calendarInstance.querySelectorAll('.flatpickr-day.prevMonthDay, .flatpickr-day.nextMonthDay')).forEach(
                            oDateNode => oDateNode.classList.add('notCurrentMonthDays')
                        );
                    },
                    onYearChange: function(a, selectedDate, flatpickrInstance) {
                        selectedDate = flatpickr.parseDate(selectedDate, flatpickrInstance.config.dateFormat);
                        let calendarInstance = flatpickrInstance.innerContainer.closest('.flatpickr-calendar');
                        let oMonthsContainer = calendarInstance.querySelector('.flatpickr-months-container');
                        if (oMonthsContainer) {
                            let selectedYear = flatpickrInstance.currentYear;
                            let today = new Date();
                            let currentYear = today.getFullYear();
                            let currentMonthIndex = today.getMonth();
                            let selectedMonthFromDate = selectedDate.getMonth();
                            let selectedYearFromDate = selectedDate.getFullYear();
                            let monthNodes = oMonthsContainer.querySelectorAll('.flatpickr-month-SH');
                            if (selectedYear === currentYear) {
                                Array.from(monthNodes).forEach(function(oMonthNode, index) {
                                    let monthIndex = parseInt(oMonthNode.getAttribute('data-monthindex'));
                                    if (currentMonthIndex > monthIndex) {
                                        oMonthNode.classList.add('flatpickr-disabledMonth-SH');
                                        oMonthNode.setAttribute('data-monthindex', '-1');
                                    } else {
                                        oMonthNode.classList.remove('flatpickr-disabledMonth-SH', 'flatpickr-selectedMonth-SH');
                                        oMonthNode.setAttribute('data-monthindex', oMonthNode.getAttribute('data-monthindex-fixed'));
                                        if (selectedMonthFromDate === monthIndex) {
                                            oMonthNode.classList.add('flatpickr-selectedMonth-SH');
                                        }
                                    }
                                });
                            } else {
                                Array.from(monthNodes).forEach(oMonthNode => {
                                    oMonthNode.setAttribute('data-monthindex', oMonthNode.getAttribute('data-monthindex-fixed'));
                                    oMonthNode.classList.remove('flatpickr-disabledMonth-SH', 'flatpickr-selectedMonth-SH');
                                    let monthIndex = parseInt(oMonthNode.getAttribute('data-monthindex'));
                                    if (selectedYear === selectedYearFromDate && selectedMonthFromDate === monthIndex) {
                                        oMonthNode.classList.add('flatpickr-selectedMonth-SH');
                                    }
                                });
                            }
                        }
                    },
                    onReady: function(a, selectedDate, flatpickrInstance, d) {
                        let composeBoxDiv = flatpickrInstance.element.closest('.inboxsdk__compose');
                        let selectedTime = getSelectedTime(composeBoxDiv);
                        let inputControl = flatpickrInstance.altInput;
                        inputControl &&
                            inputControl.addEventListener('click', function() {
                                if (calendarInstance.style.display === 'none') {
                                    calendarInstance.style.display = 'block';
                                } else {
                                    calendarInstance.style.display = 'none';
                                }
                            });
                        flatpickrInstance.set('selectedTimezone', selectedTime.timezone);
                        let calendarInstance = flatpickrInstance.innerContainer.closest('.flatpickr-calendar');
                        Array.from(calendarInstance.querySelectorAll('.flatpickr-day')).forEach(oDateNode =>
                            oDateNode.classList.remove('notCurrentMonthDays')
                        );
                        Array.from(calendarInstance.querySelectorAll('.flatpickr-day.prevMonthDay, .flatpickr-day.nextMonthDay')).forEach(
                            oDateNode => oDateNode.classList.add('notCurrentMonthDays')
                        );
                        let scheduleDropupContent = composeBoxDiv.querySelector('.schedule-dropup');
                        let schMonthTitle = scheduleDropupContent.querySelector('.cur-month');
                        let schYearTitle = scheduleDropupContent.querySelector('.numInputWrapper');
                        schYearTitle && (schYearTitle.closest('.flatpickr-calendar').querySelector('.arrowUp').style.display = 'none');
                        schYearTitle && (schYearTitle.closest('.flatpickr-calendar').querySelector('.arrowDown').style.display = 'none');
                        calendarInstance.style.display = 'none';
                        schMonthTitle &&
                            schMonthTitle.addEventListener(
                                'click',
                                function(e) {
                                    let flatpickrInstance = event.target.closest('.pickerSelectBox').querySelector('#datepicker1')
                                        ._flatpickr;
                                    let selectedDate = flatpickrInstance.selectedDates.length
                                        ? flatpickr.parseDate(flatpickrInstance.selectedDates[0], flatpickrInstance.config.dateFormat)
                                        : new Date();
                                    let calendarInstance = event.target.closest('.flatpickr-calendar');
                                    let oMonthsContainer = calendarInstance.querySelector('.flatpickr-months-container');
                                    let oDatesContainer = calendarInstance.querySelector('.flatpickr-rContainer');
                                    let oYearsContainer = calendarInstance.querySelector('.flatpickr-years-container');
                                    calendarInstance.querySelector('.flatpickr-next-month').classList.add('disabled');
                                    calendarInstance.querySelector('.flatpickr-prev-month').classList.add('disabled');
                                    if (oMonthsContainer) {
                                        if (oMonthsContainer.style.display === 'none') {
                                            oMonthsContainer.style.display = 'block';
                                            oDatesContainer.style.display = 'none';
                                            if (oYearsContainer) {
                                                oYearsContainer.style.display = 'none';
                                            }
                                        } else {
                                            oMonthsContainer.style.display = 'none';
                                            oDatesContainer.style.display = 'block';
                                            if (oYearsContainer) {
                                                oYearsContainer.style.display = 'none';
                                            }
                                            calendarInstance.querySelector('.flatpickr-next-month').classList.remove('disabled');
                                            calendarInstance.querySelector('.flatpickr-prev-month').classList.remove('disabled');
                                        }
                                        let selectedYear = flatpickrInstance.currentYear;
                                        let today = new Date();
                                        let currentYear = today.getFullYear();
                                        let currentMonthIndex = today.getMonth();
                                        let selectedMonthFromDate = selectedDate.getMonth();
                                        let selectedYearFromDate = selectedDate.getFullYear();
                                        let monthNodes = oMonthsContainer.querySelectorAll('.flatpickr-month-SH');
                                        if (selectedYear === currentYear) {
                                            Array.from(monthNodes).forEach(function(oMonthNode, index) {
                                                let monthIndex = parseInt(oMonthNode.getAttribute('data-monthindex'));
                                                if (currentMonthIndex > monthIndex) {
                                                    oMonthNode.classList.add('flatpickr-disabledMonth-SH');
                                                    oMonthNode.setAttribute('data-monthindex', '-1');
                                                } else {
                                                    oMonthNode.classList.remove('flatpickr-disabledMonth-SH', 'flatpickr-selectedMonth-SH');
                                                    if (selectedMonthFromDate === monthIndex) {
                                                        oMonthNode.classList.add('flatpickr-selectedMonth-SH');
                                                    }
                                                    oMonthNode.setAttribute(
                                                        'data-monthindex',
                                                        oMonthNode.getAttribute('data-monthindex-fixed')
                                                    );
                                                }
                                            });
                                        } else {
                                            Array.from(monthNodes).forEach(oMonthNode => {
                                                let monthIndex = parseInt(oMonthNode.getAttribute('data-monthindex'));
                                                oMonthNode.classList.remove('flatpickr-disabledMonth-SH', 'flatpickr-selectedMonth-SH');
                                                if (selectedYear === selectedYearFromDate && selectedMonthFromDate === monthIndex) {
                                                    oMonthNode.classList.add('flatpickr-selectedMonth-SH');
                                                }
                                                oMonthNode.setAttribute(
                                                    'data-monthindex',
                                                    oMonthNode.getAttribute('data-monthindex-fixed')
                                                );
                                            });
                                        }
                                        return;
                                    }
                                    oDatesContainer.classList.add('flatpickr-dates-container');
                                    oDatesContainer.style.display = 'none';
                                    if (oYearsContainer) {
                                        oYearsContainer.style.display = 'none';
                                    }
                                    oMonthsContainer = getNewElement();
                                    let month_picker_SH_compiled = _.template(month_picker_SH);
                                    data = {
                                        months: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
                                        year: flatpickrInstance.currentYear
                                    };
                                    oMonthsContainer.innerHTML = month_picker_SH_compiled({
                                        data: data
                                    });
                                    oMonthsContainer.classList.add('flatpickr-rContainer', 'flatpickr-months-container');
                                    calendarInstance.querySelector('.flatpickr-innerContainer').appendChild(oMonthsContainer);
                                    Array.from(oMonthsContainer.querySelectorAll('.flatpickr-month-SH')).forEach(oMonthNode => {
                                        oMonthNode.addEventListener('click', function(event) {
                                            let selectedMonth = event.target;
                                            let calendarInstance = event.target.closest('.flatpickr-calendar');
                                            let oMonthsContainer = calendarInstance.querySelector('.flatpickr-months-container');
                                            let oDatesContainer = calendarInstance.querySelector('.flatpickr-dates-container');
                                            let flatpickrInstance = event.target.closest('.pickerSelectBox').querySelector('#datepicker1')
                                                ._flatpickr;
                                            let iMonthIndex = selectedMonth.getAttribute('data-monthindex');
                                            try {
                                                iMonthIndex = parseInt(iMonthIndex);
                                            } catch (e) {
                                                return;
                                            }
                                            if (iMonthIndex < 0) {
                                                event.preventDefault(e);
                                                return;
                                            }
                                            flatpickrInstance.changeMonth(iMonthIndex, false);
                                            if (oMonthsContainer && oMonthsContainer.style) {
                                                oMonthsContainer.style.display = 'none';
                                                if (oDatesContainer && oDatesContainer.style) {
                                                    oDatesContainer.style.display = 'block';
                                                }
                                                calendarInstance.querySelector('.flatpickr-next-month').classList.remove('disabled');
                                                calendarInstance.querySelector('.flatpickr-prev-month').classList.remove('disabled');
                                            }
                                        });
                                    });
                                },
                                true
                            );
                        schYearTitle &&
                            schYearTitle.addEventListener(
                                'click',
                                function(e) {
                                    document.activeElement.blur();
                                    let flatpickrInstance = event.target.closest('.pickerSelectBox').querySelector('#datepicker1')
                                        ._flatpickr;
                                    let selectedDate = flatpickrInstance.selectedDates.length
                                        ? flatpickr.parseDate(flatpickrInstance.selectedDates[0], flatpickrInstance.config.dateFormat)
                                        : new Date();
                                    let calendarInstance = event.target.closest('.flatpickr-calendar');
                                    let oYearsContainer = calendarInstance.querySelector('.flatpickr-years-container');
                                    let oMonthsContainer = calendarInstance.querySelector('.flatpickr-months-container');
                                    let oDatesContainer = calendarInstance.querySelector('.flatpickr-rContainer');
                                    calendarInstance.querySelector('.flatpickr-next-month').classList.add('disabled');
                                    calendarInstance.querySelector('.flatpickr-prev-month').classList.add('disabled');
                                    if (oYearsContainer) {
                                        if (oYearsContainer.style.display === 'none') {
                                            oYearsContainer.style.display = 'block';
                                            oDatesContainer.style.display = 'none';
                                            if (oMonthsContainer) {
                                                oMonthsContainer.style.display = 'none';
                                            }
                                        } else {
                                            oYearsContainer.style.display = 'none';
                                            if (oMonthsContainer) {
                                                oMonthsContainer.style.display = 'none';
                                            }
                                            oDatesContainer.style.display = 'block';
                                            calendarInstance.querySelector('.flatpickr-next-month').classList.remove('disabled');
                                            calendarInstance.querySelector('.flatpickr-prev-month').classList.remove('disabled');
                                        }
                                        let selectedYearFromDate = selectedDate.getFullYear().toString();
                                        let monthNodes = oYearsContainer.querySelectorAll('.flatpickr-year-SH');
                                        Array.from(monthNodes).forEach(oYearNode => {
                                            let yearIndex = oYearNode.getAttribute('data-year');
                                            oYearNode.classList.remove('flatpickr-disabledMonth-SH', 'flatpickr-selectedYear-SH');
                                            if (selectedYearFromDate === yearIndex) {
                                                oYearNode.classList.add('flatpickr-selectedYear-SH');
                                            }
                                        });
                                        return;
                                    }
                                    oDatesContainer.classList.add('flatpickr-dates-container');
                                    oDatesContainer.style.display = 'none';
                                    if (oMonthsContainer) {
                                        oMonthsContainer.style.display = 'none';
                                    }
                                    oYearsContainer = getNewElement();
                                    let year_picker_SH_compiled = _.template(year_picker_SH);
                                    oYearsContainer.innerHTML = year_picker_SH_compiled({});
                                    oYearsContainer.classList.add('flatpickr-rContainer', 'flatpickr-years-container');
                                    calendarInstance.querySelector('.flatpickr-innerContainer').appendChild(oYearsContainer);
                                    Array.from(oYearsContainer.querySelectorAll('.flatpickr-year-SH')).forEach(oYearNode => {
                                        oYearNode.addEventListener('click', function(event) {
                                            let selectedMonth = event.target;
                                            let calendarInstance = event.target.closest('.flatpickr-calendar');
                                            let oYearsContainer = calendarInstance.querySelector('.flatpickr-years-container');
                                            let oDatesContainer = calendarInstance.querySelector('.flatpickr-dates-container');
                                            let flatpickrInstance = event.target.closest('.pickerSelectBox').querySelector('#datepicker1')
                                                ._flatpickr;
                                            let iYearIndex = selectedMonth.getAttribute('data-year');
                                            let currentYear = flatpickrInstance.currentYear;
                                            try {
                                                iYearIndex = parseInt(iYearIndex);
                                            } catch (e) {
                                                return;
                                            }
                                            if (iYearIndex < 0) {
                                                event.preventDefault(e);
                                                return;
                                            }

                                            for (let i = 0; i < Math.abs(iYearIndex - currentYear); i++) {
                                                if (iYearIndex > currentYear) {
                                                    flatpickrInstance.changeMonth(12, true);
                                                } else {
                                                    flatpickrInstance.changeMonth(-12, true);
                                                }
                                            }
                                            if (oYearsContainer && oYearsContainer.style) {
                                                oYearsContainer.style.display = 'none';
                                                if (oDatesContainer && oDatesContainer.style) {
                                                    oDatesContainer.style.display = 'block';
                                                }
                                                calendarInstance.querySelector('.flatpickr-next-month').classList.remove('disabled');
                                                calendarInstance.querySelector('.flatpickr-prev-month').classList.remove('disabled');
                                            }
                                        });
                                    });
                                },
                                true
                            );
                    },
                    plugins: [
                        new minMaxTimePlugin({
                            getTimeLimits: function(oDate, flatpickrInstance) {
                                let composeBoxDiv = flatpickrInstance.element.closest('.inboxsdk__compose');
                                let selectedTime = getSelectedTime(composeBoxDiv);
                                let selectedDate = moment(oDate).format('YYYY-MM-DD');
                                let tzMoment = flatpickrInstance.config.selectedTimezone
                                    ? moment().tz(flatpickrInstance.config.selectedTimezone)
                                    : selectedTime.timezone
                                    ? moment().tz(selectedTime.timezone)
                                    : moment();
                                let [tzDate, tzTime] = tzMoment
                                    .add(1, 'minutes')
                                    .format('YYYY-MM-DD-|-HH:mm')
                                    .split('-|-');
                                let minTimeTable;
                                if (selectedDate === tzDate) {
                                    minTimeTable = {
                                        minTime: tzTime,
                                        maxTime: '23:59'
                                    };
                                }
                                return minTimeTable;
                            }
                        })
                    ]
                });
            }

            function calculateTimeValuesForCustomTime(sTimezone) {
                const mainMoment = moment();
                const tomorrow = mainMoment.add(1, 'day');

                function getNow(sTimezone) {
                    let now = sTimezone ? moment().tz(sTimezone) : moment();
                    return now;
                }
                moment.updateLocale('en', {
                    relativeTime: {
                        h: function(number, withoutSuffix, key, isFuture) {
                            const incHour = getNow(sTimezone).add(number, 'h');
                            const isTomorrow = incHour.isSame(tomorrow, 'day');
                            if (isTomorrow) {
                                return `Tomorrow ${incHour.format('hh:mm A')}`;
                            } else {
                                return `Today ${incHour.format('hh:mm A')}`;
                            }
                        },
                        hh: function(number, withoutSuffix, key, isFuture) {
                            const incHour = getNow(sTimezone).add(number, 'h');
                            const isTomorrow = incHour.isSame(tomorrow, 'day');
                            if (isTomorrow) {
                                return `Tomorrow ${incHour.format('hh:mm A')}`;
                            } else {
                                return `Today ${incHour.format('hh:mm A')}`;
                            }
                        },
                        dd: function(number, withoutSuffix, key, isFuture) {
                            return getNow(sTimezone)
                                .add(number, 'd')
                                .format('DD MMM YYYY');
                        },
                        M: function(number, withoutSuffix, key, isFuture) {
                            return getNow(sTimezone)
                                .add(number, 'M')
                                .format('DD MMM YYYY');
                        }
                    }
                });

                return [
                    {
                        caption: moment()
                            .add(1, 'h')
                            .fromNow()
                            .split('in')[1],
                        value: getNow(sTimezone).add(1, 'h')
                    },
                    {
                        caption: moment()
                            .add(2, 'h')
                            .fromNow()
                            .split('in')[1],
                        value: getNow(sTimezone).add(2, 'h')
                    },
                    {
                        caption: moment()
                            .add(4, 'h')
                            .fromNow()
                            .split('in')[1],
                        value: getNow(sTimezone).add(4, 'h')
                    },
                    {
                        caption: '9:00 AM',
                        value: getNow(sTimezone).add(1, 'd')
                    },
                    {
                        caption: '3:00 PM',
                        value: getNow(sTimezone).add(1, 'd')
                    },
                    {
                        caption: moment()
                            .add(2, 'd')
                            .fromNow()
                            .split('in')[1],
                        value: getNow(sTimezone).add(2, 'd')
                    },
                    {
                        caption: moment()
                            .add(4, 'd')
                            .fromNow()
                            .split('in')[1],
                        value: getNow(sTimezone).add(4, 'd')
                    },
                    {
                        caption: moment()
                            .add(7, 'd')
                            .fromNow()
                            .split('in')[1],
                        value: getNow(sTimezone).add(7, 'd')
                    },
                    {
                        caption: moment()
                            .add(1, 'M')
                            .fromNow()
                            .split('in')[1],
                        value: getNow(sTimezone).add(1, 'M')
                    },
                    {
                        caption: getNow(),
                        value: getNow(sTimezone)
                    }
                ];
            }

            function getSelectedTime(oComposeBoxDiv) {
                if (!oComposeBoxDiv) {
                    oComposeBoxDiv = getNewElement();
                }
                let scheduleDraftObjTz;
                if (composeView && composeView.scheduleDraftObj) {
                    let { timezone } = composeView.scheduleDraftObj;
                    if (timezone) {
                        scheduleDraftObjTz = timezone;
                    }
                }
                let isScheduled = oComposeBoxDiv.getAttribute('data-selected_datetime') ? true : false;
                let selectedTimezone = oComposeBoxDiv.getAttribute('data-selected_timezone') || scheduleDraftObjTz || getSystemTimezone();
                let nowInTz = moment().tz(selectedTimezone);
                let selectedDateTime = oComposeBoxDiv.getAttribute('data-selected_datetime') || nowInTz.format('YYYY-MM-DD HH:mm');
                let selectedDate = oComposeBoxDiv.getAttribute('data-selected_date') || nowInTz.format('YYYY-MM-DD');
                let selectedTime = oComposeBoxDiv.getAttribute('data-selected_time') || nowInTz.format('hh:mm A');
                let selectedTimeWithZone = {
                    datetime: selectedDateTime,
                    timezone: selectedTimezone,
                    date: selectedDate,
                    time: selectedTime,
                    is_scheduled: isScheduled
                };
                return selectedTimeWithZone;
            }

            function populateScheduleScreen() {
                let composeBoxDiv = event.target.closest('.inboxsdk__compose');
                let selectedDateTimeWithZoneInfo = getSelectedTime(composeBoxDiv);
                finalTimeText = moment(selectedDateTimeWithZoneInfo.datetime).format('D MMM YYYY [<br>] LT ');
                let scheduleDropUpVar = {
                    customTime: [
                        {
                            leftCaption: 'In 1 hour',
                            add: '1 h'
                        },
                        {
                            leftCaption: 'In 2 hours',
                            add: '2 h'
                        },
                        {
                            leftCaption: 'In 4 hours',
                            add: '4 h',
                            class: 'lastInGroup'
                        },
                        {
                            leftCaption: 'Tomorrow morning',
                            staticTime: '9'
                        },
                        {
                            leftCaption: 'Tomorrow afternoon',
                            staticTime: '15',
                            class: 'lastInGroup'
                        },
                        {
                            leftCaption: 'After 2 days',
                            add: '2 d'
                        },
                        {
                            leftCaption: 'After 4 days',
                            add: '4 d'
                        },
                        {
                            leftCaption: 'After a week',
                            add: '7 d'
                        },
                        {
                            leftCaption: 'After a month',
                            add: '1 M'
                        }
                    ],
                    currentTimeZone: selectedDateTimeWithZoneInfo.timezone,
                    selectedDateTime: moment(selectedDateTimeWithZoneInfo.datetime).format('dddd, DD MMM YYYY, LT '),
                    selectedDate: selectedDateTimeWithZoneInfo.date,
                    selectedTime: selectedDateTimeWithZoneInfo.time,
                    finalTimeText: finalTimeText
                };

                let scheduleDropUpVar_compiled = _.template(new_tmpl_schedule_modal);
                Array.from(document.querySelectorAll('.schedule-dropup')).forEach(scheduleDropUp => {
                    scheduleDropUp.style.display = 'none';
                });
                scheduleDropUpVar.isUnschedule = composeBoxDiv.getAttribute('data-selected_datetime') ? true : false;
                composeBoxDiv.querySelector('#schedule_dropup_content').innerHTML = scheduleDropUpVar_compiled(scheduleDropUpVar);
                let scheduleDropupContent = composeBoxDiv.querySelector('.schedule-dropup');
                Array.from(scheduleDropupContent.querySelectorAll('.custom_time_ele')).forEach(timeEle => {
                    timeEle.addEventListener('mouseover', function() {
                        let timeToAdd = this.getAttribute('data-time-to-add');
                        let sTimezone = getSystemTimezone();
                        let now = sTimezone ? moment().tz(sTimezone) : moment();
                        let finalTimeToShow;
                        if (timeToAdd) {
                            let [count, unit] = timeToAdd.split(' ');
                            finalTimeToShow = now.add(parseInt(count), unit);
                        } else {
                            let absTime = this.getAttribute('data-static-time');
                            finalTimeToShow = now.add(1, 'd').format('DD/MM/YYYY') + ' ' + absTime;
                            finalTimeToShow = moment(finalTimeToShow, 'DD/MM/YYYY HH');
                        }
                        let timeCaptionEle = this.querySelector('.time-caption');
                        timeCaptionEle.classList.add('hidden');
                        let timeValueEle = this.querySelector('.time-value');
                        timeValueEle.innerHTML = finalTimeToShow.format('ddd, MMM DD, YYYY, LT');
                        timeValueEle.classList.remove('hidden');
                    });
                    timeEle.addEventListener('mouseleave', function() {
                        let timeCaptionEle = this.querySelector('.time-caption');
                        timeCaptionEle.classList.remove('hidden');
                        let timeValueEle = this.querySelector('.time-value');
                        timeValueEle.classList.add('hidden');
                    });
                    timeEle.addEventListener('click', function() {
                        let timeToAdd = this.getAttribute('data-time-to-add');
                        let sTimezone = getSystemTimezone();
                        let now = sTimezone ? moment().tz(sTimezone) : moment();
                        let finalTimeToShow;
                        if (timeToAdd) {
                            let [count, unit] = timeToAdd.split(' ');
                            finalTimeToShow = now.add(parseInt(count), unit);
                        } else {
                            let absTime = this.getAttribute('data-static-time');
                            finalTimeToShow = now.add(1, 'd').format('DD/MM/YYYY') + ' ' + absTime;
                            finalTimeToShow = moment(finalTimeToShow, 'DD/MM/YYYY HH');
                        }
                        let timeCaptionEle = this.querySelector('.time-caption');
                        timeCaptionEle.classList.add('hidden');
                        let timeValueEle = this.querySelector('.time-value');
                        timeValueEle.innerHTML = finalTimeToShow.format('ddd, MMM DD, YYYY, LT');
                        timeValueEle.classList.remove('hidden');
                        let composeBoxDiv = this.closest('.inboxsdk__compose');
                        let scheduleDropUpDiv = composeBoxDiv.querySelector('#sh_schedule_dropup_option');
                        if (composeBoxDiv && composeBoxDiv.id) {
                            let infoInEmail = getInfoInMail();
                            if (infoInEmail.to.length < 1 && infoInEmail.cc.length < 1 && infoInEmail.bcc.length < 1) {
                                scheduleDropUpDiv.style.display = 'none';
                                onError({
                                    error: true,
                                    error_code: 'NO_RECIPIENT_SCHEDULE',
                                    error_message: 'Please specify at least one recipient.'
                                });
                                return;
                            }
                        }
                        composeBoxDiv.setAttribute('data-selected_time', finalTimeToShow.format('hh:mm A'));
                        composeBoxDiv.setAttribute('data-selected_timezone', sTimezone);
                        composeBoxDiv.setAttribute('data-selected_date', finalTimeToShow.format('YYYY-MM-DD'));
                        composeBoxDiv.setAttribute('data-selected_datetime', finalTimeToShow.format('YYYY-MM-DD HH:mm'));
                        setupLaterBtn.setAttribute(
                            'data-tooltip',
                            `Email scheduled on - ${finalTimeToShow.format('ddd, DD MMM YYYY, LT, ')} ${sTimezone}`
                        );
                        scheduleDropUpDiv.style.display = 'none';
                        executeSendLaterOperation();
                    });
                });
                scheduleDropupContent.style.display = scheduleDropupContent.style.display == 'block' ? 'none' : 'block';
            }

            function closeSchedule() {
                event.target.closest('.schedule-dropup').style.display = 'none';
            }

            function togglScheduleDateTime() {
                const scheduleDropupContent = event.target.closest('.schedule-dropup');
                let composeBoxDiv = scheduleDropupContent.closest('.inboxsdk__compose');
                if (
                    this.classList.contains('toggleBtnUnSchedule') ||
                    (this.classList.contains('backicon') && composeBoxDiv.getAttribute('data-selected_datetime'))
                ) {
                    const presetDivUnscheduleDiv = scheduleDropupContent.querySelectorAll('.presetDivUnschedule')[0];
                    presetDivUnscheduleDiv.style.display =
                        presetDivUnscheduleDiv.style.display && presetDivUnscheduleDiv.style.display == 'none' ? 'block' : 'none';
                } else {
                    const presetDivScheduleDiv = scheduleDropupContent.querySelectorAll('.presetDivSchedule')[0];
                    presetDivScheduleDiv.style.display =
                        presetDivScheduleDiv.style.display && presetDivScheduleDiv.style.display == 'none' ? 'block' : 'none';
                }

                const dateSelectionDiv = scheduleDropupContent.querySelectorAll('.DateSelectionDiv')[0];
                dateSelectionDiv.style.display =
                    dateSelectionDiv.style.display && dateSelectionDiv.style.display == 'none' ? 'block' : 'none';
            }

            function showScreenToSchedule(selectedDateTime) {
                populateScheduleScreen(selectedDateTime);
                openScheduleScreen();
                attachEventsToButton();
                setupDatePicker();
            }

            function renderScheduleMailDialog(event) {
                // Decide this draft already scheduled ot not
                let composeBoxDiv = event.target.closest('.inboxsdk__compose');
                let scheduleScreenDiv = composeBoxDiv.querySelector('.schedule-dropup');
                if (scheduleScreenDiv && (scheduleScreenDiv.style.display === 'block' || scheduleScreenDiv.style.display === '')) {
                    scheduleScreenDiv.style.display = 'none';
                    return;
                }
                let selectedDateTime = composeBoxDiv.getAttribute('data-selected_datetime');
                if (!_.isEmpty(composeView.scheduleDraftObj) || (selectedDateTime && selectedDateTime.length)) {
                    // Show scheduled screen.
                    // Content to display will be in composeView.scheduleDraftObj
                    showScreenToSchedule(selectedDateTime);
                } else {
                    // Show sceen to schedule email
                    showScreenToSchedule();
                }
                composeBoxDiv.querySelector('#TimeZonePickerInput').addEventListener('mousedown', function() {
                    let scheduleDraftObjTz;
                    if (composeView && composeView.scheduleDraftObj) {
                        let { timezone } = composeView.scheduleDraftObj;
                        if (timezone) {
                            scheduleDraftObjTz = timezone;
                        }
                    }
                    let composeBoxDiv = this.closest('.inboxsdk__compose');
                    let selectedTimezone =
                        composeBoxDiv.getAttribute('data-selected_timezone') || scheduleDraftObjTz || getSystemTimezone();
                    let currentValue = selectedTimezone || 'Select Timezone';
                    this.setAttribute('placeholder', currentValue);
                    this.value = '';
                });
                if (typeof timeZoneAutoComplete.destroy === 'function') {
                    timeZoneAutoComplete.destroy();
                }
                timeZoneAutoComplete = new autoComplete({
                    selector: composeBoxDiv.querySelector('#TimeZonePickerInput') || '#TimeZonePickerInput',
                    minChars: 0,
                    selectedTimezone: '',
                    composeBoxID: event.target.closest('.inboxsdk__compose').id,
                    source: function(sSearchString, suggest) {
                        sSearchString = sSearchString.trim().toLowerCase();
                        choices = groupedByCategory;
                        var suggestions = [];
                        if (sSearchString.length === 0) {
                            Object.keys(groupedByCategory)
                                .sort(function(a, b) {
                                    if (a.toLowerCase() === 'popular timezone' || a < b) {
                                        return -1;
                                    } else if (a > b) {
                                        return 1;
                                    }
                                    return 0;
                                })
                                .forEach(category => {
                                    suggestions.push({
                                        type: 'category',
                                        category: category
                                    });
                                    groupedByCategory[category].forEach(oTimeZone => {
                                        suggestions.push(oTimeZone);
                                    });
                                });
                        } else {
                            let wholeWordMatches = [];
                            let startsWithMatches = [];
                            let partialMatches = [];
                            oTimeZones.forEach(oTimeZone => {
                                if (sSearchString.length > 0 && oTimeZone.category === 'Popular Timezone') {
                                    return true;
                                }
                                let sValueToMatch = (
                                    oTimeZone.category +
                                    ' ' +
                                    oTimeZone.cities +
                                    ' ' +
                                    oTimeZone.city +
                                    ' ' +
                                    oTimeZone.country +
                                    ' ' +
                                    oTimeZone.gmt +
                                    ' ' +
                                    oTimeZone.local_timezone
                                ).toLowerCase();
                                if (
                                    validateRegex('\\b' + sSearchString + '\\b') &&
                                    new RegExp('\\b' + sSearchString + '\\b').test(sValueToMatch)
                                ) {
                                    wholeWordMatches.push(oTimeZone);
                                } else if (validateRegex('\\b' + sSearchString) && new RegExp('\\b' + sSearchString).test(sValueToMatch)) {
                                    startsWithMatches.push(oTimeZone);
                                } else if (sValueToMatch.indexOf(sSearchString) > -1) {
                                    partialMatches.push(oTimeZone);
                                }
                            });
                            suggestions = wholeWordMatches.concat(startsWithMatches.concat(partialMatches));
                        }
                        this.selectedTimezone = '';
                        suggest(suggestions);
                    },
                    renderItem: function(oTimeZone, search) {
                        let selectedTimezone = this.selectedTimezone;
                        if (!selectedTimezone) {
                            let composeBoxDiv = document.getElementById(this.composeBoxID);
                            if (
                                composeBoxDiv &&
                                composeBoxDiv.querySelector('#datepicker1') &&
                                composeBoxDiv.querySelector('#datepicker1')._flatpickr
                            ) {
                                let flatpickrInstance = composeBoxDiv.querySelector('#datepicker1')._flatpickr;
                                selectedTimezone = flatpickrInstance.config.selectedTimezone;
                                this.selectedTimezone = selectedTimezone;
                            }
                        }
                        search = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&amp;');
                        if (oTimeZone.type === 'category') {
                            return `<div class="timezone-category">${oTimeZone.category}</div>`;
                        } else {
                            let sTimezoneKey = `${oTimeZone.city}, ${oTimeZone.country}`;
                            let sClass = 'autocomplete-suggestion';
                            let [sTime, sAMPM, sLocalTimeZone] = moment()
                                .tz(oTimeZone.timezone_name)
                                .format('LT z')
                                .split(' ');
                            sLocalTimeZone = sLocalTimeZone.indexOf('0') > -1 ? oTimeZone.local_timezone : sLocalTimeZone;
                            if (oTimeZone.timezone_name === selectedTimezone) {
                                sClass += ' selected';
                            }
                            if (oTimeZone.category !== 'Popular Timezone') {
                                sClass += ' popular';
                            }

                            return `<div class="${sClass}" data-timezone="${oTimeZone.timezone_name}" data-cityname="${
                                oTimeZone.city
                            }" data-countryname="${oTimeZone.country}" data-val="${search}">
                            <div class="zoneName">${sTimezoneKey}</div>
                                <div class="zoneDetails">
                                    <span class="zoneLocalName">${sLocalTimeZone}</span>
                                    <span class="timePipe"> | </span>
                                    <span class="gmtName">${oTimeZone.gmt}</span>
                                    <span class="zoneTime">${sTime + ' ' + sAMPM}</span>
                                </div>
                            </div>`;
                        }
                    },
                    onSelect: function(e, term, item) {
                        let timezone_name = `${item.getAttribute('data-timezone')}`;
                        let flatpickrInstance = document.querySelector('#datepicker1')._flatpickr;
                        let composeBoxDiv = flatpickrInstance.element.closest('.inboxsdk__compose');
                        let prevTimeZone = composeBoxDiv.getAttribute('data-selected_timezone') || getSystemTimezone();
                        let scheduleBtn = composeBoxDiv.querySelector('.schedule-confirm-btn');
                        let prevDate = composeBoxDiv.getAttribute('data-selected_datetime');
                        let isScheduledDraft = false;
                        if (prevDate) {
                            isScheduledDraft = true;
                        }
                        if (timezone_name !== prevTimeZone) {
                            scheduleBtn.classList.add('schedule-btn');
                            scheduleBtn.classList.remove('unschedule-btn');
                            scheduleBtn.innerHTML = 'Schedule';
                            this.selector.classList.remove('redText', 'blueText');
                            this.selector.classList.add('blueText');
                        } else {
                            if (isScheduledDraft) {
                                scheduleBtn.classList.remove('schedule-btn');
                                scheduleBtn.classList.add('unschedule-btn');
                                scheduleBtn.innerHTML = 'Unschedule';
                            }
                            this.selector.classList.remove('blueText', 'redText');
                        }
                        flatpickrInstance.set('selectedTimezone', timezone_name);
                        this.selectedTimezone = timezone_name;
                        let selectedMoment = moment(flatpickrInstance.selectedDates[0], 'YYYY-MM-DD hh:mm A');
                        let tzMoment = moment(
                            moment()
                                .tz(timezone_name)
                                .format('YYYY-MM-DD hh:mm A'),
                            'YYYY-MM-DD hh:mm A'
                        );
                        let minDate = tzMoment.add(1, 'minutes').format('YYYY-MM-DD hh:mm A');
                        flatpickrInstance.set('minDate', minDate);
                        if (selectedMoment.isBefore(tzMoment)) {
                            flatpickrInstance.setDate(minDate, true, 'Y-m-d h:i K');
                            highlightChanges(flatpickrInstance.altInput);
                        } else {
                            flatpickrInstance.setDate(selectedMoment.format('YYYY-MM-DD hh:mm A'), true, 'Y-m-d h:i K');
                        }
                        // let selectedValue = `${item.getAttribute('data-cityname')}, ${item.getAttribute('data-countryname')}`;
                        document.getElementById('TimeZonePickerInput').value = timezone_name;
                        window.setTimeout(function() {
                            if (document.getElementById('TimeZonePickerInput')) {
                                document.getElementById('TimeZonePickerInput').blur();
                            }
                        }, 500);
                    }
                });

                Array.from(composeBoxDiv.querySelectorAll('.schedule-confirm-btn')).forEach(scheduleBtn => {
                    scheduleBtn.addEventListener(
                        'click',
                        function(event) {
                            let isUnscheduleEvent =
                                event.target.classList.contains('unschedule-btn') &&
                                !event.target.classList.contains('saveChangesSchedule');
                            let composeBoxDiv = event.target.closest('.inboxsdk__compose');
                            let scheduleDropUpDiv = composeBoxDiv.querySelector('#sh_schedule_dropup_option');
                            let flatpickrInstance = composeBoxDiv.querySelector('#datepicker1')._flatpickr;
                            let tzMoment = moment(flatpickrInstance.selectedDates[0], 'YYYY-MM-DD HH:mm');
                            let selectedTimeZone = flatpickrInstance.config.selectedTimezone;
                            let nowAbs = moment(
                                moment()
                                    .tz(selectedTimeZone)
                                    .format('YYYY-MM-DD HH:mm'),
                                'YYYY-MM-DD HH:mm'
                            );
                            if (!tzMoment.isAfter(nowAbs)) {
                                showButterBarMsg('The selected date and time has already passed for the selected timezone.');
                                flatpickrInstance.altInput.classList.remove('redText');
                                flatpickrInstance.altInput.classList.add('redText');
                                return;
                            } else {
                                butterBarMsgInstance && butterBarMsgInstance.destroy();
                            }
                            let setupLaterBtn = composeBoxDiv.querySelector('#ShContainer');
                            let sendLaterBtn = setupLaterBtn.querySelector('#sh_send_later_option');
                            if (isUnscheduleEvent) {
                                let composeViewInstance = composeViews[composeBoxDiv.id];
                                if (
                                    composeViewInstance &&
                                    composeViewInstance.scheduleDraftObj &&
                                    composeViewInstance.scheduleDraftObj.emailID
                                ) {
                                    deleteEmail(composeViewInstance.scheduleDraftObj.emailID).then(res => {
                                        if (res.error_message) return showButterBarMsg(res.error_message);
                                        composeViewInstance.scheduleDraftObj.isSchedulingDraft = false;
                                        isScheduleForLater = false;
                                        schMoment = null;
                                        toggleStatusBarScheduleInfo('', '', '', false);
                                        setupLaterBtn.setAttribute('data-tooltip', 'Schedule your mail');
                                        if (sendLaterBtn) {
                                            sendLaterBtn.innerHTML = 'Send Later';
                                        }
                                        removeFromLocalStorageArray('scheduledDrafts', composeViewInstance.currentEmailID);
                                        clearPreviousEmailValues();
                                        setupLaterBtn.style.fill = COLORS.SH_GRAY_GMAIL;
                                        composeBoxDiv.setAttribute('data-selected_time', '');
                                        composeBoxDiv.setAttribute('data-selected_timezone', '');
                                        composeBoxDiv.setAttribute('data-selected_date', '');
                                        composeBoxDiv.setAttribute('data-selected_datetime', '');
                                        setupLaterBtn.setAttribute('data-tooltip', 'Schedule your mail');
                                        setupLaterBtn.parentElement.style.color = COLORS.SH_GRAY_GMAIL;
                                        setupLaterBtn.parentElement.style.fill = COLORS.SH_GRAY_GMAIL;
                                    });
                                } else {
                                    if (sendLaterBtn) {
                                        sendLaterBtn.innerHTML = 'Reschedule';
                                    }
                                    setupLaterBtn.style.fill = COLORS.SH_GRAY_GMAIL;
                                    composeBoxDiv.setAttribute('data-selected_time', '');
                                    composeBoxDiv.setAttribute('data-selected_timezone', '');
                                    composeBoxDiv.setAttribute('data-selected_date', '');
                                    composeBoxDiv.setAttribute('data-selected_datetime', '');
                                    setupLaterBtn.setAttribute('data-tooltip', 'Schedule your mail');
                                    setupLaterBtn.parentElement.style.color = COLORS.SH_GRAY_GMAIL;
                                    setupLaterBtn.parentElement.style.fill = COLORS.SH_GRAY_GMAIL;
                                }
                            } else {
                                setupLaterBtn.style.fill = COLORS.SH_RED_GMAIL;
                                schMoment = tzMoment.format('YYYY-MM-DD hh:mm A');
                                if (composeBoxDiv && composeBoxDiv.id) {
                                    let infoInEmail = getInfoInMail();
                                    if (infoInEmail.to.length < 1 && infoInEmail.cc.length < 1 && infoInEmail.bcc.length < 1) {
                                        scheduleDropUpDiv.style.display = 'none';
                                        return onError({
                                            error: true,
                                            error_code: 'NO_RECIPIENT_SCHEDULE',
                                            error_message: 'Please specify at least one recipient.'
                                        });
                                    }
                                }
                                composeBoxDiv.setAttribute('data-selected_time', tzMoment.format('hh:mm A'));
                                composeBoxDiv.setAttribute('data-selected_timezone', selectedTimeZone);
                                composeBoxDiv.setAttribute('data-selected_date', tzMoment.format('YYYY-MM-DD'));
                                composeBoxDiv.setAttribute('data-selected_datetime', tzMoment.format('YYYY-MM-DD HH:mm'));
                                setupLaterBtn.setAttribute(
                                    'data-tooltip',
                                    `Email scheduled on - ${tzMoment.format('ddd, DD MMM YYYY, LT, ')} ${selectedTimeZone}`
                                );
                                setupLaterBtn.parentElement.style.color = COLORS.SH_RED_GMAIL;
                                setupLaterBtn.parentElement.style.fill = COLORS.SH_RED_GMAIL;
                                scheduleDropUpDiv.style.display = 'none';
                                executeSendLaterOperation();
                            }
                            scheduleDropUpDiv.style.display = 'none';
                        },
                        true
                    );
                });
            }

            function addButtonEvent(btns, fnToCall, composeView) {
                btns.forEach(btn => btn.addEventListener('click', fnToCall));
            }

            function updateStatusBarWhenScheduled(obj) {
                let { dateSelected, timeSelected, timezone } = obj || composeView.scheduleDraftObj;
                isScheduleForLater = true;
                toggleStatusBarScheduleInfo(dateSelected, timeSelected, timezone);
            }

            function toggleStatusBarScheduleInfo(dateSelected, timeSelected, timezone, isScheduleForLaterParam) {
                let sch_msg = objStatusBarView.el.querySelector('#scheduled_msg');
                let composeBoxDiv = objStatusBarView.el.closest('.inboxsdk__compose');
                if (isScheduleForLaterParam === undefined) {
                    isScheduleForLaterParam = isScheduleForLater;
                }
                if (!isScheduleForLaterParam) {
                    sch_msg.innerHTML = '';
                    setupLaterBtn.style.fill = COLORS.SH_GRAY_GMAIL;
                    composeView.scheduleDraftObj = null;
                    composeView.previousScheduledDraftObj = null;
                    composeBoxDiv.setAttribute('data-selected_time', '');
                    composeBoxDiv.setAttribute('data-selected_timezone', '');
                    composeBoxDiv.setAttribute('data-selected_date', '');
                    composeBoxDiv.setAttribute('data-selected_datetime', '');
                    return;
                }
                setupLaterBtn.style.fill = COLORS.SH_RED_GMAIL;
                schMoment = moment(`${dateSelected} ${timeSelected}`, 'YYYY-MM-DD h:mm A');
                setupLaterBtn.setAttribute(
                    'data-tooltip',
                    `Email scheduled on - ${schMoment.format('ddd, DD MMM YYYY, LT, ')} ${timezone}`
                );
                if (composeBoxDiv) {
                    composeBoxDiv.setAttribute('data-selected_time', timeSelected);
                    composeBoxDiv.setAttribute('data-selected_timezone', timezone);
                    composeBoxDiv.setAttribute('data-selected_date', dateSelected);
                    composeBoxDiv.setAttribute('data-selected_datetime', schMoment.format('YYYY-MM-DD HH:mm'));
                }
                setupLaterBtn.parentElement.style.color = COLORS.SH_BLUE_GMAIL;
                setupLaterBtn.parentElement.style.fill = COLORS.SH_BLUE_GMAIL;
            }

            function executeSendLaterOperation() {
                // Info in email to get the value of to field
                let composeBoxDiv = event.target.closest('.inboxsdk__compose');
                if (composeBoxDiv && composeBoxDiv.id) {
                    let composeViewInstance = composeViews[composeBoxDiv.id];
                    if (shouldWeTrackLocal && !isContactListInLimit()) {
                        composeBoxDiv.setAttribute('data-selected_datetime', '');
                        setupLaterBtn.setAttribute('data-tooltip', 'Schedule your mail');
                        return;
                    }
                    let draftidFromDOM = composeBoxDiv.querySelector("input[value^='#msg-a']");
                    draftidFromDOM = draftidFromDOM && draftidFromDOM.getAttribute('value');
                    let isInlineReply = composeView.isInlineReplyForm();
                    let threadidFromDOM = composeBoxDiv.querySelector("input[value^='#thread-a']");
                    threadidFromDOM =
                        (threadidFromDOM && threadidFromDOM.getAttribute('value')) || '#thread-a:' + composeView.getThreadID();
                    if (isInlineReply) {
                        threadidFromDOM = document.querySelector('tr[data-inboxsdk-currentthreadid]');
                        threadidFromDOM =
                            (threadidFromDOM && threadidFromDOM.getAttribute('data-inboxsdk-currentthreadid')) ||
                            '#thread-f:' + composeView.getThreadID();
                    }
                    composeView.tempDraftID = draftidFromDOM;
                    composeView.tempThreadID = threadidFromDOM;
                    if (!isInlineReply) {
                        composeBoxDiv.style.display = 'none';
                        setTimeout(function() {
                            showComposeView();
                        }, 4000);
                    }
                    let infoInEmail = getInfoInMail();
                    if (infoInEmail.to.length < 1 && infoInEmail.cc.length < 1 && infoInEmail.bcc.length < 1) {
                        return showButterBarMsg('Please provide at least one recipient.');
                    }
                    getWaitingTimer().then(waitOver => {
                        if (waitOver & !composeViewInstance.currentEmailID) {
                            if (!composeViewInstance.currentEmailID) {
                                let composeBoxDiv = composeViewInstance.getElement();
                                let draftIDFromDOM = composeBoxDiv.querySelector("input[name='draft'][value^='#msg-a']");
                                draftIDFromDOM = draftIDFromDOM && draftIDFromDOM.getAttribute('value');
                                draftIDFromDOM =
                                    draftIDFromDOM && draftIDFromDOM.split(':')[1] ? draftIDFromDOM.split(':')[1] : GET_DRAFT_ID_FAILED;
                                composeViewInstance.currentEmailID = draftIDFromDOM;
                            }
                        }
                    });
                    delayTillEmailID(scheduleMailForLater, composeViewInstance);
                } else {
                    return showButterBarMsg('Scheduling failed');
                }
            }

            function scheduleMailForLater() {
                let composeBoxDiv = composeView.getElement();
                let date = composeBoxDiv.getAttribute('data-selected_date');
                let time = composeBoxDiv.getAttribute('data-selected_time');
                let timezone = composeBoxDiv.getAttribute('data-selected_timezone');
                date = date || composeView.scheduleDraftObj.dateSelected;
                time = time || composeView.scheduleDraftObj.timeSelected;
                timezone = timezone || composeView.scheduleDraftObj.timezone;
                let tzMomentAbs = moment(
                    moment()
                        .tz(timezone)
                        .format('YYYY-MM-DD h:mm A'),
                    'YYYY-MM-DD h:mm A'
                );
                let scheduledTime = moment(`${date} ${time}`, 'YYYY-MM-DD h:mm A');
                if (scheduledTime.isBefore(tzMomentAbs)) {
                    showButterBarMsg('The scheduled time is already passed in the selected timezone ...');
                    return;
                }
                let infoInEmail = getInfoInMail();
                infoInEmail.is_draft = 0;
                infoInEmail.is_scheduled = 1;
                infoInEmail.timezone = timezone || composeView.scheduleDraftObj.timezone;
                infoInEmail.sent_message_id = currentEmailID1;
                infoInEmail.scheduled_at = moment(`${date} ${time}`, 'YYYY-MM-DD h:mm A').format('YYYY-MM-DD HH:mm:ss');

                //Need previousLocalNot for poped out reply window
                let { localClickTrack, localNot } = localEmailOptions;
                commonOperationForBothSchedule(localClickTrack, localNot, infoInEmail);
            }

            function commonOperationForBothSchedule(localClickTrack, localNot, infoInEmail) {
                trackingObject = getLinkFromBody(localClickTrack) || [];
                infoInEmail.track_click = localClickTrack ? 1 : 0;
                let isSchedulingDraft = (composeView.scheduleDraftObj && composeView.scheduleDraftObj.isSchedulingDraft) || null;

                if (composeView.previousScheduledDraftObj) {
                    isSchedulingDraft = true;
                    composeView.scheduleDraftObj = composeView.previousScheduledDraftObj;
                }

                if (trackingObject && trackingObject.links && trackingObject.links.length > 0) {
                    infoInEmail.track_links = trackingObject.links;
                }
                if (trackingObject && trackingObject.docs && trackingObject.docs.length > 0) {
                    infoInEmail.track_docs = trackingObject.docs;
                }

                /* Attach Email Sequence Template If any */
                if (
                    !sequenceIdAttachedToMail &&
                    composeView.previousScheduledDraftObj &&
                    composeView.previousScheduledDraftObj.attachedSeqId
                )
                    sequenceIdAttachedToMail = composeView.previousScheduledDraftObj.attachedSeqId;
                if (!sequenceIdAttachedToMail && seqAttachedWithReplyAndForwardSchedule)
                    sequenceIdAttachedToMail = seqAttachedWithReplyAndForwardSchedule;
                if (sequenceIdAttachedToMail) {
                    const isToPresentWithSequence = checkToAndSequenceBothPresent(infoInEmail.to, sequenceIdAttachedToMail);
                    if (!isToPresentWithSequence) {
                        onError({
                            error: true,
                            error_code: 'No_To_With_Sequence',
                            error_message: 'To field is mandatory with sequence attached.'
                        });
                        showComposeView();
                        clearScheduleValues(composeView);
                        return;
                    }
                    infoInEmail.sequence_template = sequenceIdAttachedToMail;
                }
                showButterBarMsg('Scheduling ...');

                if (infoInEmail.sent_message_id === GET_DRAFT_ID_FAILED) {
                    showButterBarMsg('Please save email ...');
                    clearScheduleValues(composeView);
                    return;
                }

                // Value of composeView.scheduleDraftObj will be null when open mail schedule in reply/forward
                // To counter that
                if (isSchedulingDraft) {
                    infoInEmail.emailID = composeView.scheduleDraftObj.emailID;
                    updateEmailData(infoInEmail).then(res => {
                        updateOldScheduleEmailAfterResponse(res, localNot);
                    });
                } else {
                    createEmailToAddPixel(infoInEmail).then(res => {
                        newScheduleEmailAfterResponse(res, localNot);
                    });
                }
                appendToLocalStorageArray('scheduledDrafts', currentEmailID1);
            }

            function updateOldScheduleEmailAfterResponse(res, localNot) {
                if (!res) {
                    res = previousResult;
                    localNot = previousLocalNot;
                    composeView.scheduleDraftObj = composeView.previousScheduledDraftObj;
                }
                if (res.error) {
                    if (isBlacklistedErrorCode(res.error_code)) {
                        // Show blacklisted error popup.
                        onError(res, composeView);
                    }
                    showButterBarMsg('Scheduling Failed');
                    showComposeView();
                    clearScheduleValues(composeView);
                    return;
                }
                let { tracked_links, track_docs } = res;
                addTrackingDetails(tracked_links, LINKS);
                addTrackingDetails(track_docs, DOCS);
                //Compare if notification value is toggled
                Boolean(composeView.scheduleDraftObj.snooze_notifications) == localNot ? null : setSnoozeEmail(res.id);
                let composeBoxDiv = composeView.getElement();
                if (composeView.isInlineReplyForm()) {
                    GoBackToListView();
                } else {
                    composeView.close();
                }
                let scheduledTimeMmt = moment(composeBoxDiv.getAttribute('data-selected_datetime'), 'YYYY-MM-DD HH:mm');
                showButterBarMsg(
                    `Email will be sent on ${scheduledTimeMmt.format('dddd, DD MMM YYYY, LT')}.`,
                    5000,
                    undefined,
                    [
                        {
                            title: 'Unschedule',
                            composeBoxUniqueID: composeBoxUniqueID,
                            emailID: res.id,
                            onClick: function() {
                                let composeBoxUniqueID = this.composeBoxUniqueID;
                                let composeView = composeViews[composeBoxUniqueID];
                                if (this.emailID) {
                                    deleteEmail(this.emailID).then(unscheduleCleanUp.bind(null, composeBoxUniqueID));
                                }
                                butterBarMsgInstance && butterBarMsgInstance.destroy();
                                if (composeView) {
                                    openClosedComposeView(composeView);
                                }
                            }
                        }
                    ],
                    composeBoxUniqueID
                );
                clearPreviousEmailValues();
            }

            function newScheduleEmailAfterResponse(res, localNot) {
                if (!res) {
                    res = previousResult;
                    localNot = previousLocalNot;
                }
                if (res.error) {
                    let { error, error_code } = res;
                    if (error && error_code == 2401) {
                        composeView.isMailAScheduledEmail = true;
                        onError(res, composeView);
                    }
                    if (error && isBlacklistedErrorCode(error_code)) {
                        // Show blacklisted error popup.
                        onError(res, composeView);
                    }
                    showButterBarMsg('Scheduling Failed');
                    showComposeView();
                    clearScheduleValues(composeView);
                    return;
                }
                let { tracking_pixel, tracked_links, track_docs } = res;
                addTrackingPixel(tracking_pixel);
                addTrackingDetails(tracked_links, LINKS);
                addTrackingDetails(track_docs, DOCS);
                if (!localNot) setSnoozeEmail(res.id);
                let composeBoxDiv = composeView.getElement();
                let composeBoxUniqueID = composeBoxDiv.id;
                if (!composeBoxUniqueID) {
                    composeBoxDiv.id = composeBoxID;
                    composeBoxUniqueID = composeBoxID.toString();
                }
                if (composeView.isInlineReplyForm()) {
                    GoBackToListView();
                } else {
                    composeView.close();
                }
                let scheduledTimeMmt = moment(composeBoxDiv.getAttribute('data-selected_datetime'), 'YYYY-MM-DD HH:mm');
                showButterBarMsg(
                    `Email will be sent on ${scheduledTimeMmt.format('dddd, DD MMM YYYY, LT')}.`,
                    10000,
                    undefined,
                    [
                        {
                            title: 'Unschedule',
                            composeBoxUniqueID: composeBoxUniqueID,
                            emailID: res.id,
                            onClick: function() {
                                let composeBoxUniqueID = this.composeBoxUniqueID;
                                let composeView = composeViews[composeBoxUniqueID];
                                if (this.emailID) {
                                    deleteEmail(this.emailID).then(unscheduleCleanUp.bind(null, composeBoxUniqueID));
                                }
                                butterBarMsgInstance && butterBarMsgInstance.destroy();
                                let newURL = window.location.href;
                                if (composeView) {
                                    tempThreadID = composeView.tempThreadID;
                                    tempDraftID = composeView.tempDraftID;
                                    let isInlineReply = composeView.isInlineReplyForm();
                                    let urlParamToOpen = isInlineReply
                                        ? tempThreadID.replace('#', '')
                                        : tempThreadID.replace('#', '') + '+' + tempDraftID.replace('#', '');
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
                                        if (!isInlineReply) {
                                            oURLParams.compose = newURLForComposeBoxes;
                                        }
                                    }
                                    let applicationURL = getCurrentGmailInstanceURL();
                                    let baseURL = isInlineReply
                                        ? applicationURL + '/#inbox/' + newURLForComposeBoxes
                                        : window.location.href.split('?')[0];
                                    newURL = makeURL(baseURL, oURLParams);
                                    window.location.href = newURL;
                                }
                            }
                        }
                    ],
                    composeBoxUniqueID
                );
                clearPreviousEmailValues();
            }

            function unscheduleCleanUp(composeBoxUniqueID, res) {
                if (res.error_message) return showButterBarMsg(res.error_message);
                let composeViewInstance = composeViews[composeBoxUniqueID];
                isScheduleForLater = false;
                schMoment = null;
                removeFromLocalStorageArray('scheduledDrafts', composeViewInstance.currentEmailID);
                clearPreviousEmailValues();
                clearScheduleValues(composeViewInstance);
            }

            function clearScheduleValues(composeView) {
                let composeBoxDiv = composeView.getElement();
                composeBoxDiv.setAttribute('data-selected_time', '');
                composeBoxDiv.setAttribute('data-selected_timezone', '');
                composeBoxDiv.setAttribute('data-selected_date', '');
                composeBoxDiv.setAttribute('data-selected_datetime', '');
                composeBoxDiv.classList.remove('hidden');
                setupLaterBtn.setAttribute('data-tooltip', 'Schedule your mail');
                setupLaterBtn.parentElement.style.color = COLORS.SH_GRAY_GMAIL;
                setupLaterBtn.parentElement.style.fill = COLORS.SH_GRAY_GMAIL;
            }

            function _isMailAScheduledEmail(currentEmailID1) {
                let scheduledDraftIds = JSON.parse(window.localStorage.getItem('scheduledDrafts'));
                return scheduledDraftIds.includes(currentEmailID1) ? true : false;
            }

            function viewScheduleInDraft() {
                let isMailAScheduledEmail = _isMailAScheduledEmail(currentEmailID1);
                let sendLaterBtn = setupLaterBtn && setupLaterBtn.querySelector('#sh_send_later_option');
                //Check if opened draft ID is in the list of scheduled drafts
                if (sendLaterBtn) {
                    sendLaterBtn.innerHTML = isMailAScheduledEmail ? 'Reschedule' : 'Send Later';
                }
                if (!isMailAScheduledEmail || currentEmailID1 == GET_DRAFT_ID_FAILED) {
                    isScheduleForLater = false;
                    return;
                }
                fetchScheduledInfoForMail(currentEmailID1).then(res => {
                    let sendLaterBtn = setupLaterBtn.querySelector('#sh_send_later_option');
                    if (res.error) {
                        if (sendLaterBtn) {
                            sendLaterBtn.innerHTML = 'Send Later';
                        }
                        return onError(res);
                    }
                    if (!res.id) {
                        if (sendLaterBtn) {
                            sendLaterBtn.innerHTML = 'Send Later';
                        }
                        return;
                    }
                    if (sendLaterBtn) {
                        sendLaterBtn.innerHTML = 'Reschedule';
                    }
                    let scheduledTime = moment(res.scheduled_at, 'MMM DD YYYY hh:mm A');
                    composeView.scheduleDraftObj = {
                        dateSelected: scheduledTime.format('YYYY-MM-DD'),
                        timeSelected: scheduledTime.format('h:mm A'),
                        timezone: res.timezone,
                        isSchedulingDraft: true,
                        emailID: res.id,
                        snooze_notifications: res.snooze_notifications
                    };
                    if (res.sequence_template_id) {
                        sequenceIdAttachedToMail = res.sequence_template_id;
                        composeView.scheduleDraftObj.attachedSeqId = res.sequence_template_id;
                    }
                    composeView.previousScheduledDraftObj = composeView.scheduleDraftObj;

                    updateStatusBarWhenScheduled();
                    setupLocalEmailOptionsForSchedule(res);
                    composeView.toggleLocalEmailTrack();
                    if (res.sequence_template_id) setupSequnceAttachment();
                });
            }

            function setupLocalEmailOptionsForSchedule(fetchDeatilsFromAPI) {
                let { preferences } = userPreferencesRes;
                if (!preferences) preferences = getDefaultPreferences();

                //Email Track
                let trackBtnClasses = trackBtn.children[0].classList;
                trackBtnClasses.remove('sh_active_track');

                //Powered By sign
                let emailBody = composeView.getBodyElement();
                let poweredBySign = emailBody.querySelector('[id$="saleshandy_branding"]');
                localEmailOptions.localPoweredSign = poweredBySign ? true : false;

                //Tracking Links
                let { track_click } = fetchDeatilsFromAPI;
                localEmailOptions.localClickTrack = track_click == 1 ? true : false;

                // For notifications
                let { snooze_notifications } = fetchDeatilsFromAPI;
                if (snooze_notifications == 0) {
                    localEmailOptions.localNot = false;
                } else {
                    localEmailOptions.localNot = true;
                }
                setupTrackPopupCheckBox();
            }

            function setupSequnceAttachment() {
                let { attachedSeqId } = composeView.scheduleDraftObj;
                // Change color
                let imageAttached = objStatusBarView.el.querySelector('#attach-seq-img');
                imageAttached.src = chrome.extension.getURL('images/email_sequence_attached.png');

                // Add data tooltip
                setTimeout(() => {
                    let labelForCheckBox;
                    const labelForCheckBoxs = objStatusBarView.el.querySelectorAll('.check-custom-label');
                    [...labelForCheckBoxs].forEach(label => {
                        if (label.id == attachedSeqId) labelForCheckBox = label;
                    });
                    if (labelForCheckBox) {
                        objStatusBarView.el
                            .querySelector('#seqTooltip')
                            .setAttribute('data-tooltip', `${labelForCheckBox.textContent.trim()}`);
                    }
                }, 1500);

                // Pick Check Box
                let seqTemplateDropupContent = objStatusBarView.el.querySelector('.seq-temp-dropup-container');
                let allCheckBoxes = seqTemplateDropupContent.querySelectorAll('.check-custom');
                [...allCheckBoxes].forEach(checkEle => {
                    if (checkEle.id == attachedSeqId) checkEle.checked = true;
                });
            }

            function appendToLocalStorageArray(key, value) {
                let output = JSON.parse(window.localStorage.getItem(key));
                if (output.includes(value)) return;
                output.push(value);
                window.localStorage.setItem(key, JSON.stringify(output));
            }

            function removeFromLocalStorageArray(key, value) {
                let output = JSON.parse(window.localStorage.getItem(key));
                if (!output.includes(value)) return;
                output = output.filter(item => item !== value);
                window.localStorage.setItem(key, JSON.stringify(output));
            }

            //#endregion
            /******************************************************************************* */
            //Code associated with Mail Schedular of Compose Window Ends
            /******************************************************************************* */

            /******************************************************************************* */
            //Code associated with Template Insertion of Compose Window Starts
            /******************************************************************************* */
            //#region

            // Code for template insertion will come here
            function getIDFromFrame(event) {
                if (event.origin === crossPlatformEndPoint) {
                    let pricingModal = document.querySelector('.pricingCPModal');
                    switch (event && event.data) {
                        case 'close_payment_box':
                            crossPlatformModalView && typeof crossPlatformModalView.close === 'function' && crossPlatformModalView.close();
                            window.location.reload();
                            break;
                        case 'goto_success_page':
                        case 'goto_failure_page':
                            pricingModal.classList.add('pricingComplete');
                            break;
                        case 'goto_pricing_page':
                            pricingModal.classList.remove('pricingComplete');
                            break;
                        default:
                            crossPlatformModalView && typeof crossPlatformModalView.close === 'function' && crossPlatformModalView.close();
                            let documentsCPModal = document.querySelector('.documentsCPModal');
                            if (documentsCPModal !== null) {
                                documentsCPModal &&
                                    documentsCPModal.parentElement &&
                                    documentsCPModal.parentElement.removeChild(documentsCPModal);
                            }
                    }
                    let activeID = window.sessionStorage.getItem('activeComposeBoxID');

                    let data = event.data;
                    let isButtonClickedInFrame = checkIfButtonClicked(data);
                    if (isButtonClickedInFrame) return window.open(data);
                    // File will be list of files
                    // if document inserted then recieved data will be object not string
                    if (typeof(data) != 'string' || data.file) {
                        // Document inserted
                        if (!data || (data.length === 0 && !data.file)) {
                            return;
                        }
                        if(activeID != composeView.composeBoxID){
                            var composeBoxIDs = Object.keys(composeViews);
                            for(let i = 0; i < composeBoxIDs.length; i++){
                                if(composeViews[composeBoxIDs[i]].composeBoxID == activeID){
                                    composeView = composeViews[composeBoxIDs[i]];
                                    break;
                                }
                            }
                        }
                         // TODO: Refactor after Chrome release 2.5.3
                         if (data.file) {
                            insertDocumentAndSpace(data);
                        }else {
                            data.forEach(i=> insertDocumentAndSpace(i));
                        }
                    } else {
                        if (activeID != composeView.composeBoxID && document.querySelector('.template-modal-container') === null) return;
                        getTemplateContent(data).then(res => {
                            butterBarMsgInstance && butterBarMsgInstance.destroy();
                            if (res.error) return onError(res);
                            hideAllTemplatePopOut();
                            let CreatePopUpView = document.querySelector('.template-modal-container');
                            if (CreatePopUpView) {
                                let editorContent = $('#summernote').summernote('code');
                                editorContent = editorContent && editorContent.concat(res.content);
                                $('#summernote').summernote('code', editorContent);
                                $('#summernote').summernote('editor.focus');
                            } else {
                                finalTemplateID = res.id;
                                if (!composeView.getSubject()) composeView.setSubject(res && res.subject);
                                composeView.insertHTMLIntoBodyAtCursor(res && res.content);
                                updateIncludedDocumentAndSpace(composeView);
                            }
                        });
                    }
                }
            }

            function insertDocumentAndSpace(data) {
                let ele = document.createElement('a');
                ele.innerText = data.name;
                ele.href = data.file;
                ele.className = 'sh_doc';
                ele.isLink = data.is_link;
                ele.append(document.createElement('br'))
                let CreatePopUpView = document.querySelector('.template-modal-container');
                if (CreatePopUpView) {
                    let wrapperRange = $('#summernote').summernote('editor.getLastRange');
                    if (
                        wrapperRange &&
                        wrapperRange.ec &&
                        wrapperRange.ec.classList &&
                        wrapperRange.ec.classList.contains('QuickTemplatePopOutSection')
                    ) {
                        let editorContent = $('#summernote').summernote('code');
                        editorContent = editorContent.concat(ele);
                        $('#summernote').summernote('code', editorContent);
                        $('#summernote').summernote('editor.focus');
                    } else {
                        var el = document.createElement('p');
                        el.appendChild(ele);
                        wrapperRange && wrapperRange.pasteHTML(el.innerHTML);
                        $('#summernote').summernote('editor.focus');
                    }
                } else {
                    composeView.insertHTMLIntoBodyAtCursor(ele);
                }
            }

            function checkIfButtonClicked(data) {
                if (_.isObject(data)) return false;
                return REG_URL.test(data);
            }

            function addTemplate(templateName, templateFolder) {
                let content = composeView.getBodyElement();
                let shBrand = content.querySelector("[id$='saleshandy_branding']");
                let tempContent = composeView.getHTMLContent();
                if (shBrand) shBrand.parentNode.removeChild(shBrand);

                let templatePayload = {
                    content: composeView.getHTMLContent(),
                    folder: templateFolder,
                    subject: composeView.getSubject(),
                    title: templateName
                };
                addTemplateToDB(templatePayload).then(res => {
                    composeView.setBodyHTML(tempContent);
                    // TODO: Check for pause
                    if (res.error) {
                        if (HAS_PAUSED_SUBSCRIPTION) {
                            showPricingPopUp(PAUSED_SUBSCRIPTION_POPUP_MSG, { error_code: PAUSED_SUBSCRIPTION_ERR_CODE });
                        }else{
                            onError(res);
                        }
                        return ;
                    }
                    showButterBarMsg(res.message);
                    addTemplateModalView.close();
                });
            }

            window.addTemplate = addTemplate;
            //#endregion
            /******************************************************************************* */
            //Code associated with Template Insertion of Compose Window Ends
            /******************************************************************************* */
        });
    }
    //#endregion
    /******************************************************************************* */
    /*                COMPOSE BOX RELATED FUNCTIONS ENDs                             */
    /******************************************************************************* */

    (function removeFromSocketOnLogout() {
        let logoutURL = document.querySelector("[href^='https://accounts.google.com/Logout']");
        if (logoutURL) {
            document.querySelector("[href^='https://accounts.google.com/Logout']").addEventListener('click', () => {
                sendMessageToBackground({
                    userID: userPreferencesRes.id,
                    startNotify: false,
                    shref: userPreferencesRes.shref
                });
            });
        }
    })();
});

/*********************************************************************************** */
/*                       DB CALLS FUNCTIONS STARTS                                   */
/*********************************************************************************** */
//#region
function getBFCMPermission(email) {
    let checkBFCMUrl = '/user/check-bfmf-offer/';
    let url = checkBFCMUrl + email;
    let oRequestBody = {
        action: 'callFunction',
        function: 'getData',
        parameters: [url]
    };
    return sendMessageToBackgroundPromise(oRequestBody);
}

function checkUserExist(email) {
    let checkUserExistUrl = '/user/account-exists/';
    let url = checkUserExistUrl + email;
    let oRequestBody = {
        action: 'callFunction',
        function: 'getData',
        parameters: [url]
    };
    return sendMessageToBackgroundPromise(oRequestBody);
}

function injectIntoTab(tab) {
    // You could iterate through the content scripts here
    console.log('Inject Into Tab : ');
    var scripts = chrome.manifest.content_scripts[0].js;
    var i = 0, s = scripts.length;
    for( ; i < s; i++ ) {
        chrome.tabs.executeScript(tab.id, {
            file: scripts[i]
        });
    }
}

function letgetStartedClick() {
    modalView.close();
}

function disableButton(elementId) {
    const activatePlugInRef = document.getElementById(elementId);
    if(activatePlugInRef){
        activatePlugInRef.classList.add("button-disabled");
    }
}

function enableButton(elementId) {
    const activatePlugInRef = document.getElementById(elementId);
    if(activatePlugInRef){
        activatePlugInRef.classList.remove("button-disabled");
    }
}

function setAuthToken() {
    disableButton('activate_plugin');
    let connectWithGoogleUrl =  currentUserEmail ? `/user/login-connect/GMAIL?email=${currentUserEmail}` :'/user/login-connect/GMAIL';

    let oRequestBody = {
        action: 'callFunction',
        function: 'getData',
        parameters: [connectWithGoogleUrl]
    };
    sendMessageToBackgroundPromise(oRequestBody).then(res => {
        enableButton('activate_plugin');
        if (res.error) return onError(res);
        window.addEventListener('message', getDataToken, false);

        var w = (screen.width)*0.30;
        var h = (screen.height)*0.75;

        var left = (screen.width/2)-(w/2);
        var top = (screen.height/2)-(h/2);

        window.open(res.connect_url, "activatePlugIn", 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width='+w+', height='+h+', top='+top+', left='+left);
        modalView.close();
    });
}

/*******************************TOOL BAR  DB CALLS  ****************** */

function updatePrefInDB(initPrefValue, emptyField, prefContanier) {
    let prefWithValues = ['U_DEFAULT_ESCH_TIME', 'U_DEFAULT_ESCH_TIMEZONE'];
    let prefToChange = userPreferencesMapping(initPrefValue);
    isUserPreferencesLatest = false;
    let newPrefValue;
    let { preferences } = userPreferencesRes;
    if (!preferences) preferences = getDefaultPreferences();
    if (prefWithValues.includes(prefToChange)) {
        if (emptyField) {
            defaultSchTimeAndTimezone = {};
        }
        newPrefValue = defaultSchTimeAndTimezone[initPrefValue] || '';
    } else {
        newPrefValue = preferences[prefToChange] === '0' ? '1' : '0';
    }
    let opts = {
        setting: prefToChange,
        value: newPrefValue
    };
    let { auth_token } = getUserInfoFromLocal();
    let data = {
        opts,
        auth_token
    };
    let updatePrefUrl = '/me/update-preference';
    let oRequestBody = {
        action: 'callFunction',
        function: 'postData',
        parameters: [updatePrefUrl, data]
    };
    sendMessageToBackgroundPromise(oRequestBody).then(res => {
        if (res.error) {
            prefContanier && prefContanier.classList && prefContanier.classList.remove('prefChangeDisabled');
            const prefCheckBox = prefContanier && prefContanier.querySelector('input');
            prefCheckBox && (prefCheckBox.disabled = false);
            return onError(res);
        }
        getUserPreferences().then(() => {
            prefContanier && prefContanier.classList && prefContanier.classList.remove('prefChangeDisabled');
            const prefCheckBox = prefContanier && prefContanier.querySelector('input');
            prefCheckBox && (prefCheckBox.disabled = false);
        });
    });
}

/**************************** COMPOSE BOX DB CALLS  *********************/

function createEmailToAddPixel(opts) {
    if (finalTemplateID){
        opts.template = finalTemplateID;
        opts.template_icon = template_icon;
    }
    let composeBox = event && event.target && event.target.closest('.inboxsdk__compose');
    let composeBoxUniqueID = composeBox && composeBox.id;
    let composeView = composeViews[composeBoxUniqueID];
    if (composeView && composeView.snippetsUsedCount) {
        opts.num_snippet_used = composeView.snippetsUsedCount;
    }
    let { auth_token } = getUserInfoFromLocal();
    let createEmailUrl = '/emails/create';
    let data = {
        opts,
        auth_token
    };
    let oRequestBody = {
        action: 'callFunction',
        function: 'postData',
        parameters: [createEmailUrl, data]
    };
    return sendMessageToBackgroundPromise(oRequestBody);
}

function emailDraftToSent(emailID, messageID) {
    let opts = {
        progress: '1',
        sent_message_id: messageID
    };
    let { auth_token } = getUserInfoFromLocal();
    let url = '/emails/' + emailID + '/update-status';
    let data = {
        opts,
        auth_token
    };
    let oRequestBody = {
        action: 'callFunction',
        function: 'postData',
        parameters: [url, data]
    };
    return sendMessageToBackgroundPromise(oRequestBody);
}

function fetchScheduledInfoForMail(emailID) {
    let { auth_token } = getUserInfoFromLocal();
    let getScheduleInfoUrl = '/emails/email-draft/';
    let url = getScheduleInfoUrl + emailID;
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

function updateEmailData(opts) {
    let { auth_token } = getUserInfoFromLocal();
    let url = '/emails/' + opts.emailID + '/update';
    let data = {
        opts,
        auth_token
    };
    let oRequestBody = {
        action: 'callFunction',
        function: 'postData',
        parameters: [url, data]
    };
    return sendMessageToBackgroundPromise(oRequestBody);
}

function deleteEmail(id) {
    let { auth_token } = getUserInfoFromLocal();
    let url = '/emails/' + id + '/delete';
    let data = {
        auth_token
    };
    let oRequestBody = {
        action: 'callFunction',
        function: 'deleteData',
        parameters: [url, data]
    };
    return sendMessageToBackgroundPromise(oRequestBody);
}

function setSnoozeEmail(emailID) {
    let { auth_token } = getUserInfoFromLocal();
    let url = '/emails/' + emailID + '/snooze';
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

function getDocumentLinkWhenEmailNotTracked(opts) {
    let { auth_token } = getUserInfoFromLocal();
    let url = '/emails/generate_doc_link_track_off';
    let data = {
        opts,
        auth_token
    };
    let oRequestBody = {
        action: 'callFunction',
        function: 'postData',
        parameters: [url, data]
    };
    return sendMessageToBackgroundPromise(oRequestBody);
}

function addTemplateToDB(opts) {
    let { auth_token } = getUserInfoFromLocal();
    let url = '/templates/create';
    let data = {
        opts,
        auth_token
    };
    let oRequestBody = {
        action: 'callFunction',
        function: 'postData',
        parameters: [url, data]
    };
    return sendMessageToBackgroundPromise(oRequestBody);
}

function updateTemplateToDB(opts, templateId) {
    let { auth_token } = getUserInfoFromLocal();
    let url = '/templates/' + templateId + '/update';
    let data = {
        opts,
        auth_token
    };
    let oRequestBody = {
        action: 'callFunction',
        function: 'postData',
        parameters: [url, data]
    };
    return sendMessageToBackgroundPromise(oRequestBody);
}

function getSequenceTemplateList() {
    let auth_token = getUserInfoFromLocal() && getUserInfoFromLocal().auth_token;
    if (!auth_token) return;
    let data = {
        auth_token
    };
    let fetchSequenceTempUrl = '/list/all-sequence-templates';
    let oRequestBody = {
        action: 'callFunction',
        function: 'getData',
        parameters: [fetchSequenceTempUrl, data]
    };
    return sendMessageToBackgroundPromise(oRequestBody);
}
/******************************* FETCH ON INIT DB CALLS  ******************************** */

function getUserFeeds() {
    let auth_token = getUserInfoFromLocal() && getUserInfoFromLocal().auth_token;
    if (!auth_token) return;
    let data = {
        auth_token
    };
    let fetchFeedUrl = '/me/feed?per_page=50&page=1&action_group=ALL&action=ALL';
    let oRequestBody = {
        action: 'callFunction',
        function: 'getData',
        parameters: [fetchFeedUrl, data]
    };
    return sendMessageToBackgroundPromise(oRequestBody);
}

function gotUserFeeds() {
    return new Promise((resolve, reject) => {
        if (allFeeds) {
            resolve();
        } else {
            getUserFeeds().then(res => {
                if (res.error && auth_token) return onError(res);
                allFeeds = res;
                resolve();
            });
        }
    });
}

function getUserPreferences() {
    let auth_token = getUserInfoFromLocal() && getUserInfoFromLocal().auth_token;
    if (!auth_token) return;
    let data = {
        auth_token
    };
    let fetchPreferenceUrl = '/me';
    let oRequestBody = {
        action: 'callFunction',
        function: 'getData',
        parameters: [fetchPreferenceUrl, data]
    };
    return new Promise((resolve, reject) => {
        sendMessageToBackgroundPromise(oRequestBody).then(res => {
            resolve(res);
            if (auth_token) {
                ReadReceiptUtils.createReadReceiptsLabels()
                    .then(result => console.log(result), error => console.log(error))
                    .catch(error => console.log(error));
                getSnippetTemplatesMapping();
            }
            if (res.error && auth_token) return onError(res);
            //Clean Local Storage when no error occured in case of Inactive accounts
            cleanLocalForInactiveUserInfo();
            localStorage.setItem('scheduledDrafts', JSON.stringify(_.pluck(res.draft, 'sent_message_id')));
            userPreferencesRes = res;
            showInsertTemplateIcon = userPreferencesRes.preferences.CHROME_TEMPLATE_ICON == '1' ? true : false;
            hideDocument = userPreferencesRes.preferences.DOC_DISABLED;
            // Set Paused state for subscription
            HAS_PAUSED_SUBSCRIPTION = userPreferencesRes.has_paused;
            CURRENT_PRICING_PLAN_CODE = userPreferencesRes.plan_code || CURRENT_PRICING_PLAN_CODE;

            let presenceOfScheduleDefaultTimezone = checkPresenceOfPropertyInObject(
                userPreferencesRes.preferences,
                'U_DEFAULT_ESCH_TIMEZONE'
            );
            if (presenceOfScheduleDefaultTimezone) {
                userPreferencesRes.preferences.U_DEFAULT_ESCH_TIMEZONE = checkAndGetCorrectTz(
                    userPreferencesRes.preferences.U_DEFAULT_ESCH_TIMEZONE
                );
            }
            DD_LOGS.addLoggerGlobalContext('USER_ID', userPreferencesRes.id);
            isUserPreferencesLatest = true;
            preferencesChanged = false;
            let objToBackground = {
                userID: userPreferencesRes.id,
                userEmail: userPreferencesRes.email,
                startTeamActivityBlock: userPreferencesRes.preferences && userPreferencesRes.preferences.TRACKING_FOR_MY_TEAM !== '1',
                team_open_block_members: userPreferencesRes.preferences && userPreferencesRes.preferences.TRACKING_FOR_TEAM_USERS
            };
            sendMessageToBackground(objToBackground);
            chrome.storage.sync.get(['showLocalNotification'], function(items) {
                showLocalNotification = items.showLocalNotification || [];
                let userSpecificLocalNotData = showLocalNotification.find(notLocal => notLocal.userID == res.id);
                if (!userSpecificLocalNotData) {
                    showLocalNotification.push({
                        showNotLocal: true,
                        userID: res.id
                    });
                    chrome.storage.sync.set({
                        showLocalNotification: showLocalNotification
                    });
                }
                userSpecificLocalNotData = showLocalNotification.find(notLocal => notLocal.userID == res.id);
                if (userSpecificLocalNotData.showNotLocal) {
                    sendMessageToBackground({
                        userID: res.id,
                        startNotify: true,
                        shref: userPreferencesRes.shref
                    });
                } else {
                    sendMessageToBackground({
                        userID: res.id,
                        startNotify: false,
                        shref: userPreferencesRes.shref
                    });
                }
            });
        });
    });
}

function getTimezoneData() {
    let auth_token = getUserInfoFromLocal() && getUserInfoFromLocal().auth_token;
    if (!auth_token) return;
    let data = {
        auth_token
    };
    let fetchTimezonesUrl = '/list/timezone-by-name';
    let savedData = localStorage.getItem('TimezoneData');
    if (savedData) {
        try {
            savedData = JSON.parse(savedData);
            if (
                savedData.moment &&
                moment.duration(end.diff(moment(savedData.moment, 'YYYY-MM-DD HH:mm'))).asHours() < 72 &&
                savedData.arrTimeZones &&
                savedData.arrTimeZones.length
            ) {
                processTimezoneData(savedData.arrTimeZones);
            }
        } catch (e) {
            console.log(e);
        }
    }
    let oRequestBody = {
        action: 'callFunction',
        function: 'getData',
        parameters: [fetchTimezonesUrl, data]
    };
    sendMessageToBackgroundPromise(oRequestBody).then(res => {
        if (res.error && auth_token) return onError(res);
        //Clean Local Storage when no error occured in case of Inactive accounts
        let oDataToSave = {
            timeStamp: moment().format('YYYY-MM-DD HH:mm'),
            arrTimeZones: res
        };
        localStorage.setItem('TimezoneData', JSON.stringify(oDataToSave));
        processTimezoneData(res);
    });
}

//#endregion

/*********************************************************************************** */
/*                       DB CALLS FUNCTIONS ENDS                                     */
/*********************************************************************************** */
/***************************Pure helper function************************ */
//#region

function getDefaultPreferences() {
    return {
        U_TRACK_EMAILS: '0',
        U_TRACK_CLICKS: '0',
        U_POWERED_BY_SH: '0',
        U_SNOOZE_NOTIFICATIONS: '0',
        U_TIMEZONE: checkAndGetCorrectTz(),
        U_CC: '',
        U_BCC: '',
        U_SIGNATURE: '',
        U_AUTO_FILL_BCC: '1',
        chromeTemplateIcon: '1',
    };
}

function changeToString(listOfEmails) {
    return listOfEmails.map(l => _.omit(l, 'name').emailAddress);
}

function userPreferencesMapping(prefToChange) {
    let prefMapping = {
        toggle_isPoweredBy: 'U_POWERED_BY_SH',
        toggle_isShowAll: 'U_SNOOZE_NOTIFICATIONS',
        toggle_isAlwaysTrackEmail: 'U_TRACK_EMAILS',
        toggle_isAlwaysTrackLink: 'U_TRACK_CLICKS',
        toggle_isAutoFillBCC: 'U_AUTO_FILL_BCC',
        toggle_isTeamTrackingOn: 'TRACKING_FOR_MY_TEAM',
        toggle_isDoubleTickOff: 'U_READ_RECEIPTS_OFF',
        selectedTimeZone: 'U_DEFAULT_ESCH_TIMEZONE',
        defaultTimeForSch: 'U_DEFAULT_ESCH_TIME',
        defaultTimezoneForSch: 'U_DEFAULT_ESCH_TIMEZONE',
        chromeTemplateIcon: 'CHROME_TEMPLATE_ICON',
    };

    return prefMapping[prefToChange];
}

/**
 * Check if the error code is for blacklisted error.
 *
 * @param {int} errorCode Error code.
 *
 * @returns {boolean} True if the code isfor blacklisted error, false otherwise.
 */
function isBlacklistedErrorCode(errorCode) {
    return errorCode === EMAIL_BLACKLISTED_ERROR_CODE;
}

/**
 * Check if the current user email is blacklisted.
 *
 * @returns {boolean} True if the email is blacklisted, false otherwise.
 */
function isEmailBlacklisted() {
    const userInfo = getUserInfoFromLocal();
    return !!userInfo && userInfo.isBlacklisted;
}

/**
 * Get blacklisted error object.
 *
 * @returns {object} Blacklisted error object.
 */
function getBlacklistedError() {
    return getUserInfoFromLocal().blacklistedError;
}

//#endregion
/********************************************************************************** */

/******************************************************************************* */
/*                      ERROR DISPLAY FUNCTIONS STARTS                           */
/******************************************************************************* */
//#region
function onError(error, composeView) {
    if (!sdkMain) {
        setTimeout(onError, 2000, error);
    } else {
        if (AUTH_ERROR_CODE.includes(error.error_code)) return clearUserInfoFromLocal();
        let { shownInActiveErrorOnce } = getUserInfoFromLocal();
        if (shownInActiveErrorOnce && !error.showErrorWithSudo) return;
        let mainDiv = getNewElement();
        mainDiv.innerText = error.error_message;
        title = error.error_code ? 'Field Required' : 'Info';
        if (error.error_code === 'CHR_1001') title = 'Upgrade Plan';
        if (error.error_code === 2401) {
            mainDiv.innerText = '';
            mainDiv.innerHTML = `Your Gmail account is not connected with Saleshandy.<br> To use features, connect your mail account(s)</a>`;
        } else if (error.error_code === 2242) {
            mainDiv.innerText = '';
            mainDiv.innerHTML = error.error_message;
        } else if (error.error_code === 'NO_RECIPIENT_SCHEDULE') {
            title = 'Error';
        } else if (error.error_code === 1016) {
            title = 'Error';
        } else if (isBlacklistedErrorCode(error.error_code)) {
            title = error.title || 'Error';
        } else if(error.error_code === PAUSED_SUBSCRIPTION_ERR_CODE){
            title = 'Resume Subscription';
        } else if (error.error_code === '524') {
            return;
        }

        let modalOptions = {
            title: title,
            el: mainDiv,
            buttons: getErrorButtons(error, composeView)
        };
        SHModalViewGlobal = sdkMain.Widgets.showModalView(modalOptions);

        if (usingNewGmail) {
            let errorModalContainer = SHModalViewGlobal._modalViewDriver._modalContainerElement;
            let modalBtnContainer = errorModalContainer.querySelector('.inboxsdk__modal_buttons');
            let closeBtnContainer = errorModalContainer.querySelector('.inboxsdk__modal_close');
            const modalTopRow = errorModalContainer.querySelector('.inboxsdk__modal_toprow');
            let modalContentContainer = errorModalContainer.querySelector('.inboxsdk__modal_content');
            let modalContainer = errorModalContainer.querySelector('.inboxsdk__modal_container');

            modalTopRow.classList.add('ErrorHead');
            modalBtnContainer.classList.add('ErrorBtnContainer');
            closeBtnContainer.classList.add('ErrorCloseBtnContainer');
            modalContentContainer.classList.add('ErrorMainContentContainer');
            modalContainer.classList.add('ErrorMainContainer');
            closeBtnContainer.setAttribute('data-tooltip', 'Close');

            modalBtnContainer.style.setProperty('display', 'block', 'important');
            modalTopRow.style.setProperty('margin-top', '16px');

            [...modalBtnContainer.children].forEach(child => {
                child.style.setProperty('margin-left', '0', 'important');
                child.style.setProperty('background', '#005ebf', 'important');
                child.style.setProperty('color', 'white', 'important');
            });

            if (error.error_code === 2242 || error.error_code === 2401 || error.error_code === 2904) {
                [...modalBtnContainer.children].forEach(child => {
                    child.style.setProperty('margin-left', '0', 'important');
                    child.style.setProperty('margin-right', '10px', 'important');
                    child.style.setProperty('background', '#005ebf', 'important');
                    child.style.setProperty('color', 'white', 'important');
                    child.style.setProperty('border', '1px solid grey', 'important');
                });
            }
        }

        if (ACC_NOT_WORKING_CODE.includes(error.error_code)) setupForInactiveDeletedAccounts(error);
    }
}

function showPricingPopUp(sCustomErrorMessage, error = { error_code: 'CHR_1001' }) {
    if (sCustomErrorMessage) {
        error.error_message = sCustomErrorMessage;
        return onError(error);
    } else {
        showcrossPlatformPricing();
    }
}

function showcrossPlatformPricing() {
    renderCrossPlatformModal('pricing');
}

function getErrorButtons(error, composeView) {
    let errorBtns = [
        {
            text: baseErrorBtnCaption,
            orderHint: 1,
            onClick: e => SHModalViewGlobal.close()
        }
    ];
    if (error.error_code === 'CHR_1001') {
        return (errorBtns = [
            {
                text: 'Upgrade Plan',
                onClick: e => {
                    window.open(`${mainApplication}billing/information?source=CHROME`, '_blank');
                    SHModalViewGlobal.close();
                }
            }
        ]);
    }
    if (error.error_code === PAUSED_SUBSCRIPTION_ERR_CODE) {
        return (errorBtns = [
            {
                text: 'Resume Subscription',
                onClick: e => {
                    window.open(`${mainApplication}/billing/information`, '_blank');
                    SHModalViewGlobal.close();
                }
            }
        ]);
    }
    // 2242 - Not able to create More Template
    if (error.error_code === 2242) {
        return (errorBtns = [
            {
                text: 'Upgrade Plan',
                onClick: e => {
                    window.open(`${mainApplication}billing/information?source=CHROME`, '_blank');
                    SHModalViewGlobal.close();
                    addTemplateModalView.close();
                }
            }
        ]);
    }
    // 2401 - Account Not connected to Saleshandy
    if (error.error_code === 2401 && !composeView.isMailAScheduledEmail) {
        return (errorBtns = [
            {
                text: 'Send anyway',
                orderHint: 1,
                onClick: e => {
                    composeView.sendingWhenAccountNotConnected = true;
                    shouldWeArchive
                        ? composeView.send({
                              sendAndArchive: true
                          })
                        : composeView.send();
                    SHModalViewGlobal.close();
                }
            },
            {
                text: 'Connect to Saleshandy',
                orderHint: 2,
                onClick: e => {
                    window.open(`${mainApplication}mail-accounts`, '_blank');
                    SHModalViewGlobal.close();
                }
            }
        ]);
    }
    if (error.error_code === 2904) {
        return (errorBtns = [
            {
                text: 'Send without tracking',
                orderHint: 2,
                type: 'SECONDARY_ACTION',
                onClick: e => {
                    composeView.toggleLocalEmailTrack(undefined, true);
                    composeView.initLocalEmailOptionSetup = false;
                    SHModalViewGlobal.close();
                }
            },
            {
                text: 'Remove contacts',
                orderHint: 1,
                type: 'PRIMARY_ACTION',
                onClick: e => {
                    deleteExtraRecipients(composeView);
                    SHModalViewGlobal.close();
                }
            }
        ]);
    }
    if (error.error_code === 1016) {
        resetPluginForAccount(false);
        let errorBtns = [
            {
                text: 'Create now',
                orderHint: 1,
                onClick: e => {
                    SHModalViewGlobal.close();
                    showWelcomeMessage(true);
                }
            }
        ];
        return errorBtns;
    }
    return errorBtns;
}

//#endregion
/******************************************************************************* */
/*                      ERROR DISPLAY FUNCTIONS ENDS                             */
/******************************************************************************* */
function getNewElement() {
    return document.createElement('div');
}

function getUserInfoFromLocal(providedUserEmail) {
    let userEmailToUse = providedUserEmail ? providedUserEmail : currentUserEmail;
    let mainUserInfoObj = JSON.parse(window.localStorage.getItem('mainUserInfoObj'));
    if (!userEmailToUse || !mainUserInfoObj) return;
    return mainUserInfoObj[btoa(userEmailToUse)];
}

function sendMessageToBackground(data) {
    if(typeof chrome.app.isInstalled !=='undefined'){
        chrome.runtime.sendMessage(
            {
                type: 'getUrls',
                data
            },
            function(response) {
                if (!chrome.runtime.lastError) {
                }
            }
        );
    }
}

function getDocumentID(url, from) {
    let splittedUrl = url.split('/');
    let lastValue = splittedUrl[splittedUrl.length - 1];
    let lastIndex =
        lastValue == 'download' ? url.indexOf(splittedUrl[splittedUrl.length - 2]) : url.indexOf(splittedUrl[splittedUrl.length - 1]);
    return url.substring(lastIndex);
}

function assignUniqueIdToComposeWindow(composeBoxID) {
    let list = document.querySelectorAll('.inboxsdk__compose');
    [...list].forEach(l => {
        if (!l.sh_compose_id) l.sh_compose_id = composeBoxID;
    });
}

function clearPreviousEmailValues() {
    //popOutBySH = false;
    previousResult = undefined;
    previousLocalNot = undefined;
    seqAttachedWithReplyAndForwardSchedule = undefined;
}

function clearUserInfoFromLocal() {
    let mainUserInfoObj = JSON.parse(window.localStorage.getItem('mainUserInfoObj'));
    delete mainUserInfoObj[btoa(currentUserEmail)];
    localStorage.setItem('mainUserInfoObj', JSON.stringify(mainUserInfoObj));
    let feedsBtn = document.querySelector('.sh_feeds_button');
    feedsBtn = feedsBtn && feedsBtn.parentElement.parentElement;
    if (feedsBtn) feedsBtn.style.display = 'none';
    authenticateUser();
}

function isTimeElaspsed(schMoment) {
    let secondsGoneUp = moment().diff(schMoment, 'seconds');
    return secondsGoneUp > 0 ? true : false;
}

function setupForInactiveDeletedAccounts(error) {
    let feedsBtn = document.querySelector('.sh_feeds_button');
    if (feedsBtn) {
        feedsBtn.parentElement.parentElement.style.display = 'none';
    }

    let activateIconMainButton = document.querySelector('.sh_toolbar_pref_button');
    activateIconMainButton.innerHTML = 'Activate Saleshandy';
    let activateIconWrapper = activateIconMainButton.parentElement.parentElement;
    activateIconWrapper.setAttribute('data-tooltip', 'Activate');
    attachStyleToInputBtn(activateIconWrapper);

    let mainUserInfoObj = JSON.parse(localStorage.getItem('mainUserInfoObj')) || {};
    let userInfoObj = getUserInfoFromLocal();
    _.extend(userInfoObj, {
        disableWelcomeModal: true,
        isPluginActivated: false,
        shownInActiveErrorOnce: true,
        error
    });
    mainUserInfoObj[btoa(currentUserEmail)] = userInfoObj;
    localStorage.setItem('mainUserInfoObj', JSON.stringify(mainUserInfoObj));
}

function cleanLocalForInactiveUserInfo() {
    let mainUserInfoObj = JSON.parse(localStorage.getItem('mainUserInfoObj')) || {};
    let userInfoObj = getUserInfoFromLocal();
    if (userInfoObj.error) {
        delete userInfoObj.error;
        delete userInfoObj.shownInActiveErrorOnce;
        _.extend(userInfoObj, {
            disableWelcomeModal: false
        });

        mainUserInfoObj[btoa(currentUserEmail)] = userInfoObj;
        localStorage.setItem('mainUserInfoObj', JSON.stringify(mainUserInfoObj));
        showWelcomeMessage();
    }
}

function attachStyleToInputBtn(btn) {
    btn.style.padding = '2px';
    btn.style.borderRadius = '2px';
    btn.style.border = '1px solid #9a9191';
    btn.style.background = 'white';
    if (usingNewGmail) {
        btn.style.setProperty('margin-right', '0px', 'important');
    }
}

function setupTabMonitoring() {
    document.addEventListener('visibilitychange', handleVisibilityChange, false);
    window.addEventListener('focus', handleVisibilityChange, false);
    window.addEventListener('mouseover', handleVisibilityChange, false);
}

function addScheduleDropup(composeView) {
    let composeBoxDiv = composeView.getElement();
    let newDiv = getNewElement();
    newDiv.innerHTML = schedule_dropup_content;
    composeBoxDiv.append(newDiv);
}

function handleVisibilityChange(changeUserRequest) {
    if (document.hidden) return;
    if (event.target.id == 'link_undo') {
        if (!undoListnerAdded) {
            document.querySelector('body').addEventListener(
                'click',
                function(event) {
                    if (event.target.id === 'link_undo') {
                        executeWhenEmailUndoClicked && executeWhenEmailUndoClicked();
                    }
                },
                {
                    capture: true
                }
            );
            undoListnerAdded = true;
        }
    }
    let userInfoObj = getUserInfoFromLocal() || {};
    let isPluginActivated = Boolean(userInfoObj.isPluginActivated);

    if (!isPluginActivated) {
        sendMessageToBackground({
            userID: undefined,
            shref: undefined
        });
        return;
    }
    sendMessageToBackground({
        userID: userPreferencesRes.id,
        shref: userPreferencesRes.shref
    });
}

/****************Helper Functions ******************* */
function attachMouseOverToSendButtons() {
    let sendingBtns = document.querySelectorAll('[data-tooltip^="Send"]');
    [...sendingBtns].forEach(btn => {
        if (btn.innerText === 'Send') {
            btn.addEventListener('mouseover', captureSendBtnClick);
            btn.addEventListener('focus', captureSendBtnClick);
        }
        if (btn.innerText === 'Send +') {
            btn.addEventListener('mouseover', captureArchiveBtnClick);
            btn.addEventListener('focus', captureArchiveBtnClick);
        }
    });
}

function removeMouseOverToSendButtons() {
    let sendingBtns = document.querySelectorAll('[data-tooltip^="Send"]');
    [...sendingBtns].forEach(btn => {
        if (btn.innerText === 'Send') {
            btn.removeEventListener('mouseover', captureSendBtnClick);
            btn.removeEventListener('focus', captureSendBtnClick);
        }
        if (btn.innerText === 'Send +') {
            btn.removeEventListener('mouseover', captureArchiveBtnClick);
            btn.removeEventListener('focus', captureArchiveBtnClick);
        }
    });
}

function captureArchiveBtnClick(event) {
    shouldWeArchive = true;
}

function captureSendBtnClick(event) {
    shouldWeArchive = false;
}

function getUserPreferencesViaPromise() {
    return new Promise((resolve, reject) => {
        let intervalID = setInterval(() => {
            if (!_.isEmpty(userPreferencesRes)) {
                clearInterval(intervalID);
                resolve(userPreferencesRes);
            }
        }, 1000);
    });
}
