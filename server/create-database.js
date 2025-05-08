import mysql from 'mysql2/promise';

async function createDatabase() {
  // Configuración de la conexión a la base de datos
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // Por defecto en XAMPP no tiene contraseña
  });

  try {
    console.log('Creando base de datos...');
    
    // Crear la base de datos si no existe
    await connection.query('CREATE DATABASE IF NOT EXISTS optica_db');
    await connection.query('USE optica_db');
    
    console.log('✅ Base de datos creada correctamente');
    
    // Crear tablas
    console.log('Creando tablas...');
    
    // Tabla de usuarios (administradores/empleados)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        rol ENUM('admin', 'vendedor', 'optometrista') NOT NULL,
        activo BOOLEAN DEFAULT TRUE
      )
    `);
    
    // Tabla de empresas (para convenios)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS empresas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        direccion TEXT,
        telefono VARCHAR(20),
        email VARCHAR(100),
        contacto_nombre VARCHAR(100),
        credito_limite DECIMAL(10, 2) DEFAULT 0,
        activo BOOLEAN DEFAULT TRUE,
        fecha_registro DATE NOT NULL
      )
    `);
    
    // Tabla de clientes
    await connection.query(`
      CREATE TABLE IF NOT EXISTS clientes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        telefono VARCHAR(20),
        email VARCHAR(100),
        direccion TEXT,
        fecha_nacimiento DATE,
        empresa_id INT,
        convenio BOOLEAN DEFAULT FALSE,
        fecha_registro DATE NOT NULL,
        ultima_visita DATE,
        FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL
      )
    `);
    
    // Tabla de categorías de productos
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categorias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(50) NOT NULL,
        descripcion TEXT
      )
    `);
    
    // Tabla de proveedores
    await connection.query(`
      CREATE TABLE IF NOT EXISTS proveedores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        contacto VARCHAR(100),
        telefono VARCHAR(20),
        email VARCHAR(100),
        direccion TEXT
      )
    `);
    
    // Tabla de productos
    await connection.query(`
      CREATE TABLE IF NOT EXISTS productos (
        id VARCHAR(50) PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        categoria_id INT NOT NULL,
        proveedor_id INT,
        precio_compra DECIMAL(10, 2) NOT NULL,
        precio_venta DECIMAL(10, 2) NOT NULL,
        stock INT NOT NULL DEFAULT 0,
        fecha_registro DATE NOT NULL,
        FOREIGN KEY (categoria_id) REFERENCES categorias(id),
        FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL
      )
    `);
    
    // Tabla de armazones
    await connection.query(`
      CREATE TABLE IF NOT EXISTS armazones (
        id VARCHAR(50) PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        marca VARCHAR(50),
        modelo VARCHAR(50),
        color VARCHAR(30),
        material VARCHAR(50),
        precio_compra DECIMAL(10, 2) NOT NULL,
        precio_venta DECIMAL(10, 2) NOT NULL,
        stock INT NOT NULL DEFAULT 0,
        proveedor_id INT,
        fecha_registro DATE NOT NULL,
        FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL
      )
    `);
    
    // Tabla de recetas
    await connection.query(`
      CREATE TABLE IF NOT EXISTS recetas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cliente_id INT NOT NULL,
        fecha DATE NOT NULL,
        ojo_izquierdo_esfera DECIMAL(5, 2),
        ojo_izquierdo_cilindro DECIMAL(5, 2),
        ojo_izquierdo_eje INT,
        ojo_derecho_esfera DECIMAL(5, 2),
        ojo_derecho_cilindro DECIMAL(5, 2),
        ojo_derecho_eje INT,
        adicion DECIMAL(5, 2),
        dnp DECIMAL(5, 2),
        observaciones TEXT,
        usuario_id INT,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
      )
    `);
    
    // Tabla de medidas de armazón (para recetas)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS medidas_armazon (
        id INT AUTO_INCREMENT PRIMARY KEY,
        receta_id INT NOT NULL,
        armazon_id VARCHAR(50),
        armazon_nombre VARCHAR(100),
        v DECIMAL(5, 2),
        h DECIMAL(5, 2),
        d DECIMAL(5, 2),
        p DECIMAL(5, 2),
        ait DECIMAL(5, 2),
        FOREIGN KEY (receta_id) REFERENCES recetas(id) ON DELETE CASCADE,
        FOREIGN KEY (armazon_id) REFERENCES armazones(id) ON DELETE SET NULL
      )
    `);
    
    // Tabla de ventas
    await connection.query(`
      CREATE TABLE IF NOT EXISTS ventas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cliente_id INT,
        fecha DATE NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        abono DECIMAL(10, 2) DEFAULT 0,
        saldo DECIMAL(10, 2) DEFAULT 0,
        estado ENUM('Pendiente', 'Parcial', 'Pagada', 'Cancelada') DEFAULT 'Pendiente',
        receta_id INT,
        usuario_id INT,
        observaciones TEXT,
        fecha_registro DATETIME NOT NULL,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
        FOREIGN KEY (receta_id) REFERENCES recetas(id) ON DELETE SET NULL,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
      )
    `);
    
    // Tabla de detalles de venta
    await connection.query(`
      CREATE TABLE IF NOT EXISTS detalles_venta (
        id INT AUTO_INCREMENT PRIMARY KEY,
        venta_id INT NOT NULL,
        tipo_producto ENUM('Producto', 'Armazon') NOT NULL,
        producto_id VARCHAR(50),
        armazon_id VARCHAR(50),
        cantidad INT NOT NULL,
        precio_unitario DECIMAL(10, 2) NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
        FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL,
        FOREIGN KEY (armazon_id) REFERENCES armazones(id) ON DELETE SET NULL
      )
    `);
    
    // Tabla de pagos
    await connection.query(`
      CREATE TABLE IF NOT EXISTS pagos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        venta_id INT NOT NULL,
        fecha DATE NOT NULL,
        monto DECIMAL(10, 2) NOT NULL,
        metodo_pago ENUM('Efectivo', 'Tarjeta', 'Transferencia', 'Otro') DEFAULT 'Efectivo',
        referencia VARCHAR(100),
        usuario_id INT,
        FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
      )
    `);
    
    // Tabla de citas
    await connection.query(`
      CREATE TABLE IF NOT EXISTS citas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cliente_id INT NOT NULL,
        fecha DATETIME NOT NULL,
        motivo TEXT,
        estado ENUM('Pendiente', 'Confirmada', 'Completada', 'Cancelada') DEFAULT 'Pendiente',
        usuario_id INT,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
      )
    `);
    
    // Insertar datos de ejemplo
    console.log('Insertando datos de ejemplo...');
    
    // Insertar usuario administrador
    await connection.query(`
      INSERT INTO usuarios (username, password, nombre, rol) 
      VALUES ('admin', 'admin123', 'Administrador', 'admin')
    `);
    
    // Insertar categorías
    await connection.query(`
      INSERT INTO categorias (nombre, descripcion) VALUES 
      ('Armazones', 'Armazones para lentes'),
      ('Lentes de contacto', 'Lentes de contacto de diferentes tipos'),
      ('Solares', 'Lentes para sol'),
      ('Accesorios', 'Estuches, cordones y otros accesorios'),
      ('Limpieza', 'Productos para limpieza de lentes')
    `);
    
    // Insertar proveedores
    await connection.query(`
      INSERT INTO proveedores (nombre, contacto, telefono, email) VALUES 
      ('Proveedor A', 'Juan Pérez', '555-1234', 'juan@proveedora.com'),
      ('Proveedor B', 'María García', '555-5678', 'maria@proveedorb.com')
    `);
    
    // Insertar productos
    await connection.query(`
      INSERT INTO productos (id, nombre, descripcion, categoria_id, proveedor_id, precio_compra, precio_venta, stock, fecha_registro) VALUES 
      ('LIMPKIT001', 'Kit de limpieza', 'Kit completo para limpieza de lentes', 5, 1, 150.00, 300.00, 20, CURDATE()),
      ('SOLFT001', 'Lentes de sol Fotocromáticos', 'Lentes de sol con protección UV', 3, 2, 500.00, 1200.00, 10, CURDATE()),
      ('CONTSOFT001', 'Lentes de contacto suaves', 'Lentes de contacto mensuales', 2, 1, 200.00, 450.00, 15, CURDATE())
    `);
    
    // Insertar armazones
    await connection.query(`
      INSERT INTO armazones (id, nombre, marca, modelo, color, material, precio_compra, precio_venta, stock, proveedor_id, fecha_registro) VALUES 
      ('3L_dressbase', 'Dressbase 3L', '3L', 'Dressbase', 'Negro', 'Metal', 400.00, 1200.00, 5, 1, CURDATE()),
      ('Fuchs_VERSION', 'Version Fuchs', 'Fuchs', 'VERSION', 'Azul', 'Acetato', 350.00, 950.00, 3, 2, CURDATE()),
      ('Fields_Behrinke', 'Behrinke Fields', 'Fields', 'Behrinke', 'Marrón', 'Metal/Acetato', 380.00, 1100.00, 4, 1, CURDATE())
    `);
    
    // Insertar empresas para convenios
    await connection.query(`
      INSERT INTO empresas (nombre, direccion, telefono, email, contacto_nombre, credito_limite, fecha_registro) VALUES 
      ('Empresa ABC', 'Calle Principal 123', '555-9876', 'contacto@empresaabc.com', 'Roberto Gómez', 10000.00, CURDATE()),
      ('Corporativo XYZ', 'Av. Central 456', '555-4321', 'rh@corporativoxyz.com', 'Laura Sánchez', 15000.00, CURDATE())
    `);
    
    // Insertar clientes
    await connection.query(`
      INSERT INTO clientes (nombre, telefono, email, direccion, empresa_id, convenio, fecha_registro, ultima_visita) VALUES 
      ('Juan Pérez', '555-1234', 'juan@example.com', 'Calle 123, Ciudad', NULL, FALSE, CURDATE(), CURDATE()),
      ('María García', '555-5678', 'maria@example.com', 'Av. Principal 456', 1, TRUE, CURDATE(), CURDATE()),
      ('Carlos López', '555-9012', 'carlos@example.com', 'Plaza Central 789', NULL, FALSE, CURDATE(), DATE_SUB(CURDATE(), INTERVAL 5 DAY))
    `);
    
    console.log('✅ Datos de ejemplo insertados correctamente');
    console.log('✅ Base de datos configurada correctamente');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    // Cerrar la conexión
    await connection.end();
  }
}

// Ejecutar la función
createDatabase();