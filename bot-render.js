const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const path = require('path');

// Bot configuration
const BOT_TOKEN = process.env.BOT_TOKEN || '8278016198:AAE5lKbas5dM8qMPM3M_o6X_h6g3W76sTzU';
const PORT = process.env.PORT || 10000;

// Initialize Express app
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

// Initialize bot in webhook mode
const bot = new TelegramBot(BOT_TOKEN, { polling: false });

// In-memory user data (perfect for Render)
let userData = {};

// Helper functions
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
        userData[userId].username = userInfo.username || userData[userId].username;
        userData[userId].firstName = userInfo.first_name || userData[userId].firstName;
        userData[userId].lastName = userInfo.last_name || userData[userId].lastName;
        userData[userId].lastSeen = new Date().toISOString();
    }
    return userData[userId];
}

async function updateUserScore(userId, userInfo, isSticker = false) {
    const user = getUser(userId, userInfo);
    
    if (isSticker) {
        user.stickers++;
    } else {
        user.messages++;
    }
    
    user.totalScore = user.messages + user.stickers;
    console.log(`📊 ${userInfo.first_name}: ${isSticker ? 'sticker' : 'message'} → ${user.totalScore} points`);
}

function generateLeaderboard() {
    const users = Object.values(userData);
    
    if (users.length === 0) {
        return 'No activity data available yet!';
    }
    
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

// Webhook endpoint - CRITICAL
app.post('/telegram-webhook', async (req, res) => {
    console.log('📨 Webhook received:', new Date().toISOString());
    
    try {
        const update = req.body;
        
        if (!update || !update.message) {
            console.log('⚠️ Invalid update');
            return res.sendStatus(200);
        }
        
        const message = update.message;
        const chatId = message.chat.id;
        const userId = message.from.id;
        const userInfo = message.from;
        
        console.log(`🔔 Processing: ${userInfo.first_name} - ${message.text || 'sticker'}`);
        
        // Handle commands
        if (message.text && message.text.startsWith('/')) {
            if (message.text === '/start') {
                await bot.sendMessage(chatId, `🤖 *Welcome to Activity Tracker Bot!*\n\nI track user activity and maintain a leaderboard.\n\n*Commands:*\n/leaderboard - View rankings\n/mystats - Your statistics\n/help - Show help\n\nYour activity is now being tracked! 🎯`, { parse_mode: 'Markdown' });
            } else if (message.text === '/leaderboard') {
                const leaderboard = generateLeaderboard();
                await bot.sendMessage(chatId, leaderboard, { parse_mode: 'Markdown' });
            } else if (message.text === '/mystats') {
                const user = userData[userId];
                if (!user) {
                    await bot.sendMessage(chatId, 'You haven\'t sent any messages or stickers yet!');
                } else {
                    const name = user.firstName + (user.lastName ? ` ${user.lastName}` : '');
                    const statsMessage = `📊 *Your Statistics*\n\n👤 Name: ${name}\n${user.username ? `🔗 Username: @${user.username}\n` : ''}📝 Messages: ${user.messages}\n🎭 Stickers: ${user.stickers}\n🏅 Total Score: ${user.totalScore}\n\nKeep chatting! 🚀`;
                    await bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });
                }
            } else if (message.text === '/help') {
                await bot.sendMessage(chatId, `🤖 *Activity Tracker Bot Help*\n\n*Scoring:*\n📝 Message = 1 point\n🎭 Sticker = 1 point\n\n*Commands:*\n/start - Welcome message\n/leaderboard - Current rankings\n/mystats - Your statistics\n/help - This help\n\n*Note:* Scores accumulate over time!\n\nHappy chatting! 💬`, { parse_mode: 'Markdown' });
            }
        } else if (message.sticker) {
            // Handle stickers
            await updateUserScore(userId, userInfo, true);
        } else if (message.text) {
            // Handle regular messages
            await updateUserScore(userId, userInfo, false);
        }
        
        res.sendStatus(200);
    } catch (error) {
        console.error('❌ Webhook error:', error);
        res.sendStatus(200);
    }
});

// Test webhook endpoint
app.get('/telegram-webhook', (req, res) => {
    res.json({
        message: 'Telegram webhook endpoint is accessible',
        timestamp: new Date().toISOString(),
        method: 'GET'
    });
});

// Bot status endpoint
app.get('/bot-status', (req, res) => {
    const users = Object.values(userData);
    const totalMessages = users.reduce((sum, user) => sum + user.messages, 0);
    const totalStickers = users.reduce((sum, user) => sum + user.stickers, 0);
    
    res.json({
        status: 'Bot is running!',
        timestamp: new Date().toISOString(),
        totalUsers: Object.keys(userData).length,
        totalMessages,
        totalStickers,
        totalActivity: totalMessages + totalStickers,
        botActive: true,
        platform: 'Render',
        webhookUrl: 'https://legendary-chainsaw.onrender.com/telegram-webhook'
    });
});

// Setup webhook endpoint
app.get('/setup-webhook', async (req, res) => {
    try {
        const webhookUrl = 'https://legendary-chainsaw.onrender.com/telegram-webhook';
        
        console.log('🔧 Setting up webhook:', webhookUrl);
        await bot.deleteWebHook();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const result = await bot.setWebHook(webhookUrl, {
            drop_pending_updates: true
        });
        
        const webhookInfo = await bot.getWebHookInfo();
        
        res.json({
            success: true,
            message: 'Webhook configured successfully!',
            webhookUrl,
            result,
            webhookInfo,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Webhook status
app.get('/webhook-status', async (req, res) => {
    try {
        const webhookInfo = await bot.getWebHookInfo();
        res.json({
            webhook: webhookInfo,
            status: 'Webhook info retrieved',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.json({
            error: error.message,
            status: 'Error getting webhook info',
            timestamp: new Date().toISOString()
        });
    }
});

// Bot admin page
app.get('/bot-admin', (req, res) => {
    const users = Object.values(userData);
    const totalMessages = users.reduce((sum, user) => sum + user.messages, 0);
    const totalStickers = users.reduce((sum, user) => sum + user.stickers, 0);
    
    const adminHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Telegram Bot Admin - Render</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        .status-live { color: #28a745; }
        .card { margin-bottom: 20px; }
    </style>
</head>
<body class="bg-light">
    <div class="container mt-4">
        <h1><i class="fas fa-robot"></i> Bot Admin Dashboard</h1>
        <div class="alert alert-success">
            <strong>Status:</strong> <span class="status-live">● LIVE on Render</span> | 
            <strong>Users:</strong> ${users.length} | 
            <strong>Total Activity:</strong> ${totalMessages + totalStickers}
        </div>
        
        <div class="row">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header"><h5>📊 Statistics</h5></div>
                    <div class="card-body">
                        <p><strong>Messages:</strong> ${totalMessages}</p>
                        <p><strong>Stickers:</strong> ${totalStickers}</p>
                        <p><strong>Total Users:</strong> ${users.length}</p>
                        <p><strong>Platform:</strong> Render</p>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header"><h5>🔧 Quick Actions</h5></div>
                    <div class="card-body">
                        <a href="/setup-webhook" class="btn btn-primary btn-sm">Setup Webhook</a>
                        <a href="/webhook-status" class="btn btn-info btn-sm">Check Webhook</a>
                        <a href="/bot-status" class="btn btn-success btn-sm">Bot Status</a>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header"><h5>🏆 Top Users</h5></div>
            <div class="card-body">
                <table class="table table-striped">
                    <thead>
                        <tr><th>Rank</th><th>Name</th><th>Messages</th><th>Stickers</th><th>Score</th></tr>
                    </thead>
                    <tbody>
                        ${users.sort((a, b) => b.totalScore - a.totalScore).slice(0, 10).map((user, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${user.firstName} ${user.lastName || ''}</td>
                                <td>${user.messages}</td>
                                <td>${user.stickers}</td>
                                <td><strong>${user.totalScore}</strong></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    
    <script>
        // Auto refresh every 30 seconds
        setTimeout(() => window.location.reload(), 30000);
    </script>
</body>
</html>`;
    
    res.send(adminHTML);
});

// Serve main website
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🤖 Telegram bot ready for webhook setup`);
    console.log(`📍 Webhook URL: https://legendary-chainsaw.onrender.com/telegram-webhook`);
});

// Error handling
process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});