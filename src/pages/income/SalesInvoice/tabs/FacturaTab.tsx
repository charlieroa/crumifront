// src/pages/income/SalesInvoice/tabs/FacturaTab.tsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentConfig } from '../Create';
import { useDispatch, useSelector } from 'react-redux';
import { addNewContact, getContacts } from '../../../../slices/crm/thunk';
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

interface FacturaTabProps {
    config: DocumentConfig;
}

// ============================================
// COMPONENTE
// ============================================
const FacturaTab: React.FC<FacturaTabProps> = ({ config }) => {
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

    // Estado para modal de resultado DIAN
    const [showDianModal, setShowDianModal] = useState(false);
    const [dianResult, setDianResult] = useState<{
        success: boolean;
        demoMode: boolean;
        invoiceNumber: string;
        dianNumber: string;
        cufe: string;
        trackId: string;
        xmlPath: string;
        total: number;
        client: string;
    } | null>(null);

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
            // Force reload if needed or let React Router handle param change (Create.tsx uses useSearchParams)
            window.location.href = `/ingresos/factura-venta/crear?tipo=${typeParam}`;
        }
    };

    // Form data
    const [formData, setFormData] = useState({
        documentType: 'Factura de Ventas',
        warehouse: 'Principal',
        priceList: 'General',
        seller: '',
        clientDocType: 'CC',
        clientDocNumber: '',
        clientName: '',
        email: '',
        // Extras requeridos por DIAN
        clientAddress: '',
        clientCity: 'Bogotá',
        clientDepartment: 'Bogotá D.C.',
        clientPhone: '',

        date: new Date().toISOString().split('T')[0],
        paymentForm: 'Contado',
        paymentMethod: '',
        notes: '',
        terms: 'Este documento se asimila en todos sus efectos a una letra de cambio de conformidad con el Art. 774 del código de comercio. Autorizo que en caso de incumplimiento de esta obligación sea reportado a las centrales de riesgo, se cobrarán intereses de mora.'
    });

    // AUTO-FILL DEMO DATA - Datos listos para producción DIAN
    const fillDemoData = () => {
        // Datos de cliente "Consumidor Final" válidos para DIAN
        setFormData(prev => ({
            ...prev,
            clientDocType: 'CC',                    // Cédula de Ciudadanía
            clientDocNumber: '222222222222',        // Número genérico para Consumidor Final
            clientName: 'CONSUMIDOR FINAL',         // Nombre estándar DIAN
            email: 'consumidor@crumi.co',           // Email válido
            clientAddress: 'Carrera 7 No. 71-21',   // Dirección real en Bogotá
            clientCity: 'Bogotá',
            clientDepartment: 'Bogotá D.C.',
            clientPhone: '6017654321',              // Teléfono fijo Bogotá
            paymentForm: 'Contado',                 // 1 = Contado
            paymentMethod: 'Efectivo',              // 10 = Efectivo
            notes: 'Factura electrónica emitida por CRUMI S.A.S'
        }));

        // Item de prueba con valores pequeños (máx $5,000)
        setItems([
            {
                id: 1,
                item: 'Servicio de Software',
                reference: 'SOFT-001',
                price: '4000',                      // $4,000 COP base
                discount: '0',
                tax: '19',                          // IVA 19%
                description: 'Prueba facturación CRUMI',
                quantity: 1,
                total: 4760                         // $4,000 + $760 IVA = $4,760
            }
        ]);

        setDocumentNumber('AUTO');

        // Mostrar confirmación visual
        console.log('✅ Datos Demo DIAN cargados - Listo para enviar a PRODUCCIÓN');
    };

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
                    clientDocNumber: foundClient.id || '', // Use ID or specific doc number field if available
                    email: foundClient.email || '',
                    // You might need to map doc type if available in backend response
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

                    // Calcular total de la línea
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

    // Cálculos de totales
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
    // GUARDAR EN BACKEND (CONECTADO)
    // ============================================
    const handleSave = async () => {
        // 1. Validaciones
        if (!formData.clientName) {
            return alert('⚠️ Debes seleccionar un cliente');
        }

        if (items.some(i => !i.item || !i.price)) {
            return alert('⚠️ Completa todos los items (nombre y precio)');
        }

        setLoading(true);

        // 2. Mapeo de medio de pago a código DIAN
        const paymentMeanCode = (() => {
            const mapping: { [key: string]: string } = {
                'Efectivo': '10',
                'Transferencia': '31',
                'Tarjeta': '48',
                'Consignación': '42'
            };
            return mapping[formData.paymentMethod] || '10';
        })();

        // 3. Construir payload para el backend
        const payload = {
            // Datos del cliente
            clientId: formData.clientDocNumber || '222222222222', // Fallback: Consumidor Final
            clientName: formData.clientName,

            // Datos generales
            paymentMethod: formData.paymentForm, // 'Contado' o 'Credito'
            paymentMeanCode: paymentMeanCode, // Código DIAN: '10', '31', etc
            reference: '', // Campo opcional
            notes: formData.notes,
            tenantId: 1, // TODO: Obtener del token JWT

            // Extras explícitos para DIAN
            clientAddress: formData.clientAddress,
            clientCity: formData.clientCity,
            clientDepartment: formData.clientDepartment,
            clientPhone: formData.clientPhone,

            // Items de la factura
            items: items.map(i => ({
                item: i.item,
                quantity: Number(i.quantity),
                unitPrice: Number(i.price),
                discount: Number(i.discount) || 0,
                tax: Number(i.tax) || 0
            }))
        };

        try {
            // 4. Obtener token
            const token = localStorage.getItem('token');

            if (!token) {
                throw new Error('No se encontró token de autenticación. Por favor inicia sesión.');
            }

            // 5. Petición HTTP
            const response = await fetch('http://localhost:3000/api/invoices', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al guardar la factura');
            }

            // 6. Éxito - Mostrar modal con información DIAN
            setDianResult({
                success: data.dian?.success || true,
                demoMode: data.dian?.demoMode || false,
                invoiceNumber: data.invoice.number,
                dianNumber: data.invoice.dianNumber || (data.dian?.trackId ? `TrackID: ${data.dian.trackId}` : 'En Proceso...'),
                cufe: data.dian?.cufe || data.invoice.cufe || 'Pendiente de generación',
                trackId: data.dian?.trackId || data.dian?.zipKey || 'N/A',
                xmlPath: data.dian?.xmlPath || '',
                total: data.invoice.total,
                client: data.invoice.client
            });
            setShowDianModal(true);
        } catch (error: any) {
            console.error('❌ Error al guardar factura:', error);
            alert(`Error al guardar la factura:\n${error.message}`);
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
                phone: '', // Opcional o agregar campo en modal
                password: 'genericPassword123' // TODO: Gestionar mejor esto, el backend lo pide
            }));

            unwrapResult(resultAction);

            // Update form
            setFormData(prev => ({
                ...prev,
                clientDocNumber: newClient.idNumber,
                clientName: newClient.name,
                email: newClient.email
            }));

            // Close modal
            setShowNewClientModal(false);
            setNewClient({ idType: 'CC - Cédula de ciudadanía', idNumber: '', name: '', email: '' });

        } catch (error: any) {
            console.error("Error creating contact:", error);
            alert('Error al crear el contacto: ' + (error.error || error.message || 'Error desconocido'));
        }
    };

    // ============================================
    // ESTILOS ALEGRA
    // ============================================
    const s: { [key: string]: React.CSSProperties } = {
        wrapper: {
            fontFamily: '"Inter", "Segoe UI", sans-serif',
            backgroundColor: '#f8f9fa',
            minHeight: '100vh',
            paddingBottom: '80px'
        },

        // Barra superior gris
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
            backgroundColor: '#00bfa5',
            color: 'white',
            border: '1px solid #00bfa5',
            fontWeight: 600
        },

        // Contenedor principal
        card: {
            backgroundColor: 'white',
            margin: '0',
            boxShadow: 'none'
        },

        // Header con logo y datos
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

        // Body
        body: {
            padding: '30px'
        },

        // Formulario
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
            color: '#00bfa5',
            fontSize: '13px',
            fontWeight: 600,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 0',
            marginTop: '4px',
            textAlign: 'left' as const
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
            color: '#00bfa5',
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

        // Footer con totales
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

        // Botones finales
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
            backgroundColor: '#00bfa5',
            color: 'white',
            border: 'none',
            padding: '10px 24px',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            opacity: loading ? 0.7 : 1
        },

        // Modal
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
                            value="Factura de Ventas"
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
                    <div>
                        <button
                            onClick={fillDemoData}
                            style={{
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '8px 16px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '12px',
                                marginTop: '14px'
                            }}
                        >
                            ⚡ Demo DIAN
                        </button>
                    </div>
                </div>

                {/* HEADER: LOGO Y DATOS */}
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
                    {/* GRID DE FORMULARIO */}
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

                        {/* Pronto Pago (placeholder) */}
                        <div style={s.formField}>
                            <label style={s.label}>Pronto Pago</label>
                            <input type="text" style={s.input} placeholder="" disabled />
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

                        {/* --- CAMPOS EXTRA DIAN --- */}
                        <div style={s.formField}>
                            <label style={s.label}>Dirección (DIAN) <span style={s.required}>*</span></label>
                            <input
                                type="text"
                                style={s.input}
                                value={formData.clientAddress}
                                onChange={e => handleFormChange('clientAddress', e.target.value)}
                                placeholder="Ej: Calle 123"
                            />
                        </div>

                        <div style={s.formField}>
                            <label style={s.label}>Ciudad <span style={s.required}>*</span></label>
                            <input
                                type="text"
                                style={s.input}
                                value={formData.clientCity}
                                onChange={e => handleFormChange('clientCity', e.target.value)}
                                placeholder="Ej: Bogotá"
                            />
                        </div>

                        <div style={s.formField}>
                            <label style={s.label}>Departamento</label>
                            <input
                                type="text"
                                style={s.input}
                                value={formData.clientDepartment}
                                onChange={e => handleFormChange('clientDepartment', e.target.value)}
                                placeholder="Ej: Cundinamarca"
                            />
                        </div>

                        <div style={s.formField}>
                            <label style={s.label}>Teléfono</label>
                            <input
                                type="text"
                                style={s.input}
                                value={formData.clientPhone}
                                onChange={e => handleFormChange('clientPhone', e.target.value)}
                                placeholder="Ej: 3001234567"
                            />
                        </div>
                    </div>

                    {/* TABLA DE ITEMS */}
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
                                                placeholder="Buscar ítem facturable"
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
                                                disabled
                                            />
                                        </td>
                                        <td style={s.td}>
                                            <input
                                                type="number"
                                                placeholder="Precio uni"
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
                                                placeholder="Descripción adicional"
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

                    {/* FOOTER: FIRMA + TOTALES */}
                    <div style={s.footerGrid}>
                        {/* Izquierda: Firma y Notas */}
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
                                    placeholder="Notas visibles en la factura..."
                                    value={formData.notes}
                                    onChange={e => handleFormChange('notes', e.target.value)}
                                    rows={4}
                                />
                            </div>
                        </div>

                        {/* Derecha: Totales */}
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

                            <div
                                style={{
                                    marginTop: '20px',
                                    padding: '16px',
                                    backgroundColor: '#f0f9ff',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    color: '#0369a1'
                                }}
                            >
                                <strong>Pago recibido</strong>
                                <p style={{ margin: '8px 0 0 0', fontSize: '12px' }}>
                                    Si te hicieron un pago asociado a esta venta puedes hacer aquí su registro.
                                </p>
                                <button style={{ ...s.newContactBtn, marginTop: '8px' }}>+ Agregar pago</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BARRA DE BOTONES FIJA */}
            <div style={s.bottomBar}>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button style={s.btnSecondary} onClick={() => navigate('/ingresos/documentos')}>
                        Cancelar
                    </button>
                    <button style={s.btnSecondary}>Vista previa</button>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button style={s.btnSecondary} onClick={handleSave} disabled={loading}>
                        {loading ? 'Procesando...' : 'Guardar borrador'}
                    </button>
                    <button style={s.btnPrimary} onClick={handleSave} disabled={loading}>
                        {loading ? 'Enviando a DIAN...' : 'Guardar y Enviar a DIAN'}
                    </button>
                </div>
            </div>

            {/* MODAL NUEVO CONTACTO */}
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
                            {/* Tabs Cliente/Proveedor */}
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

            {/* ============================================ */}
            {/* MODAL RESULTADO DIAN */}
            {/* ============================================ */}
            {showDianModal && dianResult && (
                <div style={s.modalOverlay}>
                    <div style={{ ...s.modal, width: '600px' }}>
                        <div style={{
                            padding: '24px',
                            background: dianResult.demoMode
                                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                : 'linear-gradient(135deg, #00b894 0%, #00cec9 100%)',
                            color: 'white',
                            textAlign: 'center' as const
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '8px' }}>
                                {dianResult.success ? '✅' : '❌'}
                            </div>
                            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>
                                {dianResult.success ? 'Factura Electrónica Creada' : 'Error en Factura'}
                            </h2>
                            {dianResult.demoMode && (
                                <div style={{
                                    marginTop: '8px',
                                    padding: '6px 16px',
                                    background: 'rgba(255,255,255,0.2)',
                                    borderRadius: '20px',
                                    display: 'inline-block',
                                    fontSize: '12px',
                                    fontWeight: 600
                                }}>
                                    🧪 MODO DEMO - Sin conexión real a DIAN
                                </div>
                            )}
                        </div>

                        <div style={{ padding: '24px' }}>
                            {/* Información principal */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '16px',
                                marginBottom: '20px'
                            }}>
                                <div style={{
                                    background: '#f8f9fa',
                                    padding: '16px',
                                    borderRadius: '8px'
                                }}>
                                    <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                                        Número Interno
                                    </div>
                                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>
                                        {dianResult.invoiceNumber}
                                    </div>
                                </div>
                                <div style={{
                                    background: '#f8f9fa',
                                    padding: '16px',
                                    borderRadius: '8px'
                                }}>
                                    <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                                        Número DIAN
                                    </div>
                                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>
                                        {dianResult.dianNumber}
                                    </div>
                                </div>
                            </div>

                            {/* CUFE */}
                            <div style={{
                                background: '#fef3c7',
                                border: '1px solid #fcd34d',
                                padding: '16px',
                                borderRadius: '8px',
                                marginBottom: '16px'
                            }}>
                                <div style={{ fontSize: '11px', color: '#92400e', marginBottom: '4px', fontWeight: 600 }}>
                                    🔐 CUFE (Código Único de Factura Electrónica)
                                </div>
                                <div style={{
                                    fontSize: '11px',
                                    fontFamily: 'monospace',
                                    color: '#78350f',
                                    wordBreak: 'break-all' as const
                                }}>
                                    {dianResult.cufe}
                                </div>
                            </div>

                            {/* Track ID y Cliente */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '16px',
                                marginBottom: '20px'
                            }}>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                                        Track ID
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#374151' }}>
                                        {dianResult.trackId}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                                        Cliente
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#374151' }}>
                                        {dianResult.client}
                                    </div>
                                </div>
                            </div>

                            {/* Total */}
                            <div style={{
                                background: '#111827',
                                color: 'white',
                                padding: '16px 20px',
                                borderRadius: '8px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '24px'
                            }}>
                                <span style={{ fontSize: '14px' }}>Total Factura</span>
                                <span style={{ fontSize: '24px', fontWeight: 700 }}>
                                    ${dianResult.total?.toLocaleString('es-CO')} COP
                                </span>
                            </div>

                            {/* Botones */}
                            <div style={{ display: 'flex', gap: '12px' }}>
                                {dianResult.xmlPath && (
                                    <a
                                        href={`http://localhost:3000${dianResult.xmlPath}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            ...s.btnSecondary,
                                            textDecoration: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        📄 Ver XML
                                    </a>
                                )}
                                <button
                                    style={{ ...s.btnSecondary }}
                                    onClick={() => {
                                        navigator.clipboard.writeText(dianResult.cufe);
                                        alert('CUFE copiado al portapapeles');
                                    }}
                                >
                                    📋 Copiar CUFE
                                </button>
                                <button
                                    style={{ ...s.btnPrimary, flex: 1 }}
                                    onClick={() => {
                                        setShowDianModal(false);
                                        navigate('/ingresos/documentos');
                                    }}
                                >
                                    Ir al Listado →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacturaTab;