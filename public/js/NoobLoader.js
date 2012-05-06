if (typeof jQuery == 'undefined') {
    throw new Error('This library requires JQuery library!');
}

var jquery_version = jQuery.fn.jquery.split('.');
if (jquery_version[0] < 1  || (jquery_version[0] == 1 && jquery_version[1] < 6)) {
    throw new Error('This library requires JQuery version 1.6+');
}

var loadedFiles = {}, noobLoaderInitialized = false, initBuffer = [];
function noobLoad(files, callback) {
    "use strict";

    initBuffer.push([files, callback]);
}

var noobLoaderPrefix = $('[data-jsinit]')[0].getAttribute('src').replace(/^(http[s]:\/\/[^/]+)\/.*$/, '$1');
function noobLoadInit(files, callback) {
    "use strict";

    var allLoadedAlready = 0,
        indexesLoaded = [],
        triggerLoadCallback,
        loadCallback,
        loadTimeout = null,
        i,
        head = document.getElementsByTagName('head')[0],
        fileUrl,
        element;

    // make it so we can accept an array or a single string
    files = [].concat(files);

    for (i = 0; i < files.length; i += 1) {
        if (loadedFiles.hasOwnProperty(files[i])) {
            allLoadedAlready += 1;
        }
    }

    if (files.length == allLoadedAlready) {
        if (typeof callback == 'function') {
            callback();
        }

        return;
    }

    loadTimeout = setTimeout(function () {
        var failedFiles = [], i;
        for (i = 0; i < files.length; i += 1) {
            if (indexesLoaded.indexOf(i) === -1) {
                failedFiles.push(files[i]);
            }
        }
        console.error('Could not load the following files:', failedFiles);
    }, 3000);

    loadCallback = function (index) {
        indexesLoaded.push(index);
        if (files.length == indexesLoaded.length) {
            if (typeof callback == 'function') {
                callback();
            }
            clearTimeout(loadTimeout);
        }
    };

    triggerLoadCallback = function (element, index) {
        return function () {
            if (element.hasOwnProperty('readyState') && element.readyState == 'complete') {
                loadCallback(index);
            } else {
                loadCallback(index);
            }
        };
    };

    for (i = 0; i < files.length; i += 1) {
        fileUrl = files[i];

        // if we already loaded this class we callback right away and continue,
        // avoid duplicate <script> tags for the same file
        if (loadedFiles.hasOwnProperty(files[i])) {
            loadCallback(i);
            continue;
        }

        if (!fileUrl.match(/^http[s]/i)) {
            fileUrl = noobLoaderPrefix + fileUrl;
        }

        if (files[i].match(/\.css$/i)) {
            element = document.createElement('link');
            element.type = 'text/css';
            element.rel = 'stylesheet';
            element.href = fileUrl;
            loadCallback(i);
        } else {
            element = document.createElement('script');
            element.type = 'text/javascript';
            element.src = fileUrl;

            element.onreadystatechange = triggerLoadCallback(i);
            element.onload = triggerLoadCallback(i);
        }
        head.appendChild(element);

        loadedFiles[files[i]] = true;
    }
}

noobLoadInit($('[data-jsinit]')[0].getAttribute('data-jsinit'), function () {
    "use strict";

    var i, bufferInterval = setInterval(function () {
        if (noobLoaderInitialized) {
            noobLoad = noobLoadInit;
            noobLoadInit = null;

            if (initBuffer.length > 0) {
                for (i = 0; i < initBuffer.length; i += 1) {
                    noobLoad(initBuffer[i][0], initBuffer[i][1]);
                }

                initBuffer = [];
            }
            clearInterval(bufferInterval);
        }
    }, 100);
});
