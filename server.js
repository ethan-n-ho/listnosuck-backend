// server.js
// where your node app starts

// init project
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const fs = require("fs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// we've started you off with Express,
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

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
        console.log(`record: ${row.list}`);
      }
    });
  }
});

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  response.sendFile(`${__dirname}/views/index.html`);
});

// endpoint to take action based on parsed request.body.text
app.post("/takeAction", (request, response) => {
  const cleansedItem = cleanseString(request.body.text);
  // TODO: feed to action parser
  const obj = parseAction(cleansedItem)
  // TODO: case action based on parser resp defined in JSON schema
  response.send(JSON.stringify(obj));
});

// endpoint to get all the items in the list
app.get("/getList", (request, response) => {
  db.all("SELECT * from List", (err, rows) => {
    response.send(JSON.stringify(rows));
  });
});

// endpoint to add a dream to the database
app.post("/addItem", (request, response) => {
  console.log(`add to list ${request.body.text}`);
  
  // DISALLOW_WRITE is an ENV variable that gets reset for new projects
  // so they can write to the database
  if (!process.env.DISALLOW_WRITE) {
    const cleansedItem = cleanseString(request.body.text);
    if (cleansedItem == "") {
      response.send({ message: "error: null text" });
    } else {
      db.run(`INSERT INTO List (item) VALUES (?)`, cleansedItem, error => {
        if (error) {
          response.send({ message: "error: unknown error" });
        } else {
          response.send({ message: "success" });
        }
      });
    }
  }
});

// endpoint to clear dreams from the database
app.get("/clear", (request, response) => {
  // DISALLOW_WRITE is an ENV variable that gets reset for new projects so you can write to the database
  if (!process.env.DISALLOW_WRITE) {
    db.each(
      "SELECT * from List",
      (err, row) => {
        console.log("row", row);
        db.run(`DELETE FROM List WHERE ID=?`, row.id, error => {
          if (row) {
            console.log(`deleted row ${row.id}`);
          }
        });
      },
      err => {
        if (err) {
          response.send({ message: "error" });
        } else {
          response.send({ message: "success" });
        }
      }
    );
  }
});

// helper function that prevents html/css/script malice
const cleanseString = function(string) {
  return string.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

// parses request.body.text into JSON object
const parseAction = function(string) {
  // split by whitespace
  const l = string.split(/\s+/)
  // TODO: schema validation with ajv
  // for now, static schema
  return {
    "action": l[0],
    "params": l.slice(1)
  };
};

// listen for requests :)
var listener = app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});