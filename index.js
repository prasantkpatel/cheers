const express = require('express');
const axios = require('axios');
const mongodb = require('mongodb');
require('dotenv').config();

const MongoClient = mongodb.MongoClient;
const uri = process.env.MONGO_DB_URI;
const app = express();
const db_client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
let port = process.env.PORT || 8080;

async function poll_apis(callback) {
    ret = {};

    await axios.get('https://www.thecocktaildb.com/api/json/v1/1/random.php')
    .then(res => ret.drinks = res.data)
    .catch(err => console.error(err));

    await axios.get('https://randomuser.me/api/')
    .then(res => ret.users = res.data)
    .catch(err => console.error(err));

    callback(ret);
}

async function update_db(obj) {
    let user_doc = [], drinks_doc = [];
    const user_col = db_client.db('cheers-db').collection('users');
    const drinks_col = db_client.db('cheers-db').collection('drinks');

    console.log('\nUSER');
    if(obj.users) obj.users.results.forEach(user => user_doc.push(user));
    console.log(user_doc);

    console.log('\nCOCKTAIL')
    if(obj.drinks) obj.drinks.drinks.forEach(drink => drinks_doc.push(drink));
    console.log(drinks_doc);
    
    let a=0, b=0;
    await user_col.insertMany(user_doc)
    .then(user_res => a = user_res.insertedCount)
    .catch(err => console.error(err));

    await drinks_col.insertMany(drinks_doc)
    .then(drinks_res => b = drinks_res.insertedCount)
    .catch(err => console.error(err));

    console.log(`${a} user(s) and ${b} drink(s) were inserted!`);
}

async function getUsers(last_uid) {
    return new Promise((resolve, reject) => {
        db_client.db('cheers-db')
        .collection('users')
        .find({_id: {$gt: last_uid}})
        .sort({_id: -1})
        .limit(10)
        .toArray()
        .then(arr => resolve(arr))
        .catch(err => reject(err));
    });
}

async function getDrinks(last_did) {
    return new Promise((resolve, reject) => {
        db_client.db('cheers-db')
        .collection('drinks')
        .find({_id: {$gt: last_did}})
        .sort({_id: -1})
        .limit(10)
        .toArray()
        .then(arr => resolve(arr))
        .catch(err => reject(err));
    });
}

async function main() {
    let pollId;

    (await db_client.connect()).withSession(() => {
        poll_apis(update_db);
        pollId = setInterval(poll_apis, 5000, update_db);
    }).catch(err => console.error(err));

    app.use(express.static('public'));

    app.use('/users', (req, res, next) => {
        if(!req.query.last_uid || req.query.last_uid.length!=24)
            req.query.last_uid = '000000000000000000000000';
        req.query.last_uid = new mongodb.ObjectID(req.query.last_uid);
        next();
    });

    app.use('/drinks', (req, res, next) => {
        if(!req.query.last_did || req.query.last_did.length!=24)
            req.query.last_did = '000000000000000000000000';
        req.query.last_did = new mongodb.ObjectID(req.query.last_did);
        next();
    });

    app.get('/users', (req, res) => {
        console.log(typeof(req.query.last_uid), req.query.last_uid);
        getUsers(req.query.last_uid)
        .then((obj) => res.json(obj))
        .catch(err => console.error(err));
    });

    app.get('/drinks', (req, res) => {
        getDrinks(req.query.last_did)
        .then((obj) => res.json(obj))
        .catch(err => console.error(err));
    });

    console.log(`Access the app: http://localhost:${port}`);
}

app.listen(port, main).on('error', (err) => console.error(err));