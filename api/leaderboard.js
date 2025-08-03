module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        // Try to get forced data first, fallback to shared data
        let stats;
        try {
            const forceRefresh = require('./force-refresh');
            const forcedData = forceRefresh.getForcedData();
            stats = {
                totalUsers: forcedData.totalUsers,
                totalMessages: forcedData.totalMessages,
                totalStickers: forcedData.totalStickers,
                totalActivity: forcedData.totalActivity,
                users: forcedData.users
            };
        } catch (error) {
            const sharedData = require('./_shared-data');
            stats = sharedData.getStats();
        }
        
        // Sort users by total score descending
        const sortedUsers = stats.users.sort((a, b) => b.totalScore - a.totalScore);
        
        console.log('📊 Leaderboard requested, returning data for', sortedUsers.length, 'users');
        
        return res.json({
            success: true,
            totalUsers: stats.totalUsers,
            totalMessages: stats.totalMessages,
            totalStickers: stats.totalStickers,
            totalActivity: stats.totalActivity,
            leaderboard: sortedUsers.slice(0, 10), // Top 10 users
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Leaderboard API error:', error);
        
        return res.json({
            success: false,
            error: error.message,
            leaderboard: [],
            totalUsers: 0,
            totalMessages: 0,
            totalStickers: 0,
            totalActivity: 0,
            timestamp: new Date().toISOString()
        });
    }
};