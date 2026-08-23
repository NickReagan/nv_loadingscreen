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

RegisterNetEvent('nv_loadingscreen:requestStaff', function()
    local src = source

    if not rosterAvailable() then
        -- No reply at all: the client is already drawing the fallback list, so
        -- an empty push would only replace a good list with a worse one.
        return
    end

    exports.firp_website:GetStaffRoster(function(roster, err)
        if err or not roster then
            print(('[NV] - Staff roster unavailable (%s); the loading screen keeps its fallback list.')
                :format(err or 'no data'))
            return
        end

        TriggerClientEvent('nv_loadingscreen:setStaff', src, toStaffList(roster))
    end)
end)
