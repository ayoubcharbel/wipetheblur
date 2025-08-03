module.exports = async function handler(req, res) {
    // Set CORS headers and disable caching
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    console.log('📊 Bot status endpoint accessed:', {
        method: req.method,
        timestamp: new Date().toISOString()
    });
    
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Get real data from webhook storage via shared variable
    const { getUserData } = require('./telegram-webhook.js');
    let stats = { totalUsers: 0, totalMessages: 0, totalStickers: 0, totalActivity: 0 };
    
    try {
        const userData = getUserData();
        const users = Object.values(userData);
        
        stats = {
            totalUsers: users.length,
            totalMessages: users.reduce((sum, user) => sum + user.messageCount, 0),
            totalStickers: users.reduce((sum, user) => sum + user.stickerCount, 0),
            totalActivity: users.reduce((sum, user) => sum + user.totalScore, 0)
        };
        
        console.log('📊 Real stats from webhook:', stats);
    } catch (error) {
        console.log('⚠️ Using fallback stats, webhook data not available:', error.message);
        // Keep default stats
    }
    
    console.log('📊 Returning confirmed bot activity data');
    
    return res.json({
        status: 'Bot is running!',
        timestamp: new Date().toISOString(),
        totalUsers: stats.totalUsers,
        totalMessages: stats.totalMessages,
        totalStickers: stats.totalStickers,
        totalActivity: stats.totalActivity,
        botActive: true,
        webhookPath: '/api/telegram-webhook',
        environment: process.env.NODE_ENV || 'production',
        isVercel: !!process.env.VERCEL,
        isRender: !!process.env.RENDER,
        note: 'Data is shared via centralized API store'
    });
};