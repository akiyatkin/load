
class Context {
	res = new Map
	once = [] //одноразоыве события замедляющее генерацию, перед race
	race = [] //Запускаются первым без ожидания
	before = []
	hand = [] //Запускаются с ожиданием
	after = []
	done = []
	constructor(that, name) {
		this.that = that
		this.name = name
		this.promise = this.createPromise()
	}
	createPromise() {
		return new Promise(resolve => this.resolve = (event) => {
			this.promise = this.createPromise()
			resolve(event)
		})
	}
	all (callback) {
		//Промисы одних событий не блокируют другие события, по этому ждать надо по всем сразу
		for (let [obj, event] of this.res) {
			if (!event.start) continue // не выполняется
			if (event.end) continue // выполнилось
			return this.promise.then(()=>{
				return this.all(callback)
			})
		}

		if (callback) return callback()
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
		this.promise = this.createPromise()
	}
	createPromise() {
		return new Promise(resolve => {
			this.resolve = (result) => {
				this.end = true
				this.result = result

				this.context.resolve(result)
				resolve(result)
			}
		})
	}
	drop() {
		if (!this.start) return
		this.promise = this.createPromise()
		delete this.end
		delete this.start
		delete this.startpromise
		delete this.result
	}
	ready (callback) {
		//Подходит толкьо если событие выполнено
		if (!this.end) {
			this.promise.then( () => this.ready(callback))
		} else {
			callback(this.result) //callback запускается в потоке, где точно событие выполнено
		}
	}
	step (callback) {
		//Подходит если событие не выолнялось или выполнено
		//Не можем обрабатывать результата, так как null может быть результатом или незапущенным событием
		return new Promise(resolve => {
			if (!this.start) {
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






let train = (list, obj, callback, i = 0, res) => {
	//train блокирует ноые события, значит обработчики поторно не будут запускаться и их промисы действительны во времени
	if (res != null) return callback(res) //Выход по требованию обработчика
	if (list.length == i) return callback() //Обработчики закончились, 
	let hand = list[i++]
	let r = hand(obj)
	if (r && r.then) return r.then(r => train(list, obj, callback, i, r))
	return train(list, obj, callback, i, r)
}
let testall = (list, callback, i = 0) => {
	if (list.length == i) return callback() //Обработчики закончились, 
	let r = list[i++]
	if (r && r.then) return r.then(r => testall(list, callback, i))
	return testall(list, callback, i)
}

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
		if (event.start && !event.end) return event.promise
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
		if (event.start) return event.promise
		event.start = true
		Promise.resolve().then(() => {	
			event.startpromise = true
			let list = context.once.map(callback => callback())
			context.once.length = 0
			testall(list, () => {
				context.race.map(callback => callback(obj))
				testall(context.before.map(callback => callback(obj)), () => {
					train(context.hand, obj, res => {
						testall(context.after.map(callback => callback(obj, res)), () => {
							event.resolve(res)
							context.done.map(callback => callback(obj, res))
						})
					})
				})
			})
		})

		return event.promise
	},
	/*or (name, obj) {
		let context = getContext(this, name)
		let event = context.getEvent(obj)
		return event.step(() => {
			if (event.start) return event.promise
			return context.all(() => {
				for (let [obj, event] of context.res) {
					event.drop()
				}
				return this.on(name, obj)
			})
		})
	},*/
	
	/*is (name, obj) {
		return this.on(name, obj)
	},*/

	tik (name) {
		let context = getContext(this, name)
		return context.all(()=> {
			for (let [obj, event] of context.res) {
				event.drop()
			}
		})
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
			event.start = true
			event.startpromise = true
			context.race.map(callback => callback(obj))
			event.resolve(res)
			context.done.map(callback => callback(obj, res))
		})
	},
	race (name, callback) {
		//race не обрывается, всё выполняется, результата у события нет
		let context = getContext(this, name)
		context.race.push(callback);
		for (let [obj, event] of context.res) {
			if (!event.start) continue
			if (!event.startpromise) continue
			callback(obj)
		}
		return context.promise
	},
	before (name, callback) {
		let context = getContext(this, name)
		context.before.push(callback)
		for (let [obj, event] of context.res) {
			if (!event.start) continue
			callback(obj)
		}
		return context.promise
	},
	hand (name, callback) {
		let context = getContext(this, name)
		context.hand.push(callback)
		
		for (let [obj, event] of context.res) {
			if (!event.start) continue //ЕЩё не запускалось
			if (!event.end) continue //Ещё не закончился Push добавлен в список callback Запуститься со всеми

			let result = event.result //Уже выполнено. Важно знать как это выполнение остановилось
			if (result != null) continue //Оборавалось раньше, не выполняем. Какой-то подписчик вернул для этого obj что-то
			
			event.drop()
			event.start = true
			event.startpromise = true
			let lengthafter = context.after.length
			let lengthdone = context.done.length
			train([callback], obj, result => {
				train(context.after, obj, () => {
					event.resolve(result)
					for (let i = lengthdone; i < context.done.length; i++) {
						context.done[i](obj, result)
					}
				}, lengthafter, result)
			})
			
		}
		return context.promise
	},
	after (name, callback) {
		let context = getContext(this, name)
		context.after.push(callback);
		for (let [obj, event] of context.res) {
			if (!event.end) continue
			let result = event.result
			event.drop()
			event.start = true
			event.startpromise = true
			let lengthdone = context.done.length
			train(context.after, obj, () => {
				event.resolve(result)
				for (let i = lengthdone; i < context.done.length; i++) {
					context.done[i](obj, result)
				}
			}, context.after.length-1, result)			
		}
		return context.promise
	},
	
	done (name, callback) {
		let context = getContext(this, name)
		context.done.push(callback);
		for (let [obj, event] of context.res) {
			if (!event.end) continue
			callback(obj, event.result)
		}
		return context.promise
	},
	once (name, callback) {
		let context = getContext(this, name)
		for (let [obj, event] of context.res) {//callback запускается раньше всех, до before c ожиданием. Промис вместе с результатом
			if (event.start) {
				let oneres = callback()
				callback = () => oneres //Мы не знаем запущены ли once или нет сейчас, так как события генерируются с паузой
				break
			}
		}
		//промис контекста замедляет все события
		context.once.push(callback)
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