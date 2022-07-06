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
    app.get('/', async function(req,res) {
        let data = await db.collection('outdoor_activity').find({}).toArray();
        res.send(data);
    });
    // app.get('/', function(req,res){
    //     res.send('hello world')
    // })

    app.listen(3000, function () {
        console.log("server started");
    })
}
main();

