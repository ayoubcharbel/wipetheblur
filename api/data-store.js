// Simple in-memory data store API endpoint for sharing data between functions
// This acts as a centralized data store that all other endpoints can access

let globalUserData = {};

module.exports = async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    console.log('📊 Data store endpoint accessed:', {
        method: req.method,
        timestamp: new Date().toISOString()
    });
    
    if (req.method === 'GET') {
        // Return current data
        const users = Object.values(globalUserData);
        const stats = {
            totalUsers: users.length,
            totalMessages: users.reduce((sum, user) => sum + user.messages, 0),
            totalStickers: users.reduce((sum, user) => sum + user.stickers, 0),
            totalActivity: users.reduce((sum, user) => sum + user.totalScore, 0),
            users: globalUserData
        };
        
        console.log('📊 Returning stats:', stats);
        return res.json(stats);
    }
    
    if (req.method === 'POST') {
        // Update data
        const { userId, userInfo, isSticker = false } = req.body;
        
        if (!userId || !userInfo) {
            return res.status(400).json({ error: 'Missing userId or userInfo' });
        }
        
        // Create or update user
        if (!globalUserData[userId]) {
            globalUserData[userId] = {
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
        }
        
        // Update user data
        const user = globalUserData[userId];
        user.username = userInfo.username || user.username;
        user.firstName = userInfo.first_name || user.firstName;
        user.lastName = userInfo.last_name || user.lastName;
        user.lastSeen = new Date().toISOString();
        
        // Update activity
        if (isSticker) {
            user.stickers++;
            console.log(`🎭 Sticker tracked! User: ${user.firstName}, Total stickers: ${user.stickers}`);
        } else {
            user.messages++;
            console.log(`💬 Message tracked! User: ${user.firstName}, Total messages: ${user.messages}`);
        }
        
        user.totalScore = user.messages + user.stickers;
        
        console.log(`📈 Updated totals for ${user.firstName}: ${user.messages} messages, ${user.stickers} stickers, ${user.totalScore} total`);
        console.log('👥 Total users in database:', Object.keys(globalUserData).length);
        
        return res.json({ success: true, user });
    }
    
    if (req.method === 'PUT') {
        // Reset/replace all data
        globalUserData = req.body.userData || {};
        console.log('🔄 Data store reset/updated');
        return res.json({ success: true, message: 'Data updated' });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
};