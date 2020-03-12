function numList(data) {
    var text = "";
    for (let step = 0; step < data.length; step++) {
        text += `\n${step + 1}. ${data[step].item}`
    }
    return text;
}

function mdBlock(str) {
    return {
      "blocks": [
        {
          "type": "section",
          "text": {
              "type": "mrkdwn",
              "text": str
          }
        }
      ]
    };
}

function mdList(data) {
    return mdBlock(numList(data));
}

module.exports = {
    numList,
    mdBlock,
    mdList
};
