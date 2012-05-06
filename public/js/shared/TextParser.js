
if ('undefined' == typeof window) {
    var Config = require('NoobConfig'),
        removeDupes = require(__dirname + '/utils.js').removeDupes;
}

function parseText(variable, text, delimiterStart, delimiterEnd) {
    "use strict";

    var markers = text.match(/\{.*?\}/ig),
        replacements = {};

    if (markers === null) {
        return text;
    }
    markers = removeDupes(markers);

    if (delimiterStart === undefined) {
        delimiterStart = '{';
    }
    if (delimiterEnd === undefined) {
        delimiterEnd = '}';
    }

    for (var i=0; i < markers.length; i++) {
        var key = markers[i]
          , regex = new RegExp(delimiterStart+'|'+delimiterEnd, 'g')
          , parts = markers[i].replace(regex, '').split('.')
          , originalVar = variable
          , currentVar = originalVar;
        if (parts[0] == 'settings') {
            if ('undefined' == typeof window) {
                originalVar = Config('settings').twilio;
            }
            else {
                // implement browser version
            }
            currentVar = originalVar;
            parts.shift();
        }

        for (var j=0; j < parts.length; j++) {
            if (currentVar.hasOwnProperty(parts[j])) {
                currentVar = currentVar[ parts[j] ];
            }
        }

        if (originalVar != currentVar) {
            replacements[key] = currentVar;
        }
    }

    for (var marker in replacements) {
        var re = new RegExp(marker,"g");
        text = text.replace(re, replacements[marker]);
    }

    return text;
};

if ('undefined' == typeof window) {
    module.exports.parse = parseText;
}
