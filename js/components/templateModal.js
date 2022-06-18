function SHTemplateModal(identifier, oTemplateData, oTeamData) {
    let openFolderId = oTemplateData && oTemplateData.folder_id;
    let openFolderName = oTemplateData && oTemplateData.folder_name;
    let templateId = oTemplateData && oTemplateData.id;
    let isUserTemplateOwner = identifier === 'add' || (oTemplateData && oTemplateData.is_template_owner);
    let mainDiv = getNewElement();
    let hideDocuments =  userPreferencesRes.preferences.DOC_DISABLED;
    let popUpBtns = [
        {
            text: identifier === 'add' ? 'Create' : 'Update',
            orderHint: 0,
            type: 'PRIMARY_ACTION',
            onClick: e => {
                CreateEmailAsTemplateDialog(identifier);
                hideTemplatePopOutIfOpen(event);
            }
        },
        {
            text: 'Cancel',
            orderHint: 1,
            onClick: e => {
                SHCreateTemplateView.close();
                hideTemplatePopOutIfOpen(event);
            }
        }
    ];
    let title = '';
    let modalOptions = {
        title: title,
        el: mainDiv,
        buttons: popUpBtns
    };
    SHCreateTemplateView = sdkMain.Widgets.showModalView(modalOptions);

    if (usingNewGmail) {
        let SHModalContainer = SHCreateTemplateView._modalViewDriver._modalContainerElement;
        let modalBtnContainer = SHModalContainer.querySelector('.inboxsdk__modal_buttons');
        let modalTopRow = SHModalContainer.querySelector('.inboxsdk__modal_toprow');
        let modalContentContainer = SHModalContainer.querySelector('.inboxsdk__modal_content');
        let modalContainer = SHModalContainer.querySelector('.inboxsdk__modal_container');

        modalBtnContainer.id = 'CreateCustom';
        modalBtnContainer = modalBtnContainer.cloneNode(true);
        modalTopRow.classList.add('hidden');
        modalTopRow.firstElementChild.classList.add('hidden');
        modalTopRow.lastElementChild.classList.add('hidden');
        modalContainer.classList.add('template-modal-container');
        modalContentContainer.id = 'CreateBodyCustom';
        let defaultTemplateName = 'Template - ' + moment().format('DD MMM YYYY');

        modalContentContainer.innerHTML = `
        <div id="blur" class="hidden"></div>
        <div class="template-modal-header template-modal-sections">
           <input class="template-modal-input template-title-input" type="text" name="template-title-input" autocomplete="off" placeholder="Template name"/>
           <div class="template-modal-header-btns">
              <span class="template-modal-header-btn template-modal-close-btn" aria-label="Close" data-tooltip-delay="800" data-tooltip="Close"></span>
           </div>
        </div>
        <div class="template-modal-form-row">
            <div class="template-modal-select-container" template_id="${templateId}" folder_id="${openFolderId ||
            '0'}"><div class="SelectedFolderIcon MyTemplatesIcon"></div><div class="SelectedFolderName">My templates</div></div>
         </div>
         <div class="template-modal-form-row template-modal-tab-container">
           <div class="template-modal-tab-inner-container">
                <div class="template-modal-tab ripple active-tab" data-tab-index="0" >Template</div>
            </div>
            <div class="template-modal-tab-inner-container">
                <div class="template-modal-tab ripple share-tab" data-tab-index="1" >Sharing</div>
            </div>
         </div>
         <div class="template-modal-tab-sections">
            <div class="template-modal-template-tab-section">
                <div class="template-modal-form template-modal-sections">
                <div class="template-modal-form-row template-subject-snippet">
                    <input class="template-modal-input template-subject-input" type="text" name="template-subject-input" autocomplete="off" placeholder="Subject"/>
                    <span class="template-modal-input-wrapper">
                        <input class="template-modal-input template-shortcut-input" type="text" name="template-shortcut-input" autocomplete="off" placeholder="Shortcut"/>
                    </span>
                </div>
                </div>
                <div class="template-modal-body template-modal-sections">
                    <div id="summernote"></div>
                </div>
            </div>
            <div class="template-modal-template-tab-section">
                <div class="MainSharePopUpDiv">
                    <div class="ShareTemplateBody">
                        <div class="SharePopUpBody" team_list="">
                            <div class="labelsOnSharePopUp orgLabel">Organization</div>
                            <div class="sh_sidebar_pref_wrapper">
                                <label class="switch">
                                <input  type="checkbox" class="ShareWithAllOrganization">
                                <span class="slider round"></span>
                                <span class="sh_slider_caption">Everyone in Organization</span>
                                </label>
                            </div>
                            <div class="labelsOnSharePopUp teamLabel">Team</div>
                        </div>
                    </div>
                    <div class="ShareTemplateFooter">
                        <div class="ShareTemplateFooterText">Preferences</div>
                        <div class="md-radio">
                            <input id="edit" class="ShareRadio" type="radio" name="g" checked="true"/>
                            <label for="edit">Can view & edit</label>
                        </div>    
                        <div class="md-radio">
                            <input id="view" class="ShareRadio" type="radio" name="g" checked="" />
                            <label for="view">Can view</label>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

        let templateModalFolderSelect = modalContainer.querySelector('.template-modal-select-container');
        let TemplateSubject = modalContainer.querySelector('.template-subject-input');
        let TemplateShortcut = modalContainer.querySelector('.template-shortcut-input');
        if (identifier === 'add') {
            let TemplateTitle = modalContainer.querySelector('.template-title-input');
            TemplateTitle.value = defaultTemplateName;
            tippy(TemplateShortcut.parentElement, {
                content:
                    'Use shortcut to quickly insert the template. <a class="whiteLink" href="https://help.saleshandy.com/article/141-how-to-use-email-template-shortcuts-in-gmail"  target="_blank">Know more</a>',
                placement: 'bottom-end',
                interactive: true,
                maxWidth: 400,
                a11y: false
            });
        }

        let MainSharePopUpDiv = $('.MainSharePopUpDiv')[0];
        let ShareTemplateBody = $('.ShareTemplateBody')[0];
        if (MainSharePopUpDiv) {
            let teamLabel = MainSharePopUpDiv.querySelector('.teamLabel');
            if (!oTeamData || oTeamData.length === 0) {
                teamLabel && teamLabel.parentElement && teamLabel.parentElement.removeChild(teamLabel);
            } else {
                ShareTemplateBody.insertAdjacentHTML(
                    'beforeend',
                    oTeamListView({
                        oTeamData: oTeamData,
                        sView: ''
                    })
                );
                if (identifier === 'update') {
                    if (oTemplateData && oTemplateData.teams && oTemplateData.teams.length > 0) {
                        let teamList = oTemplateData.teams.map(item => {
                            return item.id;
                        });
                        teamList &&
                            teamList.forEach(team => {
                                let teamCheckBox = MainSharePopUpDiv.querySelector('input[team_id="' + team + '"]');
                                teamCheckBox && (teamCheckBox.checked = true);
                            });
                    }
                    let AllOrg = MainSharePopUpDiv.querySelector('.ShareWithAllOrganization');
                    if (oTemplateData.public) {
                        AllOrg.checked = true;
                        onTeamOptionToggle(undefined, AllOrg);
                    } else {
                        teamLabel && teamLabel.classList.remove('hidden');
                        Array.from(MainSharePopUpDiv.querySelectorAll('.sh_team_select_box')).forEach(teamInput => {
                            teamInput && teamInput.classList.remove('hidden');
                        });
                    }
                    let radioViewandEdit = MainSharePopUpDiv.querySelector('#edit');
                    if (oTemplateData.shared_access.can_edit) {
                        radioViewandEdit.checked = true;
                    }
                    if (oTemplateData.public !== true && !(teamList && teamList.length > 0 && teamList[0])) {
                        Array.from(MainSharePopUpDiv && MainSharePopUpDiv.querySelectorAll('.md-radio')).forEach(radioBtn => {
                            radioBtn && radioBtn.classList && radioBtn.classList.add('disableRadio');
                        });
                    } else {
                        Array.from(MainSharePopUpDiv && MainSharePopUpDiv.querySelectorAll('.md-radio')).forEach(radioBtn => {
                            radioBtn && radioBtn.classList && radioBtn.classList.remove('disableRadio');
                        });
                    }
                } else {
                    Array.from(MainSharePopUpDiv && MainSharePopUpDiv.querySelectorAll('.md-radio')).forEach(radioBtn => {
                        radioBtn && radioBtn.classList && radioBtn.classList.add('disableRadio');
                    });
                }
            }
        }
        $('.template-modal-tab').on('click', changeTab);
        $('.ShareWithAllOrganization').on('change', onTeamOptionToggle);
        $('.Team_Share_With').on('change', onTeamOptionToggle);

        getTemplateFolderList().then(res => {
            if (!res.error) {
                templatesDataStore.templatesFolderData = res;
                if (templateModalFolderSelect) {
                    templateModalFolderSelect.insertAdjacentHTML(
                        'beforeend',
                        oFoldersTemplateCreate({
                            oFoldersData: res,
                            sUserId: userPreferencesRes.id,
                            openFolderId: openFolderId
                        })
                    );                    
                    hideCreateTemplateFolderSearchPopUp();
                    let Searchbox = templateModalFolderSelect.querySelector('.TemplateModalFolderSearch');
                    Searchbox.removeEventListener('keyup', FolderSearchOption);
                    Searchbox.addEventListener('keyup', FolderSearchOption);
                    let popUpView = document.querySelector('.inboxsdk__modal_container');
                    let openedFolder = res.filter(function(item) {
                        return item.id === openFolderId;
                    });
                    let userPrevilagesVerification = popUpView && popUpView.querySelector('.Selected');
                    if (userPrevilagesVerification === null) {
                        openFolderId = null;
                    }
                    let FolderSelect = popUpView.querySelector('.template-modal-select-container');
                    openFolderId && FolderSelect.setAttribute('folder_id', openFolderId);
                    let SelectedFolderName = FolderSelect.querySelector('.SelectedFolderName');
                    setSelectOption(res, openFolderId);
                    let openedFolderName = openedFolder && openedFolder[0] && openedFolder[0].name;
                    if (openFolderName && openFolderName !== 'null') {
                        if (!openedFolderName && identifier === 'add') {
                            WarningPopUp({
                                error: true,
                                error_title: 'Info',
                                error_message: `You don't have permission to create template in ${
                                    openFolderName ? '<b>' + openFolderName + '</b>' : 'the selected folder'
                                }<br> Your template will be created in My templates.`
                            });
                        }
                    }
                    SelectedFolderName && SelectedFolderName.innerHTML;
                    let templateSelectDropDown = modalContentContainer.querySelector('.template-modal-select');
                    let folderOptionToSelect =
                        templateSelectDropDown && templateSelectDropDown.querySelector(`.optionFolder[folder-name='${openedFolderName}']`);
                    if (!FolderSelect.classList.contains('LockonShared')) {
                        selectTemplateFolder(folderOptionToSelect);
                    }
                }
            } else {
                onError(res);
            }
        });
        // ShareEmailTemplatePopUp();
        if (isUserTemplateOwner) {
            modalContainer.removeEventListener('click', onTemplateModalFolderSelect);
            modalContainer.addEventListener('click', onTemplateModalFolderSelect);
        }
        TemplateSubject.removeEventListener('blur', onSubjectInputBlur);
        TemplateSubject.addEventListener('blur', onSubjectInputBlur);
        TemplateShortcut.removeEventListener('input', onShortcutChange);
        TemplateShortcut.addEventListener('input', onShortcutChange);
        let closeBtnContainer = SHModalContainer.querySelector('.template-modal-close-btn');

        closeBtnContainer &&
            closeBtnContainer.addEventListener('click', () => {
                let templateContent = $('#summernote').summernote('code');
                let tempDiv = document.createElement('div');
                tempDiv.innerHTML = templateContent;
                templateContent = tempDiv.innerText;
                if (templateContent.length > 5) {
                    return WarningPopUp({
                        error: true,
                        error_title: 'Warning',
                        error_message: `Your changes will be lost if you discard.`,
                        cancel_btn: {
                            text: 'Discard',
                            class: 'discardBtn',
                            onClick: discardEditorChanges
                        },
                        okay_btn: {
                            text: 'Cancel',
                            class: 'cancelDiscardBtn',
                            onClick: () => {
                                return;
                            }
                        }
                    });
                } else {
                    discardEditorChanges();
                }
            });
        if (!hideDocuments) {
            var InsertDocumentBtn = function(context) {
                var ui = $.summernote.ui;
                var button = ui.button({
                    className: 'note-insert-document',
                    contents: ui.icon('note-icon-insert-document'),
                    tooltip: 'Insert document for tracking',
                    container: 'body',
                    click: function(e) {
                        renderCrossPlatformModal('documents', undefined, 'editor');
                        hideTemplatePopOutIfOpen(e);
                    },
                    callback: function(button) {}
                });

                return button.render();
            };
        }
        var InsertTemplateBtn = function(context) {
            var ui = $.summernote.ui;
            var button = ui.button({
                className: 'note-insert-template',
                contents: ui.icon('note-icon-insert-template'),
                tooltip: 'Insert template',
                container: 'body',
                click: function(e) {
                    $('#summernote').summernote('editor.saveRange');
                    toggleTemplatePopOut(e);
                },
                callback: function(button) {}
            });

            return button.render();
        };
        let mixedMode = {
            name: 'htmlmixed',
            scriptTypes: [
                { matches: /\/x-handlebars-template|\/x-mustache/i, mode: null },
                { matches: /(text|application)\/(x-)?vb(a|script)/i, mode: 'vbscript' }
            ]
        };
        $('#summernote').summernote({
            height: '100%',
            callbacks: {
                onInit: function() {
                    setTimeout(() => {
                        $('.template-subject-input').focus();
                    }, 1000);
                },
                onImageUpload: function(data) {
                    data.pop();
                    WarningPopUp({
                        error: true,
                        error_title: 'Info',
                        error_message: `Pasting images is not allowed.<br>Please use the <i class="note-icon-picture"></i> (insert image) option of the editor.`
                    });
                },
                onImageLinkInsert: function(data) {
                    const dataURLRegExp = new RegExp(/^data:((?:\w+\/(?:(?!;).)+)?)((?:;[\w=]*[^;])*),(.+)$/g);
                    if (dataURLRegExp.test(data)) {
                        data = '';
                        WarningPopUp({
                            error: true,
                            error_title: 'Info',
                            error_message: `Please get a http or https link for the image. <a href="https://help.saleshandy.com/article/25-how-to-insert-image-in-email-campaign-email-template-or-email-body" target="_blank">Know more</a>`
                        });
                    } else {
                        $('#summernote').summernote('insertImage', data);
                    }
                }
            },
            toolbar: [
                ['fontsize', ['fontname', 'fontsize', 'height']],
                ['style', ['bold', 'italic', 'underline', 'clear']],
                ['color', ['color']],
                [('style', ['bold', 'italic', 'underline', 'clear'])],
                ['para', ['paragraph', 'ul', 'ol']],
                ['insert', ['link', 'picture', 'table']],
                ['insertcustom', ['insertDocument', 'InsertTemplate']],
                ['code', ['codeview']],
                ['help', ['help']]
            ],
            buttons: {
                insertDocument: InsertDocumentBtn,
                InsertTemplate: InsertTemplateBtn
            },
            prettifyHtml: true,
            codemirror: {
                // codemirror options
                theme: 'monokai',
                lineNumbers: true,
                // mode: 'htmlmixed',
                smartIndent: true,
                lineWrapping: true,
                fixedGutter: false,
                mode: mixedMode
            },
            dialogsInBody: true,
            dialogsFade: true, // Add fade effect on dialogs,
            fontNames: [
                'Arial Black',
                'Arial',
                'Comic Sans MS',
                'Courier New',
                'Georgia',
                'Helvetica',
                'Lucida',
                'RobotoDraft',
                'Tahoma',
                'Times New Roman',
                'Trebuchet',
                'Verdana',
                'Roboto',
                'sans-serif'
            ],
            tableClassName: function() {
                $(this)
                    .attr('cellpadding', 12)
                    .attr('cellspacing', 0)
                    .attr('border', 1);

                $(this)
                    .find('td')
                    .css('borderColor', '#ccc')
                    .css('padding', '5px');
            },
            fontNamesIgnoreCheck: [
                'Arial Black',
                'Arial',
                'Comic Sans MS',
                'Courier New',
                'Georgia',
                'Helvetica',
                'Lucida',
                'RobotoDraft',
                'Tahoma',
                'Times New Roman',
                'Trebuchet',
                'Verdana',
                'Roboto',
                'sans-serif'
            ],
            popover: {
                image: [
                    ['custom', ['imageAttributes']],
                    ['imagesize', ['imageSize100', 'imageSize50', 'imageSize25']],
                    ['float', ['floatLeft', 'floatRight', 'floatNone']],
                    ['remove', ['removeMedia']]
                ],
                link: [['link', ['linkDialogShow', 'unlink']]],
                table: [
                    ['add', ['addRowDown', 'addRowUp', 'addColLeft', 'addColRight']],
                    ['delete', ['deleteRow', 'deleteCol', 'deleteTable']]
                ]
            },
            imageAttributes: {
                icon: '<i class="note-icon-pencil"/>',
                removeEmpty: false, // true = remove attributes | false = leave empty if present
                disableUpload: true // true = don't display Upload Options | Display Upload Options
            }
        });
        $('#summernote').on('summernote.image.link.insert', function(we, files) {
            // upload image to server and create imgNode...
            $summernote.summernote('insertNode', imgNode);
        });

        $('.note-toolbar').on('click', function() {
            $('.note-popover.note-link-popover') &&
                $('.note-popover.note-link-popover')[0] &&
                ($('.note-popover.note-link-popover')[0].style.display = 'none');
        });
        // document.querySelector(replyWindowClass).addEventListener('scroll', hideTemplatePopOutIfOpen);
        $('#CreateBodyCustom') && $('#CreateBodyCustom').removeClass('Kj-JD-Jz');
        $('#summernote').summernote('fontSize', '13px');
        $('#summernote').summernote('fontName', 'sans-serif,arial');
    }
}

function discardEditorChanges() {
    let shareTemplatePopUpView = document.querySelector('.MainSharePopUpDiv');
    let blurView = document.querySelector('#blur');
    SHCreateTemplateView && SHCreateTemplateView.close();
    shareTemplatePopUpView && shareTemplatePopUpView.remove();
    blurView && blurView.remove();
}
function onTemplateModalFolderSelect(event) {
    let targetNode = event && event.target;
    let FolderOption = getNodeIfClicked(targetNode, 'optionFolder');
    let SearchBox = getNodeIfClicked(targetNode, 'SearchBoxCreateTemplate');
    let FolderSearchPopUp = getNodeIfClicked(targetNode, 'template-modal-select-container');
    let createPopUp = getNodeIfClicked(targetNode, 'template-modal-container');
    let folderSelectBtn = getNodeIfClicked(targetNode, 'folderSelectBtn');
    let createPopOutBody = targetNode && targetNode.closest('.template-modal-container');
    if (createPopOutBody) {
        if (folderSelectBtn) {
            setTemplateFolder(folderSelectBtn);
        } else if (FolderOption) {
            selectFolder(FolderOption);
        } else if (SearchBox) {
            return;
        } else if (FolderSearchPopUp) {
            CreatePopUpFolderDisplay(FolderSearchPopUp);
        } else if (createPopUp) {
            hideCreateTemplateFolderSearchPopUp();
        }
    }
}

function changeTab(e) {
    let templateModalTabs = $('.template-modal-tab');
    templateModalTabs.removeClass('active-tab');
    let clickedTab = $(this);
    if (clickedTab.hasClass('LockonShared')) {
        return;
    }
    clickedTab && clickedTab.addClass('active-tab');
    let templateModal = $('.template-modal-container');
    let modalWidth = templateModal.width();
    let clickedTabIndex = clickedTab.data('tab-index');
    try {
        clickedTabIndex = parseInt(clickedTabIndex, 10);
    } catch (e) {
        clickedTabIndex = 0;
    }
    let translateValue = clickedTabIndex * modalWidth;
    let tabSection = $('.template-modal-tab-sections');
    tabSection.css({
        transform: 'translateX(' + -translateValue + 'px)'
    });
}
