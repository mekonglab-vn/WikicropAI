window.mnI18n = window.mnI18n || (function () {
    const messages = mw.config.get('MyNotebookMessages') || {};
    let currentLang = (mw.config.get('MyNotebookLang') || 'en').toLowerCase();

    function format(message, params) {
        let output = message;
        Object.entries(params || {}).forEach(([key, value]) => {
            output = output.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
        });
        return output;
    }

    return {
        t: function(key, params = {}) {
            const message = messages[key] || key;
            return format(message, params);
        },
        lang: function() {
            return currentLang;
        }
    };
})();
