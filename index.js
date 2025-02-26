// Configuración
require('dotenv').config(); // Variables de entorno
const express = require('express'); // Servidor
const mysql = require('mysql2'); // Base de datos
const cors = require('cors'); // CORS

const app = express();
const port = 5000;

// Middleware
app.use(cors()); // Habilitar CORS
app.use(express.json()); // Parseo JSON

// Conexión BD
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

connection.connect((err) => {
  if (err) console.error('❌ Error BD:', err);
  else console.log('✅ Conectado BD');
});

// Rutas - Actividades
app.get('/actividades', (req, res) => {
  const { search = '', sort = 'Fecha', order = 'ASC', page = 1, limit = 80 } = req.query;
  const offset = (page - 1) * limit;

  const query = `
    SELECT 
      a.ActividadID, u.Nombre AS UsuarioNombre, p.Nombre AS ProyectoNombre, 
      c.Nombre AS CompañiaNombre, t.Nombre AS TipoActividadNombre, 
      a.Descripcion, a.Minutos, a.Fecha, e.Nombre AS EquipoNombre
    FROM Actividad a
    JOIN Usuario u ON a.UsuarioID = u.UsuarioID
    JOIN Proyecto p ON a.ProyectoID = p.ProyectoID
    JOIN Compañia c ON p.CompañiaID = c.CompañiaID
    JOIN TipoActividad t ON a.TipoActividadID = t.TipoActividadID
    JOIN Equipo e ON a.EquipoID = e.EquipoID
    WHERE u.Nombre LIKE ? OR p.Nombre LIKE ? OR c.Nombre LIKE ? OR t.Nombre LIKE ? OR a.Descripcion LIKE ?
    ORDER BY ${connection.escapeId(sort)} ${order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}
    LIMIT ? OFFSET ?;
  `;

  const values = [ `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, parseInt(limit), parseInt(offset) ];

  connection.query(query, values, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener actividades' });
    res.json(results);
  });
});

app.post('/actividades', (req, res) => {
  const { UsuarioID, ProyectoID, TipoActividadID, Descripcion, Minutos, Fecha, EquipoID } = req.body;
  const query = `
    INSERT INTO Actividad (UsuarioID, ProyectoID, TipoActividadID, Descripcion, Minutos, Fecha, EquipoID)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [UsuarioID, ProyectoID, TipoActividadID, Descripcion, Minutos, Fecha, EquipoID];

  connection.query(query, values, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al agregar actividad' });
    res.json({ message: '✅ Actividad agregada', id: results.insertId });
  });
});

// Rutas - Usuarios
app.get('/usuarios', (req, res) => {
  connection.query('SELECT UsuarioID, Nombre FROM Usuario', (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener usuarios' });
    res.json(results);
  });
});

app.post('/usuarios', (req, res) => {
  const { Usuario, Proyecto, Compañía, TipoActividad, Descripción, Minutos, Fecha, Equipo } = req.body;
  if (!Usuario || !Proyecto || !Compañía || !TipoActividad || !Descripción || !Minutos || !Fecha || !Equipo) {
    return res.status(400).json({ error: 'Campos obligatorios faltantes' });
  }

  const query = `
    INSERT INTO Usuario (Nombre, Proyecto, Compañía, TipoActividad, Descripción, Minutos, Fecha, Equipo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [Usuario, Proyecto, Compañía, TipoActividad, Descripción, Minutos, Fecha, Equipo];

  connection.query(query, values, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al agregar usuario' });
    res.json({ message: '✅ Usuario agregado', id: results.insertId });
  });
});

// Rutas - Datos Fijos
app.get('/proyectos', (req, res) => {
  connection.query('SELECT ProyectoID, Nombre FROM Proyecto', (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener proyectos' });
    res.json(results);
  });
});

app.get('/companias', (req, res) => {
  connection.query('SELECT CompañiaID, Nombre FROM Compañia', (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener compañías' });
    res.json(results);
  });
});

app.get('/tipos-actividad', (req, res) => {
  connection.query('SELECT TipoActividadID, Nombre FROM TipoActividad', (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener tipos de actividad' });
    res.json(results);
  });
});

app.get('/equipos', (req, res) => {
  connection.query('SELECT EquipoID, Nombre FROM Equipo', (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener equipos' });
    res.json(results);
  });
});

// Servidor
app.listen(port, () => console.log(`🚀 Servidor: http://localhost:${port}`));
