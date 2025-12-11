const express = require("express");
const pool = require("../config/db");

const router = express.Router();

// Promedio por test
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        t.id AS test_id,
        t.titulo,
        t.descripcion,
        ROUND(AVG(r.valor), 2) AS promedio_respuestas
      FROM tests t
      JOIN preguntas p ON p.test_id = t.id
      JOIN usuario_preguntas up ON up.pregunta_id = p.id
      JOIN respuestas r ON r.usuario_pregunta_id = up.id
      GROUP BY t.id, t.titulo, t.descripcion
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Promedio por pregunta dentro de un test
router.get("/:testId", async (req, res) => {
  const { testId } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.id AS pregunta_id,
        p.enunciado,
        ROUND(AVG(r.valor), 2) AS promedio
      FROM preguntas p
      LEFT JOIN usuario_preguntas up ON up.pregunta_id = p.id
      LEFT JOIN respuestas r ON r.usuario_pregunta_id = up.id
      WHERE p.test_id = ?
      GROUP BY p.id, p.enunciado
    `, [testId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
