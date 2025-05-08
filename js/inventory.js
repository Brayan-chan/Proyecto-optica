document.addEventListener('DOMContentLoaded', async function() {
    // Cargar datos de productos y armazones desde la API
    try {
        // Cargar productos
        const productosResponse = await fetch('http://localhost:3000/api/productos');
        const productos = await productosResponse.json();
        
        // Llenar la tabla de productos
        const productosTableBody = document.getElementById('productosTableBody');
        productosTableBody.innerHTML = ''; // Limpiar tabla
        
        productos.forEach(producto => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${producto.id}</td>
                <td>${producto.nombre}</td>
                <td>${producto.categoria_nombre}</td>
                <td>${producto.proveedor_nombre || 'N/A'}</td>
                <td>$${parseFloat(producto.precio_compra).toFixed(2)}</td>
                <td>$${parseFloat(producto.precio_venta).toFixed(2)}</td>
                <td>${producto.stock}</td>
                <td>
                    <button class="btn-edit-producto" data-id="${producto.id}">Editar</button>
                    <button class="btn-delete-producto" data-id="${producto.id}">Eliminar</button>
                </td>
            `;
            productosTableBody.appendChild(row);
        });
        
        // Cargar armazones
        const armazonesResponse = await fetch('http://localhost:3000/api/armazones');
        const armazones = await armazonesResponse.json();
        
        // Llenar la tabla de armazones
        const armazonesTableBody = document.getElementById('armazonesTableBody');
        armazonesTableBody.innerHTML = ''; // Limpiar tabla
        
        armazones.forEach(armazon => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${armazon.id}</td>
                <td>${armazon.nombre}</td>
                <td>${armazon.marca || 'N/A'}</td>
                <td>${armazon.modelo || 'N/A'}</td>
                <td>${armazon.color || 'N/A'}</td>
                <td>$${parseFloat(armazon.precio_compra).toFixed(2)}</td>
                <td>$${parseFloat(armazon.precio_venta).toFixed(2)}</td>
                <td>${armazon.stock}</td>
                <td>
                    <button class="btn-edit-armazon" data-id="${armazon.id}">Editar</button>
                    <button class="btn-delete-armazon" data-id="${armazon.id}">Eliminar</button>
                </td>
            `;
            armazonesTableBody.appendChild(row);
        });
        
        // Cargar categorías para el select de productos
        const categoriasResponse = await fetch('http://localhost:3000/api/categorias');
        const categorias = await categoriasResponse.json();
        
        const categoriaSelect = document.getElementById('productoCategoria');
        categoriaSelect.innerHTML = '<option value="">Seleccione una categoría</option>';
        
        categorias.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria.id;
            option.textContent = categoria.nombre;
            categoriaSelect.appendChild(option);
        });
        
        // Cargar proveedores para los selects
        const proveedoresResponse = await fetch('http://localhost:3000/api/proveedores');
        const proveedores = await proveedoresResponse.json();
        
        const proveedorProductoSelect = document.getElementById('productoProveedor');
        const proveedorArmazonSelect = document.getElementById('armazonProveedor');
        
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
        
    } catch (error) {
        console.error('Error al cargar datos:', error);
        alert('Error al cargar los datos de inventario');
    }
    
    // Manejar cambio de tabs
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', function() {
            // Remover clase active de todos los botones
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Agregar clase active al botón clickeado
            this.classList.add('active');
            
            // Ocultar todos los contenidos de tabs
            document.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = 'none';
            });
            
            // Mostrar el contenido correspondiente
            const tabId = this.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).style.display = 'block';
        });
    });
    
    // Mostrar modal para agregar producto
    document.getElementById('addProductBtn').addEventListener('click', function() {
        document.getElementById('productoModalTitle').textContent = 'Agregar Producto';
        document.getElementById('productoForm').reset();
        document.getElementById('productoId').value = '';
        document.getElementById('productoModal').style.display = 'block';
    });
    
    // Mostrar modal para agregar armazón
    document.getElementById('addArmazonBtn').addEventListener('click', function() {
        document.getElementById('armazonModalTitle').textContent = 'Agregar Armazón';
        document.getElementById('armazonForm').reset();
        document.getElementById('armazonIdHidden').value = '';
        document.getElementById('armazonModal').style.display = 'block';
    });
    
    // Manejar envío del formulario de producto
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
                alert('Producto guardado correctamente');
                document.getElementById('productoModal').style.display = 'none';
                // Recargar la página para mostrar los cambios
                location.reload();
            } else {
                const error = await response.json();
                alert(`Error: ${error.message}`);
            }
        } catch (error) {
            console.error('Error al guardar producto:', error);
            alert('Error al conectar con el servidor');
        }
    });
    
    // Manejar envío del formulario de armazón
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
                alert('Armazón guardado correctamente');
                document.getElementById('armazonModal').style.display = 'none';
                // Recargar la página para mostrar los cambios
                location.reload();
            } else {
                const error = await response.json();
                alert(`Error: ${error.message}`);
            }
        } catch (error) {
            console.error('Error al guardar armazón:', error);
            alert('Error al conectar con el servidor');
        }
    });
    
    // Manejar clics en botones de editar y eliminar productos
    document.getElementById('productosTableBody').addEventListener('click', async function(e) {
        if (e.target.classList.contains('btn-edit-producto')) {
            const id = e.target.getAttribute('data-id');
            
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
                alert('Error al cargar los datos del producto');
            }
        }
        
        if (e.target.classList.contains('btn-delete-producto')) {
            if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
                const id = e.target.getAttribute('data-id');
                
                try {
                    const response = await fetch(`http://localhost:3000/api/productos/${id}`, {
                        method: 'DELETE'
                    });
                    
                    if (response.ok) {
                        alert('Producto eliminado');
                        // Recargar la página para mostrar los cambios
                        location.reload();
                    } else {
                        const error = await response.json();
                        alert(`Error: ${error.message}`);
                    }
                } catch (error) {
                    console.error('Error al eliminar producto:', error);
                    alert('Error al conectar con el servidor');
                }
            }
        }
    });
    
    // Manejar clics en botones de editar y eliminar armazones
    document.getElementById('armazonesTableBody').addEventListener('click', async function(e) {
        if (e.target.classList.contains('btn-edit-armazon')) {
            const id = e.target.getAttribute('data-id');
            
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
                alert('Error al cargar los datos del armazón');
            }
        }
        
        if (e.target.classList.contains('btn-delete-armazon')) {
            if (confirm('¿Estás seguro de que deseas eliminar este armazón?')) {
                const id = e.target.getAttribute('data-id');
                
                try {
                    const response = await fetch(`http://localhost:3000/api/armazones/${id}`, {
                        method: 'DELETE'
                    });
                    
                    if (response.ok) {
                        alert('Armazón eliminado');
                        // Recargar la página para mostrar los cambios
                        location.reload();
                    } else {
                        const error = await response.json();
                        alert(`Error: ${error.message}`);
                    }
                } catch (error) {
                    console.error('Error al eliminar armazón:', error);
                    alert('Error al conectar con el servidor');
                }
            }
        }
    });
    
    // Búsqueda de productos
    document.getElementById('searchProductoBtn').addEventListener('click', function() {
        const searchTerm = document.getElementById('searchProducto').value.toLowerCase();
        
        document.querySelectorAll('#productosTableBody tr').forEach(row => {
            const codigo = row.cells[0].textContent.toLowerCase();
            const nombre = row.cells[1].textContent.toLowerCase();
            const categoria = row.cells[2].textContent.toLowerCase();
            
            if (codigo.includes(searchTerm) || nombre.includes(searchTerm) || categoria.includes(searchTerm) || searchTerm === '') {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
    
    // Búsqueda de armazones
    document.getElementById('searchArmazonBtn').addEventListener('click', function() {
        const searchTerm = document.getElementById('searchArmazon').value.toLowerCase();
        
        document.querySelectorAll('#armazonesTableBody tr').forEach(row => {
            const codigo = row.cells[0].textContent.toLowerCase();
            const nombre = row.cells[1].textContent.toLowerCase();
            const marca = row.cells[2].textContent.toLowerCase();
            const modelo = row.cells[3].textContent.toLowerCase();
            
            if (codigo.includes(searchTerm) || nombre.includes(searchTerm) || marca.includes(searchTerm) || modelo.includes(searchTerm) || searchTerm === '') {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
    
    // Cerrar modales al hacer clic en la X
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
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
});