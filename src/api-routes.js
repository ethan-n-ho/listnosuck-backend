let router = require("express").Router();
const listController = new require("./list-controller.js");

router.get("/", (req, res) => {
    res.send(JSON.stringify({}));
});

// endpoint to take action based on parsed request.body.text
router.route("/takeAction").post(function (req, res) {
    var uncleaned = req.body.text;
    console.log(`Received request with body.text: ${uncleaned}`);
    var ls = new listController(uncleaned, res);
    ls.takeAction();
});

// endpoint to get all the items in the list
router.get(
  "/getList",
  async (request, response) => {
    db.all("SELECT * from List", (err, rows) => {
      response.send(JSON.stringify(rows));
    });
  }
);

module.exports = router;
