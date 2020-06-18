var socket;
var throt = document.querySelector('#throt');
var throtObj = [
     document.querySelector('#lane1 .throttle'),
     document.querySelector('#lane2 .throttle')
]
const MAX_T = 62;
const MIN_T = 0;
var lastticksnum = [0,0];
var event = new Event('change');
var conText = `%c
 ░░░░  ░░░░░   ░░░░░    ░░░░░  ░░░  ░░ ░░░░░░   ░░   ░░
▒▒  ▒▒ ▒▒  ▒▒ ▒▒       ▒▒   ▒▒ ▒▒▒▒ ▒▒ ▒▒        ▒▒ ▒▒
▒▒▒▒▒▒ ▒▒▒▒▒  ▒▒       ▒▒   ▒▒ ▒▒ ▒▒▒▒ ▒▒▒▒▒  ▒▒  ▒▒▒
▓▓  ▓▓ ▓▓  ▓▓ ▓▓       ▓▓   ▓▓ ▓▓  ▓▓▓ ▓▓        ▓▓ ▓▓
██  ██ ██  ██  █████    █████  ██   ██ ██████   ██   ██
`

console.log(conText, 'color: #1e90ff;')

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

function updateThrottle(data) {
    data.forEach((val, idx, arr) => {
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

function randNum(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
}
