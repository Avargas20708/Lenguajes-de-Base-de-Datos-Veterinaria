const sql = require("mssql/msnodesqlv8");

let pool;

function clean(value, fallback = "") {
  return (value ?? fallback).toString().trim();
}

function buildServerName() {
  const host = clean(process.env.SQLSERVER_HOST, "localhost");
  const instance = clean(process.env.SQLSERVER_INSTANCE);
  const port = clean(process.env.SQLSERVER_PORT);

  if (port) return `${host},${port}`;
  if (instance) return `${host}\\${instance}`;
  return host;
}

function getSqlServerConfig() {
  const driver = clean(process.env.SQLSERVER_ODBC_DRIVER, "ODBC Driver 18 for SQL Server");
  const database = clean(process.env.SQLSERVER_DATABASE, "ClinicaVeterinaria");
  const trusted = clean(process.env.SQLSERVER_TRUSTED_CONNECTION, "true").toLowerCase() !== "false";
  const server = buildServerName();

  let connectionString =
    `Driver={${driver}};` +
    `Server=${server};` +
    `Database=${database};` +
    "Encrypt=no;" +
    "TrustServerCertificate=yes;";

  if (trusted) {
    connectionString += "Trusted_Connection=Yes;";
  } else {
    const user = clean(process.env.SQLSERVER_USER);
    const password = clean(process.env.SQLSERVER_PASSWORD);
    connectionString += `Uid=${user};Pwd=${password};`;
  }

  return {
    driver: "msnodesqlv8",
    connectionString,
    requestTimeout: 30000,
    connectionTimeout: 30000,
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
  };
}

async function getConnection() {
  if (!pool) {
    pool = await sql.connect(getSqlServerConfig());
  }
  return pool;
}

function normalizeParamName(key) {
  return key.replace(/^@/, "");
}

async function runProcedure(procedureName, params = {}) {
  const conn = await getConnection();
  const request = conn.request();
  Object.entries(params).forEach(([key, value]) => request.input(normalizeParamName(key), value));
  const result = await request.execute(procedureName);
  return {
    rows: result.recordset || [],
    rowsAffected: (result.rowsAffected || []).reduce((acc, n) => acc + n, 0),
    output: result.output || {}
  };
}

async function testConnection() {
  const conn = await getConnection();
  const result = await conn.request().query("SELECT 1 AS ok");
  return result.recordset?.[0]?.ok === 1;
}

async function closeConnection() {
  if (pool) {
    await pool.close();
    pool = null;
  }
}

module.exports = { getConnection, runProcedure, testConnection, closeConnection, getSqlServerConfig };
