// Shared data management for all API endpoints
// This ensures all endpoints share the same userData

let userData = {};

function getSharedUserData() {
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
    getStats
};