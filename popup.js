/* 
  Copyright 2020. Jefferson "jscher2000" Scher. License: MPL-2.0.
  v0.5 - initial concept
*/

/**** Get a list of site icon(s) from the page and populate the popup ****/

var arrURLs = [];
function onExecuted(result) {
	// We are expecting an array of one or more URLs
	if (result.length === 0 || result[0].length === 0){
		document.getElementById('errs').textContent = 'Unable to determine or guess site icon URLs!';
	} else {
		arrURLs = result[0];
		for (var i=0; i<arrURLs.length; i++){
			var newLI = document.createElement('li');
			newLI.textContent = arrURLs[i];
			document.getElementById('iconlist').appendChild(newLI);
		}
		document.getElementById('btnGo').removeAttribute('disabled');
	}
}
function onError(error) {
	document.getElementById('errs').textContent = 'Error determining icon URLs: ' + err.message;
}
const executing = browser.tabs.executeScript({
	code: `
		var icons = document.querySelectorAll('link[rel~="icon"]');
		var iconURLs = [];
		if (icons.length == 0) {
		  iconURLs.push(location.protocol + '//' + location.host + '/favicon.ico')
		} else {
		  for (var i=0; i<icons.length; i++){
			iconURLs.push(icons[i].href);
		  }
		}
		// The following is returned in an array
		iconURLs;
	`
});
executing.then(onExecuted, onError);

/**** Event handlers ****/

document.getElementById('btnGo').addEventListener('click', function(evt){
	// Send URLs to background, then close (or display error)
	browser.runtime.sendMessage(
		{ newURLs: arrURLs }
	).then(function(){
		self.close();
	}).catch((err) => {
		document.getElementById('err').textContent = 'Error setting up for reload: ' + err.message;
	});
}, false);

document.getElementById('btnCancel').addEventListener('click', function(evt){
	self.close();
}, false);


