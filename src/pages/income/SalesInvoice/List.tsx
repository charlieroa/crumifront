import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Input,
  Button,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  InputGroup,
  InputGroupText,
  Nav,
  NavItem,
  NavLink,
  Table,
  Spinner
} from 'reactstrap';
import { Link, useSearchParams } from 'react-router-dom';
import classnames from 'classnames';

type ModuleType = 'ingresos' | 'gastos';
type DocumentType = 'facturas' | 'cotizaciones' | 'remisiones' | 'pagos' | 'devoluciones' | 'notas-debito';

interface DocumentConfig {
  title: string;
  description: string;
  icon: string;
  color: string;
  emptyMessage: string;
  createRoute: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  date_issue: string;
  status: string;
  dian_status: string;
  total: number;
  created_at: string;
}

const DocumentList = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [module, setModule] = useState<ModuleType>(
    (searchParams.get('modulo') as ModuleType) || 'ingresos'
  );

  const [documentType, setDocumentType] = useState<DocumentType>(
    (searchParams.get('tipo') as DocumentType) || 'facturas'
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Cargar facturas desde el backend
  useEffect(() => {
    if (documentType === 'facturas' && module === 'ingresos') {
      loadInvoices();
    }
  }, [documentType, module]);

  const loadInvoices = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/invoices', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar facturas');
      }

      const data = await response.json();

      // Mapear las facturas al formato que espera la tabla
      const mappedDocuments = data.invoices.map((invoice: Invoice) => ({
        number: invoice.invoice_number,
        client: invoice.client_name,
        date: new Date(invoice.date_issue).toLocaleDateString('es-CO'),
        status: getStatusLabel(invoice.status, invoice.dian_status),
        statusColor: getStatusColor(invoice.status, invoice.dian_status),
        total: invoice.total,
        id: invoice.id
      }));

      setDocuments(mappedDocuments);
    } catch (err: any) {
      console.error('Error cargando facturas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Función auxiliar para obtener el label del estado
  const getStatusLabel = (status: string, dianStatus: string) => {
    if (dianStatus === 'APROBADA') return 'Aprobada DIAN';
    if (dianStatus === 'RECHAZADA') return 'Rechazada DIAN';
    if (dianStatus === 'BORRADOR') return 'Borrador';
    if (status === 'PAGADA') return 'Pagada';
    if (status === 'PENDIENTE') return 'Pendiente';
    return 'Desconocido';
  };

  // Función auxiliar para obtener el color del badge
  const getStatusColor = (status: string, dianStatus: string) => {
    if (dianStatus === 'APROBADA') return 'success';
    if (dianStatus === 'RECHAZADA') return 'danger';
    if (dianStatus === 'BORRADOR') return 'warning';
    if (status === 'PAGADA') return 'info';
    if (status === 'PENDIENTE') return 'secondary';
    return 'dark';
  };

  // ✅ NUEVA FUNCIÓN: Descargar XML
  const handleDownloadXML = async (invoiceId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/invoices/${invoiceId}/download-xml`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al descargar XML');
      }

      // Crear blob y descargar
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factura-${invoiceId}.xml`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Error descargando XML:', err);
      alert(`Error: ${err.message}`);
    }
  };

  // ✅ NUEVA FUNCIÓN: Ver XML en nueva pestaña
  const handleViewXML = (invoiceId: string) => {
    const token = localStorage.getItem('token');
    const url = `http://localhost:3000/api/invoices/${invoiceId}/view-xml`;

    // Abrir en nueva pestaña con el token en el header (via fetch y blob)
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      })
      .catch(err => {
        console.error('Error viendo XML:', err);
        alert('Error al abrir el XML');
      });
  };

  // Configuración por tipo de documento
  const documentConfigs: Record<ModuleType, Record<DocumentType, DocumentConfig>> = {
    ingresos: {
      facturas: {
        title: 'Facturas de venta',
        description: 'Crea, edita y gestiona facturas detalladas para tus transacciones comerciales.',
        icon: 'ri-file-list-3-line',
        color: '#00BFA5',
        emptyMessage: '¡Aún no tienes facturas de venta!',
        createRoute: '/ingresos/factura-venta/crear?tipo=factura'
      },
      cotizaciones: {
        title: 'Cotizaciones',
        description: 'Genera propuestas comerciales y presupuestos para tus clientes.',
        icon: 'ri-file-text-line',
        color: '#2196F3',
        emptyMessage: '¡Aún no tienes cotizaciones!',
        createRoute: '/ingresos/factura-venta/crear?tipo=cotizacion'
      },
      remisiones: {
        title: 'Remisiones',
        description: 'Gestiona documentos de envío y entregas de mercancías.',
        icon: 'ri-truck-line',
        color: '#FF9800',
        emptyMessage: '¡Aún no tienes remisiones!',
        createRoute: '/ingresos/factura-venta/crear?tipo=remision'
      },
      pagos: {
        title: 'Pagos recibidos',
        description: 'Registra y organiza todos los pagos que recibes de tus clientes.',
        icon: 'ri-money-dollar-circle-line',
        color: '#4CAF50',
        emptyMessage: '¡Aún no tienes pagos registrados!',
        createRoute: '/ingresos/factura-venta/crear?tipo=pago'
      },
      devoluciones: {
        title: 'Devoluciones',
        description: 'Registra devoluciones y notas de crédito a clientes.',
        icon: 'ri-arrow-go-back-line',
        color: '#9C27B0',
        emptyMessage: '¡Aún no tienes devoluciones!',
        createRoute: '/ingresos/factura-venta/crear?tipo=nota-credito'
      },
      'notas-debito': {
        title: 'Notas débito',
        description: 'Registra incrementos o correcciones en las facturas a clientes.',
        icon: 'ri-add-circle-line',
        color: '#F44336',
        emptyMessage: '¡Aún no tienes notas de débito!',
        createRoute: '/ingresos/factura-venta/crear?tipo=nota-debito'
      }
    },
    gastos: {
      facturas: {
        title: 'Facturas de compra',
        description: 'Registra y gestiona las facturas de tus proveedores.',
        icon: 'ri-shopping-cart-line',
        color: '#FF5722',
        emptyMessage: '¡Aún no tienes facturas de compra!',
        createRoute: '/gastos/factura-compra/crear?tipo=factura'
      },
      cotizaciones: {
        title: 'Órdenes de compra',
        description: 'Gestiona órdenes de compra a proveedores.',
        icon: 'ri-file-list-2-line',
        color: '#607D8B',
        emptyMessage: '¡Aún no tienes órdenes de compra!',
        createRoute: '/gastos/factura-compra/crear?tipo=orden'
      },
      remisiones: {
        title: 'Documento soporte',
        description: 'Registra documentos equivalentes de proveedores.',
        icon: 'ri-file-paper-line',
        color: '#795548',
        emptyMessage: '¡Aún no tienes documentos soporte!',
        createRoute: '/gastos/factura-compra/crear?tipo=documento-soporte'
      },
      pagos: {
        title: 'Pagos realizados',
        description: 'Registra pagos a proveedores y gastos.',
        icon: 'ri-wallet-3-line',
        color: '#E91E63',
        emptyMessage: '¡Aún no tienes pagos realizados!',
        createRoute: '/gastos/factura-compra/crear?tipo=pago'
      },
      devoluciones: {
        title: 'Notas de ajuste',
        description: 'Registra ajustes en facturas de compra.',
        icon: 'ri-edit-circle-line',
        color: '#9C27B0',
        emptyMessage: '¡Aún no tienes notas de ajuste!',
        createRoute: '/gastos/factura-compra/crear?tipo=nota-ajuste'
      },
      'notas-debito': {
        title: 'Notas débito compras',
        description: 'Registra notas de débito de proveedores.',
        icon: 'ri-subtract-line',
        color: '#F44336',
        emptyMessage: '¡Aún no tienes notas de débito!',
        createRoute: '/gastos/factura-compra/crear?tipo=nota-debito'
      }
    }
  };

  const currentConfig = documentConfigs[module][documentType];

  const handleModuleChange = (newModule: ModuleType) => {
    setModule(newModule);
    setDocumentType('facturas');
    setSearchParams({ modulo: newModule, tipo: 'facturas' });
  };

  const handleDocumentTypeChange = (newType: DocumentType) => {
    setDocumentType(newType);
    setSearchParams({ modulo: module, tipo: newType });
  };

  document.title = `${currentConfig.title} | Sistema de Gestión`;

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          {/* Tabs principales: Ingresos / Gastos */}
          <Row className="mb-3">
            <Col xs={12}>
              <Nav tabs className="nav-tabs-custom">
                <NavItem>
                  <NavLink
                    className={classnames({ active: module === 'ingresos' })}
                    onClick={() => handleModuleChange('ingresos')}
                    style={{ cursor: 'pointer' }}
                  >
                    <i className="ri-money-dollar-circle-line me-1"></i>
                    Ingresos
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={classnames({ active: module === 'gastos' })}
                    onClick={() => handleModuleChange('gastos')}
                    style={{ cursor: 'pointer' }}
                  >
                    <i className="ri-shopping-cart-line me-1"></i>
                    Gastos
                  </NavLink>
                </NavItem>
              </Nav>
            </Col>
          </Row>

          {/* Subtabs: Tipos de documentos */}
          <Row className="mb-3">
            <Col xs={12}>
              <Nav pills className="nav-pills-custom gap-2">
                <NavItem>
                  <NavLink
                    className={classnames({ active: documentType === 'facturas' })}
                    onClick={() => handleDocumentTypeChange('facturas')}
                    style={{ cursor: 'pointer' }}
                  >
                    {module === 'ingresos' ? 'Facturas' : 'Facturas compra'}
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={classnames({ active: documentType === 'cotizaciones' })}
                    onClick={() => handleDocumentTypeChange('cotizaciones')}
                    style={{ cursor: 'pointer' }}
                  >
                    {module === 'ingresos' ? 'Cotizaciones' : 'Órdenes compra'}
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={classnames({ active: documentType === 'remisiones' })}
                    onClick={() => handleDocumentTypeChange('remisiones')}
                    style={{ cursor: 'pointer' }}
                  >
                    {module === 'ingresos' ? 'Remisiones' : 'Doc. soporte'}
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={classnames({ active: documentType === 'pagos' })}
                    onClick={() => handleDocumentTypeChange('pagos')}
                    style={{ cursor: 'pointer' }}
                  >
                    {module === 'ingresos' ? 'Pagos recibidos' : 'Pagos realizados'}
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={classnames({ active: documentType === 'devoluciones' })}
                    onClick={() => handleDocumentTypeChange('devoluciones')}
                    style={{ cursor: 'pointer' }}
                  >
                    {module === 'ingresos' ? 'Devoluciones' : 'Notas ajuste'}
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={classnames({ active: documentType === 'notas-debito' })}
                    onClick={() => handleDocumentTypeChange('notas-debito')}
                    style={{ cursor: 'pointer' }}
                  >
                    Notas débito
                  </NavLink>
                </NavItem>
              </Nav>
            </Col>
          </Row>

          {/* Header con título y botones */}
          <Row className="mb-3">
            <Col xs={12}>
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div>
                  <h4 className="mb-1">{currentConfig.title}</h4>
                  <p className="text-muted mb-0">
                    {currentConfig.description}{' '}
                    <Link to="#" className="text-primary">Saber más.</Link>
                  </p>
                </div>
                <div className="d-flex gap-2 flex-shrink-0">
                  {/* Botón Exportar */}
                  <UncontrolledDropdown>
                    <DropdownToggle tag="button" className="btn btn-light">
                      <i className="ri-download-line me-1"></i> Exportar
                    </DropdownToggle>
                    <DropdownMenu>
                      <DropdownItem>Exportar PDF</DropdownItem>
                      <DropdownItem>Exportar Excel</DropdownItem>
                    </DropdownMenu>
                  </UncontrolledDropdown>

                  {/* Botón Nuevo */}
                  <Button
                    tag={Link}
                    to={currentConfig.createRoute}
                    color="success"
                  >
                    <i className="ri-add-line me-1"></i>
                    Nuevo
                  </Button>
                </div>
              </div>
            </Col>
          </Row>

          {/* Filtros y búsqueda */}
          <Row className="mb-3">
            <Col xs={12}>
              <div className="d-flex gap-3 align-items-center">
                <div className="flex-grow-1">
                  <InputGroup>
                    <InputGroupText className="bg-white">
                      <i className="ri-search-line text-muted"></i>
                    </InputGroupText>
                    <Input
                      type="text"
                      placeholder={`Buscar en ${currentConfig.title.toLowerCase()}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </div>
                <Button color="light" outline>
                  <i className="ri-filter-line me-1"></i> Filtrar
                </Button>
              </div>
            </Col>
          </Row>

          {/* Contenido principal */}
          <Row>
            <Col xs={12}>
              <Card className="mb-0">
                <CardBody className="p-0">
                  {loading ? (
                    // Estado de carga
                    <div className="text-center py-5">
                      <Spinner color="primary" />
                      <p className="text-muted mt-3">Cargando facturas...</p>
                    </div>
                  ) : error ? (
                    // Estado de error
                    <div className="text-center py-5">
                      <i className="ri-error-warning-line" style={{ fontSize: '3rem', color: '#dc3545' }}></i>
                      <p className="text-danger mt-3">{error}</p>
                      <Button color="primary" onClick={loadInvoices}>Reintentar</Button>
                    </div>
                  ) : documents.length === 0 ? (
                    // Estado vacío
                    <div
                      className="text-center py-5"
                      style={{
                        minHeight: '400px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column'
                      }}
                    >
                      <div className="mb-4">
                        <i
                          className={currentConfig.icon}
                          style={{ fontSize: '5rem', color: '#adb5bd' }}
                        ></i>
                      </div>
                      <h5 className="mb-2 fw-semibold">
                        {currentConfig.emptyMessage}
                      </h5>
                      <p className="text-muted mb-4" style={{ maxWidth: '400px' }}>
                        Parece que no has generado ningún documento hasta ahora.
                      </p>
                      <Button
                        tag={Link}
                        to={currentConfig.createRoute}
                        style={{
                          backgroundColor: currentConfig.color,
                          borderColor: currentConfig.color,
                          color: 'white'
                        }}
                      >
                        Crear {currentConfig.title.toLowerCase()}
                      </Button>
                    </div>
                  ) : (
                    // Tabla con datos
                    <div className="table-responsive">
                      <Table className="table-nowrap align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Número</th>
                            <th>{module === 'ingresos' ? 'Cliente' : 'Proveedor'}</th>
                            <th>Fecha</th>
                            <th>Estado</th>
                            <th className="text-end">Total</th>
                            <th className="text-end">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {documents.map((doc, idx) => (
                            <tr key={idx}>
                              <td className="fw-medium">{doc.number}</td>
                              <td>{doc.client}</td>
                              <td>{doc.date}</td>
                              <td>
                                <span className={`badge badge-soft-${doc.statusColor}`}>
                                  {doc.status}
                                </span>
                              </td>
                              <td className="text-end fw-medium">${doc.total.toLocaleString('es-CO')}</td>
                              <td className="text-end">
                                <UncontrolledDropdown>
                                  <DropdownToggle tag="button" className="btn btn-sm btn-light">
                                    <i className="ri-more-2-fill"></i>
                                  </DropdownToggle>
                                  <DropdownMenu end>
                                    <DropdownItem>
                                      <i className="ri-eye-line me-2"></i>Ver detalle
                                    </DropdownItem>
                                    <DropdownItem onClick={() => handleViewXML(doc.id)}>
                                      <i className="ri-file-code-line me-2"></i>Ver XML
                                    </DropdownItem>
                                    <DropdownItem onClick={() => handleDownloadXML(doc.id)}>
                                      <i className="ri-download-2-line me-2"></i>Descargar XML
                                    </DropdownItem>
                                    <DropdownItem divider />
                                    <DropdownItem>
                                      <i className="ri-edit-line me-2"></i>Editar
                                    </DropdownItem>
                                    <DropdownItem className="text-danger">
                                      <i className="ri-delete-bin-line me-2"></i>Eliminar
                                    </DropdownItem>
                                  </DropdownMenu>
                                </UncontrolledDropdown>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </CardBody>

                {/* Paginación */}
                {documents.length > 0 && (
                  <div
                    className="d-flex justify-content-between align-items-center px-4 py-3 border-top"
                    style={{ backgroundColor: '#f9fafb' }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-muted small">Ítems por página:</span>
                      <select
                        className="form-select form-select-sm"
                        style={{ width: '80px' }}
                        value={itemsPerPage}
                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <span className="text-muted small ms-2">
                        1-{documents.length} de {documents.length}
                      </span>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <span className="text-muted small">Página</span>
                      <Input
                        type="number"
                        className="form-control form-control-sm text-center"
                        style={{ width: '70px' }}
                        value={currentPage}
                        min={1}
                        readOnly
                      />
                      <span className="text-muted small">de 1</span>
                      <Button
                        color="light"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                      >
                        <i className="ri-arrow-left-s-line"></i>
                      </Button>
                      <Button
                        color="light"
                        size="sm"
                        disabled={documents.length === 0}
                        onClick={() => setCurrentPage(currentPage + 1)}
                      >
                        <i className="ri-arrow-right-s-line"></i>
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default DocumentList;