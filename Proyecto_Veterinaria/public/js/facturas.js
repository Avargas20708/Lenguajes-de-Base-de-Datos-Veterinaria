const form = document.getElementById("formFactura");
const tabla = document.getElementById("tablaFacturas");
const mensaje = document.getElementById("mensaje");
const btnCancelar = document.getElementById("btnCancelar");
const clienteSelect = document.getElementById("cliente_id");
let editando = false;
let idEditando = null;
let facturasCache = [];

function limpiarFormulario() {
  form.reset();
  document.getElementById("id").disabled = false;
  editando = false;
  idEditando = null;
}

async function cargarClientesSelect() {
  const data = await apiRequest("/api/clientes");
  const clientes = data.data || [];
  clienteSelect.innerHTML = `<option value="">Seleccione un cliente</option>` +
    clientes.map(c => `<option value="${c.ID}">${c.ID} - ${escapeHtml(c.NOMBRE)} ${escapeHtml(c.APELLIDO)}</option>`).join("");
}

async function cargarFacturas() {
  try {
    const data = await apiRequest("/api/facturas");
    facturasCache = data.data || [];
    tabla.innerHTML = facturasCache.length
      ? facturasCache.map(f => `
        <tr>
          <td>${f.ID}</td>
          <td>${formatDateTime(f.FECHA)}</td>
          <td>${escapeHtml(f.CLIENTE)}</td>
          <td>₡${Number(f.TOTAL).toFixed(2)}</td>
          <td>
            <button class="btn btn-warning btn-small" data-edit="${f.ID}">Editar</button>
            <button class="btn btn-danger btn-small" data-delete="${f.ID}">Eliminar</button>
          </td>
        </tr>`).join("")
      : `<tr><td colspan="5" class="empty">No hay facturas registradas.</td></tr>`;
  } catch (error) {
    showMessage(mensaje, error.message, "error");
  }
}

function editarFactura(id) {
  const f = facturasCache.find(item => Number(item.ID) === Number(id));
  if (!f) return;
  document.getElementById("id").value = f.ID;
  document.getElementById("id").disabled = true;
  document.getElementById("fecha").value = toInputDateTime(f.FECHA);
  document.getElementById("total").value = f.TOTAL;
  clienteSelect.value = f.CLIENTE_ID;
  editando = true;
  idEditando = f.ID;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function eliminarFactura(id) {
  if (!confirm("¿Desea eliminar esta factura?")) return;
  try {
    const data = await apiRequest(`/api/facturas/${id}`, { method: "DELETE" });
    showMessage(mensaje, data.mensaje);
    await cargarFacturas();
  } catch (error) {
    showMessage(mensaje, error.message, "error");
  }
}

tabla.addEventListener("click", event => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;
  if (editId) editarFactura(editId);
  if (deleteId) eliminarFactura(deleteId);
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  const payload = {
    id: document.getElementById("id").value,
    fecha: document.getElementById("fecha").value,
    total: document.getElementById("total").value,
    cliente_id: clienteSelect.value
  };
  try {
    const data = await apiRequest(editando ? `/api/facturas/${idEditando}` : "/api/facturas", {
      method: editando ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });
    showMessage(mensaje, data.mensaje);
    limpiarFormulario();
    await cargarFacturas();
  } catch (error) {
    showMessage(mensaje, error.message, "error");
  }
});

btnCancelar.addEventListener("click", limpiarFormulario);
(async function init() {
  try {
    await cargarClientesSelect();
    await cargarFacturas();
  } catch (error) {
    showMessage(mensaje, error.message, "error");
  }
})();
