/*=================================================================*\
/* By: 			|	Nevera Development  							|
/* FiveM: 		|	https://forum.cfx.re/u/neveradevelopment		|
/* Discord: 	|	https://discord.gg/NeveraDev/tw28AqrgWU  		|
/*=================================================================*/
/* If you have any problems you can contact us via discord. <3     */


$(".center h1").html(name)
$(".center p").html(underName)
$(".center span").html(desc)
var serverInfo = null
function loading(num){
	let current = parseInt($(".loading-bar p").text(), 10) || 0;
	const step = 1;
	const delay = 700 / Math.abs(num - current);

	const interval = setInterval(function(){
		if (current < num) {
			current += step;
			if (current > num) current = num;
		} else if (current > num) {
			current -= step;
			if (current < num) current = num;
		} else {
			clearInterval(interval);
		}
		$(".loading-bar p").text(current + "%");
	}, delay);
	
	$(".loading-bar .line").width(num + "%");
}

// Names and track info come from Discord and the radio, so they are text, not HTML.
function escapeHtml(value){
	return String(value == null ? "" : value)
		.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;").replace(/'/g, "&#39;")
}

function render_staff(list, target = ".staff_team"){
	$(target).empty()
	list.forEach(function(user){
		$(target).append(`
			<div class="staff">
				<div class="info">
					<img src="${escapeHtml(user.image)}" class="pfp">
					<p>${escapeHtml(user.name)}</p>
				</div>
				<p class="status">${escapeHtml(user.rank)}</p>
			</div>
		`)
	})
}

if (showStaffTeam){
	$(".panel.staffteam").show()
	$(".staff-section").show()
	// The hardcoded fallback. If the website roster is enabled and reachable,
	// client.lua replaces this with the live list a moment later.
	render_staff(staff_team)
}

// Donators have no fallback list: the section stays hidden until server.lua
// sends the members holding a donator role.
function render_donators(list){
	$(".donator-section h3").text(donatorsTitle)
	render_staff(list, ".donators")
	$(".donator-section").show()
	$(".panel.staffteam").addClass("has-donators").show()
}

if (showTipList){
	$(".panel.panelInfo").show()
}

// Server data reaches the page twice: as handover data at connect time (see
// the end of this file), and again over net events once the client is nearly
// loaded in. Both go through here.
function apply_server_data(data){
	if (showStaffTeam && Array.isArray(data.staff) && data.staff.length) {
		render_staff(data.staff)
	}
	if (showDonators && Array.isArray(data.donators) && data.donators.length) {
		render_donators(data.donators)
	}
	if (data.nowPlaying && typeof data.nowPlaying === "object") {
		nowPlaying = data.nowPlaying
		render_music_credit()
	}
}

window.addEventListener('message', function(e) {
    if(e.data.eventName === 'loadProgress') {
    	var num = (e.data.loadFraction * 100).toFixed(0)
        loading(num);
    }
    if(e.data.eventName === 'setStaff' || e.data.eventName === 'setDonators' || e.data.eventName === 'setNowPlaying') {
    	apply_server_data(e.data)
    }
});

const socials = { discord, instagram, youtube, twitter, tiktok, facebook, twitch, github };
const platforms = ["discord", "instagram", "youtube", "twitter", "tiktok", "facebook", "twitch", "github"];

platforms.forEach(platform => {
	if (socials[platform] != "") {
		$(`.${platform}`).show();
		$(`.${platform} a`).attr("href", socials[platform]);
	}
});

// Lists with more rows than room scroll by themselves: down a row at a time,
// a pause at the end, then quickly back to the top. Hovering a list or scrolling it by
// hand takes over; it carries on from wherever it was left.
const LIST_SCROLL_SPEED = typeof listScrollSpeed === "number" ? listScrollSpeed : 0.4	// rows per second
const LIST_SCROLL_HOLD = 2500	// ms spent resting at the top and at the bottom
const LIST_SCROLL_HANDS_OFF = 3000	// ms left alone after the user scrolls

const scrollingLists = $(".panel.left .list").toArray().map(function(el){
	const state = { el: el, pos: 0, holdUntil: LIST_SCROLL_HOLD, hovered: false, atEnd: false, returning: false }
	el.addEventListener("mouseenter", function(){ state.hovered = true })
	el.addEventListener("mouseleave", function(){ state.hovered = false; state.holdUntil = performance.now() + 1000 })
	el.addEventListener("wheel", function(){ state.returning = false; state.holdUntil = performance.now() + LIST_SCROLL_HANDS_OFF })
	return state
})

let listScrollLast = performance.now()
function scroll_lists(now){
	const dt = Math.min(now - listScrollLast, 100) / 1000
	listScrollLast = now
	scrollingLists.forEach(function(state){
		const el = state.el, max = el.scrollHeight - el.clientHeight
		el.classList.toggle("fade-top", el.scrollTop > 1)
		el.classList.toggle("fade-bottom", max - el.scrollTop > 1)

		// Moved by something other than us: the mouse wheel, or a re-render.
		if (Math.abs(el.scrollTop - state.pos) > 2 && now >= state.holdUntil) {
			state.holdUntil = now + LIST_SCROLL_HANDS_OFF
		}
		if (max <= 1 || state.hovered || now < state.holdUntil) {
			state.pos = el.scrollTop
			if (max <= 1 || state.hovered) { state.returning = false }
			return
		}
		if (state.pos >= max - 0.5) {
			if (!state.atEnd) {
				state.atEnd = true
				state.holdUntil = now + LIST_SCROLL_HOLD
				return
			}
			state.atEnd = false
			state.returning = true
		}
		if (state.returning) {
			// Back to the top, quickly, easing out as it gets there.
			state.pos -= (state.pos * 5 + 40) * dt
			if (state.pos <= 0) {
				state.pos = 0
				state.returning = false
				state.holdUntil = now + LIST_SCROLL_HOLD
			}
			el.scrollTop = state.pos
			return
		}
		state.atEnd = false
		const row = el.firstElementChild ? el.firstElementChild.offsetHeight : 30
		state.pos = Math.min(max, state.pos + row * LIST_SCROLL_SPEED * dt)
		el.scrollTop = state.pos
	})
	requestAnimationFrame(scroll_lists)
}
if (LIST_SCROLL_SPEED > 0) { requestAnimationFrame(scroll_lists) }

// Local tracks: the files in html/audio that config.js lists, as { file, name,
// link }. Played in order (shuffled once per join unless told otherwise).
const tracks = (typeof localTracks !== "undefined" && Array.isArray(localTracks) ? localTracks : ["audio.mp3"])
	.map(function(track){ return typeof track === "string" ? { file: track } : track })
	.filter(function(track){ return track && typeof track.file === "string" && track.file != "" })
if (typeof shuffleLocalTracks === "undefined" || shuffleLocalTracks) {
	for (let i = tracks.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[tracks[i], tracks[j]] = [tracks[j], tracks[i]]
	}
}
let trackIndex = 0, trackErrors = 0

// What the player chose last time (radio or local, which track, volume, mute),
// kept in this browser's storage and put back on the next join. Only choices
// the player made by hand are saved, so the config defaults still apply to
// anyone who never touched the controls.
const PREFS_KEY = "nv_loadingscreen_prefs"
const prefs = (function(){
	try {
		const saved = JSON.parse(localStorage.getItem(PREFS_KEY))
		return saved && typeof saved === "object" ? saved : {}
	} catch (e) {
		return {}
	}
})()

function save_pref(key, value){
	prefs[key] = value
	try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)) } catch (e) {}
}

if (typeof prefs.track === "string") {
	const savedTrack = tracks.findIndex(function(track){ return track.file === prefs.track })
	if (savedTrack >= 0) { trackIndex = savedTrack }
}

// Music credit
// While the radio is what is playing, the credit is the artist on air (the
// station name until the first track info arrives). Otherwise it is the
// current track's own credit, or the default one for tracks without any.
var onRadio = false, nowPlaying = null

function render_music_credit(){
	let creditName = typeof musicCreditName !== "undefined" ? musicCreditName : ""
	let creditLink = typeof musicCreditLink !== "undefined" ? musicCreditLink : ""
	const track = tracks[trackIndex]
	if (onRadio) {
		creditName = escapeHtml((nowPlaying && nowPlaying.artist) || radioName)
		creditLink = radioLink
	} else if (track && track.name) {
		creditName = escapeHtml(track.name)
		creditLink = track.link || ""
	}
	if (creditName == "") {
		$(".music-credit").hide()
		return
	}
	$(".music-credit .text").html(musicCreditText)
	$(".music-credit .name").html(creditName)
	if (creditLink != "") {
		$(".music-credit .name").attr("href", creditLink)
	} else {
		$(".music-credit .name").removeAttr("href")
	}
	$(".music-credit").css("display", "flex")
}
render_music_credit()

$("a").on("click",function(e){
	e.preventDefault()
	const url = $(e.currentTarget).attr("href")
	if (url && url != "/") window.invokeNative('openUrl', url)
})

if (theme == "orange"){
	$("body").append(`<style>:root{--main:255, 150, 0;}</style>`)
	$("body").css("background-image","url('assets/img/orange.jpg')")
	$(".winter").css("background","linear-gradient(0deg, rgb(255 150 0 / 10%) 0%, rgba(255, 150, 0, 0.0) 100%)")
}
if (theme == "red"){
	$("body").append(`<style>:root{--main:255,0,0;}</style>`)
	$("body").css("background-image","url('assets/img/red.jpg')")
	$(".winter").css("background","linear-gradient(0deg, rgb(255 0 0 / 10%) 0%, rgba(255, 0, 0, 0.0) 100%)")
}
if (theme == "blue"){
	$("body").append(`<style>:root{--main:0, 163, 255;}</style>`)
	$("body").css("background-image","url('assets/img/blue.jpg')")
	$(".winter").css("background","linear-gradient(0deg, rgb(0 163 255 / 10%) 0%, rgba(0, 163, 255, 0.0) 100%)")
}
if (theme == "green"){
	$("body").append(`<style>:root{--main:65, 255, 0;}</style>`)
	$("body").css("background-image","url('assets/img/green.jpg')")
	$(".winter").css("background","linear-gradient(0deg, rgb(65 255 0 / 10%) 0%, rgba(65, 255, 0, 0.0) 100%)")
}
if (theme == "pink"){
	$("body").append(`<style>:root{--main:255, 122, 237;}</style>`)
	$("body").css("background-image","url('assets/img/pink.jpg')")
	$(".winter").css("background","linear-gradient(0deg, rgb(255 122 237 / 10%) 0%, rgba(255, 122, 237, 0.0) 100%)")
}
if (theme == "purple"){
	$("body").append(`<style>:root{--main:193, 67, 255;}</style>`)
	$("body").css("background-image","url('assets/img/purple.jpg')")
	$(".winter").css("background","linear-gradient(0deg, rgb(193 67 255 / 10%) 0%, rgba(193, 67, 255, 0.0) 100%)")
}
// Winter update
if (enableWinterUpdate){
	particlesJS("particles-js", { "particles": { "number": { "value": 160, "density": { "enable": true, "value_area": 800 } }, "color": { "value": "#ffffff" }, "shape": { "type": "circle", "stroke": { "width": 0, "color": "#000000" }, "polygon": { "nb_sides": 5 }, "image": { "src": "img/github.svg", "width": 100, "height": 100 } }, "opacity": { "value": 0.5, "random": false, "anim": { "enable": false, "speed": 1, "opacity_min": 0.1, "sync": false } }, "size": { "value": 3, "random": true, "anim": { "enable": false, "speed": 40, "size_min": 0.1, "sync": false } }, "line_linked": { "enable": false, "distance": 150, "color": "#ffffff", "opacity": 0.4, "width": 1 }, "move": { "enable": true, "speed": 1.5, "direction": "bottom", "random": true, "straight": false, "out_mode": "out", "bounce": false, "attract": { "enable": true, "rotateX": 100, "rotateY": 1200 } } }, "interactivity": { "detect_on": "canvas", "events": { "onhover": { "enable": false, "mode": "repulse" }, "onclick": { "enable": false, "mode": "repulse" }, "resize": true }, "modes": { "grab": { "distance": 400, "line_linked": { "opacity": 1 } }, "bubble": { "distance": 400, "size": 40, "duration": 2, "opacity": 8, "speed": 3 }, "repulse": { "distance": 223.7762237762238, "duration": 0.4 }, "push": { "particles_nb": 4 }, "remove": { "particles_nb": 2 } } }, "retina_detect": true });
	$("body").css("background-image","url('assets/img/winter.jpg')")
	$(".winter").css("display","flex")
	$("#particles-js").css("opacity",1)
}

let a, vl, yt, isMute = false, isPaused = false;

if (youtubeVideo.startsWith("https://www.youtube.com")) {
	if (!enableLocalVideo){
		let videoId = youtubeVideo.split('/').pop().split('=')[1];
		if (!showYoutubeVideo){
			videoOpacity = 0

		}
		$("iframe").attr("src", `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&enablejsapi=1&disablekb=1`)
				   .css({ filter: `blur(${videoBlur}px)`, opacity: videoOpacity });
		if (showYoutubeVideo) $("body").css("background", "#000");
		if (enableLocalVideo){
			$("iframe").attr("src","")
		}
	}
}
// The <audio> element carries the sound whenever the radio or the local tracks
// are in use; the video / youtube background is then muted.
const hasLocalAudio = localAudio && tracks.length > 0
const useAudioPlayer = hasLocalAudio || radioEnabled

function playAudio() {
	const started = a[0].play();
	if (started && typeof started.catch === "function") { started.catch(function(){}); }
}

function setAudioSource(radio) {
	onRadio = radio;
	a[0].src = radio ? radioStreamUrl : "audio/" + encodeURI(tracks[trackIndex].file);
	// A single track repeats; several play one after another (see "ended").
	a[0].loop = !radio && tracks.length == 1;
	if (!isPaused) { playAudio(); }
	$(".radio-toggle").toggleClass("act", radio);
	// Nothing to skip to on the radio, or with one track.
	$(".track-skip").toggle(!radio && tracks.length > 1);
	render_music_credit();
}

function toggleRadio() {
	setAudioSource(!onRadio);
	save_pref("source", onRadio ? "radio" : "local");
}

// `auto` is a track ending by itself, which is not a choice worth remembering.
function skipTrack(step, auto) {
	if (onRadio || !a || !a[0]) return;
	// Back restarts the track first, and only goes to the previous one from its start.
	if (step < 0 && a[0].currentTime > 3) {
		a[0].currentTime = 0;
		return;
	}
	trackIndex = (trackIndex + step + tracks.length) % tracks.length;
	setAudioSource(false);
	if (!auto) { save_pref("track", tracks[trackIndex].file); }
}

if (useAudioPlayer) {
	$('body').append('<audio id="audioPlayer"></audio>');
	a = $('#audioPlayer');
	a.on("error", function(){
		if (onRadio) {
			// The stream is unreachable: fall back to the local tracks rather than silence.
			if (hasLocalAudio) { setAudioSource(false); } else { onRadio = false; render_music_credit(); }
			return;
		}
		// A missing or unplayable file: move on, but not round in circles if they all are.
		trackErrors++;
		if (trackErrors < tracks.length) {
			trackIndex = (trackIndex + 1) % tracks.length;
			setAudioSource(false);
		}
	});
	a.on("playing", function(){ trackErrors = 0; });
	a.on("ended", function(){ if (!onRadio) { skipTrack(1, true); } });
	if (radioEnabled && hasLocalAudio) { $(".radio-toggle").show(); }
	// With both sources on, each join picks one at random — unless the player
	// picked one themselves last time.
	const randomSource = typeof randomAudioSource === "undefined" || randomAudioSource;
	if (prefs.source === "radio" && radioEnabled) {
		setAudioSource(true);
	} else if (prefs.source === "local" && hasLocalAudio) {
		setAudioSource(false);
	} else {
		setAudioSource(radioEnabled && (!hasLocalAudio || !randomSource || Math.random() < 0.5));
	}
}

if (enableLocalVideo) {
	$('body').append('<video id="videoPlayer" autoplay loop><source src="video.webm" type="video/webm"></video>');
	$('#videoPlayer')[0].play();
	vl = $('#videoPlayer');
	if (useAudioPlayer){
		vl[0].muted = true
	}
	$("body").css("background", "#000");
}

function onYouTubeIframeAPIReady() {
	yt = new YT.Player('youtube-video', {
		events: { 'onReady': onPlayerReady }
	});
}

function onPlayerReady() {
	if (useAudioPlayer) { yt.mute(); } else { yt.setVolume($(".volume-slider").val()); }
}

function toggleMute(self) {
	$(self).toggleClass("act");
	isMute = !isMute;
	save_pref("muted", isMute);
	if (yt && typeof yt.mute === "function") {
		useAudioPlayer ? yt.mute() : (isMute ? yt.mute() : yt.unMute());
	}
	if (a && a[0]) { a[0].muted = isMute; }
	if (vl && vl[0]) { vl[0].muted = useAudioPlayer || isMute; }
}

function togglePause(self) {
	$(self).toggleClass("act");
	isPaused = !isPaused;
	if (yt && typeof yt.pauseVideo === "function" && typeof yt.playVideo === "function") {
		isPaused ? yt.pauseVideo() : yt.playVideo();
	}
	if (a && a[0]) {
		if (isPaused) {
			a[0].pause();
		} else {
			// A paused stream resumes from its buffer; reload to rejoin what is on air.
			if (onRadio) { a[0].load(); }
			playAudio();
		}
	}
	if (vl && vl[0]) { isPaused ? vl[0].pause() : vl[0].play()}
}


function setVolume(volume) {
	if (a && a[0]) { a[0].volume = volume / 100; }
	if (vl && vl[0]) { vl[0].volume = volume / 100; }
	if (yt && typeof yt.setVolume === "function" && yt.videoTitle !== "" && !useAudioPlayer) {
		yt.setVolume(volume);
	}

	$(".inpt span").text(volume + "%");
	$(".volume-slider").css({
		background: `rgba(var(--main), ${(volume / 100) + 0.2})`
	});
}

// Starting volume: the slider and the players have to agree from the first
// second, not only after the slider is first moved.
const savedVolume = typeof prefs.volume === "number" ? prefs.volume : (typeof defaultVolume === "number" ? defaultVolume : 25);
const startVolume = Math.max(0, Math.min(100, savedVolume));
$(".volume-slider").val(startVolume);
setVolume(startVolume);
// Saved when the slider is let go of, not on every step of the drag.
$(".volume-slider").on("change", function(){ save_pref("volume", Number(this.value)); });
if (prefs.muted === true) { toggleMute($('.mini-buttons button[onclick^="toggleMute"]')[0]); }

let currentTipIndex = 0;
let progressStartTime = 0;
let progressTimeout;
let paused = false;
let remaining = 0;

function load_tips(config) {
    const container = document.getElementById('tipsContainer');
    const dotsContainer = document.getElementById('dotsContainer');
    container.innerHTML = '';
    dotsContainer.innerHTML = '';

    config.forEach((tip, i) => {
        const panelItem = document.createElement('div');
        panelItem.classList.add('panelItem');
        panelItem.style.opacity = 0;
        var img = ""
        if (tip.img && tip.img != ""){img = `<img src="${tip.img}">`}
        if (tip.img == ""){img = `<img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=">`}
        if (tip.img && tip.img.startsWith("/tips")){
        	img = `<img src="assets/img${tip.img}">`
        }
        var pClass = ''
        if (img == ''){
        	pClass = 'long'
        }
        panelItem.innerHTML = `
            ${img}
            <div class="bg">
	            <div class="content">
	                <h2>${tip.title}</h2>
	                <p class='${pClass}'>${tip.text}</p>
	            </div>
        	</div>
        `;
        container.appendChild(panelItem);

        const dot = document.createElement('span');
        dot.classList.add('dot');
        dot.addEventListener('click', () => showTip(i));
        panelItem.addEventListener('mouseenter', pauseProgress);
        panelItem.addEventListener('mouseleave', resumeProgress);
        dotsContainer.appendChild(dot);
    });

    showTip(0);
}

function showTip(index) {
    const items = document.querySelectorAll('.panelItem');
    const dots = document.querySelectorAll('.dot');

    items.forEach((item, i) => {
        if (i === index) {
            fadeIn(item, 100);
            item.classList.add('active');
        } else {
            fadeOut(item, 100);
            item.classList.remove('active');
        }
    });

    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));

    currentTipIndex = index;
    remaining = tipsConfig[index].timeout * 1000;
    startProgress();
}

function fadeIn(element, duration) {
    element.style.display = '';
    element.style.opacity = 0;
    let last = +new Date();
    const tick = function() {
        element.style.opacity = +element.style.opacity + (new Date() - last) / duration;
        last = +new Date();

        if (+element.style.opacity < 1) {
            requestAnimationFrame(tick);
        } else {
            element.style.opacity = 1;
        }
    };
    tick();
}

function fadeOut(element, duration) {
    element.style.opacity = 1;
    let last = +new Date();
    const tick = function() {
        element.style.opacity = +element.style.opacity - (new Date() - last) / duration;
        last = +new Date();

        if (+element.style.opacity > 0) {
            requestAnimationFrame(tick);
        } else {
            element.style.opacity = 0;
            element.style.display = 'none';
        }
    };
    tick();
}

function startProgress() {
    const bar = document.getElementById('progressBar');
    const tip = tipsConfig[currentTipIndex];
    const total = remaining;

    clearTimeout(progressTimeout);
    bar.style.transition = 'none';
    bar.style.width = `${ ((tip.timeout*1000 - remaining)/(tip.timeout*1000)) * 100 }%`;

    progressStartTime = Date.now();

    setTimeout(() => {
        if (!paused) {
            bar.style.transition = `width ${total/1000}s linear`;
            bar.style.width = '100%';
        }
    }, 20);

    progressTimeout = setTimeout(nextTip, total);
}

function nextTip() {
    remaining = 0;
    showTip((currentTipIndex + 1) % tipsConfig.length);
}

function pauseProgress() {
    if (paused) return;
    paused = true;

    const bar = document.getElementById('progressBar');
    const tip = tipsConfig[currentTipIndex];
    const elapsed = Date.now() - progressStartTime;
    remaining = Math.max(remaining - elapsed, 0);

    const computedWidth = ((tip.timeout*1000 - remaining) / (tip.timeout*1000)) * 100;
    bar.style.transition = 'none';
    bar.style.width = `${computedWidth}%`;

    clearTimeout(progressTimeout);
}

function resumeProgress() {
    if (!paused) return;
    paused = false;
    startProgress();
}

load_tips(tipsConfig);


// Last, so everything it draws into exists: the lists server.lua handed over
// at connect time, on screen from the first frame instead of the last.
if (window.nuiHandoverData && window.nuiHandoverData.nvLoadingscreen) {
	apply_server_data(window.nuiHandoverData.nvLoadingscreen)
}
