var freeUserPopup = `
  <div style="position: relative;margin-top: -0.5em;">
    <span id="bfcmclose" style="cursor: pointer; float: right;margin-right: 1.8em;">
      <i style="position:absolute; color: white;" class="material-icons">close</i>
    </span>
  </div>
  <div>
  <a href="https://app.saleshandy.com/billing/information?source=bfcm2018">
    <img src="<%= imageToShow %>">
  </a>
  </div>
`;

const WAIT_FOR_HOURS = 48;
let uniqIdForBfCm = '';

function _shouldShowBFPopUpStatus(res) {
    const acceptablePlans = ['Enterprise Monthly', 'Regular Monthly', 'Plus Monthly'];
    let { is_paid: isPaid, current_plan: currentPlan, is_eligible_for_bf_cm: isEligibleForBfcm, id } = res;
    uniqIdForBfCm = id;
    if (!isWaitHoursOver()) return { showPopup: false };
    if (!isPaid) return { showFreeUser: true, showPopup: true };
    if (isEligibleForBfcm && acceptablePlans.includes(currentPlan)) return { showFreeUser: false, showPopup: true };

    return { showPopup: false };
}

function isWaitHoursOver() {
    let lastTimePopupShowed = getTimeForUser();
    if (isTwentySixNovPassed()) return false;
    if (!lastTimePopupShowed) {
        saveTimeForUser();
        return true;
    } else {
        // Check WAIT_FOR_HOURS hour are over
        let hourPassed = checkHourPassed(lastTimePopupShowed);
        return hourPassed >= WAIT_FOR_HOURS ? true : false;
    }
}

function checkHourPassed(lastTimePopupShowed) {
    let timeFromLocalStorage = moment(new Date(lastTimePopupShowed));
    return moment(new Date()).diff(timeFromLocalStorage, 'hours');
}

function isTwentySixNovPassed() {
    let currentDate = moment().format('YYYY-MM-DD');
    if (moment(currentDate).isSameOrAfter('2018-11-27', 'day')) return true;
}

function saveTimeForUser() {
    localStorage.setItem(uniqIdForBfCm, new Date());
}

function getTimeForUser() {
    return localStorage.getItem(uniqIdForBfCm);
}
