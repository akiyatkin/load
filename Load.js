import Fire from './Fire.js';
export {Fire};
export let Load = {
	on: (name, arg) => Fire.on(Load, name, arg),
	wait: () => {
		if (Load.wait.promise) return Load.wait.promise;
		return Load.wait.promise = new Promise((resolve, reject) => 
			document.addEventListener("DOMContentLoaded", () =>
			domready(() => window.Event.one('Controller.onshow', resolve))));
	},
	cdninit: async () => {
		await Load.wait();
		let conf = Config.get('load'), list, i, l, el, name;
		list = document.getElementsByTagName('script');
		for (i = 0, l = list.length; i < l; i++) {
			el = list[i];
			if (!el.src) continue;
			if (el.dataset.name) conf.cdnjs[el.dataset.name] = el.src;
			Fire.set(Load, 'script-src', el.src);
		}

		list = document.getElementsByTagName('link');
		for (let i = 0, l = list.length; i < l; i++) {
			el = list[i];
			if (el.type != 'stylesheet') continue;
			if (!el.href) continue;
			if (el.dataset.name) conf.cdncss[el.dataset.name] = el.src;
			Fire.set(Load, 'css-src', el.href);
		}
		Load.cdninit = () => { };
	},
	cdn: (name, src) => {
		if (src) return (/\.css/.test(src)) ? Load.cdncss(name, src) : Load.cdnjs(name, src);
		Load.cdncss(name); //css не ждём
		return Load.cdnjs(name); //Промис от js будем ждать
	},
	cdnjs: async (name, src) => {
		await Load.cdninit();
		let cdns = window.Config.get('load').cdnjs;
		if (cdns[name]) {
			src = cdns[name];
		} else {
			if (!src) return;
			cdns[name] = src;
		}
		return Load.on('script-src', src);
	},
	cdncss: async (name, src) => {
		await Load.cdninit();
		let cdns = window.Config.get('load').cdncss;
		if (cdns[name]) {
			src = cdns[name];
		} else {
			if (!src) return;
			cdns[name] = src;
		}
		return Load.on('css-src', src);
	}
}

Fire.handler(Load, 'import', src => {
	return Fire.on(Load, 'fetch-json', '-access').then( json => {
		src += (~src.indexOf('?')? '&' : '?') + 't=' + json.update;
		return import(src);
	});
});

Fire.handler(Load, 'import-default', src => {
	return Fire.on(Load, 'import', src).then( module => module.default );
});

Fire.handler(Load, 'script-src', src => {
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


Fire.handler(Load, 'css-src', src => {	
    let link  = document.createElement('link');
    link.rel  = 'stylesheet';
    link.type = 'text/css';
    link.href = src;

    document.getElementsByTagName('head')[0].appendChild(link);
});


Fire.handler(Load, 'fetch-json', src => {
	return fetch('/' + src).then( res => res.json());
});




export default Load;