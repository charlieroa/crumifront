// src/pages/income/SalesInvoice/tabs/RemisionTab.tsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentConfig } from '../Create';
import { useDispatch, useSelector } from 'react-redux';
import { getContacts, addNewContact } from '../../../../slices/crm/thunk';
import { unwrapResult } from '@reduxjs/toolkit';
import AutocompleteInput from '../../../../Components/AutocompleteInput';

// ============================================
// INTERFACES
// ============================================
interface InvoiceItem {
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

interface Client {
    idType: string;
    idNumber: string;
    name: string;
    email: string;
}

interface RemisionTabProps {
    config: DocumentConfig;
}

// ============================================
// COMPONENTE
// ============================================
const RemisionTab: React.FC<RemisionTabProps> = ({ config }) => {
    const navigate = useNavigate();
    const dispatch: any = useDispatch();

    // CRM Data
    const { crmcontacts } = useSelector((state: any) => state.Crm);

    React.useEffect(() => {
        dispatch(getContacts());
    }, [dispatch]);

    // Estados
    const [loading, setLoading] = useState(false);
    const [documentNumber, setDocumentNumber] = useState('AUTO');
    const [showNewClientModal, setShowNewClientModal] = useState(false);
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

    // Form data
    const [formData, setFormData] = useState({
        documentType: 'Remisión',
        warehouse: 'Principal',
        priceList: 'General',
        seller: '',
        clientDocType: 'CC',
        clientDocNumber: '',
        clientName: '',
        email: '',
        dateIssue: new Date().toISOString().split('T')[0],
        deliveryDate: '',
        deliveryAddress: '',
        receiverName: '',
        receiverDoc: '',
        paymentForm: 'Contado',
        paymentMethod: '',
        notes: '',
        terms: 'Documento de entrega de mercancía. No tiene validez fiscal hasta su facturación.'
    });

    // Items
    const [items, setItems] = useState<InvoiceItem[]>([
        { id: 1, item: '', reference: '', price: '', discount: '', tax: '', description: '', quantity: 1, total: 0 }
    ]);

    // Nuevo cliente
    const [newClient, setNewClient] = useState<Client>({
        idType: 'CC - Cédula de ciudadanía',
        idNumber: '',
        name: '',
        email: ''
    });

    // ============================================
    // HANDLERS
    // ============================================
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
        setItems([
            ...items,
            { id: newId, item: '', reference: '', price: '', discount: '', tax: '', description: '', quantity: 1, total: 0 }
        ]);
    };

    const removeItem = (id: number) => {
        if (items.length > 1) setItems(items.filter(item => item.id !== id));
    };

    const updateItem = (id: number, field: keyof InvoiceItem, value: string | number) => {
        setItems(
            items.map(item => {
                if (item.id === id) {
                    const updated = { ...item, [field]: value };

                    const price = parseFloat(updated.price) || 0;
                    const qty = updated.quantity || 0;
                    const disc = parseFloat(updated.discount) || 0;
                    const taxRate = parseFloat(updated.tax) || 0;

                    const subtotal = price * qty;
                    const discountAmount = subtotal * (disc / 100);
                    const taxAmount = (subtotal - discountAmount) * (taxRate / 100);

                    updated.total = subtotal - discountAmount + taxAmount;
                    return updated;
                }
                return item;
            })
        );
    };

    // Cálculos
    const calculateSubtotal = () =>
        items.reduce((sum, i) => sum + (parseFloat(i.price) || 0) * i.quantity, 0);

    const calculateTotalDiscount = () =>
        items.reduce(
            (sum, i) =>
                sum + (parseFloat(i.price) || 0) * i.quantity * ((parseFloat(i.discount) || 0) / 100),
            0
        );

    const calculateTotalTax = () =>
        items.reduce((sum, i) => {
            const price = parseFloat(i.price) || 0;
            const base = price * i.quantity * (1 - (parseFloat(i.discount) || 0) / 100);
            const taxRate = parseFloat(i.tax) || 0;
            return sum + base * (taxRate / 100);
        }, 0);

    const calculateTotal = () => calculateSubtotal() - calculateTotalDiscount() + calculateTotalTax();

    // ============================================
    // GUARDAR REMISIÓN
    // ============================================
    const handleSave = async () => {
        if (!formData.clientName) {
            return alert('⚠️ Debes seleccionar un cliente');
        }

        if (items.some(i => !i.item || !i.price)) {
            return alert('⚠️ Completa todos los items (nombre y precio)');
        }

        setLoading(true);

        const paymentMeanCode = (() => {
            const mapping: { [key: string]: string } = {
                'Efectivo': '10',
                'Transferencia': '31',
                'Tarjeta': '48',
                'Consignación': '42'
            };
            return mapping[formData.paymentMethod] || '10';
        })();

        const payload = {
            // Cliente
            clientId: formData.clientDocNumber || null,
            clientNit: formData.clientDocNumber || null,
            clientName: formData.clientName,
            clientDocType: formData.clientDocType,
            clientEmail: formData.email || null,

            // Documento
            warehouse: formData.warehouse,
            priceList: formData.priceList,
            dateIssue: formData.dateIssue,
            deliveryDate: formData.deliveryDate || null,

            // Entrega
            deliveryAddress: formData.deliveryAddress || null,
            receiverName: formData.receiverName || null,
            receiverDoc: formData.receiverDoc || null,

            // Pago
            paymentMethod: formData.paymentForm,
            paymentMeanCode: paymentMeanCode,

            // Notas
            notes: formData.notes || null,
            terms: formData.terms || null,

            // Items
            items: items.map(i => ({
                item: i.item,
                reference: i.reference || null,
                description: i.description || null,
                quantity: Number(i.quantity),
                unitPrice: Number(i.price),
                discount: Number(i.discount) || 0,
                tax: Number(i.tax) || 0
            })),

            tenantId: 1 // TODO: Obtener del token JWT
        };

        try {
            const token = localStorage.getItem('token');

            if (!token) {
                throw new Error('No se encontró token de autenticación. Por favor inicia sesión.');
            }

            const response = await fetch('http://localhost:3000/api/remissions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al guardar la remisión');
            }

            alert(
                `✅ Remisión creada exitosamente!\n\n` +
                `Número: ${data.remission.number}\n` +
                `Cliente: ${data.remission.clientName}\n` +
                `Total: $${Number(data.remission.total).toLocaleString()}`
            );

            navigate('/ingresos/documentos');
        } catch (error: any) {
            console.error('❌ Error al guardar remisión:', error);
            alert(`Error al guardar la remisión:\n${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = e => setLogoUrl(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleAddClient = async () => {
        if (!newClient.name || !newClient.idNumber) {
            alert('Por favor completa nombre e identificación');
            return;
        }

        try {
            // Split name
            const nameParts = newClient.name.trim().split(' ');
            const first_name = nameParts[0];
            const last_name = nameParts.slice(1).join(' ') || '.';

            // Dispatch create contact logic
            const resultAction = await dispatch(addNewContact({
                first_name,
                last_name,
                email: newClient.email,
                phone: '',
                password: 'genericPassword123'
            }));

            unwrapResult(resultAction);

            setFormData(prev => ({
                ...prev,
                clientDocNumber: newClient.idNumber,
                clientName: newClient.name,
                email: newClient.email
            }));
            setShowNewClientModal(false);
            setNewClient({ idType: 'CC - Cédula de ciudadanía', idNumber: '', name: '', email: '' });

            // Refresh contacts
            dispatch(getContacts());

        } catch (error: any) {
            console.error("Error creating contact:", error);
            alert('Error al crear el contacto: ' + (error.error || error.message || 'Error desconocido'));
        }
    };

    // ============================================
    // ESTILOS
    // ============================================
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
            backgroundColor: config.color,
            color: 'white',
            border: `1px solid ${config.color}`,
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
            flexDirection: 'column' as const,
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
            objectFit: 'contain' as const
        },
        companyName: {
            fontSize: '24px',
            fontWeight: 700,
            color: '#111827',
            marginTop: '16px'
        },
        invoiceNumber: {
            textAlign: 'right' as const
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
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '20px',
            marginBottom: '30px'
        },
        formField: {
            display: 'flex',
            flexDirection: 'column' as const,
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
            outline: 'none',
            transition: 'border 0.2s'
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
        newContactBtn: {
            color: config.color,
            fontSize: '13px',
            fontWeight: 600,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 0',
            marginTop: '4px',
            textAlign: 'left' as const
        },
        sectionTitle: {
            fontSize: '14px',
            fontWeight: 600,
            color: '#374151',
            marginBottom: '16px',
            marginTop: '24px',
            paddingBottom: '8px',
            borderBottom: '2px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        },
        tableWrapper: {
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            overflow: 'hidden',
            marginBottom: '16px'
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse' as const
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
            padding: '0',
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
            color: config.color,
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
            flexDirection: 'column' as const,
            gap: '20px'
        },
        signatureBox: {
            border: '2px dashed #d1d5db',
            borderRadius: '8px',
            padding: '40px 20px',
            textAlign: 'center' as const,
            color: '#9ca3af',
            fontSize: '13px',
            cursor: 'pointer'
        },
        textareaLabel: {
            fontSize: '13px',
            fontWeight: 600,
            color: '#374151',
            marginBottom: '8px'
        },
        textarea: {
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            padding: '10px 12px',
            fontSize: '13px',
            outline: 'none',
            minHeight: '80px',
            resize: 'vertical' as const,
            fontFamily: 'inherit'
        },
        totalsBox: {
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '12px'
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
            fontSize: '24px',
            fontWeight: 700,
            color: '#111827',
            paddingTop: '16px',
            borderTop: '2px solid #e5e7eb',
            marginTop: '8px'
        },
        bottomBar: {
            position: 'fixed' as const,
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
            backgroundColor: config.color,
            color: 'white',
            border: 'none',
            padding: '10px 24px',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            opacity: loading ? 0.7 : 1
        },
        modalOverlay: {
            position: 'fixed' as const,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        },
        modal: {
            backgroundColor: 'white',
            borderRadius: '12px',
            width: '500px',
            maxHeight: '90vh',
            overflow: 'auto'
        },
        modalHeader: {
            padding: '20px 24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        modalTitle: {
            fontSize: '18px',
            fontWeight: 600,
            margin: 0
        },
        modalClose: {
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#9ca3af'
        },
        modalBody: {
            padding: '24px'
        },
        modalBtnWrapper: {
            display: 'flex',
            gap: '12px',
            marginTop: '24px'
        },
        infoBox: {
            backgroundColor: '#FFF4E6',
            border: '1px solid #FFB84D',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
        },
        infoIcon: {
            fontSize: '20px',
            flexShrink: 0
        },
        infoText: {
            fontSize: '13px',
            color: '#7C4A00',
            lineHeight: '1.5'
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
                {/* BARRA SUPERIOR */}
                <div style={s.topBar}>
                    <div>
                        <label style={s.topLabel}>Tipo de documento</label>
                        <select
                            style={{ ...s.topSelect, ...s.topSelectActive }}
                            value="Remisión"
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

                {/* HEADER */}
                <div style={s.header}>
                    <div>
                        <label style={s.logoBox}>
                            <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" style={s.logoImage} />
                            ) : (
                                <>
                                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div>
                                    <div>Utilizar mi logo</div>
                                    <div style={{ fontSize: '10px', color: '#d1d5db', marginTop: '4px' }}>178 x 51 píxeles</div>
                                </>
                            )}
                        </label>
                        <div style={s.companyName}>{companyName}</div>
                    </div>

                    <div style={s.invoiceNumber}>
                        <div style={s.invoiceLabel}>No.</div>
                        <div style={s.invoiceNum}>
                            {documentNumber}
                            <span style={{ fontSize: '16px', color: '#9ca3af', cursor: 'pointer' }}>⚙️</span>
                        </div>
                    </div>
                </div>

                {/* BODY: FORMULARIO */}
                <div style={s.body}>
                    {/* INFO BOX */}
                    <div style={s.infoBox}>
                        <span style={s.infoIcon}>ℹ️</span>
                        <div style={s.infoText}>
                            <strong>Documento de entrega:</strong> Las remisiones son documentos no fiscales que registran la entrega de mercancía.
                            Puedes convertirlas a factura desde el listado de documentos.
                        </div>
                    </div>

                    {/* DATOS DEL CLIENTE */}
                    <div style={s.formGrid}>
                        {/* Documento */}
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
                                        placeholder="Buscar Nº de ID"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Fecha Emisión */}
                        <div style={s.formField}>
                            <label style={s.label}>
                                Fecha Emisión <span style={s.required}>*</span>
                            </label>
                            <input
                                type="date"
                                style={s.input}
                                value={formData.dateIssue}
                                onChange={e => handleFormChange('dateIssue', e.target.value)}
                            />
                        </div>

                        {/* Fecha Entrega */}
                        <div style={s.formField}>
                            <label style={s.label}>Fecha Entrega</label>
                            <input
                                type="date"
                                style={s.input}
                                value={formData.deliveryDate}
                                onChange={e => handleFormChange('deliveryDate', e.target.value)}
                            />
                        </div>

                        {/* Nombre o razón social */}
                        <div style={s.formField}>
                            <label style={s.label}>
                                Nombre o razón social <span style={s.required}>*</span>
                            </label>
                            <AutocompleteInput
                                value={formData.clientName}
                                onChange={(val) => handleFormChange('clientName', val)}
                                options={clientNameOptions}
                                placeholder="Seleccionar cliente"
                            />
                            <button style={s.newContactBtn} onClick={() => setShowNewClientModal(true)}>
                                + Nuevo contacto
                            </button>
                        </div>

                        {/* Forma de pago */}
                        <div style={s.formField}>
                            <label style={s.label}>
                                Forma de pago <span style={s.required}>*</span>
                            </label>
                            <select
                                style={s.select}
                                value={formData.paymentForm}
                                onChange={e => handleFormChange('paymentForm', e.target.value)}
                            >
                                <option value="Contado">Contado</option>
                                <option value="Credito">Crédito</option>
                            </select>
                        </div>

                        {/* Vacío */}
                        <div></div>

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

                        {/* Medio de pago */}
                        <div style={s.formField}>
                            <label style={s.label}>
                                Medio de pago <span style={s.required}>*</span>
                            </label>
                            <select
                                style={s.select}
                                value={formData.paymentMethod}
                                onChange={e => handleFormChange('paymentMethod', e.target.value)}
                            >
                                <option value="">Seleccionar</option>
                                <option value="Efectivo">Efectivo</option>
                                <option value="Transferencia">Transferencia</option>
                                <option value="Tarjeta">Tarjeta</option>
                                <option value="Consignación">Consignación</option>
                            </select>
                        </div>
                    </div>

                    {/* DATOS DE ENTREGA */}
                    <div style={s.sectionTitle}>
                        <span>📦</span> Datos de Entrega
                    </div>

                    <div style={s.formGrid}>
                        {/* Dirección de Entrega */}
                        <div style={{ ...s.formField, gridColumn: '1 / 3' }}>
                            <label style={s.label}>Dirección de Entrega</label>
                            <input
                                type="text"
                                style={s.input}
                                placeholder="Calle, número, ciudad"
                                value={formData.deliveryAddress}
                                onChange={e => handleFormChange('deliveryAddress', e.target.value)}
                            />
                        </div>

                        {/* Vacío */}
                        <div></div>

                        {/* Nombre de quien recibe */}
                        <div style={s.formField}>
                            <label style={s.label}>Nombre de quien recibe</label>
                            <input
                                type="text"
                                style={s.input}
                                placeholder="Nombre completo"
                                value={formData.receiverName}
                                onChange={e => handleFormChange('receiverName', e.target.value)}
                            />
                        </div>

                        {/* Documento de quien recibe */}
                        <div style={s.formField}>
                            <label style={s.label}>Documento de quien recibe</label>
                            <input
                                type="text"
                                style={s.input}
                                placeholder="CC o NIT"
                                value={formData.receiverDoc}
                                onChange={e => handleFormChange('receiverDoc', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* TABLA DE ITEMS */}
                    <div style={{ ...s.sectionTitle, marginTop: '32px' }}>
                        <span>📋</span> Items a Remitir
                    </div>

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
                                    <th style={{ ...s.th, width: '10%', textAlign: 'right' }}>Total</th>
                                    <th style={{ ...s.th, width: '5%' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(item => (
                                    <tr key={item.id}>
                                        <td style={s.td}>
                                            <input
                                                type="text"
                                                placeholder="Buscar ítem"
                                                style={s.inputCell}
                                                value={item.item}
                                                onChange={e => updateItem(item.id, 'item', e.target.value)}
                                            />
                                        </td>
                                        <td style={s.td}>
                                            <input
                                                type="text"
                                                style={{ ...s.inputCell, backgroundColor: '#f9fafb' }}
                                                value={item.reference}
                                                onChange={e => updateItem(item.id, 'reference', e.target.value)}
                                            />
                                        </td>
                                        <td style={s.td}>
                                            <input
                                                type="number"
                                                placeholder="Precio"
                                                style={s.inputCell}
                                                value={item.price}
                                                onChange={e => updateItem(item.id, 'price', e.target.value)}
                                            />
                                        </td>
                                        <td style={s.td}>
                                            <input
                                                type="number"
                                                placeholder="%"
                                                style={s.inputCell}
                                                value={item.discount}
                                                onChange={e => updateItem(item.id, 'discount', e.target.value)}
                                            />
                                        </td>
                                        <td style={s.td}>
                                            <select
                                                style={s.selectCell}
                                                value={item.tax}
                                                onChange={e => updateItem(item.id, 'tax', e.target.value)}
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
                                                placeholder="Descripción"
                                                style={s.inputCell}
                                                value={item.description}
                                                onChange={e => updateItem(item.id, 'description', e.target.value)}
                                            />
                                        </td>
                                        <td style={s.td}>
                                            <input
                                                type="number"
                                                min="1"
                                                style={s.inputCell}
                                                value={item.quantity}
                                                onChange={e => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                            />
                                        </td>
                                        <td style={{ ...s.td, textAlign: 'right', paddingRight: '12px', fontWeight: 600 }}>
                                            $ {item.total.toLocaleString()}
                                        </td>
                                        <td style={{ ...s.td, textAlign: 'center' }}>
                                            <button style={s.deleteBtn} onClick={() => removeItem(item.id)}>
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

                    {/* FOOTER */}
                    <div style={s.footerGrid}>
                        <div style={s.leftFooter}>
                            <div style={s.signatureBox}>
                                <div style={{ fontSize: '32px', marginBottom: '8px' }}>✍️</div>
                                <div>Utilizar mi firma</div>
                                <div style={{ fontSize: '10px', color: '#d1d5db', marginTop: '4px' }}>178 x 51 píxeles</div>
                            </div>

                            <div style={{ width: '100%' }}>
                                <div style={s.textareaLabel}>Términos y condiciones</div>
                                <textarea
                                    style={{ ...s.textarea, width: '100%', boxSizing: 'border-box' }}
                                    value={formData.terms}
                                    onChange={e => handleFormChange('terms', e.target.value)}
                                    rows={4}
                                />
                            </div>

                            <div style={{ width: '100%' }}>
                                <div style={s.textareaLabel}>Notas</div>
                                <textarea
                                    style={{ ...s.textarea, width: '100%', boxSizing: 'border-box' }}
                                    placeholder="Notas adicionales..."
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

            {/* BARRA INFERIOR */}
            <div style={s.bottomBar}>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button style={s.btnSecondary} onClick={() => navigate('/ingresos/documentos')}>
                        Cancelar
                    </button>
                    <button style={s.btnSecondary}>Vista previa</button>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button style={s.btnSecondary} onClick={handleSave} disabled={loading}>
                        Guardar y crear nueva
                    </button>
                    <button style={s.btnPrimary} onClick={handleSave} disabled={loading}>
                        {loading ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>

            {/* MODAL */}
            {showNewClientModal && (
                <div style={s.modalOverlay}>
                    <div style={s.modal}>
                        <div style={s.modalHeader}>
                            <h3 style={s.modalTitle}>Nuevo contacto</h3>
                            <button style={s.modalClose} onClick={() => setShowNewClientModal(false)}>
                                ×
                            </button>
                        </div>
                        <div style={s.modalBody}>
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                                <button
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        backgroundColor: '#e0f2f1',
                                        color: '#00897b',
                                        border: '2px solid #00897b',
                                        borderRadius: '8px',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cliente ✓
                                </button>
                                <button
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        backgroundColor: 'white',
                                        color: '#666',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Proveedor
                                </button>
                            </div>

                            <div style={s.formField}>
                                <label style={s.label}>
                                    Tipo de identificación <span style={s.required}>*</span>
                                </label>
                                <select
                                    style={s.select}
                                    value={newClient.idType}
                                    onChange={e => setNewClient({ ...newClient, idType: e.target.value })}
                                >
                                    <option value="CC - Cédula de ciudadanía">CC - Cédula de ciudadanía</option>
                                    <option value="NIT">NIT</option>
                                    <option value="CE">CE</option>
                                </select>
                            </div>

                            <div style={{ ...s.formField, marginTop: '16px' }}>
                                <label style={s.label}>
                                    Número de identificación <span style={s.required}>*</span>
                                </label>
                                <input
                                    type="text"
                                    style={s.input}
                                    value={newClient.idNumber}
                                    onChange={e => setNewClient({ ...newClient, idNumber: e.target.value })}
                                />
                            </div>

                            <div style={{ ...s.formField, marginTop: '16px' }}>
                                <label style={s.label}>
                                    Nombre <span style={s.required}>*</span>
                                </label>
                                <input
                                    type="text"
                                    style={s.input}
                                    value={newClient.name}
                                    onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                                />
                            </div>

                            <div style={{ ...s.formField, marginTop: '16px' }}>
                                <label style={s.label}>Email</label>
                                <input
                                    type="email"
                                    style={s.input}
                                    value={newClient.email}
                                    onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                                />
                            </div>

                            <div style={s.modalBtnWrapper}>
                                <button style={s.btnSecondary} onClick={() => setShowNewClientModal(false)}>
                                    Cancelar
                                </button>
                                <button style={{ ...s.btnPrimary, flex: 1 }} onClick={handleAddClient}>
                                    Crear contacto
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RemisionTab;