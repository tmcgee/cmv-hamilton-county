define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    'dojo/_base/lang',
    "dojo/dom-style",
    "dojo/dom-construct",
    'dojo/_base/fx',
    "dojo/dom-class",
    'dojo/_base/array',
    'dojo/parser',
    "dojo/text!./Helper/templates/Help.html"
    ], function(declare, _WidgetBase, _TemplatedMixin, lang, Style, domConstruct, fx, domClass, array, parser, helpTemplate) {

    //anonymous function to load CSS files required for this module
    (function() {
        var css = [require.toUrl("gis/dijit/Helper/css/Helper.css")];
        var head = document.getElementsByTagName("head").item(0),
            link;
        for(var i = 0, il = css.length; i < il; i++) {
            link = document.createElement("link");
            link.type = "text/css";
            link.rel = "stylesheet";
            link.href = css[i].toString();
            head.appendChild(link);
        }
    }());

    // The array of currently open help titles
    var helpTitles = [];
    
    // main helper dijit
    var Helper = declare([_WidgetBase, _TemplatedMixin], {
        templateString: '<div data-dojo-attach-point="containerNode"></div>',
        help: function(props) {
            props = props || {};
            lang.mixin(props, {
                container: this.containerNode
            });
            new Help(props);
        }
    });

    // the help itself
    var Help = declare([_WidgetBase, _TemplatedMixin], {
        templateString: helpTemplate,
        helpTitle: "Title",
        contentURL: "Message",
        error: "Error",
        timeout: 1000000,
        opacity: 0.95,
        container: null,
        timer: null,
        postCreate: function() {
            this.inherited(arguments);
            if(this.container) {
                if (array.indexOf(helpTitles, this.helpTitle) === -1) {
                    // Add this title to the array of help titles
                    helpTitles.push(this.helpTitle);
                    
                    Style.set(this.domNode, 'opacity', 0);
                    domConstruct.place(this.domNode, this.container);
                    parser.parse(this.domNode);
                    fx.anim(this.domNode, {
                        opacity: this.opacity
                    }, 750);
                    this.setTimeout();
                }
            } else {
                console.log("Help container not found/specified.");
            }
        },
        setTimeout: function() {
            this.timer = setTimeout(lang.hitch(this, 'close'), this.timeout);
        },
        hoverOver: function() {
            clearInterval(this.timer);
            domClass.add(this.domNode, 'hover');
        },
        hoverOut: function() {
            this.setTimeout();
            domClass.remove(this.domNode, 'hover');
        },
        close: function() {
            fx.anim(this.domNode, {
                opacity: 0
            }, 750, null, lang.hitch(this, 'remove'));
        },
        remove: function() {
            // Delete this title from the array of help titles
            var index = array.indexOf(helpTitles, this.helpTitle);
            if (helpTitles.length === 1) {
                helpTitles = [];
            } else if (index !== -1) {
                helpTitles.splice(index, 1);
            }

            fx.anim(this.domNode, {
                height: 0,
                margin: 0
            }, 250, null, lang.partial(domConstruct.destroy, this.domNode));
        }
    });
    return Helper;
});