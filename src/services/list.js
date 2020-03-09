// import ItemModel from "../models/item";
const dbs_constructor = require("./sql.js");

function ListService(raw_msg, response) {
  this.raw_msg = raw_msg;
  this.targets = [];
  this.response = response;
  this.dbs = new dbs_constructor();
  // this.formatter = formatter;
}

/*
 * Getters
 */

// returns parsed request
ListService.prototype.msg = function msg() {
  return this.parseAction(this.raw_msg);
}

// action getter
ListService.prototype.action = function action() {
  return this.msg().action;
}

// params getter
ListService.prototype.params = function params() {
  return this.msg().params;
}

/*
 * Utils
 */

// parses request.body.text into JSON object
ListService.prototype.parseAction = function parseAction(string) {
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

// takes JSON data like [{"item": null}, {"item": null}, {"item": null}, etc.]
ListService.prototype.toNumList = function toNumList(data) {
  var text = "";
  for (let step = 0; step < data.length; step++) {
    text += `\n${step + 1}. ${data[step].item}`
  }
  return text;
}

// adds array list of items to the list
ListService.prototype.listItems = function listItems() {
  var db_resp = this.dbs.listItems();
  console.log("db_resp:")
  console.log(db_resp);
  return this.blockResp(this.toNumList(db_resp));
  // self.response.send(self.blockResp(PostExecutor.toNumList(rows)));
}

/*
 * Response macros
 */

ListService.prototype.success = function success() {
  return this.successResp();
}

ListService.prototype.error = function error(err) {
  return this.errorResp(err);
}

/*
 * Response generators
 */

// error response
ListService.prototype.errorResp = function errorResp(err) {
  return this.formatResp("error", err);
}

// successful response for single or multiple targets
ListService.prototype.successResp = function successResp() {
  return this.formatResp("success", `successful ${this.action()} on ${this.targets.join(", ")}`);
}

// generic generator
ListService.prototype.formatResp = function formatResp(status, msg) {
  return { status: status, message: msg, action: this.action(), targets: this.targets};
}

// must deliver payload within 3000 ms to avoid client side (Slack app) timeout
ListService.prototype.blockResp = function blockResp(text) {
  return {
    "blocks": [
      {
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": text
        }
      }
    ]
  };
}

/*
 * Misc Methods
 */

// main executor
ListService.prototype.takeAction = function takeAction() {
  switch (this.action()) {
    case '':
    case 'ls':
    case 'list':
      return this.listItems();
      break;
    case 'new':
    case 'create':
    case 'add':
      return this.addItems(this.params());
      break;
    case 'delete':
    case 'rm':
    case 'remove':
      return this.removeItems(this.params());
      break;
    case 'nuke':
    case 'clear':
      return this.clearItems();
      break;
    case 'test':
      return this.success();
      break;
    default:
      return this.errorResp(`${this.action()} is not a valid command`);
      break;
  }
}

//
module.exports = ListService;