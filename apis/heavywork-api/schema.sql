-- Tabla de la copia en la nube de HeavyWork.
-- huella: SHA-256 del código (sin guiones y en mayúsculas). El código nunca se guarda.
-- datos: el mismo objeto que la copia de seguridad del móvil (cuaderno, sesiones, récords…).
CREATE TABLE IF NOT EXISTS copias (
    huella TEXT PRIMARY KEY,
    datos TEXT NOT NULL,
    creada INTEGER NOT NULL,
    actualizada INTEGER NOT NULL
);
