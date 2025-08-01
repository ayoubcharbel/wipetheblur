const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

// Bot configuration
const BOT_TOKEN = process.env.BOT_TOKEN || '8278016198:AAE5lKbas5dM8qMPM3M_o6X_h6g3W76sTzU';
const PORT = process.env.PORT || 10000;

// Initialize bot and express app
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const app = express();

// Serve static files (your existing website)
app.use(express.static(path.join(__dirname, '/')));
app.use(express.json());

// Data file path
const DATA_FILE = path.join(__dirname, 'userData.json');

// Initialize user data structure
let userData = {};

// Load existing data on startup
async function loadUserData() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        userData = JSON.parse(data);
        console.log('User data loaded successfully');
    } catch (error) {
        console.log('No existing data file found, starting fresh');
        userData = {};
    }
}

// Save data to file
async function saveUserData() {
    try {
        await fs.writeFile(DATA_FILE, JSON.stringify(userData, null, 2));
        console.log('User data saved successfully');
    } catch (error) {
        console.error('Error saving user data:', error);
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
    const user = getUser(userId, userInfo);
    
    if (isSticker) {
        user.stickers++;
    } else {
        user.messages++;
    }
    
    user.totalScore = user.messages + user.stickers;
    
    await saveUserData();
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

// Bot event handlers
bot.on('message', async (msg) => {
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
});

// Error handling
bot.on('error', (error) => {
    console.error('Bot error:', error);
});

bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

// Express server routes
// Serve your main website
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Bot status API endpoint
app.get('/bot-status', (req, res) => {
    res.json({
        status: 'Bot is running!',
        timestamp: new Date().toISOString(),
        totalUsers: Object.keys(userData).length,
        botActive: true
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
        console.log(`🤖 Bot is active and monitoring chats...`);
    });
}

startBot().catch(console.error);