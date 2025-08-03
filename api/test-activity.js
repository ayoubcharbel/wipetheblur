// Test endpoint to manually add activity data for testing
const { updateUserScore, getStats } = require('./_shared-data.js');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'POST') {
        // Add test activity
        const testUser = {
            id: '12345',
            first_name: 'CJA',
            username: 'cjacrypto'
        };
        
        // Add some test messages and stickers
        updateUserScore('12345', testUser, false); // message
        updateUserScore('12345', testUser, false); // message  
        updateUserScore('12345', testUser, true);  // sticker
        
        const stats = getStats();
        return res.json({
            success: true,
            message: 'Test activity added',
            stats: stats
        });
    }
    
    if (req.method === 'GET') {
        const stats = getStats();
        return res.json(stats);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
};