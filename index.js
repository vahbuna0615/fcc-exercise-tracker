const express = require('express');
const app = express();
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();
const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGO_URI);
const db = client.db('exer-db');
const exercises = db.collection('exercises');

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', async (req, res) => {
  if (req.body.username) {
    const username = req.body.username;
    const _id = crypto.randomBytes(16).toString('hex');
    const userDoc = { username, _id, count: 1, log: []};
    await exercises.insertOne(userDoc);
    res.json({username, _id});
  } else {
    res.json({ error: 'Please enter a username' });
  }
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  const userDoc = await exercises.findOne({ _id: req.params._id });
  let date;
  if (req.body.date) {
    date = new Date(req.body.date).toDateString();
  }else {
    date = new Date().toDateString();
  }
  const exerDoc = {
    description: req.body.description,
    duration: +req.body.duration,
    date
  };

  userDoc.log.push(exerDoc);
  userDoc.count = userDoc.log.length;

  try {
    await exercises.findOneAndUpdate({ _id: req.params._id }, userDoc);
  }catch(err){
    console.log(err);
    await exercises.findOneAndReplace({ _id: req.params._id }, userDoc);
  }

  res.json(userDoc);

})

app.get('/api/users', async (req, res) => {
  res.json(await exercises.find().toArray())
});

app.get('/api/users/:_id/logs', async (req, res) => {
  // const { from, to, limit } = req.query;
  const userDoc = await exercises.findOne({ _id: req.params._id });
  if (!userDoc) {
    res.send('Could not find user');
    return;
  }
  // let dateObj = {};
  // if (from){
  //   dateObj["gte"] = new Date(from);
  // }
  // if (to){
  //   dateObj["lte"] = new Date(to);
  // }
  // let filter = {
  //   user_id: req.params._id
  // }
  // if (from || to){
  //   filter.date = dateObj;
  // }
  res.json(userDoc);
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
