const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

// Bot configuration
const BOT_TOKEN = process.env.BOT_TOKEN || '8278016198:AAE5lKbas5dM8qMPM3M_o6X_h6g3W76sTzU';
const PORT = process.env.PORT || 10000;

// Initialize bot and express app  
// Use webhook mode for serverless compatibility (Vercel)
const bot = new TelegramBot(BOT_TOKEN, { 
    polling: false,
    webHook: {
        port: PORT
    }
});
const app = express();

// Serve static files (your existing website)
app.use(express.static(path.join(__dirname, '/')));
app.use(express.json());

// Webhook endpoint for Telegram
const WEBHOOK_PATH = `/telegram-webhook`;

// Test endpoint to verify webhook accessibility
app.get(WEBHOOK_PATH, (req, res) => {
    res.json({
        message: 'Telegram webhook endpoint is accessible',
        timestamp: new Date().toISOString(),
        path: WEBHOOK_PATH,
        botToken: BOT_TOKEN.substring(0, 10) + '...'
    });
});

// Enhanced webhook handler with better error handling
app.post(WEBHOOK_PATH, async (req, res) => {
    console.log('📨 Webhook received update:', JSON.stringify(req.body, null, 2));
    
    try {
        const update = req.body;
        
        // Validate update structure
        if (!update || !update.message) {
            console.log('⚠️ Invalid update structure');
            return res.sendStatus(200);
        }
        
        const message = update.message;
        const chatId = message.chat.id;
        const userId = message.from.id;
        const userInfo = message.from;
        
        console.log('🔔 Processing message:', {
            chatId,
            userId,
            userName: userInfo.first_name,
            text: message.text,
            isSticker: !!message.sticker
        });
        
        // Process the message directly instead of using bot.processUpdate
        await handleMessage(message);
        
        console.log('✅ Message processed successfully');
        res.sendStatus(200);
    } catch (error) {
        console.error('❌ Error processing webhook:', error);
        res.sendStatus(200); // Still return 200 to prevent Telegram retries
    }
});

// Data file path
const DATA_FILE = path.join(__dirname, 'userData.json');

// Initialize user data structure
let userData = {};

// Load existing data on startup
async function loadUserData() {
    if (process.env.VERCEL) {
        console.log('🔄 Running on Vercel - starting with fresh data in memory');
        userData = {};
        return;
    }
    
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        userData = JSON.parse(data);
        console.log('📂 User data loaded successfully from file');
    } catch (error) {
        console.log('📂 No existing data file found, starting fresh');
        userData = {};
    }
}

// Save data to file (Note: On Vercel, file storage is ephemeral)
async function saveUserData() {
    if (process.env.VERCEL) {
        console.log('⚠️  Running on Vercel - data will be stored in memory only (resets on deployment)');
        console.log('💾 Current user data:', Object.keys(userData).length, 'users');
        return; // Don't try to write files on Vercel
    }
    
    try {
        await fs.writeFile(DATA_FILE, JSON.stringify(userData, null, 2));
        console.log('💾 User data saved to file successfully');
    } catch (error) {
        console.error('❌ Error saving user data:', error);
    }
}

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
    
    await saveUserData();
    console.log('💾 User data saved successfully');
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

// Direct message handler for webhook processing
async function handleMessage(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const userInfo = msg.from;
    
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
            
            bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
            return;
        }
        
        if (msg.text === '/leaderboard') {
            const leaderboard = generateLeaderboard(chatId);
            bot.sendMessage(chatId, leaderboard, { parse_mode: 'Markdown' });
            return;
        }
        
        if (msg.text === '/mystats') {
            const user = userData[userId];
            if (!user) {
                bot.sendMessage(chatId, 'You haven\'t sent any messages or stickers yet!');
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
            
            bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });
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
            
            bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
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

// Error handling for webhook mode
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

// Express server routes
// Serve your main website
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Bot status API endpoint
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
        webhookPath: WEBHOOK_PATH,
        dataFile: DATA_FILE,
        environment: process.env.NODE_ENV || 'development',
        isVercel: !!process.env.VERCEL
    });
});

// Bot statistics API endpoint
app.get('/bot-stats', (req, res) => {
    const users = Object.values(userData);
    const totalMessages = users.reduce((sum, user) => sum + user.messages, 0);
    const totalStickers = users.reduce((sum, user) => sum + user.stickers, 0);
    
    res.json({
        totalUsers: users.length,
        totalMessages,
        totalStickers,
        totalActivity: totalMessages + totalStickers,
        topUsers: users.sort((a, b) => b.totalScore - a.totalScore).slice(0, 5)
    });
});

// Webhook status endpoint
app.get('/webhook-status', async (req, res) => {
    try {
        const webhookInfo = await bot.getWebHookInfo();
        res.json({
            webhook: webhookInfo,
            status: 'Webhook configured',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.json({
            error: error.message,
            status: 'Webhook error',
            timestamp: new Date().toISOString()
        });
    }
});

// Simple and reliable webhook setup
app.get('/setup-webhook', async (req, res) => {
    try {
        // Clear any existing webhook first
        console.log('🔧 Clearing existing webhook...');
        await bot.deleteWebHook();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        // Set new webhook with Vercel URL (most reliable)
        const webhookUrl = `https://wipetheblur-q6cbfxm4f-charbel-ayoubs-projects.vercel.app${WEBHOOK_PATH}`;
        console.log('🔧 Setting webhook to:', webhookUrl);
        
        const result = await bot.setWebHook(webhookUrl, {
            drop_pending_updates: true // Clear any pending messages
        });
        console.log('✅ Webhook setup result:', result);
        
        // Verify webhook was set
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        const webhookInfo = await bot.getWebHookInfo();
        console.log('📋 Webhook info:', webhookInfo);
        
        res.json({
            success: true,
            message: 'Webhook configured successfully!',
            webhookUrl,
            result,
            webhookInfo,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Webhook setup failed:', error);
        res.json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Clear webhook endpoint
app.get('/clear-webhook', async (req, res) => {
    try {
        console.log('🔧 Clearing webhook...');
        const result = await bot.deleteWebHook();
        console.log('✅ Webhook cleared:', result);
        
        // Get updated webhook info
        const webhookInfo = await bot.getWebHookInfo();
        
        res.json({
            success: true,
            message: 'Webhook cleared successfully!',
            result,
            webhookInfo,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Failed to clear webhook:', error);
        res.json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Test bot sending capability
app.get('/test-bot/:chatId', async (req, res) => {
    try {
        const chatId = req.params.chatId;
        const testMessage = `🤖 Bot test successful!\n\nTime: ${new Date().toLocaleString()}\nBot is working properly!`;
        
        console.log('🧪 Testing bot send to chat:', chatId);
        const result = await bot.sendMessage(chatId, testMessage);
        console.log('✅ Test message sent:', result);
        
        res.json({
            success: true,
            message: 'Test message sent successfully!',
            chatId,
            result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Failed to send test message:', error);
        res.json({
            success: false,
            error: error.message,
            chatId: req.params.chatId,
            timestamp: new Date().toISOString()
        });
    }
});

// Webhook setup with Vercel URL only
app.get('/setup-webhook-vercel', async (req, res) => {
    try {
        const webhookUrl = `https://wipetheblur-q6cbfxm4f-charbel-ayoubs-projects.vercel.app${WEBHOOK_PATH}`;
        console.log('🔧 Setting up webhook with Vercel URL:', webhookUrl);
        
        const result = await bot.setWebHook(webhookUrl);
        console.log('✅ Vercel webhook setup result:', result);
        
        // Get updated webhook info
        const webhookInfo = await bot.getWebHookInfo();
        
        res.json({
            success: true,
            message: 'Webhook set up with Vercel URL successfully!',
            webhookUrl,
            result,
            webhookInfo,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Failed to set Vercel webhook:', error);
        res.json({
            success: false,
            error: error.message,
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
    <title>Telegram Bot Admin - Wipe the Blur</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        .status-card { border-left: 4px solid #28a745; }
        .stats-card { border-left: 4px solid #007bff; }
        .users-card { border-left: 4px solid #ffc107; }
    </style>
</head>
<body class="bg-light">
    <nav class="navbar navbar-dark bg-dark">
        <div class="container">
            <a class="navbar-brand" href="/">
                <i class="fas fa-robot me-2"></i>
                Telegram Bot Admin
            </a>
            <a href="/" class="btn btn-outline-light btn-sm">
                <i class="fas fa-home me-1"></i>
                Back to Website
            </a>
        </div>
    </nav>
    
    <div class="container mt-4">
        <div class="row">
            <div class="col-md-4 mb-4">
                <div class="card status-card">
                    <div class="card-body">
                        <h5 class="card-title">
                            <i class="fas fa-circle text-success me-2"></i>
                            Bot Status
                        </h5>
                        <p class="card-text">
                            <strong>Status:</strong> Online<br>
                            <strong>Uptime:</strong> Active<br>
                            <strong>Last Update:</strong> ${new Date().toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>
            
            <div class="col-md-4 mb-4">
                <div class="card stats-card">
                    <div class="card-body">
                        <h5 class="card-title">
                            <i class="fas fa-chart-bar me-2"></i>
                            Activity Stats
                        </h5>
                        <p class="card-text">
                            <strong>Total Messages:</strong> ${totalMessages}<br>
                            <strong>Total Stickers:</strong> ${totalStickers}<br>
                            <strong>Total Activity:</strong> ${totalMessages + totalStickers}
                        </p>
                    </div>
                </div>
            </div>
            
            <div class="col-md-4 mb-4">
                <div class="card users-card">
                    <div class="card-body">
                        <h5 class="card-title">
                            <i class="fas fa-users me-2"></i>
                            Users
                        </h5>
                        <p class="card-text">
                            <strong>Total Users:</strong> ${users.length}<br>
                            <strong>Active Today:</strong> ${users.filter(u => {
                                const lastSeen = new Date(u.lastSeen);
                                const today = new Date();
                                return lastSeen.toDateString() === today.toDateString();
                            }).length}
                        </p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5><i class="fas fa-trophy me-2"></i>Top Users</h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Name</th>
                                        <th>Username</th>
                                        <th>Messages</th>
                                        <th>Stickers</th>
                                        <th>Total Score</th>
                                        <th>Last Seen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${users.sort((a, b) => b.totalScore - a.totalScore).slice(0, 10).map((user, index) => `
                                        <tr>
                                            <td>${index + 1}</td>
                                            <td>${user.firstName} ${user.lastName || ''}</td>
                                            <td>${user.username ? '@' + user.username : 'N/A'}</td>
                                            <td>${user.messages}</td>
                                            <td>${user.stickers}</td>
                                            <td><strong>${user.totalScore}</strong></td>
                                            <td>${new Date(user.lastSeen).toLocaleDateString()}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mt-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5><i class="fas fa-info-circle me-2"></i>Bot Information</h5>
                    </div>
                    <div class="card-body">
                        <p><strong>Bot Token:</strong> 8278016198:AAE****(hidden for security)</p>
                        <p><strong>Commands Available:</strong></p>
                        <ul>
                            <li><code>/start</code> - Welcome message</li>
                            <li><code>/leaderboard</code> - Show current rankings</li>
                            <li><code>/mystats</code> - Personal statistics</li>
                            <li><code>/help</code> - Help information</li>
                        </ul>
                        <p><strong>Scoring System:</strong> 1 point per message, 1 point per sticker</p>
                        <p><strong>Data Storage:</strong> userData.json (persistent)</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // Auto refresh every 30 seconds
        setTimeout(() => {
            window.location.reload();
        }, 30000);
    </script>
</body>
</html>
    `;
    
    res.send(adminHTML);
});

// Start the application
async function startBot() {
    await loadUserData();
    
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🤖 Bot is ready for webhook setup`);
        console.log(`📋 Webhook endpoint: ${WEBHOOK_PATH}`);
        console.log(`🔧 Use /setup-webhook to configure Telegram webhook`);
        console.log(`🧪 Use /test-bot/{chatId} to test bot sending`);
        
        // Log bot token for debugging
        console.log(`🔑 Bot token: ${BOT_TOKEN.substring(0, 10)}...`);
    });
}

startBot().catch(console.error);