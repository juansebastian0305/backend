const express = require("express");
const router = express.Router();
const pool = require("../config/db");

const verificarJWT = require("../middleware/verificarJWT");


// Obtener todas las tareas con sus usuarios
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT t.id_tarea, t.nombre, t.descripcion, t.estado, t.porcentaje
      FROM tareas t
    `);

    for (let tarea of rows) {
      const [usuarios] = await pool.query(
        `SELECT u.id_usuario, u.nombre 
         FROM tareas_usuarios tu 
         JOIN usuarios u ON tu.id_usuario = u.id_usuario 
         WHERE tu.id_tarea=?`,
        [tarea.id_tarea]
      );
      tarea.usuarios = usuarios;
    }

    res.json(rows);
  } catch (error) {
  console.error(error);
  if (error && error.stack) console.error(error.stack);
  res.status(500).json({ error: "Error al obtener tareas", detalle: error.message });
  }
});

// Crear nueva tarea con usuarios asignados
router.post("/", async (req, res) => {
  try {
    const { nombre, descripcion, usuarios } = req.body;

    const [result] = await pool.query(
      "INSERT INTO tareas (nombre, descripcion, estado, porcentaje) VALUES (?, ?, 'Asignada', 0)",
      [nombre, descripcion]
    );

    const id_tarea = result.insertId;

    if (usuarios && usuarios.length > 0) {
      for (let id_usuario of usuarios) {
        await pool.query(
          "INSERT INTO tareas_usuarios (id_tarea, id_usuario) VALUES (?, ?)",
          [id_tarea, id_usuario]
        );
      }
    }

    res.json({ message: "✅ Tarea creada correctamente", id_tarea });
  } catch (err) {
  console.error("❌ Error al crear tarea:", err);
  if (err && err.stack) console.error(err.stack);
  res.status(500).json({ error: "Error al crear tarea", detalle: err.message });
  }
});

// Editar tarea y reasignar usuarios
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, estado, usuarios } = req.body;

    await pool.query(
      "UPDATE tareas SET nombre=?, descripcion=?, estado=? WHERE id_tarea=?",
      [nombre, descripcion, estado, id]
    );

    await pool.query("DELETE FROM tareas_usuarios WHERE id_tarea=?", [id]);

    if (usuarios && usuarios.length > 0) {
      for (const u of usuarios) {
        await pool.query(
          "INSERT INTO tareas_usuarios (id_tarea, id_usuario) VALUES (?, ?)",
          [id, u]
        );
      }
    }

    res.json({ message: "Tarea actualizada" });
  } catch (error) {
  console.error(error);
  if (error && error.stack) console.error(error.stack);
  res.status(500).json({ error: "Error al actualizar tarea", detalle: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, estado, usuarios } = req.body;

    await pool.query(
      "UPDATE tareas SET nombre=?, descripcion=?, estado=? WHERE id_tarea=?",
      [nombre, descripcion, estado, id]
    );

    await pool.query("DELETE FROM tareas_usuarios WHERE id_tarea=?", [id]);

    if (usuarios && usuarios.length > 0) {
      for (const u of usuarios) {
        await pool.query(
          "INSERT INTO tareas_usuarios (id_tarea, id_usuario) VALUES (?, ?)",
          [id, u]
        );
      }
    }

    res.json({ message: "Tarea actualizada" });
  } catch (error) {
  console.error(error);
  if (error && error.stack) console.error(error.stack);
  res.status(500).json({ error: "Error al actualizar tarea", detalle: error.message });
  }
});
// Cambiar a pendiente
router.put("/:id/pendiente", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE tareas SET estado='Pendiente' WHERE id_tarea=?", [id]);
    res.json({ message: "Tarea marcada como pendiente" });
  } catch (error) {
  console.error(error);
  if (error && error.stack) console.error(error.stack);
  res.status(500).json({ error: "Error al marcar pendiente", detalle: error.message });
  }
});

// Obtener tareas del usuario logueado
router.get("/mis-tareas", verificarJWT, async (req, res) => {
  try {
    const id_usuario = req.usuario.id_usuario; // 👈 viene del token

    const [tareas] = await pool.query(
      `SELECT t.id_tarea, t.nombre, t.descripcion, t.estado, t.porcentaje, tu.completada
       FROM tareas t
       JOIN tareas_usuarios tu ON t.id_tarea = tu.id_tarea
       WHERE tu.id_usuario = ? AND t.estado = 'Asignada'`,  // 👈 FILTRO
      [id_usuario]
    );

    res.json(tareas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener tareas del usuario", detalle: error.message });
  }
});

// Usuario logueado marca su tarea como completada
router.post("/:id/terminar", verificarJWT, async (req, res) => {
  try {
    const { id } = req.params; // id_tarea
    const id_usuario = req.usuario.id_usuario; // 👈 del token

    const [check] = await pool.query(
      "SELECT completada FROM tareas_usuarios WHERE id_tarea=? AND id_usuario=?",
      [id, id_usuario]
    );

    if (check.length === 0) {
      return res.status(404).json({ error: "Tarea no asignada a este usuario" });
    }
    if (check[0].completada === 1) {
      return res.status(400).json({ error: "Ya completaste esta tarea" });
    }

    await pool.query(
      "UPDATE tareas_usuarios SET completada=1 WHERE id_tarea=? AND id_usuario=?",
      [id, id_usuario]
    );

    // Calcular progreso
    const [usuarios] = await pool.query(
      "SELECT COUNT(*) AS total FROM tareas_usuarios WHERE id_tarea=?",
      [id]
    );
    const totalUsuarios = usuarios[0].total;

    const [completados] = await pool.query(
      "SELECT COUNT(*) AS done FROM tareas_usuarios WHERE id_tarea=? AND completada=1",
      [id]
    );
    const totalCompletados = completados[0].done;

    const nuevoPorcentaje = Math.floor((totalCompletados / totalUsuarios) * 100);
    let nuevoEstado = "Asignada";
    if (nuevoPorcentaje === 100) nuevoEstado = "Realizada";

    await pool.query(
      "UPDATE tareas SET porcentaje=?, estado=? WHERE id_tarea=?",
      [nuevoPorcentaje, nuevoEstado, id]
    );

    res.json({ message: "Tarea marcada como completada", porcentaje: nuevoPorcentaje, estado: nuevoEstado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al completar tarea", detalle: error.message });
  }
});

// Usuario logueado revierte su tarea
router.post("/:id/revertir", verificarJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const id_usuario = req.usuario.id_usuario; // 👈 del token

    const [check] = await pool.query(
      "SELECT completada FROM tareas_usuarios WHERE id_tarea=? AND id_usuario=?",
      [id, id_usuario]
    );

    if (check.length === 0) {
      return res.status(404).json({ error: "Tarea no asignada a este usuario" });
    }
    if (check[0].completada === 0) {
      return res.status(400).json({ error: "No has completado esta tarea aún" });
    }

    await pool.query(
      "UPDATE tareas_usuarios SET completada=0 WHERE id_tarea=? AND id_usuario=?",
      [id, id_usuario]
    );

    // Recalcular porcentaje
    const [usuarios] = await pool.query(
      "SELECT COUNT(*) AS total FROM tareas_usuarios WHERE id_tarea=?",
      [id]
    );
    const totalUsuarios = usuarios[0].total;

    const [completados] = await pool.query(
      "SELECT COUNT(*) AS done FROM tareas_usuarios WHERE id_tarea=? AND completada=1",
      [id]
    );
    const totalCompletados = completados[0].done;

    const nuevoPorcentaje = Math.floor((totalCompletados / totalUsuarios) * 100);
    let nuevoEstado = "Asignada";
    if (nuevoPorcentaje === 100) nuevoEstado = "Realizada";
    if (nuevoPorcentaje === 0) nuevoEstado = "Pendiente";

    await pool.query(
      "UPDATE tareas SET porcentaje=?, estado=? WHERE id_tarea=?",
      [nuevoPorcentaje, nuevoEstado, id]
    );

    res.json({ message: "Tarea revertida", porcentaje: nuevoPorcentaje, estado: nuevoEstado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al revertir tarea", detalle: error.message });
  }
});

module.exports = router;
