define([
	"dojo/_base/declare",
	"dijit/_WidgetsInTemplateMixin",
	"dijit/form/Button",
	"dijit/Dialog",
	"dijit/layout/TabContainer",
	"dijit/layout/ContentPane",
    'dojo/_base/lang',
    'dojo/_base/fx',
	"dojo/text!./WelWhatDisHelpAboutSmall/templates/WelWhatDisHelpAboutSmallDialog.html"
	], function(declare, _WidgetsInTemplateMixin, Button, Dialog, TabContainer, ContentPane, lang, baseFx, welWhatDisHelpAboutSmallTemplate) {

	//anonymous function to load CSS files required for this module
	(function() {
		var css = [require.toUrl("gis/dijit/WelWhatDisHelpAboutSmall/css/WelWhatDisHelpAboutSmall.css")];
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

	return declare([Dialog, _WidgetsInTemplateMixin], {
		templateString: welWhatDisHelpAboutSmallTemplate,
		title: 'Hamilton County Map Viewer',
		draggable: true,
		baseClass: 'welWhatDisHelpAboutSmallDijit',
		postCreate: function() {
			this.inherited(arguments);
		},
		close: function() {
            var fadeArgs = {
                node: this.domNode,
                duration: 500,
                onEnd: lang.hitch(this, function () { 
                    this.hide(); 
                })
            };
            baseFx.fadeOut(fadeArgs).play();
		}
	});
});