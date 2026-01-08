// src/pages/income/SalesInvoice/tabs/PagoTab.tsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentConfig } from '../Create';
import { useDispatch, useSelector } from 'react-redux';
import { getContacts } from '../../../../slices/crm/thunk';
import AutocompleteInput from '../../../../Components/AutocompleteInput';

interface PaymentInvoice {
    id: number;
    invoiceNumber: string;
    amount: string;
}

interface PagoTabProps {
    config: DocumentConfig;
}

const PagoTab: React.FC<PagoTabProps> = ({ config }) => {
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
        clientDocType: 'CC',
        clientDocNumber: '',
        clientName: '',
        email: '',
        dateIssue: today,
        paymentDate: today,
        paymentMethod: '',
        amount: '',
        amountReceived: '',
        bankName: '',
        bankAccount: '',
        transactionReference: '',
        concept: '',
        notes: ''
    });

    const [invoices, setInvoices] = useState<PaymentInvoice[]>([
        { id: 1, invoiceNumber: '', amount: '' }
    ]);

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

    const addInvoiceLine = () => {
        const newId = Math.max(...invoices.map(i => i.id), 0) + 1;
        setInvoices(prev => [...prev, { id: newId, invoiceNumber: '', amount: '' }]);
    };

    const removeInvoiceLine = (id: number) => {
        if (invoices.length <= 1) return;
        setInvoices(prev => prev.filter(i => i.id !== id));
    };

    const updateInvoiceLine = (id: number, field: keyof PaymentInvoice, value: string) => {
        setInvoices(prev =>
            prev.map(i => (i.id === id ? { ...i, [field]: value } : i))
        );
    };

    const totalApplied = () =>
        invoices.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);

    const amountNumber = parseFloat(formData.amount) || 0;
    const amountReceivedNumber =
        parseFloat(formData.amountReceived || formData.amount) || amountNumber;

    const changeAmount = amountReceivedNumber - amountNumber;

    // =========================
    // Guardar
    // =========================
    const handleSave = async () => {
        if (!formData.clientName) {
            return alert('⚠️ Debes seleccionar un cliente');
        }
        if (!formData.paymentMethod) {
            return alert('⚠️ Debes seleccionar un medio de pago');
        }
        if (!formData.amount || amountNumber <= 0) {
            return alert('⚠️ El valor del pago debe ser mayor a 0');
        }

        setLoading(true);

        const paymentMeanCode = (() => {
            const map: Record<string, string> = {
                Efectivo: '10',
                Transferencia: '31',
                Tarjeta: '48',
                Consignación: '42'
            };
            return map[formData.paymentMethod] || '10';
        })();

        const payload = {
            tenantId: 1, // TODO: del token
            clientDocType: formData.clientDocType,
            clientDocNumber: formData.clientDocNumber || null,
            clientName: formData.clientName,
            clientEmail: formData.email || null,
            dateIssue: formData.dateIssue,
            paymentDate: formData.paymentDate,
            amount: amountNumber,
            amountReceived: amountReceivedNumber,
            paymentMethod: formData.paymentMethod,
            paymentMeanCode,
            bankName: formData.bankName || null,
            bankAccount: formData.bankAccount || null,
            transactionReference: formData.transactionReference || null,
            concept: formData.concept || 'Pago recibido',
            notes: formData.notes || null,
            invoices: invoices
                .filter(i => i.invoiceNumber && i.amount)
                .map(i => ({
                    invoiceNumber: i.invoiceNumber,
                    amountApplied: parseFloat(i.amount) || 0
                }))
        };

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No se encontró token de autenticación.');

            const response = await fetch('http://localhost:3000/api/payment-receipts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al crear el recibo de pago');
            }

            alert(
                `✅ Recibo de pago creado exitosamente\n\n` +
                `Número: ${data.receipt?.number || 'N/D'}\n` +
                `Valor: $${(data.receipt?.amount || amountNumber).toLocaleString()}`
            );

            navigate('/ingresos/documentos');
        } catch (err: any) {
            console.error('❌ Error al guardar recibo de pago:', err);
            alert(`Error al guardar el recibo de pago:\n${err.message}`);
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
            textTransform: 'uppercase',
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
            backgroundColor: '#4CAF50',
            color: 'white',
            border: '1px solid #4CAF50',
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
            textTransform: 'uppercase',
            padding: '12px',
            textAlign: 'left',
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
        deleteBtn: {
            background: 'none',
            border: 'none',
            color: '#ef4444',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '8px'
        },
        addLineBtn: {
            color: '#4CAF50',
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
            backgroundColor: '#4CAF50',
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
                {/* Barra superior */}
                <div style={s.topBar}>
                    <div>
                        <label style={s.topLabel}>Tipo de documento</label>
                        <select
                            style={{ ...s.topSelect, ...s.topSelectActive }}
                            value="Recibo de Pago"
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
                </div>

                {/* Header */}
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

                {/* Body */}
                <div style={s.body}>
                    {/* Formulario principal */}
                    <div style={s.formGrid}>
                        {/* Doc cliente */}
                        <div style={s.formField}>
                            <label style={s.label}>
                                Documento del cliente <span style={s.required}>*</span>
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
                                        placeholder="Nº identificación"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Fecha emisión */}
                        <div style={s.formField}>
                            <label style={s.label}>
                                Fecha del recibo <span style={s.required}>*</span>
                            </label>
                            <input
                                type="date"
                                style={s.input}
                                value={formData.dateIssue}
                                onChange={e => handleFormChange('dateIssue', e.target.value)}
                            />
                        </div>

                        {/* Fecha pago */}
                        <div style={s.formField}>
                            <label style={s.label}>
                                Fecha de pago <span style={s.required}>*</span>
                            </label>
                            <input
                                type="date"
                                style={s.input}
                                value={formData.paymentDate}
                                onChange={e => handleFormChange('paymentDate', e.target.value)}
                            />
                        </div>

                        {/* Nombre */}
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

                        {/* Valor pago */}
                        <div style={s.formField}>
                            <label style={s.label}>
                                Valor del pago <span style={s.required}>*</span>
                            </label>
                            <input
                                type="number"
                                style={s.input}
                                placeholder="0"
                                value={formData.amount}
                                onChange={e => handleFormChange('amount', e.target.value)}
                            />
                        </div>

                        {/* Email */}
                        <div style={s.formField}>
                            <label style={s.label}>Correo</label>
                            <input
                                type="email"
                                style={s.input}
                                value={formData.email}
                                onChange={e => handleFormChange('email', e.target.value)}
                            />
                        </div>

                        {/* Valor recibido */}
                        <div style={s.formField}>
                            <label style={s.label}>Valor recibido</label>
                            <input
                                type="number"
                                style={s.input}
                                placeholder="Si es igual al pago puedes dejarlo vacío"
                                value={formData.amountReceived}
                                onChange={e => handleFormChange('amountReceived', e.target.value)}
                            />
                        </div>

                        {/* Banco */}
                        <div style={s.formField}>
                            <label style={s.label}>Banco</label>
                            <input
                                type="text"
                                style={s.input}
                                value={formData.bankName}
                                onChange={e => handleFormChange('bankName', e.target.value)}
                            />
                        </div>

                        {/* Cuenta */}
                        <div style={s.formField}>
                            <label style={s.label}>Cuenta / Nº tarjeta</label>
                            <input
                                type="text"
                                style={s.input}
                                value={formData.bankAccount}
                                onChange={e => handleFormChange('bankAccount', e.target.value)}
                            />
                        </div>

                        {/* Referencia */}
                        <div style={s.formField}>
                            <label style={s.label}>Referencia de transacción</label>
                            <input
                                type="text"
                                style={s.input}
                                value={formData.transactionReference}
                                onChange={e =>
                                    handleFormChange('transactionReference', e.target.value)
                                }
                            />
                        </div>
                    </div>

                    {/* Tabla de facturas relacionadas */}
                    <div style={s.tableWrapper}>
                        <table style={s.table}>
                            <thead>
                                <tr>
                                    <th style={{ ...s.th, width: '60%' }}>Factura</th>
                                    <th style={{ ...s.th, width: '30%' }}>Monto aplicado</th>
                                    <th style={{ ...s.th, width: '10%' }} />
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map(line => (
                                    <tr key={line.id}>
                                        <td style={s.td}>
                                            <input
                                                type="text"
                                                style={s.inputCell}
                                                placeholder="Número o referencia de la factura"
                                                value={line.invoiceNumber}
                                                onChange={e =>
                                                    updateInvoiceLine(line.id, 'invoiceNumber', e.target.value)
                                                }
                                            />
                                        </td>
                                        <td style={s.td}>
                                            <input
                                                type="number"
                                                style={s.inputCell}
                                                placeholder="0"
                                                value={line.amount}
                                                onChange={e =>
                                                    updateInvoiceLine(line.id, 'amount', e.target.value)
                                                }
                                            />
                                        </td>
                                        <td style={{ ...s.td, textAlign: 'center' }}>
                                            <button
                                                style={s.deleteBtn}
                                                onClick={() => removeInvoiceLine(line.id)}
                                            >
                                                ✕
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <button style={s.addLineBtn} onClick={addInvoiceLine}>
                        + Agregar factura
                    </button>

                    {/* Footer */}
                    <div style={s.footerGrid}>
                        <div style={s.leftFooter}>
                            <div>
                                <div style={s.textareaLabel}>Concepto del pago</div>
                                <textarea
                                    style={s.textarea}
                                    placeholder="Ej: Abono a factura 001, pago total, anticipo..."
                                    value={formData.concept}
                                    onChange={e => handleFormChange('concept', e.target.value)}
                                    rows={3}
                                />
                            </div>
                            <div>
                                <div style={s.textareaLabel}>Notas</div>
                                <textarea
                                    style={s.textarea}
                                    placeholder="Notas visibles en el recibo..."
                                    value={formData.notes}
                                    onChange={e => handleFormChange('notes', e.target.value)}
                                    rows={4}
                                />
                            </div>
                        </div>

                        <div style={s.totalsBox}>
                            <div style={s.totalRow}>
                                <span>Valor del pago</span>
                                <span>$ {amountNumber.toLocaleString()}</span>
                            </div>
                            <div style={s.totalRow}>
                                <span>Valor recibido</span>
                                <span>$ {amountReceivedNumber.toLocaleString()}</span>
                            </div>
                            <div style={s.totalRow}>
                                <span>Cambio</span>
                                <span>$ {changeAmount.toLocaleString()}</span>
                            </div>
                            <div style={s.totalRow}>
                                <span>Total aplicado a facturas</span>
                                <span>$ {totalApplied().toLocaleString()}</span>
                            </div>
                            <div style={s.totalFinal}>
                                <span>Saldo no aplicado</span>
                                <span>$ {(amountNumber - totalApplied()).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Barra inferior */}
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
                    <button style={s.btnSecondary} onClick={handleSave} disabled={loading}>
                        Guardar y crear nuevo
                    </button>
                    <button style={s.btnPrimary} onClick={handleSave} disabled={loading}>
                        {loading ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PagoTab;
