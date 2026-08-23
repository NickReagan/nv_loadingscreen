AddEventHandler("playerSpawned", function()
    print("[NV] - Loading Screen Off ")
    ShutdownLoadingScreen()
    ShutdownLoadingScreenNui()
end)

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

    -- SendLoadingScreenMessage returns false while the page is still coming up,
    -- which is a normal race on a cold join rather than a failure — the request
    -- goes out the moment this resource starts, and the NUI may not have run
    -- script.js yet. Retry inside the deadline we are already honouring.
    CreateThread(function()
        local payload = json.encode({ eventName = 'setStaff', staff = staff })
        while GetGameTimer() <= deadline do
            if SendLoadingScreenMessage(payload) then return end
            Wait(100)
        end
        print("[NV] - Staff roster arrived but the loading screen NUI never accepted it.")
    end)
end)

CreateThread(function()
    deadline = GetGameTimer() + (tonumber(Config and Config.FetchTimeout) or 5000)
    TriggerServerEvent('nv_loadingscreen:requestStaff')
end)
