const uuid = require("uuid");

const profhound = function (app) {

	let activeRequest = {};
	let initialized = false;


	const unregisterRequest = (req)=> delete activeRequest[req.uuid];
	const registerRequest = (req)=> activeRequest[req.uuid] = req.init;

	const saveData = (data)=> {
		console.log("saved: ", data);
		//db.history.insert(toSave);
	};

	const saveError = (req, e)=> {
		saveData({
			uuid: req.uuid,
			url: req.url,
			time: new Date().getTime(),
			hrtime: process.hrtime(),
			error: e
		})
	}

	const _profhound = (req, res, next) => {

		req.uuid = uuid.v4();
		req.init = {
			uuid: req.uuid,
			date: new Date().getTime(),
			hrtime: process.hrtime(),
			body: req.body,
			query: req.query,
			url: req.url,
			headers: req.headers,
			type: "init"
		};

		saveData(req.init);
		registerRequest(req);

		let end = res.end;

		res.end = (buff) => {
			let toSave = {
				type: "end",
				date: new Date().getTime(),
				hrtime: process.hrtime(),
				uuid: req.uuid
			};

			saveData(toSave);
			unregisterRequest(req);
			try {
				end.call(res, buff);
			} catch (e) {
				saveError(req, e);
			}


		};

		req.log = function () {
			saveData({
				uuid: req.uuid,
				time: new Date().getTime(),
				hrtime: process.hrtime(),
				data: arguments
			});
		};


		req.app._router.stack.forEach(s => {
			let handle = s.handle;
			if (!handle.__me && !handle.__wrap) {
				handle.__wrap = true;

				s.handle = (req, res, next) => {
					if (req.log) {
						req.log("mws", "pass");
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
		next();
	};

	_profhound.__me = true;
	return _profhound;
};

module.exports = profhound;