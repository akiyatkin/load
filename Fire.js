export let Fire = {
	classes: {

	},
	init: (cls, name) => {  // Контекст события {res:, list: } в res хранятся все результаты
		if (!cls.__events) cls.__events = [];
		if (!cls.__events[name]) cls.__events[name] = {res: new Map, list: []};
		return cls.__events[name];
	},
	arg: (cls, name, obj) => { // Контекст конкретной подписки {res:, executed: } в res все обработанные результаты
		var context = Fire.init(cls, name);
		var arg = context.res.get(obj);
		if (!arg) context.res.set(obj, arg = {});
		return arg;
	},
	set: (cls, name, obj, res) => {
		let arg = Fire.arg(cls, name, obj);
		arg.executed = true;
		arg.res = res;
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
	hand: (cls, name, callback) => {
		var context = Fire.init(cls, name);
		context.list.push(callback);
		context.res.forEach((arg, obj) => { //Запускаем callback для всех прошлых событий
			if (arg.executed && arg.res == null) { //Проверка что событие реально выполнено и не null? Потому что иначе всё остановилось на прошлом подписчике
				let r = callback(obj)
				if (r && r.then) r.then( res => arg.res = res)
				else arg.res = r
			}
		});
	},
	tik: (cls, name, obj) => {
		let arg = Fire.arg(cls, name, obj);
		arg.executed = false;
		delete arg.res;
		delete arg.promise;
	}
}
export default Fire;