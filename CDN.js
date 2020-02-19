import Wait from './Wait.js';
import Load from './Load.js';
export let CDN = {
	init: async () => {
		CDN.init = () => { };
		await Wait();
		let conf = Config.get('load'), list, i, l, el, name;
		list = document.getElementsByTagName('script');
		for (i = 0, l = list.length; i < l; i++) {
			el = list[i];
			if (!el.src) continue;
			if (el.dataset.name) conf.cdnjs[el.dataset.name] = el.src;
			Load.set('script-src', el.src);
		}

		list = document.getElementsByTagName('link');
		for (let i = 0, l = list.length; i < l; i++) {
			el = list[i];
			if (el.rel != 'stylesheet') continue;
			if (!el.href) continue;
			if (el.dataset.name) conf.cdncss[el.dataset.name] = el.href;
			Load.set('css-src', el.href);
		}
		
	},
	js: async (name, src) => {
		await CDN.init();
		let cdns = Config.get('load').cdnjs;
		if (cdns[name]) {
			src = cdns[name];
		} else {
			if (!src) return;
			cdns[name] = src;
		}
		return Load.on('script-src', src);
	},
	css: async (name, src) => {
		await CDN.init();
		let cdns = Config.get('load').cdncss;
		
		if (cdns[name]) {
			src = cdns[name];
		} else {
			if (!src) return;
			cdns[name] = src;
		}
		return Load.on('css-src', src);
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