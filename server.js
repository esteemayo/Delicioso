const dotenv = require('dotenv');

process.on('uncaughtException', err => {
    console.log('UNCAUGHT EXCEPTION!💥 Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

require('./startup/db')();

app.set('port', process.env.PORT || 9999);
const server = app.listen(app.get('port'), () => console.log(`App listening on → port ${server.address().port}`));

process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJECTION!💥 Shutting down...');
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});

module.exports = server;