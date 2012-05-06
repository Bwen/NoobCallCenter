"use strict";
var config = require('NoobConfig'),
    isgidb = require('mysql').createClient({
        user: config('settings').isgidb.username,
        password: config('settings').isgidb.password.toString()
    }),
    TwilioCapability = require('./TwilioCapability'),
    fs = require('fs'),
    path = require('path');

function getLangById(id) {
    switch (id) {
    case 1:
        return 'fr';
    case 2:
        return 'en';
    case 3:
        return 'es';
    }
    return null;
}

isgidb.query('use ' + config('settings').isgidb.name);
function getAccountByPhone(phone, callback) {
    var sql = 'SELECT cl.cl_noclient, cl.cl_prenom, cl.cl_nom, la_nolangue, cls.st_status';
    phone = phone.replace('+', '');
    sql += ' FROM client cl';
    sql += ' INNER JOIN clientstatus cls ON cl.st_dernierstatus=cls.st_nostatus';
    sql += ' WHERE cl.cl_actif AND cl.cl_telephone LIKE "' + phone + '"';
    isgidb.query(sql, function (err, results, fields) {
        var accountInfo = null;
        if (!err) {
            if (results.length > 0) {
                accountInfo = {
                    id: results[0].cl_noclient,
                    lastName: results[0].cl_nom,
                    firstName: results[0].cl_prenom,
                    lang: getLangById(results[0].la_nolangue),
                    status: results[0].st_status
                };
            }
        }
        callback(accountInfo);
    });
}

function getAccountById(id, callback) {
    var sql = 'SELECT cl.cl_noclient, cl.cl_prenom, cl.cl_nom, la_nolangue, cls.st_status';
    sql += ' FROM client cl';
    sql += ' INNER JOIN clientstatus cls ON cl.st_dernierstatus=cls.st_nostatus';
    sql += ' WHERE cl.cl_actif AND cl.cl_noclient = ' + id;
    isgidb.query(sql, function (err, results, fields) {
        var accountInfo = null;
        if (!err) {
            if (results.length > 0) {
                accountInfo = {
                    id: results[0].cl_noclient,
                    lastName: results[0].cl_nom,
                    firstName: results[0].cl_prenom,
                    lang: getLangById(results[0].la_nolangue),
                    status: results[0].st_status
                };
            }
        }
        callback(accountInfo);
    });
}

var callCenter = new (require('./server'))({
    SID: config('settings').twilio.sid,
    AUTH_TOKEN: config('settings').twilio.auth_token
});
callCenter.start(config('settings').twilio.useSandbox);

callCenter.on('twiML:init', function twiML_init(call, callback) {
    getAccountByPhone(call.data.From, function (account) {
        if (account) {
            call.account = account;
            callback('{account.lang}/choose_purpose');
        } else {
            call.account = {};
            callback('choose_language');
        }
    });
});

callCenter.on('twiML:choose_language', function twiML_choose_language(call, callback) {
    var langId = (call.data.hasOwnProperty('Digits') ? parseInt(call.data.Digits, 10) : 0);
    if ([1, 2, 3].indexOf(langId) === -1) {
        // Error message ?
        callback('choose_language');
        return;
    }

    call.account.lang = getLangById(langId);
    callback('{account.lang}/account_number');
});

callCenter.on('twiML:account_number', function twiML_account_number(call, callback) {
    var accountId = (call.data.hasOwnProperty('Digits') ? parseInt(call.data.Digits, 10) : 0);
    if (accountId === 0) {
        // Error message ?
        callback('{account.lang}/account_number');
        return;
    }

    getAccountById(accountId, function (account) {
        // Make sure we keep the original language choice
        account.lang = call.account.lang;
        call.account = account;
        callback('{account.lang}/choose_purpose');
    });
});

callCenter.on('twiML:choose_purpose', function twiML_choose_purpose(call, callback) {
    var purpose = (call.data.hasOwnProperty('Digits') ? parseInt(call.data.Digits, 10) : 0);
    call.departement = purpose;
    call.ready = true;
    call.answered = false;
    callback('{account.lang}/queued');
});

callCenter.on('twiML:dial', function twiML_choose_purpose(call, callback) {
    callback('{account.lang}/dial');
});


var io = require('socket.io').listen(callCenter.http_server);
io.on('connection', function socketio_connection(socket) {
    socket.emit('settings', {
        lang: config('settings').defaults.language
    });

    socket.on('login', function socketio_login(nickname, login, password) {
        var capability = new TwilioCapability(config('settings').twilio.sid, config('settings').twilio.auth_token);

        socket.agentNickname = nickname;
        callCenter.agents.add({
            nickname: nickname,
            available: false,
            departements: [],
            socket: socket
        });

        capability.allowClientIncoming(nickname)
            .allowClientOutgoing(config('settings').twilio.app_sid);
        socket.emit('capability_token', capability.generateToken());
    });

    socket.on('answer', function socketio_answer(call) {
        var call = callCenter.calls.get(call.data.CallSid);
        callCenter.agents.get(socket.agentNickname).available = false;
        call.agent = socket.agentNickname;
        callCenter.answer(call);
    });

    socket.on('available', function socketio_availabe(isAvailable) {
        callCenter.agents.get(socket.agentNickname).available = (isAvailable ? Math.round((new Date()).getTime() / 1000) : false);
    });

    socket.on('disconnect', function socketio_disconnect() {
        callCenter.agents.remove(socket.agentNickname);
    });
});

var noobHttp = require('NoobHTTP').createServer({
    port: 9000,
    logEmit: false,
    http_server: callCenter.http_server,
    socketio: io,
    replacements: {
        '.js,.css,.html': {
            "__hostUrl__": config('settings').NoobPhone.static_files.host
        }
    }
});

callCenter.on('http_request', function (req, res) {
    noobHttp.processRequest.call(noobHttp, req, res);
});

callCenter.on('dispatchCalls', function () {
    var call = callCenter.calls.next();
    if (call) {
        var nextAgent = callCenter.agents.nextAvailable();
        if (nextAgent) {
            nextAgent.socket.emit('ringing', call);
        }
    }
});
