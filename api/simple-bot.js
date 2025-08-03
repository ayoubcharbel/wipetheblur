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
                    messages: 0,
                    stickers: 0,
                    total: 0
                };
            }
            
            // Handle commands
            if (msg.text && msg.text.startsWith('/')) {
                if (msg.text === '/start') {
                    await bot.sendMessage(chatId, '🤖 Simple Bot is working!\n\nCommands:\n/status - View stats\n/top - View leaderboard');
                    return res.json({ status: 'ok' });
                }
                
                if (msg.text === '/status') {
                    const users = Object.values(data.users);
                    await bot.sendMessage(chatId, `📊 Bot Stats:\n👥 Users: ${users.length}\n💬 Messages: ${data.totalMessages}\n🎭 Stickers: ${data.totalStickers}\n📈 Total: ${data.totalMessages + data.totalStickers}`);
                    return res.json({ status: 'ok' });
                }
                
                if (msg.text === '/top') {
                    const users = Object.values(data.users);
                    let leaderboard = '🏆 Top Users:\n\n';
                    
                    if (users.length === 0) {
                        leaderboard += 'No users yet! Send a message to get started!';
                    } else {
                        users.sort((a, b) => b.total - a.total)
                             .slice(0, 5)
                             .forEach((user, index) => {
                                 const rank = index + 1;
                                 const trophy = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
                                 leaderboard += `${trophy} ${user.firstName}: ${user.total} points\n`;
                             });
                    }
                    
                    await bot.sendMessage(chatId, leaderboard);
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