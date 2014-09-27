define([
    'dojo/_base/declare',
    'dijit/_WidgetsInTemplateMixin',
    'dijit/form/Button',
    'dijit/form/CheckBox',
    'dijit/Dialog',
    'dijit/TooltipDialog',
    'dijit/layout/TabContainer',
    'dijit/layout/ContentPane',
    'dojo/_base/lang',
    'dojo/_base/fx',
    'dojo/_base/array',
    'dojo/dom',
    'dojo/dom-construct',
    'dojo/dom-style',
    'dojo/request',
    'dojo/request/script',
    'dojo/topic',
    'dojo/number',
    'dojox/lang/functional',
    'dijit/TitlePane',
    'dojo/text!./WelWhatDisHelpAbout/templates/WelWhatDisHelpAboutDialog.html'
    ], function(declare, _WidgetsInTemplateMixin, Button, CheckBox, Dialog, TooltipDialog, TabContainer, ContentPane, lang, baseFx, array, dom, domConstruct, Style, request, script, topic, number, functional, TitlePane, welWhatDisHelpAboutTemplate) {

    //anonymous function to load CSS files required for this module
    (function() {
        var css = [require.toUrl('gis/dijit/WelWhatDisHelpAbout/css/WelWhatDisHelpAbout.css')];
        var head = document.getElementsByTagName('head').item(0),
            link;
        for (var i = 0, il = css.length; i < il; i++) {
            link = document.createElement('link');
            link.type = 'text/css';
            link.rel = 'stylesheet';
            link.href = css[i].toString();
            head.appendChild(link);
        }
    }());

    return declare([Dialog, _WidgetsInTemplateMixin], {
        templateString: welWhatDisHelpAboutTemplate,
        title: 'Hamilton County Map Viewer',
        draggable: true,
        baseClass: 'welWhatDisHelpAboutDijit',
        timelineWidth: 190,
        summaryColor: '#FF0000',
        timelineColors: ['#00FF00', '#0000FF', '#FFFF00', '#00FFFF', '#FF00FF'],
        showAtStartup: true,
        showStartupMetrics: false,
        getPermissions: false,
        permissionsFile: null,
        permissionsGroup: 'Public',
        progressDijitOpen: false,
        progressIds: ['total_startup_time'],
        progressLabels: ['Total Startup Time'],
        activePublishers: [],
        startTimes: {},
        endTimes: {},
        totalTimeNode: null,
        appStartTime: null,
        appEndTime: null,
        startTimeInitialized: false,
        removePublisherDelay: 1000,
        closeProgressDelay: 20000,
        fadeTime: 1000,
        devEmail: null,
        postCreate: function() {
            this.inherited(arguments);
            
            topic.subscribe('APPLY_USER_PREFERENCES', lang.hitch(this, function(e) {
                this._updateUserPreferences(e);
            }));
            
            if (!this.showStartupMetrics) {
                this.closeProgress();
            } else {
                this.handle = topic.subscribe('STARTUP_METRICS', lang.hitch(this, function(e) {
                    if (this.timer2) { clearInterval(this.timer2); }
                    var progressNode = dom.byId(e.id);
                    if (progressNode) {
                        var value = e.value;
                        if (e.value === 'Complete') {
                            // When a bar is complete, remove the publisher from the activePublishers array (after a brief delay)
                            setTimeout(lang.hitch(this, 'removePublisher', e.id), this.removePublisherDelay);
                            var nodeEndTime = new Date().getTime();
                            var appEndTime = nodeEndTime;
                            this.endTimes['total_startup_time'] = appEndTime;
                            this.endTimes[e.id] = nodeEndTime;
                            var nodeStartTime = this.startTimes[e.id];
                            if (nodeEndTime && nodeStartTime) {
                                var elapsedTime = number.format((nodeEndTime - nodeStartTime) / 1000, { pattern: '##.00' });
                                value = elapsedTime + ' sec';
                                this.totalTimeNode.innerHTML = number.format((appEndTime - this.appStartTime) / 1000, { pattern: '##.00' }) + ' sec';
                                this.createTimelines();
                            }
                        }
                        progressNode.innerHTML = value;
                    } else {
                        // Add the publisher to the list of active publishers
                        this.activePublishers.push(e.id);

                        if (this.startTimeInitialized) {
                            // Close the dialog to add a new bar
                            if (this.showAtStartup) { this.closeProgress(); }
                        } else {
                            // Create the 'total_startup_time' bar if this is the first message received
                            this.startTimeInitialized = true;
                            this.startTimes['total_startup_time'] = this.appStartTime;
                            var progressDate = new Date().toString();
                            progressDate = progressDate.slice(0, progressDate.indexOf('('));
                            this.progressTitle.innerHTML = '<b>Startup Metrics: ' + progressDate + '</b>';
                            var record = domConstruct.create('tr', { 
                                innerHTML: '<td style="text-align:right;">Total Startup Time</td>' +
                                           '<td id="total_startup_time">0.00 sec</td>' +
                                           '<td id="total_startup_time_bar"></td>'
                            }, this.progressTable, 'first');
                            this.totalTimeNode = dom.byId('total_startup_time');
                        }
                        
                        // Create a new bar
                        progressNode = domConstruct.create('tr', { 
                            innerHTML: '<td style="text-align:right;">' + e.label + '</td>' +
                                       '<td id="' + e.id + '" style="width:60px;">' + e.value + '</td>' +
                                       '<td id="' + e.id + '_bar" style="width:' + this.timelineWidth + 'px;"></td>'
                        }, this.progressTable, 'first');
                        this.progressIds.push(e.id);
                        this.progressLabels.push(e.label);
                        var startTime = new Date().getTime();
                        this.startTimes[e.id] = startTime;

                        // Open the dialog
                        if (this.showAtStartup) { this.openProgress(); }
                    }
                }));
            }
            
            // Initialize the global object to hold the permissions.  All widgets will have access to this.
            window.permissions = {};
            // Set the permissions group to 'Public'.  This is the default and will be updated if necessary, based on the client IP address.
            window.permissions.group = 'Public';
            
            if (this.getPermissions && typeof this.getPermissions === 'string') {
                script.get(this.getPermissions, {}).then(
                    lang.hitch(this, function(data) {
                        this.clientIP = clientIP;
                        if (this.permissionsFile && typeof this.permissionsFile === 'string') {
                            this.checkPermissions();
                        }
                    }), lang.hitch(this, function(error){
                        console.log('error:', error);
                    })
                );
            }
        },
        startup: function() {
            this.inherited(arguments);
            
            // Put the logic here on whether to show the widget or not, depending on the settings in the 
            // userPreferences cookie, whether the disclaimer has expired, and whether the notice is in effect.
            // this.showAtStartup = ???;
            
            // Set the startup checkboxes to agree with the parameters
            this.startupMetricsDijit.set('value', this.showStartupMetrics);
            this.startupMetricsDijit.set('checked', this.showStartupMetrics);

            this.startupDijit.set('value', this.showAtStartup);
            this.startupDijit.set('checked', this.showAtStartup);
            
            this.progressDijit.on('click', lang.hitch(this, 'closeProgress'));
            
            return this.showAtStartup;
        },
        checkPermissions: function() {
            request(this.permissionsFile, { handleAs: 'json' }).then(
                lang.hitch(this, function(data){
                    array.some(data.permissions, this.setPermissions, this);
                }), lang.hitch(this, function(error){
                    console.log('error:', error);
                })
            );
        },
        setPermissions: function(group, idx) {
            if (!clientIP) { return; }
            
            var clientOctets = this.clientIP.split('.');
            var i;
            
            // Check to see if the IP Address is less than the group's highest IP Address
            for (i = 0; i < 4; i++) {
                if (group.highIP[i] < clientOctets[i]) {
                    return false;
                }
            }
            
            // Check to see if the IP Address is greater than the group's lowest IP Address
            for (i = 0; i < 4; i++) {
                if (group.lowIP[i] > clientOctets[i]) {
                    return false;
                }
            }
            
            // If we haven't returned false, this must be the group
            window.permissions.group = group.groupName;
            for (var key in group) {
                if (array.indexOf(['groupName', 'lowIP', 'highIP'], key) === -1 && group.hasOwnProperty(key)) {
                    window.permissions[key] = group[key];
                }
            }
            return true;
        },
        removePublisher: function(publisher) {
            // This function is called after a brief delay to give other bars a chance to start
            var i = array.indexOf(this.activePublishers, publisher);
            if (i !== -1) { 
                this.activePublishers.splice(i, 1);
            }
            if (this.activePublishers.length === 0) {
                this.timer2 = setTimeout(lang.hitch(this, 'closeProgress', this.fadeTime, true), this.closeProgressDelay);
            }            
        },
        createTimelines: function() {
            var scaleFactor = this.timelineWidth / (this.endTimes['total_startup_time'] - this.startTimes['total_startup_time']);  //pixels per millisecond
            var iColor = 0;
            var color = this.summaryColor;
            array.forEach(this.progressIds, lang.hitch(this, function(key) {
                var left = Math.ceil((this.startTimes[key] - this.appStartTime) * scaleFactor);
                var width;
                if (this.endTimes[key]) {
                    width = Math.ceil((this.endTimes[key] - this.startTimes[key]) * scaleFactor);
                } else {
                    width = this.timelineWidth - left;
                }
                var node = dom.byId(key);
                var timeline = domConstruct.create('div', null, dom.byId(key + '_bar'), 'only');
                Style.set(timeline, 'position', 'relative');
                Style.set(timeline, 'height', '10px');
                Style.set(timeline, 'left', left + 'px');
                Style.set(timeline, 'width', width + 'px');
                Style.set(timeline, 'backgroundColor', color);
                color = this.timelineColors[iColor % this.timelineColors.length];
                iColor++;
            }));
        },
        openProgress: function(fadeInTime) {
            if (!this.startupMetricsDijit.get('checked')) { return; }
            
            if (!fadeInTime) {
                this.progressDropDownDijit.openDropDown();
            } else {
                Style.set(this.progressDijit.domNode, 'opacity', 0);
                this.progressDropDownDijit.openDropDown();
                baseFx.anim(this.progressDijit.domNode, {
                    opacity: 1
                }, fadeInTime);
            }
        },
        closeProgress: function(fadeOutTime, done) {
            if (done) { 
                this.unsubscribe(); 
            }
            if (!fadeOutTime) {
                this.progressDropDownDijit.closeDropDown();
            } else {
                baseFx.anim(this.progressDijit.domNode, {
                    opacity: 0
                }, fadeOutTime, null, lang.hitch(this, function() { 
                    this.progressDropDownDijit.closeDropDown(); 
                    Style.set(this.progressDijit.domNode, 'opacity', 1);
                }));
            }
        },
        _onStartupMetricsChange: function(evt) {
            window.userPreferences.showStartupMetrics = evt;
            topic.publish('USER_PREFERENCES', { showStartupMetrics: evt });
        },
        _onStartupChange: function(evt) {
            window.userPreferences.showWelcome = evt;
            topic.publish('USER_PREFERENCES', { showWelcome: evt });
        },
        _updateUserPreferences: function(prefObj) {
            var prefName = functional.keys(prefObj)[0];
            if (prefName === 'showWelcome') {
                startupDijit.value = prefObj[prefName];
            } else if (prefName === 'showStartupMetrics') {
                startupMetricsDijit.value = prefObj[prefName];
            }
        },
        _hideShowAtStartup: function() {
            this.startupDijitDiv.style.visibility = 'hidden';
        },
        _showShowAtStartup: function() {
            this.startupDijitDiv.style.visibility = 'visible';
        },
        sendToDeveloper: function() {
            var body = "Date," + this.progressTitle.innerHTML.slice(3, -4) + "%0D%0A";
            var lastLine;
            body += "Description%0D%0A%0D%0A";
            body += "Module,Start,Duration%0D%0A";
            array.forEach(this.progressIds, lang.hitch(this, function(key, idx) {
                if (key === 'total_startup_time') {
                    lastLine = this.progressLabels[idx] + "," + (this.endTimes[key] - this.startTimes[key]) / 1000 + "%0D%0A";
                } else {
                    body += this.progressLabels[idx] + "," + 
                            (this.startTimes[key] - this.startTimes['total_startup_time']) / 1000 + "," + 
                            (this.endTimes[key] - this.startTimes[key]) / 1000 + "%0D%0A";
                }
            }));
            body += lastLine;
            window.location = "mailto:" + this.devEmail + "?subject=JavaScript Viewer Startup Metrics&body=" + body; 
        },
        unsubscribe: function() {
            if (this.handle) {
                this.handle.remove();
                this.handle = null;
            }
        },
        stopTimer: function() {
            if (this.timer2) { 
                clearInterval(this.timer2); 
                this.timer2 = null;
            }
        },
        close: function() {
            if (this.progressDijit.domNode) {
                this.stopTimer();
                this.progressDropDownDijit.closeDropDown();
            }
            baseFx.anim(this.domNode, {
                opacity: 0
            }, this.fadeTime, null, lang.hitch(this, 'remove'));
        },
        remove: function() {
            this.hide();
        }
    });
});