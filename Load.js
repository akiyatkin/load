

Event.handler(Load, 'import?t', src => {
	Event.fire(Load, 'fetch', '-access/').next( json => {
		Event.fire(Load, 'import', '-catkit/Catkit.js?t='+json.time).next( Catkit => {
			return Catkit;
		});
	});
});