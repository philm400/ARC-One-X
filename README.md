# ARC One-X
## A Node.js / BLE Scalextric web app for the ARC One power base
A race management web app for the Scalextric ARC One power base by connecting via Bluetooth (BLE via Noble) and using the data it broadcasts
![RMS Screen shot](https://github.com/philm400/Raspberry-Pi-Node.js-Scalextric-Race-Web-App/blob/master/private/screens/demo-screen-03.jpg?raw=true)

The core principle is to harness the data and increase the fun via a modern browser and big screen TV - This runs on my 4K 55" TV in the family room.

Mobile and tablet device support is available but still requires some work through future releases.

The Node.js project is inspired by a similar project I did a few years back based on an older analogue Scalextric Sport power base Python 3 on a Raspberry Pi 3b using the basic TKinter UI library and some reed sensors. It got the job done but wasn't great to look at.

This new platform is built on top of a simple Node.js/Express server with a Websocket provided by socket.IO and the Noble Bluetooth Low Energy module to access data broadcast by the ARC One base.

## Pre-requisites:
* Scalextric ARC One power Base (May work with ARC Air - but is untested)
* [Node.js](https://www.w3schools.com/nodejs/nodejs_raspberrypi.asp) (I'm using 12.x LTS)
* [Express](https://expressjs.com/) 
* [socket.io](https://www.npmjs.com/package/socket.io) for Node.js
* MacOS - XCode installed (install via AppStore)
* Windows 10 - Please refer to [Noble Windows Pre-requisites](https://github.com/abandonware/noble#windows)
* Linux - libbluetooth-dev
* Ubuntu, Debian, Raspbian (inc. Raspberry Pi OS) - sudo apt-get install bluetooth bluez libbluetooth-dev libudev-dev
* A Scalextric Track

## Installation
Assuming you already have Node.js and other pre-requisites installed, download the source files to your local machine and place in a named folder - e.g. /arc-one-x
In the terminal navigate to the folder containing the package.json file using cd {folder/path} and run the command:
```
npm install
```
This will install all of the Node.js dependancies required this app.

## Running the application
Again from the terminal in the same folder, run following command to start Node.js and start serving the application on port 3000.
```
node arc-one-x.js
```

From another device i.e. a laptop or desktop machine on the same network, you should be able access the Node.js server using a modern browser on the address: 

```
http://localhost:3000
```

Google Chrome, Firefox or MS Edge (the one based on the Chromium engine) are best used at this time

## Next steps
I have published a Kanban board here on GitHub to show the feature backlog I am working on and the project made so far. This is still a Work in Progress project with the ultimate aim that I scale it up and it works across the ARC family One/Air/Pro
Although i still need to buy the other power bases and start development.

I am also looking a new-ish API specification that some browsers are starting to implement which allows direct Bluetooth connection to BLE devices from the browser itself reducing a lot of the work done by the server in this project. It will also reduce the pre-requisite overheads needed to get the project installed and running.
[Web Bluetooth API](https://developers.google.com/web/updates/2015/07/interact-with-ble-devices-on-the-web)

Currently only Google Chrome (v51+) MS Edge (v79+ the newer versions using Chromium) and Opera (v43+) have implemented this API on Desktop apps and Chrome for Android (v81+), Opera Mobile (v46) and Samsung Internet (v6.2) on mobile devices

## Thanks
Many Thanks to dvd3500 from the [Slotracer.online](https://slotracer.online/community/member.php?action=profile&uid=125) forums for sharing the Scalextric ARC BLE Protocol doumentation.
And to Scalextric/Hornby for publishing the Protocol documentation to the community.
