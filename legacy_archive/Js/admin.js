// Admin Dashboard JavaScript
const escapeHtml = window.afro?.escapeHtml || ((value) => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
}[ch])));
const safeHttpUrl = window.afro?.safeHttpUrl || ((value, fallback = '#') => {
    try {
        const url = new URL(String(value || ''), window.location.origin);
        return ['http:', 'https:'].includes(url.protocol) ? url.href : fallback;
    } catch (e) {
        return fallback;
    }
});

function getTypeColor(type) {
    const normalized = String(type || '').toLowerCase();
    switch (normalized) {
        case 'admin':
            return 'primary';
        case 'artist':
            return 'success';
        case 'fan':
            return 'info';
        case 'pending':
            return 'warning';
        case 'blocked':
            return 'danger';
        case 'verified':
            return 'success';
        default:
            return 'secondary';
    }
}

function getGenreColor(genre) {
    const normalized = String(genre || '').toLowerCase();
    const genreColors = {
        afrobeat: 'ff7f50',
        hiphop: '1f2937',
        rap: '9333ea',
        rnb: '10b981',
        reggae: 'f97316',
        gospel: '3b82f6',
        jazz: 'ec4899',
        pop: 'facc15'
    };
    return genreColors[normalized] || '6c757d';
}

function getVerificationColor(status) {
    const normalized = String(status || '').toLowerCase();
    switch (normalized) {
        case 'verified':
            return 'success';
        case 'pending':
            return 'warning';
        case 'rejected':
            return 'danger';
        default:
            return 'secondary';
    }
}

console.log("🚀 Js/admin.js loaded");

// Authentication check
async function checkAuth() {
    console.log("🔐 Checking admin authentication...");

    try {
        const response = await fetch('backend/api/session.php', {
            method: 'GET',
            credentials: 'include' // Include cookies for session
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data.user.type === 'admin') {
                console.log(`✅ Admin authenticated: ${data.data.user.name}`);
                return true;
            }
        }

        // If we get here, user is not authenticated or not an admin
        const loginUrl = 'auth/login.html';

        console.log("⚠️ Admin authentication failed.");
        console.log("🔄 Redirecting to login:", loginUrl);

        if (window.afro && window.afro.redirectTo) {
            window.afro.redirectTo('/auth/login.html');
        } else {
            window.location.href = loginUrl;
        }
        return false;

    } catch (error) {
        console.error("❌ Authentication check failed:", error);

        const loginUrl = 'auth/login.html';

        console.log("⚠️ Auth check failed, redirecting to login:", loginUrl);
        if (window.afro && window.afro.redirectTo) {
            window.afro.redirectTo('/auth/login.html');
        } else {
            window.location.href = loginUrl;
        }
        return false;
    }
}

// Admin Dashboard JavaScript
document.addEventListener('DOMContentLoaded', async function () {
    console.log('Admin dashboard loaded');

    // Check authentication first
    if (!(await checkAuth())) {
        return; // checkAuth will redirect if not authenticated
    }

    // Initialize everything
    initializeDataTables();
    initializeCharts();
    loadSampleData();
    setupEventListeners();
    setupNavigation();
    animateStats();

});

function initializeDataTables() {
    console.log('Initializing DataTables...');

    // Destroy existing tables if they exist
    const tables = ['#usersTable', '#allUsersTable', '#artistsTable', '#songsTable',
        '#subscriptionPlansTable', '#recentSubscriptionsTable', '#topSongsTable',
        '#topArtistsTable', '#recentSongsTable'];

    tables.forEach(tableId => {
        if ($.fn.DataTable.isDataTable(tableId)) {
            $(tableId).DataTable().destroy();
        }
    });

    // Initialize tables with consistent options
    const tableOptions = {
        "pageLength": 10,
        "lengthChange": true,
        "searching": true,
        "info": true,
        "paging": true,
        "ordering": true,
        "language": {
            "emptyTable": "No data available in table",
            "info": "Showing _START_ to _END_ of _TOTAL_ entries",
            "infoEmpty": "Showing 0 to 0 of 0 entries",
            "infoFiltered": "(filtered from _MAX_ total entries)",
            "lengthMenu": "Show _MENU_ entries",
            "search": "Search:",
            "zeroRecords": "No matching records found"
        }
    };

    // Initialize tables with specific IDs or classes
    const targetTables = ['#recentSubscriptionsTable', '#topSongsTable', '#topArtistsTable', '#recentSongsTable', '#allUsersTable', '#artistsTable', '#songsTable', '#reportsTable'];

    targetTables.forEach(selector => {
        const $table = $(selector);
        if ($table.length && !$.fn.DataTable.isDataTable(selector)) {
            $table.DataTable(tableOptions);
            console.log(`✅ DataTable initialized: ${selector}`);
        }
    });

    console.log('DataTables initialization complete.');
}

function initializeCharts() {
    console.log('Initializing charts...');

    // User Growth Chart
    const userGrowthCanvas = document.getElementById('userGrowthChart');
    if (userGrowthCanvas) {
        const userGrowthCtx = userGrowthCanvas.getContext('2d');
        window.userGrowthChart = new Chart(userGrowthCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Total Users',
                    data: [],
                    borderColor: '#FF6B35',
                    backgroundColor: 'rgba(255, 107, 53, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: {
                            drawBorder: false,
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#b3b3b3'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#b3b3b3'
                        }
                    }
                }
            }
        });
    }

    // Artist Distribution Chart
    const artistDistCanvas = document.getElementById('artistDistributionChart');
    if (artistDistCanvas) {
        const artistDistCtx = artistDistCanvas.getContext('2d');
        window.artistDistributionChart = new Chart(artistDistCtx, {
            type: 'doughnut',
            data: {
                labels: ['Makossa', 'Bikutsi', 'Afrobeat', 'Assiko', 'Others'],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#FF6B35',
                        '#2E8B57',
                        '#8B4513',
                        '#FFA726',
                        '#6C757D'
                    ],
                    borderWidth: 1,
                    borderColor: '#1a1a1a'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#b3b3b3',
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    // Analytics Chart
    const analyticsCanvas = document.getElementById('analyticsChart');
    if (analyticsCanvas) {
        const analyticsCtx = analyticsCanvas.getContext('2d');
        window.analyticsChart = new Chart(analyticsCtx, {
            type: 'bar',
            data: {
                labels: ['Streams', 'Downloads', 'Shares', 'Likes', 'Comments'],
                datasets: [{
                    label: 'This Month',
                    data: [],
                    backgroundColor: '#FF6B35',
                    borderWidth: 0,
                    borderRadius: 4
                }, {
                    label: 'Last Month',
                    data: [],
                    backgroundColor: '#6C757D',
                    borderWidth: 0,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#b3b3b3'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            drawBorder: false,
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#b3b3b3',
                            callback: function (value) {
                                if (value >= 1000000) {
                                    return (value / 1000000).toFixed(1) + 'M';
                                } else if (value >= 1000) {
                                    return (value / 1000).toFixed(0) + 'K';
                                }
                                return value;
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#b3b3b3'
                        }
                    }
                }
            }
        });
    }

    // Genre Chart
    const genreCanvas = document.getElementById('genreChart');
    if (genreCanvas) {
        const genreCtx = genreCanvas.getContext('2d');
        window.genreChart = new Chart(genreCtx, {
            type: 'polarArea',
            data: {
                labels: ['Makossa', 'Bikutsi', 'Afrobeat', 'Assiko', 'Bend Skin', 'Gospel', 'Traditional'],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#FF6B35',
                        '#2E8B57',
                        '#8B4513',
                        '#FFA726',
                        '#DC3545',
                        '#17A2B8',
                        '#6C757D'
                    ],
                    borderWidth: 1,
                    borderColor: '#1a1a1a'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#b3b3b3',
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    // Revenue Chart
    const revenueCanvas = document.getElementById('revenueChart');
    if (revenueCanvas) {
        const revenueCtx = revenueCanvas.getContext('2d');
        window.revenueChart = new Chart(revenueCtx, {
            type: 'pie',
            data: {
                labels: ['Artist Subscriptions', 'Ad Revenue', 'Fan Donations', 'Premium Features', 'Merchandise'],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#FF6B35',
                        '#2E8B57',
                        '#8B4513',
                        '#FFA726',
                        '#6C757D'
                    ],
                    borderWidth: 1,
                    borderColor: '#1a1a1a'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#b3b3b3',
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    // Artist Verification Chart
    const artistVerificationCanvas = document.getElementById('artistVerificationChart');
    if (artistVerificationCanvas) {
        const artistVerificationCtx = artistVerificationCanvas.getContext('2d');
        window.artistVerificationChart = new Chart(artistVerificationCtx, {
            type: 'doughnut',
            data: {
                labels: ['Verified', 'Pending', 'Rejected'],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#16a34a',
                        '#ca8a04',
                        '#dc2626'
                    ],
                    borderWidth: 1,
                    borderColor: '#1a1a1a'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#b3b3b3',
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }
}

async function loadSampleData() {
    console.log('Loading data from API...');

    try {
        // Fetch users
        const usersData = await window.afro.safeFetch('backend/api/users.php');
        // parsed by safeFetch
        let users = usersData.success ? usersData.data : [];

        // Fetch artists
        const artistsData = await window.afro.safeFetch('backend/api/artists.php');
        // parsed automatically by safeFetch
        let artists = artistsData.success ? artistsData.data.map(artist => ({
            ...artist,
            name: artist.name || artist.user_name || 'Unknown Artist',
            genre: artist.genre || 'Unknown',
            followers: Number(artist.followers || 0),
            songs_count: Number(artist.songs_count ?? artist.real_songs_count ?? 0),
            songs: Number(artist.songs_count ?? artist.real_songs_count ?? 0),
            status: artist.status || 'pending',
            verification: artist.verification || 'pending'
        })) : [];

        // Fetch songs
        const songsData = await window.afro.safeFetch('backend/api/songs.php');
        // parsed automatically by safeFetch
        let songs = songsData.success ? songsData.data.map(song => ({
            ...song,
            artist: song.artist_name || 'Unknown Artist',
            genre: song.genre || 'Unknown',
            plays: Number(song.plays || 0),
            likes: Number(song.likes || 0),
            duration: song.duration || '0:00',
            date: song.uploaded_at ? song.uploaded_at.split(' ')[0] : (song.created_at ? song.created_at.split(' ')[0] : 'N/A'),
            display_status: song.status === 'active' ? 'published' : (song.status || 'pending')
        })) : [];

        // Fetch subscriptions
        const subsData = await window.afro.safeFetch('backend/api/subscriptions.php');
        // parsed automatically by safeFetch
        let subscriptions = subsData.success ? subsData.data : [];

        // Fetch admin data
        const adminAnalyticsData = await window.afro.safeFetch('backend/api/admin.php?action=analytics');
        // parsed automatically by safeFetch
        const analytics = adminAnalyticsData.success ? adminAnalyticsData.data : {};

        const adminRevenueData = await window.afro.safeFetch('backend/api/admin.php?action=revenue');
        // parsed automatically by safeFetch
        const revenue = adminRevenueData.success ? adminRevenueData.data : {};

        const adminReportsData = await window.afro.safeFetch('backend/api/admin.php?action=reports');
        // parsed automatically by safeFetch
        const reports = adminReportsData.success ? adminReportsData.data : [];

        // Fetch Real-time Stats
        const statsData = await window.afro.safeFetch('backend/api/stats.php?type=global');
        // parsed automatically by safeFetch
        const stats = statsData.success ? statsData.data : null;

        // Fetch platform settings
        const settingsData = await window.afro.safeFetch('backend/api/settings.php');
        // parsed automatically by safeFetch
        const settings = settingsData.success ? settingsData.data : { platform_name: 'CamSound', platform_description: '' };

        // Populate all tables
        populateUsersTable(users);
        populateAllUsersTable(users);
        populateArtistsTable(artists);
        populateSongsTable(songs);
        populateSubscriptionPlansTable(subscriptions);
        populateRecentSubscriptionsTable(subscriptions.slice(0, 5));
        populateTopSongsTable(songs.slice(0, 5));
        populateTopArtistsList(artists);
        populateRecentSongsTable(songs.slice(0, 5));

        // Update settings inputs
        populateSettingsInputs(settings);

        // Update charts if data is available
        if (stats) {
            updateDashboardCharts(stats);
            animateStats(stats);
        }

        // Populate admin-specific data
        populateAnalyticsStats(analytics);
        populateRevenueStats(revenue);
        populateReportsTable(reports);

        // Store data globally
        window.sampleData = { users, artists, songs, subscriptions, analytics, revenue, reports, settings };

        console.log('Data loaded successfully from API');
    } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to sample data if API fails
        loadFallbackData();
    }
}

function formatCompactNumber(value) {
    const numericValue = Number(value || 0);

    if (numericValue >= 1000000) {
        return (numericValue / 1000000).toFixed(1) + 'M';
    }

    if (numericValue >= 1000) {
        return (numericValue / 1000).toFixed(0) + 'K';
    }

    return numericValue.toString();
}

function getSongDisplayStatus(song) {
    return song.display_status || (song.status === 'active' ? 'published' : (song.status || 'pending'));
}

function populateSettingsInputs(settings) {
    console.log('Populating settings inputs...', settings);
    if (!settings) return;

    if (document.getElementById('platformName')) {
        document.getElementById('platformName').value = settings.platform_name || 'CamSound';
    }
    if (document.getElementById('platformDesc')) {
        document.getElementById('platformDesc').value = settings.platform_description || '';
    }
    if (document.getElementById('contactEmail')) {
        document.getElementById('contactEmail').value = settings.contact_email || '';
    }

    // Auto-update branding if script is loaded
    if (window.refreshPlatformBranding) {
        window.PLATFORM_SETTINGS.name = settings.platform_name || 'CamSound';
        window.refreshPlatformBranding();
    }
}

function populateUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    users.slice(0, 5).forEach(user => {
        const row = document.createElement('tr');
        const avatar = user.avatar && (user.avatar.includes('/') || user.avatar.includes('.')) ? safeHttpUrl(user.avatar) : '';
        const avatarText = escapeHtml(user.avatar || (user.name || '?').charAt(0));
        row.innerHTML = `
            <td>
                <div class="user-info">
                    <div class="user-avatar" style="overflow: hidden;">
                        ${avatar
                ? `<img src="${escapeHtml(avatar)}" alt="" style="width: 100%; height: 100%; object-fit: cover;">`
                : avatarText}
                    </div>
                    <div>
                        <strong>${escapeHtml(user.name)}</strong><br>
                        <small class="text-muted">ID: ${user.id}</small>
                    </div>
                </div>
            </td>
            <td>${escapeHtml(user.email)}</td>
            <td><span class="badge bg-${getTypeColor(user.type)}">${escapeHtml(user.type)}</span></td>
            <td><span class="status-badge status-${escapeHtml(user.status)}">${escapeHtml(user.status)}</span></td>
            <td>${escapeHtml(user.joined)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action view" data-entity="user" data-id="${user.id}" title="View">
                        <i class="fas fa-eye"></i>
                    </button>

                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function populateAllUsersTable(users) {
    const tbody = document.getElementById('allUsersTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    users.forEach(user => {
        const row = document.createElement('tr');
        const avatar = user.avatar && (user.avatar.includes('/') || user.avatar.includes('.')) ? safeHttpUrl(user.avatar) : '';
        const avatarText = escapeHtml(user.avatar || (user.name || '?').charAt(0));
        row.innerHTML = `
            <td>${user.id}</td>
            <td>
                <div class="user-info">
                    <div class="user-avatar" style="overflow: hidden;">
                        ${avatar
                ? `<img src="${escapeHtml(avatar)}" alt="" style="width: 100%; height: 100%; object-fit: cover;">`
                : avatarText}
                    </div>
                    <div>
                        <strong>${escapeHtml(user.name)}</strong>
                    </div>
                </div>
            </td>
            <td>${escapeHtml(user.email)}</td>
            <td>${escapeHtml(user.phone)}</td>
            <td><span class="badge bg-${getTypeColor(user.type)}">${escapeHtml(user.type)}</span></td>
            <td><span class="status-badge status-${escapeHtml(user.status)}">${escapeHtml(user.status)}</span></td>
            <td>${escapeHtml(user.joined)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action view" data-entity="user" data-id="${user.id}" title="View">
                        <i class="fas fa-eye"></i>
                    </button>

                    <button class="btn-action suspend" data-entity="user" data-id="${user.id}" data-status="${user.status}" title="${user.status === 'blocked' ? 'Activate' : 'Suspend'}">
                        <i class="fas ${user.status === 'blocked' ? 'fa-user-check' : 'fa-user-slash'}"></i>
                    </button>
                    <button class="btn-action reset" data-entity="user" data-id="${user.id}" title="Reset Password">
                        <i class="fas fa-key"></i>
                    </button>
                    <select class="form-select form-select-sm" style="width: auto; display: inline-block; margin-right: 5px;" onchange="assignRole(${user.id}, this.value)">
                        <option value="">Change Role</option>
                        <option value="artist" ${user.type === 'artist' ? 'selected' : ''}>Artist</option>
                        <option value="fan" ${user.type === 'fan' ? 'selected' : ''}>Fan</option>
                    </select>
                    <select class="form-select form-select-sm" style="width: auto; display: inline-block; margin-right: 5px;" onchange="changeUserStatus(${user.id}, this.value)">
                        <option value="">Change Status</option>
                        <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="pending" ${user.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="blocked" ${user.status === 'blocked' ? 'selected' : ''}>Blocked</option>
                    </select>
                    <button class="btn-action delete" data-entity="user" data-id="${user.id}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;

        if (user.type === 'admin') {
            row.querySelector('.btn-action.suspend')?.setAttribute('disabled', 'true');
            row.querySelector('.btn-action.reset')?.setAttribute('disabled', 'true');
            row.querySelector('.btn-action.delete')?.setAttribute('disabled', 'true');

            const roleSelect = row.querySelector('select[onchange^="assignRole"]');
            if (roleSelect) {
                roleSelect.disabled = true;
                roleSelect.title = 'Admin role changes are restricted';
            }

            const statusSelect = row.querySelector('select[onchange^="changeUserStatus"]');
            if (statusSelect) {
                statusSelect.disabled = true;
                statusSelect.title = 'Admin status changes are restricted';
            }
        }

        tbody.appendChild(row);
    });
}

function populateArtistsTable(artists) {
    const tbody = document.getElementById('artistsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    artists.forEach(artist => {
        const row = document.createElement('tr');
        const artistImage = artist.image || artist.photo || artist.avatar;
        const safeArtistImage = artistImage ? safeHttpUrl(artistImage) : '';
        row.innerHTML = `
            <td>${artist.id}</td>
            <td>
                <div class="user-info">
                    <div class="user-avatar" style="overflow: hidden;">
                        ${safeArtistImage
                ? `<img src="${escapeHtml(safeArtistImage)}" alt="" style="width: 100%; height: 100%; object-fit: cover;">`
                : escapeHtml((artist.name || '?').charAt(0))}
                    </div>
                    <div>
                        <strong>${escapeHtml(artist.name)}</strong>
                    </div>
                </div>
            </td>
            <td><span class="badge" style="background-color: #${getGenreColor(artist.genre)}">${escapeHtml(artist.genre)}</span></td>
            <td>${formatCompactNumber(artist.followers)}</td>
            <td>${artist.songs_count ?? artist.songs ?? 0}</td>
            <td><span class="status-badge status-${escapeHtml(artist.status)}">${escapeHtml(artist.status)}</span></td>
            <td>
                <span class="badge bg-${getVerificationColor(artist.verification)}">
                    ${escapeHtml(artist.verification)}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action view" data-entity="artist" data-id="${artist.id}" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action edit" data-entity="artist" data-id="${artist.id}" title="Edit Profile">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete" data-entity="artist" data-id="${artist.id}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function populateSongsTable(songs) {
    const tbody = document.getElementById('songsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    songs.forEach(song => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${song.id}</td>
            <td><strong>${escapeHtml(song.title)}</strong></td>
            <td>${escapeHtml(song.artist)}</td>
            <td><span class="badge" style="background-color: #${getGenreColor(song.genre)}">${escapeHtml(song.genre)}</span></td>
            <td>${formatCompactNumber(song.plays)}</td>
            <td>${escapeHtml(song.duration)}</td>
            <td>${escapeHtml(song.date)}</td>
            <td><span class="status-badge status-${escapeHtml(song.status)}">${escapeHtml(getSongDisplayStatus(song))}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action view" data-entity="song" data-id="${song.id}" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function populateTopSongsTable(songs) {
    const tbody = document.getElementById('topSongsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    songs.forEach((song, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${escapeHtml(song.title)}</strong></td>
            <td>${escapeHtml(song.artist)}</td>
            <td>${formatCompactNumber(song.plays)}</td>
            <td>${formatCompactNumber(song.likes)}</td>
            <td>${escapeHtml(song.duration)}</td>
            <td><span class="badge bg-${getSongDisplayStatus(song) === 'published' ? 'success' : 'warning'}">${escapeHtml(getSongDisplayStatus(song))}</span></td>
        `;
        tbody.appendChild(row);
    });
}

function populateTopArtistsList(artists) {
    const tbody = document.getElementById('topArtistsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    artists.slice(0, 5).forEach((artist, index) => {
        const genreColor = typeof getGenreColor === 'function' ? getGenreColor(artist.genre) : '6c757d';
        const verificationColor = typeof getVerificationColor === 'function' ? getVerificationColor(artist.verification) : 'secondary';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${escapeHtml(artist.name)}</strong></td>
            <td><span class="badge" style="background-color: #${genreColor}">${escapeHtml(artist.genre)}</span></td>
            <td>${formatCompactNumber(artist.followers)}</td>
            <td>${formatCompactNumber(artist.songs_count)}</td>
            <td><span class="badge bg-${verificationColor}">${escapeHtml(artist.verification)}</span></td>
        `;
        tbody.appendChild(row);
    });
}

function populateRecentSongsTable(songs) {
    const tbody = document.getElementById('recentSongsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    songs.forEach((song, index) => {
        const genreColor = typeof getGenreColor === 'function' ? getGenreColor(song.genre) : '6c757d';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${escapeHtml(song.title)}</strong></td>
            <td>${escapeHtml(song.artist)}</td>
            <td><span class="badge" style="background-color: #${genreColor}">${escapeHtml(song.genre)}</span></td>
            <td>${formatCompactNumber(song.plays)}</td>
            <td>${escapeHtml(song.date)}</td>
        `;
        tbody.appendChild(row);
    });
}

function setupEventListeners() {
    console.log('Setting up event listeners...');

    // Global search
    const searchInput = document.getElementById('globalSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            const searchTerm = e.target.value.toLowerCase();
            console.log('Searching for:', searchTerm);

            // Filter all tables in the active view
            const activeView = document.querySelector('.dashboard-view.active');
            if (activeView) {
                const tables = activeView.querySelectorAll('table');
                tables.forEach(table => {
                    const rows = table.querySelectorAll('tbody tr');
                    rows.forEach(row => {
                        const text = row.textContent.toLowerCase();
                        row.style.display = text.includes(searchTerm) ? '' : 'none';
                    });
                });
            }
        });
    }

    // Add user button
    document.getElementById('addUserBtn')?.addEventListener('click', function () {
        const modal = new bootstrap.Modal(document.getElementById('addUserModal'));
        modal.show();
    });

    // Add artist button
    document.getElementById('addArtistBtn')?.addEventListener('click', function () {
        populateUserDropdown('artistUserId');
        const modal = new bootstrap.Modal(document.getElementById('addArtistModal'));
        modal.show();
    });

    // Add song button
    document.getElementById('addSongBtn')?.addEventListener('click', function () {
        populateArtistDropdown('songArtist');
        const modal = new bootstrap.Modal(document.getElementById('addSongModal'));
        modal.show();
    });

    // Add subscription button
    document.getElementById('addSubscriptionBtn')?.addEventListener('click', function () {
        populateUserDropdown('planUser');
        const modal = new bootstrap.Modal(document.getElementById('addSubscriptionModal'));
        modal.show();
    });

    // Add subscription plan button
    document.getElementById('addSubscriptionPlanBtn')?.addEventListener('click', function () {
        populateUserDropdown('planUser');
        const modal = new bootstrap.Modal(document.getElementById('addSubscriptionModal'));
        modal.show();
    });

    // Export buttons
    document.getElementById('exportUsersBtn')?.addEventListener('click', function () {
        window.afro.showNotification('Exporting users data...', 'info');
    });

    document.getElementById('exportAllUsersBtn')?.addEventListener('click', function () {
        window.afro.showNotification('Exporting all users data...', 'info');
    });

    document.getElementById('exportArtistsBtn')?.addEventListener('click', function () {
        window.afro.showNotification('Exporting artists data...', 'info');
    });

    document.getElementById('exportSongsBtn')?.addEventListener('click', function () {
        window.afro.showNotification('Exporting songs data...', 'info');
    });

    // Refresh buttons
    document.getElementById('refreshSongsBtn')?.addEventListener('click', function () {
        refreshDashboardData();
    });

    // Notifications button
    document.getElementById('notificationsBtn')?.addEventListener('click', function () {
        const modal = new bootstrap.Modal(document.getElementById('notificationsModal'));
        modal.show();
    });

    // Admin avatar button
    document.getElementById('adminAvatar')?.addEventListener('click', function () {
        const modal = new bootstrap.Modal(document.getElementById('adminProfileModal'));
        modal.show();
    });

    document.getElementById('resetDemoBtn')?.addEventListener('click', function () {
        resetDemoState();
    });

    // Reset add user form when modal is hidden
    document.getElementById('addUserModal')?.addEventListener('hidden.bs.modal', function () {
        document.getElementById('addUserForm').reset();
    });

    // Reset add artist form when modal is hidden
    document.getElementById('addArtistModal')?.addEventListener('hidden.bs.modal', function () {
        document.getElementById('addArtistForm').reset();
    });

    // Reset add subscription form when modal is hidden
    document.getElementById('addSubscriptionModal')?.addEventListener('hidden.bs.modal', function () {
        document.getElementById('addSubscriptionForm').reset();
        const subscriptionId = document.getElementById('subscriptionId');
        if (subscriptionId) subscriptionId.value = '';
        const title = document.getElementById('addSubscriptionModalLabel');
        if (title) title.innerHTML = `<i class="fas fa-crown me-2"></i>${t('Add Subscription')}`;
        const submitBtn = document.querySelector('#addSubscriptionModal .btn-primary');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save me-1"></i>Create Subscription';
            submitBtn.setAttribute('onclick', 'addNewSubscription()');
        }
    });

    // Action buttons delegation
    document.addEventListener('click', function (e) {
        // View buttons
        if (e.target.closest('.btn-action.view')) {
            const button = e.target.closest('.btn-action.view');
            const id = button.dataset.id;
            const entity = (button.dataset.entity || '').toLowerCase();
            const tbodyId = button.closest('tbody')?.id || '';

            if (entity === 'subscription' || tbodyId.includes('Subscription')) {
                viewSubscriptionDetails(id);
            } else if (tbodyId.includes('User')) {
                viewUserDetails(id);
            } else if (tbodyId.includes('Song')) {
                viewSongDetails(id);
            } else if (tbodyId.includes('Artist')) {
                viewArtistDetails(id);
            } else {
                // Fallback authentication check logic if unsure
                const type = button.closest('tr').querySelector('td:nth-child(2)')?.textContent.includes('@') ? 'user' : 'song';
                if (type === 'user') viewUserDetails(id);
                else viewSongDetails(id);
            }
        }

        // Edit buttons
        if (e.target.closest('.btn-action.edit')) {
            const button = e.target.closest('.btn-action.edit');
            const row = button.closest('tr');
            const table = button.closest('table');
            const tbodyId = button.closest('tbody')?.id || '';
            const tableId = table?.id || '';
            const entity = (button.dataset.entity || '').toLowerCase();
            const fallbackEntity = (() => {
                const scope = `${tableId} ${tbodyId}`.toLowerCase();
                if (scope.includes('user')) return 'user';
                if (scope.includes('artist')) return 'artist';
                if (scope.includes('song')) return 'song';
                if (scope.includes('subscription')) return 'subscription';
                return '';
            })();
            const id = button.dataset.id
                || row?.dataset?.id
                || row?.querySelector('td')?.textContent?.trim()
                || '';

            const resolvedEntity = entity || fallbackEntity;

            if (resolvedEntity === 'user') {
                openEditUserModal(id);
            } else if (resolvedEntity === 'artist') {
                openEditArtistModal(id);
            } else if (resolvedEntity === 'song') {
                showNotification('Admin song editing is disabled. Artists manage their own catalog.', 'warning');
            } else if (resolvedEntity === 'subscription') {
                openEditSubscriptionModal(id);
            } else {
                showNotification('Edit action not available for this item', 'warning');
            }
        }

        // Suspend/Activate user
        if (e.target.closest('.btn-action.suspend')) {
            const button = e.target.closest('.btn-action.suspend');
            const id = button.dataset.id;
            const currentStatus = button.dataset.status || 'active';
            toggleUserSuspend(id, currentStatus);
        }

        // Reset password
        if (e.target.closest('.btn-action.reset')) {
            const button = e.target.closest('.btn-action.reset');
            const id = button.dataset.id;
            openResetPasswordModal(id);
        }

        // Delete buttons
        if (e.target.closest('.btn-action.delete')) {
            const button = e.target.closest('.btn-action.delete');
            const id = button.dataset.id;
            const entity = button.dataset.entity || '';
            if (entity === 'song') {
                showNotification('Admin song deletion is disabled. Artists retain ownership of their songs.', 'warning');
                return;
            }
            const row = button.closest('tr');
            const itemName = row.querySelector('td:nth-child(2) strong')?.textContent ||
                row.querySelector('td:nth-child(2)')?.textContent;

            if (confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`)) {
                deleteEntity(entity, id, itemName, row);
            }
        }
    });

    // Search inputs for specific sections
    document.getElementById('userSearch')?.addEventListener('input', function (e) {
        $('#allUsersTable').DataTable().search(e.target.value).draw();
    });

    document.getElementById('artistSearch')?.addEventListener('input', function (e) {
        $('#artistsTable').DataTable().search(e.target.value).draw();
    });

    document.getElementById('songSearch')?.addEventListener('input', function (e) {
        $('#songsTable').DataTable().search(e.target.value).draw();
    });
}

function setupNavigation() {
    console.log('Setting up navigation...');

    const navLinks = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.dashboard-view');

    // Hide all sections except dashboard initially
    sections.forEach(section => {
        if (!section.classList.contains('active')) {
            section.style.display = 'none';
        }
    });

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            const view = this.dataset.view;
            console.log('Navigating to:', view);

            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));

            // Add active class to clicked link
            this.classList.add('active');

            // Hide all sections
            sections.forEach(section => {
                section.style.display = 'none';
                section.classList.remove('active');
            });

            // Show selected section
            const sectionId = view + 'Section';
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.style.display = 'block';
                targetSection.classList.add('active');

                // Update page title
                updatePageTitle(view);

                // Refresh DataTables when switching to a section
                setTimeout(() => {
                    const dataTable = $('#' + sectionId).find('table').DataTable();
                    if (dataTable) {
                        dataTable.columns.adjust().draw();
                        console.log(`🔄 Redrawn tables in ${sectionId}`);
                    }
                }, 200);
            }
        });
    });
}

function updatePageTitle(view) {
    const titleElement = document.querySelector('.top-bar-left h1');
    const titles = {
        'dashboard': 'Admin Dashboard Overview',
        'users': 'User Management',
        'artists': 'Artist Management',
        'songs': 'Song Management',
        'subscriptions': 'Subscription Management',
        'reports': 'Reports & Analytics',
        'settings': 'Settings'
    };

    if (titleElement && titles[view]) {
        titleElement.textContent = titles[view];
    }
}

function animateStats(fetchedStats = null) {
    console.log('Animating stats...');

    const stats = [
        { id: 'totalUsers', target: fetchedStats && fetchedStats.total_users ? parseInt(fetchedStats.total_users.toString().replace(/,/g, '')) : 0, duration: 2000 },
        { id: 'totalArtists', target: fetchedStats && fetchedStats.total_artists ? parseInt(fetchedStats.total_artists.toString().replace(/,/g, '')) : 0, duration: 1500 },
        { id: 'totalSongs', target: fetchedStats && fetchedStats.total_songs ? parseInt(fetchedStats.total_songs.toString().replace(/,/g, '')) : 0, duration: 2500 },
        { id: 'totalRevenue', target: fetchedStats && fetchedStats.total_revenue ? parseInt(fetchedStats.total_revenue.toString().replace(/[^0-9]/g, '')) : 0, duration: 2000 },
        { id: 'activeUsers', target: fetchedStats && fetchedStats.total_users ? Math.round(parseInt(fetchedStats.total_users.toString().replace(/,/g, '')) * 0.8) : 0, duration: 1800 }, // Heuristic remains until active_users is available
        { id: 'artistUsers', target: fetchedStats && fetchedStats.total_artists ? parseInt(fetchedStats.total_artists.toString().replace(/,/g, '')) : 0, duration: 1600 },
        { id: 'pendingUsers', target: fetchedStats ? (fetchedStats.pending_users || 0) : 0, duration: 1200 },
        { id: 'blockedUsers', target: fetchedStats ? (fetchedStats.blocked_users || 0) : 0, duration: 1000 },
        { id: 'totalPlays', target: fetchedStats && fetchedStats.analytics ? fetchedStats.analytics[0] : 0, duration: 2500, isLargeNumber: true },
        { id: 'publishedSongs', target: fetchedStats ? (fetchedStats.published_songs || 0) : 0, duration: 2000 },
        { id: 'pendingSongs', target: fetchedStats ? (fetchedStats.pending_songs || 0) : 0, duration: 1500 },
        { id: 'rejectedSongs', target: fetchedStats ? (fetchedStats.rejected_songs || 0) : 0, duration: 1000 }
    ];

    stats.forEach(stat => {
        const element = document.getElementById(stat.id);
        if (!element) return;

        const start = 0;
        const end = stat.target;
        const duration = stat.duration;
        const startTime = Date.now();

        const updateCounter = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);

            let currentValue = Math.floor(progress * end);

            if (stat.isLargeNumber) {
                if (currentValue >= 1000000) {
                    element.textContent = (currentValue / 1000000).toFixed(1) + 'M';
                } else if (currentValue >= 1000) {
                    element.textContent = (currentValue / 1000).toFixed(0) + 'K';
                } else {
                    element.textContent = formatNumber(currentValue);
                }
            } else if (stat.id === 'totalRevenue') {
                element.textContent = formatNumber(currentValue) + ' FCFA';
            } else {
                element.textContent = formatNumber(currentValue);
            }

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            }
        };

        requestAnimationFrame(updateCounter);
    });
}

function updateDashboardCharts(stats) {
    if (window.userGrowthChart && stats.user_growth) {
        window.userGrowthChart.data.datasets[0].data = stats.user_growth;
        window.userGrowthChart.update();
    }

    if (window.artistDistributionChart && stats.artist_distribution) {
        window.artistDistributionChart.data.labels = stats.artist_distribution_labels;
        window.artistDistributionChart.data.datasets[0].data = stats.artist_distribution;
        window.artistDistributionChart.update();
    }

    if (window.analyticsChart && stats.analytics) {
        // stats.analytics is [streams, downloads, shares, likes, comments]
        window.analyticsChart.data.datasets[0].data = stats.analytics;
        // Should we assume 'Last Month' is 0 or fetch it? Only 'This Month' is provided currently.
        // For now, let's just update 'This Month' (dataset 0)
        window.analyticsChart.update();
    }

    if (window.genreChart && stats.genre_distribution) {
        window.genreChart.data.labels = stats.genre_distribution_labels;
        window.genreChart.data.datasets[0].data = stats.genre_distribution;
        window.genreChart.update();
    }

    if (window.revenueChart && stats.revenue_breakdown) {
        window.revenueChart.data.labels = stats.revenue_breakdown_labels;
        window.revenueChart.data.datasets[0].data = stats.revenue_breakdown;
        window.revenueChart.update();
    }

    if (window.artistVerificationChart && stats.artist_verification) {
        window.artistVerificationChart.data.labels = stats.artist_verification_labels;
        window.artistVerificationChart.data.datasets[0].data = stats.artist_verification;
        window.artistVerificationChart.update();
    }
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

async function refreshDashboardData() {
    console.log('Refreshing dashboard data...');

    // Show loading state
    showNotification('Refreshing dashboard data...', 'info');

    try {
        await loadSampleData();
        showNotification('Dashboard data refreshed successfully!', 'success');
    } catch (error) {
        console.error('Error refreshing dashboard:', error);
        showNotification('Failed to refresh data', 'error');
    }
}

function addRefreshButton() {
    // Add a refresh button to the top bar
    const topBarRight = document.querySelector('.top-bar-right');
    if (topBarRight && !document.getElementById('refreshDashboardBtn')) {
        const refreshBtn = document.createElement('button');
        refreshBtn.id = 'refreshDashboardBtn';
        refreshBtn.className = 'icon-btn';
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
        refreshBtn.title = 'Refresh Dashboard';
        refreshBtn.style.marginRight = '10px';

        refreshBtn.addEventListener('click', function () {
            this.classList.add('rotating');
            refreshDashboardData();
            setTimeout(() => {
                this.classList.remove('rotating');
            }, 2000);
        });

        topBarRight.insertBefore(refreshBtn, topBarRight.firstChild);

        // Add CSS for rotation animation
        const style = document.createElement('style');
        style.textContent = `
            .rotating {
                animation: rotate 1s linear infinite;
            }
            @keyframes rotate {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.custom-notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = `custom-notification alert-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 9999;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease;
    `;

    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#16a34a';
            break;
        case 'error':
            notification.style.backgroundColor = '#dc2626';
            break;
        case 'warning':
            notification.style.backgroundColor = '#ca8a04';
            break;
        default:
            notification.style.backgroundColor = '#2563eb';
    }

    notification.textContent = message;

    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 3000);

    // Add CSS for animations
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Make functions available globally
window.refreshDashboardData = refreshDashboardData;
window.showNotification = showNotification;
window.markAllAsRead = markAllAsRead;
window.saveAdminProfile = saveAdminProfile;
window.saveFromViewModal = saveFromViewModal;
window.addNewUser = addNewUser;
window.addNewArtist = addNewArtist;
window.addNewSong = addNewSong;
window.addNewSubscription = addNewSubscription;

// Modal functions
function markAllAsRead() {
    const unreadNotifications = document.querySelectorAll('.notification-item.unread');
    unreadNotifications.forEach(notification => {
        notification.classList.remove('unread');
        notification.style.borderLeft = 'none';
        notification.style.backgroundColor = 'transparent';
    });
    showNotification('All notifications marked as read', 'success');
}

function saveAdminProfile() {
    // Get form values
    const name = document.getElementById('adminName').value;
    const email = document.getElementById('adminEmail').value;
    const emailNotifications = document.getElementById('emailNotifications').checked;
    const twoFactorAuth = document.getElementById('twoFactorAuth').checked;
    const autoLogout = document.getElementById('autoLogout').checked;

    // Here you would typically send this data to the server
    console.log('Saving admin profile:', {
        name,
        email,
        emailNotifications,
        twoFactorAuth,
        autoLogout
    });

    // Close modal and show success message
    const modal = bootstrap.Modal.getInstance(document.getElementById('adminProfileModal'));
    modal.hide();

    showNotification('Admin profile updated successfully', 'success');
}

// Auto-refresh dashboard every 5 minutes (optional)
function populateSubscriptionPlansTable(subscriptions) {
    const tbody = document.getElementById('subscriptionPlansTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    subscriptions.forEach(sub => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${sub.id}</td>
            <td><strong>${sub.plan_name}</strong></td>
            <td>${sub.user_name}</td>
            <td>FCFA ${sub.amount}</td>
            <td><span class="badge bg-${sub.status === 'active' ? 'success' : sub.status === 'expired' ? 'warning' : 'secondary'}">${sub.status}</span></td>
            <td>${sub.start_date}</td>
            <td>${sub.end_date}</td>
            <td>
                <div class="subscription-action-group">
                    <button class="btn-action subscription-action-btn view" data-entity="subscription" data-id="${sub.id}">View</button>
                    <button class="btn-action subscription-action-btn edit" data-entity="subscription" data-id="${sub.id}">Edit</button>
                    <button class="btn-action subscription-action-btn delete" data-entity="subscription" data-id="${sub.id}">Delete</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function populateRecentSubscriptionsTable(subscriptions) {
    const tbody = document.getElementById('recentSubscriptionsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    subscriptions.forEach(sub => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${sub.plan_name}</strong></td>
            <td>${sub.user_name}</td>
            <td>FCFA ${sub.amount}</td>
            <td>${sub.start_date}</td>
            <td><span class="badge bg-${sub.status === 'active' ? 'success' : 'warning'}">${sub.status}</span></td>
        `;
        tbody.appendChild(row);
    });
}

function populateAnalyticsStats(analytics) {
    // Update analytics stats in the reports section
    const totalUsersStat = document.getElementById('totalUsersStat');
    const totalArtistsStat = document.getElementById('totalArtistsStat');
    const totalSongsStat = document.getElementById('totalSongsStat');
    const totalPlaysStat = document.getElementById('totalPlaysStat');
    const activeSubscriptionsStat = document.getElementById('activeSubscriptionsStat');

    if (totalUsersStat) totalUsersStat.textContent = analytics.total_users || 0;
    if (totalArtistsStat) totalArtistsStat.textContent = analytics.total_artists || 0;
    if (totalSongsStat) totalSongsStat.textContent = analytics.total_songs || 0;
    if (totalPlaysStat) totalPlaysStat.textContent = analytics.total_plays ? (analytics.total_plays / 1000000).toFixed(1) + 'M' : '0';
    if (activeSubscriptionsStat) activeSubscriptionsStat.textContent = analytics.active_subscriptions || 0;
}

function populateRevenueStats(revenue) {
    // Update revenue stats
    const subscriptionRevenue = document.getElementById('subscriptionRevenue');
    const adRevenue = document.getElementById('adRevenue');
    const royaltiesPaid = document.getElementById('royaltiesPaid');
    const totalRevenue = document.getElementById('totalRevenue');

    if (subscriptionRevenue) subscriptionRevenue.textContent = revenue.subscription_revenue ? revenue.subscription_revenue.toLocaleString() + ' XAF' : '0 XAF';
    if (adRevenue) adRevenue.textContent = revenue.ad_revenue ? revenue.ad_revenue.toLocaleString() + ' XAF' : '0 XAF';
    if (royaltiesPaid) royaltiesPaid.textContent = revenue.royalties_paid ? revenue.royalties_paid.toLocaleString() + ' XAF' : '0 XAF';
    if (totalRevenue) totalRevenue.textContent = revenue.total_revenue ? revenue.total_revenue.toLocaleString() + ' XAF' : '0 XAF';
}

function populateReportsTable(reports) {
    const tbody = document.getElementById('reportsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    reports.forEach(report => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${report.id}</td>
            <td>${report.reporter_name || 'Unknown'}</td>
            <td>${report.reported_name || report.song_title || 'N/A'}</td>
            <td><span class="badge bg-info">${report.type}</span></td>
            <td>${report.reason || 'No reason provided'}</td>
            <td><span class="badge bg-${report.status === 'resolved' ? 'success' : report.status === 'pending' ? 'warning' : 'secondary'}">${report.status}</span></td>
            <td>${new Date(report.created_at).toLocaleDateString()}</td>
            <td>
                ${report.status === 'pending' ? `<button class="btn btn-sm btn-success" onclick="resolveReport(${report.id})">Resolve</button>` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
}

function getSampleItem(entity, id) {
    const map = { user: 'users', artist: 'artists', song: 'songs' };
    const list = window.sampleData?.[map[entity]] || [];
    return list.find(item => item.id == id) || null;
}



function openResetPasswordModal(id) {
    document.getElementById('resetPasswordUserId').value = id;
    document.getElementById('resetPasswordNew').value = '';
    document.getElementById('resetPasswordConfirm').value = '';
    const modal = new bootstrap.Modal(document.getElementById('resetPasswordModal'));
    modal.show();
}

// Admin action functions
async function approveArtist(artistId) {
    try {
        const response = await fetch('backend/api/admin.php?action=approve_artist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ artist_id: artistId })
        });
        const data = await response.json();
        if (data.success) {
            window.afro.showNotification('Artist approved successfully', 'success');
            loadSampleData(); // Refresh data
        } else {
            window.afro.showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Error approving artist:', error);
        window.afro.showNotification('Error approving artist', 'error');
    }
}

async function rejectArtist(artistId) {
    try {
        const response = await fetch('backend/api/admin.php?action=reject_artist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ artist_id: artistId })
        });
        const data = await response.json();
        if (data.success) {
            window.afro.showNotification('Artist rejected', 'success');
            loadSampleData(); // Refresh data
        } else {
            window.afro.showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Error rejecting artist:', error);
        window.afro.showNotification('Error rejecting artist', 'error');
    }
}

async function approveSong(songId) {
    try {
        const response = await fetch('backend/api/admin.php?action=approve_song', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ song_id: songId })
        });
        const data = await response.json();
        if (data.success) {
            window.afro.showNotification('Song approved successfully', 'success');
            loadSampleData(); // Refresh data
        } else {
            window.afro.showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Error approving song:', error);
        window.afro.showNotification('Error approving song', 'error');
    }
}

async function rejectSong(songId) {
    try {
        const response = await fetch('backend/api/admin.php?action=reject_song', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ song_id: songId })
        });
        const data = await response.json();
        if (data.success) {
            showNotification('Song rejected', 'success');
            loadSampleData();
        } else {
            showNotification(data.message || 'Error rejecting song', 'error');
        }
    } catch (error) {
        console.error('Error rejecting song:', error);
        showNotification('Error rejecting song', 'error');
    }
}

async function blockSong(songId) {
    try {
        const response = await fetch('backend/api/admin.php?action=block_song', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ song_id: songId })
        });
        const data = await response.json();
        if (data.success) {
            window.afro.showNotification('Song blocked', 'warning');
            loadSampleData(); // Refresh data
        } else {
            window.afro.showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Error blocking song:', error);
        window.afro.showNotification('Error blocking song', 'error');
    }
}

async function toggleUserSuspend(userId, currentStatus) {
    const targetStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    const actionLabel = targetStatus === 'blocked' ? 'suspend' : 'activate';
    if (!confirm(`Are you sure you want to ${actionLabel} this user?`)) {
        return;
    }
    try {
        const response = await fetch('backend/api/admin.php?action=change_status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, status: targetStatus })
        });
        const data = await response.json();
        if (data.success) {
            showNotification(`User ${actionLabel}d successfully`, 'success');
            loadSampleData();
        } else {
            showNotification(data.message || 'Error updating user status', 'error');
        }
    } catch (error) {
        console.error('Error updating user status:', error);
        showNotification('Error updating user status', 'error');
    }
}

async function resetUserPassword() {
    const userId = document.getElementById('resetPasswordUserId').value;
    const password = document.getElementById('resetPasswordNew').value;
    const confirmPassword = document.getElementById('resetPasswordConfirm').value;

    if (!password || password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }

    try {
        const response = await fetch('backend/api/admin.php?action=reset_password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, password })
        });
        const data = await response.json();
        if (data.success) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('resetPasswordModal'));
            modal.hide();
            showNotification('Password reset successfully', 'success');
        } else {
            showNotification(data.message || 'Error resetting password', 'error');
        }
    } catch (error) {
        console.error('Error resetting password:', error);
        showNotification('Error resetting password', 'error');
    }
}



async function saveFromViewModal(entity) {
    let id, data, endpoint;
    const submitBtn = document.querySelector(`.modal.show .btn-primary`);
    const originalText = submitBtn.innerHTML;

    try {
        if (entity === 'song') {
            id = document.getElementById('viewEditSongId').value;
            data = {
                id: id,
                title: document.getElementById('viewEditSongTitle').value,
                artist_id: document.getElementById('viewEditSongArtistId').value,
                genre: document.getElementById('viewEditSongGenre').value,
                duration: document.getElementById('viewEditSongDuration').value,
                status: document.getElementById('viewEditSongStatus').value,
                // Keep these or fetch from existing if not in form
                plays: window.sampleData?.songs?.find(s => s.id == id)?.plays || 0,
                likes: window.sampleData?.songs?.find(s => s.id == id)?.likes || 0,
                file_path: window.sampleData?.songs?.find(s => s.id == id)?.file_path || null,
                cover_art: window.sampleData?.songs?.find(s => s.id == id)?.cover_art || null
            };
            endpoint = 'backend/api/songs.php';
        } else if (entity === 'user') {
            id = document.getElementById('viewEditUserId').value;
            data = {
                id: id,
                name: document.getElementById('viewEditUserName').value,
                email: document.getElementById('viewEditUserEmail').value,
                phone: document.getElementById('viewEditUserPhone').value,
                type: document.getElementById('viewEditUserType').value,
                status: document.getElementById('viewEditUserStatus').value
            };
            endpoint = 'backend/api/users.php';
        } else if (entity === 'artist') {
            id = document.getElementById('viewEditArtistId').value;
            data = {
                id: id,
                name: document.getElementById('viewEditArtistName').value,
                genre: document.getElementById('viewEditArtistGenre').value,
                status: document.getElementById('viewEditArtistStatus').value,
                verification: document.getElementById('viewEditArtistVerification').value,
                bio: window.sampleData?.artists?.find(a => a.id == id)?.bio || '',
                instagram_url: window.sampleData?.artists?.find(a => a.id == id)?.instagram_url || null,
                twitter_url: window.sampleData?.artists?.find(a => a.id == id)?.twitter_url || null,
                facebook_url: window.sampleData?.artists?.find(a => a.id == id)?.facebook_url || null,
                youtube_url: window.sampleData?.artists?.find(a => a.id == id)?.youtube_url || null
            };
            endpoint = 'backend/api/artists.php';
        }

        submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin me-1"></i>${t('Saving...')}`;
        submitBtn.disabled = true;

        const response = await fetch(endpoint, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();

        if (result.success) {
            showNotification(`${entity.charAt(0).toUpperCase() + entity.slice(1)} updated successfully`, 'success');
            bootstrap.Modal.getInstance(document.querySelector('.modal.show')).hide();
            refreshDashboardData();
        } else {
            showNotification(result.message || 'Error updating data', 'error');
        }
    } catch (error) {
        console.error(`Error saving ${entity}:`, error);
        showNotification('Failed to save changes', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function deleteEntity(entity, id, itemName, row) {
    let endpoint = '';
    if (entity === 'user') endpoint = `backend/api/users.php?id=${id}`;
    if (entity === 'artist') endpoint = `backend/api/artists.php?id=${id}`;
    if (entity === 'subscription') endpoint = `backend/api/subscriptions.php?id=${id}`;

    if (!endpoint) {
        row?.remove();
        showNotification(`"${itemName}" has been deleted`, 'success');
        return;
    }

    try {
        const response = await fetch(endpoint, { method: 'DELETE' });
        const data = await response.json();
        if (data.success) {
            showNotification(`"${itemName}" has been deleted`, 'success');
            loadSampleData();
        } else {
            showNotification(data.message || 'Error deleting item', 'error');
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        row.style.opacity = '0.5';
        setTimeout(() => {
            row.remove();
            showNotification(`"${itemName}" has been deleted (local)`, 'success');
        }, 300);
    }
}

async function assignRole(userId, role) {
    try {
        const response = await fetch('backend/api/admin.php?action=assign_role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, role: role })
        });
        const data = await response.json();
        if (data.success) {
            window.afro.showNotification('Role assigned successfully', 'success');
            loadSampleData(); // Refresh data
        } else {
            window.afro.showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Error assigning role:', error);
        window.afro.showNotification('Error assigning role', 'error');
    }
}

async function changeUserStatus(userId, status) {
    try {
        const response = await fetch('backend/api/admin.php?action=change_status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, status: status })
        });
        const data = await response.json();
        if (data.success) {
            window.afro.showNotification('User status updated successfully', 'success');
            loadSampleData(); // Refresh data
        } else {
            window.afro.showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        window.afro.showNotification('Error updating status', 'error');
    }
}

async function resolveReport(reportId) {
    try {
        const response = await fetch('backend/api/admin.php?action=resolve_report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ report_id: reportId })
        });
        const data = await response.json();
        if (data.success) {
            window.afro.showNotification('Report resolved successfully', 'success');
            loadSampleData(); // Refresh data
        } else {
            window.afro.showNotification('Error: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Error resolving report:', error);
        window.afro.showNotification('Error resolving report', 'error');
    }
}

function loadFallbackData() {
    console.log('Loading empty dashboard state...');

    const emptyData = {
        users: [],
        artists: [],
        songs: [],
        subscriptions: [],
        analytics: {},
        revenue: {},
        reports: [],
        settings: {}
    };

    populateUsersTable(emptyData.users);
    populateAllUsersTable(emptyData.users);
    populateArtistsTable(emptyData.artists);
    populateSongsTable(emptyData.songs);
    populateSubscriptionPlansTable(emptyData.subscriptions);
    populateRecentSubscriptionsTable(emptyData.subscriptions);
    populateTopSongsTable(emptyData.songs);
    populateTopArtistsList(emptyData.artists);
    populateRecentSongsTable(emptyData.songs);
    populateAnalyticsStats(emptyData.analytics);
    populateRevenueStats(emptyData.revenue);
    populateReportsTable(emptyData.reports);
    populateSettingsInputs(emptyData.settings);

    window.sampleData = emptyData;

    console.log('Empty dashboard state loaded');
}

// Add New User Function
function addNewUser() {
    const form = document.getElementById('addUserForm');

    // Get form values
    const firstName = document.getElementById('userFirstName').value.trim();
    const lastName = document.getElementById('userLastName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const phone = document.getElementById('userPhone').value.trim();
    const userType = document.getElementById('userType').value;
    const password = document.getElementById('userPassword').value;
    const confirmPassword = document.getElementById('userConfirmPassword').value;
    const isActive = document.getElementById('userActive').checked;

    // Validation
    if (!firstName || !lastName || !email || !userType || !password) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }

    if (password.length < 6) {
        showNotification('Password must be at least 6 characters long', 'error');
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }

    // Create user object (format for backend API)
    const fullName = `${firstName} ${lastName}`;
    const newUser = {
        name: fullName,
        email: email,
        phone: phone || null,
        password: password,
        type: userType,
        status: isActive ? 'active' : 'pending'
    };

    // Show loading state
    const submitBtn = document.querySelector('#addUserModal .btn-primary');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Creating...';
    submitBtn.disabled = true;

    // Make actual API call to create user
    fetch('backend/api/users.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Reset form and close modal
                form.reset();
                const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
                modal.hide();

                // Show success message
                showNotification(`User "${fullName}" has been created successfully!`, 'success');

                // Refresh the users table
                refreshDashboardData();
            } else {
                // Show error message
                showNotification(data.message || 'Error creating user', 'error');
            }
        })
        .catch(error => {
            console.error('API Error:', error);
            // Fallback: Add user to local sample data for demonstration
            console.log('API not available, adding user to local data for demonstration');

            // Add user to sample data if it exists
            if (window.sampleData && window.sampleData.users) {
                const newUserId = Math.max(...window.sampleData.users.map(u => u.id)) + 1;
                const localUser = {
                    id: newUserId,
                    name: fullName,
                    email: email,
                    phone: phone || '',
                    type: userType,
                    status: isActive ? 'active' : 'pending',
                    joined: new Date().toISOString().split('T')[0],
                    avatar: fullName.split(' ').map(n => n[0]).join('').toUpperCase()
                };
                window.sampleData.users.unshift(localUser);

                // Note: Data persistence is now handled server-side
            }

            // Reset form and close modal
            form.reset();
            const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
            modal.hide();

            // Show success message
            showNotification(`User "${fullName}" has been created successfully!`, 'success');

            // Refresh the users table
            refreshDashboardData();
        })
        .finally(() => {
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
}

// Helper Functions for Dropdowns
function populateUserDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;

    dropdown.innerHTML = '<option value="">Select User</option>';

    // Get users from sample data or API
    const users = window.sampleData?.users || [];
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.name;
        dropdown.appendChild(option);
    });
}

function populateArtistDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;

    dropdown.innerHTML = '<option value="">Select Artist</option>';

    // Get artists from sample data or API
    const artists = window.sampleData?.artists || [];
    artists.forEach(artist => {
        const option = document.createElement('option');
        option.value = artist.id;
        option.textContent = artist.name;
        dropdown.appendChild(option);
    });
}

// Add New Artist Function
function addNewArtist() {
    const form = document.getElementById('addArtistForm');

    // Get form values
    const name = document.getElementById('artistName').value.trim();
    const genre = document.getElementById('artistGenre').value;
    const userId = document.getElementById('artistUserId').value;
    const bio = document.getElementById('artistBio').value.trim();
    // Validation
    if (!name || !genre) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    // Create artist object
    const newArtist = {
        user_id: userId || null,
        name: name,
        genre: genre,
        followers: 0,
        songs_count: 0,
        status: 'pending',
        verification: 'pending',
        bio: bio
    };

    // Show loading state
    const submitBtn = document.querySelector('#addArtistModal .btn-primary');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Creating...';
    submitBtn.disabled = true;

    // Make API call
    fetch('backend/api/artists.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(newArtist)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Reset form and close modal
                form.reset();
                const modal = bootstrap.Modal.getInstance(document.getElementById('addArtistModal'));
                modal.hide();

                // Show success message
                showNotification(`Artist "${name}" has been created successfully!`, 'success');

                // Refresh the dashboard
                refreshDashboardData();
            } else {
                showNotification(data.message || 'Error creating artist', 'error');
            }
        })
        .catch(error => {
            console.error('API Error:', error);
            // Fallback: Add artist to local sample data
            if (window.sampleData && window.sampleData.artists) {
                const newArtistId = Math.max(...window.sampleData.artists.map(a => a.id)) + 1;
                const localArtist = {
                    id: newArtistId,
                    user_id: userId || null,
                    name: name,
                    genre: genre,
                    followers: 0,
                    songs_count: 0,
                    status: 'pending',
                    verification: 'pending',
                    bio: bio
                };
                window.sampleData.artists.unshift(localArtist);
                // Note: Data persistence is now handled server-side
            }

            // Reset form and close modal
            form.reset();
            const modal = bootstrap.Modal.getInstance(document.getElementById('addArtistModal'));
            modal.hide();

            // Show success message
            showNotification(`Artist "${name}" has been created successfully!`, 'success');

            // Refresh the dashboard
            refreshDashboardData();
        })
        .finally(() => {
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
}

// Add New Song Function
function addNewSong() {
    const form = document.getElementById('addSongForm');

    // Get form values
    const title = document.getElementById('songTitle').value.trim();
    const artistId = document.getElementById('songArtist').value;
    const genre = document.getElementById('songGenre').value;
    const duration = document.getElementById('songDuration').value;
    const status = document.getElementById('songStatus').value;

    // Validation
    if (!title || !artistId || !genre || !duration) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    // Validate duration format (MM:SS)
    const durationRegex = /^\d{1,2}:\d{2}$/;
    if (!durationRegex.test(duration)) {
        showNotification('Duration must be in MM:SS format (e.g., 03:45)', 'error');
        return;
    }

    // Create song object
    const newSong = {
        title: title,
        artist_id: artistId,
        genre: genre,
        duration: duration,
        plays: 0,
        likes: 0,
        file_path: null,
        cover_art: null,
        status: status
    };

    // Show loading state
    const submitBtn = document.querySelector('#addSongModal .btn-primary');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Creating...';
    submitBtn.disabled = true;

    // Make API call
    fetch('backend/api/songs.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSong)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Reset form and close modal
                form.reset();
                const modal = bootstrap.Modal.getInstance(document.getElementById('addSongModal'));
                modal.hide();

                // Show success message
                showNotification(`Song "${title}" has been created successfully!`, 'success');

                // Refresh the dashboard
                refreshDashboardData();
            } else {
                showNotification(data.message || 'Error creating song', 'error');
            }
        })
        .catch(error => {
            console.error('API Error:', error);
            // Fallback: Add song to local sample data
            if (window.sampleData && window.sampleData.songs) {
                const newSongId = Math.max(...window.sampleData.songs.map(s => s.id)) + 1;
                const localSong = {
                    id: newSongId,
                    title: title,
                    artist_id: artistId,
                    genre: genre,
                    duration: duration,
                    plays: 0,
                    likes: 0,
                    file_path: null,
                    cover_art: null,
                    status: status
                };
                window.sampleData.songs.unshift(localSong);
                // Note: Data persistence is now handled server-side
            }

            // Reset form and close modal
            form.reset();
            const modal = bootstrap.Modal.getInstance(document.getElementById('addSongModal'));
            modal.hide();

            // Show success message
            showNotification(`Song "${title}" has been created successfully!`, 'success');

            // Refresh the dashboard
            refreshDashboardData();
        })
        .finally(() => {
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
}

// Add New Subscription Function
function addNewSubscription() {
    const form = document.getElementById('addSubscriptionForm');

    // Get form values
    const planName = document.getElementById('planName').value.trim();
    const amount = parseFloat(document.getElementById('planAmount').value);
    const userId = document.getElementById('planUser').value;
    const startDate = document.getElementById('planStartDate').value;
    const endDate = document.getElementById('planEndDate').value;
    // Validation
    if (!planName || Number.isNaN(amount) || !userId || !startDate || !endDate) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
        showNotification('End date must be after start date', 'error');
        return;
    }

    // Create subscription object
    const newSubscription = {
        user_id: userId,
        plan_name: planName,
        amount: amount,
        status: 'active',
        start_date: startDate,
        end_date: endDate
    };

    // Show loading state
    const submitBtn = document.querySelector('#addSubscriptionModal .btn-primary');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Creating...';
    submitBtn.disabled = true;

    // Make API call
    fetch('backend/api/subscriptions.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSubscription)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Reset form and close modal
                form.reset();
                const modal = bootstrap.Modal.getInstance(document.getElementById('addSubscriptionModal'));
                modal.hide();

                // Show success message
                showNotification(`Subscription "${planName}" has been created successfully!`, 'success');

                // Refresh the dashboard
                refreshDashboardData();
            } else {
                showNotification(data.message || 'Error creating subscription', 'error');
            }
        })
        .catch(error => {
            console.error('API Error:', error);
            // Fallback: Add subscription to local sample data
            if (window.sampleData && window.sampleData.subscriptions) {
                const newSubId = Math.max(...window.sampleData.subscriptions.map(s => s.id)) + 1;
                const localSubscription = {
                    id: newSubId,
                    user_id: userId,
                    plan_name: planName,
                    amount: amount,
                    status: 'active',
                    start_date: startDate,
                    end_date: endDate
                };
                window.sampleData.subscriptions.unshift(localSubscription);
                // Note: Data persistence is now handled server-side
            }

            // Reset form and close modal
            form.reset();
            const modal = bootstrap.Modal.getInstance(document.getElementById('addSubscriptionModal'));
            modal.hide();

            // Show success message
            showNotification(`Subscription "${planName}" has been created successfully!`, 'success');

            // Refresh the dashboard
            refreshDashboardData();
        })
        .finally(() => {
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
}

async function openEditSubscriptionModal(subscriptionId) {
    try {
        let subscription = null;
        if (window.sampleData && window.sampleData.subscriptions) {
            subscription = window.sampleData.subscriptions.find(s => s.id == subscriptionId);
        }

        if (!subscription) {
            const response = await fetch(`backend/api/subscriptions.php?id=${subscriptionId}`);
            const data = await response.json();
            if (data.success) {
                subscription = Array.isArray(data.data) ? data.data[0] : data.data;
            }
        }

        if (!subscription) {
            showNotification('Subscription not found', 'error');
            return;
        }

        populateUserDropdown('planUser');
        document.getElementById('subscriptionId').value = subscription.id;
        document.getElementById('planUser').value = subscription.user_id;
        document.getElementById('planName').value = subscription.plan_name || 'Free';
        document.getElementById('planAmount').value = subscription.amount || 0;
        document.getElementById('planStartDate').value = subscription.start_date || '';
        document.getElementById('planEndDate').value = subscription.end_date || '';

        const title = document.getElementById('addSubscriptionModalLabel');
        if (title) title.innerHTML = `<i class="fas fa-pen me-2"></i>${t('Edit Subscription')}`;

        const submitBtn = document.querySelector('#addSubscriptionModal .btn-primary');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save me-1"></i>Save Changes';
            submitBtn.setAttribute('onclick', 'saveSubscriptionEdit()');
        }

        const modal = new bootstrap.Modal(document.getElementById('addSubscriptionModal'));
        modal.show();
    } catch (error) {
        console.error('Error opening subscription edit modal:', error);
        showNotification('Error loading subscription details', 'error');
    }
}

function saveSubscriptionEdit() {
    const subscriptionId = document.getElementById('subscriptionId').value;
    const planName = document.getElementById('planName').value.trim();
    const amount = parseFloat(document.getElementById('planAmount').value);
    const userId = document.getElementById('planUser').value;
    const startDate = document.getElementById('planStartDate').value;
    const endDate = document.getElementById('planEndDate').value;

    if (!subscriptionId || !planName || Number.isNaN(amount) || !userId || !startDate || !endDate) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
        showNotification('End date must be after start date', 'error');
        return;
    }

    const payload = {
        id: subscriptionId,
        user_id: userId,
        plan_name: planName,
        amount,
        status: 'active',
        start_date: startDate,
        end_date: endDate
    };

    const submitBtn = document.querySelector('#addSubscriptionModal .btn-primary');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Saving...';
    submitBtn.disabled = true;

    fetch('backend/api/subscriptions.php', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                showNotification(data.message || 'Error updating subscription', 'error');
                return;
            }

            const modal = bootstrap.Modal.getInstance(document.getElementById('addSubscriptionModal'));
            modal.hide();
            showNotification(`Subscription "${planName}" updated successfully!`, 'success');
            refreshDashboardData();
        })
        .catch(error => {
            console.error('Subscription update error:', error);
            showNotification('Error updating subscription', 'error');
        })
        .finally(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
}

// View User Details
async function viewUserDetails(id) {
    try {
        let user = null;
        // Try to find in loaded data first
        if (window.sampleData && window.sampleData.users) {
            user = window.sampleData.users.find(u => u.id == id);
        }

        // If not found, fetch from API
        if (!user) {
            const response = await fetch(`backend/api/users.php?id=${id}`);
            const data = await response.json();
            if (data.success) user = data.data;
        }

        if (user) {
            const modalBody = document.getElementById('viewUserModalBody');
            modalBody.innerHTML = `
                <div class="text-center mb-4">
                    <div style="width: 100px; height: 100px; background-color: var(--primary-color); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 36px; margin: 0 auto; font-weight: bold; overflow: hidden;">
                        ${user.avatar && (user.avatar.includes('/') || user.avatar.includes('.'))
                    ? `<img src="${user.avatar}" alt="${user.name}" style="width: 100%; height: 100%; object-fit: cover;">`
                    : (user.avatar || user.name.charAt(0))}
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="small">NAME</label>
                        <input type="text" class="form-control" id="viewEditUserName" value="${user.name}" readonly>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="small">EMAIL</label>
                        <input type="email" class="form-control" id="viewEditUserEmail" value="${user.email}" readonly>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="small">PHONE</label>
                        <input type="text" class="form-control" id="viewEditUserPhone" value="${user.phone || ''}" readonly>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="small">TYPE</label>
                        <select class="form-control" id="viewEditUserType">
                            <option value="fan" ${user.type === 'fan' ? 'selected' : ''}>Fan</option>
                            <option value="artist" ${user.type === 'artist' ? 'selected' : ''}>Artist</option>
                            <option value="admin" ${user.type === 'admin' ? 'selected' : ''}>Admin</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="small">STATUS</label>
                        <select class="form-control" id="viewEditUserStatus">
                            <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="pending" ${user.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="blocked" ${user.status === 'blocked' ? 'selected' : ''}>Blocked</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="small">USER ID</label>
                        <div class="fw-bold">#${user.id}</div>
                        <input type="hidden" id="viewEditUserId" value="${user.id}">
                    </div>
                </div>
            `;
            const modal = document.getElementById('viewUserModal');
            const modalFooter = modal.querySelector('.modal-footer');
            modalFooter.innerHTML = `
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary" onclick="saveFromViewModal('user')">
                    <i class="fas fa-save me-1"></i>Save Changes
                </button>
            `;
            const bootstrapModal = new bootstrap.Modal(modal);
            bootstrapModal.show();
        } else {
            showNotification('User not found', 'error');
        }
    } catch (error) {
        console.error('Error viewing user:', error);
        showNotification('Error loading user details', 'error');
    }
}

// View Song Details
async function viewSongDetails(id) {
    try {
        let song = null;
        // Try to find in loaded data first
        if (window.sampleData && window.sampleData.songs) {
            song = window.sampleData.songs.find(s => s.id == id);
        }

        // If not found, fetch from API
        if (!song) {
            const response = await fetch(`backend/api/songs.php?id=${id}`);
            const data = await response.json();
            if (data.success) song = data.data;
        }

        if (song) {
            const modalBody = document.getElementById('viewSongModalBody');
            modalBody.innerHTML = `
                <div class="row">
                    <div class="col-md-4 text-center mb-3">
                        <div style="width: 100%; aspect-ratio: 1; background: linear-gradient(135deg, var(--accent-primary), var(--accent-hover)); border-radius: 8px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                            <i class="fas fa-music fa-4x" style="color: rgba(255,255,255,0.3);"></i>
                        </div>
                        <button class="btn btn-sm btn-secondary mt-3" style="width: 100%;" onclick="playSongInModal(${song.id})">
                            <i class="fas fa-play me-1"></i> Play Song
                        </button>
                    </div>
                    <div class="col-md-8">
                        <div class="mb-4">
                            <label class="small">SONG TITLE</label>
                            <input type="text" class="form-control form-control-lg" id="viewEditSongTitle" value="${song.title}" readonly style="background-color: #0a0a1e; border: 1px solid #333; cursor: not-allowed;">
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="small">ARTIST</label>
                                <input type="text" class="form-control" value="${song.artist || song.artist_name}" readonly style="background-color: #0a0a1e; border: 1px solid #333; cursor: not-allowed;">
                                <input type="hidden" id="viewEditSongArtistId" value="${song.artist_id}">
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="small">GENRE</label>
                                <select class="form-control" id="viewEditSongGenre" disabled style="background-color: #0a0a1e; border: 1px solid #333; cursor: not-allowed;">
                                    <option value="Makossa" ${song.genre === 'Makossa' ? 'selected' : ''}>Makossa</option>
                                    <option value="Bikutsi" ${song.genre === 'Bikutsi' ? 'selected' : ''}>Bikutsi</option>
                                    <option value="Afrobeat" ${song.genre === 'Afrobeat' ? 'selected' : ''}>Afrobeat</option>
                                    <option value="Assiko" ${song.genre === 'Assiko' ? 'selected' : ''}>Assiko</option>
                                    <option value="Traditional" ${song.genre === 'Traditional' ? 'selected' : ''}>Traditional</option>
                                    <option value="Gospel" ${song.genre === 'Gospel' ? 'selected' : ''}>Gospel</option>
                                    <option value="Bend Skin" ${song.genre === 'Bend Skin' ? 'selected' : ''}>Bend Skin</option>
                                    <option value="Hip Hop" ${song.genre === 'Hip Hop' ? 'selected' : ''}>Hip Hop</option>
                                    <option value="R&B" ${song.genre === 'R&B' ? 'selected' : ''}>R&B</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="small">DURATION</label>
                                <input type="text" class="form-control" id="viewEditSongDuration" value="${song.duration || ''}" placeholder="4:32" readonly style="background-color: #0a0a1e; border: 1px solid #333; cursor: not-allowed;">
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="small">STATUS</label>
                                <select class="form-control" id="viewEditSongStatus" disabled style="background-color: #0a0a1e; border: 1px solid #333; cursor: not-allowed;">
                                    <option value="active" ${song.status === 'active' ? 'selected' : ''}>Active/Published</option>
                                    <option value="pending" ${song.status === 'pending' ? 'selected' : ''}>Pending Review</option>
                                    <option value="blocked" ${song.status === 'blocked' ? 'selected' : ''}>Blocked</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="row mt-3 pt-3" style="border-top: 1px solid #333;">
                            <div class="col-6 mb-2">
                                <label class="small">Total Plays</label>
                                <div class="fw-bold text-success">${song.plays || 0}</div>
                            </div>
                            <div class="col-6 mb-2">
                                <label class="small">Upload Date</label>
                                <div class="fw-bold text-white">${song.date || song.created_at || 'N/A'}</div>
                            </div>
                            <div class="col-6 mb-2">
                                <label class="small">Song ID</label>
                                <div class="fw-bold text-white">#${song.id}</div>
                                <input type="hidden" id="viewEditSongId" value="${song.id}">
                            </div>
                            <div class="col-12 mt-2 mb-2">
                                <label class="small">Preview Audio</label>
                                <div class="w-100 mt-1">
                                    ${song.file_path ? `<audio controls class="w-100" style="height: 40px; outline: none;"><source src="${song.file_path}" type="audio/mpeg"></audio>` : '<span class="text-muted small">No audio file available</span>'}
                                </div>
                                <div class="fw-bold text-white mt-1" style="font-size: 11px; word-break: break-all;">Path: ${song.file_path || 'Not uploaded'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Admin can review song details but cannot edit artist-owned metadata.
            const modal = document.getElementById('viewSongModal');
            const modalFooter = modal.querySelector('.modal-footer');
            modalFooter.innerHTML = `
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            `;

            const bootstrapModal = new bootstrap.Modal(modal);
            bootstrapModal.show();
        } else {
            showNotification('Song not found', 'error');
        }
    } catch (error) {
        console.error('Error viewing song:', error);
        showNotification('Error loading song details', 'error');
    }
}

// View Artist Details
async function viewArtistDetails(id) {
    try {
        let artist = null;
        // Try to find in loaded data first
        if (window.sampleData && window.sampleData.artists) {
            artist = window.sampleData.artists.find(a => a.id == id);
        }

        // If not found, fetch from API
        if (!artist) {
            const response = await fetch(`backend/api/artists.php?id=${id}`);
            const data = await response.json();
            if (data.success) artist = data.data;
        }

        if (artist) {
            const modalBody = document.getElementById('viewArtistModalBody');
            modalBody.innerHTML = `
                <div class="text-center mb-4">
                    <div style="width: 100px; height: 100px; background-color: var(--secondary-color); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 36px; margin: 0 auto; font-weight: bold; overflow: hidden;">
                        ${(artist.image || artist.photo)
                    ? `<img src="${artist.image || artist.photo}" alt="${artist.name}" style="width: 100%; height: 100%; object-fit: cover;">`
                    : artist.name.charAt(0)}
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="small">NAME</label>
                        <input type="text" class="form-control" id="viewEditArtistName" value="${artist.name}" readonly style="background-color: #0a0a1e; border: 1px solid #333; cursor: not-allowed;">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="small">GENRE</label>
                        <input type="text" class="form-control" id="viewEditArtistGenre" value="${artist.genre}" readonly style="background-color: #0a0a1e; border: 1px solid #333; cursor: not-allowed;">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="small">VERIFICATION</label>
                        <select class="form-control" id="viewEditArtistVerification">
                            <option value="pending" ${artist.verification === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="approved" ${artist.verification === 'approved' ? 'selected' : ''}>Approved</option>
                            <option value="rejected" ${artist.verification === 'rejected' ? 'selected' : ''}>Rejected</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="small">STATUS</label>
                        <select class="form-control" id="viewEditArtistStatus">
                            <option value="verified" ${artist.status === 'verified' ? 'selected' : ''}>Verified</option>
                            <option value="pending" ${artist.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="rejected" ${artist.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="small">FOLLOWERS</label>
                        <div class="fw-bold">${artist.followers}</div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="small">ARTIST ID</label>
                        <div class="fw-bold">#${artist.id}</div>
                        <input type="hidden" id="viewEditArtistId" value="${artist.id}">
                    </div>
                </div>
            `;
            const modal = document.getElementById('viewArtistModal');
            const modalFooter = modal.querySelector('.modal-footer');
            modalFooter.innerHTML = `
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary" onclick="saveFromViewModal('artist')">
                    <i class="fas fa-save me-1"></i>Save Changes
                </button>
            `;
            const bootstrapModal = new bootstrap.Modal(modal);
            bootstrapModal.show();
        } else {
            showNotification('Artist not found', 'error');
        }
    } catch (error) {
        console.error('Error viewing artist:', error);
        showNotification('Error loading artist details', 'error');
    }
}

// View Subscription Details
async function viewSubscriptionDetails(id) {
    try {
        let sub = null;
        // Try to find in loaded data first
        if (window.sampleData && window.sampleData.subscriptions) {
            sub = window.sampleData.subscriptions.find(s => s.id == id);
        }

        // If not found, fetch from API
        if (!sub) {
            const response = await fetch(`backend/api/subscriptions.php?id=${id}`);
            const data = await response.json();
            if (data.success) sub = data.data;
        }

        if (sub) {
            const modalBody = document.getElementById('viewSubscriptionModalBody');
            modalBody.innerHTML = `
                <div class="text-center mb-4">
                    <div class="display-4 text-primary mb-2"><i class="fas fa-crown"></i></div>
                    <h4>${sub.plan_name}</h4>
                    <div class="h3">FCFA ${sub.amount}</div>
                    <span class="badge bg-${sub.status === 'active' ? 'success' : 'secondary'}">${sub.status}</span>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="small">Subscriber</label>
                        <div class="fw-bold">${sub.user_name}</div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="small">Subscription ID</label>
                        <div class="fw-bold">#${sub.id}</div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="small">Start Date</label>
                        <div class="fw-bold">${sub.start_date}</div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="small">End Date</label>
                        <div class="fw-bold">${sub.end_date}</div>
                    </div>
                </div>
            `;
            const modal = new bootstrap.Modal(document.getElementById('viewSubscriptionModal'));
            modal.show();
        } else {
            showNotification('Subscription not found', 'error');
        }
    } catch (error) {
        console.error('Error viewing subscription:', error);
        showNotification('Error loading subscription details', 'error');
    }
}

// ==================================================
// Edit Modal Functions
// ==================================================

/**
 * Open edit user modal and populate with current data
 */
async function openEditUserModal(userId) {
    try {
        let user = null;
        // Try to find in loaded data first
        if (window.sampleData && window.sampleData.users) {
            user = window.sampleData.users.find(u => u.id == userId);
        }

        if (user) {
            document.getElementById('editUserId').value = user.id;
            document.getElementById('editUserName').value = user.name || '';
            document.getElementById('editUserEmail').value = user.email || '';
            document.getElementById('editUserPhone').value = user.phone || '';
            document.getElementById('editUserType').value = user.type || 'fan';
            document.getElementById('editUserStatus').value = user.status || 'active';

            const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
            modal.show();
        } else {
            showNotification('User not found', 'error');
        }
    } catch (error) {
        console.error('Error opening edit user modal:', error);
        showNotification('Error loading user data', 'error');
    }
}

/**
 * Save user edits via API
 */
async function saveUserEdit() {
    try {
        const userId = document.getElementById('editUserId').value;
        const userData = {
            id: userId,
            type: document.getElementById('editUserType').value,
            status: document.getElementById('editUserStatus').value
        };

        const response = await fetch('backend/api/users.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (data.success) {
            showNotification('User updated successfully', 'success');
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
            modal.hide();
            // Refresh data
            await refreshDashboardData();
        } else {
            showNotification(data.message || 'Failed to update user', 'error');
        }
    } catch (error) {
        console.error('Error saving user:', error);
        showNotification('Error updating user', 'error');
    }
}

/**
 * Open edit artist modal and populate with current data
 */
async function openEditArtistModal(artistId) {
    try {
        let artist = null;
        // Try to find in loaded data first
        if (window.sampleData && window.sampleData.artists) {
            artist = window.sampleData.artists.find(a => a.id == artistId);
        }

        if (artist) {
            document.getElementById('editArtistId').value = artist.id;
            document.getElementById('editArtistName').value = artist.name || '';
            document.getElementById('editArtistGenre').value = artist.genre || 'Afrobeat';
            document.getElementById('editArtistStatus').value = artist.status || 'pending';
            
            if (document.getElementById('editArtistVerification')) document.getElementById('editArtistVerification').value = artist.verification || 'pending';
            if (document.getElementById('editArtistBio')) document.getElementById('editArtistBio').value = artist.bio || '';
            if (document.getElementById('editArtistInstagram')) document.getElementById('editArtistInstagram').value = artist.instagram_url || '';
            if (document.getElementById('editArtistTwitter')) document.getElementById('editArtistTwitter').value = artist.twitter_url || '';
            if (document.getElementById('editArtistFacebook')) document.getElementById('editArtistFacebook').value = artist.facebook_url || '';
            if (document.getElementById('editArtistYoutube')) document.getElementById('editArtistYoutube').value = artist.youtube_url || '';

            const modal = new bootstrap.Modal(document.getElementById('editArtistModal'));
            modal.show();
        } else {
            showNotification('Artist not found', 'error');
        }
    } catch (error) {
        console.error('Error opening edit artist modal:', error);
        showNotification('Error loading artist data', 'error');
    }
}

/**
 * Save artist edits via API
 */
async function saveArtistEdit() {
    try {
        const artistId = document.getElementById('editArtistId').value;
        const artistData = {
            id: artistId,
            name: document.getElementById('editArtistName').value,
            genre: document.getElementById('editArtistGenre').value,
            status: document.getElementById('editArtistStatus').value
        };

        if (document.getElementById('editArtistVerification')) artistData.verification = document.getElementById('editArtistVerification').value;
        if (document.getElementById('editArtistBio')) artistData.bio = document.getElementById('editArtistBio').value;
        if (document.getElementById('editArtistInstagram')) artistData.instagram_url = document.getElementById('editArtistInstagram').value;
        if (document.getElementById('editArtistTwitter')) artistData.twitter_url = document.getElementById('editArtistTwitter').value;
        if (document.getElementById('editArtistFacebook')) artistData.facebook_url = document.getElementById('editArtistFacebook').value;
        if (document.getElementById('editArtistYoutube')) artistData.youtube_url = document.getElementById('editArtistYoutube').value;

        const response = await fetch('backend/api/artists.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(artistData)
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Artist updated successfully', 'success');
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editArtistModal'));
            modal.hide();
            // Refresh data
            await refreshDashboardData();
        } else {
            showNotification(data.message || 'Failed to update artist', 'error');
        }
    } catch (error) {
        console.error('Error saving artist:', error);
        showNotification('Error updating artist', 'error');
    }
}

/**
 * Open edit song modal and populate with current data
 */
async function openEditSongModal(songId) {
    try {
        let song = null;
        // Try to find in loaded data first
        if (window.sampleData && window.sampleData.songs) {
            song = window.sampleData.songs.find(s => s.id == songId);
        }

        if (song) {
            document.getElementById('editSongId').value = song.id;
            document.getElementById('editSongArtistId').value = song.artist_id;
            document.getElementById('editSongTitle').value = song.title || '';
            document.getElementById('editSongArtist').value = song.artist_name || '';
            document.getElementById('editSongGenre').value = song.genre || 'Afrobeat';
            document.getElementById('editSongDuration').value = song.duration || '';
            document.getElementById('editSongStatus').value = song.status || 'pending';

            const modal = new bootstrap.Modal(document.getElementById('editSongModal'));
            modal.show();
        } else {
            showNotification('Song not found', 'error');
        }
    } catch (error) {
        console.error('Error opening edit song modal:', error);
        showNotification('Error loading song data', 'error');
    }
}

/**
 * Save song edits via API
 */
async function saveSongEdit() {
    try {
        const songId = document.getElementById('editSongId').value;
        const artistId = document.getElementById('editSongArtistId').value;
        const songData = {
            id: songId,
            title: document.getElementById('editSongTitle').value,
            artist_id: artistId, // Keep artist unchanged (read-only field)
            genre: document.getElementById('editSongGenre').value,
            duration: document.getElementById('editSongDuration').value,
            status: document.getElementById('editSongStatus').value
        };

        const response = await fetch('backend/api/songs.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(songData)
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Song updated successfully', 'success');
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editSongModal'));
            modal.hide();
            // Refresh data
            await refreshDashboardData();
        } else {
            showNotification(data.message || 'Failed to update song', 'error');
        }
    } catch (error) {
        console.error('Error saving song:', error);
        showNotification('Error updating song', 'error');
    }
}


/**
 * Resets the platform to its initial demo state.
 * This triggers a backend script that refreshes all seed data.
 */
async function resetDemoState() {
    const isConfirmed = confirm(
        'Are you sure you want to reset the platform state? \n\n' +
        'This will: \n' +
        '- Reset all stats and analytics\n' +
        '- Restore demo user accounts\n' +
        '- Refresh the default song library\n' +
        '- Clear recent activity logs\n\n' +
        'This action cannot be undone.'
    );

    if (!isConfirmed) return;

    const btn = document.getElementById('resetDemoBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Resetting Platform...';
    }

    try {
        const response = await fetch('backend/api/admin.php?action=reset_demo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.success) {
            window.afro.showNotification('🎉 Platform demo state has been successfully reset.', 'success');
            // Refresh the page to show new data
            window.location.reload();
        } else {
            throw new Error(result.message || 'Failed to reset demo state');
        }
    } catch (error) {
        console.error('Reset Error:', error);
        window.afro.showNotification('Error: ' + error.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sync-alt me-1"></i> Reset Demo State';
        }
    }
}
