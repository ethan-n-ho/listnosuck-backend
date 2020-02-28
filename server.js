// server.js

// init project
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const fs = require("fs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

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
        console.log(`record: ${row.item}`);
      }
    });
  }
});

// main logic handler for POST request data
// TODO: authenticate token against env
class PostExecutor {
  constructor(raw_msg, response) {
    this.raw_msg = raw_msg;
    this.targets = [];
    this.response = response;
  }
  
  /*
   * Token auth
   */
  
  
  
  /*
   * Getters
   */
  
  // returns parsed request
  get msg() {
    return PostExecutor.parseAction(this.raw_msg);
  }
  
  // action getter
  get action() {
    return this.msg.action;
  }
  
  // params getter
  get params() {
    return this.msg.params;
  }
  
  /*
   * Utils
   */
  
  // parses request.body.text into JSON object
  static parseAction(string) {
    // split by whitespace
    const l = string.split(/\s+/);
    // TODO: schema validation with ajv
    // TODO: bash style flags e.g. case sensitivity
    // for now, static schema
    return {
      "action": l[0],
      "params": l.slice(1)
    };
  }
  
  /*
   * SQL Methods
   */
  
  // Method
  calcArea() {
    return this.height * this.width;
  }
  
  // generic SQL handler
  runsql(query, arg) {
    var self = this;
    console.log(query);
    if (process.env.DISALLOW_WRITE) {
      this.error("DISALLOW_WRITE == true");
    } else {
      db.run(query, arg, error => {
        if (error) {
          self.error(error);
        } else {
          self.success();
        }
      });
    }
  }
  
  // adds array list of items to the list
  listItems() {
    var self = this;
    db.all("SELECT * from List", (err, rows) => {
      self.response.send(self.blockResp(rows));
    });
  }
  
  // adds array list of items to the list
  addItems(items) {
    this.targets = items;
    var mapped = items.map((item) => "(?)").join(",")
    var sql = `INSERT INTO List (item) VALUES ` + mapped;
    this.runsql(sql, items);
  }
  
  // adds array list of items to the list
  removeItems(items, sense_case = false) {
    this.targets = items;
    var filter;
    if (sense_case) {
      filter = "TRIM(item) LIKE (?)";
    } else {
      filter = "TRIM(UPPER(item)) LIKE (?)";
      items = items.map((item) => item.toUpperCase());
    }
    var mapped = items.map((item) => filter).join(" OR ")
    var sql = `DELETE FROM List WHERE ` + mapped;
    this.runsql(sql, items);
  }
  
  // remove all rows indexed by their own IDs
  clearItems() {
    var self = this;
    this.targets = [];
    if (process.env.DISALLOW_WRITE) {
      this.error("DISALLOW_WRITE == true");
    } else {
      db.each("SELECT * from List", (err, row) => {
        console.log("row", row);
        db.run(`DELETE FROM List WHERE ID=?`, row.id, error => {
          if (row) {
            console.log(`deleted row ${row.id}`);
          }
        });
      },
      err => {
        if (err) {
          self.error(err);
        } else {
          self.success();
        }
      });
    }
  }
  
  /*
   * Response macros
   */
  
  success() {
    this.response.send(this.successResp());
  }
  
  error(err) {
    this.response.send(this.errorResp(err));
  }
  
  /*
   * Response generators
   */
  
  // error response
  errorResp(err) {
    return this.formatResp("error", err);
  }
  
  // successful response for single or multiple targets
  successResp() {
    return this.formatResp("success", `successful ${this.action} on ${this.targets.join(", ")}`);
  }
  
  // must deliver payload within 3000 ms to avoid client side (Slack app) timeout
  blockResp(data) {
    return {
      "blocks": [
        {
          "type": "section",
          "text": {
              "type": "mrkdwn",
              "text": JSON.stringify(data)
          }
        }
        // {
        //   "type": "section",
        //   "text": {
        //       "type": "mrkdwn",
        //       "text": "Partly cloudy today and tomorrow"
        //   }
        // }
      ]
    };
  }
  
  // generic generator
  formatResp(status, msg) {
    return { status: status, message: msg, action: this.action, targets: this.targets};
  }
  
  /*
   * Misc Methods
   */
  
  // main executor
  takeAction() {
    switch (this.action) {
      case 'ls':
      case 'list':
        this.listItems();
        break;
      case 'new':
      case 'create':
      case 'add':
        this.addItems(this.params);
        break;
      case 'delete':
      case 'rm':
      case 'remove':
        this.removeItems(this.params);
        break;
      case 'nuke':
      case 'clear':
        this.clearItems();
        break;
      case 'test':
        this.response.send(this.blockResp({butt: "foo"}));
        break;
      default:
        return this.errorResp(`${this.action} is not a valid command`);
        break;
    }
  }
}

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  response.sendFile(`${__dirname}/views/index.html`);
});

// endpoint to take action based on parsed request.body.text
app.post("/takeAction", (request, response) => {
  const cleansedMsg = cleanseString(request.body.text);
  const executor = new PostExecutor(cleansedMsg, response);
  executor.takeAction();
});

// endpoint to get all the items in the list
app.get("/getList", (request, response) => {
  db.all("SELECT * from List", (err, rows) => {
    response.send(JSON.stringify(rows));
  });
});

// helper function that prevents html/css/script malice
const cleanseString = function(string) {
  return string.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

// listen for requests :)
var listener = app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});