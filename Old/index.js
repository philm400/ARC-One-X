var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http) //require socket.io module and pass the http object (server)
var path = require('path');
var noble = require('@abandonware/noble');
const promisify = require('util').promisify;

const PORT_NUMBER = 3000;
var throtVals = '0,0';
var deviceInfo = {};
var servInfo;
var servScaly;

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
    console.log('Websocket Open');
});

const POWER_LEVELS = [0x3f,0x3f,0x3f,0x3f,0x3f,0x3f];
const NO_POWER_TIMER_TICKING = [0x01].concat(POWER_LEVELS);
const POWER_ON_RACE_TRIGGER = [0x02].concat(POWER_LEVELS);
const POWER_ON_RACING = [0x03].concat(POWER_LEVELS);
const POWER_ON_TIMER_HALT = [0x04].concat(POWER_LEVELS);

function writeCmd(char, CMD, label = null) {
	console.log(CMD);
	var b = Buffer.from(CMD);
	char.write(b, true, function(error) {
		if (label) { console.log('Command write: '+label); }
		console.log('Data written: '+b);
	});
}
noble.on('stateChange', async (state) => {
    if (state === 'poweredOn') {
      await noble.startScanningAsync(['3b08'], false);
    }
});
noble.on('discover', async (peripheral)  => {
    await noble.stopScanningAsync();
    if (peripheral.advertisement.localName == 'Scalextric ARC') {
        console.log('Found device with uuid: ' + peripheral.uuid);
        console.log('Found device with local name: ' + peripheral.advertisement.localName);
        console.log();
        await peripheral.connectAsync();
        console.log('connected to peripheral: ' + peripheral.advertisement.localName);
        console.log();
        servInfo = await peripheral.discoverServicesAsync(['180a','3b08']); // set service for 0.Device info / 1.Scalextric Service
        await setDeviceInfo(servInfo[0]); // store characteristics from Device service

        peripheral.discoverSomeServicesAndCharacteristics(['3b08','180a'], ['3b09','3b0a','3b0b'], function(error, servs, chars) { // Slot, Throttle
            var cmds = chars[6];
            var throttle = chars[5];
            console.log(throttle);
            writeCmd(cmds, POWER_ON_RACING, 'POWER_ON_RACING');

            // to enable notify
            throttle.subscribe(function(error) {
                console.log('Throttle notification on');
            });
            throttle.notify(true);
            throttle.on('data', (data, isNotification) => {
                //console.log('Throttle Data')
                const bytes = new Uint8Array([data[1],data[2]]); // LANE throttle data lanes 1-2 | ARC One - 0x00 - 0xC3(0-64)
                const newVals = bytes.toString();
                if (newVals != throtVals) {
                    io.emit('throttle', {lane1:bytes[0], lane2:bytes[1]});
                    throtVals = newVals;
                    console.log(bytes);
                }
            });
        });
	}
});

async function setDeviceInfo(serv) {
    deviceInfo.model = (await (await serv.discoverCharacteristicsAsync(['2a24']))[0].readAsync()).toString();
    deviceInfo.manufacturer = (await (await serv.discoverCharacteristicsAsync(['2a29']))[1].readAsync()).toString();
    deviceInfo.hardware = (await (await serv.discoverCharacteristicsAsync(['2a27']))[2].readAsync()).toString();
    deviceInfo.software = (await (await serv.discoverCharacteristicsAsync(['2a28']))[3].readAsync()).toString();
    deviceInfo.firmware = (await (await serv.discoverCharacteristicsAsync(['2a26']))[4].readAsync()).toString();
    console.table(deviceInfo);
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