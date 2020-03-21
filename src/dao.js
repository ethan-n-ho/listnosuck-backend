// dao.js

const fs = require("fs");
const sqlite3 = require('sqlite3')
const Promise = require('bluebird')

class AppDAO {
    constructor(dbFile) {
        this.dbFile = dbFile;
        this.db_exists = fs.existsSync(dbFile);
        this.db = new sqlite3.Database(dbFile, (err) => {
            if (err) {
                console.log(`Could not connect to database at ${dbFile}`, err)
            } else {
                console.log(`Connected to database at ${dbFile}`)
            }
        });
        this.init();
    }
}

AppDAO.prototype.init = function init(name = "List") {
    const db = this.db;
    db.serialize(() => {
        if (!this.db_exists) {
            console.log(`Creating new table '${name}' at ${this.dbFile}`);
            db.run(
                `CREATE TABLE ${name} (id INTEGER PRIMARY KEY AUTOINCREMENT, item TEXT)`
            );

            // insert default items
            db.serialize(() => {
                db.run(
                    `INSERT INTO ${name} (item) VALUES ("first item"), ("milk"), ("third item")`
                );
            });
        } else {
            console.log(`DB already exists at ${this.dbFile}`);
            db.each(`SELECT * from ${name}`, (err, row) => {
                if (row) {
                    console.log(`record: ${row.item}`);
                }
            });
        }
    });
}

// https://stackabuse.com/a-sqlite-tutorial-with-node-js/
AppDAO.prototype.run = function(sql, params=[]) {
    return new Promise((resolve, reject) => {
        this.db.run(sql, params, function (err) {
            if (err) {
                console.log(`Error running sql ${sql}`);
                console.log(err);
                reject(err);
            } else {
                resolve({ id: this.lastID });
            }
        });
    });
}

AppDAO.prototype.all = function(sql, params=[]) {
    return new Promise((resolve, reject) => {
        this.db.all(sql, params, (err, rows) => {
            if (err) {
                console.log(`Error running sql ${sql}`);
                console.log(err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

AppDAO.prototype.clear = function() {
    return new Promise((resolve, reject) => {
        this.db.each("SELECT * from List", (err, row) => {
            this.db.run(`DELETE FROM List WHERE ID=?`, row.id, error => {
                if (row) {
                    console.log(`deleted row ${row.id}`);
                }
            });
        },
        err => {
            if (err) {
                console.log(`Error running sql ${sql}`);
                console.log(err);
                reject(err);
            } else {
                resolve("success");
            }
        });
    });
}

module.exports = AppDAO
