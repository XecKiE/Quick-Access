var keys = [];
var theme = 'default';
var browser_type = 'unknown';
var fuzzy;
var start_time = new Date().getTime();
var previous_time = new Date().getTime();


function monitor_reset() {
	previous_time = new Date().getTime();
}

function monitor(name) {
	var t = new Date().getTime();
	console.log(name+': '+(t-previous_time)+' - since start:'+(t-start_time));
	previous_time = t;
}

window.onload = function() {
	var datas = ['fav_bar', 'fav_other', 'theme'];
monitor_reset();
	if(typeof browser != 'undefined') {
		browser_type = 'firefox';
		//Those can't be open because of security reasons
		/*keys = keys.concat([
			{key: 'about:preferences', label: browser.i18n.getMessage('firefoxPreferences')},
			{key: 'about:addons', label: browser.i18n.getMessage('firefoxAddons')},
			{key: 'about:debugging', label: browser.i18n.getMessage('firefoxDebugging')},
			{key: 'about:downloads', label: browser.i18n.getMessage('firefoxDownloads')},
			{key: 'todo', label: browser.i18n.getMessage('extensionAbout')}
		]);*/
		browser.storage.local.get(datas).then(initialize, function(e) {
			return fatal_error('Unknown error, you can try to update your navigator or report the bug on the Github page');
		});
	} else if(typeof chrome != 'undefined') {
		browser_type = 'chrome';
		browser = chrome;
		keys = keys.concat([
			{key: 'chrome://history/', label: browser.i18n.getMessage('chromeHistory')},
			{key: 'chrome://downloads/', label: browser.i18n.getMessage('chromeDownloads')},
			{key: 'chrome://settings/', label: browser.i18n.getMessage('chromeSettings')},
			{key: 'chrome://bookmarks/', label: browser.i18n.getMessage('chromeBookmarks')},
			{key: 'chrome://extensions/', label: browser.i18n.getMessage('chromeExtensions')},
			{key: 'todo', label: browser.i18n.getMessage('extensionAbout')},
			{key: 'chrome://extensions/?options='+browser.i18n.getMessage('@@extension_id'), label: browser.i18n.getMessage('extensionOptions')}
		]);
		browser.storage.local.get(datas, initialize);
	}
}

function initialize(data) {
monitor('storage');
	//Load the chosen theme
	if(typeof data.theme != 'undefined') {
		theme = data.theme;
	}
	var link = document.createElement('link');
	link.href = theme+'.css';
	link.type = 'text/css';
	link.rel = 'stylesheet';
	document.getElementsByTagName('head')[0].appendChild(link);
	document.getElementById('fuzzy').style.display = '';
monitor_reset();
	//Load the bookmarks
	browser.bookmarks.getTree(function(items) {
		if(typeof data.fav_bar == 'undefined' || data.fav_bar) {
			if(browser_type == 'chrome') {
				keys = keys.concat(recursive_bookmarks(items[0].children[0], 0, ''));
			} else if(browser_type == 'firefox') {
				keys = keys.concat(recursive_bookmarks(items[0].children[0], 0, ''));
			}
		}
		if(typeof data.fav_other != 'undefined' && data.fav_other) {
			if(browser_type == 'chrome') {
				keys = keys.concat(recursive_bookmarks(items[0].children[1], 0, ''));
			} else if(browser_type == 'firefox') {
				keys = keys.concat(recursive_bookmarks(items[0].children[2], 0, ''));
			}
		}
		monitor('bookmarks');
		fuzzy = new Fuzzy(document.getElementById('fuzzy'), keys, open_url, function() {}, function() {}, [], '');
		monitor('fuzzy');
		fuzzy.get_focus();
	});
}

function recursive_bookmarks(items, nb, prefix) {
	var r = [];
	if(nb > 0 && (items.title == '' || items.title.charAt(items.title.length-1) == ' ')) {
		return r;
	}
	if(typeof items.children != 'undefined') {
		if(nb > 0) {
			prefix += items.title+' > ';
		}
		nb++;
		for(var i=0 ; i<items.children.length ; i++) {
			r = r.concat(recursive_bookmarks(items.children[i], nb, prefix));
		}
	} else {
		r.push({key: items.url, 'label': browser.i18n.getMessage('bookmarks')+': '+prefix+items.title});//items.url
	}
	return r;
}

function open_url(_url) {
	browser.tabs.create({url: _url});
	//window.close();
}

function fatal_error(message) {
	window.close();
	alert(message);
	return false;
}







/**
 * Create a fuzzy search on an element
 * @param      {dom} _d_parent          The parent dom element (should follow the structure given in the sample)
 * @param    {array} _data              An array list of the elements to search, they should have the following structure : {key: UNIQUE_ID, fuzzy: [EXTRA_SEARCHABLE_STRING], label: LABEL_OF_THE_ROW}
 * @param {function} [_on_select]       When an element is selected, this function will be called
 * @param {function} [_on_goback]       When an element is selected (on go back), this function will be called
 * @param {function} [_on_input]        When a character is inputed, this function will be called
 * @param    {array} [_breadcrumb]      The current breadcrumb (should be an empty array if none)
 * @param   {string} [_breadcrumb_text] The current input text
 */
class Fuzzy {
	constructor(_d_parent, _data, _on_select, _on_goback, _on_input, _breadcrumb, _breadcrumb_text) {
		if(!_breadcrumb) {
			_breadcrumb = [];
		}
		if(!_breadcrumb_text) {
			_breadcrumb_text = '';
		}
		this.d_parent = _d_parent;
		this.data = _data;
		this.on_input = _on_input;
		this.on_select = _on_select;
		this.on_goback = _on_goback;
		this.breadcrumb = _breadcrumb;
		var t = this.d_parent.getElementsByClassName('fuzzy_text');
		if(t.length) {
			this.d_text = t[0];
		}
		var t = this.d_parent.getElementsByClassName('fuzzy_breadcrumb');
		if(t.length) {
			this.d_breadcrumb = t[0];
		}
		var t = this.d_parent.getElementsByClassName('fuzzy_input');
		if(t.length) {
			this.d_input = t[0];
			this.d_input.value = _breadcrumb_text;
		}
		var t = this.d_parent.getElementsByClassName('fuzzy_dropdown');
		if(t.length) {
			this.d_dropdown = t[0];
		}

		(function(parent) {
			parent.d_parent.addEventListener('mousedown', function() {
				setTimeout(function() {parent.get_focus();}, 0);
			});
			parent.d_dropdown.addEventListener('scroll', function() {
				setTimeout(function() {parent.get_focus();}, 0);
			});
			parent.d_input.addEventListener('keydown', function(event) {
				if((event.key == 'Tab' && !event.shiftKey) || event.key == 'Enter') {
					parent.select();
					event.preventDefault();
				} else if((event.key == 'Tab' && event.shiftKey)
					|| (event.key == 'Backspace' && parent.d_input.value == '')) {
					parent.back();
					event.preventDefault();
				} else if(event.key == 'ArrowDown') {
					if(parent.d_selected.nextElementSibling) {
						parent.d_selected.className = '';
						parent.d_selected = parent.d_selected.nextElementSibling;
						parent.d_selected.className = 'fuzzy_selected';
						if(parent.d_selected.offsetTop+parent.d_selected.offsetHeight > parent.d_dropdown.clientHeight+parent.d_dropdown.scrollTop) {
							parent.d_selected.scrollIntoView(false);
						} else if(parent.d_selected.offsetTop < parent.d_dropdown.scrollTop) {
							parent.d_selected.scrollIntoView(true);
						}
					}
					event.preventDefault();
				} else if(event.key == 'ArrowUp') {
					if(parent.d_selected.previousElementSibling) {
						parent.d_selected.className = '';
						parent.d_selected = parent.d_selected.previousElementSibling;
						parent.d_selected.className = 'fuzzy_selected';
						if(parent.d_selected.offsetTop+parent.d_selected.offsetHeight > parent.d_dropdown.clientHeight+parent.d_dropdown.scrollTop) {
							parent.d_selected.scrollIntoView(false);
						} else if(parent.d_selected.offsetTop < parent.d_dropdown.scrollTop) {
							parent.d_selected.scrollIntoView(true);
						}
					}
					event.preventDefault();
				} else {
					setTimeout(function() {parent.refresh_dropdown();if(parent.on_input)parent.on_input();}, 0);
				}
			});
		})(this);

		this.refresh_breadcrumb();
		this.refresh_dropdown();
	}

	select_key(dom) {
		this.d_selected.className = '';
		this.d_selected = dom;
		this.d_selected.className = 'fuzzy_selected';
	}

	valid_key(dom) {
		if(dom == this.d_selected) {
			this.select();
		}
	}

	select() {
		var selected = false;
		for(var i=0 ; i<this.data.length ; i++) {
			if(this.data[i].key == this.d_selected.dataset.key) {
				selected = this.data[i];
				break;
			}
		}
		if(selected && !selected.final) {
			this.breadcrumb.push({
				key: selected.key,
				label: selected.label
			});
			this.d_input.value = '';
			if(this.on_select) {
				this.on_select(this.d_selected.dataset.key);
			}
			this.refresh_breadcrumb();
		}
	}

	back(index) {
		var index, key;
		if(typeof index == 'undefined') {
			index = this.breadcrumb.length-2;
		}
		if(index < 0) {
			key = '/';
		} else {
			key = this.breadcrumb[index].key;
		}
		for(var i=0 ; i<this.breadcrumb.length-index-1 ; i++) {
			this.d_breadcrumb.lastChild.remove();
		}
		this.breadcrumb.splice(index+1);
		this.d_input.value = '';
		if(this.on_goback) {
			this.on_goback(key);
		}
		this.refresh_breadcrumb();
	}

	refresh_breadcrumb() {
		if(!this.d_breadcrumb.firstElementChild) {
			var t = document.createElement('span');
			t.innerHTML = '&gt;&nbsp;';
			(function(parent) {
				t.addEventListener('click', function() {parent.back(-1);});
			})(this);
			this.d_breadcrumb.appendChild(t);
		}
		var d = this.d_breadcrumb.firstElementChild;
		for(var i=0 ; i<this.breadcrumb.length ; i++) {
			if(!d.nextElementSibling) {
				var t = document.createElement('span');
				t.innerHTML = this.breadcrumb[i].label+'&nbsp;&gt;&nbsp;';
				(function(parent, index) {
					t.addEventListener('click', function() {parent.back(index);});
				})(this, i);
				this.d_breadcrumb.appendChild(t);
			}
			d = d.nextElementSibling;
		}
	}

	refresh_dropdown() {
		var pattern = this.d_input.value;
		if(pattern !== '') {

			//For each element to sort
			for(var i=0 ; i<this.data.length ; i++) {
				var t = [this.data[i].label],
					sf = -11111111,
					indexes,
					sfg = '';
				if(typeof this.data[i].fuzzy != 'undefined') {
					for(var j=0 ; j<this.data[i].fuzzy.length ; j++) {
						t.push(this.data[i].fuzzy[j]);
					}
				}

				//Search for the best match available between strings
				for(var l=0 ; l<t.length ; l++) {
					var s=0, p=0,
						str = t[l].split(''),
						str_normalized = t[l].normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(''),
						str_normalized_lower = t[l].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(''),
						str_lower = t[l].toLowerCase().split(''),
						str_upper = t[l].toUpperCase().split(''),
						pat = pattern.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(''),
						typo1 = false,
						typo2 = false,
						cs = 0,
						indexes1 = [],
						indexes2 = [],
						found1 = false,
						found2 = false,
						ci = null,
						tmp;
					//First we get all approximate matches (letters all presents in the right order, with one order typo max)
					while(true) {
						if(p == pat.length) {
							//Found string
							found1 = true;
							break;
						} else if(s == str.length) {
							//Didn't found string, test next typo
							if(p < 2) {
								break;
							} else if(typo1 === false) {
								typo1 = p;
							} else if(typo1 > 2) {
								typo1--;
								tmp = pat[typo1];
								pat[typo1] = pat[typo1+1];
								pat[typo1+1] = tmp;
							} else {
								break;
							}
							s = typo1>1?indexes1[typo1-2]:0;
							indexes1.splice(typo1-1);
							p = typo1-1;
							tmp = pat[typo1];
							pat[typo1] = pat[p];
							pat[p] = tmp;
						} else {
							if(pat[p] == str_normalized_lower[s]) {
								indexes1.push(s)
								p++;
							}
							s++;
						}
					}

					if(!found1) {
						continue;
					}

					pat = pattern.split('');
					s=0; p=0;

					//Then we get all strict matches (only start of word or consecutive letters) (letters all presents in the right order, with one order typo max)
					while(true) {
						if(p == pat.length) {
							//Found string
							found2 = true;
							break;
						} else if(s == str.length) {
							//Didn't found string, test next typo
							if(p < 1) {
								break;
							} else if(typo2 === false) {
								typo2 = p;
							} else if(typo2 > 2) {
								typo2--;
								tmp = pat[typo2];
								pat[typo2] = pat[typo2+1];
								pat[typo2+1] = tmp;
							} else {
								break;
							}
							s = typo2>0?indexes2[typo2-1]:0;
							indexes2.splice(typo2-1);
							p = typo2-1;
							tmp = pat[typo2];
							pat[typo2] = pat[p];
							pat[p] = tmp;
						} else {
							if(pat[p] == str_normalized_lower[s] &&
								(
									s == 0 ||
									(str_lower[s-1] == str_upper[s-1]) ||
									(str[s] == str_upper[s] && str[s-1] == str_lower[s-1]) || 
									(indexes2[p-1] == s-1)
								)) {
								indexes2.push(s);
								p++;
							}
							s++;
						}
					}

					//Get the correct indexes
					if(found2) {
						ci = indexes2;
					} else {
						ci = indexes1;
					}

					//Score calculation
					var last = -1;
					for(var k=0 ; k<ci.length ; k++) {
						if(last !== ci[k]) {
							cs -= ci[k];
						}
						last = ci[k];
					}

					if(found2) {
						if(typo2) {
							cs -= 20;
						}
					} else {
						cs *= 1000;
						if(typo1) {
							cs -= 20;
						}
					}
					cs -= t[l].length - pattern.length;

					//Get the best results
					if(cs > sf) {
						sf = cs;
						indexes = ci;
						sfg = t[l];
					}
				}
				this.data[i].fuzzy_score = sf;
				if(sfg != this.data[i].label) {
					this.data[i].fuzzy_ghost = sfg;
				} else {
					this.data[i].fuzzy_ghost = '';
				}
			}
			this.data.sort(function(a, b) {return (b.fuzzy_score!=a.fuzzy_score?b.fuzzy_score-a.fuzzy_score:a.label.localeCompare(b.label, undefined, {numeric: true, sensitivity: 'base'}));});
		} else {
			for(var i=0 ; i<this.data.length ; i++) {
				this.data[i].fuzzy_score = 0;
				this.data[i].fuzzy_ghost = '';
			}
			this.data.sort(function(a, b) {return /*a.label < b.label;*//*if speed is not an issue : */a.label.localeCompare(b.label, undefined, {numeric: true, sensitivity: 'base'});});
		}
		while (this.d_dropdown.firstElementChild) {
			this.d_dropdown.removeChild(this.d_dropdown.firstElementChild);
		}
		for(var i=0 ; i<this.data.length ; i++) {
			if(this.data[i].fuzzy_score == -11111111) {
				break;
			}
			var d = document.createElement('div');
			d.innerHTML = this.data[i].label;
			if(this.data[i].fuzzy_ghost) {
				d.innerHTML += ' ['+this.data[i].fuzzy_ghost+']';
			}
			d.dataset.key = this.data[i].key;
			(function(parent, d) {d.addEventListener('mousedown', function() {parent.select_key(this);})})(this, d);
			(function(parent, d) {d.addEventListener('click', function() {parent.valid_key(this);})})(this, d);
			if(i == 0) {
				d.className = 'fuzzy_selected';
				this.d_selected = d;
			}
			this.d_dropdown.appendChild(d);
		}
	};

	get_focus() {
		this.d_input.focus();
	};

	/**
	 * Set a new array to use
	 * @param {array} _data An array list of the elements to search, they should have the same structure as the constructor
	 */
	set_data(_data) {
		this.data = _data;
		this.refresh_dropdown();
	}
}