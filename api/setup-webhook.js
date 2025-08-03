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
    
    console.log('🔧 Setup webhook endpoint accessed:', {
        method: req.method,
        timestamp: new Date().toISOString()
    });
    
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        console.log('🔑 Bot token available:', !!BOT_TOKEN);
        console.log('🔑 Bot token length:', BOT_TOKEN ? BOT_TOKEN.length : 0);
        
        // Clear any existing webhook first
        console.log('🔧 Clearing existing webhook...');
        await bot.deleteWebHook();
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        
        // Set new webhook with current domain URL
        const webhookUrl = `https://www.wipetheblur.com/api/telegram-webhook`;
        console.log('🔧 Setting webhook to:', webhookUrl);
        
        const result = await bot.setWebHook(webhookUrl, {
            drop_pending_updates: true, // Clear any pending messages
            allowed_updates: ['message'] // Only receive message updates
        });
        console.log('✅ Webhook setup result:', result);
        
        if (!result) {
            throw new Error('Failed to set webhook - bot.setWebHook returned false');
        }
        
        // Verify webhook was set
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
        const webhookInfo = await bot.getWebHookInfo();
        console.log('📋 Webhook info after setup:', webhookInfo);
        
        if (!webhookInfo.url) {
            throw new Error('Webhook URL is still empty after setup. Check bot token.');
        }
        
        return res.json({
            success: true,
            message: 'Webhook configured successfully with Render API endpoint!',
            webhookUrl,
            result,
            webhookInfo,
            actualUrl: webhookInfo.url,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Webhook setup failed:', error);
        
        // Try to get current webhook info for debugging
        try {
            const currentWebhook = await bot.getWebHookInfo();
            console.log('🔍 Current webhook info:', currentWebhook);
        } catch (debugError) {
            console.error('❌ Could not get webhook info for debugging:', debugError);
        }
        
        return res.json({
            success: false,
            error: error.message,
            botTokenAvailable: !!BOT_TOKEN,
            timestamp: new Date().toISOString()
        });
    }
}