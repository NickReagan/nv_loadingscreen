-- Server/client side settings for the loading screen.
-- The NUI page has its own settings in html/config.js — this file is only for
-- things Lua needs, because Lua cannot read config.js.

Config = {}

-- Pull the staff list from the website via exports.firp_website.
-- When false (or when firp_website is missing/unreachable) the loading screen
-- falls back to the hardcoded staff_team list in html/config.js.
Config.UseWebsiteRoster = true

-- How many staff to show, most senior first. The staff panel is a fixed-width
-- column, so an unbounded roster will overflow it. 0 = no limit.
Config.MaxStaffShown = 8

-- How long the client will accept a roster reply for, in milliseconds.
--
-- The loading screen never sits and waits: the fallback list from config.js is
-- drawn immediately and swapped for the real roster when it arrives. This is
-- the deadline after which a late reply is IGNORED rather than swapped in —
-- names rearranging themselves under the player half a minute into the load
-- reads as a glitch, and by then they have already read the list.
Config.FetchTimeout = 5000

-- DONATORS — a second list under the staff team, read from Discord by role.
--
-- The bot token is a SECRET and does not go in this file (a shared script is
-- sent to every client). Put it in server.cfg instead, with `set`, never `setr`:
--
--     set nv_loadingscreen_discord_token "the-bot-token"
--
-- The bot must be in the guild and have the SERVER MEMBERS INTENT switched on
-- in the Discord developer portal — listing who holds a role needs it, and
-- without it Discord answers 403 and the donators panel simply stays hidden.
Config.Donators = {
    Enabled = true,

    -- The Discord server (guild) id. Empty = feature off.
    GuildId = "",

    -- Donator roles, HIGHEST TIER FIRST. Someone holding several is listed once,
    -- under the first one that matches. Ids are strings — they are too long to
    -- be safe as numbers. `label` is what is shown next to the name.
    Roles = {
        -- { id = "123456789012345678", label = "Platinum" },
        -- { id = "123456789012345678", label = "Gold" },
        -- { id = "123456789012345678", label = "Supporter" },
    },

    -- How many donators to show, highest tier first. 0 = no limit (the list
    -- scrolls).
    MaxShown = 20,

    -- How long the member list is kept before asking Discord again.
    CacheSeconds = 300,
}

-- OOC RADIO — the "Music by" credit follows the track on air while the loading
-- screen is playing the radio (see radioEnabled in html/config.js; the stream
-- itself is played by the page and needs nothing from here).
--
-- The track info comes from the website's own cached now-playing route, so the
-- OOC Radio API key stays on the website and its 60 req/min budget is shared
-- rather than spent twice.
Config.Radio = {
    Enabled = true,

    -- Empty = <firp_website_url convar>/api/public/radio/now-playing, the same
    -- site firp_website talks to. Set a full URL here to point somewhere else.
    NowPlayingUrl = "",

    -- How often each loading client asks for the current track, in seconds. The
    -- server answers from a cache, so this is not a request to the website per
    -- player.
    PollSeconds = 15,
}

-- Prints to the server console what was fetched and what each joining player
-- was handed. Turn off once the lists are showing up.
Config.Debug = true
