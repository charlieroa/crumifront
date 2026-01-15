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
            // 1. Setear header axios temporalmente
            setAuthorization(token);

            // 2. Obtener datos del usuario
            // Usamos axios directamente o la instancia api si estuviera exportada, 
            // pero api_helper setAuthorization afecta a axios global.
            // Asumimos que axios está importado en api_helper, aquí importamos axios si es necesario, 
            // o mejor, usamos los helpers si existen. 
            // Como no tenemos 'api.get' directo aquí sin importarlo, usamos fetch o axios.
            // Vamos a usar axios importandolo.

            // Fetch User Data
            import("axios").then(axios => {
                axios.default.get('/auth/me')
                    .then(response => {
                        const { user, setup_complete } = response.data;

                        const authUser = {
                            message: "Login Successful",
                            token: token,
                            user: user,
                            setup_complete: setup_complete
                        };

                        sessionStorage.setItem('authUser', JSON.stringify(authUser));

                        // 3. Redirigir
                        if (setup_complete === false) {
                            navigate("/settings");
                        } else {
                            navigate("/dashboard");
                        }
                    })
                    .catch(err => {
                        console.error("Error fetching profile", err);
                        navigate('/login?error=Failed+to+fetch+profile');
                    });
            });

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
