const daoConstructor = require("./dao.js");
const rfConstructor = require("./response-formatter.js");
const utils = require("./utils");
const dbFileDefault = "/data/sqlite.db";
const fs = require("fs");

function ListController(raw_msg, response) {
    this.raw_msg = utils.cleanseString(raw_msg);
    this.response = response;
    this.rf = new rfConstructor()

    // try to pull path to DB from env
    var dbFile;
    if (fs.existsSync(process.env.DB_FILE)) {
        dbFile = process.env.DB_FILE;
    } else {
        dbFile = dbFileDefault;
    }
    this.dao = new daoConstructor(dbFile);
}

/*
 * Getters
 */

// returns parsed request
ListController.prototype.msg = function msg() {
    var msg = this.parseAction(this.raw_msg)
    return msg;
}

// action getter
ListController.prototype.action = function action() {
  return this.msg().action;
}

// params getter
ListController.prototype.targets = function params() {
  return this.msg().targets;
}

/*
 * Utils
 */

// parses request.body.text into JSON object
ListController.prototype.parseAction = function parseAction(string) {
  // split by whitespace
  const l = string.split(/\s+/);
  // TODO: schema validation with ajv
  // TODO: bash style flags e.g. case sensitivity
  // for now, static schema
  return {
    "action": l[0],
    "targets": l.slice(1),
    "params": {}
  };
}

// adds items to the list
ListController.prototype.addItems = function(items) {
    this.rf.setParam("format", "success");
    this.rf.setData({ action: this.action(), targets: this.targets() })
    var mapped = items.map((item) => "(?)").join(",")
    var sql = `INSERT INTO List (item) VALUES ` + mapped;
    this.dao.run(sql, params=items).then((db_result) => {
        console.log(db_result);
        this.rf.setData(db_result);
        this.response.send(this.rf.getResponse());
    });
}

// removes items from the list
ListController.prototype.removeItems = function(items, sense_case = false) {
    var filter;
    this.rf.setParam("format", "success");
    this.rf.setData({ action: this.action(), targets: this.targets() })
    if (sense_case) {
      filter = "TRIM(item) LIKE (?)";
    } else {
      filter = "TRIM(UPPER(item)) LIKE (?)";
      items = items.map((item) => item.toUpperCase());
    }
    var mapped = items.map((item) => filter).join(" OR ")
    var sql = `DELETE FROM List WHERE ` + mapped;
    this.dao.run(sql, params=items).then((db_result) => {
        console.log(db_result);
        this.rf.setData(db_result);
        this.response.send(this.rf.getResponse());
    });
}

// removes items from the list
ListController.prototype.clearItems = function() {
    this.rf.setParam("format", "success");
    this.dao.clear().then((db_result) => {
        console.log(db_result);
        this.rf.setData({ status: db_result})
        this.response.send(this.rf.getResponse());
    });
}

// returns items in list formatted as markdown response
ListController.prototype.listItems = function() {
    this.rf.setParam("format", "mdList");
    var sql = "SELECT * from List"
    this.dao.all(sql).then((db_result) => {
        console.log(db_result);
        this.rf.setData(db_result);
        this.response.send(this.rf.getResponse());
    });
}

/*
 * Misc Methods
 */

// main executor
ListController.prototype.takeAction = function takeAction() {
  switch (this.action()) {
    case '':
    case 'ls':
    case 'list':
      this.listItems();
      break;
    case 'new':
    case 'create':
    case 'add':
      this.addItems(this.targets());
      break;
    case 'delete':
    case 'rm':
    case 'remove':
      this.removeItems(this.targets());
      break;
    case 'nuke':
    case 'clear':
      this.clearItems();
      break;
    case 'test':
      this.success();
      break;
    default:
      return this.error(`${this.action()} is not a valid command`);
      break;
  }
}

module.exports = ListController;
