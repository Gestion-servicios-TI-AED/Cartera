// "Todas las variables" del detalle de un inmueble de Baía Kristal: qué campos
// del Product de Zoho NO se muestran, cómo se llaman los que sí y en qué
// SECCIÓN del detalle aparecen. Solo afecta la pantalla -- los datos siguen
// completos en la base y en el sync (Jefe Gabriel, 2026-10-07). Zoho entrega
// los nombres internos sin tildes ni ñ ("C_digo_inmueble", "No_Ba_os"), por
// eso cada etiqueta se escribe aquí; una variable nueva sin etiqueta cae a
// `toLabel()` y nunca desaparece (y sin grupo, cae a la sección "Otros").

// Campos de sistema/operación que no aportan en esta vista.
export const VARIABLES_OCULTAS = new Set([
  'Pais', 'Owner', 'hauzd', 'Ciudad', 'Layout',
  'Alianza', 'Taxable', 'rev_opx', 'Locked__s',
  'Created_By', 'Modified_By', 'Qty_Ordered', 'Zona_Barrio',
  'Created_Time', 'Departamento', 'Etapa_PRUEBA', 'Fiducolombia', 'Qty_in_Stock', 'Inmueble_Caja',
  'Modified_Time', 'Qty_in_Demand', 'Reorder_Level', 'Inmueble_Socio', 'Product_Active',
  'Last_Activity_Time', 'Direccion_Info_Privada', 'Validaci_n_Vendor_name',
  'Volante_Recaudo_Inmueble', 'Link_Para_Pagos_Con_Tarjeta_de_Credito',
  // Project_Code ya no se usa en la app: lo reemplaza la "Nomenclatura completa".
  'Project_Code',
]);

// === SECCIONES DEL DETALLE ===
// Orden en que se muestran las secciones en la pantalla (flujo típico de
// revisión: qué es -> qué tan grande -> cómo es -> en qué estado -> plata ->
// contexto comercial -> documentos -> lo que sobre).
export const GRUPOS_ORDEN = [
  'identificacion',
  'areas',
  'caracteristicas',
  'estado',
  'financiero',
  'proyecto',
  'referencia',
  'otros',
];

// Título legible de cada sección.
export const GRUPOS_TITULOS = {
  identificacion: 'Identificación',
  areas: 'Áreas y dimensiones',
  caracteristicas: 'Características del apartamento',
  estado: 'Estado',
  financiero: 'Información financiera',
  proyecto: 'Proyecto y comercial',
  referencia: 'Referencias y documentación',
  otros: 'Otros',
};

// Zoho escribe los keys sin tildes, pero por robustez la comparación se hace
// en minúsculas y sin acentos (así "Código_inmueble" y "C_digo_inmueble" no
// son dos cosas distintas para el lookup -- el segundo es el real).
function normalizarKey(key) {
  return key.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Mapa key(normalizado) -> sección. Los keys reales son los de ETIQUETAS
// ("C_digo_inmueble", "No_Ba_os", "Product_Name"…); se agregan alias por si
// algún registro trae el acento restaurado ("codigo_inmueble", "no_banos").
// OJO: un key repetido pisa al anterior -- cada variable va en UN solo grupo.
const GRUPO_POR_VARIABLE = new Map([
  // ── Identificación (qué es y dónde está) ──
  ['__nomenclatura_completa__', 'identificacion'],
  ['c_digo_inmueble', 'identificacion'],
  ['codigo_inmueble', 'identificacion'],
  ['product_name', 'identificacion'],
  ['nombre', 'identificacion'],
  ['product_category', 'identificacion'],
  ['proyecto', 'identificacion'],
  ['proyecto_torre', 'identificacion'],
  ['block_tower', 'identificacion'],
  ['piso', 'identificacion'],
  ['description', 'identificacion'],
  ['id', 'identificacion'],

  // ── Áreas y dimensiones (solo tamaños físicos en m²) ──
  ['area_construida_en_m2', 'areas'],
  ['area_construida_m2_v2_rp', 'areas'],
  ['area_mezzanine_en_m2_texto', 'areas'],
  ['area_mezzanine_m2', 'areas'],
  ['area_primer_piso_m2', 'areas'],
  ['area_privada_en_m2', 'areas'],
  ['area_privada_m2_rp', 'areas'],
  ['area_terraza_en_m2', 'areas'],
  ['area_terraza_m2_rp', 'areas'],
  ['area_zona_verde', 'areas'],
  ['m2_isla', 'areas'],

  // ── Características del apartamento ──
  ['no_alcobas', 'caracteristicas'],
  ['no_ba_os', 'caracteristicas'],
  ['no_banos', 'caracteristicas'],
  ['no_aires_acondicionados', 'caracteristicas'],
  ['tipo_apto', 'caracteristicas'],
  ['tipo_apto_arquitectura', 'caracteristicas'],
  ['duplex', 'caracteristicas'],
  ['orientacion', 'caracteristicas'],
  ['tipo', 'caracteristicas'],
  ['vista', 'caracteristicas'],
  ['estrato', 'caracteristicas'],

  // ── Estado ──
  ['estado_del_inmueble', 'estado'],
  ['estado_fisico_propiedad', 'estado'],
  ['estado_reporte', 'estado'],
  ['en_desistimiento', 'estado'],
  ['comprometido', 'estado'],
  ['tipo_de_reserva', 'estado'],
  ['modificacion_aprobada', 'estado'],

  // ── Información financiera (precios, valores, depósitos) ──
  ['valor_m2', 'financiero'],
  ['valor_m2_actual', 'financiero'],
  ['valor_m2_mac', 'financiero'],
  ['precio_x_m2', 'financiero'],
  ['unit_price', 'financiero'],
  ['rango_precios', 'financiero'],
  ['valor_original_socio', 'financiero'],
  ['varlor_actual_inmueble', 'financiero'],
  ['valor_actual_inmueble', 'financiero'],
  ['vr_deposito', 'financiero'],
  ['vr_parquedero', 'financiero'],
  ['vr_plan_fundadores_proyecto', 'financiero'],
  ['vr_total_con_descuento', 'financiero'],
  ['vr_lista_actual', 'financiero'],
  ['vr_bono_invitacion_vip', 'financiero'],
  ['tax', 'financiero'],
  ['cta_recaudo', 'financiero'],
  ['meses_vigentes', 'financiero'],

  // ── Proyecto y comercial ──
  ['plan_fundadores_proyecto', 'proyecto'],
  ['comentario_gerencia_comercial', 'proyecto'],
  ['etapa_correspondiente_en_bancolombia', 'proyecto'],
  ['fecha_publicacion_inmueble_a_la_venta', 'proyecto'],
  ['n_mero_de_oportunidades_cotizadas', 'proyecto'],
  ['numero_de_oportunidades_cotizadas', 'proyecto'],
  ['tipo_de_negocio', 'proyecto'],
  ['vendor_name', 'proyecto'],

  // ── Referencias y documentación ──
  ['referencia_de_recaudo', 'referencia'],
  ['anexo_solicitud_de_modificaci_n', 'referencia'],
  ['anexo_solicitud_de_modificacion', 'referencia'],
  ['sol_modificacion', 'referencia'],
  ['cotizacion_pdf', 'referencia'],
  ['record_image', 'referencia'],
  ['imagen_acotada', 'referencia'],
  ['imagen_renderizada', 'referencia'],
  ['imagen_de_vista', 'referencia'],
  ['observaciones_informacion_privada', 'referencia'],
  ['nota_rev_operaciones', 'referencia'],
]);

// La sección de una variable; "otros" para todo lo no mapeado (variable nueva
// de Zoho): nunca desaparece, va al final.
export function obtenerGrupoVariable(key) {
  return GRUPO_POR_VARIABLE.get(normalizarKey(key)) ?? 'otros';
}

// Campos MONETARIOS del Product (precios, valores, depósitos, bonos): se
// muestran con separadores de miles/origen y símbolo COP ("$ 150.000.000"),
// igual que hace Oliv. Keys reales de Zoho, comparados normalizados (p. ej.
// "Vr_Bono_Invitacion_VIP" -> "vr_bono_invitacion_vip"). "Rango_Precios",
// "Tax" (porcentaje) y "Cta_Recaudo" (número de cuenta) NO son montos: se
// siguen mostrando tal cual.
const VARIABLES_MONEDA = new Set([
  'unit_price',
  'precio_x_m2',
  'valor_m2',
  'valor_m2_actual',
  'valor_m2_mac',
  'valor_original_socio',
  'varlor_actual_inmueble',
  'valor_actual_inmueble',
  'vr_deposito',
  'vr_parquedero',
  'vr_plan_fundadores_proyecto',
  'vr_total_con_descuento',
  'vr_lista_actual',
  'vr_bono_invitacion_vip',
]);

export function esVariableMoneda(key) {
  return VARIABLES_MONEDA.has(normalizarKey(key));
}

const ETIQUETAS = {
  __nomenclatura_completa__: 'Nomenclatura completa',
  Anexo_solicitud_de_modificaci_n: 'Anexo solicitud de modificación',
  id: 'ID',
  Area_Construida_en_M2: 'Área construida (m²)',
  Area_Construida_m2_v2_RP: 'Área construida m² (V2 RP)',
  Area_Mezzanine_en_m2_Texto: 'Área mezzanine (m², texto)',
  Area_Mezzanine_m2: 'Área mezzanine (m²)',
  Area_Primer_Piso_m2: 'Área primer piso (m²)',
  Area_Privada_en_M2: 'Área privada (m²)',
  Area_Privada_m2_RP: 'Área privada m² (RP)',
  Area_Terraza_en_M2: 'Área terraza (m²)',
  Area_Terraza_m2_RP: 'Área terraza m² (RP)',
  Area_Zona_Verde: 'Área zona verde (m²)',
  Block_Tower: 'Torre',
  C_digo_inmueble: 'Código de inmueble',
  Comentario_Gerencia_Comercial: 'Comentario Gerencia Comercial',
  Cotizacion_PDF: 'Cotización (PDF)',
  Cta_Recaudo: 'Cuenta de recaudo',
  DUPLEX: 'Dúplex',
  Description: 'Descripción',
  EN_DESISTIMIENTO: 'En desistimiento',
  Estado_Fisico_Propiedad: 'Estado físico de la propiedad',
  Estado_Reporte: 'Estado reporte',
  Estado_del_Inmueble: 'Estado del inmueble',
  Etapa_Correspondiente_en_Bancolombia: 'Etapa correspondiente en Bancolombia',
  Fecha_Publicacion_Inmueble_a_la_Venta: 'Fecha de publicación del inmueble a la venta',
  Imagen_Acotada: 'Imagen acotada',
  Imagen_Renderizada: 'Imagen renderizada',
  Imagen_de_Vista: 'Imagen de vista',
  M2_ISLA: 'M² isla',
  Meses_Vigentes: 'Meses vigentes',
  Modificacion_Aprobada: 'Modificación aprobada',
  N_mero_de_Oportunidades_Cotizadas: 'Número de oportunidades cotizadas',
  No_Aires_Acondicionados: 'Aires acondicionados',
  No_Alcobas: 'Alcobas',
  No_Ba_os: 'Baños',
  Nota_rev_Operaciones: 'Nota revisión Operaciones',
  Observaciones_Informacion_Privada: 'Observaciones información privada',
  Orientacion: 'Orientación',
  Plan_Fundadores_Proyecto: 'Plan Fundadores proyecto',
  Precio_X_m2: 'Precio por m²',
  Product_Category: 'Categoría',
  Product_Name: 'Nomenclatura',
  Proyecto_Torre: 'Proyecto - Torre',
  Rango_Precios: 'Rango de precios',
  Record_Image: 'Imagen del registro',
  Referencia_de_Recaudo: 'Referencia de recaudo',
  Sol_Modificacion: 'Solicitud de modificación',
  Tag: 'Etiquetas',
  Tax: 'Impuestos',
  Tipo_Apto: 'Tipo de apartamento',
  Tipo_Apto_Arquitectura: 'Tipo de apartamento (arquitectura)',
  Tipo_de_Negocio: 'Tipo de negocio',
  Tipo_de_Reserva: 'Tipo de reserva',
  Unit_Price: 'Precio unitario',
  VR_Deposito: 'Valor depósito',
  VR_Parquedero: 'Valor parqueadero',
  VR_Plan_Fundadores_Proyecto: 'Valor plan Fundadores proyecto',
  Valor_M2: 'Valor m²',
  Valor_M2_Actual: 'Valor m² actual',
  Valor_M2_MAC: 'Valor m² MAC',
  Valor_Original_Socio: 'Valor original socio',
  Varlor_Actual_Inmueble: 'Valor actual del inmueble',
  Vendor_Name: 'Proveedor',
  Vr_Bono_Invitacion_VIP: 'Valor bono invitación VIP',
  Vr_Lista_Actual: 'Valor lista actual',
  Vr_Total_con_Descuento: 'Valor total con descuento',
};

export function etiquetaVariable(key) {
  return ETIQUETAS[key] ?? toLabel(key);
}

// Agrupa un array ya filtrado de [key, value] por sección, en GRUPOS_ORDEN y
// SOLO con las secciones que tengan al menos una variable (si no, el contador
// de la tarjeta diría "8 secciones" con la mitad vacías).
export function obtenerVariablesOrdenadas(entries) {
  const grupos = {};
  GRUPOS_ORDEN.forEach((g) => (grupos[g] = []));

  entries.forEach(([key]) => {
    grupos[obtenerGrupoVariable(key)].push(key);
  });

  const gruposOrden = GRUPOS_ORDEN.filter((g) => grupos[g].length > 0);
  return { grupos, gruposOrden };
}

function toLabel(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
