import { Fire } from '/vendor/akiyatkin/load/Fire.js'

let DOM = { ...Fire }

DOM.hand('load', () => {
	return new Promise(resolve => {
		if (~['loading'].indexOf(document.readyState)) {
			//ждём interactive
			document.addEventListener("DOMContentLoaded", async () => {
				resolve()
			})
		} else {
			resolve()
		}
	})
})

DOM.on('load')


export { DOM };