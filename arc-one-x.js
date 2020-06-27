var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http) //require socket.io module and pass the http object (server)
var path = require('path');
const {performance} = require('perf_hooks')
var noble = require('@abandonware/noble');

console.log('\n ░░░░  ░░░░░   ░░░░░    ░░░░░  ░░░  ░░ ░░░░░░   ░░   ░░');
  console.log('▒▒  ▒▒ ▒▒  ▒▒ ▒▒       ▒▒   ▒▒ ▒▒▒▒ ▒▒ ▒▒        ▒▒ ▒▒');
  console.log('▒▒▒▒▒▒ ▒▒▒▒▒  ▒▒       ▒▒   ▒▒ ▒▒ ▒▒▒▒ ▒▒▒▒▒  ▒▒  ▒▒▒');
  console.log('▓▓  ▓▓ ▓▓  ▓▓ ▓▓       ▓▓   ▓▓ ▓▓  ▓▓▓ ▓▓        ▓▓ ▓▓');
  console.log('██  ██ ██  ██  █████    █████  ██   ██ ██████   ██   ██\n');

const PORT_NUMBER = 3000;
var throtVals = '0,0';
var deviceInfo = {};
var servInfo;
var charThrot;
var charCmd;
var charTrack;
var throtSetup = false;
var trackSetup = false;
var times = [0,[0],[0]];
var pitTimes = [0,{
    inPit:false,
    pitClock:0,
    io:false
},
{
    inPit:false,
    pitClock:0,
    io:false
}]
var laps = [0,[],[]];
var RACING = false;
var sf_bytes;
var pit_bytes;
var PIT_TRIGGER = 2000;
var BLEError = 0;
var BLEStatus = false;

const POWER_LEVELS = [0x3f,0x3f,0x3f,0x3f,0x3f,0x3f];
const NO_POWER_TIMER_TICKING = [0x01].concat(POWER_LEVELS);
const POWER_ON_RACE_TRIGGER = [0x02].concat(POWER_LEVELS);
const POWER_ON_RACING = [0x03].concat(POWER_LEVELS);
const POWER_ON_TIMER_HALT = [0x04].concat(POWER_LEVELS);

app.set('view engine','html');
app.use(express.static(path.join(__dirname,'html')));
// viewed at http://localhost:8080
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/html/index.html'));
});

http.listen(PORT_NUMBER, function() {
    console.log('Site active on: http://localhost:'+PORT_NUMBER);
});

io.on('connection', (socket) => {
    console.log('-- Websocket Open');
    // Socket.IO Listen for inbound events
    console.log('Waiting for BLE coontection request from client')
    socket.on('clientFN', (data) => {
        if (data.fn == 'start') {
            console.log('Race Start');
            startRace();
        }
        if (data.fn == 'stop') {
            console.log('Race Stop');
            stopRace();
        }
        if (data.fn == 'reset') {
            console.log('Race Reset');
            resetRace();
        }
        if (data.fn == 'lap') {
            console.log('Race Lap');
            // Send a test lap from a devMode socket call
            io.emit('lap', {fn:'lap', lane:data.lane, lapTime:2345, raceTime:48372, lapCount:12, sguid:sguid(8)})
        }
        if (data.fn == 'ble connect retry') {
            console.log('BLE Retry Connection');
            BLEError = 0;
            noble.startScanningAsync(null, false);
        }
        if (data.fn == 'ble connect') {
            BLEError = 0;
            setTimeout(() => {
                BLEstartup();
                console.log('BLE New Setup');
            }, 1500)
        }
        console.table(data);
    });
});

async function BLEstartup() {
    console.log('BLEstartup() {'+BLEStatus+'}')
    if (!BLEStatus) {
        console.log('in IF()');
        noble.on('stateChange', async (state) => {
            console.log('State: '+state)
            if (state === 'poweredOn') {
                await noble.startScanningAsync(null, false);
            }
        });
        noble.on('discover', async (peripheral)  => {
            await noble.stopScanningAsync();
            if (peripheral.advertisement.localName == 'Scalextric ARC') {
                console.log('BLE Connecting....');
                //console.log('    - Found device with uuid: ' + peripheral.uuid);
                console.log('   |- Found device with local name: ' + peripheral.advertisement.localName);
                await peripheral.connectAsync();
                console.log('   |- Connected to peripheral: ' + peripheral.advertisement.localName);
                console.log();
                servInfo = await peripheral.discoverSomeServicesAndCharacteristicsAsync(['180a','3b08'], ['3b09','3b0a','3b0b']); // set service for 0.Device info / 1.Scalextric Service
                try {
                    charCmd = servInfo.characteristics[1] // cmd info
                    await writeCmd(charCmd, NO_POWER_TIMER_TICKING, 'NO_POWER_TIMER_TICKING');
                } catch(error) {
                    console.error(error)
                }
                await setDeviceInfo(servInfo.services[0]); // store characteristics from Device service
                io.emit('ble status', {fn:'connected'});
                BLEError = 0;
                BLEStatus = true;
            } else {
                console.log('ERROR: No Device Found');
                if (BLEError < 10) {
                    setTimeout(() => {
                        noble.startScanning(null, false);
                        BLEError++;
                    },500);
                } else {
                    io.emit('ble status', {fn:'error', type:'No Connection'});
                }
            }
        });
    } else {
        io.emit('ble status', {fn:'connected'});
        io.emit('deviceInfo', deviceInfo);
    }
    noble.on('warning', async (message) => {
        console.log('WARNING: '+message);
    });
}

async function setDeviceInfo(serv) {
    deviceInfo.model = (await (await serv.discoverCharacteristicsAsync(['2a24']))[0].readAsync()).toString();
    deviceInfo.manufacturer = (await (await serv.discoverCharacteristicsAsync(['2a29']))[1].readAsync()).toString();
    deviceInfo.hardware = (await (await serv.discoverCharacteristicsAsync(['2a27']))[2].readAsync()).toString();
    deviceInfo.software = (await (await serv.discoverCharacteristicsAsync(['2a28']))[3].readAsync()).toString();
    deviceInfo.firmware = (await (await serv.discoverCharacteristicsAsync(['2a26']))[4].readAsync()).toString();
    console.table(deviceInfo);
    io.emit('deviceInfo', deviceInfo);
}
async function startRace() {
    RACING = true;
    await writeCmd(charCmd, POWER_ON_RACING, 'POWER_ON_RACING');
    await enableTrackData();
    await enableThrottle();
}
async function stopRace() {
    RACING = false;
    await writeCmd(charCmd, NO_POWER_TIMER_TICKING, 'NO_POWER_TIMER_TICKING');
    await disableTrackData();
    await disableThrottle();
}
async function resetRace() {
    times = [0,[0],[0]];
    pitTimes = [0,{inPit:false,pitClock:0,io:false},{inPit:false,pitClock:0,io:false}]
    laps = [0,[],[]];
}
async function writeCmd(char, CMD, label) {
	console.log(CMD);
	var b = Buffer.from(CMD);
    console.log(b);
    try {
        await char.writeAsync(b, true);
        if (label) { console.log('Command write: '+label); }
    } catch (error) {
        console.error(error);
    }
}
async function readCmd(char) {
    try {
        let data = await char.readAsync();
        console.log(data);
    } catch (error) {
        console.error(error);
    }
}

async function enableThrottle() {
    try {
        charThrot = servInfo.characteristics[0] // Throttle info
        await charThrot.subscribeAsync();
        console.log('Throttle ON');
        if (!throtSetup) {
            charThrot.on('data', (data, isNotification) => {
                const bytes = new Uint8Array([data[1],data[2]]); // LANE throttle data lanes 1-2 | ARC One - 0x00 - 0xC3(0-64)
                const newVals = bytes.toString();
                if ((newVals != throtVals) && RACING) {
                    io.emit('throttle', [bytes[0], bytes[1]]);
                    throtVals = newVals;
                    //console.log(bytes);
                }
            });
            throtSetup  = true;
        }
    } catch(error) {
        console.error(error)
    }
}
async function disableThrottle() {
    try {
        await charThrot.unsubscribeAsync();
        console.log('Throttle OFF');
    } catch(error) {
        console.error(error)
    }
}

async function enableTrackData() {
    try {
        charTrack = servInfo.characteristics[2] // Track info
        await charTrack.subscribeAsync();
        console.log('Track Data ON');
        if (!trackSetup) {
            charTrack.on('data', (data, isNotification) => {
                if (RACING) {
                    let newData = [0,0,0]; // carID, Start/finish time, Pit lane time
                    if (data[1] == 1) {
                        sf_bytes = new Uint8Array([data[2],data[3],data[4],data[5]]); // LANE 1 Start/Finish data - little endian R > L
                        pit_bytes = new Uint8Array([data[10],data[11],data[12],data[13]]); // LANE 1 Start/Finish data - little endian R > L
                    } else {
                        sf_bytes = new Uint8Array([data[6],data[7],data[8],data[9]]); // LANE 2 Start/Finish data - little endian R > L
                        pit_bytes = new Uint8Array([data[14],data[15],data[16],data[17]]); // LANE 2 Start/Finish data - little endian R > L
                    }
                    newData[0] = data[1]; // carID
                    newData[1] = new Uint32Array(sf_bytes.buffer)[0]; // convert to integer
                    newData[2] = new Uint32Array(pit_bytes.buffer)[0]; // convert to integer
                    //console.log(newData);
                    var diff = 0;
                    let newTick = newData[1] * 10; // convert to 1000th's sec - missing end digit
                    let newPitTick = newData[2] * 10; // convert to 1000th's sec - missing end digit
                    //console.log('Lane: '+newData[0]+'   diff: '+diff+'   newTick: '+newTick)
                    if (times[newData[0]].length > 1) { // check if the current car has started the race
                        if (newTick > times[newData[0]][times[newData[0]].length-1]) { // is this a new lap time? log it if yes
                            var sid = sguid(8)
                            diff = newTick - times[newData[0]][times[newData[0]].length-1]; // calc the diff = the lap time in ms
                            times[newData[0]].push(newData[1] * 10); // push it to the ticks array
                            laps[newData[0]].push(new Date(diff).toISOString().slice(17, -1)); // create a lap time object snd store
                            console.log('Lane '+newData[0]+': '+laps[newData[0]][laps[newData[0]].length-1]);
                            pitTimes[newData[0]].inPit = true;// car is now in pitzone
                            pitTimes[newData[0]].pitClock = performance.now();
                            io.emit('lap', {
                                fn: 'lap',
                                lane: newData[0],
                                lapTime: parseInt(diff),
                                raceTime: times[newData[0]][times[newData[0]].length-1],
                                lapCount: laps[newData[0]].length,
                                sguid: sid
                            });
                        }
                        if (times[newData[0]].length == 2) {
                            console.log('Lane '+newData[0]+':  ---  Go, Go, Go!!!!');
                        }
                        if ((newPitTick > times[newData[0]][times[newData[0]].length-1]) && (pitTimes[newData[0]].inPit)) { // EXIT PIT
                            let tick = performance.now(); // how log has car benn in pit zone
                            let pitDiff = tick - pitTimes[newData[0]].pitClock;
                            if (pitDiff > PIT_TRIGGER) { // PIT STOP: this is a pit stop that is ending
                                console.log('Lane '+newData[0]+':  --- PIT END - BACK RACING...');
                                io.emit('lap', {fn: 'pit exit',
                                    lane: newData[0],
                                    pitLength: pitDiff
                                });
                            }
                            pitTimes[newData[0]].inPit = false;// car is out of pitzone
                            pitTimes[newData[0]].pitClock = 0;
                            pitTimes[newData[0]].io = false;
                        }
                        if (pitTimes[newData[0]].inPit) { // check car is in pitzone
                            let tick = performance.now(); // how log has car benn in pit zone
                            let pitDiff = tick - pitTimes[newData[0]].pitClock;
                            if ((pitDiff > PIT_TRIGGER) && (!pitTimes[newData[0]].io)) { // PIT STOP: if in pit zone more than 2s
                                console.log('Lane '+newData[0]+':  --- PIT STOP...');
                                io.emit('lap', {fn: 'pit start',
                                    lane: newData[0]
                                });
                                pitTimes[newData[0]].io = true;
                            }
                        }
                    } else {
                        if ((newTick > times[newData[0]][times[newData[0]].length-1]) || (times[newData[0]].length == 0)) { // is a new time logged
                            console.log('Lane '+newData[0]+':  ---  Ready...')
                            times[newData[0]].push(newData[1] * 10); // add the tick to the array as the car passes the start line to begin race
                        }
                    }
                }
            });
        }
    } catch(error) {
        console.error(error)
    }
}

async function disableTrackData() {
    try {
        await charTrack.unsubscribeAsync();
        console.log('Track Data OFF');
    } catch(error) {
        console.error(error)
    }
}

function sguid(len) {
  var alpha = '0123456789abcdef';
  var sid = '';
  for (var i = 0; i < len; i++) {
    sid += alpha.charAt(Math.floor(Math.random() * alpha.length));
  }
  return sid;
}

// Cleanup function on exit
function exitApp() {
    io.close();
    console.log('\rWebsocket Closed');
    http.close(() => {
      console.log('Server terminated')
      console.log('\x1b[31m%s\x1b[0m','EXIT');
      process.exit(0); //exit completely
    });
}
  
// Cleanup event handlers
process.on('SIGTERM', () => {
    exitApp();
});
process.on('SIGINT', () => {
    exitApp();
});