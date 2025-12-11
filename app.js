const express = require('express')
const cors = require("cors")
require('dotenv').config()
const login = require('./src/routes/login')
const registroroutes = require('./src/routes/register')
const capacitaciones = require('./src/routes/capacitaciones')
const usuarios = require('./src/routes/user')
const tarea = require('./src/routes/tareas')
const test = require('./src/routes/test')
const preguntas = require("./src/routes/preguntas");
const respuestas = require("./src/routes/respuestas");
const resultados = require('./src/routes/resultados')
const reportsRouter = require("./src/routes/reports");
const Eliminacion = require("./src/routes/eliminacion");


const app = express();

app.use(express.json());

app.use(cors({
  origin: "http://localhost:5000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));


app.use('/login', login)
app.use('/reguistro', registroroutes)
app.use('/usuarios', usuarios)
app.use('/capacitaciones', capacitaciones)
app.use('/tareas', tarea)
app.use("/tests", test);
app.use("/preguntas", preguntas);
app.use("/resultados", resultados);
app.use("/respuestas", respuestas);
app.use("/reports", reportsRouter);
app.use("/eliminar", Eliminacion);


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});