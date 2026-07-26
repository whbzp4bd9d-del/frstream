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
            return this.matches.filter(function(match) {
                return (
                    match.title.toLowerCase().includes(query) ||
                    match.location.toLowerCase().includes(query) ||
                    match.category.toLowerCase().includes(query)
                );
            });
        },

        get filteredFeaturedMatches() {
            if (this.isSearching) return [];
            const sorted = [...this.filteredMatches].sort(function(a, b) {
                if (a.isLive && !b.isLive) return -1;
                if (!a.isLive && b.isLive) return 1;
                return 0;
            });
            return sorted.slice(0, 4);
        },

        get remainingMatches() {
            if (this.isSearching) return this.filteredMatches;
            const featuredIds = this.filteredFeaturedMatches.map(function(m) { return m.id; });
            return this.filteredMatches.filter(function(m) { return !featuredIds.includes(m.id); });
        },

        get filteredGroupedMatches() {
            return this.groupMatchesByDate(this.remainingMatches);
        },

        async init() {
            try {
                const savedCategory = sessionStorage.getItem('activeCategory');
                if (savedCategory) {
                    this.activeCategory = savedCategory;
                }
            } catch (e) {
                console.log('sessionStorage not available');
            }
            
            await this.fetchCategories();
            await this.fetchMatches();
        },

        setCategory: function(cat) {
            this.activeCategory = cat;
            try {
                sessionStorage.setItem('activeCategory', cat);
            } catch (e) {
                console.log('Could not save category');
            }
            this.fetchMatches();
        },

        isOtherCategory: function() {
            return this.otherCategories.some(function(cat) { return cat.value === this.activeCategory; }.bind(this));
        },

        async fetchCategories() {
            try {
                const res = await fetch('https://frontrowstream.live/api/sports.php');
                if (!res.ok) throw new Error('Failed to fetch categories');
                const data = await res.json();
                
                const allCategories = data.map(function(sport) {
                    return {
                        value: sport.slug || sport.id || sport.name.toLowerCase().replace(/\s+/g, '-'),
                        name: sport.name || sport.title || sport
                    };
                });

                const mainCategories = ['football', 'basketball', 'american-football'];
                this.otherCategories = allCategories.filter(function(cat) { 
                    return !mainCategories.includes(cat.value) && cat.value !== 'live';
                });

                this.categories = [
                    { value: 'live', name: 'All Live Events' }
                ].concat(allCategories);
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
                const res = await fetch('https://frontrowstream.live/api/matches.php?cat=' + this.activeCategory);
                if (!res.ok) throw new Error('HTTP ' + res.status);
                
                const data = await res.json();
                const rawMatches = Array.isArray(data) ? data : (data.matches || data.data || []);

                const now = Date.now();
                const threeHoursMs = 3 * 60 * 60 * 1000;

                this.matches = rawMatches.map(function(match) {
                    const timestamp = Number(match.date || match.time || Date.now());
                    const isLive = (timestamp <= now) && (timestamp >= (now - threeHoursMs));
                    const cat = (match.category || match.sport || this.activeCategory).toLowerCase();
                    
                    return {
                        id: match.id,
                        title: match.title || ((match.teams && match.teams.home ? match.teams.home.name : 'Team A') + ' vs ' + (match.teams && match.teams.away ? match.teams.away.name : 'Team B')),
                        category: cat,
                        isLive: isLive,
                        popular: match.popular === true || match.popular === '1' || match.popular === 1,
                        time: new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
                        date: new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                        dateLabel: new Date(timestamp).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
                        location: match.league || match.competition || cat.toUpperCase(),
                        sources: match.sources || [],
                        timestamp: timestamp
                    };
                }.bind(this)).filter(function(match) {
                    return match.timestamp >= (now - threeHoursMs);
                });

                this.liveCount = this.matches.filter(function(m) { return m.isLive; }).length;

                const sorted = [...this.matches].sort(function(a, b) {
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

        groupMatchesByDate: function(matches) {
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
                    groups[label] = { label: label, sortOrder: sortOrder, matches: [] };
                }
                groups[label].matches.push(match);
            }

            return Object.values(groups)
                .sort(function(a, b) { return a.sortOrder - b.sortOrder; })
                .map(function(group) {
                    return {
                        label: group.label,
                        matches: group.matches.sort(function(a, b) { return a.timestamp - b.timestamp; })
                    };
                });
        },

        openMatch: function(match) {
            const firstSource = match.sources && match.sources.length > 0 ? match.sources[0].source : 'alpha';
            const sourceId = match.sources && match.sources.length > 0 ? match.sources[0].id : match.id;
            
            window.location.href = 'match.html?source=' + firstSource + '&id=' + sourceId + '&title=' + encodeURIComponent(match.title) + '&ts=' + match.timestamp;
        }
    }
}