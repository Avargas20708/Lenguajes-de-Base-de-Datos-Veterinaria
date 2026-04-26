const form = document.getElementById("formHistorial");
const tabla = document.getElementById("tablaHistorial");
const mensaje = document.getElementById("mensaje");
const btnCancelar = document.getElementById("btnCancelar");
const mascotaSelect = document.getElementById("mascota_id");
let editando = false;
let idEditando = null;
let historialCache = [];

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

async function cargarHistorial() {
  try {
    const data = await apiRequest("/api/historial");
    historialCache = data.data || [];
    tabla.innerHTML = historialCache.length
      ? historialCache.map(h => `
        <tr>
          <td>${h.ID}</td>
          <td>${escapeHtml(h.MASCOTA)}</td>
          <td>${escapeHtml(h.DUENO)}</td>
          <td>${escapeHtml(h.DIAGNOSTICO)}</td>
          <td>${escapeHtml(h.TRATAMIENTO)}</td>
          <td>
            <button class="btn btn-warning btn-small" data-edit="${h.ID}">Editar</button>
            <button class="btn btn-danger btn-small" data-delete="${h.ID}">Eliminar</button>
          </td>
        </tr>`).join("")
      : `<tr><td colspan="6" class="empty">No hay historiales registrados.</td></tr>`;
  } catch (error) {
    showMessage(mensaje, error.message, "error");
  }
}

function editarHistorial(id) {
  const h = historialCache.find(item => Number(item.ID) === Number(id));
  if (!h) return;
  document.getElementById("id").value = h.ID;
  document.getElementById("id").disabled = true;
  document.getElementById("diagnostico").value = h.DIAGNOSTICO;
  document.getElementById("tratamiento").value = h.TRATAMIENTO;
  mascotaSelect.value = h.MASCOTA_ID;
  editando = true;
  idEditando = h.ID;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function eliminarHistorial(id) {
  if (!confirm("¿Desea eliminar este historial?")) return;
  try {
    const data = await apiRequest(`/api/historial/${id}`, { method: "DELETE" });
    showMessage(mensaje, data.mensaje);
    await cargarHistorial();
  } catch (error) {
    showMessage(mensaje, error.message, "error");
  }
}

tabla.addEventListener("click", event => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;
  if (editId) editarHistorial(editId);
  if (deleteId) eliminarHistorial(deleteId);
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  const payload = {
    id: document.getElementById("id").value,
    diagnostico: document.getElementById("diagnostico").value,
    tratamiento: document.getElementById("tratamiento").value,
    mascota_id: mascotaSelect.value
  };
  try {
    const data = await apiRequest(editando ? `/api/historial/${idEditando}` : "/api/historial", {
      method: editando ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });
    showMessage(mensaje, data.mensaje);
    limpiarFormulario();
    await cargarHistorial();
  } catch (error) {
    showMessage(mensaje, error.message, "error");
  }
});

btnCancelar.addEventListener("click", limpiarFormulario);
(async function init() {
  try {
    await cargarMascotasSelect();
    await cargarHistorial();
  } catch (error) {
    showMessage(mensaje, error.message, "error");
  }
})();
