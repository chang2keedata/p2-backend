const express = require('express');
const MongoUtil = require('./MongoUtil');
const cors = require('cors');
const dotenv = require('dotenv').config();
const { ObjectId, StreamDescription } = require('mongodb');
const VENDOR = 'vendor';

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;

function getCheckboxValues(rawTags) {
    let tags = [];
    if (Array.isArray(rawTags)) {
        tags = rawTags;
    } else if (rawTags) {
        tags = [ rawTags ];
    }
    return tags;
}

async function main() {

    async function getVendorRecordById(id) {
        let vendorRecord = await db.collection(VENDOR).findOne({
            '_id': ObjectId(id)
        });
        return vendorRecord;
    }

    const db = await MongoUtil.connect(MONGO_URI, "project2");
    console.log('connected to database');

    // POST route cannot be tested via the browser
    app.post('/create', async function(req,res){
        // if(!req.body.name || req.body.name.length < 4){
        //     res.status(400.send("Input is required and should be minimum 4 characters"))
        //     return;
        // }
        
        try{

            let vendor = req.body.vendor;
            let street = req.body.address.street;
            let postcode = req.body.address.postcode;
            let opening_hours = req.body.opening_hours;
            let act_name = req.body.activity.push(act_name); 
            let act_difficulty = req.body.activity.push(act_difficulty);
            let tags = req.body.tags.split(',');
            let cost_desc = req.body.cost_desc;
            let cost = req.body.cost.split(',');
            let result = await db.collection(VENDOR).insertOne({
                'vendor': vendor,
                'address': {'street': street, 'postcode': postcode},
                'opening_hours': opening_hours,
                'activity': [{'name': act_name, 'difficulty': act_difficulty}],
                'tags': tags,
                'cost_desc': cost_desc,
                'cost': cost
            })
            res.status(201);
            res.send(result);
        }catch(e){
            res.status(500).send({"message": e})
        }
    })

    // search engine
    app.get('/outdoor', async function(req,res){
        // base query: the query that will get ALL the documents
        let criteria = {};
        let projection = {};

        if (req.query.opening) {
            criteria['opening'] = {
                '$regex': req.query.opening, '$options':'i'
            }
        }
        
        if (req.query.cost <= 30) {
            criteria['cost'] = {
                '$gt': 0,
                '$lte': 30 
            }
        } else if (req.query.cost > 30 && req.query.cost <= 100) {
            criteria['cost'] = {
                '$gt': 30,
                '$lte': 100
            }
        } else if (req.query.cost > 100) {
            criteria['cost'] = {
                '$gt': 100
            }
        }

        if (req.query.activity) {
            criteria["activity.difficulty"] = {
                "$regex": req.query.activity, "$options": 'i'
            };
            projection = { 'vendor': 1, 'activity.name': 1, 'activity.difficulty': 1};
        }

        if (req.query.tags) {
            criteria["tags"] = {
                "$in": [req.query.tags]
            }
        }

        let results = await db.collection(VENDOR).find(criteria)
            .project(projection).limit(10).toArray();
        res.status(200);
        res.send(results);
    })

    // update
    app.get('/update/:id', async function(req,res){
        let id = req.params.id;
        let vendorRecord = await getVendorRecordById(id);
        res.send(vendorRecord);
    })

    app.put('/update/:id', async function(req,res){
        let vendor = req.body.vendor;
        let street = req.body.address.street;
        let postcode = req.body.address.postcode;
        let opening_hours = req.body.opening_hours;
        let activity_name= req.body.activity_name;
        let activity_diff = req.body.activity_diff;
        let tags = getCheckboxValues(req.body.tags);
        let cost_desc = req.body.cost_desc;
        let cost = req.body.cost;

        let results = await db.collection(VENDOR).updateOne({
            '_id': ObjectId(req.params.id)
        },{
            '$set':{
                'vendor': vendor,
                'address.street': street, //object
                'address.postcode': postcode, //object
                'opening_hours': opening_hours,
                'activity.$.name': activity_name,
                'activity.$.difficulty': activity_diff,
                'tags.$': tags, //array
                'cost_desc': cost_desc,
                'cost.$': cost
            }
        });
        res.status(200);
        res.json(results);
    })

    // delete
    app.get('/delete/:id', async function(req,res){
        let id = req.params.id;
        let vendorRecord = await getVendorRecordById(id);
        // res.render('delete', {
        //     'vendorRecord': vendorRecord
        // });
        res.send(vendorRecord);
    })

    app.delete('/delete/:id', async function(req,res){
        let results = await db.collection(VENDOR).deleteOne({
            '_id': ObjectId
        });
        res.status(200);
        res.json({
            'status':'Ok'
        })
        res.redirect('/outdoor')
    })

    // embedded document
    app.get('/vendor/:activityid/comments/add', async function(req,res){
        let vendorRecord = await db.collection(VENDOR).findOne({
            '_id': ObjectId(req.params.activityid)
        },{
            'projection':{
                'activity': 1
            }
        })
    })

    

}
main();

app.listen(3000, function () {
    console.log("server started");
})