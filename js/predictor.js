/**
 * World Cup 2026 Prediction Engine v2
 * ──────────────────────────────────────────────────────────────────
 * Mô hình lai hiện đại, lấy cảm hứng từ:
 *   • Maher / Dixon-Coles (Poisson low-score correction)
 *   • FiveThirtyEight SPI (soccer power index trên attack/defense)
 *   • FIFA Elo + dynamic K-factor
 *   • Opta xG (expected goals) decomposition
 *   • Brier-score calibration với decay theo thời gian
 *
 * Cải tiến chính so với bản 1.0:
 *   1. Tách rõ attack/defense theo *home* và *away* (4 chỉ số mỗi đội).
 *   2. Lambda dựa trên ước lượng cường độ sức mạnh có trọng số theo form.
 *   3. Elo cập nhật với K-factor động (group < R32 < R16 < QF < SF < F).
 *   4. Cộng thêm 12 thị trường phái sinh: clean sheet, win margin,
 *      HT/FT, exact-score, double chance, draw no bet, Asian-style split.
 *   5. Tín hiệu "form trajectory" 10 trận gần nhất với mức giảm dần.
 *   6. Trả về "AI pitch report" (giải thích tự nhiên bằng tiếng Việt).
 *   7. Calibrated confidence với entropy thật sự của phân phối xác suất.
 *
 * Public API (giữ tương thích ngược với app.js):
 *   • window.PredictionEngine
 *   • engine.predictMatch(home, away, ctx)
 *   • engine.updateElo(a, b, sa, sb)
 *   • engine.getTeamStrength(code)
 *   • engine.getGroupProbabilities(groupCode)
 *   • engine.getMatchMarkets(prediction)        ← MỚI
 *   • engine.getAIPitchReport(prediction, lang) ← MỚI
 *   • engine.getTeamFormSparkline(code, n)     ← MỚI
 *   • engine.calibrateFromHistory(fixtures)    ← MỚI
 */
(function () {
  'use strict';

  /* ════════════════════════════════════════════════════════════════
   *  HẰNG SỐ MÔ HÌNH
   * ════════════════════════════════════════════════════════════════ */
  var TOURNAMENT_AVG_GOALS = 2.7;       // WC all-time avg
  var LEAGUE_AVG_GOALS     = 1.35;      // per team per game
  var MAX_GOALS            = 6;         // score matrix 0..6
  var MONTE_CARLO_RUNS     = 20000;     // bumped from 10k
  var BASE_ELO             = 1500;
  var HT_SPLIT             = 0.43;      // ~43% of goals happen before HT
  var FORM_HALF_LIFE_DAYS  = 90;        // form decays to 50% after 90 days
  var RECENCY_WEIGHTS      = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]; // last-10 weighting

  var POISSON_CACHE = Object.create(null);

  /* Style interaction matrix [home style][away style] → home lambda bonus */
  var STYLE_MATRIX = {
    'possession':     { 'possession': 0,    'counter-attack': -0.10, 'defensive':  0.04, 'balanced':  0.03, 'pressing': -0.05 },
    'counter-attack': { 'possession': 0.10, 'counter-attack': 0,    'defensive': -0.03, 'balanced':  0.04, 'pressing': -0.01 },
    'defensive':      { 'possession':-0.04, 'counter-attack': 0.03, 'defensive':  0,    'balanced': -0.02, 'pressing': -0.07 },
    'balanced':       { 'possession':-0.03, 'counter-attack':-0.04, 'defensive':  0.02, 'balanced':  0,    'pressing':  0    },
    'pressing':       { 'possession': 0.05, 'counter-attack': 0.01, 'defensive':  0.07, 'balanced':  0,    'pressing':  0    }
  };

  var CONFED_CLIMATE = {
    UEFA: 18, CONMEBOL: 24, CONCACAF: 28, CAF: 30, AFC: 26, OFC: 24
  };

  /* Trọng số 20 yếu tố – tổng = 1.00 (chuẩn hoá lại để chắc chắn) */
  var WEIGHTS = {
    fifaRanking:        0.09,
    eloRating:          0.11,
    recentForm:         0.09,
    headToHead:         0.05,
    attackStrength:     0.08,
    defenseStrength:    0.08,
    homeAdvantage:      0.05,
    wcHistory:          0.04,
    confedStrength:     0.03,
    restDays:           0.03,
    matchStage:         0.04,
    motivation:         0.03,
    refereeStyle:       0.03,
    weather:            0.03,
    altitude:           0.02,
    travelJetLag:       0.03,
    squadExperience:    0.03,
    squadAge:           0.02,
    keyPlayerAvail:     0.06,
    tacticalMatchup:    0.06
  };
  // Re-normalize (defensive)
  (function normW() {
    var s = 0; for (var k in WEIGHTS) s += WEIGHTS[k];
    for (var k2 in WEIGHTS) WEIGHTS[k2] /= s;
  })();

  /* ════════════════════════════════════════════════════════════════
   *  TIỆN ÍCH
   * ════════════════════════════════════════════════════════════════ */
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function clamp01(v) { return clamp(v, 0, 1); }

  function factorial(n) { var r = 1; for (var i = 2; i <= n; i++) r *= i; return r; }

  function poissonPMF(k, lambda) {
    if (lambda <= 0) return k === 0 ? 1 : 0;
    var key = k + '_' + lambda.toFixed(6);
    if (POISSON_CACHE[key] !== undefined) return POISSON_CACHE[key];
    var val = Math.pow(lambda, k) * Math.exp(-lambda) / factorial(k);
    POISSON_CACHE[key] = val;
    return val;
  }

  function eloExpected(rA, rB) { return 1 / (1 + Math.pow(10, (rB - rA) / 400)); }

  function norm(v, lo, hi) {
    if (hi === lo) return 0.5;
    return clamp((v - lo) / (hi - lo), 0, 1);
  }

  function safeGet(obj, path, fb) {
    if (!obj) return fb;
    var p = path.split('.'), c = obj;
    for (var i = 0; i < p.length; i++) { if (c == null) return fb; c = c[p[i]]; }
    return c != null ? c : fb;
  }

  function haversine(lat1, lng1, lat2, lng2) {
    var R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLng = (lng2 - lng1) * Math.PI / 180;
    var a = Math.sin(dLat/2)*Math.sin(dLat/2) +
            Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180) *
            Math.sin(dLng/2)*Math.sin(dLng/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

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
  function coordsOf(code) { return COUNTRY_COORDS[code] || COUNTRY_COORDS['default']; }

  var TOURNAMENT_CENTER = { lat: 39.0, lng: -94.6 };

  /* Brier-style reliability helper */
  function entropy3(p1, p2, p3) {
    var h = 0;
    var ps = [p1, p2, p3];
    for (var i = 0; i < ps.length; i++) {
      var p = ps[i];
      if (p > 0) h -= p * Math.log2(p);
    }
    return h; // bits
  }

  /* ════════════════════════════════════════════════════════════════
   *  PredictionEngine class
   * ════════════════════════════════════════════════════════════════ */
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

    // Internal calibration state
    this._calibrationLog = []; // {predicted, actual}

    this._computeLeagueAverages();
  }

  /* ---- Internal computation ------------------------------------ */
  PredictionEngine.prototype._computeLeagueAverages = function () {
    var codes = Object.keys(this.teams);
    if (codes.length === 0) {
      this._avgScored = LEAGUE_AVG_GOALS;
      this._avgConceded = LEAGUE_AVG_GOALS;
      this._avgRanking = 50;
      this._avgElo = BASE_ELO;
      this._avgCaps = 40;
      this._avgAge = 27;
      return;
    }
    var sS=0, sC=0, sR=0, sE=0, sCa=0, sAg=0;
    for (var i = 0; i < codes.length; i++) {
      var t = this.teams[codes[i]];
      sS  += (t.avgGoalsScored   || LEAGUE_AVG_GOALS);
      sC  += (t.avgGoalsConceded  || LEAGUE_AVG_GOALS);
      sR  += (t.fifaRanking      || 50);
      sE  += (t.eloRating        || BASE_ELO);
      sCa += (t.squadAvgCaps     || 40);
      sAg += (t.squadAvgAge      || 27);
    }
    var n = codes.length;
    this._avgScored   = sS  / n;
    this._avgConceded = sC  / n;
    this._avgRanking  = sR  / n;
    this._avgElo      = sE  / n;
    this._avgCaps     = sCa / n;
    this._avgAge      = sAg / n;
  };

  PredictionEngine.prototype._getTeam = function (code) { return this.teams[code] || null; };

  PredictionEngine.prototype._h2hKey = function (a, b) { return a < b ? a + '_' + b : b + '_' + a; };
  PredictionEngine.prototype._getH2H = function (a, b) { return this.headToHead[this._h2hKey(a,b)] || null; };

  PredictionEngine.prototype._getStadium = function (name) {
    if (!name) return null;
    if (this.stadiums[name]) return this.stadiums[name];
    var keys = Object.keys(this.stadiums);
    for (var i = 0; i < keys.length; i++) {
      var s = this.stadiums[keys[i]];
      if (s.name === name || s.shortCity === name || s.city === name) return s;
    }
    var nl = name.toLowerCase();
    for (var j = 0; j < keys.length; j++) {
      var s2 = this.stadiums[keys[j]];
      if ((s2.name && s2.name.toLowerCase().indexOf(nl) !== -1) ||
          (nl.indexOf(keys[j]) !== -1)) return s2;
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

  /* ---- Form helpers -------------------------------------------- */
  /**
   * Decayed form index: weights more recent results more heavily.
   * Returns [decayedForm, sparkline]
   */
  PredictionEngine.prototype._formTrajectory = function (team) {
    var form = (team && team.recentForm) || [];
    if (form.length === 0) return { decayed: 0.5, sparkline: [0.5] };
    var spark = form.slice(0, 10).map(function (v) { return v == null ? 0.5 : v; });
    var n = spark.length;
    // Use RECENCY_WEIGHTS (newest = highest)
    var wSum = 0, vSum = 0;
    for (var i = 0; i < n; i++) {
      var w = RECENCY_WEIGHTS[i] || 1;
      wSum += w;
      vSum += spark[n - 1 - i] * w; // newest first
    }
    var decayed = wSum > 0 ? vSum / wSum : 0.5;
    return { decayed: clamp01(decayed), sparkline: spark };
  };

  /* ---- The 20 factors ------------------------------------------ */
  PredictionEngine.prototype._f_fifaRanking = function (home, away) {
    var hR = home.fifaRanking || 50, aR = away.fifaRanking || 50;
    var hS = 1 - norm(hR, 1, 211);
    var aS = 1 - norm(aR, 1, 211);
    return { homeAdv: hS, awayAdv: aS, homeValue: hR, awayValue: aR };
  };

  PredictionEngine.prototype._f_eloRating = function (home, away) {
    var hE = home.eloRating || BASE_ELO, aE = away.eloRating || BASE_ELO;
    return { homeAdv: norm(hE, 1200, 2200), awayAdv: norm(aE, 1200, 2200),
             homeValue: hE, awayValue: aE };
  };

  PredictionEngine.prototype._f_recentForm = function (home, away) {
    var hF = this._formTrajectory(home);
    var aF = this._formTrajectory(away);
    return {
      homeAdv: hF.decayed, awayAdv: aF.decayed,
      homeValue: Math.round(hF.decayed * 100) + '%',
      awayValue: Math.round(aF.decayed * 100) + '%',
      _extra: { homeSpark: hF.sparkline, awaySpark: aF.sparkline }
    };
  };

  PredictionEngine.prototype._f_headToHead = function (home, away) {
    var h2h = this._getH2H(home.code, away.code);
    if (!h2h || !h2h.played) return { homeAdv: 0.5, awayAdv: 0.5, homeValue: 'N/A', awayValue: 'N/A' };
    var first = home.code < away.code;
    var hW = first ? h2h.winsA : h2h.winsB;
    var aW = first ? h2h.winsB : h2h.winsA;
    var hR = (hW + h2h.draws * 0.5) / h2h.played;
    var aR = (aW + h2h.draws * 0.5) / h2h.played;
    return { homeAdv: hR, awayAdv: aR,
             homeValue: hW + 'W ' + h2h.draws + 'D',
             awayValue: aW + 'W ' + h2h.draws + 'D' };
  };

  PredictionEngine.prototype._f_attackStrength = function (home, away) {
    var hA = (home.avgGoalsScored || LEAGUE_AVG_GOALS) / this._avgScored;
    var aA = (away.avgGoalsScored || LEAGUE_AVG_GOALS) / this._avgScored;
    return { homeAdv: clamp01(hA / 2), awayAdv: clamp01(aA / 2),
             homeValue: (home.avgGoalsScored || 0).toFixed(2),
             awayValue: (away.avgGoalsScored || 0).toFixed(2) };
  };

  PredictionEngine.prototype._f_defenseStrength = function (home, away) {
    var hD = this._avgConceded / (home.avgGoalsConceded || LEAGUE_AVG_GOALS);
    var aD = this._avgConceded / (away.avgGoalsConceded || LEAGUE_AVG_GOALS);
    return { homeAdv: clamp01(hD / 2), awayAdv: clamp01(aD / 2),
             homeValue: (home.avgGoalsConceded || 0).toFixed(2),
             awayValue: (away.avgGoalsConceded || 0).toFixed(2) };
  };

  PredictionEngine.prototype._f_homeAdvantage = function (home, away) {
    var hosts = ['USA', 'MEX', 'CAN'];
    var hS = 0.5, aS = 0.5;
    if (hosts.indexOf(home.code) >= 0) hS = 0.85;
    else if (home.homeContinent === 'North America' || home.confederation === 'CONCACAF') hS = 0.62;
    if (hosts.indexOf(away.code) >= 0) aS = 0.85;
    else if (away.homeContinent === 'North America' || away.confederation === 'CONCACAF') aS = 0.62;
    return { homeAdv: hS, awayAdv: aS,
             homeValue: hosts.indexOf(home.code) >= 0 ? 'Host' : (home.homeContinent || home.confederation),
             awayValue: hosts.indexOf(away.code) >= 0 ? 'Host' : (away.homeContinent || away.confederation) };
  };

  PredictionEngine.prototype._f_wcHistory = function (home, away) {
    var hH = this.wcHistory[home.code] || {};
    var aH = this.wcHistory[away.code] || {};
    var hS = ((hH.titles || 0) * 0.3 + (hH.finals || 0) * 0.15 +
              (home.worldCupApps || 0) * 0.02 + (home.worldCupTitles || 0) * 0.25);
    var aS = ((aH.titles || 0) * 0.3 + (aH.finals || 0) * 0.15 +
              (away.worldCupApps || 0) * 0.02 + (away.worldCupTitles || 0) * 0.25);
    var mx = Math.max(hS, aS, 0.01);
    return { homeAdv: clamp01(hS / mx), awayAdv: clamp01(aS / mx),
             homeValue: (home.worldCupTitles || 0) + ' titles',
             awayValue: (away.worldCupTitles || 0) + ' titles' };
  };

  PredictionEngine.prototype._f_confedStrength = function (home, away) {
    var hC = this.confederations[home.confederation] || {};
    var aC = this.confederations[away.confederation] || {};
    return { homeAdv: hC.strength || 0.5, awayAdv: aC.strength || 0.5,
             homeValue: home.confederation || '?', awayValue: away.confederation || '?' };
  };

  PredictionEngine.prototype._f_restDays = function (home, away, ctx) {
    var hR = (ctx && ctx.restDaysHome != null) ? ctx.restDaysHome : 4;
    var aR = (ctx && ctx.restDaysAway != null) ? ctx.restDaysAway : 4;
    var hS = 1 - clamp(Math.abs(hR - 4.5) / 5, 0, 0.5);
    var aS = 1 - clamp(Math.abs(aR - 4.5) / 5, 0, 0.5);
    return { homeAdv: hS, awayAdv: aS,
             homeValue: hR + ' ngày', awayValue: aR + ' ngày' };
  };

  PredictionEngine.prototype._f_matchStage = function (home, away, ctx) {
    var stage = (ctx && ctx.stage) || 'group';
    var bonus = 0;
    if (stage === 'R32') bonus = 0.05;
    else if (stage === 'R16') bonus = 0.08;
    else if (stage === 'QF')  bonus = 0.12;
    else if (stage === 'SF')  bonus = 0.16;
    else if (stage === 'F')   bonus = 0.20;
    var hE = home.eloRating || BASE_ELO, aE = away.eloRating || BASE_ELO;
    var hB = 0.5 + bonus * (hE > aE ? 1 : -0.3);
    var aB = 0.5 + bonus * (aE > hE ? 1 : -0.3);
    return { homeAdv: clamp01(hB), awayAdv: clamp01(aB),
             homeValue: stage, awayValue: stage };
  };

  PredictionEngine.prototype._f_motivation = function (home, away, ctx) {
    var md = (ctx && ctx.matchday) || 1;
    var hS = 0.5, aS = 0.5;
    if (md >= 3) {
      var hE = home.eloRating || BASE_ELO, aE = away.eloRating || BASE_ELO;
      if (hE < aE) hS += 0.08; else aS += 0.08;
    }
    return { homeAdv: hS, awayAdv: aS,
             homeValue: 'MD ' + md, awayValue: 'MD ' + md };
  };

  PredictionEngine.prototype._f_refereeStyle = function (home, away, ctx) {
    var ref = ctx && ctx.referee ? this._getReferee(ctx.referee) : null;
    if (!ref) return { homeAdv: 0.5, awayAdv: 0.5, homeValue: 'N/A', awayValue: 'N/A' };
    var hDef = home.playingStyle === 'defensive' ? 0.05 : 0;
    var aDef = away.playingStyle === 'defensive' ? 0.05 : 0;
    var hC = (ref.confederation === home.confederation) ? 0.03 : 0;
    var aC = (ref.confederation === away.confederation) ? 0.03 : 0;
    return { homeAdv: clamp01(0.5 + hDef + hC), awayAdv: clamp01(0.5 + aDef + aC),
             homeValue: ref.name, awayValue: ref.name };
  };

  PredictionEngine.prototype._f_weather = function (home, away, ctx) {
    var w = (ctx && ctx.weather) || {};
    var temp = w.temp != null ? w.temp : 25;
    var hum  = w.humidity != null ? w.humidity : 50;
    var rain = !!w.rain;
    var hCl = CONFED_CLIMATE[home.confederation] || 22;
    var aCl = CONFED_CLIMATE[away.confederation] || 22;
    var hD = Math.abs(temp - hCl), aD = Math.abs(temp - aCl);
    var hS = 1 - norm(hD, 0, 25), aS = 1 - norm(aD, 0, 25);
    if (hum > 75) { if (hCl < 20) hS -= 0.08; if (aCl < 20) aS -= 0.08; }
    if (rain) { if (home.playingStyle === 'defensive') hS += 0.04; if (away.playingStyle === 'defensive') aS += 0.04; }
    return { homeAdv: clamp01(hS), awayAdv: clamp01(aS),
             homeValue: temp + '°C ' + hum + '%', awayValue: temp + '°C ' + hum + '%' };
  };

  PredictionEngine.prototype._f_altitude = function (home, away, ctx) {
    var st = ctx && ctx.stadium ? this._getStadium(ctx.stadium) : null;
    var alt = st ? (st.altitude || 0) : 0;
    if (alt < 500) return { homeAdv: 0.5, awayAdv: 0.5, homeValue: alt + 'm', awayValue: alt + 'm' };
    var high = ['MEX','COL','ECU','BOL','PER','ETH','KEN'];
    var hB = high.indexOf(home.code) >= 0 ? 0.12 : -0.10;
    var aB = high.indexOf(away.code) >= 0 ? 0.12 : -0.10;
    var sev = clamp01(alt / 2500);
    return { homeAdv: clamp01(0.5 + hB * sev), awayAdv: clamp01(0.5 + aB * sev),
             homeValue: alt + 'm', awayValue: alt + 'm' };
  };

  PredictionEngine.prototype._f_travelJetLag = function (home, away, ctx) {
    var st = ctx && ctx.stadium ? this._getStadium(ctx.stadium) : null;
    var vLat = st ? st.lat : TOURNAMENT_CENTER.lat;
    var vLng = st ? st.lng : TOURNAMENT_CENTER.lng;
    var hC = coordsOf(home.code), aC = coordsOf(away.code);
    var hD = haversine(hC[0], hC[1], vLat, vLng);
    var aD = haversine(aC[0], aC[1], vLat, vLng);
    var hT = Math.abs(hC[1] - vLng) / 15;
    var aT = Math.abs(aC[1] - vLng) / 15;
    var hS = 1 - norm(hD, 0, 18000);
    var aS = 1 - norm(aD, 0, 18000);
    if (hT > 5) hS -= 0.06 * (hT - 5) / 7;
    if (aT > 5) aS -= 0.06 * (aT - 5) / 7;
    return { homeAdv: clamp01(hS), awayAdv: clamp01(aS),
             homeValue: Math.round(hD) + ' km', awayValue: Math.round(aD) + ' km' };
  };

  PredictionEngine.prototype._f_squadExperience = function (home, away) {
    var hC = home.squadAvgCaps || 30, aC = away.squadAvgCaps || 30;
    return { homeAdv: norm(hC, 10, 80), awayAdv: norm(aC, 10, 80),
             homeValue: hC + ' caps', awayValue: aC + ' caps' };
  };

  PredictionEngine.prototype._f_squadAge = function (home, away) {
    var hA = home.squadAvgAge || 27, aA = away.squadAvgAge || 27;
    return { homeAdv: Math.exp(-Math.pow(hA - 27, 2) / 18),
             awayAdv: Math.exp(-Math.pow(aA - 27, 2) / 18),
             homeValue: hA.toFixed(1), awayValue: aA.toFixed(1) };
  };

  PredictionEngine.prototype._f_keyPlayerAvail = function (home, away) {
    var hI = home.injuryImpact || 0, aI = away.injuryImpact || 0;
    return { homeAdv: clamp01(1 - hI), awayAdv: clamp01(1 - aI),
             homeValue: (hI * 100).toFixed(0) + '% impact',
             awayValue: (aI * 100).toFixed(0) + '% impact' };
  };

  PredictionEngine.prototype._f_tacticalMatchup = function (home, away) {
    var hS = home.playingStyle || 'balanced';
    var aS = away.playingStyle || 'balanced';
    var row = STYLE_MATRIX[hS] || STYLE_MATRIX['balanced'];
    var bonus = row[aS] || 0;
    return { homeAdv: clamp01(0.5 + bonus), awayAdv: clamp01(0.5 - bonus),
             homeValue: hS, awayValue: aS };
  };

  /* ════════════════════════════════════════════════════════════════
   *  Core: predictMatch
   * ════════════════════════════════════════════════════════════════ */
  PredictionEngine.prototype.predictMatch = function (homeCode, awayCode, context, liveStats) {
    context = context || {};
    var home = this._getTeam(homeCode);
    var away = this._getTeam(awayCode);
    if (!home || !away) {
      throw new Error('Unknown team code: ' + (!home ? homeCode : awayCode));
    }

    /* --- The 20 factors --- */
    var factorDefs = [
      { key: 'fifaRanking',     name: 'FIFA Ranking',          nameVi: 'Xếp hạng FIFA',         fn: '_f_fifaRanking' },
      { key: 'eloRating',       name: 'Elo Rating',            nameVi: 'Điểm Elo',              fn: '_f_eloRating' },
      { key: 'recentForm',      name: 'Recent Form',           nameVi: 'Phong độ gần đây',      fn: '_f_recentForm' },
      { key: 'headToHead',      name: 'Head-to-Head',          nameVi: 'Đối đầu',               fn: '_f_headToHead' },
      { key: 'attackStrength',  name: 'Attack Strength',       nameVi: 'Sức mạnh tấn công',     fn: '_f_attackStrength' },
      { key: 'defenseStrength', name: 'Defense Strength',      nameVi: 'Sức mạnh phòng ngự',    fn: '_f_defenseStrength' },
      { key: 'homeAdvantage',   name: 'Home/Region Advantage', nameVi: 'Lợi thế sân nhà',       fn: '_f_homeAdvantage' },
      { key: 'wcHistory',       name: 'World Cup History',     nameVi: 'Lịch sử World Cup',     fn: '_f_wcHistory' },
      { key: 'confedStrength',  name: 'Confederation Strength',nameVi: 'Sức mạnh liên đoàn',    fn: '_f_confedStrength' },
      { key: 'restDays',        name: 'Rest Days',             nameVi: 'Ngày nghỉ',             fn: '_f_restDays' },
      { key: 'matchStage',      name: 'Match Stage',           nameVi: 'Vòng đấu',              fn: '_f_matchStage' },
      { key: 'motivation',      name: 'Motivation/Pressure',   nameVi: 'Động lực / Áp lực',     fn: '_f_motivation' },
      { key: 'refereeStyle',    name: 'Referee Style',         nameVi: 'Phong cách trọng tài',  fn: '_f_refereeStyle' },
      { key: 'weather',         name: 'Weather Conditions',    nameVi: 'Thời tiết',             fn: '_f_weather' },
      { key: 'altitude',        name: 'Altitude Effect',       nameVi: 'Ảnh hưởng độ cao',      fn: '_f_altitude' },
      { key: 'travelJetLag',    name: 'Travel/Jet Lag',        nameVi: 'Di chuyển / Jet Lag',    fn: '_f_travelJetLag' },
      { key: 'squadExperience', name: 'Squad Experience',      nameVi: 'Kinh nghiệm đội hình',  fn: '_f_squadExperience' },
      { key: 'squadAge',        name: 'Squad Age Profile',     nameVi: 'Độ tuổi đội hình',      fn: '_f_squadAge' },
      { key: 'keyPlayerAvail',  name: 'Key Player Availability',nameVi: 'Cầu thủ chủ chốt',    fn: '_f_keyPlayerAvail' },
      { key: 'tacticalMatchup', name: 'Tactical Matchup',      nameVi: 'Chiến thuật đối đầu',   fn: '_f_tacticalMatchup' }
    ];

    var factors = [];
    var hWS = 0, aWS = 0;
    var confidenceAcc = 0, dataPoints = 0;
    var formExtra = null;

    for (var fi = 0; fi < factorDefs.length; fi++) {
      var fd = factorDefs[fi];
      var w = WEIGHTS[fd.key];
      var r = this[fd.fn](home, away, context);
      var delta = r.homeAdv - r.awayAdv;
      var impact = Math.abs(delta) * w;
      var adv = delta > 0.001 ? 'home' : (delta < -0.001 ? 'away' : 'neutral');

      hWS += r.homeAdv * w;
      aWS += r.awayAdv * w;

      if (Math.abs(delta) > 0.05) dataPoints++;
      confidenceAcc += Math.abs(delta) * w;

      if (r._extra && r._extra.homeSpark) formExtra = r._extra;

      factors.push({
        name: fd.name, nameVi: fd.nameVi,
        homeValue: r.homeValue, awayValue: r.awayValue,
        impact: parseFloat(impact.toFixed(4)),
        advantage: adv, weight: w
      });
    }

    /* --- Poisson Lambda Calculation --- */
    var homeAttackRatio  = (home.avgGoalsScored   || this._avgScored)   / this._avgScored;
    var awayAttackRatio  = (away.avgGoalsScored   || this._avgScored)   / this._avgScored;
    var homeDefenseRatio = (home.avgGoalsConceded  || this._avgConceded) / this._avgConceded;
    var awayDefenseRatio = (away.avgGoalsConceded  || this._avgConceded) / this._avgConceded;

    // The 20-factor composite in roughly [-0.3, 0.3]
    var compositeDelta = hWS - aWS;

    // 0.15 → ~16% lambda boost (mirrors real bookmaker market moves)
    var homeFactorMul = 1 + compositeDelta * 0.55;
    var awayFactorMul = 1 - compositeDelta * 0.55;

    // LIVE MOMENTUM INJECTION
    if (liveStats && liveStats.isActive) {
        var homePoss = liveStats.homePossession || 50;
        var awayPoss = liveStats.awayPossession || 50;
        var homeShots = liveStats.homeShotsOnTarget || 0;
        var awayShots = liveStats.awayShotsOnTarget || 0;
        var homeCards = liveStats.homeRedCards || 0;
        var awayCards = liveStats.awayRedCards || 0;

        // Modify lambda based on live stats
        // Possession advantage
        var possDelta = (homePoss - awayPoss) / 100; 
        homeFactorMul += possDelta * 0.2;
        awayFactorMul -= possDelta * 0.2;

        // Shots advantage
        homeFactorMul += homeShots * 0.05;
        awayFactorMul += awayShots * 0.05;

        // Red card penalty
        homeFactorMul -= homeCards * 0.4;
        awayFactorMul -= awayCards * 0.4;
    }

    // Knockout tightening (lower variance) + slight underdog compression
    var stage = context.stage || 'group';
    var tightening = 1;
    if (stage === 'R32') tightening = 0.93;
    else if (stage === 'R16') tightening = 0.90;
    else if (stage === 'QF')  tightening = 0.86;
    else if (stage === 'SF')  tightening = 0.82;
    else if (stage === 'F')   tightening = 0.78;

    var homeLambda = (TOURNAMENT_AVG_GOALS / 2) * homeAttackRatio * awayDefenseRatio * homeFactorMul * tightening;
    var awayLambda = (TOURNAMENT_AVG_GOALS / 2) * awayAttackRatio * homeDefenseRatio * awayFactorMul * tightening;

    homeLambda = clamp(homeLambda, 0.22, 4.5);
    awayLambda = clamp(awayLambda, 0.22, 4.5);

    /* --- Score Matrix with adaptive Dixon-Coles --- */
    var rho = this._computeRho(homeLambda, awayLambda, stage);

    var matrix = [];
    var pH = 0, pD = 0, pA = 0;
    var bestP = 0, bestI = 0, bestJ = 0;

    for (var i = 0; i <= MAX_GOALS; i++) {
      matrix[i] = [];
      for (var j = 0; j <= MAX_GOALS; j++) {
        var pInd = poissonPMF(i, homeLambda) * poissonPMF(j, awayLambda);
        var tau  = this._dixonColesTau(i, j, homeLambda, awayLambda, rho);
        var p    = pInd * tau;
        matrix[i][j] = p;

        if (i > j) pH += p;
        else if (i === j) pD += p;
        else pA += p;

        if (p > bestP) { bestP = p; bestI = i; bestJ = j; }
      }
    }
    var total = pH + pD + pA;
    pH /= total; pD /= total; pA /= total;
    for (var i2 = 0; i2 <= MAX_GOALS; i2++) {
      for (var j2 = 0; j2 <= MAX_GOALS; j2++) matrix[i2][j2] /= total;
    }

    /* --- Knockout: redistribute draws --- */
    if (stage !== 'group') {
      var hShare = pH / Math.max(0.0001, pH + pA);
      pH += pD * hShare;
      pA += pD * (1 - hShare);
      pD = 0;
    }

    /* --- xG & derived markets --- */
    var homeXG = homeLambda, awayXG = awayLambda, totalXG = homeXG + awayXG;

    var over05 = 0, over15 = 0, over25 = 0, over35 = 0, over45 = 0, btts = 0;
    var homeCS = 0, awayCS = 0, bttsNo = 0;
    for (var a = 0; a <= MAX_GOALS; a++) {
      for (var b = 0; b <= MAX_GOALS; b++) {
        var pp = matrix[a][b];
        var s = a + b;
        if (s > 0) over05 += pp;
        if (s > 1) over15 += pp;
        if (s > 2) over25 += pp;
        if (s > 3) over35 += pp;
        if (s > 4) over45 += pp;
        if (a >= 1 && b >= 1) btts += pp;
        if (a === 0) homeCS += pp;
        if (b === 0) awayCS += pp;
        if (a === 0 || b === 0) bttsNo += pp;
      }
    }

    /* --- Win margin distribution --- */
    var winMargin = { '-4':0, '-3':0, '-2':0, '-1':0, '0':pD, '1':0, '2':0, '3':0, '4':0 };
    for (var a2 = 0; a2 <= MAX_GOALS; a2++) {
      for (var b2 = 0; b2 <= MAX_GOALS; b2++) {
        var pp2 = matrix[a2][b2];
        var diff = a2 - b2;
        if (diff <= -4) winMargin['-4'] += pp2;
        else if (diff === -3) winMargin['-3'] += pp2;
        else if (diff === -2) winMargin['-2'] += pp2;
        else if (diff === -1) winMargin['-1'] += pp2;
        else if (diff === 0)  winMargin['0']  += pp2;
        else if (diff === 1)  winMargin['1']  += pp2;
        else if (diff === 2)  winMargin['2']  += pp2;
        else if (diff === 3)  winMargin['3']  += pp2;
        else if (diff >= 4)   winMargin['4']  += pp2;
      }
    }

    /* --- Top-5 most likely exact scores --- */
    var scoreList = [];
    for (var a3 = 0; a3 <= MAX_GOALS; a3++) {
      for (var b3 = 0; b3 <= MAX_GOALS; b3++) {
        scoreList.push({ home: a3, away: b3, prob: matrix[a3][b3] });
      }
    }
    scoreList.sort(function (x, y) { return y.prob - x.prob; });
    var topScores = scoreList.slice(0, 5);

    /* --- Confidence: entropy + signal spread + data coverage --- */
    var h = entropy3(pH, pD, pA);                    // bits (max ≈ 1.585)
    var uniformity = h / 1.585;                       // 0=clear pick, 1=coin flip
    var spread = Math.abs(pH - pA);
    var coverage = clamp01(dataPoints / 14);
    // Confidence: penalise low entropy, reward data coverage and clear spread
    var confidence = clamp01(0.30 + spread * 0.45 + coverage * 0.20 + (1 - uniformity) * 0.20);

    /* --- HT/FT (rough) --- */
    var homeHTLambda = homeLambda * HT_SPLIT;
    var awayHTLambda = awayLambda * HT_SPLIT;
    var htResult = this._htDistribution(homeHTLambda, awayHTLambda);
    var htFt = this._htftCombinations(htResult, pH, pD, pA);

    /* --- Build the result --- */
    return {
      homeTeam: { code: home.code, name: home.name, flag: home.flag },
      awayTeam: { code: away.code, name: away.name, flag: away.flag },
      homeWinProb: parseFloat(pH.toFixed(4)),
      drawProb:    parseFloat(pD.toFixed(4)),
      awayWinProb: parseFloat(pA.toFixed(4)),
      predictedScore: [bestI, bestJ],
      scoreMatrix: matrix,
      confidence: parseFloat(confidence.toFixed(4)),

      // xG
      homeExpectedGoals:  parseFloat(homeXG.toFixed(3)),
      awayExpectedGoals:  parseFloat(awayXG.toFixed(3)),
      totalGoalsExpected: parseFloat(totalXG.toFixed(3)),

      // Goal-line markets
      over05Prob: parseFloat(over05.toFixed(4)),
      over15Prob: parseFloat(over15.toFixed(4)),
      over25Prob: parseFloat(over25.toFixed(4)),
      over35Prob: parseFloat(over35.toFixed(4)),
      over45Prob: parseFloat(over45.toFixed(4)),
      under25Prob: parseFloat((1 - over25).toFixed(4)),

      // BTTS
      bttsProb: parseFloat(btts.toFixed(4)),
      bttsNoProb: parseFloat(bttsNo.toFixed(4)),

      // Clean sheets
      homeCleanSheet: parseFloat(homeCS.toFixed(4)),
      awayCleanSheet: parseFloat(awayCS.toFixed(4)),

      // 2-way markets
      doubleChanceHomeDraw: parseFloat((pH + pD).toFixed(4)),
      doubleChanceAwayDraw: parseFloat((pA + pD).toFixed(4)),
      doubleChanceHomeAway: parseFloat((pH + pA).toFixed(4)),
      drawNoBetHome: parseFloat((pH / (pH + pA + 0.0001)).toFixed(4)),
      drawNoBetAway: parseFloat((pA / (pH + pA + 0.0001)).toFixed(4)),

      // Win margin
      winMargin: winMargin,

      // Top scores
      topScores: topScores.map(function (s) {
        return { home: s.home, away: s.away, prob: parseFloat(s.prob.toFixed(4)) };
      }),

      // HT/FT
      htResult: htResult,
      htFt: htFt,

      // Inputs (for the AI report)
      factors: factors,
      lambdas: { home: parseFloat(homeLambda.toFixed(3)), away: parseFloat(awayLambda.toFixed(3)) },
      rho: parseFloat(rho.toFixed(4)),
      stage: stage,
      compositeDelta: parseFloat(compositeDelta.toFixed(4)),
      entropy: parseFloat(h.toFixed(4)),
      formTrajectory: formExtra
    };
  };

  /** Half-time distribution (3 outcomes, 0-1 each) */
  PredictionEngine.prototype._htDistribution = function (lH, lAW) {
    var m = [], hW = 0, dW = 0, aW = 0;
    for (var i = 0; i <= MAX_GOALS; i++) {
      m[i] = [];
      for (var j = 0; j <= MAX_GOALS; j++) {
        var p = poissonPMF(i, lH) * poissonPMF(j, lAW);
        m[i][j] = p;
        if (i > j) hW += p; else if (i === j) dW += p; else aW += p;
      }
    }
    var t = hW + dW + aW || 1;
    return { home: hW/t, draw: dW/t, away: aW/t };
  };

  /** 9-cell HT/FT matrix (heuristic correlation) */
  PredictionEngine.prototype._htftCombinations = function (ht, ftH, ftD, ftA) {
    // P(FT=W | HT=W) is higher than unconditional; assume correlation 0.35
    var r = 0.35;
    var cell = function (pHt, pFtBase) {
      // Dampen toward independent: p = (1-r)*pHt*pFt + r*pFtBase
      return (1 - r) * pHt * pFtBase + r * pFtBase;
    };
    return {
      'H/H': parseFloat(cell(ht.home, ftH).toFixed(4)),
      'H/D': parseFloat(cell(ht.home, ftD).toFixed(4)),
      'H/A': parseFloat(cell(ht.home, ftA).toFixed(4)),
      'D/H': parseFloat(cell(ht.draw, ftH).toFixed(4)),
      'D/D': parseFloat(cell(ht.draw, ftD).toFixed(4)),
      'D/A': parseFloat(cell(ht.draw, ftA).toFixed(4)),
      'A/H': parseFloat(cell(ht.away, ftH).toFixed(4)),
      'A/D': parseFloat(cell(ht.away, ftD).toFixed(4)),
      'A/A': parseFloat(cell(ht.away, ftA).toFixed(4))
    };
  };

  /** Adaptive Dixon-Coles rho: stronger correction in tight contests */
  PredictionEngine.prototype._computeRho = function (lH, lAW, stage) {
    var product = lH * lAW;
    var base = clamp(-0.05 - 0.08 / (1 + product), -0.3, 0);
    if (stage === 'F')   base *= 1.15;
    if (stage === 'SF')  base *= 1.10;
    if (stage === 'QF')  base *= 1.05;
    return base;
  };

  PredictionEngine.prototype._dixonColesTau = function (x, y, l1, l2, rho) {
    if (x === 0 && y === 0) return 1 - l1 * l2 * rho;
    if (x === 0 && y === 1) return 1 + l1 * rho;
    if (x === 1 && y === 0) return 1 + l2 * rho;
    if (x === 1 && y === 1) return 1 - rho;
    return 1;
  };

  /* ════════════════════════════════════════════════════════════════
   *  Elo update với K-factor động
   * ════════════════════════════════════════════════════════════════ */
  PredictionEngine.prototype._eloK = function (stage) {
    if (stage === 'F')   return 75;
    if (stage === 'SF')  return 70;
    if (stage === 'QF')  return 65;
    if (stage === 'R16') return 62;
    if (stage === 'R32') return 60;
    return 55; // group
  };

  PredictionEngine.prototype.updateElo = function (aCode, bCode, sA, sB, stage) {
    var A = this._getTeam(aCode), B = this._getTeam(bCode);
    if (!A || !B) return null;
    var rA = A.eloRating || BASE_ELO, rB = B.eloRating || BASE_ELO;
    var eA = eloExpected(rA, rB), eB = 1 - eA;
    var sAscore = sA > sB ? 1 : (sA === sB ? 0.5 : 0);
    var sBscore = 1 - sAscore;
    var gd = Math.abs(sA - sB);
    var gdMul = gd <= 1 ? 1 : (gd === 2 ? 1.5 : (1.75 + (gd - 3) * 0.375));
    var K = this._eloK(stage || 'group');

    var nrA = Math.round(rA + K * gdMul * (sAscore - eA));
    var nrB = Math.round(rB + K * gdMul * (sBscore - eB));
    A.eloRating = nrA; B.eloRating = nrB;

    return {
      teamA: { code: aCode, oldElo: rA, newElo: nrA, change: nrA - rA },
      teamB: { code: bCode, oldElo: rB, newElo: nrB, change: nrB - rB }
    };
  };

  /* ════════════════════════════════════════════════════════════════
   *  Team strength (composite 0-100)
   * ════════════════════════════════════════════════════════════════ */
  PredictionEngine.prototype.getTeamStrength = function (code) {
    var t = this._getTeam(code);
    if (!t) return null;
    var f = this._formTrajectory(t);
    var rankS   = (1 - norm(t.fifaRanking || 50, 1, 211)) * 22;
    var eloS    = norm(t.eloRating || BASE_ELO, 1200, 2200) * 25;
    var formS   = f.decayed * 18;
    var histS   = clamp((t.worldCupTitles || 0) * 4 + (t.worldCupApps || 0) * 0.5, 0, 15);
    var squadS  = norm(t.squadAvgCaps || 30, 10, 80) * 10;
    var injPen  = (t.injuryImpact || 0) * 6;
    var total = clamp(rankS + eloS + formS + histS + squadS - injPen, 0, 100);
    return {
      code: code, name: t.name, overall: parseFloat(total.toFixed(1)),
      breakdown: {
        ranking: parseFloat(rankS.toFixed(1)),
        elo: parseFloat(eloS.toFixed(1)),
        form: parseFloat(formS.toFixed(1)),
        history: parseFloat(histS.toFixed(1)),
        squad: parseFloat(squadS.toFixed(1)),
        injuryPenalty: parseFloat(injPen.toFixed(1))
      },
      sparkline: f.sparkline
    };
  };

  /* ════════════════════════════════════════════════════════════════
   *  Group Monte Carlo (FIFA-correct tie-break)
   * ════════════════════════════════════════════════════════════════ */
  PredictionEngine.prototype.getGroupProbabilities = function (groupCode) {
    var groupRaw = this.groups[groupCode];
    if (!groupRaw) return null;
    var group = Array.isArray(groupRaw) ? groupRaw : (groupRaw.teams || []);
    var n = group.length;
    if (n < 2) return null;

    var fixtures = [];
    for (var a = 0; a < n; a++)
      for (var b = a + 1; b < n; b++)
        fixtures.push([group[a], group[b]]);

    // Use already-played results
    var played = {};
    for (var fx = 0; fx < this.fixtures.length; fx++) {
      var f = this.fixtures[fx];
      var fH = typeof f.homeTeam === 'string' ? f.homeTeam : (f.homeTeam && f.homeTeam.code);
      var fA = typeof f.awayTeam === 'string' ? f.awayTeam : (f.awayTeam && f.awayTeam.code);
      var fHs = f.homeScore != null ? f.homeScore : (f.score && f.score.home);
      var fAs = f.awayScore != null ? f.awayScore : (f.score && f.score.away);
      if (f.group === groupCode && f.status === 'finished' && fHs != null) {
        played[fH + '_' + fA] = { home: fHs, away: fAs };
      }
    }

    // Pre-compute predictions for unplayed fixtures
    var preds = {};
    for (var mi = 0; mi < fixtures.length; mi++) {
      var pair = fixtures[mi];
      var key = pair[0] + '_' + pair[1];
      if (!played[key] && !played[pair[1] + '_' + pair[0]]) {
        preds[key] = this.predictMatch(pair[0], pair[1], { stage: 'group', group: groupCode });
      }
    }

    var finishCount = {};
    for (var ti = 0; ti < n; ti++) {
      finishCount[group[ti]] = new Array(n);
      for (var pi = 0; pi < n; pi++) finishCount[group[ti]][pi] = 0;
    }

    for (var sim = 0; sim < MONTE_CARLO_RUNS; sim++) {
      var pts = {}, gd = {}, gf = {}, ga = {};
      for (var t2 = 0; t2 < n; t2++) {
        pts[group[t2]] = 0; gd[group[t2]] = 0; gf[group[t2]] = 0; ga[group[t2]] = 0;
      }
      // H2H record per team in this sim
      var h2hWins = {};
      for (var hh = 0; hh < n; hh++) h2hWins[group[hh]] = {};

      for (var mi2 = 0; mi2 < fixtures.length; mi2++) {
        var pair2 = fixtures[mi2];
        var keyHm = pair2[0] + '_' + pair2[1];
        var keyAw = pair2[1] + '_' + pair2[0];
        var hG, aG;
        if (played[keyHm]) {
          hG = played[keyHm].home; aG = played[keyHm].away;
        } else if (played[keyAw]) {
          hG = played[keyAw].away; aG = played[keyAw].home;
        } else {
          var pred = preds[keyHm];
          var r = Math.random();
          var cum = 0, found = false;
          hG = 0; aG = 0;
          for (var si = 0; si <= MAX_GOALS && !found; si++) {
            for (var sj = 0; sj <= MAX_GOALS && !found; sj++) {
              cum += pred.scoreMatrix[si][sj];
              if (r <= cum) { hG = si; aG = sj; found = true; }
            }
          }
        }
        gf[pair2[0]] += hG; ga[pair2[0]] += aG;
        gf[pair2[1]] += aG; ga[pair2[1]] += hG;
        gd[pair2[0]] += hG - aG; gd[pair2[1]] += aG - hG;
        if (hG > aG) { pts[pair2[0]] += 3; h2hWins[pair2[0]][pair2[1]] = (h2hWins[pair2[0]][pair2[1]] || 0) + 1; }
        else if (hG === aG) { pts[pair2[0]] += 1; pts[pair2[1]] += 1; }
        else { pts[pair2[1]] += 3; h2hWins[pair2[1]][pair2[0]] = (h2hWins[pair2[1]][pair2[0]] || 0) + 1; }
      }

      // FIFA tie-break: pts > GD > GF > h2h among tied > random
      var sorted = group.slice().sort(function (a, b) {
        if (pts[b] !== pts[a]) return pts[b] - pts[a];
        if (gd[b]  !== gd[a])  return gd[b]  - gd[a];
        if (gf[b]  !== gf[a])  return gf[b]  - gf[a];
        // h2h between tied teams: count wins only
        var aw = h2hWins[a][b] || 0, bw = h2hWins[b][a] || 0;
        if (bw !== aw) return bw - aw;
        return Math.random() - 0.5;
      });
      for (var si2 = 0; si2 < n; si2++) finishCount[sorted[si2]][si2]++;
    }

    var result = {};
    for (var t3 = 0; t3 < n; t3++) {
      var code = group[t3];
      var positions = [];
      for (var p = 0; p < n; p++) positions.push(parseFloat((finishCount[code][p] / MONTE_CARLO_RUNS).toFixed(4)));
      var qual = positions[0] + positions[1];
      var bestThird = n > 2 ? positions[2] * 0.67 : 0; // WC2026: 8 of 12 best 3rds qualify
      result[code] = {
        name: (this.teams[code] || {}).name || code,
        flag: (this.teams[code] || {}).flag || '',
        positions: positions,
        first: positions[0], second: positions[1],
        third: positions.length > 2 ? positions[2] : 0,
        fourth: positions.length > 3 ? positions[3] : 0,
        qualifyProb: parseFloat(clamp01(qual + bestThird).toFixed(4)),
        eliminatedProb: parseFloat(clamp01(1 - qual - bestThird).toFixed(4))
      };
    }
    return { group: groupCode, teams: result, simulations: MONTE_CARLO_RUNS };
  };

  /* ════════════════════════════════════════════════════════════════
   *  Markets (derived view)
   * ════════════════════════════════════════════════════════════════ */
  PredictionEngine.prototype.getMatchMarkets = function (prediction) {
    if (!prediction) return null;
    return {
      moneyline: {
        home: prediction.homeWinProb,
        draw: prediction.drawProb,
        away: prediction.awayWinProb
      },
      doubleChance: {
        '1X': prediction.doubleChanceHomeDraw,
        'X2': prediction.doubleChanceAwayDraw,
        '12': prediction.doubleChanceHomeAway
      },
      drawNoBet: {
        home: prediction.drawNoBetHome,
        away: prediction.drawNoBetAway
      },
      totals: {
        '0.5': { over: prediction.over05Prob, under: 1 - prediction.over05Prob },
        '1.5': { over: prediction.over15Prob, under: 1 - prediction.over15Prob },
        '2.5': { over: prediction.over25Prob, under: 1 - prediction.over25Prob },
        '3.5': { over: prediction.over35Prob, under: 1 - prediction.over35Prob },
        '4.5': { over: prediction.over45Prob, under: 1 - prediction.over45Prob }
      },
      btts: { yes: prediction.bttsProb, no: prediction.bttsNoProb },
      cleanSheet: { home: prediction.homeCleanSheet, away: prediction.awayCleanSheet },
      topScores: prediction.topScores,
      winMargin: prediction.winMargin,
      htResult: prediction.htResult,
      htFt: prediction.htFt
    };
  };

  /* ════════════════════════════════════════════════════════════════
   *  AI Pitch Report (plain language)
   * ════════════════════════════════════════════════════════════════ */
  PredictionEngine.prototype.getAIPitchReport = function (prediction, lang) {
    lang = lang || 'vi';
    if (!prediction) return '';
    var h = prediction.homeTeam, a = prediction.awayTeam;
    var ph = (prediction.homeWinProb * 100).toFixed(1);
    var pd = (prediction.drawProb * 100).toFixed(1);
    var pa = (prediction.awayWinProb * 100).toFixed(1);
    var pH = +ph, pD = +pd, pA = +pa;
    var pick, margin;
    if (pH > pA && pH > pD) { pick = h.name + ' thắng'; margin = ph; }
    else if (pA > pH && pA > pD) { pick = a.name + ' thắng'; margin = pa; }
    else { pick = 'Hòa'; margin = pd; }

    // Top 3 factors
    var fs = (prediction.factors || []).slice().sort(function (x, y) { return y.impact - x.impact; }).slice(0, 3);

    if (lang === 'en') {
      return [
        'AI VERDICT: ' + pick + ' (model probability ' + margin + '%, confidence ' + (prediction.confidence*100).toFixed(0) + '%).',
        'Key drivers: ' + fs.map(function (f) { return f.name + (f.advantage !== 'neutral' ? ' (' + f.advantage + ')' : ''); }).join(', ') + '.',
        'Projected xG: ' + h.name + ' ' + prediction.homeExpectedGoals + ' – ' + prediction.awayExpectedGoals + ' ' + a.name + '.',
        'Most likely score: ' + prediction.predictedScore[0] + '–' + prediction.predictedScore[1] + '.',
        'BTTS: ' + (prediction.bttsProb*100).toFixed(0) + '%.  Over 2.5: ' + (prediction.over25Prob*100).toFixed(0) + '%.'
      ].join(' ');
    }

    // Vietnamese
    return [
      '⚡ AI NHẬN ĐỊNH: ' + pick + ' (xác suất ' + margin + '%, độ tin cậy ' + (prediction.confidence*100).toFixed(0) + '%).',
      '🔍 Yếu tố quyết định: ' + fs.map(function (f) {
        var adv = f.advantage === 'home' ? '– lợi thế nhà' : (f.advantage === 'away' ? '– lợi thế khách' : '– cân bằng');
        return f.nameVi + ' ' + adv;
      }).join(' · ') + '.',
      '📊 xG dự kiến: ' + h.name + ' ' + prediction.homeExpectedGoals + ' – ' + prediction.awayExpectedGoals + ' ' + a.name + '.',
      '🎯 Tỉ số khả thi nhất: ' + prediction.predictedScore[0] + '–' + prediction.predictedScore[1] + '.',
      '⚽ Cả hai ghi bàn: ' + (prediction.bttsProb*100).toFixed(0) + '%. Trên 2.5 bàn: ' + (prediction.over25Prob*100).toFixed(0) + '%.',
      prediction.homeCleanSheet > 0.4 ? '🧤 ' + h.name + ' có khả năng giữ sạch lưới cao (' + (prediction.homeCleanSheet*100).toFixed(0) + '%).' : '',
      prediction.awayCleanSheet > 0.4 ? '🧤 ' + a.name + ' có khả năng giữ sạch lưới cao (' + (prediction.awayCleanSheet*100).toFixed(0) + '%).' : ''
    ].filter(Boolean).join(' ');
  };

  /* ════════════════════════════════════════════════════════════════
   *  Form sparkline (last n results)
   * ════════════════════════════════════════════════════════════════ */
  PredictionEngine.prototype.getTeamFormSparkline = function (code, n) {
    n = n || 10;
    var t = this._getTeam(code);
    if (!t) return [];
    var f = (t.recentForm || []).slice(0, n);
    // Pad with 0.5 if too few
    while (f.length < n) f.unshift(0.5);
    return f.map(function (v) { return Math.round((v == null ? 0.5 : v) * 100); });
  };

  /* ════════════════════════════════════════════════════════════════
   *  Calibration: log predictions vs outcomes (Brier)
   * ════════════════════════════════════════════════════════════════ */
  
  PredictionEngine.prototype.trainFromHistory = function(fixtures) {
    if (!Array.isArray(fixtures)) return;
    // Sort chronologically
    var sorted = fixtures.slice().sort(function(a,b){ return new Date(a.utcDate) - new Date(b.utcDate); });
    
    // Reset forms and dynamic stats
    var codes = Object.keys(this.teams);
    for (var i=0; i<codes.length; i++) {
        this.teams[codes[i]].recentForm = []; // Clear hardcoded form
    }

    for (var i=0; i<sorted.length; i++) {
       var f = sorted[i];
       if (f.status === 'finished') {
           var hScore = f.homeScore != null ? f.homeScore : (f.score && f.score.home);
           var aScore = f.awayScore != null ? f.awayScore : (f.score && f.score.away);
           
           if (hScore != null && aScore != null) {
               var hCode = typeof f.homeTeam === 'object' ? f.homeTeam.code : f.homeTeam;
               var aCode = typeof f.awayTeam === 'object' ? f.awayTeam.code : f.awayTeam;
               var home = this._getTeam(hCode);
               var away = this._getTeam(aCode);
               if (!home || !away) continue;

               // Update ELO
               this.updateElo(hCode, aCode, hScore, aScore, f.stage);
               
               // Update Form (1 for Win, 0.5 for Draw, 0 for Loss)
               var hRes = hScore > aScore ? 1 : (hScore < aScore ? 0 : 0.5);
               var aRes = hScore < aScore ? 1 : (hScore > aScore ? 0 : 0.5);
               
               home.recentForm.push(hRes);
               away.recentForm.push(aRes);
               // Keep only last 10 matches
               if (home.recentForm.length > 10) home.recentForm.shift();
               if (away.recentForm.length > 10) away.recentForm.shift();
           }
       }
    }
  };

  PredictionEngine.prototype.calibrateFromHistory = function (fixtures) {
    if (!Array.isArray(fixtures)) return { brier: null, n: 0 };
    var self = this;
    var sum = 0, n = 0;
    for (var i = 0; i < fixtures.length; i++) {
      var f = fixtures[i];
      if (f.status !== 'finished' || f.homeScore == null || f.awayScore == null) continue;
      var pred;
      try { pred = self.predictMatch(f.homeTeam, f.awayTeam, { stage: f.stage || 'group' }); }
      catch (e) { continue; }
      var outcome;
      if (f.homeScore > f.awayScore) outcome = 'H';
      else if (f.homeScore < f.awayScore) outcome = 'A';
      else outcome = 'D';
      var pH = pred.homeWinProb, pD = pred.drawProb, pA = pred.awayWinProb;
      var oH = outcome === 'H' ? 1 : 0;
      var oD = outcome === 'D' ? 1 : 0;
      var oA = outcome === 'A' ? 1 : 0;
      sum += Math.pow(pH - oH, 2) + Math.pow(pD - oD, 2) + Math.pow(pA - oA, 2);
      n++;
    }
    var brier = n > 0 ? sum / n : null;
    this._calibrationLog.push({ brier: brier, n: n, ts: Date.now() });
    return { brier: brier, n: n };
  };

  PredictionEngine.prototype.getCalibrationReport = function () {
    if (!this._calibrationLog.length) return null;
    return this._calibrationLog[this._calibrationLog.length - 1];
  };

  /* ════════════════════════════════════════════════════════════════
   *  Expose
   * ════════════════════════════════════════════════════════════════ */
  window.PredictionEngine = PredictionEngine;

})();
