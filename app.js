(() => {
  const palette = ['#df7457', '#4d82ae', '#74a55e', '#a071b1', '#d4a341', '#4d9b91', '#db6886', '#747c8d'];
  const storageKey = 'ctvereckovana-prototype-v6';
  const weapon = { range: 3, endWidth: 3 };
  const targetPoint = { x: 8, y: 0, altitude: 0, points: 1 };
  const mapBounds = { minX: -15, maxX: 15, minY: -15, maxY: 15 };
  // Moving targets advance by this map vector after each aircraft turn.
  // Puzzle levels can set movingTargetEscapeIsLoss to make an escape a failure.
  const levelDefinition = {
    type: 'arcade',
    rules: { movingTargetEscapeIsLoss: false },
    movingTargets: [
      { id: 'car-1', kind: 'car', name: 'Auto', position: { x: -7, y: 2 }, movementVector: { x: 1, y: 0 }, altitude: 0, points: 2 },
      { id: 'truck-1', kind: 'truck', name: 'Náklaďák', position: { x: 4, y: -7 }, movementVector: { x: 0, y: 1 }, altitude: 0, points: 2 },
      { id: 'boat-1', kind: 'boat', name: 'Loď', position: { x: 12, y: -12 }, movementVector: { x: 0, y: 1 }, altitude: 0, points: 2 }
    ]
  };
  const obstacles = [
    { name: 'hora', altitude: 5, polygon: [{ x: 3.15, y: 4.55 }, { x: 4, y: 3.05 }, { x: 4.9, y: 4.55 }] },
    { name: 'mrakodrap', altitude: 3, polygon: [{ x: 9.55, y: 4.8 }, { x: 9.55, y: 3.2 }, { x: 10.45, y: 3.2 }, { x: 10.45, y: 4.8 }] },
    { name: 'větrná elektrárna', altitude: 2, lines: [
      { from: { x: -0.12, y: 8.45 }, to: { x: 0.12, y: 8.45 }, width: 0.1 },
      { from: { x: 0, y: 8.4 }, to: { x: 0, y: 7.2 }, width: 0.07 },
      { from: { x: 0, y: 7.2 }, to: { x: 0, y: 6.55 }, width: 0.07 },
      { from: { x: 0, y: 7.2 }, to: { x: -0.57, y: 7.53 }, width: 0.07 },
      { from: { x: 0, y: 7.2 }, to: { x: 0.57, y: 7.53 }, width: 0.07 }
    ] }
  ];
  const canvas = document.querySelector('#board');
  const ctx = canvas.getContext('2d');
  const weatherCanvas = document.createElement('canvas');
  const weatherCtx = weatherCanvas.getContext('2d');
  const viewport = document.querySelector('#boardViewport');
  const playerList = document.querySelector('#players');
  const dialog = document.querySelector('#confirmDialog');
  const menuDialog = document.querySelector('#menuDialog');
  let state = load();
  let dpr = 1;
  let view = { scale: 40, x: 0, y: 0 };
  let fitMode = true;
  let animation = null;
  const pointers = new Map();
  let gesture = null;

  function freshState() {
    return {
      // A player owns aircraft; each aircraft references its own runway.
      // The first prototype still exposes only the first aircraft in the UI.
      players: [{ id: 'player-1', name: 'Hráč', color: '#111714', aircraft: [
        { id: 'aircraft-1', name: 'F-16', start: { x: 0, y: 0 }, runwayId: 'runway-1' }
      ] }],
      runways: [{ id: 'runway-1', center: { x: 0, y: 0 }, axis: 'horizontal', length: 5 }],
      current: 0,
      activeAircraftId: 'aircraft-1',
      playMode: 'puzzle',
      levelId: 'puzzle-1',
      menuSettings: {
        arcadeAircraft: 'f16', arcadeDifficulty: 'normal',
        multiplayerPlayers: '2', multiplayerControl: 'human', multiplayerAircraft: 'f16',
        multiplayerFuel: '999', multiplayerAircraftCount: '1', multiplayerParallel: '1'
      },
      moves: [],
      fuel: 999,
      ammo: 999,
      score: 0,
      movingTargets: createMovingTargets(),
      levelRules: { ...levelDefinition.rules },
      mode: 'basic',
      weather: 'sunny',
      altitude: 0,
      shooting: false,
      targetDestroyed: false,
      message: '',
      runwayAxis: 'horizontal',
      flightStatus: 'ground',
      outcome: '',
      grid: true
    };
  }
  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (saved && Array.isArray(saved.players) && saved.players.length && Array.isArray(saved.moves)) {
        const restored = { ...freshState(), ...saved };
        restored.menuSettings = { ...freshState().menuSettings, ...(saved.menuSettings || {}) };
        if (!['sunny', 'night', 'storm', 'wind'].includes(restored.weather)) restored.weather = 'sunny';
        // Upgrade saves made before aircraft and runway IDs were introduced.
        restored.players = restored.players.map((player, index) => {
          const aircraft = Array.isArray(player.aircraft) && player.aircraft.length
            ? player.aircraft
            : [{ id: `aircraft-${index + 1}`, name: 'F-16', start: player.start || { x: 0, y: 0 }, runwayId: 'runway-1' }];
          return { ...player, id: player.id || `player-${index + 1}`, aircraft };
        });
        if (!Array.isArray(restored.runways) || !restored.runways.length) {
          restored.runways = [{ id: 'runway-1', center: { x: 0, y: 0 }, axis: restored.runwayAxis || 'horizontal', length: 5 }];
        }
        restored.activeAircraftId = restored.activeAircraftId || restored.players[restored.current]?.aircraft[0]?.id || 'aircraft-1';
        if (!Number.isFinite(saved.score)) restored.score = saved.targetDestroyed ? targetPoint.points : 0;
        if (!Array.isArray(restored.movingTargets)) restored.movingTargets = createMovingTargets();
        if (!restored.levelRules) restored.levelRules = { ...levelDefinition.rules };
        return restored;
      }
    } catch (_) { /* Start fresh when stored data is unavailable. */ }
    return freshState();
  }
  function save() { try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch (_) { /* The game remains playable without storage. */ } }

  function resetLevel() {
    state.moves = [];
    state.current = 0;
    state.activeAircraftId = state.players[0]?.aircraft?.[0]?.id || 'aircraft-1';
    state.flightStatus = 'ground'; state.outcome = ''; state.altitude = 0;
    state.fuel = 999; state.ammo = 999; state.score = 0;
    state.movingTargets = createMovingTargets(); state.levelRules = { ...levelDefinition.rules };
    state.shooting = false; state.targetDestroyed = false; state.message = '';
    fitMode = true;
    save(); renderPlayers(); fitView();
  }

  function showMenuScreen(screenName) {
    document.querySelectorAll('[data-menu-screen]').forEach(screen => {
      screen.hidden = screen.dataset.menuScreen !== screenName;
    });
  }
  function renderMenuSettings() {
    Object.entries(state.menuSettings).forEach(([id, value]) => {
      const field = document.getElementById(id);
      if (field) field.value = value;
    });
  }

  function createMovingTargets() {
    return levelDefinition.movingTargets.map(target => ({
      ...target,
      position: { ...target.position },
      movementVector: { ...target.movementVector },
      active: true,
      destroyed: false,
      escaped: false
    }));
  }
  function isInsideMap(point) {
    return point.x >= mapBounds.minX && point.x <= mapBounds.maxX && point.y >= mapBounds.minY && point.y <= mapBounds.maxY;
  }
  function liveTargets() {
    const targets = state.targetDestroyed ? [] : [{ id: 'house', kind: 'house', name: 'Domek', points: targetPoint.points, altitude: targetPoint.altitude, position: targetPoint }];
    (state.movingTargets || []).filter(target => target.active).forEach(target => {
      const position = { ...target.position };
      if (animation && target.id !== animation.targetId) {
        position.x += target.movementVector.x * animation.progress;
        position.y += target.movementVector.y * animation.progress;
      }
      targets.push({ ...target, position });
    });
    return targets;
  }
  function advanceMovingTargets() {
    let escaped = false;
    state.movingTargets.forEach(target => {
      if (!target.active) return;
      const next = { x: target.position.x + target.movementVector.x, y: target.position.y + target.movementVector.y };
      if (!isInsideMap(next)) {
        target.active = false;
        target.escaped = true;
        escaped = true;
      } else target.position = next;
    });
    if (escaped && state.levelRules.movingTargetEscapeIsLoss) {
      state.flightStatus = 'failed';
      state.outcome = 'Mise selhala: pohyblivý cíl opustil mapu.';
    }
  }

  // Rebuild each plane from its start and its own recorded moves.
  function aircraftFor(playerIndex, aircraftId) {
    const player = state.players[playerIndex];
    return player?.aircraft?.find(aircraft => aircraft.id === aircraftId) || player?.aircraft?.[0] || { id: `aircraft-${playerIndex + 1}`, start: player?.start || { x: 0, y: 0 }, runwayId: 'runway-1' };
  }
  function activeAircraft() {
    return aircraftFor(state.current, state.activeAircraftId);
  }
  function runwayFor(aircraft = activeAircraft()) {
    return state.runways.find(runway => runway.id === aircraft.runwayId) || state.runways[0];
  }
  function planeFor(playerIndex, aircraftId = aircraftFor(playerIndex).id) {
    const player = state.players[playerIndex];
    const aircraft = aircraftFor(playerIndex, aircraftId);
    let position = { ...aircraft.start };
    let vector = { x: 0, y: 0 };
    const trail = [position];
    let turns = 0;
    for (const move of state.moves) {
      const belongsToAircraft = move.aircraftId
        ? move.aircraftId === aircraft.id
        : move.player === playerIndex && aircraft.id === player.aircraft?.[0]?.id;
      if (!belongsToAircraft) continue;
      position = { ...move.to };
      vector = { x: move.to.x - move.from.x, y: move.to.y - move.from.y };
      trail.push(position);
      turns++;
    }
    return { position, vector, trail, turns };
  }
  function predict(plane) {
    return { x: plane.position.x + plane.vector.x, y: plane.position.y + plane.vector.y };
  }
  function weatherDirection(plane) {
    const length = Math.hypot(plane.vector.x, plane.vector.y);
    if (length > 0) return { x: plane.vector.x / length, y: plane.vector.y / length };
    return runwayFor().axis === 'vertical' ? { x: 0, y: 1 } : { x: 1, y: 0 };
  }
  function isVisible(point, plane = planeFor(state.current)) {
    if (state.weather === 'sunny' || state.weather === 'wind') return true;
    const dx = point.x - plane.position.x;
    const dy = point.y - plane.position.y;
    if (state.weather === 'storm') return Math.hypot(dx, dy) <= 5;
    const direction = weatherDirection(plane);
    const forward = dx * direction.x + dy * direction.y;
    const side = Math.abs(dx * -direction.y + dy * direction.x);
    return forward >= -0.5 && forward <= 5 && side <= 0.3 + Math.max(0, forward) * 0.3;
  }
  function applyWind(destination, plane) {
    if (state.weather !== 'wind' || onRunway(plane.position) || onRunway(destination)) return destination;
    const gust = [
      { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 0 },
      { x: 1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: 1 }, { x: 1, y: 1 }
    ][Math.floor(Math.random() * 8)];
    return { x: destination.x + gust.x, y: destination.y + gust.y };
  }
  function onRunway(point, runway = runwayFor()) {
    const center = runway.center || { x: 0, y: 0 };
    const axis = runway.axis || state.runwayAxis;
    const along = axis === 'horizontal' ? point.x - center.x : point.y - center.y;
    const across = axis === 'horizontal' ? point.y - center.y : point.x - center.x;
    return Math.abs(across) < 1e-8 && Math.abs(along) <= (runway.length || 5) / 2;
  }
  function alongRunway(vector, runway = runwayFor()) {
    if (Math.hypot(vector.x, vector.y) === 0) return true;
    return (runway.axis || state.runwayAxis) === 'horizontal' ? Math.abs(vector.y) < 1e-8 : Math.abs(vector.x) < 1e-8;
  }
  function pointSegmentDistance(point, start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;
    const t = lengthSquared ? Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared)) : 0;
    return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
  }
  function pointInPolygon(point, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const a = polygon[i]; const b = polygon[j];
      if (pointSegmentDistance(point, a, b) <= 0.008) return true;
      if ((a.y > point.y) !== (b.y > point.y) && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
    }
    return inside;
  }
  function pointHitsObstacle(point, obstacle) {
    if (obstacle.polygon && pointInPolygon(point, obstacle.polygon)) return true;
    return (obstacle.lines || []).some(part => pointSegmentDistance(point, part.from, part.to) <= part.width / 2);
  }
  function collisionOnPath(from, to, altitudeFrom, altitudeTo) {
    const length = Math.hypot(to.x - from.x, to.y - from.y);
    const steps = Math.max(1, Math.ceil(length * 200));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const point = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
      const altitude = altitudeFrom + (altitudeTo - altitudeFrom) * t;
      const obstacle = obstacles.find(item => altitude <= item.altitude && pointHitsObstacle(point, item));
      if (obstacle) return obstacle;
    }
    return null;
  }
  function evaluateMove(plane, destination, altitude) {
    const vector = { x: destination.x - plane.position.x, y: destination.y - plane.position.y };
    const speed = Math.hypot(vector.x, vector.y);
    const previousSpeed = Math.hypot(plane.vector.x, plane.vector.y);
    if (state.flightStatus === 'landed' || state.flightStatus === 'crashed') return { status: state.flightStatus, outcome: state.outcome };
    if (destination.x < mapBounds.minX || destination.x > mapBounds.maxX || destination.y < mapBounds.minY || destination.y > mapBounds.maxY) {
      return { status: 'crashed', outcome: 'Letadlo opustilo herní mapu. Hra skončila.' };
    }
    const altitudeFrom = state.mode === 'advance' ? state.altitude : 0;
    const collision = collisionOnPath(plane.position, destination, altitudeFrom, altitude);
    if (collision) return { status: 'crashed', outcome: `Letadlo narazilo do překážky (${collision.name}).` };
    if (state.mode === 'advance' && altitude === 0 && !onRunway(destination)) {
      return { status: 'crashed', outcome: 'Výška 0 mimo letiště. Letadlo havarovalo.' };
    }

    if (state.flightStatus === 'ground') {
      if (speed === 0 && onRunway(destination)) return { status: 'ground', outcome: '' };
      if (speed < 2 && speed > 0 && alongRunway(vector) && onRunway(destination)) return { status: 'ground', outcome: '' };
      if (speed >= 2 && alongRunway(vector) && onRunway(plane.position)) return { status: 'airborne', outcome: '' };
      return { status: 'crashed', outcome: 'Vzlet mimo dráhu. Letadlo havarovalo.' };
    }

    if (state.flightStatus === 'approach') {
      if (speed === 0 && onRunway(destination)) return { status: 'landed', outcome: 'Úspěšné přistání!' };
      return { status: 'crashed', outcome: 'Přistání se nepodařilo. Letadlo havarovalo.' };
    }

    if (speed === 1) {
      if (previousSpeed === 2 && alongRunway(plane.vector) && alongRunway(vector) && onRunway(destination)) {
        return { status: 'approach', outcome: '' };
      }
      return { status: 'crashed', outcome: 'Rychlost klesla na 1 mimo bezpečné přistání. Letadlo havarovalo.' };
    }
    if (speed === 0) return { status: 'crashed', outcome: 'Letadlo zastavilo mimo letiště. Letadlo havarovalo.' };
    return { status: 'airborne', outcome: '' };
  }
  function renderPlayers() {
    playerList.replaceChildren();
    state.players.forEach((player, i) => {
      const row = document.createElement('div');
      row.className = `player${i === state.current ? ' active' : ''}`;
      const dot = document.createElement('span'); dot.className = 'player-color'; dot.style.background = player.color;
      const name = document.createElement('span'); name.className = 'player-name'; name.textContent = player.name;
      const turns = document.createElement('span'); turns.className = 'player-count'; turns.textContent = `${planeFor(i).turns} tahů`;
      row.append(dot, name, turns); playerList.append(row);
    });
    const player = state.players[state.current];
    document.querySelector('#activeName').textContent = player.name;
    document.querySelector('#activeDot').style.background = player.color;
    document.querySelector('#turnBadge').textContent = '1P';
    const modeSelect = document.querySelector('#gameMode');
    modeSelect.value = state.mode;
    modeSelect.disabled = state.moves.length > 0 || !!animation;
    const weatherSelect = document.querySelector('#weatherMode');
    weatherSelect.value = state.weather;
    weatherSelect.disabled = state.moves.length > 0 || !!animation;
    document.querySelector('#flightHelp').textContent = state.shooting
      ? 'Ťukni na cíl v útočné výseči. Po výstřelu letadlo pokračuje stejným vektorem.'
      : state.mode === 'advance'
        ? 'Táhni na vybraném bodu nahoru/dolů pro změnu výšky o 1. Výška 0 mimo letiště znamená havárii.'
        : 'Rozjeď se po dráze 0 → 1 → 2. Ve vzduchu rychlost 1 znamená havárii; přistání: 2 → 1 → 0 na dráze.';
    document.querySelector('#boardHelp').textContent = state.shooting ? 'Střelba · vyber cíl v útočné výseči' : 'Ťukni na jeden z 9 bodů';
    document.querySelector('#finishTurn').hidden = state.mode === 'advance';
    const runwayButton = document.querySelector('#runwayAxis');
    runwayButton.textContent = state.runwayAxis === 'horizontal' ? 'Dráha: vodorovná ↔' : 'Dráha: svislá ↕';
    runwayButton.disabled = state.moves.length > 0 || state.flightStatus !== 'ground' || !!animation;
    const statusElement = document.querySelector('#flightStatus');
    statusElement.textContent = state.outcome || state.message;
    statusElement.classList.toggle('hidden', !state.outcome && !state.message);
    statusElement.classList.toggle('is-crashed', state.flightStatus === 'crashed' || state.flightStatus === 'failed');
    const count = state.moves.length;
    document.querySelector('#moveCount').textContent = `${count} ${count === 1 ? 'tah' : count >= 2 && count <= 4 ? 'tahy' : 'tahů'}`;
    document.querySelector('#fuelCount').textContent = state.fuel;
    document.querySelector('#ammoCount').textContent = state.ammo;
    document.querySelector('#scoreCount').textContent = state.score;
    // Keep the hint out of the target cluster, which is centered on the board.
    document.querySelector('#emptyState').classList.add('hidden');
    document.querySelector('#undo').disabled = count === 0 || !!animation;
    document.querySelector('#finishTurn').disabled = !!animation || !!state.outcome || state.fuel <= 0;
    const plane = planeFor(state.current);
    const canFire = Math.hypot(plane.vector.x, plane.vector.y) > 0;
    const hasTargets = liveTargets().length > 0;
    const fireButton = document.querySelector('#fireButton');
    fireButton.textContent = state.shooting ? 'Zrušit střelbu' : 'FIRE';
    fireButton.disabled = !!animation || !!state.outcome || !hasTargets || state.fuel <= 0 || (state.ammo <= 0 && !state.shooting) || (!canFire && !state.shooting);
    fireButton.classList.toggle('is-firing', state.shooting);
    document.querySelector('#newGame').disabled = !!animation;
    document.querySelector('#toggleGrid').classList.toggle('is-active', state.grid);
    document.querySelector('#toggleGrid').setAttribute('aria-pressed', String(state.grid));
    viewport.classList.toggle('grid-hidden', !state.grid);
  }
  function resize() {
    const rect = viewport.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (fitMode) fitView(); else draw();
  }
  function fitView() {
    const rect = viewport.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const plane = planeFor(state.current);
    const z = predict(plane);
    const runway = runwayFor();
    const runwayHalfLength = (runway.length || 5) / 2;
    const runwayEnds = [runwayPoint(-runwayHalfLength), runwayPoint(runwayHalfLength)];
    const obstaclePoints = obstacles.flatMap(obstacle => obstacle.polygon || obstacle.lines.flatMap(part => [part.from, part.to]));
    const mapCorners = [{ x: mapBounds.minX, y: mapBounds.minY }, { x: mapBounds.maxX, y: mapBounds.maxY }];
    const movingTargetPoints = (state.movingTargets || []).filter(target => target.active).map(target => target.position);
    const points = [...plane.trail, ...runwayEnds, ...obstaclePoints, ...mapCorners, ...(state.targetDestroyed ? [] : [targetPoint]), ...movingTargetPoints, { x: z.x - 1, y: z.y - 1 }, { x: z.x + 1, y: z.y + 1 }];
    const minX = Math.min(...points.map(point => point.x));
    const maxX = Math.max(...points.map(point => point.x));
    const minY = Math.min(...points.map(point => point.y));
    const maxY = Math.max(...points.map(point => point.y));
    const padding = 2.5;
    view.scale = Math.max(2, Math.min(96, (rect.width - 36) / (maxX - minX + padding * 2), (rect.height - 36) / (maxY - minY + padding * 2)));
    view.x = (minX + maxX) / 2;
    view.y = (minY + maxY) / 2;
    draw();
  }
  function followCurrent() {
    const plane = planeFor(state.current);
    const z = predict(plane);
    view.x = (plane.position.x + z.x) / 2;
    view.y = (plane.position.y + z.y) / 2;
    draw();
  }
  function zoomAt(factor, x, y) {
    const rect = viewport.getBoundingClientRect();
    const oldScale = view.scale;
    const nextScale = Math.max(2, Math.min(120, oldScale * factor));
    const worldX = view.x + (x - rect.width / 2) / oldScale;
    const worldY = view.y + (y - rect.height / 2) / oldScale;
    view.scale = nextScale;
    view.x = worldX - (x - rect.width / 2) / nextScale;
    view.y = worldY - (y - rect.height / 2) / nextScale;
    fitMode = false;
    draw();
  }
  function moveViewportToPoint(worldPoint, screenPoint) {
    const rect = viewport.getBoundingClientRect();
    view.x = worldPoint.x - (screenPoint.x - rect.width / 2) / view.scale;
    view.y = worldPoint.y - (screenPoint.y - rect.height / 2) / view.scale;
  }
  function screen(point) {
    const rect = viewport.getBoundingClientRect();
    return { x: rect.width / 2 + (point.x - view.x) * view.scale, y: rect.height / 2 + (point.y - view.y) * view.scale };
  }
  function runwayPoint(along, across = 0) {
    const runway = runwayFor();
    const center = runway.center || { x: 0, y: 0 };
    return (runway.axis || state.runwayAxis) === 'horizontal'
      ? { x: center.x + along, y: center.y + across }
      : { x: center.x + across, y: center.y + along };
  }
  function drawAircraft(position, vector) {
    const p = screen(position);
    const runway = runwayFor();
    const heading = Math.hypot(vector.x, vector.y) > 0
      ? Math.atan2(vector.y, vector.x)
      : (runway.axis || state.runwayAxis) === 'horizontal' ? 0 : Math.PI / 2;
    const size = Math.min(28, Math.max(8, view.scale * 0.65));
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(heading);
    ctx.scale(size, size);
    ctx.beginPath();
    ctx.moveTo(0.62, 0);
    ctx.lineTo(0.04, 0.09);
    ctx.lineTo(-0.12, 0.16);
    ctx.lineTo(-0.38, 0.43);
    ctx.lineTo(-0.29, 0.14);
    ctx.lineTo(-0.49, 0.20);
    ctx.lineTo(-0.40, 0);
    ctx.lineTo(-0.49, -0.20);
    ctx.lineTo(-0.29, -0.14);
    ctx.lineTo(-0.38, -0.43);
    ctx.lineTo(-0.12, -0.16);
    ctx.lineTo(0.04, -0.09);
    ctx.closePath();
    ctx.fillStyle = '#111714';
    ctx.fill();
    ctx.restore();
  }
  function drawWeatherOverlay(origin, vector, rect) {
    if (state.weather !== 'night' && state.weather !== 'storm') return;
    if (weatherCanvas.width !== canvas.width || weatherCanvas.height !== canvas.height) {
      weatherCanvas.width = canvas.width;
      weatherCanvas.height = canvas.height;
    }
    weatherCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    weatherCtx.clearRect(0, 0, rect.width, rect.height);
    weatherCtx.fillStyle = '#07172bf2';
    weatherCtx.fillRect(0, 0, rect.width, rect.height);
    weatherCtx.globalCompositeOperation = 'destination-out';
    const center = screen(origin);
    weatherCtx.beginPath();
    if (state.weather === 'storm') {
      weatherCtx.arc(center.x, center.y, 5 * view.scale, 0, Math.PI * 2);
    } else {
      const length = Math.hypot(vector.x, vector.y);
      const direction = length > 0
        ? { x: vector.x / length, y: vector.y / length }
        : weatherDirection(planeFor(state.current));
      const side = { x: -direction.y, y: direction.x };
      const at = (forward, across) => screen({ x: origin.x + direction.x * forward + side.x * across, y: origin.y + direction.y * forward + side.y * across });
      const nearLeft = at(-0.5, -0.15);
      const farLeft = at(5, -1.5);
      const farRight = at(5, 1.5);
      const nearRight = at(-0.5, 0.15);
      weatherCtx.moveTo(nearLeft.x, nearLeft.y);
      weatherCtx.lineTo(farLeft.x, farLeft.y);
      weatherCtx.lineTo(farRight.x, farRight.y);
      weatherCtx.lineTo(nearRight.x, nearRight.y);
      weatherCtx.closePath();
    }
    weatherCtx.fill();
    weatherCtx.globalCompositeOperation = 'source-over';
    ctx.drawImage(weatherCanvas, 0, 0, weatherCanvas.width, weatherCanvas.height, 0, 0, rect.width, rect.height);
  }
  function attackWedge(plane) {
    const speed = Math.hypot(plane.vector.x, plane.vector.y);
    if (!speed) return null;
    const altitude = state.mode === 'advance' ? state.altitude : 0;
    const range = Math.max(0, weapon.range - Math.abs(altitude - targetPoint.altitude));
    if (!range) return null;
    const forward = { x: plane.vector.x / speed, y: plane.vector.y / speed };
    const side = { x: -forward.y, y: forward.x };
    const end = { x: plane.position.x + forward.x * range, y: plane.position.y + forward.y * range };
    const halfWidth = weapon.endWidth / 2;
    return [plane.position, { x: end.x + side.x * halfWidth, y: end.y + side.y * halfWidth }, { x: end.x - side.x * halfWidth, y: end.y - side.y * halfWidth }];
  }
  function drawObstacles() {
    obstacles.forEach(obstacle => {
      if (obstacle.polygon) {
        const points = obstacle.polygon.map(screen);
        ctx.beginPath();
        points.forEach((point, i) => { if (!i) ctx.moveTo(point.x, point.y); else ctx.lineTo(point.x, point.y); });
        ctx.closePath();
        ctx.fillStyle = obstacle.name === 'hora' ? '#89948b' : '#778c82';
        ctx.fill(); ctx.strokeStyle = '#52635a'; ctx.lineWidth = 1.5; ctx.stroke();
      }
      (obstacle.lines || []).forEach(part => line([part.from, part.to], '#71877a', Math.max(2, part.width * view.scale)));
      const anchor = obstacle.polygon
        ? { x: obstacle.polygon.reduce((sum, point) => sum + point.x, 0) / obstacle.polygon.length, y: Math.min(...obstacle.polygon.map(point => point.y)) }
        : { x: 0.18, y: 6.55 };
      const label = screen({ x: anchor.x + 0.12, y: anchor.y - 0.16 });
      ctx.font = '600 10px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.lineWidth = 3; ctx.strokeStyle = '#fffef9'; ctx.strokeText(String(obstacle.altitude), label.x, label.y);
      ctx.fillStyle = '#34483b'; ctx.fillText(String(obstacle.altitude), label.x, label.y);
    });
  }
  function targetInWedge(plane, target) {
    const speed = Math.hypot(plane.vector.x, plane.vector.y);
    if (!speed) return false;
    const altitude = state.mode === 'advance' ? state.altitude : 0;
    const range = Math.max(0, weapon.range - Math.abs(altitude - (target.altitude || 0)));
    if (!range) return false;
    const forward = { x: plane.vector.x / speed, y: plane.vector.y / speed };
    const side = { x: -forward.y, y: forward.x };
    const dx = target.position.x - plane.position.x;
    const dy = target.position.y - plane.position.y;
    const distance = dx * forward.x + dy * forward.y;
    const lateral = Math.abs(dx * side.x + dy * side.y);
    return distance >= 0 && distance <= range && lateral <= distance * weapon.endWidth / (2 * range);
  }
  function drawWedge(plane) {
    const points = attackWedge(plane);
    if (!points) return;
    const projected = points.map(screen);
    ctx.beginPath();
    projected.forEach((point, i) => { if (!i) ctx.moveTo(point.x, point.y); else ctx.lineTo(point.x, point.y); });
    ctx.closePath();
    ctx.fillStyle = '#e29a4c26'; ctx.fill();
    ctx.strokeStyle = '#bd8048'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]); ctx.stroke(); ctx.setLineDash([]);
  }
  function drawMovingTarget(target, plane) {
    const p = screen(target.position);
    const size = Math.min(24, Math.max(12, view.scale * 0.62));
    const vector = target.movementVector;
    const heading = Math.hypot(vector.x, vector.y) ? Math.atan2(vector.y, vector.x) : 0;
    const inRange = targetInWedge(plane, target);
    const stroke = inRange ? '#3478b3' : '#71899d';
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(heading); ctx.scale(size, size);
    ctx.lineWidth = 0.055; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (target.kind === 'boat') {
      ctx.beginPath(); ctx.moveTo(0.48, 0.03); ctx.lineTo(0.3, 0.28); ctx.lineTo(-0.38, 0.28); ctx.lineTo(-0.5, 0.03); ctx.lineTo(-0.34, -0.2); ctx.lineTo(0.34, -0.2); ctx.closePath();
      ctx.fillStyle = '#f6fbff'; ctx.fill(); ctx.strokeStyle = stroke; ctx.stroke();
      ctx.fillStyle = '#d8e9f5'; ctx.fillRect(-0.13, -0.17, 0.3, 0.2);
    } else {
      const length = target.kind === 'truck' ? 0.86 : 0.66;
      ctx.fillStyle = '#f8fafb'; ctx.strokeStyle = stroke;
      ctx.beginPath(); ctx.rect(-length / 2, -0.2, length, 0.4); ctx.fill(); ctx.stroke();
      if (target.kind === 'truck') {
        ctx.beginPath(); ctx.rect(length * 0.14, -0.16, 0.24, 0.32); ctx.fillStyle = '#e2edf5'; ctx.fill(); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.rect(0.02, -0.14, 0.2, 0.28); ctx.fillStyle = '#deebf4'; ctx.fill(); ctx.stroke();
      }
      ctx.fillStyle = '#60798e';
      [-0.28, 0.18].forEach(x => { ctx.fillRect(x, -0.24, 0.13, 0.07); ctx.fillRect(x, 0.17, 0.13, 0.07); });
    }
    ctx.restore();
  }
  function drawTargets() {
    const plane = planeFor(state.current);
    liveTargets().forEach(target => {
      const p = screen(target.position);
      if (target.kind === 'house') {
        const size = Math.min(19, Math.max(10, view.scale * 0.38));
        const inRange = targetInWedge(plane, target);
        ctx.save(); ctx.translate(p.x, p.y); ctx.scale(size, size);
        ctx.beginPath(); ctx.moveTo(-0.48, -0.05); ctx.lineTo(0, -0.48); ctx.lineTo(0.48, -0.05); ctx.lineTo(0.4, 0.03); ctx.lineTo(0.4, 0.42); ctx.lineTo(-0.4, 0.42); ctx.lineTo(-0.4, 0.03); ctx.closePath();
        ctx.fillStyle = inRange ? '#e4f1fa' : '#f8fafb'; ctx.fill(); ctx.strokeStyle = inRange ? '#3478b3' : '#71899d'; ctx.lineWidth = 0.07; ctx.stroke();
        ctx.fillStyle = '#d6e7f3'; ctx.fillRect(-0.12, 0.16, 0.24, 0.26);
        ctx.restore();
      } else drawMovingTarget(target, plane);
    });
  }
  function visible(point, rect, padding = 50) {
    const p = screen(point);
    return p.x > -padding && p.x < rect.width + padding && p.y > -padding && p.y < rect.height + padding;
  }
  function line(points, color, width, dash = []) {
    if (points.length < 2) return;
    ctx.beginPath();
    points.forEach((point, i) => {
      const p = screen(point);
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash(dash);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  function drawGrid(rect) {
    if (!state.grid) return;
    const mapCorners = [
      screen({ x: mapBounds.minX, y: mapBounds.minY }),
      screen({ x: mapBounds.maxX, y: mapBounds.minY }),
      screen({ x: mapBounds.maxX, y: mapBounds.maxY }),
      screen({ x: mapBounds.minX, y: mapBounds.maxY })
    ];
    ctx.save();
    ctx.beginPath();
    mapCorners.forEach((point, i) => { if (!i) ctx.moveTo(point.x, point.y); else ctx.lineTo(point.x, point.y); });
    ctx.closePath(); ctx.clip();
    const spacing = view.scale;
    const leftWorld = view.x - rect.width / (2 * spacing);
    const rightWorld = view.x + rect.width / (2 * spacing);
    const topWorld = view.y - rect.height / (2 * spacing);
    const bottomWorld = view.y + rect.height / (2 * spacing);
    ctx.beginPath();
    for (let x = Math.floor(leftWorld); x <= Math.ceil(rightWorld); x++) {
      if (x % 5 === 0) continue;
      const p = screen({ x, y: 0 }).x;
      ctx.moveTo(p, 0); ctx.lineTo(p, rect.height);
    }
    for (let y = Math.floor(topWorld); y <= Math.ceil(bottomWorld); y++) {
      if (y % 5 === 0) continue;
      const p = screen({ x: 0, y }).y;
      ctx.moveTo(0, p); ctx.lineTo(rect.width, p);
    }
    ctx.strokeStyle = '#c8dff4'; ctx.lineWidth = 0.85; ctx.stroke();
    ctx.beginPath();
    for (let x = Math.floor(leftWorld / 5) * 5; x <= Math.ceil(rightWorld); x += 5) {
      const p = screen({ x, y: 0 }).x; ctx.moveTo(p, 0); ctx.lineTo(p, rect.height);
    }
    for (let y = Math.floor(topWorld / 5) * 5; y <= Math.ceil(bottomWorld); y += 5) {
      const p = screen({ x: 0, y }).y; ctx.moveTo(0, p); ctx.lineTo(rect.width, p);
    }
    ctx.strokeStyle = '#a9c9e9'; ctx.lineWidth = 1.15; ctx.stroke();
    ctx.restore();
  }
  function drawMapBounds() {
    line([
      { x: mapBounds.minX, y: mapBounds.minY },
      { x: mapBounds.maxX, y: mapBounds.minY },
      { x: mapBounds.maxX, y: mapBounds.maxY },
      { x: mapBounds.minX, y: mapBounds.maxY },
      { x: mapBounds.minX, y: mapBounds.minY }
    ], '#638bb3', 2.5);
  }
  function drawDecorativeMap() {
    // Pale pencil-style terrain is purely visual and stays beneath gameplay objects.
    const lake = screen({ x: -8.5, y: -7.5 });
    ctx.beginPath();
    ctx.ellipse(lake.x, lake.y, view.scale * 2.35, view.scale * 1.35, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#edf6fc'; ctx.fill(); ctx.strokeStyle = '#a9c6dc99'; ctx.lineWidth = 1.1; ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(lake.x - view.scale * 0.18, lake.y + view.scale * 0.06, view.scale * 1.82, view.scale * 0.94, -0.2, 0.2, Math.PI * 1.8);
    ctx.strokeStyle = '#a9c6dc66'; ctx.lineWidth = 0.9; ctx.stroke();

    const river = [
      { x: 11, y: -15 }, { x: 14, y: -12 }, { x: 12, y: -9 },
      { x: 10, y: -6 }, { x: 10, y: -3 }, { x: 10, y: 0 },
      { x: 10, y: 2 }, { x: 13, y: 3 }, { x: 13, y: 5 },
      { x: 14, y: 7 }, { x: 11, y: 9 }, { x: 10, y: 12 }, { x: 13, y: 15 }
    ].map(screen);
    const drawRiverStroke = (color, width) => {
      ctx.beginPath(); ctx.moveTo(river[0].x, river[0].y);
      for (let i = 1; i < river.length - 1; i += 2) ctx.quadraticCurveTo(river[i].x, river[i].y, river[i + 1].x, river[i + 1].y);
      ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
    };
    drawRiverStroke('#edf6fc', view.scale * 0.62);
    drawRiverStroke('#a9c6dc99', 1.15);
    drawRiverStroke('#fffefb99', 0.7);

    const forests = [
      { x: -11, y: 0, cols: 4, rows: 3 },
      { x: 1, y: -9, cols: 4, rows: 3 },
      { x: 1, y: 5, cols: 3, rows: 3 },
      { x: -11, y: 10, cols: 3, rows: 3 }
    ];
    forests.forEach(forest => {
      for (let row = 0; row < forest.rows; row++) for (let col = 0; col < forest.cols; col++) {
        const point = screen({ x: forest.x + col * 0.55 + (row % 2) * 0.18, y: forest.y + row * 0.52 });
        const radius = view.scale * (0.19 + ((row + col) % 2) * 0.025);
        ctx.beginPath(); ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#f4f8f2'; ctx.fill(); ctx.strokeStyle = '#aabca866'; ctx.lineWidth = 1; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(point.x, point.y + radius * 0.2); ctx.lineTo(point.x, point.y + radius * 0.7);
        ctx.strokeStyle = '#9daf9b77'; ctx.lineWidth = 0.8; ctx.stroke();
      }
    });

    function drawSettlementHouse(x, y, size = 0.34) {
      const points = [screen({ x: x - size * 0.5, y: y - size * 0.2 }), screen({ x, y: y - size * 0.62 }), screen({ x: x + size * 0.5, y: y - size * 0.2 }), screen({ x: x + size * 0.38, y: y - size * 0.2 }), screen({ x: x + size * 0.38, y: y + size * 0.45 }), screen({ x: x - size * 0.38, y: y + size * 0.45 }), screen({ x: x - size * 0.38, y: y - size * 0.2 })];
      ctx.beginPath(); points.forEach((point, i) => { if (!i) ctx.moveTo(point.x, point.y); else ctx.lineTo(point.x, point.y); });
      ctx.closePath(); ctx.fillStyle = '#fffefa'; ctx.fill(); ctx.strokeStyle = '#9daebd99'; ctx.lineWidth = 0.9; ctx.stroke();
      const door = screen({ x, y: y + size * 0.25 });
      ctx.beginPath(); ctx.moveTo(door.x, door.y); ctx.lineTo(door.x, door.y + view.scale * size * 0.2); ctx.stroke();
    }
    [[-4.4, -10.7], [-3.4, -10.2], [-4.1, -9.7], [-10.1, 7.3], [-9.2, 7.8], [-10, 8.3]].forEach(([x, y]) => drawSettlementHouse(x, y));

    const cityBuildings = [[3.8, -11.1, 0.62, 0.48], [4.55, -10.9, 0.46, 0.7], [5.15, -11.15, 0.56, 0.55], [4.05, -10.45, 0.52, 0.58], [4.8, -10.1, 0.7, 0.42]];
    cityBuildings.forEach(([x, y, width, height]) => {
      const topLeft = screen({ x, y });
      ctx.strokeStyle = '#9daebd99'; ctx.lineWidth = 0.9; ctx.fillStyle = '#f8fafb';
      ctx.fillRect(topLeft.x, topLeft.y, view.scale * width, view.scale * height);
      ctx.strokeRect(topLeft.x, topLeft.y, view.scale * width, view.scale * height);
      ctx.beginPath();
      for (let wx = x + 0.16; wx < x + width - 0.08; wx += 0.2) {
        for (let wy = y + 0.14; wy < y + height - 0.06; wy += 0.2) {
          const window = screen({ x: wx, y: wy }); ctx.rect(window.x, window.y, Math.max(1, view.scale * 0.045), Math.max(1, view.scale * 0.045));
        }
      }
      ctx.fillStyle = '#b4c9d866'; ctx.fill();
    });

    // Two small crossings sit on top of the river ribbon.
    [[-3.5, 10.2, 1.2], [7, 12.2, 1.1]].forEach(([y, x, halfWidth]) => {
      const left = screen({ x: x - halfWidth, y }); const right = screen({ x: x + halfWidth, y });
      ctx.beginPath(); ctx.moveTo(left.x, left.y); ctx.lineTo(right.x, right.y);
      ctx.strokeStyle = '#9aa9b5aa'; ctx.lineWidth = 3.2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(left.x, left.y - view.scale * 0.09); ctx.lineTo(right.x, right.y - view.scale * 0.09);
      ctx.moveTo(left.x, left.y + view.scale * 0.09); ctx.lineTo(right.x, right.y + view.scale * 0.09);
      ctx.strokeStyle = '#93a7b7aa'; ctx.lineWidth = 0.8; ctx.stroke();
    });
  }
  function draw() {
    const rect = viewport.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const plane = planeFor(state.current);
    const targetCenter = predict(plane);

    ctx.clearRect(0, 0, rect.width, rect.height);
    drawGrid(rect);
    drawDecorativeMap();
    drawMapBounds();

    const inFlight = animation;
    let aircraftPosition = plane.position;

    // Each aircraft can refer to a runway at its own location and orientation.
    const runway = runwayFor();
    const runwayHalfLength = (runway.length || 5) / 2;
    line([runwayPoint(-runwayHalfLength), runwayPoint(runwayHalfLength)], '#56645a', 5);
    line([runwayPoint(-runwayHalfLength, -0.28), runwayPoint(-runwayHalfLength, 0.28)], '#f8f8f0', 1.6);
    line([runwayPoint(runwayHalfLength, -0.28), runwayPoint(runwayHalfLength, 0.28)], '#f8f8f0', 1.6);
    drawObstacles();

    // Every player's completed flight path remains on the shared map.
    state.players.forEach((player, i) => {
      const trail = planeFor(i).trail;
      if (trail.length > 1) line(trail, `${player.color}bb`, 2.4);
    });

    if (inFlight) {
      const dx = inFlight.to.x - inFlight.from.x;
      const dy = inFlight.to.y - inFlight.from.y;
      aircraftPosition = { x: inFlight.from.x + dx * inFlight.progress, y: inFlight.from.y + dy * inFlight.progress };
      line([inFlight.from, aircraftPosition], `${state.players[state.current].color}bb`, 2.4);
    } else if (!state.outcome && !state.shooting) {
      // The 2x2-square outline is centered on the predicted endpoint Z.
      const z = screen(targetCenter);
      ctx.strokeStyle = '#6d9578'; ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]);
      ctx.strokeRect(z.x - view.scale, z.y - view.scale, view.scale * 2, view.scale * 2);
      ctx.setLineDash([]);
      line([plane.position, targetCenter], '#85968b99', 1.4, [4, 4]);

      // Nine selectable intersections: four corners, four edge points, and the center.
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const p = screen({ x: targetCenter.x + dx, y: targetCenter.y + dy });
          ctx.beginPath(); ctx.arc(p.x, p.y, dx === 0 && dy === 0 ? 5 : 4, 0, Math.PI * 2);
          ctx.fillStyle = '#fffef9'; ctx.fill(); ctx.strokeStyle = '#547b60'; ctx.lineWidth = 2; ctx.stroke();
        }
      }
    }
    if (state.shooting && !inFlight) drawWedge(plane);
    drawTargets();
    // A simple black top-down fighter silhouette follows its flight direction.
    const flightVector = inFlight ? { x: inFlight.to.x - inFlight.from.x, y: inFlight.to.y - inFlight.from.y } : plane.vector;
    drawAircraft(aircraftPosition, flightVector);
    if (state.mode === 'advance') {
      const selectedDelta = gesture?.type === 'advance-select' ? gesture.altitudeDelta : 0;
      const height = inFlight ? inFlight.altitudeTo : Math.max(0, Math.min(10, state.altitude + selectedDelta));
      const aircraftScreen = screen(aircraftPosition);
      ctx.font = '600 11px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#111714';
      ctx.fillText(String(height), aircraftScreen.x + 11, aircraftScreen.y - 9);
    }

    // Show other players' current positions when they are in the current view.
    state.players.forEach((player, i) => {
      if (i === state.current) return;
      const other = planeFor(i).position;
      if (!visible(other, rect)) return;
      const p = screen(other);
      ctx.beginPath(); ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2); ctx.fillStyle = player.color; ctx.fill();
    });
    const weatherVector = inFlight ? { x: inFlight.to.x - inFlight.from.x, y: inFlight.to.y - inFlight.from.y } : plane.vector;
    drawWeatherOverlay(aircraftPosition, weatherVector, rect);
  }
  function commitMove(destination, altitudeDelta = 0, options = {}) {
    if (animation || state.outcome || state.fuel <= 0 || (options.shot && state.ammo <= 0)) return;
    const plane = planeFor(state.current);
    state.message = '';
    const intendedDestination = destination;
    destination = applyWind(destination, plane);
    const windApplied = destination.x !== intendedDestination.x || destination.y !== intendedDestination.y;
    const distance = Math.hypot(destination.x - plane.position.x, destination.y - plane.position.y);
    const altitudeTo = state.mode === 'advance' ? Math.max(0, Math.min(10, state.altitude + (altitudeDelta || 0))) : 0;
    animation = { from: plane.position, to: destination, altitudeFrom: state.altitude, altitudeTo, shot: !!options.shot, targetId: options.targetId || '', scoreAward: options.scoreAward || 0, cameraPosition: { ...plane.position }, startedAt: null, duration: Math.max(220, distance * 220), progress: 0 };
    // Keep the current framing and let the camera travel with the aircraft.
    fitMode = false;
    renderPlayers();
    const frame = timestamp => {
      if (!animation) return;
      if (animation.startedAt === null) animation.startedAt = timestamp;
      const raw = Math.min(1, (timestamp - animation.startedAt) / animation.duration);
      animation.progress = raw < 0.5 ? 4 * raw * raw * raw : 1 - Math.pow(-2 * raw + 2, 3) / 2;
      const cameraPlane = {
        x: animation.from.x + (animation.to.x - animation.from.x) * animation.progress,
        y: animation.from.y + (animation.to.y - animation.from.y) * animation.progress
      };
      view.x += cameraPlane.x - animation.cameraPosition.x;
      view.y += cameraPlane.y - animation.cameraPosition.y;
      animation.cameraPosition = cameraPlane;
      if (raw < 1) {
        draw();
        requestAnimationFrame(frame);
        return;
      }
      const result = evaluateMove(plane, animation.to, animation.altitudeTo);
      const fuelBefore = state.fuel;
      const ammoBefore = state.ammo;
      const scoreBefore = state.score;
      const movingTargetsBefore = state.movingTargets.map(target => ({ ...target, position: { ...target.position }, movementVector: { ...target.movementVector } }));
      const aircraft = activeAircraft();
      state.moves.push({ player: state.current, playerId: state.players[state.current].id, aircraftId: aircraft.id, runwayId: aircraft.runwayId, from: animation.from, to: animation.to, altitudeFrom: animation.altitudeFrom, altitudeTo: animation.altitudeTo, statusBefore: state.flightStatus, outcomeBefore: state.outcome, targetDestroyedBefore: state.targetDestroyed, fuelBefore, ammoBefore, scoreBefore, movingTargetsBefore });
      state.fuel = Math.max(0, state.fuel - 1);
      if (animation.shot) {
        state.ammo = Math.max(0, state.ammo - 1);
        if (animation.targetId === 'house') state.targetDestroyed = true;
        else {
          const hitTarget = state.movingTargets.find(target => target.id === animation.targetId);
          if (hitTarget) { hitTarget.active = false; hitTarget.destroyed = true; }
        }
        state.score += animation.scoreAward;
        const hitName = animation.targetId === 'house' ? 'Domek' : state.movingTargets.find(target => target.id === animation.targetId)?.name || 'Cíl';
        state.message = `${hitName} zničen!`;
      }
      state.flightStatus = state.fuel === 0 ? 'crashed' : result.status;
      state.outcome = state.fuel === 0 ? 'Došlo palivo. Letadlo havarovalo.' : result.outcome;
      state.altitude = animation.altitudeTo;
      if (windApplied) {
        const gust = { x: animation.to.x - intendedDestination.x, y: animation.to.y - intendedDestination.y };
        const windMessage = `Vítr změnil kurz o ${gust.x > 0 ? '+' : ''}${gust.x}, ${gust.y > 0 ? '+' : ''}${gust.y} políčko.`;
        state.message = state.message ? `${state.message} ${windMessage}` : windMessage;
      }
      state.shooting = false;
      if (!state.outcome) advanceMovingTargets();
      animation = null;
      save(); renderPlayers();
      draw();
    };
    requestAnimationFrame(frame);
  }
  function closestTarget(tap) {
    const plane = planeFor(state.current);
    const z = predict(plane);
    let closest = null;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const destination = { x: z.x + dx, y: z.y + dy };
        if (!isVisible(destination, plane)) continue;
        const p = screen(destination);
        const distance = Math.hypot(tap.x - p.x, tap.y - p.y);
        if (!closest || distance < closest.distance) closest = { destination, distance };
      }
    }
    return closest;
  }
  function choose(event) {
    if (animation || state.outcome) return;
    if (state.shooting) { shootAt(event); return; }
    const rect = canvas.getBoundingClientRect();
    const tap = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    const closest = closestTarget(tap);
    // Generous circular hit area keeps the nine points usable with a fingertip.
    if (!closest || closest.distance > Math.max(22, view.scale * 0.48)) return;
    commitMove(closest.destination);
  }
  function shootAt(event) {
    if (!state.shooting || animation || state.outcome || state.ammo <= 0 || state.fuel <= 0) return;
    const rect = canvas.getBoundingClientRect();
    const tap = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    const plane = planeFor(state.current);
    const selected = liveTargets().filter(target => isVisible(target.position, plane)).map(target => {
      const point = screen(target.position);
      return { target, distance: Math.hypot(tap.x - point.x, tap.y - point.y) };
    }).sort((a, b) => a.distance - b.distance)[0];
    if (!selected || selected.distance > Math.max(24, view.scale * 0.55)) return;
    if (!targetInWedge(plane, selected.target)) {
      state.message = `${selected.target.name} je mimo útočnou výseč.`;
      renderPlayers();
      return;
    }
    state.message = '';
    commitMove(predict(plane), 0, { shot: true, targetId: selected.target.id, scoreAward: selected.target.points });
  }
  canvas.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    const rect = viewport.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    pointers.set(event.pointerId, { point, start: point, moved: false });
    if (pointers.size === 1) {
      const target = state.mode === 'advance' && !state.shooting && !animation && !state.outcome ? closestTarget(point) : null;
      if (target && target.distance <= Math.max(22, view.scale * 0.48)) {
        gesture = { type: 'advance-select', candidate: target.destination, start: point, altitudeDelta: 0 };
      } else gesture = { type: 'pan', last: point };
    }
    if (pointers.size === 2) {
      pointers.forEach(pointer => { pointer.moved = true; });
      const pair = [...pointers.values()].map(pointer => pointer.point);
      const midpoint = { x: (pair[0].x + pair[1].x) / 2, y: (pair[0].y + pair[1].y) / 2 };
      gesture = {
        type: 'pinch',
        distance: Math.max(1, Math.hypot(pair[0].x - pair[1].x, pair[0].y - pair[1].y)),
        scale: view.scale,
        world: { x: view.x + (midpoint.x - rect.width / 2) / view.scale, y: view.y + (midpoint.y - rect.height / 2) / view.scale }
      };
    }
  });
  canvas.addEventListener('pointermove', event => {
    if (!pointers.has(event.pointerId)) return;
    const rect = viewport.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    const pointer = pointers.get(event.pointerId);
    if (Math.hypot(point.x - pointer.start.x, point.y - pointer.start.y) > 8) pointer.moved = true;
    pointer.point = point;
    if (pointers.size === 1 && gesture?.type === 'advance-select') {
      const verticalDrag = point.y - gesture.start.y;
      gesture.altitudeDelta = Math.abs(verticalDrag) >= 12 ? (verticalDrag < 0 ? 1 : -1) : 0;
      draw();
      return;
    }
    if (pointers.size > 1 && gesture?.type === 'pinch') {
      const pair = [...pointers.values()].slice(0, 2).map(item => item.point);
      const midpoint = { x: (pair[0].x + pair[1].x) / 2, y: (pair[0].y + pair[1].y) / 2 };
      const distance = Math.max(1, Math.hypot(pair[0].x - pair[1].x, pair[0].y - pair[1].y));
      view.scale = Math.max(2, Math.min(120, gesture.scale * distance / gesture.distance));
      moveViewportToPoint(gesture.world, midpoint);
      fitMode = false;
      draw();
      return;
    }
    if (pointers.size === 1 && gesture?.type === 'pan' && pointer.moved) {
      view.x -= (point.x - gesture.last.x) / view.scale;
      view.y -= (point.y - gesture.last.y) / view.scale;
      gesture.last = point;
      fitMode = false;
      draw();
    }
  });
  function endPointer(event, cancelled = false) {
    const pointer = pointers.get(event.pointerId);
    if (!pointer) return;
    const activeGesture = gesture;
    const singlePointer = pointers.size === 1;
    const shouldSelect = !cancelled && singlePointer && !pointer.moved && activeGesture?.type === 'pan';
    const shouldAdvanceSelect = !cancelled && singlePointer && activeGesture?.type === 'advance-select';
    pointers.delete(event.pointerId);
    gesture = null;
    if (pointers.size === 1) gesture = { type: 'pan', last: [...pointers.values()][0].point };
    if (shouldAdvanceSelect) commitMove(activeGesture.candidate, activeGesture.altitudeDelta);
    else if (shouldSelect) choose(event);
  }
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', event => endPointer(event, true));
  viewport.addEventListener('wheel', event => {
    event.preventDefault();
    const rect = viewport.getBoundingClientRect();
    zoomAt(Math.exp(-event.deltaY * 0.001), event.clientX - rect.left, event.clientY - rect.top);
  }, { passive: false });
  document.querySelector('#zoomIn').addEventListener('click', () => zoomAt(1.25, viewport.clientWidth / 2, viewport.clientHeight / 2));
  document.querySelector('#zoomOut').addEventListener('click', () => zoomAt(0.8, viewport.clientWidth / 2, viewport.clientHeight / 2));
  document.querySelector('#fitRoute').addEventListener('click', () => { fitMode = true; fitView(); });
  Object.keys(state.menuSettings).forEach(id => {
    const field = document.getElementById(id);
    field.addEventListener('change', () => {
      if (field instanceof HTMLInputElement) {
        const min = Number(field.min) || 1;
        const max = Number(field.max) || 999;
        field.value = String(Math.max(min, Math.min(max, Number(field.value) || min)));
      }
      state.menuSettings[id] = field.value;
      save();
    });
  });
  document.querySelector('#gameMode').addEventListener('change', event => {
    if (state.moves.length || animation) return;
    state.mode = event.target.value === 'advance' ? 'advance' : 'basic';
    state.altitude = 0;
    save(); renderPlayers(); draw();
  });
  document.querySelector('#weatherMode').addEventListener('change', event => {
    if (state.moves.length || animation) return;
    state.weather = ['sunny', 'night', 'storm', 'wind'].includes(event.target.value) ? event.target.value : 'sunny';
    state.message = '';
    save(); renderPlayers(); draw();
  });
  document.querySelector('#runwayAxis').addEventListener('click', () => {
    if (state.moves.length || animation || state.outcome) return;
    state.runwayAxis = state.runwayAxis === 'horizontal' ? 'vertical' : 'horizontal';
    const runway = runwayFor();
    if (runway) runway.axis = state.runwayAxis;
    save(); renderPlayers(); fitView();
  });
  document.querySelector('#finishTurn').addEventListener('click', () => {
    if (animation || state.outcome) return;
    const plane = planeFor(state.current);
    commitMove(predict(plane));
  });
  document.querySelector('#fireButton').addEventListener('click', () => {
    if (animation || state.outcome) return;
    if (!state.shooting && (state.ammo <= 0 || state.fuel <= 0)) return;
    const plane = planeFor(state.current);
    if (!state.shooting && Math.hypot(plane.vector.x, plane.vector.y) === 0) return;
    state.shooting = !state.shooting;
    state.message = '';
    save(); renderPlayers(); draw();
  });
  document.querySelector('#undo').addEventListener('click', () => {
    if (animation) return;
    const move = state.moves.pop();
    if (!move) return;
    state.current = move.player;
    state.activeAircraftId = move.aircraftId || state.players[state.current].aircraft?.[0]?.id;
    state.flightStatus = move.statusBefore || 'ground';
    state.outcome = move.outcomeBefore || '';
    state.altitude = move.altitudeFrom ?? 0;
    state.fuel = move.fuelBefore ?? 999;
    state.ammo = move.ammoBefore ?? 999;
    state.score = move.scoreBefore ?? (move.targetDestroyedBefore ? targetPoint.points : 0);
    state.movingTargets = move.movingTargetsBefore || createMovingTargets();
    state.targetDestroyed = move.targetDestroyedBefore ?? false;
    state.shooting = false; state.message = '';
    save(); renderPlayers();
    if (fitMode) fitView(); else followCurrent();
  });
  document.querySelector('#toggleGrid').addEventListener('click', () => { state.grid = !state.grid; save(); renderPlayers(); draw(); });
  document.querySelector('#newGame').addEventListener('click', () => { if (!animation) dialog.showModal(); });
  document.querySelector('#openMenu').addEventListener('click', () => { if (!animation) { showMenuScreen('home'); menuDialog.showModal(); } });
  document.querySelector('#menuResume').addEventListener('click', () => menuDialog.close());
  document.querySelector('#menuRestart').addEventListener('click', () => { menuDialog.close(); if (!animation) dialog.showModal(); });
  document.querySelectorAll('[data-open-menu]').forEach(button => {
    button.addEventListener('click', () => showMenuScreen(button.dataset.openMenu));
  });
  document.querySelectorAll('[data-menu-back]').forEach(button => {
    button.addEventListener('click', () => showMenuScreen('home'));
  });
  document.querySelector('#puzzleLevel1').addEventListener('click', () => {
    state.playMode = 'puzzle'; state.levelId = 'puzzle-1';
    menuDialog.close(); resetLevel();
  });
  document.querySelector('#confirmNew').addEventListener('click', event => {
    event.preventDefault(); resetLevel(); dialog.close();
  });
  new ResizeObserver(resize).observe(viewport);
  window.addEventListener('beforeinstallprompt', event => event.preventDefault());
  renderPlayers(); resize(); renderMenuSettings();
  showMenuScreen('home');
  menuDialog.showModal();
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
})();
