let router = require("express").Router();
let cleanseString = require("./utils").cleanseString;
const listController = new require("./list-controller.js");

router.get("/", (request, response) => {
    response.send(JSON.stringify({}));
});

// endpoint to take action based on parsed request.body.text
router.route("/takeAction").post(function (req, res) {
        console.log(req.body.text);
        const cleansedMsg = cleanseString(req.body.text);
        // const executor = new PostExecutor(cleansedMsg, res);
        // executor.takeAction();
        // const resp_body = ls.takeAction(req.body.text)
        var ls = new listController(cleansedMsg, res);
        var resp_body = { message: ls.takeAction() }
        return res.json(resp_body);
    }
);

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
