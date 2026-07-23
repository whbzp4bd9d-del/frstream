// js/app.js

function appData() {
    return {
        activeCategory: 'live',
        searchQuery: '',
        categories: [],
        otherCategories: [],
        matches: [],
        featuredMatches: [],
        groupedMatches: [],
        liveCount: 0,
        loading: false,
        error: null,

        get isSearching() {
            return this.searchQuery.trim().length > 0;
        },

        get filteredMatches() {
            if (!this.searchQuery.trim()) {
                return this.matches;
            }
            const query = this.searchQuery.toLowerCase().trim();
            return this.matches.filter(match => {
                return (
                    match.title.toLowerCase().includes(query) ||
                    match.location.toLowerCase().includes(query) ||
                    match.category.toLowerCase().includes(query)
                );
            });
        },

        get filteredFeaturedMatches() {
            if (this.isSearching) return [];
            const sorted = [...this.filteredMatches].sort((a, b) => {
                if (a.isLive && !b.isLive) return -1;
                if (!a.isLive && b.isLive) return 1;
                return 0;
            });
            return sorted.slice(0, 4);
        },

        get remainingMatches() {
            if (this.isSearching) return this.filteredMatches;
            const featuredIds = this.filteredFeaturedMatches.map(m => m.id);
            return this.filteredMatches.filter(m => !featuredIds.includes(m.id));
        },

        get filteredGroupedMatches() {
            return this.groupMatchesByDate(this.remainingMatches);
        },

        async init() {
            await this.fetchCategories();
            await this.fetchMatches();
        },

        isOtherCategory() {
            return this.otherCategories.some(cat => cat.value === this.activeCategory);
        },

        async fetchCategories() {
            try {
                const res = await fetch('https://frontrowstream.live/api/sports.php');
                if (!res.ok) throw new Error('Failed to fetch categories');
                const data = await res.json();
                
                const allCategories = data.map(sport => ({
                    value: sport.slug || sport.id || sport.name.toLowerCase().replace(/\s+/g, '-'),
                    name: sport.name || sport.title || sport
                }));

                const mainCategories = ['football', 'basketball', 'american-football'];
                this.otherCategories = allCategories.filter(cat => 
                    !mainCategories.includes(cat.value) && cat.value !== 'live'
                );

                this.categories = [
                    { value: 'live', name: 'All Live Events' },
                    ...allCategories
                ];
            } catch (e) {
                console.error(e);
                this.otherCategories = [
                    { value: 'tennis', name: 'Tennis' },
                    { value: 'mma', name: 'MMA' },
                    { value: 'cricket', name: 'Cricket' },
                    { value: 'rugby', name: 'Rugby' }
                ];
            }
        },

        async fetchMatches() {
            this.loading = true;
            this.error = null;
            try {
                const res = await fetch(`https://frontrowstream.live/api/matches.php?cat=${this.activeCategory}`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                
                const data = await res.json();
                const rawMatches = Array.isArray(data) ? data : (data.matches || data.data || []);

                this.matches = rawMatches.map(match => {
                    const timestamp = Number(match.date || match.time || Date.now());
                    const dateObj = new Date(timestamp);
                    const isLive = dateObj < new Date();
                    const cat = (match.category || match.sport || this.activeCategory).toLowerCase();
                    
                    return {
                        id: match.id,
                        title: match.title || `${match.teams?.home?.name || 'Team A'} vs ${match.teams?.away?.name || 'Team B'}`,
                        category: cat,
                        isLive: isLive,
                        popular: match.popular === true || match.popular === '1' || match.popular === 1,
                        time: dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
                        date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                        dateLabel: dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
                        location: match.league || match.competition || cat.toUpperCase(),
                        sources: match.sources || [],
                        timestamp: timestamp
                    };
                });

                this.liveCount = this.matches.filter(m => m.isLive).length;

                const sorted = [...this.matches].sort((a, b) => {
                    if (a.isLive && !b.isLive) return -1;
                    if (!a.isLive && b.isLive) return 1;
                    return 0;
                });
                this.featuredMatches = sorted.slice(0, 4);
                this.groupedMatches = this.groupMatchesByDate(this.matches);

            } catch (e) {
                console.error(e);
                this.error = e.message;
            } finally {
                this.loading = false;
            }
        },

        groupMatchesByDate(matches) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const groups = {};
            
            for (const match of matches) {
                const matchDate = new Date(match.timestamp);
                matchDate.setHours(0, 0, 0, 0);
                
                let label = 'Upcoming';
                let sortOrder = 999;

                if (matchDate.getTime() === today.getTime()) {
                    label = 'Today';
                    sortOrder = 0;
                } else if (matchDate.getTime() === tomorrow.getTime()) {
                    label = 'Tomorrow';
                    sortOrder = 1;
                } else {
                    label = matchDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric' 
                    });
                    sortOrder = Math.floor((matchDate - today) / (1000 * 60 * 60 * 24));
                }
                
                if (!groups[label]) {
                    groups[label] = { label, sortOrder, matches: [] };
                }
                groups[label].matches.push(match);
            }

            return Object.values(groups)
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map(group => ({
                    label: group.label,
                    matches: group.matches.sort((a, b) => a.timestamp - b.timestamp)
                }));
        },

        openMatch(match) {
            const firstSource = match.sources && match.sources.length > 0 ? match.sources[0].source : 'alpha';
            const sourceId = match.sources && match.sources.length > 0 ? match.sources[0].id : match.id;
            
            // Added the date parameter to the URL
            window.location.href = `match.html?source=${firstSource}&id=${sourceId}&title=${encodeURIComponent(match.title)}&isLive=${match.isLive}&date=${encodeURIComponent(match.date)}`;
        }
    }
}