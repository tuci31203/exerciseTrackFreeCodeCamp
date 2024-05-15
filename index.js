const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
mongoose.connect(process.env.MONGO, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


const userSchema = new mongoose.Schema({
  username: String,
})

const User = mongoose.model("User", userSchema)

const exerciseSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  description: String,
  duration: Number,
  date: Date,
})

const Exercise = mongoose.model("Exercise", exerciseSchema)

app.get('/api/users', async (req, res) => {
  try{
    const users = await User.find({}).select("_id username")
    if(users){
      res.json(users)
    }else{
      res.send("No users")
    }
  }catch(e){
    res.send(e)
  }
})

app.get('/api/users/:_id/logs', async (req, res) => {
  const {from, to, limit} = req.query
  const id = req.params._id

  try{
    const user = await User.findById(id)
    if(user){
      let dateObj = {}
      if(from){
        dateObj["$gte"] = new Date(from)
      }
      if(to){
        dateObj["$lte"] = new Date(to)
      }
      let filter = {
        user_id: id
      }
      if(from || to){
        filter.date = dateObj
      }

      try{
        const exes = await Exercise.find(filter).limit(+limit ?? 500)
        const log = exes.map(o => ({
          description: o.description,
          duration: o.duration,
          date: o.date.toDateString()
        }))
        res.json({
          username: user.username,
          count: exes.length,
          _id: user._id,
          log
        })

      }catch(e){
        res.send(e)
      }
    }else{
      return res.send("Could not find user")
    }
  }catch(err){
    res.send(e)
  }

})




app.post('/api/users', async (req, res) => {
  const user = new User({
    username: req.body.username
  })
  try {
    const add = await user.save()
    res.json(user)
  } catch (e) {
    console.log(e)
  }
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  const id = req.params._id
  const { description, duration, date } = req.body
  try {
    const user = await User.findById(id)
    if (!user) {
      res.send("Can not find user")
    } else {
      const exe = new Exercise({
        user_id: id,
        description,
        duration,
        date: date ? new Date(date) : new Date()
      })

      const add = await exe.save()
      res.json({
        _id: exe.user_id,
        username: user.username,
        description: exe.description,
        duration: exe.duration,
        date: exe.date.toDateString()
      })
    }
  } catch (e) {
    console.log(e)
    res.send("error add exercise")
  }
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
