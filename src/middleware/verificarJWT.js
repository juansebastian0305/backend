const jwt = require('jsonwebtoken');

function verificarJWT(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ mensaje: 'Token no proporcionado' });

  jwt.verify(token, process.env.JWT_SECRET, (err, usuario) => {
    if (err) return res.status(403).json({ mensaje: 'Token inválido o expirado' });
    req.usuario = usuario;
    next();
  });
}

module.exports = verificarJWT;
