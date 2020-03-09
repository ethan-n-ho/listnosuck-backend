// init project
const express = require("express");
const bodyParser = require("body-parser");
const route = express();
const fs = require("fs");
const ls_constructor = require("./services/list.js");
route.use(bodyParser.urlencoded({ extended: true }));
route.use(bodyParser.json());

// http://expressjs.com/en/starter/static-files.html
route.use(express.static("public"));

// init sqlite db
const dbFile = "./.data/sqlite-list.db";
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(dbFile);

// if ./.data/sqlite.db does not exist, create it, otherwise print records to console
db.serialize(() => {
  if (!exists) {
    db.run(
      "CREATE TABLE List (id INTEGER PRIMARY KEY AUTOINCREMENT, item TEXT)"
    );
    console.log("New table List created!");
    
    // insert default dreams
    db.serialize(() => {
      db.run(
        'INSERT INTO List (item) VALUES ("first item"), ("milk"), ("third item")'
      );
    });
  } else {
    console.log('Database "List" ready to go!');
    db.each("SELECT * from List", (err, row) => {
      if (row) {
        console.log(`record: ${row.item}`);
      }
    });
  }
});

// main logic handler for POST request data
// TODO: authenticate token against env
//

// http://expressjs.com/en/starter/basic-routing.html
route.get("/", (request, response) => {
  response.sendFile(`${__dirname}/views/index.html`);
});

// endpoint to take action based on parsed request.body.text
route.post(
  "/takeAction",
  async (req, res) => {
    const cleansedMsg = cleanseString(req.body.text);
    // const executor = new PostExecutor(cleansedMsg, res);
    // executor.takeAction();
    // const resp_body = ls.takeAction(req.body.text)
    var ls = new ls_constructor(cleansedMsg, res);
    var resp_body = await { message: ls.takeAction() }
    return res.json(resp_body);
  }
);

// endpoint to get all the items in the list
route.get(
  "/getList",
  async (request, response) => {
    db.all("SELECT * from List", (err, rows) => {
      response.send(JSON.stringify(rows));
    });
  }
);

// helper function that prevents html/css/script malice
const cleanseString = function(string) {
  return string.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

// listen for requests :)
var listener = route.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});