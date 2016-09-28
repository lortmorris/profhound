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

### output
```bash
info: {"date":"2016-09-28T17:10:44.806Z","uuid":"a4ea6890-962d-4de7-863e-53ca7bb5eb02","time":1475082644806,"hrtime":[106338,938189592],"query":{},"url":"/","headers":{"host":"localhost:4000","connection":"keep-alive","cache-control":"max-age=0","upgrade-insecure-requests":"1","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.116 Safari/537.36","accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8","accept-encoding":"gzip, deflate, sdch","accept-language":"en-US,en;q=0.8,es;q=0.6,pt;q=0.4,it;q=0.2,gl;q=0.2","alexatoolbar-alx_ns_ph":"AlexaToolbar/alx-4.0","if-none-match":"W/\"15-UCFgpEfb3T0D6W5Sr28HBw\""},"type":"info","mtype":"init","ip":"::1"}
error: UDP Logger Socket error: RangeError: Port should be > 0 and < 65536
info: {"date":"2016-09-28T17:10:44.813Z","uuid":"a4ea6890-962d-4de7-863e-53ca7bb5eb02","time":1475082644813,"hrtime":[106338,944888981],"type":"info","mtype":"flow"}
info: {"type":"info","date":"2016-09-28T17:10:44.816Z","time":1475082644816,"hrtime":[106338,948041176],"uuid":"a4ea6890-962d-4de7-863e-53ca7bb5eb02","mtype":"end"}

```