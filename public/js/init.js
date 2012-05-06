// old browsers do not define console
if (console === undefined) {
    var console = {
        log: function () {},
        error: function () {}
    };
}

if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (obj, start) {
        for (var i = (start||0), j = this.length; i < j ; i++){
            if(this[i]==obj) {
                return i;
            }
        }
        return -1;
    }
}

socketio = {};
noobLoadInit(['/socket.io/socket.io.js'
      , '/js/shared/uuid.js'
      , '/js/shared/utils.js'
      , '/js/shared/TextParser.js'
      , '/js/shared/EventEmitter2.js'
      , '/js/NoobSound.js'
      , '/js/NoobI18n.js'
      , '/js/NoobTemplates.js'
      ], function NoobLoadInit() {
    "use strict";

    socketio.root = io.connect(noobLoaderPrefix+'/');
    socketio.root.on('settings', function socketio_settings(settings) {
        window.settings = settings;
    });

    socketio.noobhttp = io.connect(noobLoaderPrefix+'/noobhttp');

    noobLoaderInitialized = true;
});
