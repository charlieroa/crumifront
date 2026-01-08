// Ubicación: pages/Pages/Profile/Settings/datostenant.tsx

import React, { ChangeEvent } from "react";
import { Form, Row, Col, Label, Input, Button, Spinner, InputGroup } from "reactstrap";

/* ===== Tipos locales ===== */
export type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
export type DayState = { active: boolean; start: string; end: string };
export type WorkingHoursPerDay = Record<DayKey, DayState>;

const DAYS: { key: DayKey; label: string }[] = [
  { key: "monday", label: "Lunes" },
  { key: "tuesday", label: "Martes" },
  { key: "wednesday", label: "Miércoles" },
  { key: "thursday", label: "Jueves" },
  { key: "friday", label: "Viernes" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
];

/* ===== Props ===== */
export type DatosTenantProps = {
  section: "datos" | "horario";
  name: string; phone: string; address: string; email: string; website: string; ivaRate: string; adminFee: string;
  setName: (v: string) => void; setPhone: (v: string) => void; setAddress: (v: string) => void; setEmail: (v: string) => void;
  setWebsite: (v: string) => void; setIvaRate: (v: string) => void; setAdminFee: (v: string) => void;

  // Props para Módulos Activos
  productsForStaff: boolean; setProductsForStaff: (v: boolean) => void;
  adminFeeEnabled: boolean; setAdminFeeEnabled: (v: boolean) => void;
  loansToStaff: boolean; setLoansToStaff: (v: boolean) => void;

  // Props para Campos de Contabilidad
  taxIdType: string; setTaxIdType: (v: string) => void;
  taxId: string; setTaxId: (v: string) => void;
  businessName: string; setBusinessName: (v: string) => void;
  taxResponsibility: string; setTaxResponsibility: (v: string) => void;
  city: string; setCity: (v: string) => void;
  state: string; setState: (v: string) => void;
  postalCode: string; setPostalCode: (v: string) => void;
  sector: string; setSector: (v: string) => void;
  currency: string; setCurrency: (v: string) => void;
  decimalPrecision: string; setDecimalPrecision: (v: string) => void;
  decimalSeparator: string; setDecimalSeparator: (v: string) => void;

  // Props para Horarios
  perDay: WorkingHoursPerDay;
  toggleDay: (day: DayKey) => void;
  changeHour: (day: DayKey, field: "start" | "end", value: string) => void;
  applyMondayToAll: () => void;

  saving?: boolean;
  onSubmit?: (e?: React.FormEvent) => void;
  onCancel?: () => void;
};

const DatosTenant: React.FC<DatosTenantProps> = ({
  section,
  name, phone, address, email, website, ivaRate, adminFee,
  setName, setPhone, setAddress, setEmail, setWebsite, setIvaRate, setAdminFee,
  productsForStaff, setProductsForStaff,
  adminFeeEnabled, setAdminFeeEnabled,
  loansToStaff, setLoansToStaff,
  taxIdType, setTaxIdType, taxId, setTaxId, businessName, setBusinessName,
  taxResponsibility, setTaxResponsibility, city, setCity, state, setState,
  postalCode, setPostalCode, sector, setSector, currency, setCurrency,
  decimalPrecision, setDecimalPrecision, decimalSeparator, setDecimalSeparator,
  perDay, toggleDay, changeHour, applyMondayToAll,
  saving = false,
  onSubmit, onCancel,
}) => {

  const handleInputChange = (setter: (v: string) => void) => (e: ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
  };

  /* ------- UI: Datos del Negocio (Reorganizado para Contabilidad) ------- */
  const DatosForm = (
    <Form onSubmit={(e) => { e.preventDefault(); onSubmit?.(e); }}>
      <h5 className="mb-3">Datos de Identificación</h5>
      <Row className="g-3">
        <Col lg={6}>
          <Label htmlFor="tenant-tax-id-type" className="form-label">Tipo de Identificación *</Label>
          <Input id="tenant-tax-id-type" type="select" value={taxIdType} onChange={handleInputChange(setTaxIdType)}>
            <option value="">Seleccione...</option>
            <option value="NIT">NIT</option>
            <option value="CC">Cédula de Ciudadanía</option>
            <option value="CE">Cédula de Extranjería</option>
            <option value="TI">Tarjeta de Identidad</option>
            <option value="PP">Pasaporte</option>
          </Input>
        </Col>
        <Col lg={6}>
          <Label htmlFor="tenant-tax-id" className="form-label">Número de Identificación *</Label>
          <Input id="tenant-tax-id" value={taxId} onChange={handleInputChange(setTaxId)} placeholder="Ej: 900123456-7" />
        </Col>
        <Col lg={6}>
          <Label htmlFor="tenant-business-name" className="form-label">Razón Social</Label>
          <Input id="tenant-business-name" value={businessName} onChange={handleInputChange(setBusinessName)} placeholder="Ej: Mi Empresa S.A.S." />
        </Col>
        <Col lg={6}>
          <Label htmlFor="tenant-name" className="form-label">Nombre Comercial *</Label>
          <Input id="tenant-name" value={name} onChange={handleInputChange(setName)} placeholder="Ej: Mi Empresa" required />
        </Col>
        <Col lg={12}>
          <Label htmlFor="tenant-tax-responsibility" className="form-label">Responsabilidad Tributaria</Label>
          <Input id="tenant-tax-responsibility" value={taxResponsibility} onChange={handleInputChange(setTaxResponsibility)} placeholder="Ej: Responsable de IVA, Gran Contribuyente" />
        </Col>
      </Row>

      <hr className="my-4" />
      <h5 className="mb-3">Datos de Contacto y Ubicación</h5>
      <Row className="g-3">
        <Col lg={6}>
          <Label htmlFor="tenant-address" className="form-label">Dirección *</Label>
          <Input id="tenant-address" value={address} onChange={handleInputChange(setAddress)} placeholder="Ej: Calle 123 #45-67" required />
        </Col>
        <Col lg={6}>
          <Label htmlFor="tenant-city" className="form-label">Ciudad/Municipio</Label>
          <Input id="tenant-city" value={city} onChange={handleInputChange(setCity)} placeholder="Ej: Medellín" />
        </Col>
        <Col lg={6}>
          <Label htmlFor="tenant-state" className="form-label">Departamento/Estado</Label>
          <Input id="tenant-state" value={state} onChange={handleInputChange(setState)} placeholder="Ej: Antioquia" />
        </Col>
        <Col lg={6}>
          <Label htmlFor="tenant-postal-code" className="form-label">Código Postal</Label>
          <Input id="tenant-postal-code" value={postalCode} onChange={handleInputChange(setPostalCode)} placeholder="Ej: 050001" />
        </Col>
        <Col lg={6}>
          <Label htmlFor="tenant-phone" className="form-label">Teléfono *</Label>
          <Input id="tenant-phone" value={phone} onChange={handleInputChange(setPhone)} placeholder="Ej: 3001234567" required />
        </Col>
        <Col lg={6}>
          <Label htmlFor="tenant-email" className="form-label">Email</Label>
          <Input id="tenant-email" type="email" value={email} onChange={handleInputChange(setEmail)} placeholder="contacto@miempresa.com" />
        </Col>
        <Col lg={12}>
          <Label htmlFor="tenant-website" className="form-label">Página Web</Label>
          <Input id="tenant-website" type="url" value={website} onChange={handleInputChange(setWebsite)} placeholder="https://miempresa.com" />
        </Col>
      </Row>

      <hr className="my-4" />
      <h5 className="mb-3">Datos Adicionales</h5>
      <Row className="g-3">
        <Col lg={6}>
          <Label htmlFor="tenant-sector" className="form-label">Sector Económico</Label>
          <Input id="tenant-sector" value={sector} onChange={handleInputChange(setSector)} placeholder="Ej: Servicios, Comercio, Manufactura" />
        </Col>
        <Col lg={6}>
          <Label htmlFor="tenant-currency" className="form-label">Moneda</Label>
          <Input id="tenant-currency" type="select" value={currency} onChange={handleInputChange(setCurrency)}>
            <option value="COP">COP - Peso Colombiano</option>
            <option value="USD">USD - Dólar Estadounidense</option>
            <option value="EUR">EUR - Euro</option>
            <option value="MXN">MXN - Peso Mexicano</option>
          </Input>
        </Col>
        <Col lg={6}>
          <Label htmlFor="tenant-decimal-precision" className="form-label">Precisión Decimal</Label>
          <Input id="tenant-decimal-precision" type="number" min={0} max={4} value={decimalPrecision} onChange={handleInputChange(setDecimalPrecision)} placeholder="2" />
          <small className="text-muted">Número de decimales para valores monetarios</small>
        </Col>
        <Col lg={6}>
          <Label htmlFor="tenant-decimal-separator" className="form-label">Separador Decimal</Label>
          <Input id="tenant-decimal-separator" type="select" value={decimalSeparator} onChange={handleInputChange(setDecimalSeparator)}>
            <option value=",">Coma (,)</option>
            <option value=".">Punto (.)</option>
          </Input>
        </Col>
        <Col lg={6}>
          <Label htmlFor="tenant-iva" className="form-label">IVA (%)</Label>
          <Input id="tenant-iva" type="number" min={0} max={100} step="0.01" value={ivaRate} onChange={handleInputChange(setIvaRate)} placeholder="19" />
        </Col>
      </Row>

      <Row>
        <Col lg={12} className="pt-4"><div className="hstack gap-2 justify-content-end"><Button type="button" color="soft-success" onClick={() => onCancel?.()}>Cancelar</Button><Button type="submit" color="primary" disabled={saving}>{saving && <Spinner size="sm" className="me-2" />} Guardar cambios</Button></div></Col>
      </Row>
    </Form>
  );

  /* ------- UI: Horario (Completo) ------- */
  const HorarioForm = (
    <Form onSubmit={(e) => { e.preventDefault(); onSubmit?.(e); }}>
      <Row>
        {DAYS.map(({ key, label }) => {
          const day = perDay[key];
          const isMonday = key === "monday";
          return (
            <Col lg={12} key={key}>
              <div className="border rounded p-3 mb-3">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                  <div className="form-check form-switch"><Input className="form-check-input" type="checkbox" id={`active-${key}`} checked={day.active} onChange={() => toggleDay(key)} /><Label className="form-check-label fw-semibold ms-2" htmlFor={`active-${key}`}>{label} {day.active ? "(Abierto)" : "(Cerrado)"}</Label></div>
                  <div className="d-flex align-items-center gap-3">
                    <div className="d-flex align-items-center gap-2"><Label className="mb-0" htmlFor={`start-${key}`}>Inicio</Label><Input id={`start-${key}`} type="time" value={day.start} disabled={!day.active} onChange={(e) => changeHour(key, "start", e.target.value)} /></div>
                    <div className="d-flex align-items-center gap-2"><Label className="mb-0" htmlFor={`end-${key}`}>Fin</Label><Input id={`end-${key}`} type="time" value={day.end} disabled={!day.active} onChange={(e) => changeHour(key, "end", e.target.value)} /></div>
                    {isMonday && (<Button type="button" size="sm" color="secondary" className="ms-2" onClick={applyMondayToAll}>Aplicar a todos</Button>)}
                  </div>
                </div>
              </div>
            </Col>
          );
        })}
        <Col lg={12}><div className="hstack gap-2 justify-content-end"><Button type="button" color="soft-success" onClick={() => onCancel?.()}>Cancelar</Button><Button type="submit" color="primary" disabled={saving}>{saving && <Spinner size="sm" className="me-2" />} Guardar horarios</Button></div></Col>
      </Row>
    </Form>
  );

  if (section === "datos") return DatosForm;
  if (section === "horario") return HorarioForm;
  return null;
};

export default DatosTenant;