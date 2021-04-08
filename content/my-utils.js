if(!com) var com={};
if(!com.sidthemonkey) com.sidthemonkey={};
if(!com.sidthemonkey.Utils) com.sidthemonkey.Utils={};

com.sidthemonkey.extensionID = "adhighlighter@sidthemonkey.com";
com.sidthemonkey.Utils.log = com.sidthemonkey.Utils.reportInfo;

com.sidthemonkey.Utils.matrixArrayToTextCells = function(matrixArray, lineSeperator, tabSeperator){
	if(!lineSeperator) lineSeperator = "\n";
	if(!tabSeperator) tabSeperator = "\t";
	for (var i=0; i<matrixArray.length; i++){
		matrixArray[i] = matrixArray[i].join(tabSeperator);
	}
	var textCells = matrixArray.join(lineSeperator);
	return textCells;
}

com.sidthemonkey.Utils.textCellsToMatrixArray = function(textCells, lineSeperator, tabSeperator){
	if(!lineSeperator) lineSeperator = "\n";
	if(!tabSeperator) tabSeperator = "\t";
	var matrixArray = textCells.split(lineSeperator);
	for (var i=0; i<matrixArray.length; i++){
		matrixArray[i] = matrixArray[i].split(tabSeperator);
	}
	return matrixArray;
}

com.sidthemonkey.Utils.createElement = function (elementType, attributeObject, propertyObject, doc) {
	if (!doc) doc = document;
	var newElement = doc.createElement(elementType);
	for (var attr in attributeObject){
		newElement.setAttribute(attr, attributeObject[attr]);
	}
	for (var prop in propertyObject){
		newElement[prop] = propertyObject[prop];
	}
	return newElement;
}

com.sidthemonkey.Utils.fetchXmlFileContents = function (fileLocation) {
	//Code from https://developer.mozilla.org/en/Parsing_and_serializing_XML
	var req = new XMLHttpRequest();
	req.open("GET", fileLocation, false); 
	req.send(null);
	var dom = req.responseXML;
	// print the name of the root element or error message
	//dump(dom.documentElement.nodeName == "parsererror" ? "error while parsing" : dom.documentElement.nodeName);
	return dom.documentElement;	
}

//This gets the file object (which is one of the writeToFile arguments) for a 
//file in the extension directory. The file path starts from the directory with
//install.rdf so use something like /content/overlays/filename.xml
com.sidthemonkey.Utils.fetchFile = function (filePathName){
	var MY_ID = com.sidthemonkey.extensionID;
	var em = Components.classes["@mozilla.org/extensions/manager;1"].getService(Components.interfaces.nsIExtensionManager);
	// the path may use forward slash ("/") as the delimiter
	// returns nsIFile for the extension's install.rdf
	var file = em.getInstallLocation(MY_ID).getItemFile(MY_ID, filePathName);
	return file;
}

com.sidthemonkey.Utils.writeToFile = function (file, data){
	//Code from https://developer.mozilla.org/en/Code_snippets/File_I%2F%2FO
	// file is nsIFile, data is a string
	var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].
	                         createInstance(Components.interfaces.nsIFileOutputStream);
	
	// use 0x02 | 0x10 to open file for appending.
	foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0); 
	// write, create, truncate
	// In a c file operation, we have no need to set file mode with or operation,
	// directly using "r" or "w" usually.
	
	// if you are sure there will never ever be any non-ascii text in data you can 
	// also call foStream.writeData directly
	var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"].
	                          createInstance(Components.interfaces.nsIConverterOutputStream);
	converter.init(foStream, "UTF-8", 0, 0);
	converter.writeString(data);
	converter.close(); // this closes foStream
}

com.sidthemonkey.Utils.createCustomEvent = function(eventName, eventObject) {
	var evt = document.createEvent("Event");
	evt.initEvent(eventName, true, false);
	for (var prop in eventObject){
		evt[prop] = eventObject[prop];
	}
	window.dispatchEvent(evt);
}

com.sidthemonkey.Utils.getElementByHref = function(targetURL){
	var xPath = "//a[contains(@href, '" + targetURL + "')]";
	var allLinks = com.sidthemonkey.Utils.evaluateXPath(content.document, xPath);
	return allLinks[0];
}

//Code from here: https://developer.mozilla.org/en/Using_XPath#Node-specific_evaluator_function
// Evaluate an XPath expression aExpression against a given DOM node
// or Document object (aNode), returning the results as an array
// thanks wanderingstan at morethanwarm dot mail dot com for the
// initial work.
com.sidthemonkey.Utils.evaluateXPath = function (aNode, aExpr) {
  var xpe = new XPathEvaluator();
	try {
	  var nsResolver = xpe.createNSResolver(aNode.ownerDocument == null ?
	    aNode.documentElement : aNode.ownerDocument.documentElement);
	}
	catch (error){}
  var result = xpe.evaluate(aExpr, aNode, nsResolver, 0, null);
  var found = [];
  var res;
  while (res = result.iterateNext())
    found.push(res);
  return found;
}

//Code from here: https://developer.mozilla.org/en/Using_XPath#docEvaluateArray
// Example usage:
// var els = docEvaluateArray('//a');
// alert(els[0].nodeName); // gives 'A' in HTML document with at least one link
com.sidthemonkey.Utils.docEvaluateArray = function (expr, doc, context, resolver) {
	doc = doc ? doc : (context ? context.ownerDocument : document);
	resolver = resolver ? resolver : null;
	context = context ? context : doc; 
	var result = doc.evaluate(expr, context, resolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	var found = [];
	for(var i = 0; i < result.snapshotLength; i++) {
		found[i] = result.snapshotItem(i);
	}
	return found;
}

com.sidthemonkey.Utils.getXPathForElement = function (el, xml) {
	var xpath = '';
	var pos, tempitem2;
	
	while(el !== xml.documentElement) {		
		pos = 0;
		tempitem2 = el;
		while(tempitem2) {
			if (tempitem2.nodeType === 1 && tempitem2.nodeName === el.nodeName) { // If it is ELEMENT_NODE of the same name
				pos += 1;
			}
			tempitem2 = tempitem2.previousSibling;
		}
		
		xpath = "*[name()='"+el.nodeName+"' and namespace-uri()='"+(el.namespaceURI===null?'':el.namespaceURI)+"']["+pos+']'+'/'+xpath;

		el = el.parentNode;
	}
	xpath = '/*'+"[name()='"+xml.documentElement.nodeName+"' and namespace-uri()='"+(el.namespaceURI===null?'':el.namespaceURI)+"']"+'/'+xpath;
	xpath = xpath.replace(/\/$/, '');
	return xpath;
}

com.sidthemonkey.Utils.getDomainFromUrl = function (url) {
	if ((url.indexOf("/") > 0)){
		var urlComponents = url.split("/");
		var hostName = urlComponents[2] ? urlComponents[2] : url;
	}
	else {
		var hostName = url;
	}
	if (hostName.indexOf("?") > 0){
		hostName = hostName.split("?");
		hostName = hostName[0];
	}
	var domain = this.getDomainFromHostName(hostName);
	return domain.toLowerCase();
}

com.sidthemonkey.Utils.getDomainFromHostName = function (hostName){
	hostName = hostName.toLowerCase();
	var last3Char = hostName.substr(-3);
	var last6To3Char = hostName.substr(-6, 3);
	var domainNameFragments = hostName.split(".");
	if (last3Char.match(".") && (last6To3Char.match("co") || last6To3Char.match("ne") || last6To3Char.match("or"))){
		//This is a .xx or a .co.xx domain
		var domainName = domainNameFragments.slice(-3).join(".");
	}
	else {var domainName = domainNameFragments.slice(-2).join(".");}
	return domainName;
}

com.sidthemonkey.Utils.logObject = function (object) {
	for (var prop in object) {
		com.sidthemonkey.Utils.reportInfo(prop +": "+ object[prop]);
	}
}

com.sidthemonkey.Utils.insertBefore = function (elToInsert, elToInsertBefore) {
	if (!elToInsert || !elToInsertBefore) return;
	elToInsertBefore.parentNode.insertBefore(elToInsert,elToInsertBefore);
}

com.sidthemonkey.Utils.insertAfter = function (elToInsert, elToInsertAfter) {
	if (!elToInsert || !elToInsertAfter) return;
	elToInsertAfter.parentNode.insertBefore(elToInsert,elToInsertAfter.nextSibling);
}

com.sidthemonkey.Utils.openUrlInWindow = function (url, name) {
	name = "SEM Tools - Creative Writer";
  var WindowObjectReference = window.open(url,
                  name,
                  "resizable=yes,scrollbars=yes");
}

com.sidthemonkey.Utils.openUrlInBlankTab = function (urlString){
	//Takes a string as urlString and opens in a new tab. If current tab is blank then it uses that instead.
  var browserWindow = com.sidthemonkey.Utils.currentChromeWindow;
  var browser = browserWindow.getBrowser();
	var postInputStream = null;

  if (browser.mCurrentBrowser.currentURI.spec == "about:blank" &&
  		!browser.webProgress.isLoadingDocument) {
  	browserWindow.loadURI(urlString, null, postInputStream, false);
		var newTab = gBrowser.selectedTab;
		return newTab;
  }
  else {
  	var ke = (com.sidthemonkey.Utils.currentChromeWindow.gUbiquity || 0).lastKeyEvent || 0;
  	var newTab = browser[ke.shiftKey || ke.ctrlKey ? 'addTab' : 'loadOneTab'](urlString, null, null, postInputStream, false, false);
		return newTab;
  }
	
/*
  else if(openPref == 2)
    browserWindow.openDialog('chrome://browser/content', '_blank',
                             'all,dialog=no', urlString, null, null,
                             postInputStream);

  else
    browserWindow.loadURI(urlString, null, postInputStream, false);
*/
	
}

com.sidthemonkey.Utils.prefManager = function(startPoint) {
	//Set the root path for the preferences in the user preference file (see about:config to view)
	//Should be in the format "extensions.extension_name." inclduing the last period
	
	if (!startPoint) startPoint="";

	var pref=Components.classes["@mozilla.org/preferences-service;1"].
		getService(Components.interfaces.nsIPrefService).
		getBranch(startPoint);

	var observers={};

	// whether a preference exists
	this.exists=function(prefName) {
		return pref.getPrefType(prefName) != 0;
	}

	// returns the named preference, or defaultValue if it does not exist
	this.getValue=function(prefName, defaultValue) {
		var prefType=pref.getPrefType(prefName);

		// underlying preferences object throws an exception if pref doesn't exist
		if (prefType==pref.PREF_INVALID) {
			return defaultValue;
		}

		switch (prefType) {
			case pref.PREF_STRING: return pref.getCharPref(prefName);
			case pref.PREF_BOOL: return pref.getBoolPref(prefName);
			case pref.PREF_INT: return pref.getIntPref(prefName);
			default: return defaultValue;
		}
	}

	// sets the named preference to the specified value. values must be strings,
	// booleans, or integers.
	this.setValue=function(prefName, value) {
		var prefType=typeof(value);

		switch (prefType) {
			case "string":
			case "boolean":
				break;
			case "number":
				if (value % 1 != 0) {
					throw new Error("Cannot set preference to non integral number");
				}
				break;
			default:
				throw new Error("Cannot set preference with datatype: " + prefType);
		}

		// underlying preferences object throws an exception if new pref has a
		// different type than old one. i think we should not do this, so delete
		// old pref first if this is the case.
		if (this.exists(prefName) && prefType != typeof(this.getValue(prefName))) {
			this.remove(prefName);
		}

		// set new value using correct method
		switch (prefType) {
			case "string": pref.setCharPref(prefName, value); break;
			case "boolean": pref.setBoolPref(prefName, value); break;
			case "number": pref.setIntPref(prefName, Math.floor(value)); break;
		}
	}

	// deletes the named preference or subtree
	this.remove=function(prefName) {
		pref.deleteBranch(prefName);
	}

	// call a function whenever the named preference subtree changes
	this.watch=function(prefName, watcher) {
		// construct an observer
		var observer={
			observe:function(subject, topic, prefName) {
				watcher(prefName);
			}
		};

		// store the observer in case we need to remove it later
		observers[watcher]=observer;

		pref.QueryInterface(Components.interfaces.nsIPrefBranchInternal).
			addObserver(prefName, observer, false);
	}

	// stop watching
	this.unwatch=function(prefName, watcher) {
		if (observers[watcher]) {
			pref.QueryInterface(Components.interfaces.nsIPrefBranchInternal)
				.removeObserver(prefName, observers[watcher]);
		}
	}
}

