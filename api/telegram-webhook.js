const TelegramBot = require('node-telegram-bot-api');
const sharedData = require('./_shared-data.js');

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
    console.error('BOT_TOKEN is required');
}

const bot = new TelegramBot(BOT_TOKEN, { polling: false });

function addUserActivity(userId, firstName, username, isSticker = false) {
    const userInfo = {
        id: userId,
        first_name: firstName,
        username: username || 'Unknown'
    };
    
    const user = sharedData.updateUserScore(userId, userInfo, isSticker);
    console.log(`✅ User ${firstName}: ${user.totalScore} points`);
}

function getStats() {
    return sharedData.getStats();
}

async function handleUpdate(update) {
    if (!update.message) return;
    
    const msg = update.message;
    if (!msg.from || msg.from.is_bot) return;
    
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const firstName = msg.from.first_name || 'User';
    const username = msg.from.username || '';
    
    console.log(`📨 Message from ${firstName}: ${msg.text || '[sticker]'}`);
    
    try {
        // Handle commands
        if (msg.text && msg.text.startsWith('/')) {
            if (msg.text === '/start') {
                await bot.sendMessage(chatId, '🤖 Bot is working!\n\nAvailable commands:\n/stats - View statistics\n/leaderboard - View leaderboard');
                console.log('✅ Start message sent');
                return;
            }
            
            if (msg.text === '/stats') {
                const stats = getStats();
                await bot.sendMessage(chatId, `📊 Statistics:\n👥 Users: ${stats.totalUsers}\n💬 Messages: ${stats.totalMessages}\n🎭 Stickers: ${stats.totalStickers}\n📈 Total: ${stats.totalActivity}`);
                console.log('✅ Stats message sent');
                return;
            }
            
            if (msg.text === '/leaderboard') {
                try {
                    console.log('🏆 Processing /leaderboard command...');
                    
                    // Load fresh data before generating leaderboard
                    sharedData.loadUserData();
                    const stats = sharedData.getStats();
                    console.log('📊 Current stats:', stats);
                    
                    if (stats.totalUsers === 0) {
                        await bot.sendMessage(chatId, '📊 No users found yet! Send some messages to build the leaderboard! 🚀');
                        console.log('✅ Empty leaderboard message sent');
                        return;
                    }
                    
                    const leaderboard = sharedData.generateLeaderboard();
                    console.log('📊 Generated leaderboard length:', leaderboard.length);
                    console.log('📊 First 200 chars:', leaderboard.substring(0, 200));
                    
                    // Try sending without markdown first
                    await bot.sendMessage(chatId, leaderboard);
                    console.log('✅ Leaderboard message sent successfully');
                } catch (error) {
                    console.error('❌ Error with leaderboard:', error);
                    console.error('❌ Error details:', error.message, error.stack);
                    try {
                        await bot.sendMessage(chatId, '❌ Error generating leaderboard. Trying simple version...');
                        await bot.sendMessage(chatId, '🏆 Leaderboard:\n\nBot is tracking activity but having display issues. Use /stats to see total counts.');
                    } catch (fallbackError) {
                        console.error('❌ Even fallback failed:', fallbackError);
                    }
                }
                return;
            }
        }
        
        // Track regular activity
        if (msg.sticker) {
            addUserActivity(userId, firstName, username, true);
        } else if (msg.text && !msg.text.startsWith('/')) {
            addUserActivity(userId, firstName, username, false);
        }
        
    } catch (error) {
        console.error('❌ Error handling message:', error.message);
    }
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'GET') {
        return res.json({
            message: 'Telegram webhook is ready',
            timestamp: new Date().toISOString()
        });
    }
    
    if (req.method === 'POST') {
        try {
            console.log('📨 Webhook received update');
            await handleUpdate(req.body);
            return res.json({ status: 'ok' });
        } catch (error) {
            console.error('❌ Webhook error:', error);
            return res.json({ status: 'error', message: error.message });
        }
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
};

// Export stats function
module.exports.getStats = getStats;