const form = document.getElementById("formMascota");
const tabla = document.getElementById("tablaMascotas");
const mensaje = document.getElementById("mensaje");
const btnCancelar = document.getElementById("btnCancelar");
const clienteSelect = document.getElementById("cliente_id");
let editando = false;
let idEditando = null;
let mascotasCache = [];

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

async function cargarMascotas() {
  try {
    const data = await apiRequest("/api/mascotas");
    mascotasCache = data.data || [];
    tabla.innerHTML = mascotasCache.length
      ? mascotasCache.map(m => `
        <tr>
          <td>${m.ID}</td>
          <td>${escapeHtml(m.NOMBRE)}</td>
          <td>${escapeHtml(m.ESPECIE)}</td>
          <td>${escapeHtml(m.RAZA)}</td>
          <td>${m.EDAD}</td>
          <td>${escapeHtml(m.DUENO)}</td>
          <td>
            <button class="btn btn-warning btn-small" data-edit="${m.ID}">Editar</button>
            <button class="btn btn-danger btn-small" data-delete="${m.ID}">Eliminar</button>
          </td>
        </tr>`).join("")
      : `<tr><td colspan="7" class="empty">No hay mascotas registradas. Primero cree un cliente y luego registre su mascota.</td></tr>`;
  } catch (error) {
    showMessage(mensaje, error.message || "Error al cargar mascotas.", "error");
  }
}

function editarMascota(id) {
  const m = mascotasCache.find(item => Number(item.ID) === Number(id));
  if (!m) return;
  document.getElementById("id").value = m.ID;
  document.getElementById("id").disabled = true;
  document.getElementById("nombre").value = m.NOMBRE;
  document.getElementById("especie").value = m.ESPECIE;
  document.getElementById("raza").value = m.RAZA;
  document.getElementById("edad").value = m.EDAD;
  clienteSelect.value = m.CLIENTE_ID;
  editando = true;
  idEditando = m.ID;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function eliminarMascota(id) {
  if (!confirm("¿Desea eliminar esta mascota?")) return;
  try {
    const data = await apiRequest(`/api/mascotas/${id}`, { method: "DELETE" });
    showMessage(mensaje, data.mensaje);
    await cargarMascotas();
  } catch (error) {
    showMessage(mensaje, error.message, "error");
  }
}

tabla.addEventListener("click", event => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;
  if (editId) editarMascota(editId);
  if (deleteId) eliminarMascota(deleteId);
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  const payload = {
    id: document.getElementById("id").value,
    nombre: document.getElementById("nombre").value,
    especie: document.getElementById("especie").value,
    raza: document.getElementById("raza").value,
    edad: document.getElementById("edad").value,
    cliente_id: clienteSelect.value
  };
  try {
    const data = await apiRequest(editando ? `/api/mascotas/${idEditando}` : "/api/mascotas", {
      method: editando ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });
    showMessage(mensaje, data.mensaje);
    limpiarFormulario();
    await cargarMascotas();
  } catch (error) {
    showMessage(mensaje, error.message, "error");
  }
});

btnCancelar.addEventListener("click", limpiarFormulario);
(async function init() {
  try {
    await cargarClientesSelect();
    await cargarMascotas();
  } catch (error) {
    showMessage(mensaje, error.message, "error");
  }
})();
