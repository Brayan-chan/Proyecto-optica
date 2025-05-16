import { 
    collection, 
    getDocs, 
    doc, 
    getDoc, 
    deleteDoc,
    addDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { db } from "./firebase-config.js";

document.addEventListener('DOMContentLoaded', () => {
    console.log('Página de inventario cargada');
    
    // Configurar las pestañas
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
    
    // Cargar datos iniciales
    loadProductos();
    loadArmazones();
    
    // Configurar eventos para los modales
    setupModalEvents();
});

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
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 dark:hover:bg-gray-700';
            
            row.innerHTML = `
                <td class="py-3 px-4">${producto.codigo || doc.id}</td>
                <td class="py-3 px-4">${producto.nombre || ''}</td>
                <td class="py-3 px-4">${producto.categoria || ''}</td>
                <td class="py-3 px-4">${producto.proveedor || ''}</td>
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
                document.getElementById('productoCategoria').value = producto.categoria || '';
                document.getElementById('productoProveedor').value = producto.proveedor || '';
                document.getElementById('productoPrecioCompra').value = producto.precioCompra || '';
                document.getElementById('productoPrecioVenta').value = producto.precioVenta || '';
                document.getElementById('productoStock').value = producto.stock || '';
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
                document.getElementById('armazonProveedor').value = armazon.proveedor || '';
                document.getElementById('armazonPrecioCompra').value = armazon.precioCompra || '';
                document.getElementById('armazonPrecioVenta').value = armazon.precioVenta || '';
                document.getElementById('armazonStock').value = armazon.stock || '';
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