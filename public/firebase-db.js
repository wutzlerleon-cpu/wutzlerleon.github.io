(function() {
    console.log('[firebase-db.js] Script geladen');
    const FIREBASE_CONFIG = {
        apiKey: "AIzaSyBSi9-4SwNGbyw98df_sN_8dvzyQ8zFb9c",
        authDomain: "ergospiele-cc9d2.firebaseapp.com",
        projectId: "ergospiele-cc9d2",
        storageBucket: "ergospiele-cc9d2.firebasestorage.app",
        messagingSenderId: "474008996184",
        appId: "1:474008996184:web:5b5d40ecac440067d47d2d"
    };

    const FIREBASE_ENABLED = FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== '<YOUR_API_KEY>'
        && FIREBASE_CONFIG.projectId && FIREBASE_CONFIG.projectId !== '<YOUR_PROJECT_ID>'
        && FIREBASE_CONFIG.appId && FIREBASE_CONFIG.appId !== '<YOUR_APP_ID>';

    function normalizeId(name) {
        return String(name || '')
            .toLowerCase()
            .trim()
            .replace(/ä/g, 'ae')
            .replace(/ö/g, 'oe')
            .replace(/ü/g, 'ue')
            .replace(/ß/g, 'ss')
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_|_$/g, '') || null;
    }

    function getRemoteCollectionName(baseName) {
        return `ergotool_${baseName}`;
    }

    function patchDB() {
        const dbObject = window.DB;
        if (!dbObject) {
            console.warn('firebase-db.js: DB object not found, warte...');
            setTimeout(patchDB, 100);
            return;
        }

        const DB = dbObject;
        const original = {
            setConfig: DB.setConfig.bind(DB),
            setDiagnosen: DB.setDiagnosen.bind(DB),
            setSpiele: DB.setSpiele.bind(DB),
            getConfig: DB.getConfig.bind(DB),
            getDiagnosen: DB.getDiagnosen.bind(DB),
            getSpiele: DB.getSpiele.bind(DB)
        };

        DB.remoteEnabled = false;
        DB.remoteInitialized = false;
        DB.remoteUpdateCallbacks = [];
        DB.remoteStatus = 'disabled';

        DB.setRemoteStatus = function(status, message) {
            this.remoteStatus = status;
            console.info(`firebase-db.js status: ${status}${message ? ' - ' + message : ''}`);
            if (typeof window.setFirebaseStatus === 'function') {
                window.setFirebaseStatus(status, message);
            }
        };

        DB._normalizeDocId = normalizeId;
        DB._getConfigDoc = function() {
            return this.firestore.collection('ergotool').doc('config');
        };
        DB._getRemoteCollection = function(name) {
            return this.firestore.collection(getRemoteCollectionName(name));
        };

        DB.onRemoteUpdate = function(callback) {
            if (typeof callback === 'function') {
                this.remoteUpdateCallbacks.push(callback);
            }
        };

        DB._notifyRemoteUpdate = function() {
            this.remoteUpdateCallbacks.forEach(callback => {
                try {
                    callback();
                } catch (error) {
                    console.error('firebase-db.js callback error', error);
                }
            });
        };

        DB._applyRemoteState = function(remote) {
            if (!remote) {
                return;
            }

            if (remote.config && Array.isArray(remote.config.kriterien)) {
                original.setConfig(remote.config);
            }

            if (remote.diagnosen) {
                original.setDiagnosen(remote.diagnosen);
            }

            if (remote.spiele) {
                original.setSpiele(remote.spiele);
            }
        };

        DB._loadRemoteDataOnce = async function() {
            try {
                const configSnap = await this._getConfigDoc().get();
                const diagnosenSnap = await this._getRemoteCollection('diagnosen').get();
                const spieleSnap = await this._getRemoteCollection('spiele').get();

                const remote = {
                    config: configSnap.exists ? configSnap.data() : null,
                    diagnosen: diagnosenSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
                    spiele: spieleSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                };

                const hasRemoteData = configSnap.exists || remote.diagnosen.length > 0 || remote.spiele.length > 0;
                if (hasRemoteData) {
                    this._applyRemoteState(remote);
                    this._notifyRemoteUpdate();
                }
                return hasRemoteData;
            } catch (error) {
                console.warn('firebase-db.js: Fehler beim Laden der Remote-Daten', error);
                this.setRemoteStatus('error', error.message || 'Fehler beim Laden der Remote-Daten');
                return false;
            }
        };

        DB._writeRemoteConfig = async function(config) {
            try {
                await this._getConfigDoc().set(config || {});
                return true;
            } catch (error) {
                console.error('firebase-db.js: Fehler beim Schreiben der Remote-Konfiguration', error);
                this.setRemoteStatus('error', error.message || 'Fehler beim Schreiben der Remote-Konfiguration');
                return false;
            }
        };

        DB._writeRemoteEntries = async function(collectionName, entries) {
            try {
                const collection = this._getRemoteCollection(collectionName);
                const snapshot = await collection.get();
                const batch = this.firestore.batch();

                const ids = entries.map(entry => this._normalizeDocId(entry.name) || `${Math.random().toString(36).slice(2, 10)}_${Date.now()}`);
                entries.forEach((entry, index) => {
                    const id = ids[index];
                    const docRef = collection.doc(id);
                    const data = { ...entry };
                    delete data.id;
                    batch.set(docRef, data);
                });

                snapshot.docs.forEach(doc => {
                    if (!ids.includes(doc.id)) {
                        batch.delete(doc.ref);
                    }
                });

                await batch.commit();
                console.info(`firebase-db.js: Remote-Collection ${collectionName} geschrieben (${entries.length} Einträge)`);
                return true;
            } catch (error) {
                console.error(`firebase-db.js: Fehler beim Schreiben der Remote-Collection ${collectionName}`, error);
                this.setRemoteStatus('error', error.message || (`Fehler beim Schreiben der Remote-Collection ${collectionName}`));
                return false;
            }
        };

        DB._startRemoteListeners = function() {
            if (!this.remoteEnabled) {
                return;
            }

            this._getConfigDoc().onSnapshot(snapshot => {
                if (!snapshot.exists) {
                    return;
                }
                original.setConfig(snapshot.data());
                this._notifyRemoteUpdate();
            });

            this._getRemoteCollection('diagnosen').onSnapshot(snapshot => {
                const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                original.setDiagnosen(entries);
                this._notifyRemoteUpdate();
            });

            this._getRemoteCollection('spiele').onSnapshot(snapshot => {
                const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                original.setSpiele(entries);
                this._notifyRemoteUpdate();
            });
        };

        DB.initRemote = async function() {
            if (this.remoteInitialized) {
                return;
            }
            this.remoteInitialized = true;

            // Warte auf Firebase SDK
            let retries = 0;
            while (!window.firebase && retries < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                retries++;
            }

            if (!window.firebase) {
                console.error('firebase-db.js: Firebase SDK nicht geladen');
                this.setRemoteStatus('error', 'Firebase SDK konnte nicht geladen werden.');
                return;
            }

            if (!FIREBASE_ENABLED) {
                console.info('firebase-db.js: Firebase-Konfiguration nicht gesetzt. Verwende lokalen Speicher.');
                this.setRemoteStatus('disabled', 'Firebase-Konfiguration fehlt oder ist unvollständig.');
                return;
            }

            try {
                firebase.initializeApp(FIREBASE_CONFIG);
                this.firestore = firebase.firestore();
                this.remoteEnabled = true;

                const hasRemoteData = await this._loadRemoteDataOnce();
                if (!hasRemoteData) {
                    const configWritten = await this._writeRemoteConfig(original.getConfig());
                    const diagnosenWritten = await this._writeRemoteEntries('diagnosen', original.getDiagnosen());
                    const spieleWritten = await this._writeRemoteEntries('spiele', original.getSpiele());
                    console.info(`firebase-db.js: Lokal hochgeladen: config=${configWritten}, diagnosen=${diagnosenWritten}, spiele=${spieleWritten}`);
                }

                this._startRemoteListeners();
                this.setRemoteStatus('connected', 'Firebase verbunden.');
                console.info('firebase-db.js: Firebase-Synchronisierung aktiviert');
            } catch (error) {
                console.error('firebase-db.js: Firebase initialisieren fehlgeschlagen', error);
                this.remoteEnabled = false;
                this.setRemoteStatus('error', error.message || 'Firebase initialisieren fehlgeschlagen');
            }
        };

        DB.setConfig = function(config) {
            original.setConfig(config);
            if (this.remoteEnabled) {
                this._writeRemoteConfig(config).then(success => {
                    if (!success) {
                        this.setRemoteStatus('error', 'Konfigurationsdaten konnten nicht in Firebase geschrieben werden.');
                    }
                }).catch(error => {
                    console.error('firebase-db.js: setConfig write failed', error);
                    this.setRemoteStatus('error', error.message || 'Fehler beim Schreiben der Konfigurationsdaten');
                });
            }
        };

        DB.setDiagnosen = function(entries) {
            original.setDiagnosen(entries);
            if (this.remoteEnabled) {
                this._writeRemoteEntries('diagnosen', entries).then(success => {
                    if (!success) {
                        this.setRemoteStatus('error', 'Diagnosen konnten nicht in Firebase geschrieben werden.');
                    }
                }).catch(error => {
                    console.error('firebase-db.js: setDiagnosen write failed', error);
                    this.setRemoteStatus('error', error.message || 'Fehler beim Schreiben von Diagnosen');
                });
            }
        };

        DB.setSpiele = function(entries) {
            original.setSpiele(entries);
            if (this.remoteEnabled) {
                this._writeRemoteEntries('spiele', entries).then(success => {
                    if (!success) {
                        this.setRemoteStatus('error', 'Spiele konnten nicht in Firebase geschrieben werden.');
                    }
                }).catch(error => {
                    console.error('firebase-db.js: setSpiele write failed', error);
                    this.setRemoteStatus('error', error.message || 'Fehler beim Schreiben von Spielen');
                });
            }
        };
    }

    patchDB();
})();
