const mongoose = require('mongoose');
//const logger = require('../utils/logger');

/***
 * conndect to mongodb database
 */
const connectDatabase = async () => {
    try{
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/auth_db';

        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        };

        await mongoose.connect(mongoURI, options);

        //logger.info('Connected to MongoDB database');
        console.log('Connected to MongoDB database');
    }catch(error){
        //logger.error('Error connecting to MongoDB database: ' + error.message);
        console.error('Error connecting to MongoDB database: ' + error.message);
        process.exit(1);
    }
}

module.exports = connectDatabase;