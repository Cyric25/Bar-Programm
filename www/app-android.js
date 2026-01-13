// ===========================
// ANDROID-SPEZIFISCHE FEATURES
// ===========================
// Verwendet Capacitor App & Status Bar Plugins für native Android-Integration

class AndroidFeatures {
    constructor() {
        this.isAndroid = typeof Capacitor !== 'undefined' && Capacitor.getPlatform() === 'android';
        this.currentTab = 'verkauf'; // Track current tab für Back-Button
    }

    async init() {
        if (!this.isAndroid) {
            console.log('ℹ️ Nicht auf Android - Android-Features übersprungen');
            return;
        }

        console.log('🤖 Initialisiere Android-Features...');

        try {
            // 1. Status Bar Styling
            await this.setupStatusBar();

            // 2. Back-Button Handling
            await this.setupBackButton();

            // 3. App-Lifecycle Listener
            await this.setupAppLifecycle();

            console.log('✅ Android-Features aktiviert');
        } catch (error) {
            console.error('❌ Fehler beim Initialisieren der Android-Features:', error);
        }
    }

    async setupStatusBar() {
        if (!Capacitor.Plugins.StatusBar) {
            console.warn('⚠️ Status Bar Plugin nicht verfügbar');
            return;
        }

        try {
            // Setze Status Bar Style (Light = helle Icons/Text für dunklen Hintergrund)
            await Capacitor.Plugins.StatusBar.setStyle({ style: 'LIGHT' });

            // Setze Status Bar Hintergrundfarbe (Match mit Header-Farbe #2563eb)
            await Capacitor.Plugins.StatusBar.setBackgroundColor({ color: '#2563eb' });

            // Zeige Status Bar (falls versteckt)
            await Capacitor.Plugins.StatusBar.show();

            console.log('✅ Status Bar konfiguriert');
        } catch (error) {
            console.error('❌ Status Bar Setup fehlgeschlagen:', error);
        }
    }

    async setupBackButton() {
        if (!Capacitor.Plugins.App) {
            console.warn('⚠️ App Plugin nicht verfügbar');
            return;
        }

        try {
            // Back-Button Listener hinzufügen
            Capacitor.Plugins.App.addListener('backButton', ({ canGoBack }) => {
                console.log('🔙 Back-Button gedrückt');

                // Prüfe ob ein Modal offen ist
                const modals = document.querySelectorAll('.modal[style*="display: block"], .modal[style*="display:block"]');
                if (modals.length > 0) {
                    // Schließe offenes Modal
                    modals.forEach(modal => {
                        modal.style.display = 'none';
                    });
                    console.log('  → Modal geschlossen');
                    return;
                }

                // Prüfe welche Seite aktiv ist
                const isManagerPage = window.location.pathname.includes('manager.html');

                if (isManagerPage) {
                    // Manager-Seite: Prüfe welcher Tab aktiv ist
                    const activeTab = document.querySelector('.tab-btn.active');
                    const activeTabName = activeTab ? activeTab.dataset.tab : 'verwaltung';

                    if (activeTabName !== 'verwaltung') {
                        // Gehe zurück zum ersten Tab (Verwaltung)
                        const firstTab = document.querySelector('.tab-btn[data-tab="verwaltung"]');
                        if (firstTab) {
                            firstTab.click();
                            console.log('  → Zurück zu Verwaltung-Tab');
                            return;
                        }
                    } else {
                        // Im ersten Tab: Gehe zu index.html
                        window.location.href = 'index.html';
                        console.log('  → Zurück zu index.html');
                        return;
                    }
                } else {
                    // Index-Seite: Prüfe welcher Tab aktiv ist
                    const activeTab = document.querySelector('.tab-btn.active');
                    const activeTabName = activeTab ? activeTab.dataset.tab : 'verkauf';

                    if (activeTabName !== 'verkauf') {
                        // Gehe zurück zum ersten Tab (Verkauf)
                        const firstTab = document.querySelector('.tab-btn[data-tab="verkauf"]');
                        if (firstTab) {
                            firstTab.click();
                            console.log('  → Zurück zu Verkauf-Tab');
                            return;
                        }
                    } else {
                        // Im ersten Tab: Zeige Exit-Bestätigung
                        this.showExitConfirmation();
                    }
                }
            });

            console.log('✅ Back-Button Handler registriert');
        } catch (error) {
            console.error('❌ Back-Button Setup fehlgeschlagen:', error);
        }
    }

    showExitConfirmation() {
        const confirmed = confirm('App beenden?');
        if (confirmed) {
            Capacitor.Plugins.App.exitApp();
        }
    }

    async setupAppLifecycle() {
        if (!Capacitor.Plugins.App) {
            console.warn('⚠️ App Plugin nicht verfügbar');
            return;
        }

        try {
            // App State Change Listener
            Capacitor.Plugins.App.addListener('appStateChange', ({ isActive }) => {
                console.log(`📱 App ${isActive ? 'aktiviert' : 'in Hintergrund'}`);

                if (isActive) {
                    // App wurde aktiviert
                    this.onAppResume();
                } else {
                    // App wurde in Hintergrund verschoben
                    this.onAppPause();
                }
            });

            // URL Open Listener (falls App via Deep Link geöffnet wird)
            Capacitor.Plugins.App.addListener('appUrlOpen', (data) => {
                console.log('🔗 App via URL geöffnet:', data.url);
                // Hier könnte Deep Link Handling implementiert werden
            });

            // Restore Listener (App wurde aus Hintergrund wiederhergestellt)
            Capacitor.Plugins.App.addListener('appRestoredResult', (data) => {
                console.log('🔄 App wiederhergestellt:', data);
            });

            console.log('✅ App-Lifecycle Listener registriert');
        } catch (error) {
            console.error('❌ App-Lifecycle Setup fehlgeschlagen:', error);
        }
    }

    onAppResume() {
        // App wurde aktiviert - z.B. nach Home-Button
        console.log('▶️ App aktiviert');

        // Aktualisiere Datum-Anzeige
        const dateElement = document.getElementById('current-date');
        if (dateElement) {
            const today = new Date().toLocaleDateString('de-DE', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            dateElement.textContent = today;
        }

        // Trigger Backup wenn Auto-Backup aktiviert ist
        if (window.autoBackup && window.autoBackup.isSupported) {
            console.log('  → Backup-Check nach Resume');
            // Backup wird bereits automatisch durch Intervall gemacht
        }
    }

    onAppPause() {
        // App wurde in Hintergrund verschoben
        console.log('⏸️ App pausiert');

        // Optional: Letztes Backup durchführen bevor App in Hintergrund geht
        if (window.autoBackup && window.autoBackup.isSupported) {
            console.log('  → Backup vor Pause');
            window.autoBackup.performBackup().catch(err => {
                console.warn('Backup vor Pause fehlgeschlagen:', err);
            });
        }
    }

    // Helper: Haptic Feedback (optional)
    async vibrate(duration = 50) {
        if (!Capacitor.Plugins.Haptics) {
            return;
        }

        try {
            await Capacitor.Plugins.Haptics.vibrate({ duration });
        } catch (error) {
            // Haptic nicht verfügbar - ignorieren
        }
    }

    // Helper: Zeige Toast-Nachricht
    showToast(message) {
        if (typeof showToast === 'function') {
            showToast(message);
        } else {
            console.log('📢 Toast:', message);
        }
    }

    // Network Status (optional für zukünftige Features)
    async checkNetworkStatus() {
        if (!Capacitor.Plugins.Network) {
            return { connected: true, connectionType: 'unknown' };
        }

        try {
            const status = await Capacitor.Plugins.Network.getStatus();
            console.log('📡 Network Status:', status);
            return status;
        } catch (error) {
            console.warn('Network Status nicht verfügbar:', error);
            return { connected: true, connectionType: 'unknown' };
        }
    }
}

// Globale Instanz
let androidFeatures = null;

// Automatisch beim Laden initialisieren
document.addEventListener('DOMContentLoaded', async () => {
    androidFeatures = new AndroidFeatures();

    // Kleine Verzögerung damit andere Scripts zuerst laden
    setTimeout(async () => {
        await androidFeatures.init();
    }, 500);
});

// Für manuellen Zugriff
window.androidFeatures = androidFeatures;

// Tab-Tracking für Back-Button (wird von app.js/manager.js aufgerufen)
window.setCurrentTab = (tabName) => {
    if (androidFeatures) {
        androidFeatures.currentTab = tabName;
        console.log('📑 Aktueller Tab:', tabName);
    }
};
