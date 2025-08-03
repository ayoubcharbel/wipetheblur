const { getStats } = require('./_shared-data.js');

module.exports = async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    console.log('📊 Bot status endpoint accessed:', {
        method: req.method,
        timestamp: new Date().toISOString()
    });
    
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const stats = getStats();
    
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
        note: 'Data is stored in memory and resets on server restarts'
    });
};