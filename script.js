// AUDIO PLAYERS
const player = document.getElementById("player");
const festivalAudio = document.getElementById("festivalAudio");
const constructionAudio = document.getElementById("constructionAudio");

// SHRINE CONTROLS
const playBtn = document.getElementById("playBtn");
const festivalBtn = document.getElementById("festivalBtn");
const timeDisplay = document.getElementById("timeDisplay");
const sceneLabel = document.getElementById("sceneLabel");

// SHRINE BACKGROUNDS
const daytime = document.getElementById("daytime");
const nighttime = document.getElementById("nighttime");
const midnight = document.getElementById("midnight");

// FESTIVAL CONTROLS
const festivalView = document.getElementById("festivalView");
const festivalTitle = document.getElementById("festivalTitle");
const festivalDescription =
    document.getElementById("festivalDescription");

const returnBtn = document.getElementById("returnBtn");
const festivalPlayBtn =
    document.getElementById("festivalPlayBtn");

const festivalInfo = document.getElementById("festivalInfo");
const festivalTime = document.getElementById("festivalTime");
const festivalSceneLabel =
    document.getElementById("festivalSceneLabel");

// SETTINGS
const FADE_DURATION = 1500;
const SHRINE_VOLUME = 1;
const FESTIVAL_VOLUME = 1;
const CONSTRUCTION_VOLUME = 0.15;

// Store active audio fade animations
const audioFades = new Map();

// Remember whether the shrine was playing
let shrineWasPlaying = false;

// Prevent multiple simultaneous festival entrances
let currentLocation = "shrine";

const progressBar = document.getElementById("progressBar");
const durationDisplay =
    document.getElementById("durationDisplay");

/* ==========================================
   audio fade func
========================================== */

// Gradually change an audio element's volume
function fadeAudio(audio, targetVolume) {
    // Cancel an existing fade for this track
    if (audioFades.has(audio)) {
        cancelAnimationFrame(audioFades.get(audio));
        audioFades.delete(audio);
    }

    const startVolume = audio.volume;
    const startTime = performance.now();

    function animate(now) {
        const progress = Math.min(
            (now - startTime) / FADE_DURATION,
            1
        );

        // Smoothstep easing
        const eased =
            progress * progress * (3 - 2 * progress);

        const volume =
            startVolume +
            (targetVolume - startVolume) * eased;

        audio.volume = Math.max(0, Math.min(1, volume));

        if (progress < 1) {
            const frame = requestAnimationFrame(animate);
            audioFades.set(audio, frame);
        } else {
            audioFades.delete(audio);
            audio.volume = targetVolume;

            if (targetVolume === 0) {
                audio.pause();
            }
        }
    }

    const frame = requestAnimationFrame(animate);
    audioFades.set(audio, frame);
}

// Fade in an audio track
function fadeIn(audio, targetVolume) {
    // Cancel any existing fade before starting
    if (audioFades.has(audio)) {
        cancelAnimationFrame(audioFades.get(audio));
        audioFades.delete(audio);
    }

    if (audio.paused) {
        audio.volume = 0;
        audio.play().catch(function (error) {
            console.error("Audio playback failed:", error);
        });
    }

    fadeAudio(audio, targetVolume);
}

// Fade out and pause an audio track
function fadeOut(audio) {
    if (!audio.paused) {
        fadeAudio(audio, 0);
    }
}

/* ====================================
    helper func 
====================================== */

// Format seconds as M:SS
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return minutes + ":" +
        String(remainingSeconds).padStart(2, "0");
}

// Display one background at a time
function showScene(scenes, selectedScene) {
    scenes.forEach(function (scene) {
        scene.classList.toggle(
            "active",
            scene === selectedScene
        );
    });
}

/* ====================================
    festival bg images 
====================================== */

const eveningFestival = document.createElement("div");
eveningFestival.className = "festival-background";
eveningFestival.style.backgroundImage =
    'url("assets/evening-festival.png")';

const nightFestival = document.createElement("div");
nightFestival.className = "festival-background";
nightFestival.style.backgroundImage =
    'url("assets/night-festival.jpg")';

festivalView.prepend(eveningFestival, nightFestival);

/* ====================================
    shrine playback 
====================================== */

playBtn.addEventListener("click", function () {
    if (currentLocation !== "shrine") {
        return;
    }

    if (player.paused) {
        fadeIn(player, SHRINE_VOLUME);
    } else {
        fadeOut(player);
    }
});

player.addEventListener("play", function () {
    playBtn.textContent = "Pause Soundscape";
});

player.addEventListener("pause", function () {
    if (!player.ended) {
        playBtn.textContent = "Continue Listening";
    }
});

player.addEventListener("ended", function () {
    playBtn.textContent = "Experience Again";
});

/* ====================================
    shrine visual teansition 
====================================== */

player.addEventListener("timeupdate", function () {
    const currentTime = player.currentTime;

    timeDisplay.textContent = formatTime(currentTime);

    if (currentTime < 30) {
        showScene(
            [daytime, nighttime, midnight],
            daytime
        );

        sceneLabel.textContent = "Morning at the Shrine";

    } else if (currentTime < 60) {
        showScene(
            [daytime, nighttime, midnight],
            nighttime
        );

        sceneLabel.textContent = "Evening at the Shrine";

    } else {
        showScene(
            [daytime, nighttime, midnight],
            midnight
        );

        sceneLabel.textContent = "Nightfall at the Shrine";
    }
});

/* ====================================
    transitions 
====================================== */

function updateFestival() {
    const shrineTime = player.currentTime;

    // DAYTIME: Festival is still being prepared
    if (shrineTime < 30) {
        showScene(
            [eveningFestival, nightFestival],
            null
        );

        festivalTitle.textContent = "Festival Preparations";
        festivalDescription.textContent =
            "Come back later, they're still setting up.";

        festivalPlayBtn.hidden = true;
        festivalInfo.hidden = true;
        return;
    }

    // Festival is open
    festivalPlayBtn.hidden = false;
    festivalInfo.hidden = false;

    festivalTime.textContent =
        formatTime(festivalAudio.currentTime);

    // NIGHT: Enter directly into the night festival
    if (shrineTime >= 60 || festivalAudio.currentTime >= 30) {
        showScene(
            [eveningFestival, nightFestival],
            nightFestival
        );

        festivalTitle.textContent = "Festival After Dark";
        festivalDescription.textContent =
            "A peaceful evening in Itomori.";
        festivalSceneLabel.textContent = "Night Festival";

    } else {
        // EVENING: Festival is just beginning
        showScene(
            [eveningFestival, nightFestival],
            eveningFestival
        );

        festivalTitle.textContent = "The Festival Begins";
        festivalDescription.textContent =
            "The lanterns are lit. Enjoy the evening.";
        festivalSceneLabel.textContent = "Evening Festival";
    }
}

/* ====================================
    going to the festival 
====================================== */

festivalBtn.addEventListener("click", function () {
    if (currentLocation === "festival") {
        return;
    }

    shrineWasPlaying = !player.paused;
    currentLocation = "festival";

    // Fade out the shrine
    fadeOut(player);

    // Make festival visible
    festivalView.hidden = false;

    // Stop any leftover festival audio
    fadeOut(festivalAudio);
    fadeOut(constructionAudio);

    if (player.currentTime < 30) {
        // Daytime construction at 15% volume
        constructionAudio.currentTime = 0;
        fadeIn(constructionAudio, CONSTRUCTION_VOLUME);

    } else {
        // Evening festival ambience
        festivalAudio.currentTime = 0;
        fadeIn(festivalAudio, FESTIVAL_VOLUME);
    }

    updateFestival();
});

/* ====================================
    festival play/pause 
====================================== */

festivalPlayBtn.addEventListener("click", function () {
    if (festivalAudio.paused) {
        fadeIn(festivalAudio, FESTIVAL_VOLUME);
    } else {
        fadeOut(festivalAudio);
    }
});

festivalAudio.addEventListener("play", function () {
    festivalPlayBtn.textContent = "Pause Festival";
});

festivalAudio.addEventListener("pause", function () {
    if (!festivalAudio.ended) {
        festivalPlayBtn.textContent = "Continue Festival";
    }
});

festivalAudio.addEventListener("ended", function () {
    festivalPlayBtn.textContent = "Experience Again";
});

// Change festival visuals as the audio progresses
festivalAudio.addEventListener(
    "timeupdate",
    updateFestival
);

/* ====================================
    go back to shrine 
====================================== */

returnBtn.addEventListener("click", function () {
    if (currentLocation === "shrine") {
        return;
    }

    currentLocation = "shrine";

    // Fade out both festival audio tracks
    fadeOut(constructionAudio);
    fadeOut(festivalAudio);

    // Fade back to the shrine visually
    festivalView.hidden = true;

    // Resume shrine from its previous position
    if (shrineWasPlaying && !player.ended) {
        fadeIn(player, SHRINE_VOLUME);
    }
});

/* ====================================
    initial settings 
====================================== */

constructionAudio.volume = CONSTRUCTION_VOLUME;
festivalAudio.volume = FESTIVAL_VOLUME;
player.volume = SHRINE_VOLUME;

// Make sure the daytime shrine appears initially
showScene(
    [daytime, nighttime, midnight],
    daytime
);

updateFestival();

/* ==========================================
   interactive shrine progress bar
   ========================================== */

// Update the duration once the MP3 is loaded
player.addEventListener("loadedmetadata", function () {
    if (Number.isFinite(player.duration)) {
        progressBar.max = player.duration;
        durationDisplay.textContent =
            formatTime(player.duration);
    }
});

// Keep the progress bar synchronised with audio
function updateProgressBar() {
    const currentTime = player.currentTime;
    const duration = Number.isFinite(player.duration)
        ? player.duration
        : 90;

    progressBar.value = currentTime;

    const percentage = duration > 0
        ? (currentTime / duration) * 100
        : 0;

    progressBar.style.setProperty(
        "--progress",
        percentage + "%"
    );
}

player.addEventListener("timeupdate", updateProgressBar);

// Allow visitors to scrub through the soundscape
progressBar.addEventListener("input", function () {
    const newTime = Number(progressBar.value);

    player.currentTime = newTime;

    // Update the timeline immediately
    updateProgressBar();

    // Update the displayed time
    timeDisplay.textContent = formatTime(newTime);
});

// Set the initial progress position
updateProgressBar();

