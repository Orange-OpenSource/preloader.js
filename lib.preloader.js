/**
 * 
 * Was really inspired by jQuery plugin preloadCssImages
 * http://www.filamentgroup.com/examples/preloadImages/scripts/preloadCssImages.jQuery_v5.js
 * 
 * Its license is:
 * ----
 * jQuery-Plugin "preloadCssImages"
 * by Scott Jehl, scott@filamentgroup.com
 * http://www.filamentgroup.com
 * reference article: http://www.filamentgroup.com/lab/update_automatically_preload_images_from_css_with_jquery/
 * demo page: http://www.filamentgroup.com/examples/preloadImages/index_v2.php
 * 
 * Copyright (c) 2008 Filament Group, Inc
 * Dual licensed under the MIT (filamentgroup.com/examples/mit-license.txt) and GPL (filamentgroup.com/examples/gpl-license.txt) licenses.
 * ----
 * 
 * We also use the technique described in http://www.thecssninja.com/css/even-better-image-preloading-with-css2
 *
 * we uses jQuery (but try to get rid of it), and lib.cssrule.js for the CSS-loading-mode
 * --------------------------------------------------------------------
 */

var preloader = (function($, window, document) {
	
	var settings = {
		errorDelay: 999 // handles 404-Errors in IE
	};
	

	var loaded = 0, // the image that will be loaded
		imgUrls = [],
		errorTimer,
		ownerNodeProperty = "ownerNode";
	
	
	function init(_settings) {
		if (_settings) {
		// override only keys that already are in settings.
			for (var key in settings) {
				if (_settings[key]) {
					settings[key] = _settings[key];
				}
			}
		}
		
		$(window).load(function() { window.setTimeout(start, 1000); });
	}

	// note: we don't use 'this' or the event parameter, so we can
	// have simple code to call us
	function onImgComplete(){
		window.clearTimeout(errorTimer);
		if (imgUrls && imgUrls.length && imgUrls[loaded]) {
			loaded++;
			loadImgsWithAjax();
		}
	}
	
	function loadImgsWithAjax(){
		//only load 1 image at the same time / most browsers can only handle 2 http requests, 1 should remain for user-interaction (Ajax, other images, normal page requests...)
		// otherwise set simultaneousCacheLoading to a higher number for simultaneous downloads
		if(imgUrls && imgUrls.length && imgUrls[loaded]){
			var img = new Image(); //new img obj
			img.src = imgUrls[loaded];	//set src either absolute or rel to css dir
			if (img.complete){
				onImgComplete();
			} else {
				img.onerror = img.onload = img.onreadystatechange = onImgComplete;
				// handles 404-Errors in IE
				errorTimer = window.setTimeout(onImgComplete, settings.errorDelay);
			}
			
		}
	}
	
	// see http://www.thecssninja.com/css/even-better-image-preloading-with-css2
	function loadImgsWithCss() {
		var rule, urls;
		if (imgUrls && imgUrls.length) {
			urls = imgUrls.join(') url(');
			// use of display:none seems to make it not working with IE8 and some versions of Opera
			// we could use visibility:hidden with position:absolute and left:-xxx
			rule = "body:after { content: url(" + urls + ");display: none}";
			cssrule.add(rule);
		}
	}
	
	function parseCssImgValue(baseURL, tmpImage) {
		// handle baseUrl here for multiple stylesheets in different folders bug

		// protocol-bug fixed
		var imgSrc = (tmpImage.charAt(0) == '/' || tmpImage.indexOf('://') !== -1) ?
			tmpImage : 
			baseURL + tmpImage;
		
		if(imgUrls.indexOf(imgUrls) == -1){
			imgUrls.push(imgSrc);
		}
	}
	
	function parseCSS(sheets, urls) {
		var w3cImport = false,
			imported = [],
			importedSrc = [],
			cssPile = '',
			backgroundPile = '', 
			baseURL,
			thisSheetRules;
		
		var sheetIndex = sheets.length;
		
		while(sheetIndex--){//loop through each stylesheet
			var thisSheet = sheets[sheetIndex];

			// for IE
			// should run once
			if (! (ownerNodeProperty in thisSheet)) {
				ownerNodeProperty = "owningElement";
			}
			
			if (!thisSheet[ownerNodeProperty] || !thisSheet[ownerNodeProperty].className || thisSheet[ownerNodeProperty].className.indexOf("preload") === -1) {
				continue;
			}
			
			cssPile = '';//create large string of all css rules in sheet
			backgroundPile = '';
			
			if(urls && urls[sheetIndex]){
				baseURL = urls[sheetIndex];
			} else {
				var csshref = thisSheet.href || window.location.href;
				// this should not remove the end of the string, and also the matched '/'
				// si lastIndexOf retourne -1, substr retournera une chaîne vide.
				baseURL = csshref.substr(0, csshref.lastIndexOf('/'));
				if (baseURL.length) {
					baseURL += '/'; //tack on a / if needed
				}
			}
			
			//->>> http://www.quirksmode.org/dom/w3c_css.html
			thisSheetRules 	= thisSheet.cssRules //w3
							|| thisSheet.rules; //ie
			
			if(thisSheetRules){
				
				var ruleIndex = thisSheetRules.length;
				while(ruleIndex--){
					/* thisSheetRules[ruleIndex].style.cssText instead of
					 * thisSheetRules[ruleIndex].cssText is a huge speed improvement */
					if(thisSheetRules[ruleIndex].style && thisSheetRules[ruleIndex].style.cssText){
						var text = thisSheetRules[ruleIndex].style.cssText;
						
						// préfiltre : only add rules to the string if you can assume,
						// to find an image, speed improvement
						
						if(text.toLowerCase().indexOf('url') !== -1) {
							if (text.toLowerCase().indexOf("background") !== -1) {
								backgroundPile += text;
							} else {
								cssPile += text;
							}
						}
					} else if(thisSheetRules[ruleIndex].styleSheet) {
						imported.push(thisSheetRules[ruleIndex].styleSheet);
						w3cImport = true;
					}
					
				}
			}
			

			//parse cssPile and backgroundPile for image urls

			//reg ex to get all background images url
			var imgReBackground = /\burl\("?([^")]+)/ig;
			//reg ex to get a string of between a "(" and a ".filename" / '"' for opera-bugfix
			var imgReUrl = /[^("]+\.(?:gif|jpg|jpeg|png)/ig;
			var result;
			

			while ((result = imgReBackground.exec(backgroundPile)) != null) {
				parseCssImgValue(baseURL, result[1]);
			}
			
			while ((result = imgReUrl.exec(cssPile)) != null) {
				parseCssImgValue(baseURL, result[0]);
			}

			if(!w3cImport && sheets[sheetIndex].imports && sheets[sheetIndex].imports.length) {
				for(var iImport = 0, importLen = sheets[sheetIndex].imports.length; iImport < importLen; iImport++){
					var iHref = sheets[sheetIndex].imports[iImport].href;
					iHref = iHref.split('/');
					iHref.pop();
					iHref = iHref.join('/');
					if (iHref) {
						iHref += '/'; //tack on a / if needed
					}
					var iSrc = (iHref.charAt(0) == '/' || iHref.match('://')) ? // protocol-bug fixed
						iHref : 
						baseURL + iHref;
					
					importedSrc.push(iSrc);
					imported.push(sheets[sheetIndex].imports[iImport]);
				}
				
				
			}
		}//loop

		if(imported.length){
			parseCSS(imported, importedSrc);
		}
	}
	
	function start() {
		parseCSS(document.styleSheets);

		// works cross browser, 1 image at a time
		loadImgsWithAjax();

		// doesn't work with IE6/7/8, which we don't care so much because
		// they already preload some things themselves
		// disable preloading with css because it makes too many requests at the same time
		// loadImgsWithCss();
	}
	
	return {
		init: init
	};
})(jQuery, this, document);
