import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('./')); // Sirve los archivos estáticos desde la carpeta raíz

// Configuración de la conexión a la base de datos
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // Por defecto en XAMPP no tiene contraseña
  database: 'optica_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Verificar conexión a la base de datos
async function checkDatabaseConnection() {
  try {
    // Intentar ejecutar una consulta simple
    const [result] = await pool.query('SELECT 1');
    console.log('✅ Conexión a la base de datos establecida correctamente');
    console.log('📊 Base de datos: optica_db');
    console.log('🔌 Host: localhost');
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:');
    console.error(`🔴 ${error.message}`);
    console.error('⚠️ Verifica que:');
    console.error('   - XAMPP esté corriendo (servicios MySQL y Apache)');
    console.error('   - Las credenciales de la base de datos sean correctas');
    console.error('   - La base de datos "optica_db" exista');
    return false;
  }
}

// Rutas para la API de ventas

// Obtener todas las ventas
app.get('/api/ventas', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM ventas');
      res.json(rows);
    } catch (error) {
      console.error('Error al obtener ventas:', error);
      res.status(500).json({ message: 'Error en el servidor' });
    }
  });

// Obtener una venta por ID
app.get('/api/ventas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM ventas WHERE id = ?', [id]);
    
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ message: 'Venta no encontrada' });
    }
  } catch (error) {
    console.error('Error al obtener venta:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Crear una nueva venta
app.post('/api/ventas', async (req, res) => {
  try {
    const { fecha, nombre, direccion, descripcion, valor1, valor2, valor3, fecha_registro } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO ventas (fecha, nombre, direccion, descripcion, valor1, valor2, valor3, fecha_registro) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [fecha, nombre, direccion, descripcion, valor1, valor2, valor3, fecha_registro]
    );
    
    res.status(201).json({ 
      id: result.insertId,
      fecha,
      nombre,
      direccion,
      descripcion,
      valor1,
      valor2,
      valor3,
      fecha_registro
    });
  } catch (error) {
    console.error('Error al crear venta:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Actualizar una venta existente
app.put('/api/ventas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha, nombre, direccion, descripcion, valor1, valor2, valor3, fecha_registro } = req.body;
    
    await pool.query(
      'UPDATE ventas SET fecha = ?, nombre = ?, direccion = ?, descripcion = ?, valor1 = ?, valor2 = ?, valor3 = ?, fecha_registro = ? WHERE id = ?',
      [fecha, nombre, direccion, descripcion, valor1, valor2, valor3, fecha_registro, id]
    );
    
    res.json({ 
      id,
      fecha,
      nombre,
      direccion,
      descripcion,
      valor1,
      valor2,
      valor3,
      fecha_registro
    });
  } catch (error) {
    console.error('Error al actualizar venta:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Eliminar una venta
app.delete('/api/ventas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM ventas WHERE id = ?', [id]);
    
    res.json({ message: 'Venta eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar venta:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const [rows] = await pool.query(
        'SELECT * FROM usuarios WHERE username = ? AND password = ?',
        [username, password]
      );
      if (rows.length > 0) {
        res.json({ success: true, user: rows[0] });
      } else {
        res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
      }
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
  });

// Iniciar el servidor
async function startServer() {
  // Verificar conexión a la base de datos antes de iniciar el servidor
  const isConnected = await checkDatabaseConnection();
  
  app.listen(PORT, () => {
    console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
    
    if (isConnected) {
      console.log('👍 Todo listo para usar la aplicación');
    } else {
      console.log('⚠️ Servidor iniciado pero con problemas de conexión a la base de datos');
      console.log('⚠️ La aplicación puede no funcionar correctamente');
    }
    
    console.log('\n📝 Endpoints disponibles para ventas:');
    console.log('   - GET /api/ventas - Obtener todas las ventas');
    console.log('   - GET /api/ventas/:id - Obtener una venta por ID');
    console.log('   - POST /api/ventas - Crear una nueva venta');
    console.log('   - PUT /api/ventas/:id - Actualizar una venta existente');
    console.log('   - DELETE /api/ventas/:id - Eliminar una venta');
  });
}

// Iniciar el servidor
startServer();