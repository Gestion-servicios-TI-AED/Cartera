// "Todas las variables" del detalle de un inmueble de Baía Kristal: qué campos
// del Product de Zoho NO se muestran y cómo se llaman los que sí. Solo afecta
// la pantalla -- los datos siguen completos en la base y en el sync (Jefe
// Gabriel, 2026-10-07). Zoho entrega los nombres internos sin tildes ni ñ
// ("C_digo_inmueble", "No_Ba_os"), por eso cada etiqueta se escribe aquí; una
// variable nueva sin etiqueta cae a `toLabel()` y nunca desaparece.

// Campos de sistema/operación que no aportan en esta vista.
export const VARIABLES_OCULTAS = new Set([
  'Pais', 'Owner', 'hauzd', 'Ciudad', 'Layout',
  'Alianza', 'Taxable', 'rev_opx', 'Locked__s',
  'Created_By', 'Modified_By', 'Qty_Ordered', 'Zona_Barrio',
  'Created_Time', 'Departamento', 'Etapa_PRUEBA', 'Fiducolombia', 'Qty_in_Stock', 'Inmueble_Caja',
  'Modified_Time', 'Qty_in_Demand', 'Reorder_Level', 'Inmueble_Socio', 'Product_Active',
  'Last_Activity_Time', 'Direccion_Info_Privada', 'Validaci_n_Vendor_name',
  'Volante_Recaudo_Inmueble', 'Link_Para_Pagos_Con_Tarjeta_de_Credito',
]);

const ETIQUETAS = {
  id: 'ID',
  Anexo_solicitud_de_modificaci_n: 'Anexo solicitud de modificación',
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
  Product_Name: 'Nombre del producto',
  Project_Code: 'Código del proyecto',
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

function toLabel(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function etiquetaVariable(key) {
  return ETIQUETAS[key] ?? toLabel(key);
}
