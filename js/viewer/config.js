define([
    'esri/InfoTemplate', 'esri/dijit/PopupTemplate', 'esri/renderers/SimpleRenderer', 'esri/symbols/SimpleFillSymbol', 'esri/symbols/SimpleLineSymbol', 'esri/symbols/SimpleMarkerSymbol', 'dojo/_base/Color', 'esri/geometry/Polygon'
], function(InfoTemplate, PopupTemplate, SimpleRenderer, SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol, Color, Polygon) {
    return {
        // url to your proxy page, must be on same machine hosting you app. See proxy folder for readme.
        proxy: {
            url: "proxy/proxy.ashx",
            alwaysUseProxy: false
        },
        // url to your geometry server.
        geometryService: {
            //url: "http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer"
            url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/Utilities/Geometry/GeometryServer"
        },
        showSplashScreen: true,
        showStartupMetrics: true,  // ignored if showSplashScreen is not true
        getPermissions: 'http://gis.hamiltoncounty.in.gov/GetIP/GetClientIpAsJson.aspx',  // ignored if showSplashScreen is not true, set this to an empty string or null or false to skip getting permissions
        // getPermissions: 'http://localhost:8080/user/GetAddress',  // ignored if showSplashScreen is not true, set this to an empty string or null or false to skip getting permissions
        permissionsFile: './js/viewer/Permissions.json',  // ignored if getPermissions is not a valid file name.
        devEmail: 'gis@hamiltoncounty.in.gov',
        deviceProperties: {
            isiOS: this.isiOS,
            isBrowser: this.isBrowser,
            isMobileDevice: this.isMobileDevice,
            isTablet: this.isTablet,
            contentWidth: this.innerWidth,
            contentHeight: this.innerHeight
        },    
        userPreferenceDefaults: {
            showWelcome: true,
            showStartupMetrics: true,
            showMapTips: true,
            showMouseoverHighlight: true,
            showCoordinates: true,
            showScale: true,
            restoreMapExtent: true,
            restoreMapLayers: true
        },
        // basemapMode: must be either "agol" or "custom"
        basemapMode: "custom",
        // basemapMode: "agol",
        // defaultBasemap: valid options for "agol" mode: "streets", "satellite", "hybrid", "topo", "gray", "oceans", "national-geographic", "osm"
        mapStartBasemap: "streets",
        //mapStartBasemapContentType: must be either "raster" or "vector"; only valid for basemapMode: "custom" 
        mapStartBasemapContentType: "vector",  //lcs - Basemap Content Type
        basemapsToShow: ["streets", "orthos_2013", "orthos_2012", "orthos_2011", "orthos_2010", "orthos_2009", "orthos_2008", "orthos_2007", "orthos_2006", "orthos_2005", "orthos_2004", "orthos_2001", "orthos_2000", "orthos_1998", "orthos_1996", "orthos_1994", "orthos_1985", "orthos_1976", "orthos_1974", "orthos_1962", "orthos_1956", "orthos_1941", "orthos_1936"],
        // basemapsToShow: ["streets" , "satellite" , "hybrid", "topo", "gray", "oceans", "national-geographic", "osm"],
        // initialExtent: extent the the map starts at. Helper tool: http://www.arcgis.com/home/item.html?id=dd1091f33a3e4ecb8cd77adf3e585c8a
        initialExtent: {
            xmin: 162500,
            ymin: 1705000,
            xmax: 275000,
            ymax: 1812500,
            spatialReference: {
                wkid: 2965
            }
        },
        // operationalLayers: Array of Layers to load on top of the basemap: valid 'type' options: "dynamic", "tiled", "feature".
        // The 'options' object is passed as the layers options for constructor. Title will be used in the legend only. id's must be unique and have no spaces.
        // 3 'mode' options: MODE_SNAPSHOT = 0, MODE_ONDEMAND = 1, MODE_SELECTION = 2
        validateOperationalLayers: true,  //lcs - Validate Operational Layers
        operationalLayers: [{
            type: "feature",
            url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/E911/MapServer/0",
            title: "Address Points",
            // For the infoTemplate to work on polygons with renderers, they must have a style of STYLE_SOLID.  
            // If you don't want to see the fill, set the alpha (fourth element in the color array) to 0.
            vectorRenderer: new SimpleRenderer(new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 8, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,0,0]), 3), new Color([0,0,0,0]))),
            rasterRenderer: new SimpleRenderer(new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 8, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,156,0]), 3), new Color([0,0,0,0]))),
            //lcs - MapTips BEGIN
            highlightSymbol: new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 14, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,0,0]), 3), new Color([0,0,0,0])),
            mapTip: "Address: <b>${FULL_ADDR}</b><hr>" + "Business Name: <b>${BUS_NAME}</b>",
            mapTipNoValue: "<i>[No Value]</i>",
            //lcs - MapTips END
            options: {
                id: "addressPoints",
                opacity: 1.0,
                visible: false,
                outFields: ["*"],
                infoTemplate: new PopupTemplate({
                    title: "Address Point {FULL_ADDR}",
                    description: "Address from E911 records",
                    // define field infos so we can specify an alias
                    fieldInfos: [
                        {fieldName: "BUS_NAME", visible: false, label: "Business&nbsp;Name:"},
                        {fieldName: "VENUE", visible: false, label: "Venue:"}
                    ]
                }),
                mode: 1
            },
            editorLayerInfos: {
                disableGeometryUpdate: true
            }
        } , {
            type: "tiled",
            url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/Topo/MapServer",
            title: "Topo",
            options: {
                id: "topo",
                opacity: 1.0,
                visible: false
            },
            editorLayerInfos: {
                disableGeometryUpdate: true
            }
        } , {
            type: "feature",
            url: "http://hamco-arcgispvt/ArcGIS/rest/services/Marathon_Pipeline/MapServer/0",
            title: "Marathon Pipelines",
            // For the infoTemplate to work on polygons with renderers, they must have a style of STYLE_SOLID.  
            // If you don't want to see the fill, set the alpha (fourth element in the color array) to 0.
            vectorRenderer: new SimpleRenderer(new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,0,0]), 5)),
            rasterRenderer: new SimpleRenderer(new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,255,0]), 5)),
            // lcs - MapTips BEGIN
            highlightSymbol: new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,255,255,0.25]), 10),
            mapTip: "Marathon Pipeline: <b>${NAME}</b><hr>" + "Description: <b>${LN_DSCRPTN}</b>",
            mapTipNoValue: "<i>[No Value]</i>",
            // lcs - MapTips END
            options: {
                id: "marathonPipelines",
                opacity: 1.0,
                visible: true,
                outFields: ["NAME", "LN_DSCRPTN"],
                infoTemplate: new PopupTemplate({
                    title: "Marathon Pipeline {NAME}",
                    // description: "Buried Pipeline",
                    // define field infos so we can specify an alias
                    fieldInfos: [
                        {fieldName: "LN_DSCRPTN", visible: true, label: "Description:"}
                    ]
                }),
                mode: 1
            },
            editorLayerInfos: {
                disableGeometryUpdate: true
            }
        } , {
            type: "tiled",
            url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/Buildings/MapServer",
            title: "Buildings",
            options: {
                id: "buildings",
                opacity: 0.5,
                visible: false
            },
            editorLayerInfos: {
                disableGeometryUpdate: true
            }
        } , {
            type: "dynamic",
            url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/Zoning/MapServer",
            title: "Zoning",
            options: {
                id: "zoning",
                opacity: 0.3,
                visible: false
            },
            editorLayerInfos: {
                disableGeometryUpdate: true
            }
        } , {
            type: "feature",
            url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/Parcels/MapServer/0",
            title: "Parcels",
            // For the infoTemplate to work on polygons with renderers, they must have a style of STYLE_SOLID.  
            // If you don't want to see the fill, set the alpha (fourth element in the color array) to 0.
            // Fills with an alpha of 0 WILL NOT display in the legend using the Export Web Map Task.
            vectorRenderer: new SimpleRenderer(new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([102,102,102,1]), 1), new Color([0,0,0,0]))),
            rasterRenderer: new SimpleRenderer(new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,255,255,1]), 2), new Color([0,0,0,0]))),
            //lcs - MapTips BEGIN
            highlightSymbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,0,0]), 3), new Color([125,125,125,0.35])),
            mapTip: "Parcel: <b>${FMTPRCLNO}</b><hr>" +
                    "Address: <b>${LOCADDRESS}</b><br>" +
                    "City: <b>${LOCCITY}</b><br>" +
                    "Zip: <b>${LOCZIP}</b><br>" +
                    "Owner: <b>${DEEDEDOWNR}</b>",
            mapTipNoValue: "[No Value]",
            //lcs - MapTips END
            options: {
                id: "parcels",
                opacity: 0.5,
                visible: true,
                outFields: ["*"],
                infoTemplate: new PopupTemplate({
                    title: "Parcel {FMTPRCLNO}",
                    // description: "Description",
                    // define field infos so we can specify an alias
                    fieldInfos: [
                        {fieldName: "DEEDEDOWNR", visible: true, label: "Deeded&nbsp;Owner:"},
                        {fieldName: "LOCADDRESS", visible: true, label: "Parcel&nbsp;Address:"},
                        {fieldName: "LOCCITY", visible: true, label: "Parcel&nbsp;City:"},
                        {fieldName: "LOCZIP", visible: true, label: "Parcel&nbsp;Zip:"},
                        {fieldName: "SUBDIVNAME", visible: true, label: "Subdivision&nbsp;Name:"},
                        {fieldName: "SUBDIVSEC", visible: true, label: "Subdivision&nbsp;Section:"},
                        {fieldName: "LOTNUMBER", visible: true, label: "Lot&nbsp;Number:"},
                        {fieldName: "CONDOUNIT", visible: true, label: "Condo&nbsp;Unit:"},
                        {fieldName: "DEEDACRES", visible: true, label: "Deeded&nbsp;Acres:"},
                        {fieldName: "PROPCLASS", visible: true, label: "Property&nbsp;Class:"},
                        {fieldName: "PROPUSE", visible: true, label: "Property&nbsp;Use:"},
                        {fieldName: "TAXDISTNAM", visible: true, label: "Tax&nbsp;District:"},
                        {fieldName: "POLTWP", visible: true, label: "Political&nbsp;Township:"},
                        {fieldName: "PLAT", visible: true, label: "Plat:"},
                        {fieldName: "COMMON_ARE", visible: true, label: "Common&nbsp;Area:"},
                        {fieldName: "TIFCODE", visible: true, label: "TIF&nbsp;Code:"},
                        {fieldName: "TIFDESCR", visible: true, label: "TIF&nbsp;District:"},
                        {fieldName: "STPRCLNO", visible: true, label: "State&nbsp;Parcel No:"}
                    ]
                }),
                mode: 1
            },
            editorLayerInfos: {
                disableGeometryUpdate: true
            }
        } , {
            type: "dynamic",
            url: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/Subdivisions/MapServer",
            title: "Subdivisions",
            //hideLayers: [0],
            options: {
                id: "subdivisions",
                opacity: 0.5,
                visible: false
            },
            editorLayerInfos: {
                disableGeometryUpdate: true
            }
        }],
        //widgets: set include to true or false to load or not load the widget. set position to the desired order, starts at 0 on the top.
        // lcs - enhancement - Widgets are loaded in the order listed.  The position property is no longer used.  Widgets without titles 
        // are not processed, but can be used to send information to the Controller module (e.g. default help content - noHelp).
        widgets: {
            noHelp: {
                help: './js/viewer/templates/help/nohelp.html'
            },
            // permissions: {
                // aspx: 'GetClientIpAsJson.aspx',
                // pictometry: false,
                // house_photos: false,
                // name_search: false,
                // invisible_address_points: false
            // },
            legend: {
                include: false,
                title: "Legend",
                open: false,
                help: './js/viewer/templates/help/legend.html',
                position: 0
            },
            bookmarks: {
                include: true,
                title: "Bookmarks",
                open: false,
                help: './js/viewer/templates/help/bookmarks.html',
                position: 2
            },
            TOC: {
                include: true,
                title: "Table of Contents",
                open: true,
                help: './js/viewer/templates/help/TOC.html',
                position: 1
            },
            draw: {
                include: true,
                title: "Draw",
                open: false,
                help: './js/viewer/templates/help/draw.html',
                position: 3
            },
            measure: {
                include: true,
                title: "Measure",
                open: false,
                help: './js/viewer/templates/help/measure.html',
                position: 4,
                defaultAreaUnit: esri.Units.SQUARE_MILES,
                defaultLengthUnit: esri.Units.MILES
            },
            print: {
                include: true,
                title: "Print",
                open: false,
                position: 5,
                serviceURL: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export Web Map Task",
                copyrightText: "Copyright ESRI 2014",
                authorText: "ESRI",
                defaultTitle: 'STLJS.org Meetup Hometowns',
                defaultFormat: 'PDF',
                defaultLayout: 'Letter ANSI A Landscape'
            },
            printplus: {
                include: true,
                title: "Print Plus",
                open: false,
                help: './js/viewer/templates/help/printplus.html',
                position: 6,
                serviceURL: "http://ags1.hamiltoncounty.in.gov/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export Web Map Task",
                copyrightText: "Copyright Hamilton County 2014",
                authorText: "Larry Stout",
                defaultTitle: 'Hamilton County Map',
                defaultFormat: 'PDF',
                defaultLayout: 'Letter ANSI A Landscape',
                //lcs - Print Enhancements BEGIN
                defaultDpi: 96,
                noTitleBlockPrefix: 'No TB ',
                layoutParams: {
                    // The params array defines the template dimensions so the template footprint can be displayed on the map.
                    // The first item is the page size.
                    // The second item is the map hole size.
                    // The third item is the offset to the lower left corner of the map area.
                    // The fourth item is the side and top borders for the layout with no title block.
                    'Letter ANSI A Landscape': {alias: 'Letter Landscape (ANSI A)', units: esri.Units.INCHES, params: [{x: 11, y: 8.5}, {x: 10, y: 6.25}, {x: 0.5, y: 1.5}, {x: 0.5, y: 0.5}]},
                    'Letter ANSI A Portrait': {alias: 'Letter Portrait (ANSI A)', units: esri.Units.INCHES, params: [{x: 8.5, y: 11}, {x: 7.5, y: 8}, {x: 0.5, y: 2.25}, {x: 0.5, y: 0.5}]},
                    'Tabloid ANSI B Landscape': {alias: 'Tabloid Landscape (ANSI B)', units: esri.Units.INCHES, params: [{x: 17, y: 11}, {x: 16, y: 7.75}, {x: 0.5, y: 2.5}, {x: 0.5, y: 0.5}]},
                    'Tabloid ANSI B Portrait': {alias: 'Tabloid Portrait (ANSI B)', units: esri.Units.INCHES, params: [{x: 11, y: 17}, {x: 10, y: 11.75}, {x: 0.5, y: 4.5}, {x: 0.5, y: 0.5}]},
                    'A4 Landscape': {alias: 'A4 Landscape', units: esri.Units.CENTIMETERS, params: [{x: 29.7, y: 21}, {x: 27.7, y: 15.9}, {x: 1, y: 3.8}, {x: 1, y: 1}]},
                    'A4 Portrait': {alias: 'A4 Portrait', units: esri.Units.CENTIMETERS, params: [{x: 21, y: 29.7}, {x: 19, y: 22.3}, {x: 1, y: 5.7}, {x: 1, y: 1}]},
                    'A3 Landscape': {alias: 'A3 Landscape', units: esri.Units.CENTIMETERS, params: [{x: 42, y: 29.7}, {x: 40, y: 21.7}, {x: 1, y: 6.3}, {x: 1, y: 1}]},
                    'A3 Portrait': {alias: 'A3 Portrait', units: esri.Units.CENTIMETERS, params: [{x: 29.7, y: 42}, {x: 27.7, y: 29}, {x: 1, y: 11}, {x: 1, y: 1}]},
                    'MAP_ONLY': {alias: 'Just the Map', units: NaN, params: [{x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}]}
                },
                relativeScale: "(1&quot; = [value]')",
                relativeScaleFactor: 0.08333333,
                scalePrecision: 0,
                mapScales: [6000000, 4800000, 3600000, 2400000, 1200000, 960000, 720000, 600000, 480000, 360000, 240000, 120000, 96000, 72000, 60000, 48000, 36000, 24000, 12000, 9600, 7200, 6000, 4800, 3600, 2400, 1200, 960, 720, 600, 480, 360, 240, 120],
                // relativeScale: "(1 inch = [value] miles)",
                // relativeScaleFactor: 0.0000157828,
                // scalePrecision: 4,
                // mapScales: [6336000, 5068800, 3801600, 3168000, 2534400, 1900800, 1267200, 633600, 506880, 380160, 316800, 253440, 190080, 126720, 63360, 50688, 38016, 31680, 25344, 19008, 12672, 6336, 5069, 3802, 3168, 2534, 1901, 1267, 634, 507, 380, 317, 253, 190, 127, 63],
                outWkid: 2965,
                showLayout: true
                //lcs - Print Enhancements END
            },
            directions: {
                include: true,
                title: "Directions",
                open: false,
                help: './js/viewer/templates/help/directions.html',
                position: 7,
                options: {
                    routeTaskUrl: "http://sampleserver3.arcgisonline.com/ArcGIS/rest/services/Network/USA/NAServer/Route",
                    routeParams: {
                        directionsLanguage: "en-US",
                        directionsLengthUnits: "esriMiles"
                    }
                }
            },
            editor: {
                include: true,
                title: "Edit",
                open: false,
                help: './js/viewer/templates/help/editor.html',
                position: 8,
                settings: {
                    toolbarVisible: true,
                    showAttributesOnClick: true,
                    enableUndoRedo: true,
                    createOptions: {
                        polygonDrawTools: ["freehandpolygon", "autocomplete"]
                    },
                    toolbarOptions: {
                        reshapeVisible: true,
                        cutVisible: true,
                        mergeVisible: true
                    }
                }
            },
            scalebar: {
                include: true,
                title: "Scalebar",
                options: {
                    attachTo: "bottom-left",
                    scalebarStyle: "line",
                    scalebarUnit: "dual"
                }
            },
            userpreferences: {
                include: true,
                title: "User Preferences",
                open: false//,
                //help: './js/viewer/templates/help/editor.html'
            },
            share: {
                include: true,
                title: "Share the Map",
                open: true,
                emailSubject: 'Link to Hamilton County Map',
                feedbackTo: 'gis@hamiltoncounty.in.gov',
                feedbackSubject: 'Feedback on Hamilton County Map Viewer'
                //help: './js/viewer/templates/help/editor.html'
            }
        }
    };
});