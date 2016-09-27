const express = require("express");
const http = require("http");
const profhound = require("../index");
const app = express();
app.use(profhound());



for (let x = 0; x < 10; x++) {
	app.use((req, res, next)=> {
		console.log("step: ", x);
		next();
	});
}

app.use((req, res, next)=>{
	next();
});

app.get("/", (req, res, next)=> {
	res.send("gracias por su visita");
});




http.createServer(app).listen(process.PORT || 4000);
