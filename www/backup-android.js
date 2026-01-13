// ===========================
// AUTOMATISCHES BACKUP-SYSTEM (Android Version)
// ===========================
// Verwendet Capacitor Filesystem API statt Browser File System Access API

// Capacitor Filesystem importieren (wird via CDN geladen)
// <script type="module">
//   import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
// </script>

class AutoBackup {
    constructor() {
        this.backupInterval = 60000; // Backup alle 60 Sekunden
        this.isSupported = true; // Immer true für Android/Capacitor
        this.backupDirectory = 'Backup'; // Festes Verzeichnis in App-Daten

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
        console.log('🔄 Initialisiere Auto-Backup System (Android)...');

        // Prüfe ob Capacitor Filesystem verfügbar ist
        if (typeof Capacitor === 'undefined' || !Capacitor.Plugins.Filesystem) {
            console.warn('⚠️ Capacitor Filesystem nicht verfügbar. Fallback zu Web-Version.');
            this.isSupported = false;
            this.showFallbackMessage();
            return false;
        }

        try {
            // Erstelle Backup-Verzeichnis automatisch
            await this.setupBackupDirectory();

            // Erstes Backup durchführen
            await this.performBackup();

            // Starte automatisches Backup
            this.startAutoBackup();

            console.log('✅ Auto-Backup aktiviert (Android)');
            return true;
        } catch (error) {
            console.error('❌ Fehler beim Initialisieren des Backups:', error);
            this.showErrorMessage('Fehler beim Initialisieren des automatischen Backups');
            return false;
        }
    }

    async setupBackupDirectory() {
        try {
            // Erstelle Backup-Ordner im App-Verzeichnis
            await Capacitor.Plugins.Filesystem.mkdir({
                path: this.backupDirectory,
                directory: Capacitor.Plugins.Filesystem.Directory.Data,
                recursive: true
            });
            console.log(`✅ Backup-Verzeichnis erstellt: ${this.backupDirectory}`);
            return true;
        } catch (error) {
            // Verzeichnis existiert bereits - das ist ok
            if (error.message && error.message.includes('already exists')) {
                console.log(`ℹ️ Backup-Verzeichnis existiert bereits: ${this.backupDirectory}`);
                return true;
            }
            console.error('❌ Fehler beim Erstellen des Backup-Verzeichnisses:', error);
            throw error;
        }
    }

    showFallbackMessage() {
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
        });
    }

    async performBackup() {
        try {
            console.log('💾 Führe Backup durch (Android)...');
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

                // Schreibe Datenbank-Datei mit Capacitor Filesystem
                await this.writeFile(db.filename, JSON.stringify(dbData, null, 2));
                backedUpDatabases++;
                console.log(`  ✓ ${db.name} gesichert`);
            }

            // Schreibe Backup-Metadaten
            const metadata = {
                lastBackup: new Date().toISOString(),
                databasesBackedUp: backedUpDatabases,
                databases: this.databases.map(db => ({ name: db.name, filename: db.filename })),
                version: '2.0',
                platform: 'android'
            };
            await this.writeFile('_backup_info.json', JSON.stringify(metadata, null, 2));

            console.log(`✅ Backup erfolgreich: ${backedUpDatabases} Datenbanken gesichert`);
            this.updateBackupStatus('Letztes Backup: ' + new Date().toLocaleString('de-DE'));

        } catch (error) {
            console.error('❌ Backup fehlgeschlagen:', error);
            this.showErrorMessage('Backup fehlgeschlagen: ' + error.message);
        }
    }

    async writeFile(filename, content) {
        try {
            await Capacitor.Plugins.Filesystem.writeFile({
                path: `${this.backupDirectory}/${filename}`,
                data: content,
                directory: Capacitor.Plugins.Filesystem.Directory.Data,
                encoding: Capacitor.Plugins.Filesystem.Encoding.UTF8
            });
        } catch (error) {
            console.error(`Fehler beim Schreiben von ${filename}:`, error);
            throw error;
        }
    }

    async readFile(filename) {
        try {
            const result = await Capacitor.Plugins.Filesystem.readFile({
                path: `${this.backupDirectory}/${filename}`,
                directory: Capacitor.Plugins.Filesystem.Directory.Data,
                encoding: Capacitor.Plugins.Filesystem.Encoding.UTF8
            });
            return result.data;
        } catch (error) {
            console.error(`Fehler beim Lesen von ${filename}:`, error);
            throw error;
        }
    }

    async restoreFromBackup(databaseName = null) {
        try {
            console.log('📥 Stelle Daten aus Backup wieder her (Android)...');
            let restoredDatabases = 0;

            // Prüfe Backup-Metadaten
            try {
                const metaContent = await this.readFile('_backup_info.json');
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
                    const content = await this.readFile(db.filename);
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

    async exportDatabaseToShare(dbName) {
        // Exportiert Datenbank und nutzt Android Share-Dialog
        if (!Capacitor.Plugins.Share) {
            console.warn('Share Plugin nicht verfügbar');
            return this.exportDatabase(dbName);
        }

        try {
            const db = this.databases.find(d => d.name === dbName);
            if (!db) {
                throw new Error(`Datenbank ${dbName} nicht gefunden`);
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

            // Schreibe temporäre Datei
            const filename = `${db.filename}`;
            await Capacitor.Plugins.Filesystem.writeFile({
                path: `Exports/${filename}`,
                data: JSON.stringify(dbData, null, 2),
                directory: Capacitor.Plugins.Filesystem.Directory.Cache,
                encoding: Capacitor.Plugins.Filesystem.Encoding.UTF8
            });

            // Hole URI für Share
            const uriResult = await Capacitor.Plugins.Filesystem.getUri({
                path: `Exports/${filename}`,
                directory: Capacitor.Plugins.Filesystem.Directory.Cache
            });

            // Teile via Android Share-Dialog
            await Capacitor.Plugins.Share.share({
                title: `${dbName} Export`,
                text: `Export von ${dbName} Datenbank`,
                url: uriResult.uri,
                dialogTitle: `${dbName} teilen`
            });

            console.log(`✅ ${dbName} zum Teilen vorbereitet`);
            this.showSuccessMessage(`${dbName} exportiert`);

        } catch (error) {
            console.error('Export fehlgeschlagen:', error);
            this.showErrorMessage('Export fehlgeschlagen');
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

    disableBackup() {
        this.stopAutoBackup();
        console.log('❌ Backup deaktiviert');
        this.showSuccessMessage('Automatisches Backup wurde deaktiviert');
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
window.disableBackup = () => autoBackup?.disableBackup();

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

    // Versuche Android Share zu nutzen
    if (typeof Capacitor !== 'undefined' && Capacitor.Plugins.Share) {
        autoBackup.exportDatabaseToShare(dbName);
        return;
    }

    // Fallback: Browser-Download
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
