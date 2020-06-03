let createPromise = (callback) => {
	let resolve
	let promise = new Promise(r => resolve = r)	
	promise.resolve = result => {
		if (callback) callback(promise, result)
		resolve(result)
	}
	return promise
}
class Context {
	
	constructor(that, name) {
		this.res = new Map
		this.once = [] //одноразоыве события замедляющее генерацию, перед race
		this.race = [] //Запускаются первым без ожидания
		this.before = []
		this.hand = [] //Запускаются с ожиданием
		this.after = []
		this.done = []

		this.that = that
		this.name = name
		this.promise = createPromise()
		
	}
	// all (callback) {
	// 	//Промисы одних событий не блокируют другие события, по этому ждать надо по всем сразу
	// 	for (let [obj, event] of this.res) {
	// 		if (!event.promise.start) continue // не выполняется
	// 		if (event.promise.end) continue // выполнилось
	// 		return this.promise.then(()=>{
	// 			return this.all(callback)
	// 		})
	// 	}

	// 	if (callback) return callback()
	// }
	async all () {
		//Промисы одних событий не блокируют другие события, по этому ждать надо по всем сразу
		for (let [obj, event] of this.res) {
			if (!event.promise.start) continue // не выполняется
			if (event.promise.end) continue // выполнилось
			return this.promise.then(()=>{
				return this.all()
			})
		}
	}
	async checkonce () {
		this.once = activate(this.once)
		return Promise.allSettled(this.once.map(callback => callback()))		
	}
	
	getEvent (obj) {
		let event = this.res.get(obj)
		if (!event) this.res.set(obj, event = new Event(this, obj) )
		return event
	}
}

class Event {
	constructor(context, obj) {
		this.context = context
		this.obj = obj
		this.init()
	}
	init () {
		this.promise = createPromise((promise, result) => {
			promise.end = true
			promise.result = result
			this.context.promise.resolve()
		})
	}
	drop() {
		if (!this.promise.start) return
		this.init()
	}
	ready (callback) {
		//Подходит толкьо если событие выполнено
		if (!this.promise.end) {
			this.promise.then( () => this.ready(callback))
		} else {
			callback(this.result) //callback запускается в потоке, где точно событие выполнено
		}
	}
	step (callback) {
		//Подходит если событие не выолнялось или выполнено
		//Не можем обрабатывать результата, так как null может быть результатом или незапущенным событием
		return new Promise(resolve => {
			if (!this.promise.start) {
				let r = callback()
				resolve(r)
			} else {
				this.ready(() => {
					let r = callback()
					resolve(r)
				})
			}
		})
	}
}




let activate = (list) => { //При повторной акцивации выполнения повторного не будет, но результаты-промисы останутся
	return list.map(callback => callback()) //запустить нужно сразу
	.map(result => { return () => result } ) //каждый результат оборачиваем в функцию, 
}

let train = (list, obj, callback, i = 0, res) => {
	//train блокирует ноые события, значит обработчики поторно не будут запускаться и их промисы действительны во времени
	if (res != null) return callback(res) //Выход по требованию обработчика
	if (list.length == i) return callback() //Обработчики закончились, 
	let hand = list[i++]
	let r = hand(obj)
	if (r && r.then) return r.then(r => train(list, obj, callback, i, r))
	return train(list, obj, callback, i, r)
}
let testall = (list, callback) => {
	let promises = list.filter(res => res && res.then)
	if (promises.length) {
		Promise.all(promises).then(()=>{
			callback()
		})
	} else {
		callback()
	}
}
// let testall = (list, callback, i = 0) => {
// 	if (list.length == i) return callback() //Обработчики закончились, 
// 	let r = list[i++]
// 	if (r && r.then) return r.then(r => testall(list, callback, i))
// 	return testall(list, callback, i)
// }

let getContext = (that, name) => {  // Контекст события {res:, : } в res хранятся все результаты
	if (!that.__fire) that.__fire = {}
	if (that.__fire[name]) return that.__fire[name]
	return that.__fire[name] = new Context(that, name)
}

let Fire = {
	getContext (name) {
		return getContext(this, name)
	},
	on (name, obj) { return this.fire(name, obj)},
	// fire (name, obj) {
	// 	//Если есть объект события, то с сохранением иначе с повторениями
	// 	return this.emit(name, obj)
	// 	//return typeof obj == 'undefined' ? this.puff(name, obj) : this.emit(name, obj)
	// },
	puff (name, obj) {
		let context = getContext(this, name)
		let event = context.getEvent(obj)
		if (event.promise.start && !event.promise.end) return event.promise
		return this.emit(name, obj)
	},
	emit (name, obj) {
		let context = getContext(this, name)
		let event = context.getEvent(obj)
		return event.step(() => {
			event.drop() 
			return this.fire(name, obj)
		})
	},
	async fire (name, obj) {
		let context = getContext(this, name)

		let event = context.getEvent(obj)

		if (event.promise.start) return event.promise
		event.promise.start = true
		context.promise.start = true
		await context.checkonce()
		
		context.race.map(callback => callback(obj))
		
		await Promise.all(context.before.map(callback => callback(obj)))

		let result = (await Promise.all(
			context.hand.map(callback => callback(obj))
		)).find(result => result != null)

		await Promise.all(context.after.map(callback => callback(obj)))
		event.promise.resolve(result)
		
		context.done.map(callback => callback(obj, result))
		return event.promise
	},
	
	async elan (name, obj) {
		//fire и сбрасываются события для других объектов
		let context = getContext(this, name)
		let event = context.getEvent(obj)
		return event.step(async () => {
			if (event.promise.start) return event.promise
			await context.all()
			for (let [obj, event] of context.res) {
				event.drop()
			}
			return this.fire(name, obj)
		})
	},
	
	/*is (name, obj) {
		return this.on(name, obj)
	},*/

	async tik (name) {
		let context = getContext(this, name)
		await context.all()
		for (let [obj, event] of context.res) {
			event.drop()
		}
	},

	/*all (name, callback) {
		let context = getContext(this, name)
		if (!context.res.length) return context.promise.then(event => {
			//Один выполнился, но могли и ноыве появится в его потоке, надо ждать всех
			return context.all(callback)
		})
		return context.all(callback)
	},*/
	

	drop (name, obj) {
		let context = getContext(this, name)
		let event = context.getEvent(obj)
		return event.step(() => {
			event.drop()
		})
	},
	achieve (name, obj, res) {
		let context = getContext(this, name)
		let event = context.getEvent(obj)
		return event.step(() => {
			event.drop()
			event.promise.start = true
			context.promise.start = true
			context.race.map(callback => callback(obj))
			event.resolve(res)
			context.done.map(callback => callback(obj, res))
		})
	},
	async race (name, callback) {
		let context = getContext(this, name)
		if (context.promise.start) {
			await context.checkonce()
			for (let [obj, event] of context.res) {
				if (!event.promise.start) continue
				
				callback(obj)
			}
		}
		context.race.push(callback);
		//return context.promise
	},
	before (name, callback) {
		let context = getContext(this, name)
		context.before.push(callback)
		for (let [obj, event] of context.res) {
			if (!event.promise.start) continue
			callback(obj)
		}
		//return context.promise
	},
	hand (name, callback) {
		let context = getContext(this, name)
		//подписыавюсь на start
		context.hand.push(callback)
		//Хэнды запускаются одновременно при fire obj - 
		//если ready - значит всё запущено, если ready нет значит не запущено

		for (let [obj, event] of context.res) {
			if (!event.promise.end) continue //Ещё не закончился Push добавлен в список callback Запуститься со всеми
			callback(obj) 
		}
		//return context.promise
	},
	after (name, callback) {
		let context = getContext(this, name)
		context.after.push(callback);
		for (let [obj, event] of context.res) {
			if (!event.promise.end) continue //Ещё не закончился Push добавлен в список callback Запуститься со всеми
			callback(obj) 
		}
	},
	
	async done (name, callback) {
		let context = getContext(this, name)
		if (context.promise.start) {
			await context.checkonce()
		}

		context.done.push(callback);
		for (let [obj, event] of context.res) {
			if (!event.promise.end) continue
			callback(obj, event.result)
		}
		//return context.promise
	},
	async once (name, callback) {
		let context = getContext(this, name)
		if (!callback) return context.promise
		context.once.push(callback)

		if (context.promise.start) await context.checkonce()
		//промис контекста замедляет все события

		await context.all()
		context.once = []
		return context.promise
	},
	wait (name, obj) {
		let context = getContext(this, name)
		let event = context.getEvent(obj)
		return event.promise
		
	}
}

export { Fire }
export default Fire