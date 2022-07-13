const express = require('express');
const MongoUtil = require('./MongoUtil');
const cors = require('cors');
const dotenv = require('dotenv').config();
const { ObjectId } = require('mongodb');
const VENDOR = 'vendor';

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;

async function main() {

    const db = await MongoUtil.connect(MONGO_URI, "project2");
    console.log('connected to database');

    async function getVendorRecordById(id) {
        let vendorRecord = await db.collection(VENDOR).findOne({
            '_id': ObjectId(id)
        });
        return vendorRecord;
    }

    async function getCommentFromReview(id, id2) {
        let vendorRecord = await db.collection(VENDOR).findOne({
            '_id': ObjectId(id),
            'review._id': ObjectId(id2)
        },{
            'projection':{
                'review.$': 1
            }
        });
        return vendorRecord;
    }

    // vendor creation
    app.post('/create', async function(req,res){
        // if(!req.body.name || req.body.name.length < 4){
        //     res.status(400.send("Input is required and should be minimum 4 characters"))
        //     return;
        // }     
        try {
            let vendor = req.body.vendor;
            let street = req.body.address.street;
            let postcode = req.body.address.postcode;
            let opening_hours = req.body.opening_hours;
            let activity = req.body.activity;
            // let name = req.body.activity[0].name; 
            // let difficulty = req.body.activity[0].difficulty;
            let tag = req.body.tag.split(',');
            let cost_desc = req.body.cost_desc;
            let cost = req.body.cost.split(',');

            let result = await db.collection(VENDOR).insertOne({
                'vendor': vendor,
                'address': {'street': street, 'postcode': postcode},
                'opening_hours': opening_hours,
                'activity': activity,
                // 'activity': [{'name': name, 'difficulty': difficulty}],
                'tag': tag,
                'cost_desc': cost_desc,
                'cost': cost
            })
            res.status(201);
            res.send(result);
        } catch(e) {
            res.status(500).send({"message": e})
        }
    })

    // search engine
    app.get('/search', async function(req,res){
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

        if (req.query.tag) {
            criteria["tag"] = {
                "$in": [req.query.tag]
            }
        }

        let results = await db.collection(VENDOR).find(criteria)
            .project(projection).limit(10).toArray();
        res.status(200);
        res.send(results);
    })

    // update
    app.get('/update/:id', async function(req,res){
        let vendorRecord = await getVendorRecordById(req.params.id);
        res.send(vendorRecord);
    })

    app.put('/update/:id', async function(req,res){
        try {
            let vendor = req.body.vendor;
            let street = req.body.street;
            let postcode = req.body.postcode;
            let opening_hours = req.body.opening_hours;
            let activity = req.body.activity;
            // let name = req.body.name;
            // let difficulty = req.body.difficulty;
            let tag = req.body.tag.split(',');
            let cost_desc = req.body.cost_desc;
            let cost = req.body.cost.split(',');

            let results = await db.collection(VENDOR).updateOne({
                '_id': ObjectId(req.params.id)
            },{
                '$set':{
                    'vendor': vendor,
                    'address.street': street,
                    'address.postcode': postcode,
                    'opening_hours': opening_hours,
                    'activity' : activity,
                    // 'activity.name': name,
                    // 'activity.difficulty': difficulty,
                    'tag': tag,
                    'cost_desc': cost_desc,
                    'cost': cost
                }
            });
            res.status(200);
            res.json(results);
        } catch(e) {
            res.status(500).send({"message": e})
        }
    })

    // delete
    app.get('/delete/:id', async function(req,res){
        let vendorRecord = await getVendorRecordById(req.params.id);
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
        res.redirect('/')
    })

    // embedded document
    // display the review form
    app.get('/vendor/:id/review/add', async function(req,res){
        let vendorRecord = await db.collection(VENDOR).findOne({
            '_id': ObjectId(req.params.id)
        },{
            'projection':{
                'activity.name': 1
            }
        })
        res.send(vendorRecord);
        // res.render('add-review',{
        //     'vendorRecord':vendorRecord
        // })
    })

    // add comment
    app.post('/vendor/:id/review/add', async function(req,res){
        let vendorRecord = await db.collection(VENDOR).updateOne({
            '_id': ObjectId(req.params.id)
        },{
            '$push':{
                'review': {
                    '_id': ObjectId(),
                    'comment': req.body.comment
                }
            }
        })
        res.send(vendorRecord);
        // res.redirect(`/vendor/${req.params.id}/review`)
    })

    // get review
    app.get('/vendor/:id/review', async function(req,res){
        let vendorRecord = await getVendorRecordById(req.params.id);
        res.send(vendorRecord);
        // res.render('show-review',{
        //     'vendorRecord': vendorRecord
        // })
    })

    // get comment in review by reviewid
    app.get('/vendor/:id/review/:reviewid/update', async function(req,res){
        let vendorRecord = await getCommentFromReview(req.params.id, req.params.reviewid);
        res.send(vendorRecord);
        // let noteToEdit = foodRecord.notes[0];
        // res.render('edit-note',{
        //     'content': noteToEdit.content
        // }
    })
    
    // edit comment in review
    app.post('/vendor/:id/review/:reviewid/update', async function(req,res){
        let vendorRecord = await db.collection(VENDOR).updateOne({
            '_id': ObjectId(req.params.id),
            'review._id': ObjectId(req.params.reviewid)
        },{
            '$set':{
                'review.$.comment': req.body.comment
            }
        })
        // res.send(vendorRecord);
        res.redirect(`/vendor/${req.params.id}/review`);
    })

    // delete comment validation
    app.get('/vendor/:id/review/:reviewid/delete', async function(req,res){
        let vendorRecord = await getCommentFromReview(req.params.id, req.params.reviewid);
        res.send(vendorRecord);
    })

    // delete one comment in review
    app.post('/vendor/:id/review/:reviewid/delete', async function(req,res){
        let vendorRecord = await db.collection(VENDOR).updateOne({
            '_id':ObjectId(req.params.id)
        },{
            '$pull':{
                'review':{
                    '_id': ObjectId(req.params.reviewid)
                }
            }
        })
        // res.send(vendorRecord);
        res.redirect(`/vendor/${req.params.id}/review`);
    })
}
main();

app.listen(3000, function () {
    console.log("server started");
})