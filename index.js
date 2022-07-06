const express = require('express');
const MongoUtil = require('./MongoUtil');
const cors = require('cors');

const dotenv = require('dotenv').config();

const app = express();

// app.use(express.urlencoded({
//     extended: false
// }));

app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;

async function main() {
    const db = await MongoUtil.connect(MONGO_URI, "project2");
    console.log('connected to database');
    app.get('/test', async function(req,res) {
        let data = await db.collection('outdoor_activity').find({}).toArray();
        res.send(data);
    });
    // app.get('/', function(req,res){
    //     res.send('hello world')
    // })

    app.post('/tags', async function(req,res){
        // TODO: validation (as an execrise for the student)
        let category = req.body.category;
        let activity = req.body.activity;
        // when new Date() is called without an argument, then automatically
        // it will be the server's date and time
        // let datetime = req.body.datetime ? new Date(req.body.datetime) : new Date();
        let result = await db.collection('outdoor_activity').insertOne({
            'category': category,
            'activity': activity,
            // 'datetime': datetime
        })
        res.status(201); // set the status code to be 201
        res.send(result);
    })
}
main();

app.listen(3000, function () {
    console.log("server started");
})