// --- Importaciones ---
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import React, { useEffect, useMemo, useRef, useState, ChangeEvent } from 'react';
import {
  Card, CardBody, CardHeader, Col, Container, Input, Label,
  Nav, NavItem, NavLink, Row, TabContent, TabPane, Alert, Button, Spinner,
  Modal, ModalHeader, ModalBody, ModalFooter, Table, Badge,
  Pagination, PaginationItem, PaginationLink, InputGroup
} from 'reactstrap';
import classnames from "classnames";
import { jwtDecode } from "jwt-decode";
import CreatableSelect from 'react-select/creatable';

// --- NUEVO: Imports de Redux ---
import { useDispatch } from 'react-redux';
import { setSetupProgress } from '../../../../slices/Settings/settingsSlice';

import progileBg from '../../../../assets/images/profile-bg.jpg';
import avatar1 from '../../../../assets/images/users/avatar-1.jpg';
import { api } from "../../../../services/api";
import { getToken } from "../../../../services/auth";

// Vistas hijas y componentes comunes
import Personal from "./personal";
import DatosTenant, { DayKey, DayState, WorkingHoursPerDay } from "./datostenant";
import CategoryManagerModal from '../../../../Components/Common/CategoryManagerModal';

// --- Tipos y Helpers ---
type Tenant = {
  id: string;
  name?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  iva_rate?: number | null;
  admin_fee_percent?: number | null;
  logo_url?: string | null;
  products_for_staff_enabled?: boolean;
  admin_fee_enabled?: boolean;
  loans_to_staff_enabled?: boolean;
  working_hours?: Record<string, string | null> | null;
  // Nuevos campos de contabilidad
  tax_id_type?: string | null;
  tax_id?: string | null;
  business_name?: string | null;
  tax_responsibility?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  sector?: string | null;
  currency?: string | null;
  decimal_precision?: number | null;
  decimal_separator?: string | null;
  created_at?: string;
  updated_at?: string;
};
type Category = { id: string; name: string; created_at?: string; updated_at?: string; };
type Service = {
  id: string;
  tenant_id?: string;
  category_id: string;
  name: string;
  description?: string | null;
  price: number;
  duration_minutes: number;
  is_active?: boolean;
};

// --- AJUSTE: Se añaden helpers para formateo de moneda ---
const formatterCOP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0, minimumFractionDigits: 0 });
const onlyDigits = (v: string) => (v || '').replace(/\D+/g, '');
const formatCOPString = (digits: string) => {
  if (!digits) return '';
  const n = parseInt(digits, 10);
  if (!Number.isFinite(n)) return '';
  // Quitamos el espacio que a veces añade Intl.NumberFormat (ej: "$ 50.000")
  return formatterCOP.format(n).replace(/\s/g, '');
};

const DAYS: { key: DayKey; label: string }[] = [
  { key: "monday", label: "Lunes" },
  { key: "tuesday", label: "Martes" },
  { key: "wednesday", label: "Miércoles" },
  { key: "thursday", label: "Jueves" },
  { key: "friday", label: "Viernes" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
];
const DEFAULT_DAY: DayState = { active: false, start: "09:00", end: "17:00" };
const defaultWeek = (): WorkingHoursPerDay => ({
  monday: { ...DEFAULT_DAY },
  tuesday: { ...DEFAULT_DAY },
  wednesday: { ...DEFAULT_DAY },
  thursday: { ...DEFAULT_DAY },
  friday: { ...DEFAULT_DAY },
  saturday: { ...DEFAULT_DAY },
  sunday: { ...DEFAULT_DAY },
});
const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const toTime = (raw: string): string => {
  const s = (raw || "").trim();
  if (!s) return "09:00";
  const [hStr, mStr] = s.split(":");
  const h = Math.max(0, Math.min(23, Number(hStr || "0")));
  const m = Math.max(0, Math.min(59, Number(mStr ?? "0")));
  return `${pad2(h)}:${pad2(m)}`;
};
const parseRange = (range?: string | null): DayState => {
  if (!range || range.toLowerCase() === "cerrado") return { ...DEFAULT_DAY, active: false };
  const [start, end] = range.split("-").map(s => (s || "").trim());
  if (!start || !end) return { ...DEFAULT_DAY, active: false };
  return { active: true, start: toTime(start), end: toTime(end) };
};
const formatRange = (d: DayState): string => {
  if (!d.active) return "cerrado";
  if (!d.start || !d.end) return "cerrado";
  return `${toTime(d.start)}-${toTime(d.end)}`;
};
const normalizeWorkingHoursFromAPI = (wh: Tenant["working_hours"]): WorkingHoursPerDay => {
  const base = defaultWeek();
  if (!wh || typeof wh !== "object") return base;
  DAYS.forEach(({ key }) => { base[key] = parseRange(wh[key] ?? null); });
  return base;
};
const buildWorkingHoursPayload = (perDay: WorkingHoursPerDay): Record<string, string> => {
  const out: Record<string, string> = {};
  DAYS.forEach(({ key }) => { out[key] = formatRange(perDay[key]); });
  return out;
};
const validateWorkingHours = (perDay: WorkingHoursPerDay): string | null => {
  for (const { key, label } of DAYS) {
    const d = perDay[key];
    if (d.active) {
      const [sh, sm] = toTime(d.start).split(":").map(Number);
      const [eh, em] = toTime(d.end).split(":").map(Number);
      if (eh * 60 + em <= sh * 60 + sm) return `El horario de ${label} es inválido: fin debe ser mayor que inicio.`;
    }
  }
  return null;
};
const decodeTenantId = (): string | null => {
  try {
    const t = getToken();
    if (!t) return null;
    const decoded: any = jwtDecode(t);
    return decoded?.user?.tenant_id || decoded?.tenant_id || null;
  } catch { return null; }
};
const ensureNumber = (v: string) => (v.trim() === "" ? null : Number(v));

/* =============== Modal Servicio =============== */
const ServiceModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  categories: Category[];
  onCategoryCreated: (c: Category) => void;
  tenantId: string;
  edit?: Service | null;
  onManageCategories: () => void;
}> = ({ isOpen, onClose, onSaved, categories, onCategoryCreated, tenantId, edit, onManageCategories }) => {
  const [saving, setSaving] = useState(false);
  const [categoryId, setCategoryId] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const categoryOptions = useMemo(() =>
    categories.map(cat => ({ value: cat.id, label: cat.name })),
    [categories]);

  useEffect(() => {
    if (isOpen) {
      if (edit) {
        setCategoryId(edit.category_id);
        setName(edit.name);
        setPrice(String(edit.price));
        setDuration(String(edit.duration_minutes));
        setDescription(edit.description || "");
      } else {
        setCategoryId(categories[0]?.id || "");
        setName(""); setPrice(""); setDuration(""); setDescription("");
      }
    }
  }, [isOpen, edit, categories]);

  const handleCreateCategory = async (inputValue: string) => {
    if (!inputValue.trim()) return;
    setSaving(true);
    try {
      const { data } = await api.post('/categories', { name: inputValue.trim() });
      onCategoryCreated(data);
      setCategoryId(data.id);
      Swal.fire({ icon: 'success', title: '¡Categoría creada!', timer: 1500, showConfirmButton: false });
    } catch (e: any) {
      Swal.fire('Error', e?.response?.data?.error || 'No se pudo crear la categoría', 'error');
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    if (!categoryId || !name.trim() || !price || !duration) {
      Swal.fire('Campos incompletos', 'Por favor completa categoría, nombre, precio y duración.', 'warning');
      return;
    }
    const body: any = {
      category_id: categoryId, name: name.trim(), price: Number(price),
      duration_minutes: Number(duration), description: description.trim() || null,
    };
    setSaving(true);
    try {
      if (edit) {
        await api.put(`/services/${edit.id}`, body);
      } else {
        body.tenant_id = tenantId;
        await api.post(`/services`, body);
      }
      Swal.fire({ icon: 'success', title: edit ? '¡Servicio actualizado!' : '¡Servicio Creado!', showConfirmButton: false, timer: 1500 });
      onSaved();
      onClose();
    } catch (e: any) {
      Swal.fire('Error al guardar', e?.response?.data?.message || 'No se pudo guardar el servicio', 'error');
    } finally { setSaving(false); }
  };

  return (
    <Modal isOpen={isOpen} toggle={onClose} size="lg" centered>
      <ModalHeader toggle={onClose}>{edit ? "Editar servicio" : "Nuevo servicio"}</ModalHeader>
      <ModalBody>
        <Row className="g-3">
          <Col md={12}>
            <Label className="form-label">Categoría</Label>
            <InputGroup>
              <CreatableSelect
                className="flex-grow-1"
                isClearable isSearchable
                options={categoryOptions}
                value={categoryOptions.find(opt => opt.value === categoryId)}
                onChange={(selected) => setCategoryId(selected ? selected.value : "")}
                onCreateOption={handleCreateCategory}
                placeholder="Busca o crea una categoría..."
                formatCreateLabel={inputValue => `Crear nueva categoría: "${inputValue}"`}
                isLoading={saving}
                isDisabled={saving}
              />
              <Button color="secondary" outline type="button" onClick={onManageCategories} title="Gestionar categorías">
                <i className="ri-settings-3-line"></i>
              </Button>
            </InputGroup>
          </Col>
          <Col md={6}><Label className="form-label">Nombre del servicio</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Corte para Dama" /></Col>
          <Col md={6}><Label className="form-label">Duración (minutos)</Label><Input type="number" min={1} value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Ej: 60" /></Col>

          <Col md={12}>
            <Label className="form-label">Precio</Label>
            <Input
              type="text"
              inputMode="numeric"
              value={formatCOPString(price)}
              onChange={(e) => setPrice(onlyDigits(e.target.value))}
              placeholder="$50.000"
            />
          </Col>

        </Row>
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={onClose}>Cancelar</Button>
        <Button color="primary" onClick={save} disabled={saving}>{saving && <Spinner size="sm" className="me-2" />} Guardar</Button>
      </ModalFooter>
    </Modal>
  );
};

/* ================= Página Settings ================= */
const Settings: React.FC = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState<"1" | "2" | "3" | "4" | "5">("1");
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [website, setWebsite] = useState<string>("");
  const [ivaRate, setIvaRate] = useState<string>("");
  const [adminFee, setAdminFee] = useState<string>("");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState<boolean>(false);

  // Nuevos estados para campos de contabilidad
  const [taxIdType, setTaxIdType] = useState<string>("");
  const [taxId, setTaxId] = useState<string>("");
  const [businessName, setBusinessName] = useState<string>("");
  const [taxResponsibility, setTaxResponsibility] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [state, setState] = useState<string>("");
  const [postalCode, setPostalCode] = useState<string>("");
  const [sector, setSector] = useState<string>("");
  const [currency, setCurrency] = useState<string>("COP");
  const [decimalPrecision, setDecimalPrecision] = useState<string>("2");
  const [decimalSeparator, setDecimalSeparator] = useState<string>(",");

  // Comentadas las secciones de horarios, servicios y categorías
  // const [perDay, setPerDay] = useState<WorkingHoursPerDay>(defaultWeek());
  const [productsForStaff, setProductsForStaff] = useState<boolean>(true);
  const [adminFeeEnabled, setAdminFeeEnabled] = useState<boolean>(false);
  const [loansToStaff, setLoansToStaff] = useState<boolean>(false);
  const [catLoading, setCatLoading] = useState(false);
  const [svcLoading, setSvcLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [svModalOpen, setSvModalOpen] = useState(false);
  const [svEdit, setSvEdit] = useState<any | null>(null);
  const [isCategoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const SVC_PAGE_SIZE = 6;
  const [svcPage, setSvcPage] = useState<number>(1);
  const totalSvcPages = useMemo(() => Math.max(1, Math.ceil(services.length / SVC_PAGE_SIZE)), [services.length]);
  const paginatedServices = useMemo(() => {
    const start = (svcPage - 1) * SVC_PAGE_SIZE;
    return services.slice(start, start + SVC_PAGE_SIZE);
  }, [services, svcPage]);

  useEffect(() => {
    if (services.length > 0 && svcPage > totalSvcPages) {
      setSvcPage(totalSvcPages);
    }
  }, [services.length, totalSvcPages, svcPage]);

  const [staffCount, setStaffCount] = useState<number>(0);
  const [staffLoading, setStaffLoading] = useState<boolean>(false);

  const tabChange = (tab: "1" | "2" | "3" | "4" | "5") => { if (activeTab !== tab) setActiveTab(tab); };

  const updateStateFromTenant = (tenantData: Tenant | null) => {
    if (!tenantData) return;
    setTenant(tenantData);
    setName(tenantData.name ?? "");
    setPhone(tenantData.phone ?? "");
    setAddress(tenantData.address ?? "");
    setEmail(tenantData.email ?? "");
    setWebsite(tenantData.website ?? "");
    setIvaRate(tenantData.iva_rate == null ? "" : String(tenantData.iva_rate));
    setAdminFee(tenantData.admin_fee_percent == null ? "" : String(tenantData.admin_fee_percent));
    // setPerDay(normalizeWorkingHoursFromAPI(tenantData.working_hours));
    setProductsForStaff(tenantData.products_for_staff_enabled ?? true);
    setAdminFeeEnabled(tenantData.admin_fee_enabled ?? false);
    setLoansToStaff(tenantData.loans_to_staff_enabled ?? false);

    // Nuevos campos de contabilidad
    setTaxIdType(tenantData.tax_id_type ?? "");
    setTaxId(tenantData.tax_id ?? "");
    setBusinessName(tenantData.business_name ?? "");
    setTaxResponsibility(tenantData.tax_responsibility ?? "");
    setCity(tenantData.city ?? "");
    setState(tenantData.state ?? "");
    setPostalCode(tenantData.postal_code ?? "");
    setSector(tenantData.sector ?? "");
    setCurrency(tenantData.currency ?? "COP");
    setDecimalPrecision(tenantData.decimal_precision == null ? "2" : String(tenantData.decimal_precision));
    setDecimalSeparator(tenantData.decimal_separator ?? ",");

    const baseUrl = api.defaults.baseURL || '';
    let finalDisplayUrl = "";
    if (tenantData.logo_url) {
      finalDisplayUrl = tenantData.logo_url.startsWith('http') ? tenantData.logo_url : `${baseUrl}${tenantData.logo_url}`;
    }
    setLogoUrl(finalDisplayUrl);
  };

  useEffect(() => {
    document.title = "Configuración | Peluquería";
    const load = async () => {
      setLoading(true); setError(null);
      try {
        const tenantId = decodeTenantId();
        if (!tenantId) {
          setError("No se encontró el tenant en tu sesión. Inicia sesión nuevamente.");
          return;
        }
        const { data } = await api.get(`/tenants/${tenantId}`);
        updateStateFromTenant(data);
        setLogoFile(null);
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || "No se pudo cargar la información.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const saveAll = async () => {
    setSaving(true); setError(null);
    try {
      const tenantId = tenant?.id || decodeTenantId();
      if (!tenantId) throw new Error("No se encontró el tenant para actualizar.");

      // Comentado: validación de horarios ya que se removió el tab
      // const hoursErr = validateWorkingHours(perDay);
      // if (hoursErr) { 
      //     Swal.fire({ icon: 'error', title: 'Horario Inválido', text: hoursErr });
      //     setSaving(false); 
      //     return;
      // }

      let logoUrlForPayload = tenant?.logo_url || null;

      if (logoUrlForPayload && logoUrlForPayload.startsWith('http')) {
        const baseUrl = api.defaults.baseURL;
        if (baseUrl && logoUrlForPayload.startsWith(baseUrl)) {
          logoUrlForPayload = logoUrlForPayload.replace(baseUrl, '');
        }
      }

      if (logoFile) {
        try {
          setUploadingLogo(true);
          const form = new FormData();
          form.append('logo', logoFile);
          const { data } = await api.post(`/tenants/${tenantId}/logo`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
          if (data?.url) {
            logoUrlForPayload = data.url;
            setLogoFile(null);
          } else {
            throw new Error("La URL del logo no se recibió correctamente.");
          }
        } catch (uploadError: any) {
          Swal.fire({ icon: 'error', title: 'Error de Carga', text: uploadError?.response?.data?.message || uploadError?.message || "No se pudo subir el logo." });
          setUploadingLogo(false); setSaving(false); return;
        } finally {
          setUploadingLogo(false);
        }
      }

      const payload = {
        name: name.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        email: email.trim() || null,
        website: website.trim() || null,
        // working_hours: buildWorkingHoursPayload(perDay),  // Comentado porque se removió horarios
        iva_rate: ensureNumber(ivaRate),
        admin_fee_percent: adminFeeEnabled ? ensureNumber(adminFee) : null,
        logo_url: logoUrlForPayload,
        products_for_staff_enabled: productsForStaff,
        admin_fee_enabled: adminFeeEnabled,
        loans_to_staff_enabled: loansToStaff,
        // Nuevos campos de contabilidad
        tax_id_type: taxIdType.trim() || null,
        tax_id: taxId.trim() || null,
        business_name: businessName.trim() || null,
        tax_responsibility: taxResponsibility.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        postal_code: postalCode.trim() || null,
        sector: sector.trim() || null,
        currency: currency || "COP",
        decimal_precision: parseInt(decimalPrecision) || 2,
        decimal_separator: decimalSeparator || ",",
      };

      await api.put(`/tenants/${tenantId}`, payload);
      const { data: freshTenantData } = await api.get(`/tenants/${tenantId}`);
      updateStateFromTenant(freshTenantData);
      Swal.fire({ icon: 'success', title: '¡Guardado!', text: 'Los cambios se guardaron correctamente.', timer: 2000, showConfirmButton: false });
    } catch (e: any) {
      Swal.fire({ icon: 'error', title: 'Error al Guardar', text: e?.response?.data?.message || e?.message || "No se pudieron guardar los cambios." });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveInfo = async (e?: React.FormEvent) => { e?.preventDefault(); await saveAll(); };
  const handleSaveHours = async (e?: React.FormEvent) => { e?.preventDefault(); await saveAll(); };

  const openLogoPicker = () => { logoInputRef.current?.click(); };
  const onLogoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setLogoFile(f);
      setLogoUrl(URL.createObjectURL(f));
    }
  };

  // Funciones de horarios comentadas ya que se removió el tab
  // const toggleDay = (day: DayKey) => setPerDay(prev => ({ ...prev, [day]: { ...prev[day], active: !prev[day].active } }));
  // const changeHour = (day: DayKey, field: "start" | "end", value: string) =>
  //   setPerDay(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  // const applyMondayToAll = () => {
  //   const monday = perDay.monday;
  //   setPerDay(prev => {
  //     const next = { ...prev } as WorkingHoursPerDay;
  //     for (const { key } of DAYS) {
  //       if (key === "monday") continue;
  //       next[key] = { ...next[key], active: monday.active, start: monday.start, end: monday.end };
  //     }
  //     return next;
  //   });
  // };

  const tenantId = useMemo(() => decodeTenantId() || "", []);


  const loadCategories = async () => {
    if (!tenantId) return;
    setCatLoading(true);
    try {
      const { data } = await api.get('/categories');
      setCategories(data || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'No se pudieron cargar las categorías');
    } finally {
      setCatLoading(false);
    }
  };
  const loadServices = async () => {
    if (!tenantId) return;
    setSvcLoading(true);
    try {
      const { data } = await api.get(`/services/tenant/${tenantId}`);
      setServices(Array.isArray(data) ? data : []);
    }
    catch (e: any) { setError(e?.response?.data?.message || e?.message || 'No se pudieron cargar los servicios'); }
    finally { setSvcLoading(false); }
  };

  const loadStaffCount = async () => {
    if (!tenantId) return;
    setStaffLoading(true);
    try {
      const { data } = await api.get(`/users/tenant/${tenantId}?role_id=3`);
      setStaffCount(Array.isArray(data) ? data.length : 0);
    } catch {
      setStaffCount(0);
    }
    finally { setStaffLoading(false); }
  };

  useEffect(() => {
    if (tenantId) {
      loadCategories();
      loadServices();
      loadStaffCount();
    }
  }, [tenantId]);

  const refreshAllServices = async () => {
    await loadServices();
  };

  const handleCategoryCreated = (newCategory: any) => {
    setCategories((prev) => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const handleCategoryDeleted = (deletedId: string) => {
    setCategories(prev => prev.filter(c => c.id !== deletedId));
    loadServices();
  };

  const openNewService = () => { setSvEdit(null); setSvModalOpen(true); };
  const openEditService = (svc: any) => { setSvEdit(svc); setSvModalOpen(true); };

  const deleteService = async (svc: any) => {
    const result = await Swal.fire({
      title: `¿Eliminar "${svc.name}"?`, text: "Esta acción no se puede deshacer.", icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, ¡eliminar!', cancelButtonText: 'Cancelar'
    });
    if (result.isConfirmed) {
      try {
        await api.delete(`/services/${svc.id}`);
        await loadServices();
        Swal.fire('¡Eliminado!', 'El servicio ha sido eliminado.', 'success');
      }
      catch (e: any) {
        Swal.fire({ icon: 'error', title: 'Error', text: e?.response?.data?.message || e?.message || 'No se pudo eliminar el servicio' });
      }
    }
  };

  // Cálculo de progreso actualizado - solo empresa y personal
  const progress = useMemo(() => {
    const datosOk = !!(name.trim() && address.trim() && phone.trim());
    const personalOk = staffCount > 0;
    const score = (datosOk ? 1 : 0) + (personalOk ? 1 : 0);
    return score * 50;
  }, [name, address, phone, staffCount]);

  // --- SUPER ADMIN LOGIC ---
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [uploadingBulk, setUploadingBulk] = useState(false);

  useEffect(() => {
    try {
      const t = getToken();
      if (t) {
        const dec: any = jwtDecode(t);
        // Asumimos role_id 99 es SuperAdmin
        if (dec?.user?.role_id === 99) {
          setIsSuperAdmin(true);
          setActiveTab("2"); // Default to Employees
        }
      }
    } catch (e) { }
  }, []);

  const handleBulkFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setBulkFile(e.target.files[0]);
    }
  };

  const processBulkUpload = async () => {
    if (!bulkFile) return;
    setUploadingBulk(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        // Parse CSV simple (headers: name,email,phone,address,tax_id)
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        const tenants: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',');
          if (cols.length < 2) continue;
          const obj: any = {};
          headers.forEach((h, index) => {
            obj[h] = cols[index]?.trim();
          });
          tenants.push(obj);
        }

        if (tenants.length === 0) throw new Error("No se encontraron datos en el CSV");

        const { data } = await api.post('/tenants/bulk', { tenants });

        let htmlMsg = `Creados: ${data.success}<br>Errores: ${data.errors}`;
        if (data.details.some((d: any) => d.status === 'error')) {
          htmlMsg += '<div style="text-align:left;max-height:100px;overflow:auto;margin-top:10px;font-size:0.8em">';
          data.details.forEach((d: any) => {
            if (d.status === 'error') htmlMsg += `<br>❌ ${d.name}: ${d.message}`;
          });
          htmlMsg += '</div>';
        }

        Swal.fire({
          title: 'Carga Masiva Completada',
          html: htmlMsg,
          icon: data.errors > 0 ? 'warning' : 'success'
        });
        setBulkFile(null);

      } catch (err: any) {
        Swal.fire('Error', err.message || 'Error procesando archivo', 'error');
      } finally {
        setUploadingBulk(false);
      }
    };
    reader.readAsText(bulkFile);
  };


  useEffect(() => {
    if (!loading) {
      dispatch(setSetupProgress(progress));
    }
  }, [progress, loading, dispatch]);


  const renderSvcPageNumbers = () => {
    if (totalSvcPages <= 1) return null;
    const windowSize = 5;
    let start = Math.max(1, svcPage - Math.floor(windowSize / 2));
    let end = start + windowSize - 1;
    if (end > totalSvcPages) { end = totalSvcPages; start = Math.max(1, end - windowSize + 1); }
    const items: JSX.Element[] = [];
    for (let p = start; p <= end; p++) {
      items.push(
        <PaginationItem key={p} active={p === svcPage}>
          <PaginationLink onClick={() => setSvcPage(p)}>{p}</PaginationLink>
        </PaginationItem>
      );
    }
    return items;
  };

  const handleUpdateServiceCategory = async (id: string, newName: string) => {
    try {
      await api.put(`/categories/${id}`, { name: newName });
      Swal.fire({ icon: 'success', title: '¡Actualizada!', text: 'La categoría ha sido actualizada.', timer: 1500, showConfirmButton: false });
      await loadCategories();
    } catch (e: any) {
      Swal.fire('Error', e?.response?.data?.error || 'No se pudo actualizar la categoría', 'error');
    }
  };

  const handleDeleteServiceCategory = async (id: string) => {
    try {
      await api.delete(`/categories/${id}`);
      handleCategoryDeleted(id);
      Swal.fire({ icon: 'success', title: '¡Eliminada!', text: 'La categoría ha sido eliminada.', timer: 1500, showConfirmButton: false });
    } catch (e: any) {
      Swal.fire('Error', e?.response?.data?.error || 'No se pudo eliminar la categoría', 'error');
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <Container fluid><Row className="justify-content-center"><Col md={8} lg={6} xl={5}><Card className="mt-4"><CardBody className="p-4 text-center"><Spinner /> <span className="ms-2">Cargando configuración…</span></CardBody></Card></Col></Row></Container>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <div className="position-relative mx-n4 mt-n4">
            <div className="profile-wid-bg profile-setting-img"><img src={progileBg} className="profile-wid-img" alt="" /></div>
          </div>
          <Row>
            <Col xxl={3}>
              <Card className="mt-n5">
                <CardBody className="p-4 text-center">
                  <div className="profile-user position-relative d-inline-block mx-auto mb-4" style={{ cursor: 'pointer' }} onClick={openLogoPicker} title="Cambiar logo">
                    <img src={logoUrl || avatar1} className="rounded-circle avatar-xl img-thumbnail user-profile-image" alt="logo" />
                    <span className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 36, height: 36, border: '2px solid white' }}><i className="ri-image-edit-line"></i></span>
                    <input ref={logoInputRef} type="file" accept="image/*" className="d-none" onChange={onLogoInputChange} />
                  </div>
                  <div className="small text-muted mb-2">
                    {uploadingLogo ? "Subiendo logo…" : (logoFile ? "Logo listo para guardar" : "Haz clic en el logo para cambiarlo")}
                  </div>
                  <h5 className="fs-16 mb-1">{name || "Mi peluquería"}</h5>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  {!isSuperAdmin ? (
                    <>
                      <div className="d-flex align-items-center mb-3">
                        <div className="flex-grow-1"><h5 className="card-title mb-0">Avance de configuración</h5></div>
                        <div className="flex-shrink-0"><span className="badge bg-light text-primary fs-12">{progress === 100 ? "Completo" : "Parcial"}</span></div>
                      </div>
                      <div className="progress animated-progress custom-progress progress-label">
                        <div className={`progress-bar ${progress === 100 ? "bg-success" : "bg-warning"}`} role="progressbar" style={{ width: `${progress}%` }}><div className="label">{progress}%</div></div>
                      </div>
                      <ul className="list-unstyled mt-3 mb-0">
                        <li className="d-flex align-items-center gap-2"><i className={`ri-checkbox-${(name && phone && address) ? 'circle-fill text-success' : 'blank-circle-line text-muted'}`}></i><span>Datos de la empresa</span></li>
                        {/* <li className="d-flex align-items-center gap-2"><i className={`ri-checkbox-${(DAYS.some(d => perDay[d.key].active) && validateWorkingHours(perDay) === null) ? 'circle-fill text-success' : 'blank-circle-line text-muted'}`}></i><span>Horarios de atención</span></li> */}
                        {/* <li className="d-flex align-items-center gap-2"><i className={`ri-checkbox-${(services.length > 0) ? 'circle-fill text-success' : 'blank-circle-line text-muted'}`}></i><span>Servicios creados</span></li> */}
                        <li className="d-flex align-items-center gap-2"><i className={`ri-checkbox-${(staffCount > 0) ? 'circle-fill text-success' : 'blank-circle-line text-muted'}`}></i><span>Personal registrado {staffLoading && <Spinner size="sm" className="ms-1" />}</span></li>
                      </ul>
                    </>
                  ) : (
                    <div className="text-center">
                      <h5 className="fs-16 mb-1">Super Admin</h5>
                      <p className="text-muted mb-0">Gestión Global</p>
                    </div>
                  )}
                </CardBody>
              </Card>
            </Col>
            <Col xxl={9}>
              <Card className="mt-xxl-n5">
                <CardHeader>
                  <Nav className="nav-tabs-custom rounded card-header-tabs border-bottom-0" role="tablist">
                    {!isSuperAdmin && (
                      <NavItem><NavLink className={classnames({ active: activeTab === "1" })} onClick={() => tabChange("1")} href="#" role="tab"><i className="fas fa-building"></i>&nbsp; Datos de la Empresa</NavLink></NavItem>
                    )}
                    {/* <NavItem><NavLink className={classnames({ active: activeTab === "2" })} onClick={() => tabChange("2")} href="#" role="tab"><i className="ri-time-line"></i>&nbsp; Horario</NavLink></NavItem> */}
                    {/* <NavItem><NavLink className={classnames({ active: activeTab === "3" })} onClick={() => tabChange("3")} href="#" role="tab"><i className="ri-scissors-2-line"></i>&nbsp; Servicios</NavLink></NavItem> */}
                    <NavItem><NavLink className={classnames({ active: activeTab === "2" })} onClick={() => tabChange("2")} href="#" role="tab"><i className="ri-team-line"></i>&nbsp; Empleados</NavLink></NavItem>
                    {isSuperAdmin && (
                      <NavItem><NavLink className={classnames({ active: activeTab === "5" })} onClick={() => tabChange("5")} href="#" role="tab"><i className="ri-admin-line"></i>&nbsp; Super Admin</NavLink></NavItem>
                    )}
                  </Nav>
                </CardHeader>
                <CardBody className="p-4">
                  {error && <Alert color="danger" fade={false}>{error}</Alert>}
                  <TabContent activeTab={activeTab}>
                    {!isSuperAdmin && (
                      <TabPane tabId="1">
                        <DatosTenant
                          section="datos"
                          name={name} phone={phone} address={address} email={email} website={website} ivaRate={ivaRate} adminFee={adminFee}
                          setName={setName} setPhone={setPhone} setAddress={setAddress} setEmail={setEmail} setWebsite={setWebsite} setIvaRate={setIvaRate} setAdminFee={setAdminFee}
                          productsForStaff={productsForStaff} setProductsForStaff={setProductsForStaff}
                          adminFeeEnabled={adminFeeEnabled} setAdminFeeEnabled={setAdminFeeEnabled}
                          loansToStaff={loansToStaff} setLoansToStaff={setLoansToStaff}
                          taxIdType={taxIdType} setTaxIdType={setTaxIdType} taxId={taxId} setTaxId={setTaxId}
                          businessName={businessName} setBusinessName={setBusinessName}
                          taxResponsibility={taxResponsibility} setTaxResponsibility={setTaxResponsibility}
                          city={city} setCity={setCity} state={state} setState={setState}
                          postalCode={postalCode} setPostalCode={setPostalCode}
                          sector={sector} setSector={setSector} currency={currency} setCurrency={setCurrency}
                          decimalPrecision={decimalPrecision} setDecimalPrecision={setDecimalPrecision}
                          decimalSeparator={decimalSeparator} setDecimalSeparator={setDecimalSeparator}
                          perDay={defaultWeek()} toggleDay={() => { }} changeHour={() => { }} applyMondayToAll={() => { }}
                          saving={saving} onSubmit={handleSaveInfo} onCancel={() => updateStateFromTenant(tenant)}
                        />
                      </TabPane>
                    )}
                    {/* TabPane de Horario comentado */}
                    {/* <TabPane tabId="2">
                      <DatosTenant
                        section="horario"
                        name={name} phone={phone} address={address} email={email} website={website} ivaRate={ivaRate} adminFee={adminFee}
                        setName={() => { }} setPhone={() => { }} setAddress={() => { }} setEmail={() => { }} setWebsite={() => { }} setIvaRate={() => { }} setAdminFee={() => { }}
                        productsForStaff={productsForStaff} setProductsForStaff={setProductsForStaff}
                        adminFeeEnabled={adminFeeEnabled} setAdminFeeEnabled={setAdminFeeEnabled}
                        loansToStaff={loansToStaff} setLoansToStaff={setLoansToStaff}
                        perDay={perDay} toggleDay={toggleDay} changeHour={changeHour} applyMondayToAll={applyMondayToAll}
                        saving={saving} onSubmit={handleSaveHours} onCancel={() => updateStateFromTenant(tenant)}
                      />
                    </TabPane> */}
                    {/* TabPane de Servicios comentado */}
                    {/* <TabPane tabId="3">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">Servicios</h5>
                        <div className="d-flex align-items-center gap-2">{svcLoading && <Spinner size="sm" />}<Button color="primary" onClick={openNewService}><i className="ri-add-line me-1" /> Nuevo servicio</Button></div>
                      </div>
                      <div className="table-responsive">
                        <Table hover className="align-middle">
                          <thead><tr><th>Servicio</th><th>Categoría</th><th>Duración</th><th>Precio</th><th style={{ width: 100 }}>Acciones</th></tr></thead>
                          <tbody>
                            {paginatedServices.length === 0 && (<tr><td colSpan={5} className="text-center text-muted py-4">No has creado ningún servicio todavía.</td></tr>)}
                            {paginatedServices.map(s => {
                              const catName = categories.find(c => c.id === s.category_id)?.name || "—";
                              return (
                                <tr key={s.id}>
                                  <td className="fw-semibold">{s.name}</td>
                                  <td><Badge pill color="light" className="text-dark">{catName}</Badge></td>
                                  <td>{s.duration_minutes} min</td>
                                  <td>${s.price.toLocaleString('es-CO')}</td>
                                  <td>
                                    <div className="d-flex gap-2">
                                      <Button size="sm" color="soft-primary" onClick={() => openEditService(s)} title="Editar"><i className="ri-edit-line" /></Button>
                                      <Button size="sm" color="soft-danger" onClick={() => deleteService(s)} title="Eliminar"><i className="ri-delete-bin-line" /></Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </Table>
                      </div>
                      {services.length > SVC_PAGE_SIZE && (
                        <div className="d-flex justify-content-end mt-3">
                          <Pagination className="pagination-separated mb-0">
                            <PaginationItem disabled={svcPage === 1}><PaginationLink first onClick={() => setSvcPage(1)} /></PaginationItem>
                            <PaginationItem disabled={svcPage === 1}><PaginationLink previous onClick={() => setSvcPage(p => Math.max(1, p - 1))} /></PaginationItem>
                            {renderSvcPageNumbers()}
                            <PaginationItem disabled={svcPage === totalSvcPages}><PaginationLink next onClick={() => setSvcPage(p => Math.min(totalSvcPages, p + 1))} /></PaginationItem>
                            <PaginationItem disabled={svcPage === totalSvcPages}><PaginationLink last onClick={() => setSvcPage(totalSvcPages)} /></PaginationItem>
                          </Pagination>
                        </div>
                      )}
                      <ServiceModal
                        isOpen={svModalOpen}
                        onClose={() => setSvModalOpen(false)}
                        onSaved={refreshAllServices}
                        categories={categories}
                        onCategoryCreated={handleCategoryCreated}
                        tenantId={tenantId}
                        edit={svEdit}
                        onManageCategories={() => setCategoryManagerOpen(true)}
                      />
                    </TabPane> */}
                    {/* Tab Personal ahora es tabId 2 */}
                    <TabPane tabId="2">
                      <Personal
                        services={[] as any}
                        categories={[] as any}
                        onStaffChange={loadStaffCount}
                      />
                    </TabPane >
                    {isSuperAdmin && (
                      <TabPane tabId="5">
                        <h5 className="mb-4">Carga Masiva de Empresas</h5>
                        <Alert color="info">
                          <strong>Instrucciones:</strong> Sube un archivo CSV con las siguientes cabeceras (primera fila):<br />
                          <code>name, email, phone, address, tax_id, tax_id_type, business_name, city, state</code><br />
                          <small>El campo "name" y "email" son obligatorios. El resto son opcionales.</small>
                        </Alert>
                        <Input type="file" accept=".csv" onChange={handleBulkFileChange} className="mb-3" />
                        <div className="d-flex gap-2">
                          <Button color="success" onClick={processBulkUpload} disabled={!bulkFile || uploadingBulk}>
                            {uploadingBulk ? <Spinner size="sm" /> : 'Subir Empresas'}
                          </Button>
                        </div>
                      </TabPane>
                    )}
                  </TabContent>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>


      <CategoryManagerModal
        isOpen={isCategoryManagerOpen}
        toggle={() => setCategoryManagerOpen(false)}
        title="Gestionar Categorías de Servicios"
        categories={categories}
        onSave={handleUpdateServiceCategory}
        onDelete={handleDeleteServiceCategory}
      />
    </React.Fragment>
  );
};

export default Settings;