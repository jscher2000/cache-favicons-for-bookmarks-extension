/* 
  Copyright 2019. Jefferson "jscher2000" Scher. License: MPL-2.0.
  v0.5 - initial design
*/

/**** Retrieve Preferences From Storage and Set Up Listener ****/

// Preferences
let oPrefs = {
	maxage: 90,					// Set max-age to this many days
	imageURLs: []				// Site icons to modify caching for
};
// Update oPrefs from storage
function updatePref(){
	browser.storage.local.get("userprefs").then((results) => {
		if (results.userprefs != undefined){
			if (JSON.stringify(results.userprefs) != '{}'){
				var arrSavedPrefs = Object.keys(results.userprefs)
				for (var j=0; j<arrSavedPrefs.length; j++){
					oPrefs[arrSavedPrefs[j]] = results.userprefs[arrSavedPrefs[j]];
				}
			}
		}
	}).catch((err) => {console.log('Error retrieving storage: '+err.message);});
}
updatePref();

// Create response listener for images
browser.webRequest.onHeadersReceived.addListener(
	fixCC,
	{
		urls: ["<all_urls>"],
		types: ["image"]
	},
	["blocking", "responseHeaders"]
);

/**** Fix Headers of Intercepted Responses ****/

function fixCC(details) {
	if (details.statusCode == 200 && oPrefs.imageURLs.includes(details.url)){
		// extract the Cache-Control header if present
		let cacheControlHeader = '';
		for (let header of details.responseHeaders) {
			switch (header.name.toLowerCase()) {
				case "cache-control":
					cacheControlHeader = header;
					break;
			}
		}
		// update the Cache-Control header if needed
		if (cacheControlHeader != ''){
			if (cacheControlHeader.value.toLowerCase().indexOf('no-store') > -1){
				let newHeaderValue = 'max-age=' + (oPrefs.maxage * 24 * 60 * 60);
				console.log('For ' + details.url + ': Updated CC header from "' + cacheControlHeader.value + '" to "' + newHeaderValue + '"');
				cacheControlHeader.value = newHeaderValue;
			} else {
				console.log('For ' + details.url + ': No change from: "' + cacheControlHeader.value + '"');
			}
		}		
	}
	// Send the headers back
	return { responseHeaders: details.responseHeaders };
}

/**** Handle Messages from Popup/Options ****/

function handleMessage(request, sender, sendResponse) {
	if ("newURLs" in request) { // from popup
		var savechg = false;
		for (var i=0; i<request.newURLs.length; i++){
			if (!oPrefs.imageURLs.includes(request.newURLs[i])){
				oPrefs.imageURLs.push(request.newURLs[i]);
				savechg = true;
			}
		}
		if (savechg){
			// Update storage asynchronously (no need to wait)
			browser.storage.local.set(
				{userprefs: oPrefs}
			).catch((err) => {
				document.getElementById('oops').textContent = 'Error updating storage: ' + err.message;
				document.getElementById('oops').style.display = 'block';
			});
		}
		// Reload the page
		browser.tabs.query({currentWindow: true, active: true})
		.then((arrTabs) => {
			// Use the id of the first tab (there should only be one...)
			browser.tabs.reload(arrTabs[0].id);
		}).catch((err) => {
			console.log('Failed: ' + err.message);
		});
	}
}
browser.runtime.onMessage.addListener(handleMessage);
