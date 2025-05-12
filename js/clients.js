document.addEventListener('DOMContentLoaded', async function() {
    // Cargar datos iniciales
    await cargarDatos();
    
    // Configurar eventos para los formularios
    configurarFormularios();
    
    // Configurar eventos para los botones de acciones
    configurarBotonesAcciones();
    
    // Configurar eventos para las búsquedas
    configurarBusquedas();
    
    // Configurar eventos para cerrar modales
    configurarModales();
});

// Función para cargar todos los datos necesarios
async function cargarDatos() {
    try {
        // Cargar clientes
        const clientesResponse = await fetch('http://localhost:3000/api/clientes');
        const clientes = await clientesResponse.json();
        llenarTablaClientes(clientes);
        
        // Cargar empresas para el select de convenios
        const empresasResponse = await fetch('http://localhost:3000/api/empresas');
        const empresas = await empresasResponse.json();
        llenarSelectEmpresas(empresas);
        
    } catch (error) {
        console.error('Error al cargar datos:', error);
        mostrarAlerta('Error al cargar los datos. Por favor, verifica la conexión con el servidor.', 'error');
    }
}

// Función para llenar la tabla de clientes
function llenarTablaClientes(clientes) {
    const clientsTableBody = document.getElementById('clientsTableBody');
    clientsTableBody.innerHTML = ''; // Limpiar tabla
    
    clientes.forEach(client => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-lightGray dark:hover:bg-gray-700 transition-colors';
        
        row.innerHTML = `
            <td class="py-3 px-4">${client.id}</td>
            <td class="py-3 px-4 font-medium">${client.nombre}</td>
            <td class="py-3 px-4">${client.telefono || '-'}</td>
            <td class="py-3 px-4">${client.email || '-'}</td>
            <td class="py-3 px-4">${client.ultima_visita || 'N/A'}</td>
            <td class="py-3 px-4">
                <div class="flex space-x-2">
                    <button class="btn-view btn-action bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded-md flex items-center" data-id="${client.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Ver
                    </button>
                    <button class="btn-edit btn-action bg-amber-500 hover:bg-amber-600 text-white py-1 px-2 rounded-md flex items-center" data-id="${client.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar
                    </button>
                    <button class="btn-delete btn-action bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded-md flex items-center" data-id="${client.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Eliminar
                    </button>
                </div>
            </td>
        `;
        clientsTableBody.appendChild(row);
    });
}

// Función para llenar el select de empresas
function llenarSelectEmpresas(empresas) {
    const empresaSelect = document.getElementById('clientEmpresa');
    empresaSelect.innerHTML = '<option value="">Sin convenio</option>';
    
    empresas.forEach(empresa => {
        const option = document.createElement('option');
        option.value = empresa.id;
        option.textContent = empresa.nombre;
        empresaSelect.appendChild(option);
    });
}

// Configurar eventos para los formularios
function configurarFormularios() {
    // Formulario de cliente
    document.getElementById('clientForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const clientId = document.getElementById('clientId').value;
        const clientData = {
            nombre: document.getElementById('clientName').value,
            telefono: document.getElementById('clientPhone').value,
            email: document.getElementById('clientEmail').value,
            direccion: document.getElementById('clientAddress').value,
            fechaNacimiento: document.getElementById('clientBirthdate').value,
            empresaId: document.getElementById('clientEmpresa').value || null,
            convenio: document.getElementById('clientConvenio').checked || false
        };
        
        try {
            let response;
            
            if (clientId) {
                // Actualizar cliente existente
                response = await fetch(`http://localhost:3000/api/clientes/${clientId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(clientData)
                });
            } else {
                // Crear nuevo cliente
                response = await fetch('http://localhost:3000/api/clientes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(clientData)
                });
            }
            
            if (response.ok) {
                mostrarAlerta(`Cliente ${clientId ? 'actualizado' : 'creado'} correctamente`, 'success');
                document.getElementById('clientModal').style.display = 'none';
                await cargarDatos(); // Recargar datos
            } else {
                const error = await response.json();
                mostrarAlerta(`Error: ${error.message}`, 'error');
            }
        } catch (error) {
            console.error('Error al guardar cliente:', error);
            mostrarAlerta('Error al conectar con el servidor', 'error');
        }
    });
    
    // Evento para el checkbox de convenio
    document.getElementById('clientConvenio').addEventListener('change', function() {
        const empresaGroup = document.getElementById('clientEmpresaGroup');
        if (this.checked) {
            empresaGroup.classList.remove('opacity-50');
            document.getElementById('clientEmpresa').disabled = false;
        } else {
            empresaGroup.classList.add('opacity-50');
            document.getElementById('clientEmpresa').disabled = true;
            document.getElementById('clientEmpresa').value = '';
        }
    });
}

// Configurar eventos para los botones de acciones
function configurarBotonesAcciones() {
    // Botón agregar cliente
    document.getElementById('addClientBtn').addEventListener('click', function() {
        document.getElementById('modalTitle').textContent = 'Nuevo Cliente';
        document.getElementById('clientForm').reset();
        document.getElementById('clientId').value = '';
        
        // Resetear campos de convenio
        document.getElementById('clientEmpresa').value = '';
        document.getElementById('clientConvenio').checked = false;
        document.getElementById('clientEmpresaGroup').classList.add('opacity-50');
        document.getElementById('clientEmpresa').disabled = true;
        
        document.getElementById('clientModal').style.display = 'block';
    });
    
    // Botones para clientes (ver, editar, eliminar)
    document.getElementById('clientsTableBody').addEventListener('click', async function(e) {
        // Botón ver cliente
        if (e.target.closest('.btn-view')) {
            const id = e.target.closest('.btn-view').getAttribute('data-id');
            await verCliente(id);
        }
        
        // Botón editar cliente
        if (e.target.closest('.btn-edit')) {
            const id = e.target.closest('.btn-edit').getAttribute('data-id');
            await editarCliente(id);
        }
        
        // Botón eliminar cliente
        if (e.target.closest('.btn-delete')) {
            const id = e.target.closest('.btn-delete').getAttribute('data-id');
            await eliminarCliente(id);
        }
    });
    
    // Botón imprimir tarjeta
    document.getElementById('printCardBtn').addEventListener('click', function() {
        window.print();
    });
    
    // Botón cerrar tarjeta
    document.getElementById('closeCardBtn').addEventListener('click', function() {
        document.getElementById('clientCardModal').style.display = 'none';
    });
}

// Función para ver un cliente
async function verCliente(id) {
    try {
        const response = await fetch(`http://localhost:3000/api/clientes/${id}`);
        const client = await response.json();
        
        // Mostrar tarjeta de cliente
        document.getElementById('cardClientName').textContent = client.nombre;
        document.getElementById('cardClientPhone').textContent = client.telefono || 'N/A';
        document.getElementById('cardClientEmail').textContent = client.email || 'N/A';
        document.getElementById('cardClientAddress').textContent = client.direccion || 'N/A';
        document.getElementById('cardClientBirthdate').textContent = client.fecha_nacimiento || 'N/A';
        
        // Información de convenio
        document.getElementById('cardClientConvenio').textContent = client.convenio ? 'Sí' : 'No';
        document.getElementById('cardClientEmpresa').textContent = client.empresa_nombre || 'N/A';
        
        // Cargar historial de compras
        try {
            // Usamos el endpoint existente de ventas con el filtro de clienteId
            // Este endpoint ya está implementado en tu servidor
            const salesResponse = await fetch(`http://localhost:3000/api/ventas?clienteId=${id}`);
            const sales = await salesResponse.json();
            
            const historyBody = document.getElementById('clientHistoryBody');
            historyBody.innerHTML = '';
            
            if (sales.length === 0) {
                const row = document.createElement('tr');
                row.className = 'text-center';
                row.innerHTML = '<td colspan="4" class="py-4">No hay compras registradas</td>';
                historyBody.appendChild(row);
            } else {
                sales.forEach(sale => {
                    const row = document.createElement('tr');
                    row.className = 'hover:bg-lightGray dark:hover:bg-gray-700';
                    row.innerHTML = `
                        <td class="py-2 px-4">${sale.fecha}</td>
                        <td class="py-2 px-4">${sale.receta_id ? 'Receta' : 'Productos'}</td>
                        <td class="py-2 px-4">
                            <span class="status-${sale.estado.toLowerCase()}">${sale.estado}</span>
                        </td>
                        <td class="py-2 px-4 font-medium">$${parseFloat(sale.total).toFixed(2)}</td>
                    `;
                    historyBody.appendChild(row);
                });
            }
        } catch (error) {
            console.error('Error al cargar historial de compras:', error);
            const historyBody = document.getElementById('clientHistoryBody');
            historyBody.innerHTML = '<tr><td colspan="4" class="py-4 text-center text-red-500">Error al cargar el historial de compras</td></tr>';
        }
        
        document.getElementById('clientCardModal').style.display = 'block';
    } catch (error) {
        console.error('Error al cargar datos del cliente:', error);
        // Assuming mostrarAlerta is defined elsewhere or needs to be defined here.
        // For example:
        function mostrarAlerta(message, type) {
            // Implement your alert logic here.  This is a placeholder.
            console.log(`${type}: ${message}`);
            alert(`${type}: ${message}`); // Basic alert as an example
        }
        mostrarAlerta('Error al cargar los datos del cliente', 'error');
    }
}

// Función para editar un cliente
async function editarCliente(id) {
    try {
        const response = await fetch(`http://localhost:3000/api/clientes/${id}`);
        const client = await response.json();
        
        // Mostrar modal de edición con datos del cliente
        document.getElementById('modalTitle').textContent = 'Editar Cliente';
        document.getElementById('clientId').value = client.id;
        document.getElementById('clientName').value = client.nombre;
        document.getElementById('clientPhone').value = client.telefono || '';
        document.getElementById('clientEmail').value = client.email || '';
        document.getElementById('clientAddress').value = client.direccion || '';
        document.getElementById('clientBirthdate').value = client.fecha_nacimiento || '';
        
        // Actualizar campos de convenio
        document.getElementById('clientConvenio').checked = client.convenio || false;
        
        if (client.convenio) {
            document.getElementById('clientEmpresaGroup').classList.remove('opacity-50');
            document.getElementById('clientEmpresa').disabled = false;
            document.getElementById('clientEmpresa').value = client.empresa_id || '';
        } else {
            document.getElementById('clientEmpresaGroup').classList.add('opacity-50');
            document.getElementById('clientEmpresa').disabled = true;
            document.getElementById('clientEmpresa').value = '';
        }
        
        document.getElementById('clientModal').style.display = 'block';
    } catch (error) {
        console.error('Error al cargar datos del cliente:', error);
        mostrarAlerta('Error al cargar los datos del cliente', 'error');
    }
}

// Función para eliminar un cliente
async function eliminarCliente(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
        try {
            const response = await fetch(`http://localhost:3000/api/clientes/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                mostrarAlerta('Cliente eliminado correctamente', 'success');
                await cargarDatos(); // Recargar datos
            } else {
                const error = await response.json();
                mostrarAlerta(`Error: ${error.message}`, 'error');
            }
        } catch (error) {
            console.error('Error al eliminar cliente:', error);
            mostrarAlerta('Error al conectar con el servidor', 'error');
        }
    }
}

// Configurar eventos para las búsquedas
function configurarBusquedas() {
    document.getElementById('searchClienteBtn').addEventListener('click', function() {
        buscarClientes();
    });
    
    document.getElementById('searchCliente').addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            buscarClientes();
        }
    });
}

// Función para buscar clientes
async function buscarClientes() {
    const searchTerm = document.getElementById('searchCliente').value.trim();
    
    try {
        let url = 'http://localhost:3000/api/clientes';
        if (searchTerm) {
            url += `?nombre=${encodeURIComponent(searchTerm)}`;
        }
        
        const response = await fetch(url);
        const clientes = await response.json();
        
        llenarTablaClientes(clientes);
    } catch (error) {
        console.error('Error al buscar clientes:', error);
        mostrarAlerta('Error al buscar clientes', 'error');
    }
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