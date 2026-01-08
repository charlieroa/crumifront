import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { setAuthorization } from "../../helpers/api_helper";

const AuthGoogleCallback = () => {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');

        if (token) {
            // 1. Guardar token
            const userObj = { token };
            sessionStorage.setItem('authUser', JSON.stringify(userObj));

            // 2. Setear header axios
            setAuthorization(token);

            // 3. Redirigir al inicio (Layout validará si faltan datos configuración)
            // Ajuste: damos un pequeño delay para asegurar que se guardó
            setTimeout(() => {
                navigate('/');
            }, 500);

        } else {
            navigate('/login?error=Invalid+google+token');
        }
    }, [location, navigate]);

    return (
        <div className="d-flex justify-content-center align-items-center vh-100 flex-column">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Autenticando con Google...</p>
        </div>
    );
};

export default AuthGoogleCallback;
