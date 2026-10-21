local loading = true

AddEventHandler("playerSpawned", function()
    print("[NV] - Loading Screen Off ")
    loading = false
    ShutdownLoadingScreen()
    ShutdownLoadingScreenNui()
end)

-- SendLoadingScreenMessage returns false while the page is still coming up,
-- which is a normal race on a cold join rather than a failure — the requests
-- go out the moment this resource starts, and the NUI may not have run
-- script.js yet. Retry until `deadline` (a GetGameTimer value).
local function sendToScreen(message, deadline, what)
    CreateThread(function()
        local payload = json.encode(message)
        while loading and GetGameTimer() <= deadline do
            if SendLoadingScreenMessage(payload) then return end
            Wait(100)
        end
        if loading then
            print(("[NV] - %s arrived but the loading screen NUI never accepted it."):format(what))
        end
    end)
end

-- Staff roster: server.lua owns the firp_website exports (they are server-side
-- only), so all we do is ask for the list and pass it through to the NUI page.
local deadline = 0

RegisterNetEvent('nv_loadingscreen:setStaff', function(staff)
    if type(staff) ~= 'table' or #staff == 0 then return end
    if GetGameTimer() > deadline then
        -- Late reply. The fallback list has been on screen long enough that
        -- swapping it now would just look like the panel glitching.
        return
    end

    sendToScreen({ eventName = 'setStaff', staff = staff }, deadline, 'Staff roster')
end)

-- Donators have no fallback list to rearrange, so a late reply is still worth
-- drawing — no deadline beyond the NUI retry window.
RegisterNetEvent('nv_loadingscreen:setDonators', function(donators)
    if type(donators) ~= 'table' or #donators == 0 then return end
    sendToScreen({ eventName = 'setDonators', donators = donators }, GetGameTimer() + 5000, 'Donator list')
end)

RegisterNetEvent('nv_loadingscreen:setNowPlaying', function(nowPlaying)
    if type(nowPlaying) ~= 'table' then return end
    sendToScreen({ eventName = 'setNowPlaying', nowPlaying = nowPlaying }, GetGameTimer() + 5000, 'Radio now-playing')
end)

CreateThread(function()
    deadline = GetGameTimer() + (tonumber(Config and Config.FetchTimeout) or 5000)
    TriggerServerEvent('nv_loadingscreen:requestStaff')
    TriggerServerEvent('nv_loadingscreen:requestDonators')

    -- The track changes while the player is still loading, so this one repeats.
    local radio = Config and Config.Radio or {}
    if radio.Enabled == false then return end
    local interval = math.max(5, tonumber(radio.PollSeconds) or 15) * 1000
    while loading do
        TriggerServerEvent('nv_loadingscreen:requestNowPlaying')
        Wait(interval)
    end
end)
