import { Load } from './Load.js'
import { Config } from '/vendor/infrajs/config/Config.js'
import { Fire } from '/vendor/akiyatkin/load/Fire.js'
let CDN = {
	...Fire,
	js: async (name, src) => {
		await CDN.on('init')
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
		await CDN.on('init')
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

//Событие, чтобы не запускаться несколько раз при повторных вызовах
CDN.hand('load', async name => {
	await CDN.on('init')
	let conf = Config.get('load')
	if (conf.cdndeps[name]) {
		let list = conf.cdndeps[name].map(name => CDN.on('load', name) )
		await Promise.all(list)
	}
	CDN.css(name)
	await CDN.js(name)
})


CDN.hand('init', async () => {
	let conf, list, i, l, el, name, src, href
	list = document.getElementsByTagName('script');
	conf = Config.get('load');
	for (i = 0, l = list.length; i < l; i++) {
		el = list[i];
		src = el.getAttribute('src');
		if (!src) continue;
		await Load.keep('script', src);
		if (el.dataset.name) conf.cdnjs[el.dataset.name] = src;
	}

	list = document.getElementsByTagName('link');
	for (i = 0, l = list.length; i < l; i++) {
		el = list[i];
		if (el.rel != 'stylesheet') continue;
		href = el.getAttribute('href');
		if (!href) continue;
		if (el.dataset.name) conf.cdncss[el.dataset.name] = href;
		await Load.keep('css', href);
	}
})
window.CDN = CDN
export { CDN }