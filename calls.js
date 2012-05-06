"use strict";

function Calls() {
    this.calls = [];
}

Calls.prototype.add = function add(call) {
    this.calls.push(call);
};

Calls.prototype.total = function total() {
    return this.calls.length;
};

Calls.prototype.remove = function remove(CallSid) {
    var i;
    for (i in this.calls) {
        if (this.calls.hasOwnProperty(i) && this.calls[i].data.CallSid == CallSid) {
            this.calls.splice(i, 1);
        }
    }
};

Calls.prototype.next = function next(departement) {
    this.calls.sort(function (a, b) {
        return a.timestamp < b.timestamp;
    });

    var i;
    for (i in this.calls) {
        if (this.calls.hasOwnProperty(i)) {
            if (departement === undefined) {
                if (this.calls[i].timestamp
                 && this.calls[i].ready
                 && !this.calls[i].answered) {
                    return this.calls[i];
                }
                continue;
            } else if (this.calls[i].hasOwnProperty('departements')
                    && this.calls[i].departements.indexOf(departement)
                    && this.calls[i].timestamp
                    && this.calls[i].ready
                    && !this.calls[i].answered) {
                return this.calls[i];
            }
        }
    }

    return null;
};

Calls.prototype.get = function get(CallSid) {
    var i;
    for (i in this.calls) {
        if (this.calls.hasOwnProperty(i) && this.calls[i].data.CallSid == CallSid) {
            return this.calls[i];
        }
    }
    return null;
};

module.exports = Calls;