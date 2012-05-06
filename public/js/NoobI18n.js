var textFiles = {}, loadingFiles = {};

function NoobI18n() {
    "use strict";
}

NoobI18n.prototype.get = function get() {
    "use strict";

    // filename, id, options, callback
    var self = this,
        args = [].splice.call(arguments, 0),
        callback = (args.length > 2 ? args.pop() : null),
        filename = args.shift(),
        id = args.shift(),
        filename = '/i18n/' + settings.lang + '/' + filename,
        file;

    if (!textFiles.hasOwnProperty(settings.lang)) {
        textFiles[settings.lang] = {};
    }

    function response(text, callback) {
        text = (text === undefined ? '' : text);
        if (typeof callback !== 'function') {
            return text;
        } else {
            callback(text);
        }
    }

    function findTextById(id, textFile) {
        if (!id.match(/\./) && textFile.hasOwnProperty(id)) {
            return textFile[id];
        }

        var parts = id.split('.'), i, currentVar = textFile;
        for (i = 0; i < parts.length; i += 1) {
            if (currentVar.hasOwnProperty(parts[i])) {
                currentVar = currentVar[parts[i]];
            }

            if (Object.prototype.toString.apply(currentVar) === '[object String]') {
                return currentVar;
            }
        }
    }

    if (textFiles[settings.lang].hasOwnProperty(filename)) {
        return response(findTextById(id, textFiles[settings.lang][filename]), callback);
    } else if (localStorage != undefined && localStorage.hasOwnProperty(filename)) {
        textFiles[settings.lang][filename] = localStorage[filename];
        return response(findTextById(id, textFiles[settings.lang][filename]), callback);
    } else if (!loadingFiles.hasOwnProperty(filename)) {
        file =  filename.replace(/\{lang\}/i, settings.lang) + '.json';
        loadingFiles[filename] = true;

        socketio.noobhttp.emit('request', file);
        socketio.noobhttp.on(file, function socketio_file(err, i18nJson) {
            if (err) {
                console.error(err.msg);
                return;
            }

            var textFile = JSON.parse(i18nJson);
            if (textFile) {
                textFiles[settings.lang][filename] = textFile;
                // localStorage[localStorageIndex] = text;
                return response(findTextById(id, textFiles[settings.lang][filename]), callback);
            } else {
                return response(undefined, callback);
            }
            delete loadingFiles[filename];
        });
    }
};

NoobI18n.prototype.parseText = function parseText(text, replacements) {
    "use strict";
    var key, parts, originalVar, currentVar, i, value, marker;

    if (text == undefined) {
        return text;
    }

    for (key in replacements) {
        if (replacements.hasOwnProperty(key) && replacements[key].indexOf('.') !== -1) {
            parts = replacements[key].split('.');
            value = replacements[key];
            originalVar = window;
            currentVar = window;

            for (i = 0; i < parts.length; i += 1) {
                if (currentVar.hasOwnProperty(parts[i])) {
                    currentVar = currentVar[parts[i]];
                }
            }

            if (originalVar != currentVar) {
                replacements[key] = currentVar;
            }
        }
    }

    for (marker in replacements) {
        if (replacements.hasOwnProperty(marker)) {
            text = text.replace('%' + marker + '%', replacements[marker]);
        }
    }

    return text;
};

noobI18n = new NoobI18n();
var dataTextInterval = setInterval(function () {
    "use strict";

    $('[data-i18n]').each(function (index, element) {
        var attribute = element.getAttribute('data-i18n'),
            textArgs = attribute.split(':'),
            filename = textArgs[0],
            id = textArgs[1];

        noobI18n.get(filename, id, function (text) {
            text = noobI18n.parseText(text, parseQuerystring(textArgs[2]));

            element.removeAttribute('data-i18n');
            element.setAttribute('data-i18n-parsed', attribute);

            switch (element.tagName) {
            case 'INPUT':
                element.value = text;
                break;
            default:
                element.innerHTML = text;
                break;
            }
        });
    });
}, 200);
