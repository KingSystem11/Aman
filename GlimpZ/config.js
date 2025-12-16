module.exports = {
    BOT_TOKEN: process.env.BOT_TOKEN,
    CLIENT_ID: process.env.CLIENT_ID,
    OWNER_ID: process.env.OWNER_ID || '1113808268960206928',
    PREFIX: '!',
    
    LAVALINK: {
        HOSTS: process.env.LAVALINK_HOSTS || 'lava-v4.ajieblogs.eu.org',
        PORTS: process.env.LAVALINK_PORTS || '443',
        PASSWORDS: process.env.LAVALINK_PASSWORDS || 'https://dsc.gg/ajidevserver',
        SECURES: process.env.LAVALINK_SECURES || 'true'
    },
    
    MUSIC: {
        DEFAULT_PLATFORM: 'ytsearch',
        AUTOCOMPLETE_LIMIT: 5,
        PLAYLIST_LIMIT: 3,
        ARTWORK_STYLE: 'MusicCard',
        SOURCES: {
            YOUTUBE: true,
            SPOTIFY: true,
            APPLE_MUSIC: true,
            SOUNDCLOUD: true,
            DEEZER: true
        }
    },
    
    SPOTIFY: {
        CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
        CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET
    },
    
    GENIUS: {
        API_KEY: process.env.GENIUS_API_KEY
    }
};
