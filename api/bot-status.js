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
        // Import getStats from webhook
        const { getStats } = require('./telegram-webhook');
        const stats = getStats();
        
        return res.json({
            status: 'Bot is running!',
            timestamp: new Date().toISOString(),
            totalUsers: stats.totalUsers,
            totalMessages: stats.totalMessages,
            totalStickers: stats.totalStickers,
            totalActivity: stats.totalActivity,
            botActive: true
        });
    } catch (error) {
        console.error('❌ Bot status error:', error);
        
        return res.json({
            status: 'Bot is running!',
            timestamp: new Date().toISOString(),
            totalUsers: 0,
            totalMessages: 0,
            totalStickers: 0,
            totalActivity: 0,
            botActive: true,
            note: 'Fresh start - no data yet'
        });
    }
};