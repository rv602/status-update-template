const ENVIRONMENT = 'COM';
const DATADOG_CLIENT_TOKENS = {
    COM: 'pubbf73754e825bd355293699ac3e382de4',
    QA: 'pub97592197f9baa6f5bd23462ef2044582',
    NET: 'pub97592197f9baa6f5bd23462ef2044582',
    LEARNER: 'pub97592197f9baa6f5bd23462ef2044582',
    DOER: 'pub97592197f9baa6f5bd23462ef2044582',
    RISE_BY_LEARNING: 'pub97592197f9baa6f5bd23462ef2044582',
    RISE_BY_HELPING: 'pub97592197f9baa6f5bd23462ef2044582',
    RISE_BY_HUSTLING: 'pub97592197f9baa6f5bd23462ef2044582'
};

DD_LOGS.init({
    clientToken: DATADOG_CLIENT_TOKENS[ENVIRONMENT],
    forwardErrorsToLogs: true
});
manifestData = chrome.runtime.getManifest();

DD_LOGS.addLoggerGlobalContext('SOURCE_TYPE', 'CHROME_PLUGIN');
DD_LOGS.addLoggerGlobalContext('EXTENSION_VERSION', manifestData.version);
