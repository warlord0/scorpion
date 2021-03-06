# Simple COntroller for Raspberry PI ON (scoRPIon)

## Wake On Wireless LAN!

Put simply it triggers a high value to a GPIO pin of your choice when a HTTP POST request is sent to the listening IP and TCP port.

Just what I wanted for a simple RPi Zero W to control a single 5v relay to turn on my PC remotely.

## How does it work

The Node.js program uses and Express web server to listen on port 3000. You can communicate with this from your browser using a GET. Using a browser you'll get a simple form that expects the token and the action you require to be submitted. So you can trigger the GPIO port from any browser on a phone or tablet - you just need to know the token.

But the real power is to drive it to trigger the GPIO pin you need to use a POST command and send 'application/JSON' in the with the secret token in the form `{ "token" : "supersecretkey" }`. This will set the default GPIO pin 21 value to 1 for .5 second, long enough to trip the relay and provide the momentary connection to power on your PC using the motherboard jumper connection for your power button.

You can use IFTTT.com's web request to trigger this for you by putting the json token into the "Body (optional)" or you can use curl.

```
$ curl -H "Content-Type: application/json" -X POST -d '{ "token" : "supersecretkey" }' http://[IPADDRESS]:3000/api
```

## API Actions

Beyond the initial toggle power on/off I've added the ability to force a shutdown. A regular power toggle is a .5 second activation of the power switch relay. A forced shutdown holds the relay for 10.5 seconds.

__API JSON__

```
{
  "token" : "supersecretkey",
  "action" : "on|off|force"
}
```

| action | Description |
| :-: | - |
| on | Activate power relay for 0.5 second |
| off | Activate power relay for 0.5 second |
| force |  Activate power relay for 10.5 seconds |

# Installation

You'll need to have connected your Pi to your LAN and installed __git__ and __Node.js__

Clone the project to your Pi using
```
$ git clone git@github.com:warlord0/scorpion.git
```

Install the prerequisites using:

```
$ cd scorpion
$ npm i
```
Run the program using:
```
$ npm start
```

> __NOTE:__ The user you run this as must be able to access the GPIO pins. Usually `root` can do this, so you could use `$ sudo npm start` to make it work. But if you're going to run it with non-root permissions you need to make your user a member of the `gpio` group and re-login:
```
$ sudo usermod -aG gpio $USER
```

## Running as a Service

You can run the program as a Linux service under systemd. I've included an example unit file that you'll need to edit to match your setup.

Edit the file `scorpion.service.example` and change the options for [PATH] and [USER] to match where you installed/cloned the program to and what user has permission to run it.

Then copy the _example_ file to `/etc/systemd/system/scorpion.service`, enable it to start on boot and then start the service.

```
$ sudo cp scorpion.service.example /etc/systemd/system/scorpion.service
$ sudo systemctl enable scorpion.service
$ sudo systemctl start scorpion.service
```

## Configuration

Change your `token` by creating a `.env` file in the same folder as the `index.js` program. Add in:

```
TOKEN=myownsecret
```

Then  when you start the program you'll need to pass your own token rather than the default.

### Checking Status of the Target Host

By using a tcp ping to an IP host it is able to determine if the target host is active. If it successfully connects to the target ip on the specified tcp port then you will see in the web GUI the switch for status will change to show that it is on.

I recommend you set the target port to something you know is open. Port 445 is the port used by a Windows hosts for networking so by using the `.env` config settings:

```
TARGETIP=192.168.0.1
TARGETPORT=445
```

The program will attempt to connect to port 445 on the specified IP. If you're using a \*nix host you might want to use another port like 22 or 80.

If you leave the port at the default of 0 (zero) then no pinging will take place.

### Other .env Settings

```
IP=0.0.0.0          # By default we'll listen on all IPv4 interfaces
PORT=3000           # By default we'll listen on TCP port 3000
GPIO=21             # By default we'll trigger the relay on GPIO 21 (BCM)
TARGETIP=127.0.0.1  # Ping the target to see if it's alive
TARGETPORT=0        # If >0 ping the target to see if the port is open
DEBUG=false         # Outputs console messages when set to true
```

# But why?

As you can't use the Wake On LAN feature if you have a Wifi connected PC I wanted something I could use to remotely power it on. I could use a smart home socket, but where's the fun in that?

A friend setup his PC to power on using a RPi and Amazon Alexa using a combination of tasks and features of WiringPi. I wanted something more in my field of expertise - Node.js and the Google Assistant (Home).

By using a Pi Zero W I have the benefit of connecting it to my Wireless LAN and powering it from my dormant PC's USB socket - so no other mains required. Then just use IFTTT or VPN into my home LAN or use my mobile phone at home and power on my PC from anywhere.

Using a Pi Zero W means I don't have a HAT or a USB dongle providing Wifi - so nothing clutters the header pins or sticks out from the Pi other than the USB power.

# The Hardware

1. Raspberry PI - Zero W or any Pi you have on your home LAN

2. [5v 1-Channel Relay Module](https://www.ebay.co.uk/itm/5V-1-Channel-Relay-Board-Module-for-Arduino-Raspberry-Pi-ARM-AVR-DSP-PIC/261993826722)

## Connections

__Pinouts__

| RPi pin | Name | Relay |
| -: | :-: | :-: |
| 2 | 5V | + (IN) |
| 39 | GND | - (GND) |
| 40 | GPIO21 | VCC |

| PC | Relay |
| :-: | - |
| + | COM (Common) 常用 |
| - | NO (Normally Open) 常开 |

# IFTTT.com

Configuring IFTTT.com is relatively easy. Configure an "If this+" for the Google Assistant on whatever single phrase you'd like eg. When I say "Turn on my PC", have it trigger a "that+" event for a "Webhook"

Set the URL of the webhook to point to your external IP address or dynamic DNS address on the port you have forwarded to your Pi (default: 3000) eg.

| Make a Web Request |
| - |
| __URL__ |
| http://[myexternalladdress]:3000/api |
| __Method__ |
| POST |
| __Content Type__ |
| application/json |
| __Body (optional)__* |
| { "token" : "supersecretkey", "action" : "on" } |


_* Not optional_

## Reference

* [Simple Header Pin Guide for Raspberry Pi](https://www.raspberrypi-spy.co.uk/2012/06/simple-guide-to-the-rpi-gpio-header-and-pins/)

* [Installing Node.js v8 on a RPi Zero](https://warlord0blog.wordpress.com/2018/06/27/node-js-v8-on-raspberry-pi-zero/)
