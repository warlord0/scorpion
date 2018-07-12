#!/usr/bin/env node

const path = require('path')
  express = require('express'),
  app = express(),
  http = require('http').Server(app),
  io = require('socket.io')(http),
  bodyParser = require('body-parser'),
  gpio = require('gpio'),
  tcpping = require('tcp-ping')

// Read the config from the .env file
require('dotenv').config()

// Setup the parameters using .env values or defaults
const port = process.env.PORT || 3000
const GPIO = process.env.GPIO || 21
const ip = process.env.IP || '0.0.0.0'
const token = process.env.TOKEN || 'supersecretkey'
const targetIp = process.env.targetIp || '127.0.0.1'
const targetPort = process.env.targetPort || 0

// Setup the GPIO pin to use
var pin = gpio.export(GPIO, {
  direction: 'out',
  interval: 200,
  ready: () => {
    if (process.env.DEBUG)
      console.log('GPIO Ready')
  }
})

// On GPIO value change event
pin.on('change', () => {
  if (process.env.DEBUG)
    console.log('status: '+pin.value)
})

// Trigger the pin value high and reset low in .5 sec
powerOn = () => {
  pin.set(() => {
    setTimeout(() => {
      pin.reset()
    }, 500)
  })
}


// Hold the power toggle for 10.5 seconds to trigger a forced shutdown
forceOff = () => {
  pin.set(() => {
    setTimeout(() => {
      pin.reset()
    }, 10500)
  })
}
app.use(bodyParser.json())

app.use(express.static(path.join(__dirname, 'public')))

var options = {
  root: __dirname + '/public',
  dotfiles: 'deny'
}

io.on('connection', (socket) => {
  if (process.env.DEBUG) {
    console.log('Socket connected')
  }
})

// Process a http post request to the path /api
app.post('/api', (req, res) => {
  var response = { success: false }
  if (process.env.DEBUG && req.body.action)
    console.log('action: '+req.body.action)
  if (req.body.token && req.body.token == token) {
    switch (req.body.action) {
      case 'force':
        forceOff();
        break;
      case 'on': // On/Off is just a toggle
      case 'off':
      default:
        // Power on if the token matches
        powerOn()
        break;
      }
    response.success = true
    res.json(response)
  } else {
    res.status(403).json(response)
  }
})

// Only ping if the port is set
if (targetPort !== 0) {
  setInterval(() => {
    // Only make an active ping if a client is connected
    io.of('/').clients((err, clients) => {
      if (clients.length > 0) {
        if (process.env.DEBUG)
          console.log('Pinging '+targetIp+':'+targetPort)
        tcpping.probe(targetIp, targetPort, (err, available)  => {
          if (err) {

          } else {
            if (available) {
              io.emit('status', available)
            }
          }
        })
      }
    })
  }, 5000)
}

// Start listening
var server = app.listen(port, ip, () => {
  if (process.env.DEBUG)
    console.log('app listening on '+ip+':'+port)
})

io.listen(server)
