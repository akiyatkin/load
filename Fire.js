export let Fire = {
	classes: {

	},
	init: (cls, name) => {
		if (!cls.__events) cls.__events = [];
		if (!cls.__events[name]) cls.__events[name] = {res: new Map, list: []};
		return cls.__events[name];
	},
	on: (cls, name, obj) => {
		var context = Fire.init(cls, name);
		
		var arg = context.res.get(obj);
		if (!arg) context.res.set(obj, arg = {});
		if (arg.executed) return Promise.resolve(arg.res);

		if (arg.promise) return arg.promise;

		let i = 0;
		let promise = (async function test(res) {
			if (res != null) return res;
			let hand = context.list[i++];
			if (!hand) return;
			var r = hand(obj);
			if (r != null && r.then) return r.then(test);
			return test(r);
		})();

		promise.then( res => {
			arg.executed = true;
			arg.res = res
		});
		return arg.promise = promise;
	},
	handler: (cls, name, callback) => {
		var context = Fire.init(cls, name);
		context.list.push(callback);
		context.res.forEach(arg => {
			if (arg.executed && arg.res == null) callback(context.obj).then( res => context.res = res);	
		});
	},
	tik: (cls, name, obj) => {

	}
}

export default Fire;