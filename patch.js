const fs = require('fs');
let code = fs.readFileSync('js/api.js', 'utf8');

const regex = /mergeApiMatches\(localMatches, apiMatches\) \{[\s\S]*?\n    \}\n/m;

const newCode = `mergeApiMatches(localMatches, apiMatches) {
      if (!apiMatches || !Array.isArray(apiMatches) || apiMatches.length === 0) return;
      
      apiMatches.forEach(apiMatch => {
        let homeName = '', awayName = '', homeScore = null, awayScore = null, statusStr = '';
        if (apiMatch.teams) {
           homeName = apiMatch.teams.home.name || '';
           awayName = apiMatch.teams.away.name || '';
           homeScore = apiMatch.goals ? apiMatch.goals.home : null;
           awayScore = apiMatch.goals ? apiMatch.goals.away : null;
           if (apiMatch.fixture && apiMatch.fixture.status) {
              statusStr = this.normalizeStatus(apiMatch.fixture.status.short);
           }
        } else if (apiMatch.homeTeam) {
           homeName = apiMatch.homeTeam.name || apiMatch.homeTeam.tla || '';
           awayName = apiMatch.awayTeam.name || apiMatch.awayTeam.tla || '';
           homeScore = apiMatch.score && apiMatch.score.fullTime ? apiMatch.score.fullTime.home : null;
           awayScore = apiMatch.score && apiMatch.score.fullTime ? apiMatch.score.fullTime.away : null;
           statusStr = this.normalizeStatus(apiMatch.status);
        } else return;

        const localMatch = localMatches.find(l => {
          const lHome = l.homeTeam.name || '';
          const lAway = l.awayTeam.name || '';
          const lCodeHome = l.homeTeam.code || '';
          const lCodeAway = l.awayTeam.code || '';
          return (lHome.includes(homeName) || homeName.includes(lHome) || lCodeHome === homeName) &&
                 (lAway.includes(awayName) || awayName.includes(lAway) || lCodeAway === awayName);
        });

        if (localMatch) {
          if (homeScore !== null) localMatch.score.home = homeScore;
          if (awayScore !== null) localMatch.score.away = awayScore;
          if (statusStr) localMatch.status = statusStr;
        }
      });
    }\n`;

code = code.replace(regex, newCode);
fs.writeFileSync('js/api.js', code);
console.log("Patched api.js successfully!");
