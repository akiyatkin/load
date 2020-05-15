import { Fire } from '/vendor/akiyatkin/load/Fire.js'
let DOM = {
	ok: (...params) => Fire.ok(DOM, ...params),
	race: (...params) => Fire.race(DOM, ...params),
	tikok: (...params) => Fire.tikok(DOM, ...params),
	wait: (...params) => Fire.wait(DOM, ...params)
}

if (~['loading'].indexOf(document.readyState)) {
	//ждём interactive
	document.addEventListener("DOMContentLoaded", async () => {
		DOM.ok('load')
	})
} else {
	DOM.ok('load')
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