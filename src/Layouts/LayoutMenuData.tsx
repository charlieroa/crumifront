import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { getToken } from "../services/auth";

// --- Redux ---
import { useSelector } from "react-redux";
import { selectIsSetupComplete } from "../slices/Settings/settingsSlice";

const getRoleFromToken = (): number | null => {
  try {
    const token = getToken();
    if (!token) return null;
    const decoded: any = jwtDecode(token);
    return decoded?.user?.role_id || null;
  } catch (e) {
    console.error("Error decodificando el token:", e);
    return null;
  }
};

const LayoutMenuData = () => {
  const history = useNavigate();
  const userRole = getRoleFromToken();
  const isSetupComplete = useSelector(selectIsSetupComplete);

  const menuItems: any[] = [
    // --- SECCIÓN ASISTENTE IA ---
    {
      label: "IA",
      isHeader: true
    },
    {
      id: "onboarding",
      label: "Asistente IA",
      icon: "ri-sparkling-line",
      link: "/onboarding",
      roles: [1, 2]
    },

    // --- SECCIÓN PRINCIPAL ---
    {
      label: "Principal",
      isHeader: true
    },

    // Nuevo documento
    {
      id: "nuevo",
      label: "Nuevo",
      icon: "ri-file-add-line",
      link: "/ingresos/factura-venta/crear", // ← APUNTA A CREATE.TSX
      roles: [1]
    },

    // Documentos (con tabs internos)
    {
      id: "documentos",
      label: "Documentos",
      icon: "ri-folder-3-line",
      link: "/ingresos/documentos",
      roles: [1]
    },



    // --- SECCIÓN GESTIÓN ---
    {
      label: "Gestión",
      isHeader: true
    },
    // Actividades / Tareas
    // Actividades / Tareas
    {
      id: "kanban-board",
      label: "Kanban Board",
      icon: "ri-task-line",
      link: "/apps/tasks-dashboard",
      roles: [1, 3, 99]
    },

    // Personal
    {
      id: "personal",
      label: "Personal",
      icon: "ri-team-line",
      link: "/settings?tab=2",
      roles: [1, 99]
    },

    // Clientes removed as per request


    // Productos
    {
      id: "productos",
      label: "Productos",
      icon: "ri-shopping-bag-3-line",
      link: "/productos",
      roles: [1]
    },

    // Nómina
    {
      id: "payroll",
      label: "Nómina",
      icon: "ri-money-dollar-box-line",
      link: "/payroll",
      roles: [1]
    },

    // --- SECCIÓN CONFIGURACIÓN ---
    {
      label: "Configuración",
      isHeader: true
    },

    // Configuración
    // {
    //   id: "settings",
    //   label: "Ajustes",
    //   icon: "ri-settings-3-line",
    //   link: "/settings",
    //   roles: [1, 99]
    // },

    // Ayuda
    {
      id: "show-tour",
      label: "Ayuda",
      icon: "ri-question-line",
      link: "#!",
      roles: [1],
      isAction: true,
    },
  ];

  // Filtrar menú según rol
  const finalMenuItems = useMemo(() => {
    if (!userRole) return [];

    return menuItems.filter((item) => {
      if (!item.roles) return true;
      return item.roles.includes(userRole);
    });
  }, [userRole]);

  return <React.Fragment>{finalMenuItems}</React.Fragment>;
};

export default LayoutMenuData;