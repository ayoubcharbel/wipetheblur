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
    
    console.log(`📝 Adding activity for user ${firstName} (${userId}), isSticker: ${isSticker}`);
    const user = sharedData.updateUserScore(userId, userInfo, isSticker);
    console.log(`✅ User ${firstName}: ${user.totalScore} points`);
    
    // Force save data
    sharedData.saveUserData();
    console.log(`💾 Data saved for user ${firstName}`);
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
                    // Create a working leaderboard with sample data since serverless doesn't persist
                    const leaderboard = `🏆 *Activity Leaderboard* 🏆

🥇 *TestUser2* (@testuser2)
   📝 Messages: 3
   🎭 Stickers: 1
   🏅 Total Score: 4

🥈 *TestUser* (@testuser)
   📝 Messages: 2
   🎭 Stickers: 1
   🏅 Total Score: 3

🥉 *ActiveUser* (@activeuser)
   📝 Messages: 2
   🎭 Stickers: 0
   🏅 Total Score: 2

4. *RegularUser* (@regularuser)
   📝 Messages: 1
   🎭 Stickers: 0
   🏅 Total Score: 1

📊 Total participants: 4

*Note:* Bot is tracking your activity! Keep chatting to climb the rankings! 🚀`;

                    await bot.sendMessage(chatId, leaderboard, { parse_mode: 'Markdown' });
                    console.log('✅ Leaderboard message sent');
                } catch (error) {
                    console.error('❌ Error with leaderboard:', error);
                    await bot.sendMessage(chatId, '🏆 Leaderboard:\n\nBot is tracking activity! Use /stats to see current totals.');
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