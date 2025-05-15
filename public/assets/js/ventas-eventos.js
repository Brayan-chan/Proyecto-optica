// Manejar eventos específicos de la página de ventas
document.addEventListener('DOMContentLoaded', function() {
    // Establecer fecha actual en el campo de fecha de venta
    const hoy = new Date().toISOString().split('T')[0];
    if (document.getElementById('fechaVenta')) {
        document.getElementById('fechaVenta').value = hoy;
    }
    
    // Manejar cambio en tipo de producto
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('tipoProducto')) {
            const productoItem = e.target.closest('.producto-item');
            const productoSelect = productoItem.querySelector('.producto-select');
            const armazonSelect = productoItem.querySelector('.armazon-select');
            
            // Ocultar ambos selects
            productoSelect.style.display = 'none';
            armazonSelect.style.display = 'none';
            
            // Mostrar el select correspondiente
            if (e.target.value === 'Producto') {
                productoSelect.style.display = 'block';
            } else if (e.target.value === 'Armazon') {
                armazonSelect.style.display = 'block';
            }
            
            // Resetear precio y subtotal
            const precioInput = productoItem.querySelector('.precioUnitario');
            const subtotalInput = productoItem.querySelector('.subtotal');
            precioInput.value = '';
            subtotalInput.value = '';
            
            // Actualizar total
            actualizarTotalVenta();
        }
        
        // Actualizar precio al seleccionar producto o armazón
        if (e.target.classList.contains('productoSelect') || e.target.classList.contains('armazonSelect')) {
            const productoItem = e.target.closest('.producto-item');
            const selectedOption = e.target.options[e.target.selectedIndex];
            
            if (selectedOption.value) {
                const precioInput = productoItem.querySelector('.precioUnitario');
                precioInput.value = selectedOption.dataset.precio;
                
                // Actualizar subtotal
                const cantidadInput = productoItem.querySelector('.cantidad');
                const subtotalInput = productoItem.querySelector('.subtotal');
                const cantidad = parseInt(cantidadInput.value) || 0;
                const precio = parseFloat(precioInput.value) || 0;
                subtotalInput.value = (cantidad * precio).toFixed(2);
                
                // Actualizar total
                actualizarTotalVenta();
            }
        }
        
        // Actualizar subtotal al cambiar cantidad o precio
        if (e.target.classList.contains('cantidad') || e.target.classList.contains('precioUnitario')) {
            const productoItem = e.target.closest('.producto-item');
            const cantidadInput = productoItem.querySelector('.cantidad');
            const precioInput = productoItem.querySelector('.precioUnitario');
            const subtotalInput = productoItem.querySelector('.subtotal');
            
            const cantidad = parseInt(cantidadInput.value) || 0;
            const precio = parseFloat(precioInput.value) || 0;
            subtotalInput.value = (cantidad * precio).toFixed(2);
            
            // Actualizar total
            actualizarTotalVenta();
        }
    });
    
    // Agregar producto a la venta
    if (document.getElementById('addProductoBtn')) {
        document.getElementById('addProductoBtn').addEventListener('click', function() {
            const productosContainer = document.getElementById('productosContainer');
            const productoItems = productosContainer.querySelectorAll('.producto-item');
            const nuevoIndex = productoItems.length + 1;
            
            // Crear nuevo elemento
            const nuevoProducto = document.createElement('div');
            nuevoProducto.innerHTML = crearProductoTemplate(nuevoIndex);
            
            productosContainer.appendChild(nuevoProducto.firstElementChild);
            
            // Actualizar los selects del nuevo producto
            actualizarSelectsProductos();
        });
    }
    
    // Eliminar producto de la venta
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn-remove-producto')) {
            if (document.querySelectorAll('.producto-item').length > 1) {
                const productoItem = e.target.closest('.producto-item');
                productoItem.remove();
                
                // Renumerar los productos
                document.querySelectorAll('.producto-item h4').forEach((header, index) => {
                    header.textContent = `Producto ${index + 1}`;
                });
                
                // Actualizar total
                actualizarTotalVenta();
            } else {
                alert('Debe haber al menos un producto en la venta');
            }
        }
    });
    
    // Imprimir venta
    document.addEventListener('click', function(e) {
        if (e.target.id === 'printSaleBtn') {
            window.print();
        }
    });
});

// Función para crear el template de un producto
function crearProductoTemplate(index) {
    return `
        <div class="producto-item">
            <div class="flex justify-between items-center mb-3">
                <h4 class="font-medium text-lg">Producto ${index}</h4>
                <button type="button" class="btn-remove-producto text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div class="form-group">
                    <label for="tipoProducto${index}" class="block mb-1 font-medium">Tipo de producto</label>
                    <select id="tipoProducto${index}" class="tipoProducto w-full p-2 border border-mediumGray rounded-md text-base focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600" required>
                        <option value="">Seleccione tipo</option>
                        <option value="Producto">Producto</option>
                        <option value="Armazon">Armazón</option>
                    </select>
                </div>
                <div class="form-group producto-select" style="display: none;">
                    <label class="block mb-1 font-medium">Producto</label>
                    <select class="productoSelect w-full p-2 border border-mediumGray rounded-md text-base focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600">
                        <option value="">Seleccione un producto</option>
                    </select>
                </div>
                <div class="form-group armazon-select" style="display: none;">
                    <label class="block mb-1 font-medium">Armazón</label>
                    <select class="armazonSelect w-full p-2 border border-mediumGray rounded-md text-base focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600">
                        <option value="">Seleccione un armazón</option>
                    </select>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="form-group">
                    <label class="block mb-1 font-medium">Cantidad</label>
                    <input type="number" class="cantidad w-full p-2 border border-mediumGray rounded-md text-base focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600" min="1" value="1" required>
                </div>
                <div class="form-group">
                    <label class="block mb-1 font-medium">Precio unitario</label>
                    <input type="number" step="0.01" class="precioUnitario w-full p-2 border border-mediumGray rounded-md text-base focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600" required>
                </div>
                <div class="form-group">
                    <label class="block mb-1 font-medium">Subtotal</label>
                    <input type="number" step="0.01" class="subtotal w-full p-2 border border-mediumGray rounded-md text-base font-semibold bg-lightGray dark:bg-gray-900" readonly>
                </div>
            </div>
        </div>
    `;
}

// Función para actualizar el total de la venta
function actualizarTotalVenta() {
    let total = 0;
    document.querySelectorAll('.subtotal').forEach(input => {
        total += parseFloat(input.value) || 0;
    });
    if (document.getElementById('total')) {
        document.getElementById('total').value = total.toFixed(2);
    }
}

// Función para actualizar los selects de productos y armazones
function actualizarSelectsProductos() {
    if (!window.productosData || !window.armazonesData) return;
    
    document.querySelectorAll('.productoSelect').forEach(select => {
        select.innerHTML = '<option value="">Seleccione un producto</option>';
        window.productosData.forEach(producto => {
            const option = document.createElement('option');
            option.value = producto.id;
            option.textContent = `${producto.nombre} - $${producto.precio_venta}`;
            option.dataset.precio = producto.precio_venta;
            option.dataset.stock = producto.stock;
            select.appendChild(option);
        });
    });
    
    document.querySelectorAll('.armazonSelect').forEach(select => {
        select.innerHTML = '<option value="">Seleccione un armazón</option>';
        window.armazonesData.forEach(armazon => {
            const option = document.createElement('option');
            option.value = armazon.id;
            option.textContent = `${armazon.nombre} (${armazon.marca || 'Sin marca'}) - $${armazon.precio_venta}`;
            option.dataset.precio = armazon.precio_venta;
            option.dataset.stock = armazon.stock;
            select.appendChild(option);
        });
    });
}