const express = require("express");
const pool = require("../config/db");

const router = express.Router();

// Tablas bloqueadas (no deben mostrarse ni eliminarse)
const tablasNoPermitidas = ["rol"];

// Columnas ID por tabla
const columnas = {
  usuarios: "id_usuario",
  tareas: "id_tarea",
  tareas_usuarios: "id_tarea",
  capacitaciones: "id",
  capacitacion_asistentes: "id",
  tests: "id",
  preguntas: "id",
  usuario_preguntas: "id",
  respuestas: "id"
};

// Obtener todos los datos de una tabla
router.get("/:tabla", async (req, res) => {
  const { tabla } = req.params;

  if (tablasNoPermitidas.includes(tabla))
    return res.status(403).json({ error: "Acceso no permitido a esta tabla." });

  if (!columnas[tabla])
    return res.status(400).json({ error: "Tabla no válida." });

  try {
    const [rows] = await pool.query(`SELECT * FROM ${tabla}`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Error consultando la tabla." });
  }
});

// Eliminar fila por ID (SEGURO)
router.delete("/:tabla/:id", async (req, res) => {
  const { tabla, id } = req.params;

  if (tablasNoPermitidas.includes(tabla))
    return res.status(403).json({ error: "Acceso no permitido." });

  const columna = columnas[tabla];
  if (!columna)
    return res.status(400).json({ error: "Tabla no válida." });

  try {
    const [result] = await pool.query(
      `DELETE FROM ${tabla} WHERE ${columna} = ?`,
      [id]
    );

    // Si no encontró el registro
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Registro no encontrado." });
    }

    res.json({ message: "Registro eliminado correctamente." });
  } catch (err) {
    console.error("Error:", err);

    // ❌ Error por llave foránea
    if (err.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        error:
          "No se puede eliminar este registro porque está relacionado con otras tablas."
      });
    }

    res.status(500).json({ error: "Error eliminando el registro." });
  }
});

module.exports = router;
