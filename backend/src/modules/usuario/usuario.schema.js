const { z } = require('zod');

// A diferencia de rol.schema.js, acá no se valida `roles` contra un enum --
// un usuario puede tener el reservado `ADMIN` (nunca una fila real en
// `roles`) o cualquier nombre de rol creado desde Accesos > Roles, y ese
// catálogo cambia en producción sin release. rol.service.js#create ya
// rechaza nombres reservados nuevos; un nombre de rol que no exista todavía
// en `roles` simplemente no otorga ningún permiso (ver tienePermiso), no
// hace falta rechazarlo acá.
const createSchema = z.object({
  nombre: z.string().min(1).max(200),
  email: z.string().email(),
  password: z.string().min(1),
  roles: z.array(z.string()).default([]),
});

const updateSchema = z.object({
  nombre: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  roles: z.array(z.string()).optional(),
  password: z.string().min(1).nullable().optional(),
  activo: z.boolean().optional(),
});

module.exports = { createSchema, updateSchema };
