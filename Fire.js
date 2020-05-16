/*

null-promise выставляет любой obj резольва имеющийся и выставляя свой

fire

hand

__fire = {
	context = show: {
		hand: [callback]
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

let train = (list, obj, callback, i = 0, res) => {
	if (res != null) return callback(res) //Выход по требованию обработчика
	let hand = list[i++]
	if (!hand) return callback() //Обработчики закончились, 
	let r = hand(obj)
	if (r && r.then) return r.then(r => train(list, obj, callback, i, r))
	return train(list, obj, callback, i, r)
}
class Event {
	constructor() {
		this.promise = this.createPromise()
	}
	createPromise() {
		return new Promise(resolve => {
			this.resolve = (result) => {
				this.end = true
				this.result = result
				resolve(result)
			}
		})
	}
	tik() {
		this.promise = this.createPromise()
		delete this.end
		delete this.start
		delete this.result
	}
}

let getEvent = (context, obj) => {
	let event = context.res.get(obj)
	if (!event) {
		context.res.set(obj, event = new Event() )
	}
	return event
}

let ready = (event, cb) => {
	if (!event.end) {
		event.promise.then( () => ready(event, cb))
	} else {
		cb() //callback запускается в потоке, где точно событие выполнено
	}
}


let step = (event, callback) => {
	return new Promise(resolve => {
		if (!event.start) {
			callback()
			resolve()
		} else {
			ready(event, () => {
				callback()
				resolve()
			})
		}
	})
}

let getContext = (that, name) => {  // Контекст события {res:, : } в res хранятся все результаты
	if (!that.__fire) that.__fire = {}
	if (that.__fire[name]) return that.__fire[name]
	let context = {
		res: new Map,
		race: [], //Запускаются перыми без ожидания
		before: [],
		hand: [], //Запускаются с ожиданием
		after: [],
		done: []
	}
	return that.__fire[name] = context
}

let Fire = {
	tik: function(name, obj) {
		let context = getContext(this, name)
		let event = getEvent(context, obj)
		return step(event, () => {
			event.tik() 
		})
	},

	on: function (name, obj) {
		let context = getContext(this, name)
		let event = getEvent(context, obj)
		if (event.start) return event.promise
		event.start = true
		
		context.race.map(callback => callback(obj))
		Promise.all(context.before.map(callback => callback(obj))).then( () => {
			train(context.hand, obj, res => {
				Promise.all(context.after.map(callback => callback(obj, res))).then( () => {
					event.resolve(res)
					context.done.map(callback => callback(obj, res))
				})
			})
		})

		return event.promise;
	},

	onset: async function (name, obj, res) {
		await this.tik(name, obj)
		let context = getContext(this, name)	
		let event = getEvent(context, obj)
		return step(event, () => {
			event.tik()
			event.start = true
			context.race.map(callback => callback(obj))
			event.resolve(res)
			context.done.map(callback => callback(obj, res))
		})
	},
	race: function(name, callback) {
		//race не обрывается, всё выполняется, результата у события нет
		var context = getContext(this, name);
		context.race.push(callback);
		for (let [obj, event] of context.res) {
			if (!event.start) continue
			callback(obj)
		}
	},
	before: function(name, callback) {
		var context = getContext(this, name)
		context.before.push(callback)
		for (let [obj, event] of context.res) {
			if (!event.start) continue
			callback(obj)
		}
	},
	hand: function (name, callback) {
		var context = getContext(this, name)
		context.hand.push(callback)
		
		for (let [obj, event] of context.res) {
			if (!event.start) continue //ЕЩё не запускалось
			if (!event.end) continue //Ещё не закончился Push добавлен в список callback Запуститься со всеми

			let res = event.result //Уже выполнено. Важно знать как это выполнение остановилось
			if (res != null) continue //Оборавалось раньше, не выполняем. Какой-то подписчик вернул для этого obj что-то
			
			event.tik()
			event.start = true
			let lengthafter = context.after.length
			let lengthdone = context.done.length
			train([callback], obj, res => {
				train(context.after, obj, () => {
					event.resolve(res)
					for (let i = lengthdone; i < context.done.length; i++) {
						context.done[i](obj, res)
					}
				}, lengthafter, res)
			})
			
		}
	},
	after: function(name, callback) {
		var context = getContext(this, name);
		context.after.push(callback);
		for (let [obj, event] of context.res) {
			if (!event.end) continue
			let result = event.result
			event.tik()
			event.start = true

			let lengthdone = context.done.length
			train(context.after, obj, () => {
				event.resolve(result)
				for (let i = lengthdone; i < context.done.length; i++) {
					context.done[i](obj, result)
				}
			}, context.after.length-1, result)			
		}
	},
	done: function (name, callback) {
		//race не обрывается, всё выполняется, результата у события нет
		var context = getContext(this, name);
		context.done.push(callback);
		for (let [obj, event] of context.res) {
			if (!event.end) continue
			callback(obj, event.result)
		}
	},
	wait: function(name, obj) {
		let context = getContext(this, name)
		let event = getEvent(context, obj)
		return event.promise
	},

	
	
	tikon: async function(name, obj) {
		await this.tik(name, obj)
		return this.on(name, obj)
	},
	ontik: async function(name, obj) {
		await this.on(name, obj)
		return this.tik(name, obj)
	}
}

export { Fire }
export default Fire