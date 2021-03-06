// ==UserScript==
// @name             Get DLC Info from SteamDB
// @namespace        sak32009-get-dlc-info-from-steamdb
// @description      Get DLC Info from SteamDB
// @author           Sak32009
// @contributor      cs.rin.ru
// @version          3.6.9
// @license          MIT
// @homepageURL      https://github.com/Sak32009/GetDLCInfoFromSteamDB/
// @supportURL       http://cs.rin.ru/forum/viewtopic.php?f=10&t=71837
// @updateURL        https://github.com/Sak32009/GetDLCInfoFromSteamDB/raw/master/sak32009-get-dlc-info-from-steamdb.meta.js
// @downloadURL      https://github.com/Sak32009/GetDLCInfoFromSteamDB/raw/master/sak32009-get-dlc-info-from-steamdb.user.js
// @icon             https://raw.githubusercontent.com/Sak32009/GetDLCInfoFromSteamDB/master/sak32009-get-dlc-info-from-steamdb-32.png
// @icon64           https://raw.githubusercontent.com/Sak32009/GetDLCInfoFromSteamDB/master/sak32009-get-dlc-info-from-steamdb-64.png
// @match            *://steamdb.info/app/*
// @match            *://steamdb.info/search/*
// @require          https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @require          https://raw.githubusercontent.com/zewish/rmodal.js/master/dist/rmodal.min.js
// @require          https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.8/FileSaver.min.js
// @require          https://steamdb.info/static/js/tabbable.4f8f7fce.js
// @grant            GM.xmlHttpRequest
// @grant            GM_xmlhttpRequest
// @run-at           document-end
// ==/UserScript==

// MISSING
if (GM_info.scriptHandler !== "Tampermonkey") {
    GM_info.script.author = "Sak32009";
    GM_info.script.homepage = "https://github.com/Sak32009/GetDLCInfoFromSteamDB/";
    GM_info.script.supportURL = "http://cs.rin.ru/forum/viewtopic.php?f=10&t=71837";
    GM_info.script.icon = "https://raw.githubusercontent.com/Sak32009/GetDLCInfoFromSteamDB/master/sak32009-get-dlc-info-from-steamdb-32.png";
    GM_info.script.icon64 = "https://raw.githubusercontent.com/Sak32009/GetDLCInfoFromSteamDB/master/sak32009-get-dlc-info-from-steamdb-64.png";
}

if (typeof GM_xmlhttpRequest !== "function") {
    GM_xmlhttpRequest = GM.xmlHttpRequest;
}

// DOWNLOAD
const Download = {

    // WINDOWS LINE BREAK
    winLineBreak(str) {
        return str.replace(/\n/g, "\r\n");
    },

    // ENCODE
    encode(str) {
        return window.URL.createObjectURL(new Blob([this.winLineBreak(str)], {
            type: "application/octet-stream;charset=utf-8"
        }));
    },

    // AS
    as(fileName, fileContent) {
        saveAs(new Blob([this.winLineBreak(fileContent)], {
            type: "application/octet-stream;charset=utf-8"
        }), fileName);
    }

};

// STORAGE
const Storage = {

    // PREFIX
    prefix: `${GM_info.script.namespace}-`,

    // GET
    get(key) {
        return window.localStorage.getItem(this.prefix + key);
    },

    // SET
    set(key, value) {
        window.localStorage.setItem(this.prefix + key, value);
    },

    // REMOVE
    remove(key) {
        window.localStorage.removeItem(this.prefix + key);
    },

    // CLEAR
    clear() {
        window.localStorage.clear();
    },

    // IS VALID
    isValid(item) {
        return typeof item !== "undefined" && item !== null && item.length > 0;
    },

    // IS CHECKED
    isChecked(key) {
        return this.get(key) === "true";
    }

};

// MAIN
const GetDLCInfofromSteamDB = {

    // INFO
    info: {
        // AUTHOR
        author: GM_info.script.author,
        // NAME
        name: GM_info.script.name,
        // VERSION
        version: GM_info.script.version,
        // HOMEPAGE URL
        homepage: GM_info.script.homepage,
        // SUPPORT URL
        support: GM_info.script.supportURL,
        // STEAMDB URL
        steamDB: "https://steamdb.info/app/",
        // STEAMDB DEPOT
        steamDBdepot: "https://steamdb.info/depot/",
        // IS SEARCH PAGE?
        isSearchPage: $("#table-sortable .app[data-appid]").length
    },

    // STEAMDB
    steamDB: {
        // APPID
        appID: "",
        // APPID NAME
        appIDName: "",
        // APPID DLCS
        appIDDLCs: {},
        // APPID TOTAL DLCS
        appIDDLCsCount: 0
    },

    // OPTIONS
    options: {
        globalSaveLastSelectionAndAutoSubmit: {
            title: "Save the last selected format and submit form when you open the page",
            type: "select",
            options: {
                "true": "Yes",
                "false": "No"
            },
            default: "false"
        },
        globalAutoDownload: {
            title: "Automatically download file .INI",
            type: "select",
            options: {
                "true": "Yes",
                "false": "No"
            },
            default: "false"
        },
        globalIgnoreSteamDBUnknownApp: {
            title: "Ignore DLCs 'SteamDB Unknown App'",
            type: "select",
            options: {
                "true": "Yes",
                "false": "No"
            },
            default: "false"
        }
    },

    // RUN
    run() {

        // CHECK IF THE APPID HAS DLCs
        const checkHasDLCs = $(".tab-pane#dlc .app[data-appid], #table-sortable .app[data-appid]").length;

        if (checkHasDLCs) {
            // GET DATA
            this.getData();
            // CREATE INTERFACE
            this.createInterface();
            // FILL SELECT FORMATS
            this.fillSelectFormats();
            // CREATE GLOBAL OPTIONS TAB
            this.createTab("globalOptions", "Global Options", this.options);
            // LOAD OPTIONS
            this.loadOptions();
            // LOAD EVENTS
            this.loadEvents();
        }

    },

    // GET DATA
    getData() {

        // SET APPID
        this.steamDB.appID = (this.info.isSearchPage ? ($(".tab-pane.selected input#inputAppID").val() || "NOT_FOUND") : $(".scope-app[data-appid]").data("appid")).toString().trim();
        // SET APPID NAME
        this.steamDB.appIDName = (this.info.isSearchPage ? ($(".tab-pane.selected input#inputQuery").val() || "NOT FOUND") : $("td[itemprop='name']").text()).trim();

        // SET APPID DLCs
        if (!this.info.isSearchPage) {
            this.getDataDLCS();
        }

    },

    // GET DATA DLCS
    getDataDLCS() {

        $(".tab-pane#dlc .app[data-appid], #table-sortable .app[data-appid]").each((_index, _values) => {

            const $this = $(_values);

            // WORKAROUND
            if (this.info.isSearchPage && $this.find("td:nth-of-type(2)").text().trim() !== "DLC") {
                return;
            }

            const appID = $this.data("appid");
            const searchPageIndex = this.info.isSearchPage ? [3, 4] : [2, 3];
            const appIDName = $this.find(`td:nth-of-type(${searchPageIndex[0]})`).text().trim();
            const appIDTime = $this.find(`td:nth-of-type(${searchPageIndex[1]})`).data("sort");
            const appIDDate = $this.find(`td:nth-of-type(${searchPageIndex[1]})`).attr("title");

            // GET DEPOT DATA
            GM_xmlhttpRequest({
                method: "GET",
                url: this.info.steamDBdepot + appID,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                onload({responseText}) {

                    const $manifest = $($.parseHTML(responseText)).find("td:contains('Manifest ID')").closest("tr").find("td:nth-child(2)");

                    GetDLCInfofromSteamDB.steamDB.appIDDLCs[appID] = {
                        name: appIDName,
                        timestamp: appIDTime,
                        date: appIDDate,
                        manifestID: $manifest.length ? $manifest.text().trim() : 0
                    };

                    GetDLCInfofromSteamDB.steamDB.appIDDLCsCount += 1;

                }
            });

        });

    },

    // CREATE INTERFACE
    createInterface() {

        // ADD OPEN MODAL BUTTON
        $(`<div id="GetDLCInfofromSteamDB_openModal" style="position:fixed;bottom:0;right:0;margin-right:20px">
    <button type="button" class="btn btn-primary btn-block">${GM_info.script.name} <b>v${this.info.version}</b> <small>by ${this.info.author}</small></button>
</div>`).appendTo("body");

        // ADD MODAL CONTAINER
        $(`<div id="GetDLCInfofromSteamDB_modal" class="modal" style="display:none;background-color:rgba(0,0,0,.60);z-index:999999;position:fixed;top:0;left:0;right:0;bottom:0;overflow:auto">
    <div class="modal-dialog" style="max-width:900px;margin:auto;margin-top:30px;margin-bottom:30px;border-radius:4px;box-shadow:0 3px 9px rgba(0,0,0,.5);background-color:#fff">
        <div class="modal-header" style="text-align:center;padding:15px">
            <img src='${GM_info.script.icon64}' alt='${GM_info.script.name}' title='${GM_info.script.name}'>
            <h4 style="color:#006400">${GM_info.script.name} <b>v${this.info.version}</b> <small>by ${this.info.author}</small></h4>
        </div>
        <hr>
        <div class="modal-container">
            <div class="tabnav">
                <nav class="tabnav-tabs" style="padding-left:10px">
                    <a href="#" data-target="#GetDLCInfofromSteamDB_getDlcsList" class="tabnav-tab selected GetDLCInfofromSteamDB_tabNav">Get DLCs List</a>
                </nav>
            </div>
            <div class="tab-content" style="padding:0 15px">
                <div id="GetDLCInfofromSteamDB_getDlcsList" class="tab-pane selected">
                    <table class="table table-fixed">
                        <tbody>
                            <tr>
                                <td>
                                    <select id='GetDLCInfofromSteamDB_selectInput'></select>
                                    <button type='button' id="GetDLCInfofromSteamDB_submitInput" class='btn btn-primary'><i class='octicon octicon-clippy'></i> Get DLCs List</button>
                                </td>
                                <td style="text-align:right">
                                    <a href='javascript:;' class='btn' id='GetDLCInfofromSteamDB_downloadFile'><i class='octicon octicon-file-symlink-file'></i> Download File</a>
                                    <button type='button' class='btn btn-danger' id='GetDLCInfofromSteamDB_resetOptions'><i class='octicon octicon-trashcan'></i> Reset Options</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <textarea id='GetDLCInfofromSteamDB_textareaOutput' rows='20' style='width:100%'></textarea>
                </div>
            </div>
            <div style="text-align:center;padding:15px"><small>To close press ESC!</small></div>
        </div>
    </div>
</div>`).appendTo("body");

    },

    // FILL SELECT FORMATS
    fillSelectFormats() {

        // EACH
        $.each(this.formats, (_index, _values) => {

            const name = _values.name;
            const options = _values.options;

            // ADD OPTION
            const tag = $("<option>").attr("value", _index).text(name);

            // ..... SAVE LAST SELECTION
            if (Storage.isChecked("globalSaveLastSelectionAndAutoSubmit") && Storage.get("globalSaveLastSelectionValue") === _index) {
                tag.prop("selected", true);
            }
            // .....

            tag.appendTo("#GetDLCInfofromSteamDB_selectInput");

            // CREATE TAB
            this.createTab(_index, name, options);

        });

    },

    // LOAD EVENTS
    loadEvents() {

        // EVENT SUBMIT
        $(document).on("click", "#GetDLCInfofromSteamDB_submitInput", (e) => {

            e.preventDefault();

            // SELECTED FORMAT
            const selectedFormat = $("#GetDLCInfofromSteamDB_selectInput option:selected").val();
            // GET FORMAT DATA
            const formatData = this.formats[selectedFormat];
            const formatName = formatData.name;

            // WRITE INFO
            let result = `; ${this.info.name} by ${this.info.author} v${this.info.version}
; Format: ${formatName}
; AppID: ${this.steamDB.appID}
; AppID Name: ${this.steamDB.appIDName}
; AppID Total DLCs: ${this.steamDB.appIDDLCsCount}
; SteamDB: ${this.info.steamDB}${this.steamDB.appID}
; Homepage: ${this.info.homepage}
; Support: ${this.info.support}\n\n`;

            // CALLBACK
            const formatCallback = formatData.callback({
                info: result
            }, this);

            // CALLBACK CHECK TYPE
            if (typeof formatCallback === "object") {

                // GET DLCs
                result += this.bbcode(formatCallback.data);

                // WRITE RESULT
                $("#GetDLCInfofromSteamDB_textareaOutput").text(result).scrollTop(0);

                // SET DOWNLOAD FILE
                const setDwFile = $("#GetDLCInfofromSteamDB_downloadFile").attr({
                    href: Download.encode(result),
                    download: formatCallback.name
                });

                // ..... AUTO DOWNLOAD
                if (Storage.isChecked("globalAutoDownload")) {
                    setDwFile[0].click();
                }
                // .....

            }

            // ..... SAVE LAST SELECTION
            if (Storage.isChecked("globalSaveLastSelectionAndAutoSubmit")) {
                Storage.set("globalSaveLastSelectionValue", selectedFormat);
            }
            // .....

        });

        // ..... AUTO SUBMIT
        if (Storage.isChecked("globalSaveLastSelectionAndAutoSubmit")) {
            $("#GetDLCInfofromSteamDB_submitInput").trigger("submit");
        }
        // .....

        // SUBMIT OPTIONS
        $(document).on("submit", "form#GetDLCInfofromSteamDB_submitOptions", (e) => {

            e.preventDefault();

            // STORAGE SET
            $.each($(e.currentTarget).serializeArray(), (_index, {name, value}) => {
                Storage.set(name, value);
            });

            // ALERT
            window.alert("Options saved!");

        });

        // RESET OPTIONS
        $(document).on("click", "#GetDLCInfofromSteamDB_resetOptions", (e) => {

            e.preventDefault();

            // CONFIRM
            if (window.confirm("Do you really want to reset options?")) {
                // CLEAR
                Storage.clear();
                // LOAD OPTIONS
                this.loadOptions();
                // ALERT
                window.alert("Restored default options!");
            }

        });

        // STEAMDB - SHOW TABNAV
        $(document).on("click", ".GetDLCInfofromSteamDB_tabNav", (e) => {

            e.preventDefault();

            // SHOW
            $(e.currentTarget).tab("show");

        });

        // ..... MODAL
        const eventModalDom = new RModal(document.getElementById("GetDLCInfofromSteamDB_modal"));

        // SHOW
        $(document).on("click", "#GetDLCInfofromSteamDB_openModal button.btn-primary", (e) => {

            e.preventDefault();

            if (this.info.isSearchPage && $("#GetDLCInfofromSteamDB_alertSearchPage").length < 1) {

                $(`<div style="margin-bottom:10px" id="GetDLCInfofromSteamDB_alertSearchPage" class="btn btn-danger btn-block">Please wait! Extracting data from all pages!</div>`).prependTo("#GetDLCInfofromSteamDB_openModal");

                const interval = window.setInterval(() => {

                    GetDLCInfofromSteamDB.getDataDLCS();

                    const btnNext = $("#table-sortable_next");
                    if (btnNext.hasClass("disabled")) {
                        $("#GetDLCInfofromSteamDB_alertSearchPage").hide();
                        window.clearInterval(interval);
                        eventModalDom.open();
                    } else {
                        btnNext.click();
                    }

                }, 500);

            } else {
                eventModalDom.open();
            }

        });

        // HIDE
        $(document).on("keydown", (e) => {
            eventModalDom.keydown(e);
        });
        // .....

    },

    // LOAD OPTIONS
    loadOptions() {

        $("form#GetDLCInfofromSteamDB_submitOptions").find("input, select").each((_index, dom) => {

            const $this = $(dom);
            const name = $this.attr("name");
            const type = $this.attr("type");
            const tagName = $this.prop("tagName");
            const item = Storage.get(name);

            if (tagName === "SELECT" && Storage.isValid(item)) {
                $this.find(`option[value = '${item}']`).prop("selected", true);
            } else if (type === "checkbox" && item === "true") {
                $this.prop("checked", true);
            } else {
                $this.val(item);
            }

        });

    },

    // CREATE TAB
    createTab(key, name, options) {

        // CHECK IF OPTIONS IS EMPTY
        if (Object.keys(options).length > 0) {

            // ADD TABNAV-TAB
            $(`<a href='#' data-target='#GetDLCInfofromSteamDB_${key}' class='tabnav-tab GetDLCInfofromSteamDB_tabNav'>${name}</a>`).appendTo("#GetDLCInfofromSteamDB_modal .tabnav-tabs");

            // ADD TAB-PANE
            $(`<div id='GetDLCInfofromSteamDB_${key}' class='tab-pane'>
    <form id='GetDLCInfofromSteamDB_submitOptions' method='get'>
        <table class='table table-bordered table-fixed'>
            <tbody>${this.optionsToInput(options)}</tbody>
        </table>
        <button type='submit' class='btn btn-primary btn-block'>Save Options</button>
    </form>
</div>`).appendTo("#GetDLCInfofromSteamDB_modal .tab-content");

        }

    },

    // OPTIONS TO INPUT
    optionsToInput(options) {

        // RESULT
        let result = "";

        // EACH
        $.each(options, (_index, _values) => {

            // COMMON
            const title = _values.title;
            const type = _values.type;
            // INPUT PLACEHOLDER
            const placeholder = _values.placeholder || "";
            // SELECT
            const selectOptions = _values.options || {};
            const selectDefault = _values.default || "";

            result += `<tr><td>${title}</td><td>`;

            switch (type) {
                case "text":
                    {
                        result += `<input type='text' class='input-block' name='${_index}' placeholder='${placeholder}'>`;
                        break;
                    }
                case "checkbox":
                    {
                        result += `<input type='checkbox' name='${_index}'>`;
                        break;
                    }
                case "select":
                    {
                        result += `<select class='input-block' name='${_index}'>`;
                        $.each(selectOptions, (key, value) => {
                            result += `<option value='${key}' ${selectDefault === key ? "selected" : ""}>${value}</option>`;
                        });
                        result += "</select>";
                        break;
                    }
            }

            result += "</td></tr>";

        });

        return result;

    },

    // DLC LIST
    dlcList(str, indexFromZero, indexPrefix) {

        // RESULT
        let result = "";
        // INDEX START FROM ZERO
        let index = indexFromZero ? 0 : -1;

        // EACH
        $.each(this.steamDB.appIDDLCs, (_index, _values) => {

            const name = _values.name;
            const date = _values.date;
            const timestamp = _values.timestamp;
            const manifestID = _values.manifestID;

            // ..... IGNORE DLCs 'SteamDB Unknown App'
            if (!(Storage.isChecked("globalIgnoreSteamDBUnknownApp") && name.includes("SteamDB Unknown App"))) {

                index += 1;

                result += this.dlcInfoReplace(str, {
                    "dlc_id": _index,
                    "dlc_name": name,
                    "dlc_index": this.dlcIDPrefix(index.toString(), parseInt(indexPrefix)),
                    "dlc_timestamp": timestamp,
                    "dlc_date": date,
                    "dlc_manifest_id": manifestID
                });

            }
            // .....

        });

        return result;

    },

    // DLC INFO REPLACE
    dlcInfoReplace(str, values) {
        $.each(values, (_index, _value) => {
            str = str.replace(new RegExp(`{${_index}}`, "g"), _value);
        });
        return str;
    },

    // DLC ID PREFIX
    dlcIDPrefix(index, prefix) {
        const len = index.length;
        return prefix > len ? "0".repeat(prefix - len) + index : index;
    },

    // BBCODE
    bbcode(str) {

        let data;
        const re = /\[(\w+)(?:=(.*))?]([^[]+)\[\/(\w+)]/g;

        while ((data = re.exec(str)) !== null) {

            // GET DATA
            const [bbcode, bbcodeOpen, bbcodeOpt, bbcodeVal, bbcodeClose] = data;

            // CHECK
            if (bbcodeOpen === bbcodeClose) {

                const bbcodeOpts = typeof bbcodeOpt !== "undefined" ? bbcodeOpt.split(":") : [];

                switch (bbcodeOpen) {
                    case "steamdb":
                        {
                            str = str.replace(bbcode, this.steamDB[bbcodeVal]);
                            break;
                        }
                    case "option":
                        {
                            str = str.replace(bbcode, Storage.get(bbcodeVal));
                            break;
                        }
                    case "dlcs":
                        {
                            str = str.replace(bbcode, this.dlcList(bbcodeVal, bbcodeOpts[0] === "true", bbcodeOpts[1] || 0));
                            break;
                        }
                }

            }

        }

        return str;

    },

    // FORMATS
    formats: {
        // CREAMAPI
        creamAPI: {
            name: "CREAMAPI v3.4.1.0",
            callback({info}, app) {
                return {
                    name: "cream_api.ini",
                    data: `[steam]
; Application ID (http://store.steampowered.com/app/%appid%/)
appid = [steamdb]appID[/steamdb]
; Current game language.
; Uncomment this option to turn it on.
; Default is "english".
;language = german
; Enable/disable automatic DLC unlock. Default option is set to "false".
; Keep in mind that this option is highly experimental and won't
; work if the game wants to call each DLC by index.
unlockall = false
; Original Valve's steam_api.dll.
; Default is "steam_api_o.dll".
orgapi = steam_api_o.dll
; Original Valve's steam_api64.dll.
; Default is "steam_api64_o.dll".
orgapi64 = steam_api64_o.dll
; Enable/disable extra protection bypasser.
; Default is "false".
extraprotection = false
; The game will think that you're offline (supported by some games).
; Default is "false".
forceoffline = false
; Some games are checking for the low violence presence.
; Default is "false".
;lowviolence = true
; Installation path for the game.
; Note, that you can use ..\\ to set the parent directory (from where executable file is located).
; Maximum number of parent directories: 5 (..\\..\\..\\..\\..\\)
; Default is the path to current working directory.
;installdir = ..\\
; Use DLC id as the appended installation directory.
; e.g. <install_directory>\\480
; Default is "true".
;dlcasinstalldir = false
; Purchase timestamp for the DLC (http://www.onlineconversion.com/unix_time.htm).
; Default is "0" (1970/01/01).
;purchasetimestamp = 0
; Turn on the wrapper mode.
; Default is "false".
wrappermode = false

[steam_misc]
; Disables the internal SteamUser interface handler.
; Does have an effect on the games that are using the license check for the DLC/application.
; Default is "false".
disableuserinterface = false
; Disables the internal SteamUtils interface handler.
; Does have an effect on the games that are checking for the actual AppId (only matters when "wrappermode" is set to "true").
; Default is "false".
disableutilsinterface = false
; Disable the internal reserve hook of the "Steam_RegisterInterfaceFuncs" function.
; Default is "false".
disableregisterinterfacefuncs = false
; Unlock/Lock Steam parental restrictions.
; Default is "true".
;unlockparentalrestrictions = false
; SteamId64 to override. Note that this action could be risky !
; This option can only work if "disableuserinterface = false".
;steamid = 0
; Bypass VAC signature check. Note that this action could be risky !
; Default is "false".
;signaturebypass = true

[steam_wrapper]
; Application ID to override (used when the wrapper mode is on)
newappid = 0
; Use the internal storage system.
; Default is "false".
wrapperremotestorage = false
; Use the internal stats/achievements system.
; Default is "false".
wrapperuserstats = false
; Use the internal workshop (UGC) system.
; Default is "false".
wrapperugc = false
; Store the data in the current directory (incl. stats)
; By default the data is stored at: %appdata%/CreamAPI/%appid%/
; Default is "false".
saveindirectory = false
; Force the usage of a full save path instead of the relative one.
; Default is "false".
forcefullsavepath = false
; Disable internal callbacks system.
; Default is "false".
;disablecallbacks = true
; Disable/Enable a StoreStats callback. Takes effect only if "wrapperuserstats" is set to "true".
; Default is "true".
;storestatscallback = false
; Fixed achievements count.
; Some games can only work if this option is configured properly (e.g. Wolfenstein II).
; Default is "0".
achievementscount = 0

[dlc]
; DLC handling.
; Format: <dlc_id> = <dlc_description>
; e.g. : 247295 = Saints Row IV - GAT V Pack
; If the DLC is not specified in this section
; then it won't be unlocked
[dlcs]{dlc_id} = {dlc_name}\n[/dlcs]
[dlc_installdirs]
; Installation path for the specific DLC (dependent from "installdir" option).
; This section works only if "dlcasinstalldir" option is set to "false".
; Format: <dlc_id> = <install_dir>
; e.g. : 556760 = DLCRoot0

[steam_ugc]
; Subscribed workshop items.
; This section works only if "wrappermode" and "wrapperugc" options are set to "true".
; Format: <dlc_id> = <true/false>
; e.g. : 812713531 = true
; Please refer to __README_WORKSHOP_EN__.txt for more details.`
                };
            },
            options: {}
        },

        // CREAMAPI v3.3.0.0
        creamAPI_3_3_0_0: {
            name: "CREAMAPI v3.3.0.0",
            callback({info}, app) {
                return {
                    name: "cream_api.ini",
                    data: `[steam]
; Application ID (http://store.steampowered.com/app/%appid%/)
appid = [steamdb]appID[/steamdb]
; Current game language.
; Uncomment this option to turn it on.
; Default is "english".
;language = german
; Enable/disable automatic DLC unlock. Default option is set to "false".
; Keep in mind that this option is highly experimental and won't
; work if the game wants to call each DLC by index.
unlockall = false
; Original Valve's steam_api.dll.
; Default is "steam_api_o.dll".
orgapi = steam_api_o.dll
; Original Valve's steam_api64.dll.
; Default is "steam_api64_o.dll".
orgapi64 = steam_api64_o.dll
; Enable/disable extra protection bypasser.
; Default is "false".
extraprotection = false
; The game will think that you're offline (supported by some games).
; Default is "false".
forceoffline = false
; Some games are checking for the low violence presence.
; Default is "false".
;lowviolence = true
; Installation path for the game.
; Note, that you can use ..\\ to set the parent directory (from where executable file is located).
; Maximum number of parent directories: 5 (..\\..\\..\\..\\..\\)
; Default is the path to current working directory.
;installdir = ..\\
; Use DLC id as the appended installation directory.
; e.g. <install_directory>\\480
; Default is "true".
;dlcasinstalldir = false
; Purchase timestamp for the DLC (http://www.onlineconversion.com/unix_time.htm).
; Default is "0" (1970/01/01).
;purchasetimestamp = 0
; Turn on the wrapper mode.
; Default is "false".
wrappermode = false

[steam_misc]
; Disables the internal SteamUser interface handler.
; Does have an effect on the games that are using the license check for the DLC/application.
; Default is "false".
disableuserinterface = false
; Disables the internal SteamUtils interface handler.
; Does have an effect on the games that are checking for the actual AppId (only matters when "wrappermode" is set to "true").
; Default is "false".
disableutilsinterface = false
; Unlock/Lock Steam parental restrictions.
; Default is "true".
;unlockparentalrestrictions = false
; SteamId64 to override. Note that this action could be risky !
; This option can only work if "disableuserinterface = false".
;steamid = 0
; Bypass VAC signature check. Note that this action could be risky !
; Default is "false".
;signaturebypass = true

[steam_wrapper]
; Application ID to override (used when the wrapper mode is on)
newappid = 0
; Use the internal storage system.
; Default is "false".
wrapperremotestorage = false
; Use the internal stats/achievements system.
; Default is "false".
wrapperuserstats = false
; Use the internal workshop (UGC) system.
; Default is "false".
wrapperugc = false
; Store the data in the current directory (incl. stats)
; By default the data will is stored at: %appdata%/CreamAPI/%appid%/
; Default is "false".
saveindirectory = false
; Disable internal callbacks system.
; Default is "false".
;disablecallbacks = true
; Disable/Enable a StoreStats callback. Takes effect only if "wrapperuserstats" is set to "true".
; Default is "true".
;storestatscallback = false
; Fixed achievements count.
; Some games can only work if this option is configured properly (e.g. Wolfenstein II).
; Default is "0".
achievementscount = 0

[dlc]
; DLC handling.
; Format: <dlc_id> = <dlc_description>
; e.g. : 247295 = Saints Row IV - GAT V Pack
; If the DLC is not specified in this section
; then it won't be unlocked
[dlcs]{dlc_id} = {dlc_name}\n[/dlcs]
[dlc_installdirs]
; Installation path for the specific DLC (dependent from "installdir" option).
; This section works only if "dlcasinstalldir" option is set to "false".
; Format: <dlc_id> = <install_dir>
; e.g. : 556760 = DLCRoot0

[steam_ugc]
; Subscribed workshop items.
; This section works only if "wrappermode" and "wrapperugc" options are set to "true".
; Format: <dlc_id> = <true/false>
; e.g. : 812713531 = true
; Please refer to __README_WORKSHOP_EN__.txt for more details.`
                };
            },
            options: {}
        },
    
        // CREAMAPI v3.0.0.3 Hotfix
        creamAPI_3_0_0_3_h: {
            name: "CREAMAPI v3.0.0.3 Hotfix",
            callback({info}, app) {
                return {
                    name: "cream_api.ini",
                    data: `[steam]
; Application ID (http://store.steampowered.com/app/%appid%/)
appid = [steamdb]appID[/steamdb]
; Force the usage of specific language.
; Uncomment this option to turn it on.
;language = german
; Enable/disable automatic DLC unlock. Default option is set to "false".
; Keep in mind that this option is highly experimental and won't
; work if the game wants to call each DLC by index.
unlockall = false
; Original Valve's steam_api.dll.
; Default is "steam_api_o.dll".
orgapi = steam_api_o.dll
; Original Valve's steam_api64.dll.
; Default is "steam_api64_o.dll".
orgapi64 = steam_api64_o.dll
; Enable/disable extra protection bypasser.
; Default is "false".
extraprotection = false
; This option will force the usage of the default Steam user data folder.
; Default is "true".
;forceuserdatafolder = false
; The game will think that you're offline (supported by some games).
; Default is "false".
forceoffline = false
; Some games are checking for the low violence presence.
; Default is "false".
;lowviolence = true
; Disables the internal SteamUser interface handler.
; Does have an effect on the games that are using the license check for the DLC/application.
; Default is "false".
disableuserinterface = false
; Disables the internal SteamUtils interface handler.
; Does have an effect on the games that are checking for the actual AppId (only matters when "wrappermode" is set to "true").
; Default is "false".
disableutilsinterface = false
; Turn on the wrapper mode.
; Default is "false".
wrappermode = false

[steam_wrapper]
; Application ID to override (used when the wrapper mode is on)
newappid = 0
; Use the internal storage system.
; Default is "false".
wrapperremotestorage = false
; Use the internal stats/achievements system.
; Default is "false".
wrapperuserstats = false
; Store the data in the current directory (incl. stats)
; By default the data will is stored at: %appdata%/CreamAPI/%appid%/
; Default is "false".
saveindirectory = false
; Disable/Enable a StoreStats callback. Takes effect only if "wrapperuserstats" is set to "true".
; Default is "true"
;storestatscallback = false

[dlc]
; DLC handling.
; Format: <dlc_id> = <dlc_description>
; e.g. : 247295 = Saints Row IV - GAT V Pack
; If the DLC is not specified in this section
; then it won't be unlocked
[dlcs]{dlc_id} = {dlc_name}\n[/dlcs]`
                };
            },
            options: {}
        },

        // CREAMAPI v2.0.0.7
        creamAPI_2_0_0_7: {
            name: "CREAMAPI v2.0.0.7",
            callback({info}, app) {
                return {
                    name: "cream_api.ini",
                    data: `[steam]
; Application ID (http://store.steampowered.com/app/%appid%/)
appid = [steamdb]appID[/steamdb]
; Force the usage of specific language.
; Uncomment this option to turn it on.
;language = german
; Enable/disable automatic DLC unlock. Default option is set to "false".
; Keep in mind that this option is highly experimental and won't
; work if game wants to call each DLC by index.
unlockall = false
; Original Valve's steam_api.dll.
; Default is "steam_api_o.dll".
orgapi = steam_api_o.dll
; Original Valve's steam_api64.dll.
; Default is "steam_api64_o.dll".
orgapi64 = steam_api64_o.dll
; Enable/disable extra protection bypasser.
; Default is "false".
extraprotection = false
; ExtraProtection level.
; Default is "0".
; Available options :
; 0 = minimum, 1 = medium, 2 = maximum
extraprotectionlevel = 0
; Turn on the "light" wrapper mode.
; Default is "false".
wrappermode = false
; Enable/disable logging of the DLC functions.
; Default is "false".
; If you use log_build, uncomment this option to turn it on.
;log = false

[steam_wrapper]
; Application ID to override (used when the wrapper mode is on)
newappid = 0
; Load steam emulator library.
; Default is "false".
loademu = false
; Emulator library that is used for the stats
; and storage handling.
; Default is "emu.dll".
emudll = emu.dll
; Use the emulator storage system.
; Default is "false".
wrapperremotestorage = false
; Use the emulator stats/achievements system.
; Default is "false".
wrapperuserstats = false
; Use the emulator utils system.
; Default is "false".
wrapperutils = false
; User the emulator callbacks system.
; Default is "false".
wrappercallbacks = false

[dlc_subscription]
; This will check if the specifed
; DLC is owned by the user.
; Format: <dlc_id> = <true/false>
; e.g. : 12345 = true
;        12346 = true
;        12347 = true
; If the DLC is not specified in this section
; then it won't be subscribed.
; Also if the value is set to "false" the DLC
; won't be subscribed either.
[dlcs]{dlc_id} = true\n[/dlcs]
[dlc_index]
; DLC handling.
; Format: <dlc_index> = <dlc_id>
; e.g. : 0 = 12345
;        1 = 12346
;        2 = 12347
[dlcs]{dlc_index} = {dlc_id}\n[/dlcs]
[dlc_names]
; Names for the DLCs index put above.
; Use this only if needed.
; Format: <dlc_index> = <dlc_name>
; e.g. : 0 = DLC Name 0
;        1 = DLC Name 1
;        2 = DLC Name 2
[dlcs]{dlc_index} = {dlc_name}\n[/dlcs]
[dlc_timestamp]
; Specifies a unique unix timestamp for the purchased DLC (http://www.onlineconversion.com/unix_time.htm).
; By default returns the current date timestamp (if nothing was specified).
; Format: <dlc_id> = <timestamp>
; e.g. : 12345 = 1420070400`
                };
            },
            options: {}
        },

        // GREENLUMA BATCH MODE
        greenluma_batch_mode: {
            name: "GreenLuma [BATCH MODE]",
            callback({info}, app) {

                // BATCH
                const batch = info.replace(/; /g, ":: ") + `@ECHO OFF
TITLE ${app.steamDB.appIDName} - ${app.info.name} by ${app.info.author} v${app.info.version}
CLS

:: WINDOWS WORKING DIR BUG WORKAROUND
CD /D %~dp0

:: CHECK APPLIST DIR
IF EXIST .\\AppList\\NUL (
    RMDIR /S /Q .\\AppList\\
)

:: CREATE APPLIST DIR
MKDIR .\\AppList\\
:: CREATE DLCS FILES
:: ${app.steamDB.appIDName}
ECHO ${app.steamDB.appID}> .\\AppList\\0.txt
${app.dlcList(`:: {dlc_name}
ECHO {dlc_id}> .\\AppList\\{dlc_index}.txt\n`, true)}
:: OPTION START GREENLUMA AND GAME
IF EXIST .\\GreenLuma_Reborn.exe GOTO :Q
GOTO :EXIT

:Q
SET /P c=Do you want to start GreenLuma Reborn and the game now [Y/N]?
IF /I "%c%" EQU "Y" GOTO :START
IF /I "%c%" EQU "N" GOTO :EXIT
GOTO :Q

:START
CLS
ECHO Launching Greenluma Reborn...
ECHO Launching ${app.steamDB.appIDName}...
ECHO Click 'Yes' when asked to use saved App List
TASKKILL /F /IM steam.exe >nul 2>&1
TIMEOUT /T 2 >nul 2>&1
GreenLuma_Reborn.exe -applaunch ${app.steamDB.appID} -NoHook -AutoExit

:EXIT
EXIT`;

                // GENERATE
                Download.as(`${app.steamDB.appIDName}_AppList.bat`, batch);

            },
            options: {}
        },

        // GREENLUMA .ACF GENERATOR
        greenluma_acf_mode: {
            name: "GreenLuma [.ACF GENERATOR]",
            callback({info}, app) {

                // ACF
                const acf = `"InstalledDepots"
{

    ..... other data

${app.dlcList(`    "{dlc_id}"
    {
        "manifest" "{dlc_manifest_id}"
        "dlcappid" "{dlc_id}"
    }\n\n`)}}`;

                // GENERATE
                Download.as(`${app.steamDB.appID}_by_${app.info.author}_.acf`, acf);

            },
            options: {}
        },

        // LUMAEMU (ONLY DLCs LIST)
        lumaemu_only_dlcs: {
            name: "LUMAEMU v1.9.7 (ONLY DLCs LIST)",
            callback({info}, app) {
                return {
                    name: "LumaEmu_only_dlcs.ini",
                    data: "[dlcs]; {dlc_name}\nDLC_{dlc_id} = 1\n[/dlcs]"
                };
            },
            options: {}
        },

        // CODEX (DLC00000, DLCName)
        codex_t: {
            name: "CODEX (DLC00000, DLCName)",
            callback({info}, app) {
                return {
                    name: "steam_emu.ini",
                    data: "[dlcs=false:5]DLC{dlc_index} = {dlc_id}\nDLCName{dlc_index} = {dlc_name}\n[/dlcs]"
                };
            },
            options: {}
        },

        // 3DMGAME
        "3dmgame": {
            name: "3DMGAME",
            callback({info}, app) {
                return {
                    name: "3DMGAME.ini",
                    data: "[dlcs=true:3]; {dlc_name}\nDLC{dlc_index} = {dlc_id}\n[/dlcs]"
                };
            },
            options: {}
        },

        // SKIDROW
        skidrow: {
            name: "SKIDROW",
            callback({info}, app) {
                return {
                    name: "steam_api.ini",
                    data: "[dlcs]; {dlc_name}\n{dlc_id}\n[/dlcs]"
                };
            },
            options: {}
        },

        // NORMALLY (ID = NAME)
        normally_id_name: {
            name: "ID = NAME",
            callback({info}, app) {
                return {
                    name: "dlcs_id_name.ini",
                    data: "[dlcs]{dlc_id} = {dlc_name}\n[/dlcs]"
                };
            },
            options: {}
        }
    }

};

// RUN
GetDLCInfofromSteamDB.run();
