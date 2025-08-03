const TelegramBot = require('node-telegram-bot-api');

// In-memory storage that actually works
let userData = {};

// Fast user activity update - NO API CALLS
function updateUserActivity(userId, userInfo, isSticker = false) {
    try {
        // Initialize user if not exists
        if (!userData[userId]) {
            userData[userId] = {
                id: userId,
                firstName: userInfo.first_name || 'Unknown',
                lastName: userInfo.last_name || '',
                username: userInfo.username || 'No username',
                messageCount: 0,
                stickerCount: 0,
                totalScore: 0,
                firstSeen: new Date(),
                lastActivity: new Date()
            };
        }
        
        // Update activity
        if (isSticker) {
            userData[userId].stickerCount++;
        } else {
            userData[userId].messageCount++;
        }
        
        userData[userId].totalScore = userData[userId].messageCount + userData[userId].stickerCount;
        userData[userId].lastActivity = new Date();
        
        console.log(`✅ Updated ${userInfo.first_name}: ${userData[userId].totalScore} points`);
        return userData[userId];
    } catch (error) {
        console.error('❌ Error updating user activity:', error);
        return null;
    }
}

// Function to get leaderboard via API
async function getLeaderboardViaAPI() {
    try {
        const response = await fetch('https://www.wipetheblur.com/api/data-store');
        if (!response.ok) {
            console.error('❌ Failed to get data via API:', response.status);
            return "❌ Unable to load leaderboard data";
        }
        
        const data = await response.json();
        const users = Object.values(data.users);
        
        if (users.length === 0) {
            return "📊 *Leaderboard* 📊\n\nNo activity data available yet!\nStart sending messages and stickers to see rankings! 🚀";
        }
        
        // Sort users by total score
        users.sort((a, b) => b.totalScore - a.totalScore);
        
        let leaderboard = "📊 *Leaderboard* 📊\n\n";
        
        users.slice(0, 10).forEach((user, index) => {
            const rank = index + 1;
            const trophy = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
            const name = user.firstName + (user.lastName ? ` ${user.lastName}` : '');
            const username = user.username ? `(@${user.username})` : '';
            
            leaderboard += `${trophy} *${name}* ${username}\n`;
            leaderboard += `   📝 Messages: ${user.messages}\n`;
            leaderboard += `   🎭 Stickers: ${user.stickers}\n`;
            leaderboard += `   🏅 Total Score: ${user.totalScore}\n\n`;
        });
        
        leaderboard += `\n📊 Total participants: ${users.length}`;
        return leaderboard;
    } catch (error) {
        console.error('❌ Error getting leaderboard via API:', error);
        return "❌ Unable to load leaderboard data";
    }
}

// Fast user stats - NO API CALLS
function getUserStats(userId) {
    return userData[userId] || null;
}

// Export function to get userData for other modules
function getUserData() {
    return userData;
}

// Bot configuration
const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
    throw new Error('BOT_TOKEN environment variable is required');
}

// Initialize bot (webhook mode)
const bot = new TelegramBot(BOT_TOKEN, { polling: false });

// Direct message handler
async function handleMessage(msg) {
    // Validate message structure
    if (!msg || !msg.chat || !msg.from) {
        console.log('⚠️ Invalid message structure:', JSON.stringify(msg, null, 2));
        return;
    }
    
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const userInfo = msg.from;
    
    console.log('🔔 Processing message:', {
        chatId,
        userId,
        userName: userInfo.first_name,
        text: msg.text,
        isSticker: !!msg.sticker
    });
    
    // Handle commands
    if (msg.text && msg.text.startsWith('/')) {
        if (msg.text === '/start') {
            const welcomeMessage = `
🤖 *Welcome to Activity Tracker Bot!*

I track user activity in this chat and maintain a leaderboard based on messages and stickers sent.

*How it works:*
📝 Each message = 1 point
🎭 Each sticker = 1 point

*Commands:*
/leaderboard - View the current leaderboard
/mystats - View your personal statistics
/help - Show this help message

Your activity is now being tracked! 🎯
            `;
            
            try {
                await bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
                console.log('✅ Start message sent successfully');
            } catch (error) {
                console.error('❌ Error sending start message:', error);
            }
            return;
        }
        
        if (msg.text === '/leaderboard') {
            const leaderboardMessage = generateLeaderboard();
            try {
                await bot.sendMessage(chatId, leaderboardMessage, { parse_mode: 'Markdown' });
                console.log('✅ Leaderboard message sent successfully');
            } catch (error) {
                console.error('❌ Error sending leaderboard message:', error);
            }
            return;
        }
        
        if (msg.text === '/mystats') {
            const user = getUserStats(userId);
            if (!user) {
                try {
                    await bot.sendMessage(chatId, "📊 You haven't sent any messages or stickers yet! Start chatting to see your stats! 🚀");
                    console.log('✅ No stats message sent successfully');
                } catch (error) {
                    console.error('❌ Error sending no stats message:', error);
                }
                return;
            }
            
            const name = user.firstName + (user.lastName ? ` ${user.lastName}` : '');
            const statsMessage = `
📊 *Your Statistics* 📊

👤 Name: ${name}
${user.username ? `🔗 Username: @${user.username}\n` : ''}📝 Messages sent: ${user.messages}
🎭 Stickers sent: ${user.stickers}
🏅 Total score: ${user.totalScore}

Keep chatting to improve your rank! 🚀
            `;
            
            try {
                await bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });
                console.log('✅ Stats message sent successfully');
            } catch (error) {
                console.error('❌ Error sending stats message:', error);
            }
            return;
        }
        
        if (msg.text === '/help') {
            const helpMessage = `
🤖 *Activity Tracker Bot Help*

*What I do:*
I track every message and sticker you send in this chat and award points for activity.

*Scoring system:*
📝 Message = 1 point
🎭 Sticker = 1 point

*Available commands:*
/start - Welcome message and bot info
/leaderboard - View current rankings
/mystats - View your personal statistics
/help - Show this help message

*Note:* Your scores accumulate over time and never reset!

Happy chatting! 💬
            `;
            
            try {
                await bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
                console.log('✅ Help message sent successfully');
            } catch (error) {
                console.error('❌ Error sending help message:', error);
            }
            return;
        }
    } else if (msg.sticker) {
        // Handle stickers
        updateUserActivity(userId, userInfo, true);
        console.log(`🎭 Sticker from ${userInfo.first_name}: +1 point`);
    } else if (msg.text) {
        // Handle regular messages (excluding commands)
        updateUserActivity(userId, userInfo, false);
        console.log(`📝 Message from ${userInfo.first_name}: +1 point`);
    }
}

module.exports = async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    console.log('🌐 Webhook endpoint accessed:', {
        method: req.method,
        timestamp: new Date().toISOString(),
        headers: req.headers,
        query: req.query
    });
    
    if (req.method === 'GET') {
        return res.json({
            message: 'Telegram webhook endpoint is accessible',
            timestamp: new Date().toISOString(),
            path: '/api/telegram-webhook',
            method: 'GET',
            status: 'ready'
        });
    }
    
    if (req.method === 'POST') {
        console.log('📨 Webhook received update:', JSON.stringify(req.body, null, 2));
        
        try {
            const update = req.body;
            
            // Validate update structure
            if (!update) {
                console.log('⚠️ No update body received');
                return res.status(200).json({ status: 'ok', message: 'No update' });
            }
            
            // Handle different types of updates
            if (update.message) {
                const message = update.message;
                console.log('📝 Received message update');
                await handleMessage(message);
            } else if (update.edited_message) {
                const message = update.edited_message;
                console.log('✏️ Received edited message update');
                await handleMessage(message);
            } else if (update.channel_post) {
                const message = update.channel_post;
                console.log('📢 Received channel post update');
                await handleMessage(message);
            } else {
                console.log('ℹ️ Received other update type:', Object.keys(update));
                return res.status(200).json({ status: 'ok', message: 'Update processed' });
            }
            
            console.log('✅ Message processed successfully');
            return res.status(200).json({ status: 'ok', message: 'Message processed' });
        } catch (error) {
            console.error('❌ Error processing webhook:', error);
            return res.status(200).json({ status: 'error', message: error.message });
        }
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
};

// Export getUserData function for other modules
module.exports.getUserData = getUserData;