/**
 * ----------------------------
 * - shapp.js
 * ----------------------------
 *
 * This file contains all communication related to SalesHandy API calls.
 */

// Global Configurations
const crossPlatformEndPts = {
    QA: 'https://qaapi3.cultofpassion.com',
    NET: 'https://platform2.saleshandy.com',
    COM: 'https://platform.saleshandy.com',
    LEARNER: 'https://platform.lifeisgoodforlearner.com',
    DOER: 'https://platform.lifeisgoodfordoer.com',
    RISE_BY_LEARNING: 'https://platform.risebylearning.com',
    RISE_BY_HELPING: 'https://platform.risebyhelping.com',
    RISE_BY_HUSTLING: 'https://platform.risebyhustling.com'
};

const authApiEndPts = {
    QA: 'https://devapi3.cultofpassion.com',
    NET: 'https://auth2.saleshandy.com',
    COM: 'https://auth.saleshandy.com',
    LEARNER: 'https://auth.lifeisgoodforlearner.com',
    DOER: 'https://auth.lifeisgoodfordoer.com',
    RISE_BY_LEARNING: 'https://auth.risebylearning.com',
    RISE_BY_HELPING: 'https://auth.risebyhelping.com',
    RISE_BY_HUSTLING: 'https://auth.risebyhustling.com'
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

const FEATURE_FLAGS = {
    POWERED_BY_SIGNATURE: false
};

const ERROR_MESSAGES = {
    ERR_USE_SEQUENCE_DENIED: 'Unable to attach email sequence in this email.\n Please upgrade plan to use this feature.'
};

const ACTIVITY_TYPES = {
    OPEN: 5,
    CLICK: 7
};

let CURRENT_PRICING_PLAN_CODE = 'FREE';
let HAS_PAUSED_SUBSCRIPTION = false;
let PAUSED_SUBSCRIPTION_ERR_CODE = 'paused_subscription_error'
let PAUSED_SUBSCRIPTION_POPUP_MSG = 'Once you resume your subscription, you can start using email campaigns and other premium features.';

const WELCOME_SUBJECT = 'Test - SalesHandy Email Tracking';
const WELCOME_BODY = `Hi,
    <br><br>
    Send this test email to get an open notification when the recipient reads it.
    <br><br>
    Thanks.
    <br><br>
    PS: Please ensure that you do not open the email from the registered email address with SalesHandy to test, as our system excludes self-open notification.`;

const REG_URL = /([a-z]*[\-]*[\=]+\'*\")*([blob\:])*(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/|www\.)+[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{1,5}(:[0-9]{1,5})*([\/]*([a-z])*([A-Z])*([0-9])*[\?]*[\_]*[\-]*[\%]*[\&]*[\@]*[\^]*[\;]*[\:]*[\=]*[\.]*(\<wbr>)*(\#)*)*/gi;
const URL_MATHCER = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g;
const AUTH_ERROR_CODE = [1006, 1011, 1026];
const ACC_NOT_WORKING_CODE = [1015, 1016, 1017, 1018];
const EMAIL_BLACKLISTED_ERROR_CODE = 3102;
const CURRENT_CHROME_VERSION = chrome.runtime.getManifest().version;

const GMAIL_NodeSelectors = {
    ThreadViewMessageCollapsed: '.adf',
    ThreadViewMessageExpanded: '.adn',
    ThreadViewMessageAll: '.ads',
    ThreadViewStarIcon: '.zd',
    ThreadViewSenderDetails: ".gD[email], .fX[email], .yW span[email][name='me'], .rw span[email][name='me']",
    ThreadViewSubject: 'h2.hP'
};

const SH_APP_ID = 'sdk_DEVSH20171002_3d99a059b1';
const INVALID_DATE = 'Invalid Date';
const COLORS = {
    SH_BLUE: '#1B589D',
    SH_BLUE_GMAIL: '#005EBF',
    SH_GREY: '#969090',
    SH_LIGHT_GREEN: '#C4EFB0',
    SH_DARK_GREEN_1: '#4CAF50',
    SH_GRAY_GMAIL: '#737373',
    SH_DARK_GRAY_GMAIL: '#171717'
};

const EMAIL_READ_STATUS = {
    _NOT_TRACKED: 0,
    _SENT_UNREAD: 1,
    _READ: 2,
    _NOT_DELIVERED: 3
};

const MOUSE_ACTION = {
    OVER: 1,
    OUT: 2,
    CLICK: 3,
    HOVER: 4
};

const EMAIL_READ_STATUS_ICON_CLASSES = {
    _PAINTED: 'ReadReceiptPainted',
    _NOT_TRACKED: 'NotTracked',
    _SENT_UNREAD: 'NotRead',
    _READ: 'Read',
    _NOT_DELIVERED: 'NotDelivered'
};

const PLATFORM_ICON_CLASESS = {
    windows: 'windowsIcon',
    linux: 'linuxIcon',
    apple: 'macIcon',
    iphone: 'macIcon',
    ubuntu: 'ubuntuIcon',
    android: 'androidIcon'
};

const READ_DETAILS_ELE_CLASSES = {
    _VIEW_ENABLED: 'viewEnable',
    _VIEW_DISABLED: 'viewDisable',
    _VIEW_NOT_DELIVERED: 'viewNotDelivered'
};

const POWERED_BY_BRAND = 'saleshandy_branding';
const GET_DRAFT_ID_FAILED = 'get_draft_id_failed';

allImgExtensions = [
    'ani',
    'bmp',
    'cal',
    'fax',
    'gif',
    'img',
    'jbg',
    'jpe',
    'jpeg',
    'jpg',
    'mac',
    'pbm',
    'pcd',
    'pcx',
    'pct',
    'pgm',
    'png',
    'ppm',
    'psd',
    'ras',
    'tga',
    'tiff',
    'wmf',
    'pptx',
    'pdf',
    'doc'
];

const KEY_NAME_CODE = {
    ENTER: 13,
    BACKSPACE: 8,
    RIGHT_ARROW: 39,
    LEFT_ARROW: 37,
    UP_ARROW: 38,
    DOWN_ARROW: 40,
    TAB: 9,
    DELETE: 46,
    EDIT_e: 69,
    ESCAPE: 27,
    CHAR_C: 67,
    CHAR_S: 83,
    CTRL: 17,
    SPACE: 32,
    SHIFT: 16
};

leaveOutUrlPart = ['saferedirecturl', 'href', '<wbr>', 'src', 'alt', 'sidekick', 'images-1.medium', 'os'];

const HELP_URL = {
    BASE: 'https://help.saleshandy.com/',
    EMAIL_SEQUENCE: 'https://help.saleshandy.com/article/7-how-to-create-individual-email-sequence-template-for-gmail/',
    TEMPLATES: 'https://help.saleshandy.com/article/51-how-can-i-create-a-template'
};
