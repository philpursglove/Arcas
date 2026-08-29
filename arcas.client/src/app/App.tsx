import { useState, useEffect } from "react";
import {
    Search, Music, ListMusic, ChevronRight, Check, Loader2, ExternalLink, Play, Plus,
    ArrowLeft, Disc3, Link, Globe, Lock, Users, X
} from "lucide-react";
import * as SpotifyHelper from "../SpotifyHelper";
import { ApplicationInsights } from '@microsoft/applicationinsights-web'

type PlaylistVisibility = "public" | "private" | "collaborative";
type CoverOption = "exclude" | "by-artist" | "by-original";

// ── Types ──────────────────────────────────────────────────────────────────

interface Song {
    name: string;
    cover?: boolean;
    coverArtist?: Artist;
}

interface Setlist {
    id: string;
    eventDate: Date;
    artist: { name: string; mbid: string };
    venue: { name: string; city: string; country: string };
    songs: Song[];
    tour?: string;
    url: string;
    formattedDate: string;
}

interface Artist {
    name: string;
    id: string;
}

interface Playlist {
    id: string;
    name: string;
    visibility: PlaylistVisibility;
    url: string;
    songs: PlaylistSong[];
    artistName: string;
}

interface PlaylistSong {
    name: string;
    spotifyUri: string;
    coverArtist?: string | null;
}

type AppView = "search" | "results" | "setlist" | "creating" | "done";


// ── Helpers ────────────────────────────────────────────────────────────────

function parseSetlistId(url: string): string | null {
    // Matches setlist.fm URLs like:
    // https://www.setlist.fm/setlist/radiohead/2024/glastonbury-festival-pilton-england-6bd15e5b.html
    const match = url.match(/setlist\.fm\/setlist\/[^/]+\/\d+\/[^/]+-([a-f0-9]+)\.html/i);
    return match ? match[1] : null;
}

function allSongs(setlist: Setlist): Song[] {
    return setlist.songs;
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Pill({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono bg-muted text-muted-foreground border border-border" >
        { children }
        </span>
    );
}

function SetlistCard({
    setlist,
    onClick,
}: {
    setlist: Setlist;
    onClick: () => void;
}) {
    const songs = allSongs(setlist);
    return (
        <button
            onClick= { onClick }
    className = "w-full text-left group bg-card border border-border rounded-xl p-5 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
        >
        <div className="flex items-start justify-between gap-3" >
            <div className="flex-1 min-w-0" >
                <div className="flex items-center gap-2 mb-1" >
                    <span className="text-xs font-mono text-muted-foreground" > { setlist.formattedDate } </span>
    { setlist.tour && <Pill>{ setlist.tour } </Pill> }
    </div>
        < h3 className = "font-display text-lg font-semibold text-foreground leading-tight" >
        { setlist.venue.name }
            </h3>
            < p className = "text-sm text-muted-foreground mt-0.5" >
            { setlist.venue.city }, { setlist.venue.country }
            </p>

                < div className = "mt-3 flex flex-wrap gap-1.5" >
                {
                    songs.slice(0, 4).map((s, i) => (
                        <span key= { i } className = "text-xs px-2 py-0.5 bg-secondary rounded-md text-muted-foreground font-mono" >
                        { s.name }
                        </span>
                    ))
                }
    {
        songs.length > 4 && (
            <span className="text-xs px-2 py-0.5 rounded-md text-muted-foreground font-mono" >
                +{ songs.length - 4 } more
                    </span>
                        )
    }
    </div>
        </div>

        < div className = "flex flex-col items-end gap-2 shrink-0" >
            <span className="text-2xl font-display font-bold text-primary" > { songs.length } </span>
                < span className = "text-xs text-muted-foreground font-mono" > songs </span>
                    < ChevronRight
    size = { 16}
    className = "text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all"
        />
        </div>
        </div>
        </button>
    );
}

function TrackRow({
    index,
    song }:
    {
        index: number;
        song: Song;
    }) {
    return (
        <>
        <div className= "group flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-secondary transition-colors" >
        <span className="w-6 text-right text-xs font-mono text-muted-foreground shrink-0 group-hover:text-primary" >
            { index + 1
}
</span>
    < Play size = { 12} className = "text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        <div className="flex-1 min-w-0" >
            <p className="text-sm text-foreground truncate" > { song.name } </p>
{
    song.cover && (
        <p className="text-xs text-muted-foreground font-mono" >
            cover · { song.name } by { song.coverArtist?.name }
    </p>
                    )
}
</div>
    </div>
    </>
    );
}

// ── Views ──────────────────────────────────────────────────────────────────

function HeroSearch({
    query,
    setQuery,
    onSearch,
    onPasteUrl,
    loading,
    recentArtists,
}: {
    query: string;
    setQuery: (v: string) => void;
    onSearch: () => void;
    onPasteUrl: (url: string) => void;
    loading: boolean;
    recentArtists: string[];
}) {
    const [tab, setTab] = useState<"search" | "url">("search");
    const [urlInput, setUrlInput] = useState("");
    const [urlError, setUrlError] = useState("");

    function handleUrlSubmit() {
        const id = parseSetlistId(urlInput.trim());
        if (!id) {
            setUrlError("Couldn't recognise that URL — paste a setlist.fm setlist link.");
            return;
        }
        setUrlError("");
        onPasteUrl(urlInput.trim());
    }

    return (
        <div className= "min-h-screen flex flex-col" >
        {/* Header */ }
        < header className = "flex items-center justify-between px-8 py-6 border-b border-border" >
            <div className="flex items-center gap-2.5" >
                <Disc3 size={ 22 } className = "text-primary" />
                    <span className="font-display font-bold text-xl tracking-tight text-foreground" > Arcas </span>
                        </div>
                        < a
    href = "https://www.setlist.fm"
    target = "_blank"
    rel = "noreferrer"
    className = "flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
        powered by setlist.fm < ExternalLink size = { 11} />
            </a>
            </header>

    {/* Hero */ }
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center" >
        <div className="mb-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-mono" >
            <Music size={ 11 } />
                    concert setlists → spotify playlists
        </div>

        < h1 className = "font-display font-bold text-6xl md:text-8xl text-foreground leading-none tracking-tight mb-4 mt-6" >
            You were < br />
                <span className="text-primary italic" > there.</span>
                    </h1>
                    < p className = "text-muted-foreground text-lg max-w-md leading-relaxed mb-12" >
                        Search for any artist, find the exact setlist from a show you attended, and build the playlist on Spotify in seconds.
                </p>

    {/* Tab toggle */ }
    <div className="w-full max-w-xl" >
        <div className="flex items-center gap-1 p-1 bg-card border border-border rounded-xl mb-3 w-fit mx-auto" >
            <button
                            onClick={ () => setTab("search") }
    className = {`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "search"
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:text-foreground"
        }`
}
                        >
    <Search size={ 13 } />
                            Search artist
    </button>
    < button
onClick = {() => setTab("url")}
className = {`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "url"
    ? "bg-primary text-primary-foreground"
    : "text-muted-foreground hover:text-foreground"
    }`}
                        >
    <Link size={ 13 } />
                            Paste URL
    </button>
    </div>

{
    tab === "search" ? (
        <>
        <div className= "relative flex items-center" >
        <Search size={ 18 } className = "absolute left-4 text-muted-foreground pointer-events-none" />
            <input
                                    type="text"
    placeholder = "Search for an artist…"
    value = { query }
    onChange = {(e) => setQuery(e.target.value)
}
onKeyDown = {(e) => e.key === "Enter" && onSearch()}
className = "w-full pl-12 pr-36 py-4 bg-card border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all font-sans text-base"
    />
    <button
                                    onClick={ onSearch }
disabled = { loading || !query.trim()}
className = "absolute right-2 flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
    >
    { loading?<Loader2 size = { 15 } className = "animate-spin" /> : null}
Search
    </button>
    </div>
    <p className = "text-xs text-muted-foreground font-mono mt-3" >
{/* //TODO: Have a better boilerplate fallback list */ }
{/* Maybe even get the user to sign in to Setlist and then get *their* recent artists */ }
{
    recentArtists &&
    `Try: ${ recentArtists.length > 0 ? recentArtists.join(', ') : 'Radiohead, Arctic Monkeys, Beyoncé, Taylor Swift' }`
}
            </p>
            </>
                    ) : (
    <>
    <div className= "relative flex items-center" >
    <Link size={ 18 } className = "absolute left-4 text-muted-foreground pointer-events-none" />
        <input type="url" placeholder = "https://www.setlist.fm/setlist/…" value = {urlInput}
            onChange = {(e) => { setUrlInput(e.target.value); setUrlError(""); }}
            onKeyDown = {(e) => e.key === "Enter" && handleUrlSubmit()}
className = {`w-full pl-12 pr-36 py-4 bg-card border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 transition-all font-mono text-sm 
            ${urlError ? "border-destructive focus:border-destructive focus:ring-destructive/30" : "border-border focus:border-primary focus:ring-primary/30"}`} />
    < button
onClick = { handleUrlSubmit }
disabled = { loading || !urlInput.trim()}
className = "absolute right-2 flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
    >
    { loading?<Loader2 size = { 15 } className = "animate-spin" /> : null}
Load
    </button>
    </div>
{
    urlError ? (
        <p className= "text-xs text-destructive font-mono mt-3" > { urlError } </p>
                            ) : (
        <p className= "text-xs text-muted-foreground font-mono mt-3" >
        Paste any setlist.fm setlist page URL
            </p>
                            )
}
</>
                    )}
</div>

{/* Steps */ }
<div className="mt-12 grid grid-cols-3 gap-8 max-w-xl w-full" >
{
    [
    { n: "01", label: "Find a setlist", desc: "Search any artist or paste a setlist.fm URL directly" },
    { n: "02", label: "Pick your show", desc: "Select the exact date and venue" },
    { n: "03", label: "Build the playlist", desc: "One click to create it in Spotify" },
                    ].map((step) => (
        <div key= { step.n } className = "text-left" >
        <span className="font-mono text-xs text-accent" > { step.n } </span>
    < h3 className = "font-display font-semibold text-foreground mt-1 mb-1 text-base" > { step.label } </h3>
    < p className = "text-xs text-muted-foreground leading-relaxed" > { step.desc } </p>
    </div>
    ))
}
    </div>
    </div>
    </div>
    );
}

function ResultsView({
    query,
    setlists,
    onSelect,
    onBack,
    loadNextPage,
    loadingMore
}: {
    query: string;
    setlists: Setlist[];
    onSelect: (s: Setlist) => void;
    onBack: () => void;
    loadNextPage: () => void;
    loadingMore: boolean;
}) {
    return (
        <div className= "min-h-screen flex flex-col" >
        <header className="flex items-center justify-between px-8 py-6 border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10" >
            <div className="flex items-center gap-2.5" >
                <Disc3 size={ 22 } className = "text-primary" />
                    <span className="font-display font-bold text-xl tracking-tight text-foreground" > Arcas </span>
                        </div>
                        < button
    onClick = { onBack }
    className = "flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-mono"
        >
        <ArrowLeft size={ 14 } /> new search
            </button>
            </header>

            < main className = "flex-1 max-w-2xl mx-auto w-full px-6 py-10" >
                <div className="mb-8" >
                    <p className="text-xs font-mono text-muted-foreground mb-1" > { setlists.length } setlists found </p>
                        < h2 className = "font-display font-bold text-4xl text-foreground" > { setlists[0]?.artist.name } </h2>
                            </div>

                            < div className = "flex flex-col gap-3" >
                                {
                                    setlists.map((s) => (
                                        <SetlistCard key= { s.id } setlist = { s } onClick = {() => onSelect(s)} />
                    ))
}
</div>

    < div className = "mt-8 flex flex-col items-center gap-3" >
        <button
                        onClick={ loadNextPage }
disabled = { loadingMore }
className = "flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-mono disabled:opacity-50"
    >
    {
        loadingMore?(
                            <Loader2 size = { 13} className = "animate-spin" />
                        ): (
                <ChevronRight size = { 13 } className = "rotate-90" />
                        )}
{ loadingMore ? "Loading…" : "Load more" }
</button>
    < p className = "text-xs font-mono text-muted-foreground" >
        Demo mode — showing cached results.Connect API keys for live data.
                    </p>
            </div>
            </main>
            </div>
    );
}

const VISIBILITY_OPTIONS: { value: PlaylistVisibility; label: string; desc: string; Icon: React.ElementType }[] = [
    { value: "public", label: "Public", desc: "Anyone can find it", Icon: Globe },
    { value: "private", label: "Private", desc: "Only you can see it", Icon: Lock },
    { value: "collaborative", label: "Collaborative", desc: "Friends can add tracks", Icon: Users },
];

function SetlistView({
    setlist,
    onBack,
    onCreatePlaylist,
}: {
    setlist: Setlist;
    onBack: () => void;
    onCreatePlaylist: (visibility: PlaylistVisibility) => void;
}) {
    const [visibility, setVisibility] = useState<PlaylistVisibility>("public");
    const songs = setlist.songs.map((s,i) => {
        if (s.name.indexOf(' / ') > 0)
        {
            const medleySongs = s.name.split(' / ');
            return medleySongs;
        }
        else
        {
            return s;
        }
    });

    // Scroll to top when component mounts
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, []);

    return (
        <div className= "min-h-screen flex flex-col" >
        <header className="flex items-center justify-between px-8 py-6 border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10" >
            <div className="flex items-center gap-2.5" >
                <Disc3 size={ 22 } className = "text-primary" />
                    <span className="font-display font-bold text-xl tracking-tight text-foreground" > Arcas </span>
                        </div>
                        < button
    onClick = { onBack }
    className = "flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-mono"
        >
        <ArrowLeft size={ 14 } /> back to results
            </button>
            </header>

            < main className = "flex-1 max-w-2xl mx-auto w-full px-6 py-10" >
            {/* Setlist meta */ }
                < div className = "mb-8" >
                    <div className="flex items-center gap-2 mb-2" >
                        <span className="text-xs font-mono text-muted-foreground" > { setlist.formattedDate } </span>
    { setlist.tour && <Pill>{ setlist.tour } </Pill> }
    </div>
        < h2 className = "font-display font-bold text-4xl text-foreground leading-tight" > { setlist.artist.name } </h2>
            < p className = "text-muted-foreground mt-1" >
            { setlist.venue.name } · { setlist.venue.city }, { setlist.venue.country }
    </p>

        < div className = "flex items-center gap-4 mt-6" >
            <div className="text-center" >
                <p className="font-display font-bold text-3xl text-primary" > { setlist.songs.length } </p>
                    < p className = "text-xs font-mono text-muted-foreground" > songs </p>
                        </div>
                        < div className = "w-px h-10 bg-border" />
                            </div>

    {/* Visibility + Create */ }
    <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 bg-card border border-border rounded-xl" >
        <div className="flex-1" >
            <p className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider" > Playlist visibility </p>
                < div className = "flex gap-2" >
                {
                    VISIBILITY_OPTIONS.map(({ value, label, desc, Icon }) => (
                        <button
                                        key= { value }
                                        onClick = {() => setVisibility(value)}
    title = { desc }
    className = {`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${visibility === value
        ? "bg-primary/10 border-primary/40 text-primary"
        : "border-border text-muted-foreground hover:text-foreground hover:border-border/80"
        }`
}
                                    >
    <Icon size={ 13 } />
{ label }
</button>
                                ))}
</div>
    < p className = "text-xs text-muted-foreground font-mono mt-1.5" >
    { VISIBILITY_OPTIONS.find((o) => o.value === visibility)?.desc }
        </p>
        </div>
        < button
onClick = {() => onCreatePlaylist(visibility)}
className = "flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 active:scale-95 transition-all shadow-lg shadow-primary/20 shrink-0"
    >
    <Plus size={ 16 } />
                            Create Spotify Playlist
    </button>
    </div>
    </div>

{/* Track list */ }
<div className="bg-card border border-border rounded-xl overflow-hidden" >
    <div>
    <div className="px-4 py-3 border-b border-border flex items-center gap-2" >
        <ListMusic size={ 14 } className = "text-muted-foreground" />
            </div>
            </div>
            < div className = "py-2" >
            {
                setlist.songs.map((song, idx) => {
                    return (
                        <TrackRow
                                    key= { idx }
                    index = { idx }
                    song = { song }
                        />
                            );
            })}
</div>
    </div>

    < p className = "text-center text-xs font-mono text-muted-foreground mt-6" >
        <a href={ setlist.url } target = "_blank" rel = "noreferrer" className = "hover:text-foreground transition-colors flex items-center gap-1 justify-center" >
            View on setlist.fm < ExternalLink size = { 10} />
                </a>
                </p>
                </main>
                </div>
    );
}

function CreatingView({ setlist, playlist, setPlaylist, onComplete, accessToken, visibility }: { 
    setlist: Setlist;
    playlist: Playlist | null;
    setPlaylist: (playlist: Playlist) => void;
    onComplete: () => void;
    accessToken: string;
    visibility: PlaylistVisibility;
}) {
    const [searchProgress, setSearchProgress] = useState(0);
    const [creatingPlaylist, setCreatingPlaylist] = useState(false);

    useEffect(() => {
        // Initialize playlist immediately
        let playlistSongs: Array<PlaylistSong> = [];
        setlist.songs.map((s,i) => {
            if (s.name.indexOf(' / ') > 0)
            {
                const medleySongs = s.name.split(' / ');
                medleySongs.map((ms) => {
                    if (ms.trim() !== '')
                    {
                        playlistSongs.push({spotifyUri: '', name: ms});
                    }
                });
            }
            else
            {
                if (s.cover) {
                    playlistSongs.push({ spotifyUri: '', name: s.name, coverArtist: s.coverArtist?.name });
                }
                else {
                    playlistSongs.push({ spotifyUri: '', name: s.name });
                }
            }
        });
        // const songs = setlist.songs;
        const newPlaylist: Playlist = {
            name: `${setlist.artist.name}, ${setlist.venue.name}, ${setlist.formattedDate}`,
            id: '',
            visibility: 'public',
            url: '',
            songs: playlistSongs,
            artistName: setlist.artist.name
        };
        setPlaylist(newPlaylist);

        // Search for tracks asynchronously
        async function searchTracks() {
            for (let i = 0; i < newPlaylist.songs.length; i++) {
                const song = newPlaylist.songs[i];
                try {
                    const response = await fetch(
                        `Spotify/searchtrack?trackName=${encodeURIComponent(song.name)}&artistName=${encodeURIComponent(song.coverArtist ?? setlist.artist.name)}`
                    );

                    if (response.ok) {
                        const data = await response.json();
                        song.spotifyUri = data.spotifyUri;
                    } else {
                        song.spotifyUri = 'fail';
                    }
                } catch (error) {
                    song.spotifyUri = 'fail';
                }

                setSearchProgress(i + 1);
                // Update playlist state to trigger UI rerender
                setPlaylist({ ...newPlaylist });
            }
        }

        searchTracks();
    }, [setlist]);

    // Check if all songs have been resolved and create the Spotify playlist
    useEffect(() => {
        if (playlist && playlist.songs.length > 0 && !creatingPlaylist) {
            const allResolved = playlist.songs.every(song => song.spotifyUri !== '');
            if (allResolved) {
                setCreatingPlaylist(true);
                createSpotifyPlaylist();
            }
        }
    }, [playlist, creatingPlaylist]);

    async function createSpotifyPlaylist() {
        if (!playlist) return;

        try {
            const trackUris = playlist.songs.map(song => song.spotifyUri);
            const response = await fetch('Spotify/createplaylist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accessToken,
                    name: playlist.name,
                    description: `Setlist from ${setlist.venue.name}, ${setlist.venue.city} on ${setlist.formattedDate}`,
                    isPublic: visibility === 'public',
                    trackUris
                })
            });

            if (response.ok) {
                const data = await response.json();
                // Update playlist with Spotify details
                setPlaylist({
                    ...playlist,
                    id: data.id,
                    url: data.url
                });
                onComplete();
            } else {
                console.error('Failed to create playlist');
                // Still move forward but without the URL
                onComplete();
            }
        } catch (error) {
            console.error('Error creating playlist:', error);
            onComplete();
        }
    }

    return (
        <div className= "min-h-screen flex flex-col items-center justify-center px-6" >
        <div className="text-center max-w-sm" >
            <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6" >
                <Loader2 size={ 32 } className = "text-primary animate-spin" />
                    </div>
                    < h2 className = "font-display font-bold text-3xl text-foreground mb-2" > Building your playlist…</h2>
                        < p className = "text-muted-foreground text-sm" >
                            Searching Spotify for { playlist?.songs.length ?? 0 } tracks from{ " " }
    <span className="text-foreground font-medium" > { setlist.artist.name } </span> at{" "}
    { setlist.venue.name }
    { searchProgress > 0 && ` (${searchProgress}/${playlist?.songs.length ?? 0})` }
    </p>
        < div className = "mt-8 space-y-2" >
        {
            playlist?.songs.map((s, i) => (
                <div
                            key= { i }
                            className = "flex items-center gap-3 px-4 py-2.5 bg-card border border-border rounded-lg text-sm"
                            style = {{ animationDelay: `${i * 150}ms` }}
            >
                    { s.spotifyUri === '' && <Loader2 size={ 12 } className = "text-primary animate-spin shrink-0" />}
                    { s.spotifyUri === 'fail' && <X size={ 12 } className = "text-destructive" />}
                    { s.spotifyUri !== '' && s.spotifyUri !== 'fail' && <Check   size={ 12 } className = "text-primary" />}
<span className="text-muted-foreground font-mono text-xs truncate" > { s.name } </span>
    </div>
                    ))}
{/*                     <p className="text-xs font-mono text-muted-foreground pt-1">+ {songs.length - 5} more…</p>
 */} </div>
    </div>
    </div>
    );
}

function DoneView({
    playlist,
    visibility,
    onReset,
}: {
    playlist: Playlist;
    visibility: PlaylistVisibility;
    onReset: () => void;
}) {
    const songs = playlist.songs;
    const playlistName = playlist.name;
    const visOption = VISIBILITY_OPTIONS.find((o) => o.value === visibility)!;
    const VisIcon = visOption.Icon;

    return (
        <div className= "min-h-screen flex flex-col items-center justify-center px-6" >
        <div className="text-center max-w-md" >
            <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-6" >
                <Check size={ 32 } className = "text-primary" />
                    </div>
                    < h2 className = "font-display font-bold text-4xl text-foreground mb-2" > Playlist created! </h2>
                        < p className = "text-muted-foreground text-sm mb-8" >
                        { songs.length } tracks are now waiting for you in Spotify.
                </p>

                            <div className = "bg-card border border-primary/20 rounded-xl p-5 text-left mb-6" >
                                <div className="flex items-start gap-4" >
                                    <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center shrink-0" >
                                        <Music size={ 22 } className = "text-primary" />
                                            </div>
                                            < div className = "flex-1 min-w-0" >
                                                <p className="font-semibold text-foreground truncate" > { playlistName } </p>
                                                    < div className = "flex items-center gap-2 mt-0.5" >
                                                        <p className="text-xs text-muted-foreground font-mono" > { songs.length } tracks · { playlist.artistName } </p>
                                                            < span className = "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted text-xs font-mono text-muted-foreground border border-border" >
                                                                <VisIcon size={ 9 } />
    { visOption.label }
    </span>
        </div>
        < div className = "flex flex-wrap gap-1 mt-2" >
        {
            songs.slice(0, 3).map((s, i) => (
                <span key= { i } className = "text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground font-mono" > { s.name } </span>
            ))
        }
            < span className = "text-xs px-1.5 py-0.5 text-muted-foreground font-mono" >…</span>
                </div>
                </div>
                </div>
                </div>

                <div className = "flex gap-3 justify-center" >
                    {playlist.url ? (
                        <a 
                            href={playlist.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all"
                        >
                            <ExternalLink size={ 15 } />
                            Open in Spotify
                        </a>
                    ) : (
                        <button 
                            disabled
                            className="flex items-center gap-2 px-6 py-3 bg-muted text-muted-foreground rounded-xl font-semibold text-sm cursor-not-allowed"
                        >
                            <ExternalLink size={ 15 } />
                            Playlist link unavailable
                        </button>
                    )}
        <button
    onClick = { onReset }
    className = "flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-xl font-semibold text-sm hover:bg-secondary/80 transition-all"
        >
        Find another setlist
            </button>
            </div>
            </div>
            </div>
    );
}

// ── Root ───────────────────────────────────────────────────────────────────

export default function App() {
    const [view, setView] = useState<AppView>("search");
    const [query, setQuery] = useState("");
    const [artists, setArtists] = useState<Artist[]>([]);
    const [results, setResults] = useState<Setlist[]>([]);
    const [selected, setSelected] = useState<Setlist | null>(null);
    const [loading, setLoading] = useState(false);
    const [visibility, setVisibility] = useState<PlaylistVisibility>("public");
    const [page, setPage] = useState<number | null>(null);
    const [artist, setArtist] = useState<Artist | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [playlist, setPlaylist] = useState<Playlist | null>(null);
    const [spotifyAccessToken, setSpotifyAccessToken] = useState<string | null>(null);
    const [spotifyClientId, setSpotifyClientId] = useState<string>("");
    const [recentArtists, setRecentArtists] = useState<string[] | null>(null);

    // Handle OAuth callback and load initial data
    useEffect(() => {
        // Check for existing token
        const existingToken = SpotifyHelper.getSpotifyToken();
        if (existingToken) {
            setSpotifyAccessToken(existingToken);
        }

        // Handle OAuth callback for popup flow
        if (window.opener) {
            // We're in a popup - handle callback and notify parent
            const handled = SpotifyHelper.handlePopupCallback();
            if (handled) {
                // The popup has sent the message to the parent
                // Show a simple message and close
                document.body.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">Authentication successful! Closing window...</div>';
                setTimeout(() => window.close(), 1000);
                return;
            }
        }

        // Handle OAuth callback for fallback full-page redirect
        const callbackData = SpotifyHelper.parseCallbackUrl();
        if (callbackData) {
            const { code } = callbackData;
            const codeVerifier = SpotifyHelper.getCodeVerifier();

            if (codeVerifier) {
                // Exchange code for token
                exchangeCodeForToken(code, codeVerifier);
            }

            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        // Load Spotify client ID
        SpotifyHelper.getSpotifyClientId().then(setSpotifyClientId);

        // Load recent artists
        fetch('Setlist/getrecentartists')
            .then(response => response.json())
            .then(data => setRecentArtists(data))
            .catch(() => setRecentArtists([]));

        // Initialize history state
        if (!window.history.state) {
            window.history.replaceState({ view: 'search' }, '', window.location.pathname);
        }
    }, []);

    // Handle browser back/forward buttons
    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            if (event.state && event.state.view) {
                const historyView = event.state.view as AppView;
                setView(historyView);

                // Handle navigation based on where we came from
                if (historyView === 'setlist') {
                    // Going forward to setlist - keep the selected setlist
                    return;
                }

                if (historyView === 'results') {
                    // Going back to results - clear selected setlist
                    setSelected(null);
                }

                if (historyView === 'search') {
                    // Going back to search - clear everything
                    setResults([]);
                    setSelected(null);
                    setArtist(null);
                }
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    async function exchangeCodeForToken(code: string, codeVerifier: string) {
        try {
            const redirectUri = window.location.origin + window.location.pathname;
            const response = await fetch('Spotify/exchangetoken', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, codeVerifier, redirectUri })
            });

            if (response.ok) {
                const data = await response.json();
                SpotifyHelper.saveSpotifyToken(data.access_token, data.expires_in, data.refresh_token);
                setSpotifyAccessToken(data.access_token);
            }
        } catch (error) {
            console.error('Failed to exchange token:', error);
        }
    }

    async function handleSearch() {
        if (!query.trim()) return;
        setLoading(true);

        const searchResponse = await fetch('Setlist/artistsearch?searchText=' + encodeURIComponent(query));
        if (!searchResponse.ok) {
            setLoading(false);
            return;
        }
        const searchResult = await searchResponse.json();

        setPage(1);
        setArtist(searchResult[0].artist);
        setResults(searchResult);
        setView("results");

        // Push history state for results view
        window.history.pushState({ view: 'results' }, '', window.location.pathname);

        setLoading(false);
    }

    async function loadNextPage() {
        if (!artist || page === null) return;

        setLoading(true);
        const pageResponse = await fetch(`Setlist/getartistsetlistpage?artistId=${encodeURIComponent(artist.id)}&pageNumber=${page + 1}`);
        if (!pageResponse.ok) {
            setLoading(false);
            return;
        }
        const pageResult = await pageResponse.json();
        setResults((prev) => [...prev, ...pageResult]);
        setPage((prev) => (prev !== null ? prev + 1 : 1));
        setLoading(false);
    }


    async function handlePasteUrl(url: string) {
        const id = parseSetlistId(url);
        if (!id) return;
        setLoading(true);

        const pasteResponse = await fetch('Setlist/getsetlist?setlistId=' + encodeURIComponent(id));
        if (!pasteResponse.ok) {
            setLoading(false);
            return;
        }
        const pasteResult = await pasteResponse.json();

        setSelected(pasteResult);
        setView("setlist");

        // Push history state for setlist view (from search)
        window.history.pushState({ view: 'setlist', fromSearch: true }, '', window.location.pathname);

        setLoading(false);
    }

    function handleSelect(s: Setlist) {
        setSelected(s);
        setView("setlist");

        // Push history state for setlist view (from results)
        window.history.pushState({ view: 'setlist', fromResults: true }, '', window.location.pathname);
    }

    async function handleCreatePlaylist(v: PlaylistVisibility) {
        setVisibility(v);

        // Check if we have a valid Spotify access token
        const token = SpotifyHelper.getSpotifyToken();

        if (!token) {
            // No valid token - open Spotify auth in popup
            if (spotifyClientId) {
                try {
                    const redirectUri = window.location.origin + window.location.pathname;
                    const authResult = await SpotifyHelper.openSpotifyAuthPopup(spotifyClientId, redirectUri);

                    if (authResult) {
                        const { code } = authResult;
                        const codeVerifier = SpotifyHelper.getCodeVerifier();

                        if (codeVerifier) {
                            // Exchange code for token
                            await exchangeCodeForToken(code, codeVerifier);
                            // Token is now set, proceed to creating view
                            const newToken = SpotifyHelper.getSpotifyToken();
                            if (newToken) {
                                setSpotifyAccessToken(newToken);
                                setView("creating");
                            }
                        }
                    }
                } catch (error) {
                    console.error('Authentication failed:', error);
                    // Could show an error message to the user here
                }
            }
            return;
        }

        // Have valid token - proceed to creating view
        setSpotifyAccessToken(token);
        setView("creating");
    }

    function handleReset() {
        setQuery("");
        setResults([]);
        setSelected(null);
        setPlaylist(null);
        setView("search");
    }

    const appInsights = new ApplicationInsights({
        config: {
            connectionString: 'InstrumentationKey=7d6a73c5-6801-4ab8-8501-4421fc289581;IngestionEndpoint=https://uksouth-1.in.applicationinsights.azure.com/;LiveEndpoint=https://uksouth.livediagnostics.monitor.azure.com/;ApplicationId=e8183ec3-1d43-4a2e-be6e-5040066c231b'
        }
    });
    appInsights.loadAppInsights();
    appInsights.trackPageView();

    return (
        <div
            className= "min-h-screen bg-background text-foreground"
    style = {{ fontFamily: "'DM Sans', sans-serif" }
}   

        >
    <style>{`
        .font-display { font-family: 'Barlow Condensed', sans-serif; }
        .font-mono { font-family: 'DM Mono', monospace; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

{
    view === "search" && (
        <HeroSearch
                    query={ query }
    setQuery = { setQuery }
    onSearch = { handleSearch }
    onPasteUrl = { handlePasteUrl }
    loading = { loading }
    recentArtists = { recentArtists }
        />
            )
}
{
    view === "results" && (
        <ResultsView
                    query={ query }
    setlists = { results }
    onSelect = { handleSelect }
    onBack = {() => window.history.back()}
    loadNextPage = { loadNextPage }
    loadingMore = { loadingMore }
        />
            )
}
{
    view === "setlist" && selected && (
        <SetlistView
                    setlist={ selected }
    onBack = {() => window.history.back()}
onCreatePlaylist = { handleCreatePlaylist }
    />
            )}
{ view === "creating" && selected && spotifyAccessToken && (
    <CreatingView 
        setlist={selected} 
        playlist={playlist} 
        setPlaylist={setPlaylist} 
        onComplete={() => setView("done")} 
        accessToken={spotifyAccessToken}
        visibility={visibility}
    />
) }
{
    view === "done" && playlist && (
        <DoneView playlist={playlist} visibility = { visibility } onReset = { handleReset } />
            )
}

</div>
    );
}


