const uuid = require("uuid");

const profhound = function (opts) {

	let activeRequest = {};
	let initialized = false;

	const options = Object.assign({}, {
		drivers: [
			(data)=> console.log(data)
		]
	}, opts || {});

	const unregisterRequest = (req)=> delete activeRequest[req.uuid];
	const registerRequest = (req)=> activeRequest[req.uuid] = req.init;

	const saveData = (data)=> {
		options.drivers.forEach(d => setTimeout(()=>d(data), 0));
	};

	const saveError = (req, e)=> {
		saveData({
			uuid: req.uuid,
			url: req.url,
			time: new Date().getTime(),
			hrtime: process.hrtime(),
			error: e,
			type: 'info',
			mtype: 'error'
		})
	}


	const realip = (req)=> {
		let ip = null;
		if (req.headers && req.headers['x-forwarded-for']) {
			let parts = req.headers['x-forwarded-for'].split(",");
			ip = parts[0];
		} else {
			ip = req.ip;
		}
		return ip;
	}

	const _profhound = (req, res, next) => {

		req.uuid = uuid.v4();
		req.init = {
			date: new Date(),
			uuid: req.uuid,
			time: new Date().getTime(),
			hrtime: process.hrtime(),
			body: req.body,
			query: req.query,
			url: req.url,
			hostname: req.hostname,
			headers: req.headers,
			type: "info",
			mtype: 'init',
			ip: realip(req)
		};

		saveData(req.init);
		registerRequest(req);

		let end = res.end;

		res.end = (buff) => {
			let toSave = {
				type: "info",
				date: new Date(),
				time: new Date().getTime(),
				hrtime: process.hrtime(),
				uuid: req.uuid,
				mtype: 'end'
			};

			saveData(toSave);
			unregisterRequest(req);
			try {
				end.call(res, buff);
			} catch (e) {
				saveError(req, e);
			}


		};

		req.log = function (type, data) {
			saveData({
				date: new Date(),
				uuid: req.uuid,
				time: new Date().getTime(),
				hrtime: process.hrtime(),
				type: type,
				mtype: 'flow',
				data: data
			});
		};


		if(!initialized){
			req.app._router.stack.forEach(s => {

				let handle = s.handle;
				if (!s.handle.__me) {

					s.handle = (req, res, next) => {
						if (req.log) {
							req.log('debug', {mws: 'pass', signature: req.signature || null });
						}

						try {
							handle(req, res, next);
						} catch (e) {
							saveError(req, e);
						}
					};
				}
			});

			initialized = true;
		}



		next();
	};

	_profhound.__me = true;
	return _profhound;
};

module.exports = profhound;
