/**
 * logger.js
 * Intercepta console.log, warn y error para guardarlos en memoria y localStorage,
 * permitiendo exportarlos en dispositivos sin consola de desarrollador (como celulares).
 */

window.Logger = {
  logs: [],
  maxLogs: 150,

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
        this.logs = JSON.parse(stored);
      }
    } catch (e) {
      // Ignorar
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
    
    // Convertir argumentos a strings de forma segura
    const msg = args.map(arg => {
      if (typeof arg === 'object') {
        try { return JSON.stringify(arg); } 
        catch (e) { return String(arg); }
      }
      return String(arg);
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
      alert("No hay logs registrados aún.");
      return;
    }
    const blob = new Blob([this.logs.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NutriFlow_Logs_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

// Iniciar automáticamente
window.Logger.init();
