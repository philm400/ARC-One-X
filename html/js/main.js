var parser = new DOMParser();
var socket;
var options = {
    running: false,
    laps: 20,
    player1: 'Driver 1',
    player2: 'Driver 2',
    lights: true,
    fastest: 99999999,
    lapCount: {
        lane1: { count: 0, pb: 99999999},
        lane2: { count: 0, pb: 99999999}
    }
};

const bkg = document.querySelector('#bkg');
const ui = document.querySelector('#ui-wrap');
const newg = document.querySelector('#newGame');
const lightOverlay = document.querySelector('#startingLights');
const lightPanel = document.querySelector('#startingLights .lights-panel');
const goPanel = document.querySelector('#startingLights .go-panel');
const lightSet = document.querySelectorAll('#startingLights .light');
const newgpanel = document.querySelector('.name-game-panel');
const lapOption = document.querySelector('#i-num-laps');
const p1 = document.querySelector('#i-player1');
const p2 = document.querySelector('#i-player2');
const l1 = document.querySelector('#lane1');
const l2 = document.querySelector('#lane2');
const lightSwitch = document.querySelector('#lights-toggle');
const logo = document.querySelector('#logo');
const startBtn = document.querySelector('#enter-game-btn');
const lapCountEl = (data) => `${data.count}/<small>${options.laps}</small>`; 

window.addEventListener('load', function() {
    console.log('Page Loaded')
    socket = io(); // Initialise socket.io-client to connect to host
    socket.on('lap', function (data) {
        console.log(data);
        lapTime(data);
    });
    updateTimer(new Date(0).toISOString().slice(14, 21));
     
    logo.addEventListener('animationend', showStart);
    function showStart() {
        startBtn.classList.add('on');
        logo.removeEventListener('animationend', showStart);
    }
});

const timerEl = document.querySelector("#timer_lane_1");
const lapsLane1 = document.querySelector("#console_lane_1");
const lapsLane2 = document.querySelector("#console_lane_2");
var parser = new DOMParser();
var worker = new Worker('/js/timer-worker.js'); // Threaded JS Worker

function lapTime(data) {
    console.log('Log Lap: '+data)
    var lapElement = () => `<li class="lap"><div>
                                <span class="lapNum">${data.lapCount}</span>
                                <span class="lapTime">${diff}</span>
                                <span class="raceTime">${runtime}</span>
                                <span class="fastestLap"></span></div>
                            </li>`;                   
    diff = new Date(data.lapTime).toISOString().slice(17, -1);   
    runtime = new Date(data.raceTime).toISOString().slice(14, -1);            
    let li = parser.parseFromString(lapElement(), 'text/html');
    audio[3].currentTime = 0;
    audio[3].play();
    if (data.lane == 1) {
        var lapCount = options.lapCount.lane1.count += 1; // update lane lap counter
        document.querySelector('#lane1 .lap-count').innerHTML = lapCountEl({count: lapCount});
        if (lapCount > options.lapCount.lane2.count) {
            l1.classList.remove('last');
            l1.classList.add('first');
            l2.classList.add('last');
        }
        lapsLane1.prepend(li.body.firstChild);
        updateFastestLap(1,data.lapTime)
        if (lapCount == options.laps) { // check if winner and end race
            endRace(1);
        }
    } else if (data.lane == 2) {
        var lapCount = options.lapCount.lane2.count += 1; // update lane lap counter
        document.querySelector('#lane2 .lap-count').innerHTML = lapCountEl({count: lapCount});
        if (lapCount > options.lapCount.lane1.count) {
            l2.classList.remove('last');
            l2.classList.add('first');
            l1.classList.add('last');
        }
        lapsLane2.prepend(li.body.firstChild);
        updateFastestLap(2,data.lapTime)
        if (lapCount == options.laps) { // check for winner and end race
            endRace(2);
        }
    }                 
}

worker.onmessage = function(e) {
    if(e.data.function == 'timer') {
        updateTimer(new Date(e.data.value).toISOString().slice(14, 21));
    }
}
function updateTimer(time) {
    timerEl.innerHTML = time;
}
function startRace() {
    if (!options.running){
        options.running = true;
        if (options.lights) {
            showLights(); // Show the lights
        } else {
            socket.emit('clientFN', {fn:'start'}); // trigger the server side clock
            worker.postMessage({function: 'start'}); // Start the timer in worker.
        }
    }
}
function devLap(lane) {
    socket.emit('clientFN', {fn:'lap', lane:lane}); // trigger the server side clock
}
function endRace(lane) {
    socket.emit('clientFN', {fn:'stop'}); // trigger the server side clock
    worker.postMessage({function: 'stop'}); // Race has been won, stop and show flag.
    console.log('WINNER: L'+lane);
    document.querySelector("#lane"+lane).classList.add('winner');
    audio[2].play();
}
function stopRace() {
    options.running = false;
    socket.emit('clientFN', {fn:'stop'}); // trigger the server side clock
    worker.postMessage({function: 'stop'}); // Stop the timer in worker.
    resetRace();
}
function resetRace() {
    worker.postMessage({function: 'reset'}); // reset the timer in worker.
    updateTimer(new Date(0).toISOString().slice(14, 21));
    resetLapCount();
    lapsLane1.innerHTML = '';
    lapsLane2.innerHTML = '';
    document.querySelector("#lane1").classList.remove('winner','last','first'); // remove race classes to reset
    document.querySelector("#lane2").classList.remove('winner','last','first'); // remove race classes to reset
    worker.postMessage({function: 'reset'}); // reset the race.
}
function updateFastestLap(lane, data) {
    if (lane == 1) {  // Handle personal best lap logic
        if (data < options.lapCount.lane1.pb) {
            options.lapCount.lane1.pb = data
            pbel = l1.querySelector('.pb') !== null
                if (pbel) { l1.querySelector('.pb').classList.remove('pb'); }
            lapsLane1.firstChild.classList.add('pb');
        }
    }
    if (lane == 2) {  // Handle personal best lap logic
        if (data < options.lapCount.lane2.pb) {
            options.lapCount.lane2.pb = data
            pbel = l2.querySelector('.pb') !== null
                if (pbel) { l2.querySelector('.pb').classList.remove('pb'); }
            lapsLane2.firstChild.classList.add('pb');
        }
    }
    var fastestLap = document.querySelector('.fastest');
    if (data < options.fastest) { // Handle fastest lap logic
        options.fastest = data;
        if (fastestLap !== null) {
            fastestLap.classList.remove('fastest');
        }
        if (lane == 1) {
            lapsLane1.firstChild.classList.add('fastest');
        } else {
            lapsLane2.firstChild.classList.add('fastest');
        }
    }
}


/* Functions below are UI interaction/Animation related  */

function raceOptions() { // handle button event to show New Game panel
    bkg.classList.add('blurUI-20');
    ui.classList.add('opacityUI-clear');
    bkg.addEventListener('animationend', handleAnimationEnd);

    function handleAnimationEnd() {
        newg.classList.add('flex');
        newgpanel.classList.add('UIReveal');
        bkg.removeEventListener('animationend', handleAnimationEnd);
    }
}
function closeOptions() { // handle button event to show New Game panel
    newgpanel.classList.add('UIExit');
    newgpanel.addEventListener('animationend', handleAnimationEnd);
    function handleAnimationEnd() {
        newg.classList.remove('flex');
        newgpanel.classList.remove('UIExit','UIReveal');
        returnUIBKG();
        newgpanel.removeEventListener('animationend', handleAnimationEnd);
    }
}
function returnUIBKG() {
    bkg.classList.add('reverse-blurUI-20');
    bkg.classList.remove('blurUI-20');
    ui.classList.add('reverse-opacityUI-clear');
    ui.classList.remove('opacityUI-clear');

    ui.addEventListener('animationend', handleAnimationEnd2);
    function handleAnimationEnd2() {
        bkg.classList.remove('reverse-blurUI-20');
        ui.classList.remove('reverse-opacityUI-clear');
        ui.removeEventListener('animationend', handleAnimationEnd2);
    }
}

function showLights() { // handle button event to show New Game panel
    bkg.classList.add('blurUI-20');
    ui.classList.add('opacityUI-clear');
    bkg.addEventListener('animationend', handleAnimationEnd);

    function handleAnimationEnd() {
        lightOverlay.classList.add('flex');
        // Start Lights Here
        var i=0;
        var seq = setInterval(() => {
            audio[0].play();
            lightSet[i].src = "/images/lights-on.png";
            i++;
            if (i == 5) {
                clearInterval(seq);
                setTimeout(() => {
                    audio[1].play();
                    socket.emit('clientFN', {fn:'start'}); // trigger the server side clock
                    worker.postMessage({function: 'start'}); // Start the timer in worker.
                    lightPanel.classList.add('hide');
                    goPanel.classList.add('show');
                    for (i = 0; i < lightSet.length; ++i) { // loop reset images for next race
                        lightSet[i].src = "/images/lights-off.png";
                    }
                    setTimeout(() => { // back to the race, clean up UI and reset for next race
                        lightOverlay.classList.remove('flex');
                        goPanel.classList.remove('show');
                        lightPanel.classList.remove('hide');
                        returnUIBKG();
                    }, 1000);
                }, 1000);
            }
        }, 1000);
        bkg.removeEventListener('animationend', handleAnimationEnd);
    }
}

/* OPTIONS FUNCTIONS */
function addLap() {
    var laps = parseInt(lapOption.value) + 1;
    lapOption.value = laps;
}
function minLap() {
    var laps = parseInt(lapOption.value) - 1;
    var newLaps = (laps < 0) ?  0 : laps;
    lapOption.value = newLaps;
}
function saveOptions() {
    options.laps = lapOption.value;
    options.player1 = p1.value;
    options.player2 = p2.value;
    if (lightSwitch.checked) {
        options.lights = true;
    } else {
        options.lights = false;
    }
    updatePlayers();
    resetLapCount();
    console.table(options);
    closeOptions();
}
function updatePlayers() {
    document.querySelector('#lane1 .player-name').innerHTML = options.player1;
    document.querySelector('#lane2 .player-name').innerHTML = options.player2;
}
function resetLapCount() {
    options.lapCount = {
        lane1: { count: 0, pb: 99999999},
        lane2: { count: 0, pb: 99999999}
    };
    options.fastest = 99999999;
    document.querySelector('#lane1 .lap-count').innerHTML = lapCountEl({count: 0});
    document.querySelector('#lane2 .lap-count').innerHTML = lapCountEl({count: 0});
}
function enterGame() {
    updatePlayers();
    resetLapCount();
    startBtn.classList.remove('on');
    setTimeout(() => {
        bkg.classList.remove('op-25');
        logo.classList.add('in-game');
        ui.classList.remove('hidden');
        ui.classList.add('reverse-opacityUI-clear');
        ui.addEventListener('animationend', handleAnimationEnd2);
        function handleAnimationEnd2() {
            ui.classList.remove('reverse-opacityUI-clear');
            ui.removeEventListener('animationend', handleAnimationEnd2);
        }
    }, 500);
}

var images = [];
var audio = [];
function preloadImages() {
    for (var i = 0; i < arguments.length; i++) {
        images[i] = new Image();
        images[i].src = preloadImages.arguments[i];
    }
}
preloadImages(
    "/images/checkered-b@2x.png",
    "/images/lights-on.png",
    "/images/lights-off.png"
)
function preloadAudio() {
    for (var i = 0; i < arguments.length; i++) {
        audio[i] = new Audio();
        audio[i].src = preloadAudio.arguments[i];
    }
}
preloadAudio(
    "/audio/beep--04-1.m4a",
    "/audio/beep--03-1.m4a",
    "/audio/gt.m4a",
    "/audio/lap-2.m4a"
)

function devMode() {
    document.body.classList.toggle('devModeOn');
}