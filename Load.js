import Fire from './Fire.js';
export {Fire};
export let Load = {
	on: (name, arg) => Fire.on(Load, name, arg)
}


Fire.handler(Load, 'fetch', src => {
	return fetch(src).then( res => res.json());
});

Fire.handler(Load, 'import', src => {
	return Fire.on(Load, 'fetch', '/-access/').then( json => {
		return import(src+'?t='+json.update);
	});
});
Fire.handler(Load, 'import default', src => {
	return Fire.on(Load, 'import', src).then( module => {
		return module.default;
	});
});

export default Load;