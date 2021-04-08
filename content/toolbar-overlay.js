if(!com) var com={};
if(!com.sidthemonkey) com.sidthemonkey={};
if(!com.sidthemonkey.titlebar) com.sidthemonkey.titlebar={};

com.sidthemonkey.titlebar = {

	init: function(){
		var tabbrowser = document.getElementById("content");
		tabbrowser.updateTitlebar = com.sidthemonkey.titlebar.updateTitlebar;
		document.getElementById("content").addEventListener("DOMTitleChanged", com.sidthemonkey.titlebar.updateTitlebar, false);
	},

	uninit: function() {

  },

	updateTitlebar: function (){
		var titlebarPrefManager = new com.sidthemonkey.Utils.prefManager;
		var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                    .getService(Components.interfaces.nsIPrefBranch);
		newTitle = {};
		newTitle.customTitleFormat = prefs.getComplexValue("extensions.customizeTitlebar.customTitleFormat",
		      Components.interfaces.nsISupportsString).data;
		newTitle.formatOptions = {
			"default": "{pageTitle} - {currentUrl}",
			"page-only": "{pageTitle}",
			"developers": "{pageTitle} - {palemoonVersion} - {palemoonBuildID} - {currentUrl}",
			"custom": newTitle.customTitleFormat,	
		}
		var selectedTitleFormat = titlebarPrefManager.getValue("extensions.customizeTitlebar.selectedTitleFormat", "default");
		newTitle.textFormat = newTitle.formatOptions[selectedTitleFormat];
		newTitle.currentUrl = content.document.location.href;
		var tabbrowser = document.getElementById("content");
		newTitle.pageTitle = content.document.title;
		newTitle.brand = document.getElementById("main-window").getAttribute("title_normal");
		var appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
                        		.getService(Components.interfaces.nsIXULAppInfo);
		newTitle.palemoonVersion = appInfo.version;
		newTitle.palemoonBuildID = appInfo.appBuildID;
		newTitle.platformVersion = appInfo.platformVersion;
		newTitle.platformBuildID = appInfo.platformBuildID;
		//newTitle.onLine = content.document.defaultView.navigator.language;
		newTitle.domainName = com.sidthemonkey.Utils.getDomainFromUrl(newTitle.currentUrl);
		var regex = /({\D+?})/g;
		var newFormat = newTitle.textFormat.replace(regex, function (str, p1, p2, offset, s){
			var titleParameter = str.replace("{","").replace("}","");
			return newTitle[titleParameter];
		});
		tabbrowser.ownerDocument.title = newFormat;
	},

	showTitlebarSettings: function () {
		var features;
		var optionsURL = "chrome://titlebar/content/options.xul";
	  try {
	  	var instantApply = gPref.getBoolPref("browser.preferences.instantApply");
	    features = "chrome,titlebar,toolbar,centerscreen,resizable=yes" + (instantApply ? ",dialog=no" : ",modal");
	  }
	  catch (e) {
	  	features = "chrome,titlebar,toolbar,centerscreen,resizable=yes,modal";
	  }
	  var newWindow = openDialog(optionsURL, "", features);
	},

	//Code from https://developer.mozilla.org/en/Code_snippets/On_page_load#Running_code_on_an_extension%27s_first_run_or_after_an_extension%27s_update
	firstRunOverlay: {

	  init: function(){
			var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                   .getService(Components.interfaces.nsIPrefService);
			prefs =  prefs.getBranch("extensions.titlebar");
	    var ver = -1, firstrun = true;
	
	    var gExtensionManager = Components.classes["@mozilla.org/extensions/manager;1"]
	                            .getService(Components.interfaces.nsIExtensionManager);
	    var current = gExtensionManager.getItemForID("titlebar@sidthemonkey.com").version;
	    //gets the version number.
	    //"extension@guid.net" should be replaced with your extension's GUID.
			
	    try{
		ver = prefs.getCharPref("version");
		firstrun = prefs.getBoolPref("firstrun");
	    }catch(e){
	      //nothing
	    }finally{
	      if (firstrun){
	        prefs.setBoolPref("firstrun",false);
	        prefs.setCharPref("version",current);
		
	        // Insert code for first run here        
	
	        // The example below loads a page by opening a new tab.
	        // Useful for loading a mini tutorial
	        com.sidthemonkey.Utils.set_Timeout(function(){
	          gBrowser.selectedTab = gBrowser.addTab("http://sidthemonkey.com/");
	        }, 1500); //Firefox 2 fix - or else tab will get closed
					
	      }		
	      
	      if (ver!=current && !firstrun){ // !firstrun ensures that this section does not get loaded if its a first run.
	        prefs.setCharPref("version",current);
	        
	        // Insert code if version is different here => upgrade
	        com.sidthemonkey.Utils.set_Timeout(function(){
	          gBrowser.selectedTab = gBrowser.addTab("http://sidthemonkey.com/");
	        }, 1500); //Firefox 2 fix - or else tab will get closed
	      }
	    }
	    window.removeEventListener("load",function(){ com.sidthemonkey.titlebar.firstRunOverlay.init(); },true);
	  }
	},

};


window.addEventListener("load", com.sidthemonkey.titlebar.init, false);
window.addEventListener("unload", function() {com.sidthemonkey.titlebar.uninit()}, false);
//Not including first run overlay until page is built
//window.addEventListener("load",function(){ com.sidthemonkey.titlebar.firstRunOverlay.init(); },true);
