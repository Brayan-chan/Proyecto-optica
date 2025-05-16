import { 
    collection, 
    getDocs, 
    doc, 
    getDoc, 
    deleteDoc,
    addDoc,
    updateDoc,
    setDoc,
    serverTimestamp,
    query,
    where,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { db } from "./firebase-config.js";

// Variables globales para almacenar categorías y proveedores
let categorias = [];
let proveedores = [];

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Página de inventario cargada');
    
    try {
        // Verificar y crear colecciones necesarias
        await checkAndCreateCollections();
        
        // Cargar categorías y proveedores
        await loadCategorias();
        await loadProveedores();
        
        // Configurar las pestañas
        setupTabs();
        
        // Cargar datos iniciales
        await loadProductos();
        await loadArmazones();
        
        // Configurar eventos para los modales
        setupModalEvents();
        
        // Configurar eventos para los formularios
        setupFormEvents();
    } catch (error) {
        console.error("Error al inicializar la página de inventario:", error);
    }
});

// Función para verificar y crear colecciones necesarias
async function checkAndCreateCollections() {
    try {
        console.log("Verificando colecciones necesarias...");
        
        // Verificar si existe la colección de categorías
        const categoriasSnapshot = await getDocs(collection(db, 'categorias'));
        if (categoriasSnapshot.empty) {
            console.log("Creando colección de categorías...");
            // Crear categorías iniciales
            const categoriasIniciales = [
                { nombre: 'General', descripcion: 'Productos generales' },
                { nombre: 'Lentes', descripcion: 'Lentes y accesorios' },
                { nombre: 'Armazones', descripcion: 'Armazones para lentes' },
                { nombre: 'Accesorios', descripcion: 'Accesorios para lentes' },
                { nombre: 'Limpieza', descripcion: 'Productos de limpieza' }
            ];
            
            for (const categoria of categoriasIniciales) {
                await addDoc(collection(db, 'categorias'), {
                    ...categoria,
                    createdAt: serverTimestamp()
                });
            }
        }
        
        // Verificar si existe la colección de proveedores
        const proveedoresSnapshot = await getDocs(collection(db, 'proveedores'));
        if (proveedoresSnapshot.empty) {
            console.log("Creando colección de proveedores...");
            // Crear un proveedor inicial
            await addDoc(collection(db, 'proveedores'), {
                nombre: 'Proveedor General',
                telefono: '',
                email: '',
                direccion: '',
                createdAt: serverTimestamp()
            });
        }
        
        console.log("Verificación de colecciones completada");
    } catch (error) {
        console.error("Error al verificar o crear colecciones:", error);
        throw error;
    }
}

// Función para configurar las pestañas
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remover clase active de todos los botones
            tabButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.querySelector('span').classList.add('opacity-0');
            });
            
            // Agregar clase active al botón clickeado
            button.classList.add('active');
            button.querySelector('span').classList.remove('opacity-0');
            
            // Mostrar el contenido de la pestaña correspondiente
            const tabId = button.getAttribute('data-tab');
            tabContents.forEach(content => {
                content.style.display = content.id === tabId + '-tab' ? 'block' : 'none';
            });
        });
    });
}

// Función para cargar categorías
async function loadCategorias() {
    try {
        const categoriasSnapshot = await getDocs(collection(db, 'categorias'));
        categorias = [];
        
        categoriasSnapshot.forEach(doc => {
            categorias.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Actualizar los selectores de categorías
        const productoCategoriaSelect = document.getElementById('productoCategoria');
        if (productoCategoriaSelect) {
            productoCategoriaSelect.innerHTML = '<option value="">Seleccione una categoría</option>';
            categorias.forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria.id;
                option.textContent = categoria.nombre;
                productoCategoriaSelect.appendChild(option);
            });
        }
        
        console.log("Categorías cargadas:", categorias.length);
    } catch (error) {
        console.error("Error al cargar categorías:", error);
    }
}

// Función para cargar proveedores
async function loadProveedores() {
    try {
        const proveedoresSnapshot = await getDocs(collection(db, 'proveedores'));
        proveedores = [];
        
        proveedoresSnapshot.forEach(doc => {
            proveedores.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Actualizar los selectores de proveedores
        const productoProveedorSelect = document.getElementById('productoProveedor');
        const armazonProveedorSelect = document.getElementById('armazonProveedor');
        
        if (productoProveedorSelect) {
            productoProveedorSelect.innerHTML = '<option value="">Seleccione un proveedor</option>';
            proveedores.forEach(proveedor => {
                const option = document.createElement('option');
                option.value = proveedor.id;
                option.textContent = proveedor.nombre;
                productoProveedorSelect.appendChild(option);
            });
        }
        
        if (armazonProveedorSelect) {
            armazonProveedorSelect.innerHTML = '<option value="">Seleccione un proveedor</option>';
            proveedores.forEach(proveedor => {
                const option = document.createElement('option');
                option.value = proveedor.id;
                option.textContent = proveedor.nombre;
                armazonProveedorSelect.appendChild(option);
            });
        }
        
        console.log("Proveedores cargados:", proveedores.length);
    } catch (error) {
        console.error("Error al cargar proveedores:", error);
    }
}

// Función para cargar productos
async function loadProductos() {
    const tableBody = document.getElementById('productosTableBody');
    if (!tableBody) return;
    
    // Limpiar tabla
    tableBody.innerHTML = '<tr><td colspan="8" class="py-4 text-center">Cargando productos...</td></tr>';
    
    try {
        // Cargar productos desde Firestore
        const productosSnapshot = await getDocs(collection(db, 'productos'));
        
        if (productosSnapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="8" class="py-4 text-center">No hay productos registrados</td></tr>';
            return;
        }
        
        // Limpiar tabla
        tableBody.innerHTML = '';
        
        // Agregar productos a la tabla
        productosSnapshot.forEach(doc => {
            const producto = doc.data();
            
            // Buscar nombre de categoría
            let categoriaNombre = 'No especificada';
            if (producto.categoriaId) {
                const categoria = categorias.find(c => c.id === producto.categoriaId);
                if (categoria) {
                    categoriaNombre = categoria.nombre;
                }
            }
            
            // Buscar nombre de proveedor
            let proveedorNombre = 'No especificado';
            if (producto.proveedorId) {
                const proveedor = proveedores.find(p => p.id === producto.proveedorId);
                if (proveedor) {
                    proveedorNombre = proveedor.nombre;
                }
            }
            
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 dark:hover:bg-gray-700';
            
            row.innerHTML = `
                <td class="py-3 px-4">${producto.codigo || doc.id}</td>
                <td class="py-3 px-4">${producto.nombre || ''}</td>
                <td class="py-3 px-4">${categoriaNombre}</td>
                <td class="py-3 px-4">${proveedorNombre}</td>
                <td class="py-3 px-4">$${(producto.precioCompra || 0).toFixed(2)}</td>
                <td class="py-3 px-4">$${(producto.precioVenta || 0).toFixed(2)}</td>
                <td class="py-3 px-4">${producto.stock || 0}</td>
                <td class="py-3 px-4">
                    <div class="flex space-x-2">
                        <button class="edit-producto text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" data-id="${doc.id}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button class="delete-producto text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300" data-id="${doc.id}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Configurar eventos para los botones de editar y eliminar
        setupProductoEvents();
    } catch (error) {
        console.error("Error al cargar productos:", error);
        tableBody.innerHTML = '<tr><td colspan="8" class="py-4 text-center text-red-500">Error al cargar productos</td></tr>';
    }
}

// Función para cargar armazones
async function loadArmazones() {
    const tableBody = document.getElementById('armazonesTableBody');
    if (!tableBody) return;
    
    // Limpiar tabla
    tableBody.innerHTML = '<tr><td colspan="9" class="py-4 text-center">Cargando armazones...</td></tr>';
    
    try {
        // Cargar armazones desde Firestore
        const armazonesSnapshot = await getDocs(collection(db, 'armazones'));
        
        if (armazonesSnapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="9" class="py-4 text-center">No hay armazones registrados</td></tr>';
            return;
        }
        
        // Limpiar tabla
        tableBody.innerHTML = '';
        
        // Agregar armazones a la tabla
        armazonesSnapshot.forEach(doc => {
            const armazon = doc.data();
            
            // Buscar nombre de proveedor
            let proveedorNombre = 'No especificado';
            if (armazon.proveedorId) {
                const proveedor = proveedores.find(p => p.id === armazon.proveedorId);
                if (proveedor) {
                    proveedorNombre = proveedor.nombre;
                }
            }
            
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 dark:hover:bg-gray-700';
            
            row.innerHTML = `
                <td class="py-3 px-4">${armazon.codigo || doc.id}</td>
                <td class="py-3 px-4">${armazon.nombre || ''}</td>
                <td class="py-3 px-4">${armazon.marca || ''}</td>
                <td class="py-3 px-4">${armazon.modelo || ''}</td>
                <td class="py-3 px-4">${armazon.color || ''}</td>
                <td class="py-3 px-4">$${(armazon.precioCompra || 0).toFixed(2)}</td>
                <td class="py-3 px-4">$${(armazon.precioVenta || 0).toFixed(2)}</td>
                <td class="py-3 px-4">${armazon.stock || 0}</td>
                <td class="py-3 px-4">
                    <div class="flex space-x-2">
                        <button class="edit-armazon text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" data-id="${doc.id}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button class="delete-armazon text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300" data-id="${doc.id}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Configurar eventos para los botones de editar y eliminar
        setupArmazonEvents();
    } catch (error) {
        console.error("Error al cargar armazones:", error);
        tableBody.innerHTML = '<tr><td colspan="9" class="py-4 text-center text-red-500">Error al cargar armazones</td></tr>';
    }
}

// Configurar eventos para los modales
function setupModalEvents() {
    // Configurar botón para agregar producto
    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => {
            // Mostrar modal de producto
            const modal = document.getElementById('productoModal');
            if (modal) {
                modal.style.display = 'block';
                document.getElementById('productoModalTitle').textContent = 'Agregar Producto';
                document.getElementById('productoForm').reset();
                document.getElementById('productoId').value = '';
                
                // Ocultar mensaje de error
                const errorMessage = document.getElementById('error-message');
                if (errorMessage) {
                    errorMessage.classList.add('hidden');
                    errorMessage.textContent = '';
                }
            }
        });
    }
    
    // Configurar botón para agregar armazón
    const addArmazonBtn = document.getElementById('addArmazonBtn');
    if (addArmazonBtn) {
        addArmazonBtn.addEventListener('click', () => {
            // Mostrar modal de armazón
            const modal = document.getElementById('armazonModal');
            if (modal) {
                modal.style.display = 'block';
                document.getElementById('armazonModalTitle').textContent = 'Agregar Armazón';
                document.getElementById('armazonForm').reset();
                document.getElementById('armazonIdHidden').value = '';
                
                // Ocultar mensaje de error
                const errorMessage = document.getElementById('armazon-error-message');
                if (errorMessage) {
                    errorMessage.classList.add('hidden');
                    errorMessage.textContent = '';
                }
            }
        });
    }
    
    // Configurar botones para cerrar modales
    const closeButtons = document.querySelectorAll('.close, .close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
    
    // Cerrar modal al hacer clic fuera del contenido
    window.addEventListener('click', (event) => {
        document.querySelectorAll('.modal').forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

// Configurar eventos para los formularios
function setupFormEvents() {
    // Configurar formulario de producto
    const productoForm = document.getElementById('productoForm');
    if (productoForm) {
        productoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                const productoId = document.getElementById('productoId').value;
                const codigo = document.getElementById('productoCodigo').value;
                const nombre = document.getElementById('productoNombre').value;
                const descripcion = document.getElementById('productoDescripcion').value;
                const tipo = document.getElementById('productoTipo').value;
                const categoriaId = document.getElementById('productoCategoria').value;
                const proveedorId = document.getElementById('productoProveedor').value;
                const precioCompra = parseFloat(document.getElementById('productoPrecioCompra').value);
                const precioVenta = parseFloat(document.getElementById('productoPrecioVenta').value);
                const stock = parseInt(document.getElementById('productoStock').value);
                
                // Validar campos requeridos
                if (!codigo || !nombre || !tipo || !categoriaId || isNaN(precioCompra) || isNaN(precioVenta) || isNaN(stock)) {
                    const errorMessage = document.getElementById('error-message');
                    errorMessage.textContent = 'Por favor, complete todos los campos requeridos.';
                    errorMessage.classList.remove('hidden');
                    return;
                }
                
                // Crear objeto de producto
                const productoData = {
                    codigo,
                    nombre,
                    descripcion,
                    tipo,
                    categoriaId,
                    proveedorId: proveedorId || null,
                    precioCompra,
                    precioVenta,
                    stock,
                    updatedAt: serverTimestamp()
                };
                
                if (!productoId) {
                    // Agregar fecha de creación para nuevos productos
                    productoData.createdAt = serverTimestamp();
                    
                    // Verificar si ya existe un producto con el mismo código
                    const codigoQuery = query(
                        collection(db, 'productos'),
                        where('codigo', '==', codigo)
                    );
                    const codigoSnapshot = await getDocs(codigoQuery);
                    
                    if (!codigoSnapshot.empty) {
                        const errorMessage = document.getElementById('error-message');
                        errorMessage.textContent = 'Ya existe un producto con este código.';
                        errorMessage.classList.remove('hidden');
                        return;
                    }
                    
                    // Agregar nuevo producto
                    await addDoc(collection(db, 'productos'), productoData);
                    console.log('Producto agregado correctamente');
                } else {
                    // Actualizar producto existente
                    await updateDoc(doc(db, 'productos', productoId), productoData);
                    console.log('Producto actualizado correctamente');
                }
                
                // Cerrar modal
                document.getElementById('productoModal').style.display = 'none';
                
                // Recargar productos
                await loadProductos();
            } catch (error) {
                console.error('Error al guardar producto:', error);
                const errorMessage = document.getElementById('error-message');
                errorMessage.textContent = 'Error al guardar el producto. Inténtelo de nuevo.';
                errorMessage.classList.remove('hidden');
            }
        });
    }
    
    // Configurar formulario de armazón
    const armazonForm = document.getElementById('armazonForm');
    if (armazonForm) {
        armazonForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                const armazonId = document.getElementById('armazonIdHidden').value;
                const codigo = document.getElementById('armazonId').value;
                const nombre = document.getElementById('armazonNombre').value;
                const marca = document.getElementById('armazonMarca').value;
                const modelo = document.getElementById('armazonModelo').value;
                const color = document.getElementById('armazonColor').value;
                const material = document.getElementById('armazonMaterial').value;
                const proveedorId = document.getElementById('armazonProveedor').value;
                const precioCompra = parseFloat(document.getElementById('armazonPrecioCompra').value);
                const precioVenta = parseFloat(document.getElementById('armazonPrecioVenta').value);
                const stock = parseInt(document.getElementById('armazonStock').value);
                
                // Validar campos requeridos
                if (!codigo || !nombre || isNaN(precioCompra) || isNaN(precioVenta) || isNaN(stock)) {
                    const errorMessage = document.getElementById('armazon-error-message');
                    errorMessage.textContent = 'Por favor, complete todos los campos requeridos.';
                    errorMessage.classList.remove('hidden');
                    return;
                }
                
                // Crear objeto de armazón
                const armazonData = {
                    codigo,
                    nombre,
                    marca,
                    modelo,
                    color,
                    material,
                    proveedorId: proveedorId || null,
                    precioCompra,
                    precioVenta,
                    stock,
                    tipo: 'armazon', // Tipo fijo para armazones
                    updatedAt: serverTimestamp()
                };
                
                if (!armazonId) {
                    // Agregar fecha de creación para nuevos armazones
                    armazonData.createdAt = serverTimestamp();
                    
                    // Verificar si ya existe un armazón con el mismo código
                    const codigoQuery = query(
                        collection(db, 'armazones'),
                        where('codigo', '==', codigo)
                    );
                    const codigoSnapshot = await getDocs(codigoQuery);
                    
                    if (!codigoSnapshot.empty) {
                        const errorMessage = document.getElementById('armazon-error-message');
                        errorMessage.textContent = 'Ya existe un armazón con este código.';
                        errorMessage.classList.remove('hidden');
                        return;
                    }
                    
                    // Agregar nuevo armazón
                    await addDoc(collection(db, 'armazones'), armazonData);
                    console.log('Armazón agregado correctamente');
                } else {
                    // Actualizar armazón existente
                    await updateDoc(doc(db, 'armazones', armazonId), armazonData);
                    console.log('Armazón actualizado correctamente');
                }
                
                // Cerrar modal
                document.getElementById('armazonModal').style.display = 'none';
                
                // Recargar armazones
                await loadArmazones();
            } catch (error) {
                console.error('Error al guardar armazón:', error);
                const errorMessage = document.getElementById('armazon-error-message');
                errorMessage.textContent = 'Error al guardar el armazón. Inténtelo de nuevo.';
                errorMessage.classList.remove('hidden');
            }
        });
    }
}

// Configurar eventos para los productos
function setupProductoEvents() {
    // Configurar botones para editar productos
    const editButtons = document.querySelectorAll('.edit-producto');
    editButtons.forEach(button => {
        button.addEventListener('click', () => {
            const productoId = button.getAttribute('data-id');
            editProducto(productoId);
        });
    });
    
    // Configurar botones para eliminar productos
    const deleteButtons = document.querySelectorAll('.delete-producto');
    deleteButtons.forEach(button => {
        button.addEventListener('click', () => {
            const productoId = button.getAttribute('data-id');
            deleteProducto(productoId);
        });
    });
}

// Configurar eventos para los armazones
function setupArmazonEvents() {
    // Configurar botones para editar armazones
    const editButtons = document.querySelectorAll('.edit-armazon');
    editButtons.forEach(button => {
        button.addEventListener('click', () => {
            const armazonId = button.getAttribute('data-id');
            editArmazon(armazonId);
        });
    });
    
    // Configurar botones para eliminar armazones
    const deleteButtons = document.querySelectorAll('.delete-armazon');
    deleteButtons.forEach(button => {
        button.addEventListener('click', () => {
            const armazonId = button.getAttribute('data-id');
            deleteArmazon(armazonId);
        });
    });
}

// Función para editar un producto
async function editProducto(productoId) {
    try {
        // Obtener datos del producto
        const docRef = doc(db, 'productos', productoId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const producto = docSnap.data();
            
            // Mostrar modal de producto
            const modal = document.getElementById('productoModal');
            if (modal) {
                modal.style.display = 'block';
                document.getElementById('productoModalTitle').textContent = 'Editar Producto';
                
                // Llenar formulario con datos del producto
                document.getElementById('productoId').value = productoId;
                document.getElementById('productoCodigo').value = producto.codigo || '';
                document.getElementById('productoNombre').value = producto.nombre || '';
                document.getElementById('productoDescripcion').value = producto.descripcion || '';
                document.getElementById('productoTipo').value = producto.tipo || '';
                document.getElementById('productoCategoria').value = producto.categoriaId || '';
                document.getElementById('productoProveedor').value = producto.proveedorId || '';
                document.getElementById('productoPrecioCompra').value = producto.precioCompra || '';
                document.getElementById('productoPrecioVenta').value = producto.precioVenta || '';
                document.getElementById('productoStock').value = producto.stock || '';
                
                // Ocultar mensaje de error
                const errorMessage = document.getElementById('error-message');
                if (errorMessage) {
                    errorMessage.classList.add('hidden');
                    errorMessage.textContent = '';
                }
            }
        } else {
            console.error("No se encontró el producto");
        }
    } catch (error) {
        console.error("Error al obtener producto:", error);
    }
}

// Función para eliminar un producto
async function deleteProducto(productoId) {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
        try {
            await deleteDoc(doc(db, 'productos', productoId));
            alert('Producto eliminado correctamente');
            loadProductos();
        } catch (error) {
            console.error("Error al eliminar producto:", error);
            alert('Error al eliminar producto');
        }
    }
}

// Función para editar un armazón
async function editArmazon(armazonId) {
    try {
        // Obtener datos del armazón
        const docRef = doc(db, 'armazones', armazonId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const armazon = docSnap.data();
            
            // Mostrar modal de armazón
            const modal = document.getElementById('armazonModal');
            if (modal) {
                modal.style.display = 'block';
                document.getElementById('armazonModalTitle').textContent = 'Editar Armazón';
                
                // Llenar formulario con datos del armazón
                document.getElementById('armazonIdHidden').value = armazonId;
                document.getElementById('armazonId').value = armazon.codigo || '';
                document.getElementById('armazonNombre').value = armazon.nombre || '';
                document.getElementById('armazonMarca').value = armazon.marca || '';
                document.getElementById('armazonModelo').value = armazon.modelo || '';
                document.getElementById('armazonColor').value = armazon.color || '';
                document.getElementById('armazonMaterial').value = armazon.material || '';
                document.getElementById('armazonProveedor').value = armazon.proveedorId || '';
                document.getElementById('armazonPrecioCompra').value = armazon.precioCompra || '';
                document.getElementById('armazonPrecioVenta').value = armazon.precioVenta || '';
                document.getElementById('armazonStock').value = armazon.stock || '';
                
                // Ocultar mensaje de error
                const errorMessage = document.getElementById('armazon-error-message');
                if (errorMessage) {
                    errorMessage.classList.add('hidden');
                    errorMessage.textContent = '';
                }
            }
        } else {
            console.error("No se encontró el armazón");
        }
    } catch (error) {
        console.error("Error al obtener armazón:", error);
    }
}

// Función para eliminar un armazón
async function deleteArmazon(armazonId) {
    if (confirm('¿Estás seguro de que deseas eliminar este armazón?')) {
        try {
            await deleteDoc(doc(db, 'armazones', armazonId));
            alert('Armazón eliminado correctamente');
            loadArmazones();
        } catch (error) {
            console.error("Error al eliminar armazón:", error);
            alert('Error al eliminar armazón');
        }
    }
}