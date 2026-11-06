import { useEffect, useMemo, useRef, useState } from "react";
import {
  IconChevronDown,
  IconClock,
  IconDotsVertical,
  IconPrinter,
} from "@tabler/icons-react";
import { Button } from "../components/atoms/Button";
import { Card } from "../components/atoms/Card";
import { StatusBadge } from "../components/atoms/StatusBadge";
import { PageHeader } from "../components/molecules/PageHeader";

const stages = [
  "Recepción",
  "Diagnóstico",
  "En reparación",
  "Pruebas",
  "Control de calidad",
  "Lista para entrega",
];
const statusOptions = ["En diagnóstico", "En reparación", "Lista", "Entregada"];
const stageForStatus = {
  "En diagnóstico": 1,
  "En reparación": 2,
  Lista: 5,
  Entregada: 6,
};
const statusForStage = [
  "En diagnóstico",
  "En diagnóstico",
  "En reparación",
  "En reparación",
  "En reparación",
  "Lista",
  "Entregada",
];

function toDateInput(value) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const [day, month, rawYear] = String(value).split(/[/-]/);
  if (!day || !month || !rawYear) return "";
  const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function fromDateInput(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function LiquidSelect({
  value,
  onChange,
  options,
  disabled = false,
  ariaLabel,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const items = options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option,
  );
  const selected = items.find(
    (option) => String(option.value) === String(value),
  );
  useEffect(() => {
    const close = (event) => {
      if (!ref.current?.contains(event.target)) setIsOpen(false);
    };
    const escape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  return (
    <div
      className={`liquid-select ${isOpen ? "is-open" : ""} ${disabled ? "is-disabled" : ""}`}
      ref={ref}
    >
      <button
        type="button"
        className="liquid-select-trigger"
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{selected?.label}</span>
        <IconChevronDown size={17} />
      </button>
      <div className="liquid-select-menu" role="listbox">
        {items.map((option) => (
          <button
            type="button"
            role="option"
            aria-selected={String(option.value) === String(value)}
            className={
              String(option.value) === String(value) ? "is-selected" : ""
            }
            key={option.value}
            onClick={() => {
              onChange(option.value);
              setIsOpen(false);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function RepairStatusPage({ onNotify, orders = [], onUpdateOrder }) {
  const [selectedId, setSelectedId] = useState(() => orders[0]?.id || "");
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [note, setNote] = useState("");
  useEffect(() => {
    if (!orders.some((order) => order.id === selectedId))
      setSelectedId(orders[0]?.id || "");
  }, [orders, selectedId]);
  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedId) || orders[0],
    [orders, selectedId],
  );
  if (!selectedOrder) return null;
  const openEditor = () => {
    const defaultStage =
      selectedOrder.progressStage ?? stageForStatus[selectedOrder.status] ?? 0;
    const defaultProgress =
      selectedOrder.progress ??
      Math.round((defaultStage / stages.length) * 100);
    setDraft({
      ...selectedOrder,
      deliveryDate: selectedOrder.deliveryDate || "29/09/2026",
      technician: selectedOrder.technician || "Raúl Martínez",
      progressStage: defaultStage,
      progress: defaultProgress,
    });
    setIsEditing(true);
  };
  const cancelEditor = () => {
    setDraft(null);
    setIsEditing(false);
  };
  const saveEditor = () => {
    onUpdateOrder(selectedOrder.id, draft);
    setIsEditing(false);
    onNotify(`Información de ${selectedOrder.id} actualizada.`);
  };
  const shown = isEditing ? draft : selectedOrder;
  const fallbackStage = stageForStatus[shown.status] ?? 0;
  const parsedStage = Number(shown.progressStage);
  const currentStage = Number.isFinite(parsedStage)
    ? Math.max(0, Math.min(stages.length, parsedStage))
    : fallbackStage;
  const parsedProgress = Number(shown.progress);
  const progress = Number.isFinite(parsedProgress)
    ? Math.max(0, Math.min(100, parsedProgress))
    : Math.round((currentStage / stages.length) * 100);
  const initials = (shown.technician || "Raúl Martínez")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
  const updateDraft = (field) => (event) =>
    setDraft((current) => ({ ...current, [field]: event.target.value }));
  const updateProgress = (event) => {
    const nextProgress = Math.max(
      0,
      Math.min(100, Number(event.target.value) || 0),
    );
    setDraft((current) => ({ ...current, progress: nextProgress }));
  };
  const chooseOrder = (orderId) => {
    setSelectedId(orderId);
    setDraft(null);
    setIsEditing(false);
  };
  const changeStatus = (status) => {
    const stage = stageForStatus[status] ?? 0;
    setDraft((current) => ({
      ...current,
      status,
      progressStage: stage,
      progress: Math.round((stage / stages.length) * 100),
    }));
  };
  const changeStage = (value) => {
    const stage = Number(value);
    setDraft((current) => ({
      ...current,
      progressStage: stage,
      progress: Math.round((stage / stages.length) * 100),
      status: statusForStage[stage],
    }));
  };
  const sendNote = () => {
    if (!note.trim()) return;
    onNotify("Nota interna enviada.");
    setNote("");
  };
  const timelineFill = progress;

  const orderOptions = orders.map((order) => ({
    value: order.id,
    label: `${order.id} · ${order.client}`,
  }));
  const stageOptions = [
    ...stages.map((stage, index) => ({ value: index, label: stage })),
    { value: 6, label: "Completada" },
  ];
  return (
    <section className={`repair-status-page ${isEditing ? "is-editing" : ""}`}>
      <PageHeader
        title="Estado de reparación"
        subtitle={
          isEditing
            ? "Edita directamente los datos visibles de la orden."
            : "Selecciona una orden y realiza el seguimiento de su proceso."
        }
        actions={
          <>
            {isEditing ? (
              <>
                <Button variant="secondary" onClick={cancelEditor}>
                  Cancelar
                </Button>
                <Button onClick={saveEditor}>Guardar cambios</Button>
              </>
            ) : (
              <Button variant="secondary" onClick={openEditor}>
                Editar información
              </Button>
            )}
            <Button variant="secondary">
              <IconPrinter size={16} /> Imprimir
            </Button>
            <button className="icon-button" aria-label="Más opciones">
              <IconDotsVertical />
            </button>
          </>
        }
      />
      <Card
        className={`status-order-picker ${isEditing ? "is-editing" : ""}`}
      >
        <div>
          <span>Orden en seguimiento</span>
          <strong>{selectedOrder.id}</strong>
          {isEditing ? (
            <>
              <label>
                Cliente
                <input
                  value={shown.client || ""}
                  onChange={updateDraft("client")}
                />
              </label>
              <label>
                Motocicleta
                <input
                  value={shown.vehicle || ""}
                  onChange={updateDraft("vehicle")}
                />
              </label>
            </>
          ) : (
            <small>
              {shown.client} · {shown.vehicle}
            </small>
          )}
        </div>
        <div className="status-select-field">
          <span>Seleccionar orden</span>
          <LiquidSelect
            value={selectedOrder.id}
            onChange={chooseOrder}
            options={orderOptions}
            ariaLabel="Seleccionar orden"
          />
        </div>
        {isEditing && (
          <div className="status-select-field">
            <span>Actualizar estado</span>
            <LiquidSelect
              value={shown.status || "En diagnóstico"}
              onChange={changeStatus}
              options={statusOptions}
              ariaLabel="Actualizar estado"
            />
          </div>
        )}
      </Card>
      <Card className="status-overview">
        <div>
          <h3>Estado actual</h3>
          {isEditing ? (
            <div className="progress-editor">
              <div
                className="progress-dial"
                style={{ "--progress-angle": `${progress * 3.6}deg` }}
              >
                <span>
                  {progress}
                  <small>%</small>
                </span>
              </div>
              <label>
                <span>Porcentaje</span>
                <input
                  className="progress-slider"
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  style={{ '--progress-value': `${progress}%` }}
                  onChange={updateProgress}
                  aria-label="Ajustar porcentaje de avance"
                />
                <span className="progress-number">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={updateProgress}
                    aria-label="Porcentaje de avance"
                  />
                  <b>%</b>
                </span>
              </label>
            </div>
          ) : (
            <div className="progress-editor progress-editor--readonly">
              <div
                className="progress-dial"
                style={{ "--progress-angle": `${progress * 3.6}deg` }}
                aria-label={`Progreso de la orden: ${progress}%`}
              >
                <span>
                  {progress}
                  <small>%</small>
                </span>
              </div>
            </div>
          )}
          <div className="current-order-status">
            <span>Estado de la orden</span>
            <StatusBadge status={shown.status} />
          </div>
        </div>
        <div>
          <h3>Fecha de ingreso</h3>
          {isEditing ? (
            <input
              type="date"
              value={toDateInput(shown.date)}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  date: fromDateInput(event.target.value),
                }))
              }
              aria-label="Seleccionar fecha de ingreso"
            />
          ) : (
            <p>{shown.date} · 10:30 a. m.</p>
          )}
        </div>
        <div>
          <h3>Fecha de entrega estimada</h3>
          {isEditing ? (
            <input
              type="date"
              value={toDateInput(shown.deliveryDate)}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  deliveryDate: fromDateInput(event.target.value),
                }))
              }
              aria-label="Seleccionar fecha de entrega estimada"
            />
          ) : (
            <p>{shown.deliveryDate || "29/09/2026"}</p>
          )}
        </div>
        <div>
          <h3>Responsable</h3>
          {isEditing ? (
            <input
              value={shown.technician || ""}
              onChange={updateDraft("technician")}
            />
          ) : (
            <p>
              <span className="mini-avatar">{initials}</span>{" "}
              {shown.technician || "Raúl Martínez"}
            </p>
          )}
        </div>
      </Card>
      <Card className="progress-card">
        <div className="progress-card-heading">
          <div>
            <h2>Progreso de la orden</h2>
            <span className="timeline-caption">
              {currentStage >= stages.length
                ? "Orden completada"
                : `Etapa actual: ${stages[currentStage]}`}{" "}
              · {progress}%
            </span>
          </div>
          {isEditing && (
            <div className="status-select-field progress-stage-select">
              <span>Etapa actual</span>
              <LiquidSelect
                value={currentStage}
                onChange={changeStage}
                options={stageOptions}
                ariaLabel="Etapa actual"
              />
            </div>
          )}
        </div>
        <div
          className="timeline"
          style={{ "--timeline-fill": `${timelineFill}%` }}
        >
          {stages.map((stage, index) => {
            const done = index < currentStage;
            const current =
              index === currentStage && currentStage < stages.length;
            return (
              <div
                className={`timeline-stage ${done ? "done" : ""} ${current ? "current" : ""}`}
                key={stage}
              >
                <span>
                  {done ? "✓" : current ? <IconClock size={15} /> : "×"}
                </span>
                <b>{stage}</b>
                <small>{done || current ? shown.date : ""}</small>
              </div>
            );
          })}
        </div>
      </Card>
      <div className="status-bottom">
        <Card>
          <h2>Actividad reciente</h2>
          <table className="activity-table">
            <thead>
              <tr>
                <th>Fecha/Hora</th>
                <th>Actividades</th>
                <th>Responsable</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{shown.date} 10:30</td>
                <td>Estado actual: {shown.status}</td>
                <td>{shown.technician || "Raúl Martínez"}</td>
              </tr>
              <tr>
                <td>{shown.date} 10:30</td>
                <td>Orden seleccionada para seguimiento</td>
                <td>Sistema</td>
              </tr>
              <tr>
                <td>{shown.date} 09:00</td>
                <td>Orden creada</td>
                <td>Sistema</td>
              </tr>
            </tbody>
          </table>
        </Card>
        <Card className="notes">
          <h2>Notas internas</h2>
          <div className="notes-context">
            <span>Orden en seguimiento</span>
            <strong>{selectedOrder.id}</strong>
            <small>
              {shown.client} · {shown.vehicle}
            </small>
          </div>
          <div className="note-composer">
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") sendNote();
              }}
              placeholder="Escribe una nota interna…"
            />
            <Button disabled={!note.trim()} onClick={sendNote}>
              Enviar
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}
export default RepairStatusPage;
