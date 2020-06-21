var parser = new DOMParser();
var socket;
var options = {
    running: false,
    laps: 20,
    player1: 'Driver 1',
    player2: 'Driver 2',
    lights: true,
    fueluse: false,
    tyrewear: false,
    units: 'mph',
    speed: 'scaled up',
    tracklen: 2.2,
    fastest: 99999999,
    lapCount: {
        lane1: { count: 0, pb: 99999999, telemetry: {
            lapTimes: [0],
            raceTimes: [0],
            avgSpeeds: [0],
            throttle: [], // Future use
            fuelBurn: [],
            tyreWear: []
        }},
        lane2: { count: 0, pb: 99999999, telemetry: {
            lapTimes: [0],
            raceTimes: [0],
            avgSpeeds: [0],
            throttle: [], // Future use
            fuelBurn: [],
            tyreWear: []
        }}
    },
    deviceInfo: {}
};
const MAX_T = 62;
const MIN_T = 0;
var lastticksnum = [0,0];

const bkg = document.querySelector('#bkg');
const ui = document.querySelector('#ui-wrap');
const newg = document.querySelector('#newGame');
const bleErr = document.querySelector('#BLEError');
const bleIcon = document.querySelector('#BLEicon');
const devTools = document.querySelector('#devTools');
const lightOverlay = document.querySelector('#startingLights');
const lightPanel = document.querySelector('#startingLights .lights-panel');
const goPanel = document.querySelector('#startingLights .go-panel');
const lightSet = document.querySelectorAll('#startingLights .light');
const newgpanel = document.querySelector('.name-game-panel');
const bleerrorpanel = document.querySelector('.ble-error-panel');
const lapOption = document.querySelector('#i-num-laps');
const p1 = document.querySelector('#i-player1');
const p2 = document.querySelector('#i-player2');
const l1 = document.querySelector('#lane1');
const l2 = document.querySelector('#lane2');
const lightSwitch = document.querySelector('#lights-toggle');
const fuelToogle = document.querySelector('#fuel-toggle');
const tyreToogle = document.querySelector('#tyres-toggle');
const trackLength = document.querySelector('#i-trackLen');
const speedUnit = document.querySelector('#i-speedUnits');
const speedScale = document.querySelector('#i-speedScale');
const logo = document.querySelector('#logo');
const startBtn = document.querySelector('#enter-game-btn');
const loaderRipp = document.querySelector('.loaderRipple');
const lapCountEl = (data) => `${data.count}/<small>${options.laps}</small>`; 
var throtObj = [
     document.querySelector('#lane1 .throttle'),
     document.querySelector('#lane2 .throttle')
]

window.addEventListener('load', function() {
    console.log('Page Loaded')
    socket = io(); // Initialise socket.io-client to connect to host
    socket.on('lap', function (data) {
        console.log(data);
        lapTime(data);
    });
    socket.on('throttle', function (data) {
        console.log(data);
        updateThrottle(data)
    });
    socket.on('pit start', function (data) {
        console.log(data);
    });
    socket.on('pit end', function (data) {
        console.log(data);
    });
    socket.on('ble status', function (data) {
        console.log(data);
        if (data.fn == 'error') {
            showErrorPanel();
        }
        if (data.fn == 'connected') {
            loaderRipp.classList.add('hide');
            startBtn.classList.add('on');
            bleIcon.classList.remove('hide');
        }
    });
    socket.on('deviceInfo', function (data) {
        console.table(data);
        options.deviceInfo = data;
    });
    socket.emit('clientFN', {fn:'ble connect'});
    updateTimer(new Date(0).toISOString().slice(14, 21));
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
                                <span class="avgSpd">${avgSpeed}</span>
                                <span class="fastestLap"></span></div>
                            </li>`;                   
    let diff = new Date(data.lapTime).toISOString().slice(17, -1);   
    let runtime = new Date(data.raceTime).toISOString().slice(14, -1); 
    let seconds = data.lapTime/1000;
    let mps = options.tracklen / seconds; // Calc Meters per second to convert into chosen speed
    let speed = 0;
    if (options.units == 'mph') { // MPH
        speed = mps * 2.237;
    } else if (options.units == 'kph') { // KPH
        speed = mps * 3.6;
    } else { // MPS
        speed = mps;
    }
    if (options.speed == 'scaled up') {
        speed = speed * 32;
    }
    let avgSpeed = speed.toFixed(1) + '<small> '+options.units+'</small>';       
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
        // Add telemetry data to log
        options.lapCount.lane1.telemetry.lapTimes.push(seconds);
        options.lapCount.lane1.telemetry.raceTimes.push(data.raceTime / 1000);
        options.lapCount.lane1.telemetry.avgSpeeds.push(speed.toFixed(1));
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
        // Add telemetry data to log
        options.lapCount.lane2.telemetry.lapTimes.push(seconds);
        options.lapCount.lane2.telemetry.raceTimes.push(data.raceTime / 1000);
        options.lapCount.lane2.telemetry.avgSpeeds.push(speed.toFixed(1));
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
    socket.emit('clientFN', {fn:'stop'}); // trigger the server stop
    worker.postMessage({function: 'stop'}); // Stop the timer in worker.
}
function resetRace() {
    socket.emit('clientFN', {fn:'reset'}); // trigger the server reset
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

function updateThrottle(data) {
    data.forEach((val, idx) => {
        let throtval = val;
        percent = Math.round(((throtval - MIN_T) * 100) / (MAX_T - MIN_T));
        ticksnum = Math.round(percent / 5);
        console.log('Val: '+throtval+'  |  Percent: '+percent+'%  |  ticks: '+ticksnum);
        var count = 0;
        if (ticksnum > lastticksnum[idx]) {
            let diff = ticksnum - lastticksnum[idx];
            var ticks = throtObj[idx].querySelectorAll('.tick:not(.on)');
            var loop = setInterval(() => {
                ticks[count].classList.add('on')
                count++;
                if (count === diff) {
                    clearInterval(loop);
                }
            },10);
        } else if (ticksnum < lastticksnum[idx]) {
            let diff = lastticksnum[idx] - ticksnum;
            var ticks = throtObj[idx].querySelectorAll('.tick.on');
            var tickLen = ticks.length-1;
            var loop = setInterval(() => {
                ticks[tickLen-count].classList.remove('on')
                count++;
                if (count === diff) {
                    clearInterval(loop);
                }
            },10);
        }
        lastticksnum[idx] = ticksnum;
    });
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

function retryError() {
    socket.emit('clientFN', {fn:'ble connect retry'}); // trigger the server retry
    closeError();
}
function showErrorPanel() { // Show error panel
    bkg.classList.add('blurUI-20');
    ui.classList.add('opacityUI-clear');
    bkg.addEventListener('animationend', handleAnimationEnd);

    function handleAnimationEnd() {
        bleErr.classList.add('flex');
        bleerrorpanel.classList.add('UIReveal');
        bkg.removeEventListener('animationend', handleAnimationEnd);
    }
}
function closeError() {     // close error panel
    bleerrorpanel.classList.add('UIExit');
    bleerrorpanel.addEventListener('animationend', handleAnimationEnd);
    function handleAnimationEnd() {
        bleErr.classList.remove('flex');
        bleerrorpanel.classList.remove('UIExit','UIReveal');
        returnUIBKG();
        bleerrorpanel.removeEventListener('animationend', handleAnimationEnd);
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
    options.laps = lapOption.value;  // # Laps
    options.player1 = p1.value;  // Driver names
    options.player2 = p2.value;
    options.lights = (lightSwitch.checked) ?  true : false;  // Starting Lights
    options.fueluse = (fuelToogle.checked) ?  true : false;  // Fuel use
    options.tyrewear = (tyreToogle.checked) ?  true : false;  // Tyre wear
    options.units = speedUnit.options[speedUnit.selectedIndex].value;  // Speed units
    options.speed = speedScale.options[speedScale.selectedIndex].value;  // Speed scale
    options.tracklen = trackLength.value; // Track lenth in Meters
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
        lane1: { count: 0, pb: 99999999, telemetry: {
            lapTimes: [0],
            raceTimes: [0],
            avgSpeeds: [0],
            throttle: [], // Future use
            fuelBurn: [],
            tyreWear: []
        }},
        lane2: { count: 0, pb: 99999999, telemetry: {
            lapTimes: [0],
            raceTimes: [0],
            avgSpeeds: [0],
            throttle: [], // Future use
            fuelBurn: [],
            tyreWear: []
        }}
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
        devTools.classList.remove('hide');
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