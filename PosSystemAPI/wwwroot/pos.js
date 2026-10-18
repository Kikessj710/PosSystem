const API_URL = "https://localhost:7217/api";
let cartItems = [];
let allCustomers = [];
let allProducts = [];

// ==========================================
// CLIENTES - BÚSQUEDA Y FILTRADO OPTIMIZADO
// ==========================================
async function loadCustomersModal() {
    try {
        let res = await fetch(`${API_URL}/customers`);
        allCustomers = await res.json();
        renderCustomerTable(allCustomers);
    } catch (e) {
        console.error(e);
        alert("Error al cargar clientes.");
    }
}

function renderCustomerTable(customers) {
    let tbody = document.getElementById("customerTableList");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!customers || customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" class="text-center text-muted">No se encontraron clientes.</td></tr>';
        return;
    }

    customers.forEach(c => {
        let tr = document.createElement("tr");
        tr.style.cursor = "pointer";
        tr.title = "Haz clic para seleccionar este cliente";
        tr.innerHTML = `
            <td><code>${c.identificationCard}</code></td>
            <td><strong>${c.fullName}</strong></td>
        `;

        tr.onclick = () => {
            selectCustomer(c.id, c.fullName);
            let modalEl = document.getElementById('customerModal');
            if (modalEl && window.bootstrap) {
                let modal = window.bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
            }
        };
        tbody.appendChild(tr);
    });
}

function filterCustomers() {
    let input = document.getElementById("customerSearchInput");
    if (!input) return;
    let query = input.value.toLowerCase().trim();

    let filtered = allCustomers.filter(c => {
        let name = c.fullName ? c.fullName.toLowerCase() : "";
        let card = c.identificationCard ? c.identificationCard.toLowerCase() : "";
        return name.includes(query) || card.includes(query);
    });

    renderCustomerTable(filtered);
}

function selectCustomer(id, name) {
    let idInput = document.getElementById("customerId");
    let nameInput = document.getElementById("customerName");
    if (idInput) idInput.value = id;
    if (nameInput) {
        nameInput.value = name;
        nameInput.classList.add("fw-bold", "text-success");
    }
}

// ==========================================
// PRODUCTOS Y CARRITO
// ==========================================
async function loadProductsModal() {
    try {
        let res = await fetch(`${API_URL}/products/available`);
        allProducts = await res.json();
        renderProductTable(allProducts);
    } catch (e) {
        console.error(e);
        alert("Error al cargar productos disponibles.");
    }
}

function renderProductTable(products) {
    let tbody = document.getElementById("productTableList");
    if (!tbody) return;
    tbody.innerHTML = "";

    products.forEach(p => {
        let tr = document.createElement("tr");
        tr.style.cursor = "pointer";
        tr.title = "Haz clic para agregar este producto";

        let shortId = p.id ? p.id.substring(0, 8) + "..." : "N/A";
        tr.innerHTML = `
            <td><code title="${p.id}">${shortId}</code></td>
            <td>${p.name}</td>
            <td>${p.unitPrice.toFixed(2)}</td>
            <td>${p.stock}</td>
        `;

        tr.onclick = () => addProductToCart(p);
        tbody.appendChild(tr);
    });
}

function filterProducts() {
    let input = document.getElementById("productSearchInput");
    if (!input) return;
    let query = input.value.toLowerCase();
    let filtered = allProducts.filter(p => p.name.toLowerCase().includes(query));
    renderProductTable(filtered);
}

function addProductToCart(product) {
    let existingItem = cartItems.find(i => i.productId === product.id);
    if (existingItem) {
        alert("Este producto ya se encuentra en el detalle. Puedes modificar su cantidad directamente en la tabla.");
        let modalEl = document.getElementById('productModal');
        if (modalEl && window.bootstrap) {
            let modal = window.bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
        }
        return;
    }

    cartItems.push({
        productId: product.id,
        name: product.name,
        price: product.unitPrice,
        quantity: 1,
        maxStock: product.stock
    });

    renderCart();

    let modalEl = document.getElementById('productModal');
    if (modalEl && window.bootstrap) {
        let modal = window.bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
    }
}

function updateQuantity(index, newQty) {
    let qty = parseInt(newQty);
    let item = cartItems[index];

    if (isNaN(qty) || qty <= 0) {
        item.quantity = 1;
    } else if (qty > item.maxStock) {
        alert(`La cantidad ingresada supera el stock disponible (${item.maxStock}).`);
        item.quantity = item.maxStock;
    } else {
        item.quantity = qty;
    }

    renderCart();
}

function renderCart() {
    let tbody = document.getElementById("cartTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    let subtotal = 0;

    cartItems.forEach((item, index) => {
        let itemSubtotal = item.price * item.quantity;
        subtotal += itemSubtotal;

        tbody.innerHTML += `
            <tr>
                <td>${item.name}</td>
                <td>${item.price.toFixed(2)}</td>
                <td><span class="badge bg-secondary">${item.maxStock} un.</span></td>
                <td>
                    <input type="number" class="form-control form-control-sm" style="width: 90px;" 
                           value="${item.quantity}" min="1" max="${item.maxStock}" 
                           oninput="updateQuantity(${index}, this.value)">
                </td>
                <td>${itemSubtotal.toFixed(2)}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="removeItem(${index})">Eliminar</button>
                </td>
            </tr>
        `;
    });

    let vat = subtotal * 0.15;
    let total = subtotal + vat;

    let lblSub = document.getElementById("lblSubtotal");
    let lblVat = document.getElementById("lblVat");
    let lblTot = document.getElementById("lblTotal");

    if (lblSub) lblSub.innerText = subtotal.toFixed(2);
    if (lblVat) lblVat.innerText = vat.toFixed(2);
    if (lblTot) lblTot.innerText = total.toFixed(2);
}

function removeItem(index) {
    if (!confirm("¿Está seguro de que desea eliminar este producto del carrito?")) {
        return;
    }
    cartItems.splice(index, 1);
    renderCart();
}

// ==========================================
// CHECKOUT / FACTURACIÓN Y VISOR PDF
// ==========================================
async function checkoutOrder() {
    let idInput = document.getElementById("customerId");
    if (!idInput) return;
    let customerId = idInput.value;

    if (!customerId) {
        alert("⚠️ Por favor, seleccione un cliente antes de facturar.");
        return;
    }
    if (cartItems.length === 0) {
        alert("⚠️ El carrito está vacío. Agregue al menos un producto.");
        return;
    }

    if (!confirm("¿Está seguro de que desea guardar y generar esta factura? Esta acción descontará el stock en la base de datos.")) {
        return;
    }

    let orderData = {
        customerId: customerId,
        items: cartItems.map(i => ({ productId: i.productId, quantity: i.quantity }))
    };

    try {
        let response = await fetch(`${API_URL}/salesorders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            let result = await response.json();
            alert("✅ ¡Factura generada con éxito y stock descontado!");

            let newOrderId = result.orderId;

            // Limpieza total del POS
            cartItems = [];
            renderCart();
            idInput.value = "";
            let nameInput = document.getElementById("customerName");
            if (nameInput) {
                nameInput.value = "";
                nameInput.classList.remove("fw-bold", "text-success");
            }

            // Abre automáticamente la factura recién creada en pestaña nueva
            if (newOrderId) {
                verPDF(newOrderId);
            }

        } else {
            let err = await response.text();
            alert("❌ Error al procesar la factura: " + err);
        }
    } catch (error) {
        console.error(error);
        alert("❌ Error de conexión con el servidor de la API.");
    }
}

async function verPDF(invoiceId) {
    let win = window.open('', '_blank');
    if (!win) return;

    win.document.write(`
        <html>
        <head><title>Cargando factura...</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body class="p-5 text-center">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-3">Cargando comprobante oficial...</p>
        </body>
        </html>
    `);

    let factura;
    try {
        let res = await fetch(`${API_URL}/salesorders/${invoiceId}`);
        if (!res.ok) throw new Error("No se pudo cargar el detalle de la factura.");
        factura = await res.json();
    } catch (err) {
        console.error("Error al consultar la orden:", err);
        win.document.open();
        win.document.write(`
            <html><body class="p-5 text-center">
                <h4 class="text-danger">No se pudo cargar el detalle de la factura.</h4>
                <p>Verifica que el endpoint GET /api/salesorders/{id} esté disponible.</p>
            </body></html>
        `);
        win.document.close();
        return;
    }

    let itemsHtml = (factura.details || []).map(function (it) {
        return `
            <tr>
                <td>${it.productName}</td>
                <td>${it.unitPrice.toFixed(2)}</td>
                <td>${it.quantity}</td>
                <td>${it.lineTotal.toFixed(2)}</td>
            </tr>
        `;
    }).join("");

    if (!itemsHtml) {
        itemsHtml = '<tr><td colspan="4" class="text-center text-muted">Sin productos registrados</td></tr>';
    }

    let cliente = factura.customer || factura.Customer || {};
    let clienteNombre = cliente.fullName || cliente.FullName || "Consumidor Final";
    let clienteCedula = cliente.identificationCard || cliente.IdentificationCard || "N/A";
    let clienteDireccion = cliente.address || cliente.Address || "Ecuador";

    win.document.open();
    win.document.write(`
        <html>
        <head>
            <title>Factura - ${factura.id}</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body class="p-5">
            <div class="card p-4 shadow-sm">
                <h2 class="text-center mb-3">SISTEMA DE FACTURACIÓN - POS</h2>
                <hr>
                <div class="row mb-3">
                    <div class="col-6">
                        <p><strong>N° de Factura:</strong> <code>${factura.id}</code></p>
                        <p><strong>Cédula / RUC:</strong> ${clienteCedula}</p>
                        <p><strong>Cliente:</strong> ${clienteNombre}</p>
                        <p><strong>Dirección:</strong> ${clienteDireccion}</p>
                    </div>
                    <div class="col-6 text-end">
                        <p><strong>Fecha de Emisión:</strong> ${new Date(factura.issueDate).toLocaleString()}</p>
                    </div>
                </div>

                <table class="table table-bordered mt-2">
                    <thead class="table-dark">
                        <tr>
                            <th>Descripción del Producto</th>
                            <th>Precio Unit.</th>
                            <th>Cantidad</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>

                <div class="row mt-3">
                    <div class="col-6"></div>
                    <div class="col-6 text-end">
                        <p><strong>Subtotal:</strong> ${factura.subtotal.toFixed(2)}</p>
                        <p><strong>IVA (15%):</strong> ${factura.vatAmount.toFixed(2)}</p>
                        <h4><strong>Total a Pagar:</strong> ${factura.totalAmount.toFixed(2)}</h4>
                    </div>
                </div>

                <hr>
                <div class="text-center mt-4">
                    <button class="btn btn-dark px-5" onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>
                </div>
            </div>
        </body>
        </html>
    `);
    win.document.close();
}