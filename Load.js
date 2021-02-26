import Fire from './Fire.js'
let Load = {
	...Fire,
	param: (a) => {
		let s = []
		for (let prefix in a) {
			paramBuild(s, prefix, a[prefix])
		}
		return s.join('&')
	}
}

let paramAdd = (s, key, value) => {
	s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value == null ? "" : value)
}
let paramBuild = (s, prefix, obj) => {
	if (obj && obj.constructor == Array) {
		obj.forEach( (v, i) => {
			if (/\[\]$/.test(prefix)) {
				paramAdd(s, prefix, v)
			} else {
				paramBuild(s, prefix + "[" + ( typeof v === "object" && v != null ? i : "" ) + "]", v)
			}
		})
	} else if (obj && typeof obj === "object") {
		for (let name in obj) {
			paramBuild(s, prefix + "[" + name + "]", obj[ name ])
		}

	} else {
		paramAdd(s, prefix, obj)
	}
}


Load.hand('text', src => {
	//Нужен из-за кэша, так как fetch будет каждый раз новый запрос отправлять
	return fetch('/' + src).then( res => res.text()).catch( () => '')
});
Load.hand('json', (src, opt) => {
	if (opt) src += opt
	//Нужен из-за кэша, так как fetch будет каждый раз новый запрос отправлять
	return fetch('/' + src).then( res => res.json()).catch( () => {})
});

Load.hand('script', src => {
	return new Promise((resolve) => {

		let s = document.createElement("script")
	    s.type = "text/javascript"
	    s.async = true
		s.defer = true
		s.crossorigin="anonymous"
	    s.onload = resolve
		s.src = src
	    document.getElementsByTagName('head')[0].appendChild(s)
	});
});

Load.hand('css', async src => {
    let link  = document.createElement('link')
    link.rel  = 'stylesheet'
	link.type = 'text/css'
	link.crossorigin="anonymous"
    link.href = /^http/.test(src) ? src : '/' + src
    const promise = new Promise(resolve => {
    	link.onload = () => {
    		resolve()
    	}
    })
    document.getElementsByTagName('head')[0].appendChild(link)
    return promise
});


window.NLoad = Load
export default Load
export {Load}