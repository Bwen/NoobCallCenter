var supports_html5_audio = null, sounds = {};
function is_html5_audio_supported() {
    "use strict";

    if (supports_html5_audio !== null) {
        return supports_html5_audio;
    }

    var a = document.createElement('audio');
    supports_html5_audio = !!(a.canPlayType && a.canPlayType('audio/x-wav;').replace(/no/, ''));
    return supports_html5_audio;
}

function stop_sound(url) {
    "use strict";

    if (is_html5_audio_supported()) {
        sounds[url].pause();
        delete sounds[url];
    } else {
        $("#sound").remove();
    }
}

function play_sound(url, loop) {
    "use strict";
    var sound;

    if (loop === undefined) {
        loop = false;
    }

    if (is_html5_audio_supported()) {
        sound = new Audio(url);
        sound.load();
        if (loop) {
            sound.addEventListener('ended', function () {
                sound.currentTime = 0;
                sound.play();
            }, false);
        }
        sound.play();
        sounds[url] = sound;
    } else {
        $("#sound").remove();
        sound = $("<embed id='sound' type='audio/x-wav' />");
        sound.attr('src', url);
        sound.attr('loop', loop);
        sound.attr('hidden', true);
        sound.attr('autostart', true);
        $('body').append(sound);
    }
}
