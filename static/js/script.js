if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/static/js/service-worker.js')
        .then(() => console.log('Service Worker Registered'));
}


function playSound(type) {
    let audio;

    if (type === "hit") {
        audio = document.getElementById("hitSound");
    }

    if (type === "damage") {
        audio = document.getElementById("damageSound");
    }

    if (audio) {
        audio.currentTime = 0;
        audio.play();
    }
}

function playHitSound() {
    playSound("hit");
}

function playDamageSound() {
    playSound("damage");
}