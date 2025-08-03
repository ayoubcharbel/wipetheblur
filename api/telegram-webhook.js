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
                // Set up bot commands menu
                await bot.setMyCommands([
                    { command: 'start', description: 'Start the bot and see welcome message' },
                    { command: 'stats', description: 'View activity statistics' },
                    { command: 'leaderboard', description: 'View user rankings' },
                    { command: 'mystats', description: 'View your personal statistics' },
                    { command: 'help', description: 'Show help information' }
                ]);
                
                await bot.sendMessage(chatId, '🤖 Bot is working!\n\nAvailable commands:\n/stats - View statistics\n/leaderboard - View leaderboard\n/mystats - Your personal stats\n/help - Help information\n\nTip: Type "/" to see all commands!');
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
                    const leaderboard = sharedData.generateLeaderboard();
                    await bot.sendMessage(chatId, leaderboard, { parse_mode: 'Markdown' });
                    console.log('✅ Leaderboard message sent');
                } catch (error) {
                    console.error('❌ Error with leaderboard:', error);
                    await bot.sendMessage(chatId, '🏆 Leaderboard:\n\nBot is tracking your activity! Send messages to build the leaderboard.');
                }
                return;
            }
            
            if (msg.text === '/mystats') {
                const userData = sharedData.getSharedUserData();
                const user = userData[userId];
                if (!user) {
                    await bot.sendMessage(chatId, 'You haven\'t sent any messages or stickers yet!');
                    return;
                }
                
                const name = user.firstName + (user.lastName ? ` ${user.lastName}` : '');
                const statsMessage = `📊 *Your Statistics* 📊

👤 Name: ${name}
${user.username ? `🔗 Username: @${user.username}\n` : ''}📝 Messages sent: ${user.messages}
🎭 Stickers sent: ${user.stickers}
🏅 Total score: ${user.totalScore}

Keep chatting to improve your rank! 🚀`;
                
                await bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });
                console.log('✅ Personal stats message sent');
                return;
            }
            
            if (msg.text === '/help') {
                const helpMessage = `🤖 *Activity Tracker Bot Help*

*What I do:*
I track every message and sticker you send in this chat and award points for activity.

*Scoring system:*
📝 Message = 1 point
🎭 Sticker = 1 point

*Available commands:*
/start - Welcome message and bot info
/leaderboard - View current rankings
/mystats - View your personal statistics
/stats - View total statistics
/help - Show this help message

*Note:* Your scores accumulate over time and never reset!

Happy chatting! 💬`;
                
                await bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
                console.log('✅ Help message sent');
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