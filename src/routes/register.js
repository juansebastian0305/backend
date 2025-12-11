const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../config/db");

const router = express.Router();

router.post("/", async (req, res) => {
  const { nombre, correo, clave, rol } = req.body;

  if (!nombre || !correo || !clave || !rol) {
    return res.status(400).json({ message: "Todos los campos son obligatorios" });
  }

  try {
    const hashedPassword = await bcrypt.hash(clave, 10);

    await pool.query(
      "INSERT INTO usuarios (nombre, rol, correo, contraseña, fecha_registro) VALUES (?, ?, ?, ?, NOW())",
      [nombre, rol, correo, hashedPassword] // 👈 ahora rol es el ID de la tabla rol
    );

    res.json({ message: "Usuario registrado con éxito ✅" });
  } catch (error) {
  console.error("❌ Error al registrar usuario:", error);
  if (error && error.stack) console.error(error.stack);
  res.status(500).json({ message: "Error al registrar usuario ❌", error: error.message });
  }
});

module.exports = router;
