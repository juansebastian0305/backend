const express = require("express");
const pool = require("../config/db");

const router = express.Router();

// Crear pregunta en un test
router.post("/", async (req, res) => {
  const { test_id, enunciado } = req.body;
  try {
    const [result] = await pool.query(
      "INSERT INTO preguntas (test_id, enunciado) VALUES (?, ?)",
      [test_id, enunciado]
    );
    res.json({ message: "Pregunta creada", preguntaId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar preguntas de un test
router.get("/:testId", async (req, res) => {
  const { testId } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM preguntas WHERE test_id = ?",
      [testId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
