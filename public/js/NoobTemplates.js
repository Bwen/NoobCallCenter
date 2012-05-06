var templateFiles = {}, loadingFiles = {};

function NoobTemplates() {
    "use strict";
}

NoobTemplates.prototype.get = function get(filename, replacements, callback) {
    "use strict";
    var self = this, file = filename;

    if (typeof replacements === 'function') {
        callback = replacements;
        replacements = undefined;
    }

    if (templateFiles.hasOwnProperty(filename)) {
        callback(undefined, parseText(replacements, templateFiles[filename]));
    } else if (localStorage !== undefined && localStorage.hasOwnProperty('templates:' + filename)) {
        templateFiles[filename] = localStorage['templates:' + filename];
        callback(undefined, parseText(replacements, templateFiles[filename]));
    } else if (!loadingFiles.hasOwnProperty(filename)) {
        loadingFiles[filename] = true;
        socketio.noobhttp.emit('request', file);
        socketio.noobhttp.on(file, function socketioFile(err, html) {
            if (err) {
                callback(err, undefined);
                return;
            }

            // localStorage[ 'templates:'+filename ] = html;
            templateFiles[filename] = html;
            callback(undefined, parseText(replacements, templateFiles[filename]));
            delete loadingFiles[filename];
        });
    }
};

noobTemplates = new NoobTemplates();
