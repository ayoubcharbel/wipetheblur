module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    return res.json({
        success: true,
        message: "DEPLOYMENT IS WORKING!",
        timestamp: new Date().toISOString(),
        deploymentVersion: "2025-08-03-v2"
    });
};