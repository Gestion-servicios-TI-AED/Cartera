// Lista de Excels de movimientos subidos para Oliv -- calcada de
// fiducia/EncargosListPage.jsx (Baía Kristal), simplificada: sin el filtro
// "Proyecto" (Oliv es un solo proyecto, no varios fideicomisos con código
// propio como Baía Kristal) y sin el link a una página de Nomenclaturas (esa
// cruza con Negocio, que todavía no tiene reglas/columnas definidas para
// Oliv -- ver el comentario de cabecera de backend/olivEncargo.upload.js).
// Pedido explícito del usuario (2026-09-14): "todos los movimientos serán
// cargados mediante excel... dejemos listos esos modulos... aún no tengo
// las columnas" -- por eso acá solo se sube y se guarda tal cual, sin
// intentar interpretar ninguna columna en particular.
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X as XIcon, Pencil, Trash2, Upload } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { Field, TextInput } from '../../components/ui/Field.jsx';
import { usePersistentState } from '../../hooks/usePersistentState.js';
import { listEncargosOliv, uploadEncargoOliv, updateEncargoOliv, removeEncargoOliv } from '../../api/oliv.js';
import { formatDate, formatDateTime } from '../../utils/format.js';
import styles from '../fiducia/EncargosListPage.module.css';

export function OlivEncargosListPage() {
  const [filtros, setFiltros] = usePersistentState('oliv-encargos:filtros', { search: '' });
  const [pagina, setPagina] = usePersistentState('oliv-encargos:pagina', 1);
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [resultadosSubida, setResultadosSubida] = useState(null);
  // Fecha del Excel a subir (Jefe Gabriel, 2026-09-24) -- opcional, vacía =
  // el backend la completa con hoy (ver olivEncargo.upload.js). Una sola
  // fecha por Encargo (todos sus movimientos la comparten), no por archivo
  // individual dentro de una subida múltiple.
  const [fechaSubida, setFechaSubida] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [editForm, setEditForm] = useState({ nombre: '', codigo: '', fecha: '' });
  const [eliminandoId, setEliminandoId] = useState(null);
  const inputRef = useRef(null);

  async function cargar() {
    setCargando(true);
    try {
      const res = await listEncargosOliv({ ...filtros, page: pagina, limit: 20 });
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
        const res = await uploadEncargoOliv(file, fechaSubida || undefined);
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
    setEditForm({ nombre: enc.nombre ?? '', codigo: enc.codigo ?? '', fecha: enc.fecha ?? '' });
  }

  async function handleSaveEdit(id) {
    await updateEncargoOliv(id, editForm);
    setEditandoId(null);
    cargar();
  }

  async function handleDelete(id, nombre) {
    if (!window.confirm(`¿Eliminar el encargo "${nombre}"? Se borrarán todas sus hojas y movimientos.`)) return;
    setEliminandoId(id);
    try {
      await removeEncargoOliv(id);
      cargar();
    } finally {
      setEliminandoId(null);
    }
  }

  const meta = resultado ?? {};

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Encargos de Oliv</h1>
        <Field className={styles.fieldFecha} label="Fecha del Excel" helper="Si la dejas vacía, se usa hoy">
          {(p) => <TextInput {...p} type="date" value={fechaSubida} onChange={(e) => setFechaSubida(e.target.value)} />}
        </Field>
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
                <th>Fecha</th>
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
                  <td className={styles.fechaImportado}>
                    {editandoId === enc.id ? (
                      <TextInput type="date" value={editForm.fecha} onChange={(e) => setEditForm((f) => ({ ...f, fecha: e.target.value }))} />
                    ) : (
                      formatDate(enc.fecha)
                    )}
                  </td>
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
                      <Link to={`/oliv/encargos/${enc.id}`}>{enc.nombre}</Link>
                      {enc.codigo && (
                        <div className={styles.filaCodigo}>
                          <span className={styles.codigoBadge}>{enc.codigo}</span>
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
