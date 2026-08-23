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

-- The staff roster comes from firp_website's server-side exports.
-- Set Config.UseWebsiteRoster = false and remove this line to run standalone.
dependency 'firp_website'

files {
    'html/audio.mp3',
    'html/video.webm',
    'html/index.html',
    'html/config.js',
    'html/assets/js/**',
    'html/assets/css/**',
    'html/assets/img/**'
}