// src/pages/income/SalesInvoice/tabs/NotaCreditoTab.tsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentConfig } from '../Create';
import { useDispatch, useSelector } from 'react-redux';
import { getContacts } from '../../../../slices/crm/thunk';
import AutocompleteInput from '../../../../Components/AutocompleteInput';

interface CreditNoteItem {
    id: number;
    item: string;
    reference: string;
    price: string;
    discount: string;
    tax: string;
    description: string;
    quantity: number;
    total: number;
}

interface NotaCreditoTabProps {
    config: DocumentConfig;
}

const NotaCreditoTab: React.FC<NotaCreditoTabProps> = ({ config }) => {
    const navigate = useNavigate();
    const dispatch: any = useDispatch();

    // CRM Data
    const { crmcontacts } = useSelector((state: any) => state.Crm);

    React.useEffect(() => {
        dispatch(getContacts());
    }, [dispatch]);

    const [loading, setLoading] = useState(false);
    const [documentNumber] = useState('AUTO');
    const [logoUrl, setLogoUrl] = useState('');
    const [companyName] = useState('armadilloazul');

    // Navigation for document type
    const handleDocumentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const map: Record<string, string> = {
            'Factura de Ventas': 'factura',
            'Cotización': 'cotizacion',
            'Remisión': 'remision',
            'Nota Débito': 'nota-debito',
            'Nota Crédito': 'nota-credito',
            'Recibo de Pago': 'pago'
        };
        const selectedLabel = e.target.value;
        const typeParam = map[selectedLabel];
        if (typeParam) {
            navigate(`/ingresos/factura-venta/crear?tipo=${typeParam}`);
            window.location.href = `/ingresos/factura-venta/crear?tipo=${typeParam}`;
        }
    };

    const today = new Date().toISOString().split('T')[0];

    const [formData, setFormData] = useState({
        creditNoteType: 'Nota Crédito',
        warehouse: 'Principal',
        priceList: 'General',
        seller: '',
        clientDocType: 'CC',
        clientDocNumber: '',
        clientName: '',
        email: '',
        date: today,
        deliveryOrder: '',
        associatedInvoice: '',
        returnType: 'devolucion-dinero', // o 'credito-ventas'
        reason: '',
        notes: '',
        terms:
            'Esta nota crédito disminuye el valor de la factura asociada según las condiciones pactadas entre las partes.'
    });

    const [items, setItems] = useState<CreditNoteItem[]>([
        {
            id: 1,
            item: '',
            reference: '',
            price: '',
            discount: '',
            tax: '',
            description: '',
            quantity: 1,
            total: 0
        }
    ]);

    // =========================
    // Handlers básicos
    // =========================
    const handleFormChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Auto-populate when client name matches
        if (field === 'clientName') {
            const foundClient = crmcontacts.find((c: any) =>
                `${c.first_name} ${c.last_name}`.trim() === value || c.name === value
            );
            if (foundClient) {
                setFormData(prev => ({
                    ...prev,
                    clientName: value,
                    clientDocNumber: foundClient.id || '',
                    email: foundClient.email || '',
                }));
            }
        }

        // Auto-populate when client document number matches
        if (field === 'clientDocNumber') {
            const foundClient = crmcontacts.find((c: any) =>
                String(c.id) === value || String(c.identification || '') === value
            );
            if (foundClient) {
                const name = foundClient.name || `${foundClient.first_name || ''} ${foundClient.last_name || ''}`.trim();
                setFormData(prev => ({
                    ...prev,
                    clientDocNumber: value,
                    clientName: name,
                    email: foundClient.email || ''
                }));
            }
        }
    };

    const addItem = () => {
        const newId = Math.max(...items.map(i => i.id), 0) + 1;
        setItems(prev => [
            ...prev,
            {
                id: newId,
                item: '',
                reference: '',
                price: '',
                discount: '',
                tax: '',
                description: '',
                quantity: 1,
                total: 0
            }
        ]);
    };

    const removeItem = (id: number) => {
        if (items.length <= 1) return;
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const updateItem = (
        id: number,
        field: keyof CreditNoteItem,
        value: string | number
    ) => {
        setItems(prev =>
            prev.map(item => {
                if (item.id !== id) return item;

                const updated: CreditNoteItem = { ...item, [field]: value as any };

                const price = parseFloat(updated.price) || 0;
                const qty = updated.quantity || 0;
                const disc = parseFloat(updated.discount) || 0;
                const taxRate = parseFloat(updated.tax) || 0;

                const subtotal = price * qty;
                const discountAmount = subtotal * (disc / 100);
                const taxable = subtotal - discountAmount;
                const taxAmount = taxable * (taxRate / 100);

                updated.total = taxable + taxAmount;

                return updated;
            })
        );
    };

    // =========================
    // Totales
    // =========================
    const calculateSubtotal = () =>
        items.reduce(
            (sum, i) => sum + (parseFloat(i.price) || 0) * i.quantity,
            0
        );

    const calculateTotalDiscount = () =>
        items.reduce((sum, i) => {
            const price = parseFloat(i.price) || 0;
            const qty = i.quantity || 0;
            const disc = parseFloat(i.discount) || 0;
            return sum + price * qty * (disc / 100);
        }, 0);

    const calculateTotalTax = () =>
        items.reduce((sum, i) => {
            const price = parseFloat(i.price) || 0;
            const qty = i.quantity || 0;
            const disc = parseFloat(i.discount) || 0;
            const taxRate = parseFloat(i.tax) || 0;

            const base = price * qty * (1 - disc / 100);
            return sum + base * (taxRate / 100);
        }, 0);

    const calculateTotal = () =>
        calculateSubtotal() - calculateTotalDiscount() + calculateTotalTax();

    // =========================
    // Guardado backend
    // =========================
    const handleSave = async () => {
        if (!formData.clientName) {
            return alert('⚠️ Debes seleccionar un cliente');
        }

        if (!formData.associatedInvoice) {
            return alert('⚠️ Debes seleccionar o indicar la factura asociada');
        }

        if (items.some(i => !i.item || !i.price)) {
            return alert('⚠️ Completa todos los ítems (nombre y precio)');
        }

        setLoading(true);

        const payload = {
            tenantId: 1, // TODO: obtener del token
            creditNoteType: formData.creditNoteType,
            clientDocType: formData.clientDocType,
            clientDocNumber: formData.clientDocNumber || null,
            clientName: formData.clientName,
            clientEmail: formData.email || null,
            dateIssue: formData.date,
            warehouse: formData.warehouse,
            priceList: formData.priceList,
            sellerId: formData.seller || null,
            deliveryOrder: formData.deliveryOrder || null,
            associatedInvoice: formData.associatedInvoice,
            returnType: formData.returnType,
            reason:
                formData.reason ||
                'Devolución / ajuste a favor del cliente registrado mediante nota crédito',
            terms: formData.terms || null,
            notes: formData.notes || null,
            items: items.map(i => ({
                item: i.item,
                quantity: Number(i.quantity),
                unitPrice: Number(i.price),
                discount: Number(i.discount) || 0,
                tax: Number(i.tax) || 0,
                description: i.description || null
            }))
        };

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error(
                    'No se encontró token de autenticación. Inicia sesión de nuevo.'
                );
            }

            const response = await fetch(
                'http://localhost:3000/api/credit-notes',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al crear la nota crédito');
            }

            alert(
                `✅ Nota crédito creada exitosamente\n\n` +
                `Número: ${data.creditNote?.number || 'N/D'}\n` +
                `Total: $${(data.creditNote?.total || calculateTotal()).toLocaleString()}`
            );

            navigate('/ingresos/documentos');
        } catch (error: any) {
            console.error('❌ Error al guardar nota crédito:', error);
            alert(`Error al guardar la nota crédito:\n${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => setLogoUrl(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    // =========================
    // Estilos
    // =========================
    const s: { [key: string]: React.CSSProperties } = {
        wrapper: {
            fontFamily: '"Inter", "Segoe UI", sans-serif',
            backgroundColor: '#f8f9fa',
            minHeight: '100vh',
            paddingBottom: '80px'
        },
        topBar: {
            backgroundColor: '#f3f4f6',
            borderBottom: '1px solid #e5e7eb',
            padding: '16px 30px',
            display: 'flex',
            gap: '20px',
            alignItems: 'flex-end'
        },
        topLabel: {
            fontSize: '11px',
            fontWeight: 600,
            color: '#6b7280',
            textTransform: 'uppercase' as const,
            marginBottom: '6px',
            display: 'block'
        },
        topSelect: {
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '13px',
            minWidth: '140px',
            backgroundColor: 'white',
            outline: 'none'
        },
        topSelectActive: {
            backgroundColor: '#9C27B0',
            color: 'white',
            border: '1px solid #9C27B0',
            fontWeight: 600
        },
        card: {
            backgroundColor: 'white',
            margin: '0',
            boxShadow: 'none'
        },
        header: {
            padding: '30px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '1px solid #e5e7eb'
        },
        logoBox: {
            width: '160px',
            height: '100px',
            border: '2px dashed #d1d5db',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backgroundColor: '#f9fafb',
            color: '#9ca3af',
            fontSize: '12px'
        },
        logoImage: {
            width: '100%',
            height: '100%',
            objectFit: 'contain'
        },
        companyName: {
            fontSize: '24px',
            fontWeight: 700,
            color: '#111827',
            marginTop: '16px'
        },
        invoiceNumber: {
            textAlign: 'right'
        },
        invoiceLabel: {
            fontSize: '12px',
            color: '#6b7280',
            marginBottom: '4px'
        },
        invoiceNum: {
            fontSize: '32px',
            fontWeight: 700,
            color: '#111827',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        },
        body: {
            padding: '30px'
        },
        formGrid: {
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr 1fr',
            gap: '20px',
            marginBottom: '30px'
        },
        formField: {
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
        },
        label: {
            fontSize: '12px',
            color: '#4b5563',
            fontWeight: 500
        },
        required: {
            color: '#ef4444'
        },
        input: {
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            padding: '9px 12px',
            fontSize: '13px',
            outline: 'none'
        },
        select: {
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            padding: '9px 12px',
            fontSize: '13px',
            backgroundColor: 'white',
            outline: 'none',
            cursor: 'pointer'
        },
        textarea: {
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            padding: '10px 12px',
            fontSize: '13px',
            outline: 'none',
            minHeight: '80px',
            resize: 'vertical',
            fontFamily: 'inherit'
        },
        // Campos específicos tipo devolución
        specificFieldsBox: {
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            backgroundColor: '#faf5ff'
        },
        specificFieldsTitle: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
            fontSize: '14px',
            marginBottom: '12px',
            color: '#6b21a8'
        },
        returnTypeBox: {
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px dashed #e5e7eb'
        },
        returnTypeTitle: {
            fontWeight: 600,
            fontSize: '13px',
            marginBottom: '8px',
            color: '#4b5563'
        },
        radioGroup: {
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
        },
        radioLabel: {
            fontSize: '13px',
            color: '#374151',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
        },
        // Tabla
        tableWrapper: {
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            overflow: 'hidden',
            marginBottom: '16px'
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse'
        },
        th: {
            backgroundColor: '#f9fafb',
            color: '#6b7280',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase' as const,
            padding: '12px',
            textAlign: 'left' as const,
            borderBottom: '1px solid #e5e7eb'
        },
        td: {
            padding: 0,
            borderBottom: '1px solid #f3f4f6'
        },
        inputCell: {
            width: '100%',
            border: 'none',
            padding: '12px',
            fontSize: '13px',
            outline: 'none',
            backgroundColor: 'transparent'
        },
        selectCell: {
            width: '100%',
            border: 'none',
            padding: '12px',
            fontSize: '13px',
            outline: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer'
        },
        deleteBtn: {
            background: 'none',
            border: 'none',
            color: '#ef4444',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '8px'
        },
        addLineBtn: {
            color: '#9C27B0',
            fontSize: '13px',
            fontWeight: 600,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
        },
        footerGrid: {
            display: 'grid',
            gridTemplateColumns: '1fr 350px',
            gap: '40px',
            marginTop: '30px'
        },
        leftFooter: {
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
        },
        textareaLabel: {
            fontSize: '13px',
            fontWeight: 600,
            color: '#374151',
            marginBottom: '8px'
        },
        totalsBox: {
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
        },
        totalRow: {
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '14px',
            color: '#4b5563'
        },
        totalFinal: {
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '22px',
            fontWeight: 700,
            color: '#111827',
            paddingTop: '16px',
            borderTop: '2px solid #e5e7eb',
            marginTop: '8px'
        },
        bottomBar: {
            position: 'fixed',
            bottom: 0,
            left: 260,
            right: 0,
            backgroundColor: 'white',
            borderTop: '1px solid #e5e7eb',
            padding: '16px 30px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 100
        },
        btnSecondary: {
            backgroundColor: 'white',
            color: '#374151',
            border: '1px solid #d1d5db',
            padding: '10px 20px',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer'
        },
        btnPrimary: {
            backgroundColor: '#9C27B0',
            color: 'white',
            border: 'none',
            padding: '10px 24px',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            opacity: loading ? 0.7 : 1
        }
    };

    // Autocomplete options for client name
    const clientNameOptions = useMemo(() => {
        return (crmcontacts || []).map((client: any) => {
            const name = client.name || `${client.first_name || ''} ${client.last_name || ''}`.trim();
            return {
                value: name,
                label: name,
                sublabel: client.email || `ID: ${client.id}`
            };
        });
    }, [crmcontacts]);

    // Autocomplete options for client document number
    const clientDocOptions = useMemo(() => {
        return (crmcontacts || []).map((client: any) => {
            const name = client.name || `${client.first_name || ''} ${client.last_name || ''}`.trim();
            return {
                value: String(client.id),
                label: String(client.id),
                sublabel: name
            };
        });
    }, [crmcontacts]);

    return (
        <div style={s.wrapper}>
            <div style={s.card}>
                {/* BARRA SUPERIOR GRIS */}
                <div style={s.topBar}>
                    <div>
                        <label style={s.topLabel}>Tipo de documento</label>
                        <select
                            style={{ ...s.topSelect, ...s.topSelectActive }}
                            value="Nota Crédito"
                            onChange={handleDocumentTypeChange}
                        >
                            <option value="Factura de Ventas">Factura de Ventas</option>
                            <option value="Cotización">Cotización</option>
                            <option value="Remisión">Remisión</option>
                            <option value="Nota Débito">Nota Débito</option>
                            <option value="Nota Crédito">Nota Crédito</option>
                            <option value="Recibo de Pago">Recibo de Pago</option>
                        </select>
                    </div>
                    <div>
                        <label style={s.topLabel}>Bodega</label>
                        <select
                            style={s.topSelect}
                            value={formData.warehouse}
                            onChange={e => handleFormChange('warehouse', e.target.value)}
                        >
                            <option value="Principal">Principal</option>
                        </select>
                    </div>
                    <div>
                        <label style={s.topLabel}>Lista de precios</label>
                        <select
                            style={s.topSelect}
                            value={formData.priceList}
                            onChange={e => handleFormChange('priceList', e.target.value)}
                        >
                            <option value="General">General</option>
                        </select>
                    </div>
                    <div>
                        <label style={s.topLabel}>Vendedor</label>
                        <select
                            style={s.topSelect}
                            value={formData.seller}
                            onChange={e => handleFormChange('seller', e.target.value)}
                        >
                            <option value="">Buscar...</option>
                            <option value="1">Admin</option>
                        </select>
                    </div>
                </div>

                {/* HEADER: LOGO Y DATOS */}
                <div style={s.header}>
                    <div>
                        <label style={s.logoBox}>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                style={{ display: 'none' }}
                            />
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" style={s.logoImage} />
                            ) : (
                                <>
                                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div>
                                    <div>Utilizar mi logo</div>
                                    <div
                                        style={{
                                            fontSize: '10px',
                                            color: '#d1d5db',
                                            marginTop: '4px'
                                        }}
                                    >
                                        178 x 51 píxeles
                                    </div>
                                </>
                            )}
                        </label>
                        <div style={s.companyName}>{companyName}</div>
                    </div>

                    <div style={s.invoiceNumber}>
                        <div style={s.invoiceLabel}>{config.numberLabel}</div>
                        <div style={s.invoiceNum}>{documentNumber}</div>
                    </div>
                </div>

                {/* BODY */}
                <div style={s.body}>
                    {/* GRID FORMULARIO */}
                    <div style={s.formGrid}>
                        {/* Documento cliente */}
                        <div style={s.formField}>
                            <label style={s.label}>
                                Documento <span style={s.required}>*</span>
                            </label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <select
                                    style={{ ...s.select, width: '80px' }}
                                    value={formData.clientDocType}
                                    onChange={e => handleFormChange('clientDocType', e.target.value)}
                                >
                                    <option value="CC">CC</option>
                                    <option value="NIT">NIT</option>
                                    <option value="CE">CE</option>
                                </select>
                                <div style={{ flex: 1 }}>
                                    <AutocompleteInput
                                        value={formData.clientDocNumber}
                                        onChange={(val) => handleFormChange('clientDocNumber', val)}
                                        options={clientDocOptions}
                                        placeholder="Nº Identificación"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Fecha */}
                        <div style={s.formField}>
                            <label style={s.label}>
                                Fecha <span style={s.required}>*</span>
                            </label>
                            <input
                                type="date"
                                style={s.input}
                                value={formData.date}
                                onChange={e => handleFormChange('date', e.target.value)}
                            />
                        </div>

                        {/* Orden de entrega */}
                        <div style={s.formField}>
                            <label style={s.label}>Orden de entrega</label>
                            <input
                                type="text"
                                style={s.input}
                                placeholder="# de orden (opcional)"
                                value={formData.deliveryOrder}
                                onChange={e =>
                                    handleFormChange('deliveryOrder', e.target.value)
                                }
                            />
                        </div>

                        {/* Nombre cliente */}
                        <div style={s.formField}>
                            <label style={s.label}>
                                Nombre o razón social <span style={s.required}>*</span>
                            </label>
                            <AutocompleteInput
                                value={formData.clientName}
                                onChange={(val) => handleFormChange('clientName', val)}
                                options={clientNameOptions}
                                placeholder="Nombre del cliente"
                            />
                        </div>

                        {/* Factura asociada */}
                        <div style={s.formField}>
                            <label style={s.label}>
                                Factura asociada <span style={s.required}>*</span>
                            </label>
                            <input
                                type="text"
                                style={s.input}
                                placeholder="Número o referencia de la factura"
                                value={formData.associatedInvoice}
                                onChange={e =>
                                    handleFormChange('associatedInvoice', e.target.value)
                                }
                            />
                        </div>

                        {/* Correo */}
                        <div style={s.formField}>
                            <label style={s.label}>Correo</label>
                            <input
                                type="email"
                                style={s.input}
                                value={formData.email}
                                onChange={e => handleFormChange('email', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* CAMPOS ESPECÍFICOS NOTA CRÉDITO */}
                    <div style={s.specificFieldsBox}>
                        <div style={s.specificFieldsTitle}>
                            <span>↩️</span> Campos de Nota de Crédito / Devolución
                        </div>

                        {/* Motivo */}
                        <div style={s.formField}>
                            <label style={s.label}>Motivo de la devolución / ajuste</label>
                            <input
                                type="text"
                                style={s.input}
                                placeholder="Ej: Devolución de producto, descuento pactado, corrección de precio..."
                                value={formData.reason}
                                onChange={e => handleFormChange('reason', e.target.value)}
                            />
                        </div>

                        {/* Tipo de devolución */}
                        <div style={s.returnTypeBox}>
                            <div style={s.returnTypeTitle}>Tipo de devolución</div>
                            <div style={s.radioGroup}>
                                <label style={s.radioLabel}>
                                    <input
                                        type="radio"
                                        name="returnType"
                                        value="devolucion-dinero"
                                        checked={formData.returnType === 'devolucion-dinero'}
                                        onChange={e =>
                                            handleFormChange('returnType', e.target.value)
                                        }
                                    />
                                    Hay devolución de dinero
                                </label>
                                <label style={s.radioLabel}>
                                    <input
                                        type="radio"
                                        name="returnType"
                                        value="credito-ventas"
                                        checked={formData.returnType === 'credito-ventas'}
                                        onChange={e =>
                                            handleFormChange('returnType', e.target.value)
                                        }
                                    />
                                    Crédito a ventas
                                </label>
                            </div>
                            <small
                                style={{
                                    color: '#666',
                                    fontSize: '12px',
                                    display: 'block',
                                    marginTop: '8px'
                                }}
                            >
                                {formData.returnType === 'devolucion-dinero'
                                    ? 'Se registrará una salida de dinero a favor del cliente.'
                                    : 'Se generará un crédito para futuras compras del cliente.'}
                            </small>
                        </div>
                    </div>

                    {/* TABLA ITEMS */}
                    <div style={s.tableWrapper}>
                        <table style={s.table}>
                            <thead>
                                <tr>
                                    <th style={{ ...s.th, width: '25%' }}>Ítem</th>
                                    <th style={{ ...s.th, width: '12%' }}>Referencia</th>
                                    <th style={{ ...s.th, width: '10%' }}>Precio</th>
                                    <th style={{ ...s.th, width: '8%' }}>Desc. %</th>
                                    <th style={{ ...s.th, width: '10%' }}>Impuesto</th>
                                    <th style={{ ...s.th, width: '20%' }}>Descripción</th>
                                    <th style={{ ...s.th, width: '8%' }}>Cantidad</th>
                                    <th style={{ ...s.th, width: '10%', textAlign: 'right' }}>
                                        Total
                                    </th>
                                    <th style={{ ...s.th, width: '5%' }} />
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(item => (
                                    <tr key={item.id}>
                                        <td style={s.td}>
                                            <input
                                                type="text"
                                                placeholder="Concepto / producto devuelto"
                                                style={s.inputCell}
                                                value={item.item}
                                                onChange={e =>
                                                    updateItem(item.id, 'item', e.target.value)
                                                }
                                            />
                                        </td>
                                        <td style={s.td}>
                                            <input
                                                type="text"
                                                style={{ ...s.inputCell, backgroundColor: '#f9fafb' }}
                                                value={item.reference}
                                                onChange={e =>
                                                    updateItem(item.id, 'reference', e.target.value)
                                                }
                                            />
                                        </td>
                                        <td style={s.td}>
                                            <input
                                                type="number"
                                                placeholder="Precio uni"
                                                style={s.inputCell}
                                                value={item.price}
                                                onChange={e =>
                                                    updateItem(item.id, 'price', e.target.value)
                                                }
                                            />
                                        </td>
                                        <td style={s.td}>
                                            <input
                                                type="number"
                                                placeholder="%"
                                                style={s.inputCell}
                                                value={item.discount}
                                                onChange={e =>
                                                    updateItem(item.id, 'discount', e.target.value)
                                                }
                                            />
                                        </td>
                                        <td style={s.td}>
                                            <select
                                                style={s.selectCell}
                                                value={item.tax}
                                                onChange={e =>
                                                    updateItem(item.id, 'tax', e.target.value)
                                                }
                                            >
                                                <option value="">Impuesto</option>
                                                <option value="0">Ninguno</option>
                                                <option value="5">IVA 5%</option>
                                                <option value="19">IVA 19%</option>
                                            </select>
                                        </td>
                                        <td style={s.td}>
                                            <input
                                                type="text"
                                                placeholder="Descripción adicional"
                                                style={s.inputCell}
                                                value={item.description}
                                                onChange={e =>
                                                    updateItem(item.id, 'description', e.target.value)
                                                }
                                            />
                                        </td>
                                        <td style={s.td}>
                                            <input
                                                type="number"
                                                min={1}
                                                style={s.inputCell}
                                                value={item.quantity}
                                                onChange={e =>
                                                    updateItem(
                                                        item.id,
                                                        'quantity',
                                                        parseInt(e.target.value) || 1
                                                    )
                                                }
                                            />
                                        </td>
                                        <td
                                            style={{
                                                ...s.td,
                                                textAlign: 'right',
                                                paddingRight: '12px',
                                                fontWeight: 600
                                            }}
                                        >
                                            $ {item.total.toLocaleString()}
                                        </td>
                                        <td style={{ ...s.td, textAlign: 'center' }}>
                                            <button
                                                style={s.deleteBtn}
                                                onClick={() => removeItem(item.id)}
                                            >
                                                ✕
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <button style={s.addLineBtn} onClick={addItem}>
                        + Agregar línea
                    </button>

                    {/* FOOTER: Términos / Notas / Totales */}
                    <div style={s.footerGrid}>
                        <div style={s.leftFooter}>
                            <div>
                                <div style={s.textareaLabel}>Términos y condiciones</div>
                                <textarea
                                    style={s.textarea}
                                    value={formData.terms}
                                    onChange={e => handleFormChange('terms', e.target.value)}
                                    rows={4}
                                />
                            </div>
                            <div>
                                <div style={s.textareaLabel}>Notas</div>
                                <textarea
                                    style={s.textarea}
                                    placeholder="Notas visibles en la nota crédito..."
                                    value={formData.notes}
                                    onChange={e => handleFormChange('notes', e.target.value)}
                                    rows={4}
                                />
                            </div>
                        </div>

                        <div style={s.totalsBox}>
                            <div style={s.totalRow}>
                                <span>Subtotal</span>
                                <span>$ {calculateSubtotal().toLocaleString()}</span>
                            </div>
                            <div style={s.totalRow}>
                                <span>Descuento</span>
                                <span>-$ {calculateTotalDiscount().toLocaleString()}</span>
                            </div>
                            <div style={s.totalRow}>
                                <span>Impuestos</span>
                                <span>$ {calculateTotalTax().toLocaleString()}</span>
                            </div>
                            <div style={s.totalFinal}>
                                <span>Total</span>
                                <span>$ {calculateTotal().toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BARRA DE BOTONES FIJA */}
            <div style={s.bottomBar}>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        style={s.btnSecondary}
                        onClick={() => navigate('/ingresos/documentos')}
                    >
                        Cancelar
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        style={s.btnSecondary}
                        onClick={handleSave}
                        disabled={loading}
                    >
                        Guardar y crear nueva
                    </button>
                    <button
                        style={s.btnPrimary}
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotaCreditoTab;
