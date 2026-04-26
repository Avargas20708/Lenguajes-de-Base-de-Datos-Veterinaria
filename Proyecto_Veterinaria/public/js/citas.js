const form = document.getElementById("formCita");
const tabla = document.getElementById("tablaCitas");
const mensaje = document.getElementById("mensaje");
const btnCancelar = document.getElementById("btnCancelar");
const mascotaSelect = document.getElementById("mascota_id");
let editando = false;
let idEditando = null;
let citasCache = [];

function limpiarFormulario() {
  form.reset();
  document.getElementById("id").disabled = false;
  editando = false;
  idEditando = null;
}

async function cargarMascotasSelect() {
  const data = await apiRequest("/api/mascotas");
  const mascotas = data.data || [];
  mascotaSelect.innerHTML = `<option value="">Seleccione una mascota</option>` +
    mascotas.map(m => `<option value="${m.ID}">${m.ID} - ${escapeHtml(m.NOMBRE)} (${escapeHtml(m.DUENO)})</option>`).join("");
}

async function cargarCitas() {
  try {
    const data = await apiRequest("/api/citas");
    citasCache = data.data || [];
    tabla.innerHTML = citasCache.length
      ? citasCache.map(c => `
        <tr>
          <td>${c.ID}</td>
          <td>${formatDateTime(c.FECHA)}</td>
          <td>${escapeHtml(c.MASCOTA)}</td>
          <td>${escapeHtml(c.DUENO)}</td>
          <td>${escapeHtml(c.MOTIVO)}</td>
          <td>
            <button class="btn btn-warning btn-small" data-edit="${c.ID}">Editar</button>
            <button class="btn btn-danger btn-small" data-delete="${c.ID}">Eliminar</button>
          </td>
        </tr>`).join("")
      : `<tr><td colspan="6" class="empty">No hay citas registradas. Cree primero cliente y mascota, luego agende la cita.</td></tr>`;
  } catch (error) {
    showMessage(mensaje, error.message, "error");
  }
}

function editarCita(id) {
  const c = citasCache.find(item => Number(item.ID) === Number(id));
  if (!c) return;
  document.getElementById("id").value = c.ID;
  document.getElementById("id").disabled = true;
  document.getElementById("fecha").value = toInputDateTime(c.FECHA);
  document.getElementById("motivo").value = c.MOTIVO;
  mascotaSelect.value = c.MASCOTA_ID;
  editando = true;
  idEditando = c.ID;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function eliminarCita(id) {
  if (!confirm("¿Desea eliminar esta cita?")) return;
  try {
    const data = await apiRequest(`/api/citas/${id}`, { method: "DELETE" });
    showMessage(mensaje, data.mensaje);
    await cargarCitas();
  } catch (error) {
    showMessage(mensaje, error.message, "error");
  }
}

tabla.addEventListener("click", event => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;
  if (editId) editarCita(editId);
  if (deleteId) eliminarCita(deleteId);
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  const payload = {
    id: document.getElementById("id").value,
    fecha: document.getElementById("fecha").value,
    motivo: document.getElementById("motivo").value,
    mascota_id: mascotaSelect.value
  };
  try {
    const data = await apiRequest(editando ? `/api/citas/${idEditando}` : "/api/citas", {
      method: editando ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });
    showMessage(mensaje, data.mensaje);
    limpiarFormulario();
    await cargarCitas();
  } catch (error) {
    showMessage(mensaje, error.message, "error");
  }
});

btnCancelar.addEventListener("click", limpiarFormulario);
(async function init() {
  try {
    await cargarMascotasSelect();
    await cargarCitas();
  } catch (error) {
    showMessage(mensaje, error.message, "error");
  }
})();
