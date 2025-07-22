const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const { body, validationResult } = require('express-validator');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const fileUpload = require('express-fileupload');
const axios = require('axios');
const mime = require('mime-types');
const fs = require('fs');
const path = require('path');

class WhatsAppBot {
    constructor(botId, config = {}) {
        this.botId = botId;
        this.config = {
            port: config.port || (8000 + parseInt(botId)),
            webhookUrl: config.webhookUrl || null,
            sessionPath: config.sessionPath || `./sessions/bot_${botId}`,
            ...config
        };
        
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIO(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
        this.client = null;
        this.isReady = false;
        this.qrCode = null;
        this.status = 'disconnected';
        
        this.setupExpress();
        this.setupRoutes();
        this.setupSocketIO();
    }

    setupExpress() {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(fileUpload({ debug: false }));
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            next();
        });
    }

    setupRoutes() {
        // Rota de status
        this.app.get('/status', (req, res) => {
            res.json({
                botId: this.botId,
                status: this.status,
                isReady: this.isReady,
                qrCode: this.qrCode
            });
        });

        // Rota para enviar mensagem
        this.app.post('/send-message', [
            body('number').notEmpty(),
            body('message').notEmpty(),
        ], async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({
                    status: false,
                    message: 'Dados inválidos',
                    errors: errors.array()
                });
            }

            try {
                const { number, message } = req.body;
                const formattedNumber = this.formatNumber(number);
                
                if (!this.isReady) {
                    return res.status(400).json({
                        status: false,
                        message: 'Bot não está conectado'
                    });
                }

                const response = await this.client.sendMessage(formattedNumber, message);
                
                // Enviar para webhook se configurado
                if (this.config.webhookUrl) {
                    this.sendToWebhook({
                        type: 'message_sent',
                        botId: this.botId,
                        to: number,
                        message: message,
                        timestamp: new Date().toISOString()
                    });
                }

                res.json({
                    status: true,
                    message: 'Mensagem enviada com sucesso',
                    response: response
                });
            } catch (error) {
                console.error('Erro ao enviar mensagem:', error);
                res.status(500).json({
                    status: false,
                    message: 'Erro ao enviar mensagem',
                    error: error.message
                });
            }
        });

        // Rota para enviar mídia
        this.app.post('/send-media', [
            body('number').notEmpty(),
            body('mediaUrl').notEmpty(),
        ], async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({
                    status: false,
                    message: 'Dados inválidos',
                    errors: errors.array()
                });
            }

            try {
                const { number, mediaUrl, caption = '' } = req.body;
                const formattedNumber = this.formatNumber(number);
                
                if (!this.isReady) {
                    return res.status(400).json({
                        status: false,
                        message: 'Bot não está conectado'
                    });
                }

                const media = await MessageMedia.fromUrl(mediaUrl);
                const response = await this.client.sendMessage(formattedNumber, media, { caption });

                res.json({
                    status: true,
                    message: 'Mídia enviada com sucesso',
                    response: response
                });
            } catch (error) {
                console.error('Erro ao enviar mídia:', error);
                res.status(500).json({
                    status: false,
                    message: 'Erro ao enviar mídia',
                    error: error.message
                });
            }
        });

        // Rota para obter QR Code
        this.app.get('/qr', (req, res) => {
            if (this.qrCode) {
                res.json({
                    status: true,
                    qrCode: this.qrCode
                });
            } else {
                res.json({
                    status: false,
                    message: 'QR Code não disponível'
                });
            }
        });
    }

    setupSocketIO() {
        this.io.on('connection', (socket) => {
            console.log(`Cliente conectado ao bot ${this.botId}`);
            
            socket.emit('status', {
                botId: this.botId,
                status: this.status,
                isReady: this.isReady
            });

            if (this.qrCode) {
                socket.emit('qr', this.qrCode);
            }
        });
    }

    formatNumber(number) {
        // Remove caracteres não numéricos
        const cleanNumber = number.replace(/\D/g, '');
        
        // Lógica para números brasileiros
        if (cleanNumber.startsWith('55')) {
            const ddd = cleanNumber.substr(2, 2);
            const phoneNumber = cleanNumber.substr(4);
            
            // Para DDDs <= 30, adiciona o 9
            if (parseInt(ddd) <= 30 && phoneNumber.length === 8) {
                return `55${ddd}9${phoneNumber}@c.us`;
            }
            return `${cleanNumber}@c.us`;
        }
        
        return `${cleanNumber}@c.us`;
    }

    async sendToWebhook(data) {
        if (!this.config.webhookUrl) return;
        
        try {
            await axios.post(this.config.webhookUrl, data, {
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Erro ao enviar webhook:', error.message);
        }
    }

    async initialize() {
        try {
            // Criar diretório de sessão se não existir
            const sessionDir = path.dirname(this.config.sessionPath);
            if (!fs.existsSync(sessionDir)) {
                fs.mkdirSync(sessionDir, { recursive: true });
            }

            this.client = new Client({
                authStrategy: new LocalAuth({ 
                    clientId: `bot_${this.botId}`,
                    dataPath: sessionDir
                }),
                puppeteer: { 
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-zygote',
                        '--single-process',
                        '--disable-gpu'
                    ] 
                }
            });

            this.setupClientEvents();
            await this.client.initialize();
            
            console.log(`Bot ${this.botId} inicializado`);
        } catch (error) {
            console.error(`Erro ao inicializar bot ${this.botId}:`, error);
            this.status = 'error';
        }
    }

    setupClientEvents() {
        this.client.on('qr', (qr) => {
            console.log(`QR Code recebido para bot ${this.botId}`);
            qrcode.toDataURL(qr, (err, url) => {
                if (!err) {
                    this.qrCode = url;
                    this.status = 'qr_ready';
                    this.io.emit('qr', url);
                    this.io.emit('status', { status: this.status, message: 'QR Code gerado' });
                }
            });
        });

        this.client.on('ready', () => {
            console.log(`Bot ${this.botId} está pronto!`);
            this.isReady = true;
            this.status = 'ready';
            this.qrCode = null;
            this.io.emit('ready', { botId: this.botId, message: 'Bot conectado e pronto!' });
            this.io.emit('status', { status: this.status, message: 'Bot conectado' });
        });

        this.client.on('authenticated', () => {
            console.log(`Bot ${this.botId} autenticado`);
            this.status = 'authenticated';
            this.io.emit('authenticated', { botId: this.botId, message: 'Bot autenticado!' });
        });

        this.client.on('auth_failure', () => {
            console.error(`Falha na autenticação do bot ${this.botId}`);
            this.status = 'auth_failure';
            this.isReady = false;
            this.io.emit('auth_failure', { botId: this.botId, message: 'Falha na autenticação' });
        });

        this.client.on('disconnected', (reason) => {
            console.log(`Bot ${this.botId} desconectado:`, reason);
            this.status = 'disconnected';
            this.isReady = false;
            this.qrCode = null;
            this.io.emit('disconnected', { botId: this.botId, reason, message: 'Bot desconectado' });
        });

        this.client.on('message', async (message) => {
            // Processar mensagens recebidas
            const messageData = {
                type: 'message_received',
                botId: this.botId,
                from: message.from,
                to: message.to,
                body: message.body,
                timestamp: new Date(message.timestamp * 1000).toISOString(),
                isGroup: message.from.includes('@g.us'),
                messageType: message.type
            };

            // Enviar para webhook se configurado
            if (this.config.webhookUrl) {
                this.sendToWebhook(messageData);
            }

            // Emitir via socket
            this.io.emit('message', messageData);
        });
    }

    async start() {
        return new Promise((resolve, reject) => {
            this.server.listen(this.config.port, '0.0.0.0', (error) => {
                if (error) {
                    reject(error);
                } else {
                    console.log(`Bot ${this.botId} rodando na porta ${this.config.port}`);
                    resolve();
                }
            });
        });
    }

    async stop() {
        try {
            if (this.client) {
                await this.client.destroy();
            }
            this.server.close();
            this.isReady = false;
            this.status = 'stopped';
            console.log(`Bot ${this.botId} parado`);
        } catch (error) {
            console.error(`Erro ao parar bot ${this.botId}:`, error);
        }
    }

    getStatus() {
        return {
            botId: this.botId,
            status: this.status,
            isReady: this.isReady,
            qrCode: this.qrCode,
            port: this.config.port
        };
    }
}

// Se executado diretamente
if (require.main === module) {
    const botId = process.argv[2] || '1';
    const port = process.argv[3] || (8000 + parseInt(botId));
    const webhookUrl = process.argv[4] || null;

    const bot = new WhatsAppBot(botId, { port, webhookUrl });
    
    bot.initialize().then(() => {
        return bot.start();
    }).catch((error) => {
        console.error('Erro ao iniciar bot:', error);
        process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('Parando bot...');
        await bot.stop();
        process.exit(0);
    });
}

module.exports = WhatsAppBot;

