function PhoneTest() {
    "use strict";
}

PhoneTest.prototype.testJavascript = function testJavascript() {
    "use strict";

    return true;
};

PhoneTest.prototype.testBrowser = function testBrowser() {
    "use strict";

    // Google Chrome 11+ , Internet Explorer 7+, Safari 5+, and Firefox 3.6+
    return true;
};

PhoneTest.prototype.testFlash = function testFlash() {
    "use strict";

    // Flash 10.1
    return true;
};

PhoneTest.prototype.isBrowserSupported = function isBrowserSupported() {
    "use strict";

    var jsTest = this.testJavascript(),
        browserTest = this.testBrowser(),
        flashTest = this.testFlash();

    if (jsTest && browserTest && flashTest) {
        return true;
    }
    return false;
};

