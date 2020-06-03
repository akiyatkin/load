
let getContext = (that, name) => {  // Контекст события {res:, : } в res хранятся все результаты
	if (!that.__fire) that.__fire = {}
	if (that.__fire[name]) return that.__fire[name]
	return that.__fire[name] = new Context(that, name)
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

		this.start = false
		this.that = that
		this.name = name
		this.promise = this.createPromise()
	}
	createPromise() {
		return new Promise(resolve => this.resolve = (event) => {
			this.promise = this.createPromise()
			resolve()
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
	async checkonce () {
		this.once = activate(this.once)
		await Promise.all(this.once)		
	}
	checkrace (obj) {
		this.race.map(callback => callback(obj))
	}
	async checkbefore (obj) {
		await Promise.all(this.before.map(callback => callback(obj)))
	}
	async checkhand (obj) {
		return (await Promise.all(
			this.hand.map(callback => callback(obj))
		)).find(result => result != null)
	}
}

class Event {
	constructor(context, obj) {
		this.context = context
		this.obj = obj
		this.init()
	}
	init () {
		this.ready = this.createPromise((promise, result) => {
			promise.end = true
			promise.result = result
			this.context.resolve(this)
		})
	}
	createPromise(callback) {
		let resolve
		let promise = new Promise(r => resolve = r)	
		promise.resolve = result => {
			if (callback) callback(promise, result)
			resolve(result)
		}
		return promise
	}
	drop() {
		if (!this.start) return
		this.init()
		delete this.end
		delete this.start
		delete this.result
	}
}

let activate = (list) => { //При повторной акцивации выполнения повторного не будет, но результаты-промисы останутся
	return list.map(callback => callback()) //запустить нужно сразу
	.map(result => { return () => result } ) //каждый результат оборачиваем в функцию, 
}

let Fire = {
	async fire (name, obj) {
		let context = getContext(this, name)

		let event = context.getEvent(obj)

		if (event.start) return event.ready
		event.start = true
		context.start = true

		await context.checkonce()
		
		context.checkrace(obj)
		
		await context.checkbefore(obj)

		let result = await context.checkhand(obj)
		event.ready.resolve(result)
		
		context.done.map(callback => callback(obj, result))
		return event.ready
	},
	once (name, callback) {
		let context = getContext(this, name)
		if (!callback) return context.promise
		for (let [obj, event] of context.res) {//callback запускается раньше всех, до before c ожиданием. Промис вместе с результатом
			if (event.start) {
				let oneres = callback(event.obj)
				callback = () => oneres //Мы не знаем запущены ли once или нет сейчас, так как события генерируются с паузой
				break
			}
		}
		//промис контекста замедляет все события
		context.once.push(callback)
		context.promise.then(() => {
			context.all( () => {
				context.once = []
			})
		})
		return context.promise
	},
	async race (name, callback) {
		let context = getContext(this, name)
		if (context.start) {
			await context.checkonce()
			for (let [obj, event] of context.res) {
				if (!event.start) continue
				
				callback(obj)
			}
		}
		context.race.push(callback);
		return context.promise
	},
	hand (name, callback) {
		let context = getContext(this, name)
		//подписыавюсь на start
		context.hand.push(callback)
		//Хэнды запускаются одновременно при fire obj - 
		//если ready - значит всё запущено, если ready нет значит не запущено

		for (let [obj, event] of context.res) {
			if (!event.end) continue //Ещё не закончился Push добавлен в список callback Запуститься со всеми
			callback(obj) 
		}
		return context.promise
	}
}

export { Fire }
export default Fire