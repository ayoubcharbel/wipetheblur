# 🚀 Deployment Guide for wipetheblur.com

This guide will help you deploy both your Wipe the Blur website and Telegram bot on wipetheblur.com to keep the bot online 24/7.

## 🌐 What You'll Get

- ✅ Your existing Wipe the Blur website at `wipetheblur.com`
- ✅ Telegram bot running 24/7 on the same domain
- ✅ Bot admin panel at `wipetheblur.com/bot-admin`
- ✅ API endpoints for bot status and statistics
- ✅ Persistent data storage that survives restarts

## 📋 Prerequisites

1. **Domain Control**: You need access to wipetheblur.com DNS settings
2. **Node.js Hosting**: A hosting service that supports Node.js applications
3. **Git Repository**: Your code should be in a Git repository (GitHub recommended)

## 🔧 Recommended Hosting Platforms

### Option 1: Railway (Recommended) 🚄

**Why Railway?**
- Automatic deployments from GitHub
- Built-in domain management
- Excellent for Node.js apps
- Free tier available

**Steps:**
1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add Telegram bot integration"
   git push origin main
   ```

2. **Deploy on Railway**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub
   - Click "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect Node.js and deploy

3. **Configure Custom Domain**
   - In Railway dashboard, go to your project
   - Click "Settings" → "Domains"
   - Add `wipetheblur.com`
   - Update your DNS to point to Railway's provided address

### Option 2: Render 🎨

**Steps:**
1. **Create Web Service**
   - Go to [render.com](https://render.com)
   - Connect your GitHub repository
   - Choose "Web Service"
   - Set build command: `npm install`
   - Set start command: `npm start`

2. **Configure Domain**
   - In Render dashboard, go to "Settings"
   - Add custom domain: `wipetheblur.com`
   - Update your DNS A record to Render's IP

### Option 3: Render (Recommended) ⚡

**Steps:**
1. **Deploy to Render**
   - Connect your GitHub repository to Render
   - Set build command: `npm install`
   - Set start command: `npm start`
   - Add environment variable: `BOT_TOKEN=your_bot_token`

2. **Configure Domain**
   - In Render dashboard, add custom domain `wipetheblur.com`
   - Update DNS as instructed

### Option 4: DigitalOcean App Platform 🌊

**Steps:**
1. **Create App**
   - Go to DigitalOcean App Platform
   - Connect GitHub repository
   - Choose Node.js environment

2. **Custom Domain**
   - Add `wipetheblur.com` in app settings
   - Update DNS records

## 🏗️ Environment Setup

For production, it's recommended to use environment variables:

1. **Create `.env` file** (don't commit this):
   ```env
   BOT_TOKEN=your_telegram_bot_token_here
   PORT=3000
   NODE_ENV=production
   ```

2. **Update bot.js** to use environment variables:
   ```javascript
   const BOT_TOKEN = process.env.BOT_TOKEN;
   ```

3. **Set environment variables** in your hosting platform's dashboard

## 📝 DNS Configuration

Once your app is deployed, update your DNS:

**A Record (for IP-based hosting):**
```
Type: A
Name: @
Value: [Your hosting IP]
TTL: 300
```

**CNAME Record (for domain-based hosting):**
```
Type: CNAME
Name: @
Value: [Your hosting domain]
TTL: 300
```

## 🔄 Testing Your Deployment

1. **Website Test**
   - Visit `wipetheblur.com`
   - Verify your product website loads correctly
   - Check that all features work (color selection, modals, etc.)

2. **Bot Status Test**
   - Visit `wipetheblur.com/bot-status`
   - Should return JSON with bot status

3. **Bot Admin Test**
   - Visit `wipetheblur.com/bot-admin`
   - Should show admin dashboard
   - Click "Bot Admin" in your website navigation

4. **Telegram Bot Test**
   - Add your bot to a Telegram group
   - Send `/start` command
   - Send some messages and stickers
   - Check `/leaderboard` command

## 🛠️ Local Testing Before Deployment

```bash
# Install dependencies
npm install

# Start the application locally
npm start

# Test locally at:
# - http://localhost:3000 (your website)
# - http://localhost:3000/bot-admin (bot admin)
# - http://localhost:3000/bot-status (bot status API)
```

## 📊 Monitoring Your Bot

### Real-time Monitoring
- Bot admin panel auto-refreshes every 30 seconds
- Check active users, message counts, and leaderboard
- Monitor bot uptime and status

### API Endpoints for Monitoring
- `GET /bot-status` - Bot health check
- `GET /bot-stats` - Detailed statistics
- `GET /bot-admin` - Visual admin dashboard

## 🔐 Security Considerations

1. **Environment Variables**: Store bot token in environment variables
2. **Data Backup**: Regularly backup `userData.json`
3. **Access Control**: Consider adding authentication to `/bot-admin`
4. **HTTPS**: Ensure your domain uses SSL certificate (most platforms provide this)

## 🐛 Troubleshooting

### Bot Not Responding
1. Check logs in hosting platform dashboard
2. Verify bot token is correct
3. Ensure bot has proper permissions in Telegram group

### Website Not Loading
1. Check if all static files are being served correctly
2. Verify DNS propagation (can take up to 24 hours)
3. Check hosting platform status

### Data Not Persisting
1. Ensure hosting platform supports persistent file storage
2. Consider upgrading to database storage for production

## 📈 Scaling for High Activity Groups

For groups with high activity (>1000 messages/day):

1. **Database Migration**: Consider migrating from JSON to PostgreSQL or MongoDB
2. **Caching**: Implement Redis for faster leaderboard access
3. **Rate Limiting**: Add rate limiting for API endpoints
4. **Load Balancing**: Use multiple instances if needed

## 🎯 Success Checklist

- [ ] Website loads at `wipetheblur.com`
- [ ] Bot admin accessible at `wipetheblur.com/api/bot-admin`
- [ ] Bot responds to Telegram commands
- [ ] Leaderboard updates in real-time
- [ ] Data persists after restarts
- [ ] Custom domain properly configured
- [ ] SSL certificate active

## 🆘 Need Help?

If you encounter issues:
1. Check hosting platform logs
2. Test locally first with `npm start`
3. Verify all environment variables are set
4. Check DNS propagation status

Your bot will now be online 24/7 at wipetheblur.com! 🎉