// ===========================
// AUTOMATISCHES BACKUP-SYSTEM
// ===========================

class AutoBackup {
    constructor() {
        this.dirHandle = null;
        this.backupInterval = 60000; // Backup alle 60 Sekunden
        this.isSupported = 'showDirectoryPicker' in window;

        // Konsolidierte Datenbank-Dateien
        this.databases = [
            {
                name: 'Produkte',
                filename: 'db_produkte.json',
                keys: ['fos_bar_products', 'fos_bar_categories']
            },
            {
                name: 'Gutschriften',
                filename: 'db_gutschriften.json',
                keys: ['fos_bar_persons'],
                includeDebts: false
            },
            {
                name: 'Schuldbuch',
                filename: 'db_schuldbuch.json',
                keys: ['fos_bar_debtors_index'],
                includeDebtors: true
            },
            {
                name: 'Inventar',
                filename: 'db_inventar.json',
                keys: ['fos_bar_inventory', 'fos_bar_sales']
            },
            {
                name: 'Treuekarten',
                filename: 'db_treuekarten.json',
                keys: ['fos_bar_loyalty_card_types']
            }
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
            let backedUpDatabases = 0;

            // Erstelle konsolidierte Datenbank-Dateien
            for (const db of this.databases) {
                const dbData = {
                    _metadata: {
                        databaseName: db.name,
                        exportDate: new Date().toISOString(),
                        version: '2.0'
                    }
                };

                // Sammle alle Daten für diese Datenbank
                for (const key of db.keys) {
                    const data = localStorage.getItem(key);
                    if (data) {
                        try {
                            dbData[key] = JSON.parse(data);
                        } catch (e) {
                            dbData[key] = data;
                        }
                    }
                }

                // Spezialbehandlung für Schuldbuch mit separaten Debtor-Dateien
                if (db.includeDebtors) {
                    const debtorIndex = localStorage.getItem('fos_bar_debtors_index');
                    if (debtorIndex) {
                        const debtors = JSON.parse(debtorIndex);
                        dbData.debtors = [];

                        for (const debtorInfo of debtors) {
                            const debtorData = localStorage.getItem(`fos_bar_debtors_${debtorInfo.id}`);
                            if (debtorData) {
                                dbData.debtors.push(JSON.parse(debtorData));
                            }
                        }
                    }
                }

                // Schreibe Datenbank-Datei
                await this.writeFile(db.filename, JSON.stringify(dbData, null, 2));
                backedUpDatabases++;
                console.log(`  ✓ ${db.name} gesichert`);
            }

            // Schreibe Backup-Metadaten
            const metadata = {
                lastBackup: new Date().toISOString(),
                databasesBackedUp: backedUpDatabases,
                databases: this.databases.map(db => ({ name: db.name, filename: db.filename })),
                version: '2.0'
            };
            await this.writeFile('_backup_info.json', JSON.stringify(metadata, null, 2));

            console.log(`✅ Backup erfolgreich: ${backedUpDatabases} Datenbanken gesichert`);
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

    async restoreFromBackup(databaseName = null) {
        if (!this.dirHandle) {
            console.log('ℹ️ Kein Backup-Verzeichnis ausgewählt');
            return false;
        }

        try {
            console.log('📥 Stelle Daten aus Backup wieder her...');
            let restoredDatabases = 0;

            // Prüfe Backup-Metadaten
            try {
                const metaHandle = await this.dirHandle.getFileHandle('_backup_info.json');
                const metaFile = await metaHandle.getFile();
                const metaContent = await metaFile.text();
                const metadata = JSON.parse(metaContent);
                console.log('📋 Backup-Info:', metadata);
            } catch (e) {
                console.warn('⚠️ Keine Backup-Metadaten gefunden');
            }

            // Bestimme welche Datenbanken wiederhergestellt werden sollen
            const databasesToRestore = databaseName
                ? this.databases.filter(db => db.name === databaseName)
                : this.databases;

            // Restore Datenbanken
            for (const db of databasesToRestore) {
                try {
                    const fileHandle = await this.dirHandle.getFileHandle(db.filename);
                    const file = await fileHandle.getFile();
                    const content = await file.text();
                    const dbData = JSON.parse(content);

                    // Wiederherstellen der localStorage-Einträge
                    for (const key of db.keys) {
                        if (dbData[key]) {
                            localStorage.setItem(key, JSON.stringify(dbData[key]));
                            console.log(`  ✓ ${key} wiederhergestellt`);
                        }
                    }

                    // Spezialbehandlung für Schuldbuch
                    if (db.includeDebtors && dbData.debtors) {
                        // Restore debtors index
                        const debtorIndex = dbData.debtors.map(d => ({
                            id: d.id,
                            name: d.name,
                            debt: d.debt,
                            isPaid: d.isPaid,
                            lastModified: d.lastModified || new Date().toISOString()
                        }));
                        localStorage.setItem('fos_bar_debtors_index', JSON.stringify(debtorIndex));

                        // Restore individual debtors
                        for (const debtor of dbData.debtors) {
                            localStorage.setItem(`fos_bar_debtors_${debtor.id}`, JSON.stringify(debtor));
                        }
                        console.log(`  ✓ ${dbData.debtors.length} Schuldner wiederhergestellt`);
                    }

                    restoredDatabases++;
                    console.log(`✅ ${db.name} wiederhergestellt`);

                } catch (e) {
                    console.log(`ℹ️ Keine Backup-Datei für ${db.name}: ${e.message}`);
                }
            }

            if (restoredDatabases > 0) {
                this.showSuccessMessage(`${restoredDatabases} Datenbank(en) wiederhergestellt`);
                // Seite neu laden um Änderungen anzuzeigen
                setTimeout(() => window.location.reload(), 2000);
                return true;
            } else {
                this.showErrorMessage('Keine Datenbanken gefunden');
                return false;
            }

        } catch (error) {
            console.error('❌ Wiederherstellung fehlgeschlagen:', error);
            this.showErrorMessage('Fehler bei der Wiederherstellung der Daten');
            return false;
        }
    }

    async importDatabase(file) {
        try {
            const content = await file.text();
            const dbData = JSON.parse(content);

            if (!dbData._metadata || !dbData._metadata.databaseName) {
                throw new Error('Ungültiges Datenbank-Format');
            }

            const dbName = dbData._metadata.databaseName;
            const db = this.databases.find(d => d.name === dbName);

            if (!db) {
                throw new Error(`Unbekannte Datenbank: ${dbName}`);
            }

            console.log(`📥 Importiere ${dbName}...`);

            // Importiere die Daten
            for (const key of db.keys) {
                if (dbData[key]) {
                    localStorage.setItem(key, JSON.stringify(dbData[key]));
                    console.log(`  ✓ ${key} importiert`);
                }
            }

            // Spezialbehandlung für Schuldbuch
            if (db.includeDebtors && dbData.debtors) {
                const debtorIndex = dbData.debtors.map(d => ({
                    id: d.id,
                    name: d.name,
                    debt: d.debt,
                    isPaid: d.isPaid,
                    lastModified: d.lastModified || new Date().toISOString()
                }));
                localStorage.setItem('fos_bar_debtors_index', JSON.stringify(debtorIndex));

                for (const debtor of dbData.debtors) {
                    localStorage.setItem(`fos_bar_debtors_${debtor.id}`, JSON.stringify(debtor));
                }
                console.log(`  ✓ ${dbData.debtors.length} Schuldner importiert`);
            }

            this.showSuccessMessage(`${dbName} erfolgreich importiert`);
            setTimeout(() => window.location.reload(), 2000);
            return true;

        } catch (error) {
            console.error('❌ Import fehlgeschlagen:', error);
            this.showErrorMessage(`Import fehlgeschlagen: ${error.message}`);
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

// Export einzelner Datenbanken
window.exportProdukte = () => exportDatabase('Produkte');
window.exportGutschriften = () => exportDatabase('Gutschriften');
window.exportSchuldbuch = () => exportDatabase('Schuldbuch');
window.exportInventar = () => exportDatabase('Inventar');
window.exportTreuekarten = () => exportDatabase('Treuekarten');

function exportDatabase(dbName) {
    if (!autoBackup) {
        console.error('AutoBackup nicht initialisiert');
        return;
    }

    const db = autoBackup.databases.find(d => d.name === dbName);
    if (!db) {
        console.error(`Datenbank ${dbName} nicht gefunden`);
        return;
    }

    const dbData = {
        _metadata: {
            databaseName: db.name,
            exportDate: new Date().toISOString(),
            version: '2.0'
        }
    };

    // Sammle Daten
    for (const key of db.keys) {
        const data = localStorage.getItem(key);
        if (data) {
            try {
                dbData[key] = JSON.parse(data);
            } catch (e) {
                dbData[key] = data;
            }
        }
    }

    // Spezialbehandlung für Schuldbuch
    if (db.includeDebtors) {
        const debtorIndex = localStorage.getItem('fos_bar_debtors_index');
        if (debtorIndex) {
            const debtors = JSON.parse(debtorIndex);
            dbData.debtors = [];

            for (const debtorInfo of debtors) {
                const debtorData = localStorage.getItem(`fos_bar_debtors_${debtorInfo.id}`);
                if (debtorData) {
                    dbData.debtors.push(JSON.parse(debtorData));
                }
            }
        }
    }

    // Download
    const dataStr = JSON.stringify(dbData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${db.filename}`;
    link.click();
    URL.revokeObjectURL(url);

    console.log(`✅ ${dbName} exportiert`);
    if (typeof showToast === 'function') {
        showToast(`${dbName} exportiert`);
    }
}

// Import einzelner Datenbanken
window.importProdukte = () => triggerImport('Produkte');
window.importGutschriften = () => triggerImport('Gutschriften');
window.importSchuldbuch = () => triggerImport('Schuldbuch');
window.importInventar = () => triggerImport('Inventar');
window.importTreuekarten = () => triggerImport('Treuekarten');

function triggerImport(dbName) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file && autoBackup) {
            await autoBackup.importDatabase(file);
        }
    };
    input.click();
}
