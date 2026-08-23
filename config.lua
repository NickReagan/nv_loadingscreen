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
