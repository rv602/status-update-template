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

let ENVIRONMENT = 'COM';
let crossPlatformURL = PLATFORM_URLS[ENVIRONMENT];

let addInSrc = window.location.search.substring(1);
let mainFrame = document.getElementById('main_frame');
mainFrame.src = `${crossPlatformURL}/${addInSrc}`;
