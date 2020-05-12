/*

null-promise выставляет любой obj резольва имеющийся и выставляя свой

fire

hand

__events = {
	context = show: {
		list: [callback]
		res: Map[
			event = layer: {
				end: true
				resolve: native
				promise: Promise
				start: true
			},
			event = null: {
				...
			}
		]
		
	}
}

*/
let Fire = {
	context: (cls, name) => {  // Контекст события {res:, list: } в res хранятся все результаты
		if (!cls.__events) cls.__events = [];
		if (cls.__events[name]) return cls.__events[name];
		let context = {
			res: new Map,
			list: []
		};
		return cls.__events[name] = context
	},
	tik: async (cls, name, obj = null) => {
		let context = Fire.context(cls, name)
		let event = context.res.get(obj)
		if (!event) return;
		if (!event.start) return //Ещё не запускался
		if (!event.end) await event.promise //Ждём когда выполнятся все обработчики evt и потом удаляем
		context.res.delete(obj)
	},
	set: async (cls, name, obj = null, res) => { //Было не выполнено и ожидается результат?
		let context = Fire.context(cls, name)
		let event = Fire.event(context, obj)
		if (event.end) {
			event.promise = Promise.resolve(res)
		} else if (event.start) {
			await event.promise
			await Fire.set(cls, name, obj, res)
		} else {
			event.start = true
			event.end = true
			event.resolve(res)
		}
	},
	train: async (list, obj = null, callback, i = 0, res) => {
		if (res != null) return callback(res) //Выход по требованию обработчика
		let hand = list[i++]
		if (!hand) {
			return callback()//Обработчики закончились, 
		}
		
		let r = hand(obj)
		
		if (r && r.then) return r.then(r => Fire.train(list, obj, callback, i, r))
		return Fire.train(list, obj, callback, i, r)
	},
	on: (cls, name, obj = null) => {
		let context = Fire.context(cls, name)
		let event = Fire.event(context, obj)
		
		if (event.start) return event.promise; //Уже запущен - возвращаем промис
		
		event.start = true
		//Последовательное выплнение подписчиков. ЧТобы бы то нибыло но в конце Promice resolve
		Fire.train(context.list, obj, res => {
			event.end = true
			event.resolve(res)
		})
		return event.promise;
	},
	ok: (cls, name, obj = null) => {
		let context = Fire.context(cls, name)
		let event = Fire.event(context, obj)
		
		if (event.start) return event.promise; //Уже запущен - возвращаем промис
		event.start = true
		//Последовательное выплнение подписчиков. ЧТобы бы то нибыло но в конце Promice resolve
		for (let callback of context.list) callback(obj)
		event.end = true
		event.resolve()
		return event.promise;
	},
	wait: (cls, name, obj = null) => {
		//wait только на конкретный объект
		var context = Fire.context(cls, name)
		let event = Fire.event(context, obj)
		return event.promise
	},
	event: (context, obj = null) => {
		let event = context.res.get(obj)
		if (!event) {
			context.res.set(obj, event = { })
			event.promise = new Promise(resolve => event.resolve = resolve)
		}
		return event
	},
	race: async (cls, name, callback) => {
		//race не обрывается, всё выполняется, результата у события нет
		var context = Fire.context(cls, name);
		context.list.push(callback);
		for (let [obj, event] of context.res) {
			if (!event.start) continue //ЕЩё не запускалось
			if (!event.end) continue //Ещё не закончился Push добавлен в список callback Запуститься со всеми
			callback(obj)
		}
	},
	hand: async (cls, name, callback) => {
		var context = Fire.context(cls, name);
		context.list.push(callback);
		for (let [obj, event] of context.res) {
			if (!event.start) continue //ЕЩё не запускалось
			if (!event.end) continue //Ещё не закончился Push добавлен в список callback Запуститься со всеми
			
			let res = await event.promise //Подписились в момент выполнения. Важно знать как это выполнение остановилось
			if (res != null) continue //Оборавалось раньше, не выполняем. Какой-то подписчик вернул для этого obj что-то
			let r = await new Promise(resolve => {
				Fire.train([callback], obj, resolve) //Текущий callback что-то вернул
			})
			if (r != null) await Fire.set(cls, name, obj, r) //Запишем это
		}
	},
	tikon: async (cls, name, obj = null) => {
		await Fire.tik(cls, name, obj)
		return Fire.on(cls, name, obj)
	},
	ontik: async (cls, name, obj = null) => {
		await Fire.on(cls, name, obj)
		return Fire.tik(cls, name, obj)
	},
	tikok: async (cls, name, obj = null) => {
		await Fire.tik(cls, name, obj)
		return Fire.ok(cls, name, obj)
	},
	oktik: async (cls, name, obj = null) => {
		await Fire.ok(cls, name, obj)
		return Fire.tik(cls, name, obj)
	}
}
export { Fire }
export default Fire