/**
 * World Cup 2026 Prediction Engine
 * Hybrid Poisson-Elo model with 20 weighted factors
 * Dixon-Coles low-score correction
 * Monte Carlo group-stage simulation
 *
 * Exposed as: window.PredictionEngine
 */
(function () {
  'use strict';

  /* ──────────────────────────────────────────────
   *  Constants
   * ────────────────────────────────────────────── */
  var TOURNAMENT_AVG_GOALS = 2.7;          // historical WC average
  var MAX_GOALS            = 6;            // score-matrix dimension 0-6
  var MONTE_CARLO_RUNS     = 10000;
  var ELO_K_FACTOR         = 60;           // WC K-factor (FIFA uses 60)
  var POISSON_CACHE        = {};           // memoize Poisson PMF

  /* style interaction matrix: [home style][away style] → home bonus */
  var STYLE_MATRIX = {
    'possession':     { 'possession': 0, 'counter-attack': -0.06, 'defensive': 0.03,  'balanced': 0.02,  'pressing': -0.03 },
    'counter-attack': { 'possession': 0.06, 'counter-attack': 0, 'defensive': -0.02, 'balanced': 0.02,  'pressing': -0.01 },
    'defensive':      { 'possession': -0.03, 'counter-attack': 0.02, 'defensive': 0, 'balanced': -0.02, 'pressing': -0.04 },
    'balanced':       { 'possession': -0.02, 'counter-attack': -0.02, 'defensive': 0.02, 'balanced': 0,  'pressing': 0 },
    'pressing':       { 'possession': 0.03, 'counter-attack': 0.01, 'defensive': 0.04, 'balanced': 0,    'pressing': 0 }
  };

  /* confederation climate profile (avg temp in home region) */
  var CONFED_CLIMATE = {
    'UEFA': 18, 'CONMEBOL': 24, 'CONCACAF': 28, 'CAF': 30,
    'AFC': 26, 'OFC': 24
  };

  /* factor weights – must sum to 1.0 */
  var WEIGHTS = {
    fifaRanking:       0.10,
    eloRating:         0.10,
    recentForm:        0.10,
    headToHead:        0.06,
    attackStrength:    0.07,
    defenseStrength:   0.07,
    homeAdvantage:     0.05,
    wcHistory:         0.04,
    confedStrength:    0.03,
    restDays:          0.03,
    matchStage:        0.04,
    motivation:        0.03,
    refereeStyle:      0.03,
    weather:           0.03,
    altitude:          0.02,
    travelJetLag:      0.03,
    squadExperience:   0.03,
    squadAge:          0.02,
    keyPlayerAvail:    0.05,
    tacticalMatchup:   0.05
  };

  /* ──────────────────────────────────────────────
   *  Utilities
   * ────────────────────────────────────────────── */
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function factorial(n) {
    if (n <= 1) return 1;
    var r = 1;
    for (var i = 2; i <= n; i++) r *= i;
    return r;
  }

  function poissonPMF(k, lambda) {
    var key = k + '_' + lambda.toFixed(6);
    if (POISSON_CACHE[key] !== undefined) return POISSON_CACHE[key];
    var val = Math.pow(lambda, k) * Math.exp(-lambda) / factorial(k);
    POISSON_CACHE[key] = val;
    return val;
  }

  /** Elo expected score for team A vs team B */
  function eloExpected(rA, rB) {
    return 1 / (1 + Math.pow(10, (rB - rA) / 400));
  }

  /** Linear normalisation of `v` from [lo,hi] to [0,1] */
  function norm(v, lo, hi) {
    if (hi === lo) return 0.5;
    return clamp((v - lo) / (hi - lo), 0, 1);
  }

  /** Safe lookup helper */
  function safeGet(obj, path, fallback) {
    if (!obj) return fallback;
    var parts = path.split('.');
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return fallback;
      cur = cur[parts[i]];
    }
    return cur != null ? cur : fallback;
  }

  /** Haversine distance (km) between two lat/lng pairs */
  function haversine(lat1, lng1, lat2, lng2) {
    var R = 6371;
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLng = (lng2 - lng1) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /** Country-code → approximate lat/lng centroid (simplified table) */
  var COUNTRY_COORDS = {
    ARG:[-34.6,-58.4],BRA:[-15.8,-47.9],GER:[52.5,13.4],FRA:[48.9,2.3],
    ESP:[40.4,-3.7],ENG:[51.5,-0.1],ITA:[41.9,12.5],POR:[38.7,-9.1],
    NED:[52.4,4.9],BEL:[50.8,4.4],CRO:[45.8,16.0],URU:[-34.9,-56.2],
    COL:[4.6,-74.1],MEX:[19.4,-99.1],USA:[38.9,-77.0],CAN:[45.4,-75.7],
    JPN:[35.7,139.7],KOR:[37.6,127.0],AUS:[-33.9,151.2],IRN:[35.7,51.4],
    KSA:[24.7,46.7],QAT:[25.3,51.5],MAR:[34.0,-6.8],SEN:[14.7,-17.5],
    CMR:[3.9,11.5],NGA:[9.1,7.5],GHA:[5.6,-0.2],TUN:[36.8,10.2],
    EGY:[30.0,31.2],RSA:[-33.9,18.4],ALG:[36.8,3.0],CIV:[5.3,-4.0],
    CZE:[50.1,14.4],POL:[52.2,21.0],SUI:[46.9,7.4],AUT:[48.2,16.4],
    DEN:[55.7,12.6],SWE:[59.3,18.1],NOR:[59.9,10.8],SCO:[55.9,-3.2],
    WAL:[51.5,-3.2],SRB:[44.8,20.5],UKR:[50.5,30.5],ROU:[44.4,26.1],
    CHI:[-33.4,-70.6],PAR:[-25.3,-57.6],ECU:[-0.2,-78.5],PER:[-12.0,-77.0],
    VEN:[10.5,-66.9],BOL:[-16.5,-68.2],CRC:[9.9,-84.1],PAN:[9.0,-79.5],
    HON:[14.1,-87.2],JAM:[18.0,-76.8],TRI:[10.7,-61.5],
    CHN:[39.9,116.4],UZB:[41.3,69.3],IRQ:[33.3,44.4],IND:[28.6,77.2],
    THA:[13.8,100.5],VNM:[21.0,105.9],IDN:[-6.2,106.8],
    NZL:[-36.8,174.8],default:[39.0,-95.0]
  };

  function coordsOf(code) {
    return COUNTRY_COORDS[code] || COUNTRY_COORDS['default'];
  }

  /* Host venue reference (centre of tournament) – roughly Kansas City */
  var TOURNAMENT_CENTER = { lat: 39.0, lng: -94.6 };

  /* ──────────────────────────────────────────────
   *  PredictionEngine class
   * ────────────────────────────────────────────── */
  function PredictionEngine(data) {
    this.data = data || {};
    this.teams = data.teams || {};
    this.groups = data.groups || {};
    this.fixtures = data.fixtures || [];
    this.stadiums = data.stadiums || {};
    this.referees = data.referees || [];
    this.headToHead = data.headToHead || {};
    this.wcHistory = data.wcHistory || {};
    this.confederations = data.confederations || {};

    // Precompute global averages for Poisson attack/defense ratios
    this._computeLeagueAverages();
  }

  /* ---- internal helpers ---- */

  PredictionEngine.prototype._computeLeagueAverages = function () {
    var codes = Object.keys(this.teams);
    if (codes.length === 0) {
      this._avgScored = 1.35;
      this._avgConceded = 1.35;
      this._avgRanking = 50;
      this._avgElo = 1600;
      this._avgCaps = 40;
      this._avgAge = 27;
      return;
    }
    var totalS = 0, totalC = 0, totalR = 0, totalE = 0, totalCaps = 0, totalAge = 0;
    for (var i = 0; i < codes.length; i++) {
      var t = this.teams[codes[i]];
      totalS += (t.avgGoalsScored || 1.35);
      totalC += (t.avgGoalsConceded || 1.35);
      totalR += (t.fifaRanking || 50);
      totalE += (t.eloRating || 1500);
      totalCaps += (t.squadAvgCaps || 40);
      totalAge += (t.squadAvgAge || 27);
    }
    var n = codes.length;
    this._avgScored = totalS / n;
    this._avgConceded = totalC / n;
    this._avgRanking = totalR / n;
    this._avgElo = totalE / n;
    this._avgCaps = totalCaps / n;
    this._avgAge = totalAge / n;
  };

  PredictionEngine.prototype._getTeam = function (code) {
    return this.teams[code] || null;
  };

  PredictionEngine.prototype._h2hKey = function (a, b) {
    return a < b ? a + '_' + b : b + '_' + a;
  };

  PredictionEngine.prototype._getH2H = function (a, b) {
    var key = this._h2hKey(a, b);
    return this.headToHead[key] || null;
  };

  PredictionEngine.prototype._getStadium = function (name) {
    if (!name) return null;
    // Direct key lookup
    if (this.stadiums[name]) return this.stadiums[name];
    // Search by name property (fixtures use full name like 'MetLife Stadium')
    var keys = Object.keys(this.stadiums);
    for (var i = 0; i < keys.length; i++) {
      var s = this.stadiums[keys[i]];
      if (s.name === name || s.shortCity === name || s.city === name) return s;
    }
    // Partial match fallback
    var nameLower = name.toLowerCase();
    for (var j = 0; j < keys.length; j++) {
      var s2 = this.stadiums[keys[j]];
      if ((s2.name && s2.name.toLowerCase().indexOf(nameLower) !== -1) ||
          (nameLower.indexOf(keys[j]) !== -1)) return s2;
    }
    return null;
  };

  PredictionEngine.prototype._getReferee = function (name) {
    if (!name || !this.referees) return null;
    for (var i = 0; i < this.referees.length; i++) {
      if (this.referees[i].name === name) return this.referees[i];
    }
    return null;
  };

  /* ──────────────────────────────────────────────
   *  Factor Evaluation  (each returns { homeAdv, awayAdv, homeValue, awayValue })
   *  homeAdv/awayAdv are in [0,1]; the delta is used as the factor score
   * ────────────────────────────────────────────── */

  /** Factor 1 – FIFA Ranking (lower = better) */
  PredictionEngine.prototype._f_fifaRanking = function (home, away) {
    var hRank = home.fifaRanking || 50;
    var aRank = away.fifaRanking || 50;
    // Normalise: rank 1 → score 1.0, rank 211 → 0.0
    var hScore = 1 - norm(hRank, 1, 211);
    var aScore = 1 - norm(aRank, 1, 211);
    return { homeAdv: hScore, awayAdv: aScore, homeValue: hRank, awayValue: aRank };
  };

  /** Factor 2 – Elo Rating */
  PredictionEngine.prototype._f_eloRating = function (home, away) {
    var hElo = home.eloRating || 1500;
    var aElo = away.eloRating || 1500;
    var hScore = norm(hElo, 1200, 2200);
    var aScore = norm(aElo, 1200, 2200);
    return { homeAdv: hScore, awayAdv: aScore, homeValue: hElo, awayValue: aElo };
  };

  /** Factor 3 – Recent Form (average of last 10 results) */
  PredictionEngine.prototype._f_recentForm = function (home, away) {
    var hForm = home.recentForm || [];
    var aForm = away.recentForm || [];
    var hAvg = hForm.length ? hForm.reduce(function (s, v) { return s + v; }, 0) / hForm.length : 0.5;
    var aAvg = aForm.length ? aForm.reduce(function (s, v) { return s + v; }, 0) / aForm.length : 0.5;
    return { homeAdv: hAvg, awayAdv: aAvg, homeValue: (hAvg * 100).toFixed(0) + '%', awayValue: (aAvg * 100).toFixed(0) + '%' };
  };

  /** Factor 4 – Head-to-Head */
  PredictionEngine.prototype._f_headToHead = function (home, away) {
    var h2h = this._getH2H(home.code, away.code);
    if (!h2h || !h2h.played) return { homeAdv: 0.5, awayAdv: 0.5, homeValue: 'N/A', awayValue: 'N/A' };
    var isFirst = home.code < away.code; // key convention
    var hWins = isFirst ? h2h.winsA : h2h.winsB;
    var aWins = isFirst ? h2h.winsB : h2h.winsA;
    var hRate = (hWins + h2h.draws * 0.5) / h2h.played;
    var aRate = (aWins + h2h.draws * 0.5) / h2h.played;
    return { homeAdv: hRate, awayAdv: aRate, homeValue: hWins + 'W ' + h2h.draws + 'D', awayValue: aWins + 'W ' + h2h.draws + 'D' };
  };

  /** Factor 5 – Attack Strength */
  PredictionEngine.prototype._f_attackStrength = function (home, away) {
    var hAtk = (home.avgGoalsScored || 1.0) / this._avgScored;
    var aAtk = (away.avgGoalsScored || 1.0) / this._avgScored;
    return { homeAdv: clamp(hAtk / 2, 0, 1), awayAdv: clamp(aAtk / 2, 0, 1),
             homeValue: (home.avgGoalsScored || 0).toFixed(2), awayValue: (away.avgGoalsScored || 0).toFixed(2) };
  };

  /** Factor 6 – Defense Strength (lower conceded = better) */
  PredictionEngine.prototype._f_defenseStrength = function (home, away) {
    var hDef = this._avgConceded / (home.avgGoalsConceded || 1.5);
    var aDef = this._avgConceded / (away.avgGoalsConceded || 1.5);
    return { homeAdv: clamp(hDef / 2, 0, 1), awayAdv: clamp(aDef / 2, 0, 1),
             homeValue: (home.avgGoalsConceded || 0).toFixed(2), awayValue: (away.avgGoalsConceded || 0).toFixed(2) };
  };

  /** Factor 7 – Home/Region Advantage */
  PredictionEngine.prototype._f_homeAdvantage = function (home, away, ctx) {
    // WC 2026 is in USA/MEX/CAN  (CONCACAF)
    var hosts = ['USA', 'MEX', 'CAN'];
    var hScore = 0.5, aScore = 0.5;
    if (hosts.indexOf(home.code) >= 0) hScore = 0.85;
    else if (home.homeContinent === 'North America' || home.confederation === 'CONCACAF') hScore = 0.65;

    if (hosts.indexOf(away.code) >= 0) aScore = 0.85;
    else if (away.homeContinent === 'North America' || away.confederation === 'CONCACAF') aScore = 0.65;

    return { homeAdv: hScore, awayAdv: aScore,
             homeValue: hosts.indexOf(home.code) >= 0 ? 'Host' : home.homeContinent || home.confederation,
             awayValue: hosts.indexOf(away.code) >= 0 ? 'Host' : away.homeContinent || away.confederation };
  };

  /** Factor 8 – World Cup History */
  PredictionEngine.prototype._f_wcHistory = function (home, away) {
    var hHist = this.wcHistory[home.code] || {};
    var aHist = this.wcHistory[away.code] || {};
    var hScore = clamp(((hHist.titles || 0) * 0.3 + (hHist.finals || 0) * 0.15 +
                  (home.worldCupApps || 0) * 0.02 + (home.worldCupTitles || 0) * 0.25), 0, 1);
    var aScore = clamp(((aHist.titles || 0) * 0.3 + (aHist.finals || 0) * 0.15 +
                  (away.worldCupApps || 0) * 0.02 + (away.worldCupTitles || 0) * 0.25), 0, 1);
    // normalise to 0-1
    var mx = Math.max(hScore, aScore, 0.01);
    hScore = hScore / mx;
    aScore = aScore / mx;
    return { homeAdv: clamp(hScore, 0, 1), awayAdv: clamp(aScore, 0, 1),
             homeValue: (home.worldCupTitles || 0) + ' titles', awayValue: (away.worldCupTitles || 0) + ' titles' };
  };

  /** Factor 9 – Confederation Strength */
  PredictionEngine.prototype._f_confedStrength = function (home, away) {
    var hConf = this.confederations[home.confederation] || {};
    var aConf = this.confederations[away.confederation] || {};
    var hStr = hConf.strength || 0.5;
    var aStr = aConf.strength || 0.5;
    return { homeAdv: hStr, awayAdv: aStr,
             homeValue: home.confederation || '?', awayValue: away.confederation || '?' };
  };

  /** Factor 10 – Rest Days */
  PredictionEngine.prototype._f_restDays = function (home, away, ctx) {
    var hRest = (ctx && ctx.restDaysHome != null) ? ctx.restDaysHome : 4;
    var aRest = (ctx && ctx.restDaysAway != null) ? ctx.restDaysAway : 4;
    // optimal is 4-5 days; less is worse, more is slightly less helpful
    var hScore = 1 - clamp(Math.abs(hRest - 4.5) / 5, 0, 0.5);
    var aScore = 1 - clamp(Math.abs(aRest - 4.5) / 5, 0, 0.5);
    return { homeAdv: hScore, awayAdv: aScore,
             homeValue: hRest + ' days', awayValue: aRest + ' days' };
  };

  /** Factor 11 – Match Stage */
  PredictionEngine.prototype._f_matchStage = function (home, away, ctx) {
    // Knockouts tend to be tighter, group stage more open
    // Higher-ranked teams perform better in knockouts (experience)
    var stage = (ctx && ctx.stage) || 'group';
    var knockoutBonus = 0;
    if (stage === 'R32') knockoutBonus = 0.05;
    else if (stage === 'R16') knockoutBonus = 0.08;
    else if (stage === 'QF') knockoutBonus = 0.12;
    else if (stage === 'SF') knockoutBonus = 0.16;
    else if (stage === 'F') knockoutBonus = 0.20;

    // Better teams benefit more in knockout (mental edge)
    var hElo = home.eloRating || 1500;
    var aElo = away.eloRating || 1500;
    var hBonus = 0.5 + knockoutBonus * (hElo > aElo ? 1 : -0.3);
    var aBonus = 0.5 + knockoutBonus * (aElo > hElo ? 1 : -0.3);
    return { homeAdv: clamp(hBonus, 0, 1), awayAdv: clamp(aBonus, 0, 1),
             homeValue: stage, awayValue: stage };
  };

  /** Factor 12 – Motivation / Pressure */
  PredictionEngine.prototype._f_motivation = function (home, away, ctx) {
    // Simple heuristic: later matchdays in group stage → more pressure for teams needing results
    var md = (ctx && ctx.matchday) || 1;
    // baseline 0.5
    var hScore = 0.5, aScore = 0.5;
    // matchday 3 is "must-win" territory → slight boost for underdogs, pressure on favourites
    if (md >= 3) {
      var hElo = home.eloRating || 1500;
      var aElo = away.eloRating || 1500;
      // underdog gets small motivational boost
      if (hElo < aElo) hScore += 0.08;
      else aScore += 0.08;
    }
    return { homeAdv: clamp(hScore, 0, 1), awayAdv: clamp(aScore, 0, 1),
             homeValue: 'MD ' + md, awayValue: 'MD ' + md };
  };

  /** Factor 13 – Referee Style */
  PredictionEngine.prototype._f_refereeStyle = function (home, away, ctx) {
    var ref = ctx && ctx.referee ? this._getReferee(ctx.referee) : null;
    if (!ref) return { homeAdv: 0.5, awayAdv: 0.5, homeValue: 'N/A', awayValue: 'N/A' };
    // Strict referees → defensive teams benefit (they draw more fouls offensively)
    // Lenient referees → physical teams benefit
    var penTendency = ref.penaltyTendency || 0.5;
    var hDefStyle = home.playingStyle === 'defensive' ? 0.05 : 0;
    var aDefStyle = away.playingStyle === 'defensive' ? 0.05 : 0;
    // Same confederation as referee → marginal bias (real psychological studies)
    var hConfBonus = (ref.confederation === home.confederation) ? 0.03 : 0;
    var aConfBonus = (ref.confederation === away.confederation) ? 0.03 : 0;
    var hScore = 0.5 + hDefStyle + hConfBonus;
    var aScore = 0.5 + aDefStyle + aConfBonus;
    return { homeAdv: clamp(hScore, 0, 1), awayAdv: clamp(aScore, 0, 1),
             homeValue: ref.name, awayValue: ref.name };
  };

  /** Factor 14 – Weather Conditions */
  PredictionEngine.prototype._f_weather = function (home, away, ctx) {
    var weather = (ctx && ctx.weather) || {};
    var temp = weather.temp != null ? weather.temp : 25;
    var hum  = weather.humidity != null ? weather.humidity : 50;
    var rain = !!weather.rain;

    var hClimate = CONFED_CLIMATE[home.confederation] || 22;
    var aClimate = CONFED_CLIMATE[away.confederation] || 22;

    // Comfort delta: team used to similar climate performs better
    var hDelta = Math.abs(temp - hClimate);
    var aDelta = Math.abs(temp - aClimate);
    var hScore = 1 - norm(hDelta, 0, 25);
    var aScore = 1 - norm(aDelta, 0, 25);

    // Humidity penalty for cold-climate teams in humid conditions
    if (hum > 75) {
      if (hClimate < 20) hScore -= 0.08;
      if (aClimate < 20) aScore -= 0.08;
    }

    // Rain favours defensive teams slightly
    if (rain) {
      if (home.playingStyle === 'defensive') hScore += 0.04;
      if (away.playingStyle === 'defensive') aScore += 0.04;
    }

    return { homeAdv: clamp(hScore, 0, 1), awayAdv: clamp(aScore, 0, 1),
             homeValue: temp + '°C ' + hum + '%', awayValue: temp + '°C ' + hum + '%' };
  };

  /** Factor 15 – Altitude */
  PredictionEngine.prototype._f_altitude = function (home, away, ctx) {
    var stadium = ctx && ctx.stadium ? this._getStadium(ctx.stadium) : null;
    var alt = stadium ? (stadium.altitude || 0) : 0;
    if (alt < 500) return { homeAdv: 0.5, awayAdv: 0.5, homeValue: alt + 'm', awayValue: alt + 'm' };

    // High altitude favours teams that train at altitude
    var highAltTeams = ['MEX', 'COL', 'ECU', 'BOL', 'PER', 'ETH', 'KEN'];
    var hBonus = highAltTeams.indexOf(home.code) >= 0 ? 0.12 : -0.10;
    var aBonus = highAltTeams.indexOf(away.code) >= 0 ? 0.12 : -0.10;
    // Scale by altitude severity
    var sevScale = clamp(alt / 2500, 0, 1);
    return {
      homeAdv: clamp(0.5 + hBonus * sevScale, 0, 1),
      awayAdv: clamp(0.5 + aBonus * sevScale, 0, 1),
      homeValue: alt + 'm', awayValue: alt + 'm'
    };
  };

  /** Factor 16 – Travel / Jet Lag */
  PredictionEngine.prototype._f_travelJetLag = function (home, away, ctx) {
    var stadium = ctx && ctx.stadium ? this._getStadium(ctx.stadium) : null;
    var venueLat = stadium ? stadium.lat : TOURNAMENT_CENTER.lat;
    var venueLng = stadium ? stadium.lng : TOURNAMENT_CENTER.lng;

    var hCoords = coordsOf(home.code);
    var aCoords = coordsOf(away.code);

    var hDist = haversine(hCoords[0], hCoords[1], venueLat, venueLng);
    var aDist = haversine(aCoords[0], aCoords[1], venueLat, venueLng);

    // timezone difference (rough: 15° longitude ≈ 1 hour)
    var hTzDiff = Math.abs(hCoords[1] - venueLng) / 15;
    var aTzDiff = Math.abs(aCoords[1] - venueLng) / 15;

    // Score: closer is better
    var hScore = 1 - norm(hDist, 0, 18000);
    var aScore = 1 - norm(aDist, 0, 18000);

    // Jet lag penalty (>5h diff)
    if (hTzDiff > 5) hScore -= 0.06 * (hTzDiff - 5) / 7;
    if (aTzDiff > 5) aScore -= 0.06 * (aTzDiff - 5) / 7;

    return { homeAdv: clamp(hScore, 0, 1), awayAdv: clamp(aScore, 0, 1),
             homeValue: Math.round(hDist) + ' km', awayValue: Math.round(aDist) + ' km' };
  };

  /** Factor 17 – Squad Experience (avg caps) */
  PredictionEngine.prototype._f_squadExperience = function (home, away) {
    var hCaps = home.squadAvgCaps || 30;
    var aCaps = away.squadAvgCaps || 30;
    var hScore = norm(hCaps, 10, 80);
    var aScore = norm(aCaps, 10, 80);
    return { homeAdv: hScore, awayAdv: aScore,
             homeValue: hCaps.toFixed(0) + ' caps', awayValue: aCaps.toFixed(0) + ' caps' };
  };

  /** Factor 18 – Squad Age Profile (optimal ~27) */
  PredictionEngine.prototype._f_squadAge = function (home, away) {
    var hAge = home.squadAvgAge || 27;
    var aAge = away.squadAvgAge || 27;
    // bell curve around 27
    var hScore = Math.exp(-Math.pow(hAge - 27, 2) / 18);
    var aScore = Math.exp(-Math.pow(aAge - 27, 2) / 18);
    return { homeAdv: hScore, awayAdv: aScore,
             homeValue: hAge.toFixed(1), awayValue: aAge.toFixed(1) };
  };

  /** Factor 19 – Key Player Availability (injury impact) */
  PredictionEngine.prototype._f_keyPlayerAvail = function (home, away) {
    // injuryImpact: 0 = no injuries, 1 = all key players out
    var hImpact = home.injuryImpact || 0;
    var aImpact = away.injuryImpact || 0;
    var hScore = 1 - hImpact;
    var aScore = 1 - aImpact;
    return { homeAdv: clamp(hScore, 0, 1), awayAdv: clamp(aScore, 0, 1),
             homeValue: (hImpact * 100).toFixed(0) + '% impact', awayValue: (aImpact * 100).toFixed(0) + '% impact' };
  };

  /** Factor 20 – Tactical Matchup */
  PredictionEngine.prototype._f_tacticalMatchup = function (home, away) {
    var hStyle = home.playingStyle || 'balanced';
    var aStyle = away.playingStyle || 'balanced';
    var styleRow = STYLE_MATRIX[hStyle] || STYLE_MATRIX['balanced'];
    var bonus = styleRow[aStyle] || 0;
    return {
      homeAdv: clamp(0.5 + bonus, 0, 1),
      awayAdv: clamp(0.5 - bonus, 0, 1),
      homeValue: hStyle, awayValue: aStyle
    };
  };

  /* ──────────────────────────────────────────────
   *  Core Prediction
   * ────────────────────────────────────────────── */

  PredictionEngine.prototype.predictMatch = function (homeCode, awayCode, context) {
    context = context || {};
    var home = this._getTeam(homeCode);
    var away = this._getTeam(awayCode);
    if (!home || !away) {
      throw new Error('Unknown team code: ' + (!home ? homeCode : awayCode));
    }

    /* --- Evaluate all 20 factors --- */
    var factorDefs = [
      { key: 'fifaRanking',     name: 'FIFA Ranking',          nameVi: 'Xếp hạng FIFA',          fn: '_f_fifaRanking' },
      { key: 'eloRating',       name: 'Elo Rating',            nameVi: 'Điểm Elo',               fn: '_f_eloRating' },
      { key: 'recentForm',      name: 'Recent Form',           nameVi: 'Phong độ gần đây',       fn: '_f_recentForm' },
      { key: 'headToHead',      name: 'Head-to-Head',          nameVi: 'Đối đầu',                fn: '_f_headToHead' },
      { key: 'attackStrength',   name: 'Attack Strength',      nameVi: 'Sức mạnh tấn công',      fn: '_f_attackStrength' },
      { key: 'defenseStrength',  name: 'Defense Strength',     nameVi: 'Sức mạnh phòng ngự',     fn: '_f_defenseStrength' },
      { key: 'homeAdvantage',   name: 'Home/Region Advantage', nameVi: 'Lợi thế sân nhà',        fn: '_f_homeAdvantage' },
      { key: 'wcHistory',       name: 'World Cup History',     nameVi: 'Lịch sử World Cup',      fn: '_f_wcHistory' },
      { key: 'confedStrength',  name: 'Confederation Strength',nameVi: 'Sức mạnh liên đoàn',     fn: '_f_confedStrength' },
      { key: 'restDays',        name: 'Rest Days',             nameVi: 'Ngày nghỉ',              fn: '_f_restDays' },
      { key: 'matchStage',      name: 'Match Stage',           nameVi: 'Vòng đấu',               fn: '_f_matchStage' },
      { key: 'motivation',      name: 'Motivation/Pressure',   nameVi: 'Động lực / Áp lực',      fn: '_f_motivation' },
      { key: 'refereeStyle',    name: 'Referee Style',         nameVi: 'Phong cách trọng tài',   fn: '_f_refereeStyle' },
      { key: 'weather',         name: 'Weather Conditions',    nameVi: 'Thời tiết',              fn: '_f_weather' },
      { key: 'altitude',        name: 'Altitude Effect',       nameVi: 'Ảnh hưởng độ cao',       fn: '_f_altitude' },
      { key: 'travelJetLag',    name: 'Travel/Jet Lag',        nameVi: 'Di chuyển / Jet Lag',     fn: '_f_travelJetLag' },
      { key: 'squadExperience', name: 'Squad Experience',      nameVi: 'Kinh nghiệm đội hình',   fn: '_f_squadExperience' },
      { key: 'squadAge',        name: 'Squad Age Profile',     nameVi: 'Độ tuổi đội hình',       fn: '_f_squadAge' },
      { key: 'keyPlayerAvail',  name: 'Key Player Availability',nameVi: 'Cầu thủ chủ chốt',     fn: '_f_keyPlayerAvail' },
      { key: 'tacticalMatchup', name: 'Tactical Matchup',      nameVi: 'Chiến thuật đối đầu',    fn: '_f_tacticalMatchup' }
    ];

    var factors = [];
    var homeWeightedSum = 0;
    var awayWeightedSum = 0;
    var confidenceAcc = 0;
    var dataPoints = 0;

    for (var fi = 0; fi < factorDefs.length; fi++) {
      var fd = factorDefs[fi];
      var w = WEIGHTS[fd.key];
      var result = this[fd.fn](home, away, context);
      var delta = result.homeAdv - result.awayAdv;
      var impact = Math.abs(delta) * w;
      var advantage = delta > 0.001 ? 'home' : (delta < -0.001 ? 'away' : 'neutral');

      homeWeightedSum += result.homeAdv * w;
      awayWeightedSum += result.awayAdv * w;

      // Confidence tracking: factor with clear signal → higher confidence
      if (Math.abs(delta) > 0.05) dataPoints++;
      confidenceAcc += Math.abs(delta) * w;

      factors.push({
        name: fd.name,
        nameVi: fd.nameVi,
        homeValue: result.homeValue,
        awayValue: result.awayValue,
        impact: parseFloat(impact.toFixed(4)),
        advantage: advantage,
        weight: w
      });
    }

    /* --- Poisson Lambda Calculation --- */
    var homeAttackRatio  = (home.avgGoalsScored   || this._avgScored) / this._avgScored;
    var awayAttackRatio  = (away.avgGoalsScored   || this._avgScored) / this._avgScored;
    var homeDefenseRatio = (home.avgGoalsConceded  || this._avgConceded) / this._avgConceded;
    var awayDefenseRatio = (away.avgGoalsConceded  || this._avgConceded) / this._avgConceded;

    // Factor adjustment multiplier from the 20-factor composite
    // homeWeightedSum and awayWeightedSum are in roughly [0, 0.5] each
    // convert to multiplier centred on 1.0
    var homeFactorMul = 1 + (homeWeightedSum - awayWeightedSum);
    var awayFactorMul = 1 + (awayWeightedSum - homeWeightedSum);

    var homeLambda = (TOURNAMENT_AVG_GOALS / 2) * homeAttackRatio * awayDefenseRatio * homeFactorMul;
    var awayLambda = (TOURNAMENT_AVG_GOALS / 2) * awayAttackRatio * homeDefenseRatio * awayFactorMul;

    // Clamp lambdas to sensible range
    homeLambda = clamp(homeLambda, 0.25, 4.5);
    awayLambda = clamp(awayLambda, 0.25, 4.5);

    /* --- Score Matrix with Dixon-Coles Correction --- */
    var scoreMatrix = [];
    var homeWinProb = 0, drawProb = 0, awayWinProb = 0;
    var bestProb = 0, bestI = 0, bestJ = 0;

    // Dixon-Coles rho parameter (low-score dependency correction)
    // rho < 0 means 0-0 and 1-1 are less likely, 1-0 and 0-1 more likely than independent Poisson
    var rho = this._computeRho(homeLambda, awayLambda);

    for (var i = 0; i <= MAX_GOALS; i++) {
      scoreMatrix[i] = [];
      for (var j = 0; j <= MAX_GOALS; j++) {
        var pInd = poissonPMF(i, homeLambda) * poissonPMF(j, awayLambda);
        // Dixon-Coles correction for low scores
        var tau = this._dixonColesTau(i, j, homeLambda, awayLambda, rho);
        var p = pInd * tau;
        scoreMatrix[i][j] = p;

        if (i > j) homeWinProb += p;
        else if (i === j) drawProb += p;
        else awayWinProb += p;

        if (p > bestProb) { bestProb = p; bestI = i; bestJ = j; }
      }
    }

    // Normalise (due to truncation at 6 goals)
    var total = homeWinProb + drawProb + awayWinProb;
    homeWinProb /= total;
    drawProb /= total;
    awayWinProb /= total;

    // Also normalise score matrix
    for (var i2 = 0; i2 <= MAX_GOALS; i2++) {
      for (var j2 = 0; j2 <= MAX_GOALS; j2++) {
        scoreMatrix[i2][j2] /= total;
      }
    }

    /* --- Knockout adjustment: no draws in knockout → redistribute draw prob --- */
    var stage = (context && context.stage) || 'group';
    if (stage !== 'group') {
      // In knockout, draws go to extra time / pens. We split draw probability
      // proportionally to each team's win probability
      var hShare = homeWinProb / (homeWinProb + awayWinProb);
      homeWinProb += drawProb * hShare;
      awayWinProb += drawProb * (1 - hShare);
      drawProb = 0;
    }

    /* --- Expected Goals --- */
    var homeXG = homeLambda;
    var awayXG = awayLambda;
    var totalXG = homeXG + awayXG;

    /* --- Derived Markets --- */
    var over25 = 0, btts = 0;
    for (var a = 0; a <= MAX_GOALS; a++) {
      for (var b = 0; b <= MAX_GOALS; b++) {
        var pp = scoreMatrix[a][b];
        if (a + b > 2) over25 += pp;                     // over 2.5
        if (a >= 1 && b >= 1) btts += pp;               // both teams to score
      }
    }

    /* --- Confidence Calculation --- */
    // confidence: higher when we have more data and clearer signal
    var spreadFactor = Math.abs(homeWinProb - awayWinProb);  // close match → lower confidence
    var dataFactor = clamp(dataPoints / 14, 0.3, 1);        // how many factors had signal
    var confidence = clamp(0.4 + spreadFactor * 0.4 + dataFactor * 0.2, 0.3, 0.95);

    /* --- Build Result --- */
    return {
      homeTeam: { code: home.code, name: home.name, flag: home.flag },
      awayTeam: { code: away.code, name: away.name, flag: away.flag },
      homeWinProb: parseFloat(homeWinProb.toFixed(4)),
      drawProb: parseFloat(drawProb.toFixed(4)),
      awayWinProb: parseFloat(awayWinProb.toFixed(4)),
      predictedScore: [bestI, bestJ],
      scoreMatrix: scoreMatrix,
      confidence: parseFloat(confidence.toFixed(4)),
      factors: factors,
      over25Prob: parseFloat(over25.toFixed(4)),
      under25Prob: parseFloat((1 - over25).toFixed(4)),
      bttsProb: parseFloat(btts.toFixed(4)),
      totalGoalsExpected: parseFloat(totalXG.toFixed(2)),
      homeExpectedGoals: parseFloat(homeXG.toFixed(2)),
      awayExpectedGoals: parseFloat(awayXG.toFixed(2))
    };
  };

  /** Dixon-Coles rho parameter estimation (simplified) */
  PredictionEngine.prototype._computeRho = function (lambda1, lambda2) {
    // Typical WC rho is around -0.13 (slight negative dependence for low scores)
    // We approximate based on the product of lambdas
    var product = lambda1 * lambda2;
    return clamp(-0.05 - 0.08 / (1 + product), -0.3, 0);
  };

  /** Dixon-Coles tau correction factor */
  PredictionEngine.prototype._dixonColesTau = function (x, y, lambda1, lambda2, rho) {
    if (x === 0 && y === 0) {
      return 1 - lambda1 * lambda2 * rho;
    } else if (x === 0 && y === 1) {
      return 1 + lambda1 * rho;
    } else if (x === 1 && y === 0) {
      return 1 + lambda2 * rho;
    } else if (x === 1 && y === 1) {
      return 1 - rho;
    }
    return 1;
  };

  /* ──────────────────────────────────────────────
   *  Elo Update
   * ────────────────────────────────────────────── */
  PredictionEngine.prototype.updateElo = function (teamACode, teamBCode, scoreA, scoreB) {
    var teamA = this._getTeam(teamACode);
    var teamB = this._getTeam(teamBCode);
    if (!teamA || !teamB) return;

    var rA = teamA.eloRating || 1500;
    var rB = teamB.eloRating || 1500;

    var eA = eloExpected(rA, rB);
    var eB = 1 - eA;

    // Actual score: 1 for win, 0.5 for draw, 0 for loss
    var sA = scoreA > scoreB ? 1 : (scoreA === scoreB ? 0.5 : 0);
    var sB = 1 - sA;

    // Goal difference multiplier
    var goalDiff = Math.abs(scoreA - scoreB);
    var gdMultiplier = goalDiff <= 1 ? 1 : (goalDiff === 2 ? 1.5 : (1.75 + (goalDiff - 3) * 0.375));

    var newRA = rA + ELO_K_FACTOR * gdMultiplier * (sA - eA);
    var newRB = rB + ELO_K_FACTOR * gdMultiplier * (sB - eB);

    teamA.eloRating = Math.round(newRA);
    teamB.eloRating = Math.round(newRB);

    return {
      teamA: { code: teamACode, oldElo: rA, newElo: teamA.eloRating, change: teamA.eloRating - rA },
      teamB: { code: teamBCode, oldElo: rB, newElo: teamB.eloRating, change: teamB.eloRating - rB }
    };
  };

  /* ──────────────────────────────────────────────
   *  Team Strength (composite score 0-100)
   * ────────────────────────────────────────────── */
  PredictionEngine.prototype.getTeamStrength = function (teamCode) {
    var t = this._getTeam(teamCode);
    if (!t) return null;

    var rankScore   = (1 - norm(t.fifaRanking || 50, 1, 211)) * 25;
    var eloScore    = norm(t.eloRating || 1500, 1200, 2200) * 25;
    var formArr     = t.recentForm || [];
    var formScore   = (formArr.length ? formArr.reduce(function(s,v){return s+v;},0)/formArr.length : 0.5) * 20;
    var historyScore = clamp((t.worldCupTitles || 0) * 4 + (t.worldCupApps || 0) * 0.5, 0, 15);
    var squadScore  = norm(t.squadAvgCaps || 30, 10, 80) * 10;
    var injuryPen   = (t.injuryImpact || 0) * 5;

    var total = clamp(rankScore + eloScore + formScore + historyScore + squadScore - injuryPen, 0, 100);

    return {
      code: teamCode,
      name: t.name,
      overall: parseFloat(total.toFixed(1)),
      breakdown: {
        ranking: parseFloat(rankScore.toFixed(1)),
        elo: parseFloat(eloScore.toFixed(1)),
        form: parseFloat(formScore.toFixed(1)),
        history: parseFloat(historyScore.toFixed(1)),
        squad: parseFloat(squadScore.toFixed(1)),
        injuryPenalty: parseFloat(injuryPen.toFixed(1))
      }
    };
  };

  /* ──────────────────────────────────────────────
   *  Group Stage Monte Carlo Simulation
   * ────────────────────────────────────────────── */
  PredictionEngine.prototype.getGroupProbabilities = function (groupCode) {
    var groupRaw = this.groups[groupCode];
    if (!groupRaw) return null;

    // Handle both formats: direct array or object with .teams
    var group = Array.isArray(groupRaw) ? groupRaw : (groupRaw.teams || []);
    var n = group.length;
    var self = this;

    // Generate all group fixtures (round-robin)
    var groupFixtures = [];
    for (var a = 0; a < n; a++) {
      for (var b = a + 1; b < n; b++) {
        groupFixtures.push([group[a], group[b]]);
      }
    }

    // Check which fixtures already have results
    var existingResults = {};
    for (var fx = 0; fx < this.fixtures.length; fx++) {
      var f = this.fixtures[fx];
      var fHome = typeof f.homeTeam === 'string' ? f.homeTeam : (f.homeTeam && f.homeTeam.code);
      var fAway = typeof f.awayTeam === 'string' ? f.awayTeam : (f.awayTeam && f.awayTeam.code);
      var fHomeScore = f.homeScore != null ? f.homeScore : (f.score && f.score.home);
      var fAwayScore = f.awayScore != null ? f.awayScore : (f.score && f.score.away);
      if (f.group === groupCode && f.status === 'finished' && fHomeScore != null) {
        existingResults[fHome + '_' + fAway] = { home: fHomeScore, away: fAwayScore };
      }
    }

    // Tallies
    var finishCount = {};  // code → [1st, 2nd, 3rd, 4th, ...]
    for (var ti = 0; ti < n; ti++) {
      finishCount[group[ti]] = new Array(n);
      for (var pi = 0; pi < n; pi++) finishCount[group[ti]][pi] = 0;
    }

    // Pre-compute predictions for each fixture (for simulation sampling)
    var matchPredictions = {};
    for (var mi = 0; mi < groupFixtures.length; mi++) {
      var pair = groupFixtures[mi];
      var key = pair[0] + '_' + pair[1];
      if (!existingResults[key] && !existingResults[pair[1] + '_' + pair[0]]) {
        matchPredictions[key] = this.predictMatch(pair[0], pair[1], { stage: 'group', group: groupCode });
      }
    }

    // Run simulations
    for (var sim = 0; sim < MONTE_CARLO_RUNS; sim++) {
      // Points, GD, GF for each team in this simulation
      var pts = {}, gd = {}, gf = {};
      for (var t2 = 0; t2 < n; t2++) {
        pts[group[t2]] = 0;
        gd[group[t2]] = 0;
        gf[group[t2]] = 0;
      }

      for (var mi2 = 0; mi2 < groupFixtures.length; mi2++) {
        var pair2 = groupFixtures[mi2];
        var keyHm = pair2[0] + '_' + pair2[1];
        var keyAw = pair2[1] + '_' + pair2[0];
        var hGoals, aGoals;

        // Check if result already exists
        if (existingResults[keyHm]) {
          hGoals = existingResults[keyHm].home;
          aGoals = existingResults[keyHm].away;
        } else if (existingResults[keyAw]) {
          hGoals = existingResults[keyAw].away;
          aGoals = existingResults[keyAw].home;
        } else {
          // Simulate from score matrix
          var pred = matchPredictions[keyHm];
          var r = Math.random();
          var cum = 0;
          hGoals = 0; aGoals = 0;
          var found = false;
          for (var si = 0; si <= MAX_GOALS && !found; si++) {
            for (var sj = 0; sj <= MAX_GOALS && !found; sj++) {
              cum += pred.scoreMatrix[si][sj];
              if (r <= cum) { hGoals = si; aGoals = sj; found = true; }
            }
          }
        }

        // Update standings
        gf[pair2[0]] += hGoals; gf[pair2[1]] += aGoals;
        gd[pair2[0]] += hGoals - aGoals; gd[pair2[1]] += aGoals - hGoals;

        if (hGoals > aGoals) {
          pts[pair2[0]] += 3;
        } else if (hGoals === aGoals) {
          pts[pair2[0]] += 1;
          pts[pair2[1]] += 1;
        } else {
          pts[pair2[1]] += 3;
        }
      }

      // Sort teams by pts, gd, gf (FIFA tie-breakers simplified)
      var sorted = group.slice().sort(function (a, b) {
        if (pts[b] !== pts[a]) return pts[b] - pts[a];
        if (gd[b] !== gd[a]) return gd[b] - gd[a];
        if (gf[b] !== gf[a]) return gf[b] - gf[a];
        return Math.random() - 0.5; // random for unresolved ties
      });

      for (var si2 = 0; si2 < n; si2++) {
        finishCount[sorted[si2]][si2]++;
      }
    }

    // Convert counts to probabilities
    var result = {};
    for (var t3 = 0; t3 < n; t3++) {
      var code = group[t3];
      var positions = [];
      for (var p = 0; p < n; p++) {
        positions.push(parseFloat((finishCount[code][p] / MONTE_CARLO_RUNS).toFixed(4)));
      }
      // In WC 2026 expanded format: top 2 qualify, possibly 3rd (best 3rd-place teams)
      var qualifyProb = positions[0] + positions[1];
      var bestThirdProb = n > 2 ? positions[2] * 0.67 : 0; // ~67% of 3rd-place teams advance

      result[code] = {
        name: (this.teams[code] || {}).name || code,
        flag: (this.teams[code] || {}).flag || '',
        positions: positions,
        first: positions[0],
        second: positions[1],
        third: positions.length > 2 ? positions[2] : 0,
        fourth: positions.length > 3 ? positions[3] : 0,
        qualifyProb: parseFloat(clamp(qualifyProb + bestThirdProb, 0, 1).toFixed(4)),
        eliminatedProb: parseFloat(clamp(1 - qualifyProb - bestThirdProb, 0, 1).toFixed(4))
      };
    }

    return { group: groupCode, teams: result, simulations: MONTE_CARLO_RUNS };
  };

  /* ──────────────────────────────────────────────
   *  Expose on window
   * ────────────────────────────────────────────── */
  window.PredictionEngine = PredictionEngine;

})();
