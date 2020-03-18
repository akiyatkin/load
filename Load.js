import Fire from './Fire.js'
export {Fire}
export let Load = {
	on: (name, arg) => Fire.on(Load, name, arg),
	hand: (name, func) => Fire.hand(Load, name, func),
	set: (name, arg, val) => Fire.set(Load, name, arg, val),
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
				Load.paramAdd(s, prefix, v)
			} else {
				Load.paramBuild(s, prefix + "[" + ( typeof v === "object" && v != null ? i : "" ) + "]", v)
			}
		})
	} else if (obj && typeof obj === "object") {
		for (let name in obj) {
			Load.paramBuild(s, prefix + "[" + name + "]", obj[ name ])
		}

	} else {
		Load.paramAdd(s, prefix, obj)
	}
}



Load.hand('json', src => {
	return fetch('/' + src).then( res => res.json())
});

Load.hand('script', src => {
	return new Promise((resolve) => {

		let s = document.createElement("script")
	    s.type = "text/javascript"
	    s.async = true
	    s.defer = true
	    s.onload = resolve
	    s.src = src

	    document.getElementsByTagName('head')[0].appendChild(s)
	});
});

Load.hand('css', src => {

    let link  = document.createElement('link')
    link.rel  = 'stylesheet'
    link.type = 'text/css'
    link.href = src

    document.getElementsByTagName('head')[0].appendChild(link)
});



export default Load