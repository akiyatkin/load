import Fire from './Fire.js'
export {Fire}
export let Load = {
	on: (name, arg) => Fire.on(Load, name, arg),
	handler: (name, func) => Fire.handler(Load, name, func),
	set: (name, arg, val) => Fire.set(Load, name, arg, val)
}

Fire.handler(Load, 'import', src => {
	//return Fire.on(Load, 'fetch-json', '-access').then( json => {
	//	src += (~src.indexOf('?')? '&' : '?') + 't=' + json.update
		return import(src)
	//});
});

Fire.handler(Load, 'import-default', src => {
	return Fire.on(Load, 'import', src).then( module => module.default )
});


Fire.handler(Load, 'fetch-json', src => {
	return fetch('/' + src).then( res => res.json())
});

export default Load;