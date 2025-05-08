import mysql from 'mysql2/promise';
// Importamos la función directamente desde create-tables.js
import { createTables } from './create-tables.js';

async function resetDatabase() {
  // Configuración de la conexión a la base de datos
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '' // Por defecto en XAMPP no tiene contraseña
  });

  try {
    console.log('Eliminando base de datos existente...');
    
    // Eliminar la base de datos si existe
    await connection.query('DROP DATABASE IF EXISTS optica_db');
    
    console.log('✅ Base de datos eliminada correctamente');
    console.log('Creando nueva base de datos...');
    
    // Crear la base de datos
    await connection.query('CREATE DATABASE optica_db');
    
    console.log('✅ Base de datos creada correctamente');
    console.log('Ejecutando script de creación de tablas...');
    
    // Cerrar la conexión actual
    await connection.end();
    
    // Ejecutar la función de creación de tablas
    await createTables();
    
    console.log('✅ Base de datos reiniciada correctamente');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    // Cerrar la conexión en caso de error
    await connection.end();
  }
}

// Ejecutar la función
resetDatabase();