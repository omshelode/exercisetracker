const express = require('express')
const bodyParser = require("body-parser")
const cors = require('cors')
const { v4: uuidv4 } = require('uuid')
require('dotenv').config()

const app = express()

// Middleware
app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Home page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})

// In-memory storage
const users = []
const exercises = []
const logs = []

// Create a new user
app.post("/api/users", (req, res) => {
  const username = req.body.username
  const newUser = { _id: uuidv4(), username }
  users.push(newUser)
  logs.push({ ...newUser, count: 0, log: [] })
  res.json(newUser)
})

// Get all users
app.get("/api/users", (req, res) => {
  res.json(users.map(({ _id, username }) => ({ _id, username })))
})

// Add exercise to a user
app.post("/api/users/:_id/exercises", (req, res) => {
  const { _id } = req.params
  const { description, duration, date } = req.body
  const user = users.find(user => user._id === _id)
  if (!user) return res.status(404).json({ error: 'User not found' })

  const exerciseDate = date ? new Date(date) : new Date()
  const newExercise = {
    _id: user._id,
    username: user.username,
    description,
    duration: +duration,
    date: exerciseDate.toDateString()
  }

  exercises.push(newExercise)

  const log = logs.find(log => log._id === _id)
  log.count++
  log.log.push({
    description,
    duration: +duration,
    date: exerciseDate.toDateString()
  })

  res.json(newExercise)
})

// Get user's log with optional filters
app.get("/api/users/:_id/logs", (req, res) => {
  const { _id } = req.params
  const { from, to, limit } = req.query

  let log = logs.find(log => log._id === _id)
  if (!log) return res.status(404).json({ error: 'User not found' })

  let filteredLog = [...log.log]

  if (from) {
    const fromDate = new Date(from)
    filteredLog = filteredLog.filter(item => new Date(item.date) >= fromDate)
  }

  if (to) {
    const toDate = new Date(to)
    filteredLog = filteredLog.filter(item => new Date(item.date) <= toDate)
  }

  if (limit) {
    filteredLog = filteredLog.slice(0, +limit)
  }

  res.json({
    _id: log._id,
    username: log.username,
    count: filteredLog.length,
    log: filteredLog
  })
})

// Start the server
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
