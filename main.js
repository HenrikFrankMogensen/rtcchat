// Definerer App ID, token og kanalnavn for AgoraRTC
const APP_ID = 'd17d1751992d4c3aabba706be6a156c5'
const TOKEN = '007eJxTYPhgMF/u2Fp1X9GqiXc5t4QIcfidnreL02xp0WXmrFpx7SoFhhRDcyAyNbS0NEoxSTZOTExKSjQ3MEtKNUs0NDVLNmV4bpnWEMjIEO9uwMjIAIEgPitDbmJmnhkDAwCUDBw4'
const CHANNEL = "main6"

// Opretter en klient med RTC-tilstand og VP8 kodek
const client = AgoraRTC.createClient({mode:'rtc', codec:'vp8'})

// Initialiserer variabler for lokale spor og fjernbrugere
let localTracks = []
let remoteUsers = {}

// Funktion for at deltage i kanalen og vise lokal strøm
let joinAndDisplayLocalStream = async () => {
    
    // Lytter efter når en bruger publicerer en strøm
    client.on('user-published', handleUserJoined)
    
    // Lytter efter når en bruger forlader en strøm
    client.on('user-left', handleUserLeft)
    
    // Deltager i kanalen og får tildelt en UID
    let UID = await client.join(APP_ID, CHANNEL, TOKEN, null)

    // Opretter mikrofon- og kameraspår
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks() 

    // Opretter HTML-element for lokal strøm
    let player = `<div class="video-container" id="user-container-${UID}">
                        <div class="video-player" id="user-${UID}"></div>
                  </div>`
    document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)

    // Afspiller den lokale videostream
    localTracks[1].play(`user-${UID}`)
    
    // Publicerer de lokale spor til kanalen
    await client.publish([localTracks[0], localTracks[1]])
}

// Funktion for at deltage i strømmen
let joinStream = async () => {
    await joinAndDisplayLocalStream()
    document.getElementById('join-btn').style.display = 'none'
    document.getElementById('stream-controls').style.display = 'flex'
}

// Funktion for at håndtere når en bruger deltager i strømmen
let handleUserJoined = async (user, mediaType) => {
    // Gemmer den fjernbruger
    remoteUsers[user.uid] = user 
    // Abonnerer på den fjernbrugers strøm
    await client.subscribe(user, mediaType)

    // Hvis medietypen er video
    if (mediaType === 'video'){
        let player = document.getElementById(`user-container-${user.uid}`)
        // Fjerner eksisterende afspiller, hvis den allerede findes
        if (player != null){
            player.remove()
        }

        // Opretter HTML-element for den fjernbrugers videostream
        player = `<div class="video-container" id="user-container-${user.uid}">
                        <div class="video-player" id="user-${user.uid}"></div> 
                 </div>`
        document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)

        // Afspiller den fjernbrugers videostream
        user.videoTrack.play(`user-${user.uid}`)
    }

    // Hvis medietypen er lyd
    if (mediaType === 'audio'){
        // Afspiller den fjernbrugers lyd
        user.audioTrack.play()
    }
}

// Funktion for at håndtere når en bruger forlader strømmen
let handleUserLeft = async (user) => {
    // Fjerner den fjernbruger fra listen
    delete remoteUsers[user.uid]
    // Fjerner HTML-elementet for den fjernbruger
    document.getElementById(`user-container-${user.uid}`).remove()
}

// Funktion for at forlade kanalen og fjerne den lokale strøm
let leaveAndRemoveLocalStream = async () => {
    // Stopper og lukker de lokale spor
    for(let i = 0; localTracks.length > i; i++){
        localTracks[i].stop()
        localTracks[i].close()
    }

    // Forlader kanalen
    await client.leave()
    // Viser "Deltag" -knappen og skjuler kontrollerne
    document.getElementById('join-btn').style.display = 'block'
    document.getElementById('stream-controls').style.display = 'none'
    // Fjerner alle HTML-elementer for videostrømme
    document.getElementById('video-streams').innerHTML = ''
}

// Funktion for at slå mikrofonen til/fra
let toggleMic = async (e) => {
    if (localTracks[0].muted){
        await localTracks[0].setMuted(false)
        e.target.innerText = 'Mic on'
        e.target.style.backgroundColor = 'cadetblue'
    }else{
        await localTracks[0].setMuted(true)
        e.target.innerText = 'Mic off'
        e.target.style.backgroundColor = '#EE4B2B'
    }
}

// Funktion for at slå kameraet til/fra
let toggleCamera = async (e) => {
    if(localTracks[1].muted){
        await localTracks[1].setMuted(false)
        e.target.innerText = 'Camera on'
        e.target.style.backgroundColor = 'cadetblue'
    }else{
        await localTracks[1].setMuted(true)
        e.target.innerText = 'Camera off'
        e.target.style.backgroundColor = '#EE4B2B'
    }
}

// Tilføjer lyttere til knapperne
document.getElementById('join-btn').addEventListener('click', joinStream)
document.getElementById('leave-btn').addEventListener('click', leaveAndRemoveLocalStream)
document.getElementById('mic-btn').addEventListener('click', toggleMic)
document.getElementById('camera-btn').addEventListener('click', toggleCamera)
