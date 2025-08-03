const TelegramBot = require('node-telegram-bot-api');

module.exports = async function handler(req, res) {
    const BOT_TOKEN = process.env.BOT_TOKEN;
    
    if (!BOT_TOKEN) {
        return res.json({ error: 'BOT_TOKEN not set' });
    }
    
    if (req.method === 'GET') {
        return res.json({ message: 'Simple bot test endpoint', status: 'ready' });
    }
    
    if (req.method === 'POST') {
        try {
            const bot = new TelegramBot(BOT_TOKEN, { polling: false });
            const update = req.body;
            
            console.log('📨 Test bot received:', JSON.stringify(update, null, 2));
            
            if (update.message && update.message.text) {
                const chatId = update.message.chat.id;
                const text = update.message.text;
                
                if (text === '/test') {
                    console.log('🧪 Sending test message to chatId:', chatId);
                    
                    try {
                        const result = await bot.sendMessage(chatId, '🤖 TEST BOT WORKS! This message confirms the bot can send replies to Telegram.');
                        console.log('✅ Test message sent successfully:', result.message_id);
                        
                        return res.json({ 
                            success: true, 
                            message: 'Test message sent!',
                            chatId: chatId,
                            messageId: result.message_id
                        });
                    } catch (sendError) {
                        console.error('❌ Failed to send test message:', sendError);
                        return res.json({ 
                            error: 'Failed to send message',
                            details: sendError.message,
                            chatId: chatId
                        });
                    }
                }
            }
            
            return res.json({ status: 'ok', message: 'Update processed' });
        } catch (error) {
            console.error('❌ Test bot error:', error);
            return res.json({ error: error.message });
        }
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
};