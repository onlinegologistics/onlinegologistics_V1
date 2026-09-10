const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const pino = require('pino');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
} = require('@whiskeysockets/baileys');

const AUTH_FOLDER = path.join(__dirname, '..', 'wa-auth');
const STARTUP_TIMEOUT_MS = Number(process.env.WHATSAPP_STARTUP_TIMEOUT_MS) || 30000;
const RECONNECT_DELAY_MS = 5000;

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
            fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
        }
    } catch (error) {
        console.warn('Could not remove auth folder cleanly:', errorMessage(error));
    }
    try {
        if (!fs.existsSync(AUTH_FOLDER)) {
            fs.mkdirSync(AUTH_FOLDER, { recursive: true });
        }
    } catch (error) {
        console.error('Could not create auth folder:', errorMessage(error));
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
        currentSocket = makeWASocket({
            auth: state,
            logger: pino({ level: 'silent' }),
        });
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
                const loggedOut = statusCode === DisconnectReason.loggedOut;
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
                scheduleReconnect(false);
            });
            return;
        }

        updateStatus(
            'error',
            'WhatsApp QR code could not be generated. Check the VPS internet connection and try again.'
        );
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
        await startWhatsApp({ resetAuth: false });
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
        await startWhatsApp({ resetAuth: false });
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
