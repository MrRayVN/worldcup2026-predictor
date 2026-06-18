/* ═══════════════════════════════════════════════════════════════════════════════
   WC2026 PREDICTOR - MAIN APPLICATION CONTROLLER
   Ties together: WC2026_DATA, PredictionEngine, ChartRenderer, DataService
   ═══════════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  class App {
    constructor() {
      // Core dependencies (loaded via script tags before this file)
      this.data = window.WC2026_DATA || {};
      this.engine = null;
      this.dataService = null;
      this.currentTab = 'dashboard';
      this.selectedMatch = null;
      this.countdownInterval = null;
      this.autoRefreshInterval = null;

      // State
      this.isLoading = true;
      this.matchesData = [];
      this.standingsData = {};
      this.tournamentStats = {};
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════

    async init() {
      console.log('[App] 🚀 Khởi tạo WC2026 Predictor...');

      // SAFETY: Always hide loading after max 5 seconds, no matter what
      const safetyTimer = setTimeout(() => {
        console.warn('[App] Safety timeout - force hiding loading overlay');
        this.hideLoading();
      }, 5000);

      try {
        this.updateLoadingStatus('Đang khởi tạo hệ thống...');
        this.updateLoadingProgress(10);

        // Initialize services
        try {
          this.dataService = new window.DataService();
        } catch (e) {
          console.error('[App] DataService init error:', e);
          this.dataService = null;
        }
        this.updateLoadingProgress(20);

        // Initialize prediction engine
        try {
          if (window.PredictionEngine) {
            this.engine = new window.PredictionEngine(this.data);
            this.updateLoadingStatus('Mô hình AI đã sẵn sàng');
          } else {
            console.warn('[App] PredictionEngine không tìm thấy');
          }
        } catch (e) {
          console.error('[App] PredictionEngine init error:', e);
        }
        this.updateLoadingProgress(40);

        // Fetch data - each in its own try-catch
        try {
          this.updateLoadingStatus('Đang tải dữ liệu trận đấu...');
          if (this.dataService) {
            this.matchesData = await this.dataService.fetchMatches();
          }
        } catch (e) {
          console.error('[App] fetchMatches error:', e);
          this.matchesData = [];
        }
        this.updateLoadingProgress(60);

        try {
          this.updateLoadingStatus('Đang tải bảng xếp hạng...');
          if (this.dataService) {
            this.standingsData = await this.dataService.fetchStandings();
          }
        } catch (e) {
          console.error('[App] fetchStandings error:', e);
          this.standingsData = {};
        }
        this.updateLoadingProgress(75);

        try {
          this.updateLoadingStatus('Đang tính toán thống kê...');
          if (this.dataService) {
            this.tournamentStats = await this.dataService.getTournamentStats();
          }
        } catch (e) {
          console.error('[App] getTournamentStats error:', e);
          this.tournamentStats = {};
        }
        this.updateLoadingProgress(85);

        // Setup UI
        this.updateLoadingStatus('Đang dựng giao diện...');
        try { this.setupEventListeners(); } catch (e) { console.error('[App] setupEventListeners error:', e); }
        try { this.renderDashboard(); } catch (e) { console.error('[App] renderDashboard error:', e); }
        try { this.startCountdown(); } catch (e) { console.error('[App] startCountdown error:', e); }
        this.updateLoadingProgress(100);

        // Hide loading overlay
        clearTimeout(safetyTimer);
        setTimeout(() => {
          this.hideLoading();
          this.showToast('Chào mừng đến với WC2026 Predictor! ⚽', 'success');
        }, 500);

        // Start auto-refresh
        try { this.startAutoRefresh(); } catch (e) { console.error('[App] startAutoRefresh error:', e); }

        // Log data source status
        if (this.dataService) {
          const status = this.dataService.getDataSourceStatus();
          console.log('[App] Trạng thái nguồn dữ liệu:', status);
        }

      } catch (error) {
        console.error('[App] Lỗi khởi tạo:', error);
        clearTimeout(safetyTimer);
        this.updateLoadingStatus('Đã xảy ra lỗi, đang thử lại...');

        // Still try to show something
        setTimeout(() => {
          this.hideLoading();
          this.showToast('Không tải được dữ liệu trực tuyến, dùng dữ liệu ngoại tuyến', 'error');
          try { this.renderDashboard(); } catch (e) { console.error('[App] renderDashboard fallback error:', e); }
        }, 1000);
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LOADING OVERLAY
    // ═══════════════════════════════════════════════════════════════════════

    updateLoadingStatus(text) {
      const el = document.getElementById('loading-status-text');
      if (el) el.textContent = text;
    }

    updateLoadingProgress(percent) {
      const bar = document.getElementById('loading-progress-bar');
      if (bar) {
        bar.style.width = percent + '%';
        bar.style.animation = 'none';
      }
    }

    hideLoading() {
      const overlay = document.getElementById('loading-overlay');
      if (overlay) {
        overlay.classList.add('hidden');
      }
      this.isLoading = false;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EVENT LISTENERS
    // ═══════════════════════════════════════════════════════════════════════

    setupEventListeners() {
      // Tab navigation
      document.querySelectorAll('.nav-tab').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const tab = e.currentTarget.getAttribute('data-tab');
          if (tab) this.switchTab(tab);
        });
      });

      // Logo click -> dashboard
      const logo = document.getElementById('logo');
      if (logo) {
        logo.addEventListener('click', () => this.switchTab('dashboard'));
      }

      // Match dropdown
      const matchDropdown = document.getElementById('match-dropdown');
      if (matchDropdown) {
        matchDropdown.addEventListener('change', (e) => {
          if (e.target.value) {
            this.renderPrediction(e.target.value);
          }
        });
      }

      // Matchday filter
      const matchdayFilter = document.getElementById('matchday-filter');
      if (matchdayFilter) {
        matchdayFilter.addEventListener('change', (e) => {
          this.filterMatchDropdown(e.target.value);
        });
      }

      // Mobile menu toggle
      const mobileToggle = document.getElementById('mobile-menu-toggle');
      if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
          const nav = document.getElementById('main-nav');
          if (nav) nav.classList.toggle('mobile-open');
        });
      }

      // Theme toggle
      const themeToggle = document.getElementById('theme-toggle');
      if (themeToggle) {
        // Restore saved theme
        const saved = localStorage.getItem('wc2026-theme');
        if (saved) this.setTheme(saved);
        themeToggle.addEventListener('click', () => {
          const cur = document.documentElement.getAttribute('data-theme') || 'dark';
          this.setTheme(cur === 'dark' ? 'light' : 'dark');
        });
      }

      // Refresh button
      const refreshBtn = document.getElementById('refresh-btn');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', () => this.manualRefresh());
      }

      // Keyboard shortcut: 1-4 for tabs
      document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
        const tabs = ['dashboard', 'prediction', 'groups', 'analytics'];
        const idx = parseInt(e.key) - 1;
        if (idx >= 0 && idx < tabs.length) {
          this.switchTab(tabs[idx]);
        }
      });

      // Track mouse position for radial hover effects on cards
      document.addEventListener('mousemove', (e) => {
        const target = e.target.closest && e.target.closest('.match-card, .glass-card');
        if (target) {
          const rect = target.getBoundingClientRect();
          target.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width * 100) + '%');
          target.style.setProperty('--my', ((e.clientY - rect.top) / rect.height * 100) + '%');
        }
      });
    }

    setTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('wc2026-theme', theme);
      const btn = document.getElementById('theme-toggle');
      if (btn) btn.textContent = theme === 'light' ? '☀️' : '🌙';
    }

    async manualRefresh() {
      this.showToast('Đang làm mới dữ liệu...', 'info', 2000);
      try {
        this.dataService.clearCache();
        this.matchesData = await this.dataService.fetchMatches();
        this.standingsData = await this.dataService.fetchStandings();
        this.tournamentStats = await this.dataService.getTournamentStats();
        if (this.currentTab === 'dashboard') this.renderDashboard();
        if (this.selectedMatch) this.renderPrediction(this.selectedMatch.id);
        this.showToast('Đã cập nhật dữ liệu mới nhất ✅', 'success');
      } catch (e) {
        this.showToast('Lỗi khi làm mới: ' + e.message, 'error');
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TAB SWITCHING
    // ═══════════════════════════════════════════════════════════════════════

    switchTab(tabId) {
      if (this.currentTab === tabId) return;

      // Hide all tab contents
      document.querySelectorAll('.tab-content').forEach(el => {
        el.classList.remove('active');
      });

      // Deactivate all nav tabs
      document.querySelectorAll('.nav-tab').forEach(btn => {
        btn.classList.remove('active');
      });

      // Show selected tab
      const tabContent = document.getElementById(tabId);
      if (tabContent) {
        tabContent.classList.add('active');
      }

      // Activate nav button
      const navBtn = document.getElementById('tab-btn-' + tabId);
      if (navBtn) {
        navBtn.classList.add('active');
      }

      this.currentTab = tabId;

      // Render tab content on first visit
      switch (tabId) {
        case 'dashboard':
          this.renderDashboard();
          break;
        case 'prediction':
          this.renderMatchSelector();
          break;
        case 'groups':
          this.renderGroups();
          break;
        case 'analytics':
          this.renderAnalytics();
          break;
      }

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DASHBOARD
    // ═══════════════════════════════════════════════════════════════════════

    async renderDashboard() {
      this.renderTournamentProgress();
      this.renderLiveMatches();
      this.renderRecentMatches();
      this.renderUpcomingMatches();
    }

    renderTournamentProgress() {
      const stats = this.tournamentStats;
      const total = stats.totalMatches || 104;
      const played = stats.matchesPlayed || 0;
      const pct = total > 0 ? Math.round((played / total) * 100) : 0;

      const progressFill = document.getElementById('tournament-progress-fill');
      if (progressFill) {
        setTimeout(() => { progressFill.style.width = pct + '%'; }, 200);
      }

      const progressText = document.getElementById('tournament-progress-text');
      if (progressText) progressText.textContent = pct + '%';

      this.setTextContent('stat-matches-played', played);
      this.setTextContent('stat-total-matches', total);
      this.setTextContent('stat-goals-scored', stats.totalGoals || 0);

      // Determine current stage
      let stage = 'Vòng Bảng';
      if (played > 96) stage = 'Chung Kết';
      else if (played > 94) stage = 'Bán Kết';
      else if (played > 90) stage = 'Tứ Kết';
      else if (played > 82) stage = 'Vòng 16';
      else if (played > 48) stage = 'Vòng 32';

      this.setTextContent('stat-current-stage', stage);
    }

    async renderLiveMatches() {
      const liveMatches = this.matchesData.filter(
        m => m.status === 'live' || m.status === 'halftime'
      );

      const grid = document.getElementById('live-matches-grid');
      const emptyState = document.getElementById('live-matches-empty');

      if (liveMatches.length === 0) {
        if (grid) grid.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
      }

      if (emptyState) emptyState.style.display = 'none';
      if (grid) {
        grid.innerHTML = liveMatches.map(m => this.renderMatchCard(m)).join('');
        this.attachMatchCardListeners(grid);
      }
    }

    async renderRecentMatches() {
      const recent = this.matchesData
        .filter(m => m.status === 'finished')
        .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))
        .slice(0, 6);

      const grid = document.getElementById('recent-matches-grid');
      if (grid) {
        if (recent.length === 0) {
          grid.innerHTML = this.renderSkeletonCards(3);
        } else {
          grid.innerHTML = recent.map(m => this.renderMatchCard(m)).join('');
          this.attachMatchCardListeners(grid);
        }
      }
    }

    async renderUpcomingMatches() {
      const now = new Date();
      const upcoming = this.matchesData
        .filter(m => m.status === 'scheduled')
        .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))
        .slice(0, 6);

      const grid = document.getElementById('upcoming-matches-grid');
      if (grid) {
        if (upcoming.length === 0) {
          grid.innerHTML = '<div class="empty-state"><span class="empty-icon">📅</span><p>Chưa có lịch thi đấu sắp tới</p></div>';
        } else {
          grid.innerHTML = upcoming.map(m => this.renderMatchCard(m)).join('');
          this.attachMatchCardListeners(grid);
        }
      }
    }

    renderMatchCard(fixture) {
      const home = fixture.homeTeam || {};
      const away = fixture.awayTeam || {};
      const homeFlag = home.flag || this.getFlag(home.code);
      const awayFlag = away.flag || this.getFlag(away.code);
      const homeName = home.name || this.getTeamName(home.code);
      const awayName = away.name || this.getTeamName(away.code);
      const homeCode = home.code || '???';
      const awayCode = away.code || '???';

      const statusClass = fixture.status || 'scheduled';
      const isFinished = statusClass === 'finished';
      const isLive = statusClass === 'live' || statusClass === 'halftime';

      let centerContent = '';
      if (isFinished || isLive) {
        const homeGoals = fixture.score ? (fixture.score.home ?? '-') : '-';
        const awayGoals = fixture.score ? (fixture.score.away ?? '-') : '-';
        centerContent = `
          <span class="match-score">${homeGoals} – ${awayGoals}</span>
          <span class="match-status status-${statusClass}">${this.getStatusText(statusClass)}</span>
        `;
      } else {
        centerContent = `
          <span class="match-time">${this.formatTime(fixture.utcDate)}</span>
          <span class="match-status status-scheduled">${this.formatDate(fixture.utcDate)}</span>
        `;
      }

      const groupBadge = fixture.group ? `<span class="match-group-badge">Bảng ${fixture.group}</span>` : '';

      return `
        <div class="match-card ${isLive ? 'live' : ''}" data-match-id="${fixture.id}" data-home="${homeCode}" data-away="${awayCode}">
          <div class="match-team home">
            <span class="match-team-flag">${homeFlag}</span>
            <div class="match-team-info">
              <span class="match-team-name">${homeName}</span>
              <span class="match-team-code">${homeCode}</span>
            </div>
          </div>
          <div class="match-center">
            ${centerContent}
            ${groupBadge}
          </div>
          <div class="match-team away">
            <span class="match-team-flag">${awayFlag}</span>
            <div class="match-team-info">
              <span class="match-team-name">${awayName}</span>
              <span class="match-team-code">${awayCode}</span>
            </div>
          </div>
        </div>
      `;
    }

    attachMatchCardListeners(container) {
      container.querySelectorAll('.match-card').forEach(card => {
        card.addEventListener('click', () => {
          const matchId = card.getAttribute('data-match-id');
          if (matchId) {
            this.switchTab('prediction');
            setTimeout(() => this.renderPrediction(matchId), 100);
          }
        });
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PREDICTION
    // ═══════════════════════════════════════════════════════════════════════

    renderMatchSelector() {
      this.populateMatchdayFilter();
      this.populateMatchDropdown();
      this.renderMatchPickCards();
    }

    populateMatchdayFilter() {
      const filter = document.getElementById('matchday-filter');
      if (!filter) return;

      const matchdays = [...new Set(this.matchesData.map(m => m.matchday).filter(Boolean))].sort((a, b) => a - b);

      filter.innerHTML = '<option value="all">Tất cả vòng đấu</option>';
      matchdays.forEach(md => {
        filter.innerHTML += `<option value="${md}">Vòng ${md}</option>`;
      });
    }

    populateMatchDropdown(matchdayFilter = 'all') {
      const dropdown = document.getElementById('match-dropdown');
      if (!dropdown) return;

      let matches = [...this.matchesData];
      if (matchdayFilter !== 'all') {
        matches = matches.filter(m => m.matchday === parseInt(matchdayFilter));
      }

      matches.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

      dropdown.innerHTML = '<option value="">-- Chọn trận đấu --</option>';
      matches.forEach(m => {
        const home = m.homeTeam ? (m.homeTeam.name || this.getTeamName(m.homeTeam.code)) : '???';
        const away = m.awayTeam ? (m.awayTeam.name || this.getTeamName(m.awayTeam.code)) : '???';
        const date = this.formatDateShort(m.utcDate);
        const groupLabel = m.group ? ` [Bảng ${m.group}]` : '';
        dropdown.innerHTML += `<option value="${m.id}">${home} vs ${away} - ${date}${groupLabel}</option>`;
      });
    }

    filterMatchDropdown(matchday) {
      this.populateMatchDropdown(matchday);
      this.renderMatchPickCards(matchday);
    }

    renderMatchPickCards(matchdayFilter = 'all') {
      const grid = document.getElementById('match-cards-grid');
      if (!grid) return;

      let matches = [...this.matchesData];
      if (matchdayFilter !== 'all') {
        matches = matches.filter(m => m.matchday === parseInt(matchdayFilter));
      }

      matches.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

      grid.innerHTML = matches.slice(0, 20).map(m => {
        const homeFlag = m.homeTeam ? (m.homeTeam.flag || this.getFlag(m.homeTeam.code)) : '🏳️';
        const awayFlag = m.awayTeam ? (m.awayTeam.flag || this.getFlag(m.awayTeam.code)) : '🏳️';
        const homeName = m.homeTeam ? (m.homeTeam.name || this.getTeamName(m.homeTeam.code)) : '???';
        const awayName = m.awayTeam ? (m.awayTeam.name || this.getTeamName(m.awayTeam.code)) : '???';
        const info = this.formatDateShort(m.utcDate);
        const selected = this.selectedMatch && String(this.selectedMatch.id) === String(m.id) ? 'selected' : '';

        return `
          <div class="match-pick-card ${selected}" data-match-id="${m.id}">
            <div class="pick-teams">
              <span>${homeFlag}</span>
              <span>${homeName}</span>
              <span class="pick-vs">vs</span>
              <span>${awayFlag}</span>
              <span>${awayName}</span>
            </div>
            <span class="pick-info">${info}</span>
          </div>
        `;
      }).join('');

      // Attach click listeners
      grid.querySelectorAll('.match-pick-card').forEach(card => {
        card.addEventListener('click', () => {
          const matchId = card.getAttribute('data-match-id');
          // Highlight selected
          grid.querySelectorAll('.match-pick-card').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          // Update dropdown
          const dropdown = document.getElementById('match-dropdown');
          if (dropdown) dropdown.value = matchId;
          // Render prediction
          this.renderPrediction(matchId);
        });
      });
    }

    async renderPrediction(matchId) {
      const panel = document.getElementById('prediction-panel');
      if (!panel) return;

      // Find the match
      const match = this.matchesData.find(m => String(m.id) === String(matchId));
      if (!match) {
        this.showToast('Không tìm thấy trận đấu', 'error');
        return;
      }

      this.selectedMatch = match;
      panel.style.display = 'block';

      const homeCode = match.homeTeam ? match.homeTeam.code : null;
      const awayCode = match.awayTeam ? match.awayTeam.code : null;

      if (!homeCode || !awayCode) {
        this.showToast('Thiếu thông tin đội tuyển', 'error');
        return;
      }

      // Get team info
      const homeTeam = this.data.teams ? this.data.teams[homeCode] : null;
      const awayTeam = this.data.teams ? this.data.teams[awayCode] : null;
      const homeName = homeTeam ? (homeTeam.nameVi || homeTeam.name) : (match.homeTeam.name || homeCode);
      const awayName = awayTeam ? (awayTeam.nameVi || awayTeam.name) : (match.awayTeam.name || awayCode);
      const homeFlag = homeTeam ? homeTeam.flag : (match.homeTeam.flag || '🏳️');
      const awayFlag = awayTeam ? awayTeam.flag : (match.awayTeam.flag || '🏳️');
      const homeRank = homeTeam ? (homeTeam.fifaRanking || '?') : '?';
      const awayRank = awayTeam ? (awayTeam.fifaRanking || '?') : '?';

      // Update header
      this.setTextContent('home-flag', homeFlag);
      this.setTextContent('home-name', homeName);
      this.setTextContent('home-ranking', '#' + homeRank);
      this.setTextContent('away-flag', awayFlag);
      this.setTextContent('away-name', awayName);
      this.setTextContent('away-ranking', '#' + awayRank);
      this.setTextContent('match-date-display', this.formatDate(match.utcDate));
      this.setTextContent('match-venue-display', match.venue || 'Chưa xác định');

      // Run prediction
      let prediction = null;
      if (this.engine) {
        try {
          const ctx = {
            matchday: match.matchday,
            group: match.group,
            stage: match.stage || 'group',
            stadium: match.stadium || match.venue,
            referee: match.referee
          };
          const raw = this.engine.predictMatch(homeCode, awayCode, ctx);
          // Normalize engine output to app format
          prediction = this.normalizeEnginePrediction(raw);
        } catch (err) {
          console.warn('[App] Lỗi engine predictMatch:', err);
        }
      }

      // If no engine or prediction failed, generate basic prediction
      if (!prediction) {
        prediction = this.generateBasicPrediction(homeCode, awayCode, homeTeam, awayTeam);
      }

      // Render prediction details
      this.renderPredictionDetails(prediction, homeCode, awayCode, homeName, awayName, homeFlag, awayFlag);

      // Smooth scroll to prediction panel
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    /**
     * Normalize the raw PredictionEngine output to the format app.js expects
     * Engine returns 0-1 probabilities; app expects 0-100 percentages
     */
    normalizeEnginePrediction(raw) {
      if (!raw) return null;

      // Build radar data from factors
      const radarLabels = ['Tấn Công', 'Phòng Ngự', 'Phong Độ', 'Kinh Nghiệm', 'Xếp Hạng', 'Chiến Thuật'];
      const radarHome = [70, 70, 70, 70, 70, 70];
      const radarAway = [70, 70, 70, 70, 70, 70];
      if (raw.factors) {
        const fMap = {};
        raw.factors.forEach(f => { fMap[f.name] = f; });
        if (fMap['Attack Strength']) { radarHome[0] = (fMap['Attack Strength'].homeValue || 50); radarAway[0] = (fMap['Attack Strength'].awayValue || 50); }
        if (fMap['Defense Strength']) { radarHome[1] = (fMap['Defense Strength'].homeValue || 50); radarAway[1] = (fMap['Defense Strength'].awayValue || 50); }
        if (fMap['Recent Form']) { radarHome[2] = parseFloat(fMap['Recent Form'].homeValue) || 50; radarAway[2] = parseFloat(fMap['Recent Form'].awayValue) || 50; }
        if (fMap['Squad Experience']) { radarHome[3] = parseFloat(fMap['Squad Experience'].homeValue) || 50; radarAway[3] = parseFloat(fMap['Squad Experience'].awayValue) || 50); }
        if (fMap['FIFA Ranking']) { radarHome[4] = 100 - (typeof fMap['FIFA Ranking'].homeValue === 'number' ? fMap['FIFA Ranking'].homeValue : 50); radarAway[4] = 100 - (typeof fMap['FIFA Ranking'].awayValue === 'number' ? fMap['FIFA Ranking'].awayValue : 50); }
        if (fMap['Tactical Matchup']) { radarHome[5] = 50 + (fMap['Tactical Matchup'].impact || 0) * 500; radarAway[5] = 50 - (fMap['Tactical Matchup'].impact || 0) * 500; }
      }
      // Normalize radar values to 0-100 range
      for (let i = 0; i < 6; i++) {
        radarHome[i] = Math.max(10, Math.min(95, typeof radarHome[i] === 'number' ? radarHome[i] : 50));
        radarAway[i] = Math.max(10, Math.min(95, typeof radarAway[i] === 'number' ? radarAway[i] : 50));
      }

      // Normalize factors for display
      const normalizedFactors = (raw.factors || []).map(f => ({
        name: f.nameVi || f.name,
        homeValue: typeof f.homeValue === 'number' ? Math.round(f.homeValue) : f.homeValue,
        awayValue: typeof f.awayValue === 'number' ? Math.round(f.awayValue) : f.awayValue,
        weight: Math.round((f.weight || 0.05) * 100 * 10) / 10,
        advantage: f.advantage || 'neutral'
      }));

      return {
        homeWin: (raw.homeWinProb || 0) * 100,
        draw: (raw.drawProb || 0) * 100,
        awayWin: (raw.awayWinProb || 0) * 100,
        predictedScore: {
          home: Array.isArray(raw.predictedScore) ? raw.predictedScore[0] : 0,
          away: Array.isArray(raw.predictedScore) ? raw.predictedScore[1] : 0
        },
        confidence: (raw.confidence || 0.5) * 100,
        xG: {
          home: raw.homeExpectedGoals || 0,
          away: raw.awayExpectedGoals || 0,
          total: raw.totalGoalsExpected || 0
        },
        over05: (raw.over05Prob || 0) * 100,
        over15: (raw.over15Prob || 0) * 100,
        over25: (raw.over25Prob || 0.5) * 100,
        over35: (raw.over35Prob || 0) * 100,
        over45: (raw.over45Prob || 0) * 100,
        under25: (raw.under25Prob || 0.5) * 100,
        btts: (raw.bttsProb || 0.5) * 100,
        bttsNo: (raw.bttsNoProb || 0) * 100,
        homeCleanSheet: (raw.homeCleanSheet || 0) * 100,
        awayCleanSheet: (raw.awayCleanSheet || 0) * 100,
        doubleChanceHomeDraw: (raw.doubleChanceHomeDraw || 0) * 100,
        doubleChanceAwayDraw: (raw.doubleChanceAwayDraw || 0) * 100,
        doubleChanceHomeAway: (raw.doubleChanceHomeAway || 0) * 100,
        drawNoBetHome: (raw.drawNoBetHome || 0) * 100,
        drawNoBetAway: (raw.drawNoBetAway || 0) * 100,
        scoreMatrix: raw.scoreMatrix || [],
        topScores: raw.topScores || [],
        winMargin: raw.winMargin || {},
        htResult: raw.htResult || null,
        htFt: raw.htFt || null,
        lambdas: raw.lambdas || { home: 1.35, away: 1.35 },
        formTrajectory: raw.formTrajectory || null,
        radarData: {
          labels: radarLabels,
          home: radarHome,
          away: radarAway
        },
        factors: normalizedFactors,
        // raw data pass-through for AI report
        _raw: raw
      };
    }

    generateBasicPrediction(homeCode, awayCode, homeTeam, awayTeam) {
      // Simple prediction based on FIFA rankings when engine is unavailable
      const homeRank = homeTeam ? (homeTeam.fifaRanking || 50) : 50;
      const awayRank = awayTeam ? (awayTeam.fifaRanking || 50) : 50;

      const homeStrength = Math.max(0, 100 - homeRank);
      const awayStrength = Math.max(0, 100 - awayRank);
      const total = homeStrength + awayStrength + 20;

      const homeWinProb = (homeStrength / total) * 100 + 5;
      const awayWinProb = (awayStrength / total) * 100 - 5;
      const drawProb = 100 - homeWinProb - awayWinProb;

      const homeGoals = Math.round((homeStrength / 100) * 2.5 * 10) / 10;
      const awayGoals = Math.round((awayStrength / 100) * 2.5 * 10) / 10;

      return {
        homeWin: Math.max(5, Math.min(80, homeWinProb)),
        draw: Math.max(10, Math.min(35, drawProb)),
        awayWin: Math.max(5, Math.min(80, awayWinProb)),
        predictedScore: { home: Math.round(homeGoals), away: Math.round(awayGoals) },
        confidence: 45,
        xG: { home: homeGoals, away: awayGoals },
        over25: homeGoals + awayGoals > 2.5 ? 55 : 45,
        under25: homeGoals + awayGoals > 2.5 ? 45 : 55,
        btts: 50,
        scoreMatrix: this.generateScoreMatrix(homeGoals, awayGoals),
        radarData: {
          labels: ['Tấn Công', 'Phòng Ngự', 'Kinh Nghiệm', 'Phong Độ', 'Sân Nhà', 'Đồng Đội'],
          home: [homeStrength*0.8+10, homeStrength*0.7+15, homeStrength*0.6+20, 60, 70, homeStrength*0.75+10],
          away: [awayStrength*0.8+10, awayStrength*0.7+15, awayStrength*0.6+20, 60, 45, awayStrength*0.75+10]
        },
        factors: this.generateBasicFactors(homeTeam, awayTeam)
      };
    }

    generateScoreMatrix(homeXg, awayXg) {
      const matrix = [];
      for (let h = 0; h <= 5; h++) {
        matrix[h] = [];
        for (let a = 0; a <= 5; a++) {
          // Poisson-like probability
          const homeProb = this.poissonPmf(h, Math.max(0.5, homeXg));
          const awayProb = this.poissonPmf(a, Math.max(0.5, awayXg));
          matrix[h][a] = Math.round(homeProb * awayProb * 10000) / 100;
        }
      }
      return matrix;
    }

    poissonPmf(k, lambda) {
      return (Math.pow(lambda, k) * Math.exp(-lambda)) / this.factorial(k);
    }

    factorial(n) {
      if (n <= 1) return 1;
      let result = 1;
      for (let i = 2; i <= n; i++) result *= i;
      return result;
    }

    generateBasicFactors(homeTeam, awayTeam) {
      const factorNames = [
        'Xếp hạng FIFA', 'Giá trị đội hình', 'Phong độ gần đây', 'Lịch sử đối đầu',
        'Lợi thế sân nhà', 'Kinh nghiệm World Cup', 'Tuổi trung bình', 'Chấn thương',
        'Chiến thuật HLV', 'Tinh thần đội', 'Chất lượng thủ môn', 'Sức mạnh tấn công',
        'Khả năng phòng ngự', 'Bóng chết', 'Tốc độ phản công', 'Kiểm soát bóng',
        'Thời tiết', 'Múi giờ', 'Sức ép khán đài', 'Động lực thi đấu'
      ];

      const homeRank = homeTeam ? (homeTeam.fifaRanking || 50) : 50;
      const awayRank = awayTeam ? (awayTeam.fifaRanking || 50) : 50;

      return factorNames.map((name, i) => {
        const baseHome = Math.max(20, Math.min(95, 100 - homeRank + (Math.random() * 30 - 15)));
        const baseAway = Math.max(20, Math.min(95, 100 - awayRank + (Math.random() * 30 - 15)));
        const weight = 3 + Math.random() * 7;

        return {
          name: name,
          homeValue: Math.round(baseHome),
          awayValue: Math.round(baseAway),
          weight: Math.round(weight * 10) / 10,
          advantage: baseHome > baseAway + 3 ? 'home' : baseAway > baseHome + 3 ? 'away' : 'neutral'
        };
      });
    }

    renderPredictionDetails(prediction, homeCode, awayCode, homeName, awayName, homeFlag, awayFlag) {
      if (!prediction) return;

      // ── Score Display ──
      this.setTextContent('predicted-home-score', prediction.predictedScore ? prediction.predictedScore.home : 0);
      this.setTextContent('predicted-away-score', prediction.predictedScore ? prediction.predictedScore.away : 0);
      this.setTextContent('score-home-flag', homeFlag);
      this.setTextContent('score-away-flag', awayFlag);
      this.setTextContent('score-home-name', homeName);
      this.setTextContent('score-away-name', awayName);
      this.setTextContent('confidence-value', Math.round(prediction.confidence || 0) + '%');

      // ── Modern 1X2 widget ──
      this.setTextContent('home-prob-pct', Math.round(prediction.homeWin || 0) + '%');
      this.setTextContent('away-prob-pct', Math.round(prediction.awayWin || 0) + '%');
      this.setTextContent('home-prob-name', homeName);
      this.setTextContent('away-prob-name', awayName);
      this.setTextContent('draw-prob-pill', 'Hòa ' + Math.round(prediction.draw || 0) + '%');
      this.animateBar('home-prob-fill', prediction.homeWin || 0);
      this.animateBar('away-prob-fill', prediction.awayWin || 0);

      // ── AI Pitch Report panel ──
      try {
        const aiPanel = document.getElementById('ai-report-panel');
        const aiText = document.getElementById('ai-report-text');
        if (aiPanel && aiText && this.engine && prediction._raw) {
          const report = this.engine.getAIPitchReport(prediction._raw, 'vi');
          aiText.textContent = report;
          aiPanel.style.display = 'block';
        }
      } catch (e) { console.warn('[App] AI report error', e); }

      // ── Update factors table header ──
      this.setTextContent('factors-th-home', homeName);
      this.setTextContent('factors-th-away', awayName);

      // ── Over/Under (legacy) ──
      const over25 = prediction.over25 || 50;
      const under25 = prediction.under25 || (100 - over25);
      this.animateBar('over25-bar', over25);
      this.animateBar('under25-bar', under25);
      this.setTextContent('over25-value', Math.round(over25) + '%');
      this.setTextContent('under25-value', Math.round(under25) + '%');

      // ── BTTS (legacy) ──
      const btts = prediction.btts || 50;
      this.setTextContent('btts-value', Math.round(btts) + '%');
      this.setTextContent('btts-yes-label', 'Có: ' + Math.round(btts) + '%');
      this.setTextContent('btts-no-label', 'Không: ' + Math.round(100 - btts) + '%');
      const bttsFill = document.getElementById('btts-circle-fill');
      if (bttsFill) {
        const circumference = 2 * Math.PI * 42;
        const offset = circumference - (btts / 100) * circumference;
        setTimeout(() => { bttsFill.style.strokeDashoffset = offset; }, 200);
      }

      // ── Expected Goals (legacy card) ──
      const xgHome = prediction.xG ? prediction.xG.home : 0;
      const xgAway = prediction.xG ? prediction.xG.away : 0;
      this.setTextContent('xg-home-flag', homeFlag);
      this.setTextContent('xg-away-flag', awayFlag);
      this.setTextContent('xg-home-value', (typeof xgHome === 'number' ? xgHome.toFixed(2) : '0.00'));
      this.setTextContent('xg-away-value', (typeof xgAway === 'number' ? xgAway.toFixed(2) : '0.00'));
      this.setTextContent('xg-total-value', ((xgHome + xgAway) || 0).toFixed(2));

      // ── Markets grid (new) ──
      this.setTextContent('mkt-dc-1x',  Math.round(prediction.doubleChanceHomeDraw || 0) + '%');
      this.setTextContent('mkt-dc-x2',  Math.round(prediction.doubleChanceAwayDraw || 0) + '%');
      this.setTextContent('mkt-dc-12',  Math.round(prediction.doubleChanceHomeAway || 0) + '%');
      this.setTextContent('mkt-dnb-h',  Math.round(prediction.drawNoBetHome || 0) + '%');
      this.setTextContent('mkt-dnb-a',  Math.round(prediction.drawNoBetAway || 0) + '%');
      this.setTextContent('mkt-over05', Math.round(prediction.over05 || 0) + '%');
      this.setTextContent('mkt-over15', Math.round(prediction.over15 || 0) + '%');
      this.setTextContent('mkt-over35', Math.round(prediction.over35 || 0) + '%');
      this.setTextContent('mkt-over45', Math.round(prediction.over45 || 0) + '%');

      // ── Top scores list ──
      this.renderTopScores(prediction.topScores || [], homeName, awayName);

      // ── Render Charts (all) ──
      this.renderPredictionCharts(prediction, homeName, awayName, homeFlag, awayFlag);

      // ── Form sparklines ──
      this.renderFormSparklines(prediction.formTrajectory, homeName, awayName);

      // ── Factors Table ──
      this.renderFactorsTable(prediction.factors || []);
    }

    renderTopScores(topScores, homeName, awayName) {
      const list = document.getElementById('top-scores-list');
      if (!list) return;
      if (!topScores || !topScores.length) {
        list.innerHTML = '<div style="color:var(--text-muted); grid-column:1/-1;">Không có dữ liệu</div>';
        return;
      }
      list.innerHTML = topScores.map((s, i) => `
        <div class="top-score-chip ${i === 0 ? 'is-top' : ''}" data-tooltip="${homeName} ${s.home} – ${s.away} ${awayName}">
          <span class="top-score-num">${s.home}–${s.away}</span>
          <span class="top-score-pct">${(s.prob * 100).toFixed(1)}%</span>
        </div>
      `).join('');
    }

    renderFormSparklines(formExtra, homeName, awayName) {
      const hLabel = document.getElementById('form-spark-home-label');
      const aLabel = document.getElementById('form-spark-away-label');
      if (hLabel) hLabel.textContent = '🏠 ' + (homeName || 'Đội nhà');
      if (aLabel) aLabel.textContent = '✈️ ' + (awayName || 'Đội khách');

      if (!formExtra || !window.ChartRenderer) return;
      try {
        if (formExtra.homeSpark) {
          window.ChartRenderer.drawSparkline('form-spark-home', formExtra.homeSpark.map(v => v * 100), '#00D4AA');
        }
        if (formExtra.awaySpark) {
          window.ChartRenderer.drawSparkline('form-spark-away', formExtra.awaySpark.map(v => v * 100), '#FF6B6B');
        }
      } catch (e) { console.warn('[App] sparkline error', e); }
    }

    renderPredictionCharts(prediction, homeName, awayName, homeFlag, awayFlag) {
      // Only render if ChartRenderer is available
      if (!window.ChartRenderer) {
        console.warn('[App] ChartRenderer không khả dụng, bỏ qua biểu đồ');
        return;
      }

      try {
        // 1. Probability Bars
        window.ChartRenderer.drawProbabilityBars(
          'prob-bars-chart',
          (prediction.homeWin || 33) / 100,
          (prediction.draw || 34) / 100,
          (prediction.awayWin || 33) / 100,
          homeName,
          awayName
        );

        // Update legend
        const probLegend = document.getElementById('prob-bars-legend');
        if (probLegend) {
          probLegend.innerHTML = `
            <div class="legend-item"><span class="legend-color" style="background:var(--accent-teal)"></span>${homeName} thắng: ${Math.round(prediction.homeWin || 33)}%</div>
            <div class="legend-item"><span class="legend-color" style="background:var(--accent-gold)"></span>Hòa: ${Math.round(prediction.draw || 34)}%</div>
            <div class="legend-item"><span class="legend-color" style="background:var(--accent-coral)"></span>${awayName} thắng: ${Math.round(prediction.awayWin || 33)}%</div>
          `;
        }

        // 2. Confidence Gauge
        window.ChartRenderer.drawConfidenceGauge(
          'confidence-gauge',
          (prediction.confidence || 50) / 100
        );

        const gaugeDisplay = document.getElementById('gauge-value-display');
        if (gaugeDisplay) {
          gaugeDisplay.textContent = Math.round(prediction.confidence || 50) + '% Tin cậy';
        }

        // 3. Probability Donut (1X2)
        const donut = document.getElementById('prob-donut-chart');
        if (donut) {
          window.ChartRenderer.drawProbabilityDonut(
            'prob-donut-chart',
            (prediction.homeWin || 33) / 100,
            (prediction.draw || 34) / 100,
            (prediction.awayWin || 33) / 100,
            homeName,
            awayName
          );
        }

        // 4. Win margin distribution
        if (prediction.winMargin && Object.keys(prediction.winMargin).length > 0) {
          window.ChartRenderer.drawWinMarginChart(
            'win-margin-chart',
            prediction.winMargin,
            homeName,
            awayName
          );
        }

        // 5. xG comparison
        const xgChart = document.getElementById('xg-chart');
        if (xgChart) {
          window.ChartRenderer.drawXGChart(
            'xg-chart',
            (prediction.xG && prediction.xG.home) || 0,
            (prediction.xG && prediction.xG.away) || 0,
            homeName,
            awayName
          );
        }

        // 6. Clean sheet / BTTS donut
        const csDonut = document.getElementById('cs-donut-chart');
        if (csDonut) {
          window.ChartRenderer.drawCleanSheetDonut(
            'cs-donut-chart',
            (prediction.homeCleanSheet || 0) / 100,
            (prediction.awayCleanSheet || 0) / 100,
            (prediction.btts || 0) / 100,
            homeName,
            awayName
          );
        }

        // 7. HT/FT 3x3
        if (prediction.htFt) {
          window.ChartRenderer.drawHTFTGrid('htft-chart', prediction.htFt);
        }

        // 8. Radar Chart
        if (prediction.radarData) {
          const radarHome = prediction.radarData.home.map(v => Math.min(1, v / 100));
          const radarAway = prediction.radarData.away.map(v => Math.min(1, v / 100));
          window.ChartRenderer.drawRadarChart(
            'radar-chart',
            radarHome,
            radarAway,
            prediction.radarData.labels,
            '#00D4AA',
            '#FF6B6B'
          );

          const radarLegend = document.getElementById('radar-chart-legend');
          if (radarLegend) {
            radarLegend.innerHTML = `
              <div class="legend-item"><span class="legend-color" style="background:#00D4AA"></span>${homeName}</div>
              <div class="legend-item"><span class="legend-color" style="background:#FF6B6B"></span>${awayName}</div>
            `;
          }
        }

        // 9. Score Matrix Heatmap
        if (prediction.scoreMatrix && prediction.scoreMatrix.length > 0) {
          window.ChartRenderer.drawScoreHeatmap(
            'score-heatmap',
            prediction.scoreMatrix,
            homeName,
            awayName
          );
        }

        // 10. Factors Chart
        if (prediction.factors && prediction.factors.length > 0) {
          const chartFactors = prediction.factors.map(f => ({
            name: f.name,
            impact: (f.advantage === 'away' ? -1 : 1) * (f.weight || 5) / 100,
            advantage: f.advantage || 'neutral'
          }));
          window.ChartRenderer.drawFactorsChart('factors-chart', chartFactors);
        }

      } catch (error) {
        console.error('[App] Lỗi vẽ biểu đồ:', error);
      }
    }

    renderFactorsTable(factors) {
      const tbody = document.getElementById('factors-table-body');
      if (!tbody) return;

      if (!factors || factors.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">Không có dữ liệu yếu tố</td></tr>';
        return;
      }

      tbody.innerHTML = factors.map((f, i) => {
        const advClass = f.advantage === 'home' ? 'home' : f.advantage === 'away' ? 'away' : 'neutral';
        const advText = f.advantage === 'home' ? 'Đội nhà' : f.advantage === 'away' ? 'Đội khách' : 'Cân bằng';
        const homeBarColor = f.homeValue > f.awayValue ? 'var(--accent-teal)' : 'var(--text-muted)';
        const awayBarColor = f.awayValue > f.homeValue ? 'var(--accent-coral)' : 'var(--text-muted)';

        return `
          <tr>
            <td>${i + 1}</td>
            <td>${f.name}</td>
            <td>
              <span class="factor-bar" style="width:${f.homeValue}%; background:${homeBarColor}"></span>
              <span style="margin-left:6px; font-size:0.8rem">${f.homeValue}</span>
            </td>
            <td>
              <span class="factor-bar" style="width:${f.awayValue}%; background:${awayBarColor}"></span>
              <span style="margin-left:6px; font-size:0.8rem">${f.awayValue}</span>
            </td>
            <td>${f.weight || '-'}%</td>
            <td><span class="factor-advantage ${advClass}">${advText}</span></td>
          </tr>
        `;
      }).join('');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GROUPS
    // ═══════════════════════════════════════════════════════════════════════

    async renderGroups() {
      const groups = this.data.groups || {};
      const groupCodes = Object.keys(groups).sort();

      if (groupCodes.length === 0) {
        // No group data - show message
        const grid = document.getElementById('groups-grid');
        if (grid) {
          grid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1"><span class="empty-icon">🏆</span><p>Dữ liệu bảng đấu chưa được tải</p></div>';
        }
        return;
      }

      // Calculate or use fetched standings
      const standings = Object.keys(this.standingsData).length > 0
        ? this.standingsData
        : this.dataService.calculateStandingsFromFixtures();

      groupCodes.forEach(groupCode => {
        const tbody = document.getElementById(`group-${groupCode}-body`);
        if (!tbody) return;

        const groupStandings = standings[groupCode] || [];

        if (groupStandings.length === 0) {
          // Show teams from group data without stats
          const groupData = groups[groupCode];
          const teamCodes = Array.isArray(groupData) ? groupData : (groupData.teams || []);
          tbody.innerHTML = teamCodes.map((code, idx) => {
            const team = this.data.teams ? this.data.teams[code] : null;
            const name = team ? (team.nameVi || team.name) : code;
            const flag = team ? (team.flag || '🏳️') : '🏳️';

            return `
              <tr>
                <td>${idx + 1}</td>
                <td class="col-team">
                  <div class="group-team-cell">
                    <span class="group-team-flag">${flag}</span>
                    <span class="group-team-name">${name}</span>
                  </div>
                </td>
                <td>0</td><td>0</td><td>0</td><td>0</td>
                <td>0</td><td>0</td><td>0</td>
                <td class="group-pts">0</td>
                <td>
                  <div class="qual-prob-cell">
                    <span class="qual-prob-value" style="color:var(--text-muted)">—</span>
                  </div>
                </td>
              </tr>
            `;
          }).join('');
          return;
        }

        tbody.innerHTML = groupStandings.map((entry, idx) => {
          const isQualified = idx < 2;
          const isThird = idx === 2;
          const rowClass = isQualified ? 'qualified' : isThird ? 'third-place' : '';

          // Calculate qualification probability (simplified)
          let qualProb = 0;
          if (entry.played >= 3) {
            qualProb = isQualified ? 100 : isThird ? 33 : 0;
          } else {
            qualProb = Math.max(5, Math.round((entry.points / Math.max(1, entry.played * 3)) * 100 * 0.8 + (isQualified ? 20 : isThird ? 10 : 5)));
            qualProb = Math.min(95, qualProb);
          }

          const qualColor = qualProb > 70 ? 'var(--accent-teal)' : qualProb > 40 ? 'var(--accent-gold)' : 'var(--accent-coral)';

          return `
            <tr class="${rowClass}">
              <td>${idx + 1}</td>
              <td class="col-team">
                <div class="group-team-cell">
                  <span class="group-team-flag">${entry.team.flag || '🏳️'}</span>
                  <span class="group-team-name">${entry.team.name}</span>
                </div>
              </td>
              <td>${entry.played}</td>
              <td>${entry.won}</td>
              <td>${entry.draw}</td>
              <td>${entry.lost}</td>
              <td>${entry.goalsFor}</td>
              <td>${entry.goalsAgainst}</td>
              <td>${entry.goalDifference > 0 ? '+' : ''}${entry.goalDifference}</td>
              <td class="group-pts">${entry.points}</td>
              <td>
                <div class="qual-prob-cell">
                  <span class="qual-prob-value" style="color:${qualColor}">${qualProb}%</span>
                  <div class="qual-prob-bar">
                    <div class="qual-prob-fill" style="width:${qualProb}%; background:${qualColor}"></div>
                  </div>
                </div>
              </td>
            </tr>
          `;
        }).join('');
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ANALYTICS
    // ═══════════════════════════════════════════════════════════════════════

    async renderAnalytics() {
      this.renderWinnerProbabilities();
      this.renderStrengthRankings();
      this.renderBracket();
      this.renderStatsSummary();
    }

    renderWinnerProbabilities() {
      const grid = document.getElementById('winner-probs-grid');
      if (!grid) return;

      // Calculate winner probabilities from team strength
      const teams = this.data.teams || {};
      const teamEntries = Object.entries(teams)
        .filter(([code, t]) => t.fifaRanking)
        .map(([code, t]) => {
          const rank = t.fifaRanking || 100;
          const strength = t.strength || (100 - rank);
          // Probability weighting: top teams get more probability
          const rawProb = Math.pow(Math.max(1, strength), 2);
          return {
            code,
            name: t.nameVi || t.name || code,
            flag: t.flag || '🏳️',
            rank,
            strength,
            rawProb
          };
        });

      // Normalize probabilities to sum to 100%
      const totalProb = teamEntries.reduce((s, t) => s + t.rawProb, 0);
      teamEntries.forEach(t => {
        t.winProb = (t.rawProb / totalProb) * 100;
      });

      // Sort by probability
      teamEntries.sort((a, b) => b.winProb - a.winProb);

      // Show top 12
      const top = teamEntries.slice(0, 12);
      const maxProb = top[0] ? top[0].winProb : 1;

      grid.innerHTML = top.map((t, i) => `
        <div class="winner-prob-card" style="animation-delay: ${i * 0.05}s">
          <span class="winner-rank">${i + 1}</span>
          <span class="winner-flag">${t.flag}</span>
          <div class="winner-info">
            <div class="winner-name">${t.name}</div>
            <div class="winner-prob-bar">
              <div class="winner-prob-fill" style="width:${(t.winProb / maxProb) * 100}%"></div>
            </div>
          </div>
          <span class="winner-prob-value">${t.winProb.toFixed(1)}%</span>
        </div>
      `).join('');
    }

    renderStrengthRankings() {
      const tbody = document.getElementById('strength-table-body');
      if (!tbody) return;

      const teams = this.data.teams || {};
      const teamEntries = Object.entries(teams)
        .filter(([code, t]) => t.fifaRanking)
        .map(([code, t]) => {
          const attack = t.attack || Math.round(50 + Math.random() * 40);
          const defense = t.defense || Math.round(50 + Math.random() * 40);
          const form = t.form || Math.round(40 + Math.random() * 50);
          const experience = t.experience || Math.round(30 + Math.random() * 60);
          const overall = Math.round((attack * 0.3 + defense * 0.25 + form * 0.25 + experience * 0.2));

          return {
            code,
            name: t.nameVi || t.name || code,
            flag: t.flag || '🏳️',
            attack, defense, form, experience, overall
          };
        })
        .sort((a, b) => b.overall - a.overall);

      tbody.innerHTML = teamEntries.slice(0, 20).map((t, i) => {
        const barColor = (val) => {
          if (val >= 80) return 'var(--accent-teal)';
          if (val >= 60) return 'var(--accent-blue)';
          if (val >= 40) return 'var(--accent-gold)';
          return 'var(--accent-coral)';
        };

        return `
          <tr>
            <td>${i + 1}</td>
            <td>
              <div class="strength-team-cell">
                <span class="strength-team-flag">${t.flag}</span>
                <span>${t.name}</span>
              </div>
            </td>
            <td><span class="strength-bar" style="width:${t.overall}%; background:${barColor(t.overall)}"></span></td>
            <td><span class="strength-bar" style="width:${t.attack}%; background:${barColor(t.attack)}"></span> ${t.attack}</td>
            <td><span class="strength-bar" style="width:${t.defense}%; background:${barColor(t.defense)}"></span> ${t.defense}</td>
            <td><span class="strength-bar" style="width:${t.form}%; background:${barColor(t.form)}"></span> ${t.form}</td>
            <td><span class="strength-bar" style="width:${t.experience}%; background:${barColor(t.experience)}"></span> ${t.experience}</td>
            <td class="strength-total">${t.overall}</td>
          </tr>
        `;
      }).join('');
    }

    renderBracket() {
      // Simplified bracket visualization
      const rounds = [
        { id: 'bracket-r32-matches', name: 'Vòng 32', count: 16 },
        { id: 'bracket-r16-matches', name: 'Vòng 16', count: 8 },
        { id: 'bracket-qf-matches', name: 'Tứ Kết', count: 4 },
        { id: 'bracket-sf-matches', name: 'Bán Kết', count: 2 },
        { id: 'bracket-final-matches', name: 'Chung Kết', count: 1 }
      ];

      // Check if we have knockout fixtures
      const knockoutFixtures = this.matchesData.filter(m =>
        m.stage && (m.stage.includes('ROUND') || m.stage.includes('QUARTER') ||
          m.stage.includes('SEMI') || m.stage.includes('FINAL') ||
          m.stage === 'LAST_32' || m.stage === 'LAST_16')
      );

      rounds.forEach(round => {
        const container = document.getElementById(round.id);
        if (!container) return;

        // Try to match fixtures to rounds
        let roundFixtures = [];
        // For now, show placeholder if no knockout fixtures available
        if (knockoutFixtures.length === 0) {
          let html = '';
          for (let i = 0; i < Math.min(round.count, 4); i++) {
            html += `
              <div class="bracket-match">
                <div class="bracket-team-row">
                  <span class="bracket-team-name">🏳️ Chờ xác định</span>
                  <span class="bracket-score">-</span>
                </div>
                <div class="bracket-team-row">
                  <span class="bracket-team-name">🏳️ Chờ xác định</span>
                  <span class="bracket-score">-</span>
                </div>
              </div>
            `;
          }
          if (round.count > 4) {
            html += `<div class="bracket-match" style="text-align:center; font-size:0.75rem; color:var(--text-muted)">+${round.count - 4} trận khác</div>`;
          }
          container.innerHTML = html;
        } else {
          container.innerHTML = roundFixtures.map(f => {
            const homeName = f.homeTeam ? (f.homeTeam.name || f.homeTeam.code) : 'TBD';
            const awayName = f.awayTeam ? (f.awayTeam.name || f.awayTeam.code) : 'TBD';
            const homeFlag = f.homeTeam ? (f.homeTeam.flag || '🏳️') : '🏳️';
            const awayFlag = f.awayTeam ? (f.awayTeam.flag || '🏳️') : '🏳️';
            const homeScore = f.score ? (f.score.home ?? '-') : '-';
            const awayScore = f.score ? (f.score.away ?? '-') : '-';

            return `
              <div class="bracket-match">
                <div class="bracket-team-row">
                  <span class="bracket-team-name">${homeFlag} ${homeName}</span>
                  <span class="bracket-score">${homeScore}</span>
                </div>
                <div class="bracket-team-row">
                  <span class="bracket-team-name">${awayFlag} ${awayName}</span>
                  <span class="bracket-score">${awayScore}</span>
                </div>
              </div>
            `;
          }).join('');
        }
      });
    }

    async renderStatsSummary() {
      const stats = this.tournamentStats;

      this.setTextContent('summary-avg-goals', stats.avgGoals || '0.00');
      this.setTextContent('summary-home-win-pct', (stats.homeWinPct || 0) + '%');
      this.setTextContent('summary-draw-pct', (stats.drawPct || 0) + '%');
      this.setTextContent('summary-btts-pct', (stats.bttsPct || 0) + '%');
      this.setTextContent('summary-over25-pct', (stats.over25Pct || 0) + '%');
      this.setTextContent('summary-total-attendance', '0'); // No attendance data yet
    }

    // ═══════════════════════════════════════════════════════════════════════
    // COUNTDOWN TIMER
    // ═══════════════════════════════════════════════════════════════════════

    startCountdown() {
      this.updateCountdown();
      this.countdownInterval = setInterval(() => this.updateCountdown(), 1000);
    }

    async updateCountdown() {
      // Find next scheduled match
      const now = new Date();
      const nextMatch = this.matchesData
        .filter(m => m.status === 'scheduled' && new Date(m.utcDate) > now)
        .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))[0];

      if (!nextMatch) {
        this.setTextContent('countdown-hours', '--');
        this.setTextContent('countdown-minutes', '--');
        this.setTextContent('countdown-seconds', '--');
        this.setTextContent('countdown-match-info', 'Không có trận sắp tới');
        return;
      }

      const matchTime = new Date(nextMatch.utcDate);
      const diff = matchTime - now;

      if (diff <= 0) {
        this.setTextContent('countdown-hours', '00');
        this.setTextContent('countdown-minutes', '00');
        this.setTextContent('countdown-seconds', '00');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      this.setTextContent('countdown-hours', String(hours).padStart(2, '0'));
      this.setTextContent('countdown-minutes', String(minutes).padStart(2, '0'));
      this.setTextContent('countdown-seconds', String(seconds).padStart(2, '0'));

      const homeName = nextMatch.homeTeam ? (nextMatch.homeTeam.name || this.getTeamName(nextMatch.homeTeam.code)) : '?';
      const awayName = nextMatch.awayTeam ? (nextMatch.awayTeam.name || this.getTeamName(nextMatch.awayTeam.code)) : '?';
      this.setTextContent('countdown-match-info', `${homeName} vs ${awayName}`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // AUTO REFRESH
    // ═══════════════════════════════════════════════════════════════════════

    startAutoRefresh() {
      this.autoRefreshInterval = setInterval(() => this.refreshLiveData(), 60000);
    }

    async refreshLiveData() {
      try {
        // Clear match cache to get fresh data
        this.dataService.clearCacheEntry('matches_{}');

        const newMatches = await this.dataService.fetchMatches();
        const hasChanges = this.detectChanges(this.matchesData, newMatches);

        if (hasChanges) {
          this.matchesData = newMatches;
          this.tournamentStats = await this.dataService.getTournamentStats();

          if (this.currentTab === 'dashboard') {
            this.renderDashboard();
          }

          console.log('[App] Dữ liệu đã được cập nhật');
        }
      } catch (error) {
        console.warn('[App] Lỗi tự động cập nhật:', error.message);
      }
    }

    detectChanges(oldData, newData) {
      if (!oldData || !newData) return true;
      if (oldData.length !== newData.length) return true;

      // Quick check on scores of live/recent matches
      for (let i = 0; i < newData.length; i++) {
        const oldMatch = oldData.find(m => m.id === newData[i].id);
        if (!oldMatch) return true;
        if (oldMatch.status !== newData[i].status) return true;
        if (oldMatch.score && newData[i].score) {
          if (oldMatch.score.home !== newData[i].score.home ||
            oldMatch.score.away !== newData[i].score.away) {
            return true;
          }
        }
      }
      return false;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════

    setTextContent(id, text) {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    }

    animateBar(id, percent) {
      const bar = document.getElementById(id);
      if (bar) {
        setTimeout(() => { bar.style.width = Math.min(100, Math.max(0, percent)) + '%'; }, 200);
      }
    }

    formatDate(dateStr) {
      if (!dateStr) return 'Chưa xác định';
      try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', {
          weekday: 'short',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      } catch {
        return dateStr;
      }
    }

    formatDateShort(dateStr) {
      if (!dateStr) return '';
      try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      } catch {
        return '';
      }
    }

    formatTime(dateStr) {
      if (!dateStr) return '';
      try {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      } catch {
        return '';
      }
    }

    getStatusText(status) {
      const map = {
        'live': '🔴 Trực tiếp',
        'halftime': '⏸️ Nghỉ giữa hiệp',
        'finished': '✅ Kết thúc',
        'scheduled': '📅 Sắp diễn ra',
        'postponed': '⏳ Hoãn',
        'suspended': '⚠️ Tạm dừng',
        'cancelled': '❌ Hủy'
      };
      return map[status] || status;
    }

    getFlag(teamCode) {
      if (!teamCode) return '🏳️';
      if (this.data.teams && this.data.teams[teamCode]) {
        return this.data.teams[teamCode].flag || '🏳️';
      }
      return '🏳️';
    }

    getTeamName(teamCode) {
      if (!teamCode) return 'Chưa rõ';
      if (this.data.teams && this.data.teams[teamCode]) {
        return this.data.teams[teamCode].nameVi || this.data.teams[teamCode].name || teamCode;
      }
      return teamCode;
    }

    renderSkeletonCards(count) {
      let html = '';
      for (let i = 0; i < count; i++) {
        html += '<div class="skeleton skeleton-card"></div>';
      }
      return html;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TOAST NOTIFICATIONS
    // ═══════════════════════════════════════════════════════════════════════

    showToast(message, type = 'info', duration = 4000) {
      const container = document.getElementById('toast-container');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;

      const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
      toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;

      container.appendChild(toast);

      // Auto-remove
      setTimeout(() => {
        toast.classList.add('toast-hide');
        setTimeout(() => {
          if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
      }, duration);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════════════════════

    destroy() {
      if (this.countdownInterval) clearInterval(this.countdownInterval);
      if (this.autoRefreshInterval) clearInterval(this.autoRefreshInterval);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // INITIALIZE ON DOM LOAD
  // ═══════════════════════════════════════════════════════════════════════
  document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    window.app.init();
  });

})();
