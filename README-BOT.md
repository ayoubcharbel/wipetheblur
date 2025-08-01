# Telegram Activity Tracker Bot

A Telegram bot that tracks user activity in group chats and maintains a persistent leaderboard system.

## Features

- 📝 **Message Tracking**: Awards 1 point per message
- 🎭 **Sticker Tracking**: Awards 1 point per sticker
- 🏆 **Leaderboard**: Shows top 10 users with detailed stats
- 💾 **Persistent Data**: Scores accumulate over time, never reset
- 🌐 **Web Ready**: Designed for hosting on web platforms
- 📊 **Personal Stats**: Users can check their individual statistics

## Commands

- `/start` - Welcome message and bot introduction
- `/leaderboard` - Display current rankings
- `/mystats` - Show personal activity statistics
- `/help` - Display help information

## Setup Instructions

### Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Bot**
   ```bash
   npm start
   ```

   For development with auto-restart:
   ```bash
   npm run dev
   ```

### Web Hosting Deployment

#### Option 1: Railway
1. Connect your GitHub repository to Railway
2. Railway will automatically detect the Node.js project
3. Set environment variables if needed
4. Deploy automatically

#### Option 2: Render
1. Connect your GitHub repository to Render
2. Choose "Web Service"
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Deploy

#### Option 3: Heroku
1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create your-bot-name`
4. Deploy: `git push heroku main`

#### Option 4: Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Deploy: `vercel`
3. Follow the prompts

## Configuration

The bot token is currently hardcoded in `bot.js`. For production, consider using environment variables:

```javascript
const BOT_TOKEN = process.env.BOT_TOKEN || 'your-token-here';
```

## Data Storage

- User data is stored in `userData.json`
- Data persists between bot restarts
- Automatic backups recommended for production

## API Endpoints

When hosted, the bot provides these endpoints:

- `GET /` - Bot status and basic info
- `GET /stats` - Aggregate statistics

## Bot Information

- **Token**: `8278016198:AAE5lKbas5dM8qMPM3M_o6X_h6g3W76sTzU`
- **Name**: Activity Tracker Bot
- **Purpose**: Track user activity and maintain leaderboards

## Scoring System

- **Messages**: 1 point each
- **Stickers**: 1 point each
- **Total Score**: Messages + Stickers
- **Persistence**: Scores never reset, accumulate indefinitely

## Usage

1. Add the bot to your Telegram group
2. Give it appropriate permissions to read messages
3. Users will automatically start earning points for activity
4. Use `/leaderboard` to see rankings
5. Use `/mystats` to check personal progress

## Technical Details

- **Runtime**: Node.js 16+
- **Dependencies**: 
  - `node-telegram-bot-api` - Telegram Bot API wrapper
  - `express` - Web server for hosting requirements
- **Storage**: JSON file (easily upgradeable to database)
- **Hosting**: Compatible with most Node.js hosting platforms

## Future Enhancements

- Database integration (MongoDB, PostgreSQL)
- Admin commands for moderators
- Activity charts and graphs
- Export leaderboard data
- Custom point values for different activities
- Time-based statistics (daily/weekly/monthly)