-- Fetches the staff roster from firp_website and hands it to the loading
-- screen. The exports are SERVER-SIDE ONLY, which is the whole reason this file
-- exists — client.lua cannot call them, so it asks us instead.
--
-- THIS IS A DISPLAY LIST AND GRANTS NOTHING. It is a cached copy of a Discord
-- role mapping and can be minutes old; see firp_website's README.

-- Read defensively: config.lua gets edited in place on the game server, so the
-- file this shipped its settings in is exactly the file that may not have them
-- after a deploy. A missing key means ON, matching firp_website's own rule.
local ENABLED = Config and Config.UseWebsiteRoster ~= false
local MAX_SHOWN = tonumber(Config and Config.MaxStaffShown) or 8

local function rosterAvailable()
    return ENABLED and GetResourceState('firp_website') == 'started'
end

--- Flatten the website's payload into what html/assets/js/script.js draws:
--- { name, image, rank }, the same shape as the fallback staff_team array.
---
--- Sorted and capped by `order`, not `level` — the README is explicit that
--- `level` is admin-picked, so it is neither dense nor unique and ties sort
--- arbitrarily. `order` is the website's display answer, computed once so every
--- consumer agrees.
local function toStaffList(roster)
    local members = {}
    for _, member in ipairs(roster.members or {}) do
        members[#members + 1] = member
    end

    table.sort(members, function(a, b)
        return (a.order or 0) < (b.order or 0)
    end)

    local list = {}
    for _, member in ipairs(members) do
        if MAX_SHOWN > 0 and #list >= MAX_SHOWN then break end
        list[#list + 1] = {
            -- username is nilable — someone who has never signed in to the
            -- website has none. Render defensively rather than printing "nil".
            name  = member.username or member.discordId,
            image = member.avatarUrl,
            -- roleLabel is the specific mapped Discord role (Co-Owner where the
            -- rank is Owner); it goes nil when the website is running on its
            -- allowlist fallback, hence the rankName behind it.
            rank  = member.roleLabel or member.rankName,
        }
    end
    return list
end

-- HANDOVER: the latest copy of everything the loading screen draws, handed to
-- the page at connect time (see playerConnecting at the bottom). A client
-- cannot exchange net events with us until it has nearly finished loading, so
-- the request events below only ever land at the end of the loading sequence —
-- they are a late refresh, and this table is what the player actually sees.
local handover = {}

-- Says what was fetched and what each joining player was handed. Set
-- Config.Debug = false in config.lua once the lists are showing up.
local DEBUG = Config and Config.Debug ~= false
local lastCount = {}

local function loaded(what, list)
    local count = type(list) == 'table' and #list or 0
    if DEBUG and lastCount[what] ~= count then
        print(('[NV] - %s: %d loaded.'):format(what, count))
    end
    lastCount[what] = count
end

-- Runs fn now-ish and then every `seconds`, keeping `handover` warm.
local function every(seconds, fn)
    CreateThread(function()
        Wait(2000)
        while true do
            -- An error here would end the thread and with it every later
            -- refresh — an export call throws if firp_website is mid-restart.
            local ok, err = pcall(fn)
            if not ok then print(('[NV] - Refresh failed: %s'):format(tostring(err))) end
            Wait(seconds * 1000)
        end
    end)
end

local staffFailing = false

local function loadStaff(cb)
    if not rosterAvailable() then
        -- No reply at all: the client is already drawing the fallback list, so
        -- an empty push would only replace a good list with a worse one.
        return
    end

    exports.firp_website:GetStaffRoster(function(roster, err)
        if err or not roster then
            -- Said once per outage, not once per refresh.
            if not staffFailing then
                print(('[NV] - Staff roster unavailable (%s); the loading screen keeps its fallback list.')
                    :format(err or 'no data'))
            end
            staffFailing = true
            return
        end
        staffFailing = false

        local list = toStaffList(roster)
        handover.staff = list
        loaded('Staff roster', list)
        if cb then cb(list) end
    end)
end

RegisterNetEvent('nv_loadingscreen:requestStaff', function()
    local src = source
    loadStaff(function(list)
        TriggerClientEvent('nv_loadingscreen:setStaff', src, list)
    end)
end)

every(60, loadStaff)

-- firp_website is not a manifest dependency (see fxmanifest.lua), so it may
-- start after us or be restarted under us. Pick the roster up again as soon as
-- it is back instead of waiting out the minute.
AddEventHandler('onResourceStart', function(resource)
    if resource ~= 'firp_website' then return end
    SetTimeout(3000, function() pcall(loadStaff) end)
end)

-- One cached, coalesced fetch: the upstream call happens once per TTL however
-- often it is asked for. cb(value) gets the freshest copy there is — the stale
-- one if a refresh failed (until it is older than maxStaleMs, when given), nil
-- when there is no usable answer.
local function cachedFetch(label, ttlMs, fetcher, maxStaleMs)
    local value, fetchedAt, pending, failing = nil, 0, nil, false

    return function(cb)
        if value and GetGameTimer() - fetchedAt < ttlMs then
            cb(value)
            return
        end
        if pending then
            pending[#pending + 1] = cb
            return
        end
        pending = { cb }

        local settled = false
        local function settle(result, err)
            if settled then return end
            settled = true
            if result then
                value, fetchedAt, failing = result, GetGameTimer(), false
            else
                -- Said once per outage, not once per refresh.
                if not failing then
                    print(('[NV] - %s unavailable (%s).'):format(label, err or 'no data'))
                end
                failing = true
                if maxStaleMs and GetGameTimer() - fetchedAt > maxStaleMs then value = nil end
            end
            local waiting = pending
            pending = nil
            for _, waiter in ipairs(waiting) do waiter(value) end
        end

        -- PerformHttpRequest's callback is not guaranteed to fire on a
        -- network-level failure, which would leave `pending` set forever.
        SetTimeout(10000, function() settle(nil, 'timeout') end)
        fetcher(settle)
    end
end

-- DONATORS: everyone in the Discord guild holding one of Config.Donators.Roles.
-- Same caveat as the staff roster — a cached display list that grants nothing.
local DONATORS = Config and Config.Donators or {}
local DONATORS_MAX = tonumber(DONATORS.MaxShown) or 20
local DISCORD_PAGE = 1000 -- Discord's maximum per request
local DISCORD_MAX_PAGES = 20

-- role id -> its position in Config.Donators.Roles (1 = highest tier)
local donatorTiers = {}
for index, role in ipairs(DONATORS.Roles or {}) do
    donatorTiers[tostring(role.id)] = index
end

local function donatorsAvailable()
    return DONATORS.Enabled ~= false
        and (DONATORS.GuildId or "") ~= ""
        and next(donatorTiers) ~= nil
        and GetConvar('nv_loadingscreen_discord_token', '') ~= ''
end

local function discordAvatar(member)
    local user = member.user
    if type(member.avatar) == 'string' then
        return ('https://cdn.discordapp.com/guilds/%s/users/%s/avatars/%s.png?size=64')
            :format(DONATORS.GuildId, user.id, member.avatar)
    end
    if type(user.avatar) == 'string' then
        return ('https://cdn.discordapp.com/avatars/%s/%s.png?size=64'):format(user.id, user.avatar)
    end
    return ('https://cdn.discordapp.com/embed/avatars/%d.png'):format(((math.tointeger(tonumber(user.id)) or 0) >> 22) % 6)
end

local function displayName(member)
    -- Not a loop over a list: a nil nickname would end ipairs before the rest.
    local function text(value)
        return type(value) == 'string' and value ~= '' and value or nil
    end
    return text(member.nick) or text(member.user.global_name) or text(member.user.username) or member.user.id
end

local getDonators = cachedFetch('Donators', (tonumber(DONATORS.CacheSeconds) or 300) * 1000, function(done)
    local headers = { Authorization = 'Bot ' .. GetConvar('nv_loadingscreen_discord_token', '') }
    local found = {}

    -- The member list is paged by user id, 1000 at a time.
    local function fetchPage(after, page)
        local url = ('https://discord.com/api/v10/guilds/%s/members?limit=%d&after=%s')
            :format(DONATORS.GuildId, DISCORD_PAGE, after)

        PerformHttpRequest(url, function(status, body)
            if status ~= 200 then
                -- 403 here is almost always the Server Members Intent being off.
                done(nil, 'discord http_' .. tostring(status))
                return
            end
            local ok, members = pcall(json.decode, body)
            if not ok or type(members) ~= 'table' then
                done(nil, 'bad_json')
                return
            end

            local last = after
            for _, member in ipairs(members) do
                last = member.user.id
                local tier
                for _, roleId in ipairs(member.roles or {}) do
                    local index = donatorTiers[roleId]
                    if index and (not tier or index < tier) then tier = index end
                end
                if tier and member.user.bot ~= true then
                    found[#found + 1] = {
                        tier  = tier,
                        name  = displayName(member),
                        image = discordAvatar(member),
                        rank  = DONATORS.Roles[tier].label or '',
                    }
                end
            end

            if #members == DISCORD_PAGE and page < DISCORD_MAX_PAGES then
                fetchPage(last, page + 1)
                return
            end

            table.sort(found, function(a, b)
                if a.tier ~= b.tier then return a.tier < b.tier end
                return a.name:lower() < b.name:lower()
            end)

            local list = {}
            for _, donator in ipairs(found) do
                if DONATORS_MAX > 0 and #list >= DONATORS_MAX then break end
                list[#list + 1] = { name = donator.name, image = donator.image, rank = donator.rank }
            end
            done(list)
        end, 'GET', '', headers)
    end

    fetchPage('0', 1)
end)

local function loadDonators(cb)
    if not donatorsAvailable() then return end

    getDonators(function(list)
        handover.donators = list
        loaded('Donators', list)
        if cb and list and #list > 0 then cb(list) end
    end)
end

RegisterNetEvent('nv_loadingscreen:requestDonators', function()
    local src = source
    loadDonators(function(list)
        TriggerClientEvent('nv_loadingscreen:setDonators', src, list)
    end)
end)

if donatorsAvailable() then
    -- Asked far more often than the cache expires; the TTL decides when
    -- Discord is actually called.
    every(30, loadDonators)
elseif DONATORS.Enabled ~= false and next(donatorTiers) ~= nil then
    print('[NV] - Donators are OFF: set Config.Donators.GuildId and the nv_loadingscreen_discord_token convar.')
end

-- OOC RADIO: what is on air, for the loading screen's "Music by" credit.
local RADIO = Config and Config.Radio or {}

local function nowPlayingUrl()
    if (RADIO.NowPlayingUrl or "") ~= "" then return RADIO.NowPlayingUrl end
    return GetConvar('firp_website_url', 'http://127.0.0.1:3001') .. '/api/public/radio/now-playing'
end

-- Shorter than the client poll, so a poll is what drives a refresh.
local getNowPlaying = cachedFetch('Radio now-playing', 10000, function(done)
    PerformHttpRequest(nowPlayingUrl(), function(status, body)
        if status ~= 200 then
            done(nil, 'http_' .. tostring(status))
            return
        end
        local ok, data = pcall(json.decode, body)
        if not ok or type(data) ~= 'table' then
            done(nil, 'bad_json')
            return
        end
        if not data.configured then
            done(nil, 'the website has no OOC_RADIO_API_KEY')
            return
        end
        done({
            artist = type(data.artist) == 'string' and data.artist or nil,
            title  = type(data.trackTitle) == 'string' and data.trackTitle or nil,
            live   = data.live == true,
            djName = type(data.djName) == 'string' and data.djName or nil,
        })
    end, 'GET', '', {})
end, 60000) -- a track credit older than a minute is worse than none

local function loadNowPlaying(cb)
    if RADIO.Enabled == false then return end

    getNowPlaying(function(nowPlaying)
        handover.nowPlaying = nowPlaying
        if cb and nowPlaying then cb(nowPlaying) end
    end)
end

RegisterNetEvent('nv_loadingscreen:requestNowPlaying', function()
    local src = source
    loadNowPlaying(function(nowPlaying)
        TriggerClientEvent('nv_loadingscreen:setNowPlaying', src, nowPlaying)
    end)
end)

if RADIO.Enabled ~= false then
    every(math.max(5, tonumber(RADIO.PollSeconds) or 15), loadNowPlaying)
end

-- Reaches the page as window.nuiHandoverData.nvLoadingscreen before it draws
-- anything. Handover data is merged across resources, hence the single key.
-- Must be called synchronously here, which is why `handover` is kept warm
-- instead of being fetched on demand.
AddEventHandler('playerConnecting', function(name, _, deferrals)
    deferrals.handover({ nvLoadingscreen = handover })
    if DEBUG then
        print(('[NV] - %s connecting: handed over %d staff, %d donators.')
            :format(tostring(name), handover.staff and #handover.staff or 0, handover.donators and #handover.donators or 0))
    end
end)
