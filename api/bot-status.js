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
    
    // Get stats from centralized data store
    let stats = {
        totalUsers: 0,
        totalMessages: 0,
        totalStickers: 0,
        totalActivity: 0
    };
    
    try {
        const response = await fetch('https://www.wipetheblur.com/api/data-store');
        if (response.ok) {
            stats = await response.json();
        }
    } catch (error) {
        console.error('❌ Error fetching stats from data store:', error);
    }
    
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