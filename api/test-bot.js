// Test bot functionality
module.exports = async function handler(req, res) {
    const TelegramBot = require('node-telegram-bot-api');
    
    const BOT_TOKEN = process.env.BOT_TOKEN;
    
    if (!BOT_TOKEN) {
        return res.json({
            error: 'BOT_TOKEN environment variable is not set',
            token_preview: 'undefined'
        });
    }
    
    try {
        const bot = new TelegramBot(BOT_TOKEN, { polling: false });
        
        // Test bot info
        const botInfo = await bot.getMe();
        
        return res.json({
            success: true,
            bot_token_set: !!BOT_TOKEN,
            bot_token_preview: BOT_TOKEN.substring(0, 10) + '...',
            bot_info: botInfo,
            bot_username: botInfo.username,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return res.json({
            error: 'Bot initialization failed',
            message: error.message,
            bot_token_set: !!BOT_TOKEN,
            bot_token_preview: BOT_TOKEN ? BOT_TOKEN.substring(0, 10) + '...' : 'undefined'
        });
    }
};