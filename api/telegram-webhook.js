const TelegramBot = require('node-telegram-bot-api');

// Bot configuration
const BOT_TOKEN = process.env.BOT_TOKEN || '8278016198:AAE5lKbas5dM8qMPM3M_o6X_h6g3W76sTzU';

// Initialize bot (webhook mode)
const bot = new TelegramBot(BOT_TOKEN, { polling: false });

// In-memory user data (resets on cold starts)
let userData = {};

// Get or create user record
function getUser(userId, userInfo) {
    if (!userData[userId]) {
        userData[userId] = {
            id: userId,
            username: userInfo.username || 'Unknown',
            firstName: userInfo.first_name || 'Unknown',
            lastName: userInfo.last_name || '',
            messages: 0,
            stickers: 0,
            totalScore: 0,
            lastSeen: new Date().toISOString()
        };
    } else {
        // Update user info if it has changed
        userData[userId].username = userInfo.username || userData[userId].username;
        userData[userId].firstName = userInfo.first_name || userData[userId].firstName;
        userData[userId].lastName = userInfo.last_name || userData[userId].lastName;
        userData[userId].lastSeen = new Date().toISOString();
    }
    
    return userData[userId];
}

// Update user score
async function updateUserScore(userId, userInfo, isSticker = false) {
    console.log('📊 Updating score for user:', {
        userId,
        userName: userInfo.first_name,
        isSticker,
        timestamp: new Date().toISOString()
    });
    
    const user = getUser(userId, userInfo);
    
    if (isSticker) {
        user.stickers++;
        console.log('🎭 Sticker count increased to:', user.stickers);
    } else {
        user.messages++;
        console.log('📝 Message count increased to:', user.messages);
    }
    
    user.totalScore = user.messages + user.stickers;
    console.log('🏅 Total score updated to:', user.totalScore);
}

// Generate leaderboard
function generateLeaderboard(chatId) {
    const users = Object.values(userData);
    
    if (users.length === 0) {
        return 'No activity data available yet!';
    }
    
    // Sort by total score (descending)
    users.sort((a, b) => b.totalScore - a.totalScore);
    
    let leaderboard = '🏆 *Activity Leaderboard* 🏆\n\n';
    
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
}

// Direct message handler
async function handleMessage(msg) {
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
            const leaderboard = generateLeaderboard(chatId);
            try {
                await bot.sendMessage(chatId, leaderboard, { parse_mode: 'Markdown' });
                console.log('✅ Leaderboard message sent successfully');
            } catch (error) {
                console.error('❌ Error sending leaderboard message:', error);
            }
            return;
        }
        
        if (msg.text === '/mystats') {
            const user = userData[userId];
            if (!user) {
                try {
                    await bot.sendMessage(chatId, 'You haven\'t sent any messages or stickers yet!');
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
        await updateUserScore(userId, userInfo, true);
        console.log(`Sticker from ${userInfo.first_name}: +1 point`);
    } else if (msg.text) {
        // Handle regular messages (excluding commands)
        await updateUserScore(userId, userInfo, false);
        console.log(`Message from ${userInfo.first_name}: +1 point`);
    }
}

export default async function handler(req, res) {
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
            method: 'GET'
        });
    }
    
    if (req.method === 'POST') {
        console.log('📨 Webhook received update:', JSON.stringify(req.body, null, 2));
        
        try {
            const update = req.body;
            
            // Validate update structure
            if (!update || !update.message) {
                console.log('⚠️ Invalid update structure');
                return res.status(200).json({ status: 'ok', message: 'Invalid update' });
            }
            
            const message = update.message;
            
            // Process the message
            await handleMessage(message);
            
            console.log('✅ Message processed successfully');
            return res.status(200).json({ status: 'ok', message: 'Message processed' });
        } catch (error) {
            console.error('❌ Error processing webhook:', error);
            return res.status(200).json({ status: 'error', message: error.message });
        }
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
}