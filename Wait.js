export let Wait = () => {
	if (Wait.promise) return Wait.promise;
	return Wait.promise = new Promise((resolve) => {
		let func = async () => {
			if (window.Controller) Event.one('Controller.onshow', resolve)
			else resolve() 
		}
		if (document.readyState == 'loading') {
			document.addEventListener("DOMContentLoaded", func)
		} else {
			func()
		}
	})
}


export default Wait;