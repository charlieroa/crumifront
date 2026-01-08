// src/pages/Landing/index.tsx
// Landing page estilo ContAI - Contabilidad con IA

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

export default function LandingPage() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);
  const orbitRef = useRef<HTMLDivElement | null>(null);
  const walkthroughRef = useRef<HTMLElement | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  // Estado del chat demo
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 1, role: 'assistant', content: '¡Hola! Soy tu asistente de contabilidad. ¿Qué buscas hoy?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatBodyRef = useRef<HTMLDivElement>(null);

  // Scroll automático al final del chat cuando hay nuevos mensajes
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [chatMessages, isTyping]);

  const year = useMemo(() => new Date().getFullYear(), []);

  // Función para simular respuesta de IA
  const handleChatSubmit = () => {
    if (!chatInput.trim() || isTyping) return;

    const userMsg: ChatMessage = { id: Date.now(), role: 'user', content: chatInput.trim() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    // Simular respuesta después de 1 segundo
    setTimeout(() => {
      const lowerMsg = chatInput.toLowerCase();
      let response = '';

      if (lowerMsg.includes('hola') || lowerMsg.includes('buenos') || lowerMsg.includes('buenas')) {
        response = '¡Hola! Soy Crumi, tu asistente de contabilidad con IA. Puedo ayudarte con facturas, nómina y documentos. ¿Qué necesitas?';
      } else if (lowerMsg.includes('factura')) {
        response = '📄 ¡Perfecto! Puedo ayudarte a crear facturas electrónicas DIAN. Solo dime el cliente y el monto.';
      } else if (lowerMsg.includes('nomina') || lowerMsg.includes('nómina')) {
        response = '💼 Entendido. Te ayudo con la liquidación de nómina. ¿Primera o segunda quincena?';
      } else if (lowerMsg.includes('crumi') || lowerMsg.includes('qué es') || lowerMsg.includes('ayuda')) {
        response = '🤖 Crumi es tu backoffice con IA: facturación DIAN, nómina automática y gestión documental. Todo desde un chat, sin módulos complicados.';
      } else {
        response = '¡Entendido! Puedo ayudarte con facturas, nómina y documentos. ¿Qué prefieres hacer?';
      }

      setChatMessages(prev => [...prev, { id: Date.now(), role: 'assistant', content: response }]);
      setIsTyping(false);
    }, 1000);
  };


  useEffect(() => {
    document.title = "Crumi - Contabilidad con IA";

    let ctx: any;
    let stepObserver: IntersectionObserver | null = null;

    // Setup Intersection Observer for walkthrough steps (CSS-based, no GSAP pin)
    const setupStepObserver = () => {
      const steps = document.querySelectorAll("[data-step]");

      stepObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const stepIndex = Array.from(steps).indexOf(entry.target as Element);
              if (stepIndex >= 0) {
                setActiveStep(stepIndex);
              }
            }
          });
        },
        {
          root: null,
          rootMargin: "-40% 0px -40% 0px", // Trigger when step is in the middle 20% of viewport
          threshold: 0,
        }
      );

      steps.forEach((step) => stepObserver?.observe(step));
    };

    setupStepObserver();

    // GSAP for decorative animations only (not walkthrough logic)
    (async () => {
      try {
        // @ts-ignore
        const mod = await import("gsap");
        // @ts-ignore
        const st = await import("gsap/ScrollTrigger");
        const gsap: any = mod.gsap || mod.default;
        const ScrollTrigger: any = st.ScrollTrigger || st.default;
        gsap.registerPlugin(ScrollTrigger);

        if (!rootRef.current) return;

        ctx = gsap.context(() => {
          gsap.set("[data-float]", { willChange: "transform" });

          // Floating blobs
          const floats: any[] = gsap.utils.toArray("[data-float]");
          floats.forEach((el: any, i: number) => {
            gsap.to(el, {
              y: i % 2 === 0 ? -18 : 16,
              x: i % 3 === 0 ? 12 : -10,
              rotate: i % 2 === 0 ? 6 : -5,
              duration: 3.8 + i * 0.35,
              ease: "sine.inOut",
              yoyo: true,
              repeat: -1,
            });
          });

          // Parallax orbit background
          if (orbitRef.current && heroRef.current) {
            gsap.to(orbitRef.current, {
              yPercent: -12,
              ease: "none",
              scrollTrigger: {
                trigger: heroRef.current,
                start: "top top",
                end: "bottom top",
                scrub: 1,
              },
            });
          }

          // Reveal animations
          const reveals: any[] = gsap.utils.toArray("[data-reveal]");
          reveals.forEach((el: any) => {
            gsap.fromTo(
              el,
              { y: 18, opacity: 0, filter: "blur(8px)" },
              {
                y: 0,
                opacity: 1,
                filter: "blur(0px)",
                duration: 0.7,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: el,
                  start: "top 80%",
                },
              }
            );
          });

          // Subtle gradient drift
          gsap.to(rootRef.current, {
            "--g1": "240 85% 55%",
            "--g2": "320 85% 58%",
            "--g3": "185 85% 55%",
            duration: 8,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });
        }, rootRef);

        ScrollTrigger.refresh();
      } catch (e) {
        console.log("GSAP not loaded, continuing without animations", e);
      }
    })();

    return () => {
      try {
        ctx?.revert?.();
        stepObserver?.disconnect();
      } catch { }
    };
  }, []);


  return (
    <div
      ref={rootRef}
      className="crumi-landing"
      style={{
        "--g1": "260 85% 55%",
        "--g2": "310 85% 55%",
        "--g3": "190 85% 52%",
      } as React.CSSProperties}
    >
      <style>{css}</style>

      <header className="crumi-header">
        <div className="crumi-header-inner">
          <Link to="/" className="crumi-logo">
            <div className="crumi-logo-icon">
              <span>✦</span>
            </div>
            <span>Crumi</span>
          </Link>

          <nav className="crumi-nav">
            <a className="navlink" href="#product">Producto</a>
            <a className="navlink" href="#walkthrough">Demo</a>
            <a className="navlink" href="#pricing">Precios</a>
          </nav>

          <div className="crumi-header-actions">
            <a href="#pricing" className="btn-secondary">Solicitar demo</a>
            <Link to="/login" className="btn-primary">Ingresar</Link>
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section ref={heroRef} className="crumi-hero">
          <div ref={orbitRef} className="crumi-hero-bg">
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />
            <div className="noise" />
          </div>

          <div className="crumi-hero-grid">
            <div>
              <div className="crumi-badge">
                <span className="crumi-badge-dot" />
                IA para contabilidad en tiempo real
              </div>

              <h1 className="crumi-hero-title">
                Contabilidad como si
                <span className="gradient-text"> estuvieras chateando</span>.
              </h1>

              <p className="crumi-hero-subtitle">
                El <b>ChatGPT de la contabilidad</b>: facturación electrónica, nómina, gestión documental y trabajo
                en equipo en un solo flujo. Pide por chat, aprueba, y deja trazabilidad lista para auditoría.
              </p>

              <div className="crumi-hero-buttons">
                <a href="#walkthrough" className="btn-primary-lg">Ver demo</a>
                <a href="#product" className="btn-secondary-lg">Ver características</a>
              </div>

              <div className="crumi-hero-cards">
                <div className="crumi-mini-card">
                  <div className="crumi-mini-card-title">Facturación DIAN</div>
                  <div className="crumi-mini-card-desc">Emite, envía y cobra</div>
                </div>
                <div className="crumi-mini-card">
                  <div className="crumi-mini-card-title">Nómina</div>
                  <div className="crumi-mini-card-desc">Liquidación + soportes</div>
                </div>
                <div className="crumi-mini-card">
                  <div className="crumi-mini-card-title">Documentos</div>
                  <div className="crumi-mini-card-desc">Ordena, extrae, concilia</div>
                </div>
              </div>
            </div>

            <div className="crumi-hero-visual">
              <div className="crumi-chat-panel">
                <div className="crumi-chat-header">
                  <div className="crumi-chat-title">
                    <span className="crumi-chat-icon">✨</span>
                    <span>Asistente Crumi</span>
                  </div>
                  <div className="crumi-chat-status">
                    <span className="crumi-status-dot" />
                    En línea
                  </div>
                </div>

                <div className="crumi-chat-body" ref={chatBodyRef}>
                  {/* Mensajes dinámicos */}
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={`crumi-chat-msg ${msg.role}`}>
                      {msg.role === 'assistant' && <div className="crumi-chat-avatar">✨</div>}
                      <div className="crumi-chat-bubble">
                        {msg.content}
                      </div>
                    </div>
                  ))}

                  {/* Indicador de typing */}
                  {isTyping && (
                    <div className="crumi-chat-msg assistant">
                      <div className="crumi-chat-avatar">✨</div>
                      <div className="crumi-chat-bubble typing-indicator">
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  )}

                  {/* Sugerencias (solo si hay pocos mensajes) */}
                  {chatMessages.length <= 2 && !isTyping && (
                    <div className="crumi-chat-suggestions">
                      <button onClick={() => setChatInput('Hola')}>👋 Hola</button>
                      <button onClick={() => setChatInput('¿Qué es Crumi?')}>❓ ¿Qué es Crumi?</button>
                      <button onClick={() => setChatInput('Crear factura')}>📄 Crear factura</button>
                    </div>
                  )}
                </div>

                <div className="crumi-chat-input">
                  <input
                    type="text"
                    placeholder="Escribe tu mensaje..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleChatSubmit();
                    }}
                    disabled={isTyping}
                  />
                  <button
                    className="crumi-chat-send"
                    onClick={handleChatSubmit}
                    disabled={!chatInput.trim() || isTyping}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                </div>

                <div className="blob-float blob-1" data-float><Blob /></div>
                <div className="blob-float blob-2" data-float><Blob /></div>
              </div>

              <div className="crumi-pills">
                <Pill>Factura electrónica</Pill>
                <Pill>Nómina inteligente</Pill>
                <Pill>Gestión documental</Pill>
                <Pill>Chat con tu equipo</Pill>
              </div>
            </div>
          </div>
        </section>

        {/* PRODUCT GRID */}
        <section id="product" className="crumi-section">
          <div className="crumi-section-grid">
            <div data-reveal>
              <h2 className="crumi-section-title">Todo tu backoffice, en un solo chat.</h2>
              <p className="crumi-section-subtitle">
                Factura, paga nómina, ordena documentos y coordina el trabajo del equipo sin saltar entre módulos.
                La IA conecta la información, propone asientos y deja trazabilidad lista para auditoría.
              </p>
            </div>

            <div className="crumi-features-grid">
              <Feature title="Facturación electrónica" body="Genera, valida y envía facturas con plantillas, adjuntos y seguimiento de cobro." />
              <Feature title="Nómina con IA" body="Liquidación, novedades, comprobantes y archivos de pago: la IA te guía." />
              <Feature title="Gestión documental" body="Sube soportes y la IA extrae datos, clasifica, concilia y conecta." />
              <Feature title="Equipo organizado" body="Asigna tareas por chat, pide aprobaciones y deja evidencia. Roles y permisos." />
            </div>
          </div>
        </section>

        {/* WALKTHROUGH */}
        <section id="walkthrough" ref={walkthroughRef} className="crumi-walkthrough">
          <div className="crumi-walkthrough-inner">
            <div className="crumi-walkthrough-grid">
              <div>
                <div data-reveal>
                  <h2 className="crumi-section-title">Así se siente "ChatGPT de la contabilidad".</h2>
                  <p className="crumi-section-subtitle">
                    Pide por chat, aprueba y listo: factura, nómina y documentos quedan conectados con soportes y trazabilidad.
                  </p>
                </div>

                <ol className="crumi-steps">
                  <Step n="01" title="Pide lo que necesitas" body="Escribe: Factura a este cliente, Liquida nomina, Conciliame este extracto." active={activeStep === 0} />
                  <Step n="02" title="La IA arma todo" body="Genera documentos, valida datos, propone asientos y prepara soportes." active={activeStep === 1} />
                  <Step n="03" title="Cierra con trazabilidad" body="Queda registro: documento, responsable, soporte y cambios. Auditoria lista." active={activeStep === 2} />
                </ol>

              </div>

              <div className="crumi-demo-panel">
                <div className="crumi-demo-frame">
                  <div className="crumi-demo-header">
                    <div className="crumi-demo-label">Vista previa</div>
                    <div className="crumi-demo-progress">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className={`crumi-progress-dot ${activeStep === i ? 'active' : ''}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="crumi-demo-screens">
                    <div className={`crumi-demo-screen ${activeStep === 0 ? 'active' : ''}`}>
                      <MockScreen title="Factura electrónica" subtitle="Generación • Validación • Envío • Cobro" />
                    </div>
                    <div className={`crumi-demo-screen ${activeStep === 1 ? 'active' : ''}`}>
                      <MockScreen title="Nómina" subtitle="Novedades • Liquidación • Comprobantes" variant="grid" />
                    </div>
                    <div className={`crumi-demo-screen ${activeStep === 2 ? 'active' : ''}`}>
                      <MockScreen title="Documentos y trazabilidad" subtitle="Soportes • Conciliación • Auditoría" variant="timeline" />
                    </div>
                  </div>

                  <div className="crumi-demo-actions">
                    <div>Pedir a la IA</div>
                    <div>Subir soporte</div>
                    <div>Conciliar</div>
                  </div>
                </div>

                <div className="blob-float blob-3" data-float><Blob /></div>
                <div className="blob-float blob-4" data-float><Blob /></div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="crumi-section">
          <div className="crumi-pricing-header">
            <div data-reveal>
              <h2 className="crumi-section-title">Planes para crecer sin dolor.</h2>
              <p className="crumi-section-subtitle">
                Empieza con lo esencial (facturación + documentos) y escala a nómina, roles y reportes.
              </p>
            </div>
            <Link to="/register-tenant" className="btn-primary-lg">Crear cuenta gratis</Link>
          </div>

          <div className="crumi-pricing-grid">
            <PriceCard name="Emprendedor" price="$0" note="Para comenzar" items={["1 empresa", "Facturación básica", "Soportes organizados"]} />
            <PriceCard highlight name="Pyme" price="$29" note="Para operar todo el mes" items={["Facturación + notas", "Nómina", "Aprobaciones y auditoría"]} />
            <PriceCard name="Empresa" price="Custom" note="Para operaciones complejas" items={["Roles avanzados", "Integraciones", "Controles y reportes"]} />
          </div>
        </section>

        {/* FOOTER */}
        <footer className="crumi-footer">
          <div className="crumi-footer-inner">
            <div>© {year} Crumi. Contabilidad con IA.</div>
            <div className="crumi-footer-links">
              <Link to="/login">Ingresar</Link>
              <Link to="/register-tenant">Crear cuenta</Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="crumi-card">
      <div className="crumi-card-title">{title}</div>
      <div className="crumi-card-body">{body}</div>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="crumi-feature" data-reveal>
      <div className="crumi-feature-title">{title}</div>
      <div className="crumi-feature-body">{body}</div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="crumi-pill">{children}</span>;
}

function Step({ n, title, body, active }: { n: string; title: string; body: string; active?: boolean }) {
  return (
    <li data-step className={`crumi-step ${active ? 'crumi-step-active' : ''}`}>
      <div className="crumi-step-header">
        <div className={`crumi-step-num ${active ? 'crumi-step-num-active' : ''}`}>{n}</div>
        <div className="crumi-step-title">{title}</div>
      </div>
      <div className="crumi-step-body">{body}</div>
    </li>
  );
}

function PriceCard({ name, price, note, items, highlight }: { name: string; price: string; note: string; items: string[]; highlight?: boolean }) {
  return (
    <div className={`crumi-price-card ${highlight ? 'highlighted' : ''}`} data-reveal>
      <div className="crumi-price-header">
        <div>
          <div className="crumi-price-name">{name}</div>
          <div className="crumi-price-note">{note}</div>
        </div>
        {highlight && <span className="crumi-price-badge">Popular</span>}
      </div>
      <div className="crumi-price-amount">
        <span className="crumi-price-value">{price}</span>
        <span className="crumi-price-period">/ mes</span>
      </div>
      <ul className="crumi-price-items">
        {items.map((it) => (
          <li key={it}><span className="crumi-price-dot" />{it}</li>
        ))}
      </ul>
      <Link to="/register-tenant" className={highlight ? 'btn-primary' : 'btn-secondary'}>
        Elegir {name}
      </Link>
    </div>
  );
}

function MockScreen({ title, subtitle, variant }: { title: string; subtitle: string; variant?: "grid" | "timeline" }) {
  return (
    <div className="crumi-mock">
      <div className="crumi-mock-header">
        <div>
          <div className="crumi-mock-title">{title}</div>
          <div className="crumi-mock-subtitle">{subtitle}</div>
        </div>
        <span className="crumi-mock-badge">Demo</span>
      </div>
      <div className="crumi-mock-content">
        {variant === "timeline" ? (
          <div className="crumi-timeline">
            <TimelineItem label="Cargar" />
            <TimelineItem label="Extraer" />
            <TimelineItem label="Conciliar" />
          </div>
        ) : variant === "grid" ? (
          <div className="crumi-mini-grid">
            <MiniCard title="Contador" />
            <MiniCard title="Auxiliar" />
            <MiniCard title="Gerencia" />
          </div>
        ) : (
          <pre className="crumi-mock-code">{`empresa:
  nit: "900.123.456-7"
  accion: "emitir_factura"
  valida:
    - datos del cliente
    - impuestos
    - soporte adjunto`}</pre>
        )}
      </div>
    </div>
  );
}

function MiniCard({ title }: { title: string }) {
  return (
    <div className="crumi-mini">
      <div className="crumi-mini-title">{title}</div>
      <div className="crumi-mini-bar" />
      <div className="crumi-mini-bar short" />
    </div>
  );
}

function TimelineItem({ label }: { label: string }) {
  return (
    <div className="crumi-timeline-item">
      <span className="crumi-timeline-dot" />
      <span className="crumi-timeline-label">{label}</span>
      <span className="crumi-timeline-line" />
    </div>
  );
}

function Blob() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="hsl(var(--g1))" />
          <stop offset="0.5" stopColor="hsl(var(--g2))" />
          <stop offset="1" stopColor="hsl(var(--g3))" />
        </linearGradient>
        <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>
      <path
        filter="url(#blur)"
        fill="url(#g)"
        d="M35.2,-55.3C48.2,-52.2,63.2,-49.4,72.5,-40.2C81.8,-31,85.5,-15.5,83.7,-1C81.9,13.6,74.5,27.2,66.2,39.4C57.9,51.6,48.7,62.5,36.8,69C24.9,75.6,12.4,77.9,-1.2,80C-14.9,82.2,-29.8,84.2,-41.8,78.3C-53.8,72.5,-62.8,58.8,-70.1,45.4C-77.4,32.1,-83,16,-82.6,0.2C-82.2,-15.6,-75.9,-31.1,-66.8,-43.6C-57.7,-56.1,-45.8,-65.5,-33.1,-69.1C-20.4,-72.6,-10.2,-70.2,0.2,-70.6C10.6,-71,21.2,-74.2,35.2,-55.3Z"
        transform="translate(100 100)"
      />
    </svg>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  .crumi-landing {
    font-family: 'Inter', -apple-system, sans-serif;
    background: #0a0a0a;
    color: #fff;
    min-height: 100vh;
    --g1: 226 74% 67%;  /* #667eea */
    --g2: 265 43% 60%;  /* #764ba2 */
    --g3: 226 74% 67%;  /* #667eea */
    --primary: #667eea;
    --primary-dark: #764ba2;
  }
  
  /* HEADER */
  .crumi-header {
    position: sticky;
    top: 0;
    z-index: 50;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    background: rgba(10,10,10,0.8);
    backdrop-filter: blur(20px);
  }
  .crumi-header-inner {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1.5rem;
  }
  .crumi-logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    color: #fff;
    font-weight: 600;
    font-size: 1rem;
  }
  .crumi-logo-icon {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.15);
    display: grid;
    place-items: center;
    font-size: 14px;
    color: #a78bfa;
  }
  .crumi-nav {
    display: flex;
    gap: 1.5rem;
  }
  .navlink {
    font-size: 13px;
    color: rgba(255,255,255,0.65);
    text-decoration: none;
    transition: color 0.2s;
  }
  .navlink:hover { color: #fff; }
  .crumi-header-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  /* BUTTONS */
  .btn-primary, .btn-primary-lg {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    border-radius: 12px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s;
  }
  .btn-primary { padding: 0.5rem 1rem; font-size: 13px; }
  .btn-primary-lg { padding: 0.75rem 1.5rem; font-size: 14px; display: inline-block; }
  .btn-primary:hover, .btn-primary-lg:hover { 
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(102,126,234,0.4);
  }
  
  .btn-secondary, .btn-secondary-lg {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.15);
    color: #fff;
    border-radius: 12px;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.2s;
  }
  .btn-secondary { padding: 0.5rem 1rem; font-size: 13px; }
  .btn-secondary-lg { padding: 0.75rem 1.5rem; font-size: 14px; display: inline-block; }
  .btn-secondary:hover, .btn-secondary-lg:hover { background: rgba(255,255,255,0.1); }
  
  /* HERO */
  .crumi-hero {
    position: relative;
    overflow: hidden;
  }
  .crumi-hero-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .orb {
    position: absolute;
    width: 700px;
    height: 700px;
    border-radius: 999px;
    filter: blur(60px);
    opacity: 0.25;
    background: radial-gradient(circle at 30% 30%, hsl(var(--g1)), transparent 60%);
  }
  .orb-1 { left: -280px; top: -320px; }
  .orb-2 { right: -280px; top: -160px; background: radial-gradient(circle at 30% 30%, hsl(var(--g2)), transparent 60%); }
  .orb-3 { left: 20%; bottom: -400px; background: radial-gradient(circle at 30% 30%, hsl(var(--g3)), transparent 60%); }
  .noise {
    position: absolute;
    inset: 0;
    opacity: 0.05;
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9"/></filter><rect width="100" height="100" filter="url(%23n)" opacity="0.5"/></svg>');
  }
  .crumi-hero-grid {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
    padding: 5rem 1.5rem;
    position: relative;
    z-index: 1;
  }
  @media (max-width: 900px) {
    .crumi-hero-grid { grid-template-columns: 1fr; }
    .crumi-nav { display: none; }
  }
  
  .crumi-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.35rem 0.75rem;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 100px;
    font-size: 12px;
    color: rgba(255,255,255,0.8);
  }
  .crumi-badge-dot {
    width: 6px;
    height: 6px;
    background: #22c55e;
    border-radius: 50%;
  }
  
  .crumi-hero-title {
    margin-top: 1.5rem;
    font-size: clamp(2rem, 5vw, 3rem);
    font-weight: 600;
    line-height: 1.1;
    letter-spacing: -0.02em;
  }
  .gradient-text {
    background: linear-gradient(90deg, hsl(var(--g1)), hsl(var(--g2)), hsl(var(--g3)));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .crumi-hero-subtitle {
    margin-top: 1.25rem;
    font-size: 14px;
    line-height: 1.6;
    color: rgba(255,255,255,0.7);
    max-width: 500px;
  }
  .crumi-hero-buttons {
    margin-top: 2rem;
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .crumi-hero-cards {
    margin-top: 2.5rem;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }
  .crumi-mini-card {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    padding: 1rem;
  }
  .crumi-mini-card-title { font-size: 12px; font-weight: 600; }
  .crumi-mini-card-desc { font-size: 11px; color: rgba(255,255,255,0.6); margin-top: 0.25rem; }
  
  /* HERO VISUAL */
  .crumi-hero-visual { position: relative; }
  .crumi-code-panel {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 24px;
    padding: 1rem;
    position: relative;
  }
  .crumi-code-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .crumi-code-dots {
    display: flex;
    gap: 6px;
  }
  .crumi-code-dots span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
  }
  .crumi-code-badge {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 100px;
    padding: 0.25rem 0.75rem;
    font-size: 11px;
    color: rgba(255,255,255,0.7);
  }
  .crumi-code-content { margin-top: 1rem; }
  .crumi-code-block {
    background: rgba(10,10,10,0.6);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    padding: 1rem;
  }
  .crumi-code-block pre {
    font-size: 11px;
    line-height: 1.6;
    color: rgba(255,255,255,0.75);
    font-family: 'SF Mono', Monaco, monospace;
    margin: 0;
  }
  .crumi-code-cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    margin-top: 0.75rem;
  }
  .crumi-card {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    padding: 1rem;
  }
  .crumi-card-title { font-size: 12px; font-weight: 600; }
  .crumi-card-body { font-size: 11px; color: rgba(255,255,255,0.6); margin-top: 0.25rem; line-height: 1.5; }
  
  /* CHAT PANEL - Mini demo de asistente con colores IA azules */
  .crumi-chat-panel {
    background: #f9fafb;
    border: 1px solid rgba(0,0,0,0.08);
    border-radius: 24px;
    overflow: hidden;
    position: relative;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    height: 424px;
    max-height: 424px;
    display: flex;
    flex-direction: column;
  }
  .crumi-chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
  }
  .crumi-chat-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    font-size: 14px;
  }
  .crumi-chat-icon {
    font-size: 18px;
  }
  .crumi-chat-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    opacity: 0.9;
  }
  .crumi-status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #22c55e;
  }
  .crumi-chat-body {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    background: #f9fafb;
    flex: 1;
    overflow-y: auto;
  }
  .crumi-chat-msg {
    display: flex;
    gap: 0.5rem;
    align-items: flex-start;
  }
  .crumi-chat-msg.user {
    justify-content: flex-end;
  }
  .crumi-chat-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    flex-shrink: 0;
  }
  .crumi-chat-bubble {
    padding: 0.7rem 1rem;
    border-radius: 16px;
    font-size: 12px;
    line-height: 1.5;
    max-width: 80%;
  }
  .crumi-chat-msg.assistant .crumi-chat-bubble {
    background: #fff;
    color: #374151;
    border: 1px solid rgba(0,0,0,0.06);
    border-bottom-left-radius: 4px;
  }
  .crumi-chat-msg.user .crumi-chat-bubble {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    border-bottom-right-radius: 4px;
  }
  .crumi-chat-light {
    color: #6b7280;
    font-size: 11px;
  }
  
  /* Indicador de typing con dots animados */
  .typing-indicator {
    display: flex;
    gap: 4px;
    padding: 12px 16px;
  }
  .typing-indicator span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #667eea;
    animation: typing-bounce 1.4s infinite ease-in-out both;
  }
  .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
  .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
  .typing-indicator span:nth-child(3) { animation-delay: 0s; }
  @keyframes typing-bounce {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
    40% { transform: scale(1); opacity: 1; }
  }
  .crumi-chat-suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.25rem;
    padding-left: 36px;
  }
  .crumi-chat-suggestions button {
    background: #fff;
    border: 1px solid rgba(102,126,234,0.2);
    border-radius: 100px;
    padding: 0.4rem 0.75rem;
    font-size: 10px;
    color: #667eea;
    cursor: pointer;
    transition: all 0.2s;
  }
  .crumi-chat-suggestions button:hover {
    background: rgba(102,126,234,0.1);
    border-color: #667eea;
    color: #764ba2;
  }
  .crumi-chat-input {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-top: 1px solid rgba(0,0,0,0.06);
    background: #f3f4f6;
  }
  .crumi-chat-input input {
    flex: 1;
    background: #fff;
    border: 1px solid rgba(0,0,0,0.1);
    border-radius: 100px;
    padding: 0.6rem 1rem;
    font-size: 12px;
    color: #374151;
    outline: none;
  }
  .crumi-chat-input input:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
  }
  .crumi-chat-input input::placeholder {
    color: #9ca3af;
  }
  .crumi-chat-send {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: none;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }
  .crumi-chat-send:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 20px rgba(102,126,234,0.4);
  }
  .crumi-chat-send:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  
  .blob-float {
    position: absolute;
    pointer-events: none;
  }
  .blob-float svg { width: 100px; height: 100px; opacity: 0.7; }
  .blob-1 { right: -40px; top: -40px; }
  .blob-2 { left: -40px; bottom: -32px; }
  .blob-3 { right: -40px; top: -48px; }
  .blob-4 { left: -40px; bottom: -48px; }
  
  .crumi-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1rem;
  }
  .crumi-pill {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 100px;
    padding: 0.35rem 0.75rem;
    font-size: 11px;
    color: rgba(255,255,255,0.6);
  }
  
  /* SECTIONS */
  .crumi-section {
    max-width: 1200px;
    margin: 0 auto;
    padding: 5rem 1.5rem;
  }
  .crumi-section-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
  }
  @media (max-width: 900px) { .crumi-section-grid { grid-template-columns: 1fr; } }
  
  .crumi-section-title {
    font-size: clamp(1.5rem, 3vw, 2.25rem);
    font-weight: 600;
    letter-spacing: -0.02em;
  }
  .crumi-section-subtitle {
    margin-top: 0.75rem;
    font-size: 14px;
    line-height: 1.6;
    color: rgba(255,255,255,0.7);
    max-width: 500px;
  }
  
  .crumi-features-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
  @media (max-width: 600px) { .crumi-features-grid { grid-template-columns: 1fr; } }
  
  .crumi-feature {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 20px;
    padding: 1.5rem;
    transition: all 0.3s;
  }
  .crumi-feature:hover {
    background: rgba(255,255,255,0.08);
    transform: translateY(-2px);
  }
  .crumi-feature-title { font-size: 14px; font-weight: 600; }
  .crumi-feature-body { font-size: 13px; color: rgba(255,255,255,0.6); margin-top: 0.5rem; line-height: 1.5; }
  
  /* WALKTHROUGH */
  .crumi-walkthrough {
    border-top: 1px solid rgba(255,255,255,0.1);
    border-bottom: 1px solid rgba(255,255,255,0.1);
    background: #0a0a0a;
  }
  .crumi-walkthrough-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 5rem 1.5rem;
  }
  .crumi-walkthrough-grid {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    gap: 3rem;
    align-items: start;
  }
  @media (max-width: 900px) { .crumi-walkthrough-grid { grid-template-columns: 1fr; } }
  
  .crumi-steps {
    list-style: none;
    margin-top: 2rem;
    display: grid;
    gap: 1.5rem; /* Mayor gap para mejor detección de scroll */
  }
  .crumi-step {
    background: rgba(255,255,255,0.03);
    border: 2px solid rgba(255,255,255,0.1);
    border-radius: 20px;
    padding: 1.25rem;
    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    cursor: default;
  }
  .crumi-step-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .crumi-step-num {
    background: rgba(10,10,10,0.6);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 0.35rem 0.65rem;
    font-size: 11px;
    color: rgba(255,255,255,0.5);
    font-family: monospace;
    transition: all 0.4s ease;
  }
  .crumi-step-title { font-size: 14px; font-weight: 600; transition: color 0.3s; }
  .crumi-step-body { font-size: 13px; color: rgba(255,255,255,0.5); margin-top: 0.5rem; line-height: 1.5; padding-left: 2.75rem; }
  
  /* Active step states - más visible */
  .crumi-step-active {
    border-color: #667eea !important;
    background: linear-gradient(135deg, rgba(102,126,234,0.15) 0%, rgba(118,75,162,0.1) 100%) !important;
    box-shadow: 0 0 40px rgba(102,126,234,0.2), inset 0 0 0 1px rgba(102,126,234,0.2);
    transform: scale(1.02);
  }
  .crumi-step-active .crumi-step-title {
    color: #fff;
  }
  .crumi-step-active .crumi-step-body {
    color: rgba(255,255,255,0.7);
  }
  .crumi-step-num-active {
    border-color: #667eea;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
  }
  
  .crumi-demo-panel { position: relative; }
  .crumi-demo-frame {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 24px;
    padding: 1rem;
    position: sticky;
    top: 6rem;
  }
  .crumi-demo-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: rgba(255,255,255,0.7);
  }
  .crumi-demo-label {
    font-weight: 500;
  }
  .crumi-demo-progress {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .crumi-progress-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .crumi-progress-dot.active {
    width: 24px;
    border-radius: 12px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    box-shadow: 0 0 15px rgba(102,126,234,0.5);
  }
  .crumi-demo-screens {
    position: relative;
    margin-top: 1rem;
    aspect-ratio: 16/10;
    overflow: hidden;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(10,10,10,0.8);
  }
  .crumi-demo-screen {
    position: absolute;
    inset: 0;
    opacity: 0;
    transform: translateY(30px) scale(0.94);
    transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: none;
  }
  .crumi-demo-screen.active {
    opacity: 1;
    transform: translateY(0) scale(1);
    pointer-events: auto;
  }
  .crumi-demo-actions {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
    margin-top: 1rem;
  }
  .crumi-demo-actions div {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 0.5rem;
    text-align: center;
    font-size: 11px;
    color: rgba(255,255,255,0.6);
  }
  
  .crumi-mock { padding: 1rem; height: 100%; }
  .crumi-mock-header { display: flex; justify-content: space-between; align-items: start; }
  .crumi-mock-title { font-size: 14px; font-weight: 600; }
  .crumi-mock-subtitle { font-size: 11px; color: rgba(255,255,255,0.6); margin-top: 0.25rem; }
  .crumi-mock-badge {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 100px;
    padding: 0.25rem 0.5rem;
    font-size: 10px;
    color: rgba(255,255,255,0.6);
  }
  .crumi-mock-content {
    margin-top: 1rem;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 0.75rem;
  }
  .crumi-mock-code {
    font-size: 10px;
    line-height: 1.5;
    color: rgba(255,255,255,0.7);
    font-family: monospace;
    margin: 0;
  }
  
  .crumi-timeline { display: grid; gap: 0.5rem; }
  .crumi-timeline-item { display: flex; align-items: center; gap: 0.5rem; }
  .crumi-timeline-dot { width: 6px; height: 6px; background: rgba(255,255,255,0.4); border-radius: 50%; }
  .crumi-timeline-label { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.8); }
  .crumi-timeline-line { flex: 1; height: 1px; background: rgba(255,255,255,0.1); }
  
  .crumi-mini-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
  .crumi-mini {
    background: rgba(10,10,10,0.3);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 0.5rem;
  }
  .crumi-mini-title { font-size: 10px; font-weight: 600; }
  .crumi-mini-bar { height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; margin-top: 0.35rem; }
  .crumi-mini-bar.short { width: 60%; }
  
  /* PRICING */
  .crumi-pricing-header {
    display: flex;
    justify-content: space-between;
    align-items: end;
    flex-wrap: wrap;
    gap: 1.5rem;
    margin-bottom: 2.5rem;
  }
  .crumi-pricing-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }
  @media (max-width: 900px) { .crumi-pricing-grid { grid-template-columns: 1fr; } }
  
  .crumi-price-card {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 24px;
    padding: 1.5rem;
    transition: all 0.3s;
  }
  .crumi-price-card.highlighted {
    border-color: rgba(255,255,255,0.25);
    box-shadow: 0 40px 100px -60px rgba(255,255,255,0.2);
  }
  .crumi-price-header {
    display: flex;
    justify-content: space-between;
    align-items: start;
  }
  .crumi-price-name { font-size: 14px; font-weight: 600; }
  .crumi-price-note { font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 0.25rem; }
  .crumi-price-badge {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 100px;
    padding: 0.25rem 0.5rem;
    font-size: 10px;
    color: rgba(255,255,255,0.7);
  }
  .crumi-price-amount {
    margin-top: 1.5rem;
    display: flex;
    align-items: end;
    gap: 0.25rem;
  }
  .crumi-price-value { font-size: 2.5rem; font-weight: 600; letter-spacing: -0.02em; }
  .crumi-price-period { font-size: 12px; color: rgba(255,255,255,0.6); padding-bottom: 0.35rem; }
  .crumi-price-items {
    list-style: none;
    margin-top: 1.5rem;
    display: grid;
    gap: 0.5rem;
  }
  .crumi-price-items li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 13px;
    color: rgba(255,255,255,0.7);
  }
  .crumi-price-dot {
    width: 6px;
    height: 6px;
    background: rgba(255,255,255,0.6);
    border-radius: 50%;
  }
  .crumi-price-card a {
    display: block;
    margin-top: 1.5rem;
    text-align: center;
    width: 100%;
  }
  
  /* FOOTER */
  .crumi-footer {
    border-top: 1px solid rgba(255,255,255,0.1);
  }
  .crumi-footer-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    font-size: 13px;
    color: rgba(255,255,255,0.5);
  }
  .crumi-footer-links {
    display: flex;
    gap: 1.5rem;
  }
  .crumi-footer-links a {
    color: rgba(255,255,255,0.5);
    text-decoration: none;
    transition: color 0.2s;
  }
  .crumi-footer-links a:hover { color: #fff; }
`;
