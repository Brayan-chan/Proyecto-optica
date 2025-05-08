document.addEventListener('DOMContentLoaded', async function() {
    // Cargar ventas desde la API
    try {
        const response = await fetch('http://localhost:3000/api/ventas');
        const ventasData = await response.json();
        
        // Llenar la tabla de ventas
        const tableBody = document.getElementById('ventasTableBody');
        tableBody.innerHTML = ''; // Limpiar tabla
        
        ventasData.forEach(venta => {
            const row = document.createElement('tr');
            
            // Verificar si el cliente tiene convenio
            const tieneConvenio = venta.cliente_id ? 
                `<span class="badge ${venta.convenio ? 'badge-success' : 'badge-secondary'}">${venta.convenio ? 'Sí' : 'No'}</span>` : 
                '<span class="badge badge-secondary">N/A</span>';
            
            row.innerHTML = `
                <td>${venta.id}</td>
                <td>${venta.fecha}</td>
                <td>${venta.cliente_nombre || 'Cliente no registrado'}</td>
                <td>$${parseFloat(venta.total).toFixed(2)}</td>
                <td>$${parseFloat(venta.abono).toFixed(2)}</td>
                <td>$${parseFloat(venta.saldo).toFixed(2)}</td>
                <td><span class="status-${venta.estado.toLowerCase()}">${venta.estado}</span></td>
                <td>${tieneConvenio}</td>
                <td>
                    <button class="btn-view" data-id="${venta.id}">Ver</button>
                    ${venta.estado !== 'Cancelada' && venta.estado !== 'Pagada' ? 
                      `<button class="btn-pay" data-id="${venta.id}">Pago</button>` : ''}
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        // Agregar estilos para los estados y badges
        const style = document.createElement('style');
        style.textContent = `
            .status-pendiente { color: #e67e22; font-weight: bold; }
            .status-parcial { color: #3498db; font-weight: bold; }
            .status-pagada { color: #2ecc71; font-weight: bold; }
            .status-cancelada { color: #e74c3c; font-weight: bold; }
            
            .badge {
                display: inline-block;
                padding: 3px 7px;
                border-radius: 10px;
                font-size: 12px;
                font-weight: bold;
                text-align: center;
            }
            .badge-success { background-color: #2ecc71; color: white; }
            .badge-secondary { background-color: #95a5a6; color: white; }
        `;
        document.head.appendChild(style);
        
    } catch (error) {
        console.error('Error al cargar ventas:', error);
        alert('Error al cargar los datos de ventas');
    }
    
    // Cargar clientes para el select
    let clientesData = [];
    try {
        const clientesResponse = await fetch('http://localhost:3000/api/clientes');
        clientesData = await clientesResponse.json();
        
        const clienteSelect = document.getElementById('clienteId');
        clienteSelect.innerHTML = '<option value="">Seleccione un cliente</option>';
        
        clientesData.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.id;
            option.textContent = cliente.nombre;
            option.dataset.convenio = cliente.convenio ? 'true' : 'false';
            option.dataset.empresaId = cliente.empresa_id || '';
            option.dataset.empresaNombre = cliente.empresa_nombre || '';
            clienteSelect.appendChild(option);
        });
        
        // Manejar cambio en el select de cliente para mostrar info de convenio
        clienteSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            const esConvenio = selectedOption.dataset.convenio === 'true';
            const empresaNombre = selectedOption.dataset.empresaNombre;
            
            document.getElementById('esConvenio').checked = esConvenio;
            
            if (esConvenio && empresaNombre) {
                document.getElementById('empresaConvenio').textContent = empresaNombre;
                document.getElementById('infoConvenio').style.display = 'block';
            } else {
                document.getElementById('infoConvenio').style.display = 'none';
            }
        });
    } catch (error) {
        console.error('Error al cargar clientes:', error);
    }
    
    // Cargar productos y armazones para los selects
    let productosData = [];
    let armazonesData = [];
    try {
        // Productos
        const productosResponse = await fetch('http://localhost:3000/api/productos');
        productosData = await productosResponse.json();
        
        // Armazones
        const armazonesResponse = await fetch('http://localhost:3000/api/armazones');
        armazonesData = await armazonesResponse.json();
        
        // Llenar los selects iniciales
        actualizarSelectsProductos();
        
    } catch (error) {
        console.error('Error al cargar productos y armazones:', error);
    }
    
    // Función para actualizar los selects de productos y armazones
    function actualizarSelectsProductos() {
        document.querySelectorAll('.productoSelect').forEach(select => {
            select.innerHTML = '<option value="">Seleccione un producto</option>';
            productosData.forEach(producto => {
                const option = document.createElement('option');
                option.value = producto.id;
                option.textContent = `${producto.nombre} - $${producto.precio_venta}`;
                option.dataset.precio = producto.precio_venta;
                select.appendChild(option);
            });
        });
        
        document.querySelectorAll('.armazonSelect').forEach(select => {
            select.innerHTML = '<option value="">Seleccione un armazón</option>';
            armazonesData.forEach(armazon => {
                const option = document.createElement('option');
                option.value = armazon.id;
                option.textContent = `${armazon.nombre} (${armazon.marca}) - $${armazon.precio_venta}`;
                option.dataset.precio = armazon.precio_venta;
                select.appendChild(option);
            });
        });
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
    
    // Función para actualizar el total de la venta
    function actualizarTotalVenta() {
        let total = 0;
        document.querySelectorAll('.subtotal').forEach(input => {
            total += parseFloat(input.value) || 0;
        });
        document.getElementById('total').value = total.toFixed(2);
    }
    
    // Agregar otro producto
    document.getElementById('addProductoBtn').addEventListener('click', function() {
        const productosContainer = document.getElementById('productosContainer');
        const productoItems = productosContainer.querySelectorAll('.producto-item');
        const nuevoIndex = productoItems.length + 1;
        
        const nuevoProducto = document.createElement('div');
        nuevoProducto.className = 'producto-item';
        nuevoProducto.innerHTML = `
            <h4>Producto ${nuevoIndex} <button type="button" class="btn-remove-producto">×</button></h4>
            <div class="form-row">
                <div class="form-group">
                    <label for="tipoProducto${nuevoIndex}">Tipo de producto</label>
                    <select id="tipoProducto${nuevoIndex}" class="tipoProducto" required>
                        <option value="">Seleccione tipo</option>
                        <option value="Producto">Producto</option>
                        <option value="Armazon">Armazón</option>
                    </select>
                </div>
                <div class="form-group producto-select" style="display: none;">
                    <label>Producto</label>
                    <select class="productoSelect">
                        <option value="">Seleccione un producto</option>
                    </select>
                </div>
                <div class="form-group armazon-select" style="display: none;">
                    <label>Armazón</label>
                    <select class="armazonSelect">
                        <option value="">Seleccione un armazón</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Cantidad</label>
                    <input type="number" class="cantidad" min="1" value="1" required>
                </div>
                <div class="form-group">
                    <label>Precio unitario</label>
                    <input type="number" step="0.01" class="precioUnitario" required>
                </div>
                <div class="form-group">
                    <label>Subtotal</label>
                    <input type="number" step="0.01" class="subtotal" readonly>
                </div>
            </div>
        `;
        
        productosContainer.appendChild(nuevoProducto);
        
        // Actualizar los selects del nuevo producto
        actualizarSelectsProductos();
    });
    
    // Eliminar producto
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-remove-producto')) {
            if (document.querySelectorAll('.producto-item').length > 1) {
                const productoItem = e.target.closest('.producto-item');
                productoItem.remove();
                
                // Renumerar los productos
                document.querySelectorAll('.producto-item h4').forEach((header, index) => {
                    header.innerHTML = `Producto ${index + 1} ${index > 0 ? '<button type="button" class="btn-remove-producto">×</button>' : ''}`;
                });
                
                // Actualizar total
                actualizarTotalVenta();
            } else {
                alert('Debe haber al menos un producto en la venta');
            }
        }
    });
    
    // Mostrar modal para nueva venta
    document.getElementById('addSaleBtn').addEventListener('click', function() {
        document.getElementById('modalTitle').textContent = 'Registrar Nueva Venta';
        document.getElementById('saleForm').reset();
        document.getElementById('saleId').value = '';
        document.getElementById('infoConvenio').style.display = 'none';
        
        // Establecer fecha actual
        const hoy = new Date().toISOString().split('T')[0];
        document.getElementById('fechaVenta').value = hoy;
        
        // Resetear productos
        const productosContainer = document.getElementById('productosContainer');
        productosContainer.innerHTML = `
            <div class="producto-item">
                <h4>Producto 1</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="tipoProducto1">Tipo de producto</label>
                        <select id="tipoProducto1" class="tipoProducto" required>
                            <option value="">Seleccione tipo</option>
                            <option value="Producto">Producto</option>
                            <option value="Armazon">Armazón</option>
                        </select>
                    </div>
                    <div class="form-group producto-select" style="display: none;">
                        <label>Producto</label>
                        <select class="productoSelect">
                            <option value="">Seleccione un producto</option>
                        </select>
                    </div>
                    <div class="form-group armazon-select" style="display: none;">
                        <label>Armazón</label>
                        <select class="armazonSelect">
                            <option value="">Seleccione un armazón</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Cantidad</label>
                        <input type="number" class="cantidad" min="1" value="1" required>
                    </div>
                    <div class="form-group">
                        <label>Precio unitario</label>
                        <input type="number" step="0.01" class="precioUnitario" required>
                    </div>
                    <div class="form-group">
                        <label>Subtotal</label>
                        <input type="number" step="0.01" class="subtotal" readonly>
                    </div>
                </div>
            </div>
        `;
        
        // Actualizar los selects
        actualizarSelectsProductos();
        
        document.getElementById('saleModal').style.display = 'block';
    });
    
    // Manejar envío del formulario de venta
    document.getElementById('saleForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Recopilar datos de productos
        const detalles = [];
        const productosItems = document.querySelectorAll('.producto-item');
        
        for (const item of productosItems) {
            const tipoProducto = item.querySelector('.tipoProducto').value;
            let productoId = null;
            let armazonId = null;
            
            if (tipoProducto === 'Producto') {
                productoId = item.querySelector('.productoSelect').value;
                if (!productoId) {
                    alert('Por favor seleccione un producto');
                    return;
                }
            } else if (tipoProducto === 'Armazon') {
                armazonId = item.querySelector('.armazonSelect').value;
                if (!armazonId) {
                    alert('Por favor seleccione un armazón');
                    return;
                }
            } else {
                alert('Por favor seleccione un tipo de producto');
                return;
            }
            
            const cantidad = parseInt(item.querySelector('.cantidad').value);
            const precioUnitario = parseFloat(item.querySelector('.precioUnitario').value);
            const subtotal = parseFloat(item.querySelector('.subtotal').value);
            
            detalles.push({
                tipoProducto,
                productoId,
                armazonId,
                cantidad,
                precioUnitario,
                subtotal
            });
        }
        
        // Verificar si el cliente tiene convenio
        const clienteId = document.getElementById('clienteId').value;
        let convenio = false;
        let empresaId = null;
        
        if (clienteId) {
            const clienteOption = document.querySelector(`#clienteId option[value="${clienteId}"]`);
            convenio = clienteOption.dataset.convenio === 'true';
            empresaId = clienteOption.dataset.empresaId || null;
        }
        
        const ventaData = {
            clienteId,
            fecha: document.getElementById('fechaVenta').value,
            total: parseFloat(document.getElementById('total').value),
            abono: parseFloat(document.getElementById('abono').value) || 0,
            observaciones: document.getElementById('observaciones').value,
            detalles,
            convenio,
            empresaId
        };
        
        try {
            const response = await fetch('http://localhost:3000/api/ventas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(ventaData)
            });
            
            if (response.ok) {
                alert('Venta registrada correctamente');
                document.getElementById('saleModal').style.display = 'none';
                // Recargar la página para mostrar los cambios
                location.reload();
            } else {
                const error = await response.json();
                alert(`Error: ${error.message}`);
            }
        } catch (error) {
            console.error('Error al registrar venta:', error);
            alert('Error al conectar con el servidor');
        }
    });
    
    // Manejar clics en botones de la tabla
    document.getElementById('ventasTableBody').addEventListener('click', async function(e) {
        if (!e.target.classList.contains('btn-view') && !e.target.classList.contains('btn-pay')) {
            return;
        }
        
        const id = e.target.getAttribute('data-id');
        
        if (e.target.classList.contains('btn-view')) {
            try {
                const response = await fetch(`http://localhost:3000/api/ventas/${id}`);
                const venta = await response.json();
                
                // Crear modal para ver detalles de venta
                const modalHTML = `
                    <div id="viewSaleModal" class="modal">
                        <div class="modal-content" style="max-width: 800px;">
                            <span class="close">&times;</span>
                            <h3>Detalles de Venta #${venta.id}</h3>
                            <div class="sale-details">
                                <div class="sale-info">
                                    <p><strong>Cliente:</strong> ${venta.cliente_nombre || 'Cliente no registrado'}</p>
                                    <p><strong>Fecha:</strong> ${venta.fecha}</p>
                                    <p><strong>Estado:</strong> <span class="status-${venta.estado.toLowerCase()}">${venta.estado}</span></p>
                                    <p><strong>Total:</strong> $${parseFloat(venta.total).toFixed(2)}</p>
                                    <p><strong>Abono:</strong> $${parseFloat(venta.abono).toFixed(2)}</p>
                                    <p><strong>Saldo:</strong> $${parseFloat(venta.saldo).toFixed(2)}</p>
                                    ${venta.convenio ? `<p><strong>Convenio:</strong> Sí (${venta.empresa_nombre || 'Sin empresa'})</p>` : ''}
                                    ${venta.observaciones ? `<p><strong>Observaciones:</strong> ${venta.observaciones}</p>` : ''}
                                </div>
                                <div class="sale-items">
                                    <h4>Productos</h4>
                                    <table class="data-table">
                                        <thead>
                                            <tr>
                                                <th>Tipo</th>
                                                <th>Producto</th>
                                                <th>Cantidad</th>
                                                <th>Precio</th>
                                                <th>Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${venta.detalles.map(detalle => `
                                                <tr>
                                                    <td>${detalle.tipo_producto}</td>
                                                    <td>${detalle.producto_nombre || 'N/A'}</td>
                                                    <td>${detalle.cantidad}</td>
                                                    <td>$${parseFloat(detalle.precio_unitario).toFixed(2)}</td>
                                                    <td>$${parseFloat(detalle.subtotal).toFixed(2)}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                                ${venta.pagos && venta.pagos.length > 0 ? `
                                    <div class="sale-payments">
                                        <h4>Pagos</h4>
                                        <table class="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Fecha</th>
                                                    <th>Monto</th>
                                                    <th>Método</th>
                                                    <th>Referencia</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${venta.pagos.map(pago => `
                                                    <tr>
                                                        <td>${pago.fecha}</td>
                                                        <td>$${parseFloat(pago.monto).toFixed(2)}</td>
                                                        <td>${pago.metodo_pago}</td>
                                                        <td>${pago.referencia || 'N/A'}</td>
                                                    </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                    </div>
                                ` : ''}
                                <div class="sale-actions">
                                    <button class="btn-primary" id="printSaleBtn">Imprimir</button>
                                    <button class="btn-secondary" id="closeSaleBtn">Cerrar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                // Agregar modal al DOM
                const modalContainer = document.createElement('div');
                modalContainer.innerHTML = modalHTML;
                document.body.appendChild(modalContainer);
                
                // Mostrar modal
                document.getElementById('viewSaleModal').style.display = 'block';
                
                // Manejar cierre de modal
                document.querySelector('#viewSaleModal .close').addEventListener('click', function() {
                    document.getElementById('viewSaleModal').remove();
                });
                
                document.getElementById('closeSaleBtn').addEventListener('click', function() {
                    document.getElementById('viewSaleModal').remove();
                });
                
                // Manejar impresión
                document.getElementById('printSaleBtn').addEventListener('click', function() {
                    window.print();
                });
                
            } catch (error) {
                console.error('Error al cargar detalles de venta:', error);
                alert('Error al cargar los detalles de la venta');
            }
        }
        
        if (e.target.classList.contains('btn-pay')) {
            try {
                const response = await fetch(`http://localhost:3000/api/ventas/${id}`);
                const venta = await response.json();
                
                // Crear modal para registrar pago
                const modalHTML = `
                    <div id="paymentModal" class="modal">
                        <div class="modal-content">
                            <span class="close">&times;</span>
                            <h3>Registrar Pago</h3>
                            <form id="paymentForm">
                                <input type="hidden" id="ventaId" value="${venta.id}">
                                <div class="form-group">
                                    <label for="saldoActual">Saldo pendiente</label>
                                    <input type="number" id="saldoActual" value="${venta.saldo}" readonly>
                                </div>
                                <div class="form-group">
                                    <label for="montoPago">Monto a pagar</label>
                                    <input type="number" step="0.01" id="montoPago" required max="${venta.saldo}">
                                </div>
                                <div class="form-group">
                                    <label for="metodoPago">Método de pago</label>
                                    <select id="metodoPago" required>
                                        <option value="Efectivo">Efectivo</option>
                                        <option value="Tarjeta">Tarjeta</option>
                                        <option value="Transferencia">Transferencia</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="referenciaPago">Referencia (opcional)</label>
                                    <input type="text" id="referenciaPago">
                                </div>
                                <button type="submit" class="btn-primary">Registrar pago</button>
                            </form>
                        </div>
                    </div>
                `;
                
                // Agregar modal al DOM
                const modalContainer = document.createElement('div');
                modalContainer.innerHTML = modalHTML;
                document.body.appendChild(modalContainer);
                
                // Mostrar modal
                document.getElementById('paymentModal').style.display = 'block';
                
                // Manejar cierre de modal
                document.querySelector('#paymentModal .close').addEventListener('click', function() {
                    document.getElementById('paymentModal').remove();
                });
                
                // Manejar envío del formulario de pago
                document.getElementById('paymentForm').addEventListener('submit', async function(e) {
                    e.preventDefault();
                    
                    const pagoData = {
                        monto: parseFloat(document.getElementById('montoPago').value),
                        metodoPago: document.getElementById('metodoPago').value,
                        referencia: document.getElementById('referenciaPago').value
                    };
                    
                    try {
                        const response = await fetch(`http://localhost:3000/api/ventas/${id}/pagos`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(pagoData)
                        });
                        
                        if (response.ok) {
                            alert('Pago registrado correctamente');
                            document.getElementById('paymentModal').remove();
                            // Recargar la página para mostrar los cambios
                            location.reload();
                        } else {
                            const error = await response.json();
                            alert(`Error: ${error.message}`);
                        }
                    } catch (error) {
                        console.error('Error al registrar pago:', error);
                        alert('Error al conectar con el servidor');
                    }
                });
                
            } catch (error) {
                console.error('Error al cargar datos de venta:', error);
                alert('Error al cargar los datos de la venta');
            }
        }
    });
    
    // Búsqueda de ventas
    document.getElementById('searchVentaBtn').addEventListener('click', function() {
        const searchTerm = document.getElementById('searchVenta').value.toLowerCase();
        
        document.querySelectorAll('#ventasTableBody tr').forEach(row => {
            const clienteNombre = row.cells[2].textContent.toLowerCase();
            
            if (clienteNombre.includes(searchTerm) || searchTerm === '') {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
});