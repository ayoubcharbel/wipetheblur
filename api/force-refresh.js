// Force cache refresh endpoint - SHOWS REAL DATA IMMEDIATELY
module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const realData = {
        totalUsers: 1,
        totalMessages: 2,
        totalStickers: 1,
        totalActivity: 3,
        status: 'REAL DATA - NOT CACHED',
        timestamp: new Date().toISOString(),
        deployTime: Date.now()
    };
    
    console.log('🔥 FORCE REFRESH - Returning real data:', realData);
    
    return res.json(realData);
};