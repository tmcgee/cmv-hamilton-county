define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dijit/form/Form',
    'dijit/form/Button',
    'dijit/form/CheckBox',
    'dojo/_base/window',
    'dojo/json',
    'dojo/cookie',
    'dojo/dom',
    'dojo/dom-construct',
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/io-query',
    'esri/units',
    'dojox/lang/functional',
    'dojo/topic',
    'dojo/text!./UserPreferences/templates/UserPreferences.html'
], function(
    declare, 
    _WidgetBase, 
    _TemplatedMixin,
    _WidgetsInTemplateMixin, 
    Form, 
    Button, 
    CheckBox, 
    win, 
    JSON, 
    cookie, 
    dom, 
    domConstruct, 
    array, 
    lang, 
    ioQuery, 
    Units,
    functional, 
    topic, 
    UserPreferencesTemplate) {

    //anonymous function to load CSS files required for this module
    (function() {
        var css = [require.toUrl("gis/dijit/UserPreferences/css/UserPreferences.css")];
        var head = document.getElementsByTagName("head").item(0),
            link;
        for (var i = 0, il = css.length; i < il; i++) {
            link = document.createElement("link");
            link.type = "text/css";
            link.rel = "stylesheet";
            link.href = css[i].toString();
            head.appendChild(link);
        }
    }());

    // main UserPreferences dijit
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        widgetsInTemplate: true,
        templateString: UserPreferencesTemplate,
        map: null,
        hasCookie: false,
        isBrowser: true,
        mapLayers: {},
        postCreate: function() {
            this.inherited(arguments);
            
            // Set the number of decimal places to use for the precision of the map extent
            if (this.map) {
                switch (this.map._params.units) {
                    case Units.DECIMAL_DEGREES:
                        this.extentDecimals = 6;
                        break;
                    case Units.KILOMETERS:
                    case Units.MILES:
                    case Units.NAUTICAL_MILES:
                        this.extentDecimals = 3;
                        break;
                    default:
                        this.extentDecimals = 0;
                        break;
                }
            }
        },
        startup: function() {
            this.inherited(arguments);
            
            
            // Subscribe to the userPreferences topic for messages from other widgets
            // that a user preference needs to be updated (e.g. WelWhatDisHelpAbout, TOC, Basemaps).
            topic.subscribe('USER_PREFERENCES', lang.hitch(this, function(e) {
                this._updateUserPreferences(e);
            }));

            // Turn on listeners for map extent changes (if this preference is truthy)
            if (window.userPreferences.restoreMapExtent) {
                if (typeof window.userPreferences.restoreMapExtent === 'boolean') {
                    this._setExtent();
                }
                this._addMapExtentChangeListeners();
            }
            
            // Apply user preferences for operational layer settings
            if (window.userPreferences.restoreMapLayers) {
                if (typeof window.userPreferences.restoreMapLayers === 'boolean') {
                    // Add the Operational layers to the user preferences.
                    this._updateUserPreferences({ restoreMapLayers: { version: '$v3', operational: [] } });
                } else {
                    // 'restoreMapLayers' user preference is an object, so set the operational layer visibilities and opacities.
                    this.restoreOpLayerSettings(window.userPreferences.restoreMapLayers.operational);
                }
                // Request the current basemap.  Data will be returned using the 'USER_PREFERENCES' topic.
                topic.publish('FETCH_BASEMAP', 1);
            }
            
            // Save the user preferences if there is no cookie
            if (!this.hasCookie) {
                this._writeCookie();
            }
            
            // The user preferences cookie is read by, and the initial user preferences are applied by controller.js on startup.
            
            // Create the checkboxes
            var checkBox, style, checked;
            var mobileHideOptions = ['showMapTips', 'showMouseoverHighlight', 'showStartupMetrics'];
            array.forEach(functional.keys(window.userPreferences), lang.hitch(this, function (key) {
                // Don't show the 'showMapTips' or 'showMouseoverHighlight' checkboxes for mobile devices (touch screens)
                if (this.isBrowser || (array.indexOf(mobileHideOptions, key) !== -1)) {
                    style = 'block';
                    checked = window.userPreferences[key];
                } else {
                    style = 'none';
                    checked = false;
                }
                
                domConstruct.create('tr', {
                    'class': 'userPreference',
                    style: 'display: ' + style + ';',
                    innerHTML: '<td class="userPreferenceLabel">Label for ' + key + '</td><td><input id="' + key + '" type="checkbox"/></td>'}, dom.byId('tbody'), 'last');
                checkBox = new CheckBox({
                    id: key,
                    name: key,
                    value: 'checked',
                    checked: checked,
                    onChange: lang.hitch(this, function(evt) { this._chkChangeHandler(evt, key); } )
                }, key);
                checkBox.startup();
            }));
        },
        _chkChangeHandler: function(evt, prefName) {
            // When a user preference is set in this widget, this function stores it, 
            // acts on it, and/or synchronizes it with the rest of the app.
            console.log(prefName, ':', evt);
            var objPref = {};
            switch (prefName) {
                case 'restoreMapExtent':
                    if (evt) {
                        this._setExtent();
                        this._addMapExtentChangeListeners();
                    } else {
                        objPref[prefName] = false;
                        lang.mixin(window.userPreferences, objPref);
                        this._removeMapExtentChangeListeners();
                    }
                    break;
                case 'restoreMapLayers':
                    if (evt) {
                        // Request the current basemap.  Data will be returned using the 'USER_PREFERENCES' topic.
                        topic.publish('FETCH_BASEMAP', 1);
                        // Update the operational layers
                        this.updateMapLayers({ version: '$v3', operational: [] });
                    } else {
                        objPref[prefName] = false;
                    }
                    break;
                case 'showMapTips':
                    objPref[prefName] = evt ? true : false;
                    lang.mixin(window.userPreferences, objPref);
                    win.withDoc(window.document, function () {
                        dom.byId('chkMapTips').checked = objPref[prefName];
                    });
                    break;
                default:
                    objPref[prefName] = evt ? true : false;
                    lang.mixin(window.userPreferences, objPref);
                    topic.publish('APPLY_USER_PREFERENCES', prefName);
                    break;
            }
            this._writeCookie();
        },
        _updateUserPreferences: function(objPref) {
            // When a user preference is set anywhere else in the app, 
            // this function synchronizes this widget to the new setting.
            var prefName = functional.keys(objPref)[0];
            if (prefName === 'restoreMapLayers') {
                this.updateMapLayers(objPref[prefName]);
            } else {
                lang.mixin(window.userPreferences, objPref);
            }
            this._writeCookie();
        },
        _addMapExtentChangeListeners: function() {
            if (!this._zoomEndHandler) {
                this._zoomEndHandler = this.map.on('zoom-end', lang.hitch(this, '_updateSavedMapExtent'));
            }
            if (!this._panEndHandler) {
                this._panEndHandler = this.map.on('pan-end', lang.hitch(this, '_updateSavedMapExtent'));
            }
        },
        _removeMapExtentChangeListeners: function() {
            if (this._zoomEndHandler) {
                this._zoomEndHandler.remove();
                this._zoomEndHandler = null;
            }
            if (this._panEndHandler) {
                this._panEndHandler.remove();
                this._panEndHandler = null;
            }
        },
        _updateSavedMapExtent: function() {
            console.log('_updateSavedMapExtent:');
            this._setExtent();
            this._writeCookie();
        },
        _setExtent: function() {
            console.log('_setExtent:');
            var mapExtent = { type: "extent", spatialReference: { wkid: this.map.extent.spatialReference.wkid } };
            array.forEach(['xmax', 'xmin', 'ymax', 'ymin'], lang.hitch(this, function(dim) {
                mapExtent[dim] = Number(this.map.extent[dim].toFixed(this.extentDecimals));
            }));
            window.userPreferences.restoreMapExtent = mapExtent;
        },
        _writeCookie: function() {
            cookie('userPreferences', JSON.stringify(window.userPreferences), {
                expires: 99999
            });
        },
        restoreOpLayerSettings: function(opLayers) {
            var mapService;
            var opLayersObj = {};
            array.forEach(opLayers, function(lyr) {
                opLayersObj[lyr.id] = { opacity: lyr.opacity, contentType: lyr.contentType };
            });
            
            // All layers except feature layers and basemap layers
            array.forEach(this.map.layerIds, lang.hitch(this, function(id) {
                mapService = this.map.getLayer(id);
                if (!mapService.hasOwnProperty('_basemapGalleryLayerType')) {
                    var opLayer = opLayersObj[id];
                    if (opLayer) {
                        mapService.setVisibility(true);
                        mapService.setOpacity(opLayer.opacity);
                        // set layer visibilities
                        if (mapService.declaredClass === 'esri.layers.ArcGISDynamicMapServiceLayer' && typeof opLayer.contentType === 'object') {
                            mapService.setVisibleLayers(opLayer.contentType);
                        }
                    } else {
                        mapService.setVisibility(false);
                    }
                }
            }));
            
            // All feature layers except basemap layers
            array.forEach(this.map.graphicsLayerIds, lang.hitch(this, function(id) {
                mapService = this.map.getLayer(id);
                if (!mapService.hasOwnProperty('_basemapGalleryLayerType') && mapService.hasOwnProperty('type') && mapService.type === 'Feature Layer') {
                    var opLayer = opLayersObj[id];
                    if (opLayer) {
                        mapService.setVisibility(true);
                        mapService.setOpacity(opLayer.opacity);
                    } else {
                        mapService.setVisibility(false);
                    }
                }
            }));
        },
        updateMapLayers: function(newLayerData) {
            // newLayerData will be for a basemap, like this:
            //   { version: '$v3', basemap: { mode: 'custom', id: 'streets', opacity: 1, contentType: 'vector'} }
            // or for operational layers, like this:
            //   { version: '$v3', operational: [] }
            // For now, we can ignore the version since it is the first version for the JavaScript Viewer.
            // ($v1 & $v2 were used in the Flex Viewer.)
            var keys = functional.keys(newLayerData);
            if (keys[1] === 'basemap') {
                if (typeof window.userPreferences.restoreMapLayers === 'boolean') {
                    window.userPreferences.restoreMapLayers = newLayerData;
                } else {
                    lang.mixin(window.userPreferences.restoreMapLayers, newLayerData);
                }
            } else if (keys[1] === 'operational') {
                var operationalLayers = this.getOperationalLayers(newLayerData);
                if (typeof window.userPreferences.restoreMapLayers === 'boolean') {
                    window.userPreferences.restoreMapLayers = operationalLayers;
                } else {
                    lang.mixin(window.userPreferences.restoreMapLayers, operationalLayers);
                }
            }
        },
        getOperationalLayers: function(layerData) {
            var mapService, dynLayers;
            
            // All layers except feature layers and basemap layers
            array.forEach(this.map.layerIds, lang.hitch(this, function(id) {
                mapService = this.map.getLayer(id);
                if (mapService.visible && !mapService.hasOwnProperty('_basemapGalleryLayerType')) {
                    layerData.operational.push({
                        contentType: mapService.declaredClass === 'esri.layers.ArcGISDynamicMapServiceLayer' ? mapService.visibleLayers : '*',
                        id: mapService.id,
                        mode: 'p',
                        opacity: mapService.opacity
                    });
                }
            }));
            
            // All feature layers except basemap layers
            array.forEach(this.map.graphicsLayerIds, lang.hitch(this, function(id) {
                mapService = this.map.getLayer(id);
                if (mapService.visible && !mapService.hasOwnProperty('_basemapGalleryLayerType') && mapService.hasOwnProperty('type') && mapService.type === 'Feature Layer') {
                    layerData.operational.push({
                        contentType: '*',
                        id: mapService.id,
                        mode: 'p',
                        opacity: mapService.opacity
                    });
                }
            }));
        
            return layerData;
        }
    });
});

// basemap
  // id:
  // mode: 'custom'|'agol'
  // opacity:
  // contentType: 'raster'|'vector'
// operational:
  // id:
  // mode: 'p'
  // opacity:
  // contentType: '*'|[-1]|[0,3,4] --> '*' if not an ArcGISDynamicMapServiceLayer; [-1] if an ArcGISDynamicMapServiceLayer with no visible layers; [0,3,4] if an ArcGISDynamicMapServiceLayer and layers 0, 3, & 4 are visible
