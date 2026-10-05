const { z } = require('zod');
const { MODULOS_VALIDOS } = require('../../config/modulos');

const createSchema = z.object({
  nombre: z.string().min(1).max(30),
  permisos: z.array(z.enum(MODULOS_VALIDOS)).default([]),
});

// La ruta identifica el rol por :id (no por :nombre) -- nombre y permisos
// son editables los dos.
const updateSchema = z.object({
  nombre: z.string().min(1).max(30).optional(),
  permisos: z.array(z.enum(MODULOS_VALIDOS)).optional(),
});

module.exports = { createSchema, updateSchema };
