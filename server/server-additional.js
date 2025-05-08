// Endpoints adicionales para el servidor

const express = require('express');
const mysql = require('mysql2/promise');
const app = express();

// Configuración de la base de datos
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'your_root_password',
  database: 'nombre_de_tu_base_de_datos',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Obtener un cliente específico
app.get('/api/clientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM clientes WHERE id = ?', [id]);
    
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ message: 'Cliente no encontrado' });
    }
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Obtener ventas de un cliente específico
app.get('/api/ventas', async (req, res) => {
  try {
    const { clienteId } = req.query;
    let query = 'SELECT * FROM ventas';
    let params = [];
    
    if (clienteId) {
      query += ' WHERE cliente_id = ?';
      params.push(clienteId);
    }
    
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Obtener una venta específica
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

// Cancelar una venta
app.put('/api/ventas/:id/cancelar', async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query(
      'UPDATE ventas SET estado = ? WHERE id = ?',
      ['Cancelada', id]
    );
    
    res.json({ message: 'Venta cancelada correctamente' });
  } catch (error) {
    console.error('Error al cancelar venta:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Obtener todos los armazones
app.get('/api/armazones', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM armazones');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener armazones:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Obtener todos los productos
app.get('/api/productos', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM productos');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Obtener un inventario específico
app.get('/api/inventario/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM inventario WHERE id = ?', [id]);
    
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ message: 'Inventario no encontrado' });
    }
  } catch (error) {
    console.error('Error al obtener inventario:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Actualizar un inventario
app.put('/api/inventario/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { armazonId, productoId, fechaEntrada, piezas, precioVenta } = req.body;
    
    await pool.query(
      'UPDATE inventario SET armazon_id = ?, producto_id = ?, fecha_entrada = ?, piezas = ?, precio_venta = ? WHERE id = ?',
      [armazonId, productoId, fechaEntrada, piezas, precioVenta, id]
    );
    
    res.json({ 
      id,
      armazonId,
      productoId,
      fechaEntrada,
      piezas,
      precioVenta
    });
  } catch (error) {
    console.error('Error al actualizar inventario:', error);
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

// Eliminar un inventario
app.delete('/api/inventario/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM inventario WHERE id = ?', [id]);
    
    res.json({ message: 'Inventario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar inventario:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});