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

// adds array list of items to the list

// returns list of
ListController.prototype.listItems = function listItems() {
    this.rf.setParam("format", "mdList");
    sql = "SELECT * from List"
    this.dao.all(sql).then((db_result) => {
        console.log(db_result);
        this.rf.setData(db_result);
        this.response.send(this.rf.getResponse());
    });
}

/*
 * Response generators
 */

// generic generator
ListController.prototype.formatResp = function formatResp(status, msg) {
  return { status: status, message: msg, action: this.action(), targets: this.targets};
}

ListController.prototype.success = function success() {
  return this.formatResp("success", `successful ${this.action()} on ${this.targets.join(", ")}`);
}

ListController.prototype.error = function error(err) {
  return this.formatResp("error", err);
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
      return this.removeItems(this.targets());
      break;
    case 'nuke':
    case 'clear':
      return this.clearItems();
      break;
    case 'test':
      return this.success();
      break;
    default:
      return this.error(`${this.action()} is not a valid command`);
      break;
  }
}

module.exports = ListController;
