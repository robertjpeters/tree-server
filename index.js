// Etc
const express = require('express');
const app = express();
const cors = require('cors');
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const bodyParser = require('body-parser');

// Globals
global.factories = [];

// Mongo and app creation
const MongoClient = require('mongodb').MongoClient;
MongoClient.connect("mongodb://localhost", (err, client) => {
    if (err) {
        console.log(err);
    }

    // Select DB
    global.db =  client.db('tree');

    // Complete our initial load of the factories
    db.collection('factories').find().toArray().then(result => {
        factories = result
    }).catch( e => console.log(e) );

    // Attach sockets to express
    app.io = io;
    app.use(express.static(__dirname + '/node_modules'));

    // parse application/json
    app.use(bodyParser.json());

    // Allow all cors
    app.use(cors());

    // Export
    module.exports = app;

    // Controllers
    require('./controller/factory');

    // Client specific messages
    io.on('connection', (client) => {
        // On connection give each client the current list
        client.emit('list', factories);
    });

    server.listen(80);
});