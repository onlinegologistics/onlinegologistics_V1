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

let sock = null;
let connected = false;
let qrDataUrl = null;

const startWhatsApp = async () => {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);

    sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            qrDataUrl = await QRCode.toDataURL(qr);
        }

        if (connection === 'open') {
            connected = true;
            qrDataUrl = null;
        }

        if (connection === 'close') {
            connected = false;

            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const loggedOut = statusCode === DisconnectReason.loggedOut;

            if (loggedOut) {
                fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
            }

            startWhatsApp();
        }
    });
};

const getWhatsAppStatus = () => ({
    connected,
    qr: qrDataUrl,
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
    getWhatsAppStatus,
    sendWhatsAppMessage,
};
