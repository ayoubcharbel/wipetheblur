document.addEventListener('DOMContentLoaded', function() {
    // Initial bot data (will be updated from API)
    let botData = {
        status: 'Bot is running!',
        totalUsers: 0,
        totalMessages: 0,
        totalStickers: 0,
        totalActivity: 0,
        botActive: true,
        timestamp: new Date().toISOString()
    };

    console.log('🚀 Page loaded, will fetch live data from API:', botData);

    // Function to fetch bot status from API
    async function fetchBotStatus() {
        try {
            console.log('🔄 Attempting to fetch from API...');
            
            const response = await fetch('/bot-status', {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('📊 API Response:', data);
            
            if (data && typeof data === 'object') {
                // Always update with API data (even if zeros)
                botData = {
                    status: data.status || 'Bot is running!',
                    totalUsers: data.totalUsers || 0,
                    totalMessages: data.totalMessages || 0,
                    totalStickers: data.totalStickers || 0,
                    totalActivity: data.totalActivity || 0,
                    botActive: data.botActive !== false,
                    timestamp: data.timestamp || new Date().toISOString()
                };
                console.log('✅ Updated with API data:', botData);
            }
            
            return true;
        } catch (error) {
            console.error('Error fetching bot status:', error);
            
            // Update with error state
            botData = {
                status: 'Connection Error',
                totalUsers: '-',
                totalMessages: '-',
                totalStickers: '-',
                totalActivity: '-',
                botActive: false,
                timestamp: new Date().toISOString()
            };
            return false;
        }
    }

    // Update all UI elements with current bot data
    function updateUI() {
        // Update hero stats
        const totalUsersEl = document.getElementById('totalUsers');
        const totalMessagesEl = document.getElementById('totalMessages');
        const totalStickersEl = document.getElementById('totalStickers');
        const totalActivityEl = document.getElementById('totalActivity');
        const botStatusEl = document.getElementById('botStatus');

        if (totalUsersEl) totalUsersEl.textContent = botData.totalUsers;
        if (totalMessagesEl) totalMessagesEl.textContent = botData.totalMessages;
        if (totalStickersEl) totalStickersEl.textContent = botData.totalStickers;
        if (totalActivityEl) totalActivityEl.textContent = botData.totalActivity;
        if (botStatusEl) {
            botStatusEl.textContent = botData.status;
            botStatusEl.className = 'badge ' + (botData.botActive ? 'bg-success' : 'bg-danger');
        }

        // Update other stats sections
        const userCountEls = document.querySelectorAll('.user-count');
        const messageCountEls = document.querySelectorAll('.message-count');
        const activityCountEls = document.querySelectorAll('.activity-count');

        userCountEls.forEach(el => el.textContent = botData.totalUsers);
        messageCountEls.forEach(el => el.textContent = botData.totalMessages);
        activityCountEls.forEach(el => el.textContent = botData.totalActivity);

        console.log('✅ UI updated with data:', {
            users: botData.totalUsers,
            messages: botData.totalMessages,
            activity: botData.totalActivity,
            status: botData.status
        });
    }

    // Initialize bot status
    async function initBotStatus() {
        console.log('🔄 Initializing bot status...');
        updateUI(); // Update with initial confirmed data
        
        try {
            await fetchBotStatus();
            updateUI(); // Update again with fresh API data if available
        } catch (error) {
            console.error('Failed to fetch fresh bot status:', error);
        }
    }

    // Periodic status updates
    function startPeriodicUpdates() {
        // Update every 30 seconds
        setInterval(async () => {
            console.log('🔄 Periodic update...');
            try {
                await fetchBotStatus();
                updateUI();
            } catch (error) {
                console.error('Periodic update failed:', error);
            }
        }, 30000);
    }

    // Show notifications about bot activity
    function showBotNotification() {
        const messages = [
            '🚀 Join our Telegram group and start chatting!',
            '📊 Your activity is being tracked in real-time!',
            '🏆 Compete for the top spot on our leaderboard!',
            '🎯 Every message and sticker counts towards your score!',
            '💬 Use /mystats to see your current ranking!',
            '📈 Use /leaderboard to see all participants!'
        ];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'alert alert-info alert-dismissible fade show position-fixed';
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 300px;';
        notification.innerHTML = `
            ${randomMessage}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification && notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // Initialize everything
    initBotStatus();
    startPeriodicUpdates();

    // Navbar scroll behavior
    let lastScrollTop = 0;
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down
            navbar.style.transform = 'translateY(-100%)';
        } else {
            // Scrolling up
            navbar.style.transform = 'translateY(0)';
        }
        lastScrollTop = scrollTop;
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.feature-card, .stat-card, .hero-content').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Copy to clipboard functionality
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            // Show success message
            const alert = document.createElement('div');
            alert.className = 'alert alert-success position-fixed';
            alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999;';
            alert.textContent = 'Copied to clipboard!';
            document.body.appendChild(alert);
            
            setTimeout(() => alert.remove(), 2000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    }

    // Add copy buttons to code elements
    document.querySelectorAll('code').forEach(codeEl => {
        if (codeEl.textContent.trim()) {
            const copyBtn = document.createElement('button');
            copyBtn.className = 'btn btn-sm btn-outline-secondary ms-2';
            copyBtn.textContent = 'Copy';
            copyBtn.onclick = () => copyToClipboard(codeEl.textContent);
            codeEl.parentNode.appendChild(copyBtn);
        }
    });

    // Show first notification after 5 seconds
    setTimeout(showBotNotification, 5000);

    // Show subsequent notifications every 45 seconds
    setInterval(showBotNotification, 45000);
});

// Initialize tooltips
var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
var tooltipList = tooltipTriggerList.map(function(tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
});