// CodeSphere Platform Logic
// Handles SPA routing, state management, and view rendering.

// State Management
const state = {
    user: {
        name: "Pythonista",
        username: "@code_wizard",
        avatar: "", // empty means placeholder
        xp: 2450,
        cc: 340,
        streak: 12,
        rank: 47,
        badges: ["First Snake", "7-Day Flame"],
        progress: {
            roadmap: 38, // 38/120 topics
            challenges: 32,
            battles: { w: 18, l: 9 }
        }
    },
    rewards: {
        dailyClaimed: false,
        streakShield: 1,
        adsWatched: 2
    },
    currentView: 'landing', // landing, dashboard, signin, etc.
    isAuthenticated: false // Mock auth state
};

// Router
function initRouter() {
    window.addEventListener('hashchange', handleRoute);
    handleRoute(); // Initial load
}

function handleRoute() {
    const hash = window.location.hash.slice(1) || '/';
    console.log("Routing to:", hash);

    let view = 'landing';
    if (hash === '/') view = 'landing';
    else if (hash === '/dashboard') view = 'dashboard';
    else if (hash === '/signin') view = 'signin';
    else if (hash === '/signup') view = 'signup';
    else if (hash === '/roadmap') view = 'roadmap';
    else if (hash === '/challenges') view = 'challenges';
    else if (hash === '/battle') view = 'battle';
    else if (hash === '/store') view = 'store';
    else if (hash === '/profile') view = 'profile';

    // Auth Guard (Redirect to / if not auth, except for public pages)
    const publicRoutes = ['landing', 'signin', 'signup'];
    if (!state.isAuthenticated && !publicRoutes.includes(view)) {
        window.location.hash = '/signin';
        return;
    }

    // Redirect to Dashboard if auth and trying to access Landing/SignIn
    if (state.isAuthenticated && (view === 'landing' || view === 'signin' || view === 'signup')) {
        window.location.hash = '/dashboard';
        return;
    }

    state.currentView = view;
    render();
}

// Render Engine
function render() {
    const app = document.getElementById('app');
    if (!app) return;

    let html = '';
    switch (state.currentView) {
        case 'landing':
            html = renderLandingPage();
            break;
        case 'dashboard':
            html = renderDashboard();
            break;
        case 'signin':
            html = renderSignIn();
            break;
        case 'signup':
            html = renderSignUp();
            break;
        default:
            html = `<div class="p-10 text-center text-white"><h1>404 - Page Not Found</h1><a href="#/" class="text-green-400">Go Home</a></div>`;
    }

    app.innerHTML = html;
    postRender();
}

// Post-Render Hooks (Event Listeners, Animations)
function postRender() {
    // Re-attach event listeners or run scripts for specific views
    if (state.currentView === 'landing') {
        // Init typing animation for hero?
    }
}

// View Placeholders (to be implemented)
function renderLandingPage() {
    return `
    <!-- Hero Section -->
    <section class="relative bg-deep pt-20 pb-32 overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-deep via-deep to-surface opacity-90"></div>
        <div class="absolute top-20 right-0 w-96 h-96 bg-brand rounded-full filter blur-[128px] opacity-10 animate-pulse"></div>
        <div class="absolute bottom-0 left-0 w-72 h-72 bg-gold rounded-full filter blur-[96px] opacity-10"></div>

        <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <!-- Text Content -->
            <div class="space-y-8">
                <div class="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 backdrop-blur-md">
                    <span class="text-xl">🐍</span>
                    <span class="text-brand font-medium text-sm">100% Free Python Learning Platform</span>
                </div>

                <h1 class="text-5xl lg:text-7xl font-display font-bold leading-tight">
                    Learn Python. <br>
                    <span class="text-transparent bg-clip-text bg-gradient-to-r from-brand to-emerald-400">Battle Coders.</span> <br>
                    <span class="text-transparent bg-clip-text bg-gradient-to-r from-gold to-orange-400">Earn Rewards.</span>
                </h1>

                <p class="text-xl text-textMuted max-w-lg leading-relaxed">
                    Master Python through interactive games, real-time battles & daily challenges.
                    Earn <span class="text-gold font-bold">CodeCoins</span>. Buy courses.
                    <span class="text-white font-bold">100% Free forever.</span>
                </p>

                <div class="flex flex-wrap items-center gap-4">
                    <a href="#/signup" class="bg-brand hover:bg-green-500 text-black text-lg font-bold px-8 py-4 rounded-xl shadow-lg shadow-brand/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                        Start Learning Free <i class="fa-solid fa-arrow-right"></i>
                    </a>
                    <a href="#/battle" class="bg-surface hover:bg-white/10 text-white border border-white/10 text-lg font-bold px-8 py-4 rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                        <i class="fa-solid fa-swords"></i> Join a Battle
                    </a>
                </div>

                <div class="flex items-center gap-8 pt-4 text-sm text-textDim font-medium">
                    <div class="flex items-center gap-2">
                        <i class="fa-solid fa-users text-brand"></i>
                        <span>50K Learners</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <i class="fa-solid fa-check-circle text-brand"></i>
                        <span>300 Challenges</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <i class="fa-solid fa-coins text-gold"></i>
                        <span>1M CC Distributed</span>
                    </div>
                </div>
            </div>

            <!-- Visual Content -->
            <div class="relative hidden lg:block">
                <div class="relative z-10 bg-card/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl animate-float">
                    <div class="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 rounded-full bg-red-500"></div>
                            <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div class="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                        <div class="text-xs text-textDim font-mono">solver.py</div>
                    </div>
                    <pre class="font-mono text-sm text-textPrimary leading-relaxed">
<span class="text-pink-400">def</span> <span class="text-yellow-300">calculate_rewards</span>(xp, streak):
    <span class="text-gray-500"># Multiplier based on streak</span>
    multiplier = <span class="text-purple-400">1.0</span>
    <span class="text-pink-400">if</span> streak > <span class="text-purple-400">7</span>:
        multiplier = <span class="text-purple-400">1.5</span>

    <span class="text-gray-500"># Calculate CodeCoins</span>
    cc_earned = (xp * <span class="text-purple-400">0.1</span>) * multiplier

    <span class="text-pink-400">return</span> {
        <span class="text-green-300">"cc"</span>: <span class="text-blue-300">int</span>(cc_earned),
        <span class="text-green-300">"badge"</span>: <span class="text-green-300">"Streak Master"</span>
    }

<span class="text-brand">print</span>(calculate_rewards(<span class="text-purple-400">2500</span>, <span class="text-purple-400">12</span>))
<span class="text-gray-500"># Output: {'cc': 375, 'badge': 'Streak Master'}</span>
                    </pre>

                    <!-- Floating Badge -->
                    <div class="absolute -right-6 -bottom-6 bg-surface border border-brand/30 p-4 rounded-xl shadow-xl flex items-center gap-3 animate-bounce">
                        <div class="text-3xl">🪙</div>
                        <div>
                            <div class="text-xs text-textDim uppercase tracking-wider">You Earned</div>
                            <div class="text-xl font-bold text-gold">+375 CC</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section class="py-24 bg-deep relative">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
                <h2 class="text-3xl md:text-4xl font-display font-bold text-white mb-4">Everything Free. Everything Awesome. 🐍</h2>
                <p class="text-textMuted max-w-2xl mx-auto">We believe education should be accessible. That's why every feature in CodeSphere is free, powered by our unique token economy.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <!-- Card 1 -->
                <div class="bg-card hover:bg-surface transition-all duration-300 p-8 rounded-2xl border border-white/5 hover:border-brand/30 group">
                    <div class="w-14 h-14 bg-brand/10 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">🗺️</div>
                    <h3 class="text-xl font-bold text-white mb-3">Full Python Roadmap</h3>
                    <p class="text-textMuted text-sm leading-relaxed">120+ topics from Beginner to Advanced. Zero cost. Structured learning path to mastery.</p>
                </div>

                <!-- Card 2 -->
                <div class="bg-card hover:bg-surface transition-all duration-300 p-8 rounded-2xl border border-white/5 hover:border-brand/30 group">
                    <div class="w-14 h-14 bg-brand/10 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">⚔️</div>
                    <h3 class="text-xl font-bold text-white mb-3">Code Battles</h3>
                    <p class="text-textMuted text-sm leading-relaxed">Challenge others in real-time 1v1 coding fights. Win CodeCoins and climb the global leaderboard.</p>
                </div>

                <!-- Card 3 -->
                <div class="bg-card hover:bg-surface transition-all duration-300 p-8 rounded-2xl border border-white/5 hover:border-brand/30 group">
                    <div class="w-14 h-14 bg-brand/10 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">🪙</div>
                    <h3 class="text-xl font-bold text-white mb-3">Token Economy</h3>
                    <p class="text-textMuted text-sm leading-relaxed">Earn CC by learning. Spend CC to unlock specialized courses, themes, and power-ups.</p>
                </div>

                <!-- Card 4 -->
                <div class="bg-card hover:bg-surface transition-all duration-300 p-8 rounded-2xl border border-white/5 hover:border-brand/30 group">
                    <div class="w-14 h-14 bg-brand/10 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">🎮</div>
                    <h3 class="text-xl font-bold text-white mb-3">Python Games</h3>
                    <p class="text-textMuted text-sm leading-relaxed">Learn by playing. Type Race, Bug Buster, and more. Fun ways to practice syntax.</p>
                </div>

                <!-- Card 5 -->
                <div class="bg-card hover:bg-surface transition-all duration-300 p-8 rounded-2xl border border-white/5 hover:border-brand/30 group">
                    <div class="w-14 h-14 bg-brand/10 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">🤖</div>
                    <h3 class="text-xl font-bold text-white mb-3">AI Mentor</h3>
                    <p class="text-textMuted text-sm leading-relaxed">Stuck? Ask our AI Mentor for hints, debugging help, and code reviews anytime.</p>
                </div>

                <!-- Card 6 -->
                <div class="bg-card hover:bg-surface transition-all duration-300 p-8 rounded-2xl border border-white/5 hover:border-brand/30 group">
                    <div class="w-14 h-14 bg-brand/10 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">📜</div>
                    <h3 class="text-xl font-bold text-white mb-3">Free Certificates</h3>
                    <p class="text-textMuted text-sm leading-relaxed">Earn verified certificates for each track you complete. Share on LinkedIn and resume.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Token Economy Visual -->
    <section class="py-24 bg-surface/30 border-y border-white/5 relative overflow-hidden">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div class="text-center mb-16">
                <h2 class="text-3xl md:text-4xl font-display font-bold text-white mb-4">💰 CodeCoin Economy — How It Works</h2>
                <p class="text-textMuted">A fair system where your effort pays off.</p>
            </div>

            <div class="flex flex-col md:flex-row items-center justify-center gap-8">
                <!-- Step 1 -->
                <div class="flex-1 text-center">
                    <div class="w-24 h-24 bg-brand/20 rounded-full flex items-center justify-center text-4xl mb-6 mx-auto animate-pulse">🎯</div>
                    <h3 class="text-xl font-bold text-white mb-2">1. Learn & Battle</h3>
                    <p class="text-textMuted text-sm">Complete topics, win battles, and maintain streaks to earn 🪙 CC.</p>
                </div>

                <!-- Arrow -->
                <div class="hidden md:block text-white/20 text-4xl">→</div>

                <!-- Step 2 -->
                <div class="flex-1 text-center">
                    <div class="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center text-4xl mb-6 mx-auto">📺</div>
                    <h3 class="text-xl font-bold text-white mb-2">2. Watch Ads (Optional)</h3>
                    <p class="text-textMuted text-sm">Need a boost? Watch a short ad to earn extra 🪙 CC instantly.</p>
                </div>

                <!-- Arrow -->
                <div class="hidden md:block text-white/20 text-4xl">→</div>

                <!-- Step 3 -->
                <div class="flex-1 text-center">
                    <div class="w-24 h-24 bg-gold/20 rounded-full flex items-center justify-center text-4xl mb-6 mx-auto">🛒</div>
                    <h3 class="text-xl font-bold text-white mb-2">3. Spend & Level Up</h3>
                    <p class="text-textMuted text-sm">Use CC to buy Pro courses, profile themes, and tournament entries.</p>
                </div>
            </div>

            <!-- Earn Table Preview -->
            <div class="mt-16 bg-deep/50 rounded-2xl border border-white/10 p-6 max-w-3xl mx-auto">
                <h4 class="text-center text-white font-bold mb-6 border-b border-white/10 pb-4">Earning Rates</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div class="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <span class="text-textMuted">Daily Login</span>
                        <span class="text-gold font-bold">+10 CC</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <span class="text-textMuted">Complete Topic</span>
                        <span class="text-gold font-bold">+5 CC</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <span class="text-textMuted">Win 1v1 Battle</span>
                        <span class="text-gold font-bold">+50 CC</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <span class="text-textMuted">Watch 30s Ad</span>
                        <span class="text-gold font-bold">+5 CC</span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Pricing Banner -->
    <section class="py-32 bg-deep relative text-center">
        <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoNDMsIDE4NiwgOTYsIDAuMSkiLz48L3N2Zz4=')] opacity-20"></div>
        <div class="relative z-10 max-w-4xl mx-auto px-4">
            <h2 class="text-5xl md:text-7xl font-display font-bold text-white mb-6">100% FREE. Forever. 🐍</h2>
            <p class="text-xl text-textMuted mb-10">No credit card. No hidden fees. Just code.</p>
            <a href="#/signup" class="inline-block bg-gold hover:bg-yellow-400 text-black text-xl font-bold px-10 py-5 rounded-full shadow-2xl shadow-gold/20 transform hover:scale-105 transition-all">
                Start Coding Now <i class="fa-solid fa-bolt ml-2"></i>
            </a>
        </div>
    </section>
    `;
}

function renderDashboard() {
    const { user, rewards } = state;
    return `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <!-- Top Bar -->
        <div class="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
            <div>
                <h1 class="text-2xl font-bold text-white">Good morning, ${user.name} 👋</h1>
                <p class="text-textMuted text-sm">Ready to code today?</p>
            </div>
            <div class="flex items-center gap-4">
                <div class="bg-card border border-white/10 rounded-full px-4 py-2 flex items-center gap-2">
                    <span class="text-orange-500">🔥</span>
                    <span class="text-white font-bold">${user.streak} Day Streak</span>
                </div>
                <div class="bg-card border border-gold/30 rounded-full px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-gold/10 transition-colors" onclick="window.location.hash='/wallet'">
                    <span class="text-xl">🪙</span>
                    <span class="text-gold font-bold">${user.cc} CC</span>
                </div>
            </div>
        </div>

        <!-- Daily Reward Banner -->
        ${!rewards.dailyClaimed ? `
        <div class="bg-gradient-to-r from-gold/20 to-brand/10 border border-gold/50 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 animate-pulse">
            <div class="flex items-center gap-4">
                <div class="text-4xl">🎁</div>
                <div>
                    <h3 class="text-lg font-bold text-white">Daily Reward Ready!</h3>
                    <p class="text-textMuted text-sm">Claim your +10 CC and keep your streak alive.</p>
                </div>
            </div>
            <button onclick="alert('Claimed +10 CC!'); state.rewards.dailyClaimed = true; state.user.cc += 10; render();" class="bg-gold hover:bg-yellow-400 text-black font-bold px-6 py-3 rounded-xl shadow-lg shadow-gold/20 transition-transform active:scale-95">
                Claim Reward →
            </button>
        </div>` : ''}

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Left Column (Main) -->
            <div class="lg:col-span-2 space-y-8">

                <!-- Stats Row -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div class="bg-card border border-white/5 rounded-xl p-4 text-center">
                        <div class="text-brand text-xl mb-1">⚡</div>
                        <div class="text-2xl font-bold text-white">${user.xp}</div>
                        <div class="text-xs text-textMuted uppercase">XP Earned</div>
                    </div>
                    <div class="bg-card border border-white/5 rounded-xl p-4 text-center">
                        <div class="text-gold text-xl mb-1">🪙</div>
                        <div class="text-2xl font-bold text-white">${user.cc}</div>
                        <div class="text-xs text-textMuted uppercase">Balance</div>
                    </div>
                    <div class="bg-card border border-white/5 rounded-xl p-4 text-center">
                        <div class="text-orange-500 text-xl mb-1">🔥</div>
                        <div class="text-2xl font-bold text-white">${user.streak}</div>
                        <div class="text-xs text-textMuted uppercase">Day Streak</div>
                    </div>
                    <div class="bg-card border border-white/5 rounded-xl p-4 text-center">
                        <div class="text-blue-400 text-xl mb-1">⚔️</div>
                        <div class="text-2xl font-bold text-white">${user.progress.challenges}</div>
                        <div class="text-xs text-textMuted uppercase">Solved</div>
                    </div>
                </div>

                <!-- Daily Challenge -->
                <div class="bg-card border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-brand/50 transition-colors">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-brand/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                    <div class="relative z-10">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <span class="text-xs font-bold text-brand uppercase tracking-wider bg-brand/10 px-2 py-1 rounded">Daily Challenge</span>
                                <h3 class="text-xl font-bold text-white mt-2">List Comprehension Master</h3>
                            </div>
                            <div class="text-right">
                                <div class="text-gold font-bold">+25 CC</div>
                                <div class="text-brand text-sm">+75 XP</div>
                            </div>
                        </div>
                        <p class="text-textMuted text-sm mb-6">Convert this loop into a single line list comprehension. Solve it under 2 minutes for bonus XP.</p>
                        <a href="#/challenges" class="inline-block bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold px-6 py-2 rounded-lg transition-colors">
                            Solve Now →
                        </a>
                    </div>
                </div>

                <!-- Continue Learning -->
                <div class="bg-card border border-white/10 rounded-2xl p-6">
                    <h3 class="text-lg font-bold text-white mb-4">Continue Learning</h3>
                    <div class="flex items-center gap-4 mb-4">
                        <div class="w-12 h-12 bg-brand/20 rounded-xl flex items-center justify-center text-2xl">🔄</div>
                        <div class="flex-1">
                            <div class="flex justify-between mb-1">
                                <span class="font-bold text-textPrimary">Strings & Methods</span>
                                <span class="text-xs text-textMuted">Topic 4/12</span>
                            </div>
                            <div class="w-full bg-white/5 rounded-full h-2">
                                <div class="bg-brand h-2 rounded-full" style="width: 35%"></div>
                            </div>
                        </div>
                    </div>
                    <a href="#/roadmap" class="block text-center text-sm text-brand font-bold hover:text-white transition-colors">Continue Chapter 1 →</a>
                </div>

                <!-- Quick Games -->
                <div>
                    <h3 class="text-lg font-bold text-white mb-4">Quick Games</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-card border border-white/5 hover:border-brand/30 p-4 rounded-xl cursor-pointer transition-all hover:bg-surface">
                            <div class="text-2xl mb-2">⌨️</div>
                            <div class="font-bold text-white text-sm">Type Race</div>
                            <div class="text-xs text-gold">+20 CC Win</div>
                        </div>
                        <div class="bg-card border border-white/5 hover:border-brand/30 p-4 rounded-xl cursor-pointer transition-all hover:bg-surface">
                            <div class="text-2xl mb-2">🐛</div>
                            <div class="font-bold text-white text-sm">Bug Buster</div>
                            <div class="text-xs text-gold">+10 CC</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Column (Sidebar) -->
            <div class="space-y-8">

                <!-- Token Wallet Mini -->
                <div class="bg-gradient-to-br from-card to-surface border border-gold/20 rounded-2xl p-6 text-center">
                    <div class="text-sm text-textMuted uppercase tracking-wider mb-1">Total Balance</div>
                    <div class="text-4xl font-bold text-white mb-4 flex justify-center items-center gap-2">
                        <span class="text-gold">🪙</span> ${user.cc}
                    </div>
                    <div class="grid grid-cols-2 gap-2 mb-4">
                        <button class="bg-white/5 hover:bg-white/10 py-2 rounded-lg text-xs font-bold text-white border border-white/5">
                            ⚔️ Battle
                        </button>
                        <button class="bg-white/5 hover:bg-white/10 py-2 rounded-lg text-xs font-bold text-white border border-white/5">
                            📺 Watch Ad
                        </button>
                    </div>
                    <a href="#/store" class="block text-gold text-sm font-bold hover:text-white">Visit Store →</a>
                </div>

                <!-- Active Battle Invite -->
                <div class="bg-card border border-brand/30 rounded-2xl p-1 relative overflow-hidden">
                    <div class="bg-surface/50 p-5 rounded-xl backdrop-blur-sm">
                        <h4 class="text-sm font-bold text-white mb-2 flex items-center gap-2">
                            <span class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            Battle Invite
                        </h4>
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center font-bold text-white">PS</div>
                            <div>
                                <div class="text-sm font-bold text-white">Priya S.</div>
                                <div class="text-xs text-textMuted">Intermediate | 500 CC</div>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button class="flex-1 bg-brand text-black text-xs font-bold py-2 rounded-lg hover:bg-green-400">Accept ⚔️</button>
                            <button class="flex-1 bg-white/10 text-white text-xs font-bold py-2 rounded-lg hover:bg-white/20">Decline</button>
                        </div>
                    </div>
                </div>

                <!-- Ads Earn -->
                <div class="bg-card border border-white/5 rounded-2xl p-6">
                    <h3 class="text-sm font-bold text-white mb-4">📺 Earn Free CC</h3>
                    <div class="flex justify-between items-center text-sm text-textMuted mb-4">
                        <span>Daily Limit</span>
                        <span>${state.rewards.adsWatched}/3 Watched</span>
                    </div>
                    <button class="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-bold py-3 rounded-xl flex justify-center items-center gap-2 transition-colors">
                        <i class="fa-solid fa-play"></i> Watch Ad (+5 CC)
                    </button>
                </div>

                <!-- Leaderboard Mini -->
                <div class="bg-card border border-white/5 rounded-2xl p-6">
                    <h3 class="text-sm font-bold text-white mb-4">🏆 Top Players</h3>
                    <div class="space-y-3">
                        <div class="flex items-center justify-between text-sm">
                            <div class="flex items-center gap-3">
                                <span class="text-gold font-bold">1</span>
                                <div class="w-6 h-6 bg-white/10 rounded-full"></div>
                                <span class="text-white">AlexCode</span>
                            </div>
                            <span class="text-gold font-mono">820 CC</span>
                        </div>
                        <div class="flex items-center justify-between text-sm">
                            <div class="flex items-center gap-3">
                                <span class="text-gray-400 font-bold">2</span>
                                <div class="w-6 h-6 bg-white/10 rounded-full"></div>
                                <span class="text-white">SarahPy</span>
                            </div>
                            <span class="text-gold font-mono">540 CC</span>
                        </div>
                        <div class="flex items-center justify-between text-sm">
                            <div class="flex items-center gap-3">
                                <span class="text-orange-700 font-bold">3</span>
                                <div class="w-6 h-6 bg-white/10 rounded-full"></div>
                                <span class="text-white">DevMike</span>
                            </div>
                            <span class="text-gold font-mono">380 CC</span>
                        </div>
                    </div>
                    <div class="mt-4 pt-4 border-t border-white/5 text-center">
                        <span class="text-xs text-textMuted">You are ranked #${user.rank}</span>
                    </div>
                </div>

            </div>
        </div>
    </div>
    `;
}

function renderSignIn() {
    return `
    <div class="flex min-h-screen bg-deep">
        <!-- Left Panel (Visual) -->
        <div class="hidden lg:flex w-1/2 bg-card relative overflow-hidden flex-col justify-between p-12">
            <div class="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
            <div class="relative z-10">
                <div class="flex items-center gap-2 mb-8">
                    <span class="text-3xl">🐍</span>
                    <span class="font-display font-bold text-2xl text-white">CodeSphere</span>
                </div>
                <h2 class="text-4xl font-bold text-white mb-4">Welcome back,<br>Pythonista!</h2>
                <p class="text-textMuted text-lg">Your streak is waiting. Don't break the chain.</p>
            </div>

            <div class="relative z-10 space-y-4">
                <div class="bg-surface/80 backdrop-blur-md p-4 rounded-xl border border-white/10 flex items-center gap-4">
                    <div class="text-3xl">🎁</div>
                    <div>
                        <div class="text-xs text-textDim uppercase">Daily Reward</div>
                        <div class="text-white font-bold">Day 8: +15 CC Available</div>
                    </div>
                </div>
                <div class="bg-surface/80 backdrop-blur-md p-4 rounded-xl border border-white/10 flex items-center gap-4">
                    <div class="text-3xl">⚔️</div>
                    <div>
                        <div class="text-xs text-textDim uppercase">Battles</div>
                        <div class="text-white font-bold">3 challenges pending</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Right Panel (Form) -->
        <div class="w-full lg:w-1/2 flex items-center justify-center p-8">
            <div class="w-full max-w-md space-y-8">
                <div class="text-center lg:text-left">
                    <h2 class="text-3xl font-display font-bold text-white">Sign In</h2>
                    <p class="mt-2 text-textMuted">Don't have an account? <a href="#/signup" class="text-brand hover:text-white transition-colors">Start Free</a></p>
                </div>

                <div class="space-y-4">
                    <button class="w-full bg-white text-black font-bold py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors">
                        <i class="fa-brands fa-github text-xl"></i> Continue with GitHub
                    </button>
                    <button class="w-full bg-[#4285F4] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-blue-600 transition-colors">
                        <i class="fa-brands fa-google text-xl"></i> Continue with Google
                    </button>
                </div>

                <div class="relative">
                    <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-white/10"></div></div>
                    <div class="relative flex justify-center text-sm"><span class="px-2 bg-deep text-textDim">or use email</span></div>
                </div>

                <form class="space-y-6" onsubmit="event.preventDefault(); window.authLogin();">
                    <div>
                        <label for="email" class="block text-sm font-medium text-textMuted mb-2">Email address</label>
                        <input id="email" name="email" type="email" autocomplete="email" required class="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors">
                    </div>
                    <div>
                        <label for="password" class="block text-sm font-medium text-textMuted mb-2">Password</label>
                        <input id="password" name="password" type="password" autocomplete="current-password" required class="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors">
                        <div class="flex justify-between items-center mt-2">
                            <div class="flex items-center">
                                <input id="remember-me" name="remember-me" type="checkbox" class="h-4 w-4 rounded border-white/10 bg-surface text-brand focus:ring-brand">
                                <label for="remember-me" class="ml-2 block text-sm text-textMuted">Remember me</label>
                            </div>
                            <a href="#" class="text-sm font-medium text-brand hover:text-white">Forgot password?</a>
                        </div>
                    </div>

                    <button type="submit" class="w-full bg-brand hover:bg-green-500 text-black font-bold py-4 rounded-xl shadow-lg shadow-brand/20 transition-all hover:scale-[1.02] active:scale-95">
                        Sign In →
                    </button>
                </form>
            </div>
        </div>
    </div>
    `;
}

function renderSignUp() {
    return `
    <div class="flex min-h-screen bg-deep">
        <!-- Left Panel (Same as Sign In) -->
        <div class="hidden lg:flex w-1/2 bg-card relative overflow-hidden flex-col justify-between p-12">
            <div class="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
            <div class="relative z-10">
                <div class="flex items-center gap-2 mb-8">
                    <span class="text-3xl">🐍</span>
                    <span class="font-display font-bold text-2xl text-white">CodeSphere</span>
                </div>
                <h2 class="text-4xl font-bold text-white mb-4">Start Your<br>Journey</h2>
                <p class="text-textMuted text-lg">Join 50,000+ learners mastering Python.</p>
            </div>

            <div class="relative z-10">
                <div class="bg-surface/80 backdrop-blur-md p-6 rounded-xl border border-white/10">
                    <h3 class="text-gold font-bold mb-4">🪙 What you get for FREE:</h3>
                    <ul class="space-y-3 text-sm text-white">
                        <li class="flex items-center gap-2"><i class="fa-solid fa-check text-brand"></i> +100 CC Welcome Bonus</li>
                        <li class="flex items-center gap-2"><i class="fa-solid fa-check text-brand"></i> First Battle Pass Unlocked</li>
                        <li class="flex items-center gap-2"><i class="fa-solid fa-check text-brand"></i> Full Python Roadmap Access</li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Right Panel (Form) -->
        <div class="w-full lg:w-1/2 flex items-center justify-center p-8">
            <div class="w-full max-w-md space-y-8">
                <div class="text-center lg:text-left">
                    <h2 class="text-3xl font-display font-bold text-white">Create Account</h2>
                    <p class="mt-2 text-textMuted">Already have an account? <a href="#/signin" class="text-brand hover:text-white transition-colors">Sign In</a></p>
                </div>

                <form class="space-y-6" onsubmit="event.preventDefault(); window.authLogin();">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-textMuted mb-2">First Name</label>
                            <input type="text" required class="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand transition-colors">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-textMuted mb-2">Last Name</label>
                            <input type="text" required class="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand transition-colors">
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-textMuted mb-2">Username</label>
                        <div class="relative">
                            <span class="absolute left-4 top-3.5 text-gray-500">@</span>
                            <input type="text" required class="w-full bg-surface border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none focus:border-brand transition-colors" placeholder="python_wizard">
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-textMuted mb-2">Email address</label>
                        <input type="email" required class="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand transition-colors">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-textMuted mb-2">Password</label>
                        <input type="password" required class="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand transition-colors">
                        <div class="mt-2 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                            <div class="bg-red-500 h-full w-1/4"></div>
                        </div>
                        <p class="text-xs text-textMuted mt-1">Strength: Weak</p>
                    </div>

                    <div class="pt-2">
                        <label class="block text-sm font-medium text-textMuted mb-4">Why are you learning Python?</label>
                        <div class="grid grid-cols-2 gap-3">
                            <div class="border border-brand/50 bg-brand/10 p-3 rounded-lg cursor-pointer text-center text-sm font-bold text-brand">💼 Get a Job</div>
                            <div class="border border-white/10 bg-surface p-3 rounded-lg cursor-pointer text-center text-sm text-white hover:border-white/30">📊 Data Science</div>
                            <div class="border border-white/10 bg-surface p-3 rounded-lg cursor-pointer text-center text-sm text-white hover:border-white/30">🌐 Web Dev</div>
                            <div class="border border-white/10 bg-surface p-3 rounded-lg cursor-pointer text-center text-sm text-white hover:border-white/30">🧠 Just for Fun</div>
                        </div>
                    </div>

                    <button type="submit" class="w-full bg-brand hover:bg-green-500 text-black font-bold py-4 rounded-xl shadow-lg shadow-brand/20 transition-all hover:scale-[1.02] active:scale-95">
                        🚀 Claim Bonus & Start
                    </button>
                </form>
            </div>
        </div>
    </div>
    `;
}

// Mock Auth Actions
window.authLogin = () => {
    state.isAuthenticated = true;
    window.location.hash = '/dashboard';
};

window.authLogout = () => {
    state.isAuthenticated = false;
    window.location.hash = '/';
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initRouter();
});

export { state, render };
