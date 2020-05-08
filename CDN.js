import {Load} from './Load.js'
import {Wait} from './Wait.js'
import {Config} from '/vendor/infrajs/config/Config.js'
let CDN = {
	wait: () => {
		if (CDN.wait.promise) return Wait.promise;
		return CDN.wait.promise = new Promise((resolve) => {
			if (document.readyState == 'loading') {
				document.addEventListener("DOMContentLoaded", resolve)
			} else {
				resolve()
			}
		})
	},
	init: () => {
		CDN.init = () => { return CDN.init.promise };
		return CDN.init.promise = new Promise(async (resolve) => {
			await Wait()
			let conf, list, i, l, el, name, src, href
			list = document.getElementsByTagName('script');
			for (i = 0, l = list.length; i < l; i++) {
				el = list[i];
				src = el.getAttribute('src');
				if (!src) continue;
				Load.set('script', src);
			}
			await Load.on('script', '/-collect/?js')
			conf = Config.get('load');
			for (i = 0, l = list.length; i < l; i++) {
				el = list[i];
				src = el.getAttribute('src');
				if (!src) continue;
				if (el.dataset.name) conf.cdnjs[el.dataset.name] = src;
			}


			list = document.getElementsByTagName('link');
			for (i = 0, l = list.length; i < l; i++) {
				el = list[i];
				if (el.rel != 'stylesheet') continue;
				href = el.getAttribute('href');
				if (!href) continue;
				if (el.dataset.name) conf.cdncss[el.dataset.name] = href;
				Load.set('css', href);
			}
			resolve();
		});
	},
	load: async (name) => {
		await CDN.init();
		let conf = Config.get('load')
		if (conf.cdndeps[name]) {
			let list = conf.cdndeps[name].map(CDN.load)
			await Promise.all(list)
		}
		CDN.css(name)
		await CDN.js(name)
	},
	js: async (name, src) => {
		await CDN.init();
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

export {CDN}
export default CDN