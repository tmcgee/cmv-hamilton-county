define([
    'dojo/_base/declare',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dijit/form/Button',
    'dijit/Dialog',
    'dijit/Editor',
    'dijit/_editor/plugins/AlwaysShowToolbar',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/io-query',
    'dojo/dom',
    'dojo/text!./Share/templates/Share.html'
], function(
    declare, 
    _WidgetBase, 
    _TemplatedMixin, 
    _WidgetsInTemplateMixin, 
    Button, 
    Dialog,
    Editor,
    AlwaysShowToolbar,
    lang, 
    array,
    ioQuery,
    dom,
    shareTemplate) {

    //anonymous function to load CSS files required for this module
    (function() {
        var css = [require.toUrl("gis/dijit/Share/css/Share.css")];
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

    // main draw dijit
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        widgetsInTemplate: true,
        templateString: shareTemplate,
        emailSubject: 'Link to Map',
        feedbackTo: null,
        feedbackSubject: 'Feedback on Map Viewer',
        emailLink: function() {
            var link = encodeURIComponent(this.getLink() + '\r\n\r\n');
            window.open('mailto:?subject=' + this.emailSubject + '&body=' + link, '_self');
        },
        copyToClipboard: function() {
            window.prompt("Use Ctrl+C to copy this link to your Clipboard.  (Security in most browsers prevents us from putting text on your Clipboard directly.)", this.getLink());
            // var myDialog = new Dialog({
                // id: 'copyToClipboard',
                // title: 'Copy to clipboard: Ctrl+C',
                // style: 'width: 300px',
                // innerHTML: '<div id="xxx">' + this.getLink() + '</div>'
            // });
            // myDialog.startup();
            // var editor = new Editor({
                // height: '',
                // plugins: ['selectAll'],
                // extraPlugins: [AlwaysShowToolbar]
            // }, dom.byId('xxx'));
            // myDialog.show();
        },
        sendFeedback: function() {
            var link = encodeURIComponent(this.getLink() + '\r\n\r\n');
            window.open('mailto:' + this.feedbackTo + '?subject=' + this.feedbackSubject + '&body=' + link, '_self');
        },
        getLink: function() {
            // Get the URL of the viewer
            var link = window.location;
            
            // Format the layers as a query string
            var layerArray = [];
            if (window.userPreferences.restoreMapLayers && window.userPreferences.restoreMapLayers.hasOwnProperty('basemap')) {
                layerArray.push(ioQuery.objectToQuery(window.userPreferences.restoreMapLayers.basemap));
            }
            if (window.userPreferences.restoreMapLayers && window.userPreferences.restoreMapLayers.hasOwnProperty('operational')) {
                array.forEach(window.userPreferences.restoreMapLayers.operational, function(layer) {
                    var layerCopy = lang.clone(layer);
                    if (typeof layerCopy.contentType === 'object') {
                        layerCopy.contentType = layerCopy.contentType.join();
                    }
                    layerArray.push(ioQuery.objectToQuery(layerCopy));
                });
            }
            
            // Format the extent as a query string
            var extentObj, extentString = '', sRefString;
            if (window.userPreferences.restoreMapExtent && typeof window.userPreferences.restoreMapExtent === 'object') {
                extentObj = lang.clone(window.userPreferences.restoreMapExtent);
                if (extentObj.spatialReference && typeof extentObj.spatialReference === 'object') {
                    sRefString = ioQuery.objectToQuery(window.userPreferences.restoreMapExtent.spatialReference);
                    delete extentObj.spatialReference;
                }
                extentString = ioQuery.objectToQuery(extentObj);
                extentString += sRefString ? '&' + sRefString : '';
            }
            
            // Build the link
            if (layerArray.length === 0) {
                link += extentString.length === 0 ? '' : '?' + extentString;
            } else {
                link += '?' + layerArray.join('&');
                link += extentString.length === 0 ? '' : '&' + extentString;
            }
            return link;
        },
        createEditor: function() {
            new Editor({
                height: '',
                extraPlugins: [AlwaysShowToolbar]
            }, dom.byId('programmatic2'));
            query('#create2').orphan();
        }
    });
});