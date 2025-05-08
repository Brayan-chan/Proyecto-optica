document.addEventListener('DOMContentLoaded', async function() {
    // Cargar clientes desde la API
    try {
        const response = await fetch('http://localhost:3000/api/clientes');
        const clientsData = await response.json();
        
        // Llenar la tabla de clientes
        const tableBody = document.getElementById('clientsTableBody');
        tableBody.innerHTML = ''; // Limpiar tabla
        
        clientsData.forEach(client => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${client.id}</td>
                <td>${client.nombre}</td>
                <td>${client.telefono || ''}</td>
                <td>${client.email || ''}</td>
                <td>${client.ultima_visita || 'N/A'}</td>
                <td>
                    <button class="btn-view" data-id="${client.id}">Ver</button>
                    <button class="btn-edit" data-id="${client.id}">Editar</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error al cargar clientes:', error);
        alert('Error al cargar los datos de clientes');
    }
    
    // Cargar empresas para el select de convenios
    try {
        const response = await fetch('http://localhost:3000/api/empresas');
        const empresas = await response.json();
        
        // Agregar campo de empresa al formulario si no existe
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        formGroup.innerHTML = `
            <label for="clientEmpresa">Empresa (Convenio)</label>
            <select id="clientEmpresa">
                <option value="">Sin convenio</option>
                ${empresas.map(empresa => `<option value="${empresa.id}">${empresa.nombre}</option>`).join('')}
            </select>
        `;
        
        // Insertar después del campo de dirección
        const direccionField = document.getElementById('clientAddress');
        if (direccionField) {
            const parentNode = direccionField.closest('.form-group');
            parentNode.parentNode.insertBefore(formGroup, parentNode.nextSibling);
        }
        
        // Agregar checkbox de convenio
        const convenioGroup = document.createElement('div');
        convenioGroup.className = 'form-group';
        convenioGroup.innerHTML = `
            <label for="clientConvenio">
                <input type="checkbox" id="clientConvenio"> Cliente con convenio
            </label>
        `;
        
        // Insertar después del campo de empresa
        const empresaField = document.getElementById('clientEmpresa');
        if (empresaField) {
            const parentNode = empresaField.closest('.form-group');
            parentNode.parentNode.insertBefore(convenioGroup, parentNode.nextSibling);
        }
        
    } catch (error) {
        console.error('Error al cargar empresas:', error);
    }
    
    // Mostrar modal para nuevo cliente
    document.getElementById('addClientBtn').addEventListener('click', function() {
        document.getElementById('modalTitle').textContent = 'Nuevo Cliente';
        document.getElementById('clientForm').reset();
        document.getElementById('clientId').value = '';
        
        // Resetear campos de convenio
        if (document.getElementById('clientEmpresa')) {
            document.getElementById('clientEmpresa').value = '';
        }
        if (document.getElementById('clientConvenio')) {
            document.getElementById('clientConvenio').checked = false;
        }
        
        document.getElementById('clientModal').style.display = 'block';
    });
    
    // Manejar envío del formulario
    document.getElementById('clientForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const clientId = document.getElementById('clientId').value;
        const clientData = {
            nombre: document.getElementById('clientName').value,
            telefono: document.getElementById('clientPhone').value,
            email: document.getElementById('clientEmail').value,
            direccion: document.getElementById('clientAddress').value,
            fechaNacimiento: document.getElementById('clientBirthdate').value,
            // Nuevos campos para la estructura actualizada
            empresaId: document.getElementById('clientEmpresa')?.value || null,
            convenio: document.getElementById('clientConvenio')?.checked || false
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
                alert('Cliente guardado correctamente');
                document.getElementById('clientModal').style.display = 'none';
                // Recargar la página para mostrar los cambios
                location.reload();
            } else {
                const error = await response.json();
                alert(`Error: ${error.message}`);
            }
        } catch (error) {
            console.error('Error al guardar cliente:', error);
            alert('Error al conectar con el servidor');
        }
    });
    
    // Manejar clics en botones de la tabla
    document.getElementById('clientsTableBody').addEventListener('click', async function(e) {
        if (!e.target.classList.contains('btn-view') && !e.target.classList.contains('btn-edit')) {
            return;
        }
        
        const id = e.target.getAttribute('data-id');
        
        try {
            const response = await fetch(`http://localhost:3000/api/clientes/${id}`);
            const client = await response.json();
            
            if (e.target.classList.contains('btn-view')) {
                // Mostrar tarjeta de cliente
                document.getElementById('cardClientName').textContent = client.nombre;
                document.getElementById('cardClientPhone').textContent = client.telefono || 'N/A';
                document.getElementById('cardClientEmail').textContent = client.email || 'N/A';
                document.getElementById('cardClientAddress').textContent = client.direccion || 'N/A';
                document.getElementById('cardClientBirthdate').textContent = client.fecha_nacimiento || 'N/A';
                
                // Agregar información de convenio si existe
                const clientInfoDiv = document.querySelector('.client-info');
                const convenioInfo = document.createElement('p');
                convenioInfo.innerHTML = `<strong>Convenio:</strong> <span id="cardClientConvenio">${client.convenio ? 'Sí' : 'No'}</span>`;
                
                const empresaInfo = document.createElement('p');
                empresaInfo.innerHTML = `<strong>Empresa:</strong> <span id="cardClientEmpresa">${client.empresa_nombre || 'N/A'}</span>`;
                
                // Eliminar elementos previos si existen
                const prevConvenio = document.getElementById('cardClientConvenio')?.closest('p');
                const prevEmpresa = document.getElementById('cardClientEmpresa')?.closest('p');
                
                if (prevConvenio) prevConvenio.remove();
                if (prevEmpresa) prevEmpresa.remove();
                
                clientInfoDiv.appendChild(convenioInfo);
                clientInfoDiv.appendChild(empresaInfo);
                
                // Cargar historial de compras
                try {
                    const salesResponse = await fetch(`http://localhost:3000/api/ventas?clienteId=${id}`);
                    const sales = await salesResponse.json();
                    
                    const historyBody = document.getElementById('clientHistoryBody');
                    historyBody.innerHTML = '';
                    
                    if (sales.length === 0) {
                        const row = document.createElement('tr');
                        row.innerHTML = '<td colspan="4">No hay compras registradas</td>';
                        historyBody.appendChild(row);
                    } else {
                        sales.forEach(sale => {
                            const row = document.createElement('tr');
                            row.innerHTML = `
                                <td>${sale.fecha}</td>
                                <td>${sale.receta_id ? 'Receta' : 'Productos'}</td>
                                <td>${sale.estado}</td>
                                <td>$${parseFloat(sale.total).toFixed(2)}</td>
                            `;
                            historyBody.appendChild(row);
                        });
                    }
                } catch (error) {
                    console.error('Error al cargar historial de compras:', error);
                }
                
                document.getElementById('clientCardModal').style.display = 'block';
            }
            
            if (e.target.classList.contains('btn-edit')) {
                // Mostrar modal de edición con datos del cliente
                document.getElementById('modalTitle').textContent = 'Editar Cliente';
                document.getElementById('clientId').value = client.id;
                document.getElementById('clientName').value = client.nombre;
                document.getElementById('clientPhone').value = client.telefono || '';
                document.getElementById('clientEmail').value = client.email || '';
                document.getElementById('clientAddress').value = client.direccion || '';
                document.getElementById('clientBirthdate').value = client.fecha_nacimiento || '';
                
                // Actualizar campos de convenio
                if (document.getElementById('clientEmpresa')) {
                    document.getElementById('clientEmpresa').value = client.empresa_id || '';
                }
                if (document.getElementById('clientConvenio')) {
                    document.getElementById('clientConvenio').checked = client.convenio || false;
                }
                
                document.getElementById('clientModal').style.display = 'block';
            }
        } catch (error) {
            console.error('Error al cargar datos del cliente:', error);
            alert('Error al cargar los datos del cliente');
        }
    });
    
    // Manejar cierre de modal de tarjeta
    document.getElementById('closeCardBtn').addEventListener('click', function() {
        document.getElementById('clientCardModal').style.display = 'none';
    });
    
    // Manejar impresión de tarjeta
    document.getElementById('printCardBtn').addEventListener('click', function() {
        window.print();
    });
});