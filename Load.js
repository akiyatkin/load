import Fire from '/vendor/infrajs/event/Fire.js';
export {Fire};
export let Load = {

}


Fire.handler(Load, 'import?t', src => {
	Fire.on(Load, 'fetch', '-access/').next( json => {
		Fire.on(Load, 'import', '/vendor/akiyatkin/catkit/Catkit.js?t='+json.time).next( Catkit => {
			return Catkit;
		});
	});
});

export default Load;