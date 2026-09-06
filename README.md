# 🥑 NutriFlow — Dieta Inteligente

> *"Tú registra. Nosotros hacemos las cuentas."*

[![PWA Ready](https://img.shields.io/badge/PWA-Ready-3ab98d?style=for-the-badge&logo=pwa&logoColor=white)](https://aldairf12.github.io/NutriFlow-Dieta-Inteligente/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers_%26_D1-f38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![Web Push](https://img.shields.io/badge/Web_Push-RFC_8291-blue?style=for-the-badge&logo=google&logoColor=white)](https://tools.ietf.org/html/rfc8291)
[![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-ES6+-f7df1e?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/es/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

**NutriFlow** es una Progressive Web App (PWA) de alto rendimiento diseñada con enfoque **Offline-First**, que combina el control nutricional diario, gestión de despensa y asistencia por IA, con un sistema híbrido de **notificaciones push en segundo plano** impulsado por arquitectura serverless en el edge (**Cloudflare Workers + D1 SQLite**).

---

## 🌐 Demo en Vivo

👉 **[Abrir NutriFlow en producción](https://aldairf12.github.io/NutriFlow-Dieta-Inteligente/)**

---

## ✨ Características Principales

### 📊 1. Diario Nutricional & Macros Dinámicos
* **Cálculo de macros en tiempo real:** Control de calorías, proteínas, carbohidratos y grasas con desglose visual interactivo.
* **Seguimiento inteligente:** Visualización de rachas, estado de hidratación diaria y consejos nutricionales dinámicos según el momento del día.
* **Catálogo de recetas y alimentos:** Amplio inventario con información calórica detallada y soporte para recetas personalizadas creadas por el usuario.

### 🥫 2. Despensa Inteligente & Lista de Compras
* **Inventario interactivo:** Seguimiento del stock de ingredientes con alertas visuales de escasez (suficiente, bajo, agotado).
* **Detector de recetas cocinables:** Indica qué recetas puedes preparar inmediatamente con lo que tienes en casa y cuáles tienen ingredientes faltantes.
* **Generación automática de lista de compras:** Agrega con un toque los ingredientes que te faltan directamente a tu carrito de compras.

### 🤖 3. Asistente IA & Registro por Voz
* **Reconocimiento por voz (Web Speech API):** Registra tus comidas hablando de forma natural.
* **Integración con IA (Google Gemini):** Análisis inteligente de ingredientes, sugerencias personalizadas de comidas y respuestas a dudas nutricionales.

### 🔔 4. Sistema Híbrido de Recordatorios (Web Push Serverless)
* **Funciona con la pantalla apagada o app cerrada:** Mediante suscripciones estándar W3C Web Push (RFC 8291) y claves criptográficas VAPID.
* **Infraestructura Edge Serverless gratuita:** Impulsada por un **Cloudflare Worker** y una base de datos distribuida **Cloudflare D1 (SQLite)** disparada por **Cron Triggers** cada minuto.
* **Filosofía de marca y microcopys cálidos:** Matriz de mensajes con rotación probabilística inteligente:
  * **70% Minimalista:** Directo al grano y accionable (*"🌅 Hora del desayuno. Registra tu desayuno y empezamos el día con todo."*).
  * **20% Cálido:** Empático y cercano (*"🍽️ ¿Qué hay para almorzar? Cuéntanos qué comiste. Nosotros nos encargamos de los macros."*).
  * **10% Divertido:** Toque de humor natural (*"👀 Tu desayuno nos interesa. Cuéntanos qué cayó esta mañana."*).

### 📱 5. PWA Offline-First
* **100% Funcional sin internet:** Cacheo de recursos y fallback offline mediante Service Worker dedicado.
* **Instalable en móvil y escritorio:** Se comporta como una aplicación nativa en Android, iOS, Windows y macOS.
* **Privacidad total:** Tus registros residen en el almacenamiento de tu dispositivo.

---

## 🛠️ Tecnologías Utilizadas

| Capa | Tecnología | Propósito |
|---|---|---|
| **Frontend Core** | HTML5 Semántico, CSS3 Vanilla, JavaScript (ES6+ Modular) | Interfaz ultrarrápida sin dependencias ni bundles pesados |
| **Arquitectura de Datos** | Local Storage + Migración reactiva de estado | Persistencia offline inmediata sin latencia |
| **PWA & Offline** | Service Workers API, Web App Manifest, Cache Storage | Soporte offline e instalación nativa en dispositivos móviles |
| **Backend Serverless** | Cloudflare Workers (JavaScript V8 Isolate) | Lógica de edge computing para entrega de Web Push |
| **Base de Datos Edge** | Cloudflare D1 (SQLite distribuido) | Almacenamiento de endpoints push, zonas horarias y cronogramas |
| **Criptografía Web** | Web Crypto API (`crypto.subtle`) | Cifrado RFC 8291 (`aes128gcm`) y firmas JWT ES256 para VAPID |
| **IA & Audio** | Web Speech API, Google Gemini API | Dictado por voz y asistencia nutricional generativa |

---

## 🏗️ Estructura del Proyecto

```text
NutriFlow/
├── css/                          # Sistema de diseño y hojas de estilo
│   ├── base.css                  # Variables CSS, reset y tipografía
│   ├── components.css            # Botones, modales, tarjetas y switches
│   ├── styles.css                # Estilos globales y layout
│   └── views/                    # Estilos específicos por vista (diary, profile, etc.)
├── js/
│   ├── core/                     # Utilidades base y logger
│   ├── data/                     # Catálogo de alimentos e ingredientes iniciales
│   ├── services/                 # Servicios desacoplados de negocio
│   │   ├── db.js                 # Manejo de estado y persistencia
│   │   ├── ai.js                 # Integración con Google Gemini
│   │   └── notificationService.js# Motor de notificaciones locales y Web Push
│   ├── components/               # Componentes UI (voz, editor de recetas, sheets)
│   ├── views/                    # Controladores de pantalla (diario, despensa, etc.)
│   └── main.js                   # Orquestador del ciclo de vida de la aplicación
├── worker/
│   └── index.js                  # Cloudflare Worker Serverless (Web Push + Cron + D1)
├── img/                          # Íconos e imágenes de la PWA
├── sw.js                         # Service Worker de la PWA (Cache + Push Handler)
├── manifest.json                 # Manifiesto de la PWA
├── index.html                    # Aplicación de página única (SPA)
├── ARCHITECTURE.md               # Documentación técnica de arquitectura
└── README.md                     # Documento maestro del proyecto
```

---

## 🚀 Despliegue y Configuración

### 1. Frontend (GitHub Pages)
El frontend de NutriFlow no requiere ningún paso de compilación (`npm build`). Es compatible directamente con **GitHub Pages**:
1. Sube los archivos a tu repositorio.
2. En GitHub: ve a **Settings** > **Pages**.
3. Selecciona la rama `main` y guarda. En pocos segundos estará activo en `https://<tu-usuario>.github.io/<tu-repo>/`.

### 2. Backend de Notificaciones (Cloudflare Workers + D1)
1. Crea una base de datos D1 llamada `nutriflow-db` en Cloudflare.
2. Ejecuta la creación de tabla:
   ```sql
   CREATE TABLE IF NOT EXISTS subscriptions (
     id TEXT PRIMARY KEY,
     endpoint TEXT UNIQUE NOT NULL,
     p256dh TEXT NOT NULL,
     auth TEXT NOT NULL,
     timezone TEXT NOT NULL DEFAULT 'America/Lima',
     reminders_json TEXT NOT NULL,
     last_notified_json TEXT DEFAULT '{}',
     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
   );
   ```
3. Crea un Worker llamado `nutriflow-worker`, pega el contenido de [`worker/index.js`](file:///c:/Users/Hp/Documents/dev/Our/NutriFlow/worker/index.js) y vincúlalo a tu base de datos D1 con el nombre de variable `DB`.
4. Añade un **Cron Trigger** programado cada minuto: `* * * * *`.
5. Pega la URL de tu Worker en la sección **Perfil > Recordatorios** dentro de NutriFlow y presiona **Sincronizar**.

---

