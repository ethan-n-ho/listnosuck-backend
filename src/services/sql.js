const Promise = require('bluebird')

// constructor
function DBService() {
  // init sqlite db
  const fs = require("fs");
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
  this.db = db;
}

// generic SQL handler
DBService.prototype.run = function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    this.db.run(sql, params, function (err) {
      if (err) {
        console.log('Error running sql ' + sql);
        console.log(err);
        reject(err);
      } else {
        resolve("foobar");
      }
    })
  })
}

// adds array list of items to the list
DBService.prototype.listItems = function listItems() {
  var sql = "SELECT * from List";
  return this.run(sql);
}

// adds array list of items to the list
DBService.prototype.addItems = function addItems(items) {
  this.targets = items;
  var mapped = items.map((item) => "(?)").join(",")
  var sql = `INSERT INTO List (item) VALUES ` + mapped;
  this.runsql(sql, items);
}

// adds array list of items to the list
DBService.prototype.removeItems = function removeItems(items, sense_case = false) {
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
DBService.prototype.clearItems = function clearItems() {
  var self = this;
  this.targets = [];
  if (process.env.DISALLOW_WRITE) {
    return this.error("DISALLOW_WRITE == true");
  } else {
    this.db.each("SELECT * from List", (err, row) => {
      console.log("row", row);
      this.db.run(`DELETE FROM List WHERE ID=?`, row.id, error => {
        if (row) {
          console.log(`deleted row ${row.id}`);
        }
      });
    },
    err => {
      if (err) {
        return self.error(err);
      } else {
        return self.success();
      }
    });
  }
}

module.exports = DBService;
