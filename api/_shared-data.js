// Shared data management for all API endpoints
// This ensures all endpoints share the same userData

const fs = require('fs');
const path = require('path');

let userData = {};
let isDataLoaded = false;

// File path for persistent storage
const dataFilePath = process.env.VERCEL ? '/tmp/userData.json' : path.join(process.cwd(), 'userData.json');

// Load user data from file (with error handling)
function loadUserData() {
    if (isDataLoaded) return; // Prevent multiple loads
    
    try {
        console.log('📁 Loading user data from:', dataFilePath);
        if (fs.existsSync(dataFilePath)) {
            const fileData = fs.readFileSync(dataFilePath, 'utf8');
            if (fileData.trim()) {
                userData = JSON.parse(fileData);
                console.log('✅ User data loaded successfully:', Object.keys(userData).length, 'users');
            }
        } else {
            console.log('📝 No existing data file found, starting fresh');
        }
    } catch (error) {
        console.error('❌ Error loading user data:', error.message);
        userData = {}; // Start fresh if file is corrupted
    }
    isDataLoaded = true;
}

// Save user data to file (with error handling)
function saveUserData() {
    try {
        console.log('💾 Saving user data to:', dataFilePath);
        
        // Ensure directory exists
        const dir = path.dirname(dataFilePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(dataFilePath, JSON.stringify(userData, null, 2));
        console.log('✅ User data saved successfully:', Object.keys(userData).length, 'users');
    } catch (error) {
        console.error('❌ Error saving user data:', error.message);
    }
}

// Auto-load data on first access
loadUserData();

function getSharedUserData() {
    loadUserData(); // Ensure data is loaded
    return userData;
}

function setSharedUserData(data) {
    userData = data;
}

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
        console.log(`👤 New user created: ${userInfo.first_name} (${userId})`);
    } else {
        // Update user info if it has changed
        userData[userId].username = userInfo.username || userData[userId].username;
        userData[userId].firstName = userInfo.first_name || userData[userId].firstName;
        userData[userId].lastName = userInfo.last_name || userData[userId].lastName;
        userData[userId].lastSeen = new Date().toISOString();
    }
    
    return userData[userId];
}

function updateUserScore(userId, userInfo, isSticker = false) {
    loadUserData(); // Ensure data is loaded
    
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
    
    // Log current total users for debugging
    console.log('👥 Total users in database:', Object.keys(userData).length);
    
    // Auto-save after every update
    saveUserData();
    
    return user;
}

function generateLeaderboard() {
    const users = Object.values(userData);
    
    console.log('📊 Generating leaderboard for', users.length, 'users');
    
    if (users.length === 0) {
        return 'No activity data available yet! Start chatting to build the leaderboard! 🚀';
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

function getStats() {
    loadUserData(); // Ensure data is loaded
    const users = Object.values(userData);
    const totalMessages = users.reduce((sum, user) => sum + user.messages, 0);
    const totalStickers = users.reduce((sum, user) => sum + user.stickers, 0);
    
    return {
        totalUsers: users.length,
        totalMessages,
        totalStickers,
        totalActivity: totalMessages + totalStickers,
        users
    };
}

module.exports = {
    getSharedUserData,
    setSharedUserData,
    getUser,
    updateUserScore,
    generateLeaderboard,
    getStats,
    loadUserData,
    saveUserData
};