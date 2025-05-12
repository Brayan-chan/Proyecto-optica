import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.DB_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('./')); // Sirve los archivos estáticos desde la carpeta raíz

// Configuración de la conexión a la base de datos
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '', // Por defecto en XAMPP no tiene contraseña
    database: process.env.DB_NAME || 'optica_db',
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

// ===== RUTAS DE AUTENTICACIÓN =====
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const [rows] = await pool.query(
            'SELECT * FROM usuarios WHERE username = ? AND password = ? AND activo = TRUE',
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

// ===== RUTAS DE CLIENTES =====
// Obtener todos los clientes
app.get('/api/clientes', async (req, res) => {
    try {
        const { nombre, convenio } = req.query;
        let query = 'SELECT c.*, e.nombre as empresa_nombre FROM clientes c LEFT JOIN empresas e ON c.empresa_id = e.id';
        let params = [];

        // Filtros
        const whereConditions = [];
        if (nombre) {
            whereConditions.push('c.nombre LIKE ?');
            params.push(`%${nombre}%`);
        }

        if (convenio) {
            whereConditions.push('c.convenio = ?');
            params.push(convenio === 'true' ? 1 : 0);
        }

        if (whereConditions.length > 0) {
            query += ' WHERE ' + whereConditions.join(' AND ');
        }

        query += ' ORDER BY c.nombre';

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Obtener un cliente específico
app.get('/api/clientes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(
            'SELECT c.*, e.nombre as empresa_nombre FROM clientes c LEFT JOIN empresas e ON c.empresa_id = e.id WHERE c.id = ?',
            [id]
        );

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

// Crear un nuevo cliente
app.post('/api/clientes', async (req, res) => {
    try {
        const {
            nombre,
            telefono,
            email,
            direccion,
            fechaNacimiento,
            empresaId,
            convenio
        } = req.body;

        const [result] = await pool.query(
            `INSERT INTO clientes 
       (nombre, telefono, email, direccion, fecha_nacimiento, empresa_id, convenio, fecha_registro, ultima_visita) 
       VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE(), CURDATE())`,
            [nombre, telefono, email, direccion, fechaNacimiento, empresaId || null, convenio || false]
        );

        res.status(201).json({
            id: result.insertId,
            nombre,
            telefono,
            email,
            direccion,
            fechaNacimiento,
            empresaId,
            convenio,
            fecha_registro: new Date().toISOString().split('T')[0],
            ultima_visita: new Date().toISOString().split('T')[0]
        });
    } catch (error) {
        console.error('Error al crear cliente:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Actualizar un cliente
app.put('/api/clientes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nombre,
            telefono,
            email,
            direccion,
            fechaNacimiento,
            empresaId,
            convenio
        } = req.body;

        await pool.query(
            `UPDATE clientes 
       SET nombre = ?, telefono = ?, email = ?, direccion = ?, 
       fecha_nacimiento = ?, empresa_id = ?, convenio = ? 
       WHERE id = ?`,
            [nombre, telefono, email, direccion, fechaNacimiento, empresaId || null, convenio || false, id]
        );

        res.json({
            id: parseInt(id),
            nombre,
            telefono,
            email,
            direccion,
            fechaNacimiento,
            empresaId,
            convenio
        });
    } catch (error) {
        console.error('Error al actualizar cliente:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// ===== ENDPOINTS ADICIONALES PARA CLIENTES =====

// Eliminar un cliente
app.delete('/api/clientes/:id', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { id } = req.params;
        
        // Verificar si el cliente existe
        const [cliente] = await connection.query('SELECT * FROM clientes WHERE id = ?', [id]);
        
        if (cliente.length === 0) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        
        // Verificar si el cliente tiene ventas asociadas
        const [ventas] = await connection.query('SELECT COUNT(*) as count FROM ventas WHERE cliente_id = ?', [id]);
        
        if (ventas[0].count > 0) {
            return res.status(400).json({ 
                message: 'No se puede eliminar el cliente porque tiene ventas asociadas' 
            });
        }
        
        // Verificar si el cliente tiene recetas asociadas
        const [recetas] = await connection.query('SELECT COUNT(*) as count FROM recetas WHERE cliente_id = ?', [id]);
        
        if (recetas[0].count > 0) {
            return res.status(400).json({ 
                message: 'No se puede eliminar el cliente porque tiene recetas asociadas' 
            });
        }
        
        // Verificar si el cliente tiene citas asociadas
        const [citas] = await connection.query('SELECT COUNT(*) as count FROM citas WHERE cliente_id = ?', [id]);
        
        if (citas[0].count > 0) {
            return res.status(400).json({ 
                message: 'No se puede eliminar el cliente porque tiene citas asociadas' 
            });
        }
        
        // Eliminar el cliente
        await connection.query('DELETE FROM clientes WHERE id = ?', [id]);
        
        await connection.commit();
        
        res.json({ message: 'Cliente eliminado correctamente' });
    } catch (error) {
        await connection.rollback();
        console.error('Error al eliminar cliente:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    } finally {
        connection.release();
    }
});

// Obtener historial de compras de un cliente
app.get('/api/clientes/:id/ventas', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar si el cliente existe
        const [cliente] = await pool.query('SELECT * FROM clientes WHERE id = ?', [id]);
        
        if (cliente.length === 0) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        
        // Obtener las ventas del cliente
        const [ventas] = await pool.query(
            `SELECT v.*, 
                CASE 
                    WHEN v.receta_id IS NOT NULL THEN 'Receta' 
                    ELSE 'Productos' 
                END as tipo_venta
            FROM ventas v 
            WHERE v.cliente_id = ? 
            ORDER BY v.fecha DESC`,
            [id]
        );
        
        res.json(ventas);
    } catch (error) {
        console.error('Error al obtener historial de compras:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Obtener recetas de un cliente
app.get('/api/clientes/:id/recetas', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar si el cliente existe
        const [cliente] = await pool.query('SELECT * FROM clientes WHERE id = ?', [id]);
        
        if (cliente.length === 0) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        
        // Obtener las recetas del cliente
        const [recetas] = await pool.query(
            `SELECT r.* 
            FROM recetas r 
            WHERE r.cliente_id = ? 
            ORDER BY r.fecha DESC`,
            [id]
        );
        
        res.json(recetas);
    } catch (error) {
        console.error('Error al obtener recetas del cliente:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Obtener citas de un cliente
app.get('/api/clientes/:id/citas', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar si el cliente existe
        const [cliente] = await pool.query('SELECT * FROM clientes WHERE id = ?', [id]);
        
        if (cliente.length === 0) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        
        // Obtener las citas del cliente
        const [citas] = await pool.query(
            `SELECT c.* 
            FROM citas c 
            WHERE c.cliente_id = ? 
            ORDER BY c.fecha DESC`,
            [id]
        );
        
        res.json(citas);
    } catch (error) {
        console.error('Error al obtener citas del cliente:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Buscar clientes con filtros avanzados
app.get('/api/clientes/buscar', async (req, res) => {
    try {
        const { nombre, telefono, email, convenio, empresa } = req.query;
        
        let query = `
            SELECT c.*, e.nombre as empresa_nombre 
            FROM clientes c 
            LEFT JOIN empresas e ON c.empresa_id = e.id
        `;
        
        let params = [];
        const whereConditions = [];
        
        if (nombre) {
            whereConditions.push('c.nombre LIKE ?');
            params.push(`%${nombre}%`);
        }
        
        if (telefono) {
            whereConditions.push('c.telefono LIKE ?');
            params.push(`%${telefono}%`);
        }
        
        if (email) {
            whereConditions.push('c.email LIKE ?');
            params.push(`%${email}%`);
        }
        
        if (convenio) {
            whereConditions.push('c.convenio = ?');
            params.push(convenio === 'true' ? 1 : 0);
        }
        
        if (empresa) {
            whereConditions.push('c.empresa_id = ?');
            params.push(empresa);
        }
        
        if (whereConditions.length > 0) {
            query += ' WHERE ' + whereConditions.join(' AND ');
        }
        
        query += ' ORDER BY c.nombre';
        
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error al buscar clientes:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Obtener estadísticas de clientes
app.get('/api/clientes/estadisticas', async (req, res) => {
    try {
        // Total de clientes
        const [totalClientes] = await pool.query('SELECT COUNT(*) as total FROM clientes');
        
        // Clientes con convenio
        const [clientesConvenio] = await pool.query('SELECT COUNT(*) as total FROM clientes WHERE convenio = TRUE');
        
        // Clientes por empresa
        const [clientesPorEmpresa] = await pool.query(`
            SELECT e.nombre, COUNT(c.id) as total 
            FROM clientes c 
            JOIN empresas e ON c.empresa_id = e.id 
            WHERE c.convenio = TRUE 
            GROUP BY e.id 
            ORDER BY total DESC
        `);
        
        // Clientes nuevos este mes
        const [clientesNuevosMes] = await pool.query(`
            SELECT COUNT(*) as total 
            FROM clientes 
            WHERE YEAR(fecha_registro) = YEAR(CURDATE()) 
            AND MONTH(fecha_registro) = MONTH(CURDATE())
        `);
        
        // Clientes con compras en el último mes
        const [clientesComprasMes] = await pool.query(`
            SELECT COUNT(DISTINCT cliente_id) as total 
            FROM ventas 
            WHERE YEAR(fecha) = YEAR(CURDATE()) 
            AND MONTH(fecha) = MONTH(CURDATE())
        `);
        
        res.json({
            totalClientes: totalClientes[0].total,
            clientesConvenio: clientesConvenio[0].total,
            clientesPorEmpresa,
            clientesNuevosMes: clientesNuevosMes[0].total,
            clientesComprasMes: clientesComprasMes[0].total
        });
    } catch (error) {
        console.error('Error al obtener estadísticas de clientes:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// ===== RUTAS DE EMPRESAS (CONVENIOS) =====
// Obtener todas las empresas
app.get('/api/empresas', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM empresas WHERE activo = TRUE ORDER BY nombre');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener empresas:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Obtener una empresa específica
app.get('/api/empresas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM empresas WHERE id = ?', [id]);

        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ message: 'Empresa no encontrada' });
        }
    } catch (error) {
        console.error('Error al obtener empresa:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Crear una nueva empresa
app.post('/api/empresas', async (req, res) => {
    try {
        const {
            nombre,
            direccion,
            telefono,
            email,
            contactoNombre,
            creditoLimite
        } = req.body;

        const [result] = await pool.query(
            `INSERT INTO empresas 
       (nombre, direccion, telefono, email, contacto_nombre, credito_limite, fecha_registro) 
       VALUES (?, ?, ?, ?, ?, ?, CURDATE())`,
            [nombre, direccion, telefono, email, contactoNombre, creditoLimite || 0]
        );

        res.status(201).json({
            id: result.insertId,
            nombre,
            direccion,
            telefono,
            email,
            contactoNombre,
            creditoLimite,
            fecha_registro: new Date().toISOString().split('T')[0]
        });
    } catch (error) {
        console.error('Error al crear empresa:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// ===== RUTAS DE PRODUCTOS =====
// Obtener todos los productos
app.get('/api/productos', async (req, res) => {
    try {
        const { categoria, busqueda } = req.query;
        let query = `
      SELECT p.*, c.nombre as categoria_nombre, pr.nombre as proveedor_nombre 
      FROM productos p 
      JOIN categorias c ON p.categoria_id = c.id 
      LEFT JOIN proveedores pr ON p.proveedor_id = pr.id
    `;
        let params = [];

        // Filtros
        const whereConditions = [];
        if (categoria) {
            whereConditions.push('p.categoria_id = ?');
            params.push(categoria);
        }

        if (busqueda) {
            whereConditions.push('(p.id LIKE ? OR p.nombre LIKE ? OR p.descripcion LIKE ?)');
            params.push(`%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`);
        }

        if (whereConditions.length > 0) {
            query += ' WHERE ' + whereConditions.join(' AND ');
        }

        query += ' ORDER BY p.nombre';

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Obtener un producto específico
app.get('/api/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(
            `SELECT p.*, c.nombre as categoria_nombre, pr.nombre as proveedor_nombre 
       FROM productos p 
       JOIN categorias c ON p.categoria_id = c.id 
       LEFT JOIN proveedores pr ON p.proveedor_id = pr.id 
       WHERE p.id = ?`,
            [id]
        );

        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ message: 'Producto no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener producto:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Crear un nuevo producto
app.post('/api/productos', async (req, res) => {
    try {
        const {
            id,
            nombre,
            descripcion,
            categoriaId,
            proveedorId,
            precioCompra,
            precioVenta,
            stock
        } = req.body;

        await pool.query(
            `INSERT INTO productos 
       (id, nombre, descripcion, categoria_id, proveedor_id, precio_compra, precio_venta, stock, fecha_registro) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
            [id, nombre, descripcion, categoriaId, proveedorId || null, precioCompra, precioVenta, stock || 0]
        );

        res.status(201).json({
            id,
            nombre,
            descripcion,
            categoriaId,
            proveedorId,
            precioCompra,
            precioVenta,
            stock,
            fecha_registro: new Date().toISOString().split('T')[0]
        });
    } catch (error) {
        console.error('Error al crear producto:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Actualizar un producto existente
app.put('/api/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nombre,
            descripcion,
            categoriaId,
            proveedorId,
            precioCompra,
            precioVenta,
            stock
        } = req.body;

        await pool.query(
            `UPDATE productos 
            SET nombre = ?, descripcion = ?, categoria_id = ?, 
            proveedor_id = ?, precio_compra = ?, precio_venta = ?, stock = ? 
            WHERE id = ?`,
            [nombre, descripcion, categoriaId, proveedorId || null, precioCompra, precioVenta, stock || 0, id]
        );

        res.json({
            id,
            nombre,
            descripcion,
            categoriaId,
            proveedorId,
            precioCompra,
            precioVenta,
            stock
        });
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Eliminar un producto
app.delete('/api/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar si el producto existe
        const [producto] = await pool.query('SELECT * FROM productos WHERE id = ?', [id]);
        
        if (producto.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        
        // Eliminar el producto
        await pool.query('DELETE FROM productos WHERE id = ?', [id]);
        
        res.json({ message: 'Producto eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// ===== RUTAS DE ARMAZONES =====
// Obtener todos los armazones
app.get('/api/armazones', async (req, res) => {
    try {
        const { busqueda } = req.query;
        let query = `
      SELECT a.*, p.nombre as proveedor_nombre 
      FROM armazones a 
      LEFT JOIN proveedores p ON a.proveedor_id = p.id
    `;
        let params = [];

        if (busqueda) {
            query += ' WHERE a.id LIKE ? OR a.nombre LIKE ? OR a.marca LIKE ? OR a.modelo LIKE ?';
            params.push(`%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`);
        }

        query += ' ORDER BY a.nombre';

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener armazones:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Obtener un armazón específico
app.get('/api/armazones/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(
            `SELECT a.*, p.nombre as proveedor_nombre 
       FROM armazones a 
       LEFT JOIN proveedores p ON a.proveedor_id = p.id 
       WHERE a.id = ?`,
            [id]
        );

        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ message: 'Armazón no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener armazón:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Crear un nuevo armazón
app.post('/api/armazones', async (req, res) => {
    try {
        const {
            id,
            nombre,
            marca,
            modelo,
            color,
            material,
            precioCompra,
            precioVenta,
            stock,
            proveedorId
        } = req.body;

        await pool.query(
            `INSERT INTO armazones 
       (id, nombre, marca, modelo, color, material, precio_compra, precio_venta, stock, proveedor_id, fecha_registro) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
            [id, nombre, marca, modelo, color, material, precioCompra, precioVenta, stock || 0, proveedorId || null]
        );

        res.status(201).json({
            id,
            nombre,
            marca,
            modelo,
            color,
            material,
            precioCompra,
            precioVenta,
            stock,
            proveedorId,
            fecha_registro: new Date().toISOString().split('T')[0]
        });
    } catch (error) {
        console.error('Error al crear armazón:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Actualizar un armazón existente
app.put('/api/armazones/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nombre,
            marca,
            modelo,
            color,
            material,
            precioCompra,
            precioVenta,
            stock,
            proveedorId
        } = req.body;

        await pool.query(
            `UPDATE armazones 
            SET nombre = ?, marca = ?, modelo = ?, color = ?, 
            material = ?, precio_compra = ?, precio_venta = ?, 
            stock = ?, proveedor_id = ? 
            WHERE id = ?`,
            [nombre, marca, modelo, color, material, precioCompra, precioVenta, stock || 0, proveedorId || null, id]
        );

        res.json({
            id,
            nombre,
            marca,
            modelo,
            color,
            material,
            precioCompra,
            precioVenta,
            stock,
            proveedorId
        });
    } catch (error) {
        console.error('Error al actualizar armazón:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Eliminar un armazón
app.delete('/api/armazones/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar si el armazón existe
        const [armazon] = await pool.query('SELECT * FROM armazones WHERE id = ?', [id]);
        
        if (armazon.length === 0) {
            return res.status(404).json({ message: 'Armazón no encontrado' });
        }
        
        // Eliminar el armazón
        await pool.query('DELETE FROM armazones WHERE id = ?', [id]);
        
        res.json({ message: 'Armazón eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar armazón:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// ===== RUTAS DE RECETAS =====
// Obtener todas las recetas de un cliente
app.get('/api/recetas', async (req, res) => {
    try {
        const { clienteId } = req.query;
        let query = `
      SELECT r.*, c.nombre as cliente_nombre, u.nombre as usuario_nombre 
      FROM recetas r 
      JOIN clientes c ON r.cliente_id = c.id 
      LEFT JOIN usuarios u ON r.usuario_id = u.id
    `;
        let params = [];

        if (clienteId) {
            query += ' WHERE r.cliente_id = ?';
            params.push(clienteId);
        }

        query += ' ORDER BY r.fecha DESC';

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener recetas:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Obtener una receta específica con sus medidas de armazón
app.get('/api/recetas/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener la receta
        const [recetas] = await pool.query(
            `SELECT r.*, c.nombre as cliente_nombre, u.nombre as usuario_nombre 
       FROM recetas r 
       JOIN clientes c ON r.cliente_id = c.id 
       LEFT JOIN usuarios u ON r.usuario_id = u.id 
       WHERE r.id = ?`,
            [id]
        );

        if (recetas.length === 0) {
            return res.status(404).json({ message: 'Receta no encontrada' });
        }

        // Obtener las medidas de armazón asociadas
        const [medidas] = await pool.query(
            'SELECT * FROM medidas_armazon WHERE receta_id = ?',
            [id]
        );

        // Combinar los resultados
        const receta = recetas[0];
        receta.medidas_armazon = medidas;

        res.json(receta);
    } catch (error) {
        console.error('Error al obtener receta:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Crear una nueva receta
app.post('/api/recetas', async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const {
            clienteId,
            ojoIzquierdoEsfera,
            ojoIzquierdoCilindro,
            ojoIzquierdoEje,
            ojoDerechoEsfera,
            ojoDerechoCilindro,
            ojoDerechoEje,
            adicion,
            dnp,
            observaciones,
            usuarioId,
            medidasArmazon
        } = req.body;

        // Insertar la receta
        const [recetaResult] = await connection.query(
            `INSERT INTO recetas 
       (cliente_id, fecha, ojo_izquierdo_esfera, ojo_izquierdo_cilindro, ojo_izquierdo_eje, 
        ojo_derecho_esfera, ojo_derecho_cilindro, ojo_derecho_eje, adicion, dnp, observaciones, usuario_id) 
       VALUES (?, CURDATE(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [clienteId, ojoIzquierdoEsfera, ojoIzquierdoCilindro, ojoIzquierdoEje,
                ojoDerechoEsfera, ojoDerechoCilindro, ojoDerechoEje, adicion, dnp, observaciones, usuarioId]
        );

        const recetaId = recetaResult.insertId;

        // Insertar las medidas de armazón si existen
        if (medidasArmazon) {
            await connection.query(
                `INSERT INTO medidas_armazon 
         (receta_id, armazon_id, armazon_nombre, v, h, d, p, ait) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [recetaId, medidasArmazon.armazonId, medidasArmazon.armazonNombre,
                    medidasArmazon.v, medidasArmazon.h, medidasArmazon.d, medidasArmazon.p, medidasArmazon.ait]
            );
        }

        // Actualizar la última visita del cliente
        await connection.query(
            'UPDATE clientes SET ultima_visita = CURDATE() WHERE id = ?',
            [clienteId]
        );

        await connection.commit();

        res.status(201).json({
            id: recetaId,
            clienteId,
            fecha: new Date().toISOString().split('T')[0],
            ojoIzquierdoEsfera,
            ojoIzquierdoCilindro,
            ojoIzquierdoEje,
            ojoDerechoEsfera,
            ojoDerechoCilindro,
            ojoDerechoEje,
            adicion,
            dnp,
            observaciones,
            usuarioId,
            medidasArmazon
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error al crear receta:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    } finally {
        connection.release();
    }
});

// ===== RUTAS DE VENTAS =====
// Obtener todas las ventas
app.get('/api/ventas', async (req, res) => {
    try {
        const { clienteId, estado, fechaInicio, fechaFin, convenio } = req.query;

        let query = `
        SELECT v.*, c.nombre as cliente_nombre, c.convenio as cliente_convenio, 
               e.nombre as empresa_nombre, u.nombre as usuario_nombre 
        FROM ventas v 
        LEFT JOIN clientes c ON v.cliente_id = c.id 
        LEFT JOIN empresas e ON v.empresa_id = e.id
        LEFT JOIN usuarios u ON v.usuario_id = u.id
      `;

        let params = [];
        const whereConditions = [];

        if (clienteId) {
            whereConditions.push('v.cliente_id = ?');
            params.push(clienteId);
        }

        if (estado) {
            whereConditions.push('v.estado = ?');
            params.push(estado);
        }

        if (fechaInicio) {
            whereConditions.push('v.fecha >= ?');
            params.push(fechaInicio);
        }

        if (fechaFin) {
            whereConditions.push('v.fecha <= ?');
            params.push(fechaFin);
        }

        if (convenio) {
            whereConditions.push('v.convenio = ?');
            params.push(convenio === 'true' ? 1 : 0);
        }

        if (whereConditions.length > 0) {
            query += ' WHERE ' + whereConditions.join(' AND ');
        }

        query += ' ORDER BY v.fecha_registro DESC';

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener ventas:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Obtener una venta específica con sus detalles
app.get('/api/ventas/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener la venta
        const [ventas] = await pool.query(
            `SELECT v.*, c.nombre as cliente_nombre, c.convenio as cliente_convenio,
                e.nombre as empresa_nombre, u.nombre as usuario_nombre 
         FROM ventas v 
         LEFT JOIN clientes c ON v.cliente_id = c.id 
         LEFT JOIN empresas e ON v.empresa_id = e.id
         LEFT JOIN usuarios u ON v.usuario_id = u.id 
         WHERE v.id = ?`,
            [id]
        );

        if (ventas.length === 0) {
            return res.status(404).json({ message: 'Venta no encontrada' });
        }

        // Obtener los detalles de la venta
        const [detalles] = await pool.query(
            `SELECT d.*, 
          CASE 
            WHEN d.tipo_producto = 'Producto' THEN p.nombre 
            WHEN d.tipo_producto = 'Armazon' THEN a.nombre 
          END as producto_nombre
         FROM detalles_venta d 
         LEFT JOIN productos p ON d.producto_id = p.id AND d.tipo_producto = 'Producto'
         LEFT JOIN armazones a ON d.armazon_id = a.id AND d.tipo_producto = 'Armazon'
         WHERE d.venta_id = ?`,
            [id]
        );

        // Obtener los pagos de la venta
        const [pagos] = await pool.query(
            'SELECT * FROM pagos WHERE venta_id = ? ORDER BY fecha',
            [id]
        );

        // Combinar los resultados
        const venta = ventas[0];
        venta.detalles = detalles;
        venta.pagos = pagos;

        res.json(venta);
    } catch (error) {
        console.error('Error al obtener venta:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Crear una nueva venta
app.post('/api/ventas', async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const {
            clienteId,
            convenio,
            empresaId,
            total,
            abono,
            recetaId,
            usuarioId,
            observaciones,
            detalles
        } = req.body;

        // Calcular el saldo
        const saldo = total - (abono || 0);

        // Determinar el estado
        let estado = 'Pendiente';
        if (abono > 0) {
            estado = abono >= total ? 'Pagada' : 'Parcial';
        }

        // Insertar la venta
        const [ventaResult] = await connection.query(
            `INSERT INTO ventas 
         (cliente_id, convenio, empresa_id, fecha, total, abono, saldo, estado, receta_id, usuario_id, observaciones, fecha_registro) 
         VALUES (?, ?, ?, CURDATE(), ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [clienteId, convenio || false, empresaId || null, total, abono || 0, saldo, estado, recetaId || null, usuarioId || null, observaciones || null]
        );

        const ventaId = ventaResult.insertId;

        // Insertar los detalles de la venta
        for (const detalle of detalles) {
            await connection.query(
                `INSERT INTO detalles_venta 
           (venta_id, tipo_producto, producto_id, armazon_id, cantidad, precio_unitario, subtotal) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [ventaId, detalle.tipoProducto,
                    detalle.tipoProducto === 'Producto' ? detalle.productoId : null,
                    detalle.tipoProducto === 'Armazon' ? detalle.armazonId : null,
                    detalle.cantidad, detalle.precioUnitario, detalle.subtotal]
            );

            // Actualizar el stock
            if (detalle.tipoProducto === 'Producto') {
                await connection.query(
                    'UPDATE productos SET stock = stock - ? WHERE id = ?',
                    [detalle.cantidad, detalle.productoId]
                );
            } else if (detalle.tipoProducto === 'Armazon') {
                await connection.query(
                    'UPDATE armazones SET stock = stock - ? WHERE id = ?',
                    [detalle.cantidad, detalle.armazonId]
                );
            }
        }

        // Registrar el pago inicial si hay abono
        if (abono && abono > 0) {
            await connection.query(
                `INSERT INTO pagos 
           (venta_id, fecha, monto, metodo_pago, usuario_id) 
           VALUES (?, CURDATE(), ?, ?, ?)`,
                [ventaId, abono, 'Efectivo', usuarioId || null]
            );
        }

        // Actualizar la última visita del cliente
        if (clienteId) {
            await connection.query(
                'UPDATE clientes SET ultima_visita = CURDATE() WHERE id = ?',
                [clienteId]
            );
        }

        await connection.commit();

        res.status(201).json({
            id: ventaId,
            clienteId,
            convenio: convenio || false,
            empresaId: empresaId || null,
            fecha: new Date().toISOString().split('T')[0],
            total,
            abono: abono || 0,
            saldo,
            estado,
            recetaId,
            usuarioId,
            observaciones,
            fecha_registro: new Date().toISOString(),
            detalles
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error al crear venta:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    } finally {
        connection.release();
    }
});

// Registrar un pago para una venta
app.post('/api/ventas/:id/pagos', async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { monto, metodoPago, referencia, usuarioId } = req.body;

        // Verificar que la venta exista
        const [ventas] = await connection.query('SELECT * FROM ventas WHERE id = ?', [id]);

        if (ventas.length === 0) {
            return res.status(404).json({ message: 'Venta no encontrada' });
        }

        const venta = ventas[0];

        // Verificar que el monto no exceda el saldo
        if (monto > venta.saldo) {
            return res.status(400).json({ message: 'El monto del pago excede el saldo pendiente' });
        }

        // Registrar el pago
        const [pagoResult] = await connection.query(
            `INSERT INTO pagos 
       (venta_id, fecha, monto, metodo_pago, referencia, usuario_id) 
       VALUES (?, CURDATE(), ?, ?, ?, ?)`,
            [id, monto, metodoPago, referencia || null, usuarioId || null]
        );

        // Actualizar el saldo y estado de la venta
        const nuevoAbono = venta.abono + monto;
        const nuevoSaldo = venta.total - nuevoAbono;
        const nuevoEstado = nuevoSaldo <= 0 ? 'Pagada' : 'Parcial';

        await connection.query(
            'UPDATE ventas SET abono = ?, saldo = ?, estado = ? WHERE id = ?',
            [nuevoAbono, nuevoSaldo, nuevoEstado, id]
        );

        await connection.commit();

        res.status(201).json({
            id: pagoResult.insertId,
            ventaId: parseInt(id),
            fecha: new Date().toISOString().split('T')[0],
            monto,
            metodoPago,
            referencia,
            usuarioId
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error al registrar pago:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    } finally {
        connection.release();
    }
});

// ===== RUTAS DE CITAS =====
// Obtener todas las citas
app.get('/api/citas', async (req, res) => {
    try {
        const { fecha, estado } = req.query;

        let query = `
      SELECT c.*, cl.nombre as cliente_nombre, u.nombre as usuario_nombre 
      FROM citas c 
      JOIN clientes cl ON c.cliente_id = cl.id 
      LEFT JOIN usuarios u ON c.usuario_id = u.id
    `;

        let params = [];
        const whereConditions = [];

        if (fecha) {
            whereConditions.push('DATE(c.fecha) = ?');
            params.push(fecha);
        }

        if (estado) {
            whereConditions.push('c.estado = ?');
            params.push(estado);
        }

        if (whereConditions.length > 0) {
            query += ' WHERE ' + whereConditions.join(' AND ');
        }

        query += ' ORDER BY c.fecha';

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener citas:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Crear una nueva cita
app.post('/api/citas', async (req, res) => {
    try {
        const { clienteId, fecha, motivo, usuarioId } = req.body;

        const [result] = await pool.query(
            `INSERT INTO citas 
       (cliente_id, fecha, motivo, estado, usuario_id) 
       VALUES (?, ?, ?, 'Pendiente', ?)`,
            [clienteId, fecha, motivo, usuarioId || null]
        );

        res.status(201).json({
            id: result.insertId,
            clienteId,
            fecha,
            motivo,
            estado: 'Pendiente',
            usuarioId
        });
    } catch (error) {
        console.error('Error al crear cita:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Actualizar el estado de una cita
app.put('/api/citas/:id/estado', async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        await pool.query(
            'UPDATE citas SET estado = ? WHERE id = ?',
            [estado, id]
        );

        res.json({
            id: parseInt(id),
            estado
        });
    } catch (error) {
        console.error('Error al actualizar estado de cita:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// ===== RUTAS DE CATEGORÍAS =====
// Obtener todas las categorías
app.get('/api/categorias', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM categorias ORDER BY nombre');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Crear una nueva categoría
app.post('/api/categorias', async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        
        const [result] = await pool.query(
            'INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)',
            [nombre, descripcion || null]
        );
        
        res.status(201).json({
            id: result.insertId,
            nombre,
            descripcion
        });
    } catch (error) {
        console.error('Error al crear categoría:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Actualizar una categoría
app.put('/api/categorias/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion } = req.body;
        
        await pool.query(
            'UPDATE categorias SET nombre = ?, descripcion = ? WHERE id = ?',
            [nombre, descripcion || null, id]
        );
        
        res.json({
            id: parseInt(id),
            nombre,
            descripcion
        });
    } catch (error) {
        console.error('Error al actualizar categoría:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Eliminar una categoría
app.delete('/api/categorias/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar si hay productos asociados a esta categoría
        const [productos] = await pool.query('SELECT COUNT(*) as count FROM productos WHERE categoria_id = ?', [id]);
        
        if (productos[0].count > 0) {
            return res.status(400).json({ 
                message: 'No se puede eliminar la categoría porque tiene productos asociados' 
            });
        }
        
        // Eliminar la categoría
        await pool.query('DELETE FROM categorias WHERE id = ?', [id]);
        
        res.json({ message: 'Categoría eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar categoría:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// ===== RUTAS DE PROVEEDORES =====
// Obtener todos los proveedores
app.get('/api/proveedores', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM proveedores ORDER BY nombre');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener proveedores:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Crear un nuevo proveedor
app.post('/api/proveedores', async (req, res) => {
    try {
        const { nombre, contacto, telefono, email, direccion } = req.body;
        
        const [result] = await pool.query(
            `INSERT INTO proveedores 
            (nombre, contacto, telefono, email, direccion) 
            VALUES (?, ?, ?, ?, ?)`,
            [nombre, contacto || null, telefono || null, email || null, direccion || null]
        );
        
        res.status(201).json({
            id: result.insertId,
            nombre,
            contacto,
            telefono,
            email,
            direccion
        });
    } catch (error) {
        console.error('Error al crear proveedor:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Actualizar un proveedor
app.put('/api/proveedores/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, contacto, telefono, email, direccion } = req.body;
        
        await pool.query(
            `UPDATE proveedores 
            SET nombre = ?, contacto = ?, telefono = ?, email = ?, direccion = ? 
            WHERE id = ?`,
            [nombre, contacto || null, telefono || null, email || null, direccion || null, id]
        );
        
        res.json({
            id: parseInt(id),
            nombre,
            contacto,
            telefono,
            email,
            direccion
        });
    } catch (error) {
        console.error('Error al actualizar proveedor:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Eliminar un proveedor
app.delete('/api/proveedores/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar si hay productos o armazones asociados a este proveedor
        const [productos] = await pool.query('SELECT COUNT(*) as count FROM productos WHERE proveedor_id = ?', [id]);
        const [armazones] = await pool.query('SELECT COUNT(*) as count FROM armazones WHERE proveedor_id = ?', [id]);
        
        if (productos[0].count > 0 || armazones[0].count > 0) {
            return res.status(400).json({ 
                message: 'No se puede eliminar el proveedor porque tiene productos o armazones asociados' 
            });
        }
        
        // Eliminar el proveedor
        await pool.query('DELETE FROM proveedores WHERE id = ?', [id]);
        
        res.json({ message: 'Proveedor eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar proveedor:', error);
        res.status(500).json({ message: 'Error en el servidor' });
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

        console.log('\n📝 API REST disponible con múltiples endpoints para:');
        console.log('   - Clientes y empresas (convenios)');
        console.log('   - Productos, armazones e inventario');
        console.log('   - Recetas y medidas de armazón');
        console.log('   - Ventas, detalles y pagos');
        console.log('   - Citas y gestión de agenda');
    });
}

// Iniciar el servidor
startServer();