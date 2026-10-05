// Cuarto módulo de negocio migrado. Adaptado de
// zoho-payment-tracker/frontend/src/pages/FiduciaModule.jsx: buscar + filtro
// por proyecto/código (con descripción legible), edición inline de
// nombre/código, eliminar con confirmación, y subida de uno o varios Excel a
// la vez con un resumen de resultados -- sin el modal del legado (Cartera no
// usa modales, ver DESIGN.md/ARQUITECTURA-FRONTEND.md), como botón + input
// oculto que ya traía esta página, extendido a `multiple`.
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X as XIcon, Pencil, Trash2, Upload } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { Field, TextInput, Select } from '../../components/ui/Field.jsx';
import { usePersistentState } from '../../hooks/usePersistentState.js';
import { listEncargos, uploadFiducia, updateEncargo, removeEncargo } from '../../api/fiducia.js';
import { formatDateTime } from '../../utils/format.js';
import { descripcionProyecto } from '../../utils/proyectos.js';
import styles from './EncargosListPage.module.css';

export function EncargosListPage() {
  const [filtros, setFiltros] = usePersistentState('fiducia-encargos:filtros', { search: '', proyecto: '' });
  const [pagina, setPagina] = usePersistentState('fiducia-encargos:pagina', 1);
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [resultadosSubida, setResultadosSubida] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [editForm, setEditForm] = useState({ nombre: '', codigo: '' });
  const [eliminandoId, setEliminandoId] = useState(null);
  const inputRef = useRef(null);

  async function cargar() {
    setCargando(true);
    try {
      const res = await listEncargos({ ...filtros, page: pagina, limit: 20 });
      setResultado(res.data);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros, pagina]);

  function actualizarFiltro(campo, valor) {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
    setPagina(1);
  }

  async function handleFiles(fileList) {
    const files = [...fileList].filter((f) => /\.xlsx?$/i.test(f.name));
    if (files.length === 0) return;
    setSubiendo(true);
    setResultadosSubida(null);
    const out = [];
    for (const file of files) {
      try {
        const res = await uploadFiducia(file);
        out.push({ file: file.name, hojas: res.data.hojas?.length ?? 0, ok: true });
      } catch (err) {
        out.push({ file: file.name, error: err.message, ok: false });
      }
    }
    setResultadosSubida(out);
    setSubiendo(false);
    if (inputRef.current) inputRef.current.value = '';
    setPagina(1);
    cargar();
  }

  function startEdit(enc) {
    setEditandoId(enc.id);
    setEditForm({ nombre: enc.nombre ?? '', codigo: enc.codigo ?? '' });
  }

  async function handleSaveEdit(id) {
    await updateEncargo(id, editForm);
    setEditandoId(null);
    cargar();
  }

  async function handleDelete(id, nombre) {
    if (!window.confirm(`¿Eliminar el encargo "${nombre}"? Se borrarán todas sus hojas.`)) return;
    setEliminandoId(id);
    try {
      await removeEncargo(id);
      cargar();
    } finally {
      setEliminandoId(null);
    }
  }

  const meta = resultado ?? {};

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Encargos fiduciarios</h1>
        <Button onClick={() => inputRef.current?.click()} disabled={subiendo}>
          <Upload size={14} />
          {subiendo ? 'Procesando…' : 'Importar Excel'}
        </Button>
        <input ref={inputRef} type="file" accept=".xlsx,.xls" multiple className={styles.hiddenInput} onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {resultadosSubida && (
        <div className={styles.resultadosSubida}>
          {resultadosSubida.map((r, i) => (
            <p key={i} className={r.ok ? styles.resultadoOk : styles.resultadoError}>
              {r.ok ? <Check size={14} /> : <XIcon size={14} />}
              <strong>{r.file}</strong> — {r.ok ? `${r.hojas} hoja${r.hojas !== 1 ? 's' : ''} importada${r.hojas !== 1 ? 's' : ''}` : r.error}
            </p>
          ))}
        </div>
      )}

      <div className={styles.row}>
        <Field className={styles.fieldMd} label="Buscar">
          {(p) => <TextInput {...p} value={filtros.search} onChange={(e) => actualizarFiltro('search', e.target.value)} placeholder="Nombre, código, archivo…" />}
        </Field>
        {(meta.codigos ?? []).length > 0 && (
          <Field className={styles.fieldMd} label="Proyecto">
            {(p) => (
              <Select {...p} value={filtros.proyecto} onChange={(e) => actualizarFiltro('proyecto', e.target.value)}>
                <option value="">Todos los proyectos</option>
                {meta.codigos.map((c) => <option key={c} value={c}>{descripcionProyecto(c) || c}</option>)}
              </Select>
            )}
          </Field>
        )}
        {meta.pagination && <span className={styles.contadorEncargos}>{meta.pagination.total} encargo{meta.pagination.total !== 1 ? 's' : ''}</span>}
      </div>

      {cargando ? (
        <p className={styles.cargando}>Cargando…</p>
      ) : (meta.data ?? []).length === 0 ? (
        <p className={styles.vacio}>Sin encargos importados. Usa "Importar Excel" arriba para comenzar.</p>
      ) : (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre / Código</th>
                <th>Archivo</th>
                <th>Hojas</th>
                <th>Importado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {meta.data.map((enc) => (
                <tr key={enc.id}>
                  {editandoId === enc.id ? (
                    <td>
                      <div className={styles.editForm}>
                        <TextInput value={editForm.nombre} onChange={(e) => setEditForm((f) => ({ ...f, nombre: e.target.value }))} placeholder="Nombre del encargo" />
                        <TextInput value={editForm.codigo} onChange={(e) => setEditForm((f) => ({ ...f, codigo: e.target.value }))} placeholder="Código" className={styles.inputCodigo} />
                        <div className={styles.editAcciones}>
                          <Button variant="primary" onClick={() => handleSaveEdit(enc.id)}>Guardar</Button>
                          <Button variant="ghost" onClick={() => setEditandoId(null)}>Cancelar</Button>
                        </div>
                      </div>
                    </td>
                  ) : (
                    <td>
                      <Link to={`/fiducia/${enc.id}`}>{enc.nombre}</Link>
                      {enc.codigo && (
                        <div className={styles.filaCodigo}>
                          <span className={styles.codigoBadge}>{enc.codigo}</span>
                          {descripcionProyecto(enc.codigo) && <span className={styles.descripcionProyecto}>{descripcionProyecto(enc.codigo)}</span>}
                        </div>
                      )}
                    </td>
                  )}
                  <td className={styles.archivoNombre}>{enc.archivo_nombre}</td>
                  <td>
                    <div className={styles.hojasBadges}>
                      {(enc.hojas ?? []).map((h) => (
                        <span key={h.id} className={styles.hojaBadge}>{h.nombre_hoja} ({h.total_filas})</span>
                      ))}
                    </div>
                  </td>
                  <td className={styles.fechaImportado}>{formatDateTime(enc.creado_en)}</td>
                  <td className={styles.accionesCol}>
                    {editandoId !== enc.id && (
                      <button type="button" className={styles.iconButton} title="Editar" onClick={() => startEdit(enc)}>
                        <Pencil size={14} />
                      </button>
                    )}
                    <button type="button" className={`${styles.iconButton} ${styles.iconButtonDanger}`} title="Eliminar" disabled={eliminandoId === enc.id} onClick={() => handleDelete(enc.id, enc.nombre)}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {meta.pagination && (
            <Pagination page={pagina} pageSize={meta.pagination.limit} total={meta.pagination.total} onPageChange={setPagina} />
          )}
        </>
      )}
    </div>
  );
}
