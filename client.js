var Config = require('NoobConfig')
  , util = require('util')
  , EventEmitter = require('events').EventEmitter
  , querystring = require('querystring')

function Twilio_Client () {
    
}
util.inherits(Twilio_Client, EventEmitter);


Twilio_Client.prototype.init = function init(isSandbox) {
    
}

module.exports = Twilio_Client;
