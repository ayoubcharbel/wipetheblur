const TelegramBot = require('node-telegram-bot-api');

// Bot configuration
const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
    throw new Error('BOT_TOKEN environment variable is required');
}

// Initialize bot (webhook mode)
const bot = new TelegramBot(BOT_TOKEN, { polling: false });

module.exports = async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    console.log('📋 Webhook status endpoint accessed:', {
        method: req.method,
        timestamp: new Date().toISOString()
    });
    
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const webhookInfo = await bot.getWebHookInfo();
        return res.json({
            webhook: webhookInfo,
            status: 'Webhook configured',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return res.json({
            error: error.message,
            status: 'Webhook error',
            timestamp: new Date().toISOString()
        });
    }
}