const { Factory, newFactoryValidation, patchFactoryValidation } = require('../model/factory');
const random = require('random-js')();

// App
const app = require('../index');

// Validator
const { checkSchema, validationResult } = require('express-validator/check');

// Simple test page (not really a view)
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Simple routes for CRUD

// List all factories
app.get('/factories', async (req, res) => {
    const results = await db.collection('factories').find().toArray()
        .then().catch( e => console.log(e) );
    res.json(results);
});

app.get('/factories/mock', (req, res) => {
    // Push to our factory list
    try {
        const mockFactory = new Factory("Test " + random.integer(1, 100), 1, 100, 10);
        factories.push(mockFactory);
        // Add to the DB
        db.collection('factories').insert(mockFactory);
        // Emit a new event containing the list of all the factories
        req.app.io.emit('update', factories);
        // Return the created factory
        res.json(mockFactory);
    } catch (e) {
        res.status(400);
        res.json({errors: {error: { msg: e}}});
    }
});

app.post('/factories', newFactoryValidation, (req, res) => {
    // Check for validation errors and return if necessary
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.mapped() });
    }

    try {
        // Create our new factory
        const factory = new Factory(req.body.name, req.body.lower, req.body.upper, req.body.childCount);
        // Commit to the DB
        db.collection('factories').insert(factory);
        // Add to our list
        factories.push(factory);
        // Emit a new event containing the list of all the factories
        req.app.io.emit('update', factories);
        // Return the created factory
        res.json(factory);
    } catch (e) {
        res.status(400);
        res.json({errors: {error: { msg: e}}});
    }
});

app.get('/factories/:uuid/generate', checkSchema({
    uuid: {
        errorMessage: 'UUID is invalid',
        isUUID: true
    }}), async (req, res) => {

    // Check for validation errors and return if necessary
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.mapped() });
    }

    // Grab the current document from the DB
    let result = await db.collection('factories').find( {"_id": req.params.uuid} ).toArray()
        .then().catch( e => console.log(e) );

    // Check for results
    if (result.length === 1) {
        // Merge
        let factory = new Factory(result[0].name, result[0].lower, result[0].upper, result[0].childCount);
        factory._id = req.params.uuid;

        // Update the record
        let record = await db.collection('factories').findOneAndUpdate(
            {"_id": req.params.uuid}, factory, { returnOriginal: false }
        ).then(record => record.value).catch( e => console.log(e) );

        // Reload the factory list
        factories = await db.collection('factories').find().toArray()
            .then().catch( e => console.log(e) );

        // Emit a new event containing the list of all the factories
        req.app.io.emit('update', factories);
        // Return the created factory
        res.json(factories);
    } else {
        res.status(404).send();
    }
});

app.patch('/factories/:uuid', patchFactoryValidation, async (req, res) => {
    // Check for validation errors and return if necessary
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.mapped() });
        return;
    }

    // Update the document
    try {
        // Grab the current document from the DB
        let result = await db.collection('factories').find( {"_id": req.params.uuid} ).toArray()
            .then().catch( e => console.log(e) );

        // Check for results
        if (result.length === 1) {
            // Check additional validation
            let factory = new Factory(req.body.name, req.body.lower, req.body.upper, req.body.childCount);

            // Merge
            Object.assign(result[0], factory, { _id: req.params.uuid, children: result[0].children } );
        } else {
            res.status(404).send();
            return;
        }

        // Update the record
        let record = await db.collection('factories').findOneAndUpdate(
            {"_id": req.params.uuid}, result[0], { returnOriginal: false }
        ).then(record => record.value).catch( e => console.log(e) );

        // Reload the factory list
        factories = await db.collection('factories').find().toArray()
            .then().catch( e => console.log(e) );

        // Emit a new event containing the list of all the factories
        req.app.io.emit('update', factories);

        // Return the created factory
        res.json(factories);
    } catch (e) {
        res.status(400);
        res.json({errors: {error: { msg: e}}});
    }
});

app.delete('/factories/:uuid', checkSchema({
    uuid: {
        errorMessage: 'UUID is invalid',
        isUUID: true
    }}), async (req, res) => {

    // Check for validation errors and return if necessary
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.mapped() });
    }

    // Delete
    await db.collection('factories').deleteOne( {"_id": req.params.uuid} )
        .then().catch( e => console.log(e) );

    // Reload the factory list
    factories = await db.collection('factories').find().toArray()
        .then().catch( e => console.log(e) );

    req.app.io.emit('update', factories);
    res.json(factories);
});