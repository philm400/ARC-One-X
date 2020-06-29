class PitStop {
    constructor(data) {
        this.data = data;
        this.lapData = document.querySelector('#console_lane_'+this.data.lane);
        this.pitFlag = '';
        this.currentFuel = '';
        this.anim = '';
    }
    start() {
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
    exit() {
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
            audio[1].play();
        },1200);
        setTimeout(() => { // Hide after set time
            this.pitFlag.querySelector('.boxbox').classList.add('hide');
            this.pitFlag.classList.remove('flex');
            this.lapData.classList.remove('op-25','blur');
        }, 3000)
    }
}