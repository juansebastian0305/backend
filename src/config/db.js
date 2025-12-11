// config/db.js
const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,   // ⬅ evita saturar la BD
  queueLimit: 0
});

// Probar conexión (opcional pero recomendado)
pool.getConnection()
  .then(() => console.log("BD conectada correctamente:", process.env.DB_NAME))
  .catch(err => console.error("Error conectando a MySQL:", err));

module.exports = pool;
