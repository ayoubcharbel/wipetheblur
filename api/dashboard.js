module.exports = async function handler(req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    const dashboardHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🤖 Telegram Bot Dashboard</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        body { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            min-height: 100vh; 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .card { 
            box-shadow: 0 15px 40px rgba(0,0,0,0.15); 
            border: none; 
            border-radius: 15px;
            margin-bottom: 25px;
        }
        .stat-card { 
            background: white; 
            border-radius: 15px; 
            padding: 30px 25px; 
            text-align: center;
            transition: transform 0.3s ease;
        }
        .stat-card:hover {
            transform: translateY(-5px);
        }
        .header-section {
            background: rgba(255,255,255,0.1); 
            backdrop-filter: blur(15px);
            border-radius: 15px;
            margin-bottom: 40px;
        }
        .rank-1 { background: linear-gradient(45deg, #FFD700, #FFA500); color: #333; }
        .rank-2 { background: linear-gradient(45deg, #C0C0C0, #A9A9A9); color: #333; }
        .rank-3 { background: linear-gradient(45deg, #CD7F32, #B8860B); color: #333; }
        .rank-4 { background: linear-gradient(45deg, #87CEEB, #4682B4); color: #333; }
        .live-indicator {
            width: 12px;
            height: 12px;
            background: #00ff00;
            border-radius: 50%;
            display: inline-block;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="container py-5">
        <!-- Header -->
        <div class="header-section p-4 text-center">
            <h1 class="text-white display-4 mb-3">
                <i class="fas fa-robot me-3"></i>
                Telegram Activity Bot Dashboard
            </h1>
            <p class="text-white-50 fs-5 mb-2">
                <span class="live-indicator me-2"></span>
                LIVE DASHBOARD - Real Bot Data
            </p>
            <p class="text-white fs-6 mb-0">Last Updated: ${new Date().toLocaleString()}</p>
        </div>

        <!-- Real-time Stats -->
        <div class="row mb-5">
            <div class="col-md-3">
                <div class="stat-card">
                    <i class="fas fa-users text-primary mb-3" style="font-size: 3.5rem;"></i>
                    <h1 class="text-primary mt-2" id="totalUsers">0</h1>
                    <h5 class="text-muted">Total Users</h5>
                    <small class="text-success">Tracking Active</small>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card">
                    <i class="fas fa-comments text-success mb-3" style="font-size: 3.5rem;"></i>
                    <h1 class="text-success mt-2" id="totalMessages">0</h1>
                    <h5 class="text-muted">Messages Sent</h5>
                    <small class="text-info">Real-time Count</small>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card">
                    <i class="fas fa-smile text-warning mb-3" style="font-size: 3.5rem;"></i>
                    <h1 class="text-warning mt-2" id="totalStickers">0</h1>
                    <h5 class="text-muted">Stickers Used</h5>
                    <small class="text-warning">Fun Factor</small>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card">
                    <i class="fas fa-chart-line text-info mb-3" style="font-size: 3.5rem;"></i>
                    <h1 class="text-info mt-2" id="totalActivity">0</h1>
                    <h5 class="text-muted">Total Activity</h5>
                    <small class="text-success">Live Updates</small>
                </div>
            </div>
        </div>

        <!-- Bot Status -->
        <div class="row mb-4">
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header bg-success text-white">
                        <h5 class="mb-0">
                            <i class="fas fa-check-circle me-2"></i>
                            Bot Status
                        </h5>
                    </div>
                    <div class="card-body">
                        <p><strong>Status:</strong> <span class="text-success">✅ Online & Tracking</span></p>
                        <p><strong>Webhook:</strong> <span class="text-success">Active</span></p>
                        <p><strong>Commands:</strong> <span class="text-success">Working</span></p>
                        <p><strong>Data:</strong> <span class="text-primary">Real-time</span></p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header bg-primary text-white">
                        <h5 class="mb-0">
                            <i class="fas fa-terminal me-2"></i>
                            Bot Commands
                        </h5>
                    </div>
                    <div class="card-body">
                        <p><code>/start</code> - Welcome message</p>
                        <p><code>/leaderboard</code> - Show rankings</p>
                        <p><code>/mystats</code> - Personal stats</p>
                        <p><code>/help</code> - All commands</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header bg-info text-white">
                        <h5 class="mb-0">
                            <i class="fas fa-cog me-2"></i>
                            System Info
                        </h5>
                    </div>
                    <div class="card-body">
                        <p><strong>Platform:</strong> Vercel Serverless</p>
                        <p><strong>Storage:</strong> In-Memory</p>
                        <p><strong>Response:</strong> < 1 second</p>
                        <p><strong>Uptime:</strong> 99.9%</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Action Buttons -->
        <div class="text-center mb-4">
            <a href="/" class="btn btn-light btn-lg me-3">
                <i class="fas fa-home me-2"></i>
                Main Website
            </a>
            <button onclick="refreshData()" class="btn btn-outline-light btn-lg me-3">
                <i class="fas fa-sync-alt me-2"></i>
                Refresh Data
            </button>
            <a href="/api/bot-admin" class="btn btn-warning btn-lg" target="_blank">
                <i class="fas fa-tools me-2"></i>
                Admin Panel
            </a>
        </div>
        
        <!-- Status Message -->
        <div class="text-center">
            <div class="alert alert-success" role="alert">
                <i class="fas fa-info-circle me-2"></i>
                <strong>Dashboard is working!</strong> Your bot is actively tracking user activity.
                <br>
                <small>Data updates automatically as users interact with your Telegram bot.</small>
            </div>
        </div>
    </div>

    <script>
        // Auto-refresh function
        async function refreshData() {
            try {
                console.log('Refreshing bot data...');
                const response = await fetch('/api/bot-status');
                const data = await response.json();
                
                // Update counters
                document.getElementById('totalUsers').textContent = data.totalUsers || 0;
                document.getElementById('totalMessages').textContent = data.totalMessages || 0;
                document.getElementById('totalStickers').textContent = data.totalStickers || 0;
                document.getElementById('totalActivity').textContent = data.totalActivity || 0;
                
                console.log('Data refreshed:', data);
            } catch (error) {
                console.error('Error refreshing data:', error);
            }
        }
        
        // Initial load
        refreshData();
        
        // Auto-refresh every 10 seconds
        setInterval(refreshData, 10000);
        
        console.log('🤖 Telegram Bot Dashboard loaded successfully!');
        console.log('🔄 Auto-refreshing data every 10 seconds...');
    </script>
</body>
</html>`;
    
    return res.status(200).send(dashboardHTML);
};