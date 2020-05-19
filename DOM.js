import { Fire } from '/vendor/akiyatkin/load/Fire.js'

let DOM = { ...Fire }

DOM.before('load', href => {
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

DOM.on('load', location.pathname + location.search) //"/vendor/akiyatkin/load/test.html?t=1589525936"

export { DOM };