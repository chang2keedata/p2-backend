const express = require('express');
const {connect} = require('./MongoUtil');

const dotenv = require('dotenv').config();

const app = express();

app.use(express.urlencoded({
    extended: false
}));

const MONGO_URI = process.env.MONGO_URI;

app.use(express.urlencoded({
    extended: false
}));

async function main() {
  
    const db = await MongoUtil.connect(MONGO_URI, "project2");
    app.get('/test', async function(req,res) {
        let data = await db.collection('outdoor_activity').find({}).toArray();
        res.send(data);
    });
}
main();

app.listen(3000, function () {
    console.log("hello world");
})