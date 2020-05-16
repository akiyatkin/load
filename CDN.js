import { Load } from './Load.js'
import { DOM } from '/vendor/akiyatkin/load/DOM.js'
import { Config } from '/vendor/infrajs/config/Config.js'
import { Fire } from '/vendor/akiyatkin/load/Fire.js'
let CDN = {
	...Fire,
	load: name => CDN.on('load', name),
	init: name => CDN.on('init'),
	js: async (name, src) => {
		await CDN.init()
		let cdns = Config.get('load').cdnjs
		if (cdns[name]) {
			src = cdns[name]
		} else {
			if (!src) return
			cdns[name] = src
		}
		return Load.on('script', src)
	},
	css: async (name, src) => {
		await CDN.init()
		let cdns = Config.get('load').cdncss
		if (cdns[name]) {
			src = cdns[name]
		} else {
			if (!src) return
			cdns[name] = src
		}
		return Load.on('css', src)
	}
}

CDN.hand('load', async name => {
	await CDN.init()
	let conf = Config.get('load')
	if (conf.cdndeps[name]) {
		let list = conf.cdndeps[name].map(name => CDN.on('load', name) )
		await Promise.all(list)
	}
	CDN.css(name)
	await CDN.js(name)
})


CDN.hand('init', async () => {
	await DOM.wait('load')
	let conf, list, i, l, el, name, src, href
	list = document.getElementsByTagName('script');
	conf = Config.get('load');
	for (i = 0, l = list.length; i < l; i++) {
		el = list[i];
		src = el.getAttribute('src');
		if (!src) continue;
		await Load.onset('script', src);
		if (el.dataset.name) conf.cdnjs[el.dataset.name] = src;
	}

	list = document.getElementsByTagName('link');
	for (i = 0, l = list.length; i < l; i++) {
		el = list[i];
		if (el.rel != 'stylesheet') continue;
		href = el.getAttribute('href');
		if (!href) continue;
		if (el.dataset.name) conf.cdncss[el.dataset.name] = href;
		await Load.onset('css', href);
	}
})

export { CDN }