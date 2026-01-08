// src/pages/income/SalesInvoice/Create.tsx
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import FacturaTab from './tabs/FacturaTab';
import CotizacionTab from './tabs/CotizacionTab';
import RemisionTab from './tabs/RemisionTab';
import NotaDebitoTab from './tabs/NotaDebitoTab';
import NotaCreditoTab from './tabs/NotaCreditoTab';
import PagoTab from './tabs/PagoTab';

type DocumentType =
  | 'factura'
  | 'cotizacion'
  | 'remision'
  | 'nota-debito'
  | 'nota-credito'
  | 'pago';

// ✅ EXPORTA esta interface
export interface DocumentConfig {
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  numberLabel: string;
}

const DOCUMENT_CONFIGS: Record<DocumentType, DocumentConfig> = {
  factura: {
    title: 'Factura de Ventas',
    subtitle: 'Documento fiscal',
    icon: '📄',
    color: '#00BFA5',
    numberLabel: 'Factura No.'
  },
  cotizacion: {
    title: 'Cotización',
    subtitle: 'Propuesta comercial',
    icon: '📋',
    color: '#2196F3',
    numberLabel: 'Cotización No.'
  },
  remision: {
    title: 'Remisión',
    subtitle: 'Documento de entrega',
    icon: '📦',
    color: '#FF9800',
    numberLabel: 'Remisión No.'
  },
  'nota-debito': {
    title: 'Nota Débito',
    subtitle: 'Ajuste a favor del vendedor',
    icon: '📈',
    color: '#E91E63',
    numberLabel: 'Nota Débito No.'
  },
  'nota-credito': {
    title: 'Nota Crédito',
    subtitle: 'Ajuste a favor del cliente',
    icon: '📉',
    color: '#9C27B0',
    numberLabel: 'Nota Crédito No.'
  },
  pago: {
    title: 'Recibo de Pago',
    subtitle: 'Registro de pago recibido',
    icon: '💰',
    color: '#4CAF50',
    numberLabel: 'Recibo No.'
  }
};

const TAB_ORDER: DocumentType[] = [
  'factura',
  'cotizacion',
  'remision',
  'nota-debito',
  'nota-credito',
  'pago'
];

const Create: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tipoParam = searchParams.get('tipo') as DocumentType | null;

  const [documentType, setDocumentType] = useState<DocumentType>(
    tipoParam && DOCUMENT_CONFIGS[tipoParam] ? tipoParam : 'factura'
  );

  const handleTabChange = (type: DocumentType) => {
    setDocumentType(type);
    window.history.replaceState({}, '', `/ingresos/nuevo?tipo=${type}`);
  };

  const currentConfig = DOCUMENT_CONFIGS[documentType];

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    wrapper: {
      maxWidth: '1100px',
      margin: '0 auto',
      marginTop: '4rem',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    tabsContainer: {
      display: 'flex',
      borderBottom: '2px solid #e0e0e0',
      backgroundColor: '#fafafa',
      borderRadius: '8px 8px 0 0',
      overflow: 'hidden'
    },
    tab: {
      flex: 1,
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      cursor: 'pointer',
      border: 'none',
      backgroundColor: 'transparent',
      fontSize: '14px',
      fontWeight: 500,
      color: '#666',
      transition: 'all 0.2s',
      borderBottom: '3px solid transparent'
    },
    tabActive: {
      backgroundColor: 'white',
      color: '#333',
      fontWeight: 600
    },
    tabIcon: {
      fontSize: '18px'
    },
    placeholder: {
      padding: '40px',
      textAlign: 'center' as const,
      color: '#999',
      fontSize: '16px'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        {/* TABS */}
        <div style={styles.tabsContainer}>
          {TAB_ORDER.map(type => (
            <button
              key={type}
              style={{
                ...styles.tab,
                ...(documentType === type
                  ? { ...styles.tabActive, borderBottomColor: DOCUMENT_CONFIGS[type].color }
                  : {})
              }}
              onClick={() => handleTabChange(type)}
            >
              <span style={styles.tabIcon}>{DOCUMENT_CONFIGS[type].icon}</span>
              <span>{DOCUMENT_CONFIGS[type].title}</span>
            </button>
          ))}
        </div>

        {/* CONTENIDO DEL TAB ACTIVO */}
        {documentType === 'factura' && <FacturaTab config={currentConfig} />}
        {documentType === 'cotizacion' && <CotizacionTab config={currentConfig} />}
        {documentType === 'remision' && <RemisionTab config={currentConfig} />}

        {documentType === 'nota-debito' && <NotaDebitoTab config={currentConfig} />}

        {documentType === 'nota-credito' && <NotaCreditoTab config={currentConfig} />}

        {documentType === 'pago' && <PagoTab config={currentConfig} />}
      </div>
    </div>
  );
};

export default Create;
