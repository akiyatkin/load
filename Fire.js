export let Evt = {
	classes: {

	},
	on: (cls, name, obj) => {
		if (!cls.__events) cls.__events = [];
		if (!cls.__events[name]) cls.__events[name] = {res: null, list: []};
		cls.__events[name].res = obj;
		var p = new Promise((resolve, reject) => {
			setTimeout(() => resolve(777), 1);
		});
		return p;
	},
	handler: () => {

	},
	quench: () => {

	}
}

export default Evt;