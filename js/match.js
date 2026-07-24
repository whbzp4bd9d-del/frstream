// js/match.js

function matchPage() {
    return {
        loading: true,
        viewerCount: 0,
        showToast: false,
        activeSource: null,
        currentStreamUrl: '',
        match: { title: 'Loading...', location: '', date: '', isLive: false },
        sources: [],
        recommendedMatches: [],
        rawStats: {
            possession: { home: 58, away: 42 },
            shotsOnTarget: { home: 12, away: 7 },
            totalShots: { home: 18, away: 11 },
            corners: { home: 7, away: 4 }
        },
        player: { name: 'Player Name', team: 'Team', goals: 0, rating: 0.0, passes: 0, tackles: 0 },

        get statsList() {
            const format = (h, a) => {
                const total = h + a;
                const pH = total === 0 ? 50 : Math.round((h / total) * 100);
                return { home: h, away: a, percentHome: pH, percentAway: 100 - pH };
            };
            return [
                { label: 'Possession', ...format(this.rawStats.possession.home, this.rawStats.possession.away) },
                { label: 'Shots on Target', ...format(this.rawStats.shotsOnTarget.home, this.rawStats.shotsOnTarget.away) },
                { label: 'Total Shots', ...format(this.rawStats.totalShots.home, this.rawStats.totalShots.away) },
                { label: 'Corners', ...format(this.rawStats.corners.home, this.rawStats.corners.away) }
            ];
        },

        async init() {
            const params = new URLSearchParams(window.location.search);
            const source = params.get('source');
            const id = params.get('id');
            const title = params.get('title') || 'Live Match';
            const isLiveParam = params.get('isLive');
            const dateParam = params.get('date'); // 👈 NEW: Get the date from URL

            this.match.title = decodeURIComponent(title);
            this.match.isLive = (isLiveParam === 'true');
            
            this.match.date = dateParam ? decodeURIComponent(dateParam) : 'Date TBD';
            document.title = `${this.match.title} | Live Stream & Stats - Frstream`;

            if (source && id) {
                await this.loadStream(source, id);
            } else {
                this.loading = false;
            }

            if (!this.match.isLive) {
                await this.fetchRecommendedMatches();
            }
        },

        async loadStream(source, id) {
            this.loading = true;
            try {
                const res = await fetch(`https://frontrowstream.live/api/stream.php?source=${source}&id=${id}`);
                const data = await res.json();
                const streams = Array.isArray(data) ? data : [];

                if (streams.length > 0) {
                    this.sources = streams.map((s, index) => ({
                        id: `source_${index}`,
                        name: s.source ? s.source.charAt(0).toUpperCase() + s.source.slice(1) : `Server ${index + 1}`,
                        quality: index === 0 ? 'HD' : 'SD',
                        url: s.embedUrl,
                    }));

                    const rawViews = streams[0].views || streams[0].viewers || 0;
                    this.viewerCount = parseInt(rawViews) || 0;

                    this.selectSource(this.sources[0]);
                } else {
                    this.loading = false;
                }
            } catch (e) {
                console.error(e);
                this.loading = false;
            }
        },

        async fetchRecommendedMatches() {
            try {
                const res = await fetch('https://frontrowstream.live/api/matches.php?cat=live');
                if (!res.ok) return;
                const data = await res.json();
                const rawMatches = Array.isArray(data) ? data : (data.matches || []);

                this.recommendedMatches = rawMatches
                    .filter(m => m.popular === true || m.popular === '1') 
                    .slice(0, 5)
                    .map(match => {
                        const dateObj = new Date(Number(match.date || match.time || Date.now()));
                        return {
                            id: match.id,
                            title: match.title || `${match.teams?.home?.name} vs ${match.teams?.away?.name}`,
                            location: match.league || match.competition,
                            time: dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
                            sources: match.sources || []
                        };
                    });
            } catch (e) { console.error(e); }
        },

        selectSource(source) {
            this.loading = true;
            this.activeSource = source;
            this.currentStreamUrl = source.url;
        },

        formatViewers(count) {
            if (!count || count === 0) return 'Live';
            if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
            if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
            return count.toString();
        },
        
        async shareMatch() {
            const shareData = {
                title: this.match.title,
                text: `Watch ${this.match.title} live on Front Row Stream!`,
                url: window.location.href
            };

            // Try native mobile share sheet first
            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                } catch (err) {
                    console.log('Share canceled or failed', err);
                }
            } else {
                // Fallback for desktop: Copy to clipboard
                try {
                    await navigator.clipboard.writeText(window.location.href);
                    this.showToast = true;
                    setTimeout(() => this.showToast = false, 2500); // Hide after 2.5s
                } catch (err) {
                    console.error('Failed to copy', err);
                }
            }
        },

        openRecommendedMatch(match) {
            const firstSource = match.sources && match.sources.length > 0 ? match.sources[0].source : 'alpha';
            const sourceId = match.sources && match.sources.length > 0 ? match.sources[0].id : match.id;
            window.location.href = `match.html?source=${firstSource}&id=${sourceId}&title=${encodeURIComponent(match.title)}&isLive=true`;
        }
    }
}