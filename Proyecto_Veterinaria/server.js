require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("node:path");
const { exec } = require("node:child_process");
const { runProcedure, testConnection } = require("./db");

const app = express();
const PORT = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

function toNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function toStringSafe(value) {
  return (value ?? "").toString().trim();
}

function requiredFields(res, fields) {
  const missing = Object.entries(fields)
    .filter(([, value]) => value === undefined || value === null || value === "")
    .map(([key]) => key);

  if (missing.length > 0) {
    res.status(400).json({ ok: false, error: `Faltan campos obligatorios: ${missing.join(", ")}` });
    return false;
  }
  return true;
}

function getFriendlyError(error) {
  const message = error?.message || "";

  if (/Could not connect|Failed to connect|ESOCKET|ETIMEOUT/i.test(message)) {
    return "No se pudo conectar a SQL Server. Verifique que SQL Server esté encendido y que los datos del archivo .env sean correctos.";
  }
  if (/Login failed/i.test(message)) {
    return "No se pudo iniciar sesión en SQL Server. Revise usuario, contraseña o autenticación Windows en el archivo .env.";
  }
  if (/Could not find stored procedure|Invalid object name/i.test(message)) {
    return "La base de datos no tiene las tablas o procedimientos requeridos. Ejecute database/sqlserver_init_mejorado.sql en SQL Server.";
  }
  if (/Violation of PRIMARY KEY|duplicate key/i.test(message)) {
    return "Ya existe un registro con ese ID. Ingrese un ID diferente.";
  }
  if (/FOREIGN KEY/i.test(message)) {
    return "No se puede completar la operación porque el registro está relacionado con otra tabla o el ID seleccionado no existe.";
  }
  return message || "Error interno del servidor.";
}

function asyncHandler(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error("Error en API:", error);
      res.status(500).json({ ok: false, error: getFriendlyError(error) });
    }
  };
}

function openBrowser() {
  const shouldOpen = String(process.env.AUTO_OPEN_BROWSER || "true").toLowerCase() === "true";
  if (!shouldOpen) return;

  const url = `http://localhost:${PORT}`;
  const platform = process.platform;
  const command = platform === "win32" ? `start "" "${url}"` : platform === "darwin" ? `open "${url}"` : `xdg-open "${url}"`;

  exec(command, (error) => {
    if (error) console.log(`Abra manualmente: ${url}`);
  });
}

app.get("/api/health", asyncHandler(async (_req, res) => {
  const db = await testConnection();
  res.json({ ok: true, api: "activa", database: db ? "conectada" : "sin conexión" });
}));

// CLIENTES
app.get("/api/clientes", asyncHandler(async (_req, res) => {
  const result = await runProcedure("sp_listar_clientes");
  res.json({ ok: true, data: result.rows });
}));

app.post("/api/clientes", asyncHandler(async (req, res) => {
  const payload = {
    id: toNumber(req.body.id),
    nombre: toStringSafe(req.body.nombre),
    apellido: toStringSafe(req.body.apellido),
    telefono: toStringSafe(req.body.telefono)
  };
  if (!requiredFields(res, payload)) return;
  await runProcedure("sp_insertar_cliente", payload);
  res.json({ ok: true, mensaje: "Cliente guardado correctamente." });
}));

app.put("/api/clientes/:id", asyncHandler(async (req, res) => {
  const payload = {
    id: toNumber(req.params.id),
    nombre: toStringSafe(req.body.nombre),
    apellido: toStringSafe(req.body.apellido),
    telefono: toStringSafe(req.body.telefono)
  };
  if (!requiredFields(res, payload)) return;
  const result = await runProcedure("sp_actualizar_cliente", payload);
  if (result.rowsAffected === 0) return res.status(404).json({ ok: false, error: "Cliente no encontrado." });
  res.json({ ok: true, mensaje: "Cliente actualizado correctamente." });
}));

app.delete("/api/clientes/:id", asyncHandler(async (req, res) => {
  const id = toNumber(req.params.id);
  if (!requiredFields(res, { id })) return;
  const result = await runProcedure("sp_eliminar_cliente", { id });
  if (result.rowsAffected === 0) return res.status(404).json({ ok: false, error: "Cliente no encontrado." });
  res.json({ ok: true, mensaje: "Cliente eliminado correctamente." });
}));

// MASCOTAS
app.get("/api/mascotas", asyncHandler(async (_req, res) => {
  const result = await runProcedure("sp_listar_mascotas");
  res.json({ ok: true, data: result.rows });
}));

app.post("/api/mascotas", asyncHandler(async (req, res) => {
  const payload = {
    id: toNumber(req.body.id),
    nombre: toStringSafe(req.body.nombre),
    especie: toStringSafe(req.body.especie),
    raza: toStringSafe(req.body.raza),
    edad: toNumber(req.body.edad),
    cliente_id: toNumber(req.body.cliente_id)
  };
  if (!requiredFields(res, payload)) return;
  await runProcedure("sp_insertar_mascota", payload);
  res.json({ ok: true, mensaje: "Mascota guardada correctamente." });
}));

app.put("/api/mascotas/:id", asyncHandler(async (req, res) => {
  const payload = {
    id: toNumber(req.params.id),
    nombre: toStringSafe(req.body.nombre),
    especie: toStringSafe(req.body.especie),
    raza: toStringSafe(req.body.raza),
    edad: toNumber(req.body.edad),
    cliente_id: toNumber(req.body.cliente_id)
  };
  if (!requiredFields(res, payload)) return;
  const result = await runProcedure("sp_actualizar_mascota", payload);
  if (result.rowsAffected === 0) return res.status(404).json({ ok: false, error: "Mascota no encontrada." });
  res.json({ ok: true, mensaje: "Mascota actualizada correctamente." });
}));

app.delete("/api/mascotas/:id", asyncHandler(async (req, res) => {
  const id = toNumber(req.params.id);
  if (!requiredFields(res, { id })) return;
  const result = await runProcedure("sp_eliminar_mascota", { id });
  if (result.rowsAffected === 0) return res.status(404).json({ ok: false, error: "Mascota no encontrada." });
  res.json({ ok: true, mensaje: "Mascota eliminada correctamente." });
}));

// CITAS
app.get("/api/citas", asyncHandler(async (_req, res) => {
  const result = await runProcedure("sp_listar_citas");
  res.json({ ok: true, data: result.rows });
}));

app.post("/api/citas", asyncHandler(async (req, res) => {
  const payload = {
    id: toNumber(req.body.id),
    fecha: toStringSafe(req.body.fecha),
    motivo: toStringSafe(req.body.motivo),
    mascota_id: toNumber(req.body.mascota_id)
  };
  if (!requiredFields(res, payload)) return;
  await runProcedure("sp_crear_cita", payload);
  res.json({ ok: true, mensaje: "Cita guardada correctamente." });
}));

app.put("/api/citas/:id", asyncHandler(async (req, res) => {
  const payload = {
    id: toNumber(req.params.id),
    fecha: toStringSafe(req.body.fecha),
    motivo: toStringSafe(req.body.motivo),
    mascota_id: toNumber(req.body.mascota_id)
  };
  if (!requiredFields(res, payload)) return;
  const result = await runProcedure("sp_actualizar_cita", payload);
  if (result.rowsAffected === 0) return res.status(404).json({ ok: false, error: "Cita no encontrada." });
  res.json({ ok: true, mensaje: "Cita actualizada correctamente." });
}));

app.delete("/api/citas/:id", asyncHandler(async (req, res) => {
  const id = toNumber(req.params.id);
  if (!requiredFields(res, { id })) return;
  const result = await runProcedure("sp_cancelar_cita", { id });
  if (result.rowsAffected === 0) return res.status(404).json({ ok: false, error: "Cita no encontrada." });
  res.json({ ok: true, mensaje: "Cita eliminada correctamente." });
}));

// HISTORIAL CLINICO
app.get("/api/historial", asyncHandler(async (_req, res) => {
  const result = await runProcedure("sp_listar_historial");
  res.json({ ok: true, data: result.rows });
}));

app.post("/api/historial", asyncHandler(async (req, res) => {
  const payload = {
    id: toNumber(req.body.id),
    diagnostico: toStringSafe(req.body.diagnostico),
    tratamiento: toStringSafe(req.body.tratamiento),
    mascota_id: toNumber(req.body.mascota_id)
  };
  if (!requiredFields(res, payload)) return;
  await runProcedure("sp_insertar_historial", payload);
  res.json({ ok: true, mensaje: "Historial clínico guardado correctamente." });
}));

app.put("/api/historial/:id", asyncHandler(async (req, res) => {
  const payload = {
    id: toNumber(req.params.id),
    diagnostico: toStringSafe(req.body.diagnostico),
    tratamiento: toStringSafe(req.body.tratamiento),
    mascota_id: toNumber(req.body.mascota_id)
  };
  if (!requiredFields(res, payload)) return;
  const result = await runProcedure("sp_actualizar_historial", payload);
  if (result.rowsAffected === 0) return res.status(404).json({ ok: false, error: "Historial no encontrado." });
  res.json({ ok: true, mensaje: "Historial clínico actualizado correctamente." });
}));

app.delete("/api/historial/:id", asyncHandler(async (req, res) => {
  const id = toNumber(req.params.id);
  if (!requiredFields(res, { id })) return;
  const result = await runProcedure("sp_eliminar_historial", { id });
  if (result.rowsAffected === 0) return res.status(404).json({ ok: false, error: "Historial no encontrado." });
  res.json({ ok: true, mensaje: "Historial clínico eliminado correctamente." });
}));

// FACTURAS
app.get("/api/facturas", asyncHandler(async (_req, res) => {
  const result = await runProcedure("sp_listar_facturas");
  res.json({ ok: true, data: result.rows });
}));

app.post("/api/facturas", asyncHandler(async (req, res) => {
  const payload = {
    id: toNumber(req.body.id),
    fecha: toStringSafe(req.body.fecha),
    total: toNumber(req.body.total),
    cliente_id: toNumber(req.body.cliente_id)
  };
  if (!requiredFields(res, payload)) return;
  await runProcedure("sp_generar_factura", payload);
  res.json({ ok: true, mensaje: "Factura guardada correctamente." });
}));

app.put("/api/facturas/:id", asyncHandler(async (req, res) => {
  const payload = {
    id: toNumber(req.params.id),
    fecha: toStringSafe(req.body.fecha),
    total: toNumber(req.body.total),
    cliente_id: toNumber(req.body.cliente_id)
  };
  if (!requiredFields(res, payload)) return;
  const result = await runProcedure("sp_actualizar_factura", payload);
  if (result.rowsAffected === 0) return res.status(404).json({ ok: false, error: "Factura no encontrada." });
  res.json({ ok: true, mensaje: "Factura actualizada correctamente." });
}));

app.delete("/api/facturas/:id", asyncHandler(async (req, res) => {
  const id = toNumber(req.params.id);
  if (!requiredFields(res, { id })) return;
  const result = await runProcedure("sp_eliminar_factura", { id });
  if (result.rowsAffected === 0) return res.status(404).json({ ok: false, error: "Factura no encontrada." });
  res.json({ ok: true, mensaje: "Factura eliminada correctamente." });
}));

app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, async () => {
  console.log("============================================");
  console.log(`Happy Pet ejecutándose en http://localhost:${PORT}`);
  console.log("============================================");
  try {
    await testConnection();
    console.log("Conexión con SQL Server verificada correctamente.");
  } catch (error) {
    console.error("Advertencia: no se pudo validar SQL Server:", getFriendlyError(error));
    console.error("Ejecute database/sqlserver_init_mejorado.sql y revise el archivo .env.");
  }
  openBrowser();
});
