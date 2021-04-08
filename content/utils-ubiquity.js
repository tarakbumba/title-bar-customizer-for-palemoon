/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ubiquity.
 *
 * The Initial Developer of the Original Code is Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2007
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Atul Varma <atul@mozilla.com>
 *   Blair McBride <unfocused@gmail.com>
 *   Jono DiCarlo <jdicarlo@mozilla.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

// = Utils =
//
// This is a small library of all-purpose, general utility functions
// for use by chrome code.  Everything clients need is contained within
// the {{{Utils}}} namespace.

if(!com) var com={};
if(!com.sidthemonkey) com.sidthemonkey={};
if(!com.sidthemonkey.Utils) com.sidthemonkey.Utils={};

com.sidthemonkey.Utils.EXPORTED_SYMBOLS = ["Utils"];

com.sidthemonkey.Utils.Cc = Components.classes;
com.sidthemonkey.Utils.Ci = Components.interfaces;

//var Utils = {};

// Keep a reference to the global object, as certain utility functions
// need it.
com.sidthemonkey.Utils.__globalObject = this;

// ** {{{ com.sidthemonkey.Utils.reportWarning() }}} **
//
// This function can be used to report a warning to the JS Error Console,
// which can be displayed in Firefox by choosing "Error Console" from
// the "Tools" menu.
//
// {{{aMessage}}} is a plaintext string corresponding to the warning
// to provide.
//
// {{{stackFrameNumber}}} is an optional number specifying how many
// frames back in the call stack the warning message should be
// associated with. Its default value is 0, meaning that the line
// number of the caller is shown in the JS Error Console.  If it's 1,
// then the line number of the caller's caller is shown.

com.sidthemonkey.Utils.reportWarning = function reportWarning(aMessage, stackFrameNumber) {
  var stackFrame = Components.stack.caller;

  if (typeof(stackFrameNumber) != "number")
    stackFrameNumber = 0;

  for (var i = 0; i < stackFrameNumber; i++)
    stackFrame = stackFrame.caller;

  var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                       .getService(Components.interfaces.nsIConsoleService);
  var scriptError = Components.classes["@mozilla.org/scripterror;1"]
                    .createInstance(Components.interfaces.nsIScriptError);
  var aSourceName = stackFrame.filename;
  var aSourceLine = stackFrame.sourceLine;
  var aLineNumber = stackFrame.lineNumber;
  var aColumnNumber = null;
  var aFlags = scriptError.warningFlag;
  var aCategory = "SidTheMonkey javascript";
  scriptError.init(aMessage, aSourceName, aSourceLine, aLineNumber,
                   aColumnNumber, aFlags, aCategory);
  consoleService.logMessage(scriptError);
};

// ** {{{ com.sidthemonkey.Utils.reportInfo() }}} **
//
// Reports a purely informational message to the JS Error Console.
// Source code links aren't provided for informational messages, so
// unlike {{{com.sidthemonkey.Utils.reportWarning()}}}, a stack frame can't be passed
// in to this function.

com.sidthemonkey.Utils.reportInfo = function reportInfo(aMessage) {
  var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                       .getService(Components.interfaces.nsIConsoleService);
  var aCategory = "SidTheMonkey javascript: ";
  consoleService.logStringMessage(aCategory + aMessage);
};

// ** {{{ com.sidthemonkey.Utils.encodeJson() }}} **
//
// This function serializes the given object using JavaScript Object
// Notation (JSON).

com.sidthemonkey.Utils.encodeJson = function encodeJson(object) {
  var json = com.sidthemonkey.Utils.Cc["@mozilla.org/dom/json;1"]
             .createInstance(com.sidthemonkey.Utils.Ci.nsIJSON);
  return json.encode(object);
};

// ** {{{ com.sidthemonkey.Utils.decodeJson() }}} **
//
// This function unserializes the given string in JavaScript Object
// Notation (JSON) format and returns the result.

com.sidthemonkey.Utils.decodeJson = function decodeJson(string) {
  var json = com.sidthemonkey.Utils.Cc["@mozilla.org/dom/json;1"]
             .createInstance(com.sidthemonkey.Utils.Ci.nsIJSON);
  return json.decode(string);
};

// ** {{{com.sidthemonkey.Utils.ellipsify()}}} **
//
// Given a DOM node and a maximum number of characters, returns a
// new DOM node that has the same contents truncated to that number of
// characters. If any truncation was performed, an ellipsis is placed
// at the end of the content.

com.sidthemonkey.Utils.ellipsify = function ellipsify(node, chars) {
  var doc = node.ownerDocument;
  var copy = node.cloneNode(false);
  if (node.hasChildNodes()) {
    var children = node.childNodes;
    for (var i = 0; i < children.length && chars > 0; i++) {
      var childNode = children[i];
      var childCopy;
      if (childNode.nodeType == childNode.TEXT_NODE) {
        var value = childNode.nodeValue;
        if (value.length >= chars) {
          childCopy = doc.createTextNode(value.slice(0, chars) + "\u2026");
          chars = 0;
        } else {
          childCopy = childNode.cloneNode(false);
          chars -= value.length;
        }
      } else if (childNode.nodeType == childNode.ELEMENT_NODE) {
        childCopy = ellipsify(childNode, chars);
        chars -= childCopy.textContent.length;
      }
      copy.appendChild(childCopy);
    }
  }
  return copy;
}

// ** {{{ com.sidthemonkey.Utils.set_Timeout() }}} **
//
// This function works just like the {{{window.set Timeout()}}} method
// in content space, but it can only accept a function (not a string)
// as the callback argument.
//
// {{{callback}}} is the callback function to call when the given
// delay period expires.  It will be called only once (not at a regular
// interval).
//
// {{{delay}}} is the delay, in milliseconds, after which the callback
// will be called once.
//
// This function returns a timer ID, which can later be given to
// {{{com.sidthemonkey.Utils.clearTimeout()}}} if the client decides that it wants to
// cancel the callback from being triggered.

// TODO: Allow strings for the first argument like DOM set Timeout() does.

com.sidthemonkey.Utils.set_Timeout = function set_Timeout(callback, delay) {
  var classObj = com.sidthemonkey.Utils.Cc["@mozilla.org/timer;1"];
  var timer = classObj.createInstance(com.sidthemonkey.Utils.Ci.nsITimer);
  var timerID = com.sidthemonkey.Utils.__timerData.nextID;
  // emulate window.set Timeout() by incrementing next ID by random amount
  com.sidthemonkey.Utils.__timerData.nextID += Math.floor(Math.random() * 100) + 1;
  com.sidthemonkey.Utils.__timerData.timers[timerID] = timer;

  timer.initWithCallback(new com.sidthemonkey.Utils.__TimerCallback(callback),
                         delay,
                         classObj.TYPE_ONE_SHOT);
  return timerID;
};

// ** {{{ com.sidthemonkey.Utils.clearTimeout() }}} **
//
// This function behaves like the {{{window.clearTimeout()}}} function
// in content space, and cancels the callback with the given timer ID
// from ever being called.

com.sidthemonkey.Utils.clearTimeout = function clearTimeout(timerID) {
  if(!(timerID in com.sidthemonkey.Utils.__timerData.timers))
    return;

  var timer = com.sidthemonkey.Utils.__timerData.timers[timerID];
  timer.cancel();
  delete com.sidthemonkey.Utils.__timerData.timers[timerID];
};

// Support infrastructure for the timeout-related functions.

com.sidthemonkey.Utils.__TimerCallback = function __TimerCallback(callback) {
  Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

  this._callback = callback;
  this.QueryInterface = XPCOMUtils.generateQI([com.sidthemonkey.Utils.Ci.nsITimerCallback]);
};

com.sidthemonkey.Utils.__TimerCallback.prototype = {
  notify : function notify(timer) {
    for(var timerID in com.sidthemonkey.Utils.__timerData.timers) {
      if(com.sidthemonkey.Utils.__timerData.timers[timerID] == timer) {
        delete com.sidthemonkey.Utils.__timerData.timers[timerID];
        break;
      }
    }
    this._callback();
  }
};

com.sidthemonkey.Utils.__timerData = {
  nextID: Math.floor(Math.random() * 100) + 1,
  timers: {}
};

// ** {{{ com.sidthemonkey.Utils.url() }}} **
//
// Given a string representing an absolute URL or a {{{nsIURI}}}
// object, returns an equivalent {{{nsIURI}}} object.  Alternatively,
// an object with keyword arguments as keys can also be passed in; the
// following arguments are supported:
//
// * {{{uri}}} is a string or {{{nsIURI}}} representing an absolute or
//   relative URL.
//
// * {{{base}}} is a string or {{{nsIURI}}} representing an absolute
//   URL, which is used as the base URL for the {{{uri}}} keyword
//   argument.
//
// An optional second argument may also be passed in, which specifies
// a default URL to return if the given URL can't be parsed.

com.sidthemonkey.Utils.url = function url(spec, defaultUri) {
  var base = null;
  if (typeof(spec) == "object") {
    if (spec instanceof com.sidthemonkey.Utils.Ci.nsIURI)
      // nsIURL object was passed in, so just return it back
      return spec;

    // Assume jQuery-style dictionary with keyword args was passed in.
    base = spec.base ? com.sidthemonkey.Utils.url(spec.base, defaultUri) : null;
    spec = spec.uri ? spec.uri : null;
  }

  var ios = com.sidthemonkey.Utils.Cc["@mozilla.org/network/io-service;1"]
    .getService(com.sidthemonkey.Utils.Ci.nsIIOService);

  try {
    return ios.newURI(spec, null, base);
  } catch (e if (e.result == Components.results.NS_ERROR_MALFORMED_URI) &&
           defaultUri) {
    return com.sidthemonkey.Utils.url(defaultUri);
  }
};

// ** {{{ com.sidthemonkey.Utils.openUrlInBrowser() }}} **
//
// This function opens the given URL in the user's browser, using
// their current preferences for how new URLs should be opened (e.g.,
// in a new window vs. a new tab, etc).
//
// {{{urlString}}} is a string corresponding to the URL to be
// opened.
//
// {{{postData}}} is an optional argument that allows HTTP POST data
// to be sent to the newly-opened page.  It may be a string, an Object
// with keys and values corresponding to their POST analogues, or an
// {{{nsIInputStream}}}.

com.sidthemonkey.Utils.openUrlInBrowser = function openUrlInBrowser(urlString, postData) {
  var postInputStream = null;
  if(postData) {
    if(postData instanceof com.sidthemonkey.Utils.Ci.nsIInputStream) {
      postInputStream = postData;
    } else {
      if(typeof postData == "object") // json -> string
        postData = com.sidthemonkey.Utils.paramsToString(postData);

      var stringStream = com.sidthemonkey.Utils.Cc["@mozilla.org/io/string-input-stream;1"]
        .createInstance(com.sidthemonkey.Utils.Ci.nsIStringInputStream);
      stringStream.data = postData;

      postInputStream = com.sidthemonkey.Utils.Cc["@mozilla.org/network/mime-input-stream;1"]
        .createInstance(com.sidthemonkey.Utils.Ci.nsIMIMEInputStream);
      postInputStream.addHeader("Content-Type",
                                "application/x-www-form-urlencoded");
      postInputStream.addContentLength = true;
      postInputStream.setData(stringStream);
    }
  }

  var browserWindow = com.sidthemonkey.Utils.currentChromeWindow;
  var browser = browserWindow.getBrowser();

  var prefService = com.sidthemonkey.Utils.Cc["@mozilla.org/preferences-service;1"]
    .getService(com.sidthemonkey.Utils.Ci.nsIPrefBranch);
  var openPref = prefService.getIntPref("browser.link.open_newwindow");

  //2 (default in SeaMonkey and Firefox 1.5): In a new window
  //3 (default in Firefox 2 and above): In a new tab
  //1 (or anything else): In the current tab or window

  if(browser.mCurrentBrowser.currentURI.spec == "about:blank" &&
     !browser.webProgress.isLoadingDocument )
    browserWindow.loadURI(urlString, null, postInputStream, false);
  else if(openPref == 3){
    var ke = (0).lastKeyEvent || 0;
    browser[ke.shiftKey || ke.ctrlKey ? 'addTab' : 'loadOneTab'](
      urlString, null, null, postInputStream, false, false);
  }
  else if(openPref == 2)
    browserWindow.openDialog('chrome://browser/content', '_blank',
                             'all,dialog=no', urlString, null, null,
                             postInputStream);
  else
    browserWindow.loadURI(urlString, null, postInputStream, false);
};

// ** {{{ com.sidthemonkey.Utils.focusUrlInBrowser() }}} **
//
// This function focuses a tab with the given URL if one exists in the
// current window; otherwise, it delegates the opening of the URL in a
// new window or tab to {{{com.sidthemonkey.Utils.openUrlInBrowser()}}}.

com.sidthemonkey.Utils.focusUrlInBrowser = function focusUrlInBrowser(urlString) {
  var Application = Components.classes["@mozilla.org/fuel/application;1"]
                    .getService(Components.interfaces.fuelIApplication);

  var tabs = Application.activeWindow.tabs;
  for (var i = 0; i < tabs.length; i++)
    if (tabs[i].uri.spec == urlString) {
      tabs[i].focus();
      return;
    }
  com.sidthemonkey.Utils.openUrlInBrowser(urlString);
};

// ** {{{ com.sidthemonkey.Utils.getCookie() }}} **
//
// This function returns the cookie for the given domain and with the
// given name.  If no matching cookie exists, {{{null}}} is returned.

com.sidthemonkey.Utils.getCookie = function getCookie(domain, name) {
  var cookieManager = com.sidthemonkey.Utils.Cc["@mozilla.org/cookiemanager;1"].
                      getService(com.sidthemonkey.Utils.Ci.nsICookieManager);

  var iter = cookieManager.enumerator;
  while (iter.hasMoreElements()) {
    var cookie = iter.getNext();
    if (cookie instanceof com.sidthemonkey.Utils.Ci.nsICookie)
      if (cookie.host == domain && cookie.name == name )
        return cookie.value;
  }
  // if no matching cookie:
  return null;
};

// ** {{{ com.sidthemonkey.Utils.paramsToString() }}} **
//
// This function takes the given Object containing keys and
// values into a querystring suitable for inclusion in an HTTP
// GET or POST request.

com.sidthemonkey.Utils.paramsToString = function paramsToString(params) {
  var stringPairs = [];
  function valueTypeIsOk(val) {
    if (typeof val == "function")
      return false;
    if (val === undefined)
      return false;
    if (val === null)
      return false;
    return true;
  }
  function addPair(key, value) {
    if (valueTypeIsOk(value)) {
      stringPairs.push(
        encodeURIComponent(key) + "=" + encodeURIComponent(value.toString())
      );
    }
  }
  for (var key in params) {
    // note: explicitly ignoring values that are objects/functions/undefined!
    if (com.sidthemonkey.Utils.isArray(params[key])) {
      params[key].forEach(function(item) {
        addPair(key + "[]", item);
      });
    } else {
      addPair(key, params[key]);
    };
  }
  return "?" + stringPairs.join("&");
};

// ** {{{ com.sidthemonkey.Utils.urlToParams() }}} **
//
// This function takes the given url and returns an Object containing keys and
// values retrieved from its query-part

com.sidthemonkey.Utils.urlToParams = function urlToParams(url) {
  function isArray(key) {
    return (key.substring(key.length-2)=="[]");
  }
  var params = {};
  var paramList = url.substring(url.indexOf("?")+1).split("&");
  for (var param in paramList) {
    var key="",
        value="";
    var kv = paramList[param].split("=");
    try {
      key = kv[0];
      value = decodeURIComponent(kv[1]).replace(/\+/g," ");
    }
    catch (e){};
    if (isArray(key)) {
      key = key.substring(0,key.length-2);
      if (params[key]) {
        params[key].push(value);
      }
      else {
        params[key]=[value];
      }
    }
    else {
      params[key] = value;
    }
  }
  return params;
}

// ** {{{ com.sidthemonkey.Utils.getLocalUrl() }}} **
//
// This function synchronously retrieves the content of the given
// local URL, such as a {{{file:}}} or {{{chrome:}}} URL, and returns
// it.

com.sidthemonkey.Utils.getLocalUrl = function getLocalUrl(url) {
  var req = com.sidthemonkey.Utils.Cc["@mozilla.org/xmlextras/xmlhttprequest;1"]
            .createInstance(com.sidthemonkey.Utils.Ci.nsIXMLHttpRequest);
  req.open('GET', url, false);
  req.overrideMimeType("text/plain");
  req.send(null);
  if (req.status == 0)
    return req.responseText;
  else
    throw new Error("Failed to get " + url);
};

// ** {{{ com.sidthemonkey.Utils.trim() }}} **
//
// This function removes all whitespace surrounding a string and
// returns the result.

com.sidthemonkey.Utils.trim = function trim(str) {
  return str.replace(/^\s+|\s+$/g,"");
};

// ** {{{ com.sidthemonkey.Utils.isArray() }}} **
//
// This function returns whether or not its parameter is an instance
// of a JavaScript Array object.

com.sidthemonkey.Utils.isArray = function isArray(val) {
  if (typeof val != "object")
    return false;
  if (val == null)
    return false;
  if (!val.constructor || val.constructor.name != "Array")
    return false;
  return true;
}

// == {{{ com.sidthemonkey.Utils.History }}} ==
//
// This object contains functions that make it easy to access
// information about the user's browsing history.

com.sidthemonkey.Utils.History = {

  // ** {{{ com.sidthemonkey.Utils.History.visitsToDomain() }}} **
  //
  // This function returns the number of times the user has visited
  // the given domain name.

  visitsToDomain : function visitsToDomain( domain ) {

      var hs = com.sidthemonkey.Utils.Cc["@mozilla.org/browser/nav-history-service;1"].
               getService(com.sidthemonkey.Utils.Ci.nsINavHistoryService);

      var query = hs.getNewQuery();
      var options = hs.getNewQueryOptions();

      options.maxResults = 10;
      query.domain = domain;

      // execute query
      var result = hs.executeQuery(query, options );
      var root = result.root;
      root.containerOpen = true;
      var count = 0;
      for( var i=0; i < root.childCount; ++i ) {
        place = root.getChild( i );
        count += place.accessCount;
      }
    return count;
  }
};

// ** {{{ com.sidthemonkey.Utils.computeCryptoHash() }}} **
//
// Computes and returns a cryptographic hash for a string given an
// algorithm.
//
// {{{algo}}} is a string corresponding to a valid hash algorithm.  It
// can be any one of {{{MD2}}}, {{{MD5}}}, {{{SHA1}}}, {{{SHA256}}},
// {{{SHA384}}}, or {{{SHA512}}}.
//
// {{{str}}} is the string to be hashed.

com.sidthemonkey.Utils.computeCryptoHash = function computeCryptoHash(algo, str) {
  var converter = com.sidthemonkey.Utils.Cc["@mozilla.org/intl/scriptableunicodeconverter"]
                  .createInstance(com.sidthemonkey.Utils.Ci.nsIScriptableUnicodeConverter);
  converter.charset = "UTF-8";
  var result = {};
  var data = converter.convertToByteArray(str, result);
  var crypto = com.sidthemonkey.Utils.Cc["@mozilla.org/security/hash;1"]
               .createInstance(com.sidthemonkey.Utils.Ci.nsICryptoHash);
  crypto.initWithString(algo);
  crypto.update(data, data.length);
  var hash = crypto.finish(false);

  function toHexString(charCode) {
    return ("0" + charCode.toString(16)).slice(-2);
  }
  var hashString = [toHexString(hash.charCodeAt(i))
                    for (i in hash)].join("");
  return hashString;
};

// ** {{{ com.sidthemonkey.Utils.escapeHtml() }}} **
//
// This function returns a version of the string safe for
// insertion into HTML. Useful when you just want to
// concatenate a bunch of strings into an HTML fragment
// and ensure that everything's escaped properly.

com.sidthemonkey.Utils.escapeHtml = function escapeHtml(str) {
  return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
};


// ** {{{ com.sidthemonkey.Utils.convertFromUnicode() }}} **
//
// Encodes the given unicode text to a given character set and
// returns the result.
//
// {{{toCharset}}} is a string corresponding to the character set
// to encode to.
//
// {{{text}}} is a unicode string.

com.sidthemonkey.Utils.convertFromUnicode = function convertFromUnicode(toCharset, text) {
  var converter = com.sidthemonkey.Utils.Cc["@mozilla.org/intl/scriptableunicodeconverter"]
                  .getService(com.sidthemonkey.Utils.Ci.nsIScriptableUnicodeConverter);
  converter.charset = toCharset;
  return converter.ConvertFromUnicode(text);
};

// ** {{{ com.sidthemonkey.Utils.convertToUnicode() }}} **
//
// Decodes the given text from a character set to unicode and returns
// the result.
//
// {{{fromCharset}}} is a string corresponding to the character set to
// decode from.
//
// {{{text}}} is a string encoded in the character set
// {{{fromCharset}}}.

com.sidthemonkey.Utils.convertToUnicode = function convertToUnicode(fromCharset, text) {
  var converter = com.sidthemonkey.Utils.Cc["@mozilla.org/intl/scriptableunicodeconverter"]
                  .getService(com.sidthemonkey.Utils.Ci.nsIScriptableUnicodeConverter);
  converter.charset = fromCharset;
  return converter.ConvertToUnicode(text);
};

// == {{{ com.sidthemonkey.Utils.tabs }}} ==
//
// This Object contains functions related to Firefox tabs.

com.sidthemonkey.Utils.tabs = {

  // ** {{{ com.sidthemonkey.Utils.tabs.get() }}} **
  //
  // Gets open tabs.
  //
  // {{{aName}}} is an optional string tab name.  If supplied, this
  // function will return the named tab or null.
  //
  // This function returns a a hash of tab names to tab references; or,
  // if a name parameter is passed, it returns the matching tab
  // reference or null.

  get: function Utils_tabs_get(aName) {
    if (aName)
      return this._cache[aName] || null;

    return this._cache;
  },

  // ** {{{ com.sidthemonkey.Utils.tabs.search() }}} **
  //
  // This function searches for tabs by tab name and returns a hash of
  // tab names to tab references.
  //
  // {{{aSearchText}}} is a string specifying the text to search for.
  //
  // {{{aMaxResults}}} is an integer specifying the maximum number of
  // results to return.

  search: function Utils_tabs_search(aSearchText, aMaxResults) {
    var matches = {};
    var matchCount = 0;
    for (var name in this._cache) {
       var tab = this._cache[name];
      //TODO: implement a better match algorithm
      if (name.match(aSearchText, "i") ||
          (tab.document.URL && tab.document.URL.toString().match(aSearchText, "i"))) {
        matches[name] = tab;
        matchCount++;
      }
      if (aMaxResults && aMaxResults == matchCount)
        break;
    }
    return matches;
  },

  // Handles TabOpen, TabClose and load events; clears tab cache.

  onTabEvent: function(aEvent, aTab) {
    switch ( aEvent.type ) {
      case "TabOpen":
        // this is received before the page content has loaded.
        // so need to find the new tab, and add a load
        // listener to it, and only then add it to the cache.
        // TODO: once bug 470163 is fixed, can move to a much
        // cleaner way of doing this.
        var self = this;
        var windowCount = this.Application.windows.length;
        for( var i=0; i < windowCount; i++ ) {
          var window = this.Application.windows[i];
          var tabCount = window.tabs.length;
          for (var j = 0; j < tabCount; j++) {
            let tab = window.tabs[j];
            if (!this._cache[tab.document.title]) {
              // add a load listener to the tab
              // and add the tab to the cache after it has loaded.
              tab.events.addListener("load", function(aEvent) {
                self.onTabEvent(aEvent, tab);
              });
            }
          }
        }
        break;
      case "TabClose":
        // for TabClose events, invalidate the cache.
        // TODO: once bug 470163 is fixed, can just delete the tab from
        // from the cache, instead of invalidating the entire thing.
        this.__cache = null;
        break;
      case "load":
        // handle new tab page loads, and reloads of existing tabs
        if (aTab && aTab.document.title) {

          // if a tab with this title is not cached, add it
          if (!this._cache[aTab.document.title])
            this._cache[aTab.document.title] = aTab;

          // evict previous cache entries for the tab
          for (var title in this._cache) {
            if (this._cache[title] == aTab && title != aTab.document.title) {
              // if the cache contains an entry for this tab, and the title
              // differs from the tab's current title, then evict the entry.
              delete this._cache[title];
              break;
            }
          }
        }
        break;
    }
  },

  // Smart-getter for FUEL.

  get Application() {
    delete this.Application;
    return this.Application = com.sidthemonkey.Utils.Cc["@mozilla.org/fuel/application;1"]
                              .getService(com.sidthemonkey.Utils.Ci.fuelIApplication);
  },

   // Getter for the tab cache; manages reloading the cache.

  __cache: null,
  get _cache() {
    if (this.__cache)
      return this.__cache;

    this.__cache = {};
    var windowCount = this.Application.windows.length;
    for( var j=0; j < windowCount; j++ ) {

      var win = this.Application.windows[j];
      win.events.addListener(
        "TabOpen",
        function(aEvent) { self.onTabEvent(aEvent); }
      );
      win.events.addListener(
        "TabClose",
        function(aEvent) { self.onTabEvent(aEvent); }
      );

      var tabCount = win.tabs.length;
      for (var i = 0; i < tabCount; i++) {

        let tab = win.tabs[i];

        // add load listener to tab
        var self = this;
        tab.events.addListener("load", function(aEvent) {
          self.onTabEvent(aEvent, tab);
        });

        // add tab to cache
        this.__cache[tab.document.title] = tab;
      }
    }

    return this.__cache;
  }
};

function AutoCompleteInput(aSearches) {
    this.searches = aSearches;
}

AutoCompleteInput.prototype = {
    constructor: AutoCompleteInput,

    searches: null,

    minResultsForPopup: 0,
    timeout: 10,
    searchParam: "",
    textValue: "",
    disableAutoComplete: false,
    completeDefaultIndex: false,

    get searchCount() {
        return this.searches.length;
    },

    getSearchAt: function(aIndex) {
        return this.searches[aIndex];
    },

    onSearchBegin: function() {},
    onSearchComplete: function() {},

    popupOpen: false,

    popup: {
        setSelectedIndex: function(aIndex) {},
        invalidate: function() {},

        // nsISupports implementation
        QueryInterface: function(iid) {
            if (iid.equals(com.sidthemonkey.Utils.Ci.nsISupports) || iid.equals(com.sidthemonkey.Utils.Ci.nsIAutoCompletePopup)) return this;

            throw Components.results.NS_ERROR_NO_INTERFACE;
        }
    },

    // nsISupports implementation
    QueryInterface: function(iid) {
        if (iid.equals(com.sidthemonkey.Utils.Ci.nsISupports) || iid.equals(com.sidthemonkey.Utils.Ci.nsIAutoCompleteInput)) return this;

        throw Components.results.NS_ERROR_NO_INTERFACE;
    }
};

com.sidthemonkey.Utils.history = {

     __createController : function createController(onSearchComplete){
          var controller = Components.classes["@mozilla.org/autocomplete/controller;1"].getService(Components.interfaces.nsIAutoCompleteController);

          var input = new AutoCompleteInput(["history"]);
          input.onSearchComplete = function(){
             onSearchComplete(controller);
          };
          controller.input = input;
          return controller;
     },

     search : function searchHistory(query, maxResults, callback){

        var ctrlr = this.__createController(function(controller){
           for (var i = 0; i < controller.matchCount; i++) {
              var url = controller.getValueAt(i);
              var title = controller.getCommentAt(i);
              if (title.length == 0) { title = url; }
              var favicon = controller.getImageAt(i);

              callback({url : url, title : title, favicon : favicon })
           }
        });

        ctrlr.startSearch(query);
     }
};

// ** {{{ com.sidthemonkey.Utils.appName }}} **
//
// This property provides the chrome application name found in nsIXULAppInfo.name.
// Examples values are "Firefox", "Songbird", "Thunderbird".
//
// TODO: cache the value since it won't change for the life of the application.

com.sidthemonkey.Utils.__defineGetter__("appName", function() {
  return com.sidthemonkey.Utils.Cc["@mozilla.org/xre/app-info;1"].
         getService(com.sidthemonkey.Utils.Ci.nsIXULAppInfo).
         name;
});

// ** {{{ com.sidthemonkey.Utils.appWindowType }}} **
//
// This property provides the name of "main" application windows for the chrome
// application.
// Examples values are "navigator:browser" for Firefox", and
// "Songbird:Main" for Songbird.

com.sidthemonkey.Utils.__defineGetter__("appWindowType", function() {
  switch(com.sidthemonkey.Utils.appName) {
    case "Songbird":
      return "Songbird:Main";
    default:
      return "navigator:browser";
  }
});

// ** {{{ com.sidthemonkey.Utils.currentChromeWindow }}} **
//
// This property is a reference to the application chrome window
// that currently has focus.

com.sidthemonkey.Utils.__defineGetter__("currentChromeWindow", function() {
  var wm = com.sidthemonkey.Utils.Cc["@mozilla.org/appshell/window-mediator;1"].
           getService(com.sidthemonkey.Utils.Ci.nsIWindowMediator);
  return wm.getMostRecentWindow(com.sidthemonkey.Utils.appWindowType);
});
