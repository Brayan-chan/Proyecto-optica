import mysql from 'mysql2/promise';

async function createVentasTable() {
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

  try {
    console.log('Creando tabla de ventas...');
    
    // Eliminar la tabla si existe
    await pool.query('DROP TABLE IF EXISTS ventas');
    
    // Crear la nueva tabla de ventas
    await pool.query(`
      CREATE TABLE ventas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fecha VARCHAR(255),
        nombre VARCHAR(255),
        direccion VARCHAR(255),
        descripcion VARCHAR(255),
        valor1 INT,
        valor2 INT,
        valor3 VARCHAR(255),
        fecha_registro VARCHAR(255)
      )
    `);
    
    console.log('✅ Tabla de ventas creada correctamente');
    
    // Insertar datos de ejemplo
    console.log('Insertando datos de ejemplo...');
    
    const insertQuery = `
      INSERT INTO ventas (fecha, nombre, direccion, descripcion, valor1, valor2, valor3, fecha_registro) VALUES
      ('2 Au23-Naisy', 'Maria V morales', 'Malusa 80034', 'Bif Cr3a Foto', 2004, 2004, NULL, '25-1000-24'),
      ('No', 'Fernando Lopez N.', 'AXG124', 'Monot C3 bro', 1522, 1522, NULL, '25-100-24'),
      ('FC2 Nata', 'Julian Heriandez cocon', 'Luilei 15037', 'Honor. Poli Ar Foto', 3704, 4300, '596 SIA', '25-DOU-24'),
      ('1520NGGILRY', 'Isidio Naucio cab', 'Popio', 'Ping Crag Ar foto', 5490, 4300, '111051A', '29-1000-2.1'),
      ('Notice', 'Liliana Hanandez', 'Aofio', 'Rog erza fol', 4490, 4300, '190 AIP', '25-NOV-24'),
      ('25 NOV.IN', 'EIP Logwe', 'Popio', 'Manor drza Polo', 752, 752, NULL, '25 NOD-24'),
      ('RG NOI 24', 'Isac Weeken', 'Anna 4135', NULL, 3104, 3104, NULL, '26 NOU-24'),
      ('Nakay', 'Elise Leciano Heredia', 'Propio', 'Monor 30 bro', 432, 432, NULL, '25 NOU-24'),
      ('2ND 24', 'Miranda Silva Anayanci', 'Cloe S1379', 'Monof Poli Foto', 3982, 1000, '2282', '2C-NOV-24'),
      ('NON-24', 'Navee Antonicarlinez', 'Lacoste bace', 'Monor erza foto Ar blue', 4922, 2000, '2222', '26-NOV-24'),
      ('16 Nolby', 'Marca Pelaez', 'Calora 8890', 'F109. crza Colo', 8180, 2000, '680', '26-NOU-24'),
      ('26 NOV 24', 'Avi Martinez', 'Caulo M. 1164', 'Mohof C139 bro', 1897, 1000, '897', '26 NOU-24'),
      ('26 10-29', 'Nelson Jesus Fech May', 'sayor: 1011', 'Prog. Cr39 Ar blue', 4342, 4342, NULL, '26-000-24'),
      ('27.100.24', 'Roman vila', 'Prawan 202304', 'Arcisfaso', 550, 550, NULL, '-27NU-24'),
      ('20 NOV 24', 'Abelardo villamonte', 'Propio', 'bif. erza bro', 652, 652, NULL, '24 NOU-24'),
      ('27 NOV-24', 'Maria Yeh Lopez', 'Propio', 'Prog. drza bco', 2800, 1400, '1400', '27 NOV-24'),
      ('27 NOU-24', 'David Lekerman', 'Propio', 'Monof erza Foto', 752, 752, NULL, '27-NV-24'),
      ('27 NOV.24', 'Ingrid Lopek hrasta', 'elle 1552', 'Progresivo foto', 7180, 3500, '3680', '27-NOV-24'),
      ('27 NOJ-24', 'Kren Buitron', 'Ori', 'Monor. Crza Foto Ardue', 2272, 2272, NULL, '127 που-24'),
      ('27 Nou-24', 'Margarito Buerkerd', 'Propio', 'Monor erza foto', 752, 752, NULL, '27N00-24'),
      ('27 NOV 24', 'Eva Hilberth', NULL, 'blf criza Foto', 1592, 1592, NULL, '27 Now-24'),
      ('27 NOV 24', '1 Sac Buekert', NULL, 'Jounger Foto', 1500, 1500, NULL, '27 Nov'),
      ('27 No024', 'Gaday Avila Perez', '2ca10s Soflens', NULL, 1880, 940, '940', '12')
    `;
    
    await pool.query(insertQuery);
    
    console.log('✅ Datos de ejemplo insertados correctamente');
    
    // Verificar los datos insertados
    const [rows] = await pool.query('SELECT * FROM ventas LIMIT 5');
    console.log('\nPrimeros 5 registros insertados:');
    console.table(rows);
    
    console.log(`\nTotal de registros insertados: ${rows.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    // Cerrar la conexión
    await pool.end();
  }
}

// Ejecutar la función
createVentasTable();