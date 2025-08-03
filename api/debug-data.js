module.exports = async function handler(req, res) {
    try {
        // Import the same variables from webhook
        const webhook = require('./telegram-webhook');
        
        // Try to access the stats
        const stats = webhook.getStats();
        
        return res.json({
            success: true,
            stats: stats,
            timestamp: new Date().toISOString(),
            debug: 'Direct access to webhook data'
        });
    } catch (error) {
        return res.json({
            success: false,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }
};