define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dojo/_base/lang',
    'dijit/form/DropDownButton',
    'dijit/DropDownMenu',
    'dijit/MenuItem',
    'dojo/_base/array',
    'dojox/lang/functional',
    'dojo/text!./Basemaps/templates/Basemaps.html',
    'dojo/topic',  //lcs
    'dojo/number',  //lcs
    'dojo/Deferred',  //lcs
    'esri/request',  //lcs
    'esri/dijit/BasemapGallery',
    'esri/dijit/BasemapLayer',
    'esri/dijit/Basemap'], function(declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, lang, DropDownButton, DropDownMenu, MenuItem, array, functional, template, topic, number, Deferred, esriRequest, BasemapGallery, BasemapLayer, Basemap) {

    //anonymous function to load CSS files required for this module
    (function() {
        var css = [require.toUrl("gis/dijit/Basemaps/css/Basemaps.css")];
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
    
    // define all valid custom basemaps here. Object of Basemap objects. Key name and basemap id must match. (pass desired basemaps in constructor in custom mode)
    var customBasemaps = {
        streets: {
            title: "Streets",
            contentType: "vector",  //lcs - Basemap Content Type
            basemap: new Basemap({
                id: "streets",
                layers: [new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/Street_Base/MapServer"
                })]
            })
        },
        orthos_2013: {
            title: "2013 Orthos",
            contentType: "raster",  //lcs - Basemap Content Type
            basemap: new Basemap({
                id: "orthos_2013",
                layers: [new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/ImageServices/Hamilton_2013/ImageServer"
                }), new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/Street_Base_Labels/MapServer",
                    isReference: true
                })]
            })
        },
        orthos_2012: {
            title: "2012 Orthos",
            contentType: "raster",  //lcs - Basemap Content Type
            basemap: new Basemap({
                id: "orthos_2012",
                layers: [new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/ImageServices/Hamilton_2012/ImageServer"
                }), new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/Street_Base_Labels/MapServer",
                    isReference: true
                })]
            })
        },
        orthos_2011: {
            title: "2011 Orthos",
            contentType: "raster",  //lcs - Basemap Content Type
            basemap: new Basemap({
                id: "orthos_2011",
                layers: [new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/ImageServices/Hamilton_2011/ImageServer"
                }), new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/Street_Base_Labels/MapServer",
                    isReference: true
                })]
            })
        },
        orthos_2010: {
            title: "2010 Orthos (NAIP)",
            contentType: "raster",  //lcs - Basemap Content Type
            basemap: new Basemap({
                id: "orthos_2010",
                layers: [new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/ImageServices/Hamilton_2010/ImageServer"
                }), new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/Street_Base_Labels/MapServer",
                    isReference: true
                })]
            })
        },
        orthos_2009: {
            title: "2009 Orthos",
            contentType: "raster",  //lcs - Basemap Content Type
            basemap: new Basemap({
                id: "orthos_2009",
                layers: [new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/ImageServices/Hamilton_2009/ImageServer"
                }), new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/Street_Base_Labels/MapServer",
                    isReference: true
                })]
            })
        },
        orthos_2008: {
            title: "2008 Orthos",
            contentType: "raster",  //lcs - Basemap Content Type
            basemap: new Basemap({
                id: "orthos_2008",
                layers: [new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/ImageServices/Hamilton_2008/ImageServer"
                }), new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/Street_Base_Labels/MapServer",
                    isReference: true
                })]
            })
        },
        orthos_2007: {
            title: "2007 Orthos",
            contentType: "raster",  //lcs - Basemap Content Type
            basemap: new Basemap({
                id: "orthos_2007",
                layers: [new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/ImageServices/Hamilton_2007/ImageServer"
                }), new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/Street_Base_Labels/MapServer",
                    isReference: true
                })]
            })
        },
        orthos_2006: {
            title: "2006 Orthos",
            contentType: "raster",  //lcs - Basemap Content Type
            basemap: new Basemap({
                id: "orthos_2006",
                layers: [new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/ImageServices/Hamilton_2006/ImageServer"
                }), new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/Street_Base_Labels/MapServer",
                    isReference: true
                })]
            })
        },
        orthos_2005: {
            title: "2005 Orthos",
            contentType: "raster",  //lcs - Basemap Content Type
            basemap: new Basemap({
                id: "orthos_2005",
                layers: [new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/ImageServices/Hamilton_2005/ImageServer"
                }), new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/Street_Base_Labels/MapServer",
                    isReference: true
                })]
            })
        },
        orthos_2004: {
            title: "2004 Orthos",
            contentType: "raster",  //lcs - Basemap Content Type
            basemap: new Basemap({
                id: "orthos_2004",
                layers: [new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/ImageServices/Hamilton_2004/ImageServer"
                }), new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/Street_Base_Labels/MapServer",
                    isReference: true
                })]
            })
        },
        orthos_2001: {
            title: "2001 Orthos",
            contentType: "raster",  //lcs - Basemap Content Type
            basemap: new Basemap({
                id: "orthos_2001",
                layers: [new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/ImageServices/Hamilton_2001/ImageServer"
                }), new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/Street_Base_Labels/MapServer",
                    isReference: true
                })]
            })
        },
        orthos_2000: {
            title: "2000 Orthos",
            contentType: "raster",  //lcs - Basemap Content Type
            basemap: new Basemap({
                id: "orthos_2000",
                layers: [new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/ImageServices/Hamilton_2000/ImageServer"
                }), new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/Street_Base_Labels/MapServer",
                    isReference: true
                })]
            })
        },
        orthos_1998: {
            title: "1998 Orthos",
            contentType: "raster",  //lcs - Basemap Content Type
            basemap: new Basemap({
                id: "orthos_1998",
                layers: [new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/ImageServices/Hamilton_1998/ImageServer"
                }), new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/Street_Base_Labels/MapServer",
                    isReference: true
                })]
            })
        },
        orthos_1996: {
            title: "1996 Orthos",
            contentType: "raster",  //lcs - Basemap Content Type
            basemap: new Basemap({
                id: "orthos_1996",
                layers: [new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/ImageServices/Hamilton_1996_97/ImageServer"
                }), new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/Street_Base_Labels/MapServer",
                    isReference: true
                })]
            })
        },
        orthos_1994: {
            title: "1994 Orthos",
            contentType: "raster",  //lcs - Basemap Content Type
            basemap: new Basemap({
                id: "orthos_1994",
                layers: [new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/ImageServices/Hamilton_1994/ImageServer"
                }), new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/Street_Base_Labels/MapServer",
                    isReference: true
                })]
            })
        },
        orthos_1985: {
            title: "1985 Orthos",
            contentType: "raster",  //lcs - Basemap Content Type
            basemap: new Basemap({
                id: "orthos_1985",
                layers: [new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/ImageServices/Hamilton_1985_Ortho/ImageServer"
                }), new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/Street_Base_Labels/MapServer",
                    isReference: true
                })]
            })
        },
        orthos_1976: {
            title: "1976 Orthos",
            contentType: "raster",  //lcs - Basemap Content Type
            basemap: new Basemap({
                id: "orthos_1976",
                layers: [new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/ImageServices/Hamilton_1976/ImageServer"
                }), new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/Street_Base_Labels/MapServer",
                    isReference: true
                })]
            })
        },
        orthos_1974: {
            title: "1974 Orthos",  //lcs - Basemap Content Type
            contentType: "raster",  //lcs - Basemap Content Type
            basemap: new Basemap({
                id: "orthos_1974",
                layers: [new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/ImageServices/Hamilton_1974/ImageServer"
                }), new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/Street_Base_Labels/MapServer",
                    isReference: true
                })]
            })
        },
        orthos_1962: {
            title: "1962 Orthos",
            contentType: "raster",  //lcs - Basemap Content Type
            basemap: new Basemap({
                id: "orthos_1962",
                layers: [new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/ImageServices/Hamilton_1962/ImageServer"
                }), new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/Street_Base_Labels/MapServer",
                    isReference: true
                })]
            })
        },
        orthos_1956: {
            title: "1956 Orthos",
            contentType: "raster",  //lcs - Basemap Content Type
            basemap: new Basemap({
                id: "orthos_1956",
                layers: [new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/ImageServices/Hamilton_1956/ImageServer"
                }), new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/Street_Base_Labels/MapServer",
                    isReference: true
                })]
            })
        },
        orthos_1941: {
            title: "1941 Orthos",
            contentType: "raster",  //lcs - Basemap Content Type
            basemap: new Basemap({
                id: "orthos_1941",
                layers: [new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/ImageServices/Hamilton_1941/ImageServer"
                }), new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/Street_Base_Labels/MapServer",
                    isReference: true
                })]
            })
        },
        orthos_1936: {
            title: "1936 Orthos",
            contentType: "raster",  //lcs - Basemap Content Type
            basemap: new Basemap({
                id: "orthos_1936",
                layers: [new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/ImageServices/Hamilton_1936/ImageServer"
                }), new BasemapLayer({
                    url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/Street_Base_Labels/MapServer",
                    isReference: true
                })]
            })
        }
    };

    // all valid arcgisonline basemaps that the map excepts, only change title if desired. (pass desired basmaps in constructor in agol mode)
    var agolBasemaps = {
        streets: {
            title: 'Streets'
        },
        satellite: {
            title: 'Satellite'
        },
        hybrid: {
            title: 'Hybrid'
        },
        topo: {
            title: 'Topo'
        },
        gray: {
            title: 'Gray'
        },
        oceans: {
            title: 'Oceans'
        },
        "national-geographic": {
            title: 'Nat Geo'
        },
        osm: {
            title: 'Open Street Map'
        }
    };

    // main basemap widget
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        widgetsInTemplate: true,
        map: null,
        mode: null,
        title: null,
        //baseClass: 'gis_Basemaps_Dijit',
        buttonClass: 'gis_Basemaps_Button',
        //menuClass: "gis_Basemaps_Menu",
        mapStartBasemap: null,
        basemapsToShow: [],
        opLayers: [],
        validBasemaps: [],
        // postCreate: function() {
            // this.inherited(arguments);
            // var initialTitle = this.mode === "custom" ? customBasemaps[this.mapStartBasemap].title : agolBasemaps[this.mapStartBasemap].title;
            // console.log('initialTitle:', initialTitle);
            // this.title = initialTitle || this.title;
            // console.log('this.title:', this.title);
        // },
        validateCustomBasemapLayers: function() {
            // Get an array of all the layer URLs used in the custom basemaps
            // for the custom basemaps in this.basemapsToShow
            var basemapLayerUrls = [];
            array.forEach(this.basemapsToShow, function(key) {
                var customBasemap = customBasemaps[key];
                if (customBasemap !== undefined) {
                    array.forEach(customBasemap.basemap.layers, function(layer) {
                        if (array.indexOf(basemapLayerUrls, layer.url) === -1) {
                            basemapLayerUrls.push(layer.url);
                        }
                    });
                }
            });
            
            // Get an array of all the valid layer URLs in basemapLayerUrls
            var deferred = new Deferred();
            var validLayerUrls = [];
            var layersRequested = basemapLayerUrls.length;
            var layersProcessed = 0;
            array.forEach(basemapLayerUrls, function(url) {
                var layerRequest = esriRequest({
                    url: url,
                    content: { f: "json" },
                    timeout: 10000,
                    handleAs: "json",
                    callbackParamName: "callback"
                });
                layerRequest.then(
                    lang.hitch(this, function(response) {
                        layersProcessed++;
                        // Add the layer URL to the list of valid layers
                        validLayerUrls.push(url);
                        if (layersProcessed === layersRequested) { 
                            topic.publish('STARTUP_METRICS', { 
                                id: 'validating_custom_basemaps',
                                label: 'Validating Custom Basemaps', 
                                value: 'Complete'
                            });
                            deferred.resolve(validLayerUrls); 
                        } else {
                            topic.publish('STARTUP_METRICS', { 
                                id: 'validating_custom_basemaps',
                                label: 'Validating Custom Basemaps', 
                                value: number.format(layersProcessed / layersRequested, { pattern: '##%' }) 
                            });
                        }
                    }), 
                    lang.hitch(this, function(error) {
                        layersProcessed++;
                        if (layersProcessed === layersRequested) { 
                            topic.publish('STARTUP_METRICS', { 
                                id: 'validating_custom_basemaps',
                                label: 'Validating Custom Basemaps', 
                                value: 'Complete'
                            });
                            deferred.resolve(validLayerUrls); 
                        } else {
                            topic.publish('STARTUP_METRICS', { 
                                id: 'validating_custom_basemaps',
                                label: 'Validating Custom Basemaps', 
                                value: number.format(layersProcessed / layersRequested, { pattern: '##%' }) 
                            });
                        }
                    })
                );
            }, this);
            return deferred.promise;
        },
        createMenu: function(validUrls) {
            this.currentBasemap = this.mapStartBasemap || null;
            var contentType = this.mode === 'custom' && this.currentBasemap ? customBasemaps[this.currentBasemap].contentType : null;
            var rtn = { restoreMapLayers: { version: '$v3', basemap: { contentType: contentType, id: this.currentBasemap, opacity: 1, mode: this.mode } } };
            topic.publish('USER_PREFERENCES', rtn);  //lcs to support User Preferences
            
            //lcs - Set the button label to the title of the initial basemap
            var initialTitle = this.mode === "custom" ? customBasemaps[this.currentBasemap].title : agolBasemaps[this.currentBasemap].title;
            this.dropDownButton.set('label', initialTitle || this.title);

            if (this.mode === "custom") {
                this.gallery = new BasemapGallery({
                    map: this.map,
                    showArcGISBasemaps: false,
                    basemaps: functional.map(customBasemaps, function(map) {
                        return map.basemap;
                    })
                });
                this.gallery.select(this.mapStartBasemap);
                this.gallery.startup();
            }

            this.menu = new DropDownMenu({
                style: "display: none;"//,
                //baseClass: this.menuClass
            });

            if (this.mode === "custom") {
                //this.validBasemaps = functional.keys(customBasemaps);
                this.validBasemaps = this.validateCustomBasemaps(validUrls);
            } else {
                this.validBasemaps = functional.keys(agolBasemaps);
            }

            array.forEach(this.basemapsToShow, function(basemap) {
                if (array.indexOf(this.validBasemaps, basemap) !== -1) {
                    var menuItem = new MenuItem({
                        id: basemap,
                        label: (this.mode === "custom") ? customBasemaps[basemap].title : agolBasemaps[basemap].title,
                        iconClass: (basemap == this.mapStartBasemap) ? 'selectedIcon' : 'emptyIcon',
                        onClick: lang.hitch(this, function() {
                            if (basemap !== this.currentBasemap) {
                                this.dropDownButton.set('label', menuItem.label);  //lcs
                                this.currentBasemap = basemap;
                                var contentType;
                                if (this.mode === "custom") {
                                    this.gallery.select(basemap);
                                    contentType = customBasemaps[basemap].contentType || "vector";  //lcs - Basemap Content Type
                                    for (var i = 0; i < this.opLayers.length; ++i) {
                                        var layerCfg = this.opLayers[i];
                                        if (layerCfg.type === "feature") {
                                            var layer = this.map.getLayer(layerCfg.options.id);
                                            var renderer = (contentType === "vector") ? layerCfg.vectorRenderer : layerCfg.rasterRenderer;  //lcs - Basemap Content Type
                                            layer.setRenderer(renderer);
                                            layer.refresh();
                                        }
                                    }
                                } else {
                                    this.map.setBasemap(basemap);
                                }
                                rtn = { restoreMapLayers: { version: '$v3', basemap: { contentType: contentType, id: basemap, mode: this.mode, opacity: 1 } } };
                                topic.publish('USER_PREFERENCES', rtn);  //lcs to support User Preferences
                                var ch = this.menu.getChildren();
                                array.forEach(ch, function(c) {
                                    if (c.id == basemap) {
                                        c.set('iconClass', 'selectedIcon');
                                    } else {
                                        c.set('iconClass', 'emptyIcon');  //lcs - changed from 'clearIcon' to 'emptyIcon'
                                    }
                                });
                            }
                        })
                    });
                    this.menu.addChild(menuItem);
                }
            }, this);

            this.dropDownButton.set('dropDown', this.menu);
            this.dropDownButton.set('class', this.buttonClass);

            if (array.indexOf(this.basemapsToShow, "osm") !== -1) {
                require(["esri/layers/osm"]);
            }
        },
        validateCustomBasemaps: function(validUrls) {
            var validBasemapKeys = [];
            array.forEach(this.basemapsToShow, function(key) {
                var customBasemap = customBasemaps[key];
                if (customBasemap !== undefined) {
                    if (array.every(customBasemap.basemap.layers, function(layer) { return array.indexOf(validUrls, layer.url) !== -1; })) {
                        validBasemapKeys.push(key);
                    } else {
                        console.log('Basemap "' + customBasemap.title + '" had one or more invalid layers and was not loaded.');
                    }
                }
            });
            return validBasemapKeys;
        },
        startup: function() {
            this.inherited(arguments);
            if (this.mode === "custom") {
                this.gallery.select(this.mapStartBasemap);
            } else {
                this.map.setBasemap(this.mapStartBasemap);
            }
            topic.subscribe('FETCH_BASEMAP', lang.hitch(this, function(e) {
                var contentType = this.mode === 'custom' && this.currentBasemap ? customBasemaps[this.currentBasemap].contentType : null;
                var rtn = { restoreMapLayers: { version: '$v3', basemap: { contentType: contentType, id: this.mapStartBasemap, mode: this.mode, opacity: 1 } } };
                topic.publish('USER_PREFERENCES', rtn);  //lcs to support User Preferences
            }));
        }
    });
});