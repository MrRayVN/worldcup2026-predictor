/* ═══════════════════════════════════════════════════════════════════════════════
   WC2026 PREDICTOR - DATA SERVICE (API Layer)
   Multi-source API fetcher with caching and graceful fallback
   ═══════════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  class DataService {
    constructor() {
      // Cache storage
      this.cache = {};

      // Cache TTL configuration (milliseconds)
      this.CACHE_TTL = {
        matches: 5 * 60 * 1000,        // 5 minutes for live/match data
        standings: 30 * 60 * 1000,      // 30 minutes for standings
        teams: 24 * 60 * 60 * 1000,     // 24 hours for team data
        weather: 60 * 60 * 1000,        // 1 hour for weather
        predictions: 15 * 60 * 1000     // 15 minutes for predictions
      };

      // Allow API key from URL parameter: ?apikey=YOUR_KEY (overrides default)
      const urlParams = new URLSearchParams(window.location.search);
      const userApiKey = urlParams.get('apikey') || urlParams.get('api_key') || 'ca35c74cbd8d4174af21cf360d47d1e9';

      // API endpoints (free tier, will fallback if unavailable)
      this.API_CONFIG = {
        footballData: {
          baseUrl: 'https://api.football-data.org/v4',
          competitionId: 'WC',  // World Cup
          headers: {
            'X-Auth-Token': userApiKey
          }
        },
        openWeather: {
          baseUrl: 'https://api.openweathermap.org/data/2.5',
          apiKey: '' // No key - will trigger fallback
        }
      };

      // Track API availability
      // null = chưa thử, true = đang hoạt động, false = lỗi mạng thực sự
      this.apiAvailable = {
        footballData: null,
        openWeather: null
      };

      // Log nguồn dữ liệu khi khởi tạo
      if (userApiKey) {
        console.log('[DataService] 🔑 API key được cung cấp qua URL — sẽ thử kết nối football-data.org');
      } else {
        console.log('[DataService] ⚠️ Không có API key — sử dụng dữ liệu nhúng. Thêm ?apikey=YOUR_KEY vào URL để dùng dữ liệu trực tiếp.');
      }

      // Request queue for rate limiting
      this.requestQueue = [];
      this.isProcessingQueue = false;
      this.requestDelay = 1200; // ms between requests (rate limit protection)
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CACHE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get cached data if valid
     * @param {string} key - Cache key
     * @returns {*|null} Cached data or null if expired/missing
     */
    getCached(key) {
      const entry = this.cache[key];
      if (!entry) return null;

      const now = Date.now();
      if (now - entry.timestamp > entry.ttl) {
        // Cache expired
        delete this.cache[key];
        return null;
      }

      return entry.data;
    }

    /**
     * Store data in cache
     * @param {string} key - Cache key
     * @param {*} data - Data to cache
     * @param {number} ttl - Time to live in milliseconds
     */
    setCache(key, data, ttl) {
      this.cache[key] = {
        data: data,
        timestamp: Date.now(),
        ttl: ttl
      };
    }

    /**
     * Clear all cached data
     */
    clearCache() {
      this.cache = {};
      console.log('[DataService] Bộ nhớ đệm đã được xóa');
    }

    /**
     * Clear specific cache entry
     * @param {string} key - Cache key to clear
     */
    clearCacheEntry(key) {
      delete this.cache[key];
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache stats
     */
    getCacheStats() {
      const entries = Object.keys(this.cache);
      const now = Date.now();
      let validCount = 0;
      let expiredCount = 0;

      entries.forEach(key => {
        const entry = this.cache[key];
        if (now - entry.timestamp <= entry.ttl) {
          validCount++;
        } else {
          expiredCount++;
        }
      });

      return {
        total: entries.length,
        valid: validCount,
        expired: expiredCount,
        keys: entries
      };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HTTP HELPERS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Make an HTTP request with timeout and error handling
     * @param {string} url - Request URL
     * @param {Object} options - Fetch options
     * @param {number} timeout - Timeout in ms (default 8000)
     * @returns {Promise<Object>} Response data
     */
    async httpGet(url, options = {}, timeout = 8000) {
      const doFetch = async (fetchUrl) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        try {
          const response = await fetch(fetchUrl, {
            ...options,
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return await response.json();
        } catch (err) {
          clearTimeout(timeoutId);
          throw err;
        }
      };

      const isFootballData = url.includes('api.football-data.org');

      if (!isFootballData) {
        return doFetch(url);
      }

      // Try direct first
      try {
        console.log(`[DataService] Đang gọi API trực tiếp: ${url}`);
        return await doFetch(url);
      } catch (directError) {
        console.warn(`[DataService] ⚠️ Gọi API trực tiếp thất bại (CORS/Mạng). Thử qua CORSProxy.io...`, directError.message);
        
        // Try Proxy 1: corsproxy.io
        try {
          const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(url);
          return await doFetch(proxyUrl);
        } catch (proxy1Error) {
          console.warn(`[DataService] ⚠️ CORSProxy.io thất bại. Thử qua AllOrigins...`, proxy1Error.message);
          
          // Try Proxy 2: api.allorigins.win/raw
          try {
            const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);
            return await doFetch(proxyUrl);
          } catch (proxy2Error) {
            console.error(`[DataService] ❌ Tất cả các phương thức kết nối API đều thất bại.`);
            throw new Error(`API Connection Failed: direct, corsproxy, and allorigins all failed.`);
          }
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MATCH DATA
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Merge live API matches into the local fixtures array
     * @param {Array} localMatches - Array of local matches (mutated in-place)
     * @param {Array} apiMatches - Raw API match array
     */
    mergeApiMatches(localMatches, apiMatches) {
      const stageMap = {
        'GROUP_STAGE': 'Group Stage',
        'LAST_32': 'Round of 32',
        'LAST_16': 'Round of 16',
        'QUARTER_FINALS': 'Quarter Finals',
        'SEMI_FINALS': 'Semi Finals',
        'FINAL': 'Final'
      };

      // 1. Merge Group Stage Matches (by matching home/away team codes)
      const apiGroupMatches = apiMatches.filter(m => m.stage === 'GROUP_STAGE');
      apiGroupMatches.forEach(m => {
        let homeCode = m.homeTeam.tla;
        let awayCode = m.awayTeam.tla;
        if (homeCode === 'URY') homeCode = 'URU';
        if (awayCode === 'URY') awayCode = 'URU';

        const localMatch = localMatches.find(l => 
          l.stage === 'Group Stage' &&
          ((l.homeTeam.code === homeCode && l.awayTeam.code === awayCode) ||
           (l.homeTeam.code === awayCode && l.awayTeam.code === homeCode))
        );

        if (localMatch) {
          const isSwapped = localMatch.homeTeam.code === awayCode;
          localMatch.status = this.normalizeStatus(m.status);
          
          if (m.score && m.score.fullTime && m.score.fullTime.home !== null && m.score.fullTime.away !== null) {
            localMatch.score.home = isSwapped ? m.score.fullTime.away : m.score.fullTime.home;
            localMatch.score.away = isSwapped ? m.score.fullTime.home : m.score.fullTime.away;
          }
          if (m.utcDate) localMatch.utcDate = m.utcDate;
          if (m.referees && m.referees.length > 0) {
            localMatch.referee = m.referees[0].name;
          }
        }
      });

      // 2. Merge Knockout Stage Matches (by matching stage and date-based ordering)
      const knockoutStages = ['LAST_32', 'LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'];
      knockoutStages.forEach(stage => {
        const apiStageMatches = apiMatches
          .filter(m => m.stage === stage)
          .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
        
        const localRoundName = stageMap[stage];
        const localStageMatches = localMatches
          .filter(l => l.stage === localRoundName)
          .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

        for (let i = 0; i < Math.min(apiStageMatches.length, localStageMatches.length); i++) {
          const am = apiStageMatches[i];
          const lm = localStageMatches[i];

          let homeCode = am.homeTeam.tla;
          let awayCode = am.awayTeam.tla;
          if (homeCode === 'URY') homeCode = 'URU';
          if (awayCode === 'URY') awayCode = 'URU';

          if (homeCode && awayCode) {
            // Update codes and details
            lm.homeTeam.code = homeCode;
            lm.homeTeam.name = window.WC2026_DATA.teams[homeCode] ? (window.WC2026_DATA.teams[homeCode].nameVi || window.WC2026_DATA.teams[homeCode].name) : am.homeTeam.name;
            lm.homeTeam.flag = this.getTeamFlag(homeCode);

            lm.awayTeam.code = awayCode;
            lm.awayTeam.name = window.WC2026_DATA.teams[awayCode] ? (window.WC2026_DATA.teams[awayCode].nameVi || window.WC2026_DATA.teams[awayCode].name) : am.awayTeam.name;
            lm.awayTeam.flag = this.getTeamFlag(awayCode);

            lm.status = this.normalizeStatus(am.status);
            if (am.score && am.score.fullTime && am.score.fullTime.home !== null && am.score.fullTime.away !== null) {
              lm.score.home = am.score.fullTime.home;
              lm.score.away = am.score.fullTime.away;
            }
            if (am.utcDate) lm.utcDate = am.utcDate;
            if (am.referees && am.referees.length > 0) {
              lm.referee = am.referees[0].name;
            }
          }
        }
      });
    }

    /**
     * Fetch all matches - tries API first, falls back to embedded data
     * @param {Object} filters - Optional filters { status, matchday, dateFrom, dateTo }
     * @returns {Promise<Array>} Array of match/fixture objects
     */
    async fetchMatches(filters = {}) {
      const todayKey = new Date().toISOString().slice(0, 10);
      const cacheKey = 'matches_all_' + todayKey;
      let matches = this.getCached(cacheKey);

      if (!matches) {
        matches = this.getEmbeddedMatches({}); // Complete local list (unfiltered)

        // API Fetch
        if (this.apiAvailable.footballData !== false) {
          try {
            console.log('[DataService] 🌐 Đang tải dữ liệu từ api-matches.json (do GitHub Actions tạo)...');
            // Thử tải từ file json tĩnh do Github Action tạo ra
            const url = './api-matches.json';
            const response = await fetch(url);
            if (response.ok) {
              const data = await response.json();
              if (data && data.matches && data.matches.length > 0) {
                this.mergeApiMatches(matches, data.matches);
                this.apiAvailable.footballData = true;
                console.log(`[DataService] ✅ Đã tích hợp thành công dữ liệu từ api-matches.json`);
              }
            } else {
               console.warn('[DataService] ❌ api-matches.json không tồn tại (Có thể Github Actions chưa chạy).');
            }
          } catch (error) {
            this.apiAvailable.footballData = false;
            console.warn('[DataService] ❌ Lỗi khi đọc api-matches.json:', error.message);
          }
        }

        // Auto-close past matches
        matches = this.autoClosePastMatches(matches);

        // Cache the complete merged list
        const ttl = this.CACHE_TTL.matches;
        this.setCache(cacheKey, matches, ttl);
      } else {
        console.log('[DataService] Trả về dữ liệu trận đấu (merged) từ bộ nhớ đệm');
      }

      // Return clones to prevent external mutations affecting cache
      let filteredMatches = matches.map(m => ({
        ...m,
        homeTeam: { ...m.homeTeam },
        awayTeam: { ...m.awayTeam },
        score: { ...m.score }
      }));

      if (filters.status) {
        filteredMatches = filteredMatches.filter(m => m.status === filters.status);
      }
      if (filters.matchday) {
        filteredMatches = filteredMatches.filter(m => m.matchday === parseInt(filters.matchday));
      }
      if (filters.dateFrom) {
        const from = new Date(filters.dateFrom);
        filteredMatches = filteredMatches.filter(m => new Date(m.utcDate) >= from);
      }
      if (filters.dateTo) {
        const to = new Date(filters.dateTo);
        filteredMatches = filteredMatches.filter(m => new Date(m.utcDate) <= to);
      }

      return filteredMatches;
    }

    /**
     * Auto-close: các trận đã qua giờ mà vẫn 'scheduled' → chuyển 'finished' với tỉ số tạm 0-0
     * và đánh dấu _autoClosed=true để sau này dễ lọc / cập nhật tỉ số thật.
     * @param {Array} matches - Danh sách trận
     * @returns {Array} Danh sách đã được auto-close
     */
    autoClosePastMatches(matches) {
      const now = Date.now();
      let closedCount = 0;
      const result = matches.map(m => {
        const ts = m.utcDate ? new Date(m.utcDate).getTime() : null;
        if (m.status === 'scheduled' && ts != null && !isNaN(ts) && ts < now) {
          closedCount++;
          return {
            ...m,
            status: 'finished',
            score: { home: 0, away: 0 },
            homeScore: 0,
            awayScore: 0,
            _autoClosed: true
          };
        }
        return m;
      });
      if (closedCount > 0) {
        console.log(`[DataService] Auto-close: đã đóng ${closedCount} trận quá giờ`);
      }
      return result;
    }

    /**
     * Fetch a single match by ID
     * @param {string|number} matchId - Match identifier
     * @returns {Promise<Object|null>} Match object or null
     */
    async fetchMatch(matchId) {
      const cacheKey = 'match_' + matchId;
      const cached = this.getCached(cacheKey);
      if (cached) return cached;

      // Try to find in all matches
      const allMatches = await this.fetchMatches();
      const match = allMatches.find(m => String(m.id) === String(matchId));

      if (match) {
        this.setCache(cacheKey, match, this.CACHE_TTL.matches);
      }

      return match || null;
    }

    /**
     * Normalize API match data to our internal format
     * @param {Array} apiMatches - Raw API match data
     * @returns {Array} Normalized matches
     */
    normalizeApiMatches(apiMatches) {
      return apiMatches.map(m => ({
        id: m.id,
        utcDate: m.utcDate,
        status: this.normalizeStatus(m.status),
        matchday: m.matchday,
        stage: m.stage,
        group: m.group ? m.group.replace('GROUP_', '') : null,
        homeTeam: {
          code: m.homeTeam.tla || m.homeTeam.shortName,
          name: m.homeTeam.name,
          flag: this.getTeamFlag(m.homeTeam.tla)
        },
        awayTeam: {
          code: m.awayTeam.tla || m.awayTeam.shortName,
          name: m.awayTeam.name,
          flag: this.getTeamFlag(m.awayTeam.tla)
        },
        score: {
          home: m.score.fullTime.home,
          away: m.score.fullTime.away
        },
        venue: m.venue || 'Chưa xác định'
      }));
    }

    /**
     * Normalize match status from API to internal status
     * @param {string} apiStatus - API status string
     * @returns {string} Normalized status
     */
    normalizeStatus(apiStatus) {
      const statusMap = {
        'SCHEDULED': 'scheduled',
        'TIMED': 'scheduled',
        'IN_PLAY': 'live',
        'PAUSED': 'halftime',
        'FINISHED': 'finished',
        'SUSPENDED': 'suspended',
        'POSTPONED': 'postponed',
        'CANCELLED': 'cancelled',
        'AWARDED': 'finished'
      };
      return statusMap[apiStatus] || 'scheduled';
    }

    /**
     * Get matches from embedded WC2026_DATA
     * @param {Object} filters - Filters to apply
     * @returns {Array} Filtered matches
     */
    getEmbeddedMatches(filters = {}) {
      const data = window.WC2026_DATA;
      if (!data || !data.fixtures) {
        console.warn('[DataService] Không tìm thấy WC2026_DATA.fixtures');
        return [];
      }

      // Normalize embedded fixtures to the shape app.js expects
      let matches = data.fixtures.map(f => {
        const homeTeamData = data.teams ? data.teams[f.homeTeam] : null;
        const awayTeamData = data.teams ? data.teams[f.awayTeam] : null;
        const homeCode = typeof f.homeTeam === 'string' ? f.homeTeam : (f.homeTeam && f.homeTeam.code) || '???';
        const awayCode = typeof f.awayTeam === 'string' ? f.awayTeam : (f.awayTeam && f.awayTeam.code) || '???';

        return {
          id: f.id,
          utcDate: f.date || f.utcDate,
          status: f.status || 'scheduled',
          matchday: f.matchday,
          stage: f.round || f.stage || 'Group Stage',
          group: f.group || null,
          homeTeam: {
            code: homeCode,
            name: homeTeamData ? homeTeamData.name : homeCode,
            flag: homeTeamData ? homeTeamData.flag : '🏳️'
          },
          awayTeam: {
            code: awayCode,
            name: awayTeamData ? awayTeamData.name : awayCode,
            flag: awayTeamData ? awayTeamData.flag : '🏳️'
          },
          score: {
            home: f.homeScore != null ? f.homeScore : null,
            away: f.awayScore != null ? f.awayScore : null
          },
          venue: f.stadium || f.venue || 'Chưa xác định',
          stadium: f.stadium || null,
          city: f.city || '',
          referee: f.referee || null
        };
      });

      // Auto-close các trận đã qua giờ nhưng vẫn 'scheduled' (an toàn — chỉ đánh dấu, không tự đặt tỉ số thật)
      matches = this.autoClosePastMatches(matches);

      // Apply filters
      if (filters.status) {
        matches = matches.filter(m => m.status === filters.status);
      }
      if (filters.matchday) {
        matches = matches.filter(m => m.matchday === parseInt(filters.matchday));
      }
      if (filters.dateFrom) {
        const from = new Date(filters.dateFrom);
        matches = matches.filter(m => new Date(m.utcDate) >= from);
      }
      if (filters.dateTo) {
        const to = new Date(filters.dateTo);
        matches = matches.filter(m => new Date(m.utcDate) <= to);
      }

      return matches;
    }

    /**
     * Get live matches only
     * @returns {Promise<Array>} Live matches
     */
    async fetchLiveMatches() {
      const allMatches = await this.fetchMatches();
      return allMatches.filter(m => m.status === 'live' || m.status === 'halftime');
    }

    /**
     * Get recently finished matches
     * @param {number} limit - Max results
     * @returns {Promise<Array>} Recent matches
     */
    async fetchRecentMatches(limit = 6) {
      const allMatches = await this.fetchMatches();
      return allMatches
        .filter(m => m.status === 'finished')
        .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))
        .slice(0, limit);
    }

    /**
     * Get upcoming scheduled matches
     * @param {number} limit - Max results
     * @returns {Promise<Array>} Upcoming matches
     */
    async fetchUpcomingMatches(limit = 6) {
      const allMatches = await this.fetchMatches();
      const now = new Date();
      return allMatches
        .filter(m => m.status === 'scheduled' && new Date(m.utcDate) > now)
        .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))
        .slice(0, limit);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STANDINGS / GROUP DATA
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Fetch group standings
     * @returns {Promise<Object>} Standings grouped by group code
     */
    async fetchStandings() {
      const cacheKey = 'standings';
      const cached = this.getCached(cacheKey);
      if (cached) {
        console.log('[DataService] Trả về bảng xếp hạng từ bộ nhớ đệm');
        return cached;
      }

      let standings = null;

      // Attempt API fetch
      if (this.apiAvailable.footballData !== false) {
        try {
          const url = `${this.API_CONFIG.footballData.baseUrl}/competitions/${this.API_CONFIG.footballData.competitionId}/standings`;
          const data = await this.httpGet(url, {
            headers: this.API_CONFIG.footballData.headers
          });

          if (data && data.standings) {
            standings = this.normalizeApiStandings(data.standings);
            console.log('[DataService] Đã tải bảng xếp hạng từ API');
          }
        } catch (error) {
          console.log('[DataService] Không tải được bảng xếp hạng từ API:', error.message);
        }
      }

      // Fallback: Calculate from embedded data
      if (!standings || Object.keys(standings).length === 0) {
        standings = this.calculateStandingsFromFixtures();
        console.log('[DataService] Tính bảng xếp hạng từ dữ liệu nhúng');
      }

      this.setCache(cacheKey, standings, this.CACHE_TTL.standings);
      return standings;
    }

    /**
     * Normalize API standings to internal format
     * @param {Array} apiStandings - Raw API standings
     * @returns {Object} Normalized standings keyed by group
     */
    normalizeApiStandings(apiStandings) {
      const result = {};

      apiStandings.forEach(group => {
        if (group.type === 'TOTAL' && group.group) {
          const groupCode = group.group.replace('GROUP_', '');
          result[groupCode] = group.table.map((entry, idx) => {
            let teamCode = entry.team.tla;
            if (teamCode === 'URY') teamCode = 'URU';
            return {
              position: idx + 1,
              team: {
                code: teamCode,
                name: entry.team.name,
                flag: this.getTeamFlag(teamCode)
              },
              played: entry.playedGames,
              won: entry.won,
              draw: entry.draw,
              lost: entry.lost,
              goalsFor: entry.goalsFor,
              goalsAgainst: entry.goalsAgainst,
              goalDifference: entry.goalDifference,
              points: entry.points
            };
          });
        }
      });

      return result;
    }

    /**
     * Calculate standings from fixture results (embedded data)
     * @returns {Object} Calculated standings keyed by group
     */
    calculateStandingsFromFixtures() {
      const data = window.WC2026_DATA;
      if (!data || !data.groups || !data.teams) return {};

      const standings = {};

      Object.keys(data.groups).forEach(groupCode => {
        const groupData = data.groups[groupCode];
        // Handle both formats: array of codes or object with .teams
        const groupTeamCodes = Array.isArray(groupData) ? groupData : (groupData.teams || []);
        const teamStats = {};

        // Initialize stats for each team
        groupTeamCodes.forEach(code => {
          const team = data.teams[code];
          if (team) {
            teamStats[code] = {
              team: {
                code: code,
                name: team.nameVi || team.name,
                flag: team.flag || '🏳️'
              },
              played: 0,
              won: 0,
              draw: 0,
              lost: 0,
              goalsFor: 0,
              goalsAgainst: 0,
              goalDifference: 0,
              points: 0
            };
          }
        });

        // Process fixtures for this group
        if (data.fixtures) {
          data.fixtures
            .filter(f => f.group === groupCode && f.status === 'finished')
            .forEach(f => {
              // Handle both formats: homeTeam can be string code or object
              const home = typeof f.homeTeam === 'string' ? f.homeTeam : (f.homeTeam && f.homeTeam.code);
              const away = typeof f.awayTeam === 'string' ? f.awayTeam : (f.awayTeam && f.awayTeam.code);
              // Handle both score formats
              const hGoals = f.homeScore != null ? f.homeScore : (f.score && f.score.home);
              const aGoals = f.awayScore != null ? f.awayScore : (f.score && f.score.away);

              if (teamStats[home] && teamStats[away] && hGoals != null && aGoals != null) {
                teamStats[home].played++;
                teamStats[away].played++;
                teamStats[home].goalsFor += hGoals;
                teamStats[home].goalsAgainst += aGoals;
                teamStats[away].goalsFor += aGoals;
                teamStats[away].goalsAgainst += hGoals;

                if (hGoals > aGoals) {
                  teamStats[home].won++;
                  teamStats[home].points += 3;
                  teamStats[away].lost++;
                } else if (hGoals < aGoals) {
                  teamStats[away].won++;
                  teamStats[away].points += 3;
                  teamStats[home].lost++;
                } else {
                  teamStats[home].draw++;
                  teamStats[away].draw++;
                  teamStats[home].points += 1;
                  teamStats[away].points += 1;
                }

                teamStats[home].goalDifference = teamStats[home].goalsFor - teamStats[home].goalsAgainst;
                teamStats[away].goalDifference = teamStats[away].goalsFor - teamStats[away].goalsAgainst;
              }
            });
        }

        // Sort: points > goalDifference > goalsFor
        const sorted = Object.values(teamStats).sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
          return b.goalsFor - a.goalsFor;
        });

        // Assign positions
        sorted.forEach((entry, idx) => {
          entry.position = idx + 1;
        });

        standings[groupCode] = sorted;
      });

      return standings;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TEAM DATA
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Fetch detailed stats for a specific team
     * @param {string} teamCode - Team code (e.g., 'BRA', 'FRA')
     * @returns {Promise<Object|null>} Team stats or null
     */
    async fetchTeamStats(teamCode) {
      const cacheKey = 'team_' + teamCode;
      const cached = this.getCached(cacheKey);
      if (cached) return cached;

      let teamData = null;

      // Attempt API
      if (this.apiAvailable.footballData !== false) {
        try {
          // Football-data.org doesn't have a direct team-in-competition endpoint easily,
          // so we skip and use embedded data
          throw new Error('Sử dụng dữ liệu nhúng cho thông tin đội');
        } catch (error) {
          // Expected - use embedded data
        }
      }

      // Use embedded data
      const data = window.WC2026_DATA;
      if (data && data.teams && data.teams[teamCode]) {
        teamData = { ...data.teams[teamCode], code: teamCode };

        // Enrich with computed stats from fixtures
        if (data.fixtures) {
          const teamFixtures = data.fixtures.filter(f => {
            const hCode = typeof f.homeTeam === 'string' ? f.homeTeam : (f.homeTeam && f.homeTeam.code);
            const aCode = typeof f.awayTeam === 'string' ? f.awayTeam : (f.awayTeam && f.awayTeam.code);
            return hCode === teamCode || aCode === teamCode;
          });

          const finishedFixtures = teamFixtures.filter(f => f.status === 'finished');

          let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;

          finishedFixtures.forEach(f => {
            const hCode = typeof f.homeTeam === 'string' ? f.homeTeam : (f.homeTeam && f.homeTeam.code);
            const isHome = hCode === teamCode;
            const gf = isHome
              ? (f.homeScore != null ? f.homeScore : (f.score && f.score.home))
              : (f.awayScore != null ? f.awayScore : (f.score && f.score.away));
            const ga = isHome
              ? (f.awayScore != null ? f.awayScore : (f.score && f.score.away))
              : (f.homeScore != null ? f.homeScore : (f.score && f.score.home));

            if (gf != null && ga != null) {
              goalsFor += gf;
              goalsAgainst += ga;
              if (gf > ga) wins++;
              else if (gf < ga) losses++;
              else draws++;
            }
          });

          teamData.tournamentRecord = {
            played: finishedFixtures.length,
            wins,
            draws,
            losses,
            goalsFor,
            goalsAgainst,
            goalDifference: goalsFor - goalsAgainst,
            points: wins * 3 + draws
          };

          teamData.fixtures = teamFixtures;
        }
      }

      if (teamData) {
        this.setCache(cacheKey, teamData, this.CACHE_TTL.teams);
      }

      return teamData;
    }

    /**
     * Fetch all teams
     * @returns {Promise<Object>} All teams keyed by code
     */
    async fetchAllTeams() {
      const cacheKey = 'all_teams';
      const cached = this.getCached(cacheKey);
      if (cached) return cached;

      const data = window.WC2026_DATA;
      const teams = (data && data.teams) ? { ...data.teams } : {};

      this.setCache(cacheKey, teams, this.CACHE_TTL.teams);
      return teams;
    }

    /**
     * Get team flag emoji from code
     * @param {string} teamCode - Team code
     * @returns {string} Flag emoji
     */
    getTeamFlag(teamCode) {
      const data = window.WC2026_DATA;
      if (data && data.teams && data.teams[teamCode]) {
        return data.teams[teamCode].flag || '🏳️';
      }
      return '🏳️';
    }

    // ═══════════════════════════════════════════════════════════════════════
    // WEATHER DATA
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Fetch weather data for a stadium city
     * @param {string} city - City name
     * @returns {Promise<Object>} Weather data
     */
    async fetchWeather(city) {
      const cacheKey = 'weather_' + city.toLowerCase();
      const cached = this.getCached(cacheKey);
      if (cached) return cached;

      let weather = null;

      // Attempt OpenWeatherMap API
      if (this.apiAvailable.openWeather !== false && this.API_CONFIG.openWeather.apiKey) {
        try {
          const url = `${this.API_CONFIG.openWeather.baseUrl}/weather?q=${encodeURIComponent(city)}&appid=${this.API_CONFIG.openWeather.apiKey}&units=metric&lang=vi`;
          const data = await this.httpGet(url, {}, 5000);

          weather = {
            city: city,
            temp: Math.round(data.main.temp),
            humidity: data.main.humidity,
            description: data.weather[0].description,
            icon: data.weather[0].icon,
            wind: Math.round(data.wind.speed * 3.6), // m/s to km/h
            source: 'api'
          };

          this.apiAvailable.openWeather = true;
          console.log(`[DataService] Thời tiết ${city}: ${weather.temp}°C`);
        } catch (error) {
          this.apiAvailable.openWeather = false;
          console.log('[DataService] API thời tiết không khả dụng:', error.message);
        }
      }

      // Fallback: Use embedded stadium data
      if (!weather) {
        weather = this.getEmbeddedWeather(city);
      }

      if (weather) {
        this.setCache(cacheKey, weather, this.CACHE_TTL.weather);
      }

      return weather;
    }

    /**
     * Get estimated weather from embedded stadium data
     * @param {string} city - City name
     * @returns {Object} Estimated weather
     */
    getEmbeddedWeather(city) {
      const data = window.WC2026_DATA;

      // Check if we have stadium data with weather
      if (data && data.stadiums) {
        const stadium = Object.values(data.stadiums).find(
          s => s.city && s.city.toLowerCase() === city.toLowerCase()
        );

        if (stadium && stadium.weather) {
          return {
            city: city,
            temp: stadium.weather.avgTemp || 25,
            humidity: stadium.weather.avgHumidity || 60,
            description: stadium.weather.description || 'Nắng nhẹ',
            wind: stadium.weather.avgWind || 10,
            source: 'embedded'
          };
        }
      }

      // Default weather for North American summer (June-July)
      const cityWeatherDefaults = {
        'New York': { temp: 28, humidity: 65, description: 'Nắng nóng' },
        'Los Angeles': { temp: 24, humidity: 55, description: 'Nắng đẹp' },
        'Miami': { temp: 31, humidity: 75, description: 'Nóng ẩm' },
        'Houston': { temp: 33, humidity: 70, description: 'Nóng' },
        'Dallas': { temp: 34, humidity: 55, description: 'Nắng nóng' },
        'Seattle': { temp: 21, humidity: 60, description: 'Mát mẻ' },
        'Philadelphia': { temp: 29, humidity: 65, description: 'Ấm áp' },
        'Atlanta': { temp: 31, humidity: 70, description: 'Nóng ẩm' },
        'Boston': { temp: 26, humidity: 65, description: 'Ấm áp' },
        'Kansas City': { temp: 30, humidity: 60, description: 'Nắng nóng' },
        'San Francisco': { temp: 19, humidity: 70, description: 'Mát mẻ, sương mù' },
        'Mexico City': { temp: 22, humidity: 55, description: 'Ôn hòa' },
        'Guadalajara': { temp: 26, humidity: 60, description: 'Ấm áp' },
        'Monterrey': { temp: 33, humidity: 50, description: 'Nóng khô' },
        'Toronto': { temp: 25, humidity: 60, description: 'Ấm áp' },
        'Vancouver': { temp: 20, humidity: 65, description: 'Mát mẻ' }
      };

      const defaultWeather = cityWeatherDefaults[city] || { temp: 25, humidity: 60, description: 'Bình thường' };

      return {
        city: city,
        temp: defaultWeather.temp,
        humidity: defaultWeather.humidity,
        description: defaultWeather.description,
        wind: 12,
        source: 'default'
      };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DATA MERGING
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Merge API data with embedded data, preferring API for live info
     * @param {Array} apiData - Data from API
     * @param {Array} embeddedData - Embedded fallback data
     * @returns {Array} Merged data
     */
    mergeData(apiData, embeddedData) {
      if (!apiData || apiData.length === 0) return embeddedData || [];
      if (!embeddedData || embeddedData.length === 0) return apiData;

      const mergedMap = new Map();

      // Start with embedded data as base
      embeddedData.forEach(item => {
        const key = this.getMatchKey(item);
        mergedMap.set(key, { ...item });
      });

      // Override with API data (has fresher scores/status)
      apiData.forEach(item => {
        const key = this.getMatchKey(item);
        const existing = mergedMap.get(key);

        if (existing) {
          // Merge: keep embedded details, update live info from API
          mergedMap.set(key, {
            ...existing,
            status: item.status,
            score: item.score,
            // Keep embedded venue/details if API doesn't have them
            venue: item.venue || existing.venue
          });
        } else {
          // New match from API
          mergedMap.set(key, item);
        }
      });

      return Array.from(mergedMap.values());
    }

    /**
     * Generate a unique key for a match (for merging)
     * @param {Object} match - Match object
     * @returns {string} Unique key
     */
    getMatchKey(match) {
      const homeCode = match.homeTeam ? match.homeTeam.code : 'UNK';
      const awayCode = match.awayTeam ? match.awayTeam.code : 'UNK';
      const date = match.utcDate ? match.utcDate.substring(0, 10) : 'nodate';
      return `${homeCode}_${awayCode}_${date}`;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UTILITY METHODS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get the next upcoming match (for countdown)
     * @returns {Promise<Object|null>} Next match or null
     */
    async getNextMatch() {
      const upcoming = await this.fetchUpcomingMatches(1);
      return upcoming.length > 0 ? upcoming[0] : null;
    }

    /**
     * Get tournament statistics
     * @returns {Promise<Object>} Tournament stats
     */
    async getTournamentStats() {
      const allMatches = await this.fetchMatches();

      const finished = allMatches.filter(m => m.status === 'finished');
      const totalGoals = finished.reduce((sum, m) => {
        return sum + (m.score.home || 0) + (m.score.away || 0);
      }, 0);

      const homeWins = finished.filter(m => m.score.home > m.score.away).length;
      const draws = finished.filter(m => m.score.home === m.score.away).length;
      const awayWins = finished.filter(m => m.score.home < m.score.away).length;
      const btts = finished.filter(m => m.score.home > 0 && m.score.away > 0).length;
      const over25 = finished.filter(m => (m.score.home + m.score.away) > 2.5).length;

      return {
        totalMatches: allMatches.length,
        matchesPlayed: finished.length,
        totalGoals: totalGoals,
        avgGoals: finished.length > 0 ? (totalGoals / finished.length).toFixed(2) : '0.00',
        homeWinPct: finished.length > 0 ? Math.round((homeWins / finished.length) * 100) : 0,
        drawPct: finished.length > 0 ? Math.round((draws / finished.length) * 100) : 0,
        awayWinPct: finished.length > 0 ? Math.round((awayWins / finished.length) * 100) : 0,
        bttsPct: finished.length > 0 ? Math.round((btts / finished.length) * 100) : 0,
        over25Pct: finished.length > 0 ? Math.round((over25 / finished.length) * 100) : 0,
        liveMatches: allMatches.filter(m => m.status === 'live' || m.status === 'halftime').length
      };
    }

    /**
     * Check if any API is available
     * @returns {boolean} True if at least one API is working
     */
    isApiAvailable() {
      return this.apiAvailable.footballData === true;
    }

    /**
     * Get data source status
     * @returns {Object} Status of each data source
     */
    getDataSourceStatus() {
      return {
        footballData: this.apiAvailable.footballData === true ? 'Kết nối' :
          this.apiAvailable.footballData === false ? 'Không khả dụng' : 'Chưa kiểm tra',
        openWeather: this.apiAvailable.openWeather === true ? 'Kết nối' :
          this.apiAvailable.openWeather === false ? 'Không khả dụng' : 'Chưa kiểm tra',
        embeddedData: (window.WC2026_DATA) ? 'Sẵn sàng' : 'Không có'
      };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DATA SOURCE LOGGING
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * In ra console nguồn dữ liệu đang được sử dụng
     * Gọi sau khi đã fetch dữ liệu lần đầu để có kết quả chính xác
     */
    logDataSource() {
      const status = this.getDataSourceStatus();
      const hasApiKey = !!this.API_CONFIG.footballData.headers['X-Auth-Token'];

      console.group('[DataService] 📊 Trạng thái nguồn dữ liệu');
      console.log(`  ⚽ Football-Data.org: ${status.footballData}${hasApiKey ? ' (có API key)' : ' (không có key)'}`);
      console.log(`  🌤️ OpenWeather:       ${status.openWeather}`);
      console.log(`  💾 Dữ liệu nhúng:     ${status.embeddedData}`);

      if (this.apiAvailable.footballData === true) {
        console.log('  → Đang sử dụng: DỮ LIỆU TRỰC TIẾP từ football-data.org');
      } else if (hasApiKey && this.apiAvailable.footballData === false) {
        console.log('  → Đang sử dụng: DỮ LIỆU NHÚNG (API key không hợp lệ hoặc lỗi mạng)');
      } else {
        console.log('  → Đang sử dụng: DỮ LIỆU NHÚNG (không có API key)');
      }
      console.groupEnd();

      return status;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // EXPORT TO GLOBAL
  // ═══════════════════════════════════════════════════════════════════════
  window.DataService = DataService;

})();
