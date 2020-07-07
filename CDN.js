import { Load } from './Load.js'
import { Config } from '/vendor/infrajs/config/Config.js'
import { Fire } from '/vendor/akiyatkin/load/Fire.js'
let CDN = {
	...Fire,
	//Методы вместо событий, так как требуется 2 параметра
	//Для событий нужен 1 идентичный объект, которого нет с name, src
	//Но эти методы внутри вызывают событие уже с 1 параметром, по этому возможны дублирующие вызовы
	js: async (name, src) => {
		await CDN.fire('init')
		let cdns = Config.get('load').cdnjs
		if (cdns[name]) {
			src = cdns[name]
		} else {
			if (!src) return
			cdns[name] = src //Запомнили соответствие name => src
		}
		return Load.fire('script', src)
	},
	css: async (name, src) => {
		await CDN.fire('init')
		let cdns = Config.get('load').cdncss
		if (cdns[name]) {
			src = cdns[name]
		} else {
			if (!src) return
			cdns[name] = src
		}
		return Load.fire('css', src)
	}
}

//Событие, чтобы не запускаться несколько раз при повторных вызовах
CDN.hand('load', async name => {
	await CDN.fire('init')
	let conf = Config.get('load')
	if (conf.cdndeps[name]) {
		let list = conf.cdndeps[name].map(name => CDN.fire('load', name))
		await Promise.all(list)
	}
	CDN.css(name)
	await CDN.js(name)
})


CDN.hand('init', async () => {
	let conf, list, i, l, el, name, src, href
	list = document.getElementsByTagName('script')
	conf = Config.get('load')
	for (i = 0, l = list.length; i < l; i++) {
		el = list[i];
		src = el.getAttribute('src')
		if (!src) continue
		Load.keep('script', src)
		if (el.dataset.name) {
			conf.cdnjs[el.dataset.name] = src
		} else { //надо ли сделать предупреждение
			if (!/^http/.test(href)) continue
			if (Object.values(conf.cdnjs).includes(src)) continue
			console.warn('CDN', 'Укажите data-name для тега script', el)	
		}
	}

	list = document.getElementsByTagName('link')
	for (i = 0, l = list.length; i < l; i++) {
		el = list[i]
		if (el.rel != 'stylesheet') continue
		href = el.getAttribute('href')
		if (!href) continue
		Load.keep('css', href) 
		if (el.dataset.name) {
			conf.cdncss[el.dataset.name] = href
		} else { //надо ли сделать предупреждение
			if (!/^http/.test(href)) continue
			if (Object.values(conf.cdncss).includes(href)) continue
			console.warn('CDN', 'Укажите data-name для тега link', el)
		}

		
	}
})
window.CDN = CDN
export { CDN }