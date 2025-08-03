const TelegramBot = require('node-telegram-bot-api');

// Bot configuration
const BOT_TOKEN = process.env.BOT_TOKEN || '8278016198:AAE5lKbas5dM8qMPM3M_o6X_h6g3W76sTzU';

// Initialize bot (webhook mode)
const bot = new TelegramBot(BOT_TOKEN, { polling: false });

export default async function handler(req, res) {
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
        // Clear any existing webhook first
        console.log('🔧 Clearing existing webhook...');
        await bot.deleteWebHook();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        // Set new webhook with current domain URL
        const webhookUrl = `https://www.wipetheblur.com/api/telegram-webhook`;
        console.log('🔧 Setting webhook to:', webhookUrl);
        
        const result = await bot.setWebHook(webhookUrl, {
            drop_pending_updates: true // Clear any pending messages
        });
        console.log('✅ Webhook setup result:', result);
        
        // Verify webhook was set
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        const webhookInfo = await bot.getWebHookInfo();
        console.log('📋 Webhook info:', webhookInfo);
        
        return res.json({
            success: true,
            message: 'Webhook configured successfully with API endpoint!',
            webhookUrl,
            result,
            webhookInfo,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Webhook setup failed:', error);
        return res.json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}