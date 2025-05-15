+document.addEventListener("DOMContentLoaded", async () => {
    // Cargar datos iniciales
    await cargarDatos()
  
    // Configurar eventos para los formularios
    configurarFormularios()
  
    // Configurar eventos para los botones de acciones
    configurarBotonesAcciones()
  
    // Configurar eventos para las búsquedas
    configurarBusquedas()
  
    // Configurar eventos para cerrar modales
    configurarModales()
  })
  
  // Función para cargar todos los datos necesarios
  async function cargarDatos() {
    try {
      // Cargar ventas
      const ventasResponse = await fetch("http://localhost:3000/api/ventas")
      const ventas = await ventasResponse.json()
      llenarTablaVentas(ventas)
  
      // Cargar clientes para el select
      const clientesResponse = await fetch("http://localhost:3000/api/clientes")
      const clientes = await clientesResponse.json()
      llenarSelectClientes(clientes)
  
      // Cargar productos para la venta
      const productosResponse = await fetch("http://localhost:3000/api/productos")
      const productos = await productosResponse.json()
  
      // Cargar armazones para la venta
      const armazonesResponse = await fetch("http://localhost:3000/api/armazones")
      const armazones = await armazonesResponse.json()
  
      // Guardar productos y armazones en variables globales para usarlos después
      window.productosData = productos
      window.armazonesData = armazones
  
      // Inicializar los selects de productos y armazones
      actualizarSelectsProductos()
    } catch (error) {
      console.error("Error al cargar datos:", error)
      mostrarAlerta("Error al cargar los datos. Por favor, verifica la conexión con el servidor.", "error")
    }
  }
  
  // Función para llenar la tabla de ventas
  function llenarTablaVentas(ventas) {
    const ventasTableBody = document.getElementById("ventasTableBody")
    ventasTableBody.innerHTML = "" // Limpiar tabla
  
    ventas.forEach((venta) => {
      const row = document.createElement("tr")
      row.className = "hover:bg-lightGray dark:hover:bg-gray-700 transition-colors"
      row.setAttribute("data-id", venta.id)
      row.setAttribute("data-cliente-id", venta.cliente_id || "")
  
      // Verificar si el cliente tiene convenio
      const tieneConvenio = venta.cliente_id
        ? `<span class="badge ${venta.convenio ? "badge-success" : "badge-secondary"}">${venta.convenio ? "Sí" : "No"}</span>`
        : '<span class="badge badge-secondary">N/A</span>'
  
      // Determinar clases para el saldo
      const saldoClass = Number.parseFloat(venta.saldo) > 0 ? "text-red-500 font-medium" : "text-green-500 font-medium"
      const estadoClass = `status-${venta.estado.toLowerCase()}`
  
      row.innerHTML = `
              <td class="py-3 px-4">${venta.id}</td>
              <td class="py-3 px-4">${formatearFecha(venta.fecha)}</td>
              <td class="py-3 px-4">${venta.cliente_nombre || "Cliente no registrado"}</td>
              <td class="py-3 px-4 font-medium">$${Number.parseFloat(venta.total).toFixed(2)}</td>
              <td class="py-3 px-4 text-green-600">$${Number.parseFloat(venta.abono).toFixed(2)}</td>
              <td class="py-3 px-4 ${saldoClass}">$${Number.parseFloat(venta.saldo).toFixed(2)}</td>
              <td class="py-3 px-4"><span class="${estadoClass}">${venta.estado}</span></td>
              <td class="py-3 px-4">${tieneConvenio}</td>
              <td class="py-3 px-4">
                  <div class="flex space-x-2">
                      <button class="btn-view-venta btn-action bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded-md flex items-center" data-id="${venta.id}">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Ver
                      </button>
                      ${
                        venta.estado !== "Cancelada" && venta.estado !== "Pagada"
                          ? `<button class="btn-pay-venta btn-action bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded-md flex items-center" data-id="${venta.id}">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                          </svg>
                          Pago
                         </button>`
                          : ""
                      }
                      ${
                        venta.estado !== "Cancelada"
                          ? `<button class="btn-cancel-venta btn-action bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded-md flex items-center" data-id="${venta.id}">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Cancelar
                         </button>`
                          : ""
                      }
                  </div>
              </td>
          `
      ventasTableBody.appendChild(row)
    })
  }
  
  // Función para formatear fecha
  function formatearFecha(fechaStr) {
    if (!fechaStr) return ""
  
    // Eliminar la parte de la hora si existe
    if (fechaStr.includes("T")) {
      fechaStr = fechaStr.split("T")[0]
    }
  
    // Eliminar la parte de milisegundos si existe
    if (fechaStr.includes(".")) {
      fechaStr = fechaStr.split(".")[0]
    }
  
    return fechaStr
  }
  
  // Función para llenar el select de clientes
  function llenarSelectClientes(clientes) {
    const clienteSelect = document.getElementById("clienteId")
    if (!clienteSelect) return
  
    clienteSelect.innerHTML = '<option value="">Seleccione un cliente</option>'
  
    clientes.forEach((cliente) => {
      const option = document.createElement("option")
      option.value = cliente.id
      option.textContent = cliente.nombre
      option.dataset.convenio = cliente.convenio ? "true" : "false"
      option.dataset.empresaId = cliente.empresa_id || ""
      option.dataset.empresaNombre = cliente.empresa_nombre || ""
      clienteSelect.appendChild(option)
    })
  
    // Manejar cambio en el select de cliente para mostrar info de convenio
    clienteSelect.addEventListener("change", function () {
      const selectedOption = this.options[this.selectedIndex]
      if (!selectedOption.value) return
  
      const esConvenio = selectedOption.dataset.convenio === "true"
      const empresaNombre = selectedOption.dataset.empresaNombre
  
      if (document.getElementById("esConvenio")) {
        document.getElementById("esConvenio").checked = esConvenio
      }
  
      if (document.getElementById("infoConvenio")) {
        if (esConvenio && empresaNombre) {
          document.getElementById("empresaConvenio").textContent = empresaNombre
          document.getElementById("infoConvenio").style.display = "block"
        } else {
          document.getElementById("infoConvenio").style.display = "none"
        }
      }
  
      // Cargar historial de ventas del cliente
      cargarHistorialCliente(selectedOption.value)
    })
  }
  
  // Función para cargar el historial de ventas de un cliente
  async function cargarHistorialCliente(clienteId) {
    if (!clienteId) return
  
    try {
      const response = await fetch(`http://localhost:3000/api/clientes/${clienteId}/ventas`)
      const ventas = await response.json()
  
      // Mostrar el historial en la interfaz
      mostrarHistorialCliente(ventas)
  
      // Calcular saldo total del cliente
      calcularSaldoTotalCliente(ventas)
    } catch (error) {
      console.error("Error al cargar historial del cliente:", error)
    }
  }
  
  // Función para mostrar el historial de ventas de un cliente
  function mostrarHistorialCliente(ventas) {
    const historialContainer = document.getElementById("historialClienteContainer")
    if (!historialContainer) return
  
    // Mostrar el contenedor
    historialContainer.style.display = "block"
  
    // Obtener la tabla
    const historialTable = document.getElementById("historialClienteTable")
    if (!historialTable) return
  
    // Limpiar tabla
    const tbody = historialTable.querySelector("tbody")
    tbody.innerHTML = ""
  
    // Llenar tabla con ventas
    ventas.forEach((venta) => {
      const row = document.createElement("tr")
  
      // Determinar clases para el saldo
      const saldoClass = Number.parseFloat(venta.saldo) > 0 ? "text-red-500 font-medium" : "text-green-500 font-medium"
  
      row.innerHTML = `
              <td class="py-2 px-3">${venta.id}</td>
              <td class="py-2 px-3">${formatearFecha(venta.fecha)}</td>
              <td class="py-2 px-3 font-medium">$${Number.parseFloat(venta.total).toFixed(2)}</td>
              <td class="py-2 px-3 text-green-600">$${Number.parseFloat(venta.abono).toFixed(2)}</td>
              <td class="py-2 px-3 ${saldoClass}">$${Number.parseFloat(venta.saldo).toFixed(2)}</td>
              <td class="py-2 px-3"><span class="status-${venta.estado.toLowerCase()}">${venta.estado}</span></td>
          `
  
      tbody.appendChild(row)
    })
  }
  
  // Función para calcular el saldo total del cliente
  function calcularSaldoTotalCliente(ventas) {
    const saldoTotalElement = document.getElementById("saldoTotalCliente")
    if (!saldoTotalElement) return
  
    let saldoTotal = 0
  
    ventas.forEach((venta) => {
      if (venta.estado !== "Cancelada") {
        saldoTotal += Number.parseFloat(venta.saldo)
      }
    })
  
    saldoTotalElement.textContent = `$${saldoTotal.toFixed(2)}`
    saldoTotalElement.className = saldoTotal > 0 ? "text-red-500 font-bold" : "text-green-500 font-bold"
  }
  
  // Función para actualizar los selects de productos y armazones
  function actualizarSelectsProductos() {
    document.querySelectorAll(".productoSelect").forEach((select) => {
      select.innerHTML = '<option value="">Seleccione un producto</option>'
      if (window.productosData) {
        window.productosData.forEach((producto) => {
          const option = document.createElement("option")
          option.value = producto.id
          option.textContent = `${producto.nombre} - $${producto.precio_venta}`
          option.dataset.precio = producto.precio_venta
          option.dataset.stock = producto.stock
          select.appendChild(option)
        })
      }
    })
  
    document.querySelectorAll(".armazonSelect").forEach((select) => {
      select.innerHTML = '<option value="">Seleccione un armazón</option>'
      if (window.armazonesData) {
        window.armazonesData.forEach((armazon) => {
          const option = document.createElement("option")
          option.value = armazon.id
          option.textContent = `${armazon.nombre} (${armazon.marca || "Sin marca"}) - $${armazon.precio_venta}`
          option.dataset.precio = armazon.precio_venta
          option.dataset.stock = armazon.stock
          select.appendChild(option)
        })
      }
    })
  }
  
  // Configurar eventos para los formularios
  function configurarFormularios() {
    // Formulario de venta
    const saleForm = document.getElementById("saleForm")
    if (saleForm) {
      saleForm.addEventListener("submit", async (e) => {
        e.preventDefault()
  
        // Recopilar datos de productos
        const detalles = []
        const productosItems = document.querySelectorAll(".producto-item")
  
        for (const item of productosItems) {
          const tipoProducto = item.querySelector(".tipoProducto").value
          let productoId = null
          let armazonId = null
  
          if (tipoProducto === "Producto") {
            productoId = item.querySelector(".productoSelect").value
            if (!productoId) {
              mostrarAlerta("Por favor seleccione un producto", "error")
              return
            }
          } else if (tipoProducto === "Armazon") {
            armazonId = item.querySelector(".armazonSelect").value
            if (!armazonId) {
              mostrarAlerta("Por favor seleccione un armazón", "error")
              return
            }
          } else {
            mostrarAlerta("Por favor seleccione un tipo de producto", "error")
            return
          }
  
          const cantidad = Number.parseInt(item.querySelector(".cantidad").value)
          const precioUnitario = Number.parseFloat(item.querySelector(".precioUnitario").value)
          const subtotal = Number.parseFloat(item.querySelector(".subtotal").value)
  
          // Verificar stock disponible
          if (tipoProducto === "Producto") {
            const stockDisponible = Number.parseInt(
              item.querySelector(".productoSelect").options[item.querySelector(".productoSelect").selectedIndex].dataset
                .stock,
            )
            if (cantidad > stockDisponible) {
              mostrarAlerta(
                `No hay suficiente stock disponible para el producto seleccionado. Stock actual: ${stockDisponible}`,
                "error",
              )
              return
            }
          } else if (tipoProducto === "Armazon") {
            const stockDisponible = Number.parseInt(
              item.querySelector(".armazonSelect").options[item.querySelector(".armazonSelect").selectedIndex].dataset
                .stock,
            )
            if (cantidad > stockDisponible) {
              mostrarAlerta(
                `No hay suficiente stock disponible para el armazón seleccionado. Stock actual: ${stockDisponible}`,
                "error",
              )
              return
            }
          }
  
          detalles.push({
            tipoProducto,
            productoId,
            armazonId,
            cantidad,
            precioUnitario,
            subtotal,
          })
        }
  
        // Verificar si el cliente tiene convenio
        const clienteId = document.getElementById("clienteId").value
        let convenio = false
        let empresaId = null
  
        if (clienteId) {
          const clienteOption = document.querySelector(`#clienteId option[value="${clienteId}"]`)
          convenio = clienteOption.dataset.convenio === "true"
          empresaId = clienteOption.dataset.empresaId || null
        }
  
        const ventaData = {
          clienteId,
          fecha: document.getElementById("fechaVenta").value,
          total: Number.parseFloat(document.getElementById("total").value),
          abono: Number.parseFloat(document.getElementById("abono").value) || 0,
          observaciones: document.getElementById("observaciones").value,
          detalles,
          convenio,
          empresaId,
          usuarioId: 1, // Esto debería venir de la sesión del usuario
        }
  
        try {
          const response = await fetch("http://localhost:3000/api/ventas", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(ventaData),
          })
  
          if (response.ok) {
            mostrarAlerta("Venta registrada correctamente", "success")
            document.getElementById("saleModal").style.display = "none"
  
            // Recargar datos
            await cargarDatos()
  
            // Si hay un cliente seleccionado, actualizar su historial
            if (clienteId) {
              await cargarHistorialCliente(clienteId)
            }
          } else {
            const error = await response.json()
            mostrarAlerta(`Error: ${error.message}`, "error")
          }
        } catch (error) {
          console.error("Error al registrar venta:", error)
          mostrarAlerta("Error al conectar con el servidor", "error")
        }
      })
    }
  
    // Formulario de pago
    document.addEventListener("submit", async (e) => {
      if (e.target.id === "paymentForm") {
        e.preventDefault()
  
        const ventaId = document.getElementById("ventaId").value
        const clienteId = document.getElementById("clienteIdPago").value
        const pagoData = {
          monto: Number.parseFloat(document.getElementById("montoPago").value),
          metodoPago: document.getElementById("metodoPago").value,
          referencia: document.getElementById("referenciaPago").value,
          usuarioId: 1, // Esto debería venir de la sesión del usuario
        }
  
        try {
          const response = await fetch(`http://localhost:3000/api/ventas/${ventaId}/pagos`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(pagoData),
          })
  
          if (response.ok) {
            const resultado = await response.json()
            mostrarAlerta("Pago registrado correctamente", "success")
  
            // Cerrar el modal de pago
            const paymentModal = document.getElementById("paymentModal")
            if (paymentModal) {
              paymentModal.remove()
            }
  
            // Actualizar la tabla de ventas
            await cargarDatos()
  
            // Si hay un cliente seleccionado, actualizar su historial
            if (clienteId) {
              await cargarHistorialCliente(clienteId)
            }
  
            // Si hay un modal de detalles abierto, actualizarlo
            const viewSaleModal = document.getElementById("viewSaleModal")
            if (viewSaleModal) {
              await actualizarDetallesVenta(ventaId)
            }
          } else {
            const error = await response.json()
            mostrarAlerta(`Error: ${error.message}`, "error")
          }
        } catch (error) {
          console.error("Error al registrar pago:", error)
          mostrarAlerta("Error al conectar con el servidor", "error")
        }
      }
    })
  }
  
  // Función para actualizar los detalles de una venta en el modal
  async function actualizarDetallesVenta(ventaId) {
    try {
      const response = await fetch(`http://localhost:3000/api/ventas/${ventaId}`)
      const venta = await response.json()
  
      // Actualizar información general
      const infoContainer = document.querySelector("#viewSaleModal .sale-info")
      if (infoContainer) {
        const estadoElement = infoContainer.querySelector(".status-" + venta.estado.toLowerCase().replace("status-", ""))
        if (estadoElement) {
          estadoElement.textContent = venta.estado
          estadoElement.className = "status-" + venta.estado.toLowerCase()
        }
  
        // Actualizar abono y saldo
        const abonoElement = infoContainer.querySelectorAll("p")[4]
        if (abonoElement) {
          abonoElement.innerHTML = `<span class="font-semibold">Abono:</span> $${Number.parseFloat(venta.abono).toFixed(2)}`
        }
  
        const saldoElement = infoContainer.querySelectorAll("p")[5]
        if (saldoElement) {
          const saldoClass =
            Number.parseFloat(venta.saldo) > 0 ? "text-red-500 font-medium" : "text-green-500 font-medium"
          saldoElement.innerHTML = `<span class="font-semibold">Saldo:</span> <span class="${saldoClass}">$${Number.parseFloat(venta.saldo).toFixed(2)}</span>`
        }
      }
  
      // Actualizar historial de pagos
      const paymentsContainer = document.querySelector("#viewSaleModal .sale-payments")
      if (venta.pagos && venta.pagos.length > 0) {
        if (!paymentsContainer) {
          // Si no existe la sección de pagos, crearla
          const newPaymentsSection = document.createElement("div")
          newPaymentsSection.className = "sale-payments"
          newPaymentsSection.innerHTML = `
                      <h4 class="text-lg font-semibold mb-3 border-b border-mediumGray dark:border-gray-700 pb-2">Historial de Pagos</h4>
                      <div class="overflow-x-auto">
                          <table class="data-table w-full bg-white dark:bg-gray-800 rounded-lg">
                              <thead>
                                  <tr>
                                      <th class="py-2 px-4 text-left bg-primary text-white rounded-tl-lg">Fecha</th>
                                      <th class="py-2 px-4 text-left bg-primary text-white">Monto</th>
                                      <th class="py-2 px-4 text-left bg-primary text-white">Método</th>
                                      <th class="py-2 px-4 text-left bg-primary text-white rounded-tr-lg">Referencia</th>
                                  </tr>
                              </thead>
                              <tbody class="divide-y divide-mediumGray dark:divide-gray-700">
                                  ${venta.pagos
                                    .map(
                                      (pago) => `
                                      <tr class="hover:bg-lightGray dark:hover:bg-gray-700">
                                          <td class="py-2 px-4">${formatearFecha(pago.fecha)}</td>
                                          <td class="py-2 px-4 font-medium text-green-600">$${Number.parseFloat(pago.monto).toFixed(2)}</td>
                                          <td class="py-2 px-4">${pago.metodo_pago}</td>
                                          <td class="py-2 px-4">${pago.referencia || "N/A"}</td>
                                      </tr>
                                  `,
                                    )
                                    .join("")}
                              </tbody>
                          </table>
                      </div>
                  `
  
          // Insertar antes de las acciones
          const actionsDiv = document.querySelector("#viewSaleModal .sale-actions")
          if (actionsDiv) {
            actionsDiv.parentNode.insertBefore(newPaymentsSection, actionsDiv)
          }
        } else {
          // Actualizar la tabla existente
          const tbody = paymentsContainer.querySelector("tbody")
          if (tbody) {
            tbody.innerHTML = venta.pagos
              .map(
                (pago) => `
                          <tr class="hover:bg-lightGray dark:hover:bg-gray-700">
                              <td class="py-2 px-4">${formatearFecha(pago.fecha)}</td>
                              <td class="py-2 px-4 font-medium text-green-600">$${Number.parseFloat(pago.monto).toFixed(2)}</td>
                              <td class="py-2 px-4">${pago.metodo_pago}</td>
                              <td class="py-2 px-4">${pago.referencia || "N/A"}</td>
                          </tr>
                      `,
              )
              .join("")
          }
        }
      }
  
      // Actualizar botones de acción
      const actionsDiv = document.querySelector("#viewSaleModal .sale-actions")
      if (actionsDiv) {
        // Si la venta está pagada o cancelada, ocultar el botón de pago
        if (venta.estado === "Pagada" || venta.estado === "Cancelada") {
          const payButton = actionsDiv.querySelector(".btn-pay-modal")
          if (payButton) {
            payButton.remove()
          }
        } else {
          // Si no existe el botón de pago y la venta no está pagada ni cancelada, agregarlo
          if (!actionsDiv.querySelector(".btn-pay-modal") && venta.estado !== "Pagada" && venta.estado !== "Cancelada") {
            const payButton = document.createElement("button")
            payButton.className =
              "btn-pay-modal py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded transition-colors flex items-center mr-2"
            payButton.innerHTML = `
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                          </svg>
                          Registrar Pago
                      `
            payButton.setAttribute("data-id", venta.id)
            payButton.setAttribute("data-cliente-id", venta.cliente_id || "")
  
            // Agregar evento para mostrar formulario de pago
            payButton.addEventListener("click", () => {
              mostrarFormularioPago(venta.id, venta.cliente_id)
            })
  
            // Insertar antes del botón de cerrar
            const closeButton = actionsDiv.querySelector("#closeSaleBtn")
            if (closeButton) {
              actionsDiv.insertBefore(payButton, closeButton)
            } else {
              actionsDiv.appendChild(payButton)
            }
          }
        }
      }
    } catch (error) {
      console.error("Error al actualizar detalles de venta:", error)
    }
  }
  
  // Configurar eventos para los botones de acciones
  function configurarBotonesAcciones() {
    // Botón agregar venta
    const addSaleBtn = document.getElementById("addSaleBtn")
    if (addSaleBtn) {
      addSaleBtn.addEventListener("click", () => {
        const modalTitle = document.getElementById("modalTitle")
        if (modalTitle) {
          modalTitle.textContent = "Registrar Nueva Venta"
        }
  
        const saleForm = document.getElementById("saleForm")
        if (saleForm) {
          saleForm.reset()
        }
  
        const saleId = document.getElementById("saleId")
        if (saleId) {
          saleId.value = ""
        }
  
        const infoConvenio = document.getElementById("infoConvenio")
        if (infoConvenio) {
          infoConvenio.style.display = "none"
        }
  
        // Establecer fecha actual
        const fechaVenta = document.getElementById("fechaVenta")
        if (fechaVenta) {
          const hoy = new Date().toISOString().split("T")[0]
          fechaVenta.value = hoy
        }
  
        // Resetear productos - usar el template
        const productosContainer = document.getElementById("productosContainer")
        if (productosContainer) {
          productosContainer.innerHTML = crearProductoTemplate(1)
        }
  
        // Actualizar los selects
        actualizarSelectsProductos()
  
        const saleModal = document.getElementById("saleModal")
        if (saleModal) {
          saleModal.style.display = "block"
        }
      })
    }
  
    // Botón agregar producto a la venta
    const addProductoBtn = document.getElementById("addProductoBtn")
    if (addProductoBtn) {
      addProductoBtn.addEventListener("click", () => {
        const productosContainer = document.getElementById("productosContainer")
        if (!productosContainer) return
  
        const productoItems = productosContainer.querySelectorAll(".producto-item")
        const nuevoIndex = productoItems.length + 1
  
        // Crear nuevo elemento
        const nuevoProducto = document.createElement("div")
        nuevoProducto.innerHTML = crearProductoTemplate(nuevoIndex)
  
        productosContainer.appendChild(nuevoProducto.firstElementChild)
  
        // Actualizar los selects del nuevo producto
        actualizarSelectsProductos()
      })
    }
  
    // Botones para ventas (ver, pago, cancelar)
    const ventasTableBody = document.getElementById("ventasTableBody")
    if (ventasTableBody) {
      ventasTableBody.addEventListener("click", async (e) => {
        // Botón ver venta
        if (e.target.closest(".btn-view-venta")) {
          const id = e.target.closest(".btn-view-venta").getAttribute("data-id")
          await verDetallesVenta(id)
        }
  
        // Botón pago venta
        if (e.target.closest(".btn-pay-venta")) {
          const button = e.target.closest(".btn-pay-venta")
          const id = button.getAttribute("data-id")
          const clienteId = button.closest("tr").getAttribute("data-cliente-id")
          await mostrarFormularioPago(id, clienteId)
        }
  
        // Botón cancelar venta
        if (e.target.closest(".btn-cancel-venta")) {
          const id = e.target.closest(".btn-cancel-venta").getAttribute("data-id")
          await cancelarVenta(id)
        }
      })
    }
  
    // Eliminar producto de la venta
    document.addEventListener("click", (e) => {
      if (e.target.closest(".btn-remove-producto")) {
        const productoItems = document.querySelectorAll(".producto-item")
        if (productoItems.length > 1) {
          const productoItem = e.target.closest(".producto-item")
          productoItem.remove()
  
          // Renumerar los productos
          document.querySelectorAll(".producto-item h4").forEach((header, index) => {
            header.textContent = `Producto ${index + 1}`
          })
  
          // Actualizar total
          actualizarTotalVenta()
        } else {
          mostrarAlerta("Debe haber al menos un producto en la venta", "error")
        }
      }
    })
  }
  
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
      `
  }
  
  // Función para ver detalles de una venta
  async function verDetallesVenta(id) {
    try {
      const response = await fetch(`http://localhost:3000/api/ventas/${id}`)
      const venta = await response.json()
  
      // Crear modal para ver detalles de venta
      const modalHTML = `
              <div id="viewSaleModal" class="modal">
                  <div class="modal-content bg-white dark:bg-gray-800 w-11/12 md:w-3/4 max-w-4xl mx-auto mt-10 rounded-lg shadow-modal p-6">
                      <div class="flex justify-between items-center mb-4 border-b border-mediumGray dark:border-gray-700 pb-3">
                          <h3 class="text-xl font-semibold">Detalles de Venta #${venta.id}</h3>
                          <span class="close text-2xl cursor-pointer hover:text-gray-600 dark:hover:text-gray-300">&times;</span>
                      </div>
                      <div class="sale-details space-y-6">
                          <div class="sale-info grid grid-cols-1 md:grid-cols-2 gap-4 bg-lightGray dark:bg-gray-700 p-4 rounded-lg">
                              <div>
                                  <p class="mb-2"><span class="font-semibold">Cliente:</span> ${venta.cliente_nombre || "Cliente no registrado"}</p>
                                  <p class="mb-2"><span class="font-semibold">Fecha:</span> ${formatearFecha(venta.fecha)}</p>
                                  <p class="mb-2"><span class="font-semibold">Estado:</span> <span class="status-${venta.estado.toLowerCase()}">${venta.estado}</span></p>
                                  ${venta.convenio ? `<p class="mb-2"><span class="font-semibold">Convenio:</span> Sí (${venta.empresa_nombre || "Sin empresa"})</p>` : ""}
                              </div>
                              <div>
                                  <p class="mb-2"><span class="font-semibold">Total:</span> $${Number.parseFloat(venta.total).toFixed(2)}</p>
                                  <p class="mb-2"><span class="font-semibold">Abono:</span> $${Number.parseFloat(venta.abono).toFixed(2)}</p>
                                  <p class="mb-2"><span class="font-semibold">Saldo:</span> <span class="${Number.parseFloat(venta.saldo) > 0 ? "text-red-500 font-medium" : "text-green-500 font-medium"}">\$${Number.parseFloat(venta.saldo).toFixed(2)}</span></p>
                                  ${venta.observaciones ? `<p class="mb-2"><span class="font-semibold">Observaciones:</span> ${venta.observaciones}</p>` : ""}
                              </div>
                          </div>
                          
                          <div class="sale-items">
                              <h4 class="text-lg font-semibold mb-3 border-b border-mediumGray dark:border-gray-700 pb-2">Productos</h4>
                              <div class="overflow-x-auto">
                                  <table class="data-table w-full bg-white dark:bg-gray-800 rounded-lg">
                                      <thead>
                                          <tr>
                                              <th class="py-2 px-4 text-left bg-primary text-white rounded-tl-lg">Tipo</th>
                                              <th class="py-2 px-4 text-left bg-primary text-white">Producto</th>
                                              <th class="py-2 px-4 text-left bg-primary text-white">Cantidad</th>
                                              <th class="py-2 px-4 text-left bg-primary text-white">Precio</th>
                                              <th class="py-2 px-4 text-left bg-primary text-white rounded-tr-lg">Subtotal</th>
                                          </tr>
                                      </thead>
                                      <tbody class="divide-y divide-mediumGray dark:divide-gray-700">
                                          ${venta.detalles
                                            .map(
                                              (detalle) => `
                                              <tr class="hover:bg-lightGray dark:hover:bg-gray-700">
                                                  <td class="py-2 px-4">${detalle.tipo_producto}</td>
                                                  <td class="py-2 px-4">${detalle.producto_nombre || "N/A"}</td>
                                                  <td class="py-2 px-4">${detalle.cantidad}</td>
                                                  <td class="py-2 px-4">$${Number.parseFloat(detalle.precio_unitario).toFixed(2)}</td>
                                                  <td class="py-2 px-4 font-medium">$${Number.parseFloat(detalle.subtotal).toFixed(2)}</td>
                                              </tr>
                                          `,
                                            )
                                            .join("")}
                                      </tbody>
                                  </table>
                              </div>
                          </div>
                          
                          ${
                            venta.pagos && venta.pagos.length > 0
                              ? `
                              <div class="sale-payments">
                                  <h4 class="text-lg font-semibold mb-3 border-b border-mediumGray dark:border-gray-700 pb-2">Historial de Pagos</h4>
                                  <div class="overflow-x-auto">
                                      <table class="data-table w-full bg-white dark:bg-gray-800 rounded-lg">
                                          <thead>
                                              <tr>
                                                  <th class="py-2 px-4 text-left bg-primary text-white rounded-tl-lg">Fecha</th>
                                                  <th class="py-2 px-4 text-left bg-primary text-white">Monto</th>
                                                  <th class="py-2 px-4 text-left bg-primary text-white">Método</th>
                                                  <th class="py-2 px-4 text-left bg-primary text-white rounded-tr-lg">Referencia</th>
                                              </tr>
                                          </thead>
                                          <tbody class="divide-y divide-mediumGray dark:divide-gray-700">
                                              ${venta.pagos
                                                .map(
                                                  (pago) => `
                                                  <tr class="hover:bg-lightGray dark:hover:bg-gray-700">
                                                      <td class="py-2 px-4">${formatearFecha(pago.fecha)}</td>
                                                      <td class="py-2 px-4 font-medium text-green-600">$${Number.parseFloat(pago.monto).toFixed(2)}</td>
                                                      <td class="py-2 px-4">${pago.metodo_pago}</td>
                                                      <td class="py-2 px-4">${pago.referencia || "N/A"}</td>
                                                  </tr>
                                              `,
                                                )
                                                .join("")}
                                          </tbody>
                                      </table>
                                  </div>
                              </div>
                          `
                              : ""
                          }
                          
                          <div class="sale-actions flex justify-end space-x-4 pt-4 border-t border-mediumGray dark:border-gray-700">
                              ${
                                venta.estado !== "Cancelada" && venta.estado !== "Pagada"
                                  ? `
                                  <button class="btn-pay-modal py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded transition-colors flex items-center" data-id="${venta.id}" data-cliente-id="${venta.cliente_id || ""}">
                                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                      </svg>
                                      Registrar Pago
                                  </button>
                              `
                                  : ""
                              }
                              <button class="btn-primary py-2 px-4 bg-primary hover:bg-primary/80 text-white rounded transition-colors flex items-center" id="printSaleBtn">
                                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                  </svg>
                                  Imprimir
                              </button>
                              <button class="py-2 px-4 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors flex items-center" id="closeSaleBtn">
                                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  Cerrar
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          `
  
      // Agregar modal al DOM
      const modalContainer = document.createElement("div")
      modalContainer.innerHTML = modalHTML
      document.body.appendChild(modalContainer)
  
      // Mostrar modal
      document.getElementById("viewSaleModal").style.display = "block"
  
      // Manejar cierre de modal
      document.querySelector("#viewSaleModal .close").addEventListener("click", () => {
        document.getElementById("viewSaleModal").remove()
      })
  
      document.getElementById("closeSaleBtn").addEventListener("click", () => {
        document.getElementById("viewSaleModal").remove()
      })
  
      // Manejar impresión
      document.getElementById("printSaleBtn").addEventListener("click", () => {
        window.print()
      })
  
      // Manejar botón de pago
      const payButton = document.querySelector(".btn-pay-modal")
      if (payButton) {
        payButton.addEventListener("click", function () {
          const ventaId = this.getAttribute("data-id")
          const clienteId = this.getAttribute("data-cliente-id")
          mostrarFormularioPago(ventaId, clienteId)
        })
      }
    } catch (error) {
      console.error("Error al cargar detalles de venta:", error)
      mostrarAlerta("Error al cargar los detalles de la venta", "error")
    }
  }
  
  // Función para mostrar formulario de pago
  async function mostrarFormularioPago(id, clienteId) {
    try {
      const response = await fetch(`http://localhost:3000/api/ventas/${id}`)
      const venta = await response.json()
  
      // Crear modal para registrar pago
      const modalHTML = `
              <div id="paymentModal" class="modal">
                  <div class="modal-content bg-white dark:bg-gray-800 w-11/12 md:w-1/2 max-w-lg mx-auto mt-16 rounded-lg shadow-modal p-6">
                      <div class="flex justify-between items-center mb-4 border-b border-mediumGray dark:border-gray-700 pb-3">
                          <h3 class="text-xl font-semibold">Registrar Pago</h3>
                          <span class="close text-2xl cursor-pointer hover:text-gray-600 dark:hover:text-gray-300">&times;</span>
                      </div>
                      <form id="paymentForm" class="space-y-4">
                          <input type="hidden" id="ventaId" value="${venta.id}">
                          <input type="hidden" id="clienteIdPago" value="${clienteId || ""}">
                          
                          <div class="p-3 bg-lightGray dark:bg-gray-700 rounded-lg mb-4">
                              <div class="font-medium mb-2">Resumen de la venta</div>
                              <div class="grid grid-cols-2 gap-2">
                                  <div>Cliente:</div>
                                  <div class="text-right">${venta.cliente_nombre || "Cliente no registrado"}</div>
                                  <div>Total:</div>
                                  <div class="text-right font-medium">$${Number.parseFloat(venta.total).toFixed(2)}</div>
                                  <div>Pagado:</div>
                                  <div class="text-right text-green-600">$${Number.parseFloat(venta.abono).toFixed(2)}</div>
                                  <div>Saldo:</div>
                                  <div class="text-right font-bold text-red-500">$${Number.parseFloat(venta.saldo).toFixed(2)}</div>
                              </div>
                          </div>
                          
                          <div class="form-group">
                              <label for="saldoActual" class="block mb-1 font-medium">Saldo pendiente</label>
                              <input type="number" id="saldoActual" value="${venta.saldo}" class="w-full p-2 border border-mediumGray rounded-md text-base bg-lightGray dark:bg-gray-700 font-bold dark:border-gray-600" readonly>
                          </div>
                          
                          <div class="form-group">
                              <label for="montoPago" class="block mb-1 font-medium">Monto a pagar</label>
                              <input type="number" step="0.01" id="montoPago" class="w-full p-2 border border-mediumGray rounded-md text-base focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600" required max="${venta.saldo}">
                          </div>
                          
                          <div class="form-group">
                              <label for="metodoPago" class="block mb-1 font-medium">Método de pago</label>
                              <select id="metodoPago" class="w-full p-2 border border-mediumGray rounded-md text-base focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600" required>
                                  <option value="Efectivo">Efectivo</option>
                                  <option value="Tarjeta">Tarjeta</option>
                                  <option value="Transferencia">Transferencia</option>
                                  <option value="Otro">Otro</option>
                              </select>
                          </div>
                          
                          <div class="form-group">
                              <label for="referenciaPago" class="block mb-1 font-medium">Referencia (opcional)</label>
                              <input type="text" id="referenciaPago" class="w-full p-2 border border-mediumGray rounded-md text-base focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600">
                          </div>
                          
                          <div class="flex justify-end space-x-2 pt-4 border-t border-mediumGray dark:border-gray-700">
                              <button type="button" class="close-modal py-2 px-4 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Cancelar</button>
                              <button type="submit" class="btn-primary py-2 px-4 bg-primary hover:bg-primary/80 text-white rounded transition-colors">Registrar pago</button>
                          </div>
                      </form>
                  </div>
              </div>
          `
  
      // Agregar modal al DOM
      const modalContainer = document.createElement("div")
      modalContainer.innerHTML = modalHTML
      document.body.appendChild(modalContainer)
  
      // Mostrar modal
      document.getElementById("paymentModal").style.display = "block"
  
      // Manejar cierre de modal
      document.querySelector("#paymentModal .close").addEventListener("click", () => {
        document.getElementById("paymentModal").remove()
      })
  
      document.querySelector("#paymentModal .close-modal").addEventListener("click", () => {
        document.getElementById("paymentModal").remove()
      })
  
      // Establecer el monto máximo igual al saldo pendiente
      const montoPagoInput = document.getElementById("montoPago")
      if (montoPagoInput) {
        montoPagoInput.setAttribute("max", venta.saldo)
  
        // Sugerir el pago completo
        montoPagoInput.value = venta.saldo
  
        // Validar que el monto no exceda el saldo
        montoPagoInput.addEventListener("input", function () {
          const monto = Number.parseFloat(this.value)
          const saldo = Number.parseFloat(venta.saldo)
  
          if (monto > saldo) {
            this.value = saldo
            mostrarAlerta("El monto no puede exceder el saldo pendiente", "warning")
          }
        })
      }
    } catch (error) {
      console.error("Error al cargar datos de venta:", error)
      mostrarAlerta("Error al cargar los datos de la venta", "error")
    }
  }
  
  // Función para cancelar una venta
  async function cancelarVenta(id) {
    if (confirm("¿Estás seguro de que deseas cancelar esta venta? Esta acción no se puede deshacer.")) {
      try {
        const response = await fetch(`http://localhost:3000/api/ventas/${id}/cancelar`, {
          method: "PUT",
        })
  
        if (response.ok) {
          mostrarAlerta("Venta cancelada correctamente", "success")
  
          // Recargar datos
          await cargarDatos()
  
          // Actualizar historial del cliente si está visible
          const clienteId = document.querySelector(`tr[data-id="${id}"]`)?.getAttribute("data-cliente-id")
          if (clienteId) {
            await cargarHistorialCliente(clienteId)
          }
  
          // Si hay un modal de detalles abierto, cerrarlo
          const viewSaleModal = document.getElementById("viewSaleModal")
          if (viewSaleModal) {
            viewSaleModal.remove()
          }
        } else {
          const error = await response.json()
          mostrarAlerta(`Error: ${error.message}`, "error")
        }
      } catch (error) {
        console.error("Error al cancelar venta:", error)
        mostrarAlerta("Error al conectar con el servidor", "error")
      }
    }
  }
  
  // Configurar eventos para las búsquedas
  function configurarBusquedas() {
    // Búsqueda de ventas
    const searchVentaBtn = document.getElementById("searchVentaBtn")
    if (searchVentaBtn) {
      searchVentaBtn.addEventListener("click", () => {
        buscarVentas()
      })
    }
  
    const searchVenta = document.getElementById("searchVenta")
    if (searchVenta) {
      searchVenta.addEventListener("keyup", (e) => {
        if (e.key === "Enter") {
          buscarVentas()
        }
      })
    }
  }
  
  // Función para buscar ventas
  async function buscarVentas() {
    const searchTerm = document.getElementById("searchVenta")?.value.trim() || ""
  
    try {
      let url = "http://localhost:3000/api/ventas"
      if (searchTerm) {
        url += `?cliente=${encodeURIComponent(searchTerm)}`
      }
  
      const response = await fetch(url)
      const ventas = await response.json()
  
      llenarTablaVentas(ventas)
    } catch (error) {
      console.error("Error al buscar ventas:", error)
      mostrarAlerta("Error al buscar ventas", "error")
    }
  }
  
  // Función para actualizar el total de la venta
  function actualizarTotalVenta() {
    let total = 0
    document.querySelectorAll(".subtotal").forEach((input) => {
      total += Number.parseFloat(input.value) || 0
    })
  
    const totalInput = document.getElementById("total")
    if (totalInput) {
      totalInput.value = total.toFixed(2)
    }
  }
  
  // Configurar eventos para cerrar modales
  function configurarModales() {
    // Cerrar modales con botón X o botón Cancelar
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("close") || e.target.classList.contains("close-modal")) {
        const modal = e.target.closest(".modal")
        if (modal) {
          modal.style.display = "none"
        }
      }
    })
  
    // Cerrar modales al hacer clic fuera de ellos
    window.addEventListener("click", (e) => {
      document.querySelectorAll(".modal").forEach((modal) => {
        if (e.target === modal) {
          modal.style.display = "none"
        }
      })
    })
  
    // Manejar cambios en tipo de producto, cantidad y precio
    document.addEventListener("change", (e) => {
      if (e.target.classList.contains("tipoProducto")) {
        const productoItem = e.target.closest(".producto-item")
        const productoSelect = productoItem.querySelector(".producto-select")
        const armazonSelect = productoItem.querySelector(".armazon-select")
  
        // Ocultar ambos selects
        productoSelect.style.display = "none"
        armazonSelect.style.display = "none"
  
        // Mostrar el select correspondiente
        if (e.target.value === "Producto") {
          productoSelect.style.display = "block"
        } else if (e.target.value === "Armazon") {
          armazonSelect.style.display = "block"
        }
  
        // Resetear precio y subtotal
        const precioInput = productoItem.querySelector(".precioUnitario")
        const subtotalInput = productoItem.querySelector(".subtotal")
        precioInput.value = ""
        subtotalInput.value = ""
  
        // Actualizar total
        actualizarTotalVenta()
      }
  
      // Actualizar precio al seleccionar producto o armazón
      if (e.target.classList.contains("productoSelect") || e.target.classList.contains("armazonSelect")) {
        const productoItem = e.target.closest(".producto-item")
        const selectedOption = e.target.options[e.target.selectedIndex]
  
        if (selectedOption.value) {
          const precioInput = productoItem.querySelector(".precioUnitario")
          precioInput.value = selectedOption.dataset.precio
  
          // Actualizar subtotal
          const cantidadInput = productoItem.querySelector(".cantidad")
          const subtotalInput = productoItem.querySelector(".subtotal")
          const cantidad = Number.parseInt(cantidadInput.value) || 0
          const precio = Number.parseFloat(precioInput.value) || 0
          subtotalInput.value = (cantidad * precio).toFixed(2)
  
          // Actualizar total
          actualizarTotalVenta()
        }
      }
  
      // Actualizar subtotal al cambiar cantidad o precio
      if (e.target.classList.contains("cantidad") || e.target.classList.contains("precioUnitario")) {
        const productoItem = e.target.closest(".producto-item")
        const cantidadInput = productoItem.querySelector(".cantidad")
        const precioInput = productoItem.querySelector(".precioUnitario")
        const subtotalInput = productoItem.querySelector(".subtotal")
  
        const cantidad = Number.parseInt(cantidadInput.value) || 0
        const precio = Number.parseFloat(precioInput.value) || 0
        subtotalInput.value = (cantidad * precio).toFixed(2)
  
        // Actualizar total
        actualizarTotalVenta()
      }
    })
  }
  
  // Función para mostrar alertas
  function mostrarAlerta(mensaje, tipo) {
    // Implementación básica con alert
    if (tipo === "error") {
      alert(`❌ Error: ${mensaje}`)
    } else if (tipo === "success") {
      alert(`✅ Éxito: ${mensaje}`)
    } else if (tipo === "warning") {
      alert(`⚠️ Advertencia: ${mensaje}`)
    } else {
      alert(mensaje)
    }
  
  }
  