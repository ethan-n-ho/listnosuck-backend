// init project
const express = require("express");
const bodyParser = require("body-parser");
let apiRoutes = require("./api-routes");
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/', apiRoutes);

var listener = app.listen(process.env.PORT, () => {
    console.log(`Your app is listening on port ${listener.address().port}`);
});
