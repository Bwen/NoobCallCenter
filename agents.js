"use strict";

function Agents() {
    this.agents = [];
}

Agents.prototype.add = function add(agent) {
    this.agents.push(agent);
};

Agents.prototype.remove = function remove(nickname) {
    var i;
    for (i in this.agents) {
        if (this.agents.hasOwnProperty(i) && this.agents[i].nickname == nickname) {
            this.agents.splice(i, 1);
        }
    }
};

Agents.prototype.nextAvailable = function nextAvailable(departement) {
    this.agents.sort(function (a, b) {
        return a.available < b.available;
    });

    var i;
    for (i in this.agents) {
        if (this.agents.hasOwnProperty(i)) {
            if (departement === undefined) {
                if (this.agents[i].available) {
                    return this.agents[i];
                }
                continue;
            } else if (this.agents[i].hasOwnProperty('departements')
                    && this.agents[i].departements.indexOf(departement)
                    && this.agents[i].available) {
                return this.agents[i];
            }
        }
    }

    return null;
};

Agents.prototype.byCallSid = function get(callSid) {
    var i;
    for (i in this.agents) {
        if (this.agents.hasOwnProperty(i) && this.agents[i].hasOwnProperty('callSid') && this.agents[i].callSid == callSid) {
            return this.agents[i];
        }
    }
    return null;
};

Agents.prototype.get = function get(nickname) {
    var i;
    for (i in this.agents) {
        if (this.agents.hasOwnProperty(i) && this.agents[i].nickname == nickname) {
            return this.agents[i];
        }
    }
    return null;
};

module.exports = Agents;