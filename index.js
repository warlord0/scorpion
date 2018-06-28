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

app.use(bodyParser.json())

// Send a simple response to a http request
app.get('/', (req, res) => {
  res.send('scoRPIon')
})

// Process a http post request to the path /api
app.post('/api', (req, res) => {
  var response = { success: false }
  if (req.body.token && req.body.token == token) {
    // Power on if the token matches
    powerOn()
    response.success = true
  }
  res.json(response)
})

// Start listening
app.listen(port, ip, () => {
  if (process.env.DEBUG)
    console.log('app listening on '+ip+':'+port)
})
