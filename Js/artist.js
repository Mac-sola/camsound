// Artist Dashboard JavaScript
console.log("🚀 Js/artist.js loaded");
function showNotification(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }

    // Create toast
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;

    // Add to container
    toastContainer.appendChild(toast);

    // Show toast
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();

    // Remove after hide
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// Authentication check
async function checkAuth() {
    console.log("🔐 Checking authentication...");

    try {
        const response = await fetch('backend/api/session.php', {
            method: 'GET',
            credentials: 'include' // Include cookies for session
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data.user.type === 'artist') {
                console.log(`✅ Artist authenticated: ${data.data.user.name}`);
                return true;
            }
        }

        console.log("⚠️ Artist authentication failed, redirecting to login.");
        if (window.afro && window.afro.redirectTo) {
            window.afro.redirectTo('/auth/login.html');
        } else {
            window.location.href = 'auth/login.html';
        }
        return false;

    } catch (error) {
        console.error("❌ Authentication check failed:", error);
        if (window.afro && window.afro.redirectTo) {
            window.afro.redirectTo('/auth/login.html');
        } else {
            window.location.href = 'auth/login.html';
        }
        return false;
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    console.log("🎬 DOMContentLoaded started");
    // Load notification settings and set checkboxes
    async function loadNotificationSettings() {
        try {
            const res = await fetch('backend/api/notification_settings.php', { credentials: 'include' });
            const data = await res.json();
            if (data.success && data.data) {
                document.getElementById('notifNewFollowers').checked = !!data.data.notif_new_followers;
                document.getElementById('notifComments').checked = !!data.data.notif_comments;
                document.getElementById('notifStreamMilestones').checked = !!data.data.notif_stream_milestones;
                document.getElementById('notifRevenueUpdates').checked = !!data.data.notif_revenue_updates;
                document.getElementById('notifMarketing').checked = !!data.data.notif_marketing;
            }
        } catch (e) {
            // Ignore errors, use defaults
        }
    }
    // Call on page load
    setTimeout(loadNotificationSettings, 500); // Delay to ensure checkboxes exist
    console.log('Artist Dashboard JavaScript loaded successfully!');

    // Check authentication first
    try {
        if (!(await checkAuth())) {
            console.log("🛑 Auth check failed - exiting initialization");
            return; // checkAuth will redirect
        }
        console.log("✅ Auth check passed");
    } catch (authError) {
        console.error("❌ Auth process error:", authError);
        // If auth fails hard, we still redirect
        if (window.afro && window.afro.redirectTo) {
            window.afro.redirectTo('/auth/login.html');
        }
        return;
    }

    // Success: Reveal the page content
    document.body.style.display = 'block';
    console.log("✨ Dashboard visible");
    console.log("📊 Chart library status:", typeof Chart !== 'undefined' ? "Available" : "Missing");

    // State management
    let currentView = 'dashboard';
    let currentPlan = 'Free'; // Set to Free by default, will be updated from backend
    let uploadedSongs = []; // Store uploaded songs data (loaded from backend)
    let artistId = null;

    // Mock Data for notifications and profile; songs will come from backend
    const mockData = {
        songs: [],
        notifications: [],
        stats: {},
        profile: {
            name: '',
            real_name: '',
            bio: '',
            location: '',
            website: '',
            genre: '',
            avatar: '',
            followers: null,
            social: {}
        }
    };

    // Load songs from backend first, then initialize dashboard
    console.log("📡 Starting data load from backend...");
    let sessionData = null; // Scope sessionData higher
    try {
        await loadArtistSongsFromBackend();
        console.log("📦 Data load complete");
        initializeDashboard();
        console.log("🎯 Dashboard initialized");
    } catch (err) {
        console.error('❌ Error in initialization sequence:', err);
        // Attempt a fallback initialization
        try {
            initializeDashboard();
        } catch (initErr) {
            console.error('Critical initialization failure:', initErr);
            document.getElementById('main-content').innerHTML = `
                <div class="alert alert-danger m-4">
                    <h5><i class="fas fa-exclamation-circle me-2"></i>Initialization Error</h5>
                    <p>There was a problem loading your dashboard. Please try refreshing.</p>
                </div>
            `;
        }
    }

    async function loadArtistSongsFromBackend() {
        console.log("🔍 Running loadArtistSongsFromBackend...");
        try {
            const sessionRes = await fetch('backend/api/session.php', { credentials: 'include' });
            sessionData = await sessionRes.json();
            console.log("👤 Session Data:", sessionData);
            if (sessionData.success && sessionData.data.user) {

                // Set initial name from session
                mockData.profile.name = sessionData.data.user.name;

                // Get artist profile
                const artistRes = await fetch(`backend/api/artists.php?user_id=${sessionData.data.user.id}`, { credentials: 'include' });
                const artistJson = await artistRes.json();

                if (artistJson.success && artistJson.data.length > 0) {
                    const artist = artistJson.data[0]; // Assuming user has one artist profile
                    artistId = artist.id;
                    mockData.profile.name = artist.name;
                    mockData.profile.real_name = artist.real_name || '';
                    mockData.profile.bio = artist.bio || '';
                    mockData.profile.genre = artist.genre || '';
                    mockData.profile.location = artist.location || '';
                    mockData.profile.website = artist.website || '';
                    mockData.profile.avatar = artist.image || '';
                    mockData.profile.avatarColor = artist.avatar_color || 'var(--primary-color)';
                    mockData.profile.followers = artist.followers;
                    mockData.profile.social = {
                        instagram: artist.instagram_url || '',
                        twitter: artist.twitter_url || '',
                        facebook: artist.facebook_url || '',
                        youtube: artist.youtube_url || ''
                    };

                    // Critical: Initialize stats from artists.php as a reliable fallback
                    console.log("📊 Artist profile stats mapping:", {
                        totalPlays: artist.total_plays,
                        totalLikes: artist.total_likes,
                        totalDownloads: artist.total_downloads
                    });
                    mockData.stats.totalPlays = artist.total_plays || 0;
                    mockData.stats.totalLikes = artist.total_likes || 0;
                    mockData.stats.totalDownloads = artist.total_downloads || 0;
                }

                // Update header elements immediately
                const topBarName = document.getElementById('topBarArtistName');
                if (topBarName) topBarName.textContent = mockData.profile.name;

                const topBarImage = document.getElementById('topBarProfileImage');
                if (topBarImage) topBarImage.src = mockData.profile.avatar;

                // Fetch current subscription plan
                try {
                    const subRes = await fetch(`backend/api/subscriptions.php?user_id=${sessionData.data.user.id}`, { credentials: 'include' });
                    const subJson = await subRes.json();
                    if (subJson.success && subJson.data.length > 0) {
                        currentPlan = subJson.data[0].plan_name;
                        console.log("💳 Current Plan from backend:", currentPlan);
                    }
                } catch (subErr) {
                    console.warn("Failed to fetch subscription plan, defaulting to Free", subErr);
                }
            }
        } catch (e) {
            console.error('Error loading session/profile:', e);
        }

        // Fetch Real-Time Stats
        try {
            const statsRes = await fetch('backend/api/stats.php?type=artist', { credentials: 'include' });
            const statsJson = await statsRes.json();
            if (statsJson.success) {
                mockData.stats = {
                    ...mockData.stats,
                    totalPlays: statsJson.data.total_plays,
                    totalLikes: statsJson.data.total_likes,
                    totalRevenue: statsJson.data.total_revenue,
                    monthlyRevenue: statsJson.data.total_revenue, // Using total as monthly for now if not split
                    chartData: statsJson.data.monthly_streams,
                    revenueData: statsJson.data.monthly_revenue,
                    demographics: statsJson.data.audience_demographics,
                    recentActivity: statsJson.data.recent_activity || [],
                    analyticsOverview: statsJson.data.analytics_overview || mockData.stats.analyticsOverview
                };
            }
        } catch (e) {
            console.warn('Stats fetch failed, using defaults', e);
        }

        // Fetch Notifications
        try {
            if (sessionData && sessionData.data && sessionData.data.user) {
                const notifRes = await fetch(`backend/api/notifications.php?user_id=${sessionData.data.user.id}`, { credentials: 'include' });
                const notifJson = await notifRes.json();
                mockData.notifications = notifJson.data
                    .filter(n => !n.message.includes("You're now following") && !n.message.includes("Unfollowed"))
                    .map(n => ({
                        id: n.id,
                        title: 'Notification',
                        message: n.message,
                        time: new Date(n.created_at).toLocaleDateString(),
                        read: n.is_read == 1
                    }));
            }
        } catch (e) {
            console.warn('Notifications fetch failed', e);
        }

        // Sync notification badges immediately
        if (typeof updateNotificationDropdown === 'function') {
            updateNotificationDropdown();
        }

        // Setup notification polling (every 10 seconds)
        if (!window.notificationInterval) {
            window.notificationInterval = setInterval(refreshArtistNotifications, 10000);
        }

        // Setup stats polling (every 30 seconds)
        if (!window.statsInterval) {
            window.statsInterval = setInterval(refreshArtistStats, 30000);
        }

        const res = await fetch('backend/api/songs.php', { credentials: 'include' });
        const json = await res.json();
        if (!json.success) {
            throw new Error(json.message || 'Failed to load songs');
        }

        // Filter songs by artist when we know the artist ID; for now, show all active songs
        // If we found the artist ID, filter strictly by it. Otherwise, show all (dev mode fallback)
        let songs = json.data;

        if (artistId) {
            songs = songs.filter(song => {
                const match = song.artist_id == artistId;
                if (!match) { }
                return match && (song.status === 'active' || song.status === 'pending');
            });
        } else {
            songs = songs.filter(song => song.status === 'active' || song.status === 'pending');
        }

        uploadedSongs = songs.map(song => ({
            id: song.id,
            title: song.title,
            genre: song.genre || 'Unknown',
            date: song.uploaded_at ? song.uploaded_at.split(' ')[0] : '',
            plays: Number(song.plays || 0).toLocaleString(),
            likes: Number(song.likes || 0).toLocaleString(),
            downloads: '0',
            status: song.status,
            audioFile: song.file_path || null,
            coverArt: song.cover_art || null
        }));

        mockData.songs = uploadedSongs;
    }

    async function refreshArtistNotifications() {
        if (!sessionData || !sessionData.data || !sessionData.data.user) return;
        try {
            const notifRes = await fetch(`backend/api/notifications.php?user_id=${sessionData.data.user.id}`, { credentials: 'include' });
            const notifJson = await notifRes.json();
            if (notifJson.success) {
                mockData.notifications = notifJson.data
                    .filter(n => !n.message.includes("You're now following") && !n.message.includes("Unfollowed"))
                    .map(n => ({
                        id: n.id,
                        title: 'Notification',
                        message: n.message,
                        time: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        read: n.is_read == 1
                    }));

                if (typeof updateNotificationDropdown === 'function') {
                    updateNotificationDropdown();
                }
            }
        } catch (e) {
            console.warn('Silent notification refresh failed', e);
        }
    }

    async function refreshArtistStats() {
        try {
            const statsRes = await fetch('backend/api/stats.php?type=artist', { credentials: 'include' });
            const statsJson = await statsRes.json();
            if (statsJson.success) {
                mockData.stats = {
                    ...mockData.stats,
                    totalPlays: statsJson.data.total_plays,
                    totalLikes: statsJson.data.total_likes,
                    totalRevenue: statsJson.data.total_revenue,
                    monthlyRevenue: statsJson.data.total_revenue, 
                    chartData: statsJson.data.monthly_streams,
                    revenueData: statsJson.data.monthly_revenue,
                    demographics: statsJson.data.audience_demographics,
                    recentActivity: statsJson.data.recent_activity || [],
                    analyticsOverview: statsJson.data.analytics_overview || mockData.stats.analyticsOverview
                };

                // Update UI elements that are currently visible
                const playsEl = document.getElementById('stat-total-plays');
                const likesEl = document.getElementById('stat-total-likes');
                const revenueEl = document.getElementById('stat-monthly-revenue');
                const downloadsEl = document.getElementById('stat-total-downloads');

                if (playsEl) playsEl.textContent = mockData.stats.totalPlays;
                if (likesEl) likesEl.textContent = mockData.stats.totalLikes;
                if (revenueEl) revenueEl.textContent = mockData.stats.totalRevenue;
                if (downloadsEl) downloadsEl.textContent = mockData.stats.totalDownloads;

                // Refresh activity timeline if on dashboard
                const timeline = document.querySelector('.activity-timeline');
                if (timeline) {
                    timeline.innerHTML = getActivityTimeline();
                }
            }
        } catch (e) {
            console.warn('Silent stats refresh failed', e);
        }
    }

    function initializeDashboard() {
        console.log('Initializing dashboard...');

        // Sidebar toggle: Js/dashboard-ui.js

        // Initialize logout buttons
        const logoutButtons = document.querySelectorAll('#logoutBtn, #topLogoutBtn');
        logoutButtons.forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                if (confirm('Are you sure you want to logout?')) {
                    // Show loading
                    document.getElementById('main-content').innerHTML = `
                        <div class="text-center py-5">
                            <div class="loading-spinner mx-auto"></div>
                            <p class="mt-3 text-fix">Logging out...</p>
                        </div>
                    `;

                    // Clear server-side session before leaving the dashboard
                    fetch('backend/api/session.php', {
                        method: 'DELETE',
                        credentials: 'include'
                    })
                        .catch(error => {
                            console.warn('Artist logout API failed, continuing with redirect', error);
                        })
                        .finally(() => {
                            setTimeout(() => {
                                window.location.href = 'index.html';
                            }, 500);
                        });
                }
            });
        });

        // Initialize navigation
        const navItems = document.querySelectorAll('[data-view]');
        navItems.forEach(item => {
            item.addEventListener('click', function (e) {
                e.preventDefault();

                // Remove active class from all items (primarily for sidebar)
                const sidebarNavItems = document.querySelectorAll('.list-group-item[data-view]');
                sidebarNavItems.forEach(nav => nav.classList.remove('active'));

                // Add active class if it's a sidebar item
                if (this.classList.contains('list-group-item')) {
                    this.classList.add('active');
                } else {
                    // If it's the "View All Notifications" link or other non-sidebar item,
                    // find the corresponding sidebar item and activate it
                    const view = this.getAttribute('data-view');
                    const correspondingSidebarItem = document.querySelector(`.list-group-item[data-view="${view}"]`);
                    if (correspondingSidebarItem) {
                        correspondingSidebarItem.classList.add('active');
                    }

                    if (window.dashboardUI && typeof window.dashboardUI.closeSidebarIfMobile === 'function') {
                        window.dashboardUI.closeSidebarIfMobile();
                    }
                }

                // Get view from data attribute
                const view = this.getAttribute('data-view');
                console.log('Loading view:', view);

                // Load the view
                loadView(view);
            });
        });

        // Initialize notification dropdown
        const notificationDropdown = document.getElementById('notificationDropdown');
        if (notificationDropdown) {
            notificationDropdown.addEventListener('click', function () {
                updateNotificationDropdown();
            });
        }

        // Load initial view
        loadView('dashboard');
    }

    // Function to load different views
    function loadView(view) {
        console.log('Loading view:', view);
        const mainContent = document.getElementById('main-content');
        if (!mainContent) {
            console.error('main-content element not found');
            return;
        }
        currentView = view;

        // Update page title
        document.title = getViewTitle(view) + ' - Artist Dashboard - Beats';

        // Show loading indicator
        mainContent.innerHTML = `
            <div class="text-center py-5">
                <div class="loading-spinner mx-auto"></div>
                <p class="mt-3 text-fix">Loading ${getViewTitle(view)}...</p>
            </div>
        `;

        // Simulate loading delay
        setTimeout(() => {
            try {
                console.log('Setting content for view:', view);
                // Load the actual content
                mainContent.innerHTML = getViewContent(view);

                // Re-attach event listeners for the new content
                reattachEventListeners(view);

                // Initialize any required components
                initializeViewComponents(view);
                console.log('View loaded successfully:', view);
            } catch (error) {
                console.error('Error loading view:', error);
                mainContent.innerHTML = `
                    <div class="text-center py-5">
                        <div class="text-danger">Error loading ${getViewTitle(view)}</div>
                        <p class="text-muted">Please try refreshing the page</p>
                        <small class="text-muted">${error.message}</small>
                    </div>
                `;
            }
        }, 0);
    }

    // Function to get view title
    function getViewTitle(view) {
        const titles = {
            'dashboard': 'Dashboard Overview',
            'profile': 'Profile Management',
            'music': 'Music Uploads',
            'analytics': 'Performance & Analytics',
            'revenue': 'Revenue & Royalties',
            'subscription': 'Subscription Plan',
            'notifications': 'Notifications',
            'social': 'Social Interaction'
        };
        return titles[view] || 'Artist Dashboard';
    }

    // Function to get view content
    function getViewContent(view) {
        switch (view) {
            case 'dashboard':
                return getDashboardContent();
            case 'profile':
                return getProfileContent();
            case 'music':
                return getMusicContent();
            case 'analytics':
                return getAnalyticsContent();
            case 'revenue':
                return getRevenueContent();
            case 'subscription':
                return getSubscriptionContent();
            case 'notifications':
                return getNotificationsContent();
            case 'social':
                return getSocialContent();
            default:
                return getDashboardContent();
        }
    }

    // Initialize view-specific components
    function initializeViewComponents(view) {
        switch (view) {
            case 'dashboard':
                initializeDashboardCharts();
                break;
            case 'music':
                initializeAudioPlayers();
                break;
            case 'profile':
                initializeProfileImageUpload();
                break;
            case 'analytics':
                attachAnalyticsListeners();
                initializeAnalyticsCharts();
                loadTopFans();
                break;
            case 'revenue':
                attachRevenueListeners();
                initializeRevenueCharts();
                break;
            case 'subscription':
                initializePaymentOptions();
                break;
            case 'notifications':
                updateNotificationDropdown();
                break;
            case 'social':
                initializeSocialView();
                break;
        }
    }

    // Content for different views
    function getDashboardContent() {
        return `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h1 class="h3 mb-0 text-fix">Welcome back, ${mockData.profile.name}!</h1>
                <div class="d-flex">
                    <button class="btn btn-outline-secondary me-2">
                        <i class="fas fa-download me-2"></i>Export Data
                    </button>
                    <button class="btn btn-primary" id="uploadMusicBtn">
                        <i class="fas fa-plus me-2"></i>Upload Music
                    </button>
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="row mb-4">
                <div class="col-xl-3 col-md-6 mb-4">
                    <div class="card stat-card">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="text-muted mb-2">Total Plays</h6>
                                    <h3 class="mb-0" id="stat-total-plays">${mockData.stats.totalPlays !== undefined && mockData.stats.totalPlays !== null ? mockData.stats.totalPlays : 0}</h3>
                                    <span class="text-success small"><i class="fas fa-arrow-up me-1"></i> 0%</span>
                                </div>
                                <div class="stat-icon">
                                    <i class="fas fa-play-circle"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-xl-3 col-md-6 mb-4">
                    <div class="card stat-card">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="text-muted mb-2">Total Likes</h6>
                                    <h3 class="mb-0" id="stat-total-likes">${mockData.stats.totalLikes !== undefined && mockData.stats.totalLikes !== null ? mockData.stats.totalLikes : 0}</h3>
                                    <span class="text-success small"><i class="fas fa-arrow-up me-1"></i> 0%</span>
                                </div>
                                <div class="stat-icon">
                                    <i class="fas fa-heart"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-xl-3 col-md-6 mb-4">
                    <div class="card stat-card">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="text-muted mb-2">Downloads</h6>
                                    <h3 class="mb-0" id="stat-total-downloads">${mockData.stats.totalDownloads !== undefined && mockData.stats.totalDownloads !== null ? mockData.stats.totalDownloads : 0}</h3>
                                    <span class="text-success small"><i class="fas fa-arrow-up me-1"></i> 0%</span>
                                </div>
                                <div class="stat-icon">
                                    <i class="fas fa-download"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-xl-3 col-md-6 mb-4">
                    <div class="card stat-card">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="text-muted mb-2">Monthly Revenue</h6>
                                    <h3 class="mb-0" id="stat-monthly-revenue">${mockData.stats.monthlyRevenue !== undefined && mockData.stats.monthlyRevenue !== null ? mockData.stats.monthlyRevenue : '0 FCFA'}</h3>
                                    <span class="text-success small"><i class="fas fa-arrow-up me-1"></i> 0%</span>
                                </div>
                                <div class="stat-icon">
                                    <i class="fas fa-dollar-sign"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Charts Section -->
            <div class="row mb-4">
                <div class="col-lg-8 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0 text-fix">Monthly Streams</h5>
                        </div>
                        <div class="card-body">
                            <canvas id="streamsChart" style="height: 300px; width: 100%;"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0 text-fix">Revenue Growth</h5>
                        </div>
                        <div class="card-body">
                            <canvas id="revenueChart" style="height: 300px; width: 100%;"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recent Activity & Quick Stats -->
            <div class="row">
                <div class="col-lg-6 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0 text-fix">Recent Activity</h5>
                        </div>
                        <div class="card-body">
                            <div class="activity-timeline">
                                ${getActivityTimeline()}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-6 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0 text-fix">Quick Stats</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-6 mb-3">
                                    <div class="text-center p-3 bg-dark rounded">
                                        <div class="h4 mb-1 text-primary">${mockData.songs.length}</div>
                                        <small class="text-muted text-secondary-fix">Total Songs</small>
                                    </div>
                                </div>
                                <div class="col-6 mb-3">
                                    <div class="text-center p-3 bg-dark rounded">
                                        <div class="h4 mb-1 text-success">${mockData.profile.followers || 0}</div>
                                        <small class="text-muted text-secondary-fix">Followers</small>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="text-center p-3 bg-dark rounded">
                                        <div class="h4 mb-1 text-warning">100%</div>
                                        <small class="text-muted text-secondary-fix">Profile Status</small>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="text-center p-3 bg-dark rounded">
                                        <div class="h4 mb-1 text-info">-</div>
                                        <small class="text-muted text-secondary-fix">Rank</small>
                                    </div>
                                </div>
                            </div>
                            <div class="mt-4">
                                <h6 class="mb-3 text-fix">Performance Insight</h6>
                                <div class="alert alert-info">
                                    <i class="fas fa-lightbulb me-2"></i>
                                    <strong class="text-fix">Tip:</strong> Your most played song this month is "Midnight Pulse" with 245K plays
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function getProfileContent() {
        return `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h1 class="h3 mb-0">Profile Management</h1>
                <button class="btn btn-primary" id="saveProfileBtn">
                    <i class="fas fa-save me-2"></i>Save Changes
                </button>
            </div>

            <div class="row">
                <div class="col-lg-4 mb-4">
                    <div class="card shadow-sm border-0">
                        <div class="card-body text-center p-5">
                            <div class="profile-avatar-container mb-4 position-relative d-inline-block">
                                <div class="profile-avatar shadow" id="profileAvatarCircle" style="width: 120px; height: 120px; border-radius: 50%; display: flex; align-items: center; justify-content: center; overflow: hidden; background: ${mockData.profile.avatarColor || 'var(--primary-color)'}; border: 4px solid var(--bg-secondary);">
                                    ${mockData.profile.avatar ? `<img src="${mockData.profile.avatar}" style="width: 100%; height: 100%; object-fit: cover;">` : `<span class="h1 mb-0">${(mockData.profile.name || 'A').charAt(0).toUpperCase()}</span>`}
                                </div>
                                <button class="btn btn-sm btn-primary position-absolute bottom-0 end-0 rounded-circle shadow-sm" id="changeAvatarBtn" style="width: 35px; height: 35px; padding: 0;">
                                    <i class="fas fa-camera"></i>
                                </button>
                                <div id="avatarUploadProgress" class="position-absolute w-100 start-0" style="bottom: -15px; display: none;">
                                    <div class="progress" style="height: 4px;">
                                        <div class="progress-bar" role="progressbar" style="width: 0%"></div>
                                    </div>
                                </div>
                            </div>
                            <h4 class="card-title fw-bold mb-1" id="artistNameDisplay">${mockData.profile.name}</h4>
                            <p class="text-muted small mb-4">${mockData.profile.genre || 'Electronic'} Music Producer</p>
                            
                            <div class="d-flex justify-content-center gap-5 mb-4">
                                    <div class="text-center">
                                        <div class="h5 mb-0 text-fix" id="mini-stat-followers">${mockData.profile.followers || 0}</div>
                                        <small class="text-muted">Followers</small>
                                    </div>
                                    <div class="text-center">
                                        <div class="h5 mb-0 text-fix" id="mini-stat-songs">${mockData.songs.length}</div>
                                        <small class="text-muted">Songs</small>
                                    </div>
                                    <div class="text-center">
                                        <div class="h5 mb-0 text-fix" id="mini-stat-plays">${mockData.stats.totalPlays || 0}</div>
                                        <small class="text-muted">Plays</small>
                                    </div>
                            </div>
                            <div class="artist-verification mb-3">
                                <span class="badge bg-success">
                                    <i class="fas fa-check-circle me-1"></i>Pro Artist
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Social Links -->
                    <div class="card mt-4">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Social Media</h5>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <label class="form-label">Instagram</label>
                                <input type="text" class="form-control" value="${mockData.profile.social?.instagram || ''}" id="instagramInput" placeholder="@username or URL">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Twitter</label>
                                <input type="text" class="form-control" value="${mockData.profile.social?.twitter || ''}" id="twitterInput" placeholder="@username or URL">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Facebook</label>
                                <input type="text" class="form-control" value="${mockData.profile.social?.facebook || ''}" id="facebookInput" placeholder="URL">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">YouTube</label>
                                <input type="text" class="form-control" value="${mockData.profile.social?.youtube || ''}" id="youtubeInput" placeholder="Channel URL">
                            </div>
                            <div>
                                <h6 class="mb-2">Preview & Test Links</h6>
                                <div class="d-flex flex-wrap gap-2" id="socialPreview">
                                    <!-- Social media icons will be populated here -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-lg-8">
                    <!-- Profile Details Form -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Profile Information</h5>
                        </div>
                        <div class="card-body">
                            <form id="artistProfileForm">
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Artist Name *</label>
                                        <input type="text" class="form-control" value="${mockData.profile.name}" id="artistNameInput" required>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Real Name</label>
                                        <input type="text" class="form-control" value="${mockData.profile.real_name || ''}" id="realNameInput">
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Bio</label>
                                    <textarea class="form-control" rows="4" id="bioInput">${mockData.profile.bio || ''}</textarea>
                                </div>
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Location</label>
                                        <input type="text" class="form-control" value="${mockData.profile.location || ''}" id="locationInput">
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Website</label>
                                        <input type="url" class="form-control" value="${mockData.profile.website || ''}" id="websiteInput">
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Primary Genre *</label>
                                    <select class="form-select" id="genreSelect" required>
                                        <option value="Electronic" ${mockData.profile.genre === 'Electronic' ? 'selected' : ''}>Electronic</option>
                                        <option value="Ambient" ${mockData.profile.genre === 'Ambient' ? 'selected' : ''}>Ambient</option>
                                        <option value="Synthwave" ${mockData.profile.genre === 'Synthwave' ? 'selected' : ''}>Synthwave</option>
                                        <option value="House" ${mockData.profile.genre === 'House' ? 'selected' : ''}>House</option>
                                        <option value="Techno" ${mockData.profile.genre === 'Techno' ? 'selected' : ''}>Techno</option>
                                        <option value="Afrobeat" ${mockData.profile.genre === 'Afrobeat' ? 'selected' : ''}>Afrobeat</option>
                                        <option value="Other" ${mockData.profile.genre === 'Other' ? 'selected' : ''}>Other</option>
                                    </select>
                                </div>
                            </form>
                        </div>
                    </div>
                    
                    <!-- Notification Settings -->
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Notification Settings</h5>
                        </div>
                        <div class="card-body">
                            <div class="mb-4">
                                <h6 class="mb-3">Email Notifications</h6>
                                <div class="form-check mb-2">
                                    <input class="form-check-input" type="checkbox" id="notifNewFollowers" checked>
                                    <label class="form-check-label" for="notifNewFollowers">
                                        New followers
                                    </label>
                                </div>
                                <div class="form-check mb-2">
                                    <input class="form-check-input" type="checkbox" id="notifComments" checked>
                                    <label class="form-check-label" for="notifComments">
                                        New comments
                                    </label>
                                </div>
                                <div class="form-check mb-2">
                                    <input class="form-check-input" type="checkbox" id="notifStreamMilestones" checked>
                                    <label class="form-check-label" for="notifStreamMilestones">
                                        Stream milestones
                                    </label>
                                </div>
                                <div class="form-check mb-2">
                                    <input class="form-check-input" type="checkbox" id="notifRevenueUpdates" checked>
                                    <label class="form-check-label" for="notifRevenueUpdates">
                                        Revenue updates
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="notifMarketing" checked>
                                    <label class="form-check-label" for="notifMarketing">
                                        Marketing emails
                                    </label>
                                </div>
                            </div>
                            
                            <div>
                                <button class="btn btn-primary" id="saveNotificationSettings">
                                    <i class="fas fa-save me-2"></i>Save Notification Settings
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function getMusicContent() {
        return `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h1 class="h3 mb-0">Music Uploads</h1>
                <button class="btn btn-primary" id="uploadNewSongBtn">
                    <i class="fas fa-plus me-2"></i>Upload New Song
                </button>
            </div>

            <!-- Upload Form -->
            <div class="row mb-4" id="uploadForm" style="display: none;">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Upload New Song</h5>
                        </div>
                        <div class="card-body">
                            <form id="songUploadForm">
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Song Title *</label>
                                        <input type="text" class="form-control" placeholder="Enter song title" id="songTitleInput" required>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Genre *</label>
                                        <select class="form-select" id="songGenreSelect" required>
                                            <option value="">Select genre</option>
                                            <option>Electronic</option>
                                            <option>Pop</option>
                                            <option>Rock</option>
                                            <option>Hip Hop</option>
                                            <option>R&B</option>
                                            <option>Ambient</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Description</label>
                                    <textarea class="form-control" rows="3" placeholder="Tell listeners about this song..." id="songDescription"></textarea>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Audio File *</label>
                                    <div class="upload-area" id="audioUploadArea">
                                        <i class="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
                                        <h5>Drop audio file here or click to upload</h5>
                                        <p class="text-muted">MP3, WAV, FLAC up to 50MB</p>
                                        <input type="file" class="d-none" id="audioFileInput" accept="audio/*">
                                    </div>
                                    <div id="audioUploadProgress" class="mt-2" style="display: none;">
                                        <div class="progress" style="height: 5px;">
                                            <div class="progress-bar" role="progressbar" style="width: 0%"></div>
                                        </div>
                                        <small class="text-muted">Uploading...</small>
                                    </div>
                                </div>
                                <div class="form-check mb-3">
                                    <input class="form-check-input" type="checkbox" id="explicitContent">
                                    <label class="form-check-label" for="explicitContent">
                                        This song contains explicit content
                                    </label>
                                </div>
                                <div class="mb-3">
                                    <label for="coverArtInput" class="form-label">Cover Art (Optional)</label>
                                    <div class="upload-area border-dashed p-3 text-center" id="coverArtUploadArea" style="cursor: pointer; border: 2px dashed #dee2e6; border-radius: 8px;">
                                        <i class="fas fa-image fa-2x text-muted mb-2"></i>
                                        <h6>Click to upload cover art</h6>
                                        <p class="text-muted small">JPEG, PNG, GIF up to 5MB</p>
                                        <input type="file" class="d-none" id="coverArtInput" accept="image/*">
                                    </div>
                                    <div id="coverArtPreview" class="mt-2" style="display: none;">
                                        <img id="coverArtImg" class="img-thumbnail" style="max-width: 150px; max-height: 150px;">
                                        <button type="button" class="btn btn-sm btn-outline-danger ms-2" id="removeCoverArt">Remove</button>
                                    </div>
                                </div>
                                <div class="form-check mb-3">
                                    <input class="form-check-input" type="checkbox" id="rightsConfirm" required>
                                    <label class="form-check-label" for="rightsConfirm">
                                        I own all rights to this recording
                                    </label>
                                </div>
                                <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                                    <button type="button" class="btn btn-outline-secondary me-2" id="cancelUploadBtn">
                                        Cancel
                                    </button>
                                    <button type="submit" class="btn btn-primary" id="submitUploadBtn">
                                        <i class="fas fa-upload me-2"></i>Upload Song
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Songs Table -->
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Your Songs</h5>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive table-responsive-mobile">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Song Title</th>
                                            <th>Genre</th>
                                            <th>Upload Date</th>
                                            <th>Plays</th>
                                            <th>Likes</th>
                                            <th>Downloads</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="songsTableBody">
                                        ${getSongsTableRows()}
                                    </tbody>
                                </table>
                            </div>
                            <div class="d-flex justify-content-between align-items-center mt-3">
                                <div class="text-muted">
                                    Showing ${uploadedSongs.length} songs
                                </div>
                                <nav>
                                    <ul class="pagination mb-0">
                                        <li class="page-item disabled"><a class="page-link" href="#">Previous</a></li>
                                        <li class="page-item active"><a class="page-link" href="#">1</a></li>
                                        <li class="page-item"><a class="page-link" href="#">2</a></li>
                                        <li class="page-item"><a class="page-link" href="#">3</a></li>
                                        <li class="page-item"><a class="page-link" href="#">Next</a></li>
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function getAnalyticsContent() {
        return `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h1 class="h3 mb-0">Performance & Analytics</h1>
                <div class="d-flex">
                    <div class="dropdown me-2">
                        <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                            Last 30 Days
                        </button>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="#" data-period="7">Last 7 Days</a></li>
                            <li><a class="dropdown-item active" href="#" data-period="30">Last 30 Days</a></li>
                            <li><a class="dropdown-item" href="#" data-period="90">Last 90 Days</a></li>
                        </ul>
                    </div>
                    <button class="btn btn-primary">
                        <i class="fas fa-download me-2"></i>Export Report
                    </button>
                </div>
            </div>

            <!-- Detailed Stats -->
            <div class="row mb-4">
                <div class="col-md-3 col-6 mb-4">
                    <div class="card stat-card">
                        <div class="card-body text-center">
                            <h6 class="text-muted mb-2">Avg. Plays/Day</h6>
                            <h3 class="mb-0">${(mockData.stats.analyticsOverview && mockData.stats.analyticsOverview.avg_plays_daily !== undefined) ? mockData.stats.analyticsOverview.avg_plays_daily : '0'}</h3>
                            <span class="text-success small">Daily Growth</span>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-6 mb-4">
                    <div class="card stat-card">
                        <div class="card-body text-center">
                            <h6 class="text-muted mb-2">Completion Rate</h6>
                            <h3 class="mb-0">${(mockData.stats.analyticsOverview && mockData.stats.analyticsOverview.completion_rate !== undefined) ? mockData.stats.analyticsOverview.completion_rate : '78%'}</h3>
                            <span class="text-info small">Engagement</span>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-6 mb-4">
                    <div class="card stat-card">
                        <div class="card-body text-center">
                            <h6 class="text-muted mb-2">Skip Rate</h6>
                            <h3 class="mb-0">${(mockData.stats.analyticsOverview && mockData.stats.analyticsOverview.skip_rate !== undefined) ? mockData.stats.analyticsOverview.skip_rate : '12%'}</h3>
                            <span class="text-warning small">Retention</span>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-6 mb-4">
                    <div class="card stat-card">
                        <div class="card-body text-center">
                            <h6 class="text-muted mb-2">Avg. Listen Time</h6>
                            <h3 class="mb-0">${(mockData.stats.analyticsOverview && mockData.stats.analyticsOverview.avg_listen_time !== undefined) ? mockData.stats.analyticsOverview.avg_listen_time : '3:24'}</h3>
                            <span class="text-secondary small">Live Duration</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Performance Charts -->
            <div class="row mb-4">
                <div class="col-lg-6 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Song Performance</h5>
                        </div>
                        <div class="card-body">
                            <div class="chart-placeholder">
                                <div class="text-center py-4">
                                    <i class="fas fa-chart-bar fa-4x text-muted mb-3"></i>
                                    <h5>Top Performing Songs</h5>
                                    <div class="mt-4" id="topSongsList">
                                        <!-- Will be populated dynamicallly or keep static placeholders -->
                                        ${uploadedSongs.slice(0, 3).map(song => `
                                            <div class="d-flex align-items-center mb-3">
                                                <div class="flex-grow-1">
                                                    <div class="d-flex justify-content-between mb-1">
                                                        <small>${song.title}</small>
                                                        <small class="text-primary">${song.plays} plays</small>
                                                    </div>
                                                    <div class="progress" style="height: 8px;">
                                                        <div class="progress-bar" role="progressbar" style="width: ${Math.min(100, (parseInt(song.plays.replace(/,/g, '')) / 1000) * 100)}%"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-3 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Audience</h5>
                        </div>
                        <div class="card-body">
                            <canvas id="demographicsChart" style="height: 250px; width: 100%;"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-lg-3 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Top Supporters</h5>
                        </div>
                        <div class="card-body p-0">
                            <div class="list-group list-group-flush" id="topSupportersList">
                                <!-- Top fans will be loaded here -->
                                <div class="p-3 text-center text-muted">Loading fans...</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Insights Section -->
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Performance Insights</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-4 mb-3">
                                    <div class="alert alert-info">
                                        <h6><i class="fas fa-lightbulb me-2"></i>Best Time to Post</h6>
                                        <p class="mb-0 small">Your audience is most active between 6-9 PM EST</p>
                                    </div>
                                </div>
                                <div class="col-md-4 mb-3">
                                    <div class="alert alert-success">
                                        <h6><i class="fas fa-trophy me-2"></i>Top Song</h6>
                                        <p class="mb-0 small">"Midnight Pulse" gained 45K new plays this week</p>
                                    </div>
                                </div>
                                <div class="col-md-4 mb-3">
                                    <div class="alert alert-warning">
                                        <h6><i class="fas fa-chart-line me-2"></i>Growth Opportunity</h6>
                                        <p class="mb-0 small">Try releasing more content on Fridays</p>
                                    </div>
                                </div>
                            </div>
                            <div class="mt-3">
                                <h6>Recommendations</h6>
                                <ul class="list-unstyled">
                                    <li class="mb-2"><i class="fas fa-check text-success me-2"></i> Your most played song this month is "Midnight Pulse"</li>
                                    <li class="mb-2"><i class="fas fa-check text-success me-2"></i> Engagement is highest when you post at 8 PM EST</li>
                                    <li><i class="fas fa-check text-success me-2"></i> Consider creating a playlist of your top 5 songs</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function getRevenueContent() {
        // Safe fallback for undefined/null revenue fields
        const availableForWithdrawal = (mockData.stats.availableForWithdrawal !== undefined && mockData.stats.availableForWithdrawal !== null)
            ? mockData.stats.availableForWithdrawal : '0 FCFA';
        const totalRevenue = (mockData.stats.totalRevenue !== undefined && mockData.stats.totalRevenue !== null)
            ? mockData.stats.totalRevenue : '0 FCFA';
        const monthlyRevenue = (mockData.stats.monthlyRevenue !== undefined && mockData.stats.monthlyRevenue !== null)
            ? mockData.stats.monthlyRevenue : '0 FCFA';
        const pendingPayouts = (mockData.stats.pendingPayouts !== undefined && mockData.stats.pendingPayouts !== null)
            ? mockData.stats.pendingPayouts : '0 FCFA';

        let availableAmount = 0;
        try {
            availableAmount = parseFloat(availableForWithdrawal.replace(/[^0-9.-]+/g, ""));
            if (isNaN(availableAmount)) availableAmount = 0;
        } catch (e) {
            availableAmount = 0;
        }

        return `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h1 class="h3 mb-0">Revenue & Royalties</h1>
                <button class="btn btn-primary" id="withdrawEarningsBtn" onclick="handleWithdrawClick()">
                    <i class="fas fa-paper-plane me-2"></i>Withdraw via MoMo
                </button>
            </div>

            <!-- Revenue Summary -->
            <div class="row mb-4">
                <div class="col-xl-3 col-md-6 mb-4">
                    <div class="card stat-card">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="text-muted mb-2">Total Earnings</h6>
                                    <h3 class="mb-0">${totalRevenue}</h3>
                                </div>
                                <div class="stat-icon">
                                    <i class="fas fa-wallet"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-xl-3 col-md-6 mb-4">
                    <div class="card stat-card">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="text-muted mb-2">This Month</h6>
                                    <h3 class="mb-0">${monthlyRevenue}</h3>
                                    <span class="text-success small"><i class="fas fa-arrow-up me-1"></i> 24.7%</span>
                                </div>
                                <div class="stat-icon">
                                    <i class="fas fa-calendar-alt"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-xl-3 col-md-6 mb-4">
                    <div class="card stat-card">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="text-muted mb-2">Pending Payout</h6>
                                    <h3 class="mb-0">${pendingPayouts}</h3>
                                </div>
                                <div class="stat-icon">
                                    <i class="fas fa-clock"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-xl-3 col-md-6 mb-4">
                    <div class="card stat-card">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="text-muted mb-2">Available for Withdrawal</h6>
                                    <h3 class="mb-0">${availableForWithdrawal}</h3>
                                    ${availableAmount < 5000 ?
                '<small class="text-warning">Min. 5,000 FCFA required</small>' :
                '<span class="text-success small">Ready to withdraw</span>'}
                                </div>
                                <div class="stat-icon">
                                    <i class="fas fa-wallet"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Revenue Chart -->
            <div class="row mb-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Revenue Overview</h5>
                        </div>
                        <div class="card-body">
                            <canvas id="revenueOverviewChart" style="height: 300px; width: 100%;"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Withdrawal Section -->
            <div class="row mb-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Withdraw Earnings</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-8">
                                    <div class="mb-3">
                                        <label class="form-label">Available Balance</label>
                                        <div class="input-group">
                                            <span class="input-group-text">FCFA</span>
                                            <input type="text" class="form-control" value="${availableForWithdrawal}" readonly>
                                        </div>
                                    </div>
                                    <div class="mb-4">
                                        <label class="form-label fw-bold">Withdrawal Amount (FCFA)</label>
                                        <input type="number" class="form-control" id="withdrawAmount"
                                               min="5000"
                                               max="${availableAmount}"
                                               step="500"
                                               placeholder="Enter amount (min 5,000 FCFA)">
                                        <small class="text-muted">Min: 5,000 FCFA &nbsp;|&nbsp; Max: 10,000 FCFA/day</small>
                                    </div>
                                    <!-- MoMo Withdraw Trigger -->
                                    <button class="btn w-100 py-3" id="processWithdrawalBtn"
                                        style="background:linear-gradient(135deg,#FFCC00,#FFA500);color:#1a1a1a;font-weight:800;font-size:15px;border-radius:14px;"
                                        onclick="handleWithdrawClick()">
                                        <span style="margin-right:8px;">📱</span> Withdraw via MTN MoMo
                                    </button>
                                </div>
                                <div class="col-md-4">
                                    <div class="alert alert-info">
                                        <h6><i class="fas fa-info-circle me-2"></i>Withdrawal Info</h6>
                                        <p class="small mb-1">• Processed within 3-5 business days</p>
                                        <p class="small mb-1">• 2% processing fee per transaction</p>
                                        <p class="small mb-1">• Minimum withdrawal: 5,000 FCFA</p>
                                        <p class="small mb-0">• Maximum withdrawal: 10,000 FCFA/day</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Royalties Breakdown -->
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Royalties Breakdown</h5>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Source</th>
                                            <th>Streams/Plays</th>
                                            <!-- Table headers for Royalties Breakdown -->
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div class="mt-4">
                                <div class="alert alert-info">
                                    <i class="fas fa-info-circle me-2"></i>
                                    <strong>Note:</strong> Payouts are processed on the 15th of each month. Minimum withdrawal amount is 5,000 FCFA.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function getSubscriptionContent() {
        return `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h1 class="h3 mb-0">Subscription Plan</h1>
                <button class="btn btn-primary" id="manageBillingBtn">
                    <i class="fas fa-credit-card me-2"></i>Manage Billing & Payments
                </button>
            </div>

            <!-- Current Plan -->
            <div class="row mb-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                <div>
                                    <h5 class="mb-1">Current Plan: <span class="text-primary">${currentPlan}</span></h5>
                                    <p class="text-muted mb-0">Active subscription</p>
                                    <small class="text-success"><i class="fas fa-check-circle me-1"></i> Continuous Access</small>
                                </div>
                                </div>
                                <div>
                                    <h4 class="mb-0">${currentPlan === 'Free' ? '0' : (currentPlan === 'Pro Artist' ? '15,000' : '30,000')} FCFA<span class="text-muted small">/month</span></h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Plans Comparison -->
            <div class="row mb-4">
                <div class="col-lg-4 mb-4">
                    <div class="card plan-card ${currentPlan === 'Free' ? 'featured' : ''}">
                        ${currentPlan === 'Free' ? '<div class="popular-ribbon">ACTIVE</div>' : ''}
                        <div class="card-body">
                            <h5 class="card-title mb-3">Free</h5>
                            <h2 class="mb-3">0 FCFA<span class="text-muted small">/month</span></h2>
                            <ul class="list-unstyled mb-4">
                                <li class="mb-2"><i class="fas fa-check text-success me-2"></i> Upload up to 5 songs</li>
                                <li class="mb-2"><i class="fas fa-check text-success me-2"></i> Basic analytics</li>
                                <li class="mb-2"><i class="fas fa-times text-muted me-2"></i> <span class="text-muted">Advanced analytics</span></li>
                                <li class="mb-2"><i class="fas fa-times text-muted me-2"></i> <span class="text-muted">Priority support</span></li>
                                <li><i class="fas fa-times text-muted me-2"></i> <span class="text-muted">Custom artist page</span></li>
                            </ul>
                            <button class="btn btn-${currentPlan === 'Free' ? 'primary' : 'outline-primary'} w-100 ${currentPlan === 'Free' ? 'disabled' : ''}" data-plan="Free" data-price="0">
                                ${currentPlan === 'Free' ? 'Current Plan' : 'Select Free'}
                            </button>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4 mb-4">
                    <div class="card plan-card ${currentPlan === 'Pro Artist' ? 'featured' : ''}">
                        ${currentPlan === 'Pro Artist' ? '<div class="popular-ribbon">ACTIVE</div>' : ''}
                        <div class="card-body">
                            <h5 class="card-title mb-3">Pro Artist</h5>
                            <h2 class="mb-3">15,000 FCFA<span class="text-muted small">/month</span></h2>
                            <ul class="list-unstyled mb-4">
                                <li class="mb-2"><i class="fas fa-check text-success me-2"></i> Unlimited uploads</li>
                                <li class="mb-2"><i class="fas fa-check text-success me-2"></i> Advanced analytics</li>
                                <li class="mb-2"><i class="fas fa-check text-success me-2"></i> Priority support</li>
                                <li class="mb-2"><i class="fas fa-check text-success me-2"></i> Custom artist page</li>
                                <li><i class="fas fa-check text-success me-2"></i> Higher revenue share (85%)</li>
                            </ul>
                            <button class="btn btn-${currentPlan === 'Pro Artist' ? 'primary' : 'outline-primary'} w-100 ${currentPlan === 'Pro Artist' ? 'disabled' : ''}" data-plan="Pro Artist" data-price="15000">
                                ${currentPlan === 'Pro Artist' ? 'Current Plan' : 'Upgrade to Pro'}
                            </button>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4 mb-4">
                    <div class="card plan-card ${currentPlan === 'Premium' ? 'featured' : ''}">
                        ${currentPlan === 'Premium' ? '<div class="popular-ribbon">ACTIVE</div>' : ''}
                        <div class="card-body">
                            <h5 class="card-title mb-3">Premium</h5>
                            <h2 class="mb-3">30,000 FCFA<span class="text-muted small">/month</span></h2>
                            <ul class="list-unstyled mb-4">
                                <li class="mb-2"><i class="fas fa-check text-success me-2"></i> Everything in Pro</li>
                                <li class="mb-2"><i class="fas fa-check text-success me-2"></i> Featured placements</li>
                                <li class="mb-2"><i class="fas fa-check text-success me-2"></i> Dedicated manager</li>
                                <li class="mb-2"><i class="fas fa-check text-success me-2"></i> Promotional campaigns</li>
                                <li><i class="fas fa-check text-success me-2"></i> Highest revenue share (90%)</li>
                            </ul>
                            <button class="btn btn-${currentPlan === 'Premium' ? 'primary' : 'outline-primary'} w-100 ${currentPlan === 'Premium' ? 'disabled' : ''}" data-plan="Premium" data-price="30000">
                                ${currentPlan === 'Premium' ? 'Current Plan' : 'Go Premium'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Billing Management -->
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Billing Information</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>Payment Method</h6>
                                    <div class="d-flex align-items-center mb-3">
                                        <div class="me-3">
                                            <i class="fas fa-mobile-alt fa-2x text-warning"></i>
                                        </div>
                                        <div>
                                            <p class="mb-0" id="momoNumberDisplay">MTN MoMo: 6XX XXX XXX</p>
                                            <small class="text-muted">Subscription Active</small>
                                        </div>
                                    </div>
                                    <button class="btn btn-outline-warning btn-sm" id="updatePaymentMethodBtn">
                                        <i class="fas fa-edit me-2"></i>Update MoMo Number
                                    </button>
                                </div>
                                <div class="col-md-6">
                                    <h6>Billing History</h6>
                                    <div class="table-responsive">
                                        <table class="table table-sm">
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Amount</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td>Jan 15, 2024</td>
                                                    <td>15,000 FCFA</td>
                                                    <td><span class="badge bg-success">Paid</span></td>
                                                </tr>
                                                <tr>
                                                    <td>Dec 15, 2023</td>
                                                    <td>15,000 FCFA</td>
                                                    <td><span class="badge bg-success">Paid</span></td>
                                                </tr>
                                                <tr>
                                                    <td>Nov 15, 2023</td>
                                                    <td>29.99 FCFA</td>
                                                    <td><span class="badge bg-success">Paid</span></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function getNotificationsContent() {
        return `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h1 class="h3 mb-0">Notifications</h1>
                <div>
                    <button class="btn btn-outline-primary me-2" id="markAllReadBtn">
                        <i class="fas fa-check-double me-2"></i>Mark All as Read
                    </button>
                    <button class="btn btn-outline-secondary" id="clearNotificationsBtn">
                        <i class="fas fa-trash me-2"></i>Clear All
                    </button>
                </div>
            </div>

            <!-- Notifications List -->
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">Recent Notifications</h5>
                        </div>
                        <div class="card-body">
                            <div id="notificationsList">
                                ${getNotificationsList()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function getSocialContent() {
        return `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h1 class="h3 mb-0">Social Interaction</h1>
                <div class="alert alert-info py-2 px-3 mb-0">
                    <i class="fas fa-info-circle me-2"></i>
                    Connect with your fans through comments and replies.
                </div>
            </div>

            <div class="row">
                <div class="col-lg-4 mb-4">
                    <div class="card">
                        <div class="card-header border-bottom-0">
                            <h5 class="card-title mb-0">Your Tracks</h5>
                        </div>
                        <div class="list-group list-group-flush" id="socialSongsList" style="max-height: 600px; overflow-y: auto;">
                            <!-- Songs will be loaded here -->
                            <div class="p-4 text-center text-muted">Loading tracks...</div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-8">
                    <div class="card" id="commentsCard" style="min-height: 400px;">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="card-title mb-0" id="commentsTrackTitle">Track Discussion</h5>
                            <span class="badge bg-primary" id="commentsCount">0 Comments</span>
                        </div>
                        <div class="card-body">
                            <div id="artistCommentsList" class="d-flex flex-column gap-3">
                                <div class="text-center py-5 text-muted">
                                    <i class="fas fa-comments fa-3x mb-3 opacity-25"></i>
                                    <h5>Select a track to view fan comments</h5>
                                    <p>Engaging with fans improves your visibility!</p>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer" id="replyFormArea" style="display: none;">
                            <div class="input-group">
                                <input type="text" id="artistReplyInput" class="form-control" placeholder="Write a public reply...">
                                <button class="btn btn-primary" id="postArtistReplyBtn">Reply</button>
                            </div>
                            <input type="hidden" id="replyToCommentId" value="">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async function initializeSocialView() {
        const songsList = document.getElementById('socialSongsList');
        if (!songsList) return;

        songsList.innerHTML = uploadedSongs.map(song => `
            <a href="#" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3" onclick="loadTrackComments(${song.id}, '${song.title.replace(/'/g, "\\'")}')">
                <div class="d-flex align-items-center">
                    <div class="bg-primary rounded me-3 d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                        <i class="fas fa-music text-white"></i>
                    </div>
                    <div>
                        <h6 class="mb-0 text-white">${song.title}</h6>
                        <small class="text-muted">${song.genre}</small>
                    </div>
                </div>
                <i class="fas fa-chevron-right text-muted"></i>
            </a>
        `).join('');

        // If songs exist, load the first one by default
        if (uploadedSongs.length > 0) {
            loadTrackComments(uploadedSongs[0].id, uploadedSongs[0].title);
        }
    }

    window.loadTrackComments = async function (songId, songTitle) {
        window.currentSelectedSongId = songId;
        const commentsList = document.getElementById('artistCommentsList');
        const countBadge = document.getElementById('commentsCount');
        const titleEl = document.getElementById('commentsTrackTitle');
        const replyArea = document.getElementById('replyFormArea');

        titleEl.textContent = `Comments: ${songTitle}`;
        commentsList.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>';
        replyArea.style.display = 'none';

        try {
            const res = await fetch(`backend/api/comments.php?song_id=${songId}`);
            const json = await res.json();

            if (json.success) {
                countBadge.textContent = `${json.data.length} Comments`;
                if (json.data.length === 0) {
                    commentsList.innerHTML = `<div class="text-center py-5 text-muted">${t('No comments found for this track.')}</div>`;
                } else {
                    // Group by parent_id
                    const mainComments = json.data.filter(c => !c.parent_id);
                    const replies = json.data.filter(c => c.parent_id);

                    // Sort main comments: pinned first, then by date desc
                    mainComments.sort((a, b) => (b.is_pinned - a.is_pinned) || (new Date(b.created_at) - new Date(a.created_at)));

                    commentsList.innerHTML = mainComments.map(comment => {
                        const threadReplies = replies.filter(r => r.parent_id == comment.id);
                        const isArtistAuthor = comment.user_type === 'artist';

                        return `
                        <div class="comment-thread mb-3">
                            <div class="p-3 rounded border ${comment.is_pinned ? 'border-warning' : ''}" 
                                 style="background: rgba(255,255,255,0.02); border: 1px solid ${comment.is_pinned ? 'var(--warning-color)' : 'rgba(255,255,255,0.1)'} !important;">
                                <div class="d-flex justify-content-between mb-2">
                                    <div class="d-flex align-items-center gap-2">
                                        <div class="user-avatar overflow-hidden" style="width: 30px; height: 30px; font-size: 10px;">
                                            ${comment.user_avatar ? `<img src="${comment.user_avatar}" style="width: 100%; height: 100%; object-fit: cover;">` : (comment.user_name ? comment.user_name.substring(0, 2).toUpperCase() : '??')}
                                        </div>
                                        <span class="fw-bold text-white d-flex align-items-center gap-2">
                                            ${comment.user_name}
                                            ${isArtistAuthor ? '<span class="badge bg-primary px-2" style="font-size: 0.6rem;">YOU</span>' : ''}
                                        </span>
                                    </div>
                                    <small class="text-muted">${new Date(comment.created_at).toLocaleString()}</small>
                                </div>
                                <p class="mb-2 text-white" style="margin-left: 40px; opacity: 0.9;">${comment.content}</p>
                                <div class="d-flex justify-content-end gap-3" style="margin-left: 40px; border-top: 1px solid rgba(255,255,255,0.05); pt-2">
                                    <button class="btn btn-sm btn-link text-primary p-0 text-decoration-none" onclick="prepareReply(${comment.id}, '${comment.user_name}')">
                                        <i class="fas fa-reply me-1"></i>Reply
                                    </button>
                                    <button class="btn btn-sm btn-link ${comment.is_pinned ? 'text-warning' : 'text-muted'} p-0 text-decoration-none" onclick="togglePin(${comment.id}, ${comment.is_pinned ? 0 : 1})">
                                        <i class="${comment.is_pinned ? 'fas' : 'far'} fa-thumbtack me-1"></i>${comment.is_pinned ? 'Unpin' : 'Pin'}
                                    </button>
                                    <button class="btn btn-sm btn-link text-danger p-0 text-decoration-none" onclick="deleteComment(${comment.id})">
                                        <i class="fas fa-trash me-1"></i>Delete
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Replies -->
                            <div class="replies-list ms-5 mt-2">
                                ${threadReplies.map(reply => {
                            const replyIsArtist = reply.user_type === 'artist';
                            return `
                                    <div class="reply-item p-2 px-3 rounded mb-2 border-start border-3" 
                                         style="background: rgba(255,255,255,0.01); border-left-color: ${replyIsArtist ? 'var(--primary-color)' : 'rgba(255,255,255,0.2)'} !important;">
                                        <div class="d-flex justify-content-between mb-1">
                                            <div class="d-flex align-items-center gap-2">
                                                <div class="user-avatar overflow-hidden" style="width: 24px; height: 24px; font-size: 8px;">
                                                    ${reply.user_avatar ? `<img src="${reply.user_avatar}" style="width: 100%; height: 100%; object-fit: cover;">` : (reply.user_name ? reply.user_name.substring(0, 2).toUpperCase() : '??')}
                                                </div>
                                                <span class="fw-bold d-flex align-items-center gap-2" style="font-size: 0.85rem; color: ${replyIsArtist ? 'var(--primary-color)' : '#eee'};">
                                                    ${reply.user_name}
                                                    ${replyIsArtist ? '<span class="badge bg-primary px-2" style="font-size: 0.55rem;">YOU</span>' : ''}
                                                </span>
                                            </div>
                                            <small class="text-muted" style="font-size: 0.7rem;">${new Date(reply.created_at).toLocaleTimeString()}</small>
                                        </div>
                                        <p class="mb-0 text-white-50" style="padding-left: 32px; font-size: 0.85rem;">${reply.content}</p>
                                        <div class="d-flex justify-content-end">
                                             <button class="btn btn-sm btn-link text-danger p-0 text-decoration-none" style="font-size: 0.7rem;" onclick="deleteComment(${reply.id})">
                                                <i class="fas fa-trash me-1"></i>Delete
                                            </button>
                                        </div>
                                    </div>
                                `;
                        }).join('')}
                            </div>
                        </div>
                        `;
                    }).join('');
                }
            }
        } catch (err) {
            commentsList.innerHTML = `<div class="alert alert-danger">${t('Error loading comments.')}</div>`;
        }
    };

    window.togglePin = async function (commentId, shouldPin) {
        try {
            const res = await fetch('backend/api/comments.php', {
                method: 'PUT',
                body: JSON.stringify({ id: commentId, pin: !!shouldPin }),
                headers: { 'Content-Type': 'application/json' }
            });
            const json = await res.json();
            if (json.success) {
                showNotification(json.message, 'success');
                // Reload comments
                const title = document.getElementById('commentsTrackTitle').textContent.replace('Comments: ', '');
                loadTrackComments(window.currentSelectedSongId || uploadedSongs[0].id, title);
            }
        } catch (e) {
            showNotification('Error updating pin status', 'danger');
        }
    };

    window.deleteComment = async function (commentId) {
        if (!confirm('Are you sure you want to delete this comment?')) return;
        try {
            const res = await fetch(`backend/api/comments.php?id=${commentId}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.success) {
                showNotification('Comment deleted', 'success');
                // Reload comments
                const title = document.getElementById('commentsTrackTitle').textContent.replace('Comments: ', '');
                loadTrackComments(window.currentSelectedSongId || uploadedSongs[0].id, title);
            }
        } catch (e) {
            showNotification('Error deleting comment', 'danger');
        }
    };

    window.prepareReply = function (commentId, userName) {
        const replyArea = document.getElementById('replyFormArea');
        const replyInput = document.getElementById('artistReplyInput');
        const hiddenId = document.getElementById('replyToCommentId');

        replyArea.style.display = 'block';
        replyInput.placeholder = `Replying to ${userName}...`;
        replyInput.focus();
        hiddenId.value = commentId;

        // Scroll to reply area
        replyArea.scrollIntoView({ behavior: 'smooth' });
    };

    // Re-attach post listener for replies
    function attachSocialListeners() {
        const postBtn = document.getElementById('postArtistReplyBtn');
        if (postBtn) {
            postBtn.onclick = async () => {
                const commentId = document.getElementById('replyToCommentId').value;
                const content = document.getElementById('artistReplyInput').value;

                if (!content.trim()) return;

                postBtn.disabled = true;
                postBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;

                try {
                    // Logic to post reply - we'll treat it as a new comment with parent_id
                    // Note: session.user.id is used by backend for author_id
                    const res = await fetch('backend/api/comments.php', {
                        method: 'POST',
                        body: JSON.stringify({
                            song_id: window.currentSelectedSongId || uploadedSongs[0].id,
                            content: content,
                            parent_id: commentId
                        }),
                        headers: { 'Content-Type': 'application/json' }
                    });
                    const json = await res.json();

                    if (json.success) {
                        showNotification('Reply posted!', 'success');
                        document.getElementById('artistReplyInput').value = '';
                        document.getElementById('replyFormArea').style.display = 'none';
                        loadTrackComments(window.currentSelectedSongId || uploadedSongs[0].id, document.getElementById('commentsTrackTitle').textContent.replace('Comments: ', ''));
                    }
                } catch (e) {
                    showNotification('Error posting reply', 'danger');
                } finally {
                    postBtn.disabled = false;
                    postBtn.innerHTML = t('Reply');
                }
            };
        }
    }

    // Helper functions for generating content
    function getActivityTimeline() {
        // Use real activity if available, otherwise simplified message
        const activities = mockData.stats.recentActivity || [];

        if (activities.length === 0) {
            return '<p class="text-center text-muted py-3">No recent activity</p>';
        }

        return activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.type || 'info'}">
                    <i class="fas fa-${activity.type === 'upload' ? 'upload' : 'info-circle'}"></i>
                </div>
                <div class="activity-content">
                    <p class="mb-1">${activity.action || activity.description}</p>
                    <small class="text-muted">${new Date(activity.time).toLocaleDateString()}</small>
                </div>
            </div>
        `).join('');
    }

    function getSongsTableRows() {
        return uploadedSongs.map(song => `
            <tr>
                <td>${song.id}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="song-cover me-3">
                            <img src="${song.coverArt || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'}" alt="${song.title}" class="rounded">
                        </div>
                        <div>
                            <div class="fw-bold">${song.title}</div>
                            <div class="text-muted small">${song.genre}</div>
                        </div>
                    </div>
                </td>
                <td>${song.genre}</td>
                <td>${song.date}</td>
                <td>${song.plays}</td>
                <td>${song.likes}</td>
                <td>${song.downloads}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1 play-song-btn" data-id="${song.id}" data-title="${song.title}" data-genre="${song.genre}">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary me-1 edit-song-btn" data-id="${song.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-song-btn" data-id="${song.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    function getNotificationsList() {
        return mockData.notifications.map(notification => `
            <div class="notification-item ${notification.read ? '' : 'unread'} mb-3 p-3 bg-dark rounded" data-id="${notification.id}">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">${notification.title}</h6>
                        <p class="mb-1">${notification.message}</p>
                        <small class="text-muted">${notification.time}</small>
                    </div>
                    <div>
                        ${!notification.read ? `
                            <button class="btn btn-sm btn-outline-primary mark-read-btn" data-id="${notification.id}">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline-danger ms-1 delete-notification-btn" data-id="${notification.id}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function updateNotificationDropdown() {
        const dropdownContainer = document.querySelector('.dropdown-notifications');
        if (!dropdownContainer) return;

        const unreadNotifications = mockData.notifications.filter(n => !n.read);
        const notificationCount = document.getElementById('notificationCount');
        const topNotificationCount = document.getElementById('topNotificationCount');

        if (notificationCount) notificationCount.textContent = unreadNotifications.length;
        if (topNotificationCount) topNotificationCount.textContent = unreadNotifications.length;

        if (unreadNotifications.length === 0) {
            dropdownContainer.innerHTML = `
                <div class="p-3 text-center">
                    <p class="text-muted mb-0">No new notifications</p>
                </div>
            `;
        } else {
            dropdownContainer.innerHTML = unreadNotifications.slice(0, 3).map(notification => `
                <a href="#" class="dropdown-item d-flex align-items-center py-2 border-bottom" data-id="${notification.id}">
                    <div class="flex-shrink-0 me-3">
                        <i class="fas fa-bell text-primary"></i>
                    </div>
                    <div class="flex-grow-1">
                        <h6 class="mb-0 small">${notification.title}</h6>
                        <p class="mb-0 small text-muted">${notification.message}</p>
                        <small class="text-muted">${notification.time}</small>
                    </div>
                </a>
            `).join('');
        }
    }

    // Initialize audio players
    function initializeAudioPlayers() {
        // Attach click listeners to all play song buttons
        document.querySelectorAll('.play-song-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const songId = this.getAttribute('data-id');

                // Use the global modal player function
                if (window.playSongInModal && songId) {
                    window.playSongInModal(songId);
                } else {
                    console.error('Modal player not available or song ID missing');
                }
            });
        });
    }

    // Initialize profile image upload
    function initializeProfileImageUpload() {
        const changeAvatarBtn = document.getElementById('changeAvatarBtn');
        const avatarFileInput = document.getElementById('avatarFileInput');
        const profileAvatar = document.getElementById('profileAvatar');
        const uploadProgress = document.getElementById('avatarUploadProgress');

        if (changeAvatarBtn) {
            // Create file input if it doesn't exist
            if (!avatarFileInput) {
                const input = document.createElement('input');
                input.type = 'file';
                input.id = 'avatarFileInput';
                input.accept = 'image/*';
                input.className = 'd-none';
                document.body.appendChild(input);

                input.addEventListener('change', async function () {
                    if (this.files.length > 0) {
                        const file = this.files[0];

                        // Validate file type
                        if (!file.type.match('image.*')) {
                            showNotification('Please select an image file', 'danger');
                            return;
                        }

                        // Validate file size (max 5MB)
                        if (file.size > 5 * 1024 * 1024) {
                            showNotification('Image size should be less than 5MB', 'danger');
                            return;
                        }

                        // Show upload progress
                        if (uploadProgress) {
                            uploadProgress.style.display = 'block';
                            const progressBar = uploadProgress.querySelector('.progress-bar');
                            progressBar.style.width = '30%';

                            try {
                                const formData = new FormData();
                                formData.append('upload_type', 'profile_image');
                                formData.append('profile_image', file);

                                const response = await fetch('backend/api/upload.php', {
                                    method: 'POST',
                                    body: formData,
                                    credentials: 'include'
                                });

                                progressBar.style.width = '80%';
                                const result = await response.json();

                                if (result.success) {
                                    progressBar.style.width = '100%';

                                    // Update images with new URL (add timestamp to bust cache)
                                    const newUrl = `${result.data.file_path}?t=${new Date().getTime()}`;

                                    // Update internal state
                                    mockData.profile.avatar = newUrl;

                                    // Fix: Target the circle container and swap initials for image
                                    const avatarCircle = document.getElementById('profileAvatarCircle');
                                    if (avatarCircle) {
                                        avatarCircle.innerHTML = `<img src="${newUrl}" style="width: 100%; height: 100%; object-fit: cover;">`;
                                        avatarCircle.style.background = 'transparent'; // Remove background color when image is present
                                    }

                                    const topBarImage = document.getElementById('topBarProfileImage');
                                    if (topBarImage) topBarImage.src = newUrl;

                                    setTimeout(() => {
                                        if (uploadProgress) {
                                            uploadProgress.style.display = 'none';
                                            progressBar.style.width = '0%';
                                        }
                                        showNotification('Profile photo updated successfully!', 'success');
                                    }, 500);
                                } else {
                                    throw new Error(result.message);
                                }
                            } catch (error) {
                                console.error('Upload error:', error);
                                showNotification('Failed to upload profile photo: ' + error.message, 'danger');
                                if (uploadProgress) uploadProgress.style.display = 'none';
                            }
                        }
                    }
                });

                changeAvatarBtn.addEventListener('click', function () {
                    input.click();
                });
            }
        }
    }

    // Initialize payment options
    function initializePaymentOptions() {
        // Plan selection buttons
        document.querySelectorAll('.plan-card .btn').forEach(btn => {
            if (!btn.classList.contains('disabled')) {
                btn.addEventListener('click', function () {
                    const selectedPlan = this.getAttribute('data-plan');
                    const selectedPrice = this.getAttribute('data-price');

                    // Update payment modal
                    const planName = document.getElementById('selectedPlanName');
                    if (planName) planName.textContent = selectedPlan;
                    const planPrice = document.getElementById('selectedPlanPrice');
                    if (planPrice) planPrice.textContent = selectedPrice;

                    const paymentModalTitle = document.querySelector('#paymentModal .modal-title');
                    if (paymentModalTitle) paymentModalTitle.textContent = t('Subscribe to') + ' ' + selectedPlan;

                    // Show payment modal
                    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('paymentModal'));
                    modal.show();
                });
            }
        });

        // The legacy payment method toggle has been removed as the platform now uses MoMo exclusively.
        // If we need to re-add toggles for other localized providers later, the logic should go here.
        console.log("💳 Payment options initialized (MoMo-only mode)");
    }

    // Re-attach event listeners after content loads
    function reattachEventListeners(view) {
        // Common event listeners
        attachCommonListeners();

        // View-specific event listeners
        switch (view) {
            case 'dashboard':
                attachDashboardListeners();
                break;
            case 'profile':
                attachProfileListeners();
                break;
            case 'music':
                attachMusicListeners();
                break;
            case 'analytics':
                attachAnalyticsListeners();
                break;
            case 'revenue':
                attachRevenueListeners();
                break;
            case 'subscription':
                attachSubscriptionListeners();
                break;
            case 'notifications':
                attachNotificationsListeners();
                break;
            case 'social':
                attachSocialListeners();
                break;
        }
    }

    function attachCommonListeners() {
                    // Save profile button
                    const saveProfileBtn = document.getElementById('saveProfileBtn');
                    if (saveProfileBtn) {
                        saveProfileBtn.addEventListener('click', async function () {
                            // Get form values
                            const artistName = document.getElementById('artistNameInput')?.value || mockData.profile.name;
                            const realName = document.getElementById('realNameInput')?.value || '';
                            const bio = document.getElementById('bioInput')?.value || mockData.profile.bio;
                            const location = document.getElementById('locationInput')?.value || '';
                            const website = document.getElementById('websiteInput')?.value || '';
                            const genre = document.getElementById('genreSelect')?.value || '';

                            // Get Social values
                            const instagram = document.getElementById('instagramInput')?.value?.trim();
                            const twitter = document.getElementById('twitterInput')?.value?.trim();
                            const facebook = document.getElementById('facebookInput')?.value?.trim();
                            const youtube = document.getElementById('youtubeInput')?.value?.trim();

                            try {
                                const sessionRes = await fetch('backend/api/session.php');
                                const sessionData = await sessionRes.json();

                                if (!sessionData.success) throw new Error("Not logged in");

                                const userId = sessionData.data.user.id;
                                const artistRes = await fetch(`backend/api/artists.php?user_id=${userId}`);
                                const artistJson = await artistRes.json();

                                if (!artistJson.success || artistJson.data.length === 0) throw new Error("Artist profile not found");

                                const artistId = artistJson.data[0].id;

                                const updateData = {
                                    id: artistId,
                                    name: artistName,
                                    real_name: realName,
                                    genre: genre || artistJson.data[0].genre,
                                    followers: artistJson.data[0].followers,
                                    songs_count: artistJson.data[0].songs_count,
                                    status: artistJson.data[0].status,
                                    verification: artistJson.data[0].verification,
                                    bio: bio,
                                    instagram_url: instagram,
                                    twitter_url: twitter,
                                    facebook_url: facebook,
                                    youtube_url: youtube,
                                    website: website,
                                    location: location
                                };

                                const updateRes = await fetch('backend/api/artists.php', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(updateData)
                                });

                                const updateJson = await updateRes.json();

                                if (updateJson.success) {
                                    // Update mock data
                                    mockData.profile.name = artistName;
                                    mockData.profile.bio = bio;
                                    mockData.profile.social = { instagram, twitter, facebook, youtube };

                                    // Update display
                                    const nameDisplay = document.getElementById('artistNameDisplay');
                                    if (nameDisplay) nameDisplay.textContent = artistName;

                                    // Update top bar
                                    const topBarName = document.getElementById('topBarArtistName');
                                    if (topBarName) topBarName.textContent = artistName;

                                    showNotification('Profile and social media links updated successfully!', 'success');
                                } else {
                                    throw new Error(updateJson.message);
                                }

                            } catch (e) {
                                console.error("Save failed", e);
                                showNotification('Error saving profile: ' + e.message, 'danger');
                            }
                        });
                    }

                    // Save notification settings in profile
                    const saveNotificationSettings = document.getElementById('saveNotificationSettings');
                    if (saveNotificationSettings) {
                        saveNotificationSettings.addEventListener('click', async function () {
                            const payload = {
                                notif_new_followers: document.getElementById('notifNewFollowers').checked,
                                notif_comments: document.getElementById('notifComments').checked,
                                notif_stream_milestones: document.getElementById('notifStreamMilestones').checked,
                                notif_revenue_updates: document.getElementById('notifRevenueUpdates').checked,
                                notif_marketing: document.getElementById('notifMarketing').checked
                            };
                            try {
                                const res = await fetch('backend/api/notification_settings.php', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    credentials: 'include',
                                    body: JSON.stringify(payload)
                                });
                                const data = await res.json();
                                if (data.success) {
                                    showNotification('Notification settings saved successfully!', 'success');
                                } else {
                                    showNotification('Failed to save notification settings', 'danger');
                                }
                            } catch (e) {
                                showNotification('Failed to save notification settings', 'danger');
                            }
                        });
                    }
                }

    function attachDashboardListeners() {
                    // Upload music button
                    const uploadMusicBtn = document.getElementById('uploadMusicBtn');
                    if (uploadMusicBtn) {
                        uploadMusicBtn.addEventListener('click', function () {
                            // Switch to music view and show upload modal
                            loadView('music');
                            setTimeout(() => {
                                const uploadModal = new bootstrap.Modal(document.getElementById('uploadModal'));
                                uploadModal.show();
                            }, 100);
                        });
                    }

                    // Export data button - find by class and text content
                    const buttons = document.querySelectorAll('button.btn-outline-secondary');
                    const exportBtn = Array.from(buttons).find(btn => btn.textContent.includes('Export Data'));
                    if (exportBtn) {
                        exportBtn.addEventListener('click', function () {
                            showNotification('Data export started. You will receive an email when ready.', 'info');
                        });
                    }
                }

    function attachProfileListeners() {
                    // Update social media preview when inputs change
                    // Update social media preview when inputs change
                    const socialInputs = ['instagramInput', 'twitterInput', 'facebookInput', 'youtubeInput'];
                    socialInputs.forEach(inputId => {
                        const input = document.getElementById(inputId);
                        if (input) {
                            input.addEventListener('input', updateSocialPreview);
                        }
                    });

                    // Initialize social preview
                    updateSocialPreview();
                }

    function updateSocialPreview() {
                    console.log('Updating social preview');
                    const previewContainer = document.getElementById('socialPreview');
                    if (!previewContainer) {
                        console.error('socialPreview container not found');
                        return;
                    }

                    const instagram = document.getElementById('instagramInput')?.value?.trim();
                    const twitter = document.getElementById('twitterInput')?.value?.trim();
                    const facebook = document.getElementById('facebookInput')?.value?.trim();
                    const youtube = document.getElementById('youtubeInput')?.value?.trim();

                    console.log('Social values:', { instagram, twitter, facebook, youtube });

                    let html = '';

                    if (instagram) {
                        const handle = instagram.startsWith('http') ? instagram : (instagram.startsWith('@') ? `https://instagram.com/${instagram.substring(1)}` : `https://instagram.com/${instagram}`);
                        html += `<a href="${handle}" target="_blank" class="social-icon instagram" title="Instagram"><i class="fab fa-instagram"></i></a>`;
                    }
                    if (twitter) {
                        const handle = twitter.startsWith('http') ? twitter : (twitter.startsWith('@') ? `https://twitter.com/${twitter.substring(1)}` : `https://twitter.com/${twitter}`);
                        html += `<a href="${handle}" target="_blank" class="social-icon twitter" title="Twitter"><i class="fab fa-twitter"></i></a>`;
                    }
                    if (facebook) {
                        const handle = facebook.startsWith('http') ? facebook : `https://facebook.com/${facebook}`;
                        html += `<a href="${handle}" target="_blank" class="social-icon facebook" title="Facebook"><i class="fab fa-facebook"></i></a>`;
                    }
                    if (youtube) {
                        const handle = youtube.startsWith('http') ? youtube : `https://youtube.com/${youtube}`;
                        html += `<a href="${handle}" target="_blank" class="social-icon youtube" title="YouTube"><i class="fab fa-youtube"></i></a>`;
                    }

                    console.log('Generated HTML:', html);
                    previewContainer.innerHTML = html || `<small class="text-muted">${t('No social media links set')}</small>`;
                }

    function attachMusicListeners() {
                    // Upload new song button
                    const uploadNewSongBtn = document.getElementById('uploadNewSongBtn');
                    const uploadForm = document.getElementById('uploadForm');

                    if (uploadNewSongBtn && uploadForm) {
                        uploadNewSongBtn.addEventListener('click', function () {
                            uploadForm.style.display = uploadForm.style.display === 'none' ? 'block' : 'none';
                        });
                    }

                    // Cancel upload button
                    const cancelUploadBtn = document.getElementById('cancelUploadBtn');
                    if (cancelUploadBtn && uploadForm) {
                        cancelUploadBtn.addEventListener('click', function () {
                            uploadForm.style.display = 'none';
                            const songUploadForm = document.getElementById('songUploadForm');
                            if (songUploadForm) songUploadForm.reset();
                        });
                    }

                    // Audio upload area
                    const audioUploadArea = document.getElementById('audioUploadArea');
                    if (audioUploadArea) {
                        audioUploadArea.addEventListener('click', function () {
                            const audioFileInput = document.getElementById('audioFileInput');
                            if (audioFileInput) audioFileInput.click();
                        });
                    }

                    // Cover art upload area
                    const coverArtUploadArea = document.getElementById('coverArtUploadArea');
                    const coverArtInput = document.getElementById('coverArtInput');
                    const coverArtPreview = document.getElementById('coverArtPreview');
                    const coverArtImg = document.getElementById('coverArtImg');
                    const removeCoverArtBtn = document.getElementById('removeCoverArt');

                    if (coverArtUploadArea && coverArtInput) {
                        coverArtUploadArea.addEventListener('click', function () {
                            coverArtInput.click();
                        });

                        coverArtInput.addEventListener('change', function (e) {
                            const file = e.target.files[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onload = function (e) {
                                    coverArtImg.src = e.target.result;
                                    coverArtPreview.style.display = 'block';
                                    coverArtUploadArea.style.display = 'none';
                                };
                                reader.readAsDataURL(file);
                            }
                        });
                    }

                    if (removeCoverArtBtn) {
                        removeCoverArtBtn.addEventListener('click', function () {
                            coverArtInput.value = '';
                            coverArtPreview.style.display = 'none';
                            coverArtUploadArea.style.display = 'block';
                        });
                    }

                    // Song upload form
                    const songUploadForm = document.getElementById('songUploadForm');
                    if (songUploadForm) {
                        songUploadForm.addEventListener('submit', async function (e) {
                            e.preventDefault();

                            const songTitle = document.getElementById('songTitleInput')?.value;
                            const songGenre = document.getElementById('songGenreSelect')?.value;
                            const audioFileInput = document.getElementById('audioFileInput');
                            const coverArtInput = document.getElementById('coverArtInput');

                            if (!songTitle || !songGenre) {
                                showNotification('Please fill in all required fields', 'danger');
                                return;
                            }

                            if (!audioFileInput || !audioFileInput.files[0]) {
                                showNotification('Please select a song file to upload', 'danger');
                                return;
                            }

                            const submitBtn = document.getElementById('submitUploadBtn');
                            const originalText = submitBtn.innerHTML;
                            submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${t('Uploading...')}`;
                            submitBtn.disabled = true;

                            try {
                                // Create FormData for file upload
                                const formData = new FormData();
                                formData.append('upload_type', 'song');
                                formData.append('title', songTitle);
                                formData.append('genre', songGenre);
                                formData.append('song_file', audioFileInput.files[0]);

                                // Add cover art if provided
                                if (coverArtInput && coverArtInput.files[0]) {
                                    formData.append('cover_art', coverArtInput.files[0]);
                                }

                                // Fetch artist_id from backend before upload
                                let artistId = null;
                                try {
                                    const sessionRes = await fetch('backend/api/session.php', { credentials: 'include' });
                                    const sessionData = await sessionRes.json();
                                    if (sessionData.success && sessionData.data.user) {
                                        const userId = sessionData.data.user.id;
                                        const artistRes = await fetch(`backend/api/artists.php?user_id=${userId}`);
                                        const artistJson = await artistRes.json();
                                        if (artistJson.success && artistJson.data.length > 0) {
                                            artistId = artistJson.data[0].id;
                                            formData.append('artist_id', artistId);
                                        }
                                    }
                                } catch (fetchErr) {
                                    // If artistId cannot be fetched, rely on backend fallback
                                    console.warn('Could not fetch artist_id for upload:', fetchErr);
                                }

                                // Make API call to upload
                                const response = await fetch('backend/api/upload.php', {
                                    method: 'POST',
                                    body: formData,
                                    credentials: 'include'
                                });

                                const result = await response.json();

                                if (result.success) {
                                    showNotification(`"${songTitle}" uploaded successfully! It will be available after review.`, 'success');

                                    // Reset form and hide upload form
                                    songUploadForm.reset();
                                    if (uploadForm) uploadForm.style.display = 'none';

                                    // Optionally refresh the songs list
                                    setTimeout(() => {
                                        window.location.reload();
                                    }, 1500);

                                } else {
                                    showNotification(result.message || 'Upload failed', 'danger');
                                }

                            } catch (error) {
                                console.error('Upload error:', error);
                                showNotification('Upload failed. Please try again.', 'danger');
                            } finally {
                                // Reset button
                                submitBtn.innerHTML = originalText;
                                submitBtn.disabled = false;
                            }
                        });
                    }

                    // Edit song buttons
                    document.querySelectorAll('.edit-song-btn').forEach(btn => {
                        btn.addEventListener('click', function () {
                            const songId = this.getAttribute('data-id');
                            const song = uploadedSongs.find(s => s.id == songId);

                            if (song) {
                                // Fill edit form
                                document.getElementById('editSongTitle').value = song.title;
                                document.getElementById('editSongGenre').value = song.genre;
                                document.getElementById('editSongId').value = songId;

                                // Show modal
                                const modal = new bootstrap.Modal(document.getElementById('editSongModal'));
                                modal.show();
                            }
                        });
                    });

                    // Save song changes
                    const saveSongChanges = document.getElementById('saveSongChanges');
                    if (saveSongChanges) {
                        saveSongChanges.addEventListener('click', function () {
                            const songId = document.getElementById('editSongId').value;
                            const songTitle = document.getElementById('editSongTitle').value;
                            const songGenre = document.getElementById('editSongGenre').value;

                            if (!songTitle || !songGenre) {
                                showNotification('Please fill in all required fields', 'danger');
                                return;
                            }

                            // Find and update song
                            const songIndex = uploadedSongs.findIndex(s => s.id == songId);
                            if (songIndex !== -1) {
                                uploadedSongs[songIndex].title = songTitle;
                                uploadedSongs[songIndex].genre = songGenre;

                                // Close modal
                                bootstrap.Modal.getInstance(document.getElementById('editSongModal')).hide();

                                // Refresh table
                                const songsTableBody = document.getElementById('songsTableBody');
                                if (songsTableBody) {
                                    songsTableBody.innerHTML = getSongsTableRows();
                                    attachMusicListeners();
                                }

                                showNotification(`"${songTitle}" updated successfully!`, 'success');
                            }
                        });
                    }

                    // Delete song buttons
                    document.querySelectorAll('.delete-song-btn').forEach(btn => {
                        btn.addEventListener('click', function () {
                            const songId = this.getAttribute('data-id');
                            const song = uploadedSongs.find(s => s.id == songId);

                            if (song && confirm(`Delete "${song.title}"? This action cannot be undone.`)) {
                                // Remove from uploadedSongs
                                uploadedSongs = uploadedSongs.filter(s => s.id != songId);

                                // Remove row from table
                                const row = this.closest('tr');
                                row.style.opacity = '0.5';
                                setTimeout(() => {
                                    row.remove();
                                    showNotification(`"${song.title}" has been deleted`, 'danger');
                                }, 300);
                            }
                        });
                    });
                }

    function attachAnalyticsListeners() {
                    // Period dropdown
                    const periodItems = document.querySelectorAll('.dropdown-item[data-period]');
                    periodItems.forEach(item => {
                        item.addEventListener('click', function (e) {
                            e.preventDefault();
                            const period = this.getAttribute('data-period');

                            // Update active item
                            periodItems.forEach(i => i.classList.remove('active'));
                            this.classList.add('active');

                            // Update dropdown button text
                            const dropdownBtn = this.closest('.dropdown-menu').previousElementSibling;
                            dropdownBtn.textContent = this.textContent;

                            showNotification(`Analytics updated for ${this.textContent}`, 'info');
                        });
                    });
                }

    function attachRevenueListeners() {
                    // Withdraw all button
                    const withdrawAllBtn = document.getElementById('withdrawAllBtn');
                    if (withdrawAllBtn) {
                        withdrawAllBtn.addEventListener('click', function () {
                            const availableAmount = parseFloat(mockData.stats.availableForWithdrawal.replace(/[^0-9.-]+/g, ""));
                            document.getElementById('withdrawAmount').value = availableAmount.toFixed(2);
                        });
                    }

                    // Process withdrawal button
                    const processWithdrawalBtn = document.getElementById('processWithdrawalBtn');
                    if (processWithdrawalBtn) {
                        processWithdrawalBtn.addEventListener('click', function () {
                            const amountInput = document.getElementById('withdrawAmount');
                            const amount = parseFloat(amountInput.value);
                            const availableAmount = parseFloat(mockData.stats.availableForWithdrawal.replace(/[^0-9.-]+/g, ""));
                            const method = document.getElementById('withdrawMethod').value;

                            if (!amount || isNaN(amount)) {
                                showNotification('Please enter a valid amount', 'danger');
                                return;
                            }

                            if (amount < 5000) {
                                showNotification('Minimum withdrawal amount is 5,000 FCFA', 'danger');
                                return;
                            }

                            if (amount > availableAmount) {
                                showNotification('Insufficient balance', 'danger');
                                return;
                            }

                            if (amount > 10000) {
                                showNotification('Maximum withdrawal per day is 10,000 FCFA', 'danger');
                                return;
                            }

                            // Disable button and show processing
                            this.disabled = true;
                            const originalText = this.textContent;
                            this.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${t('Processing...')}`;

                            // Simulate withdrawal processing
                            setTimeout(() => {
                                this.disabled = false;
                                this.textContent = originalText;

                                // Update available balance
                                const newBalance = availableAmount - amount;
                                mockData.stats.availableForWithdrawal = `FCFA ${newBalance.toLocaleString()}`;

                                // Clear input
                                amountInput.value = '';

                                // Show success message
                                showNotification(`Successfully withdrew FCFA ${amount.toLocaleString()} via ${method}. Funds will arrive in 3-5 business days.`, 'success');

                                // Update UI
                                const availableBalanceEl = document.getElementById('availableBalance');
                                if (availableBalanceEl) {
                                    availableBalanceEl.textContent = `FCFA ${newBalance.toLocaleString()}`;
                                }
                            }, 2000);
                        });
                    }

                    // Withdraw earnings button
                    const withdrawEarningsBtn = document.getElementById('withdrawEarningsBtn');
                    if (withdrawEarningsBtn) {
                        withdrawEarningsBtn.addEventListener('click', function () {
                            const availableAmount = parseFloat(mockData.stats.availableForWithdrawal.replace(/[^0-9.-]+/g, ""));

                            if (availableAmount < 5000) {
                                showNotification(`Minimum withdrawal is 5,000 FCFA. Current available: FCFA ${availableAmount.toLocaleString()}`, 'warning');
                                return;
                            }

                            // Show withdraw modal
                            const modal = new bootstrap.Modal(document.getElementById('withdrawEarningsModal'));
                            modal.show();
                        });
                    }
                }

    function attachSubscriptionListeners() {
                    console.log('Attaching subscription listeners for dynamic content');

                    // 1. Manage Billing Button (Dynamic)
                    const manageBillingBtn = document.getElementById('manageBillingBtn');
                    if (manageBillingBtn) {
                        manageBillingBtn.addEventListener('click', function () {
                            const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('manageBillingModal'));
                            modal.show();
                        });
                    }

                    // 2. Update Payment Method Button (Dynamic on page)
                    const viewUpdateBtn = document.getElementById('updatePaymentMethodBtn');
                    if (viewUpdateBtn) {
                        viewUpdateBtn.addEventListener('click', function () {
                            // If it exists globally, use it
                            if (window.openUpdatePaymentFromModal) {
                                window.openUpdatePaymentFromModal();
                            }
                        });
                    }

                    // 2.5 Update Payment Button in Modal
                    const modalUpdateBtn = document.getElementById('modalUpdatePaymentMethodBtn');
                    if (modalUpdateBtn) {
                        modalUpdateBtn.addEventListener('click', function () {
                            if (window.openMomoUpdateAccountModal) {
                                window.openMomoUpdateAccountModal();
                            }
                        });
                    }

                    // 3. Plan Selection Buttons -> Open MoMo Subscription Modal
                    document.querySelectorAll('.plan-card .btn').forEach(btn => {
                        if (!btn.classList.contains('disabled')) {
                            btn.addEventListener('click', function () {
                                const selectedPlan = this.getAttribute('data-plan');
                                const selectedPrice = parseFloat(this.getAttribute('data-price') || 0);
                                window.openMomoSubscribeModal(selectedPlan, selectedPrice);
                            });
                        }
                    });
                }

    function attachNotificationsListeners() {
                    // Mark all as read button
                    const markAllReadBtn = document.getElementById('markAllReadBtn');
                    if (markAllReadBtn) {
                        markAllReadBtn.addEventListener('click', function () {
                            // Mark all notifications as read
                            mockData.notifications.forEach(notification => {
                                notification.read = true;
                            });

                            // Update UI
                            const notifications = document.querySelectorAll('.notification-item');
                            notifications.forEach(notification => {
                                notification.classList.remove('unread');
                                const markReadBtn = notification.querySelector('.mark-read-btn');
                                if (markReadBtn) markReadBtn.remove();
                            });

                            // Update dropdown
                            updateNotificationDropdown();

                            showNotification('All notifications marked as read', 'success');
                        });
                    }

                    // Clear all notifications button
                    const clearNotificationsBtn = document.getElementById('clearNotificationsBtn');
                    if (clearNotificationsBtn) {
                        clearNotificationsBtn.addEventListener('click', function () {
                            if (confirm('Clear all notifications?')) {
                                // Clear state
                                mockData.notifications = [];

                                // Update UI list
                                const notificationsList = document.getElementById('notificationsList');
                                if (notificationsList) {
                                    notificationsList.innerHTML = '<p class="text-center text-muted py-4">No notifications</p>';
                                }

                                // Update badges and dropdown
                                updateNotificationDropdown();

                                showNotification('All notifications cleared', 'success');
                            }
                        });
                    }

                    // Mark individual as read buttons
                    document.querySelectorAll('.mark-read-btn').forEach(btn => {
                        btn.addEventListener('click', function () {
                            const notificationId = this.getAttribute('data-id');
                            const notification = mockData.notifications.find(n => n.id == notificationId);

                            if (notification) {
                                notification.read = true;
                                const notificationEl = this.closest('.notification-item');
                                if (notificationEl) notificationEl.classList.remove('unread');
                                this.remove();

                                // Update dropdown
                                updateNotificationDropdown();

                                showNotification('Notification marked as read', 'success');
                            }
                        });
                    });

                    // Delete individual notification buttons
                    document.querySelectorAll('.delete-notification-btn').forEach(btn => {
                        btn.addEventListener('click', function () {
                            const notificationId = this.getAttribute('data-id');

                            // Remove from state
                            const index = mockData.notifications.findIndex(n => n.id == notificationId);
                            if (index !== -1) {
                                mockData.notifications.splice(index, 1);

                                // Remove from DOM
                                const notificationEl = this.closest('.notification-item');
                                if (notificationEl) {
                                    notificationEl.style.opacity = '0';
                                    notificationEl.style.transform = 'translateX(20px)';
                                    setTimeout(() => {
                                        notificationEl.remove();

                                        // If list is empty, show empty message
                                        const notificationsList = document.getElementById('notificationsList');
                                        if (notificationsList && mockData.notifications.length === 0) {
                                            notificationsList.innerHTML = `<p class="text-center text-muted py-4">${t('No notifications')}</p>`;
                                        }
                                    }, 300);
                                }

                                // Update badges and dropdown
                                updateNotificationDropdown();

                                showNotification('Notification deleted', 'info');
                            }
                        });
                    });

                    // Save notification settings button
                    const saveNotificationSettingsBtn = document.getElementById('saveNotificationSettingsBtn');
                    if (saveNotificationSettingsBtn) {
                        saveNotificationSettingsBtn.addEventListener('click', function () {
                            showNotification('Notification settings saved successfully!', 'success');
                        });
                    }
                }

    // Notification function
    function showNotification(message, type = 'info') {
                    // Remove existing notifications
                    const existingAlerts = document.querySelectorAll('.alert.position-fixed');
                    existingAlerts.forEach(alert => {
                        alert.remove();
                    });

                    const notification = document.createElement('div');
                    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
                    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
                    notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="alert"></button>
        `;

                    document.body.appendChild(notification);

                    // Auto-dismiss after 3 seconds
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.remove();
                        }
                    }, 3000);
                }

    // Chart Initialization Functions
    function initializeDashboardCharts() {
                    if (!mockData.stats.chartData || !document.getElementById('streamsChart')) return;

                    const ctx = document.getElementById('streamsChart').getContext('2d');
                    new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: mockData.stats.chartData.labels,
                            datasets: [{
                                label: 'Monthly Streams',
                                data: mockData.stats.chartData.data,
                                borderColor: '#0d6efd',
                                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                                tension: 0.4,
                                fill: true
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                                    ticks: { color: '#adb5bd' }
                                },
                                x: {
                                    grid: { display: false },
                                    ticks: { color: '#adb5bd' }
                                }
                            }
                        }
                    });

                    if (mockData.stats.revenueData && document.getElementById('revenueChart')) {
                        const revCtx = document.getElementById('revenueChart').getContext('2d');
                        new Chart(revCtx, {
                            type: 'bar',
                            data: {
                                labels: mockData.stats.revenueData.labels,
                                datasets: [{
                                    label: 'Revenue',
                                    data: mockData.stats.revenueData.data,
                                    backgroundColor: '#198754',
                                    borderRadius: 4
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { display: false }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        grid: { display: false },
                                        ticks: { display: false }
                                    },
                                    x: {
                                        grid: { display: false },
                                        ticks: { display: false } // Minimalist view for dashboard card
                                    }
                                }
                            }
                        });
                    }
                }

    function initializeRevenueCharts() {
                    if (!mockData.stats.revenueData || !document.getElementById('revenueOverviewChart')) return;

                    const ctx = document.getElementById('revenueOverviewChart').getContext('2d');
                    new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: mockData.stats.revenueData.labels,
                            datasets: [{
                                label: 'Total Revenue',
                                data: mockData.stats.revenueData.data,
                                borderColor: '#198754',
                                backgroundColor: 'rgba(25, 135, 84, 0.1)',
                                tension: 0.4,
                                fill: true
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                                    ticks: {
                                        color: '#adb5bd',
                                        callback: function (value) { return '$' + value; }
                                    }
                                },
                                x: {
                                    grid: { display: false },
                                    ticks: { color: '#adb5bd' }
                                }
                            }
                        }
                    });
                }

    function initializeAnalyticsCharts() {
                    if (!mockData.stats.demographics || !document.getElementById('demographicsChart')) return;

                    const ctx = document.getElementById('demographicsChart').getContext('2d');
                    new Chart(ctx, {
                        type: 'doughnut',
                        data: {
                            labels: mockData.stats.demographics.labels,
                            datasets: [{
                                data: mockData.stats.demographics.data,
                                backgroundColor: [
                                    '#0d6efd',
                                    '#6610f2',
                                    '#6f42c1',
                                    '#d63384'
                                ],
                                borderWidth: 0
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'right',
                                    labels: { color: '#adb5bd' }
                                }
                            },
                            cutout: '70%'
                        }
                    });
                }

    async function loadTopFans() {
                    const list = document.getElementById('topSupportersList');
                    if (!list) return;

                    try {
                        // Need to ensure artistId is available
                        if (!artistId) {
                            const sessionRes = await fetch('backend/api/session.php');
                            const sessionJson = await sessionRes.json();
                            if (sessionJson.success && sessionJson.data.user) {
                                const artistRes = await fetch(`backend/api/artists.php?user_id=${sessionJson.data.user.id}`);
                                const artistJson = await artistRes.json();
                                if (artistJson.success && artistJson.data.length > 0) {
                                    artistId = artistJson.data[0].id;
                                }
                            }
                        }

                        if (!artistId) {
                            list.innerHTML = `<div class="p-3 text-center text-muted">${t('Artist profile not found.')}</div>`;
                            return;
                        }

                        const res = await fetch(`backend/api/follows.php?artist_id=${artistId}`);
                        const json = await res.json();

                        if (json.success) {
                            if (json.data.length === 0) {
                                list.innerHTML = `<div class="p-3 text-center text-muted">${t('No followers yet.')}</div>`;
                            } else {
                                list.innerHTML = json.data.slice(0, 5).map((fan, index) => `
                        <div class="list-group-item d-flex align-items-center bg-transparent border-0 px-3 py-2">
                            <div class="flex-shrink-0 me-3">
                                <div class="rounded-circle bg-secondary d-flex align-items-center justify-content-center" style="width: 32px; height: 32px; color: white; font-size: 12px;">
                                    ${fan.user_name.substring(0, 2).toUpperCase()}
                                </div>
                            </div>
                            <div class="flex-grow-1">
                                <h6 class="mb-0 small text-white">${fan.user_name}</h6>
                                <small class="text-muted">Loyal Fan</small>
                            </div>
                            <div class="ms-auto">
                                <span class="badge bg-primary rounded-pill" style="font-size: 10px;">#${index + 1}</span>
                            </div>
                        </div>
                    `).join('');
                            }
                        }
                    } catch (e) {
                        list.innerHTML = `<div class="p-3 text-center text-danger small">${t('Error loading fans.')}</div>`;
                    }
                }
});
