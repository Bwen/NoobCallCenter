var Config = require('NoobConfig')
  , util = require('util')
  , EventEmitter = require('events').EventEmitter
  , fs = require('fs')
  , path = require('path')
  , crypto = require('crypto')
  , querystring = require('querystring')
  , parseText = require('./public/js/shared/TextParser').parse
  , TwilioCapability = require('./TwilioCapability.js')
  , rest = require('restler');

function Phone_Server (opts) {
    this.sid = opts.SID;
    this.auth_token = opts.AUTH_TOKEN;
    this.calls = new (require('./calls'))();
    this.agents = new (require('./agents'))();
    this.http_server = null;
    this.dispatcherInterval = null;
};
util.inherits(Phone_Server, EventEmitter);

Phone_Server.prototype.setupSandbox = function setupSandbox() {
    var twilio_url = "https://"+Config('settings').twilio.username+':'+Config('settings').twilio.password+"@"+Config('settings').twilio.host+":"+Config('settings').twilio.port;
    rest.post('https://'+this.sid+':'+this.auth_token+'@api.twilio.com/2010-04-01/Accounts/'+this.sid+'/Sandbox.json', {
        data: {
            "VoiceUrl": twilio_url+"/phone/twiML/",
            "VoiceMethod": "POST",
            "StatusCallback": twilio_url+"/phone/twiML/",
            "StatusCallbackMethod": "POST"
        }
    }).on('complete', function (data) {
        //console.log(data.phone_number);
    });
};

Phone_Server.prototype.answer = function answer(call) {
    var twilio_url = "https://"+Config('settings').twilio.username+':'+Config('settings').twilio.password+"@"+Config('settings').twilio.host+":"+Config('settings').twilio.port;
    rest.post('https://' + this.sid+':' + this.auth_token + '@api.twilio.com/2010-04-01/Accounts/' + this.sid + '/Calls/' + call.data.CallSid + '.json', {
        data: {
            "Url": twilio_url + "/phone/twiML/dial",
            "Method": "POST"
        }
    }).on('complete', function (data) {
        console.log('--------------------------- redirect to dail twiML');
        console.log(data);
    });
};

Phone_Server.prototype.start = function start(isSandbox) {
    var self = this;

    if (isSandbox) {
        this.setupSandbox();
    }
    var fs = require('fs'), options = {key: fs.readFileSync('./ssl/privatekey.pem'), cert: fs.readFileSync('./ssl/certificate.pem')};
    this.http_server = require('https').createServer(options, function (req, res) {
        self.requestHandler.call(self, req, res);
    }).listen(Config('settings').NoobPhone.port);

    console.log('----- Phone server listening on port: ', Config('settings').NoobPhone.port);

    this.dispatcherInterval = setInterval(function () {
        if (self.calls.total() > 0) {
            self.emit('dispatchCalls');
        }
    }, 5000);
};

Phone_Server.prototype.requestHandler = function requestHandler(req, res) {
    var body = '', self = this;
    req.on('data', function (data) {body += data;});
    req.on('end', function () {
        var data = querystring.parse(body || {});

        // if its a none twilio request we delegate the request
        if (!req.headers.hasOwnProperty('x-twilio-signature')) {
            self.emit('http_request', req, res);
            return;
        }

        // console.log('###################', req.headers);
        // console.log('-------------------', data.CallSid);
        // console.log('-------------------', data.CallStatus);
        // console.log('---------------------------------------------------------');
        if (data.CallStatus == 'completed') {
            console.log('--------------completed..........', data);
            self.calls.remove(data.CallSid);
            return;
        }

        if (!req.headers.hasOwnProperty('x-twilio-signature')
         || !self.validateSignature(req.headers['x-twilio-signature'], req, data)
         || !self.validateBasicAuth(req.headers['authorization'])
        ) {
            res.writeHead(401, {
                'Content-Type': 'text/plain',
                'WWW-Authenticate': 'Basic realm="NoobPhone Server"'
            });
            res.end('Request must be signed with x-twilio-signature header.');
            return;
        }

        if (data.hasOwnProperty('CallSid') && !self.calls.get(data.CallSid)) {
            self.calls.add({
                timestamp: Math.round((new Date()).getTime() / 1000),
                data: data
            });
        }
        self.calls.get(data.CallSid).data = data;

        if ('ringing' == data.CallStatus) {
            self.emit('twiML:init', self.calls.get( data.CallSid ), function (nextScript) {
                var nextScript = parseText(self.calls.get( data.CallSid ), nextScript)
                  , xml = fs.readFileSync(Config('settings').NoobPhone.path.twiML_scripts + nextScript +'.xml');
                res.writeHead(200, {'Content-Type': 'text/xml'});
                res.end(parseText(self.calls.get( data.CallSid ), xml.toString()));
            });
        }
        else if (req.url.match(/^\/phone\/twiML/)) {
            var filename = req.url.match(/^\/phone\/twiML\/(.*)$/)[1];
            self.emit('twiML:'+filename, self.calls.get( data.CallSid ), function (nextScript) {
                var nextScript = parseText(self.calls.get( data.CallSid ), nextScript)
                  , xml = fs.readFileSync(Config('settings').NoobPhone.path.twiML_scripts + nextScript +'.xml');

                res.writeHead(200, {'Content-Type': 'text/xml'});
                res.end(parseText(self.calls.get( data.CallSid ), xml.toString()));
            });
        }
    });
};

Phone_Server.prototype.validateBasicAuth = function validateBasicAuth(authorization) {
    var header=authorization||'',    // get the header
    token=header.split(/\s+/).pop()||'',            // and the encoded auth token
    auth=new Buffer(token, 'base64').toString(),    // convert from base64
    parts=auth.split(/:/),                          // split on colon
    username=parts[0],
    password=parts[1];
    if (username == Config('settings').twilio.username && password == Config('settings').twilio.password) {
        return true;
    }
    return false;
}

Phone_Server.prototype.validateSignature = function validateSignature(signature, req, data) {
    // FIXME: HACK there is a bug where the port is not supported in the twilio signature, thus we need to take it out
    var url = 'https://'+req.headers.host.replace(':9000', '')+req.url
      , keys = Object.keys(data).sort()
    for (var i=0; i < keys.length; i++) {
        url += keys[i] + data[ keys[i] ];
    }

    if (crypto.createHmac("sha1", Config('settings').twilio.auth_token)
        .update(url)
        .digest("base64") == signature) {
        return true;
    }
    return false;
}

module.exports = Phone_Server;
