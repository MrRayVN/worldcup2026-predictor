/**
 * FIFA World Cup 2026 - Complete Data Layer
 * ==========================================
 * 48 teams · 12 groups · 104 matches · 16 venues
 * Hosted by: USA, Canada, Mexico
 * 
 * Data current as of: June 18, 2026
 * Format: window.WC2026_DATA global object (no imports/exports)
 */

window.WC2026_DATA = {

  // ═══════════════════════════════════════════════════════════════
  //  CONFEDERATIONS
  // ═══════════════════════════════════════════════════════════════
  confederations: {
    UEFA:     { name: 'UEFA',     fullName: 'Union of European Football Associations',            strength: 0.95, avgElo: 1750, teams: 16, region: 'Europe' },
    CONMEBOL: { name: 'CONMEBOL', fullName: 'South American Football Confederation',              strength: 0.90, avgElo: 1720, teams: 6,  region: 'South America' },
    CONCACAF: { name: 'CONCACAF', fullName: 'Confederation of North, Central America and Caribbean Football', strength: 0.65, avgElo: 1520, teams: 6, region: 'North/Central America & Caribbean' },
    AFC:      { name: 'AFC',      fullName: 'Asian Football Confederation',                       strength: 0.55, avgElo: 1480, teams: 8,  region: 'Asia' },
    CAF:      { name: 'CAF',      fullName: 'Confederation of African Football',                  strength: 0.60, avgElo: 1500, teams: 9,  region: 'Africa' },
    OFC:      { name: 'OFC',      fullName: 'Oceania Football Confederation',                     strength: 0.30, avgElo: 1350, teams: 1,  region: 'Oceania' }
  },

  // ═══════════════════════════════════════════════════════════════
  //  STADIUMS (16 venues)
  // ═══════════════════════════════════════════════════════════════
  stadiums: {
    metlife: {
      id: 'metlife',
      name: 'MetLife Stadium',
      city: 'East Rutherford, New Jersey',
      shortCity: 'New York/New Jersey',
      country: 'USA',
      capacity: 82500,
      altitude: 10,
      lat: 40.8128,
      lng: -74.0742,
      timezone: 'America/New_York',
      avgTempJune: 25,
      avgHumidity: 65,
      surfaceType: 'Grass (temporary)',
      roofType: 'Open',
      role: 'Final'
    },
    azteca: {
      id: 'azteca',
      name: 'Estadio Azteca',
      city: 'Mexico City',
      shortCity: 'Mexico City',
      country: 'Mexico',
      capacity: 87523,
      altitude: 2240,
      lat: 19.3029,
      lng: -99.1505,
      timezone: 'America/Mexico_City',
      avgTempJune: 19,
      avgHumidity: 60,
      surfaceType: 'Grass',
      roofType: 'Open',
      role: 'Opening Match'
    },
    sofi: {
      id: 'sofi',
      name: 'SoFi Stadium',
      city: 'Inglewood, California',
      shortCity: 'Los Angeles',
      country: 'USA',
      capacity: 70240,
      altitude: 30,
      lat: 33.9535,
      lng: -118.3392,
      timezone: 'America/Los_Angeles',
      avgTempJune: 22,
      avgHumidity: 70,
      surfaceType: 'Grass (temporary)',
      roofType: 'Covered',
      role: 'Semi-Final'
    },
    att: {
      id: 'att',
      name: 'AT&T Stadium',
      city: 'Arlington, Texas',
      shortCity: 'Dallas',
      country: 'USA',
      capacity: 80000,
      altitude: 185,
      lat: 32.7473,
      lng: -97.0945,
      timezone: 'America/Chicago',
      avgTempJune: 32,
      avgHumidity: 55,
      surfaceType: 'Grass (temporary)',
      roofType: 'Retractable',
      role: 'Semi-Final'
    },
    hardrock: {
      id: 'hardrock',
      name: 'Hard Rock Stadium',
      city: 'Miami Gardens, Florida',
      shortCity: 'Miami',
      country: 'USA',
      capacity: 65326,
      altitude: 3,
      lat: 25.9580,
      lng: -80.2389,
      timezone: 'America/New_York',
      avgTempJune: 30,
      avgHumidity: 75,
      surfaceType: 'Grass',
      roofType: 'Partial canopy',
      role: 'Quarter-Final'
    },
    nrg: {
      id: 'nrg',
      name: 'NRG Stadium',
      city: 'Houston, Texas',
      shortCity: 'Houston',
      country: 'USA',
      capacity: 72220,
      altitude: 15,
      lat: 29.6847,
      lng: -95.4107,
      timezone: 'America/Chicago',
      avgTempJune: 33,
      avgHumidity: 72,
      surfaceType: 'Grass (temporary)',
      roofType: 'Retractable',
      role: 'Quarter-Final'
    },
    mercedesbenz: {
      id: 'mercedesbenz',
      name: 'Mercedes-Benz Stadium',
      city: 'Atlanta, Georgia',
      shortCity: 'Atlanta',
      country: 'USA',
      capacity: 71000,
      altitude: 320,
      lat: 33.7553,
      lng: -84.4006,
      timezone: 'America/New_York',
      avgTempJune: 29,
      avgHumidity: 68,
      surfaceType: 'Grass (temporary)',
      roofType: 'Retractable',
      role: 'Group Stage / Round of 32'
    },
    lumen: {
      id: 'lumen',
      name: 'Lumen Field',
      city: 'Seattle, Washington',
      shortCity: 'Seattle',
      country: 'USA',
      capacity: 69000,
      altitude: 5,
      lat: 47.5952,
      lng: -122.3316,
      timezone: 'America/Los_Angeles',
      avgTempJune: 18,
      avgHumidity: 62,
      surfaceType: 'Grass',
      roofType: 'Partial cover',
      role: 'Group Stage / Round of 32'
    },
    levis: {
      id: 'levis',
      name: "Levi's Stadium",
      city: 'Santa Clara, California',
      shortCity: 'San Francisco Bay Area',
      country: 'USA',
      capacity: 68500,
      altitude: 15,
      lat: 37.4033,
      lng: -121.9694,
      timezone: 'America/Los_Angeles',
      avgTempJune: 22,
      avgHumidity: 55,
      surfaceType: 'Grass',
      roofType: 'Open',
      role: 'Group Stage / Round of 32'
    },
    arrowhead: {
      id: 'arrowhead',
      name: 'Arrowhead Stadium',
      city: 'Kansas City, Missouri',
      shortCity: 'Kansas City',
      country: 'USA',
      capacity: 76416,
      altitude: 275,
      lat: 39.0489,
      lng: -94.4839,
      timezone: 'America/Chicago',
      avgTempJune: 28,
      avgHumidity: 65,
      surfaceType: 'Grass',
      roofType: 'Open',
      role: 'Group Stage / Round of 32'
    },
    lincoln: {
      id: 'lincoln',
      name: 'Lincoln Financial Field',
      city: 'Philadelphia, Pennsylvania',
      shortCity: 'Philadelphia',
      country: 'USA',
      capacity: 69328,
      altitude: 15,
      lat: 39.9008,
      lng: -75.1675,
      timezone: 'America/New_York',
      avgTempJune: 26,
      avgHumidity: 62,
      surfaceType: 'Grass',
      roofType: 'Open',
      role: 'Group Stage / Round of 32'
    },
    gillette: {
      id: 'gillette',
      name: 'Gillette Stadium',
      city: 'Foxborough, Massachusetts',
      shortCity: 'Boston',
      country: 'USA',
      capacity: 65878,
      altitude: 60,
      lat: 42.0909,
      lng: -71.2643,
      timezone: 'America/New_York',
      avgTempJune: 23,
      avgHumidity: 63,
      surfaceType: 'Grass',
      roofType: 'Open',
      role: 'Group Stage / Round of 32'
    },
    bmo: {
      id: 'bmo',
      name: 'BMO Field',
      city: 'Toronto, Ontario',
      shortCity: 'Toronto',
      country: 'Canada',
      capacity: 45000,
      altitude: 77,
      lat: 43.6332,
      lng: -79.4186,
      timezone: 'America/Toronto',
      avgTempJune: 22,
      avgHumidity: 60,
      surfaceType: 'Grass',
      roofType: 'Open',
      role: 'Group Stage'
    },
    bcplace: {
      id: 'bcplace',
      name: 'BC Place',
      city: 'Vancouver, British Columbia',
      shortCity: 'Vancouver',
      country: 'Canada',
      capacity: 54500,
      altitude: 5,
      lat: 49.2768,
      lng: -123.1118,
      timezone: 'America/Vancouver',
      avgTempJune: 18,
      avgHumidity: 60,
      surfaceType: 'Grass (temporary)',
      roofType: 'Retractable',
      role: 'Group Stage'
    },
    bbva: {
      id: 'bbva',
      name: 'Estadio BBVA',
      city: 'Monterrey, Nuevo León',
      shortCity: 'Monterrey',
      country: 'Mexico',
      capacity: 53500,
      altitude: 540,
      lat: 25.6662,
      lng: -100.2448,
      timezone: 'America/Monterrey',
      avgTempJune: 31,
      avgHumidity: 55,
      surfaceType: 'Grass',
      roofType: 'Open',
      role: 'Group Stage'
    },
    akron: {
      id: 'akron',
      name: 'Estadio Akron',
      city: 'Zapopan, Jalisco',
      shortCity: 'Guadalajara',
      country: 'Mexico',
      capacity: 49850,
      altitude: 1550,
      lat: 20.6826,
      lng: -103.4625,
      timezone: 'America/Mexico_City',
      avgTempJune: 24,
      avgHumidity: 65,
      surfaceType: 'Grass',
      roofType: 'Partial cover',
      role: 'Group Stage'
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  TEAMS (48 teams, keyed by FIFA code)
  // ═══════════════════════════════════════════════════════════════
  teams: {
    // ── GROUP A ──────────────────────────────────────────────────
    MEX: {
      name: 'Mexico',
      code: 'MEX',
      flag: '🇲🇽',
      confederation: 'CONCACAF',
      fifaRanking: 15,
      eloRating: 1840,
      worldCupTitles: 0,
      worldCupApps: 17,
      bestFinish: 'Quarter-finals',
      recentForm: [1, 0.5, 1, 0, 1, 1, 0.5, 1, 1, 1],
      avgGoalsScored: 1.6,
      avgGoalsConceded: 0.9,
      squadAvgAge: 27.8,
      squadAvgCaps: 36,
      keyPlayers: ['Santiago Giménez', 'Edson Álvarez', 'Hirving Lozano'],
      playingStyle: 'possession',
      homeContinent: 'North America',
      injuryImpact: 0.08
    },
    RSA: {
      name: 'South Africa',
      code: 'RSA',
      flag: '🇿🇦',
      confederation: 'CAF',
      fifaRanking: 56,
      eloRating: 1530,
      worldCupTitles: 0,
      worldCupApps: 4,
      bestFinish: 'Group Stage',
      recentForm: [0.5, 1, 0, 1, 0.5, 0, 1, 0, 0.5, 1],
      avgGoalsScored: 1.1,
      avgGoalsConceded: 1.2,
      squadAvgAge: 27.0,
      squadAvgCaps: 24,
      keyPlayers: ['Percy Tau', 'Ronwen Williams', 'Themba Zwane'],
      playingStyle: 'balanced',
      homeContinent: 'Africa',
      injuryImpact: 0.12
    },
    KOR: {
      name: 'South Korea',
      code: 'KOR',
      flag: '🇰🇷',
      confederation: 'AFC',
      fifaRanking: 22,
      eloRating: 1780,
      worldCupTitles: 0,
      worldCupApps: 11,
      bestFinish: 'Fourth Place',
      recentForm: [1, 0.5, 1, 1, 0, 1, 1, 0.5, 1, 0.5],
      avgGoalsScored: 1.5,
      avgGoalsConceded: 0.8,
      squadAvgAge: 27.2,
      squadAvgCaps: 38,
      keyPlayers: ['Son Heung-min', 'Kim Min-jae', 'Hwang Hee-chan'],
      playingStyle: 'pressing',
      homeContinent: 'Asia',
      injuryImpact: 0.10
    },
    CZE: {
      name: 'Czech Republic',
      code: 'CZE',
      flag: '🇨🇿',
      confederation: 'UEFA',
      fifaRanking: 38,
      eloRating: 1710,
      worldCupTitles: 0,
      worldCupApps: 2,
      bestFinish: 'Runner-up (as Czechoslovakia)',
      recentForm: [1, 0, 0.5, 1, 0.5, 0, 1, 1, 0.5, 1],
      avgGoalsScored: 1.3,
      avgGoalsConceded: 1.0,
      squadAvgAge: 27.5,
      squadAvgCaps: 28,
      keyPlayers: ['Patrik Schick', 'Tomáš Souček', 'Adam Hložek'],
      playingStyle: 'balanced',
      homeContinent: 'Europe',
      injuryImpact: 0.10
    },

    // ── GROUP B ──────────────────────────────────────────────────
    CAN: {
      name: 'Canada',
      code: 'CAN',
      flag: '🇨🇦',
      confederation: 'CONCACAF',
      fifaRanking: 35,
      eloRating: 1720,
      worldCupTitles: 0,
      worldCupApps: 3,
      bestFinish: 'Group Stage',
      recentForm: [1, 0.5, 0, 1, 1, 0.5, 1, 0, 1, 1],
      avgGoalsScored: 1.4,
      avgGoalsConceded: 1.0,
      squadAvgAge: 27.0,
      squadAvgCaps: 30,
      keyPlayers: ['Alphonso Davies', 'Jonathan David', 'Tajon Buchanan'],
      playingStyle: 'counter-attack',
      homeContinent: 'North America',
      injuryImpact: 0.10
    },
    BIH: {
      name: 'Bosnia & Herzegovina',
      code: 'BIH',
      flag: '🇧🇦',
      confederation: 'UEFA',
      fifaRanking: 55,
      eloRating: 1640,
      worldCupTitles: 0,
      worldCupApps: 2,
      bestFinish: 'Group Stage',
      recentForm: [0.5, 1, 0, 0.5, 1, 0, 1, 0.5, 0, 1],
      avgGoalsScored: 1.2,
      avgGoalsConceded: 1.1,
      squadAvgAge: 28.0,
      squadAvgCaps: 26,
      keyPlayers: ['Edin Džeko', 'Miralem Pjanić', 'Ermedin Demirović'],
      playingStyle: 'balanced',
      homeContinent: 'Europe',
      injuryImpact: 0.12
    },
    QAT: {
      name: 'Qatar',
      code: 'QAT',
      flag: '🇶🇦',
      confederation: 'AFC',
      fifaRanking: 42,
      eloRating: 1580,
      worldCupTitles: 0,
      worldCupApps: 2,
      bestFinish: 'Group Stage',
      recentForm: [0.5, 0, 1, 0.5, 0, 0.5, 1, 0, 0.5, 0],
      avgGoalsScored: 1.0,
      avgGoalsConceded: 1.3,
      squadAvgAge: 28.5,
      squadAvgCaps: 40,
      keyPlayers: ['Akram Afif', 'Almoez Ali', 'Hassan Al-Haydos'],
      playingStyle: 'possession',
      homeContinent: 'Asia',
      injuryImpact: 0.08
    },
    SUI: {
      name: 'Switzerland',
      code: 'SUI',
      flag: '🇨🇭',
      confederation: 'UEFA',
      fifaRanking: 19,
      eloRating: 1810,
      worldCupTitles: 0,
      worldCupApps: 12,
      bestFinish: 'Quarter-finals',
      recentForm: [1, 0.5, 1, 1, 0, 0.5, 1, 1, 0.5, 1],
      avgGoalsScored: 1.5,
      avgGoalsConceded: 0.8,
      squadAvgAge: 27.8,
      squadAvgCaps: 40,
      keyPlayers: ['Granit Xhaka', 'Manuel Akanji', 'Breel Embolo'],
      playingStyle: 'balanced',
      homeContinent: 'Europe',
      injuryImpact: 0.07
    },

    // ── GROUP C ──────────────────────────────────────────────────
    BRA: {
      name: 'Brazil',
      code: 'BRA',
      flag: '🇧🇷',
      confederation: 'CONMEBOL',
      fifaRanking: 5,
      eloRating: 2010,
      worldCupTitles: 5,
      worldCupApps: 22,
      bestFinish: 'Winner',
      recentForm: [1, 1, 0, 1, 0.5, 1, 1, 0.5, 1, 1],
      avgGoalsScored: 1.9,
      avgGoalsConceded: 0.7,
      squadAvgAge: 26.5,
      squadAvgCaps: 32,
      keyPlayers: ['Vinícius Jr.', 'Rodrygo', 'Bruno Guimarães'],
      playingStyle: 'possession',
      homeContinent: 'South America',
      injuryImpact: 0.08
    },
    MAR: {
      name: 'Morocco',
      code: 'MAR',
      flag: '🇲🇦',
      confederation: 'CAF',
      fifaRanking: 13,
      eloRating: 1880,
      worldCupTitles: 0,
      worldCupApps: 7,
      bestFinish: 'Semi-finals',
      recentForm: [1, 1, 0.5, 1, 1, 0.5, 1, 0, 1, 1],
      avgGoalsScored: 1.6,
      avgGoalsConceded: 0.5,
      squadAvgAge: 27.5,
      squadAvgCaps: 38,
      keyPlayers: ['Achraf Hakimi', 'Hakim Ziyech', 'Youssef En-Nesyri'],
      playingStyle: 'defensive',
      homeContinent: 'Africa',
      injuryImpact: 0.06
    },
    HAI: {
      name: 'Haiti',
      code: 'HAI',
      flag: '🇭🇹',
      confederation: 'CONCACAF',
      fifaRanking: 82,
      eloRating: 1350,
      worldCupTitles: 0,
      worldCupApps: 2,
      bestFinish: 'Group Stage',
      recentForm: [0, 0.5, 0, 0, 1, 0, 0.5, 0, 1, 0],
      avgGoalsScored: 0.7,
      avgGoalsConceded: 1.6,
      squadAvgAge: 26.8,
      squadAvgCaps: 18,
      keyPlayers: ['Duckens Nazon', 'Frantzdy Pierrot', 'Derrick Etienne Jr.'],
      playingStyle: 'counter-attack',
      homeContinent: 'North America',
      injuryImpact: 0.15
    },
    SCO: {
      name: 'Scotland',
      code: 'SCO',
      flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
      confederation: 'UEFA',
      fifaRanking: 34,
      eloRating: 1700,
      worldCupTitles: 0,
      worldCupApps: 9,
      bestFinish: 'Group Stage',
      recentForm: [0.5, 1, 0, 1, 0.5, 1, 0, 1, 0.5, 1],
      avgGoalsScored: 1.2,
      avgGoalsConceded: 1.0,
      squadAvgAge: 28.0,
      squadAvgCaps: 30,
      keyPlayers: ['Andy Robertson', 'Scott McTominay', 'John McGinn'],
      playingStyle: 'pressing',
      homeContinent: 'Europe',
      injuryImpact: 0.10
    },

    // ── GROUP D ──────────────────────────────────────────────────
    USA: {
      name: 'United States',
      code: 'USA',
      flag: '🇺🇸',
      confederation: 'CONCACAF',
      fifaRanking: 14,
      eloRating: 1850,
      worldCupTitles: 0,
      worldCupApps: 11,
      bestFinish: 'Third Place (1930)',
      recentForm: [1, 1, 0.5, 1, 1, 0.5, 1, 1, 1, 0.5],
      avgGoalsScored: 1.8,
      avgGoalsConceded: 0.7,
      squadAvgAge: 26.0,
      squadAvgCaps: 34,
      keyPlayers: ['Christian Pulisic', 'Gio Reyna', 'Weston McKennie'],
      playingStyle: 'pressing',
      homeContinent: 'North America',
      injuryImpact: 0.06
    },
    PAR: {
      name: 'Paraguay',
      code: 'PAR',
      flag: '🇵🇾',
      confederation: 'CONMEBOL',
      fifaRanking: 48,
      eloRating: 1660,
      worldCupTitles: 0,
      worldCupApps: 9,
      bestFinish: 'Quarter-finals',
      recentForm: [0, 0.5, 1, 0, 0.5, 0, 1, 0.5, 0, 0.5],
      avgGoalsScored: 1.0,
      avgGoalsConceded: 1.3,
      squadAvgAge: 27.8,
      squadAvgCaps: 28,
      keyPlayers: ['Miguel Almirón', 'Julio Enciso', 'Gustavo Gómez'],
      playingStyle: 'defensive',
      homeContinent: 'South America',
      injuryImpact: 0.12
    },
    AUS: {
      name: 'Australia',
      code: 'AUS',
      flag: '🇦🇺',
      confederation: 'AFC',
      fifaRanking: 24,
      eloRating: 1760,
      worldCupTitles: 0,
      worldCupApps: 6,
      bestFinish: 'Round of 16',
      recentForm: [1, 0.5, 1, 0.5, 0, 1, 1, 0.5, 1, 1],
      avgGoalsScored: 1.4,
      avgGoalsConceded: 0.9,
      squadAvgAge: 27.3,
      squadAvgCaps: 30,
      keyPlayers: ['Awer Mabil', 'Jackson Irvine', 'Mathew Leckie'],
      playingStyle: 'pressing',
      homeContinent: 'Asia',
      injuryImpact: 0.10
    },
    TUR: {
      name: 'Turkey',
      code: 'TUR',
      flag: '🇹🇷',
      confederation: 'UEFA',
      fifaRanking: 20,
      eloRating: 1790,
      worldCupTitles: 0,
      worldCupApps: 3,
      bestFinish: 'Third Place',
      recentForm: [1, 1, 0.5, 0, 1, 0.5, 1, 0, 1, 1],
      avgGoalsScored: 1.5,
      avgGoalsConceded: 0.9,
      squadAvgAge: 26.2,
      squadAvgCaps: 26,
      keyPlayers: ['Arda Güler', 'Hakan Çalhanoğlu', 'Kenan Yıldız'],
      playingStyle: 'balanced',
      homeContinent: 'Europe',
      injuryImpact: 0.08
    },

    // ── GROUP E ──────────────────────────────────────────────────
    GER: {
      name: 'Germany',
      code: 'GER',
      flag: '🇩🇪',
      confederation: 'UEFA',
      fifaRanking: 9,
      eloRating: 1970,
      worldCupTitles: 4,
      worldCupApps: 20,
      bestFinish: 'Winner',
      recentForm: [1, 1, 0.5, 1, 1, 0.5, 1, 1, 0, 1],
      avgGoalsScored: 2.2,
      avgGoalsConceded: 0.8,
      squadAvgAge: 26.5,
      squadAvgCaps: 32,
      keyPlayers: ['Florian Wirtz', 'Jamal Musiala', 'Joshua Kimmich'],
      playingStyle: 'pressing',
      homeContinent: 'Europe',
      injuryImpact: 0.07
    },
    CUW: {
      name: 'Curaçao',
      code: 'CUW',
      flag: '🇨🇼',
      confederation: 'CONCACAF',
      fifaRanking: 85,
      eloRating: 1280,
      worldCupTitles: 0,
      worldCupApps: 1,
      bestFinish: 'Group Stage',
      recentForm: [0, 0, 0.5, 0, 1, 0, 0, 0.5, 0, 0],
      avgGoalsScored: 0.6,
      avgGoalsConceded: 1.8,
      squadAvgAge: 28.2,
      squadAvgCaps: 22,
      keyPlayers: ['Juninho Bacuna', 'Kenji Gorré', 'Eloy Room'],
      playingStyle: 'defensive',
      homeContinent: 'North America',
      injuryImpact: 0.18
    },
    CIV: {
      name: "Côte d'Ivoire",
      code: 'CIV',
      flag: '🇨🇮',
      confederation: 'CAF',
      fifaRanking: 32,
      eloRating: 1690,
      worldCupTitles: 0,
      worldCupApps: 4,
      bestFinish: 'Group Stage',
      recentForm: [1, 1, 0.5, 1, 0.5, 1, 0, 1, 1, 0.5],
      avgGoalsScored: 1.4,
      avgGoalsConceded: 0.9,
      squadAvgAge: 26.8,
      squadAvgCaps: 28,
      keyPlayers: ['Sébastien Haller', 'Franck Kessié', 'Nicolas Pépé'],
      playingStyle: 'counter-attack',
      homeContinent: 'Africa',
      injuryImpact: 0.10
    },
    ECU: {
      name: 'Ecuador',
      code: 'ECU',
      flag: '🇪🇨',
      confederation: 'CONMEBOL',
      fifaRanking: 27,
      eloRating: 1830,
      worldCupTitles: 0,
      worldCupApps: 4,
      bestFinish: 'Round of 16',
      recentForm: [1, 0.5, 1, 0, 1, 1, 0.5, 0, 1, 1],
      avgGoalsScored: 1.5,
      avgGoalsConceded: 0.9,
      squadAvgAge: 26.0,
      squadAvgCaps: 25,
      keyPlayers: ['Moisés Caicedo', 'Piero Hincapié', 'Gonzalo Plata'],
      playingStyle: 'pressing',
      homeContinent: 'South America',
      injuryImpact: 0.08
    },

    // ── GROUP F ──────────────────────────────────────────────────
    NED: {
      name: 'Netherlands',
      code: 'NED',
      flag: '🇳🇱',
      confederation: 'UEFA',
      fifaRanking: 7,
      eloRating: 1990,
      worldCupTitles: 0,
      worldCupApps: 11,
      bestFinish: 'Runner-up',
      recentForm: [1, 0.5, 1, 1, 0.5, 1, 1, 0, 1, 1],
      avgGoalsScored: 1.9,
      avgGoalsConceded: 0.7,
      squadAvgAge: 27.0,
      squadAvgCaps: 35,
      keyPlayers: ['Virgil van Dijk', 'Cody Gakpo', 'Xavi Simons'],
      playingStyle: 'possession',
      homeContinent: 'Europe',
      injuryImpact: 0.08
    },
    JPN: {
      name: 'Japan',
      code: 'JPN',
      flag: '🇯🇵',
      confederation: 'AFC',
      fifaRanking: 16,
      eloRating: 1860,
      worldCupTitles: 0,
      worldCupApps: 7,
      bestFinish: 'Round of 16',
      recentForm: [1, 1, 0.5, 1, 1, 0.5, 1, 1, 0, 1],
      avgGoalsScored: 1.7,
      avgGoalsConceded: 0.7,
      squadAvgAge: 26.5,
      squadAvgCaps: 30,
      keyPlayers: ['Takefusa Kubo', 'Kaoru Mitoma', 'Wataru Endo'],
      playingStyle: 'pressing',
      homeContinent: 'Asia',
      injuryImpact: 0.06
    },
    SWE: {
      name: 'Sweden',
      code: 'SWE',
      flag: '🇸🇪',
      confederation: 'UEFA',
      fifaRanking: 28,
      eloRating: 1720,
      worldCupTitles: 0,
      worldCupApps: 12,
      bestFinish: 'Runner-up',
      recentForm: [1, 0.5, 1, 0, 1, 1, 0.5, 1, 0, 1],
      avgGoalsScored: 1.4,
      avgGoalsConceded: 0.9,
      squadAvgAge: 27.5,
      squadAvgCaps: 30,
      keyPlayers: ['Alexander Isak', 'Dejan Kulusevski', 'Viktor Gyökeres'],
      playingStyle: 'counter-attack',
      homeContinent: 'Europe',
      injuryImpact: 0.09
    },
    TUN: {
      name: 'Tunisia',
      code: 'TUN',
      flag: '🇹🇳',
      confederation: 'CAF',
      fifaRanking: 37,
      eloRating: 1680,
      worldCupTitles: 0,
      worldCupApps: 6,
      bestFinish: 'Group Stage',
      recentForm: [0.5, 0, 1, 0.5, 1, 0, 0.5, 1, 0, 0.5],
      avgGoalsScored: 1.0,
      avgGoalsConceded: 1.1,
      squadAvgAge: 28.0,
      squadAvgCaps: 34,
      keyPlayers: ['Aïssa Laïdouni', 'Hannibal Mejbri', 'Youssef Msakni'],
      playingStyle: 'defensive',
      homeContinent: 'Africa',
      injuryImpact: 0.10
    },

    // ── GROUP G ──────────────────────────────────────────────────
    BEL: {
      name: 'Belgium',
      code: 'BEL',
      flag: '🇧🇪',
      confederation: 'UEFA',
      fifaRanking: 8,
      eloRating: 1960,
      worldCupTitles: 0,
      worldCupApps: 14,
      bestFinish: 'Third Place',
      recentForm: [1, 0.5, 1, 0, 1, 1, 0.5, 1, 0.5, 1],
      avgGoalsScored: 1.7,
      avgGoalsConceded: 0.8,
      squadAvgAge: 27.0,
      squadAvgCaps: 35,
      keyPlayers: ['Kevin De Bruyne', 'Jérémy Doku', 'Romelu Lukaku'],
      playingStyle: 'possession',
      homeContinent: 'Europe',
      injuryImpact: 0.10
    },
    EGY: {
      name: 'Egypt',
      code: 'EGY',
      flag: '🇪🇬',
      confederation: 'CAF',
      fifaRanking: 30,
      eloRating: 1740,
      worldCupTitles: 0,
      worldCupApps: 4,
      bestFinish: 'Group Stage',
      recentForm: [1, 0.5, 1, 1, 0, 0.5, 1, 1, 0.5, 0],
      avgGoalsScored: 1.3,
      avgGoalsConceded: 0.8,
      squadAvgAge: 27.5,
      squadAvgCaps: 35,
      keyPlayers: ['Mohamed Salah', 'Omar Marmoush', 'Mohamed Elneny'],
      playingStyle: 'counter-attack',
      homeContinent: 'Africa',
      injuryImpact: 0.10
    },
    IRN: {
      name: 'Iran',
      code: 'IRN',
      flag: '🇮🇷',
      confederation: 'AFC',
      fifaRanking: 23,
      eloRating: 1770,
      worldCupTitles: 0,
      worldCupApps: 6,
      bestFinish: 'Group Stage',
      recentForm: [1, 0.5, 1, 0, 0.5, 1, 1, 0, 1, 0.5],
      avgGoalsScored: 1.3,
      avgGoalsConceded: 0.9,
      squadAvgAge: 28.0,
      squadAvgCaps: 38,
      keyPlayers: ['Mehdi Taremi', 'Sardar Azmoun', 'Alireza Jahanbakhsh'],
      playingStyle: 'defensive',
      homeContinent: 'Asia',
      injuryImpact: 0.08
    },
    NZL: {
      name: 'New Zealand',
      code: 'NZL',
      flag: '🇳🇿',
      confederation: 'OFC',
      fifaRanking: 93,
      eloRating: 1460,
      worldCupTitles: 0,
      worldCupApps: 3,
      bestFinish: 'Group Stage',
      recentForm: [0, 1, 0, 0.5, 1, 0, 0.5, 0, 1, 0.5],
      avgGoalsScored: 0.9,
      avgGoalsConceded: 1.4,
      squadAvgAge: 27.8,
      squadAvgCaps: 22,
      keyPlayers: ['Chris Wood', 'Sarpreet Singh', 'Liberato Cacace'],
      playingStyle: 'defensive',
      homeContinent: 'Oceania',
      injuryImpact: 0.15
    },

    // ── GROUP H ──────────────────────────────────────────────────
    ESP: {
      name: 'Spain',
      code: 'ESP',
      flag: '🇪🇸',
      confederation: 'UEFA',
      fifaRanking: 3,
      eloRating: 2045,
      worldCupTitles: 1,
      worldCupApps: 16,
      bestFinish: 'Winner',
      recentForm: [1, 1, 1, 0.5, 1, 1, 0.5, 1, 1, 1],
      avgGoalsScored: 2.1,
      avgGoalsConceded: 0.5,
      squadAvgAge: 25.5,
      squadAvgCaps: 30,
      keyPlayers: ['Lamine Yamal', 'Pedri', 'Rodri'],
      playingStyle: 'possession',
      homeContinent: 'Europe',
      injuryImpact: 0.06
    },
    CPV: {
      name: 'Cape Verde',
      code: 'CPV',
      flag: '🇨🇻',
      confederation: 'CAF',
      fifaRanking: 68,
      eloRating: 1400,
      worldCupTitles: 0,
      worldCupApps: 1,
      bestFinish: 'Group Stage',
      recentForm: [0, 1, 0, 0.5, 0, 1, 0.5, 0, 0.5, 1],
      avgGoalsScored: 0.8,
      avgGoalsConceded: 1.3,
      squadAvgAge: 28.0,
      squadAvgCaps: 20,
      keyPlayers: ['Garry Rodrigues', 'Ryan Mendes', 'Stopira'],
      playingStyle: 'defensive',
      homeContinent: 'Africa',
      injuryImpact: 0.15
    },
    KSA: {
      name: 'Saudi Arabia',
      code: 'KSA',
      flag: '🇸🇦',
      confederation: 'AFC',
      fifaRanking: 52,
      eloRating: 1650,
      worldCupTitles: 0,
      worldCupApps: 7,
      bestFinish: 'Round of 16',
      recentForm: [0.5, 1, 0, 0.5, 1, 0, 0.5, 1, 0.5, 1],
      avgGoalsScored: 1.1,
      avgGoalsConceded: 1.0,
      squadAvgAge: 27.5,
      squadAvgCaps: 42,
      keyPlayers: ['Salem Al-Dawsari', 'Firas Al-Buraikan', 'Mohammed Al-Owais'],
      playingStyle: 'counter-attack',
      homeContinent: 'Asia',
      injuryImpact: 0.10
    },
    URU: {
      name: 'Uruguay',
      code: 'URU',
      flag: '🇺🇾',
      confederation: 'CONMEBOL',
      fifaRanking: 10,
      eloRating: 1920,
      worldCupTitles: 2,
      worldCupApps: 14,
      bestFinish: 'Winner',
      recentForm: [1, 1, 0.5, 1, 0, 1, 0.5, 1, 1, 0.5],
      avgGoalsScored: 1.7,
      avgGoalsConceded: 0.7,
      squadAvgAge: 27.0,
      squadAvgCaps: 35,
      keyPlayers: ['Federico Valverde', 'Darwin Núñez', 'Ronald Araújo'],
      playingStyle: 'balanced',
      homeContinent: 'South America',
      injuryImpact: 0.07
    },

    // ── GROUP I ──────────────────────────────────────────────────
    FRA: {
      name: 'France',
      code: 'FRA',
      flag: '🇫🇷',
      confederation: 'UEFA',
      fifaRanking: 2,
      eloRating: 2050,
      worldCupTitles: 2,
      worldCupApps: 16,
      bestFinish: 'Winner',
      recentForm: [1, 1, 0.5, 1, 1, 1, 0.5, 1, 0.5, 1],
      avgGoalsScored: 2.0,
      avgGoalsConceded: 0.6,
      squadAvgAge: 27.0,
      squadAvgCaps: 38,
      keyPlayers: ['Kylian Mbappé', 'Aurélien Tchouaméni', 'Eduardo Camavinga'],
      playingStyle: 'counter-attack',
      homeContinent: 'Europe',
      injuryImpact: 0.06
    },
    SEN: {
      name: 'Senegal',
      code: 'SEN',
      flag: '🇸🇳',
      confederation: 'CAF',
      fifaRanking: 18,
      eloRating: 1800,
      worldCupTitles: 0,
      worldCupApps: 3,
      bestFinish: 'Quarter-finals',
      recentForm: [1, 0.5, 1, 0, 1, 1, 0.5, 1, 0.5, 1],
      avgGoalsScored: 1.4,
      avgGoalsConceded: 0.8,
      squadAvgAge: 27.0,
      squadAvgCaps: 30,
      keyPlayers: ['Sadio Mané', 'Ismaïla Sarr', 'Kalidou Koulibaly'],
      playingStyle: 'counter-attack',
      homeContinent: 'Africa',
      injuryImpact: 0.08
    },
    IRQ: {
      name: 'Iraq',
      code: 'IRQ',
      flag: '🇮🇶',
      confederation: 'AFC',
      fifaRanking: 55,
      eloRating: 1630,
      worldCupTitles: 0,
      worldCupApps: 2,
      bestFinish: 'Group Stage',
      recentForm: [0.5, 1, 0, 1, 0.5, 0, 1, 0.5, 0, 0.5],
      avgGoalsScored: 1.0,
      avgGoalsConceded: 1.1,
      squadAvgAge: 27.5,
      squadAvgCaps: 30,
      keyPlayers: ['Mohanad Ali', 'Aymen Hussein', 'Ibrahim Bayesh'],
      playingStyle: 'defensive',
      homeContinent: 'Asia',
      injuryImpact: 0.12
    },
    NOR: {
      name: 'Norway',
      code: 'NOR',
      flag: '🇳🇴',
      confederation: 'UEFA',
      fifaRanking: 26,
      eloRating: 1750,
      worldCupTitles: 0,
      worldCupApps: 4,
      bestFinish: 'Group Stage',
      recentForm: [1, 0.5, 1, 1, 0, 1, 0.5, 1, 0.5, 1],
      avgGoalsScored: 1.6,
      avgGoalsConceded: 0.8,
      squadAvgAge: 27.2,
      squadAvgCaps: 28,
      keyPlayers: ['Erling Haaland', 'Martin Ødegaard', 'Sander Berge'],
      playingStyle: 'balanced',
      homeContinent: 'Europe',
      injuryImpact: 0.10
    },

    // ── GROUP J ──────────────────────────────────────────────────
    ARG: {
      name: 'Argentina',
      code: 'ARG',
      flag: '🇦🇷',
      confederation: 'CONMEBOL',
      fifaRanking: 1,
      eloRating: 2142,
      worldCupTitles: 3,
      worldCupApps: 18,
      bestFinish: 'Winner',
      recentForm: [1, 1, 1, 0.5, 1, 1, 1, 0.5, 1, 1],
      avgGoalsScored: 2.1,
      avgGoalsConceded: 0.6,
      squadAvgAge: 27.5,
      squadAvgCaps: 42,
      keyPlayers: ['Lionel Messi', 'Lautaro Martínez', 'Julián Álvarez'],
      playingStyle: 'possession',
      homeContinent: 'South America',
      injuryImpact: 0.05
    },
    ALG: {
      name: 'Algeria',
      code: 'ALG',
      flag: '🇩🇿',
      confederation: 'CAF',
      fifaRanking: 33,
      eloRating: 1670,
      worldCupTitles: 0,
      worldCupApps: 5,
      bestFinish: 'Round of 16',
      recentForm: [0.5, 1, 0.5, 0, 1, 0.5, 1, 0, 0.5, 1],
      avgGoalsScored: 1.2,
      avgGoalsConceded: 1.0,
      squadAvgAge: 27.8,
      squadAvgCaps: 30,
      keyPlayers: ['Riyad Mahrez', 'Ismaël Bennacer', 'Islam Slimani'],
      playingStyle: 'counter-attack',
      homeContinent: 'Africa',
      injuryImpact: 0.10
    },
    AUT: {
      name: 'Austria',
      code: 'AUT',
      flag: '🇦🇹',
      confederation: 'UEFA',
      fifaRanking: 25,
      eloRating: 1730,
      worldCupTitles: 0,
      worldCupApps: 8,
      bestFinish: 'Third Place',
      recentForm: [1, 0.5, 1, 0.5, 1, 0, 1, 1, 0.5, 1],
      avgGoalsScored: 1.5,
      avgGoalsConceded: 0.9,
      squadAvgAge: 27.2,
      squadAvgCaps: 28,
      keyPlayers: ['David Alaba', 'Marcel Sabitzer', 'Christoph Baumgartner'],
      playingStyle: 'pressing',
      homeContinent: 'Europe',
      injuryImpact: 0.12
    },
    JOR: {
      name: 'Jordan',
      code: 'JOR',
      flag: '🇯🇴',
      confederation: 'AFC',
      fifaRanking: 68,
      eloRating: 1520,
      worldCupTitles: 0,
      worldCupApps: 1,
      bestFinish: 'Group Stage',
      recentForm: [0.5, 1, 0, 0.5, 1, 0, 1, 0.5, 0, 0.5],
      avgGoalsScored: 0.9,
      avgGoalsConceded: 1.1,
      squadAvgAge: 27.5,
      squadAvgCaps: 32,
      keyPlayers: ['Mousa Al-Tamari', 'Yazan Al-Naimat', 'Musa Al-Taamari'],
      playingStyle: 'defensive',
      homeContinent: 'Asia',
      injuryImpact: 0.12
    },

    // ── GROUP K ──────────────────────────────────────────────────
    POR: {
      name: 'Portugal',
      code: 'POR',
      flag: '🇵🇹',
      confederation: 'UEFA',
      fifaRanking: 6,
      eloRating: 2000,
      worldCupTitles: 0,
      worldCupApps: 8,
      bestFinish: 'Third Place',
      recentForm: [1, 1, 0.5, 1, 1, 0.5, 1, 1, 0.5, 1],
      avgGoalsScored: 2.0,
      avgGoalsConceded: 0.7,
      squadAvgAge: 27.8,
      squadAvgCaps: 38,
      keyPlayers: ['Cristiano Ronaldo', 'Bruno Fernandes', 'Rafael Leão'],
      playingStyle: 'possession',
      homeContinent: 'Europe',
      injuryImpact: 0.07
    },
    COD: {
      name: 'DR Congo',
      code: 'COD',
      flag: '🇨🇩',
      confederation: 'CAF',
      fifaRanking: 50,
      eloRating: 1620,
      worldCupTitles: 0,
      worldCupApps: 2,
      bestFinish: 'Group Stage',
      recentForm: [0.5, 1, 0, 1, 0.5, 0, 1, 0, 0.5, 1],
      avgGoalsScored: 1.0,
      avgGoalsConceded: 1.1,
      squadAvgAge: 27.0,
      squadAvgCaps: 22,
      keyPlayers: ['Chancel Mbemba', 'Cédric Bakambu', 'Yoane Wissa'],
      playingStyle: 'counter-attack',
      homeContinent: 'Africa',
      injuryImpact: 0.14
    },
    UZB: {
      name: 'Uzbekistan',
      code: 'UZB',
      flag: '🇺🇿',
      confederation: 'AFC',
      fifaRanking: 60,
      eloRating: 1550,
      worldCupTitles: 0,
      worldCupApps: 1,
      bestFinish: 'Group Stage',
      recentForm: [0.5, 0, 1, 0.5, 0, 1, 0.5, 0, 1, 0.5],
      avgGoalsScored: 1.0,
      avgGoalsConceded: 1.2,
      squadAvgAge: 27.3,
      squadAvgCaps: 28,
      keyPlayers: ['Eldor Shomurodov', 'Jaloliddin Masharipov', 'Abbos Fayzullaev'],
      playingStyle: 'balanced',
      homeContinent: 'Asia',
      injuryImpact: 0.12
    },
    COL: {
      name: 'Colombia',
      code: 'COL',
      flag: '🇨🇴',
      confederation: 'CONMEBOL',
      fifaRanking: 11,
      eloRating: 1910,
      worldCupTitles: 0,
      worldCupApps: 6,
      bestFinish: 'Quarter-finals',
      recentForm: [1, 1, 0.5, 1, 0, 1, 1, 0.5, 1, 1],
      avgGoalsScored: 1.7,
      avgGoalsConceded: 0.7,
      squadAvgAge: 27.0,
      squadAvgCaps: 34,
      keyPlayers: ['Luis Díaz', 'James Rodríguez', 'Jhon Arias'],
      playingStyle: 'possession',
      homeContinent: 'South America',
      injuryImpact: 0.07
    },

    // ── GROUP L ──────────────────────────────────────────────────
    ENG: {
      name: 'England',
      code: 'ENG',
      flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
      confederation: 'UEFA',
      fifaRanking: 4,
      eloRating: 2020,
      worldCupTitles: 1,
      worldCupApps: 16,
      bestFinish: 'Winner',
      recentForm: [1, 1, 0.5, 1, 1, 0.5, 1, 1, 0.5, 1],
      avgGoalsScored: 1.9,
      avgGoalsConceded: 0.6,
      squadAvgAge: 26.5,
      squadAvgCaps: 34,
      keyPlayers: ['Jude Bellingham', 'Bukayo Saka', 'Phil Foden'],
      playingStyle: 'balanced',
      homeContinent: 'Europe',
      injuryImpact: 0.06
    },
    CRO: {
      name: 'Croatia',
      code: 'CRO',
      flag: '🇭🇷',
      confederation: 'UEFA',
      fifaRanking: 12,
      eloRating: 1900,
      worldCupTitles: 0,
      worldCupApps: 7,
      bestFinish: 'Runner-up',
      recentForm: [1, 0.5, 1, 0.5, 1, 0, 1, 0.5, 1, 1],
      avgGoalsScored: 1.5,
      avgGoalsConceded: 0.8,
      squadAvgAge: 28.5,
      squadAvgCaps: 42,
      keyPlayers: ['Luka Modrić', 'Mateo Kovačić', 'Joško Gvardiol'],
      playingStyle: 'possession',
      homeContinent: 'Europe',
      injuryImpact: 0.10
    },
    GHA: {
      name: 'Ghana',
      code: 'GHA',
      flag: '🇬🇭',
      confederation: 'CAF',
      fifaRanking: 40,
      eloRating: 1600,
      worldCupTitles: 0,
      worldCupApps: 4,
      bestFinish: 'Quarter-finals',
      recentForm: [0.5, 0, 1, 0.5, 0, 1, 0.5, 0, 1, 0],
      avgGoalsScored: 1.0,
      avgGoalsConceded: 1.2,
      squadAvgAge: 26.5,
      squadAvgCaps: 22,
      keyPlayers: ['Mohammed Kudus', 'Thomas Partey', 'Iñaki Williams'],
      playingStyle: 'counter-attack',
      homeContinent: 'Africa',
      injuryImpact: 0.12
    },
    PAN: {
      name: 'Panama',
      code: 'PAN',
      flag: '🇵🇦',
      confederation: 'CONCACAF',
      fifaRanking: 49,
      eloRating: 1540,
      worldCupTitles: 0,
      worldCupApps: 2,
      bestFinish: 'Group Stage',
      recentForm: [0.5, 0, 1, 0, 0.5, 1, 0, 0.5, 0, 1],
      avgGoalsScored: 0.9,
      avgGoalsConceded: 1.3,
      squadAvgAge: 28.0,
      squadAvgCaps: 32,
      keyPlayers: ['José Fajardo', 'Adalberto Carrasquilla', 'Éric Davis'],
      playingStyle: 'defensive',
      homeContinent: 'North America',
      injuryImpact: 0.12
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  GROUPS (12 groups, A through L)
  // ═══════════════════════════════════════════════════════════════
  groups: {
    A: { name: 'Group A', teams: ['MEX', 'RSA', 'KOR', 'CZE'] },
    B: { name: 'Group B', teams: ['CAN', 'BIH', 'QAT', 'SUI'] },
    C: { name: 'Group C', teams: ['BRA', 'MAR', 'HAI', 'SCO'] },
    D: { name: 'Group D', teams: ['USA', 'PAR', 'AUS', 'TUR'] },
    E: { name: 'Group E', teams: ['GER', 'CUW', 'CIV', 'ECU'] },
    F: { name: 'Group F', teams: ['NED', 'JPN', 'SWE', 'TUN'] },
    G: { name: 'Group G', teams: ['BEL', 'EGY', 'IRN', 'NZL'] },
    H: { name: 'Group H', teams: ['ESP', 'CPV', 'KSA', 'URU'] },
    I: { name: 'Group I', teams: ['FRA', 'SEN', 'IRQ', 'NOR'] },
    J: { name: 'Group J', teams: ['ARG', 'ALG', 'AUT', 'JOR'] },
    K: { name: 'Group K', teams: ['POR', 'COD', 'UZB', 'COL'] },
    L: { name: 'Group L', teams: ['ENG', 'CRO', 'GHA', 'PAN'] }
  },

  // ═══════════════════════════════════════════════════════════════
  //  REFEREES (20 international match officials)
  // ═══════════════════════════════════════════════════════════════
  referees: [
    { name: 'François Letexier',       country: 'France',        confederation: 'UEFA',     style: 'strict',   avgYellowCards: 4.5, avgRedCards: 0.18, avgFouls: 26, penaltyTendency: 0.32, avgExtraTime: 5.8 },
    { name: 'Szymon Marciniak',        country: 'Poland',        confederation: 'UEFA',     style: 'balanced', avgYellowCards: 3.8, avgRedCards: 0.12, avgFouls: 23, penaltyTendency: 0.28, avgExtraTime: 5.2 },
    { name: 'Slavko Vinčić',           country: 'Slovenia',      confederation: 'UEFA',     style: 'balanced', avgYellowCards: 4.0, avgRedCards: 0.14, avgFouls: 24, penaltyTendency: 0.30, avgExtraTime: 5.5 },
    { name: 'Clément Turpin',          country: 'France',        confederation: 'UEFA',     style: 'strict',   avgYellowCards: 4.6, avgRedCards: 0.20, avgFouls: 27, penaltyTendency: 0.35, avgExtraTime: 6.0 },
    { name: 'Anthony Taylor',          country: 'England',       confederation: 'UEFA',     style: 'lenient',  avgYellowCards: 3.5, avgRedCards: 0.10, avgFouls: 22, penaltyTendency: 0.25, avgExtraTime: 5.0 },
    { name: 'Michael Oliver',          country: 'England',       confederation: 'UEFA',     style: 'balanced', avgYellowCards: 3.9, avgRedCards: 0.15, avgFouls: 24, penaltyTendency: 0.30, avgExtraTime: 5.3 },
    { name: 'Danny Makkelie',          country: 'Netherlands',   confederation: 'UEFA',     style: 'strict',   avgYellowCards: 4.3, avgRedCards: 0.16, avgFouls: 25, penaltyTendency: 0.33, avgExtraTime: 5.6 },
    { name: 'Jesús Gil Manzano',       country: 'Spain',         confederation: 'UEFA',     style: 'strict',   avgYellowCards: 4.7, avgRedCards: 0.22, avgFouls: 28, penaltyTendency: 0.34, avgExtraTime: 6.2 },
    { name: 'Istvan Kovacs',           country: 'Romania',       confederation: 'UEFA',     style: 'balanced', avgYellowCards: 4.1, avgRedCards: 0.14, avgFouls: 24, penaltyTendency: 0.29, avgExtraTime: 5.4 },
    { name: 'Wilton Sampaio',          country: 'Brazil',        confederation: 'CONMEBOL', style: 'lenient',  avgYellowCards: 3.6, avgRedCards: 0.12, avgFouls: 23, penaltyTendency: 0.26, avgExtraTime: 5.1 },
    { name: 'Andrés Matonte',          country: 'Uruguay',       confederation: 'CONMEBOL', style: 'balanced', avgYellowCards: 4.0, avgRedCards: 0.15, avgFouls: 25, penaltyTendency: 0.30, avgExtraTime: 5.5 },
    { name: 'Facundo Tello',           country: 'Argentina',     confederation: 'CONMEBOL', style: 'strict',   avgYellowCards: 4.4, avgRedCards: 0.18, avgFouls: 26, penaltyTendency: 0.31, avgExtraTime: 5.7 },
    { name: 'Ismail Elfath',           country: 'United States', confederation: 'CONCACAF', style: 'balanced', avgYellowCards: 3.7, avgRedCards: 0.13, avgFouls: 23, penaltyTendency: 0.27, avgExtraTime: 5.2 },
    { name: 'Said Martinez',           country: 'Honduras',      confederation: 'CONCACAF', style: 'lenient',  avgYellowCards: 3.4, avgRedCards: 0.10, avgFouls: 22, penaltyTendency: 0.24, avgExtraTime: 4.8 },
    { name: 'Abdulrahman Al-Jassim',   country: 'Qatar',         confederation: 'AFC',      style: 'balanced', avgYellowCards: 3.9, avgRedCards: 0.14, avgFouls: 24, penaltyTendency: 0.29, avgExtraTime: 5.3 },
    { name: 'Mohammed Abdulla Hassan', country: 'UAE',           confederation: 'AFC',      style: 'balanced', avgYellowCards: 3.8, avgRedCards: 0.13, avgFouls: 23, penaltyTendency: 0.28, avgExtraTime: 5.1 },
    { name: 'Ma Ning',                 country: 'China',         confederation: 'AFC',      style: 'strict',   avgYellowCards: 4.2, avgRedCards: 0.16, avgFouls: 25, penaltyTendency: 0.30, avgExtraTime: 5.5 },
    { name: 'Victor Gomes',            country: 'South Africa',  confederation: 'CAF',      style: 'balanced', avgYellowCards: 4.0, avgRedCards: 0.15, avgFouls: 24, penaltyTendency: 0.30, avgExtraTime: 5.4 },
    { name: 'Mustapha Ghorbal',        country: 'Algeria',       confederation: 'CAF',      style: 'lenient',  avgYellowCards: 3.5, avgRedCards: 0.11, avgFouls: 22, penaltyTendency: 0.25, avgExtraTime: 5.0 },
    { name: 'Matthew Conger',          country: 'New Zealand',   confederation: 'OFC',      style: 'balanced', avgYellowCards: 3.8, avgRedCards: 0.12, avgFouls: 23, penaltyTendency: 0.27, avgExtraTime: 5.2 }
  ],

  // ═══════════════════════════════════════════════════════════════
  //  FIXTURES — 104 matches total
  //  (72 group stage + 32 knockout stage)
  // ═══════════════════════════════════════════════════════════════
  fixtures: [
    // ╔═══════════════════════════════════════════════════════════╗
    // ║  MATCHDAY 1 — Group Stage                                ║
    // ╚═══════════════════════════════════════════════════════════╝

    // ── June 11 ──────────────────────────────────────────────────
    // Group A
    { id: 1,  matchday: 1, group: 'A', round: 'Group Stage', date: '2026-06-11T21:00:00-05:00', homeTeam: 'MEX', awayTeam: 'RSA', stadium: 'Estadio Azteca',    city: 'Mexico City',      status: 'finished',  homeScore: 2, awayScore: 0, referee: 'François Letexier' },
    { id: 2,  matchday: 1, group: 'A', round: 'Group Stage', date: '2026-06-11T18:00:00-04:00', homeTeam: 'KOR', awayTeam: 'CZE', stadium: 'Hard Rock Stadium',  city: 'Miami',            status: 'finished',  homeScore: 2, awayScore: 1, referee: 'Szymon Marciniak' },

    // ── June 12 ──────────────────────────────────────────────────
    // Group B
    { id: 3,  matchday: 1, group: 'B', round: 'Group Stage', date: '2026-06-12T18:00:00-04:00', homeTeam: 'CAN', awayTeam: 'BIH', stadium: 'BMO Field',          city: 'Toronto',          status: 'finished',  homeScore: 1, awayScore: 1, referee: 'Anthony Taylor' },

    // ── June 13 ──────────────────────────────────────────────────
    // Group D
    { id: 4,  matchday: 1, group: 'D', round: 'Group Stage', date: '2026-06-13T20:00:00-04:00', homeTeam: 'USA', awayTeam: 'PAR', stadium: 'MetLife Stadium',    city: 'New York/New Jersey', status: 'finished', homeScore: 4, awayScore: 1, referee: 'Slavko Vinčić' },
    // Group B
    { id: 5,  matchday: 1, group: 'B', round: 'Group Stage', date: '2026-06-13T15:00:00-04:00', homeTeam: 'QAT', awayTeam: 'SUI', stadium: 'Gillette Stadium',   city: 'Boston',           status: 'finished',  homeScore: 1, awayScore: 1, referee: 'Ismail Elfath' },

    // ── June 14 ──────────────────────────────────────────────────
    // Group E
    { id: 6,  matchday: 1, group: 'E', round: 'Group Stage', date: '2026-06-14T13:00:00-04:00', homeTeam: 'GER', awayTeam: 'CUW', stadium: 'Mercedes-Benz Stadium', city: 'Atlanta',       status: 'finished',  homeScore: 7, awayScore: 1, referee: 'Facundo Tello' },
    // Group F
    { id: 7,  matchday: 1, group: 'F', round: 'Group Stage', date: '2026-06-14T16:00:00-04:00', homeTeam: 'NED', awayTeam: 'JPN', stadium: 'AT&T Stadium',        city: 'Dallas',           status: 'finished',  homeScore: 2, awayScore: 2, referee: 'Michael Oliver' },
    // Group E
    { id: 8,  matchday: 1, group: 'E', round: 'Group Stage', date: '2026-06-14T19:00:00-04:00', homeTeam: 'CIV', awayTeam: 'ECU', stadium: 'NRG Stadium',         city: 'Houston',          status: 'finished',  homeScore: 1, awayScore: 0, referee: 'Andrés Matonte' },
    // Group F
    { id: 9,  matchday: 1, group: 'F', round: 'Group Stage', date: '2026-06-14T10:00:00-07:00', homeTeam: 'SWE', awayTeam: 'TUN', stadium: 'Lumen Field',         city: 'Seattle',          status: 'finished',  homeScore: 5, awayScore: 1, referee: 'Danny Makkelie' },
    // Group C
    { id: 10, matchday: 1, group: 'C', round: 'Group Stage', date: '2026-06-14T21:00:00-05:00', homeTeam: 'BRA', awayTeam: 'MAR', stadium: 'Estadio BBVA',        city: 'Monterrey',        status: 'finished',  homeScore: 1, awayScore: 1, referee: 'Clément Turpin' },
    { id: 11, matchday: 1, group: 'C', round: 'Group Stage', date: '2026-06-14T13:00:00-07:00', homeTeam: 'HAI', awayTeam: 'SCO', stadium: "Levi's Stadium",      city: 'San Francisco',    status: 'finished',  homeScore: 0, awayScore: 1, referee: 'Said Martinez' },
    // Group D
    { id: 12, matchday: 1, group: 'D', round: 'Group Stage', date: '2026-06-14T18:00:00-05:00', homeTeam: 'AUS', awayTeam: 'TUR', stadium: 'Estadio Akron',       city: 'Guadalajara',      status: 'finished',  homeScore: 2, awayScore: 0, referee: 'Wilton Sampaio' },

    // ── June 15 ──────────────────────────────────────────────────
    // Group H
    { id: 13, matchday: 1, group: 'H', round: 'Group Stage', date: '2026-06-15T13:00:00-04:00', homeTeam: 'ESP', awayTeam: 'CPV', stadium: 'Hard Rock Stadium',   city: 'Miami',            status: 'finished',  homeScore: 0, awayScore: 0, referee: 'Jesús Gil Manzano' },
    // Group G
    { id: 14, matchday: 1, group: 'G', round: 'Group Stage', date: '2026-06-15T16:00:00-04:00', homeTeam: 'BEL', awayTeam: 'EGY', stadium: 'Lincoln Financial Field', city: 'Philadelphia', status: 'finished',  homeScore: 1, awayScore: 1, referee: 'Istvan Kovacs' },
    // Group H
    { id: 15, matchday: 1, group: 'H', round: 'Group Stage', date: '2026-06-15T19:00:00-04:00', homeTeam: 'KSA', awayTeam: 'URU', stadium: 'NRG Stadium',         city: 'Houston',          status: 'finished',  homeScore: 1, awayScore: 1, referee: 'Abdulrahman Al-Jassim' },
    // Group G
    { id: 16, matchday: 1, group: 'G', round: 'Group Stage', date: '2026-06-15T21:00:00-04:00', homeTeam: 'IRN', awayTeam: 'NZL', stadium: 'MetLife Stadium',     city: 'New York/New Jersey', status: 'finished', homeScore: 2, awayScore: 2, referee: 'Mohammed Abdulla Hassan' },

    // ── June 16 ──────────────────────────────────────────────────
    // Group J
    { id: 17, matchday: 1, group: 'J', round: 'Group Stage', date: '2026-06-16T13:00:00-04:00', homeTeam: 'ARG', awayTeam: 'ALG', stadium: 'Hard Rock Stadium',   city: 'Miami',            status: 'finished',  homeScore: 3, awayScore: 0, referee: 'François Letexier' },
    // Group I — 16/06 (đá xong 03:00-08:00 ICT 17/06)
    { id: 18, matchday: 1, group: 'I', round: 'Group Stage', date: '2026-06-16T16:00:00-04:00', homeTeam: 'FRA', awayTeam: 'SEN', stadium: 'AT&T Stadium',        city: 'Dallas',           status: 'finished', homeScore: 3, awayScore: 0, referee: 'Szymon Marciniak' },
    { id: 19, matchday: 1, group: 'I', round: 'Group Stage', date: '2026-06-16T19:00:00-04:00', homeTeam: 'IRQ', awayTeam: 'NOR', stadium: 'Mercedes-Benz Stadium', city: 'Atlanta',        status: 'finished', homeScore: 0, awayScore: 0, referee: 'Ma Ning' },
    // Group J
    { id: 20, matchday: 1, group: 'J', round: 'Group Stage', date: '2026-06-16T21:00:00-04:00', homeTeam: 'AUT', awayTeam: 'JOR', stadium: 'Gillette Stadium',    city: 'Boston',           status: 'finished', homeScore: 1, awayScore: 2, referee: 'Victor Gomes' },

    // ── June 17 ──────────────────────────────────────────────────
    // Group K (đá xong trong ngày 17/06 theo giờ EDT)
    { id: 21, matchday: 1, group: 'K', round: 'Group Stage', date: '2026-06-17T13:00:00-04:00', homeTeam: 'POR', awayTeam: 'COD', stadium: 'Lincoln Financial Field', city: 'Philadelphia', status: 'finished', homeScore: 2, awayScore: 1, referee: 'Clément Turpin' },
    { id: 22, matchday: 1, group: 'K', round: 'Group Stage', date: '2026-06-17T16:00:00-04:00', homeTeam: 'UZB', awayTeam: 'COL', stadium: 'Arrowhead Stadium',   city: 'Kansas City',      status: 'finished', homeScore: 0, awayScore: 3, referee: 'Mustapha Ghorbal' },
    // Group L
    { id: 23, matchday: 1, group: 'L', round: 'Group Stage', date: '2026-06-17T19:00:00-04:00', homeTeam: 'ENG', awayTeam: 'GHA', stadium: 'MetLife Stadium',     city: 'New York/New Jersey', status: 'finished', homeScore: 3, awayScore: 0, referee: 'Danny Makkelie' },
    { id: 24, matchday: 1, group: 'L', round: 'Group Stage', date: '2026-06-17T21:00:00-04:00', homeTeam: 'CRO', awayTeam: 'PAN', stadium: 'NRG Stadium',         city: 'Houston',          status: 'finished', homeScore: 2, awayScore: 1, referee: 'Wilton Sampaio' },

    // ╔═══════════════════════════════════════════════════════════╗
    // ║  MATCHDAY 2 — Group Stage                                ║
    // ╚═══════════════════════════════════════════════════════════╝

    // ── June 18 ──────────────────────────────────────────────────
    // Group A MD2
    { id: 25, matchday: 2, group: 'A', round: 'Group Stage', date: '2026-06-18T18:00:00-05:00', homeTeam: 'MEX', awayTeam: 'KOR', stadium: 'Estadio Azteca',      city: 'Mexico City',      status: 'scheduled', homeScore: null, awayScore: null, referee: null },
    { id: 26, matchday: 2, group: 'A', round: 'Group Stage', date: '2026-06-18T14:00:00-04:00', homeTeam: 'RSA', awayTeam: 'CZE', stadium: 'Gillette Stadium',    city: 'Boston',           status: 'scheduled', homeScore: null, awayScore: null, referee: null },

    // ── June 19 ──────────────────────────────────────────────────
    // Group B MD2
    { id: 27, matchday: 2, group: 'B', round: 'Group Stage', date: '2026-06-19T18:00:00-04:00', homeTeam: 'CAN', awayTeam: 'QAT', stadium: 'BC Place',            city: 'Vancouver',        status: 'scheduled', homeScore: null, awayScore: null, referee: null },
    { id: 28, matchday: 2, group: 'B', round: 'Group Stage', date: '2026-06-19T14:00:00-04:00', homeTeam: 'BIH', awayTeam: 'SUI', stadium: 'Lincoln Financial Field', city: 'Philadelphia', status: 'scheduled', homeScore: null, awayScore: null, referee: null },

    // ── June 20 ──────────────────────────────────────────────────
    // Group C MD2
    { id: 29, matchday: 2, group: 'C', round: 'Group Stage', date: '2026-06-20T13:00:00-04:00', homeTeam: 'BRA', awayTeam: 'HAI', stadium: 'AT&T Stadium',        city: 'Dallas',           status: 'scheduled', homeScore: null, awayScore: null, referee: null },
    { id: 30, matchday: 2, group: 'C', round: 'Group Stage', date: '2026-06-20T16:00:00-04:00', homeTeam: 'MAR', awayTeam: 'SCO', stadium: 'NRG Stadium',         city: 'Houston',          status: 'scheduled', homeScore: null, awayScore: null, referee: null },
    // Group D MD2
    { id: 31, matchday: 2, group: 'D', round: 'Group Stage', date: '2026-06-20T19:00:00-04:00', homeTeam: 'USA', awayTeam: 'AUS', stadium: 'SoFi Stadium',        city: 'Los Angeles',      status: 'scheduled', homeScore: null, awayScore: null, referee: null },
    { id: 32, matchday: 2, group: 'D', round: 'Group Stage', date: '2026-06-20T21:00:00-05:00', homeTeam: 'PAR', awayTeam: 'TUR', stadium: 'Estadio Akron',       city: 'Guadalajara',      status: 'scheduled', homeScore: null, awayScore: null, referee: null },

    // ── June 21 ──────────────────────────────────────────────────
    // Group E MD2
    { id: 33, matchday: 2, group: 'E', round: 'Group Stage', date: '2026-06-21T13:00:00-04:00', homeTeam: 'GER', awayTeam: 'CIV', stadium: 'MetLife Stadium',     city: 'New York/New Jersey', status: 'scheduled', homeScore: null, awayScore: null, referee: null },
    { id: 34, matchday: 2, group: 'E', round: 'Group Stage', date: '2026-06-21T16:00:00-04:00', homeTeam: 'CUW', awayTeam: 'ECU', stadium: 'Hard Rock Stadium',   city: 'Miami',            status: 'scheduled', homeScore: null, awayScore: null, referee: null },
    // Group F MD2
    { id: 35, matchday: 2, group: 'F', round: 'Group Stage', date: '2026-06-21T19:00:00-04:00', homeTeam: 'NED', awayTeam: 'SWE', stadium: 'Lincoln Financial Field', city: 'Philadelphia', status: 'scheduled', homeScore: null, awayScore: null, referee: null },
    { id: 36, matchday: 2, group: 'F', round: 'Group Stage', date: '2026-06-21T10:00:00-07:00', homeTeam: 'JPN', awayTeam: 'TUN', stadium: 'Lumen Field',         city: 'Seattle',          status: 'scheduled', homeScore: null, awayScore: null, referee: null },

    // ── June 22 ──────────────────────────────────────────────────
    // Group G MD2
    { id: 37, matchday: 2, group: 'G', round: 'Group Stage', date: '2026-06-22T13:00:00-04:00', homeTeam: 'BEL', awayTeam: 'IRN', stadium: 'Gillette Stadium',    city: 'Boston',           status: 'scheduled', homeScore: null, awayScore: null, referee: null },
    { id: 38, matchday: 2, group: 'G', round: 'Group Stage', date: '2026-06-22T16:00:00-04:00', homeTeam: 'EGY', awayTeam: 'NZL', stadium: 'Mercedes-Benz Stadium', city: 'Atlanta',        status: 'scheduled', homeScore: null, awayScore: null, referee: null },
    // Group H MD2
    { id: 39, matchday: 2, group: 'H', round: 'Group Stage', date: '2026-06-22T19:00:00-04:00', homeTeam: 'ESP', awayTeam: 'KSA', stadium: 'AT&T Stadium',        city: 'Dallas',           status: 'scheduled', homeScore: null, awayScore: null, referee: null },
    { id: 40, matchday: 2, group: 'H', round: 'Group Stage', date: '2026-06-22T21:00:00-05:00', homeTeam: 'CPV', awayTeam: 'URU', stadium: 'Estadio BBVA',        city: 'Monterrey',        status: 'scheduled', homeScore: null, awayScore: null, referee: null },

    // ── June 23 ──────────────────────────────────────────────────
    // Group I MD2
    { id: 41, matchday: 2, group: 'I', round: 'Group Stage', date: '2026-06-23T13:00:00-04:00', homeTeam: 'FRA', awayTeam: 'IRQ', stadium: 'NRG Stadium',         city: 'Houston',          status: 'scheduled', homeScore: null, awayScore: null, referee: null },
    { id: 42, matchday: 2, group: 'I', round: 'Group Stage', date: '2026-06-23T16:00:00-04:00', homeTeam: 'SEN', awayTeam: 'NOR', stadium: 'Arrowhead Stadium',   city: 'Kansas City',      status: 'scheduled', homeScore: null, awayScore: null, referee: null },
    // Group J MD2
    { id: 43, matchday: 2, group: 'J', round: 'Group Stage', date: '2026-06-23T19:00:00-04:00', homeTeam: 'ARG', awayTeam: 'AUT', stadium: 'Hard Rock Stadium',   city: 'Miami',            status: 'scheduled', homeScore: null, awayScore: null, referee: null },
    { id: 44, matchday: 2, group: 'J', round: 'Group Stage', date: '2026-06-23T21:00:00-04:00', homeTeam: 'ALG', awayTeam: 'JOR', stadium: 'MetLife Stadium',     city: 'New York/New Jersey', status: 'scheduled', homeScore: null, awayScore: null, referee: null },
    // Group K MD2
    { id: 45, matchday: 2, group: 'K', round: 'Group Stage', date: '2026-06-23T13:00:00-07:00', homeTeam: 'POR', awayTeam: 'UZB', stadium: "Levi's Stadium",     city: 'San Francisco',    status: 'scheduled', homeScore: null, awayScore: null, referee: null },
    { id: 46, matchday: 2, group: 'K', round: 'Group Stage', date: '2026-06-23T18:00:00-04:00', homeTeam: 'COD', awayTeam: 'COL', stadium: 'Lincoln Financial Field', city: 'Philadelphia', status: 'scheduled', homeScore: null, awayScore: null, referee: null },
    // Group L MD2
    { id: 47, matchday: 2, group: 'L', round: 'Group Stage', date: '2026-06-23T19:00:00-04:00', homeTeam: 'ENG', awayTeam: 'CRO', stadium: 'Gillette Stadium',    city: 'Boston',           status: 'scheduled', homeScore: null, awayScore: null, referee: null },
    { id: 48, matchday: 2, group: 'L', round: 'Group Stage', date: '2026-06-23T21:00:00-05:00', homeTeam: 'GHA', awayTeam: 'PAN', stadium: 'Estadio Azteca',      city: 'Mexico City',      status: 'scheduled', homeScore: null, awayScore: null, referee: null },

    // ╔═══════════════════════════════════════════════════════════╗
    // ║  MATCHDAY 3 — Group Stage  (simultaneous kickoffs)       ║
    // ╚═══════════════════════════════════════════════════════════╝

    // ── June 24 ──────────────────────────────────────────────────
    // Group A MD3
    { id: 49, matchday: 3, group: 'A', round: 'Group Stage', date: '2026-06-24T18:00:00-05:00', homeTeam: 'MEX', awayTeam: 'CZE', stadium: 'Estadio Azteca',      city: 'Mexico City',      status: 'scheduled', homeScore: null, awayScore: null, referee: null },
    { id: 50, matchday: 3, group: 'A', round: 'Group Stage', date: '2026-06-24T19:00:00-04:00', homeTeam: 'RSA', awayTeam: 'KOR', stadium: 'Mercedes-Benz Stadium', city: 'Atlanta',        status: 'scheduled', homeScore: null, awayScore: null, referee: null },

    // ── June 25 ──────────────────────────────────────────────────
    // Group B MD3
    { id: 51, matchday: 3, group: 'B', round: 'Group Stage', date: '2026-06-25T16:00:00-04:00', homeTeam: 'CAN', awayTeam: 'SUI', stadium: 'BMO Field',           city: 'Toronto',          status: 'scheduled', homeScore: null, awayScore: null, referee: null },
    { id: 52, matchday: 3, group: 'B', round: 'Group Stage', date: '2026-06-25T16:00:00-04:00', homeTeam: 'BIH', awayTeam: 'QAT', stadium: 'Gillette Stadium',    city: 'Boston',           status: 'scheduled', homeScore: null, awayScore: null, referee: null },
    // Group C MD3
    { id: 53, matchday: 3, group: 'C', round: 'Group Stage', date: '2026-06-25T19:00:00-04:00', homeTeam: 'BRA', awayTeam: 'SCO', stadium: 'MetLife Stadium',     city: 'New York/New Jersey', status: 'scheduled', homeScore: null, awayScore: null, referee: null },
    { id: 54, matchday: 3, group: 'C', round: 'Group Stage', date: '2026-06-25T19:00:00-04:00', homeTeam: 'MAR', awayTeam: 'HAI', stadium: 'Hard Rock Stadium',   city: 'Miami',            status: 'scheduled', homeScore: null, awayScore: null, referee: null },

    // ── June 26 ──────────────────────────────────────────────────
    // Group D MD3
    { id: 55, matchday: 3, group: 'D', round: 'Group Stage', date: '2026-06-26T19:00:00-04:00', homeTeam: 'USA', awayTeam: 'TUR', stadium: 'SoFi Stadium',        city: 'Los Angeles',      status: 'scheduled', homeScore: null, awayScore: null, referee: null },
    { id: 56, matchday: 3, group: 'D', round: 'Group Stage', date: '2026-06-26T19:00:00-04:00', homeTeam: 'PAR', awayTeam: 'AUS', stadium: 'NRG Stadium',         city: 'Houston',          status: 'scheduled', homeScore: null, awayScore: null, referee: null },
    // Group E MD3
    { id: 57, matchday: 3, group: 'E', round: 'Group Stage', date: '2026-06-26T16:00:00-04:00', homeTeam: 'GER', awayTeam: 'ECU', stadium: 'AT&T Stadium',        city: 'Dallas',           status: 'scheduled', homeScore: null, awayScore: null, referee: null },
    { id: 58, matchday: 3, group: 'E', round: 'Group Stage', date: '2026-06-26T16:00:00-04:00', homeTeam: 'CUW', awayTeam: 'CIV', stadium: 'Arrowhead Stadium',   city: 'Kansas City',      status: 'scheduled', homeScore: null, awayScore: null, referee: null },

    // ── June 27 ──────────────────────────────────────────────────
    // Group F MD3
    { id: 59, matchday: 3, group: 'F', round: 'Group Stage', date: '2026-06-27T16:00:00-04:00', homeTeam: 'NED', awayTeam: 'TUN', stadium: 'Lincoln Financial Field', city: 'Philadelphia', status: 'scheduled', homeScore: null, awayScore: null, referee: null },
    { id: 60, matchday: 3, group: 'F', round: 'Group Stage', date: '2026-06-27T16:00:00-04:00', homeTeam: 'JPN', awayTeam: 'SWE', stadium: 'Lumen Field',         city: 'Seattle',          status: 'scheduled', homeScore: null, awayScore: null, referee: null },
    // Group G MD3
    { id: 61, matchday: 3, group: 'G', round: 'Group Stage', date: '2026-06-27T19:00:00-04:00', homeTeam: 'BEL', awayTeam: 'NZL', stadium: 'MetLife Stadium',     city: 'New York/New Jersey', status: 'scheduled', homeScore: null, awayScore: null, referee: null },
    { id: 62, matchday: 3, group: 'G', round: 'Group Stage', date: '2026-06-27T19:00:00-04:00', homeTeam: 'EGY', awayTeam: 'IRN', stadium: 'Gillette Stadium',    city: 'Boston',           status: 'scheduled', homeScore: null, awayScore: null, referee: null },

    // ── June 28 ──────────────────────────────────────────────────
    // Group H MD3
    { id: 63, matchday: 3, group: 'H', round: 'Group Stage', date: '2026-06-28T13:00:00-04:00', homeTeam: 'ESP', awayTeam: 'URU', stadium: 'Hard Rock Stadium',   city: 'Miami',            status: 'scheduled', homeScore: null, awayScore: null, referee: null },
    { id: 64, matchday: 3, group: 'H', round: 'Group Stage', date: '2026-06-28T13:00:00-04:00', homeTeam: 'CPV', awayTeam: 'KSA', stadium: 'NRG Stadium',         city: 'Houston',          status: 'scheduled', homeScore: null, awayScore: null, referee: null },
    // Group I MD3
    { id: 65, matchday: 3, group: 'I', round: 'Group Stage', date: '2026-06-28T16:00:00-04:00', homeTeam: 'FRA', awayTeam: 'NOR', stadium: 'AT&T Stadium',        city: 'Dallas',           status: 'scheduled', homeScore: null, awayScore: null, referee: null },
    { id: 66, matchday: 3, group: 'I', round: 'Group Stage', date: '2026-06-28T16:00:00-04:00', homeTeam: 'SEN', awayTeam: 'IRQ', stadium: 'Mercedes-Benz Stadium', city: 'Atlanta',        status: 'scheduled', homeScore: null, awayScore: null, referee: null },
    // Group J MD3
    { id: 67, matchday: 3, group: 'J', round: 'Group Stage', date: '2026-06-28T19:00:00-04:00', homeTeam: 'ARG', awayTeam: 'JOR', stadium: 'SoFi Stadium',        city: 'Los Angeles',      status: 'scheduled', homeScore: null, awayScore: null, referee: null },
    { id: 68, matchday: 3, group: 'J', round: 'Group Stage', date: '2026-06-28T19:00:00-04:00', homeTeam: 'ALG', awayTeam: 'AUT', stadium: 'Arrowhead Stadium',   city: 'Kansas City',      status: 'scheduled', homeScore: null, awayScore: null, referee: null },
    // Group K MD3
    { id: 69, matchday: 3, group: 'K', round: 'Group Stage', date: '2026-06-28T21:00:00-04:00', homeTeam: 'POR', awayTeam: 'COL', stadium: 'MetLife Stadium',     city: 'New York/New Jersey', status: 'scheduled', homeScore: null, awayScore: null, referee: null },
    { id: 70, matchday: 3, group: 'K', round: 'Group Stage', date: '2026-06-28T21:00:00-04:00', homeTeam: 'COD', awayTeam: 'UZB', stadium: 'Lincoln Financial Field', city: 'Philadelphia', status: 'scheduled', homeScore: null, awayScore: null, referee: null },
    // Group L MD3
    { id: 71, matchday: 3, group: 'L', round: 'Group Stage', date: '2026-06-28T21:00:00-05:00', homeTeam: 'ENG', awayTeam: 'PAN', stadium: 'Estadio Azteca',      city: 'Mexico City',      status: 'scheduled', homeScore: null, awayScore: null, referee: null },
    { id: 72, matchday: 3, group: 'L', round: 'Group Stage', date: '2026-06-28T21:00:00-05:00', homeTeam: 'CRO', awayTeam: 'GHA', stadium: 'Estadio BBVA',        city: 'Monterrey',        status: 'scheduled', homeScore: null, awayScore: null, referee: null },

    // ╔═══════════════════════════════════════════════════════════╗
    // ║  ROUND OF 32 — Knockout Stage (16 matches)               ║
    // ╚═══════════════════════════════════════════════════════════╝

    // ── June 29 ──────────────────────────────────────────────────
    { id: 73, matchday: null, group: null, round: 'Round of 32', date: '2026-06-29T13:00:00-04:00', homeTeam: null, awayTeam: null, stadium: 'MetLife Stadium',          city: 'New York/New Jersey', status: 'scheduled', homeScore: null, awayScore: null, referee: null, label: 'R32-1: 1A vs 3C/D/E' },
    { id: 74, matchday: null, group: null, round: 'Round of 32', date: '2026-06-29T16:00:00-04:00', homeTeam: null, awayTeam: null, stadium: 'AT&T Stadium',             city: 'Dallas',              status: 'scheduled', homeScore: null, awayScore: null, referee: null, label: 'R32-2: 2A vs 2B' },
    { id: 75, matchday: null, group: null, round: 'Round of 32', date: '2026-06-29T19:00:00-04:00', homeTeam: null, awayTeam: null, stadium: 'Hard Rock Stadium',        city: 'Miami',               status: 'scheduled', homeScore: null, awayScore: null, referee: null, label: 'R32-3: 1B vs 3A/D/E' },
    { id: 76, matchday: null, group: null, round: 'Round of 32', date: '2026-06-29T21:00:00-04:00', homeTeam: null, awayTeam: null, stadium: 'NRG Stadium',              city: 'Houston',             status: 'scheduled', homeScore: null, awayScore: null, referee: null, label: 'R32-4: 1C vs 3B/F/G' },

    // ── June 30 ──────────────────────────────────────────────────
    { id: 77, matchday: null, group: null, round: 'Round of 32', date: '2026-06-30T13:00:00-04:00', homeTeam: null, awayTeam: null, stadium: 'Mercedes-Benz Stadium',    city: 'Atlanta',             status: 'scheduled', homeScore: null, awayScore: null, referee: null, label: 'R32-5: 2C vs 2D' },
    { id: 78, matchday: null, group: null, round: 'Round of 32', date: '2026-06-30T16:00:00-04:00', homeTeam: null, awayTeam: null, stadium: 'SoFi Stadium',             city: 'Los Angeles',         status: 'scheduled', homeScore: null, awayScore: null, referee: null, label: 'R32-6: 1D vs 3B/E/F' },
    { id: 79, matchday: null, group: null, round: 'Round of 32', date: '2026-06-30T19:00:00-04:00', homeTeam: null, awayTeam: null, stadium: 'Lincoln Financial Field',  city: 'Philadelphia',        status: 'scheduled', homeScore: null, awayScore: null, referee: null, label: 'R32-7: 1E vs 3C/H/I' },
    { id: 80, matchday: null, group: null, round: 'Round of 32', date: '2026-06-30T21:00:00-04:00', homeTeam: null, awayTeam: null, stadium: 'Lumen Field',              city: 'Seattle',             status: 'scheduled', homeScore: null, awayScore: null, referee: null, label: 'R32-8: 2E vs 2F' },

    // ── July 1 ───────────────────────────────────────────────────
    { id: 81, matchday: null, group: null, round: 'Round of 32', date: '2026-07-01T13:00:00-04:00', homeTeam: null, awayTeam: null, stadium: 'Arrowhead Stadium',        city: 'Kansas City',         status: 'scheduled', homeScore: null, awayScore: null, referee: null, label: 'R32-9: 1F vs 3D/G/H' },
    { id: 82, matchday: null, group: null, round: 'Round of 32', date: '2026-07-01T16:00:00-04:00', homeTeam: null, awayTeam: null, stadium: 'Gillette Stadium',         city: 'Boston',              status: 'scheduled', homeScore: null, awayScore: null, referee: null, label: 'R32-10: 2G vs 2H' },
    { id: 83, matchday: null, group: null, round: 'Round of 32', date: '2026-07-01T19:00:00-04:00', homeTeam: null, awayTeam: null, stadium: "Levi's Stadium",           city: 'San Francisco',       status: 'scheduled', homeScore: null, awayScore: null, referee: null, label: 'R32-11: 1G vs 3F/I/J' },
    { id: 84, matchday: null, group: null, round: 'Round of 32', date: '2026-07-01T21:00:00-04:00', homeTeam: null, awayTeam: null, stadium: 'BMO Field',               city: 'Toronto',             status: 'scheduled', homeScore: null, awayScore: null, referee: null, label: 'R32-12: 1H vs 3G/J/K' },

    // ── July 2 ───────────────────────────────────────────────────
    { id: 85, matchday: null, group: null, round: 'Round of 32', date: '2026-07-02T13:00:00-04:00', homeTeam: null, awayTeam: null, stadium: 'BC Place',                city: 'Vancouver',           status: 'scheduled', homeScore: null, awayScore: null, referee: null, label: 'R32-13: 2I vs 2J' },
    { id: 86, matchday: null, group: null, round: 'Round of 32', date: '2026-07-02T16:00:00-04:00', homeTeam: null, awayTeam: null, stadium: 'Estadio BBVA',            city: 'Monterrey',           status: 'scheduled', homeScore: null, awayScore: null, referee: null, label: 'R32-14: 1I vs 3H/K/L' },
    { id: 87, matchday: null, group: null, round: 'Round of 32', date: '2026-07-02T19:00:00-04:00', homeTeam: null, awayTeam: null, stadium: 'Estadio Akron',           city: 'Guadalajara',         status: 'scheduled', homeScore: null, awayScore: null, referee: null, label: 'R32-15: 1J vs 3I/L/A' },
    { id: 88, matchday: null, group: null, round: 'Round of 32', date: '2026-07-02T21:00:00-04:00', homeTeam: null, awayTeam: null, stadium: 'MetLife Stadium',          city: 'New York/New Jersey', status: 'scheduled', homeScore: null, awayScore: null, referee: null, label: 'R32-16: 2K vs 2L' },

    // ╔═══════════════════════════════════════════════════════════╗
    // ║  ROUND OF 16 — Knockout Stage (8 matches)                ║
    // ╚═══════════════════════════════════════════════════════════╝

    // ── July 4 ───────────────────────────────────────────────────
    { id: 89, matchday: null, group: null, round: 'Round of 16', date: '2026-07-04T13:00:00-04:00', homeTeam: null, awayTeam: null, stadium: 'MetLife Stadium',          city: 'New York/New Jersey', status: 'scheduled', homeScore: null, awayScore: null, referee: null, label: 'R16-1: W(R32-1) vs W(R32-2)' },
    { id: 90, matchday: null, group: null, round: 'Round of 16', date: '2026-07-04T16:00:00-04:00', homeTeam: null, awayTeam: null, stadium: 'AT&T Stadium',             city: 'Dallas',              status: 'scheduled', homeScore: null, awayScore: null, referee: null, label: 'R16-2: W(R32-3) vs W(R32-4)' },
    { id: 91, matchday: null, group: null, round: 'Round of 16', date: '2026-07-04T19:00:00-04:00', homeTeam: null, awayTeam: null, stadium: 'SoFi Stadium',             city: 'Los Angeles',         status: 'scheduled', homeScore: null, awayScore: null, referee: null, label: 'R16-3: W(R32-5) vs W(R32-6)' },
    { id: 92, matchday: null, group: null, round: 'Round of 16', date: '2026-07-04T21:00:00-04:00', homeTeam: null, awayTeam: null, stadium: 'NRG Stadium',              city: 'Houston',             status: 'scheduled', homeScore: null, awayScore: null, referee: null, label: 'R16-4: W(R32-7) vs W(R32-8)' },

    // ── July 5 ───────────────────────────────────────────────────
    { id: 93, matchday: null, group: null, round: 'Round of 16', date: '2026-07-05T13:00:00-04:00', homeTeam: null, awayTeam: null, stadium: 'Hard Rock Stadium',        city: 'Miami',               status: 'scheduled', homeScore: null, awayScore: null, referee: null, label: 'R16-5: W(R32-9) vs W(R32-10)' },
    { id: 94, matchday: null, group: null, round: 'Round of 16', date: '2026-07-05T16:00:00-04:00', homeTeam: null, awayTeam: null, stadium: 'Mercedes-Benz Stadium',    city: 'Atlanta',             status: 'scheduled', homeScore: null, awayScore: null, referee: null, label: 'R16-6: W(R32-11) vs W(R32-12)' },
    { id: 95, matchday: null, group: null, round: 'Round of 16', date: '2026-07-05T19:00:00-04:00', homeTeam: null, awayTeam: null, stadium: 'Lincoln Financial Field',  city: 'Philadelphia',        status: 'scheduled', homeScore: null, awayScore: null, referee: null, label: 'R16-7: W(R32-13) vs W(R32-14)' },
    { id: 96, matchday: null, group: null, round: 'Round of 16', date: '2026-07-05T21:00:00-04:00', homeTeam: null, awayTeam: null, stadium: 'Arrowhead Stadium',        city: 'Kansas City',         status: 'scheduled', homeScore: null, awayScore: null, referee: null, label: 'R16-8: W(R32-15) vs W(R32-16)' },

    // ╔═══════════════════════════════════════════════════════════╗
    // ║  QUARTER-FINALS (4 matches)                              ║
    // ╚═══════════════════════════════════════════════════════════╝

    // ── July 9 ───────────────────────────────────────────────────
    { id: 97,  matchday: null, group: null, round: 'Quarter-Final', date: '2026-07-09T16:00:00-04:00', homeTeam: null, awayTeam: null, stadium: 'NRG Stadium',        city: 'Houston',             status: 'scheduled', homeScore: null, awayScore: null, referee: null, label: 'QF1: W(R16-1) vs W(R16-2)' },
    { id: 98,  matchday: null, group: null, round: 'Quarter-Final', date: '2026-07-09T20:00:00-04:00', homeTeam: null, awayTeam: null, stadium: 'Hard Rock Stadium',  city: 'Miami',               status: 'scheduled', homeScore: null, awayScore: null, referee: null, label: 'QF2: W(R16-3) vs W(R16-4)' },

    // ── July 10 ──────────────────────────────────────────────────
    { id: 99,  matchday: null, group: null, round: 'Quarter-Final', date: '2026-07-10T16:00:00-04:00', homeTeam: null, awayTeam: null, stadium: 'SoFi Stadium',       city: 'Los Angeles',         status: 'scheduled', homeScore: null, awayScore: null, referee: null, label: 'QF3: W(R16-5) vs W(R16-6)' },
    { id: 100, matchday: null, group: null, round: 'Quarter-Final', date: '2026-07-10T20:00:00-04:00', homeTeam: null, awayTeam: null, stadium: 'AT&T Stadium',       city: 'Dallas',              status: 'scheduled', homeScore: null, awayScore: null, referee: null, label: 'QF4: W(R16-7) vs W(R16-8)' },

    // ╔═══════════════════════════════════════════════════════════╗
    // ║  SEMI-FINALS (2 matches)                                 ║
    // ╚═══════════════════════════════════════════════════════════╝

    { id: 101, matchday: null, group: null, round: 'Semi-Final', date: '2026-07-14T20:00:00-04:00', homeTeam: null, awayTeam: null, stadium: 'AT&T Stadium',  city: 'Dallas',      status: 'scheduled', homeScore: null, awayScore: null, referee: null, label: 'SF1: W(QF1) vs W(QF2)' },
    { id: 102, matchday: null, group: null, round: 'Semi-Final', date: '2026-07-15T20:00:00-07:00', homeTeam: null, awayTeam: null, stadium: 'SoFi Stadium',  city: 'Los Angeles', status: 'scheduled', homeScore: null, awayScore: null, referee: null, label: 'SF2: W(QF3) vs W(QF4)' },

    // ╔═══════════════════════════════════════════════════════════╗
    // ║  THIRD PLACE PLAY-OFF                                    ║
    // ╚═══════════════════════════════════════════════════════════╝

    { id: 103, matchday: null, group: null, round: 'Third Place', date: '2026-07-18T16:00:00-04:00', homeTeam: null, awayTeam: null, stadium: 'Hard Rock Stadium', city: 'Miami', status: 'scheduled', homeScore: null, awayScore: null, referee: null, label: '3rd Place: L(SF1) vs L(SF2)' },

    // ╔═══════════════════════════════════════════════════════════╗
    // ║  FINAL                                                   ║
    // ╚═══════════════════════════════════════════════════════════╝

    { id: 104, matchday: null, group: null, round: 'Final', date: '2026-07-19T16:00:00-04:00', homeTeam: null, awayTeam: null, stadium: 'MetLife Stadium', city: 'New York/New Jersey', status: 'scheduled', homeScore: null, awayScore: null, referee: null, label: 'FINAL: W(SF1) vs W(SF2)' }
  ],

  // ═══════════════════════════════════════════════════════════════
  //  HEAD-TO-HEAD RECORDS  (35 major matchups)
  //  Key format: "TEAM1_TEAM2" (alphabetical by code)
  //  Record object: { matches, wins1, draws, wins2, goals1, goals2 }
  // ═══════════════════════════════════════════════════════════════
  headToHead: {
    // Group A matchups
    'KOR_MEX':  { team1: 'KOR', team2: 'MEX', matches: 8,  wins1: 2, draws: 2, wins2: 4, goals1: 10, goals2: 14 },
    'CZE_KOR':  { team1: 'CZE', team2: 'KOR', matches: 5,  wins1: 2, draws: 1, wins2: 2, goals1: 7,  goals2: 7 },
    'MEX_RSA':  { team1: 'MEX', team2: 'RSA', matches: 7,  wins1: 4, draws: 2, wins2: 1, goals1: 11, goals2: 6 },

    // Group C matchups
    'BRA_MAR':  { team1: 'BRA', team2: 'MAR', matches: 6,  wins1: 4, draws: 1, wins2: 1, goals1: 10, goals2: 5 },
    'BRA_SCO':  { team1: 'BRA', team2: 'SCO', matches: 4,  wins1: 3, draws: 0, wins2: 1, goals1: 8,  goals2: 4 },

    // Group D matchups
    'AUS_USA':  { team1: 'AUS', team2: 'USA', matches: 10, wins1: 3, draws: 3, wins2: 4, goals1: 14, goals2: 16 },
    'TUR_USA':  { team1: 'TUR', team2: 'USA', matches: 5,  wins1: 2, draws: 1, wins2: 2, goals1: 6,  goals2: 7 },

    // Group F matchups
    'JPN_NED':  { team1: 'JPN', team2: 'NED', matches: 4,  wins1: 0, draws: 1, wins2: 3, goals1: 3,  goals2: 9 },
    'NED_SWE':  { team1: 'NED', team2: 'SWE', matches: 22, wins1: 10, draws: 4, wins2: 8, goals1: 42, goals2: 38 },

    // Group G matchups
    'BEL_EGY':  { team1: 'BEL', team2: 'EGY', matches: 4,  wins1: 2, draws: 1, wins2: 1, goals1: 8,  goals2: 5 },

    // Group H matchups
    'ESP_URU':  { team1: 'ESP', team2: 'URU', matches: 10, wins1: 4, draws: 3, wins2: 3, goals1: 14, goals2: 11 },
    'KSA_URU':  { team1: 'KSA', team2: 'URU', matches: 3,  wins1: 0, draws: 1, wins2: 2, goals1: 1,  goals2: 5 },

    // Group I matchups
    'FRA_SEN':  { team1: 'FRA', team2: 'SEN', matches: 5,  wins1: 3, draws: 1, wins2: 1, goals1: 8,  goals2: 4 },
    'FRA_NOR':  { team1: 'FRA', team2: 'NOR', matches: 18, wins1: 10, draws: 3, wins2: 5, goals1: 30, goals2: 20 },

    // Group J matchups
    'ALG_ARG':  { team1: 'ALG', team2: 'ARG', matches: 4,  wins1: 1, draws: 1, wins2: 2, goals1: 5,  goals2: 6 },
    'ARG_AUT':  { team1: 'ARG', team2: 'AUT', matches: 8,  wins1: 3, draws: 3, wins2: 2, goals1: 13, goals2: 10 },

    // Group K matchups
    'COL_POR':  { team1: 'COL', team2: 'POR', matches: 3,  wins1: 0, draws: 1, wins2: 2, goals1: 2,  goals2: 5 },

    // Group L matchups
    'CRO_ENG':  { team1: 'CRO', team2: 'ENG', matches: 9,  wins1: 3, draws: 2, wins2: 4, goals1: 10, goals2: 14 },
    'ENG_GHA':  { team1: 'ENG', team2: 'GHA', matches: 3,  wins1: 2, draws: 0, wins2: 1, goals1: 5,  goals2: 4 },

    // Classic World Cup rivalries
    'ARG_BRA':  { team1: 'ARG', team2: 'BRA', matches: 111, wins1: 40, draws: 26, wins2: 45, goals1: 160, goals2: 170 },
    'ARG_ENG':  { team1: 'ARG', team2: 'ENG', matches: 14,  wins1: 6, draws: 3, wins2: 5, goals1: 19, goals2: 17 },
    'ARG_FRA':  { team1: 'ARG', team2: 'FRA', matches: 13,  wins1: 6, draws: 3, wins2: 4, goals1: 18, goals2: 16 },
    'ARG_GER':  { team1: 'ARG', team2: 'GER', matches: 22,  wins1: 6, draws: 8, wins2: 8, goals1: 28, goals2: 32 },
    'BRA_FRA':  { team1: 'BRA', team2: 'FRA', matches: 12,  wins1: 5, draws: 2, wins2: 5, goals1: 18, goals2: 17 },
    'BRA_GER':  { team1: 'BRA', team2: 'GER', matches: 23,  wins1: 13, draws: 3, wins2: 7, goals1: 43, goals2: 33 },
    'ENG_FRA':  { team1: 'ENG', team2: 'FRA', matches: 31,  wins1: 17, draws: 5, wins2: 9, goals1: 68, goals2: 45 },
    'ENG_GER':  { team1: 'ENG', team2: 'GER', matches: 35,  wins1: 14, draws: 8, wins2: 13, goals1: 56, goals2: 52 },
    'ESP_FRA':  { team1: 'ESP', team2: 'FRA', matches: 35,  wins1: 11, draws: 10, wins2: 14, goals1: 46, goals2: 52 },
    'ESP_GER':  { team1: 'ESP', team2: 'GER', matches: 26,  wins1: 9, draws: 7, wins2: 10, goals1: 35, goals2: 38 },
    'ESP_POR':  { team1: 'ESP', team2: 'POR', matches: 40,  wins1: 17, draws: 10, wins2: 13, goals1: 63, goals2: 52 },
    'FRA_GER':  { team1: 'FRA', team2: 'GER', matches: 31,  wins1: 12, draws: 7, wins2: 12, goals1: 46, goals2: 44 },
    'MEX_USA':  { team1: 'MEX', team2: 'USA', matches: 75,  wins1: 36, draws: 16, wins2: 23, goals1: 139, goals2: 100 },
    'BRA_URU':  { team1: 'BRA', team2: 'URU', matches: 78,  wins1: 37, draws: 20, wins2: 21, goals1: 136, goals2: 97 },
    'NED_GER':  { team1: 'NED', team2: 'GER', matches: 46,  wins1: 17, draws: 10, wins2: 19, goals1: 75, goals2: 81 },
    'POR_FRA':  { team1: 'POR', team2: 'FRA', matches: 27,  wins1: 8, draws: 7, wins2: 12, goals1: 32, goals2: 39 },
    'ESP_ENG':  { team1: 'ESP', team2: 'ENG', matches: 26,  wins1: 7, draws: 7, wins2: 12, goals1: 28, goals2: 40 }
  },

  // ═══════════════════════════════════════════════════════════════
  //  WORLD CUP HISTORY — Historical performance per team
  // ═══════════════════════════════════════════════════════════════
  wcHistory: {
    ARG: { totalAppearances: 18, titles: 3, titleYears: [1978, 1986, 2022], finals: 6, semiFinals: 6, bestFinish: 'Winner', totalGoals: 148, totalMatches: 88 },
    FRA: { totalAppearances: 16, titles: 2, titleYears: [1998, 2018],       finals: 4, semiFinals: 7, bestFinish: 'Winner', totalGoals: 125, totalMatches: 73 },
    ESP: { totalAppearances: 16, titles: 1, titleYears: [2010],             finals: 1, semiFinals: 2, bestFinish: 'Winner', totalGoals: 104, totalMatches: 67 },
    ENG: { totalAppearances: 16, titles: 1, titleYears: [1966],             finals: 2, semiFinals: 4, bestFinish: 'Winner', totalGoals: 105, totalMatches: 74 },
    BRA: { totalAppearances: 22, titles: 5, titleYears: [1958, 1962, 1970, 1994, 2002], finals: 7, semiFinals: 11, bestFinish: 'Winner', totalGoals: 237, totalMatches: 114 },
    GER: { totalAppearances: 20, titles: 4, titleYears: [1954, 1974, 1990, 2014], finals: 8, semiFinals: 13, bestFinish: 'Winner', totalGoals: 232, totalMatches: 112 },
    POR: { totalAppearances: 8,  titles: 0, titleYears: [],                 finals: 0, semiFinals: 2, bestFinish: 'Third Place', totalGoals: 45, totalMatches: 37 },
    NED: { totalAppearances: 11, titles: 0, titleYears: [],                 finals: 3, semiFinals: 5, bestFinish: 'Runner-up', totalGoals: 90, totalMatches: 54 },
    BEL: { totalAppearances: 14, titles: 0, titleYears: [],                 finals: 0, semiFinals: 2, bestFinish: 'Third Place', totalGoals: 62, totalMatches: 51 },
    URU: { totalAppearances: 14, titles: 2, titleYears: [1930, 1950],       finals: 2, semiFinals: 5, bestFinish: 'Winner', totalGoals: 87, totalMatches: 59 },
    CRO: { totalAppearances: 7,  titles: 0, titleYears: [],                 finals: 1, semiFinals: 3, bestFinish: 'Runner-up', totalGoals: 37, totalMatches: 30 },
    COL: { totalAppearances: 6,  titles: 0, titleYears: [],                 finals: 0, semiFinals: 0, bestFinish: 'Quarter-finals', totalGoals: 21, totalMatches: 20 },
    MAR: { totalAppearances: 7,  titles: 0, titleYears: [],                 finals: 0, semiFinals: 1, bestFinish: 'Semi-finals', totalGoals: 15, totalMatches: 21 },
    JPN: { totalAppearances: 7,  titles: 0, titleYears: [],                 finals: 0, semiFinals: 0, bestFinish: 'Round of 16', totalGoals: 21, totalMatches: 24 },
    USA: { totalAppearances: 11, titles: 0, titleYears: [],                 finals: 0, semiFinals: 1, bestFinish: 'Third Place (1930)', totalGoals: 37, totalMatches: 36 },
    MEX: { totalAppearances: 17, titles: 0, titleYears: [],                 finals: 0, semiFinals: 0, bestFinish: 'Quarter-finals', totalGoals: 60, totalMatches: 60 },
    KOR: { totalAppearances: 11, titles: 0, titleYears: [],                 finals: 0, semiFinals: 1, bestFinish: 'Fourth Place', totalGoals: 37, totalMatches: 37 },
    SUI: { totalAppearances: 12, titles: 0, titleYears: [],                 finals: 0, semiFinals: 0, bestFinish: 'Quarter-finals', totalGoals: 45, totalMatches: 37 },
    SEN: { totalAppearances: 3,  titles: 0, titleYears: [],                 finals: 0, semiFinals: 0, bestFinish: 'Quarter-finals', totalGoals: 11, totalMatches: 10 },
    ECU: { totalAppearances: 4,  titles: 0, titleYears: [],                 finals: 0, semiFinals: 0, bestFinish: 'Round of 16', totalGoals: 9,  totalMatches: 11 },
    AUS: { totalAppearances: 6,  titles: 0, titleYears: [],                 finals: 0, semiFinals: 0, bestFinish: 'Round of 16', totalGoals: 14, totalMatches: 19 },
    CAN: { totalAppearances: 3,  titles: 0, titleYears: [],                 finals: 0, semiFinals: 0, bestFinish: 'Group Stage', totalGoals: 2,  totalMatches: 7 },
    TUR: { totalAppearances: 3,  titles: 0, titleYears: [],                 finals: 0, semiFinals: 1, bestFinish: 'Third Place', totalGoals: 18, totalMatches: 12 },
    GHA: { totalAppearances: 4,  titles: 0, titleYears: [],                 finals: 0, semiFinals: 0, bestFinish: 'Quarter-finals', totalGoals: 10, totalMatches: 13 },
    SWE: { totalAppearances: 12, titles: 0, titleYears: [],                 finals: 1, semiFinals: 4, bestFinish: 'Runner-up', totalGoals: 74, totalMatches: 51 },
    IRN: { totalAppearances: 6,  titles: 0, titleYears: [],                 finals: 0, semiFinals: 0, bestFinish: 'Group Stage', totalGoals: 9,  totalMatches: 16 },
    EGY: { totalAppearances: 4,  titles: 0, titleYears: [],                 finals: 0, semiFinals: 0, bestFinish: 'Group Stage', totalGoals: 5,  totalMatches: 8 },
    NOR: { totalAppearances: 4,  titles: 0, titleYears: [],                 finals: 0, semiFinals: 0, bestFinish: 'Group Stage', totalGoals: 7,  totalMatches: 8 },
    AUT: { totalAppearances: 8,  titles: 0, titleYears: [],                 finals: 0, semiFinals: 1, bestFinish: 'Third Place', totalGoals: 26, totalMatches: 29 },
    TUN: { totalAppearances: 6,  titles: 0, titleYears: [],                 finals: 0, semiFinals: 0, bestFinish: 'Group Stage', totalGoals: 8,  totalMatches: 16 },
    ALG: { totalAppearances: 5,  titles: 0, titleYears: [],                 finals: 0, semiFinals: 0, bestFinish: 'Round of 16', totalGoals: 8,  totalMatches: 13 },
    SCO: { totalAppearances: 9,  titles: 0, titleYears: [],                 finals: 0, semiFinals: 0, bestFinish: 'Group Stage', totalGoals: 25, totalMatches: 23 },
    PAR: { totalAppearances: 9,  titles: 0, titleYears: [],                 finals: 0, semiFinals: 0, bestFinish: 'Quarter-finals', totalGoals: 27, totalMatches: 26 },
    KSA: { totalAppearances: 7,  titles: 0, titleYears: [],                 finals: 0, semiFinals: 0, bestFinish: 'Round of 16', totalGoals: 14, totalMatches: 18 },
    CIV: { totalAppearances: 4,  titles: 0, titleYears: [],                 finals: 0, semiFinals: 0, bestFinish: 'Group Stage', totalGoals: 10, totalMatches: 10 },
    RSA: { totalAppearances: 4,  titles: 0, titleYears: [],                 finals: 0, semiFinals: 0, bestFinish: 'Group Stage', totalGoals: 8,  totalMatches: 9 },
    NZL: { totalAppearances: 3,  titles: 0, titleYears: [],                 finals: 0, semiFinals: 0, bestFinish: 'Group Stage', totalGoals: 4,  totalMatches: 6 },
    QAT: { totalAppearances: 2,  titles: 0, titleYears: [],                 finals: 0, semiFinals: 0, bestFinish: 'Group Stage', totalGoals: 3,  totalMatches: 6 },
    BIH: { totalAppearances: 2,  titles: 0, titleYears: [],                 finals: 0, semiFinals: 0, bestFinish: 'Group Stage', totalGoals: 4,  totalMatches: 6 },
    PAN: { totalAppearances: 2,  titles: 0, titleYears: [],                 finals: 0, semiFinals: 0, bestFinish: 'Group Stage', totalGoals: 2,  totalMatches: 6 },
    CZE: { totalAppearances: 2,  titles: 0, titleYears: [],                 finals: 0, semiFinals: 0, bestFinish: 'Runner-up (as Czechoslovakia)', totalGoals: 5, totalMatches: 6 },
    IRQ: { totalAppearances: 2,  titles: 0, titleYears: [],                 finals: 0, semiFinals: 0, bestFinish: 'Group Stage', totalGoals: 2,  totalMatches: 6 },
    HAI: { totalAppearances: 2,  titles: 0, titleYears: [],                 finals: 0, semiFinals: 0, bestFinish: 'Group Stage', totalGoals: 2,  totalMatches: 4 },
    CUW: { totalAppearances: 1,  titles: 0, titleYears: [],                 finals: 0, semiFinals: 0, bestFinish: 'Group Stage', totalGoals: 0,  totalMatches: 0 },
    CPV: { totalAppearances: 1,  titles: 0, titleYears: [],                 finals: 0, semiFinals: 0, bestFinish: 'Group Stage', totalGoals: 0,  totalMatches: 0 },
    COD: { totalAppearances: 2,  titles: 0, titleYears: [],                 finals: 0, semiFinals: 0, bestFinish: 'Group Stage', totalGoals: 2,  totalMatches: 6 },
    UZB: { totalAppearances: 1,  titles: 0, titleYears: [],                 finals: 0, semiFinals: 0, bestFinish: 'Group Stage', totalGoals: 0,  totalMatches: 0 },
    JOR: { totalAppearances: 1,  titles: 0, titleYears: [],                 finals: 0, semiFinals: 0, bestFinish: 'Group Stage', totalGoals: 0,  totalMatches: 0 }
  }

};

// ═══════════════════════════════════════════════════════════════════
//  UTILITY HELPERS  (read-only convenience methods)
// ═══════════════════════════════════════════════════════════════════

/**
 * Get all matches for a specific group.
 * @param {string} groupLetter - e.g. 'A'
 * @returns {Array} fixtures in that group
 */
window.WC2026_DATA.getGroupFixtures = function (groupLetter) {
  return this.fixtures.filter(function (f) { return f.group === groupLetter; });
};

/**
 * Get all matches for a specific team (by code).
 * @param {string} teamCode - e.g. 'ARG'
 * @returns {Array} fixtures involving that team
 */
window.WC2026_DATA.getTeamFixtures = function (teamCode) {
  return this.fixtures.filter(function (f) {
    return f.homeTeam === teamCode || f.awayTeam === teamCode;
  });
};

/**
 * Get current group standings (computed from finished fixtures).
 * @param {string} groupLetter - e.g. 'A'
 * @returns {Array} sorted standings array
 */
window.WC2026_DATA.getGroupStandings = function (groupLetter) {
  var group = this.groups[groupLetter];
  if (!group) return [];

  var teams = group.teams;
  var fixtures = this.getGroupFixtures(groupLetter).filter(function (f) {
    return f.status === 'finished';
  });

  var standings = {};
  teams.forEach(function (code) {
    standings[code] = {
      team: code,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0
    };
  });

  fixtures.forEach(function (f) {
    var h = standings[f.homeTeam];
    var a = standings[f.awayTeam];
    if (!h || !a) return;

    h.played++;
    a.played++;
    h.goalsFor += f.homeScore;
    h.goalsAgainst += f.awayScore;
    a.goalsFor += f.awayScore;
    a.goalsAgainst += f.homeScore;

    if (f.homeScore > f.awayScore) {
      h.won++;
      h.points += 3;
      a.lost++;
    } else if (f.homeScore < f.awayScore) {
      a.won++;
      a.points += 3;
      h.lost++;
    } else {
      h.drawn++;
      a.drawn++;
      h.points += 1;
      a.points += 1;
    }
  });

  var result = Object.keys(standings).map(function (k) {
    var s = standings[k];
    s.goalDifference = s.goalsFor - s.goalsAgainst;
    return s;
  });

  result.sort(function (a, b) {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return 0;
  });

  return result;
};

/**
 * Get the head-to-head record between two teams.
 * @param {string} code1 - team code
 * @param {string} code2 - team code
 * @returns {Object|null} H2H record or null
 */
window.WC2026_DATA.getHeadToHead = function (code1, code2) {
  var key1 = code1 + '_' + code2;
  var key2 = code2 + '_' + code1;
  return this.headToHead[key1] || this.headToHead[key2] || null;
};

/**
 * Get all finished matches.
 * @returns {Array} finished fixtures
 */
window.WC2026_DATA.getFinishedMatches = function () {
  return this.fixtures.filter(function (f) { return f.status === 'finished'; });
};

/**
 * Get all scheduled (upcoming) matches.
 * @returns {Array} scheduled fixtures
 */
window.WC2026_DATA.getScheduledMatches = function () {
  return this.fixtures.filter(function (f) { return f.status === 'scheduled'; });
};

/**
 * Get fixtures by round.
 * @param {string} round - e.g. 'Group Stage', 'Round of 32', 'Round of 16', 'Quarter-Final', 'Semi-Final', 'Final'
 * @returns {Array} fixtures
 */
window.WC2026_DATA.getFixturesByRound = function (round) {
  return this.fixtures.filter(function (f) { return f.round === round; });
};

/**
 * Get team info by code.
 * @param {string} code - e.g. 'ARG'
 * @returns {Object|null}
 */
window.WC2026_DATA.getTeam = function (code) {
  return this.teams[code] || null;
};

/**
 * Get teams by confederation.
 * @param {string} confed - e.g. 'UEFA'
 * @returns {Array} team objects
 */
window.WC2026_DATA.getTeamsByConfederation = function (confed) {
  var t = this.teams;
  return Object.keys(t).filter(function (k) {
    return t[k].confederation === confed;
  }).map(function (k) { return t[k]; });
};

/**
 * Get matches on a specific date.
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @returns {Array} fixtures on that date
 */
window.WC2026_DATA.getMatchesByDate = function (dateStr) {
  return this.fixtures.filter(function (f) {
    return f.date && f.date.substring(0, 10) === dateStr;
  });
};

console.log('[WC2026 Data] Loaded: ' +
  Object.keys(window.WC2026_DATA.teams).length + ' teams, ' +
  window.WC2026_DATA.fixtures.length + ' fixtures, ' +
  Object.keys(window.WC2026_DATA.stadiums).length + ' stadiums, ' +
  window.WC2026_DATA.referees.length + ' referees');
