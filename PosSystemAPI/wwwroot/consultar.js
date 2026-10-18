const API_URL_CONSULT = "https://localhost:7217/api";

window.onload = function () {
    loadInvoices();
};

async function loadInvoices() {
    try {
        let res = await fetch(API_URL_CONSULT + "/salesorders");
        if (!res.ok) throw new Error("Error al obtener facturas");
        let data = await res.json();
        renderTable(data);
    } catch (err) {
        console.error(err);
        let tbody = document.getElementById("invoicesTableBody");
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">No se pudieron cargar las facturas de la API.</td></tr>';
        }
    }
}

function renderTable(invoices) {
    let tbody = document.getElementById("invoicesTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!invoices || invoices.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay facturas registradas en la base de datos.</td></tr>';
        return;
    }

    invoices.forEach(function (inv) {
        let total = typeof inv.totalAmount === 'number' ? inv.totalAmount.toFixed(2) : '0.00';
        let fecha = inv.issueDate ? new Date(inv.issueDate).toLocaleDateString() : new Date().toLocaleDateString();

        tbody.innerHTML += `
            <tr>
                <td><code>${inv.id}</code></td>
                <td>${inv.customerId}</td>
                <td>${fecha}</td>
                <td>$${total}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick='verPDF("${inv.id}")'>🖨️ Ver PDF</button>
                </td>
            </tr>
        `;
    });
}

async function searchInvoices() {
    let searchInput = document.getElementById("searchInput");
    if (!searchInput) return;

    let query = searchInput.value.toLowerCase();
    try {
        let res = await fetch(API_URL_CONSULT + "/salesorders");
        let invoices = await res.json();
        let filtered = invoices.filter(function (inv) {
            return inv.id.toLowerCase().includes(query) ||
                inv.customerId.toLowerCase().includes(query);
        });
        renderTable(filtered);
    } catch (err) {
        console.error(err);
    }
}

/**
 * Abre la ventana de impresión con el detalle REAL de la factura,
 * consultando GET /api/salesorders/{id} (con productos y cantidades reales).
 * @param {string} invoiceId
 */
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
        let res = await fetch(`${API_URL_CONSULT}/salesorders/${invoiceId}`);
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
                <td>$${it.unitPrice.toFixed(2)}</td>
                <td>${it.quantity}</td>
                <td>$${it.lineTotal.toFixed(2)}</td>
            </tr>
        `;
    }).join("");

    if (!itemsHtml) {
        itemsHtml = '<tr><td colspan="4" class="text-center text-muted">Sin productos registrados</td></tr>';
    }

    // Extraemos los datos del cliente que manda el backend
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
                        <p><strong>Subtotal:</strong> $${factura.subtotal.toFixed(2)}</p>
                        <p><strong>IVA (15%):</strong> $${factura.vatAmount.toFixed(2)}</p>
                        <h4><strong>Total a Pagar:</strong> $${factura.totalAmount.toFixed(2)}</h4>
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