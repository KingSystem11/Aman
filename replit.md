# AeroX Music Bot

## Overview

AeroX Music is a Discord music bot powered by LavaLink, featuring high-quality audio playback from YouTube, Spotify, Apple Music, SoundCloud, and Deezer. The bot supports playlist management, favorites, audio filters, lyrics display, and queue management. It uses both slash commands and traditional prefix commands for user interaction.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Bot Framework
- **Discord.js v14** - Core Discord API wrapper for bot functionality
- **Poru** - LavaLink client for music streaming and playback
- **poru-spotify** - Spotify integration plugin for Poru

### Entry Point
- `index.js` redirects to `GlimpZ/index.js` which initializes the Discord client, Poru music system, and loads commands/events

### Command System
- **Dual command support**: Both slash commands (`/commands`) and prefix commands (default prefix: `.`)
- **Slash commands** located in `GlimpZ/commands/`
- **Prefix commands** located in `GlimpZ/pCommands/`
- Per-guild prefix customization stored in `GlimpZ/prefixes.json`

### Music System
- **LavaLink integration** via Poru for audio streaming
- **Spotify support** through poru-spotify plugin
- **Multi-platform support**: YouTube, Spotify, Apple Music, SoundCloud, Deezer (via LavaSrc plugin on Lavalink server)
- Platform detection in `GlimpZ/commands/play.js` with `detectPlatform()` and `isPlaylistUrl()` helpers
- Music events handled in `GlimpZ/music/events.js`
- Features: play, pause, skip, queue, shuffle, loop, filters, autoplay, lyrics

### Data Persistence
- **SQLite database** via Sequelize ORM
- Database file: `database/aerox_music.db`
- Models extend `BaseModel` class in `database/BaseModel.js`
- Stores user favorites, playlists, and premium data

### Visual Components
- **Custom music cards** generated using `@napi-rs/canvas`
- Card generation in `GlimpZ/helpers/MusicCard.js`
- Custom fonts loaded from project fonts directory
- **EmbedBuilder** used for all bot responses (converted from ContainerBuilder)

### Configuration
- Environment variables for sensitive data (tokens, API keys)
- `GlimpZ/config.js` centralizes configuration
- Emoji mappings in `GlimpZ/emojis.json`

### Helper Modules
- `GlimpZ/helpers/musicHelpers.js` - Duration formatting, progress bars, permission checks
- `GlimpZ/helpers/colorHelper.js` - Color conversion utilities

## External Dependencies

### Discord & Music
- **Discord.js v14** - Discord API interaction
- **Poru v5** - LavaLink music client
- **LavaLink** - External audio streaming server (configured via environment variables)
- **LavaSrc plugin** - Required on Lavalink server for Apple Music, SoundCloud, and Deezer support
- **Spotify API** - Track resolution (requires CLIENT_ID and CLIENT_SECRET)
- **Genius API** - Lyrics fetching

### Database
- **Sequelize** - ORM for database operations
- **SQLite3/better-sqlite3** - Local database storage

### Image Generation
- **@napi-rs/canvas** - Canvas API for generating music card images

### Environment Variables Required
- `BOT_TOKEN` - Discord bot token
- `CLIENT_ID` - Discord application client ID
- `LAVALINK_HOSTS`, `LAVALINK_PORTS`, `LAVALINK_PASSWORDS`, `LAVALINK_SECURES` - LavaLink connection
- `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` - Spotify API credentials
- `GENIUS_API_KEY` - Genius lyrics API