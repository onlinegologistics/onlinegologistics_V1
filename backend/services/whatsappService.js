const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const pino = require('pino');
const baileys = require('@whiskeysockets/baileys');
const makeWASocket = baileys.default || baileys;
const {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    Browsers,
} = baileys;

const AUTH_FOLDER = path.join(__dirname, '..', 'wa-auth');
const STARTUP_TIMEOUT_MS = Number(process.env.WHATSAPP_STARTUP_TIMEOUT_MS) || 45000;
const RECONNECT_DELAY_MS = 3000;

let sock = null;
let connected = false;
let qrDataUrl = null;
let connectionState = 'idle';
let statusMessage = 'WhatsApp has not started yet';
let lastError = null;
let updatedAt = new Date().toISOString();
let startupTimer = null;
let reconnectTimer = null;
let sessionGeneration = 0;
let staleSessionResetAttempted = false;

const updateStatus = (state, message, error = null) => {
    connectionState = state;
    statusMessage = message;
    lastError = error;
    updatedAt = new Date().toISOString();
};

const clearTimers = () => {
    if (startupTimer) {
        clearTimeout(startupTimer);
        startupTimer = null;
    }
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
};

const errorMessage = (error) => error?.message || String(error || 'Unknown WhatsApp error');

const clearAuthFolder = () => {
    try {
        if (fs.existsSync(AUTH_FOLDER)) {
            // Delete folder contents instead of the directory itself (safe for Docker volume mounts)
            const files = fs.readdirSync(AUTH_FOLDER);
            for (const file of files) {
                const fullPath = path.join(AUTH_FOLDER, file);
                try {
                    fs.rmSync(fullPath, { recursive: true, force: true });
                } catch (fileErr) {
                    console.warn(`Could not remove ${fullPath}:`, errorMessage(fileErr));
                }
            }
        } else {
            fs.mkdirSync(AUTH_FOLDER, { recursive: true });
        }
    } catch (error) {
        console.warn('Could not clean auth folder:', errorMessage(error));
    }
};

const scheduleReconnect = (resetAuth = false) => {
    if (reconnectTimer) return;

    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        startWhatsApp({ resetAuth }).catch((error) => {
            const message = errorMessage(error);
            console.error('WhatsApp reconnect failed:', message);
            updateStatus('error', 'WhatsApp reconnect failed', message);
            scheduleReconnect(resetAuth);
        });
    }, RECONNECT_DELAY_MS);
};

const startWhatsApp = async ({ resetAuth = false } = {}) => {
    const generation = ++sessionGeneration;
    clearTimers();

    const previousSocket = sock;
    sock = null;
    connected = false;
    qrDataUrl = null;

    if (previousSocket) {
        try {
            previousSocket.end(new Error('Restarting WhatsApp connection'));
        } catch (error) {
            // The previous socket may already be closed.
        }
    }

    if (resetAuth) {
        clearAuthFolder();
    } else {
        if (!fs.existsSync(AUTH_FOLDER)) {
            fs.mkdirSync(AUTH_FOLDER, { recursive: true });
        }
    }

    updateStatus('starting', resetAuth
        ? 'Generating a new WhatsApp QR code'
        : 'Connecting to WhatsApp');

    let state;
    let saveCreds;
    let currentSocket;

    try {
        ({ state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER));

        let version;
        try {
            if (typeof fetchLatestBaileysVersion === 'function') {
                const versionData = await Promise.race([
                    fetchLatestBaileysVersion(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Baileys version fetch timeout')), 4000)),
                ]);
                version = versionData?.version;
            }
        } catch (vErr) {
            console.warn('Could not fetch latest Baileys version (using bundled default):', vErr.message);
        }

        const logLevel = process.env.WHATSAPP_LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'warn' : 'warn');
        const socketOptions = {
            auth: {
                creds: state.creds,
                keys: typeof makeCacheableSignalKeyStore === 'function'
                    ? makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
                    : state.keys,
            },
            logger: pino({ level: logLevel }),
            printQRInTerminal: false,
            syncFullHistory: false,
            generateHighQualityLinkPreview: false,
            defaultQueryTimeoutMs: 60000,
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 25000,
            retryRequestDelayMs: 250,
        };

        if (version) {
            socketOptions.version = version;
        }

        if (typeof Browsers !== 'undefined' && Browsers.ubuntu) {
            socketOptions.browser = Browsers.ubuntu('Chrome');
        } else {
            socketOptions.browser = ['Ubuntu', 'Chrome', '20.0.04'];
        }

        currentSocket = makeWASocket(socketOptions);
    } catch (error) {
        const message = errorMessage(error);
        updateStatus('error', 'WhatsApp could not be started', message);
        throw error;
    }

    const hasSavedSession = Boolean(state.creds?.registered);
    sock = currentSocket;
    currentSocket.ev.on('creds.update', () => {
        if (generation !== sessionGeneration) return;
        saveCreds().catch((error) => {
            const message = errorMessage(error);
            console.error('WhatsApp credentials could not be saved:', message);
            updateStatus('error', 'WhatsApp session could not be saved', message);
        });
    });

    currentSocket.ev.on('connection.update', async (update) => {
        if (generation !== sessionGeneration) return;

        try {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                if (startupTimer) {
                    clearTimeout(startupTimer);
                    startupTimer = null;
                }
                qrDataUrl = await QRCode.toDataURL(qr);
                if (generation !== sessionGeneration) return;
                updateStatus('qr', 'Scan the QR code to connect WhatsApp');
            }

            if (connection === 'open') {
                if (startupTimer) {
                    clearTimeout(startupTimer);
                    startupTimer = null;
                }
                connected = true;
                qrDataUrl = null;
                staleSessionResetAttempted = false;
                updateStatus('connected', 'WhatsApp is connected');
            }

            if (connection === 'close') {
                if (startupTimer) {
                    clearTimeout(startupTimer);
                    startupTimer = null;
                }

                connected = false;
                qrDataUrl = null;
                sock = null;

                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const loggedOut = statusCode === DisconnectReason.loggedOut || statusCode === 401 || statusCode === 403;
                const message = errorMessage(lastDisconnect?.error);

                if (loggedOut) {
                    clearAuthFolder();
                    updateStatus('reconnecting', 'Previous WhatsApp session expired; generating a new QR code');
                    scheduleReconnect(true);
                } else {
                    console.error(`WhatsApp connection closed${statusCode ? ` (${statusCode})` : ''}:`, message);
                    updateStatus('reconnecting', 'WhatsApp connection closed; retrying', message);
                    scheduleReconnect(false);
                }
            }
        } catch (error) {
            const message = errorMessage(error);
            console.error('WhatsApp connection update failed:', message);
            updateStatus('error', 'WhatsApp connection failed', message);
            scheduleReconnect(false);
        }
    });

    startupTimer = setTimeout(() => {
        if (generation !== sessionGeneration || connected || qrDataUrl) return;

        if (hasSavedSession && !staleSessionResetAttempted) {
            staleSessionResetAttempted = true;
            console.warn('WhatsApp saved session is stale; generating a new QR code');
            startWhatsApp({ resetAuth: true }).catch((error) => {
                const message = errorMessage(error);
                console.error('WhatsApp stale-session recovery failed:', message);
                updateStatus('error', 'Could not generate a new WhatsApp QR code', message);
            });
            return;
        }

        // Timeout reached without QR code or connection: stop looping, report error
        console.warn('WhatsApp QR startup timed out without connection or QR');
        updateStatus(
            'error',
            'WhatsApp QR code generate hone mein timeout ho gaya. Kripya "Generate New QR" button par click karein ya VPS connection check karein.'
        );

        if (sock) {
            try {
                sock.end(new Error('Startup timeout'));
            } catch (e) {}
            sock = null;
        }
    }, STARTUP_TIMEOUT_MS);
};

const restartWhatsApp = async () => {
    staleSessionResetAttempted = true;
    sessionGeneration++;
    clearTimers();

    const previousSocket = sock;
    sock = null;
    connected = false;
    qrDataUrl = null;

    if (previousSocket) {
        try {
            previousSocket.end(new Error('Restarting WhatsApp connection'));
        } catch (e) {}
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
    clearAuthFolder();

    try {
        await startWhatsApp({ resetAuth: true });
    } catch (error) {
        console.error('Error starting WhatsApp on restart:', errorMessage(error));
    }

    return getWhatsAppStatus();
};

const logoutWhatsApp = async () => {
    staleSessionResetAttempted = true;
    sessionGeneration++;
    clearTimers();

    const previousSocket = sock;
    sock = null;
    connected = false;
    qrDataUrl = null;

    if (previousSocket) {
        try {
            await Promise.race([
                previousSocket.logout().catch(() => {}),
                new Promise((resolve) => setTimeout(resolve, 2000)),
            ]);
        } catch (e) {}

        try {
            previousSocket.end(new Error('Logged out by user'));
        } catch (e) {}
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
    clearAuthFolder();

    updateStatus('starting', 'WhatsApp logged out. Generating a new QR code...');

    try {
        await startWhatsApp({ resetAuth: true });
    } catch (error) {
        console.error('Error restarting WhatsApp after logout:', errorMessage(error));
    }

    return getWhatsAppStatus();
};

const getWhatsAppStatus = () => ({
    connected,
    qr: qrDataUrl,
    state: connectionState,
    message: statusMessage,
    error: lastError,
    updatedAt,
});

const normalizePhone = (phone) => {
    let digits = String(phone || '').replace(/\D/g, '');

    if (digits.length === 10) {
        digits = `91${digits}`;
    }

    return `${digits}@s.whatsapp.net`;
};

const sendWhatsAppMessage = async (phone, text) => {
    if (!sock || !connected) {
        throw new Error('WhatsApp is not connected');
    }

    const jid = normalizePhone(phone);
    return sock.sendMessage(jid, { text });
};

module.exports = {
    startWhatsApp,
    restartWhatsApp,
    logoutWhatsApp,
    getWhatsAppStatus,
    sendWhatsAppMessage,
};
