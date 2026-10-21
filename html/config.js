/*=================================================================*\
/* By: 			|	Nevera Development  							|
/* FiveM: 		|	https://forum.cfx.re/u/neveradevelopment		|
/* Discord: 	|	https://discord.gg/NeveraDev/tw28AqrgWU  		|
/*=================================================================*/
/* If you have any problems you can contact us via discord. <3     */


// FALLBACK staff list.
// With Config.UseWebsiteRoster = true (config.lua) the live roster from
// firp_website replaces this a moment after the loading screen appears. This
// list is what players see if the website is down, firp_website is not started,
// or the roster is turned off — so it is worth keeping roughly current.
var staff_team = [

	{
		"name":"Nick Reagan",
		"image":"https://forum.cfx.re/user_avatar/forum.cfx.re/nickreagan/144/3658060_2.png",
		"rank":"Owner"
	},
	{
		"name":"Finn Orion",
		"image":"https://r2.fivemanage.com/7UKKaqWubHwrVe71HHqee/finn-pfp.jpg",
		"rank":"Owner"
	},
	{
		"name":"Pie",
		"image":"https://r2.fivemanage.com/7UKKaqWubHwrVe71HHqee/pie-pfp.jpg",
		"rank":"Executive Director"
	}

]

const tipsConfig = [
    {
        title: "Tip 1 (short)",
        text: "Always wear your seatbelt when driving in Los Santos.",
        img: "https://placehold.co/314x176/EEE/31343C",
        timeout: 10 // seconds
    },
    {
        title: "Tip 2 (long)",
        text: "Explore different jobs on the server, like taxi driving, delivery missions, or even criminal activities. Each job has its own rewards and risks. Remember to manage your time wisely, avoid unnecessary conflicts, and cooperate with other players to maximize your gains and enjoy the roleplay experience to the fullest. Take advantage of special events and seasonal activities to earn unique rewards. Always keep an eye on the map for dynamic missions and spontaneous opportunities, and make sure your character is properly equipped for any challenge that comes your way. Building relationships with other players can also unlock new roles and adventures, making every session unpredictable and exciting.",
        img: "https://placehold.co/314x176/EEE/31343C",
        timeout: 10 // seconds
    },
    {
        title: "Tip 3 (empty-image)",
        text: "Keep backup gear: weapons, vehicles, and medical kits are essential for surviving unexpected situations.",
        img: "",
        timeout: 10 // seconds
    },
    {
        title: "Tip 4 (no image)",
        text: "Read the server rules carefully and respect roleplay guidelines. Following the rules ensures a better experience for everyone.",
        timeout: 10 // seconds
    },
    {
        title: "Tip 5 (local-image)",
        text: "Keep backup gear: weapons, vehicles, and medical kits are essential for surviving unexpected situations.",
        img: "/tips/tip1.jpg",
        timeout: 10 // seconds
    },
];



// Staff Settings
const showStaffTeam = true
const showTipList = true

// Donators (under the staff team). The list itself comes from Discord roles —
// see Config.Donators in config.lua. Nothing is shown until that list arrives.
const showDonators = true
const donatorsTitle = "Donators"


// orange
// red
// blue
// green
// pink
// purple
const theme = "blue"

// ==== WINTER UPDATE !! ==== \\
const enableWinterUpdate = false
// ==== WINTER UPDATE !! ==== \\


// Text settings
const name = "<strong>FREE</strong>ISLAND"
const underName = "ROLE<b>PLAY</b>"
const desc = "Free Island RP or FIRP is a vMenu server focused on serious roleplay. While maintaining a fun and friendly environment, we strive to create a unique experience for our players. We are a community that values quality roleplay and we are always looking for new members to join us on our journey. We have a wide variety of jobs, activities, and events for our players to enjoy. Whether you're a seasoned roleplayer or new to the scene, Free Island RP has something for everyone. Join us today and become a part of our growing community!"


// Social media
const discord = "https://discord.gg/2ADyyJbA5K"  // If = "" then icon will not show up on screen
const instagram = ""	// https://example.com
const youtube = "" 		// https://example.com
const twitter = "" 		// https://example.com
const tiktok = ""  		// https://example.com
const facebook = ""		// https://example.com
const twitch = "" 		// https://example.com
const github = "" 		// https://example.com


// Music credit (bottom right corner)
const musicCreditText = "Music by"		// If = "" then the credit will not show up on screen
const musicCreditName = "Synetics"		// The linked part of the credit
const musicCreditLink = "https://synetics.bandcamp.com/album/the-hertzium-protocol"	// If = "" then the name is shown as plain text


// Video Settings
const videoBlur = 0
var videoOpacity = 0.3


// Example link: https://www.youtube.com/watch?v=abcdefgh
const youtubeVideo = ""
const showYoutubeVideo = false

// Local Video
const enableLocalVideo = false

// Local audio
const localAudio = true

// The files in the "html/audio" folder to play. The page cannot look inside the
// folder by itself, so every file has to be listed here.
// "name" and "link" are that track's music credit; leave them out to use the
// musicCreditName / musicCreditLink above.
// With more than one track, skip buttons appear next to the pause button.
const localTracks = [
	{ file: "audio.mp3", name: "Synetics", link: "https://synetics.bandcamp.com/album/the-hertzium-protocol" },
	// { file: "another-song.mp3", name: "Artist", link: "https://example.com" },
]
const shuffleLocalTracks = true		// true: a random order on each join, false: the order above

// Staff / donator lists too long for the screen scroll by themselves.
// Rows per second; 0 turns the automatic scrolling off (the mouse wheel still works).
const listScrollSpeed = 0.4

// Starting volume, 0 - 100
const defaultVolume = 25

// Radio
// If radioEnabled is true, the loading screen plays the radio stream instead of
// "audio.mp3", and the music credit shows the artist currently on air.
// With localAudio also true, a button next to the volume slider switches between
// the two, and "audio.mp3" takes over by itself if the stream cannot be played.
const radioEnabled = true
// With radioEnabled and localAudio both true: true picks the radio or "audio.mp3"
// at random (50/50) on each join, false always starts on the radio.
const randomAudioSource = true
const radioName = "OOC Radio"						// Shown as the credit until the artist is known
const radioLink = "https://oocradio.com"			// Where the credit links to while the radio is playing
const radioStreamUrl = "https://radio.oocradio.com/"



// HELP //

//-- YOUTBE
//-- LOCAL AUDIO
// if localAudio is true, then loading will load "audio.mp3" file and play it except youtube audio.
// if localAudio is false, then loading will load youtube audio.

//-- LOCAL VIDEO
// if enableLocalVideo is true, then loading will load "video.webm" file and play it except youtube video.
// If localVideo is enabled, showYoutubeVideo is automatically disabled.
// You can only import a video from either YouTube or local. Local video taking priority.