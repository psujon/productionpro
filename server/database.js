
const mssql = require('mssql');
require('dotenv').config();

// Create a connection pool instead of a single connection for better performance
const pool = mysql.createPool({
  user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database:process.env.DB_DATABASE,
    server: process.env.DB_SERVER,
    options: {
        trustServerCertificate: true
    }
});

// Export the pool so it can be required in other files
module.exports = pool.promise(); 



