document.addEventListener('DOMContentLoaded', async function() {
    // Cargar datos iniciales
    await cargarDatos();
    
    // Configurar eventos para los formularios
    configurarFormularios();
    
    // Configurar eventos para los botones de editar y eliminar
    configurarBotonesAcciones();
    
    // Configurar eventos para las búsquedas
    configurarBusquedas();
    
    // Configurar eventos para las pestañas
    configurarTabs();
    
    // Configurar eventos para cerrar modales
    configurarModales();
});

// Función para cargar todos los datos necesarios
async function cargarDatos() {
    try {
        // Cargar productos
        const productosResponse = await fetch('http://localhost:3000/api/productos');
        const productos = await productosResponse.json();
        llenarTablaProductos(productos);
        
        // Cargar armazones
        const armazonesResponse = await fetch('http://localhost:3000/api/armazones');
        const armazones = await armazonesResponse.json();
        llenarTablaArmazones(armazones);
        
        // Cargar categorías
        const categoriasResponse = await fetch('http://localhost:3000/api/categorias');
        const categorias = await categoriasResponse.json();
        llenarSelectCategorias(categorias);
        
        // Cargar proveedores
        const proveedoresResponse = await fetch('http://localhost:3000/api/proveedores');
        const proveedores = await proveedoresResponse.json();
        llenarSelectProveedores(proveedores);
        
    } catch (error) {
        console.error('Error al cargar datos:', error);
        mostrarAlerta('Error al cargar los datos. Por favor, verifica la conexión con el servidor.', 'error');
    }
}

// Función para llenar la tabla de productos
function llenarTablaProductos(productos) {
    const productosTableBody = document.getElementById('productosTableBody');
    productosTableBody.innerHTML = ''; // Limpiar tabla
    
    productos.forEach(producto => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-lightGray dark:hover:bg-gray-700 transition-colors';
        row.innerHTML = `
            <td class="py-3 px-4">${producto.id}</td>
            <td class="py-3 px-4">${producto.nombre}</td>
            <td class="py-3 px-4">${producto.categoria_nombre}</td>
            <td class="py-3 px-4">${producto.proveedor_nombre || 'N/A'}</td>
            <td class="py-3 px-4">$${parseFloat(producto.precio_compra).toFixed(2)}</td>
            <td class="py-3 px-4">$${parseFloat(producto.precio_venta).toFixed(2)}</td>
            <td class="py-3 px-4">
                <span class="${producto.stock <= 5 ? 'text-red-500 font-medium' : ''}">${producto.stock}</span>
            </td>
            <td class="py-3 px-4">
                <div class="flex space-x-2">
                    <button class="btn-edit-producto btn-action bg-amber-500 hover:bg-amber-600 text-white py-1 px-2 rounded-md flex items-center" data-id="${producto.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar
                    </button>
                    <button class="btn-delete-producto btn-action bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded-md flex items-center" data-id="${producto.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Eliminar
                    </button>
                </div>
            </td>
        `;
        productosTableBody.appendChild(row);
    });
}

// Función para llenar la tabla de armazones
function llenarTablaArmazones(armazones) {
    const armazonesTableBody = document.getElementById('armazonesTableBody');
    armazonesTableBody.innerHTML = ''; // Limpiar tabla
    
    armazones.forEach(armazon => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-lightGray dark:hover:bg-gray-700 transition-colors';
        row.innerHTML = `
            <td class="py-3 px-4">${armazon.id}</td>
            <td class="py-3 px-4">${armazon.nombre}</td>
            <td class="py-3 px-4">${armazon.marca || 'N/A'}</td>
            <td class="py-3 px-4">${armazon.modelo || 'N/A'}</td>
            <td class="py-3 px-4">${armazon.color || 'N/A'}</td>
            <td class="py-3 px-4">$${parseFloat(armazon.precio_compra).toFixed(2)}</td>
            <td class="py-3 px-4">$${parseFloat(armazon.precio_venta).toFixed(2)}</td>
            <td class="py-3 px-4">
                <span class="${armazon.stock <= 5 ? 'text-red-500 font-medium' : ''}">${armazon.stock}</span>
            </td>
            <td class="py-3 px-4">
                <div class="flex space-x-2">
                    <button class="btn-edit-armazon btn-action bg-amber-500 hover:bg-amber-600 text-white py-1 px-2 rounded-md flex items-center" data-id="${armazon.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar
                    </button>
                    <button class="btn-delete-armazon btn-action bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded-md flex items-center" data-id="${armazon.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Eliminar
                    </button>
                </div>
            </td>
        `;
        armazonesTableBody.appendChild(row);
    });
}

// Función para llenar los selects de categorías
function llenarSelectCategorias(categorias) {
    const categoriaSelect = document.getElementById('productoCategoria');
    categoriaSelect.innerHTML = '<option value="">Seleccione una categoría</option>';
    
    categorias.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria.id;
        option.textContent = categoria.nombre;
        categoriaSelect.appendChild(option);
    });
}

// Función para llenar los selects de proveedores
function llenarSelectProveedores(proveedores) {
    const proveedorProductoSelect = document.getElementById('productoProveedor');
    const proveedorArmazonSelect = document.getElementById('armazonProveedor');
    
    // Limpiar selects
    proveedorProductoSelect.innerHTML = '<option value="">Seleccione un proveedor</option>';
    proveedorArmazonSelect.innerHTML = '<option value="">Seleccione un proveedor</option>';
    
    proveedores.forEach(proveedor => {
        // Para productos
        const optionProducto = document.createElement('option');
        optionProducto.value = proveedor.id;
        optionProducto.textContent = proveedor.nombre;
        proveedorProductoSelect.appendChild(optionProducto);
        
        // Para armazones
        const optionArmazon = document.createElement('option');
        optionArmazon.value = proveedor.id;
        optionArmazon.textContent = proveedor.nombre;
        proveedorArmazonSelect.appendChild(optionArmazon);
    });
}

// Configurar eventos para los formularios
function configurarFormularios() {
    // Formulario de productos
    document.getElementById('productoForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const productoData = {
            id: document.getElementById('productoCodigo').value,
            nombre: document.getElementById('productoNombre').value,
            descripcion: document.getElementById('productoDescripcion').value,
            categoriaId: document.getElementById('productoCategoria').value,
            proveedorId: document.getElementById('productoProveedor').value || null,
            precioCompra: parseFloat(document.getElementById('productoPrecioCompra').value),
            precioVenta: parseFloat(document.getElementById('productoPrecioVenta').value),
            stock: parseInt(document.getElementById('productoStock').value) || 0
        };
        
        try {
            let response;
            const isEditing = document.getElementById('productoId').value !== '';
            
            if (isEditing) {
                // Actualizar producto existente
                response = await fetch(`http://localhost:3000/api/productos/${productoData.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(productoData)
                });
            } else {
                // Crear nuevo producto
                response = await fetch('http://localhost:3000/api/productos', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(productoData)
                });
            }
            
            if (response.ok) {
                mostrarAlerta(`Producto ${isEditing ? 'actualizado' : 'creado'} correctamente`, 'success');
                document.getElementById('productoModal').style.display = 'none';
                await cargarDatos(); // Recargar datos
            } else {
                const error = await response.json();
                mostrarAlerta(`Error: ${error.message}`, 'error');
            }
        } catch (error) {
            console.error('Error al guardar producto:', error);
            mostrarAlerta('Error al conectar con el servidor', 'error');
        }
    });
    
    // Formulario de armazones
    document.getElementById('armazonForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const armazonData = {
            id: document.getElementById('armazonId').value,
            nombre: document.getElementById('armazonNombre').value,
            marca: document.getElementById('armazonMarca').value,
            modelo: document.getElementById('armazonModelo').value,
            color: document.getElementById('armazonColor').value,
            material: document.getElementById('armazonMaterial').value,
            proveedorId: document.getElementById('armazonProveedor').value || null,
            precioCompra: parseFloat(document.getElementById('armazonPrecioCompra').value),
            precioVenta: parseFloat(document.getElementById('armazonPrecioVenta').value),
            stock: parseInt(document.getElementById('armazonStock').value) || 0
        };
        
        try {
            let response;
            const isEditing = document.getElementById('armazonIdHidden').value !== '';
            
            if (isEditing) {
                // Actualizar armazón existente
                response = await fetch(`http://localhost:3000/api/armazones/${armazonData.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(armazonData)
                });
            } else {
                // Crear nuevo armazón
                response = await fetch('http://localhost:3000/api/armazones', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(armazonData)
                });
            }
            
            if (response.ok) {
                mostrarAlerta(`Armazón ${isEditing ? 'actualizado' : 'creado'} correctamente`, 'success');
                document.getElementById('armazonModal').style.display = 'none';
                await cargarDatos(); // Recargar datos
            } else {
                const error = await response.json();
                mostrarAlerta(`Error: ${error.message}`, 'error');
            }
        } catch (error) {
            console.error('Error al guardar armazón:', error);
            mostrarAlerta('Error al conectar con el servidor', 'error');
        }
    });
}

// Configurar eventos para los botones de editar y eliminar
function configurarBotonesAcciones() {
    // Botones para productos
    document.getElementById('productosTableBody').addEventListener('click', async function(e) {
        // Botón editar producto
        if (e.target.closest('.btn-edit-producto')) {
            const id = e.target.closest('.btn-edit-producto').getAttribute('data-id');
            await cargarProductoParaEditar(id);
        }
        
        // Botón eliminar producto
        if (e.target.closest('.btn-delete-producto')) {
            const id = e.target.closest('.btn-delete-producto').getAttribute('data-id');
            await eliminarProducto(id);
        }
    });
    
    // Botones para armazones
    document.getElementById('armazonesTableBody').addEventListener('click', async function(e) {
        // Botón editar armazón
        if (e.target.closest('.btn-edit-armazon')) {
            const id = e.target.closest('.btn-edit-armazon').getAttribute('data-id');
            await cargarArmazonParaEditar(id);
        }
        
        // Botón eliminar armazón
        if (e.target.closest('.btn-delete-armazon')) {
            const id = e.target.closest('.btn-delete-armazon').getAttribute('data-id');
            await eliminarArmazon(id);
        }
    });
    
    // Botón agregar producto
    document.getElementById('addProductBtn').addEventListener('click', function() {
        document.getElementById('productoModalTitle').textContent = 'Agregar Producto';
        document.getElementById('productoForm').reset();
        document.getElementById('productoId').value = '';
        document.getElementById('productoCodigo').readOnly = false;
        document.getElementById('productoModal').style.display = 'block';
    });
    
    // Botón agregar armazón
    document.getElementById('addArmazonBtn').addEventListener('click', function() {
        document.getElementById('armazonModalTitle').textContent = 'Agregar Armazón';
        document.getElementById('armazonForm').reset();
        document.getElementById('armazonIdHidden').value = '';
        document.getElementById('armazonId').readOnly = false;
        document.getElementById('armazonModal').style.display = 'block';
    });
}

// Función para cargar un producto para editar
async function cargarProductoParaEditar(id) {
    try {
        const response = await fetch(`http://localhost:3000/api/productos/${id}`);
        const producto = await response.json();
        
        document.getElementById('productoModalTitle').textContent = 'Editar Producto';
        document.getElementById('productoId').value = producto.id;
        document.getElementById('productoCodigo').value = producto.id;
        document.getElementById('productoCodigo').readOnly = true; // No permitir cambiar el ID
        document.getElementById('productoNombre').value = producto.nombre;
        document.getElementById('productoDescripcion').value = producto.descripcion || '';
        document.getElementById('productoCategoria').value = producto.categoria_id;
        document.getElementById('productoProveedor').value = producto.proveedor_id || '';
        document.getElementById('productoPrecioCompra').value = producto.precio_compra;
        document.getElementById('productoPrecioVenta').value = producto.precio_venta;
        document.getElementById('productoStock').value = producto.stock;
        
        document.getElementById('productoModal').style.display = 'block';
    } catch (error) {
        console.error('Error al cargar datos del producto:', error);
        mostrarAlerta('Error al cargar los datos del producto', 'error');
    }
}

// Función para eliminar un producto
async function eliminarProducto(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
        try {
            const response = await fetch(`http://localhost:3000/api/productos/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                mostrarAlerta('Producto eliminado correctamente', 'success');
                await cargarDatos(); // Recargar datos
            } else {
                const error = await response.json();
                mostrarAlerta(`Error: ${error.message}`, 'error');
            }
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            mostrarAlerta('Error al conectar con el servidor', 'error');
        }
    }
}

// Función para cargar un armazón para editar
async function cargarArmazonParaEditar(id) {
    try {
        const response = await fetch(`http://localhost:3000/api/armazones/${id}`);
        const armazon = await response.json();
        
        document.getElementById('armazonModalTitle').textContent = 'Editar Armazón';
        document.getElementById('armazonIdHidden').value = armazon.id;
        document.getElementById('armazonId').value = armazon.id;
        document.getElementById('armazonId').readOnly = true; // No permitir cambiar el ID
        document.getElementById('armazonNombre').value = armazon.nombre;
        document.getElementById('armazonMarca').value = armazon.marca || '';
        document.getElementById('armazonModelo').value = armazon.modelo || '';
        document.getElementById('armazonColor').value = armazon.color || '';
        document.getElementById('armazonMaterial').value = armazon.material || '';
        document.getElementById('armazonProveedor').value = armazon.proveedor_id || '';
        document.getElementById('armazonPrecioCompra').value = armazon.precio_compra;
        document.getElementById('armazonPrecioVenta').value = armazon.precio_venta;
        document.getElementById('armazonStock').value = armazon.stock;
        
        document.getElementById('armazonModal').style.display = 'block';
    } catch (error) {
        console.error('Error al cargar datos del armazón:', error);
        mostrarAlerta('Error al cargar los datos del armazón', 'error');
    }
}

// Función para eliminar un armazón
async function eliminarArmazon(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este armazón?')) {
        try {
            const response = await fetch(`http://localhost:3000/api/armazones/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                mostrarAlerta('Armazón eliminado correctamente', 'success');
                await cargarDatos(); // Recargar datos
            } else {
                const error = await response.json();
                mostrarAlerta(`Error: ${error.message}`, 'error');
            }
        } catch (error) {
            console.error('Error al eliminar armazón:', error);
            mostrarAlerta('Error al conectar con el servidor', 'error');
        }
    }
}

// Configurar eventos para las búsquedas
function configurarBusquedas() {
    // Búsqueda de productos
    document.getElementById('searchProductoBtn').addEventListener('click', function() {
        buscarProductos();
    });
    
    document.getElementById('searchProducto').addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            buscarProductos();
        }
    });
    
    // Búsqueda de armazones
    document.getElementById('searchArmazonBtn').addEventListener('click', function() {
        buscarArmazones();
    });
    
    document.getElementById('searchArmazon').addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            buscarArmazones();
        }
    });
}

// Función para buscar productos
async function buscarProductos() {
    const searchTerm = document.getElementById('searchProducto').value.trim();
    
    try {
        let url = 'http://localhost:3000/api/productos';
        if (searchTerm) {
            url += `?busqueda=${encodeURIComponent(searchTerm)}`;
        }
        
        const response = await fetch(url);
        const productos = await response.json();
        
        llenarTablaProductos(productos);
    } catch (error) {
        console.error('Error al buscar productos:', error);
        mostrarAlerta('Error al buscar productos', 'error');
    }
}

// Función para buscar armazones
async function buscarArmazones() {
    const searchTerm = document.getElementById('searchArmazon').value.trim();
    
    try {
        let url = 'http://localhost:3000/api/armazones';
        if (searchTerm) {
            url += `?busqueda=${encodeURIComponent(searchTerm)}`;
        }
        
        const response = await fetch(url);
        const armazones = await response.json();
        
        llenarTablaArmazones(armazones);
    } catch (error) {
        console.error('Error al buscar armazones:', error);
        mostrarAlerta('Error al buscar armazones', 'error');
    }
}

// Configurar eventos para las pestañas
function configurarTabs() {
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', function() {
            // Remover clase active de todos los botones
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
                btn.querySelector('span').classList.add('opacity-0');
            });
            
            // Agregar clase active al botón clickeado
            this.classList.add('active');
            this.querySelector('span').classList.remove('opacity-0');
            
            // Ocultar todos los contenidos de tabs
            document.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = 'none';
            });
            
            // Mostrar el contenido correspondiente
            const tabId = this.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).style.display = 'block';
        });
    });
}

// Configurar eventos para cerrar modales
function configurarModales() {
    // Cerrar modales con botón X o botón Cancelar
    document.querySelectorAll('.close, .close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
    
    // Cerrar modales al hacer clic fuera de ellos
    window.addEventListener('click', function(e) {
        document.querySelectorAll('.modal').forEach(modal => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

// Función para mostrar alertas
function mostrarAlerta(mensaje, tipo) {
    alert(mensaje);
}