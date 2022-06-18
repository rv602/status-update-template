function showWelcomeCompose(sdk) {
    let userInfoObj = getUserInfoFromLocal();
    let { auth_token, firstLoadAfterAuth } = userInfoObj || {};
    if (!auth_token || !firstLoadAfterAuth) return;
    let composeView = sdk.Compose.openNewComposeView();
}

function addSubjectAndBody(composeView) {
    composeView.setSubject(WELCOME_SUBJECT);
    composeView.setBodyHTML(WELCOME_BODY);
    setFirstLoadAfterAuthToFalse();
}

function setFirstLoadAfterAuthToFalse() {
    let userInfoObj = getUserInfoFromLocal();
    let mainUserInfoObj = JSON.parse(localStorage.getItem('mainUserInfoObj')) || {};
    userInfoObj.firstLoadAfterAuth = false;
    mainUserInfoObj[btoa(currentUserEmail)] = userInfoObj;
    localStorage.setItem('mainUserInfoObj', JSON.stringify(mainUserInfoObj));
}
