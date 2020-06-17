var timeStart;
var timer;
var raceTimer = 0;
var running = false;

self.onmessage = function(e) {
    if (e.data.function == 'start') {
        running = true;
        timeStart = performance.now();
        splitsL1 = [{raceTime: 0, lapSplit: 0}];
        splitsL2 = [{raceTime: 0, lapSplit: 0}];
        timer = setInterval(() => {
            var newTime = performance.now();
            raceTimer = newTime - timeStart;                
            self.postMessage({function: 'timer', value: raceTimer});
        }, 3)
    }
    if (e.data.function == 'stop') {
        running = false;
        clearInterval(timer);
    }
    if (e.data.function == 'reset') {
        raceTimer = 0;
    }
}