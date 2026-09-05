// ============================================================
// notificationService.js — Recordatorios y Notificaciones Locales
// Filosofía de marca: "Tú registra. Nosotros hacemos las cuentas."
// ============================================================

const NOTIFICATION_COPY_MATRIX = {
  desayuno: {
    label: 'Desayuno',
    emoji: '🌅',
    categoryKey: 'desayuno',
    variants: {
      minimal: {
        title: '🌅 Hora del desayuno',
        body: 'Registra tu desayuno y empezamos el día con todo.'
      },
      warm: {
        title: '☀️ Buenos días',
        body: '¿Qué desayunaste hoy? Añádelo y deja que nosotros hagamos las cuentas.'
      },
      playful: {
        title: '👀 Tu desayuno nos interesa',
        body: 'Cuéntanos qué cayó esta mañana.'
      },
      macro: {
        title: '🌅 Desayuno pendiente',
        body: 'Tú registra. Nosotros hacemos las cuentas.'
      }
    }
  },
  snack_morning: {
    label: 'Snack de la mañana',
    emoji: '🥨',
    categoryKey: 'snack',
    variants: {
      minimal: {
        title: '🥨 ¿Un snack?',
        body: 'Si comiste algo, no olvides registrarlo.'
      },
      warm: {
        title: '👋 Pausa para un snack',
        body: '¿Qué picoteaste? Añádelo en un toque.'
      },
      playful: {
        title: '👀 Sabemos que hubo snack',
        body: 'Ahora solo falta contarnos cuál fue.'
      },
      casual: {
        title: '🥨 Hora de picar algo',
        body: 'Registra tu snack y seguimos.'
      }
    }
  },
  almuerzo: {
    label: 'Almuerzo',
    emoji: '☀️',
    categoryKey: 'almuerzo',
    variants: {
      minimal: {
        title: '☀️ Hora del almuerzo',
        body: 'Registra lo que comiste y seguimos con el día.'
      },
      warm: {
        title: '🍽️ ¿Qué hay para almorzar?',
        body: 'Cuéntanos qué comiste. Nosotros nos encargamos de los macros.'
      },
      playful: {
        title: '🍽️ Momento importante',
        body: 'El almuerzo quiere entrar en tu registro.'
      },
      macro: {
        title: '💪 Almuerzo pendiente',
        body: 'Tú registra. Nosotros hacemos las cuentas.'
      }
    }
  },
  merienda: {
    label: 'Merienda',
    emoji: '🥪',
    categoryKey: 'merienda',
    variants: {
      minimal: {
        title: '🥪 Hora de la merienda',
        body: '¿Comiste algo? Regístralo en un toque.'
      },
      warm: {
        title: '☕ Pausa de la tarde',
        body: '¿Qué te acompañó esta tarde? Añádelo a tu día.'
      },
      playful: {
        title: '👀 ¿Otra vez hambre?',
        body: 'No pasa nada. Solo queremos saber qué comiste.'
      },
      casual: {
        title: '🥪 ¿Snack de tarde?',
        body: 'Regístralo y seguimos.'
      }
    }
  },
  cena: {
    label: 'Cena',
    emoji: '🌙',
    categoryKey: 'cena',
    variants: {
      minimal: {
        title: '🌙 Hora de cenar',
        body: 'Registra tu cena para cerrar el día.'
      },
      warm: {
        title: '🌙 Última parada del día',
        body: '¿Qué cenaste? Añádelo y revisa cómo fue tu día.'
      },
      playful: {
        title: '🍽️ El último registro',
        body: 'Una cena más y tenemos el día completo.'
      },
      macro: {
        title: '🌙 Cena pendiente',
        body: 'Tú registra. Nosotros hacemos las cuentas.'
      }
    }
  },
  hidratacion: {
    label: 'Hidratación',
    emoji: '💧',
    categoryKey: 'water',
    variants: {
      minimal: {
        title: '💧 Hora de hidratarte',
        body: 'Registra un vaso de agua y sigue con tu día.'
      },
      warm: {
        title: '💧 Un poquito de agua',
        body: 'Tómate un momento para hidratarte.'
      },
      playful: {
        title: '💧 Tu cuerpo acaba de mandar un mensaje',
        body: 'Dice que quiere agua. 👀'
      },
      simple: {
        title: '💧 ¿Agua?',
        body: 'Recuerda registrar tu hidratación.'
      }
    }
  }
};

const DEFAULT_REMINDERS = {
  desayuno: { enabled: true, time: '08:30' },
  snack_morning: { enabled: false, time: '11:00' },
  almuerzo: { enabled: true, time: '13:30' },
  merienda: { enabled: true, time: '17:00' },
  cena: { enabled: true, time: '20:30' },
  hidratacion: { enabled: true, time: '11:30' }
};

const NotificationService = {
  _timer: null,
  _lastNotified: {},
  VAPID_PUBLIC_KEY: 'BCn-AdPMbKSpv6USZz716SHl-6zPhNr2KWsLpzWL-ZsnsmaOoNVKat6J2LO8Qc6chuhnRQbKUuZNrCMMGRkbUA4',

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  },

  getWorkerUrl() {
    const prefs = (window.DB && window.DB.userPreferences) ? window.DB.userPreferences : {};
    return prefs.workerUrl || localStorage.getItem('nutriflow_worker_url') || '';
  },

  setWorkerUrl(url) {
    const cleanUrl = (url || '').trim().replace(/\/+$/, '');
    if (window.DB && window.DB.userPreferences) {
      window.DB.userPreferences.workerUrl = cleanUrl;
      if (typeof persistState === 'function') persistState();
    }
    try {
      localStorage.setItem('nutriflow_worker_url', cleanUrl);
    } catch (e) {}
    return cleanUrl;
  },

  async isPushSubscribed() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      return !!sub;
    } catch (e) {
      return false;
    }
  },

  async syncWithCloudflare(customUrl) {
    const workerUrl = customUrl ? this.setWorkerUrl(customUrl) : this.getWorkerUrl();
    if (!workerUrl) {
      throw new Error('Ingresa la URL de tu Cloudflare Worker primero.');
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Este navegador o dispositivo no soporta notificaciones push en segundo plano.');
    }

    // 1. Asegurar permiso
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Permiso de notificaciones no otorgado.');
    }

    // 2. Obtener o crear PushSubscription con nuestra VAPID Public Key
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.VAPID_PUBLIC_KEY)
      });
    }

    const subJson = sub.toJSON();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Lima';
    const reminders = this.getReminders();

    // 3. Registrar en D1 a través del Cloudflare Worker
    const res = await fetch(`${workerUrl}/api/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: subJson.endpoint,
        keys: subJson.keys,
        timezone: tz,
        reminders
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || errData.error || `Error del servidor Worker (${res.status})`);
    }

    const resData = await res.json();
    return resData;
  },

  async sendTestPushCloudflare() {
    const workerUrl = this.getWorkerUrl();
    if (!workerUrl) {
      throw new Error('Configura la URL de tu Worker en Ajustes primero.');
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Web Push no disponible.');
    }

    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) {
      throw new Error('Primero debes sincronizar con Cloudflare antes de probar.');
    }

    const res = await fetch(`${workerUrl}/api/test-push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: sub.endpoint,
        keys: sub.toJSON().keys
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      throw new Error(data.message || data.error || 'Error enviando notificación push');
    }
    return data;
  },

  isSupported() {
    return 'Notification' in window;
  },

  getPermission() {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission; // 'default' | 'granted' | 'denied'
  },

  async requestPermission() {
    if (!this.isSupported()) {
      if (typeof showToast === 'function') showToast('⚠️ Tu navegador no soporta notificaciones locales');
      return 'unsupported';
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        if (typeof showToast === 'function') showToast('🔔 ¡Notificaciones activadas con éxito!');
        this.sendTestNotification();
      } else if (permission === 'denied') {
        if (typeof showToast === 'function') showToast('⚠️ Permiso denegado en el navegador');
      }
      return permission;
    } catch (e) {
      console.error('[NutriFlow Notif] Error al solicitar permisos:', e);
      return 'denied';
    }
  },

  getReminders() {
    const prefs = (window.DB && window.DB.userPreferences) ? window.DB.userPreferences : {};
    if (!prefs.reminders) {
      prefs.reminders = JSON.parse(JSON.stringify(DEFAULT_REMINDERS));
    }
    return prefs.reminders;
  },

  saveReminders(reminders) {
    if (!window.DB || !window.DB.userPreferences) return;
    window.DB.userPreferences.reminders = reminders;
    if (typeof persistState === 'function') persistState();
  },

  updateReminder(mealKey, updates) {
    const reminders = this.getReminders();
    if (!reminders[mealKey]) {
      reminders[mealKey] = { ...DEFAULT_REMINDERS[mealKey] };
    }
    reminders[mealKey] = { ...reminders[mealKey], ...updates };
    this.saveReminders(reminders);

    // Si tiene worker configurado, sincronizar automáticamente con Cloudflare D1 en segundo plano
    if (this.getWorkerUrl()) {
      this.syncWithCloudflare().catch(err => {
        console.log('[NutriFlow Notif] Sincronización en segundo plano con D1 completada o en espera:', err.message);
      });
    }
  },


  /**
   * Rota los copys según las probabilidades:
   * 70% minimal, 20% cálida, 10% divertida
   */
  pickMessage(mealKey) {
    const item = NOTIFICATION_COPY_MATRIX[mealKey];
    if (!item || !item.variants) {
      return {
        title: '🥑 NutriFlow Recordatorio',
        body: 'Tú registra. Nosotros hacemos las cuentas.'
      };
    }

    const rand = Math.random();
    const v = item.variants;

    if (rand < 0.70 && v.minimal) {
      return v.minimal;
    } else if (rand < 0.90 && v.warm) {
      return v.warm;
    } else if (v.playful) {
      return v.playful;
    } else {
      return v.minimal || Object.values(v)[0];
    }
  },

  async sendNotification(title, options = {}) {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      console.log('[NutriFlow Notif] No se puede enviar notificación: permisos no otorgados.');
      return null;
    }

    const defaultOptions = {
      icon: 'img/favicon.png',
      badge: 'img/logo.png',
      tag: 'nutriflow-reminder',
      renotify: true,
      silent: false
    };

    const finalOptions = { ...defaultOptions, ...options };

    // 1. Prioridad: Service Worker (Obligatorio en móviles Android / PWAs y recomendado por la W3C)
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && typeof registration.showNotification === 'function') {
          await registration.showNotification(title, finalOptions);
          return true;
        }
      } catch (swErr) {
        console.warn('[NutriFlow Notif] Service Worker showNotification no disponible, intentando constructor nativo:', swErr);
      }
    }

    // 2. Fallback: Constructor clásico para Desktop (cuando no hay Service Worker activo)
    try {
      const notif = new Notification(title, finalOptions);

      notif.onclick = () => {
        window.focus();
        notif.close();
        if (typeof window.navigateToScreen === 'function') {
          window.navigateToScreen('diary');
        }
      };

      return notif;
    } catch (e) {
      console.error('[NutriFlow Notif] Error enviando notificación nativa:', e);
      return null;
    }
  },

  async sendTestNotification() {
    const copy = {
      title: '✨ NutriFlow está listo',
      body: 'Tú registra. Nosotros hacemos las cuentas 🥑📊'
    };
    return await this.sendNotification(copy.title, {
      body: copy.body,
      tag: 'nutriflow-test-' + Date.now()
    });
  },

  /**
   * Comprueba si la comida correspondiente ya fue registrada hoy
   */
  isMealAlreadyLogged(mealKey) {
    if (!window.DB || typeof window.DB.getTodayLogs !== 'function') return false;
    const logs = window.DB.getTodayLogs();
    const targetMeta = NOTIFICATION_COPY_MATRIX[mealKey];
    if (!targetMeta) return false;

    const cat = targetMeta.categoryKey;

    if (cat === 'water') {
      // Si registró agua en las últimas 2 horas, omitir
      const recentWater = logs.some(l => {
        if (l.type !== 'water') return false;
        const timeDiff = Date.now() - new Date(l.timestamp).getTime();
        return timeDiff < (2 * 60 * 60 * 1000); // 2h
      });
      return recentWater;
    }

    // Comprobar si hay log de meal o food_item registrado con este tipo
    const norm = (s) => (s || '').toLowerCase().trim();
    return logs.some(l => {
      const matchType = norm(l.meal_type) === norm(cat) || norm(l.mealCategory) === norm(cat);
      if (matchType) return true;

      // En el caso de recetas, checar la categoría en DB
      if (l.type === 'meal' && l.reference_id) {
        const recipe = window.DB.getRecipeById ? window.DB.getRecipeById(l.reference_id) : null;
        if (recipe && norm(recipe.meal_type) === norm(cat)) return true;
      }
      return false;
    });
  },

  checkAndTriggerReminders() {
    if (this.getPermission() !== 'granted') return;

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${hours}:${minutes}`;

    const todayStr = (typeof getTodayDateString === 'function')
      ? getTodayDateString()
      : now.toISOString().split('T')[0];

    // Recuperar registro de últimos disparos para no repetir en el mismo día
    try {
      const stored = localStorage.getItem('nutriflow_last_notified_v1');
      if (stored) this._lastNotified = JSON.parse(stored);
    } catch (e) {}

    const reminders = this.getReminders();

    Object.entries(reminders).forEach(([mealKey, config]) => {
      if (!config || !config.enabled) return;
      if (config.time !== currentTimeStr) return;

      // Evitar disparar dos veces en el mismo día
      if (this._lastNotified[mealKey] === todayStr) return;

      // Comprobar si ya comió
      if (this.isMealAlreadyLogged(mealKey)) {
        console.log(`[NutriFlow Notif] Omitiendo ${mealKey}: ya fue registrado hoy.`);
        this._lastNotified[mealKey] = todayStr; // Marcar como satisfecho
        this._saveLastNotified();
        return;
      }

      // Disparar notificación con variante ponderada
      const copy = this.pickMessage(mealKey);
      console.log(`[NutriFlow Notif] 🔔 Disparando recordatorio para ${mealKey}:`, copy);

      this.sendNotification(copy.title, {
        body: copy.body,
        tag: `nutriflow-remind-${mealKey}`
      });

      this._lastNotified[mealKey] = todayStr;
      this._saveLastNotified();
    });
  },

  _saveLastNotified() {
    try {
      localStorage.setItem('nutriflow_last_notified_v1', JSON.stringify(this._lastNotified));
    } catch (e) {}
  },

  init() {
    if (this._timer) clearInterval(this._timer);

    // Chequeo cada 60 segundos
    this._timer = setInterval(() => {
      this.checkAndTriggerReminders();
    }, 60000);

    // Chequeo inmediato al reenfocar pestaña
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkAndTriggerReminders();
      }
    });

    console.log('[NutriFlow Notif] Servicio de recordatorios iniciado.');
  }
};

window.NotificationService = NotificationService;
window.NOTIFICATION_COPY_MATRIX = NOTIFICATION_COPY_MATRIX;
