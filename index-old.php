<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stadium+ Live</title>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Alpine.js -->
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        brand: '#e50914', // The specific red from the design
                        dark: '#0f0f0f',  // Main background
                        card: '#1a1a1a',  // Card background
                        muted: '#a1a1aa'  // Text color
                    },
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                    }
                }
            }
        }
    </script>
    <style>
        /* Custom scrollbar for a cleaner look */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #0f0f0f; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #555; }
    </style>
</head>
<body class="bg-dark text-white font-sans antialiased" x-data="appData()">

        <!-- NAVIGATION -->
        <nav class="border-b border-[#ffffff0d] bg-dark/95 sticky top-0 z-50 backdrop-blur">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-16">
                    <!-- Logo -->
                    <div class="flex-shrink-0 flex items-center gap-2 cursor-pointer" @click="activeCategory = 'live'; fetchMatches()">
                        <!-- The "FR" Badge -->
                        <div class="bg-brand text-white font-black text-xl px-2 py-1 rounded tracking-tighter">FR</div>
                        <!-- The Brand Name -->
                        <span class="text-white hidden sm:block font-bold text-xl tracking-tight">FRONT ROW STREAM</span>
                    </div>

                    <!-- Desktop Menu -->
                    <div class="hidden md:flex space-x-8">
                        <a href="#" @click.prevent="activeCategory = 'live'; fetchMatches()" 
                        :class="activeCategory === 'live' ? 'text-white border-b-2 border-brand' : 'text-[#ffb4aaa8] hover:text-white'" 
                        class="px-1 py-5 font-medium transition">Live</a>
                        
                        <a href="#" @click.prevent="activeCategory = 'football'; fetchMatches()" 
                        :class="activeCategory === 'football' ? 'text-white border-b-2 border-brand' : 'text-[#ffb4aaa8] hover:text-white'" 
                        class="px-1 py-5 font-medium transition">Football</a>
                        
                        <a href="#" @click.prevent="activeCategory = 'basketball'; fetchMatches()" 
                        :class="activeCategory === 'basketball' ? 'text-white border-b-2 border-brand' : 'text-[#ffb4aaa8] hover:text-white'" 
                        class="px-1 py-5 font-medium transition">Basketball</a>
                        
                        <a href="#" @click.prevent="activeCategory = 'fight'; fetchMatches()" 
                        :class="activeCategory === 'fight' ? 'text-white border-b-2 border-brand' : 'text-[#ffb4aaa8] hover:text-white'" 
                        class="px-1 py-5 font-medium transition">UFC/Boxing</a>
                    </div>

                    <!-- Right Side: Live Counter, Refresh & Telegram -->
                    <div class="flex items-center gap-3">
                        <!-- LIVE MATCH COUNTER -->
                        <div :class="liveCount() > 0 ? 'bg-brand text-white' : 'bg-card text-gray-500'" class=" bg-brand text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2 shadow-lg">
                            
                            <span class="w-2 h-2 bg-white rounded-full animate-pulse"></span> 
                            <span x-text="liveCount() > 0 ? `${liveCount()} LIVE ` : 'NO LIVE'"></span>
                        </div>

                        <!-- REFRESH BUTTON -->
                        <button 
                            @click="fetchMatches()" 
                            class="bg-card border border-[#ffffff0d] text-white p-2 rounded-full hover:bg-gray-700 transition shadow-md">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </nav>

    <!-- MAIN CONTENT -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        <!-- Header Section -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h1 class="text-3xl font-bold text-white mb-2">Live & Upcoming Matches</h1>
                <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <!-- Custom Styled Dropdown -->
                    <div class="relative w-full sm:w-64">
                        <select 
                            x-model="activeCategory" 
                            @change="fetchMatches()" 
                            class="appearance-none w-full bg-card border border-[#ffffff0d] text-white text-sm rounded-lg pl-4 pr-10 py-2.5 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/50 cursor-pointer hover:border-gray-500 transition-colors">
                            
                            <option value="live">🔴 Live Now</option>
                            
                            <!-- Dynamic Categories from API -->
                            <template x-for="cat in categories" :key="cat.value">
                                <option :value="cat.value" x-text="cat.name"></option>
                            </template>
                        </select>
                        
                        <!-- Custom Chevron Icon -->
                        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </div>
                    </div>
                    
                    <!-- Match Count -->
                    <span class="text-[#ffb4aaa8] text-sm whitespace-nowrap">
                        Showing <span class="text-white font-semibold" x-text="matches.length"></span> matches
                    </span>
                </div>
                </div>
            </div>
        </div>
        <!-- Loading State -->
        <div x-show="loading" class="text-center py-20">
            <div class="inline-block w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
            <p class="mt-4 text-[#ffb4aaa8]">Loading matches...</p>
        </div>

        <!-- Error State -->
        <div x-show="error" class="bg-red-900/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6 text-center" x-text="error"></div>

        <!-- MATCH GRID (First 6 Matches) -->
        <div x-show="!loading && gridMatches.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            <!-- FIX: Changed 'matches' to 'gridMatches' -->
            <template x-for="match in gridMatches" :key="match.id">
                <div class="bg-card rounded-xl overflow-hidden border border-[#ffffff0d] transition cursor-pointer group" @click="openMatch(match)">
                    
                    <!-- Image Area -->
                    <!-- FIX: Changed 'h-54' to 'h-48' so the black background actually has height -->
                    <div class="relative h-48 overflow-hidden bg-black">
                        <img x-show="match.image" :src="match.image" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                        
                        <!-- Live Badge -->
                        <div x-show="match.isLive" class="absolute top-4 left-4 bg-brand text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2 shadow-lg">
                            <span class="w-2 h-2 bg-white rounded-full animate-pulse"></span> LIVE
                        </div>
                        
                        <!-- Category Badge -->
                        <div class="absolute bottom-4 left-4 bg-[#131313cc] backdrop-blur text-[#ffb4aa] text-xs font-bold px-3 py-1 rounded uppercase tracking-wide border border-[#ffb4aa47]">
                            <span x-text="match.category"></span>
                        </div>
                    </div>

                    <!-- Content Area -->
                    <div class="p-5">
                        <div class="flex justify-between items-start mb-2">
                            <h3 class="text-xl font-bold text-white leading-tight group-hover:text-[#ffb4aa] transition" x-text="match.title"></h3>
                            <span class="text-brand font-bold text-sm whitespace-nowrap ml-2" x-text="match.status"></span>
                        </div>
                        <div class="flex items-center gap-4 text-[#ffb4aaa8] text-sm mt-3">
                            <div class="flex items-center gap-1">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                <span x-text="match.date"></span>
                            </div>
                            <div class="flex items-center gap-1 truncate">
                                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                <span class="truncate" x-text="match.location"></span>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </div>
        <!-- MATCH LIST (Remaining Matches) -->
        <div x-show="!loading && listMatches.length > 0">
            <h2 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span class="w-1 h-6 bg-brand rounded-full"></span> More Matches
            </h2>
            
            <div class="flex flex-col gap-3">
                <template x-for="match in listMatches" :key="match.id">
                    <div class="bg-card rounded-lg border border-[#ffffff0d] transition cursor-pointer flex items-center overflow-hidden group" @click="openMatch(match)">
                        
                        <!-- Added bg-black class here -->
                        <div class="relative w-32 md:w-48 h-20 md:h-28 flex-shrink-0 overflow-hidden bg-black">
                            <!-- Only show image if it exists -->
                            <img x-show="match.image" :src="match.image" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                            
                            <!-- Badge stays the same -->
                            <div x-show="match.isLive" class="absolute top-2 left-2 bg-brand text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                <span class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> LIVE
                            </div>
                        </div>

                        <!-- List Content -->
                        <div class="flex-1 p-4 min-w-0">
                            <h3 class="text-base md:text-lg font-bold text-white truncate group-hover:text-[#ffb4aa] transition" x-text="match.title"></h3>
                            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#ffb4aaa8] text-xs md:text-sm mt-1">
                                <span class="bg-[#131313cc] px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide" x-text="match.category"></span>
                                <span class="flex items-center gap-1">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                    <span x-text="match.date"></span>
                                </span>
                                <span class="flex items-center gap-1 truncate hidden sm:flex">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                    <span class="truncate" x-text="match.location"></span>
                                </span>
                            </div>
                        </div>

                        <!-- List Status/Time (Right Side) -->
                        <div class="px-4 md:px-6 flex-shrink-0 text-right">
                            <span class="text-brand font-bold text-sm md:text-base" x-text="match.status"></span>
                            <div class="text-gray-500 text-xs mt-1 hidden md:block">Watch Now &rarr;</div>
                        </div>
                    </div>
                </template>
            </div>
        </div>

        <!-- Empty State -->
        <div x-show="!loading && matches.length === 0 && !error" class="text-center py-20 text-[#ffb4aaa8]">
            <svg class="w-16 h-16 mx-auto mb-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <p class="text-xl font-semibold">No matches found</p>
            <p class="text-sm mt-2">Try selecting a different category from the navigation bar.</p>
        </div>

    </main>

    <!-- FOOTER -->
    <footer class="border-t border-[#ffffff0d] bg-dark mt-10 py-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
                <div class="flex items-center gap-2 mb-2">
                    <div class="bg-brand text-white font-black text-lg px-2 py-0.5 rounded tracking-tighter">FR</div>
                    <span class="text-white font-bold text-lg tracking-tight">FRONT ROW STREAM</span>
                </div>
                <p class="text-[#ffb4aaa8] text-sm mt-2 max-w-xs">Elevate your sports experience with ultra-low latency streaming and real-time statistics.</p>
            </div>
            <div class="flex justify-center gap-6 text-sm text-[#ffb4aaa8]">
                <a href="#" class="hover:text-white">Home</a>
                <a href="#" class="hover:text-white">DMCA</a>
                <a href="#" class="hover:text-white">Contact</a>
            </div>
            <div class="text-right text-sm text-[#ffb4aaa8]">
                <a href="https://t.me/your_channel" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 hover:text-white transition-colors duration-200">
                    <!-- Telegram Icon (Kept the official brand blue) -->
                    <svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="#29b6f6" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.16 14.26 4.202 13.37c-.642-.204-.655-.642.136-.953l10.857-4.19c.537-.194 1.006.131.367.02z"></path>
                    </svg>
                    <span>Telegram</span>
                </a>
            </div>
        </div>
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 border-t border-[#ffffff0d] pt-6">
            <p class="text-center text-xs text-gray-600 mt-6">This site is not affiliated with any official sports league or organization. All content is for informational purposes only.</p>
            <div class="text-center text-sm text-[#ffb4aaa8] mt-4">
                &copy; 2026 FRONT ROW STREAM. ALL RIGHTS RESERVED.
            </div>
        </div>
    </footer>

    <!-- LOGIC -->
    <script>
        function appData() {
        return {
            view: 'home',
            activeCategory: 'live',
            matches: [],
            liveCount() {
                return this.matches.filter(match => match.isLive).length;
            },
            gridMatches: [],
            listMatches: [],
            categories: [], // Will hold dynamic categories from API
            loading: false,
            error: null,

            async init() {
                await this.fetchCategories(); // Fetch categories first
                await this.fetchMatches();    // Then fetch matches
            },

            async fetchCategories() {
                try {
                    const res = await fetch('./api/sports.php');
                    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                    
                    const data = await res.json();
                    
                    // The API returns an array of sports objects
                    // Map them to a simple format for the dropdown
                    this.categories = data.map(sport => ({
                        value: sport.slug || sport.id || sport.name.toLowerCase().replace(/\s+/g, '-'),
                        name: sport.name || sport.title || sport
                    }));
                    
                } catch (e) {
                    console.error('Failed to fetch categories:', e);
                    // Fallback categories if API fails
                    this.categories = [
                        { value: 'football', name: 'Football' },
                        { value: 'basketball', name: 'Basketball' },
                        { value: 'tennis', name: 'Tennis' },
                        { value: 'fight', name: 'UFC/Boxing' }
                    ];
                }
            },

            async fetchMatches() {
                this.loading = true;
                this.error = null;
                try {
                    const res = await fetch(`./api/matches.php?cat=${this.activeCategory}`);
                    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                    
                    const data = await res.json();
                    let rawMatches = Array.isArray(data) ? data : (data.matches || data.data || []);

                    // Map API data to our UI structure
                    this.matches = rawMatches.map(match => {
                        const isLive = new Date(match.date) < new Date();
                        const cat = (match.category || match.sport || this.activeCategory).toLowerCase();
                        
                        return {
                            id: match.id,
                            title: match.title || `${match.teams?.home?.name || 'Team A'} vs ${match.teams?.away?.name || 'Team B'}`,
                            category: cat.charAt(0).toUpperCase() + cat.slice(1),
                            isLive: isLive,
                            status: isLive ? 'LIVE' : 'UPCOMING',
                            date: new Date(match.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                            location: match.league || match.competition || 'Live Event',
                            image: match.poster ? (match.poster.startsWith('http') ? match.poster : 'https://streamed.pk' + match.poster) : null,
                            sources: match.sources || []
                        };
                    });
        
                    // Split into Grid (first 6) and List (the rest)
                    this.gridMatches = this.matches.slice(0, 6);
                    this.listMatches = this.matches.slice(6);

                } catch (e) {
                    console.error('Failed to fetch matches:', e);
                    this.error = e.message;
                } finally {
                    this.loading = false;
                }
            },

            openMatch(match) {
                const firstSource = match.sources && match.sources.length > 0 ? match.sources[0].source : 'alpha';
                const sourceId = match.sources && match.sources.length > 0 ? match.sources[0].id : match.id;
                
                // Added &isLive=${match.isLive} to the URL
                window.location.href = `match.php?source=${firstSource}&id=${sourceId}&title=${encodeURIComponent(match.title)}&isLive=${match.isLive}`;
            }
        }
}
    </script>
</body>
</html>