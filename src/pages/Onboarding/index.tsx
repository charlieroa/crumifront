// src/pages/Onboarding/index.tsx
// Asistente IA estilo ChatGPT

import React, { useState, useEffect, useRef } from 'react';

interface ChatMessage {
    id: number;
    role: 'user' | 'assistant';
    content: string;
    isTyping?: boolean;
}

const OnboardingPage: React.FC = () => {
    const [chatMessage, setChatMessage] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isAiTyping, setIsAiTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll automático al final de los mensajes
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        document.title = "Asistente IA | Crumi";
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Simular respuesta de IA con efecto de typing
    const simulateAiResponse = (fullResponse: string) => {
        setIsAiTyping(true);

        const newMessageId = Date.now();

        // Agregar mensaje vacío de la IA
        setMessages(prev => [...prev, {
            id: newMessageId,
            role: 'assistant',
            content: '',
            isTyping: true
        }]);

        let currentIndex = 0;

        // Efecto de typing carácter por carácter
        const typingInterval = setInterval(() => {
            currentIndex++;

            setMessages(prev => prev.map(msg =>
                msg.id === newMessageId
                    ? { ...msg, content: fullResponse.slice(0, currentIndex) }
                    : msg
            ));

            if (currentIndex >= fullResponse.length) {
                clearInterval(typingInterval);
                setIsAiTyping(false);
                setMessages(prev => prev.map(msg =>
                    msg.id === newMessageId
                        ? { ...msg, isTyping: false }
                        : msg
                ));
            }
        }, 20); // 20ms por carácter
    };

    // Respuestas simuladas de la IA
    const getAiResponse = (userMessage: string): string => {
        const lowerMsg = userMessage.toLowerCase();

        if (lowerMsg.includes('factura') && lowerMsg.includes('carlos')) {
            return `Entendido, voy a crear una factura para Carlos Roa.\n\n📄 **Factura Electrónica**\n• Cliente: Carlos Roa\n• NIT: Pendiente\n• Fecha: ${new Date().toLocaleDateString('es-CO')}\n\n¿Qué productos o servicios deseas agregar a esta factura?`;
        }

        if (lowerMsg.includes('factura')) {
            return '¡Perfecto! Voy a ayudarte a crear una factura. ¿Podrías decirme el nombre del cliente y los productos o servicios a facturar?';
        }

        if (lowerMsg.includes('nota') && lowerMsg.includes('credito')) {
            return 'Entendido, necesitas crear una Nota Crédito. ¿Cuál es el número de la factura original que deseas anular o modificar?';
        }

        if (lowerMsg.includes('nota') && lowerMsg.includes('debito')) {
            return 'Voy a ayudarte con una Nota Débito. ¿Cuál es el motivo del ajuste y a qué factura corresponde?';
        }

        if (lowerMsg.includes('nomina') || lowerMsg.includes('nómina')) {
            return 'Entendido, vamos a generar la nómina. ¿Para qué período? ¿Primera o segunda quincena del mes?';
        }

        if (lowerMsg.includes('vendido') || lowerMsg.includes('ventas')) {
            return `📊 **Resumen de Ventas - Diciembre 2024**\n\n💰 Total facturado: $12,450,000\n📄 Facturas emitidas: 23\n📈 Comparado con Nov: +15%\n\n**Top productos:**\n1. Servicio de consultoría - $4,200,000\n2. Mantenimiento mensual - $3,800,000\n3. Desarrollo web - $2,500,000\n\n¿Quieres ver más detalles o exportar este reporte?`;
        }

        if (lowerMsg.includes('estado financiero') || lowerMsg.includes('financiero actual')) {
            return `📈 **Estado Financiero - ${new Date().toLocaleDateString('es-CO')}**\n\n**Ingresos del mes:**\n• Facturación: $12,450,000\n• Cobros recibidos: $9,800,000\n\n**Egresos del mes:**\n• Nómina: $4,500,000\n• Proveedores: $2,300,000\n• Otros gastos: $890,000\n\n**Balance:**\n✅ Flujo de caja: +$2,110,000\n📊 Cuentas por cobrar: $4,650,000\n\n¿Necesitas un reporte más detallado o exportarlo a Excel?`;
        }

        if (lowerMsg.includes('cliente')) {
            return '¡Claro! Puedo ayudarte a registrar un nuevo cliente. Necesito: Nombre completo, NIT o Cédula, Dirección y Email. ¿Tienes estos datos?';
        }

        if (lowerMsg.includes('hola') || lowerMsg.includes('buenos') || lowerMsg.includes('buenas')) {
            return `¡Hola! Soy tu asistente de Crumi. Puedo ayudarte a:\n\n• 📄 Crear facturas electrónicas\n• 📝 Generar notas crédito/débito\n• 💰 Preparar la nómina\n• 📊 Consultar ventas y reportes\n• 📈 Ver estados financieros\n\n¿En qué puedo ayudarte hoy?`;
        }

        return `Entendido. Voy a procesar tu solicitud: "${userMessage}"\n\n🤖 Esta es una respuesta simulada. Próximamente integraré la inteligencia artificial para ayudarte de manera más precisa.\n\n¿Hay algo más en lo que pueda ayudarte?`;
    };

    const handleChatSubmit = () => {
        if (!chatMessage.trim() || isAiTyping) return;

        // Agregar mensaje del usuario
        const userMsg: ChatMessage = {
            id: Date.now(),
            role: 'user',
            content: chatMessage.trim()
        };

        setMessages(prev => [...prev, userMsg]);
        setChatMessage('');

        // Simular respuesta de IA después de un breve delay
        setTimeout(() => {
            const aiResponse = getAiResponse(userMsg.content);
            simulateAiResponse(aiResponse);
        }, 500);
    };

    return (
        <div className="page-content">
            <div style={styles.container}>
                {/* Área de mensajes / contenido central */}
                <div style={styles.chatArea}>
                    {/* Estado vacío - centrado verticalmente */}
                    {messages.length === 0 && (
                        <div style={styles.emptyState}>
                            <div style={styles.emptyIcon}>✨</div>
                            <h1 style={styles.emptyTitle}>¿En qué puedo ayudarte hoy?</h1>
                            <p style={styles.emptySubtitle}>Soy tu asistente de Crumi. Puedo crear facturas, generar nóminas, y más.</p>

                            {/* Sugerencias */}
                            <div style={styles.suggestions}>
                                <button
                                    style={styles.suggestionBtn}
                                    onClick={() => setChatMessage('Créame una factura para Carlos Roa')}
                                >
                                    📄 Crear factura
                                </button>
                                <button
                                    style={styles.suggestionBtn}
                                    onClick={() => setChatMessage('Necesito generar la nómina de este mes')}
                                >
                                    💰 Generar nómina
                                </button>
                                <button
                                    style={styles.suggestionBtn}
                                    onClick={() => setChatMessage('¿Cuánto he vendido este mes?')}
                                >
                                    📊 Ventas del mes
                                </button>
                                <button
                                    style={styles.suggestionBtn}
                                    onClick={() => setChatMessage('Crea un estado financiero actual de mi negocio')}
                                >
                                    📈 Estado financiero
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Mensajes de la conversación */}
                    {messages.length > 0 && (
                        <div style={styles.messagesContainer}>
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    style={{
                                        ...styles.messageRow,
                                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                                    }}
                                >
                                    {msg.role === 'assistant' && (
                                        <div style={styles.aiAvatar}>✨</div>
                                    )}
                                    <div style={{
                                        ...styles.messageBubble,
                                        ...(msg.role === 'user' ? styles.userBubble : styles.aiBubble)
                                    }}>
                                        {msg.content}
                                        {msg.isTyping && <span style={styles.cursor}>|</span>}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Input fijo abajo */}
                <div style={styles.inputWrapper}>
                    <div style={styles.inputContainer}>
                        {/* Botón de adjuntar documento */}
                        <button
                            style={styles.attachBtn}
                            onClick={() => {
                                // TODO: Implementar carga de documentos
                                alert('📎 Función de adjuntar documentos próximamente');
                            }}
                            title="Adjuntar documento"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                            </svg>
                        </button>

                        <textarea
                            style={styles.chatInput}
                            placeholder="Pregunta lo que quieras..."
                            value={chatMessage}
                            onChange={e => setChatMessage(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleChatSubmit();
                                }
                            }}
                            disabled={isAiTyping}
                            rows={1}
                        />
                        <button
                            style={{
                                ...styles.sendBtn,
                                opacity: chatMessage.trim() && !isAiTyping ? 1 : 0.4
                            }}
                            onClick={handleChatSubmit}
                            disabled={!chatMessage.trim() || isAiTyping}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                            </svg>
                        </button>
                    </div>
                    {isAiTyping && (
                        <div style={styles.typingText}>✨ escribiendo...</div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ============================================
// ESTILOS - Diseño estilo ChatGPT
// ============================================
const styles: { [key: string]: React.CSSProperties } = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 130px)',
        background: '#f9fafb',
        position: 'relative'
    },
    // Área central del chat
    chatArea: {
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px'
    },
    // Estado vacío - centrado
    emptyState: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '40px 20px'
    },
    emptyIcon: {
        fontSize: '56px',
        marginBottom: '16px'
    },
    emptyTitle: {
        fontSize: '28px',
        fontWeight: 700,
        color: '#111827',
        margin: '0 0 12px 0'
    },
    emptySubtitle: {
        fontSize: '15px',
        color: '#6b7280',
        margin: '0 0 32px 0',
        maxWidth: '450px',
        lineHeight: 1.6
    },
    // Sugerencias
    suggestions: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        justifyContent: 'center'
    },
    suggestionBtn: {
        padding: '10px 18px',
        fontSize: '13px',
        fontWeight: 500,
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '24px',
        cursor: 'pointer',
        color: '#374151',
        transition: 'all 0.2s',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    },
    // Contenedor de mensajes
    messagesContainer: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        maxWidth: '800px',
        width: '100%',
        margin: '0 auto',
        paddingBottom: '20px'
    },
    messageRow: {
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start'
    },
    aiAvatar: {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        flexShrink: 0
    },
    messageBubble: {
        padding: '12px 16px',
        borderRadius: '18px',
        maxWidth: '70%',
        whiteSpace: 'pre-wrap',
        fontSize: '14px',
        lineHeight: 1.6
    },
    userBubble: {
        background: '#111827',
        color: 'white',
        borderBottomRightRadius: '4px'
    },
    aiBubble: {
        background: 'white',
        color: '#111827',
        borderBottomLeftRadius: '4px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    },
    cursor: {
        fontWeight: 'bold',
        animation: 'blink 1s infinite'
    },
    // Input fijo abajo
    inputWrapper: {
        padding: '16px 20px 24px',
        background: '#f9fafb',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px'
    },
    inputContainer: {
        display: 'flex',
        alignItems: 'flex-end',
        gap: '12px',
        background: 'white',
        border: '1px solid #d1d5db',
        borderRadius: '24px',
        padding: '12px 16px',
        width: '100%',
        maxWidth: '800px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    },
    attachBtn: {
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        border: 'none',
        background: 'transparent',
        color: '#6b7280',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 0.2s'
    },
    chatInput: {
        flex: 1,
        border: 'none',
        background: 'transparent',
        fontSize: '15px',
        resize: 'none',
        outline: 'none',
        minHeight: '24px',
        maxHeight: '150px',
        fontFamily: 'inherit',
        color: '#111827',
        lineHeight: 1.5
    },
    sendBtn: {
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        border: 'none',
        background: '#111827',
        color: 'white',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 0.2s'
    },
    typingText: {
        fontSize: '12px',
        color: '#667eea',
        fontWeight: 500
    }
};

export default OnboardingPage;
