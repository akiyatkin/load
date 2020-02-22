import Load from './Load.js';
export let CDN = {
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
	init: async () => {
		CDN.init = () => { return CDN.init.promise };
		return CDN.init.promise = new Promise(async (resolve) => {
			let conf, list, i, l, el, name, src, href
			list = document.getElementsByTagName('script');
			for (i = 0, l = list.length; i < l; i++) {
				el = list[i];
				src = el.getAttribute('src');
				if (!src) continue;
				Load.set('script-src', src);
			}
			await Load.on('script-src', '/-collect/?js')
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
				Load.set('css-src', href);
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
		return Load.on('script-src', src)
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
		return Load.on('css-src', src)
	}
}

Load.handler('script-src', src => {
	return new Promise((resolve)=>{
		let s = document.createElement("script");
	    s.type = "text/javascript";
	    s.async = true;
	    s.defer = true;
	    s.onload = function () {
	    	resolve();
	    }
	    s.src = src;
	    document.getElementsByTagName('head')[0].appendChild(s);
	    /*let scripts = document.getElementsByTagName("script");
	    let n = scripts[scripts.length-1];//Нашли послений скрипт
	    n.parentNode.appendChild(s, n);*/
	});
	
});


Load.handler('css-src', src => {	
    let link  = document.createElement('link');
    link.rel  = 'stylesheet';
    link.type = 'text/css';
    link.href = src;

    document.getElementsByTagName('head')[0].appendChild(link);
});

export default CDN;