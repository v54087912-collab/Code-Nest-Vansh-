// js/codesphere.js

/**
 * CodeSphere - Single Page Application Logic
 * Handles routing, state management, and view rendering.
 */

// --- Constants & Mock Data ---
const MOCK_USER = {
    name: 'Pythonista',
    username: 'python_dev_1',
    cc: 340,
    xp: 2450,
    streak: 12,
    completedTopics: ['ch1-t1', 'ch1-t2'],
    solvedChallenges: ['c1', 'c2'],
    inventory: ['theme-dark-neon'],
    battles: { w: 18, l: 9 }
};

const ROADMAP_DATA = [
    {
        id: 'beginner',
        title: '🌱 Beginner Track',
        totalCC: 130,
        chapters: [
            {
                id: 'ch1',
                title: 'Chapter 1: Python Basics',
                reward: 30,
                topics: [
                    { id: 'ch1-t1', title: 'What is Python?', reward: 5, readTime: '5 min' },
                    { id: 'ch1-t2', title: 'Installation & Setup', reward: 5, readTime: '10 min' },
                    { id: 'ch1-t3', title: 'Variables & Data Types', reward: 5, readTime: '15 min' },
                    { id: 'ch1-t4', title: 'Strings & Methods', reward: 5, readTime: '12 min' }
                ]
            },
            {
                id: 'ch2',
                title: 'Chapter 2: Control Flow',
                reward: 30,
                topics: [
                    { id: 'ch2-t1', title: 'If / Elif / Else', reward: 5, readTime: '10 min' },
                    { id: 'ch2-t2', title: 'For Loops', reward: 5, readTime: '15 min' },
                    { id: 'ch2-t3', title: 'While Loops', reward: 5, readTime: '12 min' }
                ]
            }
        ]
    }
];

const CHALLENGE_DATA = [
    {
        id: 'c1',
        title: 'Sum of Two Numbers',
        difficulty: 'Beginner',
        reward: 10,
        xp: 25,
        solvedCount: 1240,
        description: 'Write a function that takes two numbers and returns their sum.',
        input: 'a = 5, b = 3',
        output: '8',
        starterCode: 'def sum_two(a, b):\n    # Write your code here\n    pass'
    },
    {
        id: 'c2',
        title: 'Reverse String',
        difficulty: 'Beginner',
        reward: 10,
        xp: 25,
        solvedCount: 980,
        description: 'Write a function that reverses a given string.',
        input: '"hello"',
        output: '"olleh"',
        starterCode: 'def reverse_string(s):\n    # Write your code here\n    return s[::-1]'
    },
    {
        id: 'c3',
        title: 'FizzBuzz',
        difficulty: 'Intermediate',
        reward: 20,
        xp: 50,
        solvedCount: 3400,
        description: 'Print numbers 1 to n. If divisible by 3 print "Fizz", by 5 "Buzz", both "FizzBuzz".',
        input: 'n = 15',
        output: '1, 2, Fizz, 4, Buzz...',
        starterCode: 'def fizzbuzz(n):\n    # Write your code here\n    pass'
    }
];

const STORE_ITEMS = [
    { id: 'theme-sakura', name: 'Sakura Theme', type: 'theme', price: 40, icon: '🌸', desc: 'Pink cherry blossom aesthetic' },
    { id: 'theme-cyber', name: 'Cyberpunk Theme', type: 'theme', price: 60, icon: '🤖', desc: 'Neon blue and purple vibes' },
    { id: 'frame-gold', name: 'Gold Frame', type: 'frame', price: 30, icon: '🖼️', desc: 'Shiny gold border for your avatar' },
    { id: 'course-web', name: 'Python for Web', type: 'course', price: 100, icon: '🌐', desc: 'Master Flask and Django' },
    { id: 'power-xp', name: '2x XP Boost', type: 'powerup', price: 30, icon: '⚡', desc: 'Double XP for 24 hours' },
    { id: 'power-shield', name: 'Streak Shield', type: 'powerup', price: 20, icon: '🛡️', desc: 'Protect your streak for 1 day' }
];

// --- State Management ---
const state = {
    user: null, // null if logged out
    currentTheme: 'dark',
};

// --- Router ---
function router() {
    const hash = window.location.hash || '#/';
    const path = hash.split('?')[0]; // simple path matching
    console.log('Router navigating to:', path, 'User:', state.user ? state.user.username : 'guest');
    const app = document.getElementById('app');

    // Clear previous view
    app.innerHTML = '';
    window.scrollTo(0, 0);

    // Route Guards
    if (['#/signin', '#/signup'].includes(path) && state.user) {
        window.location.hash = '#/dashboard';
        return;
    }

    // Routes
    switch (path) {
        case '#/':
            state.user ? renderDashboard(app) : renderLanding(app);
            break;
        case '#/signin':
            renderSignIn(app);
            break;
        case '#/signup':
            renderSignUp(app);
            break;
        case '#/dashboard':
            requireAuth(() => renderDashboard(app));
            break;
        case '#/roadmap':
            requireAuth(() => renderRoadmap(app));
            break;
        case '#/challenges':
            requireAuth(() => renderChallenges(app));
            break;
        case '#/battles':
            requireAuth(() => renderBattles(app));
            break;
        case '#/games':
            requireAuth(() => renderGames(app));
            break;
        case '#/game/type-race':
            requireAuth(() => renderGameTypeRace(app));
            break;
        case '#/store':
            requireAuth(() => renderStore(app));
            break;
        case '#/profile':
            requireAuth(() => renderProfile(app));
            break;
        case '#/leaderboard':
            requireAuth(() => renderLeaderboard(app));
            break;
        case '#/logout':
            logout();
            break;
        default:
            // Handle dynamic routes like #/topic/:id
            if (path.startsWith('#/topic/')) {
                const topicId = path.split('/')[2];
                requireAuth(() => renderTopic(app, topicId));
            } else if (path.startsWith('#/challenge/')) {
                const challengeId = path.split('/')[2];
                requireAuth(() => renderSingleChallenge(app, challengeId));
            } else {
                renderNotFound(app);
            }
    }
}

// --- Auth Helpers ---
function requireAuth(renderFn) {
    if (state.user) {
        renderFn();
    } else {
        window.location.hash = '#/signin';
    }
}

function login() {
    state.user = { ...MOCK_USER }; // Clone mock user
    router();
}

function logout() {
    state.user = null;
    window.location.hash = '#/';
}

// --- Render Functions (Phase 1) ---

function renderLanding(container) {
    container.innerHTML = `
        <!-- Navbar -->
        <nav class="flex items-center justify-between px-6 py-4 bg-bg-deep/90 backdrop-blur fixed w-full z-50 border-b border-white/5">
            <div class="flex items-center gap-2">
                <span class="text-3xl">🐍</span>
                <span class="font-display font-bold text-xl tracking-tight text-white">CodeSphere</span>
            </div>
            <div class="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
                <a href="#/" class="hover:text-brand transition-colors">Home</a>
                <a href="#/roadmap" class="hover:text-brand transition-colors">Roadmap</a>
                <a href="#/battles" class="hover:text-brand transition-colors">Battles</a>
                <a href="app.html" class="hover:text-brand transition-colors flex items-center gap-1">Playground <span class="text-xs">↗</span></a>
            </div>
            <div class="flex items-center gap-4">
                <a href="#/signin" class="text-brand hover:text-white transition-colors font-medium">Sign In</a>
                <a href="#/signup" class="bg-brand hover:bg-brand/90 text-white px-5 py-2 rounded-full font-medium transition-all transform hover:scale-105 shadow-lg shadow-brand/20">Start Free →</a>
            </div>
        </nav>

        <!-- Hero Section -->
        <section class="pt-32 pb-20 px-6 relative overflow-hidden">
            <div class="absolute top-20 right-0 w-96 h-96 bg-brand/10 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>
            <div class="absolute bottom-0 left-0 w-72 h-72 bg-gold/5 rounded-full blur-3xl -z-10"></div>

            <div class="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                <div class="space-y-6">
                    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bg-surface border border-white/10 text-xs font-medium text-brand">
                        <span class="animate-pulse">●</span> 100% Free Python Learning
                    </div>
                    <h1 class="text-5xl md:text-7xl font-bold leading-tight font-display">
                        Learn Python. <br>
                        <span class="text-transparent bg-clip-text bg-gradient-to-r from-brand to-teal-400">Battle Coders.</span> <br>
                        Earn Rewards.
                    </h1>
                    <p class="text-lg text-gray-400 max-w-lg leading-relaxed">
                        Master Python through games, battles & challenges.
                        Earn <span class="text-gold font-bold">CodeCoins</span>. Buy courses.
                        Join 50,000+ learners today.
                    </p>
                    <div class="flex flex-wrap gap-4 pt-4">
                        <a href="#/signup" class="bg-brand hover:bg-brand/90 text-white text-lg px-8 py-3 rounded-lg font-bold transition-all shadow-xl shadow-brand/20 flex items-center gap-2">
                            Start Learning Free <span class="text-xl">→</span>
                        </a>
                        <a href="#/battles" class="bg-bg-surface hover:bg-white/10 text-white text-lg px-8 py-3 rounded-lg font-bold border border-white/10 transition-all flex items-center gap-2">
                            ⚔️ Join a Battle
                        </a>
                    </div>
                    <div class="flex items-center gap-6 pt-4 text-sm text-gray-500 font-mono">
                        <div class="flex items-center gap-2"><span class="text-brand">✓</span> 50K Learners</div>
                        <div class="flex items-center gap-2"><span class="text-brand">✓</span> 300 Challenges</div>
                        <div class="flex items-center gap-2"><span class="text-gold">✓</span> 1M CC Distributed</div>
                    </div>
                </div>

                <!-- Hero Visual -->
                <div class="relative">
                    <div class="bg-bg-card border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-sm rotate-2 hover:rotate-0 transition-transform duration-500">
                        <div class="flex items-center gap-2 mb-4 border-b border-white/5 pb-4">
                            <div class="flex gap-1.5">
                                <div class="w-3 h-3 rounded-full bg-red-500"></div>
                                <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div class="w-3 h-3 rounded-full bg-green-500"></div>
                            </div>
                            <div class="ml-auto text-xs text-gray-500 font-mono">main.py</div>
                        </div>
                        <pre class="font-mono text-sm text-gray-300 overflow-x-auto">
<span class="text-purple-400">def</span> <span class="text-blue-400">battle_start</span>(player):
    <span class="text-gray-500"># Start your coding journey</span>
    xp = <span class="text-gold">0</span>
    streak = <span class="text-gold">True</span>

    <span class="text-purple-400">while</span> streak:
        xp += <span class="text-gold">100</span>
        <span class="text-blue-400">print</span>(<span class="text-green-400">"Level Up! 🚀"</span>)

<span class="text-blue-400">battle_start</span>(<span class="text-green-400">"You"</span>)</pre>

                        <div class="absolute -bottom-6 -right-6 bg-bg-surface border border-white/10 p-4 rounded-xl shadow-xl flex items-center gap-3 animate-bounce">
                            <div class="bg-gold/20 p-2 rounded-lg text-2xl">🏆</div>
                            <div>
                                <div class="text-xs text-gray-400 uppercase font-bold">Winner</div>
                                <div class="font-bold text-gold">+50 CodeCoins</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Features Grid -->
        <section class="py-20 bg-bg-surface/30">
            <div class="max-w-6xl mx-auto px-6">
                <div class="text-center mb-16">
                    <h2 class="text-3xl md:text-4xl font-bold mb-4">Everything Free. Everything Awesome. 🐍</h2>
                    <p class="text-gray-400">We gamified Python learning so you never get bored.</p>
                </div>

                <div class="grid md:grid-cols-3 gap-8">
                    <!-- Card 1 -->
                    <div class="bg-bg-card p-6 rounded-2xl border border-white/5 hover:border-brand/50 transition-colors group">
                        <div class="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🗺️</div>
                        <h3 class="text-xl font-bold mb-2">Full Python Roadmap</h3>
                        <p class="text-gray-400 text-sm">From Hello World to Machine Learning. 120+ topics, zero cost.</p>
                    </div>
                    <!-- Card 2 -->
                    <div class="bg-bg-card p-6 rounded-2xl border border-white/5 hover:border-brand/50 transition-colors group">
                        <div class="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">⚔️</div>
                        <h3 class="text-xl font-bold mb-2">Code Battles</h3>
                        <p class="text-gray-400 text-sm">Fight other coders in real-time. Win CodeCoins. Climb the ranks.</p>
                    </div>
                    <!-- Card 3 -->
                    <div class="bg-bg-card p-6 rounded-2xl border border-white/5 hover:border-brand/50 transition-colors group">
                        <div class="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🪙</div>
                        <h3 class="text-xl font-bold mb-2">Token Economy</h3>
                        <p class="text-gray-400 text-sm">Earn CC by learning. Spend it on courses, themes, and power-ups.</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="bg-bg-deep border-t border-white/5 py-12 px-6 text-center text-gray-500 text-sm">
            <p>&copy; 2025 CodeSphere. Built with 🐍 and ☕</p>
        </footer>
    `;
}

function renderSignIn(container) {
    container.innerHTML = `
        <div class="min-h-screen flex">
            <!-- Left Side (Visual) -->
            <div class="hidden lg:flex w-1/2 bg-bg-card relative items-center justify-center overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-br from-brand/10 to-transparent"></div>
                <div class="relative z-10 text-center space-y-6 max-w-md p-8">
                    <div class="text-6xl mb-4">🐍</div>
                    <h2 class="text-4xl font-bold text-white">Welcome back,<br>Pythonista!</h2>
                    <p class="text-xl text-gray-300">Your streak is waiting. Don't break the chain.</p>

                    <div class="bg-bg-deep/50 backdrop-blur border border-white/10 rounded-xl p-4 flex items-center gap-4 text-left mt-8">
                        <div class="bg-gold/20 p-3 rounded-lg text-2xl">🎁</div>
                        <div>
                            <div class="text-xs text-gray-400 uppercase font-bold">Daily Reward</div>
                            <div class="font-bold text-white">Day 8: <span class="text-gold">+15 CC Available</span></div>
                        </div>
                    </div>

                    <div class="bg-bg-deep/50 backdrop-blur border border-white/10 rounded-xl p-4 flex items-center gap-4 text-left">
                        <div class="bg-gray-700/50 p-3 rounded-lg text-2xl">⚔️</div>
                        <div>
                            <div class="text-xs text-gray-400 uppercase font-bold">Battles</div>
                            <div class="font-bold text-white">3 challenges pending</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Side (Form) -->
            <div class="w-full lg:w-1/2 flex items-center justify-center p-8 bg-bg-deep">
                <div class="w-full max-w-md space-y-8">
                    <div>
                        <h2 class="text-3xl font-bold">Sign In</h2>
                        <p class="text-gray-400 mt-2">Don't have an account? <a href="#/signup" class="text-brand hover:underline">Start Free</a></p>
                    </div>

                    <div class="space-y-4">
                        <button class="w-full bg-white text-black font-bold py-3 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors">
                            <span class="text-xl">🐙</span> Continue with GitHub
                        </button>
                        <button class="w-full bg-[#4285F4] text-white font-bold py-3 rounded-lg flex items-center justify-center gap-3 hover:bg-[#3367D6] transition-colors">
                            <span class="text-xl">G</span> Continue with Google
                        </button>
                    </div>

                    <div class="relative flex items-center py-2">
                        <div class="flex-grow border-t border-gray-700"></div>
                        <span class="flex-shrink-0 mx-4 text-gray-500 text-sm">or use email</span>
                        <div class="flex-grow border-t border-gray-700"></div>
                    </div>

                    <form onsubmit="event.preventDefault(); login();" class="space-y-6">
                        <div class="space-y-2">
                            <label class="text-sm font-medium text-gray-300">Email address</label>
                            <input type="email" class="w-full bg-bg-surface border border-gray-700 rounded-lg px-4 py-3 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-colors" placeholder="python@example.com">
                        </div>

                        <div class="space-y-2">
                            <label class="text-sm font-medium text-gray-300">Password</label>
                            <input type="password" class="w-full bg-bg-surface border border-gray-700 rounded-lg px-4 py-3 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-colors" placeholder="••••••••">
                        </div>

                        <div class="flex items-center justify-between text-sm">
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" class="w-4 h-4 rounded border-gray-700 bg-bg-surface text-brand focus:ring-brand">
                                <span class="text-gray-400">Remember me</span>
                            </label>
                            <a href="#" class="text-brand hover:underline">Forgot password?</a>
                        </div>

                        <button type="submit" class="w-full bg-brand hover:bg-brand/90 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-brand/20">
                            Sign In →
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `;
}

function renderSignUp(container) {
    // Reusing Sign In style for simplicity in this phase, just different title
    container.innerHTML = `
         <div class="min-h-screen flex items-center justify-center p-8 bg-bg-deep relative">
            <div class="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div class="absolute top-[-10%] right-[-5%] w-96 h-96 bg-brand/10 rounded-full blur-3xl"></div>
                <div class="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-gold/5 rounded-full blur-3xl"></div>
            </div>

            <div class="w-full max-w-md space-y-8 relative z-10 bg-bg-card p-8 rounded-2xl border border-white/5 shadow-2xl">
                <div class="text-center">
                    <h2 class="text-3xl font-bold">Create Account</h2>
                    <p class="text-gray-400 mt-2">Join the coding revolution. <a href="#/signin" class="text-brand hover:underline">Sign In</a></p>
                </div>

                <form onsubmit="event.preventDefault(); login();" class="space-y-5">
                    <div class="space-y-2">
                        <label class="text-sm font-medium text-gray-300">Username</label>
                        <input type="text" class="w-full bg-bg-surface border border-gray-700 rounded-lg px-4 py-3 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-colors" placeholder="@pythonista">
                    </div>

                    <div class="space-y-2">
                        <label class="text-sm font-medium text-gray-300">Email address</label>
                        <input type="email" class="w-full bg-bg-surface border border-gray-700 rounded-lg px-4 py-3 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-colors" placeholder="hello@codesphere.io">
                    </div>

                    <div class="space-y-2">
                        <label class="text-sm font-medium text-gray-300">Password</label>
                        <input type="password" class="w-full bg-bg-surface border border-gray-700 rounded-lg px-4 py-3 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-colors" placeholder="Create a strong password">
                    </div>

                    <button type="submit" class="w-full bg-brand hover:bg-brand/90 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-brand/20 mt-4">
                        🚀 Start Learning Free
                    </button>

                    <p class="text-xs text-center text-gray-500 mt-4">
                        By joining, you agree to our Terms and Privacy Policy.
                    </p>
                </form>
            </div>
        </div>
    `;
}

function renderDashboard(container) {
    const user = state.user;
    container.innerHTML = `
        <!-- Dashboard Layout -->
        <div class="min-h-screen bg-bg-deep pb-20">
            <!-- Top Header -->
            <header class="bg-bg-card border-b border-white/5 sticky top-0 z-30">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="text-2xl">🐍</span>
                        <span class="font-bold text-lg hidden md:block">CodeSphere</span>
                    </div>

                    <nav class="hidden md:flex items-center gap-6 text-sm font-medium text-gray-400">
                        <a href="#/dashboard" class="text-white">Home</a>
                        <a href="#/roadmap" class="hover:text-brand transition-colors">Roadmap</a>
                        <a href="#/battles" class="hover:text-brand transition-colors">Battles</a>
                        <a href="#/games" class="hover:text-brand transition-colors">Games</a>
                        <a href="app.html" class="hover:text-brand transition-colors flex items-center gap-1">Playground <span class="text-xs">↗</span></a>
                    </nav>

                    <div class="flex items-center gap-4">
                        <div class="flex items-center gap-1 bg-bg-deep px-3 py-1 rounded-full border border-white/5">
                            <span class="text-lg">🔥</span>
                            <span class="font-bold text-white">${user.streak} Day Streak</span>
                        </div>
                         <div class="flex items-center gap-1 bg-bg-deep px-3 py-1 rounded-full border border-gold/20">
                            <span class="text-lg">🪙</span>
                            <span class="font-bold text-gold">${user.cc} CC</span>
                        </div>
                        <button onclick="logout()" class="text-sm text-gray-500 hover:text-white ml-2">Sign Out</button>
                    </div>
                </div>
            </header>

            <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                <!-- Welcome & Daily Reward -->
                <div class="space-y-2">
                    <h1 class="text-3xl font-bold font-display">Good morning, ${user.name} 👋</h1>
                    <p class="text-gray-400">Ready to code today?</p>
                </div>

                <!-- Daily Reward Banner -->
                <div class="bg-gradient-to-r from-gold/10 to-transparent border border-gold/20 rounded-xl p-6 flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <div class="bg-gold/20 p-4 rounded-xl text-3xl animate-bounce">🎁</div>
                        <div>
                            <h3 class="font-bold text-gold text-lg">Daily Reward Ready!</h3>
                            <p class="text-sm text-gray-300">Claim your +10 CC and keep your streak alive.</p>
                        </div>
                    </div>
                    <button class="bg-gold hover:bg-yellow-400 text-black font-bold px-6 py-2 rounded-lg shadow-lg shadow-gold/20 transition-all transform hover:scale-105">
                        Claim Reward →
                    </button>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="bg-bg-card p-4 rounded-xl border border-white/5 text-center">
                        <div class="text-gold text-2xl mb-1">⚡</div>
                        <div class="text-2xl font-bold">${user.xp}</div>
                        <div class="text-xs text-gray-500 uppercase font-bold tracking-wide">XP Earned</div>
                    </div>
                    <div class="bg-bg-card p-4 rounded-xl border border-white/5 text-center">
                        <div class="text-gold text-2xl mb-1">🪙</div>
                        <div class="text-2xl font-bold">${user.cc}</div>
                        <div class="text-xs text-gray-500 uppercase font-bold tracking-wide">Balance</div>
                    </div>
                    <div class="bg-bg-card p-4 rounded-xl border border-white/5 text-center">
                        <div class="text-orange-500 text-2xl mb-1">🔥</div>
                        <div class="text-2xl font-bold">${user.streak}</div>
                        <div class="text-xs text-gray-500 uppercase font-bold tracking-wide">Day Streak</div>
                    </div>
                     <div class="bg-bg-card p-4 rounded-xl border border-white/5 text-center">
                        <div class="text-brand text-2xl mb-1">⚔️</div>
                        <div class="text-2xl font-bold">32</div>
                        <div class="text-xs text-gray-500 uppercase font-bold tracking-wide">Solved</div>
                    </div>
                </div>

                <!-- Main Content Grid -->
                <div class="grid md:grid-cols-3 gap-8">
                    <!-- Left Col (Learning) -->
                    <div class="md:col-span-2 space-y-6">
                        <!-- Daily Challenge -->
                        <div class="bg-bg-card rounded-2xl border border-white/5 overflow-hidden">
                            <div class="bg-bg-surface px-6 py-3 border-b border-white/5 flex justify-between items-center">
                                <span class="text-xs font-bold text-brand uppercase tracking-wider bg-brand/10 px-2 py-1 rounded">Daily Challenge</span>
                                <div class="text-right">
                                    <span class="text-gold font-bold">+25 CC</span>
                                    <span class="text-xs text-gray-500 ml-2">+75 XP</span>
                                </div>
                            </div>
                            <div class="p-6">
                                <h3 class="text-xl font-bold mb-2">List Comprehension Master</h3>
                                <p class="text-gray-400 text-sm mb-6">Convert this loop into a single line list comprehension. Solve it under 2 minutes for bonus XP.</p>
                                <a href="#/challenges" class="inline-block bg-bg-surface hover:bg-brand hover:text-white border border-white/10 text-white font-bold px-6 py-2 rounded-lg transition-all">
                                    Solve Now →
                                </a>
                            </div>
                        </div>

                        <!-- Continue Learning -->
                        <div class="bg-bg-card rounded-2xl border border-white/5 p-6">
                            <h3 class="font-bold text-lg mb-4">Continue Learning</h3>
                            <div class="bg-bg-deep rounded-xl p-4 flex items-center gap-4">
                                <div class="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center text-brand text-2xl">🔄</div>
                                <div class="flex-1">
                                    <div class="flex justify-between mb-1">
                                        <h4 class="font-bold">Strings & Methods</h4>
                                        <span class="text-xs text-gray-500">Topic 4/12</span>
                                    </div>
                                    <div class="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                                        <div class="bg-brand h-full w-1/3"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="mt-4 text-center">
                                <a href="#/roadmap" class="text-brand text-sm font-bold hover:underline">Continue Chapter 1 →</a>
                            </div>
                        </div>

                        <!-- Quick Games -->
                        <div class="space-y-4">
                            <h3 class="font-bold text-lg">Quick Games</h3>
                            <div class="grid grid-cols-2 gap-4">
                                <a href="#/games" class="bg-bg-card hover:bg-bg-surface p-4 rounded-xl border border-white/5 transition-colors group">
                                    <div class="text-3xl mb-2 group-hover:scale-110 transition-transform">⌨️</div>
                                    <div class="font-bold text-sm">Type Race</div>
                                    <div class="text-xs text-gold">+20 CC Win</div>
                                </a>
                                <a href="#/games" class="bg-bg-card hover:bg-bg-surface p-4 rounded-xl border border-white/5 transition-colors group">
                                    <div class="text-3xl mb-2 group-hover:scale-110 transition-transform">🐛</div>
                                    <div class="font-bold text-sm">Bug Buster</div>
                                    <div class="text-xs text-gold">+10 CC</div>
                                </a>
                            </div>
                        </div>
                    </div>

                    <!-- Right Col (Sidebar) -->
                    <div class="space-y-6">
                        <!-- Wallet Widget -->
                        <div class="bg-bg-card rounded-2xl border border-white/5 p-6 text-center">
                            <div class="text-xs text-gray-500 uppercase font-bold tracking-wide mb-2">Total Balance</div>
                            <div class="flex items-center justify-center gap-2 mb-6">
                                <span class="text-3xl">🪙</span>
                                <span class="text-4xl font-bold text-white">${user.cc}</span>
                            </div>
                            <div class="grid grid-cols-2 gap-2 mb-4">
                                <a href="#/battles" class="bg-bg-deep hover:bg-bg-surface py-2 rounded-lg text-xs font-bold text-gray-300 border border-white/5">⚔️ Battle</a>
                                <a href="#/ads" class="bg-bg-deep hover:bg-bg-surface py-2 rounded-lg text-xs font-bold text-gray-300 border border-white/5">📺 Watch Ad</a>
                            </div>
                            <a href="#/store" class="text-gold text-sm font-bold hover:underline">Visit Store →</a>
                        </div>

                        <!-- Battle Invite -->
                        <div class="bg-bg-card rounded-2xl border border-white/5 p-4 relative overflow-hidden">
                            <div class="absolute top-0 right-0 w-2 h-full bg-red-500"></div>
                            <div class="flex items-center gap-2 mb-3">
                                <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                <span class="text-xs font-bold text-white">Battle Invite</span>
                            </div>
                            <div class="flex items-center gap-3 mb-4">
                                <div class="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold">PS</div>
                                <div>
                                    <div class="font-bold text-sm">Priya S.</div>
                                    <div class="text-xs text-gray-500">Intermediate | 500 CC</div>
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <button class="flex-1 bg-brand text-white text-xs font-bold py-2 rounded hover:bg-green-600">Accept ⚔️</button>
                                <button class="flex-1 bg-gray-700 text-white text-xs font-bold py-2 rounded hover:bg-gray-600">Decline</button>
                            </div>
                        </div>

                        <!-- Ads / Earn -->
                        <div class="bg-bg-surface/50 rounded-2xl border border-white/5 p-4">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="text-blue-400">📺</span>
                                <span class="font-bold text-sm">Earn Free CC</span>
                            </div>
                            <div class="flex justify-between text-xs text-gray-400 mb-3">
                                <span>Daily Limit</span>
                                <span>2/3 Watched</span>
                            </div>
                            <button class="w-full bg-[#1da1f2]/20 hover:bg-[#1da1f2]/30 text-[#1da1f2] border border-[#1da1f2]/50 font-bold py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                                ▶ Watch Ad (+5 CC)
                            </button>
                        </div>

                        <!-- Leaderboard Mini -->
                        <div class="bg-bg-card rounded-2xl border border-white/5 p-6">
                            <h3 class="font-bold text-sm text-gold mb-4">🏆 Top Players</h3>
                            <div class="space-y-3 text-sm">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <span class="text-gold font-bold w-4">1</span>
                                        <div class="w-6 h-6 rounded-full bg-gray-600"></div>
                                        <span>AlexCode</span>
                                    </div>
                                    <span class="text-gold font-mono">820 CC</span>
                                </div>
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <span class="text-gray-400 font-bold w-4">2</span>
                                        <div class="w-6 h-6 rounded-full bg-gray-600"></div>
                                        <span>SarahPy</span>
                                    </div>
                                    <span class="text-gold font-mono">540 CC</span>
                                </div>
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <span class="text-orange-700 font-bold w-4">3</span>
                                        <div class="w-6 h-6 rounded-full bg-gray-600"></div>
                                        <span>DevMike</span>
                                    </div>
                                    <span class="text-gold font-mono">380 CC</span>
                                </div>
                            </div>
                            <div class="mt-4 pt-4 border-t border-white/5 text-center">
                                <span class="text-xs text-gray-500">You are ranked #47</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <!-- Mobile Tab Bar (Bottom) -->
            <div class="md:hidden fixed bottom-0 w-full bg-bg-card border-t border-white/5 flex justify-around py-3 pb-safe z-40">
                <a href="#/dashboard" class="flex flex-col items-center gap-1 text-brand">
                    <span class="text-xl">🏠</span>
                    <span class="text-[10px]">Home</span>
                </a>
                <a href="#/roadmap" class="flex flex-col items-center gap-1 text-gray-500 hover:text-white">
                    <span class="text-xl">🗺️</span>
                    <span class="text-[10px]">Learn</span>
                </a>
                <a href="#/battles" class="flex flex-col items-center gap-1 text-gray-500 hover:text-white">
                    <span class="text-xl">⚔️</span>
                    <span class="text-[10px]">Battle</span>
                </a>
                 <a href="app.html" class="flex flex-col items-center gap-1 text-gray-500 hover:text-white">
                    <span class="text-xl">🐍</span>
                    <span class="text-[10px]">Code</span>
                </a>
                <a href="#/profile" class="flex flex-col items-center gap-1 text-gray-500 hover:text-white">
                    <span class="text-xl">👤</span>
                    <span class="text-[10px]">Me</span>
                </a>
            </div>
        </div>
    `;
}

// --- Implementation of Views ---

function renderRoadmap(container) {
    const user = state.user;

    // Calculate total progress
    let totalTopics = 0;
    let completedTopics = user.completedTopics.length;
    ROADMAP_DATA.forEach(track => {
        track.chapters.forEach(ch => {
            totalTopics += ch.topics.length;
        });
    });
    const progressPercent = Math.round((completedTopics / totalTopics) * 100) || 0;

    let tracksHtml = ROADMAP_DATA.map(track => {
        let chaptersHtml = track.chapters.map(chapter => {
            let topicsHtml = chapter.topics.map(topic => {
                const isCompleted = user.completedTopics.includes(topic.id);
                const statusIcon = isCompleted ? '✅' : '🔒';
                const statusClass = isCompleted ? 'text-brand' : 'text-gray-500';
                const link = isCompleted ? `#/topic/${topic.id}` : `#/topic/${topic.id}`; // Allow viewing even if not completed for now

                return `
                    <a href="${link}" class="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group">
                        <div class="flex items-center gap-3">
                            <span class="${statusClass} text-lg">${statusIcon}</span>
                            <span class="text-sm font-medium text-gray-300 group-hover:text-white">${topic.title}</span>
                        </div>
                        <div class="flex items-center gap-4">
                            <span class="text-xs text-gray-500">${topic.readTime}</span>
                            ${!isCompleted ? `<span class="text-xs text-gold border border-gold/20 px-2 py-0.5 rounded">+${topic.reward} CC</span>` : ''}
                        </div>
                    </a>
                `;
            }).join('');

            return `
                <div class="mb-8 relative pl-8 border-l border-white/10 last:border-0">
                    <div class="absolute -left-3 top-0 w-6 h-6 rounded-full bg-bg-deep border border-brand flex items-center justify-center text-xs">📚</div>
                    <h3 class="text-xl font-bold mb-1">${chapter.title}</h3>
                    <p class="text-xs text-gray-500 mb-4 uppercase tracking-wider">Chapter Reward: +${chapter.reward} CC</p>
                    <div class="bg-bg-card border border-white/5 rounded-xl overflow-hidden">
                        ${topicsHtml}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="mb-12">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-2xl font-bold text-white">${track.title}</h2>
                    <span class="text-gold font-mono text-sm">Total: ${track.totalCC} CC</span>
                </div>
                ${chaptersHtml}
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="min-h-screen bg-bg-deep pb-20 pt-8 px-4 sm:px-6 lg:px-8">
            <div class="max-w-4xl mx-auto">
                <div class="flex items-center justify-between mb-8">
                    <div>
                        <a href="#/dashboard" class="text-gray-500 hover:text-white text-sm mb-2 block">← Back to Dashboard</a>
                        <h1 class="text-3xl font-bold font-display">Python Roadmap</h1>
                    </div>
                    <div class="text-right">
                        <div class="text-2xl font-bold text-brand">${progressPercent}%</div>
                        <div class="text-xs text-gray-500 uppercase">Complete</div>
                    </div>
                </div>

                <!-- Progress Bar -->
                <div class="w-full bg-bg-surface h-3 rounded-full mb-12 overflow-hidden">
                    <div class="bg-brand h-full transition-all duration-1000" style="width: ${progressPercent}%"></div>
                </div>

                ${tracksHtml}
            </div>
        </div>
        ${renderMobileNav()}
    `;
}

function renderTopic(container, topicId) {
    const user = state.user;

    // Find topic data
    let topicData = null;
    let chapterTitle = '';

    for (const track of ROADMAP_DATA) {
        for (const chapter of track.chapters) {
            const found = chapter.topics.find(t => t.id === topicId);
            if (found) {
                topicData = found;
                chapterTitle = chapter.title;
                break;
            }
        }
        if (topicData) break;
    }

    if (!topicData) {
        renderNotFound(container);
        return;
    }

    const isCompleted = user.completedTopics.includes(topicId);

    container.innerHTML = `
        <div class="min-h-screen bg-bg-deep pb-20 pt-8 px-4 sm:px-6 lg:px-8">
             <div class="max-w-3xl mx-auto">
                <!-- Header -->
                <div class="mb-8 border-b border-white/5 pb-8">
                    <div class="flex items-center gap-2 text-sm text-gray-500 mb-4">
                        <a href="#/roadmap" class="hover:text-white">Roadmap</a>
                        <span>/</span>
                        <span>${chapterTitle}</span>
                    </div>
                    <h1 class="text-3xl md:text-4xl font-bold font-display mb-4">${topicData.title}</h1>
                    <div class="flex items-center gap-4">
                        <span class="flex items-center gap-1 text-sm text-gray-400">
                            <span>⏱️</span> ${topicData.readTime}
                        </span>
                        ${!isCompleted ? `
                            <span class="flex items-center gap-1 text-sm text-gold bg-gold/10 px-3 py-1 rounded-full border border-gold/20">
                                <span>🪙</span> Earn +${topicData.reward} CC
                            </span>
                        ` : `
                            <span class="flex items-center gap-1 text-sm text-brand bg-brand/10 px-3 py-1 rounded-full border border-brand/20">
                                <span>✅</span> Completed
                            </span>
                        `}
                    </div>
                </div>

                <!-- Content -->
                <div class="prose prose-invert max-w-none mb-12">
                    <p class="text-lg text-gray-300 leading-relaxed">
                        In this lesson, we will explore the core concepts of <strong>${topicData.title}</strong>.
                        Python makes this easy with its readable syntax.
                    </p>

                    <div class="bg-bg-card border-l-4 border-brand p-4 my-6 rounded-r-lg">
                        <h3 class="text-brand font-bold mb-2">Key Concept</h3>
                        <p class="text-gray-400">This is a placeholder for the actual educational content. Imagine a rich explanation here about variables, loops, or functions.</p>
                    </div>

                    <h3 class="text-xl font-bold mt-8 mb-4">Example Code</h3>
                    <div class="bg-[#1e1e1e] p-4 rounded-lg border border-white/5 font-mono text-sm overflow-x-auto">
                        <pre><span class="text-purple-400">def</span> <span class="text-blue-400">example_function</span>():
    <span class="text-gray-500"># This is a sample code block</span>
    <span class="text-blue-400">print</span>(<span class="text-green-400">"Hello from ${topicData.title}!"</span>)

<span class="text-blue-400">example_function</span>()</pre>
                    </div>
                </div>

                <!-- Action Bar -->
                <div class="flex items-center justify-between border-t border-white/5 pt-8">
                    <a href="#/roadmap" class="text-gray-400 hover:text-white font-medium">← Back to Roadmap</a>

                    <button
                        onclick="completeTopic('${topicId}', ${topicData.reward})"
                        ${isCompleted ? 'disabled' : ''}
                        class="${isCompleted ? 'bg-gray-700 cursor-not-allowed opacity-50' : 'bg-brand hover:bg-brand/90 shadow-lg shadow-brand/20'} text-white font-bold px-8 py-3 rounded-lg transition-all transform active:scale-95 flex items-center gap-2"
                    >
                        ${isCompleted ? '✅ Completed' : `Mark Complete & Earn +${topicData.reward} CC`}
                    </button>
                </div>
             </div>
        </div>
        ${renderMobileNav()}
    `;
}

function completeTopic(topicId, reward) {
    if (state.user.completedTopics.includes(topicId)) return;

    // Update State
    state.user.completedTopics.push(topicId);
    state.user.cc += reward;
    state.user.xp += 50; // Fixed XP for now

    // Re-render
    const app = document.getElementById('app');
    renderTopic(app, topicId);

    // Trigger Global Coin Animation (Simple Alert for now or fancy DOM append)
    // In a real app, we'd append a floating element
}

function renderMobileNav() {
    return `
        <div class="md:hidden fixed bottom-0 w-full bg-bg-card border-t border-white/5 flex justify-around py-3 pb-safe z-40">
            <a href="#/dashboard" class="flex flex-col items-center gap-1 text-gray-500 hover:text-white">
                <span class="text-xl">🏠</span>
                <span class="text-[10px]">Home</span>
            </a>
            <a href="#/roadmap" class="flex flex-col items-center gap-1 text-brand">
                <span class="text-xl">🗺️</span>
                <span class="text-[10px]">Learn</span>
            </a>
            <a href="#/battles" class="flex flex-col items-center gap-1 text-gray-500 hover:text-white">
                <span class="text-xl">⚔️</span>
                <span class="text-[10px]">Battle</span>
            </a>
            <a href="app.html" class="flex flex-col items-center gap-1 text-gray-500 hover:text-white">
                <span class="text-xl">🐍</span>
                <span class="text-[10px]">Code</span>
            </a>
            <a href="#/profile" class="flex flex-col items-center gap-1 text-gray-500 hover:text-white">
                <span class="text-xl">👤</span>
                <span class="text-[10px]">Me</span>
            </a>
        </div>
    `;
}

function renderChallenges(container) {
    const user = state.user;

    const challengesHtml = CHALLENGE_DATA.map(c => {
        const isSolved = user.solvedChallenges.includes(c.id);
        const difficultyColor = c.difficulty === 'Beginner' ? 'text-green-400' : (c.difficulty === 'Intermediate' ? 'text-yellow-400' : 'text-red-400');

        return `
            <div class="bg-bg-card border border-white/5 rounded-xl p-6 hover:border-brand/50 transition-all group relative overflow-hidden">
                ${isSolved ? '<div class="absolute top-0 right-0 bg-brand text-white text-xs font-bold px-2 py-1 rounded-bl-lg">✅ Solved</div>' : ''}

                <div class="flex justify-between items-start mb-4">
                    <div>
                        <span class="text-xs font-bold ${difficultyColor} uppercase tracking-wider mb-1 block">${c.difficulty}</span>
                        <h3 class="text-xl font-bold group-hover:text-brand transition-colors">${c.title}</h3>
                    </div>
                    <div class="text-right">
                        <div class="font-bold text-gold text-sm">+${c.reward} CC</div>
                        <div class="text-xs text-gray-500">+${c.xp} XP</div>
                    </div>
                </div>

                <div class="flex items-center gap-4 text-sm text-gray-400 mb-6">
                    <span class="flex items-center gap-1">👥 ${c.solvedCount} Solved</span>
                    <span class="flex items-center gap-1">🏷️ Algorithms</span>
                </div>

                <a href="#/challenge/${c.id}" class="block w-full text-center bg-bg-surface hover:bg-white/10 border border-white/10 text-white font-bold py-2 rounded-lg transition-colors">
                    ${isSolved ? 'Solve Again' : 'Solve Challenge →'}
                </a>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="min-h-screen bg-bg-deep pb-20 pt-8 px-4 sm:px-6 lg:px-8">
            <div class="max-w-6xl mx-auto">
                <div class="flex items-center justify-between mb-8">
                    <div>
                        <a href="#/dashboard" class="text-gray-500 hover:text-white text-sm mb-2 block">← Back to Dashboard</a>
                        <h1 class="text-3xl font-bold font-display">Python Challenges</h1>
                    </div>

                    <div class="flex gap-2">
                         <div class="bg-bg-card border border-white/5 px-4 py-2 rounded-lg text-sm text-gray-300">
                            Solved: <span class="text-brand font-bold">${user.solvedChallenges.length}</span>/${CHALLENGE_DATA.length}
                         </div>
                    </div>
                </div>

                <!-- Filters (Mock) -->
                <div class="flex overflow-x-auto gap-2 mb-8 pb-2 scrollbar-hide">
                    <button class="bg-brand text-white px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap">All</button>
                    <button class="bg-bg-card border border-white/5 text-gray-300 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap hover:bg-bg-surface">Beginner</button>
                    <button class="bg-bg-card border border-white/5 text-gray-300 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap hover:bg-bg-surface">Intermediate</button>
                    <button class="bg-bg-card border border-white/5 text-gray-300 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap hover:bg-bg-surface">Advanced</button>
                </div>

                <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${challengesHtml}
                </div>
            </div>
        </div>
        ${renderMobileNav()}
    `;
}

function renderSingleChallenge(container, id) {
    const challenge = CHALLENGE_DATA.find(c => c.id === id);
    if (!challenge) {
        renderNotFound(container);
        return;
    }

    container.innerHTML = `
        <div class="h-screen flex flex-col bg-bg-deep overflow-hidden">
            <!-- Header -->
            <header class="bg-bg-card border-b border-white/5 h-14 flex items-center px-4 justify-between shrink-0">
                <div class="flex items-center gap-4">
                    <a href="#/challenges" class="text-gray-400 hover:text-white">← Back</a>
                    <h1 class="font-bold text-white truncate">${challenge.title}</h1>
                    <span class="text-xs font-bold text-gold border border-gold/20 px-2 py-0.5 rounded">+${challenge.reward} CC</span>
                </div>
                <button onclick="runTests('${id}')" class="bg-brand hover:bg-green-500 text-white text-sm font-bold px-4 py-1.5 rounded flex items-center gap-2">
                    <span>▶</span> Run Code
                </button>
            </header>

            <div class="flex-1 flex overflow-hidden">
                <!-- Left Panel: Problem -->
                <div class="w-1/2 md:w-5/12 border-r border-white/5 overflow-y-auto p-6">
                    <div class="prose prose-invert prose-sm max-w-none">
                        <h2 class="text-xl font-bold mb-4">Problem Description</h2>
                        <p>${challenge.description}</p>

                        <div class="my-6">
                            <h3 class="text-sm font-bold uppercase text-gray-500 mb-2">Example Input</h3>
                            <code class="block bg-bg-surface p-3 rounded-lg border border-white/5 font-mono text-blue-300">${challenge.input}</code>
                        </div>

                        <div class="my-6">
                            <h3 class="text-sm font-bold uppercase text-gray-500 mb-2">Expected Output</h3>
                            <code class="block bg-bg-surface p-3 rounded-lg border border-white/5 font-mono text-green-300">${challenge.output}</code>
                        </div>

                        <div class="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg mt-8">
                            <h3 class="text-yellow-500 font-bold mb-1 text-sm">💡 Hint</h3>
                            <p class="text-xs text-gray-400">Need help? Reveal a hint for 5 CC.</p>
                            <button class="mt-2 text-xs font-bold text-yellow-500 hover:underline">Reveal Hint (-5 CC)</button>
                        </div>
                    </div>
                </div>

                <!-- Right Panel: Editor -->
                <div class="w-1/2 md:w-7/12 flex flex-col bg-[#1e1e1e]">
                    <div class="flex-1 relative">
                        <textarea id="challenge-editor" class="absolute inset-0 bg-transparent text-gray-300 p-4 font-mono resize-none outline-none leading-relaxed text-sm" spellcheck="false">${challenge.starterCode}</textarea>
                    </div>

                    <!-- Console/Tests Output -->
                    <div id="test-console" class="h-1/3 bg-[#252526] border-t border-black p-4 font-mono text-sm overflow-y-auto hidden">
                        <div class="text-gray-500 mb-2">Running tests...</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function runTests(id) {
    const consoleDiv = document.getElementById('test-console');
    consoleDiv.classList.remove('hidden');
    consoleDiv.innerHTML = '<div class="text-gray-400">🚀 Running tests...</div>';

    // Mock Execution
    setTimeout(() => {
        const success = Math.random() > 0.3; // 70% chance of success for mock

        if (success) {
            consoleDiv.innerHTML += `
                <div class="text-green-400 mt-2">✅ Test Case 1 Passed</div>
                <div class="text-green-400">✅ Test Case 2 Passed</div>
                <div class="text-green-400">✅ Test Case 3 Passed</div>
                <div class="text-brand font-bold mt-4">🎉 Challenge Solved!</div>
                <button onclick="submitChallenge('${id}')" class="mt-2 bg-brand text-white px-4 py-1 rounded text-xs font-bold">Claim Reward</button>
            `;
        } else {
            consoleDiv.innerHTML += `
                <div class="text-green-400 mt-2">✅ Test Case 1 Passed</div>
                <div class="text-red-400">❌ Test Case 2 Failed</div>
                <div class="text-gray-400 text-xs ml-4">Expected: 8, Got: 7</div>
                <div class="text-red-400 font-bold mt-4">⚠️ Solution Incorrect. Try again.</div>
            `;
        }
    }, 1000);
}

function submitChallenge(id) {
    if (!state.user.solvedChallenges.includes(id)) {
        const challenge = CHALLENGE_DATA.find(c => c.id === id);
        state.user.solvedChallenges.push(id);
        state.user.cc += challenge.reward;
        state.user.xp += challenge.xp;

        // Redirect to challenges list or show fancy modal
        alert(`Congratulations! You earned +${challenge.reward} CC and +${challenge.xp} XP!`);
    }
    window.location.hash = '#/challenges';
}

function renderBattles(container) {
    container.innerHTML = `
        <div class="min-h-screen bg-bg-deep pb-20 pt-8 px-4 sm:px-6 lg:px-8">
            <div class="max-w-6xl mx-auto">
                <div class="flex items-center justify-between mb-8">
                    <div>
                        <a href="#/dashboard" class="text-gray-500 hover:text-white text-sm mb-2 block">← Back to Dashboard</a>
                        <h1 class="text-3xl font-bold font-display">Battle Arena</h1>
                    </div>
                    <div class="bg-bg-card border border-white/5 px-4 py-2 rounded-lg text-sm text-gray-300">
                         Record: <span class="text-green-400 font-bold">18 W</span> - <span class="text-red-400 font-bold">9 L</span>
                    </div>
                </div>

                <!-- Battle Types -->
                <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <!-- 1v1 -->
                    <div class="bg-bg-card border border-white/5 rounded-xl p-6 hover:border-brand/50 transition-all group">
                        <div class="text-4xl mb-4 group-hover:scale-110 transition-transform">⚔️</div>
                        <h3 class="text-xl font-bold mb-2">1v1 Quick Battle</h3>
                        <p class="text-gray-400 text-sm mb-4">Challenge anyone. Win 50 CC.</p>
                        <div class="text-xs text-green-400 mb-4">● 234 Online</div>
                        <button onclick="startMatchmaking()" class="w-full bg-brand hover:bg-brand/90 text-white font-bold py-2 rounded-lg transition-colors">Find Opponent</button>
                    </div>

                    <!-- Group -->
                    <div class="bg-bg-card border border-white/5 rounded-xl p-6 hover:border-brand/50 transition-all group opacity-75">
                        <div class="text-4xl mb-4 group-hover:scale-110 transition-transform">👥</div>
                        <h3 class="text-xl font-bold mb-2">Group Battle</h3>
                        <p class="text-gray-400 text-sm mb-4">2-8 players. Winner takes all.</p>
                        <button disabled class="w-full bg-bg-surface border border-white/10 text-gray-500 font-bold py-2 rounded-lg cursor-not-allowed">Coming Soon</button>
                    </div>

                    <!-- Tournament -->
                    <div class="bg-bg-card border border-white/5 rounded-xl p-6 hover:border-brand/50 transition-all group">
                        <div class="text-4xl mb-4 group-hover:scale-110 transition-transform">🏟️</div>
                        <h3 class="text-xl font-bold mb-2">Weekly Tourney</h3>
                        <p class="text-gray-400 text-sm mb-4">Prize: 500 CC. Bracket style.</p>
                        <div class="text-xs text-gold mb-4">Starts Sunday 8PM</div>
                        <button class="w-full bg-gold hover:bg-yellow-400 text-black font-bold py-2 rounded-lg transition-colors">Register (30 CC)</button>
                    </div>

                    <!-- Grand Prix -->
                    <div class="bg-bg-card border border-white/5 rounded-xl p-6 hover:border-brand/50 transition-all group opacity-75">
                        <div class="text-4xl mb-4 group-hover:scale-110 transition-transform">👑</div>
                        <h3 class="text-xl font-bold mb-2">Grand Prix</h3>
                        <p class="text-gray-400 text-sm mb-4">Monthly event. 1000 CC Prize.</p>
                        <button disabled class="w-full bg-bg-surface border border-white/10 text-gray-500 font-bold py-2 rounded-lg cursor-not-allowed">Opens Feb 28</button>
                    </div>
                </div>

                <!-- Active Battles -->
                <h3 class="font-bold text-lg mb-4">Live Battles</h3>
                <div class="bg-bg-card border border-white/5 rounded-xl overflow-hidden">
                    <div class="p-4 border-b border-white/5 flex items-center justify-between hover:bg-white/5 transition-colors">
                        <div class="flex items-center gap-4">
                            <div class="flex items-center gap-2">
                                <div class="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center font-bold text-xs">JD</div>
                                <span class="font-bold text-sm">JohnDoe</span>
                            </div>
                            <span class="text-gray-500 text-xs">vs</span>
                            <div class="flex items-center gap-2">
                                <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-xs">MK</div>
                                <span class="font-bold text-sm">MikeK</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-4">
                            <span class="text-xs text-gold border border-gold/20 px-2 py-0.5 rounded">Intermediate</span>
                            <button class="text-brand text-xs font-bold hover:underline">Spectate</button>
                        </div>
                    </div>
                    <div class="p-4 border-b border-white/5 flex items-center justify-between hover:bg-white/5 transition-colors">
                         <div class="flex items-center gap-4">
                            <div class="flex items-center gap-2">
                                <div class="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center font-bold text-xs">SA</div>
                                <span class="font-bold text-sm">SarahA</span>
                            </div>
                            <span class="text-gray-500 text-xs">vs</span>
                            <div class="flex items-center gap-2">
                                <div class="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center font-bold text-xs">TB</div>
                                <span class="font-bold text-sm">TomB</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-4">
                            <span class="text-xs text-green-400 border border-green-400/20 px-2 py-0.5 rounded">Beginner</span>
                            <button class="text-brand text-xs font-bold hover:underline">Spectate</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        ${renderMobileNav()}
    `;
}

function startMatchmaking() {
    const btn = event.target;
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = '🔍 Searching...';
    btn.classList.add('animate-pulse');

    setTimeout(() => {
        btn.innerText = '⚔️ Opponent Found!';
        btn.classList.remove('animate-pulse');
        btn.classList.replace('bg-brand', 'bg-gold');
        btn.classList.replace('text-white', 'text-black');

        setTimeout(() => {
            alert('Match found! Redirecting to battle... (Mock)');
            btn.disabled = false;
            btn.innerText = originalText;
            btn.classList.replace('bg-gold', 'bg-brand');
            btn.classList.replace('text-black', 'text-white');
        }, 1500);
    }, 2000);
}

function renderGames(container) {
    container.innerHTML = `
        <div class="min-h-screen bg-bg-deep pb-20 pt-8 px-4 sm:px-6 lg:px-8">
            <div class="max-w-6xl mx-auto">
                <div class="flex items-center justify-between mb-8">
                    <div>
                        <a href="#/dashboard" class="text-gray-500 hover:text-white text-sm mb-2 block">← Back to Dashboard</a>
                        <h1 class="text-3xl font-bold font-display">Python Game Zone</h1>
                    </div>
                </div>

                <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <!-- Type Race -->
                    <div class="bg-bg-card border border-white/5 rounded-xl p-6 hover:border-brand/50 transition-all group">
                        <div class="text-4xl mb-4 group-hover:scale-110 transition-transform">⌨️</div>
                        <h3 class="text-xl font-bold mb-2">Type Race</h3>
                        <p class="text-gray-400 text-sm mb-4">Race typing Python code. Improve your speed.</p>
                        <div class="text-xs text-gold mb-4">+20 CC for win</div>
                        <a href="#/game/type-race" class="block w-full text-center bg-brand hover:bg-brand/90 text-white font-bold py-2 rounded-lg transition-colors">Play Now</a>
                    </div>

                    <!-- Bug Buster -->
                    <div class="bg-bg-card border border-white/5 rounded-xl p-6 hover:border-brand/50 transition-all group">
                        <div class="text-4xl mb-4 group-hover:scale-110 transition-transform">🐛</div>
                        <h3 class="text-xl font-bold mb-2">Bug Buster</h3>
                        <p class="text-gray-400 text-sm mb-4">Find & fix bugs in time. Don't let them escape!</p>
                        <div class="text-xs text-gold mb-4">+10 CC per bug</div>
                        <button disabled class="w-full bg-bg-surface border border-white/10 text-gray-500 font-bold py-2 rounded-lg cursor-not-allowed">Coming Soon</button>
                    </div>

                    <!-- Quiz Battle -->
                    <div class="bg-bg-card border border-white/5 rounded-xl p-6 hover:border-brand/50 transition-all group">
                        <div class="text-4xl mb-4 group-hover:scale-110 transition-transform">🧠</div>
                        <h3 class="text-xl font-bold mb-2">Quiz Battle</h3>
                        <p class="text-gray-400 text-sm mb-4">Real-time Python quiz duels.</p>
                        <div class="text-xs text-gold mb-4">+15 CC for win</div>
                        <button disabled class="w-full bg-bg-surface border border-white/10 text-gray-500 font-bold py-2 rounded-lg cursor-not-allowed">Coming Soon</button>
                    </div>
                </div>
            </div>
        </div>
        ${renderMobileNav()}
    `;
}

function renderGameTypeRace(container) {
    container.innerHTML = `
        <div class="h-screen flex flex-col bg-bg-deep relative overflow-hidden">
             <!-- Game Header -->
            <header class="bg-bg-card border-b border-white/5 h-16 flex items-center px-6 justify-between shrink-0 z-10">
                <a href="#/games" class="text-gray-400 hover:text-white">← Exit</a>
                <div class="font-bold text-xl">⌨️ Type Race</div>
                <div class="font-mono text-gold text-lg" id="timer">00:45</div>
            </header>

            <div class="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
                <!-- Progress Bars -->
                <div class="w-full max-w-3xl mb-12 space-y-4">
                    <div class="flex items-center gap-4">
                        <span class="text-brand font-bold w-20 text-right">You</span>
                        <div class="flex-1 bg-bg-surface h-4 rounded-full overflow-hidden">
                            <div id="player-progress" class="bg-brand h-full w-0 transition-all duration-200"></div>
                        </div>
                    </div>
                    <div class="flex items-center gap-4 opacity-50">
                        <span class="text-red-400 font-bold w-20 text-right">Bot</span>
                        <div class="flex-1 bg-bg-surface h-4 rounded-full overflow-hidden">
                            <div id="bot-progress" class="bg-red-400 h-full w-0 transition-all duration-1000"></div>
                        </div>
                    </div>
                </div>

                <!-- Code Display -->
                <div class="bg-bg-card border border-white/10 p-8 rounded-2xl w-full max-w-3xl shadow-2xl relative">
                    <pre class="font-mono text-lg text-gray-500 mb-6 leading-relaxed select-none" id="code-display">def hello_world():
    print("Hello, World!")
    return True</pre>

                    <textarea
                        id="type-input"
                        class="w-full bg-bg-surface border border-brand/50 rounded-lg p-4 font-mono text-lg text-white outline-none focus:ring-2 focus:ring-brand placeholder-gray-600"
                        placeholder="Type the code above..."
                        oninput="checkTyping(this)"
                        autofocus
                    ></textarea>
                </div>

                <div id="game-result" class="hidden absolute inset-0 bg-bg-deep/90 z-20 flex flex-col items-center justify-center text-center">
                    <div class="text-6xl mb-4">🏆</div>
                    <h2 class="text-4xl font-bold text-white mb-2">You Won!</h2>
                    <p class="text-xl text-gray-300 mb-8">Speed: <span class="text-brand font-bold">45 WPM</span> | Accuracy: <span class="text-brand font-bold">100%</span></p>
                    <div class="flex gap-4">
                        <button onclick="router()" class="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg">Back to Menu</button>
                        <button onclick="router()" class="bg-brand hover:bg-brand/90 text-white font-bold py-3 px-8 rounded-lg">Play Again</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Simple Game Logic
    window.checkTyping = function(input) {
        const targetText = document.getElementById('code-display').innerText;
        const currentText = input.value;
        const progress = (currentText.length / targetText.length) * 100;

        document.getElementById('player-progress').style.width = `${progress}%`;

        if (currentText === targetText) {
            document.getElementById('game-result').classList.remove('hidden');
            // Award Coins
            state.user.cc += 20;
        }
    };

    // Mock Bot
    let botProgress = 0;
    const botInterval = setInterval(() => {
        if (botProgress < 100) {
            botProgress += Math.random() * 2;
            const botBar = document.getElementById('bot-progress');
            if(botBar) botBar.style.width = `${botProgress}%`;
        } else {
            clearInterval(botInterval);
        }
    }, 500);
}

function renderStore(container) {
    const user = state.user;

    const itemsHtml = STORE_ITEMS.map(item => {
        const owned = user.inventory.includes(item.id);
        const canAfford = user.cc >= item.price;

        return `
            <div class="bg-bg-card border border-white/5 rounded-xl p-6 hover:border-brand/50 transition-all group">
                <div class="text-4xl mb-4 group-hover:scale-110 transition-transform">${item.icon}</div>
                <h3 class="text-xl font-bold mb-1">${item.name}</h3>
                <p class="text-xs text-gray-400 mb-4 h-8">${item.desc}</p>

                <div class="flex items-center justify-between mt-auto">
                    <span class="text-gold font-bold">${item.price} CC</span>
                    <button
                        onclick="buyItem('${item.id}', ${item.price})"
                        ${owned ? 'disabled' : (canAfford ? '' : 'disabled')}
                        class="px-4 py-2 rounded-lg text-sm font-bold transition-colors ${owned ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : (canAfford ? 'bg-brand hover:bg-brand/90 text-white' : 'bg-red-500/20 text-red-400 cursor-not-allowed border border-red-500/20')}"
                    >
                        ${owned ? 'Owned' : (canAfford ? 'Buy' : 'Need CC')}
                    </button>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="min-h-screen bg-bg-deep pb-20 pt-8 px-4 sm:px-6 lg:px-8">
            <div class="max-w-6xl mx-auto">
                <div class="flex items-center justify-between mb-8">
                    <div>
                        <a href="#/dashboard" class="text-gray-500 hover:text-white text-sm mb-2 block">← Back to Dashboard</a>
                        <h1 class="text-3xl font-bold font-display">CodeCoin Store</h1>
                    </div>
                    <div class="bg-bg-card border border-white/5 px-4 py-2 rounded-lg text-lg font-bold text-gold flex items-center gap-2">
                         <span>🪙</span> ${user.cc} CC
                    </div>
                </div>

                <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    ${itemsHtml}
                </div>
            </div>
        </div>
        ${renderMobileNav()}
    `;
}

function buyItem(id, price) {
    if (state.user.cc >= price && !state.user.inventory.includes(id)) {
        state.user.cc -= price;
        state.user.inventory.push(id);
        alert('Item Purchased! 🎉');

        // Re-render
        const app = document.getElementById('app');
        renderStore(app);
    }
}

function renderProfile(container) {
    const user = state.user;

    container.innerHTML = `
        <div class="min-h-screen bg-bg-deep pb-20 pt-8 px-4 sm:px-6 lg:px-8">
            <div class="max-w-4xl mx-auto">
                <a href="#/dashboard" class="text-gray-500 hover:text-white text-sm mb-6 block">← Back to Dashboard</a>

                <!-- Profile Header -->
                <div class="bg-bg-card border border-white/5 rounded-2xl p-8 mb-8 relative overflow-hidden">
                    <div class="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-brand to-teal-500 opacity-20"></div>

                    <div class="relative flex flex-col md:flex-row items-center gap-6">
                        <div class="w-24 h-24 rounded-full bg-bg-surface border-4 border-bg-deep flex items-center justify-center text-4xl shadow-xl">
                            🐍
                        </div>
                        <div class="text-center md:text-left">
                            <h1 class="text-3xl font-bold font-display">${user.name}</h1>
                            <p class="text-brand font-mono">@${user.username}</p>
                            <p class="text-gray-400 text-sm mt-2 max-w-md">Python enthusiast. Level 12 Coder. Battling my way to the top.</p>
                        </div>
                        <div class="md:ml-auto flex gap-4">
                            <button class="bg-bg-surface hover:bg-white/10 border border-white/10 px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors">Edit Profile</button>
                        </div>
                    </div>
                </div>

                <!-- Stats Row -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div class="bg-bg-card p-4 rounded-xl border border-white/5 text-center">
                        <div class="text-gold text-2xl mb-1">⚡</div>
                        <div class="text-2xl font-bold">${user.xp}</div>
                        <div class="text-xs text-gray-500 uppercase font-bold tracking-wide">XP Earned</div>
                    </div>
                    <div class="bg-bg-card p-4 rounded-xl border border-white/5 text-center">
                        <div class="text-gold text-2xl mb-1">🪙</div>
                        <div class="text-2xl font-bold">${user.cc}</div>
                        <div class="text-xs text-gray-500 uppercase font-bold tracking-wide">Balance</div>
                    </div>
                    <div class="bg-bg-card p-4 rounded-xl border border-white/5 text-center">
                        <div class="text-orange-500 text-2xl mb-1">🔥</div>
                        <div class="text-2xl font-bold">${user.streak}</div>
                        <div class="text-xs text-gray-500 uppercase font-bold tracking-wide">Day Streak</div>
                    </div>
                    <div class="bg-bg-card p-4 rounded-xl border border-white/5 text-center">
                        <div class="text-brand text-2xl mb-1">⚔️</div>
                        <div class="text-2xl font-bold">${user.solvedChallenges.length}</div>
                        <div class="text-xs text-gray-500 uppercase font-bold tracking-wide">Challenges</div>
                    </div>
                </div>

                <div class="grid md:grid-cols-2 gap-8">
                    <!-- Badges -->
                    <div class="bg-bg-card border border-white/5 rounded-2xl p-6">
                        <h3 class="font-bold text-lg mb-4">Badges</h3>
                        <div class="grid grid-cols-4 gap-4">
                            <div class="aspect-square bg-bg-surface rounded-xl flex items-center justify-center text-2xl border border-brand/50 shadow-[0_0_15px_rgba(43,186,96,0.2)]" title="First Steps">🌱</div>
                            <div class="aspect-square bg-bg-surface rounded-xl flex items-center justify-center text-2xl border border-gold/50 shadow-[0_0_15px_rgba(255,192,0,0.2)]" title="Rich">💰</div>
                            <div class="aspect-square bg-bg-surface rounded-xl flex items-center justify-center text-2xl border border-blue-500/50" title="Battle Born">⚔️</div>
                            <div class="aspect-square bg-bg-surface/30 rounded-xl flex items-center justify-center text-2xl opacity-30 grayscale">🏆</div>
                        </div>
                    </div>

                    <!-- Activity Heatmap (Mock) -->
                    <div class="bg-bg-card border border-white/5 rounded-2xl p-6">
                        <h3 class="font-bold text-lg mb-4">Activity</h3>
                        <div class="grid grid-cols-10 gap-1">
                             ${Array(50).fill(0).map(() => {
                                 const opacity = Math.random() > 0.7 ? 'bg-brand' : (Math.random() > 0.4 ? 'bg-brand/40' : 'bg-bg-surface');
                                 return `<div class="aspect-square rounded-sm ${opacity}"></div>`;
                             }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        ${renderMobileNav()}
    `;
}
function renderLeaderboard(container) {
    const user = state.user;

    // Mock Leaderboard Data
    const leaderboardData = [
        { rank: 1, name: 'AlexCode', xp: 24500, cc: 820, battles: 15, streak: 30, avatar: 'bg-green-500' },
        { rank: 2, name: 'SarahPy', xp: 22100, cc: 540, battles: 12, streak: 25, avatar: 'bg-blue-500' },
        { rank: 3, name: 'DevMike', xp: 19800, cc: 380, battles: 10, streak: 20, avatar: 'bg-purple-500' },
        { rank: 4, name: 'CoderJane', xp: 18500, cc: 320, battles: 8, streak: 18, avatar: 'bg-orange-500' },
        { rank: 5, name: 'PyMaster', xp: 17200, cc: 290, battles: 6, streak: 15, avatar: 'bg-teal-500' },
        // ... more users
    ];

    // Add current user if not in top list (mock logic)
    const userRank = 47;

    container.innerHTML = `
        <div class="min-h-screen bg-bg-deep pb-20 pt-8 px-4 sm:px-6 lg:px-8">
            <div class="max-w-4xl mx-auto">
                <div class="flex items-center justify-between mb-8">
                    <div>
                        <a href="#/dashboard" class="text-gray-500 hover:text-white text-sm mb-2 block">← Back to Dashboard</a>
                        <h1 class="text-3xl font-bold font-display">Global Leaderboard</h1>
                    </div>
                    <div class="flex gap-2">
                        <button class="bg-brand text-white px-4 py-2 rounded-lg text-sm font-bold">Global</button>
                        <button class="bg-bg-card border border-white/5 text-gray-400 px-4 py-2 rounded-lg text-sm font-bold hover:text-white">Friends</button>
                    </div>
                </div>

                <!-- Top 3 Podium -->
                <div class="flex justify-center items-end gap-4 mb-12">
                    <!-- 2nd Place -->
                    <div class="text-center">
                        <div class="w-16 h-16 rounded-full bg-blue-500 border-4 border-bg-deep mx-auto mb-2 flex items-center justify-center font-bold text-xl relative">
                            SP
                            <div class="absolute -bottom-2 bg-bg-surface text-xs font-bold px-2 py-0.5 rounded border border-white/10">#2</div>
                        </div>
                        <div class="font-bold text-white">SarahPy</div>
                        <div class="text-xs text-gold">22,100 XP</div>
                        <div class="h-24 w-20 bg-bg-card border-t-4 border-gray-400 rounded-t-lg mx-auto mt-2 opacity-80"></div>
                    </div>

                    <!-- 1st Place -->
                    <div class="text-center relative z-10">
                        <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 text-4xl animate-bounce">👑</div>
                        <div class="w-20 h-20 rounded-full bg-green-500 border-4 border-gold mx-auto mb-2 flex items-center justify-center font-bold text-2xl relative shadow-[0_0_20px_rgba(255,192,0,0.3)]">
                            AC
                            <div class="absolute -bottom-2 bg-gold text-black text-xs font-bold px-2 py-0.5 rounded border border-white/10">#1</div>
                        </div>
                        <div class="font-bold text-gold text-lg">AlexCode</div>
                        <div class="text-xs text-gold font-bold">24,500 XP</div>
                        <div class="h-32 w-24 bg-bg-card border-t-4 border-gold rounded-t-lg mx-auto mt-2 bg-gradient-to-b from-gold/10 to-transparent"></div>
                    </div>

                    <!-- 3rd Place -->
                    <div class="text-center">
                        <div class="w-16 h-16 rounded-full bg-purple-500 border-4 border-bg-deep mx-auto mb-2 flex items-center justify-center font-bold text-xl relative">
                            DM
                            <div class="absolute -bottom-2 bg-bg-surface text-xs font-bold px-2 py-0.5 rounded border border-white/10">#3</div>
                        </div>
                        <div class="font-bold text-white">DevMike</div>
                        <div class="text-xs text-gold">19,800 XP</div>
                        <div class="h-20 w-20 bg-bg-card border-t-4 border-orange-700 rounded-t-lg mx-auto mt-2 opacity-80"></div>
                    </div>
                </div>

                <!-- Leaderboard Table -->
                <div class="bg-bg-card border border-white/5 rounded-2xl overflow-hidden">
                    <div class="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <div class="col-span-1 text-center">Rank</div>
                        <div class="col-span-5">Player</div>
                        <div class="col-span-2 text-right">XP</div>
                        <div class="col-span-2 text-right">CC</div>
                        <div class="col-span-2 text-center">Streak</div>
                    </div>

                    ${leaderboardData.slice(3).map(p => `
                        <div class="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 items-center hover:bg-white/5 transition-colors">
                            <div class="col-span-1 text-center font-bold text-gray-400">#${p.rank}</div>
                            <div class="col-span-5 flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full ${p.avatar} flex items-center justify-center font-bold text-xs shadow-lg">
                                    ${p.name.substring(0,2).toUpperCase()}
                                </div>
                                <span class="font-bold text-white">${p.name}</span>
                            </div>
                            <div class="col-span-2 text-right font-mono text-gold">${p.xp.toLocaleString()}</div>
                            <div class="col-span-2 text-right font-mono text-gray-400">${p.cc}</div>
                            <div class="col-span-2 text-center text-orange-500 font-bold">🔥 ${p.streak}</div>
                        </div>
                    `).join('')}

                    <!-- User Row (Pinned) -->
                    <div class="grid grid-cols-12 gap-4 px-6 py-4 bg-brand/10 border-t border-brand/20 items-center">
                        <div class="col-span-1 text-center font-bold text-brand">#${userRank}</div>
                        <div class="col-span-5 flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-brand flex items-center justify-center font-bold text-xs shadow-lg text-white">
                                YOU
                            </div>
                            <span class="font-bold text-white">${user.name} (You)</span>
                        </div>
                        <div class="col-span-2 text-right font-mono text-gold font-bold">${user.xp.toLocaleString()}</div>
                        <div class="col-span-2 text-right font-mono text-gray-400">${user.cc}</div>
                        <div class="col-span-2 text-center text-orange-500 font-bold">🔥 ${user.streak}</div>
                    </div>
                </div>
            </div>
        </div>
        ${renderMobileNav()}
    `;
}

function renderNotFound(c) { c.innerHTML = '<div class="p-10 text-center text-4xl">404 - Page Not Found</div>'; }

// --- Initialization ---
window.addEventListener('hashchange', router);
window.addEventListener('load', router);
