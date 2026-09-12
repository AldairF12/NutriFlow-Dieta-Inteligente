/**
 * logger.js
 * Intercepta console.log, warn y error para guardarlos en memoria y localStorage,
 * permitiendo exportarlos en dispositivos sin consola de desarrollador (como celulares).
 */

window.Logger = {
  logs: [],
  maxLogs: 50,

  init() {
    this.loadFromStorage();
    this.overrideConsole();
    
    // Capturar errores no manejados
    window.addEventListener('error', (e) => {
      this._addLog('error', ['Uncaught Error:', e.message, e.filename, e.lineno]);
    });
    window.addEventListener('unhandledrejection', (e) => {
      this._addLog('error', ['Unhandled Rejection:', e.reason]);
    });
  },

  loadFromStorage() {
    try {
      const stored = localStorage.getItem('nutriflow_logs');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Depuración automática: descartar logs más antiguos a 48 horas
        const twoDaysAgo = Date.now() - (48 * 60 * 60 * 1000);
        this.logs = (Array.isArray(parsed) ? parsed : []).filter(log => {
          const match = String(log).match(/^\[(.*?)\]/);
          if (!match) return false;
          const time = new Date(match[1]).getTime();
          return !isNaN(time) && time > twoDaysAgo;
        });
        // Si superaba maxLogs, conservar solo los más recientes
        if (this.logs.length > this.maxLogs) {
          this.logs = this.logs.slice(-this.maxLogs);
        }
        this.saveToStorage();
      }
    } catch (e) {
      this.logs = [];
    }
  },

  saveToStorage() {
    try {
      localStorage.setItem('nutriflow_logs', JSON.stringify(this.logs));
    } catch (e) {
      // Ignorar si se llena
    }
  },

  _addLog(level, args) {
    const timestamp = new Date().toISOString();
    
    // Convertir argumentos a strings de forma segura, truncando para evitar saturar memoria
    const msg = args.map(arg => {
      if (arg instanceof Error) {
        return `${arg.name}: ${arg.message}\n${arg.stack}`;
      }
      if (typeof arg === 'object' && arg !== null) {
        try {
          const str = JSON.stringify(arg);
          return str.length > 200 ? str.slice(0, 197) + '...' : str;
        } catch (e) {
          return String(arg);
        }
      }
      const str = String(arg);
      return str.length > 200 ? str.slice(0, 197) + '...' : str;
    }).join(' ');

    this.logs.push(`[${timestamp}] [${level.toUpperCase()}] ${msg}`);

    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Eliminar el más antiguo
    }

    this.saveToStorage();
  },

  overrideConsole() {
    const origLog = console.log;
    const origWarn = console.warn;
    const origError = console.error;

    console.log = (...args) => {
      this._addLog('log', args);
      origLog.apply(console, args);
    };

    console.warn = (...args) => {
      this._addLog('warn', args);
      origWarn.apply(console, args);
    };

    console.error = (...args) => {
      this._addLog('error', args);
      origError.apply(console, args);
    };
  },

  exportLogs() {
    if (this.logs.length === 0) {
      alert("No hay registros de diagnóstico aún.");
      return;
    }
    const blob = new Blob([this.logs.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NutriFlow_Diagnostico_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  clearLogs() {
    this.logs = [];
    try {
      localStorage.removeItem('nutriflow_logs');
    } catch (e) {}
    if (typeof showToast === 'function') {
      showToast('🧹 Diagnóstico técnico vaciado');
    } else {
      alert('Diagnóstico técnico vaciado.');
    }
    if (typeof renderStorageManager === 'function') {
      renderStorageManager();
    }
  }
};

// Iniciar autom\u00e1ticamente
window.Logger.init();
