// dao.js

const fs = require("fs");
const sqlite3 = require('sqlite3')
const Promise = require('bluebird')

class AppDAO {
    constructor(dbFile) {
        this.db_exists = fs.existsSync(dbFile);
        this.db = new sqlite3.Database(dbFile, (err) => {
            if (err) {
                console.log('Could not connect to database', err)
            } else {
                console.log('Connected to database')
            }
        });
        this.init();
    }
}

AppDAO.prototype.init = function init(dbFile) {
    const db = this.db;
    db.serialize(() => {
        if (!this.db_exists) {
            db.run(
                "CREATE TABLE List (id INTEGER PRIMARY KEY AUTOINCREMENT, item TEXT)"
            );
            console.log("New table List created!");

            // insert default items
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
}


module.exports = AppDAO
