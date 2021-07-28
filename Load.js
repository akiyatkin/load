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


//depricated - use import
Load.hand('script', src => {
	const s = document.createElement("SCRIPT")
    s.type = "text/javascript"
    s.async = true
	s.defer = true
	s.dataset.added = "dynamically"
	s.crossorigin = "anonymous"
    const promise = new Promise(resolve => {
    	s.onload = resolve
    	s.src = src
    	document.head.append(s)
    })
    return promise
});

//depricated - use import or link
Load.hand('css', async src => {
    const link  = document.createElement('link')
    link.rel  = 'stylesheet'
	link.type = 'text/css'
	link.dataset.added = "dynamically"
	link.crossorigin = "anonymous"
    const promise = new Promise(resolve => link.onload = resolve)
    link.href = /^http/.test(src) ? src : '/' + src

    for (const l of document.head.getElementsByTagName('link')) {
    	if (l.dataset.added == "dynamically" && l.nextSibling) {
    		l.nextSibling.before(link)
    		return promise
    	}
    }
    document.head.prepend(link)
    return promise
});

export { Load }