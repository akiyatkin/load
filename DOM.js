import { Fire } from '/vendor/akiyatkin/load/Fire.js'
let DOM = {
	on: (...params) => Fire.on(DOM, ...params),
	ok: (...params) => Fire.ok(DOM, ...params),
	tikon: (...params) => Fire.tikon(DOM, ...params),
	tikok: (...params) => Fire.tikok(DOM, ...params),
	hand: (...params) => Fire.hand(DOM, ...params),
	wait: (...params) => Fire.wait(DOM, ...params)
}

if (~['loading'].indexOf(document.readyState)) {
	//ждём interactive
	document.addEventListener("DOMContentLoaded", async () => {
		DOM.ok('show')
	})
} else {
	DOM.ok('show')
}



/*let DOM = () => {
	if (DOM.promise) return DOM.promise;
	return DOM.promise = new Promise(resolve => {
		//if (~['complete'].indexOf(document.readyState)) {
        if (~['loading'].indexOf(document.readyState)) {
            //ждём interactive
			document.addEventListener("DOMContentLoaded", resolve)
		} else {
            resolve()
            
		}
	})
}*/
export { DOM };