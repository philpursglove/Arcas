import { useState } from "react";
import { Search, Music, ListMusic, ChevronRight, Check, Loader2, ExternalLink, Play, Plus, ArrowLeft, Disc3, Link, Globe, Lock, Users } from "lucide-react";

type PlaylistVisibility = "public" | "private" | "collaborative";

// ── Types ──────────────────────────────────────────────────────────────────

interface Song {
    name: string;
    cover?: { name: string; artist: { name: string } };
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

type AppView = "search" | "results" | "setlist" | "creating" | "done";

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK_SETLISTS: Setlist[] = [
    {
        id: "6bd15e5b",
        eventDate: new Date("2024-06-14"),
        formattedDate: "14 Jun 2024",
        artist: { name: "Radiohead", mbid: "a74b1b7f-71a5-4011-9441-d0b5e4122711" },
        venue: { name: "Glastonbury Festival", city: "Pilton", country: "United Kingdom" },
        url: "https://setlist.fm",
        songs: [
            { name: "Daydreaming" },
            { name: "2 + 2 = 5" },
            { name: "Airbag" },
            { name: "My Iron Lung" },
            { name: "The National Anthem" },
            { name: "Karma Police" },
            { name: "Creep" },
            { name: "Paranoid Android" },
            { name: "Exit Music (for a Film)" },
            { name: "Let Down" },
            { name: "Everything in Its Right Place" },
            { name: "Idioteque" },
            { name: "Fake Plastic Trees" },
        ],
        tour: "A Moon Shaped Pool Tour" ,
    },
    {
        id: "4bd25f8c",
        eventDate: new Date("2023-07-22"),
        formattedDate: "22 Jul 2023",
        artist: { name: "Radiohead", mbid: "a74b1b7f-71a5-4011-9441-d0b5e4122711" },
        venue: { name: "Madison Square Garden", city: "New York", country: "United States" },
        songs: [
            { name: "Burn the Witch" },
            { name: "Myxomatosis" },
            { name: "The Gloaming" },
            { name: "There There" },
            { name: "Just" },
            { name: "Pyramid Song" },
            { name: "Morning Bell" },
            { name: "Lucky" },
            { name: "How to Disappear Completely" },
            { name: "No Surprises" },
            { name: "Street Spirit (Fade Out)" },
        ],
        url: "https://setlist.fm",
    },
    {
        id: "3ae96f2d",
        eventDate: new Date("2023-03-05"),
        formattedDate: "5 Mar 2023",
        artist: { name: "Radiohead", mbid: "a74b1b7f-71a5-4011-9441-d0b5e4122711" },
        venue: { name: "O2 Arena", city: "London", country: "United Kingdom" },
        songs:
            [
                { name: "Ful Stop" },
                { name: "Dollars and Cents" },
                { name: "Planet Telex" },
                { name: "I Might Be Wrong" },
                { name: "Knives Out" },
                { name: "Reckoner" },
                { name: "Optimistic" },
                { name: "Bloom" },
                { name: "Bodysnatchers" },
                { name: "The Bends" },
                { name: "High and Dry" },
            ],
            url: "https://setlist.fm",
        },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function parseSetlistId(url: string): string | null {
    // Matches setlist.fm URLs like:
    // https://www.setlist.fm/setlist/radiohead/2024/glastonbury-festival-pilton-england-6bd15e5b.html
    const match = url.match(/setlist\.fm\/setlist\/[^/]+\/\d+\/[^/]+-([a-f0-9]+)\.html/i);
    return match ? match[1] : null;
}

function formatDate(date: Date): string {
    return date.toDateString();
}

function allSongs(setlist: Setlist): Song[] {
    return setlist.songs;
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Pill({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono bg-muted text-muted-foreground border border-border">
            {children}
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
            onClick={onClick}
            className="w-full text-left group bg-card border border-border rounded-xl p-5 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">{setlist.formattedDate}</span>
                        {setlist.tour && <Pill>{setlist.tour}</Pill>}
                    </div>
                    <h3 className="font-display text-lg font-semibold text-foreground leading-tight">
                        {setlist.venue.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {setlist.venue.city}, {setlist.venue.country}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                        {songs.slice(0, 4).map((s, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 bg-secondary rounded-md text-muted-foreground font-mono">
                                {s.name}
                            </span>
                        ))}
                        {songs.length > 4 && (
                            <span className="text-xs px-2 py-0.5 rounded-md text-muted-foreground font-mono">
                                +{songs.length - 4} more
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-2xl font-display font-bold text-primary">{songs.length}</span>
                    <span className="text-xs text-muted-foreground font-mono">songs</span>
                    <ChevronRight
                        size={16}
                        className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all"
                    />
                </div>
            </div>
        </button>
    );
}

function TrackRow({
    index,
    song,
    encoreName,
    isFirstEncore,
}: {
    index: number;
    song: Song;
    encoreName?: string;
    isFirstEncore?: boolean;
}) {
    return (
        <>
            {isFirstEncore && encoreName && (
                <div className="px-4 py-2 flex items-center gap-3">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs font-mono text-accent uppercase tracking-widest">{encoreName}</span>
                    <div className="h-px flex-1 bg-border" />
                </div>
            )}
            <div className="group flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-secondary transition-colors">
                <span className="w-6 text-right text-xs font-mono text-muted-foreground shrink-0 group-hover:text-primary">
                    {index + 1}
                </span>
                <Play size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{song.name}</p>
                    {song.cover && (
                        <p className="text-xs text-muted-foreground font-mono">
                            cover · {song.cover.name} by {song.cover.artist.name}
                        </p>
                    )}
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
}: {
    query: string;
    setQuery: (v: string) => void;
    onSearch: () => void;
    onPasteUrl: (url: string) => void;
    loading: boolean;
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
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between px-8 py-6 border-b border-border">
                <div className="flex items-center gap-2.5">
                    <Disc3 size={22} className="text-primary" />
                    <span className="font-display font-bold text-xl tracking-tight text-foreground">Arcas</span>
                </div>
                <a
                    href="https://www.setlist.fm"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                >
                    powered by setlist.fm <ExternalLink size={11} />
                </a>
            </header>

            {/* Hero */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                <div className="mb-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-mono">
                    <Music size={11} />
                    concert setlists → spotify playlists
                </div>

                <h1 className="font-display font-bold text-6xl md:text-8xl text-foreground leading-none tracking-tight mb-4 mt-6">
                    You were<br />
                    <span className="text-primary italic">there.</span>
                </h1>
                <p className="text-muted-foreground text-lg max-w-md leading-relaxed mb-12">
                    Search for any artist, find the exact setlist from a show you attended, and build the playlist on Spotify in seconds.
                </p>

                {/* Tab toggle */}
                <div className="w-full max-w-xl">
                    <div className="flex items-center gap-1 p-1 bg-card border border-border rounded-xl mb-3 w-fit mx-auto">
                        <button
                            onClick={() => setTab("search")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "search"
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <Search size={13} />
                            Search artist
                        </button>
                        <button
                            onClick={() => setTab("url")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "url"
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <Link size={13} />
                            Paste URL
                        </button>
                    </div>

                    {tab === "search" ? (
                        <>
                            <div className="relative flex items-center">
                                <Search size={18} className="absolute left-4 text-muted-foreground pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search for an artist…"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && onSearch()}
                                    className="w-full pl-12 pr-36 py-4 bg-card border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all font-sans text-base"
                                />
                                <button
                                    onClick={onSearch}
                                    disabled={loading || !query.trim()}
                                    className="absolute right-2 flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >
                                    {loading ? <Loader2 size={15} className="animate-spin" /> : null}
                                    Search
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground font-mono mt-3">
                                Try: Radiohead, Arctic Monkeys, Beyoncé, Taylor Swift
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="relative flex items-center">
                                <Link size={18} className="absolute left-4 text-muted-foreground pointer-events-none" />
                                <input
                                    type="url"
                                    placeholder="https://www.setlist.fm/setlist/…"
                                    value={urlInput}
                                    onChange={(e) => { setUrlInput(e.target.value); setUrlError(""); }}
                                    onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                                    className={`w-full pl-12 pr-36 py-4 bg-card border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 transition-all font-mono text-sm ${urlError
                                        ? "border-destructive focus:border-destructive focus:ring-destructive/30"
                                        : "border-border focus:border-primary focus:ring-primary/30"
                                        }`}
                                />
                                <button
                                    onClick={handleUrlSubmit}
                                    disabled={loading || !urlInput.trim()}
                                    className="absolute right-2 flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >
                                    {loading ? <Loader2 size={15} className="animate-spin" /> : null}
                                    Load
                                </button>
                            </div>
                            {urlError ? (
                                <p className="text-xs text-destructive font-mono mt-3">{urlError}</p>
                            ) : (
                                <p className="text-xs text-muted-foreground font-mono mt-3">
                                    Paste any setlist.fm setlist page URL
                                </p>
                            )}
                        </>
                    )}
                </div>

                {/* Steps */}
                <div className="mt-20 grid grid-cols-3 gap-8 max-w-xl w-full">
                    {[
                        { n: "01", label: "Find a setlist", desc: "Search any artist or paste a setlist.fm URL directly" },
                        { n: "02", label: "Pick your show", desc: "Select the exact date and venue" },
                        { n: "03", label: "Build the playlist", desc: "One click to create it in Spotify" },
                    ].map((step) => (
                        <div key={step.n} className="text-left">
                            <span className="font-mono text-xs text-accent">{step.n}</span>
                            <h3 className="font-display font-semibold text-foreground mt-1 mb-1 text-base">{step.label}</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                        </div>
                    ))}
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
}: {
    query: string;
    setlists: Setlist[];
    onSelect: (s: Setlist) => void;
    onBack: () => void;
}) {
    return (
        <div className="min-h-screen flex flex-col">
            <header className="flex items-center justify-between px-8 py-6 border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-2.5">
                    <Disc3 size={22} className="text-primary" />
                    <span className="font-display font-bold text-xl tracking-tight text-foreground">Arcas</span>
                </div>
                <button
                    onClick={onBack}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-mono"
                >
                    <ArrowLeft size={14} /> new search
                </button>
            </header>

            <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
                <div className="mb-8">
                    <p className="text-xs font-mono text-muted-foreground mb-1">{setlists.length} setlists found</p>
                    <h2 className="font-display font-bold text-4xl text-foreground">{query}</h2>
                </div>

                <div className="flex flex-col gap-3">
                    {setlists.map((s) => (
                        <SetlistCard key={s.id} setlist={s} onClick={() => onSelect(s)} />
                    ))}
                </div>

                <p className="text-center text-xs font-mono text-muted-foreground mt-8">
                    Demo mode — showing cached results. Connect API keys for live data.
                </p>
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
    const songs = allSongs(setlist);
    let globalIndex = 0;

    return (
        <div className="min-h-screen flex flex-col">
            <header className="flex items-center justify-between px-8 py-6 border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-2.5">
                    <Disc3 size={22} className="text-primary" />
                    <span className="font-display font-bold text-xl tracking-tight text-foreground">Arcas</span>
                </div>
                <button
                    onClick={onBack}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-mono"
                >
                    <ArrowLeft size={14} /> back to results
                </button>
            </header>

            <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
                {/* Setlist meta */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-muted-foreground">{formatDate(setlist.eventDate)}</span>
                        {setlist.tour && <Pill>{setlist.tour}</Pill>}
                    </div>
                    <h2 className="font-display font-bold text-4xl text-foreground leading-tight">{setlist.artist.name}</h2>
                    <p className="text-muted-foreground mt-1">
                        {setlist.venue.name} · {setlist.venue.city}, {setlist.venue.country}
                    </p>

                    <div className="flex items-center gap-4 mt-6">
                        <div className="text-center">
                            <p className="font-display font-bold text-3xl text-primary">{setlist.songs.length}</p>
                            <p className="text-xs font-mono text-muted-foreground">songs</p>
                        </div>
                        <div className="w-px h-10 bg-border" />
                        <div className="text-center">
                            <p className="font-display font-bold text-3xl text-foreground">{setlist.songs.length}</p>
                            <p className="text-xs font-mono text-muted-foreground">sets</p>
                        </div>
                    </div>

                    {/* Visibility + Create */}
                    <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 bg-card border border-border rounded-xl">
                        <div className="flex-1">
                            <p className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">Playlist visibility</p>
                            <div className="flex gap-2">
                                {VISIBILITY_OPTIONS.map(({ value, label, desc, Icon }) => (
                                    <button
                                        key={value}
                                        onClick={() => setVisibility(value)}
                                        title={desc}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${visibility === value
                                            ? "bg-primary/10 border-primary/40 text-primary"
                                            : "border-border text-muted-foreground hover:text-foreground hover:border-border/80"
                                            }`}
                                    >
                                        <Icon size={13} />
                                        {label}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground font-mono mt-1.5">
                                {VISIBILITY_OPTIONS.find((o) => o.value === visibility)?.desc}
                            </p>
                        </div>
                        <button
                            onClick={() => onCreatePlaylist(visibility)}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 active:scale-95 transition-all shadow-lg shadow-primary/20 shrink-0"
                        >
                            <Plus size={16} />
                            Create Spotify Playlist
                        </button>
                    </div>
                </div>

                {/* Track list */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    {setlist.songs.map((song, songIdx) => (
                        <div key={songIdx}>
                            {songIdx === 0 && (
                                <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                                    <ListMusic size={14} className="text-muted-foreground" />
                                    <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Main Set</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <p className="text-center text-xs font-mono text-muted-foreground mt-6">
                    <a href={setlist.url} target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1 justify-center">
                        View on setlist.fm <ExternalLink size={10} />
                    </a>
                </p>
            </main>
        </div>
    );
}

function CreatingView({ setlist }: { setlist: Setlist }) {
    const songs = allSongs(setlist);
    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6">
            <div className="text-center max-w-sm">
                <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
                    <Loader2 size={32} className="text-primary animate-spin" />
                </div>
                <h2 className="font-display font-bold text-3xl text-foreground mb-2">Building your playlist…</h2>
                <p className="text-muted-foreground text-sm">
                    Searching Spotify for {songs.length} tracks from{" "}
                    <span className="text-foreground font-medium">{setlist.artist.name}</span> at{" "}
                    {setlist.venue.name}
                </p>
                <div className="mt-8 space-y-2">
                    {songs.slice(0, 5).map((s, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3 px-4 py-2.5 bg-card border border-border rounded-lg text-sm"
                            style={{ animationDelay: `${i * 150}ms` }}
                        >
                            <Loader2 size={12} className="text-primary animate-spin shrink-0" />
                            <span className="text-muted-foreground font-mono text-xs truncate">{s.name}</span>
                        </div>
                    ))}
                    <p className="text-xs font-mono text-muted-foreground pt-1">+ {songs.length - 5} more…</p>
                </div>
            </div>
        </div>
    );
}

function DoneView({
    setlist,
    visibility,
    onReset,
}: {
    setlist: Setlist;
    visibility: PlaylistVisibility;
    onReset: () => void;
}) {
    const songs = allSongs(setlist);
    const playlistName = `${setlist.artist.name} @ ${setlist.venue.name} (${setlist.eventDate.getFullYear()})`;
    const visOption = VISIBILITY_OPTIONS.find((o) => o.value === visibility)!;
    const VisIcon = visOption.Icon;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6">
            <div className="text-center max-w-md">
                <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-6">
                    <Check size={32} className="text-primary" />
                </div>
                <h2 className="font-display font-bold text-4xl text-foreground mb-2">Playlist created!</h2>
                <p className="text-muted-foreground text-sm mb-8">
                    {songs.length} tracks are now waiting for you in Spotify.
                </p>

                <div className="bg-card border border-primary/20 rounded-xl p-5 text-left mb-6">
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Music size={22} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground truncate">{playlistName}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-xs text-muted-foreground font-mono">{songs.length} tracks · {setlist.artist.name}</p>
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted text-xs font-mono text-muted-foreground border border-border">
                                    <VisIcon size={9} />
                                    {visOption.label}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                                {songs.slice(0, 3).map((s, i) => (
                                    <span key={i} className="text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground font-mono">{s.name}</span>
                                ))}
                                <span className="text-xs px-1.5 py-0.5 text-muted-foreground font-mono">…</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 justify-center">
                    <button className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all">
                        <ExternalLink size={15} />
                        Open in Spotify
                    </button>
                    <button
                        onClick={onReset}
                        className="flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-xl font-semibold text-sm hover:bg-secondary/80 transition-all"
                    >
                        Find another setlist
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── API notice banner ──────────────────────────────────────────────────────

function ApiNoticeBanner() {
    const [dismissed, setDismissed] = useState(false);
    if (dismissed) return null;
    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl shadow-xl text-xs font-mono text-muted-foreground max-w-lg w-full mx-4">
            <span className="text-accent shrink-0">⚠</span>
            <span className="flex-1">
                Demo mode — connect your{" "}
                <span className="text-foreground">setlist.fm API key</span> and{" "}
                <span className="text-primary">Spotify OAuth</span> to go live.
            </span>
            <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground transition-colors ml-2 shrink-0">
                ✕
            </button>
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

    async function handleSearch() {
        if (!query.trim()) return;
        setLoading(true);

        const searchResponse = await fetch('Setlist/artistsearch?searchText=' + encodeURIComponent(query));
        if (!searchResponse.ok) {
            setLoading(false);
            return;
        }
        const searchResult = await searchResponse.json();
        //setArtists(searchResult.artists);

        setResults(searchResult);
        setView("results");
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
        setLoading(false);
    }

    function handleSelect(s: Setlist) {
        setSelected(s);
        setView("setlist");
    }

    async function handleCreatePlaylist(v: PlaylistVisibility) {
        setVisibility(v);
        setView("creating");
        await new Promise((r) => setTimeout(r, 3200));
        setView("done");
    }

    function handleReset() {
        setQuery("");
        setResults([]);
        setSelected(null);
        setView("search");
    }

    return (
        <div
            className="min-h-screen bg-background text-foreground"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
            <style>{`
        .font-display { font-family: 'Barlow Condensed', sans-serif; }
        .font-mono { font-family: 'DM Mono', monospace; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

            {view === "search" && (
                <HeroSearch
                    query={query}
                    setQuery={setQuery}
                    onSearch={handleSearch}
                    onPasteUrl={handlePasteUrl}
                    loading={loading}
                />
            )}
            {view === "results" && (
                <ResultsView
                    query={query}
                    setlists={results}
                    onSelect={handleSelect}
                    onBack={handleReset}
                />
            )}
            {view === "setlist" && selected && (
                <SetlistView
                    setlist={selected}
                    onBack={() => setView("results")}
                    onCreatePlaylist={handleCreatePlaylist}
                />
            )}
            {view === "creating" && selected && <CreatingView setlist={selected} />}
            {view === "done" && selected && (
                <DoneView setlist={selected} visibility={visibility} onReset={handleReset} />
            )}

            <ApiNoticeBanner />
        </div>
    );
}
