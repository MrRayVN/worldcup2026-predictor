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

      // API endpoints (free tier, will fallback if unavailable)
      this.API_CONFIG = {
        footballData: {
          baseUrl: 'https://api.football-data.org/v4',
          competitionId: 'WC',  // World Cup
          headers: {
            'X-Auth-Token': '' // No key - will trigger fallback
          }
        },
        openWeather: {
          baseUrl: 'https://api.openweathermap.org/data/2.5',
          apiKey: '' // No key - will trigger fallback
        }
      };

      // Track API availability
      this.apiAvailable = {
        footballData: null, // null = unknown, true/false after first attempt
        openWeather: null
      };

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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
          throw new Error(`Hết thời gian chờ kết nối (${timeout}ms)`);
        }

        throw error;
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MATCH DATA
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Fetch all matches - tries API first, falls back to embedded data
     * @param {Object} filters - Optional filters { status, matchday, dateFrom, dateTo }
     * @returns {Promise<Array>} Array of match/fixture objects
     */
    async fetchMatches(filters = {}) {
      const cacheKey = 'matches_' + JSON.stringify(filters);
      const cached = this.getCached(cacheKey);
      if (cached) {
        console.log('[DataService] Trả về dữ liệu trận đấu từ bộ nhớ đệm');
        return cached;
      }

      let matches = null;

      // Attempt 1: Try football-data.org API
      if (this.apiAvailable.footballData !== false) {
        try {
          console.log('[DataService] Đang tải dữ liệu từ football-data.org...');
          const params = new URLSearchParams();
          if (filters.status) params.append('status', filters.status);
          if (filters.matchday) params.append('matchday', filters.matchday);
          if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
          if (filters.dateTo) params.append('dateTo', filters.dateTo);

          const queryStr = params.toString() ? '?' + params.toString() : '';
          const url = `${this.API_CONFIG.footballData.baseUrl}/competitions/${this.API_CONFIG.footballData.competitionId}/matches${queryStr}`;

          const data = await this.httpGet(url, {
            headers: this.API_CONFIG.footballData.headers
          });

          if (data && data.matches && data.matches.length > 0) {
            matches = this.normalizeApiMatches(data.matches);
            this.apiAvailable.footballData = true;
            console.log(`[DataService] Đã tải ${matches.length} trận từ API`);
          }
        } catch (error) {
          this.apiAvailable.footballData = false;
          console.log('[DataService] API không khả dụng, chuyển sang dữ liệu nhúng:', error.message);
        }
      }

      // Fallback: Use embedded data from WC2026_DATA
      if (!matches) {
        matches = this.getEmbeddedMatches(filters);
        console.log(`[DataService] Sử dụng dữ liệu nhúng: ${matches.length} trận đấu`);
      }

      // Cache the result
      const ttl = this.CACHE_TTL.matches;
      this.setCache(cacheKey, matches, ttl);

      return matches;
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
      if (!standings) {
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
          result[groupCode] = group.table.map((entry, idx) => ({
            position: idx + 1,
            team: {
              code: entry.team.tla,
              name: entry.team.name,
              flag: this.getTeamFlag(entry.team.tla)
            },
            played: entry.playedGames,
            won: entry.won,
            draw: entry.draw,
            lost: entry.lost,
            goalsFor: entry.goalsFor,
            goalsAgainst: entry.goalsAgainst,
            goalDifference: entry.goalDifference,
            points: entry.points
          }));
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
  }

  // ═══════════════════════════════════════════════════════════════════════
  // EXPORT TO GLOBAL
  // ═══════════════════════════════════════════════════════════════════════
  window.DataService = DataService;

})();
