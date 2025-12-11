const express = require("express");
const pool = require("../config/db");
const router = express.Router();

const verificarJWT = require("../middleware/verificarJWT");

// Guardar respuestas de un usuario autenticado (solo una vez por pregunta)
router.post("/", verificarJWT, async (req, res) => {
  const { respuestas } = req.body;
  try {
    for (const r of respuestas) {
      await pool.query(
        "INSERT IGNORE INTO respuestas (usuario_pregunta_id, valor) VALUES (?, ?)", 
        [r.usuario_pregunta_id, r.valor]
      );
    }
    res.json({ message: "✅ Respuestas guardadas" });
  } catch (err) {
    console.error("[POST /respuestas] Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Obtener preguntas asignadas a un usuario (y su estado de respuesta)
router.get("/", verificarJWT, async (req, res) => {
  const usuarioId = req.usuario.id_usuario; // tomado del token

  try {
    const [rows] = await pool.query(
      `SELECT up.id AS usuario_pregunta_id, p.id AS pregunta_id, p.enunciado,
              r.valor AS respuesta
       FROM usuario_preguntas up
       JOIN preguntas p ON p.id = up.pregunta_id
       LEFT JOIN respuestas r ON r.usuario_pregunta_id = up.id
       WHERE up.usuario_id = ?`,
      [usuarioId]
    );
    res.json(rows);
  } catch (err) {
    console.error("[GET /respuestas] Error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
