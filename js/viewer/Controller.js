// https://developers.arcgis.com/en/javascript/jssamples/widget_infowindowchart.html
// https://developers.arcgis.com/en/javascript/jshelp//inside_dojoLayouts.html
// http://forums.arcgis.com/threads/56496-InfoWindow-TabContainer
// http://livedocs.dojotoolkit.org/dijit/layout/TabContainer
//

define([
    'esri/map',
    'esri/dijit/Popup',  //lcs
    'esri/InfoTemplate',  //lcs
    'esri/dijit/InfoWindow',  //lcs
    'esri/dijit/Geocoder',
    'esri/graphic',  //lcs
    'esri/lang',  //lcs
    'esri/layers/FeatureLayer',
    'esri/layers/osm',
    'esri/request',
    'dojo/dom',
    'dojo/dom-construct',
    'dojo/dom-style',
    'dojo/dom-class',
    'dojo/on',
    'dojo/parser',
    'dojo/_base/array',
    'dijit/layout/BorderContainer',
    'dijit/layout/ContentPane',
    'dijit/layout/TabContainer',  //lcs
    'dijit/layout/StackContainer',  //lcs - required for the tabContainer.selectChild method
    'dijit/TitlePane',
    'dijit/popup',  //lcs
    'dijit/TooltipDialog',  //lcs
    'dojox/lang/functional',  //lcs
    'dojo/_base/window',
    'dojo/_base/lang',
    'dojo/io-query',  //lcs
    'gis/dijit/Growler',
    'gis/dijit/Helper',
    'gis/dijit/GeoLocation',
    'gis/dijit/WelWhatDisHelpAbout',  //lcs
    'gis/dijit/WelWhatDisHelpAboutSmall',  //lcs
    'gis/dijit/Basemaps',
    'dojo/text!./templates/mapOverlay.html',
    'viewer/config',
    'dojo/topic',  //lcs
    'dojo/number',  //lcs
    'dojo/_base/fx',  //lcs
    'dojo/json',  //lcs
    'dojo/cookie',  //lcs
    'dijit/form/Button',  //lcs
    'esri/IdentityManager',
    'esri/tasks/GeometryService'
], function(Map, Popup, InfoTemplate, InfoWindow, Geocoder, Graphic, esriLang, FeatureLayer, osm, esriRequest, dom, domConstruct, Style, domClass, on, parser, array, BorderContainer, ContentPane, TabContainer, StackContainer, TitlePane, dijitPopup, TooltipDialog, functional, win, lang, ioQuery, Growler, Helper, GeoLocation, WelWhatDisHelpAbout, WelWhatDisHelpAboutSmall, Basemaps, mapOverlay, config, topic, number, baseFx, JSON, cookie, Button, IdentityManager, GeometryService) {
        //lcs - Clicktips BEGIN
        var popup = Popup({titleInBody: false}, domConstruct.create("div"));
        Style.set(popup.domNode, "opacity", 0.90);

        // var infoWindow = new InfoWindow({}, dojo.create("div"));
        // infoWindow.startup();
        // infoWindow.setContent(getContent);

        // var template = new InfoTemplate();
        // template.setTitle("Title");
        // template.setContent(getContent);

        // function getContent(graphic) {
            // Destroy the tab container
            // if(dijit.byId('tabs')){
                // dijit.byId('tabs').destroy();
            // }

            // Make a tab container
            // var tc = new TabContainer({id: "tabs", style: "width:100%;height:100%;", useMenu: false, useSlider: false}, dojo.create("div"));
            // var tc = new TabContainer({id: "tabs", style: "width:100%;height:100%;"}, dojo.create("div"));

            // display attribute information
            // var cp1 = new ContentPane({
                // id: "details",
                // title: "Details",
                // content: "<b>Details<br>Coming<br>Soon</b>"
            // });
            // tc.addChild(cp1);

            // display a place holder for the size
            // var cp2 = new ContentPane({
                // id: "size",
                // title: "Size",
                // content: "<b>Size<br>Coming<br>Soon</b>"
            // });
            // tc.addChild(cp2);

            // display a place holder for the point clicked
            // var cp3 = new ContentPane({
                // id: "pointClicked",
                // title: "Point<br>Clicked",
                // content: "<b>Point<br>Clicked<br>Coming<br>Soon</b>"
            // });
            // tc.addChild(cp3);

            // display a place holder for the photos
            // var cp4 = new ContentPane({
                // id: "photos",
                // title: "Photos",
                // content: "<b>Photos<br>Coming<br>Soon</b>"
            // });
            // tc.addChild(cp4);

            // tc.startup();

            // return tc.domNode;
        // }
        //lcs - Clicktips END
    return {
        config: config,
        defaultCoordinatePt: new esri.geometry.Point(config.initialExtent.xmin, config.initialExtent.ymin),  //lcs
        legendLayerInfos: [],
        tocLayerInfos: [],  //lcs - to make the legend agree with the TOC
        editorLayerInfos: [],
        startup: function() {
            this.initConfig();
            this.initUserPreferences();
            this.initView();
            app = this; //dev only

            if (config.showSplashScreen) {
                this.showWelWhatDisHelpAbout(false, 500, new Date().getTime());
            }
        },
        initConfig: function() {
            esri.config.defaults.io.proxyUrl = config.proxy.url;
            esri.config.defaults.io.alwaysUseProxy = config.proxy.alwaysUseProxy;
            esri.config.defaults.geometryService = new GeometryService(config.geometryService.url);
        },
        initView: function() {
            this.outer = new BorderContainer({
                id: 'borderContainer',
                design: 'headline',
                gutters: false
            }).placeAt(win.body());

            this.sidebar = new ContentPane({
                id: 'sidebar',
                region: 'left'
            }).placeAt(this.outer);

            new ContentPane({
                region: 'center',
                id: 'map',
                content: mapOverlay
            }).placeAt(this.outer);

            this.outer.startup();
            this.initMap();
            
            //on(dom.byId('helpA'), 'click', lang.hitch(this, 'showHelp'));
            on(dom.byId('welWhatDisHelpAboutA'), 'click', lang.hitch(this, 'showWelWhatDisHelpAbout', true, 1000));
            this.sideBarToggle = dom.byId('sidebarCollapseButton');
            on(this.sideBarToggle, 'click', lang.hitch(this, 'toggleSidebar'));
            Style.set(this.sideBarToggle, 'display', 'block');
        },
        initUserPreferences: function() {
            // Set the default default user preferences (in case none were set in config.js)
            window.userPreferences = {
                showWelcome: true,
                showStartupMetrics: true,
                showMapTips: true,
                showMouseoverHighlight: true,
                showCoordinates: true,
                showScale: true,
                restoreMapExtent: true,
                restoreMapLayers: true
            };
            
            // Get the saved user preferences from the cookie
            var cookieObj = cookie('userPreferences');
            if (cookieObj === undefined) {
                cookieObj = {};
            } else {
                cookieObj = JSON.parse(cookieObj);
                this.userPreferencesCookie = true;
            }

            // The map extent and map layer settings may have been passed as URL parameters.  If so, convert them to JSON objects in the same format as user preferences.
            var urlParams = window.location.search.substr(window.location.search[0] === "?" ? 1 : 0);
            //var urlParams = 'contentType=raster&id=orthos_2013&mode=custom&opacity=1&contentType=0%2C1%2C2&id=zoning&mode=p&opacity=0.3&contentType=-1&id=topo&mode=p&opacity=0.5&contentType=-1&id=parcels&mode=p&opacity=0.5&contentType=-1&id=marathonPipelines&mode=p&opacity=1&contentType=-1&id=addressPoints&mode=p&opacity=1';
            //var urlParams = 'contentType=raster&id=orthos_2013&mode=custom&opacity=1&contentType=-1&id=buildings&mode=p&opacity=0.5&contentType=-1&id=topo&mode=p&opacity=1&contentType=-1&id=parcels&mode=p&opacity=0.5&contentType=-1&id=marathonPipelines&mode=p&opacity=1&contentType=-1&id=addressPoints&mode=p&opacity=1&type=extent&xmin=216985.41666666663&ymin=1757000&xmax=220514.5833333333&ymax=1760500&wkid=2965';
            var urlPrefs = this.urlParamsToPrefs(urlParams);

            // The priority of the user preferences is first from the URL parameters, then from the cookie, then from config.js, and finally from this function (default default).
            lang.mixin(window.userPreferences, config.userPreferenceDefaults, cookieObj, urlPrefs);
            
            // If an extent was in the URL or saved, use it; otherwise, use the configured initialExtent
            var userPref = window.userPreferences.restoreMapExtent;
            if (userPref && typeof userPref === 'object') {
                this.initialExtent = userPref;
            } else {
                this.initialExtent = config.initialExtent;
            }
            
            // If a basemap was in the URL or saved, use it; otherwise, use the configured basemap
            userPref = window.userPreferences.restoreMapLayers;
            if (userPref && typeof userPref === 'object' && userPref.basemap && userPref.basemap.mode && userPref.basemap.mode === config.basemapMode) {
                this.mapStartBasemap = userPref.basemap.id;
                this.mapStartBasemapContentType = userPref.basemap.contentType;
            } else {
                this.mapStartBasemap = config.mapStartBasemap;
                this.mapStartBasemapContentType = config.mapStartBasemapContentType;
            }
            
            // Listen for changes in the 'showCoordinates' and 'showScale' settings
            topic.subscribe('APPLY_USER_PREFERENCES', lang.hitch(this, function(userPref) {
                if (userPref === 'showCoordinates' || userPref === 'showScale') {
                    this.setCoordinateDisplayHandlers();
                }
            }));
        },
        urlParamsToPrefs: function(urlParams) {
            var paramsJson = ioQuery.queryToObject(urlParams);
            var rtn = {};
            
            // Process the map layers (looking for parameters: contentType, id, opacity, mode)
            var restoreMapLayers, lyrJson;
            if (paramsJson.contentType && paramsJson.id && paramsJson.opacity && paramsJson.mode) {
                restoreMapLayers = { version: '$v3', basemap: {}, operational: [] };
                array.forEach(paramsJson.contentType, lang.hitch(this, function(type, idx) {
                    lyrJson = { contentType: paramsJson.contentType[idx], id: paramsJson.id[idx], opacity: parseFloat(paramsJson.opacity[idx]), mode: paramsJson.mode[idx] };
                    if (type === 'vector' || type === 'raster') {
                        restoreMapLayers.basemap = lyrJson;
                    } else {
                        lyrJson.contentType = functional.map(lyrJson.contentType.split(','), 'parseInt(x, 10)');
                        restoreMapLayers.operational.push(lyrJson);
                    }
                }));
            }

            // Process the map extent (looking for parameters: type, xMax, xMin, yMax, yMin, and optionally, wkid)
            var restoreMapExtent;
            if (paramsJson.type && paramsJson.xmax && paramsJson.xmin && paramsJson.ymax && paramsJson.ymin) {
                restoreMapExtent = { type: paramsJson.type, xmax: parseFloat(paramsJson.xmax), xmin: parseFloat(paramsJson.xmin), ymax: parseFloat(paramsJson.ymax), ymin: parseFloat(paramsJson.ymin) };
                if (paramsJson.wkid) {
                    restoreMapExtent.spatialReference = { wkid: parseInt(paramsJson.wkid, 10) };
                }
            }
            
            if (restoreMapLayers) {
                rtn.restoreMapLayers = restoreMapLayers;
            }

            if (restoreMapExtent) {
                rtn.restoreMapExtent = restoreMapExtent;
            }

            return rtn;
        },
        initMap: function() {
            this.map = new esri.Map("map", {
                extent: new esri.geometry.Extent(this.initialExtent),
                infoWindow: popup,
                sliderStyle: 'large'
            });  //lcs - Clicktips - added infoWindow

            // this.map.infoWindow.on('show', function() {
                // dijit.byId("tabs").resize();
            // });

            //lcs - Clicktips BEGIN
            // This is how you make the popup bigger.
            // The width is absolute and the height is a maximum.
            this.map.infoWindow.resize(350, 400);
            //domClass.add(this.map.infoWindow.domNode, "myTheme");
            //lcs - Clicktips END

            // The 'load' event is triggered by loading the Basemaps Widget
            this.map.on('load', lang.hitch(this, 'initLayers'));
            
            // The 'layers-add-result' event is triggered by the 'initLayers' function
            this.map.on('layers-add-result', lang.hitch(this, 'initWidgets'));

            if (config.validateOperationalLayers) {  //lcs - Validate Operational Layers
                this.validateOperationalLayers();
            } else {
                this.loadBasemapWidget();
            }
        },
        validateOperationalLayers: function(evt) {
            this.badLayerIndices = [];
            var layersRequested = config.operationalLayers.length;
            var layersProcessed = 0;
            //console.log(1, 'config.operationalLayers:', config.operationalLayers);
            this.proceed = function() {
                //console.log(2, 'config.operationalLayers:', config.operationalLayers);
                //console.log('Proceed:', 21);
                // Remove bad layers from highest index to lowest
                this.badLayerIndices.sort(function(a, b) { return b - a; } );
                //console.log('Proceed:', 22);
                array.forEach(this.badLayerIndices, function(pos) {
                    config.operationalLayers.splice(pos, 1);
                    //console.log(3, 'config.operationalLayers:', config.operationalLayers);
                });
                //console.log('Proceed:', 23);
                // Now that we have weeded out the invalid operational layers, we can pass them
                // to the Basemaps widget.  Loading this widget will cause the map 'load' event to
                // fire which will cause the 'initLayers' function to execute.
                this.loadBasemapWidget();
            };
            array.forEach(config.operationalLayers, function(layer, i) {
                var deferred = esriRequest({
                    url: layer.url,
                    content: { f: "json" },
                    timeout: 10000,
                    handleAs: "json",
                    callbackParamName: "callback"
                });
                deferred.then(
                    lang.hitch(this, function(response) {
                    //console.log('response:', response);
                        layersProcessed++;
                        if (layersProcessed === layersRequested) { 
                            topic.publish('STARTUP_METRICS', { 
                                id: 'validating_operational_layers', 
                                label: 'Validating Operational Layers', 
                                value: 'Complete'
                            });
                            this.proceed(); 
                        } else {
                            topic.publish('STARTUP_METRICS', { 
                                id: 'validating_operational_layers', 
                                label: 'Validating Operational Layers', 
                                value: number.format(layersProcessed / layersRequested, { pattern: '##%' })
                            });
                        }
                    }), 
                    lang.hitch(this, function(error) {
                        layersProcessed++;
                        this.badLayerIndices.push(i);
                        //console.log('Error validating layer:', layer.url);
                        //console.log('error:', error);
                        //console.log('The', layer.title, 'layer was not added to the map.');
                        if (layersProcessed === layersRequested) {
                            //console.log('Failure:', 1);
                            topic.publish('STARTUP_METRICS', { 
                                id: 'validating_operational_layers', 
                                label: 'Validating Operational Layers', 
                                value: 'Complete'
                            });
                            //console.log('Failure:', 2);
                            this.proceed(); 
                            //console.log('Failure:', 3);
                        } else {
                            //console.log('Failure:', 11);
                            topic.publish('STARTUP_METRICS', { 
                                id: 'validating_operational_layers', 
                                label: 'Validating Operational Layers', 
                                value: number.format(layersProcessed / layersRequested, { pattern: '##%' })
                            });
                            //console.log('Failure:', 12);
                        }
                    })
                );
            }, this);
        },
        loadBasemapWidget: function() {
            this.basemaps = new Basemaps({
                map: this.map,
                mode: config.basemapMode,
                title: "Basemaps",
                mapStartBasemap: this.mapStartBasemap,
                basemapsToShow: config.basemapsToShow,
                opLayers: config.operationalLayers
            }, "basemapsDijit");
            if (config.basemapMode === 'custom') {
                var deferred = this.basemaps.validateCustomBasemapLayers();
                deferred.then(
                    lang.hitch(this, function(validLayers) {
                        this.basemaps.createMenu(validLayers);
                        this.basemaps.startup();  // lcs - moved this up into the deferred function
                    }),
                    lang.hitch(this, function(error) {
                        console.log('Error:', error);
                    })
                );
            } else {
                this.basemaps.createMenu();
                this.basemaps.startup();
            }
        },
        initLayers: function(evt) {
            this.setCoordinateDisplayHandlers();
            
            //lcs - MapTips BEGIN
            var dialog = new TooltipDialog({
                id: "tooltipDialog",
                style: "position: absolute; max-width: 300px; font: normal normal normal 10pt 'Comic Sans MS'; z-index: 100"
            });
            dialog.startup();
            //lcs - MapTips END

            this.layers = [];
            array.forEach(config.operationalLayers, function(layer) {
                var l, gl;
                if (layer.type === 'dynamic') {
                    l = new esri.layers.ArcGISDynamicMapServiceLayer(layer.url, layer.options);
                } else if (layer.type === 'tiled') {
                    l = new esri.layers.ArcGISTiledMapServiceLayer(layer.url, layer.options);
                } else if (layer.type === 'feature') {
                    l = new esri.layers.FeatureLayer(layer.url, layer.options);
                    //Set the renderer for the initial basemap
                    if (layer.rasterRenderer && layer.vectorRenderer) {
                        var renderer = (this.mapStartBasemapContentType === "raster") ? layer.rasterRenderer : layer.vectorRenderer;
                        l.setRenderer(renderer);  //lcs - Basemap Content Type
                    }
                    var options = {
                        featureLayer: l
                    };
                    if (layer.editorLayerInfos) {
                        lang.mixin(options, layer.editorLayerInfos);
                    }
                    this.editorLayerInfos.push(options);
                    //l.setInfoTemplate(template);

                    //lcs MapTips BEGIN
                    gl = new esri.layers.GraphicsLayer({ id: layer.options.id + '-graphics' });
                    this.layers.unshift(gl);  //lcs - Put the graphic layer below the feature layer
                    gl.on("mouse-out", function (evt){
                        // console.log('gl.mouse-out');
                        gl.clear();
                        dijitPopup.close(dialog);
                    });
                    gl.on("mouse-over", function(evt){
                        // console.log('gl.mouse-over');
                        if (window.userPreferences.showMapTips) {
                            var content = esriLang.substitute(evt.graphic.attributes, layer.mapTip);
                            content = content.replace(/<b\><\/b\>/g, "<b>" + layer.mapTipNoValue + "<\/b>");

                            dialog.setContent(content);

                            Style.set(dialog.domNode, "opacity", 0.85);
                            dijitPopup.open({
                                popup: dialog,
                                x: evt.pageX + 10,
                                y: evt.pageY + 10
                            });
                        }
                    });
                    l.on("mouse-out", function(evt) {
                        // console.log('l.mouse-out');
                        dijitPopup.close(dialog);
                    });
                    l.on("mouse-over", function(evt){
                        // console.log('l.mouse-over');
                        if (window.userPreferences.showMouseoverHighlight) {
                            var highlightGraphic = new Graphic(evt.graphic.geometry, layer.highlightSymbol, evt.graphic.attributes);
                            gl.add(highlightGraphic);
                        } else if (window.userPreferences.showMapTips) {
                            var content = esriLang.substitute(evt.graphic.attributes, layer.mapTip);
                            content = content.replace(/<b\><\/b\>/g, "<b>" + layer.mapTipNoValue + "<\/b>");

                            dialog.setContent(content);

                            Style.set(dialog.domNode, "opacity", 0.85);
                            dijitPopup.open({
                                popup: dialog,
                                x: evt.pageX + 10,
                                y: evt.pageY + 10
                            });
                        }

                        // var showMapTips = dom.byId('chkMapTips').checked;
                        // if (showMapTips) {
                            // var content = esriLang.substitute(mouseOverEvent.graphic.attributes, layer.mapTip);
                            // content = content.replace(/<b\><\/b\>/g, "<b>" + layer.mapTipNoValue + "<\/b>");
                            // var highlightGraphic = new Graphic(mouseOverEvent.graphic.geometry, layer.highlightSymbol);
                            // gl.add(highlightGraphic);

                            // dialog.setContent(content);

                            // Style.set(dialog.domNode, "opacity", 0.85);
                            // dijitPopup.open({
                                // popup: dialog,
                                // x: mouseOverEvent.pageX + 10,
                                // y: mouseOverEvent.pageY + 10
                            // });
                        // }
                    });
                    //lcs MapTips END

                } else {
                    console.log('Layer type not supported: ', layer.type);
                }
                this.layers.unshift(l);  //lcs - Changed from push() to unshift() so the layers can be listed from top to bottom in config.js
                this.legendLayerInfos.unshift({  //lcs - Changed from push() to unshift() so the Legend and TOC agree
                    layer: l,
                    title: layer.title || null,
                    slider: true,
                    noLegend: false,
                    collapsed: false
                });
                this.tocLayerInfos.push({  //lcs - Added this because Legend and TOC need the layers in the opposite order
                    layer: l,
                    title: layer.title || null,
                    slider: true,
                    noLegend: false,
                    collapsed: false
                });
            }, this);
            this.map.addLayers(this.layers);

            this.growler = new Growler({}, "growlerDijit");
            this.growler.startup();

            this.helper = new Helper({}, "helperDijit");
            this.helper.startup();

            this.geoLocation = new GeoLocation({
                map: this.map,
                growler: this.growler
            }, "geoLocationDijit");
            this.geoLocation.startup();

            this.geocoder = new esri.dijit.Geocoder({
                map: this.map,
                autoComplete: true
            }, "geocodeDijit");
            this.geocoder.startup();
        },
        initWidgets: function(evt) {
            array.forEach(functional.keys(config.widgets), lang.hitch(this, function(key) {
                var widgetCfg = config.widgets[key];
                if (widgetCfg && widgetCfg.hasOwnProperty('include') && widgetCfg.include) {
                    // Add new cases for new widgets
                    switch (key) {
                        case 'scalebar':
                            topic.publish('STARTUP_METRICS', { id: key, label: 'Loading ' + config.widgets[key].title, value: 'Loading...' });
                            require(['esri/dijit/Scalebar'], lang.hitch(this, function(Scalebar) {
                                this.scalebar = new Scalebar({
                                    map: this.map,
                                    attachTo: widgetCfg.options.attachTo,
                                    scalebarStyle: widgetCfg.options.scalebarStyle,
                                    scalebarUnit: widgetCfg.options.scalebarUnit
                                });
                                topic.publish('STARTUP_METRICS', { id: key, label: config.widgets[key].title, value: 'Complete' });
                            }));
                            break;
                        case 'legend':
                            topic.publish('STARTUP_METRICS', { id: key, label: 'Loading ' + config.widgets[key].title, value: 'Loading...' });
                            var legendTP = this._createTitlePane(widgetCfg.title, widgetCfg.open);
                            require(['esri/dijit/Legend'], lang.hitch(this, function(Legend) {
                                this.legend = new Legend({
                                    map: this.map,
                                    layerInfos: this.legendLayerInfos
                                }, domConstruct.create("div")).placeAt(legendTP.containerNode);
                                topic.publish('STARTUP_METRICS', { id: key, label: config.widgets[key].title, value: 'Complete' });
                                this.addQuickHelp(legendTP, widgetCfg.help);
                            }));
                            break;
                        case 'TOC':
                            topic.publish('STARTUP_METRICS', { id: key, label: 'Loading ' + config.widgets[key].title, value: 'Loading...' });
                            var TOCTP = this._createTitlePane(widgetCfg.title, widgetCfg.open);
                            require(['gis/dijit/TOC'], lang.hitch(this, function(TOC) {
                                this.toc = new TOC({
                                    map: this.map,
                                    layerInfos: this.tocLayerInfos  //lcs - to make the legend agree with the TOC
                                }, domConstruct.create("div")).placeAt(TOCTP.containerNode);
                                this.toc.startup();
                                topic.publish('STARTUP_METRICS', { id: key, label: config.widgets[key].title, value: 'Complete' });
                                this.addQuickHelp(TOCTP, widgetCfg.help);
                            }));
                            break;
                        case 'bookmarks':
                            topic.publish('STARTUP_METRICS', { id: key, label: 'Loading ' + config.widgets[key].title, value: 'Loading...' });
                            var bookmarksTP = this._createTitlePane(widgetCfg.title, widgetCfg.open);
                            require(['gis/dijit/Bookmarks'], lang.hitch(this, function(Bookmarks) {
                                this.bookmarks = new Bookmarks({
                                    map: this.map,
                                    editable: true
                                }, domConstruct.create("div")).placeAt(bookmarksTP.containerNode);
                                this.bookmarks.startup();
                                topic.publish('STARTUP_METRICS', { id: key, label: config.widgets[key].title, value: 'Complete' });
                                this.addQuickHelp(bookmarksTP, widgetCfg.help);
                            }));
                            break;
                        case 'draw':
                            topic.publish('STARTUP_METRICS', { id: key, label: 'Loading ' + config.widgets[key].title, value: 'Loading...' });
                            var drawTP = this._createTitlePane(widgetCfg.title, widgetCfg.open);
                            require(['gis/dijit/Draw'], lang.hitch(this, function(Draw) {
                                this.drawWidget = new Draw({
                                    map: this.map
                                }, domConstruct.create("div")).placeAt(drawTP.containerNode);
                                this.drawWidget.startup();
                                topic.publish('STARTUP_METRICS', { id: key, label: config.widgets[key].title, value: 'Complete' });
                                this.addQuickHelp(drawTP, widgetCfg.help);
                            }));
                            break;
                        case 'measure':
                            topic.publish('STARTUP_METRICS', { id: key, label: 'Loading ' + config.widgets[key].title, value: 'Loading...' });
                            var measureTP = this._createTitlePane(widgetCfg.title, widgetCfg.open);
                            require(['esri/dijit/Measurement'], lang.hitch(this, function(Measurement) {
                                this.measure = new Measurement({
                                    map: this.map,
                                    defaultAreaUnit: widgetCfg.defaultAreaUnit,
                                    defaultLengthUnit: widgetCfg.defaultLengthUnit
                                }, domConstruct.create("div")).placeAt(measureTP.containerNode);
                                this.measure.startup();
                                topic.publish('STARTUP_METRICS', { id: key, label: config.widgets[key].title, value: 'Complete' });
                                this.addQuickHelp(measureTP, widgetCfg.help);
                            }));
                            break;
                        case 'print':
                            topic.publish('STARTUP_METRICS', { id: key, label: 'Loading ' + config.widgets[key].title, value: 'Loading...' });
                            var printTP = this._createTitlePane(widgetCfg.title, widgetCfg.open);
                            require(['gis/dijit/Print'], lang.hitch(this, function(Print) {
                                this.printWidget = new Print({
                                    map: this.map,
                                    printTaskURL: widgetCfg.serviceURL,
                                    authorText: widgetCfg.authorText,
                                    copyrightText: widgetCfg.copyrightText,
                                    defaultTitle: widgetCfg.defaultTitle,
                                    defaultFormat: widgetCfg.defaultFormat,
                                    defaultLayout: widgetCfg.defaultLayout,
                                    growler: this.growler
                                }, domConstruct.create("div")).placeAt(printTP.containerNode);
                                this.printWidget.startup();
                                topic.publish('STARTUP_METRICS', { id: key, label: config.widgets[key].title, value: 'Complete' });
                                this.addQuickHelp(printTP, widgetCfg.help);
                            }));
                            break;
                        case 'printplus':
                            topic.publish('STARTUP_METRICS', { id: key, label: 'Loading ' + config.widgets[key].title, value: 'Loading...' });
                            var printPlusTP = this._createTitlePane(widgetCfg.title, widgetCfg.open);
                            require(['gis/dijit/PrintPlus'], lang.hitch(this, function(PrintPlus) {
                                this.printPlusWidget = new PrintPlus({
                                    map: this.map,
                                    printTaskURL: widgetCfg.serviceURL,
                                    authorText: widgetCfg.authorText,
                                    copyrightText: widgetCfg.copyrightText,
                                    defaultTitle: widgetCfg.defaultTitle,
                                    defaultFormat: widgetCfg.defaultFormat,
                                    defaultLayout: widgetCfg.defaultLayout,
                                    growler: this.growler,
                                    //lcs - Print Enhancements BEGIN
                                    defaultDpi: widgetCfg.defaultDpi || 96,
                                    noTitleBlockPrefix: widgetCfg.noTitleBlockPrefix,
                                    layoutParams: widgetCfg.layoutParams,
                                    relativeScale: widgetCfg.relativeScale,
                                    relativeScaleFactor: widgetCfg.relativeScaleFactor,
                                    scalePrecision: widgetCfg.scalePrecision,
                                    mapScales: widgetCfg.mapScales,
                                    outWkid: widgetCfg.outWkid,
                                    showLayout: widgetCfg.showLayout
                                    //lcs - Print Enhancements END
                                }, domConstruct.create("div")).placeAt(printPlusTP.containerNode);
                                this.printPlusWidget.startup();
                                topic.publish('STARTUP_METRICS', { id: key, label: config.widgets[key].title, value: 'Complete' });
                                this.addQuickHelp(printPlusTP, widgetCfg.help);
                                //lcs - Print Enhancements BEGIN
                                dojo.connect(printPlusTP, 'toggle', lang.hitch(this, function() {
                                    this.printPlusWidget._onLayoutChange(printPlusTP.open);
                                }));
                                //lcs - Print Enhancements END
                            }));
                            break;
                        case 'directions':
                            topic.publish('STARTUP_METRICS', { id: key, label: 'Loading ' + config.widgets[key].title, value: 'Loading...' });
                            var directionsTP = this._createTitlePane(widgetCfg.title, widgetCfg.open);
                            require(['gis/dijit/Directions'], lang.hitch(this, function(Directions) {
                                this.directionsWidget = new Directions({
                                    map: this.map,
                                    options: widgetCfg.options,
                                    titlePane: directionsTP
                                }, domConstruct.create("div")).placeAt(directionsTP.containerNode);
                                this.directionsWidget.startup();
                                topic.publish('STARTUP_METRICS', { id: key, label: config.widgets[key].title, value: 'Complete' });
                                this.addQuickHelp(directionsTP, widgetCfg.help);
                            }));
                            break;
                        case 'editor':
                            topic.publish('STARTUP_METRICS', { id: key, label: 'Loading ' + config.widgets[key].title, value: 'Loading...' });
                            var editorTP = this._createTitlePane(widgetCfg.title, widgetCfg.open);
                            require(['gis/dijit/Editor'], lang.hitch(this, function(Editor) {
                                this.editor = new Editor({
                                    map: this.map,
                                    layerInfos: this.editorLayerInfos,
                                    settings: widgetCfg.settings,
                                    titlePane: editorTP
                                }, domConstruct.create("div")).placeAt(editorTP.containerNode);
                                this.editor.startup();
                                topic.publish('STARTUP_METRICS', { id: key, label: config.widgets[key].title, value: 'Complete' });
                                this.addQuickHelp(editorTP, widgetCfg.help);
                            }));
                            break;
                        case 'userpreferences':
                            topic.publish('STARTUP_METRICS', { id: key, label: 'Loading ' + config.widgets[key].title, value: 'Loading...' });
                            var userPreferencesTP = this._createTitlePane(widgetCfg.title, widgetCfg.open);
                            require(['gis/dijit/UserPreferences'], lang.hitch(this, function(UserPreferences) {
                                this.userPreferences = new UserPreferences({
                                    map: this.map,
                                    hasCookie: this.userPreferencesCookie,
                                    isBrowser: config.deviceProperties.isBrowser
                                }, domConstruct.create("div")).placeAt(userPreferencesTP.containerNode);
                                // this.userPreferences.startup();
                                topic.publish('STARTUP_METRICS', { id: key, label: config.widgets[key].title, value: 'Complete' });
                                this.addQuickHelp(userPreferencesTP, widgetCfg.help);
                            }));
                            break;
                        case 'share':
                            topic.publish('STARTUP_METRICS', { id: key, label: 'Loading ' + config.widgets[key].title, value: 'Loading...' });
                            var shareTP = this._createTitlePane(widgetCfg.title, widgetCfg.open);
                            require(['gis/dijit/Share'], lang.hitch(this, function(Share) {
                                this.share = new Share({
                                    emailSubject: widgetCfg.emailSubject || 'Link to Map',
                                    feedbackTo: widgetCfg.feedbackTo,
                                    feedbackSubject: widgetCfg.feedbackSubject || 'Feedback on Map Viewer'
                                }, domConstruct.create("div")).placeAt(shareTP.containerNode);
                                //this.shareTP.startup();
                                topic.publish('STARTUP_METRICS', { id: key, label: config.widgets[key].title, value: 'Complete' });
                                this.addQuickHelp(shareTP, widgetCfg.help);
                            }));
                            break;
                        default:
                            break;
                    }
                }
            }));
        },
        toggleSidebar: function() {
            if (this.outer.getIndexOfChild(this.sidebar) !== -1) {
                this.outer.removeChild(this.sidebar);
                domClass.remove(this.sideBarToggle, 'close');
                domClass.add(this.sideBarToggle, 'open');
            } else {
                this.outer.addChild(this.sidebar);
                domClass.remove(this.sideBarToggle, 'open');
                domClass.add(this.sideBarToggle, 'close');
            }
        },
        _createTitlePane: function(title, open) {
            var tp = new TitlePane({
                title: title,
                open: open
            }).placeAt(this.sidebar, 'last');
            //domClass.add(tp.domNode, 'titlePaneBottomFix titlePaneRightFix');
            tp.startup();
            return tp;
        },
        _createHelpTitlePane: function(title, open, href) {
            var tp = new TitlePane({
                title: title,
                open: open,
                href: href
            }).placeAt(this.helpNode, 'last');
            tp.startup();
            return tp;
        },
        setCoordinateDisplayHandlers: function() {
            if (window.userPreferences.showCoordinates) {
                if (!this._mouseMoveHandler) {
                    this._mouseMoveHandler = this.map.on("mouse-move", lang.hitch(this, 'showCoordinates'));
                }
                if (!this._mouseDragHandler) {
                    this._mouseDragHandler = this.map.on("mouse-drag", lang.hitch(this, 'showCoordinates'));
                }
            } else {
                if (this._mouseMoveHandler) {
                    this._mouseMoveHandler.remove();
                    this._mouseMoveHandler = null;
                }
                if (this._mouseDragHandler) {
                    this._mouseDragHandler.remove();
                    this._mouseDragHandler = null;
                }
            }
            
            if (window.userPreferences.showScale) {
                if (!this._zoomEndHandler) {
                    this._zoomEndHandler = this.map.on("zoom-end", lang.hitch(this, 'showCoordinates'));
                }
            } else {
                if (this._zoomEndHandler) {
                    this._zoomEndHandler.remove();
                    this._zoomEndHandler = null;
                }
            }
            
            this.showCoordinates();
        },
        showCoordinates: function(evt) {
            var pt;
            var ll;
            var coordinates = '';
            var scale = '';
            if (window.userPreferences.showCoordinates) {
                pt = evt ? (evt.hasOwnProperty('mapPoint') ? evt.mapPoint : this.map.toMap(evt.anchor)) : this.defaultCoordinatePt;
                ll = { x: ((pt.x - 234699) / 279875) - 86, y: ((pt.y - 1730872) / 364285) + 40 };
                coordinates = 'X: ' + number.format(ll.x, {pattern: '##.000000'}) + '  Y: ' + number.format(ll.y, {pattern: '##.000000'});
            }
            if (window.userPreferences.showScale) {
                scale = '  Scale: ' + number.format(this.map.getScale(), {pattern: '#,###,###'});
            }
            dojo.byId("coordinateDijit").innerHTML = coordinates + scale;
        },
        showHelp: function() {
            if (this.help) {
                this.help.show();
            } else {
                this.help = new Help();
                this.help.show();
            }
        },
        addQuickHelp: function(tp, contentURL, title, timeout) {
            var errorMsg = '';
            var minTimeout = 10000;

            if (title === undefined)      { title = 'Quick Help for ' + tp.title; }
            if (contentURL === undefined) { contentURL = config.widgets.noHelp.help; }
            if (timeout === undefined)    { timeout = minTimeout; }

            var xhrArgs = {
                url: contentURL,
                handleAs: "text",
                preventCache: false,
                handle: lang.hitch(this, function(error, ioargs) {
                    var newTimeout;
                    if (ioargs.xhr.status === 200) {
                        newTimeout = Math.max(minTimeout, error.length * 40);
                    } else {
                        newTimeout = minTimeout;
                        contentURL = config.widgets.noHelp.help;
                        errorMsg = error;
                    }

                    // Set the domNode position to relative so the absolute position of the Quick Help button will work
                    Style.set(tp.domNode, 'position', 'relative');
                    // Use the tp.id to make the HTML IDs unique.
                    domConstruct.create('div', {
                        id: tp.id + '_helpButtonDiv',
                        'class': 'quickHelp' }, tp.containerNode);
                    this.quickHelpButton = new Button({
                        label: 'Quick Help',
                        id: tp.id + '_helpButton',
                        type: 'button',
                        iconClass: 'helpIcon',
                        showLabel: false,
                        onClick: lang.hitch(this, function() {
                            this.helper.help({
                                helpTitle: title,
                                contentURL: contentURL,
                                error: errorMsg,
                                timeout: Math.max(timeout, minTimeout, newTimeout)
                            });
                        })
                    }).placeAt(tp.id + '_helpButtonDiv');
                    this.quickHelpButton.startup();
                })
            };

            // Call the asynchronous xhrGet so the error will be handled if contentURL does not exist.
            dojo.xhrGet(xhrArgs);
        },
        showWelWhatDisHelpAbout: function(showHelp, duration, appStartTime) {
            var showProgress = false;
            var showDialog = showHelp || window.userPreferences.showWelcome;
            if (!this.welWhatDisHelpAbout) {
                showProgress = true;
                if (config.deviceProperties.contentWidth >= 500 && config.deviceProperties.contentHeight >= 400) {
                    this.welWhatDisHelpAbout = new WelWhatDisHelpAbout({
                        showAtStartup: window.userPreferences.showWelcome,
                        showStartupMetrics: window.userPreferences.showStartupMetrics,
                        appStartTime: appStartTime,
                        devEmail: config.devEmail,
                        getPermissions: config.getPermissions,
                        permissionsFile: config.permissionsFile
                    });
                } else {
                    this.welWhatDisHelpAbout = new WelWhatDisHelpAboutSmall({
                        showAtStartup: window.userPreferences.showWelcome,
                        showStartupMetrics: false,
                        getPermissions: config.getPermissions,
                        permissionsFile: config.permissionsFile
                    });
                }
                showDialog = this.welWhatDisHelpAbout.startup();

                // Insert a Help title pane for each widget that is included and has a help link
                this.helpNode = this.welWhatDisHelpAbout.help;
                var allKeys = functional.keys(config.widgets);
                var keys = array.filter(allKeys, lang.hitch(this, function(key) {
                    var widgetCfg = config.widgets[key];
                    return (widgetCfg.hasOwnProperty('include') && widgetCfg.include && widgetCfg.hasOwnProperty('title'));
                }));
                this.numHelp = keys.length;
                this.addWidgetHelp(keys);
            }

            if (showDialog || showHelp) {
                // this.welWhatDisHelpAbout.help.set('selected', showHelp);
                // this.welWhatDisHelpAbout.welcome.set('selected', !showHelp);
                this.welWhatDisHelpAbout.tabContainer.selectChild(showHelp ? 'help' : 'welcome', true);
                Style.set(this.welWhatDisHelpAbout.domNode, 'opacity', 0);
                this.welWhatDisHelpAbout.show();
                baseFx.anim(this.welWhatDisHelpAbout.domNode, 
                    { opacity: 1 }, 
                    duration, 
                    null, 
                    lang.hitch(this, function() {
                        if (showProgress && window.userPreferences.showStartupMetrics) {
                            this.welWhatDisHelpAbout.progressDropDownDijit.loadAndOpenDropDown(); 
                        }
                    })
                );
            }
        },
        addWidgetHelp: function(keys) {
            // Process the help for the first widget in the array
            var key = keys.shift();
            var widgetCfg = config.widgets[key];
            var helpURL = (widgetCfg.hasOwnProperty('help') && widgetCfg.help) ? widgetCfg.help : config.widgets.noHelp.help;
            // Make sure the help URL exists
            var xhrArgs = {
                url:  helpURL,
                handleAs: "text",
                preventCache: false,
                handle: lang.hitch(this, function(error, ioargs) {
                    var errorMsg = '';
                    if (ioargs.xhr.status !== 200) {
                        helpURL = config.widgets.noHelp.help;
                        errorMsg = error;
                    }
                    var tp = this._createHelpTitlePane(widgetCfg.title, false, helpURL);
                    if (errorMsg) {
                        domConstruct.create('h2', {
                            innerHTML: errorMsg,
                            'class': 'helpError' }, tp.containerNode, 'before');
                    }
                })
            };
            
            // Call the asynchronous xhrGet so the help will be added in the correct order 
            // and an error will be handled if widgetCfg.help does not exist.
            var deferred = dojo.xhrGet(xhrArgs);
            
            // When the help for this widget has been added, call this function again
            deferred.then(lang.hitch(this, function() { 
                // Process the next widget if there is one
                if (keys.length === 0) {
                    topic.publish('STARTUP_METRICS', { 
                        id: 'loading_help', 
                        label: 'Loading Help', 
                        value: 'Complete' 
                    });
                } else {
                    topic.publish('STARTUP_METRICS', { 
                        id: 'loading_help', 
                        label: 'Loading Help', 
                        value: number.format((this.numHelp - keys.length) / this.numHelp, { pattern: '##%' })
                    });
                    this.addWidgetHelp(keys);
                }
            }));
        }
    };
});