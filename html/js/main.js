var socket;
var throt = document.querySelector('#throt');
var throttleticks = document.querySelectorAll('.throttle .tick');
const MAX_T = 62;
const MIN_T = 0;
var lastticksnum = 0;
var event = new Event('change');

window.addEventListener('load', function() {
    throt.addEventListener('change', updateThrottle, false);
    socket = io();
    socket.on('throttle', function (data) {
        console.log(data);
        updateThrottle(data)
    });
    socket.on('device', function (data) {
        console.table(data);
    });
});

/* function updateThrottle() {
    let throtval = throt.value;
    percent = Math.round(((throtval - MIN_T) * 100) / (MAX_T - MIN_T));
    ticksnum = Math.round(percent / 5);
    console.log('Val: '+throtval+'  |  Percent: '+percent+'%  |  ticks: '+ticksnum);
    for(i=0; i<20; i++) {
        if (i < ticksnum) {
            throttleticks[i].classList.add('on');
        } else {
            throttleticks[i].classList.remove('on');
        }
    }
} */

function updateThrottle(data) {
    let throtval = data.lane1;
    percent = Math.round(((throtval - MIN_T) * 100) / (MAX_T - MIN_T));
    ticksnum = Math.round(percent / 5);
    console.log('Val: '+throtval+'  |  Percent: '+percent+'%  |  ticks: '+ticksnum);
    var count = 0;
    if (ticksnum > lastticksnum) {
        let diff = ticksnum - lastticksnum;
        var ticks = document.querySelectorAll('.throttle .tick:not(.on)');
        var loop = setInterval(() => {
            ticks[count].classList.add('on')
            count++;
            if (count === diff) {
                clearInterval(loop);
            }
        },10);
    } else if (ticksnum < lastticksnum) {
        let diff = lastticksnum - ticksnum;
        var ticks = document.querySelectorAll('.throttle .tick.on');
        var tickLen = ticks.length-1;
        var loop = setInterval(() => {
            ticks[tickLen-count].classList.remove('on')
            count++;
            if (count === diff) {
                clearInterval(loop);
            }
        },10);
    }
    lastticksnum = ticksnum;
}

function randNum(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
}