function parseQuerystring(string) {
    "use strict";

    if (string == '' || string == undefined) {
        return {};
    }

    var obj = {},
        pairs = string.split('&');

    $.each(pairs, function (i, v) {
        var pair = v.split('='), value = pair[1];

        if (value.match(/^\d+$/)) {
            value = parseFloat(value);
        } else if (value.match(/^true$/i)) {
            value = true;
        } else if (value.match(/^false$/i)) {
            value = false;
        } else if (value.match(/^null$/i)) {
            value = null;
        }

        obj[pair[0]] = value;
    });
    return obj;
}

function getCookie(name) {
    "use strict";

    var rawCookies = document.cookie.split(';'), i, keyValue;
    for (i = 0; i < rawCookies.length; i += 1) {
        keyValue = rawCookies[i].split('=');
        if (keyValue[0] == name) {
            return keyValue[1];
        }
    }
    return null;
}

function ucfirst(str) {
    "use strict";

    str += '';
    var f = str.charAt(0).toUpperCase();
    return f + str.substr(1);
}

function removeDupes(arr) {
    "use strict";

    var nonDupes = [];
    arr.forEach(function (value) {
        if (nonDupes.indexOf(value) == -1) {
            nonDupes.push(value);
        }
    });
    return nonDupes;
}

function inherits(subClass, baseClass) {
    "use strict";

    function Inheritance() {}
    Inheritance.prototype = baseClass.prototype;

    subClass.prototype = new Inheritance();
    subClass.prototype.constructor = subClass;
}

function mergeRecursive(obj1, obj2) {
    "use strict";
    var p;
    for (p in obj2) {
        if (obj2.hasOwnProperty(p)) {
            try {
                if (obj2[p].constructor == Object) {
                    obj1[p] = mergeRecursive(obj1[p], obj2[p]);
                } else {
                    obj1[p] = obj2[p];
                }
            } catch (e) {
                obj1[p] = obj2[p];
            }
        }
    }

    return obj1;
}

if ('undefined' == typeof window) {
    module.exports.mergeRecursive = mergeRecursive;
    module.exports.removeDupes = removeDupes;
    module.exports.inherits = inherits;
}
