class Lane {
    constructor(data) {
        this.data = data;
        this.lapData = document.querySelector('#console_lane_'+this.data.lane);
        this.pitFlag = '';
        this.currentFuel = '';
        this.anim = '';
    }
    newLap(data) {
        console.log('Log Lap: '+data)
        console.log(data)
        var lapElement = () => `<li class="lap"><div>
                                    <span class="lapNum">${data.lapCount}</span>
                                    <span class="lapTime">${diff}</span>
                                    <span class="raceTime">${runtime}</span>
                                    <span class="avgSpd">${avgSpeed}</span>
                                    <span class="fastestLap"></span></div>
                                </li>`;                   
        let diff = new Date(data.lapTime).toISOString().slice(17, 22);   
        let runtime = new Date(data.raceTime).toISOString().slice(14, 22); 
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
        data.other = (data.lane == 1) ? 2 : 1;
        var lapCount = options.lapCount['lane'+data.lane].count += 1; // update lane lap counter
        document.querySelector('#lane'+data.lane+' .lap-count').innerHTML = lapCountEl({count: lapCount});
        if (lapCount > options.lapCount.lane2.count) {
            laneDOM[data.lane].classList.remove('last');
            laneDOM[data.lane].classList.add('first');
            laneDOM[data.other].classList.add('last');
        }
        lapsList[data.lane].prepend(li.body.firstChild);
        updateFastestLap(data.lane, data.lapTime)
        if (lapCount == options.laps) { // check if winner and end race
            endRace(data.lane);
        }
        // Add telemetry data to log
        options.lapCount['lane'+data.lane].telemetry.lapTimes.push(seconds);
        options.lapCount['lane'+data.lane].telemetry.raceTimes.push(data.raceTime / 1000);
        options.lapCount['lane'+data.lane].telemetry.avgSpeeds.push(speed.toFixed(1));
    }
    pitStart() {
        console.log(test);
        this.currentFuel = options.lapCount['lane'+this.data.lane].telemetry.fuelBurn.current;
        if (this.data.lane == 1) {
            this.pitFlag = l1.querySelector('.pitIndicator');
        } else {
            this.pitFlag = l2.querySelector('.pitIndicator');
        }
        this.pitCrew = this.pitFlag.querySelector('.pitProgress .bar');
        this.lapData.classList.add('hide');
        this.pitFlag.classList.add('flex');
        this.pitFlag.querySelector('.inPit').classList.remove('hide');
        this.anim = this.pitCrew.animate([
            { width: '0%' }, 
            { width: '100%' }
        ], { 
            duration: options.pitStopLen,
            iterations: 1,
            fill: 'forwards'
        });
        this.count = 1;
        this.fuelBlock = (100 - this.currentFuel) / 10;
        pitTimers[this.data.lane] = setInterval(() => {
            // Do some stuff for Tyres and Fuel
            options.lapCount['lane'+this.data.lane].telemetry.fuelBurn.current += this.fuelBlock; // Add fuel each tick
            updateFuel([0,0]);
            // if this is the last tick in the pitstop reset and end
            if (this.count > 9) {
                clearInterval(pitTimers[this.data.lane]);
                pitTimers[this.data.lane] = 0;
                this.pitFlag.querySelector('.inPit').classList.add('hide');
                this.pitFlag.querySelector('.gogogo').classList.remove('hide');
            }
            console.log(this.count);
            console.log('refuelled: '+options.lapCount['lane'+this.data.lane].telemetry.fuelBurn.current);
            this.count++;
        }, options.pitStopLen/10);
        console.log('refuelled: '+options.lapCount['lane'+this.data.lane].telemetry.fuelBurn.current);
    }
    pitExit() {
        this.anim.cancel();
        options.lapCount['lane'+this.data.lane].telemetry.boxbox = false;
        clearInterval(pitTimers[this.data.lane]);
        this.lapData.classList.remove('hide');
        this.pitFlag.classList.remove('flex');
        this.pitFlag.querySelector('.gogogo').classList.add('hide');
        this.pitFlag.querySelector('.inPit').classList.add('hide');
    }
    boxbox() {
        if (this.data.lane == 1) {
            this.pitFlag = l1.querySelector('.pitIndicator');
        } else {
            this.pitFlag = l2.querySelector('.pitIndicator');
        }
        options.lapCount['lane'+this.data.lane].telemetry.boxbox = true;
        this.lapData.classList.add('op-25','blur'); // BOX BOX BOX
        this.pitFlag.classList.add('flex');
        this.pitFlag.querySelector('.boxbox').classList.remove('hide');
        audio[4].play();
        setTimeout(() => {
            audio[4].play();
        },1200);
        setTimeout(() => { // Hide after set time
            this.pitFlag.querySelector('.boxbox').classList.add('hide');
            this.pitFlag.classList.remove('flex');
            this.lapData.classList.remove('op-25','blur');
        }, 3000)
    }
}