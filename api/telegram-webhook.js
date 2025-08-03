const TelegramBot = require('node-telegram-bot-api');

// Simple in-memory storage
let users = {};
let totalMessages = 0;
let totalStickers = 0;

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
    console.error('BOT_TOKEN is required');
}

const bot = new TelegramBot(BOT_TOKEN, { polling: false });

function addUserActivity(userId, firstName, username, isSticker = false) {
    if (!users[userId]) {
        users[userId] = {
            id: userId,
            firstName: firstName,
            username: username,
            messages: 0,
            stickers: 0,
            total: 0
        };
    }
    
    if (isSticker) {
        users[userId].stickers++;
        totalStickers++;
    } else {
        users[userId].messages++;
        totalMessages++;
    }
    
    users[userId].total = users[userId].messages + users[userId].stickers;
    
    console.log(`✅ User ${firstName}: ${users[userId].total} points`);
}

function getStats() {
    const userList = Object.values(users);
    return {
        totalUsers: userList.length,
        totalMessages: totalMessages,
        totalStickers: totalStickers,
        totalActivity: totalMessages + totalStickers,
        users: userList
    };
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
                const stats = getStats();
                let leaderboard = '🏆 Leaderboard:\n\n';
                
                if (stats.users.length === 0) {
                    leaderboard += 'No users yet!';
                } else {
                    stats.users
                        .sort((a, b) => b.total - a.total)
                        .slice(0, 10)
                        .forEach((user, index) => {
                            const rank = index + 1;
                            const trophy = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
                            leaderboard += `${trophy} ${user.firstName}: ${user.total} points\n`;
                        });
                }
                
                await bot.sendMessage(chatId, leaderboard);
                console.log('✅ Leaderboard message sent');
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