import { Fire } from '/vendor/akiyatkin/load/Fire.js'


let Controller
let DOM = { ...Fire }

DOM.fire('load')


DOM.once('check', async () => {
	Controller = (await import('/vendor/infrajs/controller/src/Controller.js')).Controller
})
DOM.hand('check', async () => {
	await Controller.check()
})

globalThis.DOM = DOM
export { DOM }