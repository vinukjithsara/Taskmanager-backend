require('dotenv').config({ path: __dirname + '/.env' });
console.log("Connecting to:", process.env.MYSQL_HOST); // ← add this

const mysql = require("mysql2");
const db = mysql.createConnection({

  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  ssl: { rejectUnauthorized: false }

});
 
db.connect((err) => {

  if (err) {
    console.log("❌ DB Error:", err);
  } else {
    console.log("✅ MySQL Connected!");
  }
});
 
module.exports = db;
 