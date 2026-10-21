fx_version 'cerulean'
game 'gta5'
lua54 'yes'

author 'Nevera Development'
description '[FREE] Loading Screen'
version '1.2'

loadscreen_manual_shutdown "yes"
loadscreen 'html/index.html'
loadscreen_cursor "yes"

shared_script "config.lua"
client_script "client.lua"
server_script "server.lua"

-- The staff roster comes from firp_website's server-side exports, but it is
-- deliberately NOT a `dependency`: FXServer stops every dependent resource when
-- its dependency stops, and does not start it again — so each restart of
-- firp_website would silently take the loading screen down with it. server.lua
-- checks at runtime whether firp_website is running instead.

files {
    'html/audio/**',
    'html/video.webm',
    'html/index.html',
    'html/config.js',
    'html/assets/js/**',
    'html/assets/css/**',
    'html/assets/img/**'
}