const express = require('express');

const app = express();

require('./startup/routes')(app);
require('./startup/config')();

// console.log(app.get('env'));

module.exports = app;