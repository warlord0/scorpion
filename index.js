#!/usr/bin/env node

const express = require('express')
const bodyParser = require('body-parser')
const gpio = require('gpio')
const app = express()

// Read the config from the .env file
require('dotenv').config()

// Setup the parameters using .env values or defaults
const port = process.env.PORT || 3000
const GPIO = process.env.GPIO || 21
const ip = process.env.IP || '0.0.0.0'
const token = process.env.TOKEN || 'supersecretkey'

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

var options = {
  root: __dirname + '/public',
  dotfiles: 'deny'
}

app.get('/', (req, res, next) => {
  res.sendFile('index.html', options, (err) => {
    if (err) {
      // console.log(err)
      next(err)
    } else {

    }
  })
})

// Send a simple response to a http request
app.get('/:path/:name', (req, res, next) => {
  res.sendFile('/'+req.params.path+'/'+req.params.name, options, (err) => {
    if (err) {
      // console.log(err)
      res.sendStatus(err.statusCode).send(err.rerror)
      next(err)
    } else {

    }
  })
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

// Start listening
app.listen(port, ip, () => {
  if (process.env.DEBUG)
    console.log('app listening on '+ip+':'+port)
})
