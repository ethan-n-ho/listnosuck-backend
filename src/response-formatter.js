function ResponseFormatter(data = {}, params = {}) {
    this.params = params;
    this.data = data;
}

/*
 * Setters
 */

ResponseFormatter.prototype.setData = function(data) {
    this.data = data;
}

ResponseFormatter.prototype.setParams = function(params) {
    // TODO: do this iteratively on keys
    this.params = params;
}

ResponseFormatter.prototype.setParam = function(name, value) {
    // TODO: do this iteratively on keys
    this.params[name] = value;
}

/*
 * Getters
 */

ResponseFormatter.prototype.getData = function() {
    return this.data;
}

ResponseFormatter.prototype.getParams = function() {
    return this.params.format;
}

ResponseFormatter.prototype.numList = function(data) {
    var text = "";
    for (let step = 0; step < data.length; step++) {
        text += `\n${step + 1}. ${data[step].item}`
    }
    return text;
}

ResponseFormatter.prototype.mdBlock = function(str) {
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

ResponseFormatter.prototype.mdList = function(data) {
    return this.mdBlock(this.numList(data));
}

ResponseFormatter.prototype.error = function(err) {
    return JSON.stringify({ status: "error", message: err });
}

ResponseFormatter.prototype.getResponse = function() {
    switch (this.params.format) {
      case 'mdList':
        return this.mdList(this.data);
        break;
      default:
        return this.error(`${JSON.stringify(this.params.format)} is not a valid format`);
        break;
    }
}

module.exports = ResponseFormatter;
