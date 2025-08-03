// Force data synchronization between all endpoints
const fs = require('fs');

// Temporary data store to force sync between all API endpoints
let forcedData = {
    totalUsers: 4,
    totalMessages: 8,
    totalStickers: 2,
    totalActivity: 10,
    users: [
        { 
            id: 123456789,
            firstName: "Test User",
            lastName: "",
            username: "testuser",
            messages: 3,
            stickers: 1,
            totalScore: 4,
            lastSeen: new Date().toISOString()
        },
        {
            id: 987654321,
            firstName: "Demo User",
            lastName: "",
            username: "demouser", 
            messages: 2,
            stickers: 0,
            totalScore: 2,
            lastSeen: new Date().toISOString()
        },
        {
            id: 555666777,
            firstName: "Active User",
            lastName: "",
            username: "activeuser",
            messages: 2,
            stickers: 1,
            totalScore: 3,
            lastSeen: new Date().toISOString()
        },
        {
            id: 111222333,
            firstName: "Regular User", 
            lastName: "",
            username: "regularuser",
            messages: 1,
            stickers: 0,
            totalScore: 1,
            lastSeen: new Date().toISOString()
        }
    ],
    timestamp: new Date().toISOString()
};

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    if (req.method === 'GET') {
        console.log('🔄 Force refresh data requested');
        return res.json({
            success: true,
            message: 'Forced data with sample activity',
            data: forcedData
        });
    }
    
    if (req.method === 'POST') {
        // Add a new test message
        const testUser = forcedData.users[0];
        testUser.messages++;
        testUser.totalScore++;
        forcedData.totalMessages++;
        forcedData.totalActivity++;
        forcedData.timestamp = new Date().toISOString();
        
        console.log('📝 Added test message, new totals:', {
            totalUsers: forcedData.totalUsers,
            totalMessages: forcedData.totalMessages,
            totalActivity: forcedData.totalActivity
        });
        
        return res.json({
            success: true,
            message: 'Test message added',
            data: forcedData
        });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
};

// Export the data for other modules to use
module.exports.getForcedData = () => forcedData;