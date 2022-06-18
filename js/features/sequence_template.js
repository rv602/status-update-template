let attachSequenceSvgIcon = `
<svg xmlns="http://www.w3.org/2000/svg"  id="attach-seq-img" width="17" height="17" fill="#737373" viewBox="0 0 26 26"><defs></defs><path class="a" d="M0,0H26V26H0Z"/><path d="M23.955,10.27V.356L20.611,3.7A12.314,12.314,0,0,0,3.331,20.98l2.2-2.2A9.234,9.234,0,0,1,18.41,5.9l-4.261,4.261ZM22.79,20.98a12.221,12.221,0,0,0,2.474-6H22.169a8.96,8.96,0,0,1-1.581,3.8ZM7.721,20.947l-2.2,2.2a12.229,12.229,0,0,0,6,2.5V22.506A8.931,8.931,0,0,1,7.721,20.947Zm6.877,1.6.009,3.085a12.171,12.171,0,0,0,6-2.475l-2.2-2.2A9.063,9.063,0,0,1,14.6,22.548Z"/></svg>
`;

var seq_temp_list_content = `
<div id="seq-temp-content" class="seq-temp-dropup-container seqDropout">
  <div class="seq-template-header">
    <span>Select Sequence Template</span>
    <a class="seqCloseBtn" id="ClosePopbuttonSequence" data-tooltip="Close"><img src="https://www.gstatic.com/images/icons/material/system/1x/close_black_20dp.png" alt="close"/></a>
  </div>
  <% if (res.error) { %> <span class="seq-error hide-overflow-text" data-tooltip="<%= res.error_message %>">
    <%= res.error_message %></span>
  <% } else { %>
    <% if(res.length == 0) { %>
        <div class="emptyMsg">
          <p>No sequence templates available</p>
          <a href=${HELP_URL.EMAIL_SEQUENCE} target="_blank">What is a sequence template?</a>
        </div>
      <% } else { %>
       <div class="content" id="ex4">
        <div class="seq-list-wrapper">
        <% for (i=0; i<res.length; i++) { %>
          <div class="single-sequence checkbox-and-label">
            <div style="float:left;width:100%;">
              <label style="float:left;width:24px;">
                <input id="<%= res[i].id%>" class="check-custom" name="check-group" type="checkbox" style="float:left;margin:0;display:none;">
                <span class="checkmark"></span>
              </label>
              <div style="float: left;width:calc(100% - 25px);">
                <span>
                  <label id="<%= res[i].id%>" for="<%= res[i].id%>" class="check-custom-label" data-tooltip="<%= res[i].title %>">
                    <%= res[i].title %>
                  </label>
                </span>
                <div class="hvrAction">
                  <span class="seq-list-total-stage">
                    <%= res[i].total_stages %><%= res[i].total_stages > 1 ? ' Stages' : ' Stage' %>
                  </span>
                  <a href="https://app.saleshandy.com/sequence/template/edit/<%= res[i].id%>" tarrget="_blank" class="previewtxt">Preview</a>
                </div>
              </div>
            </div>
          </div>
        <% } %>
        </div>
      </div>    
    <% } %>
  <% } %>
  <div class="attach-sequence-btn">
    <a class="attach-seq" href="<%=mainApplication%>sequence/template/create"><i class="addSign">+</i>Create a followup sequence</a>
  </div>
</div>
`;
