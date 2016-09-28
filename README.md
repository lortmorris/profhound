#ProfHound

ProfHound is a easy way to tack all request flow.
With this lib you cn log using diff drivers (console, winston, etc) and follow all live cicle of any request.

## req injection
Inside object req, you'll have 2 new properties: uuid and log.

### uuid
When request is arrive, ProfHound generate a uuid and inject withing 'req' express object.

### log
The log method is injected withing 'req' express object should be able inject a new "log" inside flow request sequence.

## Install
```bash
$ npm install profhound
```

## example

```js
const express = require("express");
const http = require("http");
const winston = require('winston');
const udp = require('winston-udp').UDP;
const profhound = require("../index");
const app = express();


winston.add(winston.transports.UDP, {
	server: process.env.LOGSERVER,
	port: process.env.LOGPORT
});


app.use(profhound({
	drivers: [(data)=> {
		winston.log(data.type ? data.type : "info", JSON.stringify(data));
	}
	]
}));


for (let x = 0; x < 10; x++) {
	app.use((req, res, next)=> {
		console.log("step: ", x);
		next();
	});
}

app.use((req, res, next)=> {
	next();
});

app.get("/", (req, res, next)=> {
	req.log("info", {msg: 'send.end'});
	res.send("gracias por su visita");
});


http.createServer(app).listen(process.PORT || 4000);
```