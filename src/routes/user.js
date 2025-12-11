const express = require("express");
const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const router = express.Router();

// 📌 Obtener todos los usuarios (sin contraseña y con fecha formateada)
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id_usuario, 
        nombre, 
        correo, 
        rol, 
        estado,
        DATE_FORMAT(fecha_registro, '%d-%m-%Y %H:%i') AS fecha_registro
      FROM usuarios
    `);

    res.json(rows);
  } catch (error) {
  console.error("❌ Error al obtener usuarios:", error);
  if (error && error.stack) console.error(error.stack);
  res.status(500).json({ message: "Error al obtener usuarios", error: error.message });
  }
});

// 📌 Cambiar solo estado
router.put("/estado/:id", async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  try {
    await pool.query(
      "UPDATE usuarios SET estado = ? WHERE id_usuario = ?",
      [estado, id]
    );
    res.json({ message: `Estado actualizado a ${estado} ✅` });
  } catch (error) {
  console.error("❌ Error al actualizar estado:", error);
  if (error && error.stack) console.error(error.stack);
  res.status(500).json({ message: "Error al actualizar estado", error: error.message });
  }
});

// 📌 Editar usuario (nombre, correo, rol, estado)
router.put("/editar/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, correo, rol, estado } = req.body;

  try {
    await pool.query(
      "UPDATE usuarios SET nombre=?, correo=?, rol=?, estado=? WHERE id_usuario=?",
      [nombre, correo, rol, estado, id]
    );
    res.json({ message: "Usuario actualizado ✅" });
  } catch (error) {
  console.error("❌ Error al actualizar usuario:", error);
  if (error && error.stack) console.error(error.stack);
  res.status(500).json({ message: "Error al actualizar usuario", error: error.message });
  }
});

router.get("/tareas", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id_usuario, nombre FROM usuarios WHERE rol = '3'"
    );
    res.json(rows);
  } catch (error) {
  console.error(error);
  if (error && error.stack) console.error(error.stack);
  res.status(500).json({ error: "Error al obtener usuarios empleados", detalle: error.message });
  }
});

module.exports = router;
