// ===========================
// AUTOMATISCHES BACKUP-SYSTEM
// ===========================

class AutoBackup {
    constructor() {
        this.dirHandle = null;
        this.backupInterval = 60000; // Backup alle 60 Sekunden
        this.isSupported = 'showDirectoryPicker' in window;
        this.storageKeys = [
            { key: 'fos_bar_products', filename: 'backup_products.json' },
            { key: 'fos_bar_categories', filename: 'backup_categories.json' },
            { key: 'fos_bar_sales', filename: 'backup_sales.json' },
            { key: 'fos_bar_persons', filename: 'backup_persons.json' },
            { key: 'fos_bar_debtors_index', filename: 'backup_debtors_index.json' },
            { key: 'fos_bar_loyalty_card_types', filename: 'backup_loyalty_card_types.json' },
            { key: 'fos_bar_inventory', filename: 'backup_inventory.json' }
        ];
    }

    async init() {
        console.log('🔄 Initialisiere Auto-Backup System...');

        if (!this.isSupported) {
            console.warn('⚠️ File System Access API wird nicht unterstützt. Automatisches Backup deaktiviert.');
            this.showFallbackMessage();
            return false;
        }

        // Prüfe ob bereits Verzeichnis-Zugriff gewährt wurde
        const hasPermission = await this.checkStoredPermission();

        if (!hasPermission) {
            // Zeige Info-Banner, dass Backup-Verzeichnis ausgewählt werden kann
            this.showSetupBanner();
            return false;
        }

        // Starte automatisches Backup
        await this.performBackup();
        this.startAutoBackup();
        console.log('✅ Auto-Backup aktiviert');
        return true;
    }

    async checkStoredPermission() {
        try {
            const handleData = localStorage.getItem('backup_dir_handle');
            if (!handleData) return false;

            // Versuche gespeichertes Handle wiederherzustellen
            // (Dies funktioniert nur innerhalb derselben Session/Browser-Kontext)
            return false; // File System Access API Handles können nicht persistent gespeichert werden
        } catch (error) {
            return false;
        }
    }

    showSetupBanner() {
        const banner = document.createElement('div');
        banner.id = 'backup-setup-banner';
        banner.className = 'backup-banner';
        banner.innerHTML = `
            <div class="backup-banner-content">
                <span>💾 Automatisches Backup aktivieren?</span>
                <button id="btn-setup-backup" class="btn-primary btn-small">Backup-Ordner auswählen</button>
                <button id="btn-dismiss-backup" class="btn-secondary btn-small">Später</button>
            </div>
        `;

        document.body.insertBefore(banner, document.body.firstChild);

        document.getElementById('btn-setup-backup').addEventListener('click', () => {
            this.setupBackupDirectory();
        });

        document.getElementById('btn-dismiss-backup').addEventListener('click', () => {
            banner.remove();
            localStorage.setItem('backup_dismissed', Date.now());
        });
    }

    showFallbackMessage() {
        // Prüfe ob bereits vor weniger als 7 Tagen dismissed
        const dismissed = localStorage.getItem('backup_dismissed');
        if (dismissed && (Date.now() - parseInt(dismissed)) < 7 * 24 * 60 * 60 * 1000) {
            return;
        }

        const banner = document.createElement('div');
        banner.className = 'backup-banner backup-warning';
        banner.innerHTML = `
            <div class="backup-banner-content">
                <span>⚠️ Automatisches Backup nicht verfügbar. Bitte nutzen Sie die manuellen Export-Funktionen.</span>
                <button id="btn-dismiss-fallback" class="btn-secondary btn-small">OK</button>
            </div>
        `;

        document.body.insertBefore(banner, document.body.firstChild);

        document.getElementById('btn-dismiss-fallback').addEventListener('click', () => {
            banner.remove();
            localStorage.setItem('backup_dismissed', Date.now());
        });
    }

    async setupBackupDirectory() {
        try {
            console.log('📁 Wähle Backup-Verzeichnis...');
            this.dirHandle = await window.showDirectoryPicker({
                mode: 'readwrite',
                startIn: 'documents'
            });

            console.log('✅ Backup-Verzeichnis ausgewählt:', this.dirHandle.name);

            // Entferne Setup-Banner
            const banner = document.getElementById('backup-setup-banner');
            if (banner) banner.remove();

            // Zeige Erfolgs-Nachricht
            this.showSuccessMessage('Automatisches Backup aktiviert! Daten werden alle 60 Sekunden gesichert.');

            // Erstes Backup durchführen
            await this.performBackup();

            // Starte automatisches Backup
            this.startAutoBackup();

            return true;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('ℹ️ Backup-Einrichtung abgebrochen');
            } else {
                console.error('❌ Fehler beim Einrichten des Backups:', error);
                this.showErrorMessage('Fehler beim Einrichten des automatischen Backups');
            }
            return false;
        }
    }

    async performBackup() {
        if (!this.dirHandle) {
            console.log('ℹ️ Kein Backup-Verzeichnis ausgewählt');
            return;
        }

        try {
            console.log('💾 Führe Backup durch...');
            let backedUpCount = 0;

            for (const { key, filename } of this.storageKeys) {
                const data = localStorage.getItem(key);
                if (data) {
                    await this.writeFile(filename, data);
                    backedUpCount++;
                }
            }

            // Backup für separate Debtors
            const debtorIndex = localStorage.getItem('fos_bar_debtors_index');
            if (debtorIndex) {
                const debtors = JSON.parse(debtorIndex);
                for (const debtor of debtors) {
                    const debtorData = localStorage.getItem(`fos_bar_debtors_${debtor.id}`);
                    if (debtorData) {
                        await this.writeFile(`backup_debtor_${debtor.id}.json`, debtorData);
                        backedUpCount++;
                    }
                }
            }

            // Schreibe Backup-Metadaten
            const metadata = {
                lastBackup: new Date().toISOString(),
                filesBackedUp: backedUpCount,
                version: '1.0'
            };
            await this.writeFile('backup_metadata.json', JSON.stringify(metadata, null, 2));

            console.log(`✅ Backup erfolgreich: ${backedUpCount} Dateien gesichert`);
            this.updateBackupStatus('Letztes Backup: ' + new Date().toLocaleString('de-DE'));

        } catch (error) {
            console.error('❌ Backup fehlgeschlagen:', error);

            // Wenn Zugriff verweigert wurde, Handle zurücksetzen
            if (error.name === 'NotAllowedError') {
                this.dirHandle = null;
                this.showErrorMessage('Backup-Zugriff verweigert. Bitte wählen Sie das Verzeichnis erneut aus.');
                this.showSetupBanner();
            }
        }
    }

    async writeFile(filename, content) {
        try {
            const fileHandle = await this.dirHandle.getFileHandle(filename, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();
        } catch (error) {
            console.error(`Fehler beim Schreiben von ${filename}:`, error);
            throw error;
        }
    }

    async restoreFromBackup() {
        if (!this.dirHandle) {
            console.log('ℹ️ Kein Backup-Verzeichnis ausgewählt');
            return false;
        }

        try {
            console.log('📥 Stelle Daten aus Backup wieder her...');
            let restoredCount = 0;

            // Prüfe zuerst ob Backup-Metadaten existieren
            try {
                const metaHandle = await this.dirHandle.getFileHandle('backup_metadata.json');
                const metaFile = await metaHandle.getFile();
                const metaContent = await metaFile.text();
                const metadata = JSON.parse(metaContent);
                console.log('📋 Backup-Info:', metadata);
            } catch (e) {
                console.warn('⚠️ Keine Backup-Metadaten gefunden');
            }

            // Restore Hauptdaten
            for (const { key, filename } of this.storageKeys) {
                try {
                    const fileHandle = await this.dirHandle.getFileHandle(filename);
                    const file = await fileHandle.getFile();
                    const content = await file.text();
                    localStorage.setItem(key, content);
                    restoredCount++;
                    console.log(`✅ Wiederhergestellt: ${key}`);
                } catch (e) {
                    console.log(`ℹ️ Keine Backup-Datei für ${key}`);
                }
            }

            // Restore Debtors
            const debtorIndex = localStorage.getItem('fos_bar_debtors_index');
            if (debtorIndex) {
                const debtors = JSON.parse(debtorIndex);
                for (const debtor of debtors) {
                    try {
                        const fileHandle = await this.dirHandle.getFileHandle(`backup_debtor_${debtor.id}.json`);
                        const file = await fileHandle.getFile();
                        const content = await file.text();
                        localStorage.setItem(`fos_bar_debtors_${debtor.id}`, content);
                        restoredCount++;
                    } catch (e) {
                        console.log(`ℹ️ Keine Backup-Datei für Schuldner ${debtor.id}`);
                    }
                }
            }

            console.log(`✅ Wiederherstellung erfolgreich: ${restoredCount} Dateien wiederhergestellt`);
            this.showSuccessMessage(`Daten wiederhergestellt: ${restoredCount} Dateien`);
            return true;

        } catch (error) {
            console.error('❌ Wiederherstellung fehlgeschlagen:', error);
            this.showErrorMessage('Fehler bei der Wiederherstellung der Daten');
            return false;
        }
    }

    startAutoBackup() {
        // Stoppe eventuell laufendes Backup
        if (this.backupIntervalId) {
            clearInterval(this.backupIntervalId);
        }

        // Starte neues Intervall
        this.backupIntervalId = setInterval(() => {
            this.performBackup();
        }, this.backupInterval);

        console.log(`⏰ Auto-Backup gestartet (alle ${this.backupInterval / 1000} Sekunden)`);
    }

    stopAutoBackup() {
        if (this.backupIntervalId) {
            clearInterval(this.backupIntervalId);
            this.backupIntervalId = null;
            console.log('⏸️ Auto-Backup gestoppt');
        }
    }

    updateBackupStatus(message) {
        const statusElement = document.getElementById('backup-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.style.display = 'block';
        }
    }

    showSuccessMessage(message) {
        this.showToast(message, 'success');
    }

    showErrorMessage(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        // Nutze vorhandene Toast-Funktion falls verfügbar
        if (typeof showToast === 'function') {
            showToast(message);
            return;
        }

        // Fallback: Einfacher Toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
            color: white;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Globale Backup-Instanz
let autoBackup = null;

// Automatisch beim Laden initialisieren
document.addEventListener('DOMContentLoaded', async () => {
    autoBackup = new AutoBackup();

    // Verzögerung, damit Haupt-App zuerst laden kann
    setTimeout(async () => {
        await autoBackup.init();
    }, 1000);
});

// Für manuellen Zugriff
window.autoBackup = autoBackup;
window.setupBackup = () => autoBackup?.setupBackupDirectory();
window.restoreBackup = () => autoBackup?.restoreFromBackup();
window.manualBackup = () => autoBackup?.performBackup();
