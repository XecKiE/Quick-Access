window.onload = function() {
	//Load current settings
	if(typeof browser != 'undefined') {
		browser.storage.local.get(['fav_bar', 'fav_other', 'theme']).then(function(r) {
			if(typeof r.fav_bar != 'undefined') {
				document.getElementById('fav_bar').checked = r.fav_bar;
			}
			if(typeof r.fav_other != 'undefined') {
				document.getElementById('fav_other').checked = r.fav_other;
			}
			if(typeof r.theme != 'undefined') {
				document.getElementById(r.theme).checked = true;
			}
		}, function(e) {
			alert('Unknown error, you can try to update your navigator or report the bug on the Github page');
		});
	} else if(typeof chrome != 'undefined') {
		browser = chrome;
		chrome.storage.local.get(['fav_bar', 'fav_other', 'theme'], function(r) {
			if(typeof r.fav_bar != 'undefined') {
				document.getElementById('fav_bar').checked = r.fav_bar;
			}
			if(typeof r.fav_other != 'undefined') {
				document.getElementById('fav_other').checked = r.fav_other;
			}
			if(typeof r.theme != 'undefined') {
				document.getElementById(r.theme).checked = true;
			}
		});
	} else {
		alert('Unknown error, you can try to update your navigator or report the bug on the Github page');
	}

	//Load localisation
	['optionChooseBookmark', 'optionChooseBookmarkBar', 'optionChooseBookmarkOther', 'optionChooseTheme', 'optionChooseThemeDefault', 'optionChooseThemeDark', 'optionChooseThemeSublime', 'optionChooseSave'].forEach(function(element) {
		document.getElementById(element).textContent = browser.i18n.getMessage(element);
	});

	//Add submit event listener
	document.getElementById('form').addEventListener('submit', function(e) {
		browser.storage.local.set({
			fav_bar: document.getElementById('fav_bar').checked,
			fav_other: document.getElementById('fav_other').checked,
			theme: document.querySelector('input[name="theme"]:checked').value
		});
		e.preventDefault();
		window.close();
	});

	//Display form
	document.getElementById('form').style.display = '';
}