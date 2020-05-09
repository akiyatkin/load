let DOM = () => {
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
}
export {DOM};