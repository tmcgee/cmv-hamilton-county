//http://resources.arcgis.com/en/help/main/10.2/index.html#//0154000004w8000000
//https://developers.arcgis.com/javascript/jssamples/map_showloading.html

define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dijit/form/Form',
    'dijit/form/FilteringSelect',
    'dijit/form/ValidationTextBox',
    'dijit/form/NumberTextBox',
    'dijit/form/Button',
    'dijit/form/CheckBox',
    'dijit/form/HorizontalSlider',  //lcs - Print Enhancements
    'dijit/form/HorizontalRule',  //lcs - Print Enhancements
    'dijit/form/HorizontalRuleLabels',  //lcs - Print Enhancements
    'dijit/ProgressBar',
    'dijit/form/DropDownButton',
    'dijit/TooltipDialog',
    'dijit/form/RadioButton',
    'esri/tasks/PrintTask',
    'dojo/store/Memory',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/dom',  //lcs - Print Enhancements
    'dojo/dom-style',
    'dojo/dom-construct',
    'dojo/dom-class',
    'dojo/on',
    'dojo/text!./PrintPlus/templates/Print.html',
    'dojo/text!./PrintPlus/templates/PrintResult.html',
    //lcs - Print Enhancements BEGIN
    'dojo/number',
    'dojo/_base/Color',  
    'esri/symbols/SimpleLineSymbol',  
    'esri/symbols/SimpleFillSymbol',  
    'esri/geometry/Polyline',
    'esri/geometry/Polygon',  
    'esri/graphic',  
    'esri/geometry/Extent',
    'esri/units',
    'esri/SpatialReference',
    'esri/tasks/LengthsParameters',
    //lcs - Print Enhancements END
    'dojo/aspect'
], function(
    declare, 
    _WidgetBase, 
    _TemplatedMixin, 
    _WidgetsInTemplateMixin, 
    Form, FilteringSelect, 
    ValidationTextBox, 
    NumberTextBox, 
    Button, 
    CheckBox, 
    HorizontalSlider, 
    HorizontalRule, 
    HorizontalRuleLabels, 
    ProgressBar, 
    DropDownButton, 
    TooltipDialog, 
    RadioButton, 
    PrintTask, 
    Memory, 
    lang, 
    array, 
    dom, 
    Style, 
    domConstruct, 
    domClass, 
    on, 
    printTemplate, 
    printResultTemplate, 
    number, 
    Color, 
    SimpleLineSymbol, 
    SimpleFillSymbol, 
    Polyline, 
    Polygon, 
    Graphic, 
    Extent, 
    Units, 
    SpatialReference, 
    LengthsParameters, 
    aspect) {

    //anonymous function to load CSS files required for this module
    (function() {
        var css = [require.toUrl('gis/dijit/PrintPlus/css/Print.css')];
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

    // Main print dijit
    var PrintDijit = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        widgetsInTemplate: true,
        templateString: printTemplate,
        map: null,
        count: 1,
        results: [],
        authorText: null,
        copyrightText: null,
        defaultTitle: null,
        defaultFormat: null,
        defaultLayout: null,
        growler: null,
        //lcs - Print Enhancements BEGIN
        noTitleBlockPrefix: null,
        layoutParams: null,
        relativeScale: null,
        relativeScaleFactor: null,
        scalePrecision: null,
        mapScales: null,
        outWkid: null,
        showLayout: null,
        suspendExtentHandler: false,
        // scaleLabelMaps defines the location of scale labels for an array of scales with length equal to the index in this array + 1
        // (e.g. an array of scales with length 7 would have labels for the first, third, fifth, and seventh scales ([0, 2, 4, 6]))
        scaleLabelMaps: [[0],[0,1],[0,1,2],[0,1,2,3],[0,1,2,3,4],[0,5],[0,2,4,6],[0,7],[0,2,4,6,8],[0,3,6,9],[0,5,10],[0,11],[0,6,12],
                         [0,13],[0,7,14],[0,5,10,15],[0,4,8,12,16],[0,17],[0,9,18],[0,19],[0,5,10,15,20],[0,7,14,21],[0,11,22],[0,23],
                         [0,6,12,18,24],[0,5,10,15,20,25],[0,13,26],[0,9,18,27],[0,7,14,21,28],[0,29],[0,10,19,30],[0,8,16,23,31],
                         [0,8,16,24,32],[0,11,22,33],[0,17,34],[0,7,14,24,28,35],[0,9,18,28,36],[0,37],[0,19,38],[0,13,25,39]], 
        //lcs - Print Enhancements END
        baseClass: 'gis_PrintPlusDijit',
        pdfIcon: require.toUrl('gis/dijit/PrintPlus/images/pdf.png'),
        imageIcon: require.toUrl('gis/dijit/PrintPlus/images/image.png'),
        printTaskURL: null,
        printTask: null,
        postCreate: function() {
            this.inherited(arguments);
            this.printTask = new esri.tasks.PrintTask(this.printTaskURL);
            this.printparams = new esri.tasks.PrintParameters();
            this.printparams.map = this.map;
            this.printparams.outSpatialReference = (this.outWkid && this.outWkid !== undefined) ? new SpatialReference(this.outWkid) : this.map.spatialReference;
            // lcs - Print Enhancements BEGIN
            if (this.showLayout) {
                this.mapUnitsToMeters = this.getUnitToMetersFactor(this.map._params.units);  //lcs - Print Enhancements (this may break in future API releases)
                if (isNaN(this.mapUnitsToMeters.x) || isNaN(this.mapUnitsToMeters.y)) {
                    this.showLayout = false;
                } else if (this.map._params.units === Units.DECIMAL_DEGREES || this.map.spatialReference.isWebMercator) {
                    this.printGL = new esri.layers.GraphicsLayer({ id: 'printGraphics', opacity: 1.0 });
                    this.map.addLayer(this.printGL);
                    this.printGL.enableMouseEvents();  //lcs - Print Enhancements
                    var e = this.map.extent;  // change this to get the initial extent???
                    var lineN = new Polyline(this.map.spatialReference);
                    lineN.addPath([[e.xmin, e.ymax], [e.xmax, e.ymax]]);
                    var lineS = new Polyline(this.map.spatialReference);
                    lineS.addPath([[e.xmin, e.ymin], [e.xmax, e.ymin]]);
                    var lineE = new Polyline(this.map.spatialReference);
                    lineE.addPath([[e.xmax, e.ymax], [e.xmax, e.ymin]]);
                    var lineW = new Polyline(this.map.spatialReference);
                    lineW.addPath([[e.xmin, e.ymax], [e.xmin, e.ymin]]);
                    var eDims = { x: e.getWidth(), y: e.getHeight() };
                    //console.log('eDims:', eDims);
                    var lp = new LengthsParameters();
                    lp.polylines = [lineN, lineS, lineE, lineW];
                    lp.lengthUnit = esri.config.defaults.geometryService.UNIT_METER;
                    lp.geodesic = true;
                    esri.config.defaults.geometryService.lengths(lp, 
                        lang.hitch(this, function(result) {
                            //console.log('result:', result);
                            //console.log('eDims:', eDims);
                            if (result.lengths.length === 4) {
                                var southRatio = (result.lengths[0] / eDims.x);
                                //console.log('southRatio:', southRatio);
                                var northRatio = (result.lengths[1] / eDims.x);
                                //console.log('northRatio:', northRatio);
                                var westRatio = (result.lengths[2] / eDims.y);
                                //console.log('westRatio:', westRatio);
                                var eastRatio = (result.lengths[3] / eDims.y);
                                //console.log('eastRatio:', eastRatio);
                                // put in a check to fail if the ratios are too different?
                                var variation = [Math.abs(1 - (southRatio / northRatio)), Math.abs(1 - (westRatio / eastRatio))];
                                //console.log('variation:', variation);

                                this.mapUnitsToMeters.x *= (southRatio + northRatio) / 2;
                                this.mapUnitsToMeters.y *= (westRatio + eastRatio) / 2;
                            } else {
                                //console.log('error');
                                this.showLayout = false;
                                if (this.growler) {
                                    this.growler.growl({
                                        title: "Get Map Units to Layout Units Conversion Factors",
                                        message: "Calculating conversion factors failed.  Print layouts will not be shown on the map."
                                    });
                                }
                            }
                        }),
                        lang.hitch(this, function(error) {
                            console.log('error');
                            this.showLayout = false;
                            if (this.growler) {
                                this.growler.growl({
                                    title: "Get Map Units to Layout Units Conversion Factors",
                                    message: "Calculating conversion factors failed.  Print layouts will not be shown on the map."
                                });
                            }
                        })
                    );
                } else {
                    this.printGL = new esri.layers.GraphicsLayer({ id: 'printGraphics', opacity: 1.0 });
                    this.map.addLayer(this.printGL);
                    this.printGL.enableMouseEvents();
                }
            }
            if (this.showLayout) {
                this.printRequested = false;
                this.initializeFeatureLayers();
            }
            // lcs - Print Enhancements END
            
            esri.request({
                url: this.printTaskURL,
                content: {
                    f: 'json'
                },
                handleAs: 'json',
                callbackParamName: 'callback',
                load: lang.hitch(this, '_handlePrintInfo'),
                error: lang.hitch(this, '_handleError')
            });
            //aspect.after(this.printTask, '_createOperationalLayers', this.operationalLayersInspector, false);
        },
        operationalLayersInspector: function(opLayers) {
            console.log(opLayers);
            array.forEach(opLayers, function(layer) {
                if (layer.id === 'Measurement_graphicslayer') {
                    array.forEach(layer.featureCollection.layers, function(fcLayer) {
                        array.forEach(fcLayer.featureSet.features, function(feature) {
                            delete feature.attributes;
                            feature.symbol.font.family = 'Courier';
                            //feature.symbol.font.variant = esri.symbol.Font.VARIANT_NORMAL;
                            //feature.symbol.font.size = '32pt';
                        });
                    });
                }
            });
            return opLayers;
        },
        initializeFeatureLayers: function() {
            this.featureLayerStatus = [];
            array.forEach(this.map.graphicsLayerIds, lang.hitch(this, function(item) {
                var l = this.map.getLayer(item);
                if (l.hasOwnProperty('type') && l.type === 'Feature Layer') {
                    this.featureLayerStatus.push({ id: l.id, value: true });
                    l.on('update-start', lang.hitch(this, function(evt) {
                        array.forEach(this.featureLayerStatus, function(item) {
                            if (item.id === l.id) { item.value = false; }
                        });
                        //console.log('update-start:', l.id, 'this.featureLayerStatus:', this.featureLayerStatus);
                    }));
                    l.on('update-end', lang.hitch(this, function(evt) {
                        array.forEach(this.featureLayerStatus, function(item) {
                            if (item.id === l.id) { item.value = true; }
                        });
                        //console.log('update-end:', l.id, 'this.featureLayerStatus:', this.featureLayerStatus);
                        this.printAndRestoreSettings();
                    }));
                }
            }));
            //console.log('initializeFeatureLayers', 'this.featureLayerStatus:', this.featureLayerStatus);
        },
        _handleError: function(err) {
            console.log(1, err);
        },
        _handlePrintInfo: function(data) {
            //lcs - Print Enhancements BEGIN (somehow, this is required to set the value of this.noTitleBlockPrefix)
            var dummy = new Memory({
                data: this.noTitleBlockPrefix
            });
            var prefix = this.noTitleBlockPrefix;
            //lcs - Print Enhancements END
            
            var Layout_Template = array.filter(data.parameters, function(param, idx) {
                return param.name === 'Layout_Template';
            });
            if (Layout_Template.length === 0) {
                console.log('print service parameters name for templates must be "Layout_Template"');
                return;
            }
            var allLayoutItems = Layout_Template[0].choiceList;  //lcs Print Enhancements
            var layoutItems = array.map(Layout_Template[0].choiceList, function(item, i) {
                return {
                    name: item,
                    id: item
                };
            });
           
            //lcs - Print Enhancements BEGIN 
            // Filter out the No Title Block templates
            layoutItems = array.filter(layoutItems, function(item) {
                return item.name.indexOf(prefix) !== 0;
            });
            
            // Replace the names with the aliases
            var keys = Object.keys(this.layoutParams);
            array.forEach(layoutItems, lang.hitch(this, function(item) {
               var index = array.indexOf(keys, item.id);
               item.name = this.layoutParams[keys[index]].alias;
            }));
            
            // Sort the layouts in the order they are listed in layoutParams (config.js).  If a layout is not included in layoutParams
            // (and has not been eliminated by the noTitleBlockPrefix filter above), put it at the end of the list.
            layoutItems.sort(function(a, b) {
                var bIndex = array.indexOf(keys, b.id);
                return (bIndex !== -1) ? array.indexOf(keys, a.id) - bIndex : -1;
            });
            
            // Replace this sort with the above sort
            // layoutItems.sort(function(a, b) {
                // return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);
            // });
            //lcs - Print Enhancements END
            
            var layout = new Memory({
                data: layoutItems
            });
            this.layoutDijit.set('store', layout);
            if (this.defaultLayout) {
                this.layoutDijit.set('value', this.defaultLayout);
            } else {
                this.layoutDijit.set('value', Layout_Template[0].defaultValue);
            }

            var Format = array.filter(data.parameters, function(param, idx) {
                return param.name === 'Format';
            });
            if (Format.length === 0) {
                console.log('print service parameters name for format must be "Format"');
                return;
            }
            var formatItems = array.map(Format[0].choiceList, function(item, i) {
                return {
                    name: item,
                    id: item
                };
            });
            formatItems.sort(function(a, b) {
                return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);
            });
            var format = new Memory({
                data: formatItems
            });
            this.formatDijit.set('store', format);
            if (this.defaultFormat) {
                this.formatDijit.set('value', this.defaultFormat);
            } else {
                this.formatDijit.set('value', Format[0].defaultValue);
            }
        },
        //lcs - Print Enhancements - added this function
        print: function() {
            if (!this.showLayout) {
                // If not showing the layout footprint, just call the original print function (renamed to submitPrintJob).
                this.printRequested = false;
                this.submitPrintJob();
            } else if (this.printSettingsFormDijit.get('value').layout === 'MAP_ONLY') {
                // For MAP_ONLY, just call the original print function (renamed to submitPrintJob).
                this.printRequested = false;
                this.submitPrintJob();
                return;
            } else if (!this.printRequested) {
                // Don't do anything if a print has already been requested.
                // If a print has not been requested, get the current map extent, 
                // graphics layer opacity, and LODs (if the map has LODs).
                this.printRequested = true;
                var printScale = this.scaleSliderDijit.get('value');
                this.oldExtent = this.map.extent;
                this.oldOpacity = this.printGL.opacity;
                this.printGL.opacity = 0;
                this.printGL.redraw();
                this.oldLODs = null;
                this.suspendExtentHandler = true;  //Suspend the Extent change handler
                var deferred;
                //if (this.map._params.tileInfo && this.map._params.tileInfo.lods) {
                if (lang.exists(this.map._params.tileInfo.lods)) {
                    this.oldLODs = this.map._params.tileInfo.lods;
                    // Set one LOD for the printing scale and zoom to it.
                    var resolution = printScale / (this.oldLODs[0].scale / this.oldLODs[0].resolution);
                    this.map._params.tileInfo.lods = [{"level": 0, "resolution": resolution, "scale": printScale}];
                    deferred = this.map.centerAndZoom(this.mapAreaCenter, 0);
                } else {
                    // Zoom to the print scale
                    deferred = this.map.centerAndZoom(this.mapAreaCenter, printScale / this.map.getScale());
                }
                deferred.then(lang.hitch(this, 'printAndRestoreSettings'));
            }
        },
        //lcs - Print Enhancements - added this function
        printAndRestoreSettings: function() {
            // This function is called by the print function and every feature layer's 'update-end' event.
            // Don't do anything unless the print button was clicked and all feature layers have been updated.
            if (this.printRequested && array.every(this.featureLayerStatus, function(item) { return item.value; })) {
                this.printRequested = false;
                
                this.submitPrintJob();
                
                // Restore the map extent, the graphics layer opacity, and the LODs (if the map has LODs).
                if (this.oldLODs) {
                    this.map._params.tileInfo.lods = this.oldLODs;
                }
                var deferred = this.map.setExtent(this.oldExtent);
                deferred.then(lang.hitch(this, function() {
                    this.suspendExtentHandler = false;
                    this.printGL.opacity = this.oldOpacity;
                    this.printGL.redraw();
                }));
            }
        },
        //lcs - Print Enhancements - changed the name of this function from "print" to "submitPrintJob"
        submitPrintJob: function() {
            if (this.printSettingsFormDijit.isValid()) {
                var form = this.printSettingsFormDijit.get('value');
                var preserve = this.preserveFormDijit.get('value'); 
                if (form.layout !== 'MAP_ONLY') {  
                    // Set this here so it doesn't change the user's settings for MAP_ONLY
                    preserve.preserveScale = true;  
                }  
                lang.mixin(form, preserve);
                var layoutForm = this.layoutFormDijit.get('value');
                var mapQualityForm = this.mapQualityFormDijit.get('value');
                var dpi = mapQualityForm.dpi;
                var mapOnlyForm = this.mapOnlyFormDijit.get('value');
                mapOnlyForm.width = mapOnlyForm.width * dpi;
                mapOnlyForm.height = mapOnlyForm.height * dpi;
                if (mapOnlyForm.printUnits === Units.CENTIMETERS) {
                    mapOnlyForm.width = mapOnlyForm.width / 2.54;
                    mapOnlyForm.height = mapOnlyForm.height / 2.54;
                }
                lang.mixin(mapOnlyForm, mapQualityForm);

                var template = new esri.tasks.PrintTemplate();
                template.format = form.format;
                //lcs template.layout = form.layout;
                template.layout = form.titleBlock[0] ? form.layout : this.noTitleBlockPrefix + form.layout;  //lcs Print Enhancements
                template.preserveScale = form.preserveScale === 'true';
                template.label = form.title;
                template.exportOptions = mapOnlyForm;
                template.layoutOptions = {
                    authorText: form.author,
                    copyrightText: this.copyrightText,
                    legendLayers: (layoutForm.legend.length > 0 && layoutForm.legend[0]) ? null : [],
                    titleText: form.title,
                    scalebarUnit: layoutForm.scalebarUnit 
                };
                this.printparams.template = template;
                var fileHandel = this.printTask.execute(this.printparams);

                var result = new printResultDijit({
                    count: this.count.toString(),
                    icon: (form.format === 'PDF') ? this.pdfIcon : this.imageIcon,
                    docName: form.title,
                    title: form.format + ', ' + form.layout,
                    fileHandle: fileHandel
                }).placeAt(this.printResultsNode, 'last');
                result.startup();
                Style.set(this.clearActionBarNode, 'display', 'block');
                this.count++;
            } else {
                this.printSettingsFormDijit.validate();
            }
        },
        clearResults: function() {
            domConstruct.empty(this.printResultsNode);
            Style.set(this.clearActionBarNode, 'display', 'none');
            this.count = 1;
        },
        //lcs - Print Enhancements BEGIN
        _onTitleBlockChange: function(value) {
            // Don't draw a map sheet if the conversion from map units to meters is not known (e.g. Geographic Coordinate Systems)
            if (!this.showLayout) {
                return;
            }
            
            this.setPrintOptionVisibilities();
            this.printGL.clear();
            this.setScaleRanges();
            this.drawMapSheet(this.mapAreaCenter);           
        },
        _onLayoutChange: function(layout) {
            // Controller.js calls the function with a boolean argument whenever the widget is opened or closed (true means it is open).
            // The layout dropdown calls the function with the name of the layout on the change event.
            
            // Set the cursor position to the left end of the value 
            // (in case the value is longer than the available space).
            var layoutNode = this.layoutDijit;
            layoutNode.focusNode.selectionStart = 0;
            layoutNode.focusNode.selectionEnd = 0;
            
            // Set the visibilities of the controls based on the layout selected.
            this.setPrintOptionVisibilities();
            
            // Don't draw a map sheet if the conversion from map units to meters is not known (e.g. Geographic Coordinate Systems)
            if (!this.showLayout) {
                return;
            }
            
            if (this.domNode.scrollHeight === 0) {
                return;
            }
            
            if (typeof layout === 'boolean') {
                if (layout) { 
                    var form = this.printSettingsFormDijit.get('value');
                    layout = form.layout;
                } else {
                    this.printGL.clear();
                    if (this._zoomEndHandler) {
                        this._zoomEndHandler.remove();
                        this._zoomEndHandler = null;
                    }
                    if (this._panEndHandler) {
                        this._panEndHandler.remove();
                        this._panEndHandler = null;
                    }
                    return; 
                }
            }
            
            if (layout === 'MAP_ONLY') {
                // Delete the map sheet graphic and remove its mouse handlers
                this.printGL.clear();
                if (this._zoomEndHandler) {
                    this._zoomEndHandler.remove();
                    this._zoomEndHandler = null;
                }
                if (this._panEndHandler) {
                    this._panEndHandler.remove();
                    this._panEndHandler = null;
                }

                // Set the map sketch to reflect the settings
                this._adjustMapSketch();
            } else {
                if (!this._zoomEndHandler) {
                    this._zoomEndHandler = this.map.on('zoom-end', lang.hitch(this, "adjustLayoutToMap"));
                }
                if (!this._panEndHandler) {
                    this._panEndHandler = this.map.on('pan-end', lang.hitch(this, "adjustLayoutToMap"));
                }
                for (var key in this.layoutParams) {
                    if (key === layout) {
                        var layoutParam = this.layoutParams[key];
                        var layoutUnitsToMeters = this.getUnitToMetersFactor(layoutParam.units);
                        this.mapSheetParams = {
                            layout: layout,
                            pageSize: layoutParam.params[0],
                            mapSize: layoutParam.params[1],
                            pageOffsets: layoutParam.params[2],
                            noTbBorders: layoutParam.params[3],
                            unitRatio: {x: layoutUnitsToMeters.x / this.mapUnitsToMeters.x, y: layoutUnitsToMeters.y / this.mapUnitsToMeters.y}
                        };
                        break;
                    }
                }
                
                this.printGL.clear();
                var centerPt = this.map.extent.getCenter();
                var printScale = this.scaleSliderDijit.get('value');
                this.setScaleRanges();
                this.drawMapSheet(centerPt);           
                var moveStartPt;
                var mapSheetMoving = false;
                this.printGL.on('mouse-down', lang.hitch(this, function (evt) {
                    if (evt.graphic.id === this.mapSheetGraphicId) {
                        //console.log('start moving map sheet');
                        this.map.disablePan();
                        this.mapSheetMoving = true;
                        this.moveStartPt = evt.mapPoint;
                    }
                }));
                this.printGL.on('mouse-drag', lang.hitch(this, function (evt) {
                    if (evt.graphic.id === this.mapSheetGraphicId && this.mapSheetMoving) {
                        //console.log('dragging map sheet');
                        var moveEndPt = evt.mapPoint;
                        var xOffset = moveEndPt.x - this.moveStartPt.x;
                        var yOffset = moveEndPt.y - this.moveStartPt.y;
                        this.moveMapSheet(evt.graphic, xOffset, yOffset);
                        this.moveStartPt = moveEndPt;
                        if (!this.map.extent.contains(this.mapAreaExtent)) {
                            this.adjustMapToLayout();
                        }
                    }
                }));
                this.printGL.on('mouse-out', lang.hitch(this, function(evt) {
                    //console.log('finished dragging map sheet');
                    this.map.enablePan();
                    this.mapSheetMoving = false;
                }));
                this.printGL.on('mouse-up', lang.hitch(this, function (evt) {
                    if (evt.graphic.id === this.mapSheetGraphicId && this.mapSheetMoving) {
                        //console.log('finished dragging map sheet');
                        this.map.enablePan();
                        this.mapSheetMoving = false;
                    }
                }));
            }
        },
        _onScaleBoxChange: function(value) {
            this.scaleSliderDijit.set('value', value);
        },
        _onScaleSliderChange: function(value) {
            // Don't draw a map sheet if the conversion from map units to meters is not known (e.g. Geographic Coordinate Systems)
            if (!this.showLayout) {
                return;
            }
            
            this.scaleBoxDijit.set('value', value);

            var form = this.printSettingsFormDijit.get('value');
            var layout = form.layout;
            dom.byId('relativeScale').innerHTML = this.relativeScale.replace('[value]', number.format(value * this.relativeScaleFactor, {places: this.scalePrecision} ));
            this.printGL.clear();
            if (!this.mapAreaCenter) {
                this.mapAreaCenter = this.map.extent.getCenter();  
            }
            this.drawMapSheet(this.mapAreaCenter);           
        },
        setPrintOptionVisibilities: function() {
            var form = this.printSettingsFormDijit.get('value');
            var layout = form.layout;
            var titleBlock = form.titleBlock[0];
            var state;
            if (!this.showLayout && layout === 'MAP_ONLY') {
                //Don't show the map layout graphic options, but show the 'MAP_ONLY' options
                state = 'A';
            } else if (!this.showLayout) {
                //Don't show the map layout graphic options or the 'MAP_ONLY' options
                state = 'B';
            } else if (layout === 'MAP_ONLY') {
                //Don't show the map layout graphic options, but show the 'MAP_ONLY' options
                state = 'C';
            } else if (titleBlock) {
                //Show the map layout graphic options for the layout template with a title block, but don't show the 'MAP_ONLY' options
                state = 'D';
            } else {
                //Show the map layout graphic options for the layout template without a title block, don't show the 'MAP_ONLY' options
                state = 'E';
            }
            //console.log('state:', state);
            var printOptions = {
                'relativeScale':      { A: 'none',   B: 'none',   C: 'none',   D: 'inline',    E: 'inline'   },
                'scaleBoxRow':        { A: 'none',   B: 'none',   C: 'none',   D: 'table-row', E: 'table-row'},
                'scaleSliderRow':     { A: 'none',   B: 'none',   C: 'none',   D: 'table-row', E: 'table-row'},
                'titleBlock':         { A: 'none',   B: 'none',   C: 'none',   D: 'inline',    E: 'inline'   },
                'mapScaleExtent':     { A: 'inline', B: 'inline', C: 'inline', D: 'none',      E: 'none'     },
                'preserve':           { A: 'inline', B: 'inline', C: 'inline', D: 'none',      E: 'none'     },
                'fullLayoutOptions':  { A: 'none',   B: 'inline', C: 'none',   D: 'inline',    E: 'none'     },
                'scaleLegendOptions': { A: 'none',   B: 'inline', C: 'none',   D: 'inline',    E: 'none'     },
                'mapOnlyOptions':     { A: 'inline', B: 'none',   C: 'inline', D: 'none',      E: 'none'     },
                'mapWidthHeight':     { A: 'inline', B: 'none',   C: 'inline', D: 'none',      E: 'none'     },
                'mapSketch':          { A: 'none',   B: 'none',   C: 'block',  D: 'none',      E: 'none'     },
                'mapSketchLegend':    { A: 'none',   B: 'none',   C: 'inline', D: 'none',      E: 'none'     }
            };
            // Add the map sketch settings here
            
            for (var key in printOptions) {
                var style = dom.byId(key).style;
                if (style) {
                    style.display = printOptions[key][state];
                }
            }
        },
        drawMapSheet: function(centerPt) {
            var scale = this.scaleSliderDijit.get('value');
            var titleBlock = this.titleBlockDijit.get('value');
            var pageSize = this.mapSheetParams.pageSize;
            var unitRatio = this.mapSheetParams.unitRatio;
            var mapOffsets;
            var mapDims;
            
            if (titleBlock) {
                mapOffsets = this.mapSheetParams.pageOffsets;
                mapDims = this.mapSheetParams.mapSize;
            } else {
                mapOffsets = this.mapSheetParams.noTbBorders;
                mapDims = { x: pageSize.x - mapOffsets.x * 2, y: pageSize.y - mapOffsets.y * 2 };
            }
            
            // Calculate the boundaries for the print area
            var minX = centerPt.x - mapDims.x / 2 * scale * unitRatio.x;
            var minY = centerPt.y - mapDims.y / 2 * scale * unitRatio.y;
            var maxX = centerPt.x + mapDims.x / 2 * scale * unitRatio.x;
            var maxY = centerPt.y + mapDims.y / 2 * scale * unitRatio.y;
            
            // List the points in counter-clockwise order (this is the hole for the map)
            var printAreaRing = [[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY], [minX, minY]];
            
            // Update the map area center and extent so other functions can use them
            this.mapAreaCenter = centerPt;
            this.mapAreaExtent = new Extent(minX, minY, maxX, maxY, this.map.spatialReference);
            
            // Calculate the boundaries for the sheet boundary
            minX = minX - mapOffsets.x * scale * unitRatio.x;
            minY = minY - mapOffsets.y * scale * unitRatio.y;
            maxX = minX + pageSize.x * scale * unitRatio.x;
            maxY = minY + pageSize.y * scale * unitRatio.y;
            
            // list the points in clockwise order (this is the paper)
            var printPageRing = [[minX, minY], [minX, maxY], [maxX, maxY], [maxX, minY], [minX, minY]];
            
            printPageGeom = new Polygon(this.map.spatialReference);
            printPageGeom.addRing(printAreaRing);
            printPageGeom.addRing(printPageRing);
            
            var polygonSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,0,0,0.60]), 4),
                                new Color([255,0,0,0.40]));
            
            var gra = new Graphic(printPageGeom, polygonSymbol);
            gra.id = this.mapSheetGraphicId;
            this.printGL.add(gra);
        },
        moveMapSheet: function(gra, xOffset, yOffset) {
            this.mapAreaCenter = this.mapAreaCenter.offset(xOffset, yOffset);
            this.mapAreaExtent = this.mapAreaExtent.centerAt(this.mapAreaCenter);

            var polygon = new Polygon(gra.geometry);
            for (var i = 0; i < polygon.rings.length; i++) {
                for (var j = 0; j < polygon.rings[i].length; j++) {
                    var pt = polygon.getPoint(i, j).offset(xOffset, yOffset);
                    polygon.setPoint(i, j, pt);
                }
            }
            gra.setGeometry(polygon);
            gra.getLayer().redraw();
        },
        _adjustMapSketch: function() {
            // Get the preserve, width, and height settings and draw the map sketch if there is enough data
            var preserveScale = this.preserveFormDijit.get('value').preserveScale === 'true'; 
            var mapOnlyForm = this.mapOnlyFormDijit.get('value');
            var printWidth = mapOnlyForm.width;
            var printHeight = mapOnlyForm.height;
            var printUnits = mapOnlyForm.printUnits;
            
            if (printWidth <= 0 || printHeight <= 0) {
                // Can't draw the sketch
            }
            
            var max = 200;  // This should be coordinated with the width of the layoutDropDownDijit
            var offset = 47;  // This should be coordinated with the width of the layoutDropDownDijit
            
            // Get the dimensions of the paper map and the map in the browser window projected onto paper.
            paperAspectRatio = printWidth / printHeight;
            browserAspectRatio = this.map.width / this.map.height;
            var paperMapDims = new Dims(printWidth, printHeight);
            var browserMapDims;
            if (preserveScale) {
                var layoutUnitsToMeters = this.getUnitToMetersFactor(printUnits);
                var unitRatio = {x: layoutUnitsToMeters.x / this.mapUnitsToMeters.x, y: layoutUnitsToMeters.y / this.mapUnitsToMeters.y};
                var scale = this.map.getScale();
                browserMapDims = new Dims(this.map.extent.getWidth() / scale / unitRatio.x, this.map.extent.getHeight() / scale / unitRatio.y);
            } else {
                if (paperAspectRatio > browserAspectRatio) {
                    browserMapDims = new Dims(paperMapDims.x * browserAspectRatio / paperAspectRatio, paperMapDims.y);
                } else {
                    browserMapDims = new Dims(paperMapDims.x, paperMapDims.y * paperAspectRatio / browserAspectRatio);
                }
            }
            
            // Normalize the map sizes to the space available
            var normalize = Math.max(paperMapDims.x, paperMapDims.y, browserMapDims.x, browserMapDims.y) / max;
            paperMapDims = new Dims(paperMapDims.x / normalize, paperMapDims.y / normalize);
            browserMapDims = new Dims(browserMapDims.x / normalize, browserMapDims.y / normalize);
            
            // Calculate the offsets required to center both rectangles
            var paperMapOffset = new Dims((offset + max - paperMapDims.x) / 2, Math.max(0, (browserMapDims.y - paperMapDims.y) / 2));
            var browserMapOffset = new Dims((offset + max - browserMapDims.x) / 2, Math.max(0, (paperMapDims.y - browserMapDims.y) / 2));
            
            // Draw the paper map extent
            var paperMap = dom.byId('paperMap');
            paperMap.style.position = (paperMapDims.y <= browserMapDims.y) ? 'absolute' : 'relative';
            paperMap.style.width = paperMapDims.x.toFixed(0) + 'px';
            paperMap.style.height = paperMapDims.y.toFixed(0) + 'px';
            paperMap.style.left = paperMapOffset.x.toFixed(0) + 'px';
            paperMap.style.top = paperMapOffset.y.toFixed(0) + 'px';

            // Draw the extent of the map in the  browser window
            var browserMap = dom.byId('browserMap');
            browserMap.style.position = (browserMapDims.y < paperMapDims.y) ? 'absolute' : 'relative';
            browserMap.style.width = browserMapDims.x.toFixed(0) + 'px';
            browserMap.style.height = browserMapDims.y.toFixed(0) + 'px';
            browserMap.style.left = browserMapOffset.x.toFixed(0) + 'px';
            browserMap.style.top = browserMapOffset.y.toFixed(0) + 'px';
            
            // The Dims object is like a Point, only much leaner
            function Dims(x, y) {
                this.x = x;
                this.y = y;
            }            
        },
        adjustLayoutToMap: function(evt) {
            if (!this.suspendExtentHandler) {
                var centerPt;
                if (evt.hasOwnProperty('level')) {
                    // This was a zoom, so reset the scales and redraw the map sheet
                    this.setScaleRanges();
                    centerPt = evt.extent.getCenter();
                    this.printGL.clear();
                    this.drawMapSheet(centerPt);
                }
                if (this.mapAreaExtent && !evt.extent.contains(this.mapAreaExtent)) {
                    // Map extent does not contain the layout's map area, so get correction
                    var correction = this.getCorrection();
                    centerPt = this.mapAreaCenter.offset(correction.x, correction.y);
                    this.printGL.clear();
                    this.drawMapSheet(centerPt);
                }
            }
        },
        adjustMapToLayout: function() {
            var correction = this.getCorrection();
            this.suspendExtentHandler = true;
            this.map.setExtent(this.map.extent.offset(-correction.x, -correction.y));
            this.suspendExtentHandler = false;
        },
        getCorrection: function() {
            var correction = { x: 0, y: 0 };
            var mapExtent = this.map.extent;
            if (mapExtent.xmin > this.mapAreaExtent.xmin) { correction.x = mapExtent.xmin - this.mapAreaExtent.xmin; }
            if (mapExtent.ymin > this.mapAreaExtent.ymin) { correction.y = mapExtent.ymin - this.mapAreaExtent.ymin; }
            if (mapExtent.xmax < this.mapAreaExtent.xmax) { correction.x = mapExtent.xmax - this.mapAreaExtent.xmax; }
            if (mapExtent.ymax < this.mapAreaExtent.ymax) { correction.y = mapExtent.ymax - this.mapAreaExtent.ymax; }
            return correction;
        },
        setScaleRanges: function() {
            var form = this.printSettingsFormDijit.get('value');
            var titleBlock = form.titleBlock[0];
            var layout = this.mapSheetParams.layout;
            var pageSize = this.mapSheetParams.pageSize;
            var mapSize = this.mapSheetParams.mapSize;
            var noTbBorders = this.mapSheetParams.noTbBorders;
            var unitRatio = this.mapSheetParams.unitRatio;
            var maxScale;
            var mapExtent = this.map.extent;
            
            //get the maximum scale of the map
            if (layout === 'MAP_ONLY') {
               return;
            }
            
            if (!isNaN(unitRatio.x) && !isNaN(unitRatio.y)) {
                if (titleBlock) {
                    maxScale = Math.ceil(Math.min(mapExtent.getHeight() / mapSize.y / unitRatio.y, 
                                                  mapExtent.getWidth() / mapSize.x / unitRatio.x));
                } else {
                    maxScale = Math.ceil(Math.min(mapExtent.getHeight() / (pageSize.y - noTbBorders.y * 2) / unitRatio.y, 
                                                  mapExtent.getWidth() / (pageSize.x - noTbBorders.x * 2) / unitRatio.x));
                }
            } else {
                maxScale = this.map.scale;
            }
            
            // set the ranges on the scale slider
            scaleArray = getValidScales(maxScale, this.mapScales);
            maxScale = scaleArray[0];
            var snapInterval = getSnapInterval(scaleArray);
            var minScale = scaleArray[scaleArray.length - 1];
            var oldScale = this.scaleSliderDijit.get('value');
            var startingScale = getSnapScale(oldScale, scaleArray);
            var discreteScales = ((maxScale - minScale) / snapInterval) + 1;
            this.scaleBoxDijit.set('value', startingScale);
            this.scaleBoxDijit.set('data-dojo-props', 'constraints:{min:' + minScale.toString() + ',max:' + maxScale.toString() + ',places:0,pattern:"000,000"}');
            this.scaleBoxDijit.set('invalidMessage', 'Invalid scale');
            this.scaleSliderDijit.set('minimum', minScale);
            this.scaleSliderDijit.set('maximum', maxScale);
            this.scaleSliderDijit.set('value', startingScale);
            this.scaleSliderDijit.set('discreteValues', discreteScales);
            
            // The scale labels (number of labels based on number of scales in scaleArray)
            var labels = getLabels(minScale, snapInterval, this.scaleLabelMaps[discreteScales - 1]);

            // The ticks for each scale increment
            if (this.sliderRule) {
                this.sliderRule.destroy();
            }
            var scaleSliderDom = dom.byId('scaleSlider');
            var ruleNode = domConstruct.create("div", {}, scaleSliderDom, "last");  //dojo.byId
            this.sliderRule = new HorizontalRule({
                container: "bottomDecoration",
                count: discreteScales,
                ruleStyle: "border-width: thin;",
                style: "width: 94%; left: 3%; height: 8px;"
            }, ruleNode);
            this.sliderRule.startup();
            
            // The longer ticks for each scale label
            if (this.sliderRule1) {
                this.sliderRule1.destroy();
            }
            var ruleNode1 = domConstruct.create("div", {}, scaleSliderDom, "last");  //dojo.byId
            this.sliderRule1 = new HorizontalRule({
                container: "bottomDecoration",
                count: labels.length,
                ruleStyle: "border-width: thin;",
                style: "width: 94%; left: 3%; height: 4px;"
            }, ruleNode1);
            this.sliderRule1.startup();
            
            // The scale labels
            if (this.sliderLabels) {
                this.sliderLabels.destroy();
            }
            var labelsNode = domConstruct.create("div", {}, scaleSliderDom, "last");  //dojo.byId
            this.sliderLabels = new HorizontalRuleLabels({
                container: "bottomDecoration",
                labels: labels,
                style: "width: 94%; left: 3%; height: 1em; font-size: 10px;"
            }, labelsNode);
            this.sliderLabels.startup();
            
            function getSnapInterval(scales) {
                // This function returns the largest common factor in the scales array.
                var largestFactor = 1;
                var minScale = scales[scales.length - 1];
                var factors = getPrimeFactors(minScale);
                var failedFactors = [];
                var tryFactor;
                
                for (var i = 0; i < factors.length; i++) {
                    // if a tryFactor has failed once, don't try it again
                    if (array.indexOf(failedFactors, largestFactor * factors[i]) === -1) {
                        tryFactor = largestFactor * factors[i];
                        // ignore the largest scale - it was calculated, not taken from the list
                        for (var j = 1; j < scales.length - 1; j++) {
                            if (scales[j] % tryFactor !== 0) {
                                break;
                            }
                        }
    
                        if (j === scales.length - 1) {
                            largestFactor = tryFactor;
                        } else {
                            failedFactors.push(tryFactor);
                        }
                    }
                }
                
                return largestFactor;
            }
            
            function getPrimeFactors(value) {
                // This function returns an array of the factors of value.
                // The numbers 1 and value are never in the array, so if value is a prime number, a zero length array is returned.
                
                var primeFactors = [];
                var newValue = value;
                for (var i = 2; i < value; i++)
                {
                    while (newValue % i === 0) {
                        newValue = newValue / i;
                        primeFactors.push(i);
                    }
                    
                    if (newValue === 1) {
                        break;
                    }
                }
                return primeFactors;
            }
            
            function getValidScales(maxScale, mapScales) {
                var validScales = [];
                var minScale = Math.ceil(maxScale / 7);
                
                for (var i = 0; i < mapScales.length; i++) {
                    var scale = mapScales[i];
                    if (scale < maxScale) {
                        validScales.push(scale);
                    }
                    if (scale < minScale) {
                        break;
                    }
                }
                return validScales;
            }
            
            function getSnapScale(scale, scales) {
                var snapScale;
                if (scale === 0) {
                    // Scale is 0; the widget is just being opened.  Return the scale that will set
                    // the sheet graphic to the largest size that does not include the entire map extent.
                    snapScale = scales[1];
                } else if (array.indexOf(scales, scale) !== -1) {
                    // Scale is one of the values in scales; return scale
                    snapScale = scale;
                } else if (scale > scales[0]) {
                    // Scale is larger than the largest value in scales; return the second largest value in scales
                    snapScale = scales[1];
                } else if (scale < scales[scales.length - 1]) {
                    // Scale is smaller than the smallest value in scales; return the smallest value in scales
                    snapScale = scales[scales.length - 1];
                } else {
                    // Return the value in scales that is closest to scale
                    for (var i = 1; i < scales.length; i++) {
                        if (scale <= scales[i - 1] && scale >= scales[i]) {
                            if (scales[i - 1] - scale > scale - scales[i]) {
                                snapScale = scales[i];
                            } else {
                                snapScale = scales[i - 1];
                            }
                            break;
                        }
                    }
                }
                return snapScale;
            }
            
            function getLabels(minScale, snapInterval, scaleIndices) {
                var labelArray = [];
                var scale;
                for (var i = 0; i < scaleIndices.length; i++) {
                    scale = minScale + (snapInterval * scaleIndices[i]);
                    labelArray.push(number.format(scale, {pattern: '###,###'}));
                }
                return labelArray;
            }
        },
        getUnitToMetersFactor: function(unit) {
            switch (unit)
            {
                case Units.CENTIMETERS:     return {x: 0.01, y: 0.01};         
                case Units.DECIMETERS:      return {x: 0.1, y: 0.1};
                case Units.FEET:            return {x: 0.3048, y: 0.3048};
                case Units.INCHES:          return {x: 0.0254, y: 0.0254};
                case Units.KILOMETERS:      return {x: 100.0, y: 100.0};
                case Units.METERS:          return {x: 1.0, y: 1.0};
                case Units.MILES:           return {x: 1609.344, y: 1609.344};
                case Units.MILLIMETERS:     return {x: 0.001, y: 0.001};
                case Units.NAUTICAL_MILES:  return {x: 1852.0, y: 1852.0};
                case Units.YARDS:           return {x: 0.9144, y: 0.9144};
                case Units.UNKNOWN_UNITS:   return {x: NaN, y: NaN};
                case Units.DECIMAL_DEGREES: return {x: 1.0, y: 1.0};
                default:                    return {x: NaN, y: NaN};
            }
        }
        //lcs - Print Enhancements END
    });

    // Print result dijit
    var printResultDijit = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        widgetsInTemplate: true,
        templateString: printResultTemplate,
        url: null,
        postCreate: function() {
            this.inherited(arguments);
            this.fileHandle.then(lang.hitch(this, '_onPrintComplete'), lang.hitch(this, '_onPrintError'));
        },
        _onPrintComplete: function(data) {
            if (data.url) {
                this.url = data.url;
                this.nameNode.innerHTML = '<span class="bold">' + this.docName + '</span>';
                domClass.add(this.resultNode, 'printResultHover');
            } else {
                this._onPrintError('Error, try again');
            }
        },
        _onPrintError: function(err) {
            console.log(err.toString());  //lcs - BUG - added toString()
            this.nameNode.innerHTML = '<span class="bold">Error, try again</span>';
            domClass.add(this.resultNode, 'printResultError');
        },
        _openPrint: function() {
            if (this.url !== null) {
                window.open(this.url);
            }
        }
    });
    return PrintDijit;
});