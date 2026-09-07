-- =============================================
-- AVL Transport System - Seed Data
-- Vehiculo de prueba + Ruta servicio 503
-- Ruta: Temuco centro (Chile) - 12 puntos
-- =============================================

USE AVLTransport;
GO

-- Vehiculo de prueba
IF NOT EXISTS (SELECT 1 FROM Vehiculo WHERE Patente = 'SIM-001')
BEGIN
    INSERT INTO Vehiculo (Patente, Servicio) VALUES ('SIM-001', '503');
END
GO

-- Ruta servicio 503 - 12 puntos en Temuco
DELETE FROM Ruta WHERE Servicio = '503';

INSERT INTO Ruta (Servicio, Orden, Latitud, Longitud) VALUES
('503', 1,  -38.7350, -72.5900),
('503', 2,  -38.7355, -72.5920),
('503', 3,  -38.7365, -72.5935),
('503', 4,  -38.7375, -72.5950),
('503', 5,  -38.7385, -72.5960),
('503', 6,  -38.7395, -72.5975),
('503', 7,  -38.7405, -72.5985),
('503', 8,  -38.7415, -72.6000),
('503', 9,  -38.7425, -72.6015),
('503', 10, -38.7435, -72.6025),
('503', 11, -38.7445, -72.6040),
('503', 12, -38.7455, -72.6055);
GO

PRINT 'Seed data inserted successfully.';
GO
