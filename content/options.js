if(!com) var com={};
if(!com.sidthemonkey) com.sidthemonkey={};
if(!com.sidthemonkey.titlebar) com.sidthemonkey.titlebar={};

com.sidthemonkey.titlebar.options = {
	
	insertCustomText: function(event) {
		var customTextBox = document.getElementById("customTitleFormat");
		var textToAdd = event.target.value;
		var selectionStart = customTextBox.getAttribute("selectionStart");
		var selectionEnd = customTextBox.getAttribute("selectionEnd");
		if (!selectionStart || !selectionEnd){
			customTextBox.value = customTextBox.value + textToAdd;
		}
		else {
			customTextBox.value = customTextBox.value.substring(0,selectionStart) + textToAdd + customTextBox.value.substring(selectionEnd);
		}
		//Preference doesn't update automatically so need the following line.
		//See: http://forums.mozillazine.org/viewtopic.php?f=19&t=1295865&p=6698895
		document.getElementById('customizeTitlebar.customTitleFormat').value = customTextBox.value;
  },
	
	customTextChanged: function (event){
		var customTextBox = document.getElementById("customTitleFormat");
		var selectionStart = customTextBox.selectionStart;
		var selectionEnd = customTextBox.selectionEnd;
		customTextBox.setAttribute("selectionStart", selectionStart);
		customTextBox.setAttribute("selectionEnd", selectionEnd);
	},
	
	saveUnicodePreference: function (event){
		var customTextBox = document.getElementById("customTitleFormat");
		var str = Components.classes["@mozilla.org/supports-string;1"]
      .createInstance(Components.interfaces.nsISupportsString);
		var prefs = Components.classes["@mozilla.org/preferences-service;1"]
		                    .getService(Components.interfaces.nsIPrefBranch);
		str.data = customTextBox.value;
		prefs.setComplexValue("extensions.customizeTitlebar.customTitleFormat", 
      		Components.interfaces.nsISupportsString, str);
	},
	
	loadUnicodePreference: function(event){
  	var customTextBox = document.getElementById("customTitleFormat");
		var prefs = Components.classes["@mozilla.org/preferences-service;1"]
		                    .getService(Components.interfaces.nsIPrefBranch);
		var value = prefs.getComplexValue("extensions.customizeTitlebar.customTitleFormat",
		      Components.interfaces.nsISupportsString).data;
		customTextBox.value = value;

  },
	
}

document.getElementById("customTitleFormat").addEventListener("click", function(event){
											com.sidthemonkey.titlebar.options.customTextChanged(event);
											} , false);
document.getElementById("customTitleFormat").addEventListener("keypress", function(event){
											com.sidthemonkey.titlebar.options.customTextChanged(event);
											} , false);
document.getElementById("customTextPopup").addEventListener("click", function(event){
											com.sidthemonkey.titlebar.options.insertCustomText(event);
											} , false);
