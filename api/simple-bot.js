const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = process.env.BOT_TOKEN;
const DATA_FILE = '/tmp/bot-data.json';

// Load data
function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
            return data;
        }
    } catch (error) {
        console.log('No existing data, starting fresh');
    }
    return { users: {}, totalMessages: 0, totalStickers: 0 };
}

// Save data
function saveData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Failed to save data:', error);
    }
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    const bot = new TelegramBot(BOT_TOKEN, { polling: false });
    
    // Handle GET requests (bot status)
    if (req.method === 'GET') {
        const data = loadData();
        const users = Object.values(data.users);
        
        return res.json({
            status: 'Bot is running!',
            totalUsers: users.length,
            totalMessages: data.totalMessages,
            totalStickers: data.totalStickers,
            totalActivity: data.totalMessages + data.totalStickers,
            users: users,
            timestamp: new Date().toISOString()
        });
    }
    
    // Handle POST requests (webhook)
    if (req.method === 'POST') {
        try {
            const update = req.body;
            if (!update.message || !update.message.from || update.message.from.is_bot) {
                return res.json({ status: 'ok' });
            }
            
            const msg = update.message;
            const chatId = msg.chat.id;
            const userId = msg.from.id;
            const firstName = msg.from.first_name || 'User';
            
            const data = loadData();
            
            // Initialize user if new
            if (!data.users[userId]) {
                data.users[userId] = {
                    id: userId,
                    firstName: firstName,
                    username: msg.from.username || '',
                    messages: 0,
                    stickers: 0,
                    total: 0
                };
            } else {
                // Update user info
                data.users[userId].firstName = firstName;
                data.users[userId].username = msg.from.username || '';
            }
            
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
                    return res.json({ status: 'ok' });
                }
                
                if (msg.text === '/stats') {
                    const users = Object.values(data.users);
                    await bot.sendMessage(chatId, `📊 Statistics:\n👥 Users: ${users.length}\n💬 Messages: ${data.totalMessages}\n🎭 Stickers: ${data.totalStickers}\n📈 Total: ${data.totalMessages + data.totalStickers}`);
                    return res.json({ status: 'ok' });
                }
                
                if (msg.text === '/leaderboard') {
                    const users = Object.values(data.users);
                    let leaderboard = '🏆 *Activity Leaderboard* 🏆\n\n';
                    
                    if (users.length === 0) {
                        leaderboard = 'No activity data available yet! Start chatting to build the leaderboard! 🚀';
                    } else {
                        users.sort((a, b) => b.total - a.total)
                             .slice(0, 10)
                             .forEach((user, index) => {
                                 const rank = index + 1;
                                 const trophy = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
                                 const name = user.firstName;
                                 const username = user.username ? `(@${user.username})` : '';
                                 
                                 leaderboard += `${trophy} *${name}* ${username}\n`;
                                 leaderboard += `   📝 Messages: ${user.messages}\n`;
                                 leaderboard += `   🎭 Stickers: ${user.stickers}\n`;
                                 leaderboard += `   🏅 Total Score: ${user.total}\n\n`;
                             });
                        
                        leaderboard += `\n📊 Total participants: ${users.length}`;
                    }
                    
                    await bot.sendMessage(chatId, leaderboard, { parse_mode: 'Markdown' });
                    return res.json({ status: 'ok' });
                }
                
                if (msg.text === '/mystats') {
                    const user = data.users[userId];
                    if (!user) {
                        await bot.sendMessage(chatId, 'You haven\'t sent any messages or stickers yet! Start chatting to appear in the stats.');
                        return res.json({ status: 'ok' });
                    }
                    
                    const name = user.firstName;
                    const statsMessage = `📊 *Your Statistics* 📊

👤 Name: ${name}
${user.username ? `🔗 Username: @${user.username}\n` : ''}📝 Messages sent: ${user.messages}
🎭 Stickers sent: ${user.stickers}
🏅 Total score: ${user.total}

Keep chatting to improve your rank! 🚀`;
                    
                    await bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });
                    return res.json({ status: 'ok' });
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
                    return res.json({ status: 'ok' });
                }
            }
            
            // Track activity
            if (msg.sticker) {
                data.users[userId].stickers++;
                data.totalStickers++;
            } else if (msg.text && !msg.text.startsWith('/')) {
                data.users[userId].messages++;
                data.totalMessages++;
            }
            
            data.users[userId].total = data.users[userId].messages + data.users[userId].stickers;
            saveData(data);
            
            console.log(`✅ ${firstName}: ${data.users[userId].total} points`);
            return res.json({ status: 'ok' });
            
        } catch (error) {
            console.error('Error:', error);
            return res.json({ status: 'error', message: error.message });
        }
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
};