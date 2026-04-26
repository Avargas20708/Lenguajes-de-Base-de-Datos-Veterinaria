/*============================================================
  HAPPY PET - CLINICA VETERINARIA
  Script SQL Server para proyecto universitario
  Incluye tablas, relaciones, procedimientos CRUD, vistas,
  funciones, triggers y cursor demostrativo.
============================================================*/

IF DB_ID('ClinicaVeterinaria') IS NULL
BEGIN
    CREATE DATABASE ClinicaVeterinaria;
END
GO

USE ClinicaVeterinaria;
GO

/*============================================================
  LIMPIEZA DE OBJETOS
============================================================*/
DROP TRIGGER IF EXISTS trg_historial_insert;
DROP TRIGGER IF EXISTS trg_cliente_insert;
DROP TRIGGER IF EXISTS trg_mascota_insert;
GO

DROP VIEW IF EXISTS vista_historial_mascotas;
DROP VIEW IF EXISTS vista_clientes_mascotas;
DROP VIEW IF EXISTS vista_citas_detalladas;
DROP VIEW IF EXISTS vista_facturas_clientes;
GO

DROP FUNCTION IF EXISTS fn_contar_mascotas;
DROP FUNCTION IF EXISTS fn_total_facturas_cliente;
DROP FUNCTION IF EXISTS fn_contar_citas;
GO

DROP PROCEDURE IF EXISTS sp_listar_clientes;
DROP PROCEDURE IF EXISTS sp_insertar_cliente;
DROP PROCEDURE IF EXISTS sp_actualizar_cliente;
DROP PROCEDURE IF EXISTS sp_eliminar_cliente;
DROP PROCEDURE IF EXISTS sp_listar_mascotas;
DROP PROCEDURE IF EXISTS sp_insertar_mascota;
DROP PROCEDURE IF EXISTS sp_actualizar_mascota;
DROP PROCEDURE IF EXISTS sp_eliminar_mascota;
DROP PROCEDURE IF EXISTS sp_listar_citas;
DROP PROCEDURE IF EXISTS sp_crear_cita;
DROP PROCEDURE IF EXISTS sp_actualizar_cita;
DROP PROCEDURE IF EXISTS sp_cancelar_cita;
DROP PROCEDURE IF EXISTS sp_listar_historial;
DROP PROCEDURE IF EXISTS sp_insertar_historial;
DROP PROCEDURE IF EXISTS sp_actualizar_historial;
DROP PROCEDURE IF EXISTS sp_eliminar_historial;
DROP PROCEDURE IF EXISTS sp_listar_facturas;
DROP PROCEDURE IF EXISTS sp_generar_factura;
DROP PROCEDURE IF EXISTS sp_actualizar_factura;
DROP PROCEDURE IF EXISTS sp_eliminar_factura;
GO

IF OBJECT_ID('dbo.HISTORIAL_CLINICO', 'U') IS NOT NULL DROP TABLE dbo.HISTORIAL_CLINICO;
IF OBJECT_ID('dbo.FACTURAS', 'U') IS NOT NULL DROP TABLE dbo.FACTURAS;
IF OBJECT_ID('dbo.CITAS', 'U') IS NOT NULL DROP TABLE dbo.CITAS;
IF OBJECT_ID('dbo.MASCOTAS', 'U') IS NOT NULL DROP TABLE dbo.MASCOTAS;
IF OBJECT_ID('dbo.CLIENTES', 'U') IS NOT NULL DROP TABLE dbo.CLIENTES;
GO

/*============================================================
  TABLAS
============================================================*/
CREATE TABLE CLIENTES(
    ID INT NOT NULL PRIMARY KEY,
    NOMBRE VARCHAR(50) NOT NULL,
    APELLIDO VARCHAR(50) NOT NULL,
    TELEFONO VARCHAR(20) NOT NULL
);
GO

CREATE TABLE MASCOTAS(
    ID INT NOT NULL PRIMARY KEY,
    NOMBRE VARCHAR(50) NOT NULL,
    ESPECIE VARCHAR(50) NOT NULL,
    RAZA VARCHAR(50) NOT NULL,
    EDAD INT NOT NULL CHECK (EDAD >= 0),
    CLIENTE_ID INT NOT NULL,
    CONSTRAINT FK_MASCOTAS_CLIENTES FOREIGN KEY (CLIENTE_ID) REFERENCES CLIENTES(ID)
);
GO

CREATE TABLE CITAS(
    ID INT NOT NULL PRIMARY KEY,
    FECHA DATETIME NOT NULL,
    MOTIVO VARCHAR(200) NOT NULL,
    MASCOTA_ID INT NOT NULL,
    CONSTRAINT FK_CITAS_MASCOTAS FOREIGN KEY (MASCOTA_ID) REFERENCES MASCOTAS(ID)
);
GO

CREATE TABLE HISTORIAL_CLINICO(
    ID INT NOT NULL PRIMARY KEY,
    DIAGNOSTICO VARCHAR(200) NOT NULL,
    TRATAMIENTO VARCHAR(200) NOT NULL,
    MASCOTA_ID INT NOT NULL,
    CONSTRAINT FK_HISTORIAL_MASCOTAS FOREIGN KEY (MASCOTA_ID) REFERENCES MASCOTAS(ID)
);
GO

CREATE TABLE FACTURAS(
    ID INT NOT NULL PRIMARY KEY,
    FECHA DATETIME NOT NULL,
    TOTAL DECIMAL(10,2) NOT NULL CHECK (TOTAL >= 0),
    CLIENTE_ID INT NOT NULL,
    CONSTRAINT FK_FACTURAS_CLIENTES FOREIGN KEY (CLIENTE_ID) REFERENCES CLIENTES(ID)
);
GO

/*============================================================
  PROCEDIMIENTOS CRUD - CLIENTES
============================================================*/
CREATE PROCEDURE sp_listar_clientes
AS
BEGIN
    SET NOCOUNT ON;
    SELECT ID, NOMBRE, APELLIDO, TELEFONO
    FROM CLIENTES
    ORDER BY ID;
END
GO

CREATE PROCEDURE sp_insertar_cliente
    @id INT,
    @nombre VARCHAR(50),
    @apellido VARCHAR(50),
    @telefono VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO CLIENTES (ID, NOMBRE, APELLIDO, TELEFONO)
    VALUES (@id, @nombre, @apellido, @telefono);
END
GO

CREATE PROCEDURE sp_actualizar_cliente
    @id INT,
    @nombre VARCHAR(50),
    @apellido VARCHAR(50),
    @telefono VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE CLIENTES
    SET NOMBRE = @nombre,
        APELLIDO = @apellido,
        TELEFONO = @telefono
    WHERE ID = @id;
END
GO

CREATE PROCEDURE sp_eliminar_cliente
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM CLIENTES WHERE ID = @id;
END
GO

/*============================================================
  PROCEDIMIENTOS CRUD - MASCOTAS
============================================================*/
CREATE PROCEDURE sp_listar_mascotas
AS
BEGIN
    SET NOCOUNT ON;
    SELECT M.ID, M.NOMBRE, M.ESPECIE, M.RAZA, M.EDAD, M.CLIENTE_ID,
           C.NOMBRE + ' ' + C.APELLIDO AS DUENO
    FROM MASCOTAS M
    INNER JOIN CLIENTES C ON C.ID = M.CLIENTE_ID
    ORDER BY M.ID;
END
GO

CREATE PROCEDURE sp_insertar_mascota
    @id INT,
    @nombre VARCHAR(50),
    @especie VARCHAR(50),
    @raza VARCHAR(50),
    @edad INT,
    @cliente_id INT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO MASCOTAS (ID, NOMBRE, ESPECIE, RAZA, EDAD, CLIENTE_ID)
    VALUES (@id, @nombre, @especie, @raza, @edad, @cliente_id);
END
GO

CREATE PROCEDURE sp_actualizar_mascota
    @id INT,
    @nombre VARCHAR(50),
    @especie VARCHAR(50),
    @raza VARCHAR(50),
    @edad INT,
    @cliente_id INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE MASCOTAS
    SET NOMBRE = @nombre,
        ESPECIE = @especie,
        RAZA = @raza,
        EDAD = @edad,
        CLIENTE_ID = @cliente_id
    WHERE ID = @id;
END
GO

CREATE PROCEDURE sp_eliminar_mascota
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM MASCOTAS WHERE ID = @id;
END
GO

/*============================================================
  PROCEDIMIENTOS CRUD - CITAS
============================================================*/
CREATE PROCEDURE sp_listar_citas
AS
BEGIN
    SET NOCOUNT ON;
    SELECT CI.ID, CI.FECHA, CI.MOTIVO, CI.MASCOTA_ID,
           M.NOMBRE AS MASCOTA,
           C.NOMBRE + ' ' + C.APELLIDO AS DUENO
    FROM CITAS CI
    INNER JOIN MASCOTAS M ON M.ID = CI.MASCOTA_ID
    INNER JOIN CLIENTES C ON C.ID = M.CLIENTE_ID
    ORDER BY CI.FECHA DESC, CI.ID DESC;
END
GO

CREATE PROCEDURE sp_crear_cita
    @id INT,
    @fecha DATETIME,
    @motivo VARCHAR(200),
    @mascota_id INT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO CITAS (ID, FECHA, MOTIVO, MASCOTA_ID)
    VALUES (@id, @fecha, @motivo, @mascota_id);
END
GO

CREATE PROCEDURE sp_actualizar_cita
    @id INT,
    @fecha DATETIME,
    @motivo VARCHAR(200),
    @mascota_id INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE CITAS
    SET FECHA = @fecha,
        MOTIVO = @motivo,
        MASCOTA_ID = @mascota_id
    WHERE ID = @id;
END
GO

CREATE PROCEDURE sp_cancelar_cita
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM CITAS WHERE ID = @id;
END
GO

/*============================================================
  PROCEDIMIENTOS CRUD - HISTORIAL CLINICO
============================================================*/
CREATE PROCEDURE sp_listar_historial
AS
BEGIN
    SET NOCOUNT ON;
    SELECT H.ID, H.DIAGNOSTICO, H.TRATAMIENTO, H.MASCOTA_ID,
           M.NOMBRE AS MASCOTA,
           C.NOMBRE + ' ' + C.APELLIDO AS DUENO
    FROM HISTORIAL_CLINICO H
    INNER JOIN MASCOTAS M ON M.ID = H.MASCOTA_ID
    INNER JOIN CLIENTES C ON C.ID = M.CLIENTE_ID
    ORDER BY H.ID;
END
GO

CREATE PROCEDURE sp_insertar_historial
    @id INT,
    @diagnostico VARCHAR(200),
    @tratamiento VARCHAR(200),
    @mascota_id INT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO HISTORIAL_CLINICO (ID, DIAGNOSTICO, TRATAMIENTO, MASCOTA_ID)
    VALUES (@id, @diagnostico, @tratamiento, @mascota_id);
END
GO

CREATE PROCEDURE sp_actualizar_historial
    @id INT,
    @diagnostico VARCHAR(200),
    @tratamiento VARCHAR(200),
    @mascota_id INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE HISTORIAL_CLINICO
    SET DIAGNOSTICO = @diagnostico,
        TRATAMIENTO = @tratamiento,
        MASCOTA_ID = @mascota_id
    WHERE ID = @id;
END
GO

CREATE PROCEDURE sp_eliminar_historial
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM HISTORIAL_CLINICO WHERE ID = @id;
END
GO

/*============================================================
  PROCEDIMIENTOS CRUD - FACTURAS
============================================================*/
CREATE PROCEDURE sp_listar_facturas
AS
BEGIN
    SET NOCOUNT ON;
    SELECT F.ID, F.FECHA, F.TOTAL, F.CLIENTE_ID,
           C.NOMBRE + ' ' + C.APELLIDO AS CLIENTE
    FROM FACTURAS F
    INNER JOIN CLIENTES C ON C.ID = F.CLIENTE_ID
    ORDER BY F.FECHA DESC, F.ID DESC;
END
GO

CREATE PROCEDURE sp_generar_factura
    @id INT,
    @fecha DATETIME,
    @total DECIMAL(10,2),
    @cliente_id INT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO FACTURAS (ID, FECHA, TOTAL, CLIENTE_ID)
    VALUES (@id, @fecha, @total, @cliente_id);
END
GO

CREATE PROCEDURE sp_actualizar_factura
    @id INT,
    @fecha DATETIME,
    @total DECIMAL(10,2),
    @cliente_id INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE FACTURAS
    SET FECHA = @fecha,
        TOTAL = @total,
        CLIENTE_ID = @cliente_id
    WHERE ID = @id;
END
GO

CREATE PROCEDURE sp_eliminar_factura
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM FACTURAS WHERE ID = @id;
END
GO

/*============================================================
  VISTAS
============================================================*/
CREATE VIEW vista_historial_mascotas AS
SELECT M.NOMBRE AS MASCOTA, H.DIAGNOSTICO, H.TRATAMIENTO
FROM MASCOTAS M
JOIN HISTORIAL_CLINICO H ON M.ID = H.MASCOTA_ID;
GO

CREATE VIEW vista_clientes_mascotas AS
SELECT C.NOMBRE, C.APELLIDO, M.NOMBRE AS MASCOTA
FROM CLIENTES C
JOIN MASCOTAS M ON C.ID = M.CLIENTE_ID;
GO

CREATE VIEW vista_citas_detalladas AS
SELECT C.ID, C.FECHA, C.MOTIVO, M.NOMBRE AS MASCOTA
FROM CITAS C
JOIN MASCOTAS M ON C.MASCOTA_ID = M.ID;
GO

CREATE VIEW vista_facturas_clientes AS
SELECT C.NOMBRE, C.APELLIDO, F.TOTAL
FROM CLIENTES C
JOIN FACTURAS F ON C.ID = F.CLIENTE_ID;
GO

/*============================================================
  FUNCIONES
============================================================*/
CREATE FUNCTION fn_contar_mascotas(@cliente_id INT)
RETURNS INT
AS
BEGIN
    DECLARE @total INT;
    SELECT @total = COUNT(*) FROM MASCOTAS WHERE CLIENTE_ID = @cliente_id;
    RETURN ISNULL(@total, 0);
END
GO

CREATE FUNCTION fn_total_facturas_cliente(@cliente_id INT)
RETURNS DECIMAL(10,2)
AS
BEGIN
    DECLARE @total DECIMAL(10,2);
    SELECT @total = SUM(TOTAL) FROM FACTURAS WHERE CLIENTE_ID = @cliente_id;
    RETURN ISNULL(@total, 0);
END
GO

CREATE FUNCTION fn_contar_citas(@mascota_id INT)
RETURNS INT
AS
BEGIN
    DECLARE @total INT;
    SELECT @total = COUNT(*) FROM CITAS WHERE MASCOTA_ID = @mascota_id;
    RETURN ISNULL(@total, 0);
END
GO

/*============================================================
  TRIGGERS
============================================================*/
CREATE TRIGGER trg_historial_insert
ON HISTORIAL_CLINICO
AFTER INSERT
AS
BEGIN
    PRINT 'Nuevo historial clínico registrado';
END
GO

CREATE TRIGGER trg_cliente_insert
ON CLIENTES
AFTER INSERT
AS
BEGIN
    PRINT 'Nuevo cliente registrado';
END
GO

CREATE TRIGGER trg_mascota_insert
ON MASCOTAS
AFTER INSERT
AS
BEGIN
    PRINT 'Nueva mascota registrada';
END
GO

/*============================================================
  CURSOR DEMOSTRATIVO
============================================================*/
DECLARE cursor_clientes CURSOR FOR
SELECT NOMBRE, APELLIDO FROM CLIENTES;

DECLARE @nombre VARCHAR(50);
DECLARE @apellido VARCHAR(50);

OPEN cursor_clientes;
FETCH NEXT FROM cursor_clientes INTO @nombre, @apellido;

WHILE @@FETCH_STATUS = 0
BEGIN
    PRINT @nombre + ' ' + @apellido;
    FETCH NEXT FROM cursor_clientes INTO @nombre, @apellido;
END

CLOSE cursor_clientes;
DEALLOCATE cursor_clientes;
GO
