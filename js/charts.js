/**
 * World Cup 2026 – Canvas Chart Renderer
 * All static methods, no dependencies, dark-theme aware.
 *
 * Exposed as: window.ChartRenderer
 */
(function () {
  'use strict';

  /* ──────────────────────────────────────────────
   *  Helpers
   * ────────────────────────────────────────────── */

  /** Resolve a canvas element, apply high-DPI scaling, and return { canvas, ctx, w, h } */
  function prepCanvas(canvasId) {
    var canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
    if (!canvas) throw new Error('Canvas not found: ' + canvasId);
    var parent = canvas.parentElement;
    var dpr = window.devicePixelRatio || 1;
    var rect = parent ? parent.getBoundingClientRect() : canvas.getBoundingClientRect();
    var w = rect.width || canvas.width || 400;
    var h = rect.height || canvas.height || 400;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    return { canvas: canvas, ctx: ctx, w: w, h: h, dpr: dpr };
  }

  function clearCanvas(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
  }

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp01(v) { return Math.max(0, Math.min(1, v)); }

  /** Easing: ease-out cubic */
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  /** Hex to RGBA */
  function hexToRGBA(hex, alpha) {
    hex = hex.replace('#', '');
    var r = parseInt(hex.substring(0, 2), 16);
    var g = parseInt(hex.substring(2, 4), 16);
    var b = parseInt(hex.substring(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + (alpha != null ? alpha : 1) + ')';
  }

  /** Generic animation driver */
  function animate(durationMs, drawFrame, onComplete) {
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var elapsed = ts - start;
      var t = clamp01(elapsed / durationMs);
      drawFrame(easeOut(t));
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        if (onComplete) onComplete();
      }
    }
    requestAnimationFrame(step);
  }

  /* ──────────────────────────────────────────────
   *  Theme constants (dark theme)
   * ────────────────────────────────────────────── */
  var COLORS = {
    text:        '#E0E0E0',
    textDim:     '#9E9E9E',
    gridLine:    'rgba(255,255,255,0.08)',
    gridLineAlt: 'rgba(255,255,255,0.15)',
    homeWin:     '#4CAF50',
    draw:        '#9E9E9E',
    awayWin:     '#F44336',
    homeBlue:    '#42A5F5',
    awayOrange:  '#FF9800',
    gauge: {
      low:    '#F44336',
      mid:    '#FFEB3B',
      high:   '#4CAF50'
    },
    group: {
      first:   '#4CAF50',
      second:  '#FFC107',
      third:   '#FF9800',
      elim:    '#F44336'
    },
    heatmapLow:  [103, 58, 183],  // deep purple
    heatmapHigh: [0, 150, 136]    // teal
  };

  /* ──────────────────────────────────────────────
   *  ChartRenderer (all static)
   * ────────────────────────────────────────────── */
  function ChartRenderer() {}

  /* ====================================================================
   *  1. RADAR CHART
   * ==================================================================== */
  ChartRenderer.drawRadarChart = function (canvasId, homeStats, awayStats, labels, homeColor, awayColor) {
    homeColor = homeColor || COLORS.homeBlue;
    awayColor = awayColor || COLORS.awayOrange;
    labels = labels || ['Attack', 'Defense', 'Form', 'Experience', 'Ranking', 'Style'];
    var numAxes = labels.length;

    var c = prepCanvas(canvasId);
    var ctx = c.ctx, W = c.w, H = c.h;

    var cx = W / 2;
    var cy = H / 2;
    var radius = Math.min(W, H) * 0.34;
    var labelOffset = 22;
    var angleStep = (2 * Math.PI) / numAxes;
    var startAngle = -Math.PI / 2;

    function pointOnAxis(axisIndex, value) {
      var angle = startAngle + axisIndex * angleStep;
      return {
        x: cx + Math.cos(angle) * radius * value,
        y: cy + Math.sin(angle) * radius * value
      };
    }

    function drawFrame(progress) {
      clearCanvas(ctx, W, H);

      // Grid rings (5 levels)
      for (var r = 1; r <= 5; r++) {
        ctx.beginPath();
        var rv = r / 5;
        for (var ai = 0; ai <= numAxes; ai++) {
          var p = pointOnAxis(ai % numAxes, rv);
          ai === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.strokeStyle = r === 5 ? COLORS.gridLineAlt : COLORS.gridLine;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Axis lines
      for (var ax = 0; ax < numAxes; ax++) {
        var ep = pointOnAxis(ax, 1);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ep.x, ep.y);
        ctx.strokeStyle = COLORS.gridLine;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Data polygons
      function drawPoly(stats, color) {
        ctx.beginPath();
        for (var si = 0; si <= numAxes; si++) {
          var val = clamp01((stats[si % numAxes] || 0) * progress);
          var pt = pointOnAxis(si % numAxes, val);
          si === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y);
        }
        ctx.closePath();
        ctx.fillStyle = hexToRGBA(color, 0.2);
        ctx.fill();
        ctx.strokeStyle = hexToRGBA(color, 0.85);
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // dots
        for (var di = 0; di < numAxes; di++) {
          var dv = clamp01((stats[di] || 0) * progress);
          var dp = pointOnAxis(di, dv);
          ctx.beginPath();
          ctx.arc(dp.x, dp.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        }
      }

      drawPoly(homeStats, homeColor);
      drawPoly(awayStats, awayColor);

      // Labels
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillStyle = COLORS.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (var li = 0; li < numAxes; li++) {
        var lp = pointOnAxis(li, 1);
        var angle = startAngle + li * angleStep;
        var lx = lp.x + Math.cos(angle) * labelOffset;
        var ly = lp.y + Math.sin(angle) * labelOffset;
        ctx.fillText(labels[li], lx, ly);
      }

      // Legend
      var legendY = H - 20;
      ctx.font = 'bold 12px system-ui, sans-serif';
      // home
      ctx.fillStyle = homeColor;
      ctx.fillRect(W / 2 - 100, legendY - 6, 12, 12);
      ctx.fillStyle = COLORS.text;
      ctx.textAlign = 'left';
      ctx.fillText('Home', W / 2 - 84, legendY);
      // away
      ctx.fillStyle = awayColor;
      ctx.fillRect(W / 2 + 20, legendY - 6, 12, 12);
      ctx.fillStyle = COLORS.text;
      ctx.fillText('Away', W / 2 + 36, legendY);
    }

    animate(800, drawFrame);
  };

  /* ====================================================================
   *  2. SCORE HEATMAP
   * ==================================================================== */
  ChartRenderer.drawScoreHeatmap = function (canvasId, scoreMatrix, homeTeam, awayTeam) {
    var c = prepCanvas(canvasId);
    var ctx = c.ctx, W = c.w, H = c.h;
    var rows = 7, cols = 7; // 0-6
    var headerSize = 36;
    var padding = 8;
    var cellW = (W - headerSize - padding * 2) / cols;
    var cellH = (H - headerSize - padding * 2 - 24) / rows; // extra 24 for top label

    // find max probability for colour scaling
    var maxProb = 0;
    for (var i = 0; i < rows; i++) {
      for (var j = 0; j < cols; j++) {
        var v = (scoreMatrix[i] && scoreMatrix[i][j]) || 0;
        if (v > maxProb) maxProb = v;
      }
    }

    // find predicted score (max prob cell)
    var predI = 0, predJ = 0, predMax = 0;
    for (var pi = 0; pi < rows; pi++) {
      for (var pj = 0; pj < cols; pj++) {
        var pv = (scoreMatrix[pi] && scoreMatrix[pi][pj]) || 0;
        if (pv > predMax) { predMax = pv; predI = pi; predJ = pj; }
      }
    }

    function drawFrame(progress) {
      clearCanvas(ctx, W, H);

      var ox = headerSize + padding;
      var oy = headerSize + padding;

      // Top label (away team)
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.fillStyle = COLORS.text;
      ctx.textAlign = 'center';
      ctx.fillText((awayTeam || 'Away') + ' Goals →', ox + (cols * cellW) / 2, 14);

      // Left label (home team)
      ctx.save();
      ctx.translate(12, oy + (rows * cellH) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText((homeTeam || 'Home') + ' Goals →', 0, 0);
      ctx.restore();

      // Column headers
      ctx.font = '12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      for (var ch = 0; ch < cols; ch++) {
        ctx.fillStyle = COLORS.textDim;
        ctx.fillText('' + ch, ox + ch * cellW + cellW / 2, oy - 4);
      }

      // Row headers
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (var rh = 0; rh < rows; rh++) {
        ctx.fillStyle = COLORS.textDim;
        ctx.fillText('' + rh, ox - 6, oy + rh * cellH + cellH / 2);
      }

      // Cells
      for (var ci = 0; ci < rows; ci++) {
        for (var cj = 0; cj < cols; cj++) {
          var val = ((scoreMatrix[ci] && scoreMatrix[ci][cj]) || 0) * progress;
          var t = maxProb > 0 ? val / maxProb : 0;
          // interpolate colour from purple to teal
          var r = Math.round(lerp(COLORS.heatmapLow[0], COLORS.heatmapHigh[0], t));
          var g = Math.round(lerp(COLORS.heatmapLow[1], COLORS.heatmapHigh[1], t));
          var b = Math.round(lerp(COLORS.heatmapLow[2], COLORS.heatmapHigh[2], t));
          var alpha = 0.15 + t * 0.85;

          var x = ox + cj * cellW;
          var y = oy + ci * cellH;

          ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
          ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);

          // Highlight predicted score cell
          if (ci === predI && cj === predJ) {
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(x + 1, y + 1, cellW - 2, cellH - 2);
          }

          // Percentage text
          var pct = (val * 100).toFixed(1);
          ctx.font = (cellW > 44 ? '11' : '9') + 'px system-ui, sans-serif';
          ctx.fillStyle = t > 0.4 ? '#FFFFFF' : COLORS.textDim;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(pct + '%', x + cellW / 2, y + cellH / 2);
        }
      }
    }

    animate(900, drawFrame);
  };

  /* ====================================================================
   *  3. PROBABILITY BARS
   * ==================================================================== */
  ChartRenderer.drawProbabilityBars = function (canvasId, homeWin, draw, awayWin, homeTeam, awayTeam) {
    var c = prepCanvas(canvasId);
    var ctx = c.ctx, W = c.w, H = c.h;

    var barY = H * 0.35;
    var barH = H * 0.30;
    var marginX = 12;
    var barW = W - marginX * 2;

    function drawFrame(progress) {
      clearCanvas(ctx, W, H);

      // Team names
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = COLORS.homeWin;
      ctx.textAlign = 'left';
      ctx.fillText(homeTeam || 'Home', marginX, barY - 8);

      ctx.fillStyle = COLORS.awayWin;
      ctx.textAlign = 'right';
      ctx.fillText(awayTeam || 'Away', W - marginX, barY - 8);

      ctx.fillStyle = COLORS.draw;
      ctx.textAlign = 'center';
      ctx.fillText('Draw', W / 2, barY - 8);

      // Rounded background
      var cornerR = barH / 2;
      ctx.beginPath();
      ctx.roundRect(marginX, barY, barW, barH, cornerR);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fill();

      // Sections
      var hw = homeWin * barW * progress;
      var dw = draw * barW * progress;
      var aw = awayWin * barW * progress;

      // Home win section
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(marginX, barY, barW, barH, cornerR);
      ctx.clip();

      ctx.fillStyle = COLORS.homeWin;
      ctx.fillRect(marginX, barY, hw, barH);

      ctx.fillStyle = COLORS.draw;
      ctx.fillRect(marginX + hw, barY, dw, barH);

      ctx.fillStyle = COLORS.awayWin;
      ctx.fillRect(marginX + hw + dw, barY, aw, barH);
      ctx.restore();

      // Percentages inside bar
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textBaseline = 'middle';
      var midY = barY + barH / 2;

      if (hw > 40) {
        ctx.textAlign = 'center';
        ctx.fillText((homeWin * 100 * progress).toFixed(1) + '%', marginX + hw / 2, midY);
      }
      if (dw > 40) {
        ctx.textAlign = 'center';
        ctx.fillText((draw * 100 * progress).toFixed(1) + '%', marginX + hw + dw / 2, midY);
      }
      if (aw > 40) {
        ctx.textAlign = 'center';
        ctx.fillText((awayWin * 100 * progress).toFixed(1) + '%', marginX + hw + dw + aw / 2, midY);
      }

      // Bottom labels: 1X2
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillStyle = COLORS.textDim;
      ctx.textBaseline = 'top';
      var bottomY = barY + barH + 10;
      ctx.textAlign = 'left';
      ctx.fillText('Win', marginX, bottomY);
      ctx.textAlign = 'center';
      ctx.fillText('Draw', W / 2, bottomY);
      ctx.textAlign = 'right';
      ctx.fillText('Win', W - marginX, bottomY);
    }

    animate(700, drawFrame);
  };

  /* ====================================================================
   *  4. CONFIDENCE GAUGE
   * ==================================================================== */
  ChartRenderer.drawConfidenceGauge = function (canvasId, confidence) {
    var c = prepCanvas(canvasId);
    var ctx = c.ctx, W = c.w, H = c.h;

    var cx = W / 2;
    var cy = H * 0.65;
    var outerR = Math.min(W, H) * 0.40;
    var innerR = outerR * 0.72;
    var needleLen = outerR * 0.88;

    // Confidence value 0-1
    confidence = clamp01(confidence);

    function gaugeGradient(t) {
      // 0 → red, 0.5 → yellow, 1 → green
      if (t < 0.5) {
        var r = 244, g = Math.round(lerp(67, 235, t * 2)), b = Math.round(lerp(54, 59, t * 2));
        return 'rgb(' + r + ',' + g + ',' + b + ')';
      }
      var r2 = Math.round(lerp(255, 76, (t - 0.5) * 2));
      var g2 = Math.round(lerp(235, 175, (t - 0.5) * 2));
      var b2 = Math.round(lerp(59, 80, (t - 0.5) * 2));
      return 'rgb(' + r2 + ',' + g2 + ',' + b2 + ')';
    }

    function confLabel(v) {
      if (v < 0.35) return 'Low';
      if (v < 0.65) return 'Medium';
      return 'High';
    }

    function drawFrame(progress) {
      clearCanvas(ctx, W, H);

      var curConf = confidence * progress;

      // Arc background
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, Math.PI, 0, false);
      ctx.arc(cx, cy, innerR, 0, Math.PI, true);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fill();

      // Coloured arc segments (60 slices)
      var segments = 60;
      for (var s = 0; s < segments; s++) {
        var t = s / segments;
        if (t > curConf) break;
        var a1 = Math.PI + t * Math.PI;
        var a2 = Math.PI + (t + 1 / segments) * Math.PI + 0.01;
        ctx.beginPath();
        ctx.arc(cx, cy, outerR, a1, a2, false);
        ctx.arc(cx, cy, innerR, a2, a1, true);
        ctx.closePath();
        ctx.fillStyle = gaugeGradient(t);
        ctx.fill();
      }

      // Tick marks
      ctx.strokeStyle = COLORS.text;
      ctx.lineWidth = 1.5;
      for (var tk = 0; tk <= 10; tk++) {
        var ta = Math.PI + (tk / 10) * Math.PI;
        var tx1 = cx + Math.cos(ta) * (outerR + 4);
        var ty1 = cy + Math.sin(ta) * (outerR + 4);
        var tx2 = cx + Math.cos(ta) * (outerR + (tk % 5 === 0 ? 14 : 8));
        var ty2 = cy + Math.sin(ta) * (outerR + (tk % 5 === 0 ? 14 : 8));
        ctx.beginPath();
        ctx.moveTo(tx1, ty1);
        ctx.lineTo(tx2, ty2);
        ctx.stroke();
      }

      // Tick labels 0, 50, 100
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillStyle = COLORS.textDim;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('0', cx + Math.cos(Math.PI) * (outerR + 22), cy + Math.sin(Math.PI) * (outerR + 22));
      ctx.fillText('50', cx + Math.cos(Math.PI * 1.5) * (outerR + 22), cy + Math.sin(Math.PI * 1.5) * (outerR + 22) - 4);
      ctx.fillText('100', cx + Math.cos(Math.PI * 2) * (outerR + 22), cy + Math.sin(Math.PI * 2) * (outerR + 22));

      // Needle
      var needleAngle = Math.PI + curConf * Math.PI;
      var nx = cx + Math.cos(needleAngle) * needleLen;
      var ny = cy + Math.sin(needleAngle) * needleLen;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(nx, ny);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Center cap
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      // Percentage label
      ctx.font = 'bold 28px system-ui, sans-serif';
      ctx.fillStyle = COLORS.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText((curConf * 100).toFixed(0) + '%', cx, cy + 16);

      // Confidence level text
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillStyle = gaugeGradient(curConf);
      ctx.fillText(confLabel(curConf) + ' Confidence', cx, cy + 48);
    }

    animate(1000, drawFrame);
  };

  /* ====================================================================
   *  5. FACTORS CHART  (horizontal diverging bars)
   * ==================================================================== */
  ChartRenderer.drawFactorsChart = function (canvasId, factors) {
    var c = prepCanvas(canvasId);
    var ctx = c.ctx, W = c.w, H = c.h;

    if (!factors || !factors.length) return;

    // Sort by absolute impact descending
    var sorted = factors.slice().sort(function (a, b) {
      return Math.abs(b.impact) - Math.abs(a.impact);
    });

    var n = sorted.length;
    var labelWidth = W * 0.32;
    var barAreaW = (W - labelWidth) / 2;
    var centerX = W / 2;
    var topPad = 20;
    var rowH = Math.min((H - topPad - 10) / n, 28);
    var barMaxW = barAreaW - 12;
    var maxImpact = 0;
    for (var mi = 0; mi < n; mi++) {
      if (Math.abs(sorted[mi].impact) > maxImpact) maxImpact = Math.abs(sorted[mi].impact);
    }
    if (maxImpact === 0) maxImpact = 0.01;

    function drawFrame(progress) {
      clearCanvas(ctx, W, H);

      // Center axis
      ctx.beginPath();
      ctx.moveTo(centerX, topPad);
      ctx.lineTo(centerX, topPad + n * rowH);
      ctx.strokeStyle = COLORS.gridLineAlt;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Header
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = COLORS.homeBlue;
      ctx.textAlign = 'right';
      ctx.fillText('← Home Adv.', centerX - 6, topPad - 4);
      ctx.fillStyle = COLORS.awayOrange;
      ctx.textAlign = 'left';
      ctx.fillText('Away Adv. →', centerX + 6, topPad - 4);

      for (var fi = 0; fi < n; fi++) {
        var f = sorted[fi];
        var y = topPad + fi * rowH;
        var midY = y + rowH / 2;

        // Factor label (centred on axis)
        ctx.font = '11px system-ui, sans-serif';
        ctx.fillStyle = COLORS.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // We'll shift the label slightly based on advantage to not overlap bar
        var labelX = centerX;

        // Bar
        var impact = f.impact * progress;
        var barLen = (impact / maxImpact) * barMaxW;
        var barH = rowH * 0.55;

        if (f.advantage === 'home') {
          ctx.fillStyle = hexToRGBA(COLORS.homeBlue, 0.75);
          ctx.fillRect(centerX - barLen, midY - barH / 2, barLen, barH);
          // Round end
          ctx.beginPath();
          ctx.arc(centerX - barLen, midY, barH / 2, Math.PI / 2, -Math.PI / 2);
          ctx.fill();
        } else if (f.advantage === 'away') {
          ctx.fillStyle = hexToRGBA(COLORS.awayOrange, 0.75);
          ctx.fillRect(centerX, midY - barH / 2, barLen, barH);
          ctx.beginPath();
          ctx.arc(centerX + barLen, midY, barH / 2, -Math.PI / 2, Math.PI / 2);
          ctx.fill();
        }

        // Draw factor name – position it at the start (left margin) so it doesn't overlap bars
        ctx.font = '10px system-ui, sans-serif';
        ctx.fillStyle = COLORS.text;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(f.name, centerX - barMaxW - 14, midY);

        // Impact value at bar end
        if (barLen > 8) {
          ctx.font = '9px system-ui, sans-serif';
          ctx.fillStyle = '#FFFFFF';
          if (f.advantage === 'home') {
            ctx.textAlign = 'right';
            ctx.fillText((impact * 100).toFixed(1) + '%', centerX - barLen - 4 + barLen - 2, midY);
          } else if (f.advantage === 'away') {
            ctx.textAlign = 'left';
            ctx.fillText((impact * 100).toFixed(1) + '%', centerX + 4, midY);
          }
        }
      }
    }

    animate(850, drawFrame);
  };

  /* ====================================================================
   *  6. GROUP CHART (stacked horizontal bars)
   * ==================================================================== */
  ChartRenderer.drawGroupChart = function (canvasId, teams, probabilities) {
    var c = prepCanvas(canvasId);
    var ctx = c.ctx, W = c.w, H = c.h;

    if (!teams || !teams.length) return;
    var n = teams.length;

    var leftMargin = W * 0.22;
    var rightMargin = 14;
    var topPad = 16;
    var bottomPad = 30;
    var barAreaW = W - leftMargin - rightMargin;
    var rowH = Math.min((H - topPad - bottomPad) / n, 42);
    var barH = rowH * 0.60;
    var gap = (rowH - barH) / 2;

    var segColors = [COLORS.group.first, COLORS.group.second, COLORS.group.third, COLORS.group.elim];
    var segLabels = ['1st', '2nd', '3rd', 'Out'];

    function drawFrame(progress) {
      clearCanvas(ctx, W, H);

      for (var ti = 0; ti < n; ti++) {
        var team = teams[ti];
        var probs = probabilities[team] || probabilities[ti] || {};
        var positions = probs.positions || [probs.first || 0, probs.second || 0, probs.third || 0, probs.fourth || 0];

        var y = topPad + ti * rowH + gap;

        // Team name
        ctx.font = 'bold 13px system-ui, sans-serif';
        ctx.fillStyle = COLORS.text;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(typeof team === 'string' ? team : (team.name || team.code || ''), leftMargin - 10, y + barH / 2);

        // Stacked bar
        var xOff = leftMargin;
        for (var si = 0; si < positions.length && si < 4; si++) {
          var segW = positions[si] * barAreaW * progress;
          if (segW < 0.5) { continue; }
          ctx.fillStyle = segColors[si] || COLORS.group.elim;

          // Round first and last segments
          if (si === 0 && segW > 4) {
            ctx.beginPath();
            ctx.roundRect(xOff, y, segW, barH, [barH / 4, 0, 0, barH / 4]);
            ctx.fill();
          } else if (si === positions.length - 1 && segW > 4) {
            ctx.beginPath();
            ctx.roundRect(xOff, y, segW, barH, [0, barH / 4, barH / 4, 0]);
            ctx.fill();
          } else {
            ctx.fillRect(xOff, y, segW, barH);
          }

          // Percentage in segment if wide enough
          if (segW > 30) {
            ctx.font = '10px system-ui, sans-serif';
            ctx.fillStyle = '#000000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText((positions[si] * 100 * progress).toFixed(0) + '%', xOff + segW / 2, y + barH / 2);
          }
          xOff += segW;
        }
      }

      // Legend at bottom
      var legendY = topPad + n * rowH + 8;
      var legendX = leftMargin;
      ctx.font = '11px system-ui, sans-serif';
      for (var li = 0; li < segLabels.length; li++) {
        ctx.fillStyle = segColors[li];
        ctx.fillRect(legendX, legendY, 12, 12);
        ctx.fillStyle = COLORS.text;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(segLabels[li], legendX + 16, legendY + 6);
        legendX += 60;
      }
    }

    animate(750, drawFrame);
  };

  /* ──────────────────────────────────────────────
   *  Expose on window
   * ────────────────────────────────────────────── */
  window.ChartRenderer = ChartRenderer;

})();
