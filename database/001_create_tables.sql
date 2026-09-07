-- =============================================
-- AVL Transport System - Database Schema
-- SQL Server
-- =============================================

-- Create database if not exists
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'AVLTransport')
BEGIN
    CREATE DATABASE AVLTransport;
END
GO

USE AVLTransport;
GO

-- =============================================
-- Table: Vehiculo
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Vehiculo')
BEGIN
    CREATE TABLE Vehiculo (
        Id          INT PRIMARY KEY IDENTITY(1,1),
        Patente     VARCHAR(10)   NOT NULL,
        Servicio    VARCHAR(10)   NOT NULL
    );
END
GO

-- =============================================
-- Table: Ruta
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Ruta')
BEGIN
    CREATE TABLE Ruta (
        Id          INT PRIMARY KEY IDENTITY(1,1),
        Servicio    VARCHAR(10)   NOT NULL,
        Orden       INT           NOT NULL,
        Latitud     FLOAT         NOT NULL,
        Longitud    FLOAT         NOT NULL
    );
END
GO

-- =============================================
-- Table: GPS_Posicion
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'GPS_Posicion')
BEGIN
    CREATE TABLE GPS_Posicion (
        Id          INT PRIMARY KEY IDENTITY(1,1),
        VehiculoId  INT           NOT NULL,
        FechaHora   DATETIME2     NOT NULL DEFAULT GETDATE(),
        Latitud     FLOAT         NOT NULL,
        Longitud    FLOAT         NOT NULL,
        Velocidad   FLOAT         NOT NULL DEFAULT 0,
        CONSTRAINT FK_GPS_Vehiculo FOREIGN KEY (VehiculoId) REFERENCES Vehiculo(Id)
    );
END
GO

PRINT 'Schema created successfully.';
GO
