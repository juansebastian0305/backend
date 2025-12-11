const express = require("express");
const pool = require("../config/db");
const router = express.Router();

// Crear un nuevo test con preguntas y asignar 5 aleatorias a usuarios rol 3
router.post("/", async (req, res) => {
  const { titulo, descripcion, preguntas } = req.body;

  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    // 1. Crear test
    const [result] = await conn.query(
      "INSERT INTO tests (titulo, descripcion) VALUES (?, ?)",
      [titulo, descripcion]
    );
    const testId = result.insertId;

    let preguntaIds = [];

    // 2. Insertar preguntas
    for (const enunciado of preguntas) {
      if (enunciado.trim()) {
        const [qRes] = await conn.query(
          "INSERT INTO preguntas (test_id, enunciado) VALUES (?, ?)",
          [testId, enunciado]
        );
        preguntaIds.push(qRes.insertId);
      }
    }

    // 3. Buscar usuarios con rol 3
    const [usuarios] = await conn.query(
      "SELECT id_usuario FROM usuarios WHERE rol = 3"
    );

    // 4. Asignar 5 preguntas aleatorias a cada usuario
    for (const u of usuarios) {
      const seleccionadas = [...preguntaIds]
        .sort(() => Math.random() - 0.5) // shuffle rápido
        .slice(0, 5); // tomar 5

      for (const pid of seleccionadas) {
        await conn.query(
          "INSERT INTO usuario_preguntas (usuario_id, pregunta_id) VALUES (?, ?)",
          [u.id_usuario, pid]   // ✅ CORREGIDO: usar id_usuario
        );
      }
    }

    // 5. Confirmar transacción
    await conn.commit();
    res.json({ message: "✅ Test creado y preguntas asignadas", testId });

  } catch (err) {
    // Si hay error, rollback
    await conn.rollback();
    console.error("❌ [POST /tests] Error:", err.sqlMessage || err.message);
    res.status(500).json({ error: err.message });
  } finally {
    // Liberar conexión
    conn.release();
  }
});


// Listar todos los tests
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM tests");
    res.json(rows);
  } catch (err) {
    console.error("[GET /tests] Error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
