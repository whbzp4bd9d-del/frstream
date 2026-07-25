// js/match.js

function matchPage() {
    return {
        loading: true,
        viewerCount: 0,
        streamEnded: false,
        showToast: false,
        activeSource: null,
        matchNotStarted: false,
        currentStreamUrl: '',
        match: { title: 'Loading...', location: 'Live Event', date: '', isLive: false, startTime: Date.now() },
        sources: [],
        recommendedMatches: [],
        rawStats: {
            possession: { home: 58, away: 42 },
            shotsOnTarget: { home: 12, away: 7 },
            totalShots: { home: 18, away: 11 },
            corners: { home: 7, away: 4 }
        },

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
            const tsParam = params.get('ts');

            this.match.title = decodeURIComponent(title);
            
            // 🚨 SAFETY: Ensure we have a valid number. If ts is missing/invalid, default to now.
            let startTime = tsParam ? Number(tsParam) : 0;
            if (isNaN(startTime) || startTime === 0) {
                startTime = Date.now(); // Fallback so the page doesn't break
            }
            this.match.startTime = startTime;

            const now = Date.now();
            const fifteenMinsMs = 15 * 60 * 1000; // 15 minutes in milliseconds
            const threeHoursMs = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

            // 1. Is it in the future? (Only "Not Started" if it's MORE than 15 mins away)
            this.matchNotStarted = this.match.startTime > (now + fifteenMinsMs);
            
            // 2. Is it live? (Starting within 15 mins, OR already started, AND not older than 3 hours)
            this.match.isLive = !this.matchNotStarted && (this.match.startTime >= (now - threeHoursMs));

            // Optional: Keep this console log for a few days to verify it's working perfectly
            console.log("Match Time Debug:", { 
                startTime: new Date(this.match.startTime).toLocaleString(),
                now: new Date(now).toLocaleString(),
                isLive: this.match.isLive, 
                notStarted: this.matchNotStarted 
            });

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
                        quality: (s.hd === true) ? 'HD' : 'SD',
                        url: s.embedUrl,
                    }));

                    const rawViews = streams[0].views || streams[0].viewers || 0;
                    this.viewerCount = parseInt(rawViews) || 0;

                    // 🚨 STREAM ENDED CHECK: Started >3 hours ago AND 0 views
                    const threeHoursMs = 3 * 60 * 60 * 1000;
                    if (!this.matchNotStarted && this.match.startTime < (Date.now() - threeHoursMs) && this.viewerCount === 0) {
                        this.streamEnded = true;
                        this.loading = false;
                        return; // Stop loading the player
                    }

                    this.selectSource(this.sources[0]);
                } else {
                    this.loading = false;
                }
            } catch (e) {
                console.error('Stream load error:', e);
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
                    .filter(m => m.popular === true || m.popular === '1' || m.popular === 1) 
                    .slice(0, 5)
                    .map(match => {
                        const dateObj = new Date(Number(match.date || match.time || Date.now()));
                        return {
                            id: match.id,
                            title: match.title || 'Live Match',
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
            setTimeout(() => { this.loading = false; }, 300);
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

            if (navigator.share) {
                try { await navigator.share(shareData); } catch (err) { console.log('Share canceled', err); }
            } else {
                try {
                    await navigator.clipboard.writeText(window.location.href);
                    this.showToast = true;
                    setTimeout(() => this.showToast = false, 2500);
                } catch (err) { console.error('Failed to copy', err); }
            }
        },

        openRecommendedMatch(match) {
            const firstSource = match.sources && match.sources.length > 0 ? match.sources[0].source : 'alpha';
            const sourceId = match.sources && match.sources.length > 0 ? match.sources[0].id : match.id;
            window.location.href = `match.html?source=${firstSource}&id=${sourceId}&title=${encodeURIComponent(match.title)}&ts=${match.timestamp || Date.now()}`;
        }
    }
}