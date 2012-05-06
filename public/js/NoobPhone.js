
noobLoad(['/js/PhoneTest.js', '/css/noobphone.css'], function () {
    "use strict";

    var phoneTest = new PhoneTest(),
        $htmlPhone = $('#noobphone');
    if (phoneTest.isBrowserSupported()) {
        noobTemplates.get('/templates/login.html', function fetchLoginHtml(err, html) {
            if (err) {
                console.error(err.msg);
                return;
            }
            $htmlPhone.html(html);
        });

        socketio.root.on('capability_token', function socketio_token(token) {
            $htmlPhone.empty();
            $htmlPhone.text('Initializing web phone...');

            noobLoad(['https://static.twilio.com/libs/twiliojs/1.0/twilio.min.js'], function () {
                Twilio.Device.setup(token);
                Twilio.Device.ready(function (device) {
                    $htmlPhone.empty();
                    noobTemplates.get('/templates/phone.html', function fetchPhoneHtml(err, html) {
                        if (err) {
                            console.error(err.msg);
                            return;
                        }
                        $htmlPhone.html(html);
                    });
                });

                Twilio.Device.error(function (error) {
                    console.error(error.message);
                });

                Twilio.Device.connect(function (conn) {
                    console.log("Successfully established call");
                });

                Twilio.Device.incoming(function(conn) {
                    console.log('incomming call... accepting!');
                    conn.accept();
                });

                $('#call').click(function (event) {
                    Twilio.Device.connect();
                });
            });
        });
    } else {
        $htmlPhone.empty();
        $htmlPhone.text('Browser does not support Twilio\'s WebPhone.');
    }
});
