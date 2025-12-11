const express = require("express");
const PDFDocument = require("pdfkit");
const pool = require("../config/db");
const router = express.Router();

/* ============================================================
   1) ENDPOINT UNIFICADO DE REPORTES
   ============================================================ */
router.get("/data", async (req, res) => {
  try {
    const type = req.query.type;

    if (!["tareas", "capacitaciones", "test"].includes(type)) {
      return res.status(400).json({ error: "Tipo inválido" });
    }

    let data = {};

    /* === TAREAS === */
    if (type === "tareas") {
      const [rows] = await pool.query(`
        SELECT 
          SUM(estado='Pendiente') AS pendientes,
          SUM(estado='Realizada') AS completadas,
          SUM(estado='Asignada') AS asignadas
        FROM tareas
      `);
      data = rows[0];
    }

    /* === CAPACITACIONES === */
    if (type === "capacitaciones") {
      const [rows] = await pool.query(`
        SELECT 
          c.tema,
          SUM(ca.asistio = 1) AS asistieron,
          SUM(ca.asistio = 0) AS no_asistieron
        FROM capacitaciones c
        LEFT JOIN capacitacion_asistentes ca
          ON ca.capacitacion_id = c.id
        GROUP BY c.id
        ORDER BY c.fecha;
      `);
      data = rows;
    }

    /* === TEST === */
    if (type === "test") {
      const [rows] = await pool.query(`
        SELECT 
          t.id AS test_id,
          t.titulo,
          COUNT(r.id) AS total_respuestas,
          AVG(r.valor) AS promedio_respuestas
        FROM tests t
        LEFT JOIN preguntas p ON p.test_id = t.id
        LEFT JOIN usuario_preguntas up ON up.pregunta_id = p.id
        LEFT JOIN respuestas r ON r.usuario_pregunta_id = up.id
        GROUP BY t.id;
      `);
      data = rows;
    }

    res.json({ type, data });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error generando reporte", detalle: err.message });
  }
});

/* ============================================================
   2) ENDPOINT: PROMEDIO POR PREGUNTA DE UN TEST
   ============================================================ */
router.get("/test/preguntas", async (req, res) => {
  try {
    const testId = req.query.testId;

    if (!testId) {
      return res.status(400).json({ error: "Falta testId" });
    }

    const [rows] = await pool.query(
      `
      SELECT 
        p.enunciado,
        AVG(r.valor) AS promedio
      FROM preguntas p
      LEFT JOIN usuario_preguntas up ON up.pregunta_id = p.id
      LEFT JOIN respuestas r ON r.usuario_pregunta_id = up.id
      WHERE p.test_id = ?
      GROUP BY p.id
      `,
      [testId]
    );

    res.json(rows);

  } catch (err) {
    console.error("Error test preguntas:", err);
    res.status(500).json({ error: "Error obteniendo preguntas" });
  }
});

/* ============================================================
   3) GENERAR PDF
   ============================================================ */
router.get("/pdf", async (req, res) => {
  try {
    const type = req.query.type;

    if (!["tareas", "capacitaciones", "test"].includes(type)) {
      return res.status(400).json({ error: "Tipo inválido" });
    }

    let data;

    /* === TAREAS === */
    if (type === "tareas") {
      const [rows] = await pool.query(`
        SELECT 
          SUM(estado='Pendiente') AS pendientes,
          SUM(estado='Realizada') AS completadas,
          SUM(estado='Asignada') AS asignadas
        FROM tareas
      `);
      data = rows[0];
    }

    /* === CAPACITACIONES === */
    if (type === "capacitaciones") {
      const [rows] = await pool.query(`
        SELECT 
          c.tema,
          SUM(ca.asistio = 1) AS asistieron,
          SUM(ca.asistio = 0) AS no_asistieron
        FROM capacitaciones c
        LEFT JOIN capacitacion_asistentes ca
          ON ca.capacitacion_id = c.id
        GROUP BY c.id
        ORDER BY c.fecha;
      `);
      data = rows;
    }

    /* === TEST === */
    if (type === "test") {
      const [rows] = await pool.query(`
        SELECT 
          t.id AS test_id,
          t.titulo,
          COUNT(r.id) AS total_respuestas,
          AVG(r.valor) AS promedio_respuestas
        FROM tests t
        LEFT JOIN preguntas p ON p.test_id = t.id
        LEFT JOIN usuario_preguntas up ON up.pregunta_id = p.id
        LEFT JOIN respuestas r ON r.usuario_pregunta_id = up.id
        GROUP BY t.id;
      `);
      data = rows;
    }

    /* PDF */
    res.setHeader("Content-Disposition", `attachment; filename=reporte_${type}.pdf`);
    res.setHeader("Content-Type", "application/pdf");

    const doc = new PDFDocument();
    doc.pipe(res);

    doc.fontSize(20).text(`Reporte de ${type.toUpperCase()}`, { align: "center" });
    doc.moveDown(2);

    doc.fontSize(13).text("Datos:");
    doc.moveDown();

    if (type === "tareas") {
      doc.text(`Pendientes: ${data.pendientes}`);
      doc.text(`Realizadas: ${data.completadas}`);
      doc.text(`Asignadas: ${data.asignadas}`);
    }

    if (type === "capacitaciones") {
      data.forEach(row => {
        doc.text(`Capacitación: ${row.tema}`);
        doc.text(`Asistieron: ${row.asistieron}`);
        doc.text(`No asistieron: ${row.no_asistieron}`);
        doc.moveDown();
      });
    }

    if (type === "test") {
      data.forEach(row => {
        doc.text(`Test: ${row.titulo}`);
        doc.text(`Total respuestas: ${row.total_respuestas}`);
        doc.text(`Promedio general: ${row.promedio_respuestas}`);
        doc.moveDown();
      });
    }

    doc.end();

  } catch (err) {
    console.error("PDF error:", err);
    res.status(500).json({ error: "Error generando PDF" });
  }
});

module.exports = router;
