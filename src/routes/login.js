const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../config/db");

const router = express.Router();

router.post("/", async (req, res) => {
  const { usuario, clave } = req.body;

  try {
    const [rows] = await pool.query(
      "SELECT * FROM usuarios WHERE correo = ? OR nombre = ?",
      [usuario, usuario]
    );

    if (rows.length === 0) {
      return res.status(401).json({ mensaje: "Usuario no encontrado ❌" });
    }

    const user = rows[0];

    // 🚨 Validar estado
    if (user.estado === "Suspendido") {
      return res.status(403).json({ mensaje: "Usuario suspendido, acceso denegado ❌" });
    }

    // ✅ Validar contraseña
    const validPassword = await bcrypt.compare(clave, user.contraseña);
    if (!validPassword) {
      return res.status(401).json({ mensaje: "Contraseña incorrecta ❌" });
    }

    // Generar JWT
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      {
        id_usuario: user.id_usuario,
        nombre: user.nombre,
        rol: user.rol,
        correo: user.correo
      },
      process.env.JWT_SECRET || 'supersecreto',
      { expiresIn: '2h' }
    );
    console.log('🔑 Token JWT generado:', token);

    res.json({
      mensaje: "Login exitoso ✅",
      token,
      usuario: {
        id_usuario: user.id_usuario,
        nombre: user.nombre,
        rol: user.rol,
        correo: user.correo,
        estado: user.estado,
      },
    });
  } catch (error) {
  console.error("❌ Error en login:", error);
  if (error && error.stack) console.error(error.stack);
  res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
});

module.exports = router;
