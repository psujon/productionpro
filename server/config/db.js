const mssql = require('mssql');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    server: process.env.DB_SERVER,
    options: {
        trustServerCertificate: true
    }
};

let poolPromise;

const getPool = async () => {
    if (!poolPromise) {
        poolPromise = mssql.connect(dbConfig)
            .then(pool => {
                console.log(`Connected to database: ${dbConfig.server}`);
                return pool;
            })
            .catch(err => {
                console.error('MSSQL Connection Error:', err);
                poolPromise = null;
                throw err;
            });
    }
    return poolPromise;
};

module.exports = {
    mssql,
    getPool
};
