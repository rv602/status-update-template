var schedule_dropup_content = `
  <div id="schedule_dropup_content"></div>
`;

var rightArrowSch = `<img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1IDgiPjxkZWZzPjxzdHlsZT4uYXtmaWxsOiM0ZDkwZmU7fTwvc3R5bGU+PC9kZWZzPjxwYXRoIGNsYXNzPSJhIiBkPSJNNTkuNiwwLDU4LjY1LjkzMyw2MS43NTgsNCw1OC42NSw3LjA2Nyw1OS42LDgsNjMuNjUsNFoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC01OC42NSkiLz48L3N2Zz4=">`;

var new_tmpl_schedule_modal = `
<div class="schedule-dropup" id="sh_schedule_dropup_option">
  <div class="presetDivSchedule">
      <div class="scheduleHead">
        <h4>Send later</h4>
        <a class="schCloseBtn" data-tooltip="Close"><img src="https://www.gstatic.com/images/icons/material/system/1x/close_black_20dp.png" alt="close"/></a>
      </div>
      <ul class="ScheduleMiddleBody">
        <% for(let i=0; i< customTime.length; i++) { %>
          <li <% if (customTime[i].add) { %> data-time-to-add="<%= customTime[i].add %>" <% } else if (customTime[i].staticTime) { %> data-static-time="<%= customTime[i].staticTime %>" <% } %> class="custom_time_ele  <% if (customTime[i].class) { %><%= customTime[i].class %> <% } %>">
            <a class='customtime-caption'>
              <span class="time-caption"><%= customTime[i].leftCaption %></span>
              <span class="time-value hidden"></span>
            </a>
          </li>
        <% } %>
      </ul>
      <div class="pickerSection">
          <span class="pickerTitle">Send email on:</span>
          <div class="pickerSelectBox dateicon">
            <input type="text" id="datepicker1" class="dateInput" placeholder="Select date and time..."/>
          </div>
          <div class="auto-complete-container">
            <div class="autocomplete-backdrop">No timezones matching your text are available</div>
            <div class="autocomplete-close">
              <h4>Timezones</h4>
              <a class="autocomplete-close-btn" data-tooltip="Close"><img src="https://www.gstatic.com/images/icons/material/system/1x/close_black_20dp.png" alt="close"/></a>
            </div>
      
          </div>
          <div class="pickerSelectBox globeicon">
            <input type="text" id="TimeZonePickerInput" class="globeInput" placeholder="Select timezone" value="<%= currentTimeZone  %>"/>
          </div>
          <div class="schedule-confirm-btn <%= isUnschedule ? "unschedule-btn" : "schedule-btn" %>"><%= isUnschedule ? "Unschedule" : "Schedule" %></div>
      </div>
  </div>

  <div class="presetDivUnschedule" style="display:none;">
      <div class="scheduleHead">
        <h4>Send Later</h4>
        <a class="schCloseBtn" data-tooltip="Close"><img src="https://www.gstatic.com/images/icons/material/system/1x/close_black_20dp.png" alt="close"/></a>
      </div>
      <ul class="ScheduleMiddleBody">
        <% for(let i=0; i< customTime.length; i++) { %>
          <li class="custom_time_ele  <% if (customTime[i].class) { %><%= customTime[i].class %> <% } %>">
            <a>
              <%= customTime[i].leftCaption %>
            </a>
          </li>
        <% } %>
      </ul>
  </div>

  <div class="DateSelectionDiv" style="display:none;">
      <div class="scheduleHead">
        <a class="backicon schToggleScreen"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMCAxMCI+PGRlZnM+PHN0eWxlPi5he2ZpbGw6IzY2NmE3Mzt9PC9zdHlsZT48L2RlZnM+PHBhdGggY2xhc3M9ImEiIGQ9Ik0xMCw0LjM3NUgyLjM3NWwzLjUtMy41TDUsMCwwLDVsNSw1LC44NzUtLjg3NS0zLjUtMy41SDEwWiIvPjwvc3ZnPg=="/></a>
        <h4>Go back</h4>
        <a class="schCloseBtn" data-tooltip="Close"><img src="https://www.gstatic.com/images/icons/material/system/1x/close_black_20dp.png" alt="close"/></a>
      </div>
      <div class="ScheduleMiddleBody schpaddingset">
        <input id="datepicker11" type="text" placeholder="Select date" style="display:none;">
        <div class="timeZoneBody">
          <input id="TimeZonePickerInput" type="text" placeholder="Select Timezone" style="width:100%;max-width:600px;outline:0" value="<%= currentTimeZone  %>">
        </div>
      </div>
  </div>
</div>
`;
