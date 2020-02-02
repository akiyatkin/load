import Fire from './Fire.js';
export {Fire};
export let Load = {
	on: (name, arg) => Fire.on(Load, name, arg)
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
	var s = document.createElement("script");
    s.type = "text/javascript";
    s.async = false;
    s.defer = false;
    s.src = src;
    let scripts = document.getElementsByTagName("script");
    var n = scripts[scripts.length-1];//Нашли послений скрипт
    n.parentNode.appendChild(s, n);
});


Fire.handler(Load, 'fetch-json', src => {
	return fetch('/' + src).then( res => res.json());
});




export default Load;