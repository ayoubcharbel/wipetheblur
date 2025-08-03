export default async function handler(req, res) {
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
    
    return res.json({
        status: 'Bot is running!',
        timestamp: new Date().toISOString(),
        totalUsers: 0, // Note: Data resets on serverless cold starts
        totalMessages: 0,
        totalStickers: 0,
        totalActivity: 0,
        botActive: true,
        webhookPath: '/api/telegram-webhook',
        environment: process.env.NODE_ENV || 'production',
        isRender: !!process.env.RENDER,
        note: 'Data is stored in memory and resets on server restarts'
    });
}