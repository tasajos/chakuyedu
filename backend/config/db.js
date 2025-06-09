// backend/config/db.js
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  port: 3307, // <-- nuevo puerto
  database: 'educa_db'
});

connection.connect(err => {
  if (err) {
    console.error('❌ Error conectando a MySQL:', err.message);
  } else {
    console.log('Conectado a MySQL ✅');
  }
});

module.exports = connection;
