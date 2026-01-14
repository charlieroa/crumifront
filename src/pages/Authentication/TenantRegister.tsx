// src/pages/Authentication/TenantRegister.tsx
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import withRouter from "../../Components/Common/withRouter";
import * as Yup from "yup";
import { useFormik } from "formik";
import { createSelector } from 'reselect';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

import { registerTenant } from '../../slices/auth/tenantRegister/thunk';
import { resetTenantRegisterFlag } from '../../slices/auth/tenantRegister/reducer';

const TenantRegister = (props: any) => {
    const dispatch: any = useDispatch();
    const navigate = useNavigate();

    const selectRegisterState = (state: any) => state.tenantRegister;
    const registerData = createSelector(
        selectRegisterState,
        (state) => ({
            success: state.registrationSuccess,
            error: state.registrationError,
        })
    );

    const { success, error } = useSelector(registerData);

    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [loader, setLoader] = useState<boolean>(false);

    const validation: any = useFormik({
        enableReinitialize: true,
        initialValues: {
            tenantName: '',
            adminEmail: '',
            adminPassword: '',
        },
        validationSchema: Yup.object({
            tenantName: Yup.string().required("Por favor ingresa el nombre de tu empresa"),
            adminEmail: Yup.string().required("Por favor ingresa tu email").email("Email inválido"),
            adminPassword: Yup.string().required("Por favor ingresa una contraseña").min(6, "La contraseña debe tener al menos 6 caracteres"),
        }),
        onSubmit: (values) => {
            setLoader(true);
            const dataToSend = {
                ...values,
                adminFirstName: values.adminEmail.split('@')[0],
            };
            dispatch(registerTenant(dataToSend));
        },
    });

    useEffect(() => {
        if (success) {
            setLoader(false);
            Swal.fire({
                icon: 'success',
                title: '¡Registro Exitoso!',
                text: 'Tu cuenta ha sido creada. Serás redirigido al login...',
                confirmButtonColor: '#667eea',
                timer: 3000,
                timerProgressBar: true,
            }).then(() => {
                navigate('/login');
            });
        }
    }, [success, navigate]);

    useEffect(() => {
        if (error) {
            setLoader(false);
            let msg = typeof error === 'string' ? error : (error?.error || error?.message || "Error al registrar la cuenta");

            Swal.fire({
                icon: 'error',
                title: 'Error de Registro',
                text: msg,
                confirmButtonColor: '#667eea'
            });
            dispatch(resetTenantRegisterFlag());
        }
    }, [error, dispatch]);

    document.title = "Crear Cuenta de Empresa | Crumi";

    return (
        <div className="crumi-auth-page">
            <style>{authCSS}</style>

            <div className="crumi-auth-container">
                {/* Left Side - Form */}
                <div className="crumi-auth-form-side">
                    <div className="crumi-auth-form-content">
                        {/* Logo */}
                        <Link to="/" className="crumi-auth-logo">
                            <div className="crumi-auth-logo-icon">
                                <span>✦</span>
                            </div>
                            <span>Crumi</span>
                        </Link>

                        {/* Header */}
                        <div className="crumi-auth-header">
                            <h1>Crea tu cuenta</h1>
                            <p>Empieza a gestionar tu empresa hoy mismo</p>
                        </div>

                        {/* Form */}
                        <form onSubmit={(e) => { e.preventDefault(); validation.handleSubmit(); }}>
                            <div className="crumi-form-group">
                                <label htmlFor="tenantName">Nombre de tu empresa</label>
                                <input
                                    id="tenantName"
                                    name="tenantName"
                                    type="text"
                                    placeholder="Ej: Mi Empresa S.A.S"
                                    className={validation.touched.tenantName && validation.errors.tenantName ? 'error' : ''}
                                    onChange={validation.handleChange}
                                    onBlur={validation.handleBlur}
                                    value={validation.values.tenantName || ""}
                                />
                                {validation.touched.tenantName && validation.errors.tenantName && (
                                    <span className="crumi-form-error">{validation.errors.tenantName}</span>
                                )}
                            </div>

                            <div className="crumi-form-group">
                                <label htmlFor="adminEmail">Correo electrónico</label>
                                <input
                                    id="adminEmail"
                                    name="adminEmail"
                                    type="email"
                                    placeholder="tu@email.com"
                                    className={validation.touched.adminEmail && validation.errors.adminEmail ? 'error' : ''}
                                    onChange={validation.handleChange}
                                    onBlur={validation.handleBlur}
                                    value={validation.values.adminEmail || ""}
                                />
                                {validation.touched.adminEmail && validation.errors.adminEmail && (
                                    <span className="crumi-form-error">{validation.errors.adminEmail}</span>
                                )}
                            </div>

                            <div className="crumi-form-group">
                                <label htmlFor="adminPassword">Contraseña</label>
                                <div className="crumi-password-input">
                                    <input
                                        id="adminPassword"
                                        name="adminPassword"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className={validation.touched.adminPassword && validation.errors.adminPassword ? 'error' : ''}
                                        onChange={validation.handleChange}
                                        onBlur={validation.handleBlur}
                                        value={validation.values.adminPassword || ""}
                                    />
                                    <button
                                        type="button"
                                        className="crumi-password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? '👁️' : '👁️‍🗨️'}
                                    </button>
                                </div>
                                {validation.touched.adminPassword && validation.errors.adminPassword && (
                                    <span className="crumi-form-error">{validation.errors.adminPassword}</span>
                                )}
                            </div>

                            <button type="submit" className="crumi-btn-primary" disabled={loader}>
                                {loader ? (
                                    <>
                                        <span className="crumi-spinner"></span>
                                        Creando cuenta...
                                    </>
                                ) : (
                                    'Crear mi cuenta'
                                )}
                            </button>

                            <div className="crumi-divider">
                                <span>o continúa con</span>
                            </div>

                            <button
                                type="button"
                                className="crumi-btn-google"
                                onClick={() => {
                                    window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/google`;
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 18 18">
                                    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
                                    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
                                    <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" />
                                    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
                                </svg>
                                Registrarse con Google
                            </button>

                            <div className="crumi-auth-footer">
                                <p>¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link></p>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Side - Visual */}
                <div className="crumi-auth-visual-side">
                    <div className="crumi-auth-bg">
                        <div className="crumi-auth-orb crumi-auth-orb-1"></div>
                        <div className="crumi-auth-orb crumi-auth-orb-2"></div>
                        <div className="crumi-auth-orb crumi-auth-orb-3"></div>
                    </div>

                    <div className="crumi-auth-visual-content">
                        <div className="crumi-auth-feature-card">
                            <div className="crumi-auth-feature-icon">✨</div>
                            <h3>Gestión inteligente</h3>
                            <p>Administra tu empresa de forma fácil e intuitiva desde cualquier lugar</p>
                        </div>

                        <div className="crumi-auth-stats">
                            <div className="crumi-auth-stat">
                                <div className="crumi-auth-stat-value">100%</div>
                                <div className="crumi-auth-stat-label">Seguro</div>
                            </div>
                            <div className="crumi-auth-stat">
                                <div className="crumi-auth-stat-value">24/7</div>
                                <div className="crumi-auth-stat-label">Disponible</div>
                            </div>
                            <div className="crumi-auth-stat">
                                <div className="crumi-auth-stat-value">IA</div>
                                <div className="crumi-auth-stat-label">Inteligente</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const authCSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }

  .crumi-auth-page {
    font-family: 'Inter', -apple-system, sans-serif;
    min-height: 100vh;
    background: #0a0a0a;
    color: #fff;
  }

  .crumi-auth-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    min-height: 100vh;
  }

  @media (max-width: 968px) {
    .crumi-auth-container {
      grid-template-columns: 1fr;
    }
    .crumi-auth-visual-side {
      display: none;
    }
  }

  /* LEFT SIDE - FORM */
  .crumi-auth-form-side {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: #0a0a0a;
  }

  .crumi-auth-form-content {
    width: 100%;
    max-width: 420px;
  }

  .crumi-auth-logo {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    color: #fff;
    font-weight: 600;
    font-size: 1.25rem;
    margin-bottom: 3rem;
  }

  .crumi-auth-logo-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: grid;
    place-items: center;
    font-size: 18px;
  }

  .crumi-auth-header {
    margin-bottom: 2rem;
  }

  .crumi-auth-header h1 {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    letter-spacing: -0.02em;
  }

  .crumi-auth-header p {
    color: rgba(255,255,255,0.6);
    font-size: 0.95rem;
  }

  .crumi-form-group {
    margin-bottom: 1.5rem;
  }

  .crumi-form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: rgba(255,255,255,0.9);
  }

  .crumi-form-label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .crumi-form-link {
    font-size: 0.875rem;
    color: #667eea;
    text-decoration: none;
    transition: color 0.2s;
  }

  .crumi-form-link:hover {
    color: #764ba2;
  }

  .crumi-form-group input[type="email"],
  .crumi-form-group input[type="password"],
  .crumi-form-group input[type="text"] {
    width: 100%;
    padding: 0.75rem 1rem;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    color: #fff;
    font-size: 0.95rem;
    transition: all 0.2s;
    outline: none;
  }

  .crumi-form-group input:focus {
    background: rgba(255,255,255,0.08);
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
  }

  .crumi-form-group input.error {
    border-color: #f46a6a;
  }

  .crumi-form-error {
    display: block;
    margin-top: 0.35rem;
    font-size: 0.8rem;
    color: #f46a6a;
  }

  .crumi-password-input {
    position: relative;
  }

  .crumi-password-toggle {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    font-size: 1.2rem;
    opacity: 0.6;
    transition: opacity 0.2s;
  }

  .crumi-password-toggle:hover {
    opacity: 1;
  }

  .crumi-checkbox {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
    color: rgba(255,255,255,0.8);
  }

  .crumi-checkbox input {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }

  .crumi-btn-primary {
    width: 100%;
    padding: 0.85rem 1.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .crumi-btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(102,126,234,0.4);
  }

  .crumi-btn-primary:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .crumi-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .crumi-divider {
    margin: 1.5rem 0;
    text-align: center;
    position: relative;
  }

  .crumi-divider::before {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    height: 1px;
    background: rgba(255,255,255,0.1);
  }

  .crumi-divider span {
    position: relative;
    background: #0a0a0a;
    padding: 0 1rem;
    font-size: 0.875rem;
    color: rgba(255,255,255,0.5);
  }

  .crumi-btn-google {
    width: 100%;
    padding: 0.85rem 1.5rem;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    color: #fff;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
  }

  .crumi-btn-google:hover {
    background: rgba(255,255,255,0.1);
  }

  .crumi-auth-footer {
    margin-top: 2rem;
    text-align: center;
  }

  .crumi-auth-footer p {
    font-size: 0.875rem;
    color: rgba(255,255,255,0.6);
  }

  .crumi-auth-footer a {
    color: #667eea;
    text-decoration: none;
    font-weight: 600;
  }

  .crumi-auth-footer a:hover {
    color: #764ba2;
  }

  /* RIGHT SIDE - VISUAL */
  .crumi-auth-visual-side {
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 3rem;
  }

  .crumi-auth-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .crumi-auth-orb {
    position: absolute;
    border-radius: 999px;
    filter: blur(80px);
    opacity: 0.3;
  }

  .crumi-auth-orb-1 {
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, #667eea, transparent 70%);
    top: -200px;
    left: -100px;
  }

  .crumi-auth-orb-2 {
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, #764ba2, transparent 70%);
    bottom: -150px;
    right: -100px;
  }

  .crumi-auth-orb-3 {
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, #667eea, transparent 70%);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .crumi-auth-visual-content {
    position: relative;
    z-index: 1;
  }

  .crumi-auth-feature-card {
    background: rgba(255,255,255,0.05);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 20px;
    padding: 2.5rem;
    text-align: center;
    margin-bottom: 2rem;
  }

  .crumi-auth-feature-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .crumi-auth-feature-card h3 {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.75rem;
  }

  .crumi-auth-feature-card p {
    color: rgba(255,255,255,0.7);
    font-size: 0.95rem;
    line-height: 1.5;
  }

  .crumi-auth-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }

  .crumi-auth-stat {
    text-align: center;
    padding: 1.5rem;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
  }

  .crumi-auth-stat-value {
    font-size: 2rem;
    font-weight: 700;
    background: linear-gradient(90deg, #667eea, #764ba2);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    margin-bottom: 0.35rem;
  }

  .crumi-auth-stat-label {
    font-size: 0.875rem;
    color: rgba(255,255,255,0.6);
  }
`;

export default withRouter(TenantRegister);