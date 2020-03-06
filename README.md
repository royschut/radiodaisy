# radiodaisy
Radio Daisy - Web's first AI DJ.
Repos of the React and PHP code to radiodaisy.nl.

Daisy retrieves a playlist from a pre- or otherwise randomly selected music style. From this randomly ordered list of songs she will create a program, based on  the cues of each song describing specific moments of the music, such as START, STOP, SKIP_IN, SKIP_OUT and PRESTART_OVERLAP. 
2 YouTube players are used to prepare and buffer each next song and in case of a PRESTART_OVERLAP, make the songs overlap a small part.
The bpm is used to animate the buttons and panel styles to the beat.
The backend is used to change the playlists, songs and cues. Accessed through radiodaisy.nl/#backend (currently open, so unprotected)

RadioDaisy.js is the main app
MusicPlayer controls and is the shell around the 2 youtube players
The MusicProgrammer transforms the playlist/songs/cues into an ordered program. Each cue gets a calculated cue.absoluteTime.
The MusicProgramController reads this program and uses intervals to sync all cues to the video's.
The MusicBeatSyncer holds intervals for all beat sync activity, such as animation and syncing user 'mix' and 'skip' commands to the beat.

DaisyData.php is used for retrieving all data, as well as updating to DB through the backend.
