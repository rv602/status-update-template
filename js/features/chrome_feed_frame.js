
let FEEDS_PLATFORM_URLS = {
  QA: 'https://appfeeds.cultofpassion.com',
  NET: 'saleshandy.com',
  COM: 'https://appfeeds.saleshandy.com',
  LEARNER: 'https://appfeeds.lifeisgoodforlearner.com',
  DOER: 'lifeisgoodfordoer.com',
  DEV: 'https://f3659c59.ngrok.io',
  RISE_BY_LEARNING: 'https://appfeeds.risebylearning.com',
  RISE_BY_HELPING: 'https://appfeeds.risebyhelping.com',
  RISE_BY_HUSTLING: 'https://appfeeds.risebyhustling.com',
  PROD: 'https://appfeeds.saleshandy.com'
};

let FeedFrameMessageType = {
  OpenThread: 'openThread',
  AuthError: 'authError',
};

let selectedFeedEndpoint = FEEDS_PLATFORM_URLS[ENVIRONMENT];

shFeedsModal = null;

/**
 * Handles logic to open new Chrome-Feed, Gets invoked when user clicks on Feed Icon. 
 */
function onChromeFeedIconClick() {
  if (shFeedsModal && !shFeedsModal.destroyed) {
    return;    
  }
  let ChromeFeedPopOutBody = getNewElement();
  let title = '';
  let modalOptions = {
    title: title,
    el: ChromeFeedPopOutBody,
  };
  shFeedsModal = sdkMain.Widgets.showModalView(modalOptions);

  let SHModalContainer = shFeedsModal._modalViewDriver._modalContainerElement;
  let modalBtnContainer = SHModalContainer.querySelector('.inboxsdk__modal_buttons');
  let modalTopRow = SHModalContainer.querySelector('.inboxsdk__modal_toprow');
  let modalContentContainer = SHModalContainer.querySelector('.inboxsdk__modal_content');
  let modalContainer = SHModalContainer.querySelector('.inboxsdk__modal_container');
  let closeBtnContainer = SHModalContainer.querySelector('.inboxsdk__modal_close');

  SHModalContainer.classList.add('chrome-feed-fullscreen-container');
  modalContainer.classList.add('chrome-feeds-container');
  modalContentContainer.classList.add('chrome-feeds-modal-container');
  modalTopRow.classList.add('chrome-feed-modal-header');
  modalBtnContainer.classList.add('chrome-feed-modal-footer');
  closeBtnContainer.classList.add('chrome-feed-close-btn');
  closeBtnContainer.setAttribute('data-tooltip', 'Close feeds');

  let { auth_token } = getUserInfoFromLocal();

  let feedIndexUrl = `${selectedFeedEndpoint}/feeds?token=${auth_token}`;
  modalContentContainer.innerHTML = `<iframe class='chrome-feeds-frame' src="${feedIndexUrl}"></iframe>`;
  modalContentContainer.style.visibility = 'hidden';
  SHModalContainer.style.visibility = 'hidden';
  const modalOverlay = document.getElementsByClassName('inboxsdk__modal_overlay');
  if (modalOverlay) {
    modalOverlay[0].style.visibility = 'hidden';
  }

  setTimeout(() => {
    modalOverlay[0].style.visibility = 'visible';
    modalContentContainer.style.visibility = 'visible';
    SHModalContainer.style.visibility = 'visible';
  }, 200);
  modalContainer.classList.add('chrome-feeds-container');
}

/**
 * Closes New chrome feed modal.
 */
function closeFeedWindow() {
  shFeedsModal.close();
  shFeedsModal = null;
}

// Feed message Handler
function messageListenerFeed(event) {
  // Handle recieved message {msgType: string, data: {messageId, threadId}}
  if (event.origin === selectedFeedEndpoint) {
    switch (event.data.msgType) {
      case FeedFrameMessageType.OpenThread:
        closeFeedWindow();
  
        // TODO: Add logger
        sdkMain.Router.goto('inbox/:threadID', { threadID: event.data.data.threadId }).then(() => {
        }).catch(error=> console.log('error'));
        break;
      case FeedFrameMessageType.AuthError:
          closeFeedWindow();
  
        break;
  
      default:
        break;
    }
  }

};
