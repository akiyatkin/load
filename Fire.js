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
	tik: async (cls, name, obj) => {
		let context = Fire.context(cls, name)
		let event = context.res.get(obj)
		if (!event) return;
		if (!event.start) return //Ещё не запускался
		await event.promise //Ждём когда выполнятся все обработчики evt и потом удаляем
		context.res.delete(obj)
	},
	set: async (cls, name, obj, res) => { //Было не выполнено и ожидается результат?
		let context = Fire.context(cls, name)
		let event = context.res.get(obj)
		if (!event) {
			context.res.set(obj, event = {})
			event.promise = new Promise(resolve => event.resolve = resolve)
		}
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
	train: async (list, obj, i = 0, res) => {
		if (res != null) return res //Выход по требованию обработчика
		let hand = list[i++]
		if (!hand) return //Обработчики закончились
		let r = hand(obj)
		if (r && r.then) return r.then(r => Fire.train(list, obj, i, r))
		return Fire.train(list, obj, i, r)
	},
	on: (cls, name, obj) => {
		let context = Fire.context(cls, name)
		let event = context.res.get(obj)
		if (!event) {
			context.res.set(obj, event = {})
			event.promise = new Promise(resolve => event.resolve = resolve)
		}
		if (event.start) return event.promise; //Уже запущен - возвращаем промис
		//Последовательное выплнение подписчиков. ЧТобы бы то нибыло но в конце Promice resolve
		event.start = true
		Fire.train(context.list, obj).then((res) => {
			event.end = true
			event.resolve(res)
		})

		return event.promise;
	},
	wait: (cls, name, obj) => {
		var context = Fire.context(cls, name);
		var event = context.res.get(obj);
		if (!event) {
			context.res.set(obj, event = {})
			event.promise = new Promise(resolve => event.resolve = resolve)
		}
		return event.promise
	},
	hand: async (cls, name, callback) => {
		var context = Fire.context(cls, name);
		context.list.push(callback);
		for (let { obj, event } in context.res.entries()) {
			if (!event.start) continue //ЕЩё не запускалось
			if (!event.end) continue //Ещё не закончился Push добавлен в список callback Запуститься со всеми
			//Запущен - а закончен ли?
			//list.push мог попать в уже запущенный train

			let res = await event.promise //Подписились в момент выполнения. Важно знать как это выполнение остановилось
			if (res != null) continue //Оборавалось раньше, не выполняем. Какой-то подписчик вернул false
			let r = await Fire.train([callback], obj)
			if (r != null) await Fire.set(cls, name, obj, r)
		}
	},
	fire: (cls, name, obj) => {
		return Fire.on(cls, name, obj).then(() => Fire.tik(cls, name, obj))
	},
	tikon: async (cls, name, obj) => {
		await Fire.tik(cls, name, obj)
		return Fire.on(cls, name, obj)
	}
}
export { Fire }
export default Fire