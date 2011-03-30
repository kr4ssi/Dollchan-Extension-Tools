// ==UserScript==
// @name			Dollchan Extension Tools
// @version			2011-03-30
// @namespace		http://www.freedollchan.org/scripts
// @author			Sthephan Shinkufag @ FreeDollChan
// @copyright		(C)2084, Bender Bending Rodríguez
// @description		Doing some profit for imageboards
// @include			*
// ==/UserScript==

(function(scriptStorage) {
var defaultCfg = [
	'2011-03-30',	//script version
	1,		// 1	antiwipe detectors:
	1,		// 2		same lines
	1,		// 3		same words
	1,		// 4		spec.symbols
	1,		// 5		long columns
	1,		// 6		long words
	1,		// 7		numbers
	0,		// 8		cAsE/CAPS
	0,		// 9	hide posts with sage
	0,		// 10	hide posts with theme
	0,		// 11	hide posts without text
	0,		// 12	hide posts without img
	0,		// 13	hide posts by regexp
	0,		// 14	hide posts by text size:
	500,	// 15		size in symbols
	0,		// 16	delete hidden-posts (0=off, 1=merge, 2=full hide)
	1,		// 17	mouseover hidden-posts preview
	1,		// 18	additional hider menu
	1,		// 19	apply hiders to threads
	1,		// 20	upload new posts (0=off, 1=auto, 2=click+count, 3=click)
	2,		// 21		ajax upload interval
	1,		// 22	text format buttons(0=off, 1=graph, 2=text, 3=standart)
	0,		// 23		move format buttons down
	2,		// 24	>>links navigation (0=off, 1=no map, 2=+refmap)
	1,		// 25		navigation delay(0=off, 1=on)
	1,		// 26	expand images (0=off, 1=simple, 2=+preview)
	1,		// 27	reply without reload (verify on submit)
	1,		// 28	animated popups
	0,		// 29	show post buttons as text
	1,		// 30	YouTube player by links
	1,		// 31	mp3 player by links
	1,		// 32	add images by links
	0,		// 33	expand shorted posts (0=by click, 1=auto)
	1,		// 34	insert post number on click
	0,		// 35	hide post names
	1,		// 36	hide scrollers in posts
	0,		// 37	open spoilers
	1,		// 38	email field -> sage btn
	0,		// 39		reply with SAGE
	0,		// 40	move postform down
	1,		// 41	force captcha input(0=off, 1=en, 2=ru)
	1,		// 42	favicon blinking, if new posts detected
	0,		// 43	apply user name:
	'',		// 44		user name value
	0,		// 45	apply user password:
	'',		// 46		user password value
	1,		// 47	hide board rules
	1,		// 48	hide 'goto' field
	1,		// 49	hide password field
	530,	// 50	textarea width
	140,	// 51	textarea height
	0		// 52	>>links navigation place by: 0=mouse, 1=link
],

// Global vars
Cfg = [], Visib = [], Expires = [], Favor = [], Posts = [], oPosts = [], postByNum = [], refArr = [],
ajaxThrds = {}, ajaxPosts = [], ajaxDate, ajaxInterval, nav = sav = ch = pr = qr = {},
doc = document, dForm, isActiveTab = false, docTitle, favIcn, favIcnInterval, cPrev,
dm, ks, wk, brd, res, isMain, hasSage, xPost, xOPost, xPostRef, xPostMsg, pClass,
oldTime, timeLog = '', STORAGE_LIFE = 259200000; // 3 days

/*=============================================================================
									UTILS
=============================================================================*/

function $X(path, root) {
	return doc.evaluate(path, root || doc, null, 6, null);
}
function $x(path, root) {
	return doc.evaluate(path, root || doc, null, 8, null).singleNodeValue;
}
function $xb(path, root) {
	return doc.evaluate(path, root || doc, null, 3, null).booleanValue;
}
function $id(id) {
	return doc.getElementById(id);
}
function $next(el) {
	do el = el.nextSibling;
	while(el && el.nodeType != 1);
	return el;
}
function $prev(el) {
	do el = el.previousSibling;
	while(el && el.nodeType != 1);
	return el;
}
function $up(el, i) {
	i = i || 1;
	while(i--) el = el.parentNode;
	return el;
}
function $1(el) {
	return el.firstChild;
}
function $each(list, fn) {
	if(!list) return;
	var i = list.snapshotLength;
	while(i--) fn(list.snapshotItem(i), i);
}
function $html(el, html) {
	var cln = el.cloneNode(false);
	cln.innerHTML = html;
	el.parentNode.replaceChild(cln, el);
	return cln;
}
function $attr(el, attr) {
	for(var key in attr) {
		if(key == 'html') {el.innerHTML = attr[key]; continue}
		if(key == 'text') {el.textContent = attr[key]; continue}
		if(key == 'value') {el.value = attr[key]; continue}
		el.setAttribute(key, attr[key]);
	}
	return el;
}
function $event(el, events) {
	for(var key in events)
		el.addEventListener(key, events[key], false);
}
function $rattr(el, attr) {
	if(el.getAttribute(attr)) el.removeAttribute(attr);
	if(nav.Opera && el[attr]) el[attr] = '';
}
function $revent(el, events) {
	for(var key in events)
		el.removeEventListener(key, events[key], false);
}
function $append(el, nodes) {
	for(var i = 0, len = nodes.length; i < len; i++)
		if(nodes[i]) el.appendChild(nodes[i]);
}
function $before(el, nodes) {
	for(var i = 0, len = nodes.length; i < len; i++)
		if(nodes[i]) el.parentNode.insertBefore(nodes[i], el);
}
function $after(el, nodes) {
	var i = nodes.length;
	while(i--) if(nodes[i]) el.parentNode.insertBefore(nodes[i], el.nextSibling);
}
function $new(tag, attr, events) {
	var el = doc.createElement(tag);
	if(attr) $attr(el, attr);
	if(events) $event(el, events);
	return el;
}
function $New(tag, nodes, attr, events) {
	var el = $new(tag, attr, events);
	$append(el, nodes);
	return el;
}
function $txt(el) {
	return doc.createTextNode(el);
}
function $btn(val, fn) {
	return $new('input', {'type': 'button', 'value': val}, {'click': fn});
};
function $if(cond, el) {
	return cond ? el : null;
}
function $disp(el) {
	el.style.display = el.style.display == 'none' ? '' : 'none';
}
function $del(el) {
	if(el) el.parentNode.removeChild(el);
}
function $Del(path, root) {
	$each($X(path, root), function(el) {$del(el)});
}
function $delNx(el) {
	while(el.nextSibling) $del(el.nextSibling);
}
function $delCh(el) {
	while(el.hasChildNodes()) el.removeChild(el.firstChild);
}
function $case(arr, def) {
	for(var i = 0, len = arr.length/2; i < len; i++)
		if(arr[i*2]) return arr[i*2 + 1];
	return def;
}
function $offset(el, xy) {
	var c = 0;
	while(el) {c += el[xy]; el = el.offsetParent}
	return c;
}
function toggleChk(el) {
	el.checked = !el.checked;
}
function rand10() {
	return Math.floor(Math.random()*1e10).toString(10);
}
function insertInto(el, text) {
	var scrtop = el.scrollTop;
	var start = el.selectionStart;
	var end = el.selectionEnd;
	el.value = el.value.substr(0, start) + text + el.value.substr(end);
	el.setSelectionRange(start + text.length, start + text.length);
	el.focus();
	el.scrollTop = scrtop;
}
String.prototype.trim = function() {
    var str = (this || '').replace(/^\s\s*/, ''), s = /\s/, i = str.length;
    while(s.test(str.charAt(--i)));
    return str.slice(0, i + 1);
};
function txtSelection() {
	return nav.Opera ? doc.getSelection() : window.getSelection().toString();
}
function $close(el) {
	if(!el) return;
	if(Cfg[28] == 0) {$del(el); return}
	var h = el.clientHeight - 18;
	el.style.height = h + 'px';
	var i = 8;
	var closing = setInterval(function() {
		if(!el || i-- < 0) {clearInterval(closing); $del(el); return}
		var s = el.style;
		s.opacity = i/10;
		s.paddingTop = parseInt(s.paddingTop) - 1 + 'px';
		s.paddingBottom = parseInt(s.paddingBottom) - 1 + 'px';
		var hh = parseInt(s.height) - h/10;
		s.height = (hh < 0 ? 0 : hh) + 'px';
	}, 35);
}
function $show(el) {
	var i = 0;
	if(Cfg[28] == 0) {el.style.opacity = 1; el.style.padding = '10px'; return}
	var showing = setInterval(function() {
		if(!el || i++ > 8) {clearInterval(showing); return}
		var s = el.style;
		s.opacity = i/10;
		s.paddingTop = parseInt(s.paddingTop) + 1 + 'px';
		s.paddingBottom = parseInt(s.paddingBottom) + 1 + 'px';
	}, 35);
}
function Log(txt) {
	var newTime = (new Date()).getTime();
	timeLog += '\n' + txt + ': ' + (newTime - oldTime).toString() + 'мс';
	oldTime = newTime;
}

/*=============================================================================
								STORAGE / CONFIG
=============================================================================*/

function setCookie(name, value, life) {
	if(name) doc.cookie = escape(name) + '=' + escape(value) + ';expires=' 
		+ (new Date((new Date()).getTime()
		+ (life == 'delete' ? -10 : STORAGE_LIFE))).toGMTString() + ';path=/';
}

function getCookie(name) {
	var arr = doc.cookie.split('; ');
	var i = arr.length;
	while(i--) {
		var one = arr[i].split('=');
		if(one[0] == escape(name)) return unescape(one[1]);
	}
}

function turnCookies(name) {
	var data = getCookie('DESU_Cookies');
	var arr = data ? data.split('|') : [];
	arr[arr.length] = name;
	if(arr.length > 13) {
		setCookie(arr[0], '', 'delete');
		arr.splice(0, 1);
	}
	setCookie('DESU_Cookies', arr.join('|'));
}

function getStored(name) {
	if(sav.GM) return GM_getValue(name);
	if(sav.script) return scriptStorage.getItem(name);
	if(sav.local) return localStorage.getItem(name);
	return getCookie(name);
}

function setStored(name, value) {
	if(sav.GM) {GM_setValue(name, value); return}
	if(sav.script) {scriptStorage.setItem(name, value); return}
	if(sav.local) {localStorage.setItem(name, value); return}
	setCookie(name, value);
}

function setDefaultCfg() {
	Cfg = defaultCfg;
	if(ch.dc || ch._0ch || dm == 'ne2.ch') Cfg[41] = 2;
	if(ch.dc) Cfg[20] = Cfg[27] = Cfg[42] = 0;
	setStored('DESU_Config_' + dm, defaultCfg.join('|'));
}

function saveCfg(num, val) {
	Cfg[num] = val;
	setStored('DESU_Config_' + dm, Cfg.join('|'));
}

function toggleCfg(num) {
	saveCfg(num, Cfg[num] == 0 ? 1 : 0);
}

function readCfg() {
	var data = getStored('DESU_Config_' + dm);
	if(!data) setDefaultCfg();
	else Cfg = data.split('|');
	if(Cfg[0] != defaultCfg[0]) setDefaultCfg();
	if(!getStored('DESU_RegExpr')) setStored('DESU_RegExpr', '');
}

function getVisib(pNum) {
	var key = !sav.cookie ? brd + pNum : postByNum[pNum].Count;
	if(key in Visib) return Visib[key];
}

function readPostsVisib() {
	var data;
	var id = 'DESU_Posts_' + dm + '_' + brd;
	if(!sav.cookie) {
		data = getStored(id);
		if(!data) return;
		var arr = data.split('-');
		var i = arr.length/3;
		while(i--) {
			if((new Date()).getTime() < arr[i*3 + 2]) {
				Visib[arr[i*3]] = arr[i*3 + 1];
				Expires[arr[i*3]] = arr[i*3 + 2];
			} else setStored(id, arr.splice(i*3, 3).join('-'));
		}
	} else if(!isMain) {
		data = getStored(id + '_' + oPosts[0].Num);
		if(!data) return;
		for(var i = 0, len = data.length; i < len; i++)
			Visib[i + 2] = data[i];
	}
	forAll(function(post) {post.Vis = getVisib(post.Num)});
}

function storePostsVisib() {
	var id = 'DESU_Posts_' + dm + '_' + brd;
	if(!sav.cookie) {
		var arr = [];
		for(var key in Visib) {
			if(!/^\d$/.test(Visib[key])) break;
			arr[arr.length] = key + '-' + Visib[key] + '-' + Expires[key];
		}
		setStored(id, arr.join('-'));
	} else {
		if(!isMain) {
			id += '_' + oPosts[0].Num;
			if(!getStored(id)) turnCookies(id);
			setStored(id, Visib.join(''));
		}
	}
}

function readThreadsVisib() {
	var data = getStored('DESU_Threads_' + dm + '_' + brd);
	if(!data) return;
	var arr = data.split('-');
	var i = arr.length;
	while(i--) {
		var key = arr[i];
		var pNum = parseInt(key.substring(0, key.length - 1));
		if(typeof postByNum[pNum] === 'object') {
			var vis = key[key.length - 1];
			var post = postByNum[pNum];
			if(vis == 0) hideThread(post);
			post.Vis = vis;
		}
	}
}

function storeThreadVisib(post, vis) {
	if(post.Vis == vis) return;
	post.Vis = vis;
	var id = 'DESU_Threads_' + dm + '_' + brd;
	var data = getStored(id);
	var arr = data ? data.split('-') : [];
	var i = arr.length;
	while(i--)
		if(arr[i].substring(0, arr[i].length - 1) == post.Num) arr.splice(i, 1);
	if(arr.length > 300) arr.shift();
	arr.push(post.Num + vis);
	setStored(id, arr.join('-'));
}

function readFavorities() {
	var data = getStored('DESU_Favorities');
	var arr = data ? data.split('|') : [];
	for(var i = 0; i < arr.length/4; i++)
		Favor[i] = [arr[i*4], arr[i*4 + 1], arr[i*4 + 2], arr[i*4 + 3]].join('|');
}

function removeFavorities(key) {
	for(var i = 0; i < Favor.length; i++)
		if(Favor[i].indexOf(key) > -1) {
			var post = postByNum[Favor[i].split('|')[2]];
			if(post) $x('.//a[@class="favset_icn" or @class="fav_icn"]', post.Btns).className = 'fav_icn';
			Favor.splice(i, 1);
		}
}

function getFavorKey(post) {
	return window.location.hostname + '|' + brd
		+ (/\/arch/.test(window.location.pathname) ? '/arch' : '') + '|' + post.Num;
}

function storeFavorities(post, btn) {
	readFavorities();
	var key = getFavorKey(post);
	if(Favor.join('|').indexOf(key) > -1) {
		removeFavorities(key);
		btn.className = 'fav_icn';
	} else {
		Favor[Favor.length] = key + '|' + getTitle(post).replace(/\|/g, '').substring(0, !sav.cookie ? 70 : 25);
		Favor.sort();
		if(sav.cookie && encodeURIComponent(Favor.join('%7C')).length > 4095)
			{$alert('Превышен лимит cookies (4kb)'); Favor.pop(); return}
		btn.className = 'favset_icn';
	}
	setStored('DESU_Favorities', Favor.join('|'));
	var div = $id('DESU_favor');
	if(div.hasChildNodes()) {$delCh(div); favorThrdsPreview()}
}

/*=============================================================================
							CONTROLS / COMMON CHANGES
=============================================================================*/

function addControls() {
	var chBox = function(num, txt, fn, id) {
		var el = $new('input', {
			'type': 'checkbox'}, {
			'click': function() {fn ? fn() : toggleCfg(num)}
		});
		el.checked = Cfg[num] == 1;
		if(id) el.id = id;
		return $New('span', [el, $txt(' ' + txt)]);
	};
	var divBox = function(num, txt, fn, id) {
		return $New('div', [chBox(num, txt, fn, id)]);
	};
	var optSel = function(id, arr, num, fn) {
		for(var i = 0; i < arr.length; i++)
			arr[i] = '<option value="' + i + '">' + arr[i] + '</option>';
		var el = $new('select', {'id': id, 'html': arr.join('')}, {
			'change': (fn ? fn : function() {saveCfg(num, this.selectedIndex)})
		});
		el.selectedIndex = Cfg[num];
		return el;
	};
	var node = pr.area || dForm;
	while(true) {
		var el = node.previousSibling;
		if(el.nodeType == 1 && (el.className == 'logo' || el.tagName == 'HR' || el == dForm)) break;
		$del(el);
	}
	$before(node, [
		$New('div', [
			$btn('Настройки', function() {
				$delCh($id('DESU_hidden'));
				$delCh($id('DESU_favor'));
				$disp($id('DESU_controls'));
			}),
			$btn('Скрытое', hiddenPostsPreview),
			$btn('Избранное', favorThrdsPreview),
			$new('input', {
				'type': 'button',
				'id': 'DESU_refresh',
				'value': 'Обновить'}, {
				'click': function(e) {
					window.location.reload();
					e.stopPropagation();
					e.preventDefault()
				},
				'mouseover': function() {if(isMain) selectAjaxPages()},
				'mouseout': function(e) {if(isMain) removeSelMenu(e.relatedTarget)}
			}),
			$if(isMain && pr.on, $btn('Создать тред', function() {$disp(pr.area)})),
			$if(!isMain, $new('span', {
				'html': '[<a href="http://' + window.location.hostname + '/' + brd + '/">Назад</a>]',
				'style': 'float:right'
			}))
			], {
			'id': 'DESU_panel',
			'style': 'width:100%; text-align:left'
		}),
		$New('div', [
			$new('div', {
				'class': pClass,
				'id': 'DESU_controls',
				'style': 'display:none; float:left; overflow:hidden; width:auto; min-width:0; ' +
					'padding:7px; margin:5px 20px; border:1px solid grey; font:13px sans-serif'
			}),
			$new('div', {'id': 'DESU_hidden'}),
			$new('div', {'id': 'DESU_favor'}),
			$new('div', {
				'id': 'DESU_alertbox',
				'style': 'position:fixed; top:0; right:0; z-index:9999; cursor:default; font:14px sans-serif'
			})
			], {
			'id': 'DESU_content',
			'style': 'width:100%; text-align:left'
		}),
		$new('hr', {'style': 'clear:both'})
	]);
	$append($id('DESU_controls'), [
		$new('div', {
			'text': 'Dollchan Extension Tools',
			'style': 'text-align:center; font-weight:bold; font-size:14px; margin-bottom:3px'
		}),
		$New('div', [
			chBox(1, 'Анти-вайп детекторы '),
			$new('span', {
				'html': '[<a>&gt;</a>]',
				'style': 'cursor:pointer'}, {
				'click': function() {$disp($id('DESU_wipebox'))}
			})
		]),
		$New('div', [
			divBox(2, 'Повтор строк'),
			divBox(3, 'Повтор слов'),
			divBox(4, 'Спецсимволы'),
			divBox(5, 'Длинные колонки'),
			divBox(6, 'Длинные слова'),
			divBox(7, 'Числа'),
			divBox(8, 'КАПС/реГисТР')
			], {
			'id': 'DESU_wipebox',
			'style': 'display:none; padding-left:15px'
		}),
		chBox(14, 'Скрывать с текстом более ', toggleMaxtext, 'DESU_maxtext_ch'),
		$new('input', {'type': 'text', 'id': 'DESU_maxtext', 'value': Cfg[15], 'size': 4}),
		$txt(' символов'),
		$new('br'),
		$if(hasSage, chBox(9, 'С сажей ', toggleSage, 'DESU_sage_ch')),
		$if(pr.subj, chBox(10, 'С темой ', toggleTitle)),
		chBox(11, 'Без текста ', toggleNotext, 'DESU_notext_ch'),
		chBox(12, 'Без картинок ', toggleNoimage, 'DESU_noimage_ch'),
		$new('br'),
		chBox(13, 'Выражения: ', toggleRegexp, 'DESU_regexp_ch'),
		$new('span', {
			'html': '[<a>?</a>]',
			'style': 'cursor:pointer'}, {
			'click': function() {$alert('В тексте/теме поста:\nололо\nОП хуй\n...\n\nРегулярные выражения: $exp выраж.\n$exp /[bб].[tт]+[hх].[rр][tт]/ig\n$exp /кукл[оа]([её]б|бляд|быдл)/ig\n\nКартинки: $img [<,>,=][вес][@ширxвыс]\n$img <35@640x480\n$img >@640x480\n$img =35\n\nИмя/трипкод: $name [имя][!трипкод][!!трипкод]\n$name Sthephan!ihLBsDA91M\n$name !!PCb++jGu\nЛюбой трипкод: $alltrip\n\nАвтозамена (после перезагр.): $rep искомое заменяемое\n$rep /\:cf:/ig <img src="http://1chan.ru/img/coolface.gif" />\n$rep /(ху[йияеё])/ig <font color="red">beep</font>')}
		}),
		$attr($btn('Применить', function() {applyRegExp()}), {'style': 'float:right'}),
		$new('br', {'clear': 'both'}),
		$new('textarea', {
			'id': 'DESU_regexp',
			'value': getStored('DESU_RegExpr'),
			'rows': 7,
			'cols': 52,
			'style': 'display:block; font:12px courier new'
		}),
		optSel('prochidden_sel', ['Не изменять', 'Объединять', 'Удалять'], 16, function() {
			processHidden(this.selectedIndex, Cfg[16]);
		}),
		$txt(' скрытые посты'),
		divBox(19, 'Применять фильтры к тредам'),
		divBox(18, 'Дополнительное меню по кнопке скрытия'),
		divBox(17, 'Просмотр скрытого по наведению на номер'),
		$new('hr'),
		$if(!ch.dc, $New('div', [
			optSel('upload_sel', ['Откл.', 'Авто', 'Счет+клик', 'По клику'], 20),
			$txt(' подгрузка постов в треде*, T='),
			optSel('upload_int', [0.5, 1, 1.5, 2, 5, 15, 30], 21),
			$txt('мин*')
		])),
		optSel('refprv_sel', ['Откл.', 'Без карты', 'С картой'], 24),
		$txt(' навигация >>ссылок*, '),
		chBox(52, 'фиксир'),
		chBox(25, 'задержка'),
		$New('div', [
			optSel('imgexp_sel', ['Не', 'Обычно', 'С превью'], 26),
			$txt(' раскрывать изображения')
		]),
		$New('div', [
			$txt('К ссылкам:'),
			chBox(30, 'Плейер YouTube*'),
			chBox(31, 'Плейер mp3*'),
			chBox(32, 'Картинки*')
		]),
		$if(!ch.dc, divBox(27, 'Постить без перезагрузки (проверять ответ)*')),
		$if(!ch.dc && nav.Firefox, divBox(42, 'Мигание favicon\'а при новых постах*')),
		divBox(28, 'Анимировать уведомления'),
		divBox(29, 'Кнопки постов в виде текста*'),
		$if(!ch.dc, divBox(33, 'Автоматически раскрывать длинные посты*')),
		divBox(34, 'Вставлять ссылку по клику на №поста*'),
		divBox(35, 'Скрывать имена в постах', function() {toggleCfg(35); scriptStyles()}),
		$if(ch._2ch, divBox(36, 'Без скролла в постах', function() {toggleCfg(36); scriptStyles()})),
		divBox(37, 'Раскрывать спойлеры', function() {toggleCfg(37); scriptStyles()}),
		$if(hasSage, divBox(38, 'Sage вместо поля E-mail*')),
		$if(pr.on, divBox(40, 'Переносить форму ответа вниз (в треде)*')),
		optSel('caplang_sel', ['Откл.', 'Eng', 'Rus'], 41),
		$txt(' быстрый ввод капчи'),
		$if(pr.on, $New('div', [
			optSel('txtbtn_sel', ['Откл.', 'Графич.', 'Упрощ.', 'Стандарт.'], 22, function() {
				saveCfg(22, this.selectedIndex);
				$Del('.//div[@id="DESU_textpanel"]');
				if(Cfg[22] != 0) {textFormatPanel(pr); textFormatPanel(qr)}
			}), 
			$txt(' кнопки форматирования '),
			chBox(23, 'внизу ', function() {
				toggleCfg(23);
				if(Cfg[22] != 0) {textFormatPanel(pr); textFormatPanel(qr)}
			})
		])),
		$if(pr.name, $New('div', [
			$new('input', {'type': 'text', 'id': 'DESU_username', 'value': Cfg[44], 'size': 20}),
			chBox(43, ' Постоянное имя', function() {
				toggleCfg(43);
				saveCfg(44, $id('DESU_username').value.replace(/\|/g, ''));
				var val = ($id('DESU_username_ch').checked) ? Cfg[44] : '';
				pr.name.value = val;
				if(qr.on) qr.name.value = val;
			}, 'DESU_username_ch')
		])),
		$if(pr.passw, $New('div', [
			$new('input', {'type': 'text', 'id': 'DESU_userpass', 'value': Cfg[46], 'size': 20}),
			chBox(45, ' Постоянный пароль', function () {
				toggleCfg(45);
				saveCfg(46, $id('DESU_userpass').value.replace(/\|/g, ''));
				var val = $id('DESU_userpass_ch').checked ? Cfg[46] : rand10().substring(0, 8);
				pr.passw.value = val;
				del_passw.value = val;
				if(qr.on) qr.passw.value = val;
			}, 'DESU_userpass_ch')
		])),
		$if(pr.on, $txt('Не отображать: ')),
		$if(pr.rules, chBox(47, 'правила ',
			function() {toggleCfg(47); $disp(pr.rules); if(qr.on) $disp(qr.rules)})),
		$if(pr.gothr, chBox(48, 'поле goto ',
			function() {toggleCfg(48); $disp(pr.gothr); if(qr.on) $disp(qr.gothr)})),
		$if(pr.passw, chBox(49, 'пароль ',
			function() {toggleCfg(49); $disp($up(pr.passw, 2)); if(qr.on) $disp($up(qr.passw, 2))})),
		$new('hr'),
		$attr($btn('Сброс', function() {
			setDefaultCfg();
			setStored('DESU_Favorities', '');
			setStored('DESU_RegExpr', '');
			window.location.reload();
		}), {'style': 'float:right'}),
		$new('b', {
			'id': 'DESU_process',
			'style': 'cursor:pointer'}, {
			'click': function() {
				$alert('<b>Версия: ' + Cfg[0] + '</b>\nХранение: ' + $case([
					sav.GM, 'Mozilla config',
					sav.local, 'LocalStorage',
					sav.script, 'Opera ScriptStorage'
				], 'Cookies') + '\n' + timeLog, null, true);
			}
		}),
		$new('br'),
		$new('a', {
			'href': 'http://www.freedollchan.org/scripts"',
			'text': 'http://www.freedollchan.org/scripts',
			'target': '_blank',
			'style': 'font-size:85%; color:inherit; text-decoration:none'
		})
	]);
}

function hiddenPostsPreview() {
	$delCh($id('DESU_favor'));
	$id('DESU_controls').style.display = 'none';
	var div = $id('DESU_hidden');
	if(div.hasChildNodes()) {$delCh(div); return}
	div.innerHTML = '<table style="margin:5px 20px"><tbody align="left"></tbody></table>';
	var table = $x('.//tbody', div);
	var clones = [], tcnt = 0, pcnt = 0;
	forAll(function(post) {if(post.Vis == 0) {
		var pp = !post.isOp;
		var cln = $attr(($id('DESU_hiddenthr_' + post.Num) || post).cloneNode(true), {'id': ''});
		clones.push(cln);
		cln.style.display = '';
		cln.pst = post;
		cln.vis = 0;
		$event($x(pp ? './/a[@class="unhide_icn"]' : './/a', cln), {
			'click': function(el) {return function() {
				el.vis = (el.vis == 0) ? 1 : 0;
				if(pp) togglePost(el, el.vis);
				else if(el.vis == 0) $disp($next(el));
			}}(cln)
		});
		$event($x(xPostRef, cln) || $x('.//a', cln), {
			'mouseover': function(el) {return function() {
				if(el.vis == 0) {
					if(pp) togglePost(el, 1);
					else $next(el).style.display = 'block';
				}
			}}(cln),
			'mouseout': function(el) {return function() {
				if(el.vis == 0) {
					if(pp) togglePost(el, 0);
					else $next(el).style.display = 'none';
				}
			}}(cln)
		});
		$append(table, [
			$if(((!pp && tcnt++ == 0) || (pp && pcnt++ == 0)), $new('tr', {
				'html': '<th><b>Скрытые ' + (pp ? 'посты' : 'треды') + ':</b></th>'
			})),
			$New('tr', [
				cln,
				$if(!pp, $attr(post.cloneNode(true), {
					'style': 'display:none; padding-left:15px; overflow:hidden; border:1px solid grey'
				}))
			])
		]);
		if(!pp) togglePost($next(cln), 1);
		doRefPreview(cln);
	}});
	if(!table.hasChildNodes()) {
		table.innerHTML = '<tr><th>Скрытое отсутствует...</th></tr>';
		return;
	}
	$append(table.insertRow(-1), [
		$new('hr'),
		$btn('Раскрыть все', function() {
			if(/все/.test(this.value)) {
				this.value = 'Вернуть назад';
				for(var cln, i = 0; cln = clones[i++];)
					setPostVisib(cln.pst, 1);
			} else {
				this.value = 'Раскрыть все';
				for(var cln, i = 0; cln = clones[i++];)
					setPostVisib(cln.pst, cln.vis);
			}
		}),
		$btn('Сохранить', function() {
			for(var cln, i = 0; cln = clones[i++];)
				if(cln.vis != 0) setPostVisib(cln.pst, 1);
			storePostsVisib();
			$delCh(div);
		})
	]);
}

function favorThrdsPreview() {
	$delCh($id('DESU_hidden'));
	$id('DESU_controls').style.display = 'none';
	var div = $id('DESU_favor');
	if(div.hasChildNodes()) {$delCh(div); return}
	div.innerHTML = '<table style="margin:5px 20px"><tbody align="left"></tbody></table>';
	var table = $x('.//tbody', div);
	var data = getStored('DESU_Favorities');
	if(!data) table.innerHTML = '<tr><th>Избранные треды отсутствуют...</th></tr>';
	else {
		var arr = data.split('|');
		var host, b, tNum, url, title, oldh, oldb;
		for(var i = 0; i < arr.length/4; i++) {
			host = arr[i*4];
			b = arr[i*4 + 1];
			tNum = arr[i*4 + 2];
			title = arr[i*4 + 3];
			url = 'http://' + host + '/' + (b == '' ? '' : b + '/')
				+ (/krautchan\.net/.test(host) ? 'thread-' : 'res/') + tNum
				+ (/dobrochan\.ru/.test(host) ? '.xhtml' : '.html');
			if(host != oldh || b != oldb)
				table.appendChild($New('tr', [$new('b', {'text': host + '/' + b})]));
			oldh = host;
			oldb = b;
			if(title.length >= (sav.cookie ? 25 : 70)) title += '..';
			$append(table, [$New('tr', [
				$New('div', [
					$new('input', {'type': 'checkbox'}),
					$if(host == window.location.hostname || sav.GM, $new('span', {
						'class': 'expthr_icn',
						'title': 'Просмотреть',
						'html': (Cfg[29] == 1 ? ' <a>e<a> ' : '')}, {
						'click': loadFavorThread
					})),
					$new('a', {
						'href': url,
						'text': '№' + tNum,
						'style': 'text-decoration:none'
					}),
					$txt(' - ' + title + ' '),
					$new('span', {'class': 'DESU_favpcount'})
					], {
					'class': pClass,
				}),
				$new('div', {
					'class': 'thread',
					'id': tNum,
					'style': 'display:none; padding-left:15px; border:1px solid grey'
				})
				], {
				'class': 'DESU_favornote',
				'id': host + '|' + b + '|' + tNum,
			})]);
		}
	}
	$append(table, [
		$New('tr', [
			$new('hr'),
			$btn('Удалить', function() {
				$each($X('.//tr[@class="DESU_favornote"]', table), function(el) {
					if($x('.//input', el).checked) removeFavorities(el.id);
				});
				setStored('DESU_Favorities', Favor.join('|'));
				$delCh($id('DESU_favor'));
				favorThrdsPreview();
			}),
			$btn('Правка', function() {
				var el = $id('DESU_favoredit');
				el.value = getStored('DESU_Favorities');
				$disp($up(el));
			}),
			$btn('Инфо', function() {
				$each($X('.//tr[@class="DESU_favornote"]', table), function(el) {
					var arr = el.id.split('|');
					if(window.location.hostname != arr[0]) return;
					var tNum = arr[2];
					var c = $x('.//span[@class="DESU_favpcount"]', el);
					c.innerHTML = '&nbsp;[<span class="wait_icn">&nbsp;</span>]';
					AJAX(null, arr[1], tNum, function(err) {
						$html(c, '&nbsp;[' + (err ? err : ajaxThrds[tNum].keys.length) + ']');
					});
				});
			}),
		]),
		$New('tr', [
			$new('textarea', {
				'id': 'DESU_favoredit',
				'value': getStored('DESU_Favorities') || '',
				'rows': 9,
				'cols': 70,
				'style': 'display:block; font:12px courier new'
			}),
			$btn('Сохранить', function() {
				setStored('DESU_Favorities', $id('DESU_favoredit').value.trim());
				$delCh($id('DESU_favor'));
				favorThrdsPreview();
			})
		], {'style': 'display:none'})
	]);
}

function $alert(txt, id, htm) {
	var el;
	var nid = 'DESU_alert' + (id ? '_' + id : '');
	if(id) el = $id(nid);
	if(!el) {
		el = $New('div', [
			$if(id != 'wait', $new('a', {
				'style': 'display:inline-block; cursor:pointer; vertical-align:top; font-size:150%',
				'text': '× '}, {
				'click': function() {$close($up(this))}})),
			$if(id == 'wait', $new('span', {'class': 'wait_icn', 'html': '&nbsp;'})),
			$new('div', {'style': 'display:inline-block; margin-top:4px'})
			], {
			'class': pClass,
			'id': nid,
			'style': 'float:right; clear:both; opacity:0; width:auto; min-width:0; padding:0 10px 0 10px; '
				+ 'margin:1px; overflow:hidden; white-space:pre-wrap; outline:0; border:1px solid grey'
		});
		$id('DESU_alertbox').appendChild(el);
		$show(el);
	}
	if(htm) $html($next($1(el)), txt.trim());
	else $next($1(el)).textContent = txt.trim();
}

/*-----------------------------Dropdown select menus-------------------------*/

function removeSelMenu(x) {
	if(!$xb('ancestor-or-self::div[@id="DESU_select"]', x)) $del($id('DESU_select'));
}

function addSelMenu(el, arr) {
	$before(dForm, [$new('div', {
		'class': pClass,
		'id': 'DESU_select',
		'style': 'position:absolute; left:' + ($offset(el, 'offsetLeft')).toString() + 'px; top:' 
			+ ($offset(el, 'offsetTop') + el.offsetHeight - 1).toString() + 'px; z-index:250; '
			+ 'cursor:pointer; width:auto; min-width:0; border:1px solid grey; padding:0 5px 0 5px',
		'html': '<a>' + arr.join('</a><br><a>') + '</a>'}, {
		'mouseout': function(e) {removeSelMenu(e.relatedTarget)}
	})]);
	return $X('.//a', $id('DESU_select'));
}

function selectPostHider(post) {
	if(Cfg[18] == 0 || (Cfg[19] == 0 && post.isOp)) return;
	var a = addSelMenu($x('.//a[contains(@class,"hide_icn")]', post),
		['Скрывать выделенное', 'Скрывать изображение', 'Скрыть схожий текст']);
	$event(a.snapshotItem(0), {
		'mouseover': function() {quotetxt = txtSelection().trim()},
		'click': function() {applyRegExp(quotetxt)}
	});
	$event(a.snapshotItem(1), {'click': function() {regExpImage(post)}});
	$event(a.snapshotItem(2), {'click': function() {hideBySameText(post)}});
}

function selectExpandThread(post) {
	var p = ' постов';
	$each(addSelMenu($x('.//a[@class="expthr_icn"]', post),
		[5 + p, 15 + p, 30 + p, 50 + p, 100 + p]),
		function(a) {$event(a, {'click': function() {loadThread(post, parseInt(this.textContent))}})}
	);
}

function selectAjaxPages() {
	var p = ' страниц';
	$each(addSelMenu($id('DESU_refresh'),
		[1 + p + 'а', 2 + p + 'ы', 3 + p + 'ы', 4 + p + 'ы', 5 + p]),
		function(a, i) {$event(a, {'click': function() {loadPages(i + 1)}})}
	);
}

/*------------------------------Onsubmit reply check-------------------------*/

function iframeLoad(e) {
	var err, xp;
	try {
		var frm = e.target.contentDocument;
		if(!frm || !frm.body || frm.location == 'about:blank' || !frm.body.innerHTML) return;
	} catch(er) {$alert('Iframe error'); $close($id('DESU_alert_wait')); return}
	if(ch._4ch && /sys/.test(frm.location.hostname) && frm.title != 'Post successful!')
		xp = './/table//font/b';
	if(ch.dc && /error/.test(frm.location.pathname))
		xp = './/td[@class="post-error"]';
	if(ch.krau && frm.location.pathname == '/post')
		xp = './/td[starts-with(@class,"message_text")]';
	if((wk || ks) && !ch._4ch && !frm.getElementById('delform')) { 
		if(ch._2ch) xp = './/font[@size="5"]';
		else if(ks) xp = './/h1|.//h2|.//div[contains(@style, "1.25em")]';
		else err = frm.getElementsByTagName('h2')[0] || frm.getElementsByTagName('h1')[0];
	}
	if(xp) err = frm.evaluate(xp, frm, null, 6, null);
	if(err) {
		var txt = '';
		if(!wk || ch._2ch || ch._4ch) $each(err, function(el) {txt += el.innerHTML + '\n'});
		else txt = err.innerHTML.replace(/<br.*/ig, '');
		$close($id('DESU_alert_wait'));
		$alert(txt || 'Ошибка:\n' + (frm.body || frm).innerHTML, null, true);
	} else {
		if(pr.on) pr.txta.value = '';
		if(pr.file) pr.file = $x('.//input[@type="file"]', $html($up(pr.file), $up(pr.file).innerHTML));
		if(qr.on || !isMain) {
			if(isMain) loadThread(postByNum[getThread(qr.form).id.match(/\d+/)], 5);
			else {$del(qr.form); loadNewPosts(true)}
			qr = {};
			if(pr.cap) {
				pr.cap.value = '';
				refreshCapImg(pr, oPosts[0].Num);
			}
		} else window.location =
			!ch._4ch ? frm.location : frm.getElementsByTagName('meta')[0].content.match(/http:\/\/[^"]+/)[0];
	}
	frm.location.replace('about:blank');
}

/*-------------------------------Changes in postform-------------------------*/

function refreshCapSrc(src, tNum) {
	if(ks) src = src.replace(/\?[^?]+$|$/, (!ch._410 ? '?' : '?board=' + brd + '&') + Math.random());
	else {
		if(tNum > 0) src = src.replace(/mainpage|res\d+/ig, 'res' + tNum);
		src = src.replace(/dummy=\d*/, 'dummy=' + rand10());
	}
	return src;
}

function refreshCapImg(obj, tNum) {
	var img = !obj.recap
		? $x('.//img', $x(obj.tr, obj.cap))
		: $x('.//div[@id="recaptcha_image"]', obj.form) || obj.cap;
	if(!ch.dc && !obj.recap) {
		var src = img.src;
		img.src = '';
		img.src = refreshCapSrc(src, tNum);
	} else {
		var e = doc.createEvent('MouseEvents');
		e.initEvent('click', true, true);
		img.dispatchEvent(e);
	}
}

function makeCapImg(tNum) {
	var src;
	if(ks) src = !ch._410 ? '/captcha.php?' + Math.random() : '/faptcha.php?board=' + brd;
	else src = $x(pr.tr + '//img', pr.cap).src;
	return $new('img', {
		'alt': 'загрузка...',
		'title': 'Обновить капчу',
		'style': 'display:block; cursor:pointer; border:none',
		'src': refreshCapSrc(src, tNum)}, {
		'click': function() {refreshCapImg(pr, tNum)}
	});
}

function forceCap(e) {
	if(Cfg[41] == 0 || e.which == 0) return;
	var code = e.charCode || e.keyCode;
	var ru = 'йцукенгшщзхъфывапролджэячсмитьбюё';
	var en = 'qwertyuiop[]asdfghjkl;\'zxcvbnm,.`';
	var chr = String.fromCharCode(code).toLowerCase();
	var i = en.length;
	if(Cfg[41] == 1) {
		if(code < 0x0410 || code > 0x04FF) return;
		while(i--) if(chr == ru[i]) chr = en[i];
	} else {
		if(code < 0x0021 || code > 0x007A) return;
		while(i--) if(chr == en[i]) chr = ru[i];
	}
	e.preventDefault();
	insertInto(e.target, chr);
}

function sageBtnFunc(obj) {
	var c = Cfg[39] == 1;
	$attr($x('.//span[@id="DESU_sagebtn"]', obj.form), {'html': c
		? '&nbsp;<span class="sage_icn" style="font-size:13px"></span><b style="color:red">SAGE</b>'
		: '<i> (no&nbsp;sage)</i>'});
	if(obj.mail.type == 'text') obj.mail.value = c ? 'sage' : (ch._4ch ? 'noko' : '');
	else obj.mail.checked = c;
}

function sageBtnEvent(obj) {
	var el = $x('.//span[@id="DESU_sagebtn"]', obj.form);
	if(el) $event(el, {'click': function(e) {
		toggleCfg(39);
		sageBtnFunc(pr);
		if(qr.on) sageBtnFunc(qr);
		e.preventDefault();
		e.stopPropagation();
	}});
}

function formSubmit(obj) {
	$event($attr(obj.subm, {'value': 'Отправить'}), {'click': function(e) {
		if(Cfg[27] == 1) $alert('Проверка...', 'wait');
		if(ch._0ch) $attr(obj.txta, {'id': 'message', 'name': 'message'});
		if(obj == qr) pr.txta.value = qr.txta.value;
	}});
}

function textareaResizer(obj) {
	var el = obj.txta;
	if(!el) return;
	el.style.cssText = 'width:' + Cfg[50] + 'px; height:' + Cfg[51] + 'px';
	$del($x('.//div[@id="DESU_txtresizer"]', obj.form));
	$event(el, {'keypress': function(e) {
		var code = e.charCode || e.keyCode;
		if((code == 33 || code == 34) && e.which == 0) {e.target.blur(); window.focus()}
	}});
	var resmove = function(e) {
		el.style.width = e.pageX - $offset(el, 'offsetLeft') + 'px';
		el.style.height = e.pageY - $offset(el, 'offsetTop') + 'px';
	}, resstop = function() {
		$revent(doc.body, {'mousemove': resmove, 'mouseup': resstop});
		saveCfg(50, parseInt(el.style.width));
		saveCfg(51, parseInt(el.style.height));
	};
	$after(el, [$new('div', {
		'id': 'DESU_txtresizer',
		'style': 'display:inline-block !important; padding:5px; cursor:se-resize;'
			+ ' border-bottom:2px solid #555; border-right:2px solid #444;'
			+ ' margin:0 0 -'+ (nav.Opera ? 8 : (nav.Chrome ? 2 : 5)) + 'px -11px;'}, {
		'mousedown': function(e) {
			e.preventDefault();
			$event(doc.body, {'mousemove': resmove, 'mouseup': resstop});
		}
	})]);
}

function doChanges() {
	// Common changes
	docTitle = '/' + brd + ' - ' + getTitle(oPosts[0]).substring(0, 77);
	if(!isMain) {
		doc.title = docTitle;
		$event(window, {
			'blur': function() {isActiveTab = false},
			'focus': function() {
				isActiveTab = true;
				if(Cfg[42] == 1 && nav.Firefox) {
					clearInterval(favIcnInterval);
					var head = $x('.//head');
					$Del('.//link[@rel="shortcut icon"]', head);
					head.appendChild($new('link', {'href': favIcn, 'rel': 'shortcut icon'}));
				}
				if(Cfg[20] == 1) setTimeout(function() {doc.title = docTitle}, 0);
			}
		});
		if(ch._0ch) {
			$delNx(Posts[Posts.length - 1] || oPosts[0]);
			$del($id('newposts_get'));
			$del($id('newposts_load'));
		}
	}
	if(ks) $Del('.//span[@class="extrabtns"]', dForm);
	if(ch.dc) $Del('.//a[@class="reply_ icon"]', dForm);
	if(ch._2ch) $Del('.//small|.//span[contains(@id,"_display")]', dForm);
	if(wk || ch._0ch) $event(window, {'load': function() {setTimeout(function() {
		if(wk) $Del('.//small', dForm);
		if(ch._0ch) $Del('.//div[@class="replieslist"]', dForm);
	}, 0)}});
	if(!pr.on) return;
	// Postform changes
	var hr = $x('following-sibling::hr', pr.area);
	if(hr) pr.area.appendChild(hr);
	if(isMain) $disp(pr.area);
	else {
		if($xb('following-sibling::div[@id="DESU_panel"]', dForm)) $before(dForm, [
			$id('DESU_panel'),
			$id('DESU_content'),
			$prev(pr.area),
			$if(Cfg[40] == 0, pr.area)
		]);
		else if(Cfg[40] == 1) $after(dForm, [pr.area]);
	}
	if(pr.subm.nextSibling) $delNx(pr.subm);
	formSubmit(pr);
	textFormatPanel(pr);
	textareaResizer(pr);
	$each($X('.//input[@type="text"]', pr.form), function(el) {el.size = 35});
	if(Cfg[47] == 1 && pr.rules) $disp(pr.rules);
	if(Cfg[48] == 1 && pr.gothr) $disp(pr.gothr);
	if(Cfg[49] == 1 && pr.passw) $disp($x(pr.tr, pr.passw));
	if(Cfg[43] == 1 && pr.name) setTimeout(function() {pr.name.value = Cfg[44]} , 0);
	del_passw = $X('.//input[@type="password"]').snapshotItem(1);
	if(del_passw) setTimeout(function() {
		if(Cfg[45] == 1) pr.passw.value = del_passw.value = Cfg[46];
		else del_passw.value = pr.passw.value;
	}, 0);
	if(ch.dc) $del($id('hideinfotd'));
	if(ch._0ch) {
		$del($id('captcha_status'));
		$html($x('ancestor::td[1]', pr.txta), '<textarea cols="48" rows="4" accesskey="m" />');
		pr.txta = $x('.//textarea', pr.form);
	}
	if(ch._4ch) {
		pr.area.style.paddingLeft = '0px';
		$del($x('preceding-sibling::div', $x('.//table', pr.form)));
		var logo = $x('.//div[@class="logo"]');
		$del($next(logo));
		$del($next(logo));
	}
	if(pr.recap) {
		var reimg = $x('.//div[@id="recaptcha_image"]', pr.form);
		if(reimg) $attr(reimg, {
			'onclick': 'Recaptcha.reload()',
			'style': 'cursor:pointer; width:300px'
		});
		var x = $id('recaptcha_reload_btn');
		if(x) $disp($up(x));
	}
	if(pr.cap) {
		$rattr(pr.cap, 'onfocus');
		$rattr(pr.cap, 'onkeypress');
		$event($attr(pr.cap, {'autocomplete': 'off'}), {'keypress': forceCap});
		if(!ch.dc && !pr.recap) {
			var img = $x('.//a|.//img', $x(pr.tr, pr.cap));
			$up(img).replaceChild(makeCapImg(isMain ? 0 : oPosts[0].Num), img);
		}
	}
	if(Cfg[38] == 1 && hasSage) {
		$disp(pr.mail);
		if(pr.name) {
			$delNx(pr.name);
			var mail_tr = $x(pr.tr, pr.mail);
			$after(pr.name, [pr.mail]);
			$del(mail_tr);
		}
		$delNx(pr.mail);
		$up(pr.mail).appendChild($new('span', {'id': 'DESU_sagebtn', 'style': 'cursor:pointer'}));
		sageBtnEvent(pr);
		sageBtnFunc(pr);
	}
	if(Cfg[27] == 1) {
		var load = nav.Opera ? 'DOMFrameContentLoaded' : 'load';
		doc.body.appendChild($new('iframe', {
			'name': 'DESU_submitframe',
			'id': 'DESU_submitframe',
			'src': 'about:blank',
			'style': 'visibility:hidden; width:0px; height:0px; border:none'}, {
			load: iframeLoad
		}));
		$rattr($attr(pr.form, {'target': 'DESU_submitframe'}), 'onsubmit');
	}
}

/*-----------------------------Quick Reply under post------------------------*/

function refreshRecap(old) {
	setTimeout(function() {
		var qtb = $x('ancestor::tbody[1]', qr.cap);
		var ptb = $x('ancestor::tbody[1]', pr.cap);
		var x = './/div[@id="recaptcha_image"]/img';
		var val = $x(x, ptb).src;
		var img = $x(x, qtb);
		if(!old) old = img.src;
		if(old == val) {refreshRecap(old); return}
		img.src = val;
		x = './/a[@target="_blank"]';
		if($xb(x, qtb)) $x(x, qtb).href = $x(x, ptb).href;
		x = './/input[@id="recaptcha_challenge_field"]';
		if($xb(x, qtb)) $x(x, qtb).value = $x(x, ptb).value;
		$disp(pr.cap);
		qr.cap.focus();
	}, 200);
}

function quickReply(post) {
	var tNum = getThread(post).id.match(/\d+/);
	if(!qr.on) {
		qr = new replyForm($attr(pr.form.cloneNode(true), {'class': pClass}))
		qr.txta.value = pr.txta.value;
		textFormatPanel(qr);
		textareaResizer(qr);
		sageBtnEvent(qr);
		formSubmit(qr);
		if(qr.cap) {
			$event(qr.cap, {'keypress': forceCap});
			if(qr.recap) {
				var reimg = $x('.//div[@id="recaptcha_image"]', qr.form);
				if(reimg) $event(reimg, {'click': function() {$disp(pr.cap); refreshRecap()}});
			} else $event($x(qr.tr + '//img', qr.cap), {'click': function() {
				refreshCapImg(qr, tNum);
			}});
		}
		if(isMain && (wk || ch.krau))
			$before($1(qr.form), [$new('input', {
				'type': 'hidden',
				'id': 'thr_id',
				'name': (!ch._4ch ? 'parent' : 'resto'),
				'value': tNum
			})]);
	}
	if($next(post) == qr.form) {$disp(qr.form); return}
	$after(post, [qr.form]);
	qr.form.style.display = 'block';
	qr.form.style.width = '100%';
	if(qr.cap && wk && !qr.recap) refreshCapImg(qr, tNum);
	if(isMain)
		$x('.//input[@id="thr_id" or @name="thread_id" or @name="replythread"]', qr.form).value = tNum;
	insertInto(qr.txta, '>>' + post.Num + quotetxt.replace(/(^|\n)(.)/gm, '\n>$2') + '\n');
}

/*----------------------------Text formatting buttons------------------------*/

function tfBtn(title, wktag, bbtag, val, style, src, x) {
	var btn = $new('span', {'title': title});
	if(Cfg[22] == 1) btn.style.cssText =
		'padding:0px 27px 23px 0; background:url(data:image/gif;base64,' + src + ') no-repeat';
	if(Cfg[22] == 2) btn.innerHTML =
		'<a style="' + style + '">' + val + '</a>' + (val != '&gt;' ? ' / ' : '');
	if(Cfg[22] == 3) btn.innerHTML =
		'<input type="button" value="' + val + '" style="font-weight:bold;' + style + '">';
	if(val != '&gt;') $event(btn, {'click': function() {
		var tag1, tag2;
		if(ch._0ch || ch._2ch || ch.krau || ch.sib || dm == 'zadraw.ch' || (ch._4ch && wktag == '%%')) {
			tag1 = '[' + bbtag + ']';
			tag2 = '[/' + bbtag + ']';
		} else tag1 = tag2 = wktag;
		var start = x.selectionStart, end = x.selectionEnd, scrtop = x.scrollTop;
		var text = x.value.substring(start, end).split('\n');
		var i = text.length;
		while(i--) {
			if(tag1 == '') {
				var j = text[i].trim().length;
				while(j--) tag2 += '^H';
			}
			var len = end + tag1.length + tag2.length;
			if(text[i].match(/^\s+/)) tag1 = text[i].match(/^\s+/)[0] + tag1;
			if(text[i].match(/\s+$/)) tag2 += text[i].match(/\s+$/)[0];
			text[i] = tag1 + text[i].trim() + tag2;
		}
		x.value = x.value.substr(0, start) + text.join('\n') + x.value.substr(end);
		x.setSelectionRange(len, len);
		x.focus();
		x.scrollTop = scrtop;
	}});
	else $event(btn, {
		'mouseover': function() {quotetxt = txtSelection()},
		'click': function() {
			var start = x.selectionStart, end = x.selectionEnd;
			insertInto(x, '>' + (start == end
				? quotetxt : x.value.substring(start, end)).replace(/\n/gm, '\n>'));
		}
	});
	return btn;
}

function textFormatPanel(obj) {
	if(!obj.txta) return;
	$del($x('.//div[@id="DESU_textpanel"]', obj.form));
	var tx = obj.txta;
	if(Cfg[22] == 0 || !tx) return;
	var pre = 'R0lGODlhFwAWAJEAAPDw8GRkZAAAAP///yH5BAEAAAMALAAAAAAXABYAQAJ';
	var btns = $New('div', [
		$if(Cfg[22] == 2, $txt('[ ')),
		tfBtn('Жирный', '**', 'b', 'B', '', pre + 'T3IKpq4YAoZgR0KqqnfzipIUikFWc6ZHBwbQtG4zyonW2Vkb2iYOo8Ps8ZLOV69gYEkU5yQ7YUzqhzmgsOLXWnlRIc9PleX06rnbJ/KITDqTLUAAAOw==', tx),
		tfBtn('Наклонный', '*', 'i', 'i', 'font-style:italic', pre + 'K3IKpq4YAYxRCSmUhzTfx3z3c9iEHg6JnAJYYSFpvRlXcLNUg3srBmgr+RL0MzxILsYpGzyepfEIjR43t5kResUQmtdpKOIQpQwEAOw==', tx),
		$if(!ch.dc && !ch._410 && !ch.iich, tfBtn('Подчеркнутый', '__', 'u', 'U', 'text-decoration:underline', pre + 'V3IKpq4YAoRARzAoV3hzoDnoJNlGSWSEHw7JrEHILiVp1NlZXtKe5XiptPrFh4NVKHh9FI5NX60WIJ6ATZoVeaVnf8xSU4r7NMRYcFk6pzYRD2TIUAAA7', tx)),
		tfBtn('Зачеркнутый', !ch._410 ? '' : '^^', 's', 'S', 'text-decoration:line-through', pre + 'S3IKpq4YAoRBR0qqqnVeD7IUaKHIecjCqmgbiu3jcfCbAjOfTZ0fmVnu8YIHW6lgUDkOkCo7Z8+2AmCiVqHTSgi6pZlrN3nJQ8TISO4cdyJWhAAA7', tx),
		tfBtn('Спойлер', '%%', 'spoiler', '%', '', 'R0lGODlhFwAWAJEAAPDw8GRkZP///wAAACH5BAEAAAIALAAAAAAXABYAQAJBlIKpq4YAmHwxwYtzVrprXk0LhBziGZiBx44hur4kTIGsZ99fSk+mjrMAd7XerEg7xnpLIVM5JMaiFxc14WBiBQUAOw==', tx),
		tfBtn('Код', "`", 'code', 'C', '', pre + 'O3IKpq4YAoZgR0KpqnFxokH2iFm7eGCEHw7JrgI6L2F1YotloKek6iIvJAq+WkfgQinjKVLBS45CePSXzt6RaTjHmNjpNNm9aq6p4XBgKADs=', tx),
		tfBtn('Цитировать', '', '', '&gt;', '', pre + 'L3IKpq4YAYxRUSKguvRzkDkZfWFlicDCqmgYhuGjVO74zlnQlnL98uwqiHr5ODbDxHSE7Y490wxF90eUkepoysRxrMVaUJBzClaEAADs=', tx),
		$if(Cfg[22] == 2, $txt(' ]'))
		], {
		'id': 'DESU_textpanel',
		'html': '&nbsp;',
		'style': 'font-weight:bold; cursor:pointer; display:'
			+ (Cfg[23] == 0 ? 'inline;' : 'block;') + (Cfg[22] == 1 ? 'height:23px;' : '')
	});
	if(Cfg[23] == 0) $after(obj.subm, [btns]);
	else $before(tx, [btns]);
}

/*-------------------------Append styles for elements------------------------*/

function scriptStyles() {
	var pIcn = function(nm, src) {return nm + ' {cursor:pointer; margin-right:4px; ' + (Cfg[29] == 0 ? 'padding-right:14px; font-size:13px; background:url(data:image/gif;base64,' + src + ') no-repeat !important} ' : '} ')};
	var pre = 'R0lGODlhDgAOAKIAAPDw8KCgoICAgFhYWP///wAAAAAAAAAAACH5BAEAAAQALAAAAAAOAA4AQAM';
	var txt = 'td.reply {width:auto} .DESU_pcount {font-size:13px; color:#4f7942; cursor:default} .DESU_pcountb {font-size:13px; color:#c41e3a; cursor:default} .DESU_favpcount {float:right; font-weight:bold} .DESU_refmap {font-size:70%; font-style:italic} #DESU_preimg, #DESU_fullimg {border:none; outline:none; margin:2px 20px; cursor:pointer} .DESU_postpanel {margin-left:4px; font-weight:bold} .DESU_postnote {font-size:12px; font-style:italic; color:inherit; cursor:pointer} #DESU_mp3, #DESU_ytube {margin:5px 20px} #DESU_ybtn {cursor:pointer}'
 	+ '.wait_icn {padding:0 16px 16px 0; background:url( data:image/gif;base64,R0lGODlhEAAQALMMAKqooJGOhp2bk7e1rZ2bkre1rJCPhqqon8PBudDOxXd1bISCef///wAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQFAAAMACwAAAAAEAAQAAAET5DJyYyhmAZ7sxQEs1nMsmACGJKmSaVEOLXnK1PuBADepCiMg/DQ+/2GRI8RKOxJfpTCIJNIYArS6aRajWYZCASDa41Ow+Fx2YMWOyfpTAQAIfkEBQAADAAsAAAAABAAEAAABE6QyckEoZgKe7MEQMUxhoEd6FFdQWlOqTq15SlT9VQM3rQsjMKO5/n9hANixgjc9SQ/CgKRUSgw0ynFapVmGYkEg3v1gsPibg8tfk7CnggAIfkEBQAADAAsAAAAABAAEAAABE2QycnOoZjaA/IsRWV1goCBoMiUJTW8A0XMBPZmM4Ug3hQEjN2uZygahDyP0RBMEpmTRCKzWGCkUkq1SsFOFQrG1tr9gsPc3jnco4A9EQAh+QQFAAAMACwAAAAAEAAQAAAETpDJyUqhmFqbJ0LMIA7McWDfF5LmAVApOLUvLFMmlSTdJAiM3a73+wl5HYKSEET2lBSFIhMIYKRSimFriGIZiwWD2/WCw+Jt7xxeU9qZCAAh+QQFAAAMACwAAAAAEAAQAAAETZDJyRCimFqbZ0rVxgwF9n3hSJbeSQ2rCWIkpSjddBzMfee7nQ/XCfJ+OQYAQFksMgQBxumkEKLSCfVpMDCugqyW2w18xZmuwZycdDsRACH5BAUAAAwALAAAAAAQABAAAARNkMnJUqKYWpunUtXGIAj2feFIlt5JrWybkdSydNNQMLaND7pC79YBFnY+HENHMRgyhwPGaQhQotGm00oQMLBSLYPQ9QIASrLAq5x0OxEAIfkEBQAADAAsAAAAABAAEAAABE2QycmUopham+da1cYkCfZ94UiW3kmtbJuRlGF0E4Iwto3rut6tA9wFAjiJjkIgZAYDTLNJgUIpgqyAcTgwCuACJssAdL3gpLmbpLAzEQA7) no-repeat}'
	+ pIcn('.hide_icn', pre + '8SLLcS2MNQGsUMYi6uB5BKI5hFgojel5YBbDDNcmvpJLkcgLq1jcuSgPmgkUmlJgFAyqNmoEBJEatxggJADs=')
	+ pIcn('.unhide_icn', pre + '5SLLcS2ONCcCMIoYdRBVcN4Qkp4ULmWVV20ZTM1SYBJbqvXmA3jk8IMzlgtVYFtkoNCENIJdolJAAADs=')
	+ pIcn('.rep_icn', pre + '4SLLcS2MNQGsUMQRRwdLbAI5kpn1kKHUWdk3AcDFmOqKcJ5AOq0srX0QWpBAlIo3MNoDInlAZIQEAOw==')
	+ pIcn('.sage_icn','R0lGODlhDgAOAJEAAPDw8FBQUP///wAAACH5BAEAAAIALAAAAAAOAA4AQAIZVI55duDvFIKy2vluoJfrD4Yi5lWRwmhCAQA7')
	+ pIcn('.expthr_icn', pre + '7SLLcS6MNACKLIQjKgcjCkI2DOAbYuHlnKFHWUl5dnKpfm2vd7iyUXywEk1gmnYrMlEEyUZCSdFoiJAAAOw==')
	+ pIcn('.fav_icn', pre + '5SLLcS2MNQGsUl1XgRvhg+EWhQAllNG0WplLXqqIlDS7lWZvsJkm92Au2Aqg8gQFyhBxAlNCokpAAADs=')
	+ pIcn('.favset_icn', 'R0lGODlhDgAOAKIAAP/dQKCgoICAgFhYWP///wAAAAAAAAAAACH5BAEAAAQALAAAAAAOAA4AQAM5SLLcS2MNQGsUl1XgRvhg+EWhQAllNG0WplLXqqIlDS7lWZvsJkm92Au2Aqg8gQFyhBxAlNCokpAAADs=');
	if(ch._2ch) txt += 'html, body {font-family:"Trebuchet MS",Trebuchet,tahoma,serif} div {font-size:1em}';
	if(Cfg[35] == 1) txt += '.commentpostername, .postername, .postertrip {display:none} ';
	if(Cfg[36] == 1) txt += 'blockquote {max-height:100% !important; overflow:visible !important} ';
	if(Cfg[37] == 1) txt += '.spoiler {background:#888 !important; color:#CCC !important} .hide {color:#AAA !important; opacity:1 !important}';
	if(!$id('DESU_css')) {
		$x('.//head').appendChild($new('style', {'id': 'DESU_css', 'type': 'text/css', 'text': txt}));
		if(nav.Chrome) $disp(dForm);
	} else $id('DESU_css').textContent = txt;
}


/*=============================================================================
							FOR POSTS AND THREADS
=============================================================================*/

function forPosts(fn) {
	for(var post, i = 0; post = Posts[i++];) fn(post);
}

function forOP(fn) {
	for(var post, i = 0; post = oPosts[i++];) fn(post);
}

function forAll(fn) {
	forOP(fn); forPosts(fn);
}

function getThread(el) {
	return $x('ancestor::div[@class="thread"]', el);
}

function getPost(el) {
	return $x('ancestor::' + xPost + '|ancestor::' + xOPost, el)
		|| $x('ancestor::table[1]|ancestor::div[starts-with(@id,"oppost")]', el);
}

function getTitle(post) {
	var t = $x('.//span[@class="filetitle" or @class="replytitle" or @class="postsubject"]', post);
	if(t) t = t.textContent.trim();
	if(!t || t == '') t = post.Text.trim();
	return t.replace(/\s+/g, ' ');
}

function getImages(post) {
	return $X('.//img[contains(@src,"/thumb") or contains(@src,"/spoiler")]', post);
}

function getText(el) {
	var n = el.nodeName;
	if(n == '#text') return el.data;
	if(n == 'BR') return '\n';
	var t = [];
	if(n == 'P' || n == 'BLOCKQUOTE' || n == 'LI') t[t.length] = '\n';
	var arr = el.childNodes;
	for(var x, i = 0; x = arr[i++];)
		t[t.length] = getText(x);
	return t.join('');
}

function isSage(post) {
	if(!hasSage) return false;
	if(wk || ks) {
		var a = $x('.//a[starts-with(@href,"mailto:")]', post);
		return a && /sage/i.test(a.href);
	} else {
		if(ch.dc) return $xb('.//img[@alt="Сажа"]', post);
		if(ch.krau) return $xb('.//span[@class="sage"]', post);
	}
	return false;
}

function isTitled(post) {
	if(!ch._0ch && $x('.//span[@class="replytitle"]', post).textContent.trim() == '') return false;
	if(ch._0ch && !$xb('.//span[@class="filetitle"]', post)) return false;
	return true;
}

/*-------------------------------Post buttons--------------------------------*/

function addHidePostBtn(post) {
	var el = $new('a', {
		'class': 'hide_icn'}, {
		'click': function() {
			if(!post.isOp) togglePostVisib(post);
			else {hideThread(post); storeThreadVisib(post, 0)}
		},
		'mouseover': function() {selectPostHider(post)},
		'mouseout': function(e) {removeSelMenu(e.relatedTarget)}
	});
	if(Cfg[29] == 1) el.textContent = 'x';
	return el;
}

function addQuickRepBtn(post) {
	var el = $new('a', {
		'class': 'rep_icn',
		'title': 'Быстрый ответ'}, {
		'mouseover': function() {quotetxt = txtSelection()},
		'click': function() {quickReply(post)}
	});
	if(Cfg[29] == 1) el.textContent = 'a';
	return el;
}

function addExpandThreadBtn(post) {
	var el = $new('a', {
		'class': 'expthr_icn'}, {
		'click': function() {loadThread(post, 1)},
		'mouseover': function() {selectExpandThread(post)},
		'mouseout': function(e) {removeSelMenu(e.relatedTarget)}
	});
	if(Cfg[29] == 1) el.textContent = 'e';
	return el;
}

function addFavorBtn(post) {
	var el = $new('a', {
		'class': (Favor.join('|').indexOf(getFavorKey(post)) > -1 ? 'favset_icn' : 'fav_icn'),
		'title': 'В избранное'}, {
		'click': function() {storeFavorities(post, this)}
	});
	if(Cfg[29] == 1) el.textContent = 'f';
	return el;
}

function addSageMarker() {
	var el = $new('a', {
		'class': 'sage_icn',
		'title': 'SAGE'}, {
		'click': function() {toggleSage(); toggleChk($id('DESU_sage_ch'))}
	});
	if(Cfg[29] == 1) el.textContent = 'sage';
	return el;
}

function addPostCounter(post) {
	return $new('i', {
		'class': (post.Count < 500 ? 'DESU_pcount' : 'DESU_pcountb'),
		'text': post.Count
	});
}

function addNote(post, text) {
	post.Btns.appendChild($new('a', {
		'class': 'DESU_postnote',
		'text': text}, {
		'click': function() {$del(this)}
	}));
}

function addPostButtons(post, isCount) {
	var x = [], i = 0;
	var el = $new('span', {'class': 'DESU_postpanel'});
	if(ch._4ch) $X('.//a[@class="quotejs"]', post).snapshotItem(1).textContent = post.Num;
	if(!post.isOp) {
		if(!isMain || isCount) x[i++] = addPostCounter(post);
		if(isSage(post)) x[i++] = addSageMarker();
		if(pr.on) x[i++] = addQuickRepBtn(post);
	} else {
		if(isSage(post)) x[i++] = addSageMarker();
		x[i++] = addFavorBtn(post);
		if(pr.on) x[i++] = addQuickRepBtn(post);
		if(isMain) x[i++] = addExpandThreadBtn(post);
	}
	x[i++] = addHidePostBtn(post);
	var i = x.length;
	while(i--) el.appendChild(x[i]);
	var ref = $x(xPostRef, post);
	if(Cfg[34] == 1) $event(ref, {'click': function(e) {
		if(Cfg[34] == 0 || !pr.on || /Reply|Ответ/.test(e.target.textContent)) return;
		e.stopPropagation(); e.preventDefault();
		var el = !qr.on || qr.form.style.display == 'none' ? pr : qr;
		if(isMain && el == pr && pr.area.style.display == 'none') $disp(pr.area);
		insertInto(el.txta, '>>' + post.Num);
	}});
	$after(ref, [el]);
	post.Btns = el;
}

/*----------------------------------Players----------------------------------*/

function addYouTube(post) {
	var pattern = /https*:\/\/(www\.)?youtube\.com\/(watch\?v=|v\/)([^&]+).*$/;
	$each($X('.//embed', post || dForm), function(el) {
		if(!pattern.test(el.src)) return;
		var src = 'http://www.youtube.com/watch?v=' + el.src.match(pattern)[3];
		$x(xPostMsg, post || getPost(el)).appendChild(
			$new('p', {'html': '<a href="' + src + '">' + src + '</a>'})
		);
		$del($up(el));
	});
	if(Cfg[30] == 0) return;
	var links = $X('.//a[contains(@href,"youtube")]', post || dForm);
	for(var i = 0, len = links.snapshotLength; i < len; i++) {
		var link = links.snapshotItem(i);
		if(!pattern.test(link.href)) continue;
		var pst = post || getPost(link);
		var el = $x('.//div[@id="DESU_ytube"]', pst);
		var src = 'http://www.youtube.com/v/' + link.href.match(pattern)[3];
		if(!el) {
			el = $new('div', {
				'id': 'DESU_ytube',
				'html': '<embed type="application/x-shockwave-flash" src="' + src
					+ '" wmode="transparent" width="320" height="262" />'
			});
			var msg = $x(xPostMsg, pst);
			if(msg) $before(msg, [el]);
			else pst.appendChild(el);
		}
		$after(link, [$new('span', {
			'id': 'DESU_ybtn',
			'html': '<b> ' + unescape('%u25BA') + '</b>'}, {
			'click': function(src, obj) {return function() {
				$disp(obj);
				if(obj.src != src) setTimeout(function() {obj.src = src; obj.style.display = ''}, 0);
			}}(src, $1(el))
		})]);
	};
}

function addMP3(post) {
	if(Cfg[31] == 0) return;
	var links = $X('.//a[contains(@href,".mp3")]', post || dForm);
	for(var i = 0, len = links.snapshotLength; i < len; i++) {
		var link = links.snapshotItem(i);
		if(!(link.target == '_blank' || link.rel == 'nofollow')) continue;
		var src = link.href;
		src = src.substr(link.href.lastIndexOf('http://')); 
		var pst = post || getPost(link);
		var el = $x('.//div[@id="DESU_mp3"]', pst);
		if(!el) {
			el = $new('div', {'id': 'DESU_mp3'});
			var msg = $x(xPostMsg, pst);
			if(msg) $before(msg, [el]);
			else pst.appendChild(el);
		}
		if(!$xb('.//object[contains(@FlashVars,"' + src + '")]', el))
			$html(el, el.innerHTML + '<object data="http://junglebook2007.narod.ru/audio/player.swf" type="application/x-shockwave-flash" wmode="transparent" width="220" height="16"  FlashVars="playerID=1&amp;bg=0x808080&amp;leftbg=0xB3B3B3&amp;lefticon=0x000000&amp;rightbg=0x808080&amp;rightbghover=0x999999&amp;rightcon=0x000000&amp;righticonhover=0xffffff&amp;text=0xffffff&amp;slider=0x222222&amp;track=0xf5f5dc&amp;border=0x666666&amp;loader=0x7fc7ff&amp;loop=yes&amp;autostart=no&amp;soundFile=' + src + '"></object><br>');
	};
}

function addImages(post) {
	if(Cfg[32] == 0) return;
	$each($X(xPostMsg + '//a[contains(@href,".jpg") or contains(@href,".png") or contains(@href,".gif")]', post || dForm), function(link) {
		var src = link.href.substr(link.href.lastIndexOf('http://'));
		if(!$xb('ancestor::small', link)) $before(link, [$new('img', {
			'id': 'DESU_preimg',
			'src': src, 'title': src, 'alt': src,
			'style': 'display:none'}, {
			'load': function() {
				this.style.display = 'block';
				var w = this.width;
				var h = this.height;
				if(w < 200 && h < 200) return;
				this.width = 200;
				this.height = 200*h/w;
				$event(this, {'click': function(w, h) {return function() {
					if(this.id == 'DESU_preimg') $attr(this, {'id': 'DESU_fullimg', 'width': w, 'height': h});
					else $attr(this, {'id': 'DESU_preimg', 'width': 200, 'height': 200*h/w});
				}}(w, h)});
			}
		})]);
	});
}


/*--------------------------------Expand images------------------------------*/

function expandImg(a, post) {
	if(!/\.jpg|\.jpeg|\.png|.\gif/i.test(a.href)) return;
	var img = $x('.//img', a);
	var pre = $x('.//img[@id="DESU_preimg"]', a);
	var full = $x('.//img[@id="DESU_fullimg"]', a);
	$disp(img);
	if(pre) {$disp(pre); return}
	if(full) {full.style.display = full.style.display == 'none' ? 'block' : 'none'; return}
	var maxw = doc.body.clientWidth - $offset(a, 'offsetLeft') - 20;
	var sz = getImgSize(post.Img.snapshotLength > 1 ? $x('ancestor::div[1]', a) : post).split(/[x×]/);
	var w = sz[0] < maxw ? sz[0] : maxw;
	var h = w*sz[1]/sz[0];
	var src = a.href;
	$append(a, [
		$if(Cfg[26] == 2, $attr(img.cloneNode(false), {
			'id': 'DESU_preimg', 'width': w, 'height': h, 'style': 'display:'
		})),
		$new('img', {
			'id': 'DESU_fullimg',
			'src': src, 'title': src, 'alt': src,
			'width': w, 'height': h,
			'style': 'display:' + (Cfg[26] == 2 ? 'none' : 'block')}, {
			'load': function() {
				$del($x('.//img[@id="DESU_preimg"]', $up(this)));
				if(img.style.display == 'none') this.style.display = 'block';
			}
		})
	]);
}

function expandHandleImg(post) {
	$each(post.Img, function(img) {
		var a = $x('ancestor::a[1]', img);
		if(a) {
			$rattr(a, 'onclick');
			$rattr(img, 'onclick');
			a.addEventListener('click', function(e) {
				if(Cfg[26] != 0 && e.button != 1) {e.preventDefault(); expandImg(this, post)}
			}, false);
		}
	});
}

function allImgExpander() {
	if(Cfg[26] == 0 || isMain || !pr.file) return;
	$del($x('.//a[starts-with(text(),"Развернуть все")]', dForm));
	var txt = '[<a>Раскрыть изображения</a>]&nbsp;';
	$id('DESU_panel').appendChild($new('span', {
		'id': 'DESU_expallimg',
		'style': 'cursor:pointer; float:right',
		'html': txt}, {
		'click': function() {
			forAll(function(post) {
				$each(post.Img, function(img) {expandImg($x('ancestor::a[1]', img), post)})
			});
			var btn = $id('DESU_expallimg');
			btn.innerHTML = /Раскрыть/.test(btn.innerHTML) ? '[<a>Свернуть изображения</a>]&nbsp;' : txt;
		}}));
}

/*--------------------------Add map of answers to post-----------------------*/

function getRefMap(pNum, rNum) {
	if(!refArr[rNum]) refArr[rNum] = [];
	if((',' + refArr[rNum].toString() + ',').indexOf(',' + pNum + ',') < 0) refArr[rNum].push(pNum);
}

function ajaxRefmap(txt, pNum) {
	var x = txt.match(/&gt;&gt;\d+/g);
	if(x) for(var i = 0; rLen = x.length, i < rLen; i++)
		getRefMap(pNum, x[i].match(/\d+/g));
}

function showRefMap(post, rNum, isUpd) {
	if(typeof refArr[rNum] !== 'object' || !post) return;
	var ref = refArr[rNum].toString().replace(/(\d+)/g, '<a href="#$1">&gt;&gt;$1</a>');
	var el = isUpd ? $x('.//div[@class="DESU_refmap"]', post) : null;
	if(!el) {
		var msg = post.Msg || $x(xPostMsg, post);
		if(!msg) return;
		el = $new('div', {'class': 'DESU_refmap', 'html': '<br> Ответы: ' + ref});
		doRefPreview(el);
		$after(msg, [el]);
	} else {
		var htm = el.innerHTML;
		if(htm.indexOf(ref) < 0) doRefPreview($html(el, htm + ', ' + ref));
	}
}

function doRefMap(post) {
	if(Cfg[24] != 2) return;
	var links = $X('.//a[starts-with(text(),">>")]', (post ? post.Msg : dForm));
	for(var i = 0, len = links.snapshotLength; i < len; i++) {
		var link = links.snapshotItem(i);
		if(/\//.test(link.textContent)) return;
		var rNum = (link.hash || link.pathname.substring(link.pathname.lastIndexOf('/'))).match(/\d+/);
		var pst = post || getPost(link);
		if(postByNum[rNum] && pst) getRefMap(pst.id.match(/\d+/), rNum);
	}
	for(var rNum in refArr) showRefMap(postByNum[rNum], rNum, Boolean(post));
}

/*---------------------------Posts preview by reflinks-----------------------*/

function delPostPreview(e) {
	cPrev = $x('ancestor-or-self::div[starts-with(@id,"DESU_preview")]', e.relatedTarget);
	setTimeout(function() {
		if(!cPrev) $Del('.//div[starts-with(@id,"DESU_preview")]');
		else $delNx(cPrev);
	}, Cfg[25] == 0 ? 0 : 600);
}

function showPostPreview(e) {
	if(Cfg[24] == 0 || /^>>$/.test(this.textContent)) return;
	setTimeout(function() {$del($x('.//div[starts-with(@id,"preview")]'))}, 0);
	var tNum = this.pathname.substring(this.pathname.lastIndexOf('/')).match(/\d+/);
	var pNum = this.hash.match(/\d+/) || tNum;
	var b = this.pathname.match(/[^\/]+/);
	if(!b || /\.html$|^res$/.test(b)) b = '';
	var div = $new('div', {'style': 'position:absolute; top:0; left:0; width:100%; height:100%'});
	doc.body.appendChild(div);
	var scrw = div.offsetWidth, scrh = div.offsetHeight;
	$del(div);
	var x, y;
	if(Cfg[52] == 0) {
		x = e.clientX + (doc.documentElement.scrollLeft || doc.body.scrollLeft) + 2;
		y = e.clientY + (doc.documentElement.scrollTop || doc.body.scrollTop);
	} else {
		x = $offset(this, 'offsetLeft') + this.offsetWidth/2;
		y = $offset(this, 'offsetTop');
		if(e.clientY < scrh*0.75) y += this.offsetHeight;
	}
	var cln = $new('div', {
		'class': pClass,
		'id': 'DESU_preview_' + pNum,
		'style': 'position:absolute; z-index:300; width:auto; min-width:0; border:1px solid grey; '
			+ (x < scrw/2 ? 'left:' + x : 'right:' + parseInt(scrw - x + 2)) + 'px; '
			+ (e.clientY < scrh*0.75 ? 'top:' + y : 'bottom:' + parseInt(scrh - y - 4)) + 'px'}, {
		'mouseout': delPostPreview,
		'mouseover': function() {if(!cPrev) cPrev = this}
	});
	cPrev = cln;
	var functor = function(cln, html) {
		cln.innerHTML = htmlReplace(html);
		doRefPreview(cln);
		$Del('.//img[@id="DESU_preimg" or @id="DESU_fullimg"]|.//span[@id="DESU_ybtn"]'
				+ '|.//div[@id="DESU_ytube" or @class="DESU_refmap"]', cln);
		addYouTube(cln);
		cln.Img = getImages(cln);
		$each(cln.Img, function(img) {img.style.display = ''});
		expandHandleImg(cln);
		addImages(cln);
		if(Cfg[24] == 2) showRefMap(cln, pNum, false);
	};
	if(b == brd) var post = postByNum[pNum];
	cln.innerHTML = '<span class="wait_icn">&nbsp;</span>&nbsp;Загрузка...';
	if(post) {
		functor(cln, ($x('.//td[@class="' + pClass + '"]', post) || post).innerHTML);
		if(post.Vis == 0) togglePost(cln);
	} else if(ajaxPosts[pNum]) functor(cln, ajaxPosts[pNum]);
	else AJAX(ch.dc ? '/api/post/ref/' + b + '/' + tNum + '/' + pNum + '.xhtml' : null, b, tNum, function(err) {
		functor(cln, err || ajaxPosts[pNum] || 'Пост не найден');
	});
	$del($id(cln.id));
	dForm.appendChild(cln);
}

function doRefPreview(el) {
	if(Cfg[24] != 0) $each($X('.//a[starts-with(text(),">>")]', el || dForm), function(link) {
		if(ch.dc) $rattr(link, 'onmouseover');
		$event(link, {'mouseover': showPostPreview, 'mouseout': delPostPreview});
	});
}


/*=============================================================================
								AJAX FUNCTIONS
=============================================================================*/

function getpNum(x) {
	return (x.match(/<input[^>]+checkbox[^>]+>/i) || x.match(/<a\s+name="\d+">/i))[0].match(/(\d+)/)[0];
}

function parseHTMLdata(x) {
	x = x.split(/<form[^>]+del[^>]+>/)[1].split('</form>')[0];
	var thrds = x.substring(0, x.lastIndexOf(!ch.krau ? x.match(/<br[^>]+left/) : '<div style="clear: both">')).split(!ch.krau ? /<br[^>]+left[^>]*>[<>\/p\s]*<hr[^>]*>/ : /<\/div>\s+<div[^>]+class="thread"[^>]*>/);
	for(var i = 0, tLen = thrds.length; i < tLen; i++) {
		var tNum = getpNum(thrds[i]);
		var posts = thrds[i].split(/<table[^>]*>/);
		ajaxThrds[tNum] = {keys: []};
		for(var j = 0, pLen = posts.length; j < pLen; j++) {
			var x = posts[j];
			var pNum = getpNum(x);
			ajaxThrds[tNum].keys.push(pNum);
			x = x.substring((!/<td/.test(x) && /filesize[^>]*>/.test(x)) ? x.search(/filesize[^>]*>/) - 13 : (/<label/.test(x) ? x.indexOf('<label') : x.indexOf('<input')), /<td/.test(x) ? x.lastIndexOf('</td') : (/omittedposts[^>]*>/.test(x) ? x.lastIndexOf('</span') + 7 : (/<\/div/.test(x) && !ch._2ch && (!ks || ch._0ch) ? x.lastIndexOf('</div') + 6 : x.lastIndexOf('</blockquote') + 13))).replace(/(href="#)(\d+")/g, 'href="' + tNum + '#$2');
			ajaxRefmap(x.substr(x.indexOf('<blockquote>') + 12), pNum);
			ajaxPosts[pNum] = x;
		}
	}
}

function parseJSONdata(x) {
	var thrds = eval('(' + x.substring(x.indexOf('threads') - 2, x.lastIndexOf('events') - 4) + ')').threads;
	for(var i = 0, tLen = thrds.length; i < tLen; i++) {
		var tNum = thrds[i].display_id;
		var posts = thrds[i].posts;
		ajaxThrds[tNum] = {keys: [], pcount: thrds[i].posts_count};
		for(var j = 0, pLen = posts.length; j < pLen; j++) {
			var x = posts[j];
			var pNum = x.display_id;
			ajaxThrds[tNum].keys.push(pNum);
			var files = [];
			for(var f = 0, fLen = x.files.length; f < fLen; f++) {
				var fl = x.files[f];
				var m = fl.metadata;
				var a = '<a href="/' + fl.src + '" target="_blank">';
				files.push('<div class="file"><div class="fileinfo">Файл: ' + a + fl.src.split('/')[3] + '</a><br><em>' + fl.thumb.split('/')[1] + ', ' + (fl.size/1024).toFixed(2) + ' KB, ' + (fl.type == 'image' ? m.width + '×' + m.height : Math.floor(m.length/60).toString() + ':' + Math.floor(m.length - Math.floor(m.length/60)*60).toString() + ' m @ ' + Math.floor(m.bitrate/1000) + 'kbps<br>' + m.artist + ' — ' + m.album + ' / ' + m.title) + '</em><br></div>' + a + '<img src="/' + fl.thumb + '" class="thumb" alt="/' + fl.src + '"></a></div>');
			}
			var txt = (x.message || '').split('\r\n');
			for(var r = 0, rLen = txt.length; r < rLen; r++) {
				if(/^\s{4}/.test(txt[r])) txt[r] = '<code>' + txt[r].substr(4) + '</code>';
				else txt[r] = txt[r].replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/(&gt;&gt;)(\d+)/g, '<a href="/' + brd + '/' + res + tNum + '.xhtml#i$2">$1$2</a>').replace(/(https*:\/\/.+?)(?:\s|&gt;|$)/ig, '<a href="$1">$1</a>').replace(/(\*\*)(.+?)(\*\*)/g, '<b>$2</b>').replace(/(\*)(.+?)(\*)/g, '<i>$2</i>').replace(/(__)(.+?)(__)/g, '<b>$2</b>').replace(/(`)(.+?)(`)/g, '<code>$2</code>').replace(/(%%)(.+?)(%%)/g, '<span class="spoiler">$2</span>');
			}
			txt = txt.join('<br>').replace(/(^|<br>)(%%<br>)(.+?)(<br>%%)/g, '<div class="spoiler">$3</div>').replace(/(^|<br>)(``<br>)(.+?)(<br>``)/g, '<pre>$3</pre>').replace(/(^|<br>)(((&gt;.*?)(<br>|$))+)/g, '<blockquote depth="0">$2</blockquote>');
			ajaxPosts[pNum] = '<label><a class="delete icon"><img src="/images/blank.png"></a>' + (x.sage ? '<img src="/images/sage-carbon.png" alt="Сажа" title="Сажа">' : '') + (x.subject ? '<span class="replytitle">' + x.subject + '</span>' : '') + ' <span class="postername">' + x.name + '</span> ' + x.date + ' </label><span class="reflink"><a href="/' + brd + '/' + res + tNum + '.xhtml#i' + pNum + '">No.' + pNum + '</a></span>' + (thrds[i].posts_count - pLen + j == 0 ? '<span class="cpanel">[<a href="/' + brd + '/' + res + tNum + '.xhtml">Открыть тред</a>]</span>' : '') + '<br>' + (x.files.length > 0 ? files.join('') + (x.files.length > 1 ? '<br style="clear: both">' : '') : '') + '<div class="postbody"><div class="message">' + txt + '</div></div>' + (x.op == true ? '<div class="abbrev">' + 'Всего ' + thrds[i].posts_count + ' постов, из них ' + thrds[i].files_count + ' с файлами</div>' : '');
			ajaxRefmap(txt, pNum);
		}
	}
}

function AJAX(url, b, tNum, fn, isCache) {
	if(url && /^http:\/\//.test(url)) {
		GM_xmlhttpRequest({
			method: 'GET',
			url: url,
			onload: function(xhr) {
				if(xhr.readyState != 4) return;
				if(xhr.status == 200) {ajaxPosts[0] = xhr.responseText; fn()}
				else fn('HTTP ' + xhr.status + ' ' + xhr.statusText);
			}
		});
		return;
	}
	if(ch.dc && !url) return;
	var xhr = new window.XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if(xhr.readyState != 4) return;
		if(xhr.status == 200) {
			ajaxDate = xhr.getResponseHeader('Date');
			if(!ch.dc) parseHTMLdata(xhr.responseText);
			else if(/^{"boards":/.test(xhr.responseText)) parseJSONdata(xhr.responseText);
			else ajaxPosts[getpNum(xhr.responseText)] = xhr.responseText;
			fn();
		} else if(xhr.status != 304 && xhr.status != 0) fn('HTTP ' + xhr.status + ' ' + xhr.statusText);
	};
	xhr.open('GET', url || '/' + (b == '' ? '': b + '/') + res + tNum + '.html', true);
	xhr.setRequestHeader('Accept-Encoding', 'deflate, gzip, x-gzip');
	if(isCache) xhr.setRequestHeader('If-Modified-Since', ajaxDate);
	xhr.send(false);
}

function addPostFunc(post) {
	post.Text = getText(post.Msg).trim();
	doPostFilters(post);
	if(post.Vis == 0) setPostVisib(post, 0);
	if(Cfg[16] == 1) mergeHidden(post);
	doRefMap(post);
	doRefPreview(post.Msg);
	addMP3(post);
	addYouTube(post);
	addImages(post);
}

function newPost(thr, tNum, i, isCount, isDel) {
	var pNum = ajaxThrds[tNum].keys[i];
	if(ch.dc && isCount) i += ajaxThrds[tNum].pcount - ajaxThrds[tNum].keys.length;
	var html = htmlReplace(ajaxPosts[pNum]);
	var post = $new(i > 0 ? 'table' : 'div', {
		'id': (i > 0 ? 'post_' : 'oppost_') + pNum,
		'html': (i > 0 ? '<tbody><tr><td class="doubledash">&gt;&gt;</td><td class="'
			+ pClass + '" id="reply' + pNum + '">' + html + '</td></tr></tbody>' : html)
	});
	$Del('.//script', post);
	thr.appendChild(post);
	if(i == 0) oPosts[oPosts.length] = post;
	else Posts[Posts.length] = post;
	if(isDel) post.isDel = true;
	postByNum[pNum] = post;
	post.Num = pNum;
	post.Count = i + 1;
	if(!(sav.cookie && isMain)) post.Vis = getVisib(pNum);
	post.Msg = $x(xPostMsg, post);
	post.Img = getImages(post);
	post.isOp = i == 0;
	addPostButtons(post, isCount);
	if(Cfg[26] != 0) expandHandleImg(post);
	addPostFunc(post);
	return post;
}

function getFullMsg(post, tNum, a) {
	AJAX(null, brd, tNum, function(err) {
		if(err) return;
		try {var m = $x(xPostMsg, $new('div', {'html': htmlReplace(ajaxPosts[post.Num])})).innerHTML}
		catch(e) {return}
		$del(a);
		post.Msg = $html(post.Msg, m);
		addPostFunc(post);
	});
}

function expandPost(post) {
	if(post.Vis == 0) return;
	var a = $x(!ch.krau
		? './/div[@class="abbrev"]|.//span[@class="abbr" or @class="omittedposts"]'
		: './/p[starts-with(@id,"post_truncated")]'
	, post);
	if(!a || !(/long|full comment|gekürzt|слишком|длинн|мног/i.test(a.textContent))) return;
	var tNum = getThread(post).id.match(/\d+/);
	if(Cfg[33] == 1) getFullMsg(post, tNum, a);
	else $event(a, {'click': function(e) {e.preventDefault(); getFullMsg(post, tNum, e.target)}});
}

function expandThread(thr, tNum, last, isDel) {
	var len = ajaxThrds[tNum].keys.length;
	if(ch.dc) last = 0;
	else {
		if(last != 1) last = len - last;
		if(last <= 0) last = 1;
	}
	for(var i = last; i < len; i++)
		newPost(thr, tNum, i, true, isDel);
	if(!sav.cookie) storeHiddenPosts();
	$close($id('DESU_alert_wait'));
}

function loadThread(post, last) {
	$alert('Загрузка...', 'wait');
	var thr = getThread(post);
	var tNum = post.Num;
	var url;
	if(ch.dc) url = last > 1
		? '/api/thread/last/' + brd + '/' + tNum + '.json?count=' + last
		: '/api/thread/new/' + brd + '/' + tNum + '.json?last_post=' + post.Num;
	AJAX(url, brd, tNum, function(err) {
		if(err) {
			$close($id('DESU_alert_wait'));
			$alert(err);
		} else {
			$delNx(post.Msg);
			$delNx(post);
			expandThread(thr, tNum, last);
			window.scrollTo(0, $offset(postByNum[tNum], 'offsetTop'));
			if(last > 5 || last == 1) thr.appendChild($new('span', {
				'html': '[<a style="cursor:pointer">Свернуть тред</a>]'}, {
				'click': function() {loadThread(post, 5)}
			}));
		}
	});
}

function loadFavorThread() {
	var el = $up(this, 2);
	var thr = $x('.//div[@class="thread"]', el);
	if(thr.style.display != 'none') {$disp(thr); $delCh(thr); return}
	var arr = el.id.split('|');
	var tNum = arr[2];
	var b = arr[1];
	var url = arr[0] == window.location.hostname
		? (ch.dc ? '/api/thread/last/' + b + '/' + tNum + '.json?count=' + 5 : null)
		: $next(this).href;
	var hh = $offset(postByNum[tNum], 'offsetTop');
	if(hh > 0) {window.scrollTo(0, hh); return}
	$alert('Загрузка...', 'wait');
	AJAX(url, b, tNum, function(err) {
		if(err) {
			$close($id('DESU_alert_wait'));
			$alert(err);
		} else {
			if(url && /^http:\/\//.test(url)) {
				thr.innerHTML = ajaxPosts[0].split(/<form[^>]+del[^>]+>/)[1].split('</form>'
					)[0].replace(/(href="|src=")([^h][^"]+)/g, '$1http://' + url.split('/')[2] + '$2');
				$close($id('DESU_alert_wait'));
			} else {
				if(!ch.dc) newPost(thr, tNum, 0, true);
				expandThread(thr, tNum, 5, true);
			}
			$disp(thr);
		}
	});
}

function getDelPosts(err) {
	if(err) return;
	var j = 2, del = 0, isDel = false;
	for(var i = 0, len = Posts.length; i < len; i++) {
		var post = Posts[i];
		if(!ajaxPosts[post.Num]) {
			if(!post.isDel) $attr($x('.//i[starts-with(@class,"DESU_pcount")]' , post), {
				'style': 'color:#727579',
				'text': 'удалён'
			});
			post.isDel = true;
			isDel = true;
		} else if(!post.isDel) {
			if(isDel) $x('.//i[starts-with(@class,"DESU_pcount")]' , post).textContent = j;
			j++;
		}
		if(post.isDel) del++;
	}
	return del;
}

function infoNewPosts(err, del) {
	if(err) {
		$alert('Тред №' + oPosts[0].Num + ' недоступен:\n' + err);
		clearInterval(ajaxInterval);
		return;
	}
	if(Cfg[20] == 3) return;
	var inf = parseInt(ajaxThrds[oPosts[0].Num].keys.length - Posts.length + del - 1);
	if(Cfg[20] == 1) {
		if(isActiveTab) return;
		var old = doc.title.match(/^\[\d+\]/);
		if(old) inf += parseInt(old[0].match(/\d+/));
	}
	if(Cfg[42] == 1 && nav.Firefox) {
		clearInterval(favIcnInterval);
		if(inf > 0) favIcnInterval = setInterval(function() {
			var head = $x('.//head');
			$Del('.//link[@rel="shortcut icon"]', head);
			head.appendChild($new('link', {
				'href': ($xb('.//link[@href="' + favIcn + '"]', head) ? '' : favIcn),
				'rel': 'shortcut icon'
			}));
		}, 800);
	}
	doc.title = (inf > 0 ? ' [' + inf + '] ' : '') + docTitle;
}

function loadNewPosts(inf) {
	if(inf) $alert('Загрузка...', 'wait');
	var tNum = oPosts[0].Num;
	AJAX(null, brd, tNum, function(err) {
		var del = getDelPosts(err);
		if(!inf) infoNewPosts(err, del);
		if(!err) {
			for(var i = Posts.length - del + 1, len = ajaxThrds[tNum].keys.length; i < len; i++)
				newPost($x('.//div[@class="thread"]', dForm), tNum, i, true);
			storeHiddenPosts();
		}
		if(inf) {$close($id('DESU_alert_wait')); infoNewPosts(err, del)}
	}, true);
}

function initNewPosts() {
	if(isMain) return;
	var C = Cfg[21];
	var t = $case([C == 0, 0.5, C == 1, 1, C == 2, 1.5, C == 3, 2, C == 4, 5, C == 5, 15], 30)*60000;
	if(Cfg[20] == 1) ajaxInterval = setInterval(function() {loadNewPosts()}, t);
	if(Cfg[20] == 2) ajaxInterval = setInterval(function() {
		AJAX(null, brd, oPosts[0].Num, function(err) {infoNewPosts(err, getDelPosts(err))}, true);
	}, t);
	if(Cfg[20] == 2 || Cfg[20] == 3)
		$after($x('.//div[@class="thread"]'), [$new('span', {
			'id': 'DESU_getnewposts',
			'html': '[<a style="cursor:pointer">Получить новые посты</a>]'}, {
			'click': function() {loadNewPosts(true)}
		})]);
}

function loadPages(len) {
	$alert('Загрузка...', 'wait');
	$delCh(dForm);
	Posts = []; oPosts = []; refArr = []; ajaxThrds = {}; ajaxPosts = [];
	for(var p = 0; p < len; p++) {
		$append(dForm, [
			$new('center', {'text': p + ' страница', 'style': 'font-size:2em'}),
			$new('hr'),
			$new('div', {'id': 'DESU_page' + p})
		]);
		var url = '/' + (brd == '' ? '' : brd + '/') + (ch.dc
				? ((p > 0 ? p : 'index') + '.json')
				: (p > 0 ? p + '.html' : ''));
		AJAX(url, null, null, function(p, len) {return function() {
			var page = $id('DESU_page' + p);
			for(var tNum in ajaxThrds) {
				var thr = $new('div', {'class': 'thread', 'id': 'thread_' + tNum});
				$append(page, [thr, $new('br', {'clear': 'left'}), $new('hr')]);
				for(var i = 0, pLen = ajaxThrds[tNum].keys.length; i < pLen; i++)
					newPost(thr, tNum, i);
				delete ajaxThrds[tNum];
			}
			if(!sav.cookie) storeHiddenPosts();
			readThreadsVisib();
			if(p == len - 1) $close($id('DESU_alert_wait'));
		}}(p, len));
	}
}


/*=============================================================================
								HIDERS / FILTERS
=============================================================================*/

function hideThread(post, note) {
	if(post.Vis == 0) return;
	togglePost(post, 0);
	var x = $new('span', {
		'class': pClass,
		'id': 'DESU_hiddenthr_' + post.Num,
		'html': 'Тред <a style="cursor:pointer">№' + post.Num + '</a> скрыт <i>('
			+ (!note ? getTitle(post).substring(0, 50) : 'autohide: ' + note) + ')' + '</i>'
	});
	$event($x('.//a', x), {
		'click': function() {if(!nav.Chrome) togglePost(post, 1); unhideThread(post)},
		'mouseover': function() {if(Cfg[17] == 1) togglePost(post, 1)},
		'mouseout': function() {if(Cfg[17] == 1) togglePost(post, 1)}
	});
	$before($up(post), [x]);
	if(Cfg[16] == 2) {$disp(x); $disp($next($next(x))); $disp($next($next($next(x))))}
}

function unhideThread(post) {
	if(post.Vis == 1) return;
	togglePost(post, 1);
	$del($id('DESU_hiddenthr_' + post.Num));
	storeThreadVisib(post, 1);
}

function prevHidden() {if(Cfg[17] == 1) togglePost(getPost(this), 1)}
function unprevHidden() {if(Cfg[17] == 1) togglePost(getPost(this), 0)}

function applyPostVisib(post, vis) {
	if(post.isOp) return;
	if(!sav.cookie) {
		Visib[brd + post.Num] = vis;
		Expires[brd + post.Num] = (new Date()).getTime() + STORAGE_LIFE;
	} else Visib[post.Count] = vis;
	post.Vis = vis;
	if(Cfg[16] == 2) post.style.display = (vis == 0) ? 'none' : '';
}

function setPostVisib(post, vis) {
	if(post.isOp) {
		if(vis == 0) hideThread(post);
		else unhideThread(post);
		return;
	}
	$1(post.Btns).className = (vis == 0) ? 'unhide_icn' : 'hide_icn';
	if(Cfg[29] == 1) $1(post.Btns).textContent = (vis == 0) ? '+' : 'x';
	togglePost(post, vis);
	applyPostVisib(post, vis);
	var reflink = $prev(post.Btns);
	if(vis == 0) $event(reflink, {'mouseover': prevHidden, 'mouseout': unprevHidden});
	else $revent(reflink, {'mouseover': prevHidden, 'mouseout': unprevHidden});
}

function togglePostVisib(post) {
	post.Vis = (post.Vis == 1) ? 0 : 1;
	setPostVisib(post, post.Vis);
	storePostsVisib();
}

function hidePost(post, note) {
	if(!post.isOp) {
		if(post.Vis != 0) addNote(post, ' autohide: ' + note + ' ');
		applyPostVisib(post, 0);
	} else if(Cfg[19] == 1) {
		hideThread(post, note);
		storeThreadVisib(post, 0);
	}
}

function unhidePost(post) {
	if(!post.isOp) {
		if(detectWipe(post) != null) return;
		setPostVisib(post, 1);
		$del($x('.//a[@class="DESU_postnote"]', post));
		hideByWipe(post);
	} else if(Cfg[19] == 1) unhideThread(post);
}

function storeHiddenPosts() {
	forPosts(function(post) {if(post.Vis == 0) setPostVisib(post, 0)});
	storePostsVisib();
}

function togglePost(post, vis) {
	if(post.isOp) $disp(getThread(post));
	$each($X('following-sibling::*', $x(!ch.krau
		? './/span[@class="DESU_postpanel"]' : './/div[@class="postheader"]', post)), function(el) {
			el.style.display = (vis == 0) ? 'none' : '';
	});
}

function mergeHidden(post) {
	if(post.Vis != 0) return;
	var el = $prev(post);
	if(!/merged/.test(el.id)) {
		el = $new('span', {'id': 'DESU_merged_' + post.Num, 'style': 'display:none'});
		$before(post, [$new('span', {
			'style': 'display:; cursor:pointer'}, {
			'click': function() {
				var hDiv = $id('DESU_merged_' + post.Num);
				$prev(hDiv).innerHTML = 
					(hDiv.style.display == 'none' ? unescape('%u25BC') : unescape('%u25B2'))
					+ '[<i><a>Скрыто:</a> ' + hDiv.childNodes.length + '</i>]';
				$disp(hDiv);
			}}
		), el]);
	}
	el.appendChild(post);
	var next = $next(post);
	if(!next || getVisib(next.id.match(/\d+/)) == 1)
		$prev(el).innerHTML =
			unescape('%u25B2') + '[<i><a>Скрыто:</a> ' + el.childNodes.length + '</i>]';
}

function processHidden(newCfg, oldCfg) {
	if(newCfg == 2 || oldCfg == 2) {
		forPosts(function(post) {if(post.Vis == 0) $disp(post)});
		if(Cfg[19] == 1)
			$each($X('.//span[starts-with(@id,"DESU_hiddenthr")]'), function(x) {
				$disp(x);
				$disp($next($next(x))); $disp($next($next($next(x))));
			});
	}
	if(oldCfg == 1)
		$each($X('.//span[starts-with(@id,"DESU_merged")]'), function(el) {
			var px = el.childNodes;
			var i = px.length;
			while(i--) $after(el, [px[i]]);
			$del($prev(el));
			$del(el);
		});
	if(newCfg == 1) forAll(mergeHidden);
	saveCfg(16, newCfg);
}

/*-----------------------------------Filters---------------------------------*/

function doPostFilters(post) {
	hideByWipe(post);
	if(post.Vis == 0) return;
	var C = Cfg;
	if(C[9] == 1 && hasSage) hideBySage(post);
	if(C[10] == 1 && pr.subj && !post.isOp) hideByTitle(post);
	if(C[11] == 1) hideByNoText(post);
	if(C[12] == 1) hideByNoImage(post);
	if(C[14] == 1) hideByMaxtext(post);
	if(C[13] == 1) hideByRegexp(post);
}

function hideBySage(post) {
	if(isSage(post)) hidePost(post, 'sage');
}
function toggleSage() {
	toggleCfg(9);
	if(Cfg[9] == 1) forAll(hideBySage);
	else forAll(function(post) {if(isSage(post)) unhidePost(post)});
	storeHiddenPosts();
}

function hideByNoText(post) {
	if(post.Text == '') hidePost(post, 'no text');
}
function toggleNotext() {
	toggleCfg(11);
	if(Cfg[11] == 1) forAll(hideByNoText);
	else forAll(function(post) {if(post.Text == '') unhidePost(post)});
	storeHiddenPosts();
}

function hideByNoImage(post) {
	if(post.Img.snapshotLength == 0) hidePost(post, 'no image');
}
function toggleNoimage() {
	toggleCfg(12);
	if(Cfg[12] == 1) forAll(hideByNoImage);
	else forAll(function(post) {if(post.Img.snapshotLength == 0) unhidePost(post)});
	storeHiddenPosts();
}

function hideByTitle(post) {
	if(isTitled(post)) hidePost(post, 'theme field');
}
function toggleTitle() {
	toggleCfg(10);
	if(Cfg[10] == 1) forPosts(hideByTitle);
	else forPosts(function(post) {if(isTitled(post)) unhidePost(post)});
	storeHiddenPosts();
}

function hideByMaxtext(post) {
	var len = post.Text.replace(/\n/g, '').length;
	if(len >= parseInt(Cfg[15]))
		hidePost(post, 'text n=' + len + ' > max');
}
function toggleMaxtext() {
	var fld = $id('DESU_maxtext');
	if(isNaN(fld.value)) {
		$id('DESU_maxtext_ch').checked = false;
		saveCfg(14, 0);
		$alert('введите число знаков');
		return;
	}
	toggleCfg(14);
	saveCfg(15, fld.value);
	if(Cfg[14] == 1) forAll(hideByMaxtext);
	else forAll(function(post) {
		if(post.Text.replace(/\n/g, '').length >= parseInt(Cfg[15]))
		unhidePost(post);
	});
	storeHiddenPosts();
}

/*----------------------Hide/change posts by expressions---------------------*/

function htmlReplace(txt) {
	txt = !(ch._4ch || ch.krau) ? txt
		: txt.replace(/(^|>|\s)(https*:\/\/.*?)($|<|\s)/ig, '$1<a href="$2">$2</a>$3');
	var exp = getStored('DESU_RegExpr');
	if(Cfg[13] == 0 || !exp || !/\$rep /.test(exp)) return txt;
	exp = exp.split('\n');
	var i = exp.length;
	while(i--) {
		var x = exp[i];
		if(/\$rep /.test(x)) {
			var re = x.match(/\/.*[^\\]\/[ig]*/)[0];
			var l = re.lastIndexOf('/');
			var wrd = x.substr(x.indexOf(re) + re.length + 1);
			re = new RegExp(re.substr(1, l - 1), re.substr(l + 1));
			txt = txt.replace(re, wrd);
		}
	}
	return txt;
}

function wrongRegExp(txt) {
	txt = txt.split('\n');
	var i = txt.length;
	while(i--)
		if(/\$exp |\$rep /.test(txt[i])) try {
			x = txt[i].match(/\/.*[^\\]\/[ig]*/)[0];
			var l = x.lastIndexOf('/');
			new RegExp(x.substr(1, l - 1), x.substr(l + 1));
		} catch(e) {return txt[i]}
	return null;
}

function hideByRegexp(post) {
	var exp = doRegexp(post);
	if(exp) hidePost(post, 'match ' + exp.substring(0, 30) + '..');
}

function applyRegExp(txt) {
	var fld = $id('DESU_regexp');
	var val = fld.value;
	if(txt) {
		if(txt.trim() == '') return;
		toggleRegexp();
		var nval = '\n' + val;
		var ntxt = '\n' + txt;
		val = nval.indexOf(ntxt) > -1 ? nval.split(ntxt).join('') : val + ntxt;
	}
	val = val.replace(/[\r\n]+/g, '\n').replace(/^\n|\n$/g, '');
	var wrong = wrongRegExp(val);
	if(wrong) {$alert('Ошибка в ' + wrong); return}
	fld.value = val;
	forAll(function(post) {if(doRegexp(post)) unhidePost(post)})
	setStored('DESU_RegExpr', val);
	$id('DESU_regexp_ch').checked = val != '';
	if(val != '') {
		saveCfg(13, 1);
		forAll(hideByRegexp);
		storeHiddenPosts();
	} else saveCfg(13, 0);
}

function toggleRegexp() {
	var fld = $id('DESU_regexp');
	var val = fld.value.replace(/[\r\n]+/g, '\n').replace(/^\n|\n$/g, '');
	var wrong = wrongRegExp(val);
	if(!wrong) setStored('DESU_RegExpr', val);
	if(val != '' && !wrong) {
		fld.value = val;
		toggleCfg(13);
		if(Cfg[13] == 1) forAll(hideByRegexp);
		else forAll(function(post) {if(doRegexp(post)) unhidePost(post)})
		storeHiddenPosts();
	} else {
		if(wrong) $alert('Ошибка в ' + wrong);
		$id('DESU_regexp_ch').checked = false;
		saveCfg(13, 0);
	}
}

function doRegexp(post) {
	var exp = getStored('DESU_RegExpr');
	if(/\$name /.test(exp)) {
		var pname = $x('.//span[@class="commentpostername" or @class="postername"]', post);
		var ptrip = $x('.//span[@class="postertrip"]', post);
	}
	var ptitle = $x('.//span[@class="replytitle" or @class="filetitle"]', post);
	exp = exp.split('\n');
	var i = exp.length, x;
	while(i--) {
		x = exp[i];
		if(/^\$rep /.test(x)) continue;
		if(/^\$img /.test(x)) {
			if(post.Img.snapshotLength == 0) continue;
			x = doImgRegExp(post, x.substr(5));
			if(x) return x;
			continue;
		}
		if(/^\$name /.test(x)) {
			x = x.substr(6).split('!!');
			if(pname && x[0] != '' && pname.textContent.indexOf(x[0]) > -1 ||
				ptrip && x[1] != '' && ptrip.textContent.indexOf(x[1]) > -1) return exp[i];
			continue;
		}
		if(/^\$exp /.test(x)) {
			x = x.substr(5).match(/\/.*[^\\]\/[ig]*/)[0];
			var l = x.lastIndexOf('/');
			var re = new RegExp(x.substr(1, l - 1), x.substr(l + 1));
			if(post.Text.match(re)) return exp[i];
			if(post.innerHTML.match(re)) return exp[i];
			continue;
		}
		if(x == '$alltrip' && ptrip) return x;
		x = x.toLowerCase();
		if(ptitle && ptitle.textContent.toLowerCase().indexOf(x) > -1) return x;
		if(post.Text.toLowerCase().indexOf(x) > -1) return x;
	}
}

function regExpImage(post) {
	if(post.Img.snapshotLength == 0) {
		toggleNoimage();
		toggleChk($id('DESU_noimage_ch'));
	} else applyRegExp('$img =' + getImgWeight(post) + '@' + getImgSize(post));
}

function doImgRegExp(post, exp) {
	if(exp == '') return;
	var s = exp.split('@');
	var stat = s[0].substring(0, 1);
	var expK = s[0].substring(1);
	if(expK != '') {
		var imgK = getImgWeight(post);
		if((stat == '<' && imgK < expK) ||
			(stat == '>' && imgK > expK) ||
			(stat == '=' && imgK == expK))
			{if(!s[1]) return('image ' + exp)}
		else return;
	}
	if(s[1]) {
		var x = s[1].split(/[x×]/);
		var expW = x[0], expH = x[1];
		var sz = getImgSize(post).split(/[x×]/);
		var imgW = sz[0], imgH = sz[1];
		if((stat == '<' && imgW < expW && imgH < expH) ||
			(stat == '>' && imgW > expW && imgH > expH) ||
			(stat == '=' && (imgW == expW && imgH == expH)))
			return 'image ' + exp;
	}
}

function getImgInfo(post) {
	var path = './/em|.//span[@class="filesize" or @class="fileinfo"]';
	if(ch.same) path = './/div[@class="file_thread" or @class="file_reply"]//span[2]';
	return $x(path, post).textContent;
}

function getImgWeight(post) {
	var inf = getImgInfo(post).match(/\d+[\.\d\s|m|k|к]*[b|б]/i)[0];
	var w = parseFloat(inf.match(/[\d|\.]+/));
	if(/MB/.test(inf)) w = w*1000;
	if(/\d[\s]*B/.test(inf)) w = (w/1000).toFixed(2);
	return w;
}

function getImgSize(post) {
	return getImgInfo(post).match(/\d+[x×]\d+/)[0];
}

/*-------------------------Hide posts with similar text----------------------*/

function getWrds(post) {
	return post.Text.replace(/\s+/g, ' ').replace(/[\?\.\\\/\+\*\$\^\(\)\|\{\}\[\]!@#%_=:;<,-]/g, '').substring(0, 1000).split(' ');
}

function hideBySameText(post) {
	if(post.Text == '') {
		toggleNotext();
		toggleChk($id('DESU_notext_ch'));
		return;
	}
	var vis = post.Vis;
	forAll(function(target) {findSameText(target, post, vis, getWrds(post))});
	storeHiddenPosts();
}

function findSameText(post, origPost, origVis, origWords) {
	var words = getWrds(post);
	var origLen = origWords.length;
	if(words.length > origLen*2.5 || words.length < origLen*0.5) return;
	var matchCount = 0;
	var i = origWords.length;
	while(i--) {
		if(origWords.length > 6 && origWords[i].length < 3) {origLen--; continue}
		var j = words.length;
		while(j--) if((words[j] == origWords[i]) || (origWords[i].substring(0, 2) == '>>' && words[j].substring(0, 2) == '>>')) matchCount++;
	}
	if(!(matchCount >= origLen*0.5 && words.length < origLen*2.5)) return;
	$del($x('.//a[@class="DESU_postnote"]', post));
	if(origVis != 0) hidePost(post, ' same text as >>' + origPost.Num);
	else unhidePost(post);
}

/*--------------------------------Wipe detectors-----------------------------*/

function detectWipe(post) {
	if(Cfg[1] == 0) return null;
	var detectors = [
		detectWipe_sameLines,
		detectWipe_sameWords,
		detectWipe_specSymbols,
		detectWipe_longColumn,
		detectWipe_longWords,
		detectWipe_numbers,
		detectWipe_caseWords
	];
	for(var i = 0; i < detectors.length; i++) {
		var detect = detectors[i](post.Text);
		if(detect) return detect;
	}
}

function hideByWipe(post) {
	if(post.Vis == 0 || post.Vis == 1) return;
	var note = detectWipe(post);
	if(note != null) hidePost(post, note);
	else applyPostVisib(post, 1);
}

function detectWipe_sameLines(txt) {
	if(Cfg[2] == 0) return;
	var lines = txt.replace(/> /g, '').split(/[\s]*[\n][\s]*/);
	var len = lines.length;
	if(len < 5) return;
	var arr = [], n = 0;
	for(var i = 0; i < len; i++) {
		var w = lines[i];
		if(w.length > 0) {
			if(arr[w]) arr[w]++;
			else arr[w] = 1;
			n++;
		}
	}
	for(var x in arr)
		if(arr[x] > n/4 && arr[x] >= 5)
			return 'same lines: "' + x.substr(0, 20) + '" x' + parseInt(arr[x] + 1);
}

function detectWipe_sameWords(txt) {
	if(Cfg[3] == 0) return;
	txt = txt.replace(/[\s\.\?\!,>]+/g, ' ').toUpperCase();
	var words = txt.split(' ');
	var len = words.length;
	if(len <= 13) return;
	var arr = [], n = 0;
	for(var i = 0; i < len; i++) {
		var w = words[i];
		if(w.length > 1) {
			if(arr[w]) arr[w]++;
			else arr[w] = 1;
			n++;
		}
	}
	if(n <= 10) return;
	var keys = 0, pop = '', mpop = -1;
	for(var x in arr) {
		keys++;
		if(arr[x] > mpop) {mpop = arr[x]; pop = x}
		if(n > 25 && arr[x] > n/3.5)
			return 'same words: "' + x.substr(0, 20) + '" x' + arr[x];
	}
	pop = pop.substr(0, 20);
	if((n > 80 && keys <= 20) || n/keys > 7)
		return 'same words: "' + pop + '" x' + mpop;
}

function detectWipe_specSymbols(txt) {
	if(Cfg[4] == 0) return;
	txt = txt.replace(/\s+/g, '');
	var all = txt; 
	txt = txt.replace(/[0-9a-zа-я\.\?!,]/ig, '');
	var proc = txt.length/all.length;
	if(all.length > 30 && proc > 0.4)
		return 'specsymbols: ' + parseInt(proc*100) + '%';
}

function detectWipe_longColumn(txt) {
	if(Cfg[5] == 0) return;
	var n = 0;
	var rows = txt.split(/[\s]*[\n][\s]*/);
	var len = rows.length;
	if(len > 50) return 'long text x' + len;
	for(var i = 0; i < len; i++) {
		if(rows[i].length < 9) n++;
		else return;
	}
	if(n > 5) return 'columns x' + n;
}

function detectWipe_longWords(txt) {
	if(Cfg[6] == 0) return;
	txt = txt.replace(/(https*:\/\/.*?)(\s|$)/g, '').replace(/[\s\.\?!,>:;-]+/g, ' ');
	var words = txt.split(' ');
	var n = 0, all = '', lng = '';
	for(var i = 0, len = words.length; i < len; i++)
		if(words[i].length > 1) {
			n++;
			all += words[i];
			lng = words[i].length > lng.length ? words[i] : lng;
		}
	if((n == 1 && lng.length > 70) || (n > 1 && all.length/n > 12))
		return 'long words: "' + lng.substr(0, 20) + '.."';
}

function detectWipe_numbers(txt) {
	if(Cfg[7] == 0) return;
	txt = txt.replace(/\s+/g, ' ').replace(/((>>\d+)+|https*:\/\/.*?)(\s|$)/g, '');
	var len = txt.length;
	var proc = (len - txt.replace(/[0-9]/g, '').length)/len;
	if(len > 30 && proc > 0.4) return 'numbers: ' + parseInt(proc*100) + '%';
}

function detectWipe_caseWords(txt) {
	if(Cfg[8] == 0) return;
	txt = txt.replace(/[\s+\.\?!,-]+/g, ' ');
	var words = txt.split(' ');
	var len = words.length;
	if(len <= 4) return;
	var n = 0, all = 0, caps = 0;
	for(var i = 0; i < len; i++) {
		if(words[i].length < 5) continue;
		all++;
		var word = words[i];
		var up = word.toUpperCase();
		var lw = word.toLowerCase();
		var upc = 0, lwc = 0;
		var cap = word.match(/[a-zа-я]/ig);
		if(cap) {
			cap = cap.toString().trim();
			if(cap != '' && cap.toUpperCase() == cap) caps++;
		}
		for(var j = 0; j < word.length; j++) {
			if(up.charAt(j) == lw.charAt(j)) continue;
			if(word.charAt(j) == up.charAt(j)) upc++;
			else if(word.charAt(j) == lw.charAt(j)) lwc++;
		}
		var min = upc < lwc ? upc : lwc;
		if(min >= 2 && lwc + upc >= 5) n++;
	}
	if(n/all >= 0.3 && all > 8) return 'cAsE words: ' + parseInt(n/len*100) + '%';
	if(caps/all >= 0.3 && all > 5) return 'CAPSLOCK';
}


/*=============================================================================
								INITIALIZATION
=============================================================================*/

function replyForm(x) {
	var f = $x('descendant-or-self::form[@name="postform" or @id="postform" or @name="post"]', x);
	if(x) this.area = !ch.dc ? x : $up(x);
	if(!x || !f) return;
	this.on = true;
	this.form = f;
	this.tr = 'ancestor::tr[1]';
	this.recap = $x('.//input[@id="recaptcha_response_field"]', f);
	this.cap = $x('.//input[@name="' + (!ch._410 ? 'c' : 'f') + 'aptcha"]', f) || this.recap;
	this.txta = $x('.//textarea' + (ch.krau ? '[@name="internal_t"]' : '[last()]'), f);
	this.subm = $x('.//input[@type="submit"]', f);
	this.file = $x('.//input[@type="file"]', f);
	this.passw = $x('.//input[@type="password"]', f);
	this.rules = $x('.//*[@class="rules"]|.//ul', x);
	this.gothr = $x('.//tr[@id="trgetback"]', f)
		|| $x(this.tr, $x('.//input[@type="radio" or @name="gotothread"]', f));
	this.name = $x('.//input[@name="' + $case([
		ks || ch.dc || ch._4ch, 'name',
		ch.krau, 'internal_n',
		ch._2ch, 'akane',
		ch.iich, 'nya1'
	], 'field1') + '"]', f);
	this.mail = $x('.//input[@name="' + $case([
		ks, 'em',
		ch.dc || ch.krau, 'sage',
		ch._4ch, 'email',
		ch._2ch, 'nabiki',
		ch.iich, 'nya2',
		ch.wak, 'dont_bump'
	], 'field2') + '"]', f);
	this.subj = $x('.//input[@name="' + $case([
		ks || ch.dc, 'subject',
		ch.krau, 'internal_s',
		ch._4ch, 'sub',
		ch._2ch, 'kasumi',
		ch.iich, 'nya3'
	], 'field3') + '"]', f);
	if(this.name && (this.name.type == 'hidden' || $up(this.name).className == 'trap'))
		this.name = undefined;
	if(ch.same) {this.gothr = $x(this.tr, this.mail); this.mail = undefined}
}

function initBoard() {
	if(window.location == 'about:blank') return false;
	dm = window.location.host.match(/((?:(?:[^.]+\.)(?=org\.|net\.|com\.))?[^.]+\.[a-z]+)\.?$/)[0];
	ch = {
		_2ch: dm == '2-ch.ru',
		_0ch: dm == '0chan.ru',
		iich: dm == 'iichan.ru',
		dc: dm == 'dobrochan.ru',
		_4ch: dm == '4chan.org',
		krau: dm == 'krautchan.net',
		_410: dm == '410chan.ru',
		sib: dm == 'sibirchan.ru',
		wak: dm == 'wakachan.org',
		same: dm == 'samechan.ru'
	};
	ks = $xb('.//script[contains(@src, "kusaba")]');
	wk = $xb('.//script[contains(@src, "wakaba")]') || ch._4ch || dm == 'nahuya.ch';
	if(!ks && !wk && !ch.dc && !ch.krau) return false;
	if(!wk || ch._2ch || doc.domain.replace(/www\./, '') != dm)
		try {doc.domain = dm} catch(e) {dm = doc.domain}
	if(/DESU_submitframe/.test(window.name)) return false;
	var ua = window.navigator.userAgent;
	nav = {
		Firefox: /firefox|minefield/i.test(ua),
		Opera: /opera/i.test(ua),
		Chrome: /chrome/i.test(ua)
	};
	var gs = nav.Firefox && GM_setValue != null;
	var ls = typeof localStorage === 'object' && localStorage != null;
	var ss = nav.Opera && scriptStorage != null;
	sav = {
		GM: gs,
		local: ls && !ss && !gs,
		script: ss,
		cookie: !ls && !ss && !gs
	};
	dForm = $x('.//form[@id="delform" or @name="delform" or contains(@action, "delete")]');
	if(!dForm || $id('DESU_panel')) return false;
	brd = window.location.pathname.substr(1).split('/')[0];
	if(/\.html$|^res$/.test(brd)) brd = '';
	if(dm == 'dfwk.ru' && brd == '') brd = 'df';
	res = ch.krau ? 'thread-' : 'res/';
	isMain = window.location.pathname.indexOf('/' + res) < 0;
	favIcn = $x('.//head//link').href;
	pClass = ch.krau ? 'postreply' : 'reply';
	xPostRef = './/span[' + $case([
		ch.krau, '@class="postnumber"]',
		ch._4ch, 'starts-with(@id,"no")]'
	], '@class="reflink"]');
	xPostMsg = ch.dc ? './/div[@class="postbody"]' : './/blockquote';
	pr = new replyForm($x('.//div[@class="postarea" or @id="postarea"]') || $id('postform'));
	if(ch.krau && pr.on) {
		pr.area = $new('div', {'class': 'postarea'});
		$before(pr.form, [pr.area]);
		$append(pr.area, [pr.form, $x('.//form[@action="/paint"]'), $x('.//hr', dForm)]);
	}
	hasSage = !ch.iich && pr.mail;
	return true;
}

function initDelform() {
	$Del('.//script');
	$disp(dForm);
	try {
		var thrdivs = $X('.//div[' + $case([
			ch._2ch, 'starts-with(@id, "t") and not(contains(@id,"_info"))',
			ch.sib, 'not(@*)'
		], 'starts-with(@id, "thread")') + ']', dForm);
		if(thrdivs.snapshotLength == 0) {
			var html = dForm.innerHTML;
			if(ch.wak) html = html.replace(/<p><\/p>/ig, '');
			var thrds = html.split(/<br[^>]+left[^>]*>\s*<hr[^>]*>/i);
			var i = thrds.length - 1;
			while(i--) {
				var posts = thrds[i].split(/<table[^>]*>/i);
				var j = posts.length;
				while(j-- > 1) posts[j] = '<table id="post_' + getpNum(posts[j]) + '">' + posts[j];
				var tNum = getpNum(posts[0]);
				posts[0] = '<div id="oppost_' + tNum + '">' + posts[0] + '</div>';
				thrds[i] = '<div class="thread" id="thread_' + tNum + '">' + posts.join('') + '</div>';
			}
			dForm = $html(dForm, htmlReplace(thrds.join('<br clear="left"><hr>')));
			if(ch._4ch && isMain) {
				var pg = $x('.//table[@class="pages"]', $new('div', {'html': thrds[thrds.length - 1]}));
				dForm.replaceChild(pg, $x('.//table[@class="pages"]'));
				$each($X('.//form', pg), function(el) {
					$next(el).appendChild($attr(el, {'style': 'margin-bottom:0'}));
					el.appendChild($prev(el));
				});
			}
		} else {
			if(!ch.dc) $each(thrdivs, function(thr) {
				var tNum = thr.id.match(/\d+/) || $prev($x('.//label', thr)).name;
				$attr(thr, {'id': 'thread_' + tNum, 'class': 'thread'});
				if(!ch._0ch) {
					var op = $new('div', {'id': 'oppost_' + tNum});
					var el = thr.firstChild;
					while(el && el.tagName != 'TABLE' && !/replies/.test(el.id)) {
						op.appendChild(el);
						el = thr.firstChild;
					}
					if(el) {
						$each($X('.//td[@class="' + pClass + '"]', thr), function(el) {
							$up(el, 3).id = 'post_' + el.id.match(/\d+/);
						});
						$before($1(thr), [op]);
					} else thr.appendChild(op);
				}
			});
			if(ch._0ch) $each($X('.//div[@class="postnode"]', dForm), function(post) {
				var el = $x('.//td[@class="reply"]', post);
				post.id = el ? 'post_' + el.id.match(/\d+/) : 'oppost_' + $up(post).id.match(/\d+/);
			});
			var exp = getStored('DESU_RegExpr');
			if(ch._4ch || ch.krau || (Cfg[13] == 1 && exp && /\$rep /.test(exp)))
				dForm = $html(dForm, htmlReplace(dForm.innerHTML));
		}
	} catch(e) {$disp(dForm); return false}
	if(!nav.Chrome) $disp(dForm);
	xPost = ch._0ch ? 'div[starts-with(@id,"post")]': 'table[starts-with(@id,"post")]';
	xOPost = ch.dc ? 'div[starts-with(@class,"oppost")]' : 'div[starts-with(@id,"oppost")]';
	$each($X('.//' + xPost, dForm), function(post, i) {
		Posts[i] = post;
		post.isOp = false;
		post.Count = i + 2;
	});
	$each($X('.//' + xOPost, dForm), function(post, i) {
		oPosts[i] = post;
		post.isOp = true;
		post.Count = 1;
	});
	forAll(function(post) {
		post.Msg = $x(xPostMsg, post);
		post.Num = post.id.match(/\d+/);
		post.Text = getText(post.Msg).trim();
		post.Img = getImages(post);
		postByNum[post.Num] = post;
	});
	return true;
}


/*=============================================================================
									MAIN
=============================================================================*/

function doScript() {
	ajaxDate = new Date();
	var initTime = ajaxDate.getTime();
	oldTime = initTime;
	if(!initBoard()) return;		Log('initBoard');
	readCfg();						Log('readCfg');
	if(!initDelform()) return;		Log('initDelform');
	readPostsVisib();				Log('readPostsVisib');
	readThreadsVisib();				Log('readThreadsVisib');
	readFavorities();				Log('readFavorities');
	addControls();					Log('addControls');
	doChanges();					Log('doChanges');
	forAll(addPostButtons);			Log('addPostButtons');
	doRefPreview();					Log('doRefPreview');
	doRefMap();						Log('doRefMap');
	forAll(doPostFilters);			Log('doPostFilters');
	storeHiddenPosts();				Log('storeHiddenPosts');
	initNewPosts();					Log('initNewPosts');
	if(Cfg[16] == 1) {
		forPosts(mergeHidden);		Log('mergeHidden')}
	if(Cfg[26] != 0) {
		allImgExpander();
		forAll(expandHandleImg);	Log('expandImg')}
	if(isMain && !ch.dc) {
		forAll(expandPost);			Log('expandPost')}
	addMP3();						Log('addMP3');
	addYouTube();					Log('addYouTube');
	addImages();					Log('addImages');
	scriptStyles();					Log('scriptStyles');
	var endTime = oldTime - initTime;
	timeLog += '\n\nВсего: ' + endTime + 'мс';
	$id('DESU_process').textContent = 'Время обработки: ' + endTime + 'мс';
	if(pr.recap) refreshCapImg(pr);
	if(pr.cap) $rattr(pr.cap, 'onclick');
}

if(window.opera) $event(doc, {'DOMContentLoaded': doScript});
else doScript();
})(window.opera ? window.opera.scriptStorage : null);