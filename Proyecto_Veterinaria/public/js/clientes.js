const form = document.getElementById("formCliente");
const tabla = document.getElementById("tablaClientes");
const mensaje = document.getElementById("mensaje");
const btnCancelar = document.getElementById("btnCancelar");
let editando = false;
let idEditando = null;
let clientesCache = [];

function limpiarFormulario() {
  form.reset();
  document.getElementById("id").disabled = false;
  editando = false;
  idEditando = null;
}

async function cargarClientes() {
  try {
    const data = await apiRequest("/api/clientes");
    clientesCache = data.data || [];
    tabla.innerHTML = clientesCache.length
      ? clientesCache.map(c => `
        <tr>
          <td>${c.ID}</td>
          <td>${escapeHtml(c.NOMBRE)}</td>
          <td>${escapeHtml(c.APELLIDO)}</td>
          <td>${escapeHtml(c.TELEFONO)}</td>
          <td>
            <button class="btn btn-warning btn-small" data-edit="${c.ID}">Editar</button>
            <button class="btn btn-danger btn-small" data-delete="${c.ID}">Eliminar</button>
          </td>
        </tr>`).join("")
      : `<tr><td colspan="5" class="empty">No hay clientes registrados. Ingrese el primer cliente desde el formulario.</td></tr>`;
  } catch (error) {
    clientesCache = [];
    tabla.innerHTML = `<tr><td colspan="5" class="empty">No se pudieron cargar clientes desde la API.</td></tr>`;
    showMessage(mensaje, error.message || "Error al cargar clientes.", "error");
  }
}

function editarCliente(id) {
  const c = clientesCache.find(item => Number(item.ID) === Number(id));
  if (!c) return;
  document.getElementById("id").value = c.ID;
  document.getElementById("id").disabled = true;
  document.getElementById("nombre").value = c.NOMBRE;
  document.getElementById("apellido").value = c.APELLIDO;
  document.getElementById("telefono").value = c.TELEFONO;
  editando = true;
  idEditando = c.ID;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function eliminarCliente(id) {
  if (!confirm("¿Desea eliminar este cliente?")) return;
  try {
    const data = await apiRequest(`/api/clientes/${id}`, { method: "DELETE" });
    showMessage(mensaje, data.mensaje);
    await cargarClientes();
  } catch (error) {
    showMessage(mensaje, error.message, "error");
  }
}

tabla.addEventListener("click", event => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;
  if (editId) editarCliente(editId);
  if (deleteId) eliminarCliente(deleteId);
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  const payload = {
    id: document.getElementById("id").value,
    nombre: document.getElementById("nombre").value,
    apellido: document.getElementById("apellido").value,
    telefono: document.getElementById("telefono").value
  };
  try {
    const data = await apiRequest(editando ? `/api/clientes/${idEditando}` : "/api/clientes", {
      method: editando ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });
    showMessage(mensaje, data.mensaje);
    limpiarFormulario();
    await cargarClientes();
  } catch (error) {
    showMessage(mensaje, error.message, "error");
  }
});

btnCancelar.addEventListener("click", limpiarFormulario);
cargarClientes();
