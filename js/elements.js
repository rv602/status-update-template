/**
 * ----------------------------
 * - elements.js
 * ----------------------------
 *
 * This file contains all HTML elements which needs to be integrated in extension.
 */
let campaignSvgIcon = `
  <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
    width="40px" height="40px" viewBox="0 0 40 40" enable-background="new 0 0 40 40" xml:space="preserve">
    <g>
      <path d="M36.117,4.133H10.129c-1.795,0-3.232,1.454-3.232,3.246L6.881,26.871c0,1.798,1.453,3.252,3.248,3.252h25.988
        c1.797,0,3.25-1.454,3.25-3.252V7.379C39.367,5.587,37.914,4.133,36.117,4.133z M36.117,10.629l-12.994,8.123l-12.994-8.123v-3.25
        l12.994,8.124l12.994-8.124V10.629z"/>
      <path d="M3.883,9.879h0.391v3.495v3.25v12.353c0,1.797,1.455,3.25,3.248,3.25h25.594v0.396c0,1.794-1.451,3.244-3.25,3.244H3.883
        c-1.797,0-3.25-1.45-3.25-3.244V13.128C0.633,11.335,2.086,9.879,3.883,9.879z"/>
    </g>
  </svg>
`;

let templatesSvgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" height="17" width="17"  fill="#737373" viewBox="0 0 26 26"><defs><style>.a{fill:none;}</style></defs><g transform="translate(-46 36)"><path d="M58.986-13.468l-10.04-7.806-2.207,1.717L59-10.021l12.261-9.536-2.221-1.73ZM59-16.928l10.027-7.806,2.234-1.73L59-36,46.739-26.464l2.221,1.73Z"/><rect class="a" width="26" height="26" transform="translate(46 -36)"/></g></svg>
`;

let documentSvgIcon = `
  <svg xmlns="http://www.w3.org/2000/svg" fill="#737373" width="17" height="17" viewBox="0 0 26 26"><defs><style>.a{fill:none;}</style></defs><g transform="translate(-251 -128)"><g transform="translate(205 372.941)"><path d="M61.6-244.941H51.2a2.6,2.6,0,0,0-2.587,2.6l-.013,20.8a2.6,2.6,0,0,0,2.587,2.6H66.8a2.608,2.608,0,0,0,2.6-2.6v-15.6Zm2.6,20.8H53.8v-2.6H64.2Zm0-5.2H53.8v-2.6H64.2Zm-3.9-6.5v-7.15l7.15,7.15Z"/><rect class="a" width="26" height="26" transform="translate(46 -244.941)"/></g></g></svg>
`;

let downArrowSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" class="arrowDown" pointer-events="none">
  <g id="down_arrow" transform="translate(92 140.118)" class="arrowDown">
    <path class="arrowDown" id="Path_323" data-name="Path 323" d="M-69.053-135.141l-9.94,9.918-9.94-9.918-3.053,3.053,12.993,12.994L-66-132.088Z"/>
    <rect class="arrowDown" id="Rectangle_49" data-name="Rectangle 49"  width="10" height="10" transform="translate(-92 -140.118)" fill="none"/>
  </g>
</svg>
`;

let upArrowSVG = `
<svg xmlns="http://www.w3.org/2000/svg"  width="26" height="26" viewBox="0 0 26 26" class="arrowUp" pointer-events="none">
  <g class="arrowUp" id="up_arrow" transform="translate(-46 140.118)">
    <path class="arrowUp" id="Path_320" data-name="Path 320" d="M49.055-119.09,59-129.013l9.945,9.923L72-122.145l-13-13-13,13Z"/>
    <rect class="arrowUp" id="Rectangle_46" data-name="Rectangle 46"  width="10" height="10" transform="translate(46 -140.118)" fill="none"/>
  </g>
</svg>
`;

var tmpl_schedule_modal = `
  <div>
    <div style="display: flex; justify-content: space-evenly">
      <div style="width: 40%">
        <input id="datepicker" type="text" placeholder="Select date">
      </div>
      <div style="width: 40%">
        <input id="timepicker" type="text" placeholder="Select time">
      </div>
      <div style="width: 20%">
        <select id="select_schedule_timezone">
          <% for(i=0; i< timeZones.length; i++) { %>
            <option
              value="<%= timeZones[i] %>"
              <% if(timeZones[i] == selectedTimeZone) { %>selected<% } %>
            >
              <%= timeZones[i] %>
            </option>
          <% } %>
        </select>
      </div>
    </div>
    <div style="margin: 10px 0px" id="schedule_info"></div>
    <div>
      <button
        id="btn_schedule_ok"
        style="margin-right:10px"
        class="sh_sch_modal_button sh_modal_button_primary sh_toolbar_option button browse sh_style">OK
      </button>
      <div id="btn_schedule_cancel" class="sh_sch_modal_button sh_modal_button_secondary sh_toolbar_option button browse sh_style">Cancel</div>
      <% if(isSchedulingDraft) {%>
        <div id="btn_schedule_undo" style="float:left;" class="modal_link">Undo Scheduling</div>
      <% } %>
    </div>
  <div>
 `;

//  var  month_picker_SH = `
//  <div>
//     <%
//         let months = data.months;
//         let year = data.year;
//         let today = new Date();
//         let currentMonthIndex = today.getMonth();
//         let currentYear = today.getMonth();
//     %>
//     <% for(j=0; j< months.length/4; j++) { %>
//         <div class="flatpickr-month-row-SH">
//             <% for(i=0; i< months.length/3; i++) { %>
//                 <div
//                     <%
//                     if(year === currentYear) {
//                         if(4*j+i < currentMonthIndex){
//                             class="flatpickr-disabledMonth-SH flatpickr-month-SH"
//                         } else if(4*j+i === currentMonth){
//                             class="flatpickr-selectedMonth-SH flatpickr-month-SH"
//                         } else {
//                             class="flatpickr-month-SH"
//                         }
//                     } else {
//                         class="flatpickr-month-SH"
//                     }
//                     %>
//                 >
//                 <% months[4*j+i] %>
//                 </div>
//             <% } %>
//         </div>
//     <% } %>
//  <div>
// `;

var month_picker_SH = `
<div>
   <% 
       let months = data.months; 
       let year = data.year; 
       let today = new Date();
       let currentMonthIndex = today.getMonth(); 
       let currentYear = today.getFullYear(); 
   %>
   <% for(j=0; j< months.length/3; j++) { %>
       <div class="flatpickr-month-row-SH">
           <% for(i=0; i< months.length/4; i++) { %>
                <% if(year == currentYear && 3*j+i < currentMonthIndex) { %>
                        <div class="flatpickr-disabledMonth-SH flatpickr-month-SH" data-monthindex="-1" data-monthindex-fixed="<%=3*j+i%>"><%=months[3*j+i]%></div>
                <% } else if(year == currentYear && 3*j+i == currentMonthIndex) { %>
                        <div class="flatpickr-selectedMonth-SH flatpickr-month-SH" data-monthindex="<%=3*j+i%>" data-monthindex-fixed="<%=3*j+i%>"><%=months[3*j+i]%></div>
                <% } else { %>
                        <div class="flatpickr-month-SH" data-monthindex="<%=3*j+i%>" data-monthindex-fixed="<%=3*j+i%>"><%=months[3*j+i]%></div>
                <% } %>
           <% } %>
       </div>
   <% } %>
`;

var year_picker_SH = `
<div>
   <% 
     let today = new Date();
     let currentYear = today.getFullYear();
     let startYear = today.getFullYear();;
   %>
   <% for(j=0; j< 4; j++) { %>
     <div class="flatpickr-year-row-SH">
       <% for(i=0; i< 3; i++) { %>
        <% if(currentYear === startYear) { %>
          <div class="flatpickr-year-SH flatpickr-selectedYear-SH" data-year="<%=currentYear%>"><%=currentYear++%></div>
        <% } else { %>
          <div class="flatpickr-year-SH" data-year="<%=currentYear%>"><%=currentYear++%></div>
        <% } %>                
       <% } %>
     </div>
   <% } %>
<div>
`;

/******************************Sidebar Section Begins ***************************************** */
var tmpl_preference_sidebar = `
<div style="height:65vh;">  
<div class="sh_sidebar_subscription sh_style">
    <div class="sh_style pref_sidebar_info">
      <span>
        <div class="long_user_name">
          <span style="font-size:18px; margin-top: 15px; font-weight:bold;"><%= currentUserName %></span>
          <br>
          <span style="font-size:12px;padding-top:8px; color:#4a4a4a;"><%= currentUserEmail%></span>
        </div>
      </span>
      <% if (!isPluginTempDeactivated) { %>
        <span class="sidebar_pref_top_icon" data-tooltip="Edit Profile"  style="right:67px">
          <a href="<%=mainApplication%>me">
            <i class="material-icons sh_sidebar_pref_material_icon">edit</i>
          </a>
        </span>
      <% } %>

      <span
        class="sidebar_pref_top_icon <% if (!isPluginTempDeactivated) { %>temp_deactivate_plugin_btn <% } else { %> temp_activate_plugin_btn<% } %>"
        data-tooltip="<% if (!isPluginTempDeactivated) { %>Deactivate Plugin <% } else { %> Activate Plugin <% } %>"
        id="deactivate_plugin_btn">
        <a>
        <i class="material-icons sh_sidebar_pref_material_icon" style="position:relative;left:-1px;">settings_power</i>
        </a>
      </span>
    </div>
    <div class="sh_sidebar_plan sh_style">
      <span style="font-size:16px; margin-top: 15px; font-weight:bold;">
        Current Plan
      </span>
      <% if(can_upgrade) {%>
        <span class="" style="margin-right:0px;margin-top: 5px;float:right;" id="upgradeBtnSideDrawer">Upgrade Plan
        </span>
      <% } %>
    <div>
    <div style="float:left;">
      <span style="font-size:12px;padding-top:8px; color:grey;">
        <%= current_plan %> <%= hasPausedSubscription ? ' (Your subscription is paused)': '' %>
      </span><BR />
      <% if(showDaysLeft) {%>
        <span class="days_left" style="font-size:12px;padding-top:8px; color:#e71f63;">
          (Trial ends in <%=days_left%> days)
        </span>
      <% } %>
    </div>
    </div>
    </div>
    <% if (isEligibleForBFCFOffer) { %>
      <div id="sh_sidebar_bf_cf">
        <a class="sh_sidebar_bf_cf_container">
          <div>
            <span class="sh_sidebar_bf_cm_body" href="gmail.com">
              <span class="sh_sidebar_bf_cm_button_icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><defs><style>.ax{fill:none;}.b{fill:#fff;}</style></defs><path class="ax" d="M0,0H16V16H0Z"/><path class="b" d="M13.646,7.748l-5.4-5.4A1.192,1.192,0,0,0,7.4,2H3.2A1.2,1.2,0,0,0,2,3.2V7.4a1.2,1.2,0,0,0,.354.852l5.4,5.4A1.192,1.192,0,0,0,8.6,14a1.173,1.173,0,0,0,.846-.354l4.2-4.2A1.173,1.173,0,0,0,14,8.6,1.212,1.212,0,0,0,13.646,7.748ZM4.1,5A.9.9,0,1,1,5,4.1.9.9,0,0,1,4.1,5Z"/></svg>
              </span>
              <div class="offer-button-text">
                <span>Get upto 50% Off</span>
                <span style="opacity: 0.7 !important;">Limited time offer</span>
              </div>
            </span>
          </div>
          <div>
            <div id="timer-container-id" class="timer-container">
              <span>00d</span>
              <span>00h</span>
              <span>00m</span>
              <span>00s</span>
            </div>
          </div>        
        <a>
      </div>  
    <% } %> 
  </div>
  <% if (!isPluginTempDeactivated) { %>
    <div class="sh_sidebar_links sh_style">
      <div style="font-size:16px; margin-bottom: 15px; font-weight:bold;" class="small_title"><b>Plugin Preference</b></div>

      <div class="sh_sidebar_pref_wrapper">
        <label class="switch">
          <input <% if(toggle_isAlwaysTrackEmail) { %> checked <% } %> type="checkbox" name="toggle_isAlwaysTrackEmail" value="toggle_isAlwaysTrackEmail" id="toggle_isAlwaysTrackEmail">
          <span class="slider round"></span>
        <span class="sh_sidebar_pref_slider_caption">Always Track Emails</span>
        </label>
      </div>

      <div class="sh_sidebar_pref_wrapper">
        <label class="switch">
          <input <% if(toggle_isAlwaysTrackLink) { %> checked <% } %> type="checkbox" name="toggle_isAlwaysTrackLink" value="toggle_isAlwaysTrackLink" id="toggle_isAlwaysTrackLink">
          <span class="slider round"></span>
        <span class="sh_sidebar_pref_slider_caption">Always Track Links</span>
        </label>
      </div>

      <div class="sh_sidebar_pref_wrapper">
        <label class="switch">
          <input <% if(toggle_isShowAll) { %> checked <% } %> type="checkbox" name="toggle_isShowAll" value="toggle_isShowAll" id="toggle_isShowAll">
          <span class="slider round"></span>
        <span class="sh_sidebar_pref_slider_caption">Show browser notifications</span>
        </label>
      </div>

      <div class="sh_sidebar_pref_wrapper">
        <label class="switch" id="bcc_to_crm_label">
          <input
            <% if(toggle_isAutoFillBCC) { %> checked <% } %>
            <% if((CcBccList && CcBccList.length === 0)) { %> disabled <% } %>
          type="checkbox" name="toggle_isAutoFillBCC" value="toggle_isAutoFillBCC" id="toggle_isAutoFillBCC">
          <span class="slider round"></span>
        <span class="sh_sidebar_pref_slider_caption bcc_pref">Auto fill Cc/Bcc mail</span>
        <span class="bcc_pref_email hide-long-bcc" data-tooltip="<%=CcBccList.join(", ")%>">
          <a href="<%= mainApplication %>me" style="color:#2a56c6;text-decoration: underline;">
            (<span><% if((CcBccList && CcBccList.length > 0)) { %>Edit Cc/Bcc list<% } else { %>Add Cc/Bcc to turn on<% } %></span>)
          </a>
        </span>
        </label>
      </div>

      <div class="sh_sidebar_pref_wrapper">
        <label class="switch" id="bcc_to_crm_label">
          <input
            <% if(toggle_isTeamTrackingOn) { %> checked <% } %>
          type="checkbox" name="toggle_isTeamTrackingOn" value="toggle_isTeamTrackingOn" id="toggle_isTeamTrackingOn">
          <span class="slider round"></span>
        <span class="sh_sidebar_pref_slider_caption">Track email open by my team</span>
        </label>
      </div>

      <div class="sh_sidebar_pref_wrapper">
        <label class="switch">
          <input <% if(chromeTemplateIcon) { %> checked <% } %> type="checkbox" name="chromeTemplateIcon" value="chromeTemplateIcon" id="chromeTemplateIcon">
          <span class="slider round"></span>
          <span class="sh_sidebar_pref_slider_caption">Template Icon in compose box</span>
        </label>
      </div>

      <% if(allow_doubletick_disable) { %> 
        <div class="sh_sidebar_pref_wrapper">
          <label class="switch" id="double_tick_opt_out">
            <input
              <% if(!toggle_isDoubleTickOff) { %> checked <% } %>
            type="checkbox" name="toggle_isDoubleTickOff" value="toggle_isDoubleTickOff" id="toggle_isDoubleTickOff">
            <span class="slider round"></span>
            <span class="sh_sidebar_pref_slider_caption">SalesHandy Read Receipts (✓✓)</span>
          </label>
        </div>
      <% } %>
    <% if (FEATURE_FLAGS.POWERED_BY_SIGNATURE) { %>
        <div class="sh_sidebar_pref_wrapper" style="margin-bottom: 0;">
          <label class="switch" id="powered_by_sidebar_label">
            <input <% if(toggle_isPoweredBy) { %> checked <% } %>
            <% if(branding_change_disable) { %> disabled <% } %>
            type="checkbox" name="toggle_isPoweredBy" value="toggle_isPoweredBy" id="toggle_isPoweredBy">
            <span class="slider round"></span>
            <span class="sh_sidebar_pref_slider_caption">Powered By SalesHandy</span>
            </label>
        </div>
        <% } %>
    </div>
  <% } %>

  <div id="sidebar_default_time_timezone_setting"></div>
  </div>
  </div>
    <div id="help-side-bar-wrapper" class="help-side-bar-wrapper-class">
    <div class="sh_style" style="position: fixed;bottom: 15px;padding: 0px 22px;display: flex;">
      <div class="help_side_bar">
        <a data-tooltip="Clear local storage for this particular account" href="#" class="support_sidebar_link" id="reset_plugin">Reset Plugin</a> |
        <a href=${HELP_URL.BASE} class="support_sidebar_link">Help</a> |
        <a href="mailto:support @saleshandy.com" class="support_sidebar_link">support@saleshandy.com</a>
      </div>
      <div class="help_side_bar" style="padding-left: 5px">
        <a href=" https://chrome.google.com/webstore/detail/email-tracking-scheduling/acfmebaomboldplijdpfepofggkocgnl"> |  v<%= current_version %></a>
      </div>
    </div>
 `;

var tmpl_feeds_sidebar = `
  <div class="sh_sidebar_subscription sh_style">
  <div class="sh_style pref_sidebar_info" style="padding: 10px 0 10px 19px">
    <span style="margin-right: 5%;position: relative;top: 2px;">
    <span style="font-size:18px; margin-top: 15px; font-weight:bold;">Recent Activity</span>
    </span>
    <span>
    <span style="cursor: pointer; float:right;" id="refresh-feeds-icon">
      <img style="height:15px; padding: 4px 6px 0 6px;" src="<%= chrome.extension.getURL("images/refresh-icon.svg")%>">
    </span>
    <a class="single_icon" href="<%= mainApplication %>dashboard" style="float:right; width: 20%; padding:5px; border-color: #2a55c6; line-height: 12px">
      <label>All Activity</label>
    </a>
    </span>
    <% if (subscription_button && total_records > 15) { %>
    <span class="sh_sidebar_plan">
      <span class="upgrade_now" style="padding: 0px; margin-right: 5px; float: right;">
      Upgrade Plan
      </span>
    </span>
    <% } %>
  </div>

  <div class="feed_list_wrapper" style="margin-top: 10px">
    <% if (!Boolean(rows.length)) { %>
      <div class="feed_no_item">No activity found</div>
    <% } %>
    <% rows.forEach((record) => { %>
      <div class="feed_single_item">
        <span style="margin-right: 10px;">
          <i style="min-width:13px;" class="<%= getIcon(record.action, record.sub_action)%>"></i>
        </span>
        <span class="feed_text">
          <%= record.text_to_display %>
        </span>
        <span style="margin-left:auto; font-size: 11px">
          <%= record.date_to_display %>
        </span>
      </div>
      <hr class="feed_item_divider"/>
    <% }); %>
  </div>
  </div>
  <div class="fixed-section fixed-footer">
  <% if (subscription_button && total_records > 15) {%>
    <div>
    For more activity information, Please
    <span class="upgrade_plan_link">Upgrade</span>
    your plan
    </div>
  <% } %>
  <div class="sh_style" style="padding: 5px 0px 10px 0px; display: flex">
    <div class="help_side_bar">
    <a href=${HELP_URL.BASE} class="support_sidebar_link">Help</a> |
    <a href="mailto:support @saleshandy.com" class="support_sidebar_link">support@saleshandy.com</a>
    </div>
    <div class="help_side_bar" style="padding-left: 5px">
    <a href=" https://chrome.google.com/webstore/detail/email-tracking-scheduling/acfmebaomboldplijdpfepofggkocgnl"> |  v<%= current_version %></a>
    </div>
  </div>
  </div>
`;

/******************************Sidebar Section Ends ***************************************** */
var emailTrackingSvgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="17" viewBox="0 0 39 19">
  <g id="Group_276" data-name="Group 276" transform="translate(-71.896 -91.81)">
    <path id="Path_322" data-name="Path 322" d="M79.711,110.456l-7.815-7.61,2.454-2.39,5.361,5.22,12.51-12.149,2.454,2.39Z" transform="translate(0 0.354)" />
    <path id="Path_323" data-name="Path 323" d="M85.627,110.153l-5.838-5.688,2.454-2.39,3.384,3.294L99.549,91.81,102,94.2Z" transform="translate(8.892)" />
  </g>
</svg>
`;
var tmpl_compose_statusbar = `
  <div class="sh_compose_toolbar sh_style">
   <div class="sh_style sh_toolbar_icon_wrapper" id="sh_schedule_div">
      <div class="scheduleIconContainer" id="ShContainer" <% if(trackingStatus) { %> data-tooltip="Schedule email"<% } else { %> data-tooltip="Turn on email tracking (✓✓), to schedule email"<% } %>>
         <span id="sh_setup_send_later">
            <button id="sh_send_later_option" class="sh_toolbar_option button browse sh_style">
            <% if(trackingStatus) { %> 
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" class="SHloadingIcon">
                <path id="Path_1424" data-name="Path 1424" d="M1610,494.22v2.07a7,7,0,1,1-4,0v-2.07a9,9,0,1,0,4,0Z" transform="translate(-1599 -494.219)" fill="#fff"/>
              </svg>
            <% } else { %> 
              Send Later
            <% } %>
            </button>
         </span>
      </div>
      <span id="scheduled_msg"></span>
   </div>
   <div class="sh_toolbar_option sh_style sh_track_btn" id="sh_track_div">
      <div class="template-dropup trackActive">
         <div class="dropup" id="sh_track_option" <% if(trackingStatus) { %> data-tooltip="Email tracking is on"<% } else { %> data-tooltip="Email tracking is off"<% } %> >
            <span class="sh_tracking_status_icon <% if(trackingStatus) { %> sh_active_track <% } %>">
            ${emailTrackingSvgIcon}
            </span>
         </div>
         <div class="track-dropup-content">
            <div class="dropup-content" id="track_dropup_content">
               <div class="track-template-header">
                  <p style="margin:0;">Settings</p>
                  <a class="trackCloseBtn" id="ClosePopoutBtnTrack" data-tooltip="Close">
                  <img src="https://www.gstatic.com/images/icons/material/system/1x/close_black_20dp.png" alt="close"/></a>
               </div>
               <div class="trackBody">
                  <div class="track_options">
                     <label class="switch dropup_label trackLabel">
                        <p>Notification</p>
                        <input type="checkbox" name="localNot" value="localNot">
                        <span class="slider round trackSwitch"></span>
                     </label>
                  </div>
                  <% if (FEATURE_FLAGS.POWERED_BY_SIGNATURE) { %>
                    <div class="track_options">
                      <label class="switch dropup_label trackLabel">
                          <p>Powered by SalesHandy</p>
                          <input type="checkbox" name="localPoweredSign" value="localPoweredSign">
                          <span class="slider round trackSwitch"></span>
                      </label>
                    </div>
                  <% } %>
                  <div class="track_options">
                     <label class="switch dropup_label trackLabel">
                        <p>Link tracking</p>
                        <input type="checkbox" name="localClickTrack" value="localClickTrack">
                        <span class="slider round trackSwitch"></span>
                     </label>
                  </div>
                  <div class="track_options">
                     <label class="switch dropup_label trackLabel">
                        <p>Track email</p>
                        <input type="checkbox" name="localTrackEmail" value="localTrackEmail">
                        <span class="slider round trackSwitch"></span>
                     </label>
                  </div>
                  <div class="triangle" style="display:none;"></div>
               </div>
            </div>
         </div>
      </div>
   </div>
   
   <div class="sh_toolbar_option sh_style sh_toolbar_icon_wrapper" id="sh_seq_div">
      <div class="template-dropup sequence_dropup" id="sh_sequence_list">
        <div id="seqTooltip" <% if(trackingStatus) { %> data-tooltip="Attach sequence"<% } else { %> data-tooltip="Turn on email tracking (✓✓), to attach sequence"<% } %>>
         <span id="sh_add_sequence_template">
         ${attachSequenceSvgIcon}
         </span>
         </div>
         <div id="sequence-dropup-content">
         </div>
      </div>
   </div>
      <div class="sh_toolbar_option sh_style sh_toolbar_icon_wrapper" id="sh_add_template_option" >
<div class="template-dropup" id="sh_template_option">
      <div class="templateTooltip"  data-tooltip="Templates">
        <span class="material-icons sh_toolbar_icon dropbtn" id="sh_add_template">
          ${templatesSvgIcon}
        </span>
      </div>
    </div>
   </div>
   <% if(!hideDocument) { %>
    <div class="sh_toolbar_option sh_style sh_toolbar_icon_wrapper" id="sh_add_document_option">
        <div id="sh_document_option" data-tooltip="Document tracking">
          <span class="sh_toolbar_icon sh_add_document_icon">
          ${documentSvgIcon}
          </span>
        </div>
    </div>
   <% } %>
   <% if(current_plan == 'Free Plan') { %>
   <div>
      <span  style="position: relative" href="" class="upgrade_in_statusbar">Upgrade Plan</span>
   </div>
   <% } %>
</div>
`;

var tmpl_welcome_modal_others = `
<div class="shn">
  <div class="sh_in_content">
  <div class="ob-header">
    <div class="shlogo">
      <svg xmlns="http://www.w3.org/2000/svg" width="117.703" height="22.304" viewBox="0 0 117.703 22.304"><defs><style>.a{fill:#272d38;}.b{fill:#fff;}</style></defs><g transform="translate(-999.346 -1282.318)"><g transform="translate(1027.164 1285.932)"><path class="a" d="M1080.336,1302.941a1.548,1.548,0,0,0-.559-1.234,5.331,5.331,0,0,0-1.987-.867,8.33,8.33,0,0,1-3.127-1.41,2.8,2.8,0,0,1-1.1-2.3,2.958,2.958,0,0,1,1.208-2.419,4.941,4.941,0,0,1,3.126-.949,4.639,4.639,0,0,1,3.215,1.08,3.189,3.189,0,0,1,1.174,2.584l-.022.054h-1.931a1.969,1.969,0,0,0-.637-1.515,2.6,2.6,0,0,0-1.81-.581,2.658,2.658,0,0,0-1.7.484,1.519,1.519,0,0,0-.6,1.245,1.38,1.38,0,0,0,.648,1.152,7.1,7.1,0,0,0,2.14.861,7.109,7.109,0,0,1,2.973,1.455,3.035,3.035,0,0,1,1.02,2.359,2.84,2.84,0,0,1-1.218,2.409,5.2,5.2,0,0,1-3.182.9,5.628,5.628,0,0,1-3.336-1.014,3.126,3.126,0,0,1-1.393-2.766l.022-.049h1.942a1.914,1.914,0,0,0,.768,1.656,3.382,3.382,0,0,0,2,.544,2.923,2.923,0,0,0,1.745-.45A1.428,1.428,0,0,0,1080.336,1302.941Z" transform="translate(-1073.237 -1293.065)"/><path class="a" d="M1107.256,1311.246c-.066-.23-.133-.45-.176-.669s-.076-.434-.1-.648a3.461,3.461,0,0,1-1.1,1.059,2.729,2.729,0,0,1-1.515.433,2.959,2.959,0,0,1-2.162-.729,2.627,2.627,0,0,1-.757-1.992,2.346,2.346,0,0,1,1.031-2.036,4.978,4.978,0,0,1,2.907-.728h1.58v-.79a1.473,1.473,0,0,0-.416-1.109,1.98,1.98,0,0,0-2.294-.065,1.04,1.04,0,0,0-.405.855H1101.9l-.011-.049a2.23,2.23,0,0,1,.954-1.892,4.062,4.062,0,0,1,2.634-.823,3.869,3.869,0,0,1,2.545.8,2.814,2.814,0,0,1,.966,2.3v4a6.928,6.928,0,0,0,.076,1.076,6.407,6.407,0,0,0,.243,1Zm-2.48-1.453a2.62,2.62,0,0,0,1.382-.379,2,2,0,0,0,.812-.878V1307.2h-1.612a2.029,2.029,0,0,0-1.383.439,1.342,1.342,0,0,0-.5,1.027,1.072,1.072,0,0,0,.34.822A1.4,1.4,0,0,0,1104.776,1309.793Z" transform="translate(-1090.829 -1298.244)"/><path class="a" d="M1129.507,1304.921h-2.03v-13h2.03Z" transform="translate(-1107.057 -1291.918)"/><path class="a" d="M1142.219,1311.422a3.936,3.936,0,0,1-3.06-1.256,4.61,4.61,0,0,1-1.13-3.221v-.334a4.779,4.779,0,0,1,1.13-3.265,3.908,3.908,0,0,1,5.617-.181,4.324,4.324,0,0,1,.977,2.964v1.19h-5.628l-.021.045a2.908,2.908,0,0,0,.635,1.75,1.989,1.989,0,0,0,1.6.68,4.393,4.393,0,0,0,1.4-.2,4.481,4.481,0,0,0,1.119-.576l.648,1.328a3.945,3.945,0,0,1-1.35.762A5.557,5.557,0,0,1,1142.219,1311.422Zm-.241-7.736a1.516,1.516,0,0,0-1.228.594,2.982,2.982,0,0,0-.6,1.513l.022.045h3.576v-.21a2.185,2.185,0,0,0-.439-1.4A1.61,1.61,0,0,0,1141.978,1303.686Z" transform="translate(-1113.636 -1298.244)"/><path class="a" d="M1167.378,1308.794a.938.938,0,0,0-.4-.773,3.882,3.882,0,0,0-1.492-.543,6.1,6.1,0,0,1-2.446-.971,2.042,2.042,0,0,1-.834-1.711,2.46,2.46,0,0,1,.966-1.936,3.81,3.81,0,0,1,2.523-.8,3.953,3.953,0,0,1,2.622.812,2.423,2.423,0,0,1,.933,2.013l-.023.049h-1.942a1.269,1.269,0,0,0-.428-.96,1.62,1.62,0,0,0-1.163-.4,1.657,1.657,0,0,0-1.119.328,1.034,1.034,0,0,0-.385.807.9.9,0,0,0,.363.751,3.958,3.958,0,0,0,1.47.5,6.113,6.113,0,0,1,2.525.988,2.076,2.076,0,0,1,.822,1.733,2.366,2.366,0,0,1-1.009,1.975,4.242,4.242,0,0,1-2.644.762,4.057,4.057,0,0,1-2.777-.9,2.581,2.581,0,0,1-.966-2.069l.023-.049h1.876a1.37,1.37,0,0,0,.57,1.141,2.3,2.3,0,0,0,1.306.357,2.062,2.062,0,0,0,1.208-.3A.946.946,0,0,0,1167.378,1308.794Z" transform="translate(-1128.569 -1298.244)"/><path class="a" d="M1196.73,1306.358h-.993v-5.585h-6.9v5.585h-1v-12.134h1v5.7h6.9v-5.7h.993Z" transform="translate(-1144.694 -1293.356)"/><path class="a" d="M1224.124,1311.246c-.065-.307-.11-.57-.136-.8a4.477,4.477,0,0,1-.045-.675,4.038,4.038,0,0,1-1.333,1.181,3.811,3.811,0,0,1-1.875.465,2.839,2.839,0,0,1-2.047-.7,2.488,2.488,0,0,1-.73-1.875,2.32,2.32,0,0,1,1.081-2,4.985,4.985,0,0,1,2.914-.751h1.991v-1.119a1.93,1.93,0,0,0-.62-1.515,2.532,2.532,0,0,0-1.739-.549,2.778,2.778,0,0,0-1.728.521,1.564,1.564,0,0,0-.687,1.285l-.921-.005-.017-.05a2.154,2.154,0,0,1,.922-1.8,3.758,3.758,0,0,1,2.473-.8,3.622,3.622,0,0,1,2.4.756,2.664,2.664,0,0,1,.911,2.174v4.437a7.511,7.511,0,0,0,.054.921,5.624,5.624,0,0,0,.176.895Zm-3.276-.708a3.6,3.6,0,0,0,1.9-.5,3.041,3.041,0,0,0,1.19-1.289v-1.883h-2.008a3.688,3.688,0,0,0-2.172.577,1.716,1.716,0,0,0-.812,1.437,1.556,1.556,0,0,0,.5,1.2A1.992,1.992,0,0,0,1220.848,1310.538Z" transform="translate(-1163.474 -1298.244)"/><path class="a" d="M1244.431,1302.227l.093,1.575a3.1,3.1,0,0,1,2.919-1.739,2.775,2.775,0,0,1,2.234.894,4.248,4.248,0,0,1,.768,2.8v5.491h-1v-5.5a3.277,3.277,0,0,0-.575-2.194,2.112,2.112,0,0,0-1.646-.643,2.548,2.548,0,0,0-1.712.555,3.048,3.048,0,0,0-.954,1.47v6.309h-1v-9.019Z" transform="translate(-1179.432 -1298.244)"/><path class="a" d="M1267.754,1300.489a5.878,5.878,0,0,1,.91-3.457,2.936,2.936,0,0,1,2.546-1.294,3.186,3.186,0,0,1,1.636.4,3.307,3.307,0,0,1,1.152,1.13v-5.349h.986v13h-.883l-.083-1.311a3.123,3.123,0,0,1-1.157,1.1,3.485,3.485,0,0,1-1.668.383,3.007,3.007,0,0,1-2.53-1.207,5.209,5.209,0,0,1-.91-3.231Zm1,.175a4.637,4.637,0,0,0,.653,2.611,2.225,2.225,0,0,0,1.974.971,2.835,2.835,0,0,0,1.614-.439,2.945,2.945,0,0,0,1-1.2v-4.253a3.216,3.216,0,0,0-.971-1.278,2.545,2.545,0,0,0-1.63-.489,2.163,2.163,0,0,0-1.98,1.081,5.324,5.324,0,0,0-.664,2.82Z" transform="translate(-1194.525 -1291.918)"/><path class="a" d="M1294.885,1309.077l.318,1.076h.05l2.727-7.654h1.114l-3.917,10.462a5.091,5.091,0,0,1-.906,1.558,2.052,2.052,0,0,1-1.635.642,3.3,3.3,0,0,1-.422-.039,2.1,2.1,0,0,1-.367-.082l.115-.833c.065.011.175.027.323.038a3.015,3.015,0,0,0,.319.022,1.3,1.3,0,0,0,1.042-.461,4.063,4.063,0,0,0,.669-1.19l.472-1.218-3.483-8.9h1.108Z" transform="translate(-1209.208 -1298.516)"/></g><path class="a" d="M1020.3,1282.318h-19.616a1.347,1.347,0,0,0-1.342,1.342v19.62a1.343,1.343,0,0,0,1.342,1.342H1020.3a1.343,1.343,0,0,0,1.342-1.342v-19.62A1.347,1.347,0,0,0,1020.3,1282.318Z" transform="translate(0 0)"/><g transform="translate(1002.573 1288.151)"><g transform="translate(0)"><path class="b" d="M1009.571,1305.031c1.036,1.261,3.32,1.318,3.392.206.028-.583-.922-.922-1.768-1.036-1.667-.263-3.187-1.314-3.187-3.287,0-2.035,1.839-3.1,3.741-3.1a4.238,4.238,0,0,1,3.535,1.653l-1.71,1.313c-1.079-1.156-2.938-1.108-2.98.086.028.5.573.793,1.376.965,1.839.34,3.682.979,3.563,3.525-.086,2-2.192,3.1-4.09,3.1a4.538,4.538,0,0,1-3.525-1.868Z" transform="translate(-1007.918 -1297.813)"/></g><g transform="translate(7.28 0.148)"><path class="b" d="M1029.888,1308.553h-2.633v-10.347h2.633v3.917h2.981v-3.917h2.632v10.347h-2.632v-3.9h-2.981Z" transform="translate(-1027.255 -1298.205)"/></g></g></g></svg>
    </div>
  </div>
    <div class="activationBody">
      <div class="yw-activate-selling-point">
        <div class="iconOuter"><span class="emailtrck"></span></div>
        <div class="ActiveDesc">
          <h3 class="head1">Email Tracking</h3>
          <p class="par1">Get real-time email open notifications and track link-clicks to
          know the recipient's engagement level.</p>
        </div>
      </div>
      <div class="yw-activate-selling-point margintopbottom">
        <div class="iconOuter"><span class="sh_schedule_logo"></span></div>
        <div class="ActiveDesc">
          <h3 class="head1">Smart Email Scheduling </h3>
          <p class="par1">Schedule emails to be sent later and ensure you stay on top of your recipient's inbox when they are most likely to check.</p>
        </div>
      </div>
      <div class="yw-activate-selling-point">
        <div class="iconOuter"><span class="templ"></span></div>
        <div class="ActiveDesc">
          <h3 class="head1">Email Templates</h3>
          <p class="par1">Save time sending similar emails frequently with email templates. Know which templates are generating results.</p>
        </div>
      </div>
      <div style="text-align: center">
        <div class="accntNotFound">
          <a href="https://www.saleshandy.com/get-started-with-chrome-extension#commonissue" style="color:#de4935 !important; text-decoration:none;">
            Account not found
          </a>
          <span style="color: #404040">for <b><%= currentUserEmail %></span>
          <small>
            <a class="why_tag_popup" href="https://www.saleshandy.com/get-started-with-chrome-extension/#commonissue">
              <span style="color:#357AE8">(Why?)</span>
            </a>
          </small>
        </div>
      </div>
      <div class="buttonAction">
        <button class="btnCommon btn-blue modal_button" id="sign_in_plugin" data-tooltip="To join SalesHandy">
          <span class="modal_button_input">Sign in with Google</span>
        </button>
          <div class="modal_link" id="dont_show_again">
            <a class="notActiveLink">Don't activate on <span><%= currentUserEmail %></span></a>
          </div>
      </div>
    </div>
  </div>
</div>
`;

var tmpl_welcome_modal_activated = `
<div class="shn">
  <div class="sh_in_content">
    <div class="ob-header">
      <div class="shlogo">
        <svg xmlns="http://www.w3.org/2000/svg" width="117.703" height="22.304" viewBox="0 0 117.703 22.304"><defs><style>.a{fill:#272d38;}.b{fill:#fff;}</style></defs><g transform="translate(-999.346 -1282.318)"><g transform="translate(1027.164 1285.932)"><path class="a" d="M1080.336,1302.941a1.548,1.548,0,0,0-.559-1.234,5.331,5.331,0,0,0-1.987-.867,8.33,8.33,0,0,1-3.127-1.41,2.8,2.8,0,0,1-1.1-2.3,2.958,2.958,0,0,1,1.208-2.419,4.941,4.941,0,0,1,3.126-.949,4.639,4.639,0,0,1,3.215,1.08,3.189,3.189,0,0,1,1.174,2.584l-.022.054h-1.931a1.969,1.969,0,0,0-.637-1.515,2.6,2.6,0,0,0-1.81-.581,2.658,2.658,0,0,0-1.7.484,1.519,1.519,0,0,0-.6,1.245,1.38,1.38,0,0,0,.648,1.152,7.1,7.1,0,0,0,2.14.861,7.109,7.109,0,0,1,2.973,1.455,3.035,3.035,0,0,1,1.02,2.359,2.84,2.84,0,0,1-1.218,2.409,5.2,5.2,0,0,1-3.182.9,5.628,5.628,0,0,1-3.336-1.014,3.126,3.126,0,0,1-1.393-2.766l.022-.049h1.942a1.914,1.914,0,0,0,.768,1.656,3.382,3.382,0,0,0,2,.544,2.923,2.923,0,0,0,1.745-.45A1.428,1.428,0,0,0,1080.336,1302.941Z" transform="translate(-1073.237 -1293.065)"/><path class="a" d="M1107.256,1311.246c-.066-.23-.133-.45-.176-.669s-.076-.434-.1-.648a3.461,3.461,0,0,1-1.1,1.059,2.729,2.729,0,0,1-1.515.433,2.959,2.959,0,0,1-2.162-.729,2.627,2.627,0,0,1-.757-1.992,2.346,2.346,0,0,1,1.031-2.036,4.978,4.978,0,0,1,2.907-.728h1.58v-.79a1.473,1.473,0,0,0-.416-1.109,1.98,1.98,0,0,0-2.294-.065,1.04,1.04,0,0,0-.405.855H1101.9l-.011-.049a2.23,2.23,0,0,1,.954-1.892,4.062,4.062,0,0,1,2.634-.823,3.869,3.869,0,0,1,2.545.8,2.814,2.814,0,0,1,.966,2.3v4a6.928,6.928,0,0,0,.076,1.076,6.407,6.407,0,0,0,.243,1Zm-2.48-1.453a2.62,2.62,0,0,0,1.382-.379,2,2,0,0,0,.812-.878V1307.2h-1.612a2.029,2.029,0,0,0-1.383.439,1.342,1.342,0,0,0-.5,1.027,1.072,1.072,0,0,0,.34.822A1.4,1.4,0,0,0,1104.776,1309.793Z" transform="translate(-1090.829 -1298.244)"/><path class="a" d="M1129.507,1304.921h-2.03v-13h2.03Z" transform="translate(-1107.057 -1291.918)"/><path class="a" d="M1142.219,1311.422a3.936,3.936,0,0,1-3.06-1.256,4.61,4.61,0,0,1-1.13-3.221v-.334a4.779,4.779,0,0,1,1.13-3.265,3.908,3.908,0,0,1,5.617-.181,4.324,4.324,0,0,1,.977,2.964v1.19h-5.628l-.021.045a2.908,2.908,0,0,0,.635,1.75,1.989,1.989,0,0,0,1.6.68,4.393,4.393,0,0,0,1.4-.2,4.481,4.481,0,0,0,1.119-.576l.648,1.328a3.945,3.945,0,0,1-1.35.762A5.557,5.557,0,0,1,1142.219,1311.422Zm-.241-7.736a1.516,1.516,0,0,0-1.228.594,2.982,2.982,0,0,0-.6,1.513l.022.045h3.576v-.21a2.185,2.185,0,0,0-.439-1.4A1.61,1.61,0,0,0,1141.978,1303.686Z" transform="translate(-1113.636 -1298.244)"/><path class="a" d="M1167.378,1308.794a.938.938,0,0,0-.4-.773,3.882,3.882,0,0,0-1.492-.543,6.1,6.1,0,0,1-2.446-.971,2.042,2.042,0,0,1-.834-1.711,2.46,2.46,0,0,1,.966-1.936,3.81,3.81,0,0,1,2.523-.8,3.953,3.953,0,0,1,2.622.812,2.423,2.423,0,0,1,.933,2.013l-.023.049h-1.942a1.269,1.269,0,0,0-.428-.96,1.62,1.62,0,0,0-1.163-.4,1.657,1.657,0,0,0-1.119.328,1.034,1.034,0,0,0-.385.807.9.9,0,0,0,.363.751,3.958,3.958,0,0,0,1.47.5,6.113,6.113,0,0,1,2.525.988,2.076,2.076,0,0,1,.822,1.733,2.366,2.366,0,0,1-1.009,1.975,4.242,4.242,0,0,1-2.644.762,4.057,4.057,0,0,1-2.777-.9,2.581,2.581,0,0,1-.966-2.069l.023-.049h1.876a1.37,1.37,0,0,0,.57,1.141,2.3,2.3,0,0,0,1.306.357,2.062,2.062,0,0,0,1.208-.3A.946.946,0,0,0,1167.378,1308.794Z" transform="translate(-1128.569 -1298.244)"/><path class="a" d="M1196.73,1306.358h-.993v-5.585h-6.9v5.585h-1v-12.134h1v5.7h6.9v-5.7h.993Z" transform="translate(-1144.694 -1293.356)"/><path class="a" d="M1224.124,1311.246c-.065-.307-.11-.57-.136-.8a4.477,4.477,0,0,1-.045-.675,4.038,4.038,0,0,1-1.333,1.181,3.811,3.811,0,0,1-1.875.465,2.839,2.839,0,0,1-2.047-.7,2.488,2.488,0,0,1-.73-1.875,2.32,2.32,0,0,1,1.081-2,4.985,4.985,0,0,1,2.914-.751h1.991v-1.119a1.93,1.93,0,0,0-.62-1.515,2.532,2.532,0,0,0-1.739-.549,2.778,2.778,0,0,0-1.728.521,1.564,1.564,0,0,0-.687,1.285l-.921-.005-.017-.05a2.154,2.154,0,0,1,.922-1.8,3.758,3.758,0,0,1,2.473-.8,3.622,3.622,0,0,1,2.4.756,2.664,2.664,0,0,1,.911,2.174v4.437a7.511,7.511,0,0,0,.054.921,5.624,5.624,0,0,0,.176.895Zm-3.276-.708a3.6,3.6,0,0,0,1.9-.5,3.041,3.041,0,0,0,1.19-1.289v-1.883h-2.008a3.688,3.688,0,0,0-2.172.577,1.716,1.716,0,0,0-.812,1.437,1.556,1.556,0,0,0,.5,1.2A1.992,1.992,0,0,0,1220.848,1310.538Z" transform="translate(-1163.474 -1298.244)"/><path class="a" d="M1244.431,1302.227l.093,1.575a3.1,3.1,0,0,1,2.919-1.739,2.775,2.775,0,0,1,2.234.894,4.248,4.248,0,0,1,.768,2.8v5.491h-1v-5.5a3.277,3.277,0,0,0-.575-2.194,2.112,2.112,0,0,0-1.646-.643,2.548,2.548,0,0,0-1.712.555,3.048,3.048,0,0,0-.954,1.47v6.309h-1v-9.019Z" transform="translate(-1179.432 -1298.244)"/><path class="a" d="M1267.754,1300.489a5.878,5.878,0,0,1,.91-3.457,2.936,2.936,0,0,1,2.546-1.294,3.186,3.186,0,0,1,1.636.4,3.307,3.307,0,0,1,1.152,1.13v-5.349h.986v13h-.883l-.083-1.311a3.123,3.123,0,0,1-1.157,1.1,3.485,3.485,0,0,1-1.668.383,3.007,3.007,0,0,1-2.53-1.207,5.209,5.209,0,0,1-.91-3.231Zm1,.175a4.637,4.637,0,0,0,.653,2.611,2.225,2.225,0,0,0,1.974.971,2.835,2.835,0,0,0,1.614-.439,2.945,2.945,0,0,0,1-1.2v-4.253a3.216,3.216,0,0,0-.971-1.278,2.545,2.545,0,0,0-1.63-.489,2.163,2.163,0,0,0-1.98,1.081,5.324,5.324,0,0,0-.664,2.82Z" transform="translate(-1194.525 -1291.918)"/><path class="a" d="M1294.885,1309.077l.318,1.076h.05l2.727-7.654h1.114l-3.917,10.462a5.091,5.091,0,0,1-.906,1.558,2.052,2.052,0,0,1-1.635.642,3.3,3.3,0,0,1-.422-.039,2.1,2.1,0,0,1-.367-.082l.115-.833c.065.011.175.027.323.038a3.015,3.015,0,0,0,.319.022,1.3,1.3,0,0,0,1.042-.461,4.063,4.063,0,0,0,.669-1.19l.472-1.218-3.483-8.9h1.108Z" transform="translate(-1209.208 -1298.516)"/></g><path class="a" d="M1020.3,1282.318h-19.616a1.347,1.347,0,0,0-1.342,1.342v19.62a1.343,1.343,0,0,0,1.342,1.342H1020.3a1.343,1.343,0,0,0,1.342-1.342v-19.62A1.347,1.347,0,0,0,1020.3,1282.318Z" transform="translate(0 0)"/><g transform="translate(1002.573 1288.151)"><g transform="translate(0)"><path class="b" d="M1009.571,1305.031c1.036,1.261,3.32,1.318,3.392.206.028-.583-.922-.922-1.768-1.036-1.667-.263-3.187-1.314-3.187-3.287,0-2.035,1.839-3.1,3.741-3.1a4.238,4.238,0,0,1,3.535,1.653l-1.71,1.313c-1.079-1.156-2.938-1.108-2.98.086.028.5.573.793,1.376.965,1.839.34,3.682.979,3.563,3.525-.086,2-2.192,3.1-4.09,3.1a4.538,4.538,0,0,1-3.525-1.868Z" transform="translate(-1007.918 -1297.813)"/></g><g transform="translate(7.28 0.148)"><path class="b" d="M1029.888,1308.553h-2.633v-10.347h2.633v3.917h2.981v-3.917h2.632v10.347h-2.632v-3.9h-2.981Z" transform="translate(-1027.255 -1298.205)"/></g></g></g></svg>
      </div>
    </div>
    <div class="activationBody">
      <ul class="ob-slider">
        <li class="mySlides fade">
          <div id="obSlideOne"></div>
          <h3>Email Tracking</h3>
          <p>Get real-time open notifications and track link clicks to know the recipient’s engagement level.</p>
        </li>
        <li class="mySlides fade">
          <div id="obSlideTwo"></div>
          <h3>Email Schedule</h3>
          <p>Schedule emails to be sent later and ensure you stay on top of your recipient’s inbox when they are most likely to check.</p>
        </li>
        <li class="mySlides fade">
          <div id="obSlideThree"></div>
          <h3>Email Templates</h3>
          <p>Save time sending similar emails frequently with email templates. Know which templates are generating results.</p>
        </li>
        <li class="mySlides fade">
          <div id="obSlideFour"></div>
          <h3>Email Sequence</h3>
          <p>Send personalized automated follow-ups for individual emails by using behavioural triggers.</p>
        </li>

        <div style="text-align:center" id="dotContainer">
          <span class="dot" id="dot1"></span> 
          <span class="dot" id="dot2"></span> 
          <span class="dot" id="dot3"></span>
          <span class="dot" id="dot4"></span> 
        </div>
      </ul>
      <% if (!(getUserInfoFromLocal() && getUserInfoFromLocal().isPluginActivated)) { %>
        <div class="buttonAction">
          <button class="btnCommon btn-blue active-button" id="activate_plugin" data-tooltip="Click to Activate plugin">
            <span class="modal_button_input">Activate Plugin</span>
          </button>
          <div class="modal_link" id="dont_show_again">
            <a class="notActiveLink">
              Don't activate on <span><%= currentUserEmail %></span>
            </a>
          </div>
        </div>
      <% } else { %>
        <div class="buttonAction">
          <button class="btnCommon btn-blue active-button" id="lets-get-started" data-tooltip="Let's get started">
            <span class="modal_button_input">Let's get started</span>
          </button>
        </div>
      <% } %>  
    </div>
  </div>
</div>
`;

var tmpl_powered_by_SalesHandyTag = `
  <br>
  <div class='sh_branding_footer' id='saleshandy_branding' tabindex='1' style="outline: none">
    <span style='color:rgb(153,153,153);font-family:verdana,sans-serif;font-size:x-small'>
      <span class='il'>Powered</span>
      By&nbsp;
    </span>
    <a id="saleshandy_branding" href='https://www.saleshandy.com/signup/?utm_source=gmail&utm_medium=emailfooter&utm_campaign=branding' style='font-family:verdana,sans-serif;font-size:x-small' target='_blank'>
      <span class='il'>SalesHandy</span>
    </a>
  </div>
`;

{
    /* <span style="font-size:16px; margin-top: 15px; font-weight:bold;padding: 0px 20px 20px 0px;"><b></b></span> */
}
var tmpl_schedule_time = `
  <div>
    <div>
      <input
      type="checkbox"
      name="use_current_time_timezone"
      id="use_current_time_timezone"
      <% if (defaultTimeAndTimezonePresent) { %>checked<% } %>><label class="check-default-time-timezone">Default Schedule Timezone</label>
    </div>

    <div
    id="time_and_timezone_area"
    style="<% if (!defaultTimeAndTimezonePresent) { %> display: none; <% } %>margin-top:15px;">
    <div class="pickerSection sidebar-pickerSection">
      <div class="auto-complete-container">
      </div>
    <div class="custom-select" style="display: flex; margin-left: 5px;">
      <input id="sidebar-timepicker" type="text" placeholder="Select time">
      <input id="sidebar-timezone"/>
    </div>
    </div>
    </div>
  </div>
`;

var bg_cm_offer_popup = `
<div>
  <div class="xmas-offer-modal">
    <a class="close-icon"><i class="shm-close"></i></a>
    <div class="inner-xmas-offer">
      <div class="offer-block">
        <p>Missed the Black Friday offer?</p>
        <p> You still have a chance to save up to 50% on your plan</p>
        <span id="bf-cm-offer-text" class="offer-text"></span>
        <div id="timer-container-id">
          <span>00d</span>
          <span>00h</span>
          <span>00m</span>
          <span>00s</span>
        </div>
        <a id="get-bf-cm_offer-button" class="get-offer-button">
          <span class="offer-button-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><defs><style>.a{fill:none;}.b{fill:#fff;}</style></defs><path class="a" d="M0,0H16V16H0Z"/><path class="b" d="M13.646,7.748l-5.4-5.4A1.192,1.192,0,0,0,7.4,2H3.2A1.2,1.2,0,0,0,2,3.2V7.4a1.2,1.2,0,0,0,.354.852l5.4,5.4A1.192,1.192,0,0,0,8.6,14a1.173,1.173,0,0,0,.846-.354l4.2-4.2A1.173,1.173,0,0,0,14,8.6,1.212,1.212,0,0,0,13.646,7.748ZM4.1,5A.9.9,0,1,1,5,4.1.9.9,0,0,1,4.1,5Z"/></svg>
          </span>
          <div class="offer-button-text">
            <span>Get upto 50% Off</span>
            <span style="opacity: 0.7 !important;">Limited time offer</span>
          </div>
        </a>
      </div>
    </div>
  </div>
</div>`;

/*********************************************JS Functions Begins ******************************* */

(function addFontAwesomeIcons() {
    let fontAwesomeCdn = 'https://use.fontawesome.com/releases/v5.0.9/js/all.js';
    let scriptTag = document.createElement('script');
    scriptTag.setAttribute('src', fontAwesomeCdn);
    scriptTag.setAttribute('integrity', 'sha384-8iPTk2s/jMVj81dnzb/iFR2sdA7u06vHJyyLlAd4snFpCl/SnyUjRrbdJsw1pGIl');
    scriptTag.setAttribute('crossorigin', 'anonymous');
    document.head.appendChild(scriptTag);
})();

function getIcon(action, sub_action) {
    let fontIconClass = '';
    switch (action) {
        case 'EMAILS':
            switch (sub_action) {
                case 'OPEN':
                    fontIconClass = 'far fa-envelope-open feed_with_email';
                    break;
                case 'SENT':
                    fontIconClass = 'far fa-paper-plane feed_with_email';
                    break;
                case 'SCHEDULED':
                    fontIconClass = 'far fa-clock feed_with_email';
                    break;
                case 'CLICKED':
                    fontIconClass = 'fas fa-link feed_with_email';
                    break;
                case 'REPLIED':
                    fontIconClass = 'fas fa-reply feed_with_email';
                    break;
            }
            break;
        case 'DOCUMENT_LINKS':
            fontIconClass = 'far fa-file-alt feed_with_document';
            break;
        case 'CAMPAIGNS':
            switch (sub_action) {
                case 'OPEN':
                    fontIconClass = 'far fa-envelope-open feed_with_campaign';
                    break;
                case 'CLICKED':
                    fontIconClass = 'fas fa-link feed_with_campaign';
                    break;
            }
            break;
    }
    return fontIconClass;
}

/*********************************************JS Functions Ends ********************************* */
