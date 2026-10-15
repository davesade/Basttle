(() => {
  const palette = ['#df7457', '#4d82ae', '#74a55e', '#a071b1', '#d4a341', '#4d9b91', '#db6886', '#747c8d'];
  const storageKey = 'ctvereckovana-prototype-v6';
  const puzzleBestScoresKey = 'basttle-puzzle-best-scores-v1';
  const weapon = { range: 3, endWidth: 3 };
  const fallbackTutorialOne = {
    schemaVersion: 1, id: 'tutorial-01', name: 'Vzlet a přistání', modes: ['tutorial'], type: 'tutorial', flightMode: 'basic', flightModeLocked: true,
    weather: 'sunny', weatherLocked: true, bounds: { minX: -10, maxX: 10, minY: -10, maxY: 10 }, resources: { fuel: 999, ammo: 999 },
    runways: [{ id: 'runway-1', center: { x: 0, y: 0 }, axis: 'horizontal', length: 5, fixed: true }],
    players: [{ id: 'player-1', name: 'Hráč', aircraft: [{ id: 'aircraft-1', name: 'F-16', start: { x: 0, y: 0 }, runwayId: 'runway-1' }] }],
    targets: [], movingTargets: [], rules: { movingTargetEscapeIsLoss: true }, obstacles: [],
    decorations: [{ id: 'training-lake', kind: 'lake', center: { x: -6, y: 6 }, width: 6, height: 4 }]
  };
  const fallbackTutorialTwo = {
    ...fallbackTutorialOne, id: 'tutorial-02', name: 'Střelba na statický cíl',
    targets: [{ id: 'tutorial-house', kind: 'house', name: 'Cvičný cíl', position: { x: 7, y: 4 }, altitude: 0, points: 1, required: true }]
  };
  const fallbackTutorialThree = {
    ...fallbackTutorialOne, id: 'tutorial-03', name: 'Střelba na pohyblivý cíl',
    movingTargets: [{ id: 'tutorial-car', kind: 'car', name: 'Cvičné auto', position: { x: 7, y: 4 }, route: [
      { x: 7, y: 4 }, { x: 7.5, y: 3 }, { x: 7, y: 2 }, { x: 6, y: 1.5 },
      { x: 5, y: 2 }, { x: 4.5, y: 3 }, { x: 5, y: 4 }, { x: 6, y: 4.5 }
    ], altitude: 0, points: 2, required: true }]
  };
  let targetPoint = { x: 6, y: 3, altitude: 0, points: 10 };
  let mapBounds = { minX: -8, maxX: 10, minY: -8, maxY: 8 };
  // Moving targets advance by this map vector after each aircraft turn.
  // Puzzle levels can set movingTargetEscapeIsLoss to make an escape a failure.
  let levelDefinition = {
    schemaVersion: 1, id: 'puzzle-01', name: 'První mise', modes: ['puzzle'], type: 'puzzle', flightMode: 'basic', flightModeLocked: true, weather: 'sunny', weatherLocked: true,
    bounds: { minX: -8, maxX: 10, minY: -8, maxY: 8 }, resources: { fuel: 18, ammo: 3 },
    runways: [{ id: 'runway-1', center: { x: 0, y: 0 }, axis: 'horizontal', length: 5, fixed: true }],
    players: [{ id: 'player-1', name: 'Hráč', aircraft: [{ id: 'aircraft-1', name: 'F-16', start: { x: 0, y: 0 }, runwayId: 'runway-1' }] }],
    targets: [{ id: 'depot-1', kind: 'house', name: 'Sklad paliva', position: { x: 6, y: 3 }, altitude: 0, points: 10, required: true }],
    rules: { movingTargetEscapeIsLoss: true }, movingTargets: [],
    obstacles: [
      { name: 'hora', altitude: 5, polygon: [{ x: 3.25, y: 0.85 }, { x: 3.55, y: 0.25 }, { x: 3.85, y: 0.85 }] },
      { name: 'západní štít', altitude: 5, polygon: [{ x: -0.9, y: 2.5 }, { x: 0, y: 3.2 }, { x: 0.9, y: 2.5 }] },
      { name: 'severní štít', altitude: 5, polygon: [{ x: 0.1, y: 5.35 }, { x: 0.95, y: 6.55 }, { x: 1.8, y: 5.35 }] },
      { name: 'východní štít', altitude: 5, polygon: [{ x: 7.1, y: 4.1 }, { x: 7.85, y: 5.2 }, { x: 8.6, y: 4.1 }] }
    ], decorations: []
  };
  const fallbackPuzzleOne = levelDefinition;
  const fallbackPuzzleTwo = {
    schemaVersion: 1, id: 'puzzle-02', name: 'Dva cíle', modes: ['puzzle'], flightMode: 'basic', flightModeLocked: true,
    weather: 'sunny', weatherLocked: true, bounds: { minX: -12, maxX: 12, minY: -10, maxY: 10 },
    resources: { fuel: 27, ammo: 4 },
    runways: [{ id: 'runway-1', center: { x: 0, y: 0 }, axis: 'horizontal', length: 5, fixed: true }],
    players: [{ id: 'player-1', name: 'Hráč', aircraft: [{ id: 'aircraft-1', name: 'F-16', start: { x: 0, y: 0 }, runwayId: 'runway-1' }] }],
    targets: [
      { id: 'depot-east', kind: 'house', name: 'Východní sklad', position: { x: 9, y: 4 }, altitude: 0, points: 10, required: true },
      { id: 'depot-west', kind: 'house', name: 'Západní sklad', position: { x: -9, y: -4 }, altitude: 0, points: 10, required: true }
    ],
    movingTargets: [], rules: { movingTargetEscapeIsLoss: true },
    obstacles: [
      { name: 'hora', altitude: 5, polygon: [{ x: -3.4, y: 1.2 }, { x: -2.8, y: 2.3 }, { x: -2.2, y: 1.2 }] },
      { name: 'hora', altitude: 5, polygon: [{ x: 2.3, y: -1.1 }, { x: 3, y: -2.4 }, { x: 3.7, y: -1.1 }] },
      { name: 'mrakodrap', altitude: 3, polygon: [{ x: -7.4, y: 4.4 }, { x: -6.2, y: 4.4 }, { x: -6.2, y: 6.6 }, { x: -7.4, y: 6.6 }] },
      { name: 'mrakodrap', altitude: 3, polygon: [{ x: 6.2, y: -6.7 }, { x: 7.5, y: -6.7 }, { x: 7.5, y: -4.2 }, { x: 6.2, y: -4.2 }] },
      { name: 'mrakodrap', altitude: 3, polygon: [{ x: 5.2, y: 6.2 }, { x: 6.3, y: 6.2 }, { x: 6.3, y: 8.4 }, { x: 5.2, y: 8.4 }] },
      { name: 'větrná elektrárna', altitude: 2, lines: [
        { from: { x: -5.5, y: -6.8 }, to: { x: -5.5, y: -5.7 }, width: 0.16 },
        { from: { x: -6.1, y: -5.7 }, to: { x: -4.9, y: -5.7 }, width: 0.14 },
        { from: { x: -6, y: -6.2 }, to: { x: -5, y: -5.3 }, width: 0.14 },
        { from: { x: -5, y: -6.2 }, to: { x: -6, y: -5.3 }, width: 0.14 }
      ] },
      { name: 'větrná elektrárna', altitude: 2, lines: [
        { from: { x: 4.8, y: 2.7 }, to: { x: 4.8, y: 3.8 }, width: 0.16 },
        { from: { x: 4.2, y: 3.8 }, to: { x: 5.4, y: 3.8 }, width: 0.14 },
        { from: { x: 4.3, y: 3.3 }, to: { x: 5.3, y: 4.2 }, width: 0.14 },
        { from: { x: 5.3, y: 3.3 }, to: { x: 4.3, y: 4.2 }, width: 0.14 }
      ] },
      { name: 'větrná elektrárna', altitude: 2, lines: [
        { from: { x: 1.3, y: -7.6 }, to: { x: 1.3, y: -6.5 }, width: 0.16 },
        { from: { x: 0.7, y: -6.5 }, to: { x: 1.9, y: -6.5 }, width: 0.14 },
        { from: { x: 0.8, y: -7 }, to: { x: 1.8, y: -6.1 }, width: 0.14 },
        { from: { x: 1.8, y: -7 }, to: { x: 0.8, y: -6.1 }, width: 0.14 }
      ] }
    ], decorations: []
  };
  const fallbackPuzzleThree = {
    schemaVersion: 1, id: 'puzzle-03', name: 'Únikové auto', modes: ['puzzle'], flightMode: 'basic', flightModeLocked: true,
    weather: 'sunny', weatherLocked: true, bounds: { minX: -9, maxX: 9, minY: -8, maxY: 8 },
    resources: { fuel: 18, ammo: 2 },
    runways: [{ id: 'runway-1', center: { x: 0, y: 0 }, axis: 'horizontal', length: 5, fixed: true }],
    players: [{ id: 'player-1', name: 'Hráč', aircraft: [{ id: 'aircraft-1', name: 'F-16', start: { x: 0, y: 0 }, runwayId: 'runway-1' }] }],
    targets: [],
    movingTargets: [{ id: 'getaway-car', kind: 'car', name: 'Únikové auto', position: { x: 5, y: 1 }, movementVector: { x: 1, y: 0 }, altitude: 0, points: 2, required: true }],
    rules: { movingTargetEscapeIsLoss: true },
    obstacles: [
      { name: 'hora', altitude: 5, polygon: [{ x: -3.5, y: 2.7 }, { x: -2.7, y: 4 }, { x: -1.9, y: 2.7 }] },
      { name: 'mrakodrap', altitude: 3, polygon: [{ x: -6.8, y: -5.8 }, { x: -5.7, y: -5.8 }, { x: -5.7, y: -3.6 }, { x: -6.8, y: -3.6 }] },
      { name: 'větrná elektrárna', altitude: 2, lines: [
        { from: { x: 3.2, y: -6.5 }, to: { x: 3.2, y: -5.4 }, width: 0.16 },
        { from: { x: 2.6, y: -5.4 }, to: { x: 3.8, y: -5.4 }, width: 0.14 },
        { from: { x: 2.7, y: -6 }, to: { x: 3.7, y: -5.1 }, width: 0.14 },
        { from: { x: 3.7, y: -6 }, to: { x: 2.7, y: -5.1 }, width: 0.14 }
      ] }
    ], decorations: []
  };
  const fallbackPuzzleFour = {
    schemaVersion: 1, id: 'puzzle-04', name: 'Jižní trasa', modes: ['puzzle'], flightMode: 'basic', flightModeLocked: true,
    weather: 'sunny', weatherLocked: true, bounds: { minX: -10, maxX: 10, minY: -10, maxY: 10 },
    resources: { fuel: 22, ammo: 3 },
    runways: [{ id: 'runway-1', center: { x: 0, y: 0 }, axis: 'horizontal', length: 5, fixed: true }],
    players: [{ id: 'player-1', name: 'Hráč', aircraft: [{ id: 'aircraft-1', name: 'F-16', start: { x: 0, y: 0 }, runwayId: 'runway-1' }] }],
    targets: [{ id: 'fuel-depot', kind: 'house', name: 'Zásobník paliva', position: { x: -7, y: 4 }, altitude: 0, points: 10, required: true }],
    movingTargets: [{ id: 'southbound-car', kind: 'car', name: 'Jižní konvoj', position: { x: 5, y: 8 }, movementVector: { x: 0, y: -1 }, altitude: 0, points: 2, required: true }],
    rules: { movingTargetEscapeIsLoss: true },
    obstacles: [
      { name: 'hora', altitude: 5, polygon: [{ x: -4.1, y: -0.9 }, { x: -3.4, y: -2.1 }, { x: -2.7, y: -0.9 }] },
      { name: 'mrakodrap', altitude: 3, polygon: [{ x: 6.2, y: 3.2 }, { x: 7.3, y: 3.2 }, { x: 7.3, y: 5.4 }, { x: 6.2, y: 5.4 }] },
      { name: 'větrná elektrárna', altitude: 2, lines: [
        { from: { x: -2.5, y: -6.5 }, to: { x: -2.5, y: -5.4 }, width: 0.16 },
        { from: { x: -3.1, y: -5.4 }, to: { x: -1.9, y: -5.4 }, width: 0.14 },
        { from: { x: -3, y: -6 }, to: { x: -2, y: -5.1 }, width: 0.14 },
        { from: { x: -2, y: -6 }, to: { x: -3, y: -5.1 }, width: 0.14 }
      ] }
    ], decorations: []
  };
  const fallbackPuzzleFive = {
    schemaVersion: 1, id: 'puzzle-05', name: 'Křižující se trasy', modes: ['puzzle'], flightMode: 'basic', flightModeLocked: true,
    weather: 'sunny', weatherLocked: true, bounds: { minX: -9, maxX: 9, minY: -9, maxY: 9 },
    resources: { fuel: 26, ammo: 3 },
    runways: [{ id: 'runway-1', center: { x: 0, y: 0 }, axis: 'vertical', length: 5, fixed: true }],
    players: [{ id: 'player-1', name: 'Hráč', aircraft: [{ id: 'aircraft-1', name: 'F-16', start: { x: 0, y: 0 }, runwayId: 'runway-1' }] }],
    targets: [],
    movingTargets: [
      { id: 'north-car', kind: 'car', name: 'Severní auto', position: { x: -1, y: 6 }, movementVector: { x: 1, y: 0 }, altitude: 0, points: 2, required: true },
      { id: 'south-car', kind: 'car', name: 'Jižní auto', position: { x: 1, y: -6 }, movementVector: { x: -1, y: 0 }, altitude: 0, points: 2, required: true }
    ],
    rules: { movingTargetEscapeIsLoss: true },
    obstacles: [
      { name: 'hora', altitude: 5, polygon: [{ x: -4.6, y: -1.7 }, { x: -3.8, y: -3 }, { x: -3, y: -1.7 }] },
      { name: 'hora', altitude: 5, polygon: [{ x: -5.4, y: 4.1 }, { x: -4.6, y: 5.4 }, { x: -3.8, y: 4.1 }] },
      { name: 'mrakodrap', altitude: 3, polygon: [{ x: -8.2, y: 5.1 }, { x: -7, y: 5.1 }, { x: -7, y: 7.4 }, { x: -8.2, y: 7.4 }] },
      { name: 'mrakodrap', altitude: 3, polygon: [{ x: 5.1, y: 1.6 }, { x: 6.2, y: 1.6 }, { x: 6.2, y: 3.7 }, { x: 5.1, y: 3.7 }] },
      { name: 'mrakodrap', altitude: 3, polygon: [{ x: 7, y: -8.3 }, { x: 8.1, y: -8.3 }, { x: 8.1, y: -6.6 }, { x: 7, y: -6.6 }] },
      { name: 'větrná elektrárna', altitude: 2, lines: [
        { from: { x: -7.1, y: -6.2 }, to: { x: -7.1, y: -5.1 }, width: 0.16 },
        { from: { x: -7.7, y: -5.1 }, to: { x: -6.5, y: -5.1 }, width: 0.14 },
        { from: { x: -7.6, y: -5.7 }, to: { x: -6.6, y: -4.8 }, width: 0.14 },
        { from: { x: -6.6, y: -5.7 }, to: { x: -7.6, y: -4.8 }, width: 0.14 }
      ] },
      { name: 'větrná elektrárna', altitude: 2, lines: [
        { from: { x: 4, y: -8.1 }, to: { x: 4, y: -7 }, width: 0.16 },
        { from: { x: 3.4, y: -7 }, to: { x: 4.6, y: -7 }, width: 0.14 },
        { from: { x: 3.5, y: -7.6 }, to: { x: 4.5, y: -6.7 }, width: 0.14 },
        { from: { x: 4.5, y: -7.6 }, to: { x: 3.5, y: -6.7 }, width: 0.14 }
      ] },
      { name: 'větrná elektrárna', altitude: 2, lines: [
        { from: { x: 7, y: 7.4 }, to: { x: 7, y: 8.4 }, width: 0.16 },
        { from: { x: 6.4, y: 8.4 }, to: { x: 7.6, y: 8.4 }, width: 0.14 },
        { from: { x: 6.5, y: 7.9 }, to: { x: 7.5, y: 8.8 }, width: 0.14 },
        { from: { x: 7.5, y: 7.9 }, to: { x: 6.5, y: 8.8 }, width: 0.14 }
      ] }
    ], decorations: []
  };
  const fallbackPuzzleSix = {
    schemaVersion: 1, id: 'puzzle-06', name: 'Jezerní okruh', modes: ['puzzle'], flightMode: 'basic', flightModeLocked: true,
    weather: 'sunny', weatherLocked: true, bounds: { minX: -12, maxX: 12, minY: -12, maxY: 12 },
    resources: { fuel: 25, ammo: 2 },
    runways: [{ id: 'runway-1', center: { x: 0, y: 0 }, axis: 'horizontal', length: 5, fixed: true }],
    players: [{ id: 'player-1', name: 'Hráč', aircraft: [{ id: 'aircraft-1', name: 'F-16', start: { x: 0, y: 0 }, runwayId: 'runway-1' }] }],
    targets: [],
    movingTargets: [{ id: 'lake-boat', kind: 'boat', name: 'Jezerní loď', position: { x: 4, y: 7 }, route: [
      { x: 4, y: 7 }, { x: 4.6, y: 6 }, { x: 6, y: 5.8 }, { x: 7.4, y: 6 },
      { x: 8, y: 7 }, { x: 7.4, y: 8 }, { x: 6, y: 8.2 }, { x: 4.6, y: 8 }
    ], altitude: 0, points: 2, required: true }],
    rules: { movingTargetEscapeIsLoss: true },
    obstacles: [
      { name: 'hora', altitude: 5, polygon: [{ x: -4.8, y: 2.5 }, { x: -3.8, y: 1.4 }, { x: -2.8, y: 2.5 }] },
      { name: 'hora', altitude: 5, polygon: [{ x: -2.4, y: 4.7 }, { x: -1.4, y: 5.8 }, { x: -0.4, y: 4.7 }] },
      { name: 'hora', altitude: 5, polygon: [{ x: 0.4, y: 3.5 }, { x: 1.4, y: 2.4 }, { x: 2.4, y: 3.5 }] },
      { name: 'hora', altitude: 5, polygon: [{ x: 1.5, y: 6.3 }, { x: 2.5, y: 7.4 }, { x: 3.5, y: 6.3 }] },
      { name: 'hora', altitude: 5, polygon: [{ x: -8.8, y: -3.5 }, { x: -7.6, y: -4.8 }, { x: -6.4, y: -3.5 }] },
      { name: 'mrakodrap', altitude: 3, polygon: [{ x: 8.4, y: 1.2 }, { x: 9.6, y: 1.2 }, { x: 9.6, y: 3.6 }, { x: 8.4, y: 3.6 }] },
      { name: 'mrakodrap', altitude: 3, polygon: [{ x: -9.2, y: 8.2 }, { x: -8, y: 8.2 }, { x: -8, y: 10.4 }, { x: -9.2, y: 10.4 }] },
      { name: 'větrná elektrárna', altitude: 2, lines: [
        { from: { x: 10, y: -5 }, to: { x: 10, y: -3.8 }, width: 0.16 },
        { from: { x: 9.4, y: -3.8 }, to: { x: 10.6, y: -3.8 }, width: 0.14 },
        { from: { x: 9.5, y: -4.4 }, to: { x: 10.5, y: -3.5 }, width: 0.14 },
        { from: { x: 10.5, y: -4.4 }, to: { x: 9.5, y: -3.5 }, width: 0.14 }
      ] }
    ], decorations: [{ id: 'lake-1', kind: 'lake', center: { x: 6, y: 7 }, width: 8, height: 6 }]
  };
  const fallbackPuzzleSeven = {
    ...fallbackPuzzleSix,
    id: 'puzzle-07', name: 'Jezero na západě',
    resources: { fuel: 29, ammo: 3 },
    targets: [{ id: 'lakeside-house', kind: 'house', name: 'Dům u jezera', position: { x: 8, y: 8 }, altitude: 0, points: 1, required: true }],
    movingTargets: [
      { id: 'west-lake-boat', kind: 'boat', name: 'Jezerní loď', position: { x: -8, y: 7 }, route: [
        { x: -8, y: 7 }, { x: -7.4, y: 6 }, { x: -6, y: 5.8 }, { x: -4.6, y: 6 },
        { x: -4, y: 7 }, { x: -4.6, y: 8 }, { x: -6, y: 8.2 }, { x: -7.4, y: 8 }
      ], altitude: 0, points: 2, required: true },
      { id: 'northbound-car', kind: 'car', name: 'Auto na sever', position: { x: 8, y: -8 }, movementVector: { x: 0, y: 1 }, altitude: 0, points: 2, required: true }
    ],
    decorations: [{ id: 'lake-1', kind: 'lake', center: { x: -6, y: 7 }, width: 8, height: 6 }]
  };
  const fallbackPuzzleEight = {
    ...fallbackPuzzleSeven,
    id: 'puzzle-08', name: 'Čtyři kouty',
    resources: { fuel: 36, ammo: 4 },
    targets: [
      ...fallbackPuzzleSeven.targets,
      { id: 'southwest-house', kind: 'house', name: 'Jihozápadní dům', position: { x: -8, y: -8 }, altitude: 0, points: 1, required: true }
    ],
    obstacles: [
      ...fallbackPuzzleSeven.obstacles,
      { name: 'hora', altitude: 5, polygon: [{ x: 4.2, y: 9.1 }, { x: 5.3, y: 10.2 }, { x: 6.4, y: 9.1 }] },
      { name: 'hora', altitude: 5, polygon: [{ x: -5.8, y: -6.2 }, { x: -4.8, y: -7.3 }, { x: -3.8, y: -6.2 }] },
      { name: 'mrakodrap', altitude: 3, polygon: [{ x: 3.3, y: -9.7 }, { x: 4.5, y: -9.7 }, { x: 4.5, y: -7.4 }, { x: 3.3, y: -7.4 }] }
    ]
  };
  function mirrorLevelX(value) {
    if (Array.isArray(value)) return value.map(mirrorLevelX);
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, key === 'x' && typeof item === 'number' ? -item : mirrorLevelX(item)]));
    }
    return value;
  }
  const fallbackPuzzleNine = mirrorLevelX(fallbackPuzzleEight);
  Object.assign(fallbackPuzzleNine, {
    id: 'puzzle-09', name: 'Zrcadlový průlet',
    bounds: { minX: -15, maxX: 15, minY: -15, maxY: 15 },
    resources: { fuel: 38, ammo: 6 }
  });
  fallbackPuzzleNine.targets.push(
    { id: 'southeast-house-1', kind: 'house', name: 'Jihovýchodní dům 1', position: { x: 10, y: -11 }, altitude: 0, points: 1, required: true },
    { id: 'southeast-house-2', kind: 'house', name: 'Jihovýchodní dům 2', position: { x: 12, y: -12 }, altitude: 0, points: 1, required: true }
  );
  fallbackPuzzleNine.obstacles.push(
    { name: 'hora', altitude: 5, polygon: [{ x: -1.7, y: -10.8 }, { x: -0.6, y: -9.6 }, { x: 0.5, y: -10.8 }] },
    { name: 'mrakodrap', altitude: 3, polygon: [{ x: 11.2, y: 3.2 }, { x: 12.4, y: 3.2 }, { x: 12.4, y: 5.5 }, { x: 11.2, y: 5.5 }] },
    { name: 'hora', altitude: 5, polygon: [{ x: -12.8, y: -6.4 }, { x: -11.7, y: -5.2 }, { x: -10.6, y: -6.4 }] },
    { name: 'mrakodrap', altitude: 3, polygon: [{ x: 1.8, y: 10.8 }, { x: 3.1, y: 10.8 }, { x: 3.1, y: 13.1 }, { x: 1.8, y: 13.1 }] }
  );
  function tutorialMountain(x, y, radius = 0.65) {
    return { name: 'hora', altitude: 5, polygon: [{ x: x - radius, y: y - radius / 2 }, { x, y: y + radius }, { x: x + radius, y: y - radius / 2 }] };
  }
  function tutorialTower(x, y, width = 0.85, height = 1.7) {
    return { name: 'mrakodrap', altitude: 3, polygon: [{ x: x - width / 2, y: y - height / 2 }, { x: x + width / 2, y: y - height / 2 }, { x: x + width / 2, y: y + height / 2 }, { x: x - width / 2, y: y + height / 2 }] };
  }
  function tutorialTurbine(x, y) {
    return { name: 'větrná elektrárna', altitude: 2, lines: [
      { from: { x, y: y - 0.65 }, to: { x, y: y + 0.45 }, width: 0.16 },
      { from: { x: x - 0.55, y: y + 0.45 }, to: { x: x + 0.55, y: y + 0.45 }, width: 0.14 },
      { from: { x: x - 0.45, y: y + 0.1 }, to: { x: x + 0.45, y: y + 0.8 }, width: 0.14 },
      { from: { x: x + 0.45, y: y + 0.1 }, to: { x: x - 0.45, y: y + 0.8 }, width: 0.14 }
    ] };
  }
  const tutorialMountainSites = [[-13,13],[-10.5,12],[-13,7],[-12,-1],[-12,-9],[-8,-12],[-5,-13],[-1,-13],[3,-13],[7,-13],[12,-13],[14,-8],[12,-5],[9,-4],[13,1],[14,6],[12,11],[8,13],[3,13],[-2,13],[-7,13],[-12,12]];
  const tutorialTowerSites = [[-11,5],[-12,2],[-11,-5],[-9,-10],[-6,-11],[-2,-12],[5,-12],[10,-13],[13,-11],[13,-3],[10,5],[13,10],[-10,11],[-5,12],[1,12],[6,12]];
  const tutorialTurbineSites = [[-13,4],[-12,-6],[-7,-13],[1,-12],[11,-10],[13,4],[10,12],[-10,13]];
  const fallbackPuzzleTen = {
    ...fallbackPuzzleNine,
    id: 'puzzle-10', name: 'Labyrint bez východu',
    resources: { fuel: 70, ammo: 8 },
    targets: [
      { id: 'lakeside-house', kind: 'house', name: 'Severozápadní sklad 1', position: { x: -13, y: 9 }, altitude: 0, points: 1, required: true },
      { id: 'southwest-house', kind: 'house', name: 'Severovýchodní sklad 1', position: { x: 13, y: 8 }, altitude: 0, points: 1, required: true },
      { id: 'southeast-house-1', kind: 'house', name: 'Jihovýchodní sklad 1', position: { x: 14, y: -10 }, altitude: 0, points: 1, required: true },
      { id: 'southeast-house-2', kind: 'house', name: 'Jihovýchodní sklad 2', position: { x: 10, y: -8 }, altitude: 0, points: 1, required: true },
      { id: 'northeast-store', kind: 'house', name: 'Severovýchodní sklad 2', position: { x: 10, y: 9 }, altitude: 0, points: 1, required: true },
      { id: 'southwest-store', kind: 'house', name: 'Jihozápadní sklad 1', position: { x: -13, y: -10 }, altitude: 0, points: 1, required: true },
      { id: 'southern-store', kind: 'house', name: 'Jihozápadní sklad 2', position: { x: -10, y: -8 }, altitude: 0, points: 1, required: true },
      { id: 'southeast-store', kind: 'house', name: 'Severozápadní sklad 2', position: { x: -10, y: 8 }, altitude: 0, points: 1, required: true }
    ],
    movingTargets: [],
    obstacles: [
      ...fallbackPuzzleNine.obstacles,
      ...tutorialMountainSites.map(([x, y]) => tutorialMountain(x, y)),
      ...tutorialTowerSites.map(([x, y]) => tutorialTower(x, y)),
      ...tutorialTurbineSites.map(([x, y]) => tutorialTurbine(x, y))
    ]
  };
  let obstacles = [{ name: 'hora', altitude: 5, polygon: [{ x: 3.25, y: 0.85 }, { x: 3.55, y: 0.25 }, { x: 3.85, y: 0.85 }] }];
  const canvas = document.querySelector('#board');
  const ctx = canvas.getContext('2d');
  const weatherCanvas = document.createElement('canvas');
  const weatherCtx = weatherCanvas.getContext('2d');
  const viewport = document.querySelector('#boardViewport');
  const playerList = document.querySelector('#players');
  const dialog = document.querySelector('#confirmDialog');
  const menuDialog = document.querySelector('#menuDialog');
  // Show the main menu immediately. Loading the YAML level must not hold the page behind a blank screen.
  showMenuScreen('home');
  if (!menuDialog.open) menuDialog.showModal();
  let state;
  let puzzleStartedFromMenu = false;
  // Runs are not resumed: every page launch begins with a clean menu state.
  try { localStorage.removeItem(storageKey); } catch (_) { /* Storage may be unavailable. */ }
  state = freshState();
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
      players: (levelDefinition.players || []).map(player => ({ color: '#111714', ...player, aircraft: player.aircraft.map(aircraft => ({ ...aircraft, start: { ...aircraft.start } })) })),
      runways: (levelDefinition.runways || []).map(runway => ({ ...runway, center: { ...runway.center } })),
      current: 0,
      activeAircraftId: 'aircraft-1',
      playMode: 'puzzle',
      levelId: levelDefinition.id,
      menuSettings: {
        arcadeAircraft: 'f16', arcadeDifficulty: 'normal',
        multiplayerPlayers: '2', multiplayerControl: 'human', multiplayerAircraft: 'f16',
        multiplayerFuel: '999', multiplayerAircraftCount: '1', multiplayerParallel: '1'
      },
      moves: [],
      fuel: levelDefinition.resources?.fuel ?? 999,
      ammo: levelDefinition.resources?.ammo ?? 999,
      score: 0,
      targets: createTargets(),
      movingTargets: createMovingTargets(),
      arcadeEnemySerial: 0,
      arcadeSpawnCountdown: 0,
      arcadeSeed: '',
      arcadeRandom: Math.random,
      levelRules: { ...levelDefinition.rules },
      mode: levelDefinition.flightMode || 'basic',
      weather: levelDefinition.weather || 'sunny',
      altitude: 0,
      shooting: false,
      targetDestroyed: false,
      message: '',
      runwayAxis: levelDefinition.runways?.[0]?.axis || 'horizontal',
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
        if (!Array.isArray(restored.targets)) restored.targets = createTargets();
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
    state.fuel = levelDefinition.resources?.fuel ?? 999; state.ammo = levelDefinition.resources?.ammo ?? 999; state.score = 0;
    state.targets = createTargets();
    state.movingTargets = createMovingTargets(); state.levelRules = { ...levelDefinition.rules };
    state.arcadeEnemySerial = 0; state.arcadeSpawnCountdown = 0;
    if (state.playMode === 'arcade') { state.arcadeRandom = createSeededRandom(state.arcadeSeed); initializeArcadeEnemies(); }
    state.shooting = false; state.targetDestroyed = false; state.message = '';
    fitMode = true;
    save(); renderPlayers(); fitView();
  }

  function showMenuScreen(screenName) {
    document.querySelectorAll('[data-menu-screen]').forEach(screen => {
      screen.hidden = screen.dataset.menuScreen !== screenName;
    });
    if (screenName === 'puzzle') renderPuzzleBestScores();
    if (screenName === 'arcade') {
      let best = 0;
      try { best = Number(localStorage.getItem('basttle-arcade-best-score-v1')) || 0; } catch (_) { /* Ignore unavailable storage. */ }
      document.querySelector('#arcadeBestScore').textContent = `Nejlepší skóre: ${best}`;
    }
  }
  function readPuzzleBestScores() {
    try {
      const scores = JSON.parse(localStorage.getItem(puzzleBestScoresKey) || '{}');
      return scores && typeof scores === 'object' && !Array.isArray(scores) ? scores : {};
    } catch (_) { return {}; }
  }
  function renderPuzzleBestScores() {
    const scores = readPuzzleBestScores();
    for (let level = 1; level <= 10; level++) {
      const label = document.querySelector(`#puzzleBest${level}`);
      const levelId = `puzzle-${String(level).padStart(2, '0')}`;
      if (label) label.textContent = `Nejvyšší skóre: ${Number.isFinite(scores[levelId]) ? scores[levelId] : '—'}`;
    }
  }
  function recordPuzzleBestScore() {
    if (state.playMode !== 'puzzle' || !levelDefinition.id) return;
    const scores = readPuzzleBestScores();
    if (!Number.isFinite(scores[levelDefinition.id]) || state.score > scores[levelDefinition.id]) {
      scores[levelDefinition.id] = state.score;
      try { localStorage.setItem(puzzleBestScoresKey, JSON.stringify(scores)); } catch (_) { /* The run remains complete if storage is unavailable. */ }
    }
  }
  function recordArcadeBestScore() {
    if (state.playMode !== 'arcade') return;
    try {
      const best = Number(localStorage.getItem('basttle-arcade-best-score-v1')) || 0;
      if (state.score > best) localStorage.setItem('basttle-arcade-best-score-v1', String(state.score));
    } catch (_) { /* Arcade remains playable if storage is unavailable. */ }
  }
  function abandonCurrentGame() {
    const playMode = state.playMode || 'puzzle';
    try { localStorage.removeItem(storageKey); } catch (_) { /* Storage may be unavailable. */ }
    state = freshState();
    state.playMode = playMode;
  }
  function openModeSubmenu() {
    const screen = ['tutorial', 'puzzle', 'arcade', 'campaign', 'multiplayer'].includes(state.playMode) ? state.playMode : 'puzzle';
    abandonCurrentGame();
    renderPlayers();
    showMenuScreen(screen);
    if (!menuDialog.open) menuDialog.showModal();
  }
  function renderMenuSettings() {
    Object.entries(state.menuSettings).forEach(([id, value]) => {
      const field = document.getElementById(id);
      if (field) field.value = value;
    });
  }

  function createMovingTargets() {
    return (levelDefinition.movingTargets || []).map(target => ({
      ...target,
      position: { ...target.position },
      movementVector: { ...(target.movementVector || { x: 0, y: 0 }) },
      route: target.route?.map(point => ({ ...point })),
      routeIndex: 0,
      active: true,
      destroyed: false,
      escaped: false
    }));
  }
  function createTargets() {
    return (levelDefinition.targets || []).map(target => ({ ...target, position: { ...target.position }, active: true, destroyed: false }));
  }
  function configureLevel(data) {
    if (!data || data.schemaVersion !== 1 || !data.id || !data.bounds || !Array.isArray(data.runways) || !Array.isArray(data.players)) throw new Error('Neplatný formát levelu.');
    levelDefinition = { ...data, rules: data.rules || { movingTargetEscapeIsLoss: false }, movingTargets: data.movingTargets || [], targets: data.targets || [] };
    mapBounds = data.bounds;
    obstacles = data.obstacles || [];
    const firstTarget = levelDefinition.targets[0];
    targetPoint = firstTarget ? { ...firstTarget.position, altitude: firstTarget.altitude || 0, points: firstTarget.points || 0 } : { x: 0, y: 0, altitude: 0, points: 0 };
  }
  async function loadLevelData() {
    // Direct file:// opening uses this in-code fallback. GitHub Pages loads the canonical YAML.
    if (location.protocol === 'file:') return;
    try {
      const response = await fetch('./levels/puzzle-01.yaml', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      configureLevel(parseYaml(await response.text()));
    } catch (error) {
      console.warn('YAML level se nepodařilo načíst; použije se vestavěná první mise.', error);
    }
  }
  async function startLevel(levelId, playMode) {
    const button = document.querySelector(`#${playMode}Level${Number(levelId.split('-').pop())}`);
    if (button) button.disabled = true;
    try {
      let data;
      if (location.protocol === 'file:') {
        data = ({ 'tutorial-01': fallbackTutorialOne, 'tutorial-02': fallbackTutorialTwo, 'tutorial-03': fallbackTutorialThree, 'puzzle-01': fallbackPuzzleOne, 'puzzle-02': fallbackPuzzleTwo, 'puzzle-03': fallbackPuzzleThree, 'puzzle-04': fallbackPuzzleFour, 'puzzle-05': fallbackPuzzleFive, 'puzzle-06': fallbackPuzzleSix, 'puzzle-07': fallbackPuzzleSeven, 'puzzle-08': fallbackPuzzleEight, 'puzzle-09': fallbackPuzzleNine, 'puzzle-10': fallbackPuzzleTen })[levelId];
      } else {
        const response = await fetch(`./levels/${levelId}.yaml`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        data = parseYaml(await response.text());
      }
      configureLevel(data);
      state = freshState();
      state.playMode = playMode;
      puzzleStartedFromMenu = true;
      menuDialog.close();
      resetLevel();
    } catch (error) {
      console.error(`Level ${levelId} se nepodařilo načíst:`, error);
    } finally {
      if (button) button.disabled = false;
    }
  }
  function hashSeed(value) {
    let hash = 2166136261;
    for (const character of String(value)) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
    return hash >>> 0 || 1;
  }
  function createSeededRandom(seed) {
    let value = hashSeed(seed);
    return () => {
      value += 0x6D2B79F5;
      let t = value;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function generateArcadeLevel(seed) {
    const random = createSeededRandom(seed);
    const bounds = { minX: -16, maxX: 16, minY: -16, maxY: 16 };
    const generatedObstacles = [];
    for (let attempt = 0; attempt < 3000 && generatedObstacles.length < 36; attempt++) {
      const x = Math.round((bounds.minX + 2 + random() * 28) * 10) / 10;
      const y = Math.round((bounds.minY + 2 + random() * 28) * 10) / 10;
      if (Math.hypot(x, y) < 5.5) continue;
      if ([{ x: -11, y: 10 }, { x: 12, y: -10 }, { x: 11, y: 11 }].some(point => Math.hypot(x - point.x, y - point.y) < 2)) continue;
      if (Math.abs(y + 9) < 1.5 || Math.abs(x + 10) < 1.5 || Math.hypot(x - 12, y - 3) < 4.5) continue;
      if (generatedObstacles.some(obstacle => {
        const points = obstacle.polygon || obstacle.lines?.flatMap(line => [line.from, line.to]) || [];
        if (!points.length) return false;
        const cx = points.reduce((sum, point) => sum + point.x, 0) / points.length;
        const cy = points.reduce((sum, point) => sum + point.y, 0) / points.length;
        return Math.hypot(x - cx, y - cy) < 2;
      })) continue;
      const kind = Math.floor(random() * 3);
      generatedObstacles.push(kind === 0
        ? tutorialMountain(x, y, 0.5 + random() * 0.32)
        : kind === 1
          ? tutorialTower(x, y, 0.7 + random() * 0.35, 1.3 + random() * 0.7)
          : tutorialTurbine(x, y));
    }
    const firstTarget = { x: -11 + random() * 2 - 1, y: 10 + random() * 2 - 1 };
    const secondTarget = { x: 12 + random() * 2 - 1, y: -10 + random() * 2 - 1 };
    const thirdTarget = { x: 11 + random() * 2 - 1, y: 11 + random() * 2 - 1 };
    const roadY = -9 + random() * 2 - 1;
    const roadX = -10 + random() * 2 - 1;
    const lake = { x: 12 + random() * 2 - 1, y: 3 + random() * 2 - 1 };
    const targets = [
      { id: 'arcade-depot', kind: 'house', name: 'Zásobovací sklad', position: firstTarget, altitude: 0, points: 10, required: false },
      { id: 'arcade-village', kind: 'house', name: 'Radarová stanice', position: secondTarget, altitude: 0, points: 10, required: false },
      { id: 'arcade-outpost', kind: 'house', name: 'Opěrný bod', position: thirdTarget, altitude: 0, points: 5, required: false }
    ];
    const movingTargets = [
      { id: 'arcade-car-east', kind: 'car', name: 'Terénní vůz', position: { x: -14, y: roadY }, route: [-14, -9, -4, 1, 6, 11, 14, 11, 6, 1, -4, -9].map(x => ({ x, y: roadY })), routeIndex: 0, movementVector: { x: 5, y: 0 }, altitude: 0, points: 2, required: false },
      { id: 'arcade-truck-south', kind: 'truck', name: 'Zásobovací nákladní vůz', position: { x: roadX, y: -14 }, route: [-14, -9, -4, 1, 6, 11, 14, 11, 6, 1, -4, -9].map(y => ({ x: roadX, y })), routeIndex: 0, movementVector: { x: 0, y: 5 }, altitude: 0, points: 2, required: false },
      { id: 'arcade-boat', kind: 'boat', name: 'Hlídkující člun', position: { x: lake.x + 1, y: lake.y - 2 }, route: [{ x: lake.x + 1, y: lake.y - 2 }, { x: lake.x + 2, y: lake.y }, { x: lake.x + 1, y: lake.y + 2 }, { x: lake.x - 1, y: lake.y + 2 }, { x: lake.x - 2, y: lake.y }, { x: lake.x - 1, y: lake.y - 2 }], routeIndex: 0, movementVector: { x: 1, y: 2 }, altitude: 0, points: 2, required: false }
    ];
    const targetPositions = [...targets.map(target => target.position), ...movingTargets.flatMap(target => target.route)];
    const safeObstacles = generatedObstacles.filter(obstacle => targetPositions.every(point => !pointHitsObstacle(point, obstacle)));
    return {
      schemaVersion: 1, id: 'arcade-session', name: 'Volné nebe', modes: ['arcade'], type: 'arcade', seed,
      flightMode: 'basic', flightModeLocked: true, weather: 'sunny', weatherLocked: true,
      bounds, resources: { fuel: 50, ammo: 10 },
      runways: [{ id: 'runway-1', center: { x: 0, y: 0 }, axis: 'horizontal', length: 5, fixed: true }],
      players: [{ id: 'player-1', name: 'Hráč', aircraft: [{ id: 'aircraft-1', name: 'F-16', start: { x: 0, y: 0 }, runwayId: 'runway-1' }] }],
      targets, movingTargets, rules: { movingTargetEscapeIsLoss: false },
      obstacles: safeObstacles, decorations: [{ id: 'arcade-lake', kind: 'lake', center: lake, width: 7, height: 6 }]
    };
  }
  function startArcade() {
    const button = document.querySelector('#arcadeStart');
    button.disabled = true;
    const difficulty = document.querySelector('#arcadeDifficulty').value;
    const aircraft = document.querySelector('#arcadeAircraft').value;
    const seedField = document.querySelector('#arcadeSeed');
    const seed = seedField.value.trim() || String(Math.floor(Math.random() * 2147483646) + 1);
    seedField.value = seed;
    try {
      configureLevel(generateArcadeLevel(seed));
      state = freshState();
      state.playMode = 'arcade';
      state.arcadeSeed = seed;
      state.arcadeRandom = createSeededRandom(seed);
      state.menuSettings.arcadeDifficulty = ['easy', 'normal', 'hard'].includes(difficulty) ? difficulty : 'normal';
      state.menuSettings.arcadeAircraft = aircraft === 'f16' ? aircraft : 'f16';
      puzzleStartedFromMenu = true;
      menuDialog.close();
      resetLevel();
    } finally {
      button.disabled = false;
    }
  }
  function isInsideMap(point) {
    return point.x >= mapBounds.minX && point.x <= mapBounds.maxX && point.y >= mapBounds.minY && point.y <= mapBounds.maxY;
  }
  function liveTargets() {
    const targets = (state.targets || []).filter(target => target.active).map(target => ({ ...target, position: { ...target.position } }));
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
    let enemyCrashed = false;
    state.movingTargets.forEach(target => {
      if (!target.active) return;
      if (target.aiControlled && state.playMode === 'arcade') {
        advanceArcadeEnemy(target);
        if (target.crashed) enemyCrashed = true;
        return;
      }
      if (Array.isArray(target.route) && target.route.length > 1) {
        const previous = target.position;
        target.routeIndex = (target.routeIndex + 1) % target.route.length;
        target.position = { ...target.route[target.routeIndex] };
        target.movementVector = { x: target.position.x - previous.x, y: target.position.y - previous.y };
        return;
      }
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
    if (enemyCrashed && !state.arcadeSpawnCountdown) state.arcadeSpawnCountdown = 2;
    if (state.playMode === 'arcade' && state.arcadeSpawnCountdown > 0) {
      state.arcadeSpawnCountdown--;
      const activeEnemies = state.movingTargets.filter(target => target.active && target.aiControlled).length;
      if (!state.arcadeSpawnCountdown && activeEnemies < 4) spawnArcadeEnemy();
    }
  }
  function initializeArcadeEnemies() {
    state.movingTargets = [];
    state.arcadeSpawnCountdown = 0;
    state.arcadeEnemySerial = 0;
    for (let i = 0; i < 4; i++) spawnArcadeEnemy();
  }
  function spawnArcadeEnemy() {
    const plane = planeFor(state.current);
    const inset = 2;
    let position = { x: mapBounds.maxX - inset, y: mapBounds.maxY - inset };
    for (let attempt = 0; attempt < 100; attempt++) {
      const candidate = {
        x: mapBounds.minX + inset + arcadeRandom() * (mapBounds.maxX - mapBounds.minX - inset * 2),
        y: mapBounds.minY + inset + arcadeRandom() * (mapBounds.maxY - mapBounds.minY - inset * 2)
      };
      if (Math.hypot(candidate.x - plane.position.x, candidate.y - plane.position.y) < 7) continue;
      if (obstacles.some(obstacle => pointHitsObstacle(candidate, obstacle))) continue;
      if (state.movingTargets.some(target => target.active && Math.hypot(candidate.x - target.position.x, candidate.y - target.position.y) < 4)) continue;
      position = candidate;
      break;
    }
    const dx = plane.position.x - position.x, dy = plane.position.y - position.y;
    const length = Math.hypot(dx, dy) || 1;
    const id = `arcade-enemy-${++state.arcadeEnemySerial}`;
    state.movingTargets.push({
      id, kind: 'aircraft', name: `Nepřátelská stíhačka ${state.arcadeEnemySerial}`,
      position, movementVector: { x: dx / length, y: dy / length },
      altitude: 0, points: 3, required: false, aiControlled: true, active: true, destroyed: false
    });
  }
  function advanceArcadeEnemy(enemy) {
    const previous = { ...enemy.position };
    const plane = planeFor(state.current);
    const difficulty = state.menuSettings.arcadeDifficulty || 'normal';
    const toPlayer = { x: plane.position.x - enemy.position.x, y: plane.position.y - enemy.position.y };
    const distance = Math.hypot(toPlayer.x, toPlayer.y) || 1;
    let desired;
    let speed;
    if (difficulty === 'easy') {
      desired = { x: enemy.movementVector.x * 0.8 + (arcadeRandom() - 0.5) * 0.65, y: enemy.movementVector.y * 0.8 + (arcadeRandom() - 0.5) * 0.65 };
      speed = 0.75;
    } else {
      const lead = difficulty === 'hard' ? 2 : 0.8;
      const predicted = { x: plane.position.x + plane.vector.x * lead, y: plane.position.y + plane.vector.y * lead };
      desired = { x: predicted.x - enemy.position.x, y: predicted.y - enemy.position.y };
      if (difficulty === 'hard' && distance < 4) desired = { x: -toPlayer.x, y: -toPlayer.y };
      speed = difficulty === 'hard' ? 1.35 : 0.95;
      desired.x += (arcadeRandom() - 0.5) * 0.35;
      desired.y += (arcadeRandom() - 0.5) * 0.35;
    }
    let length = Math.hypot(desired.x, desired.y) || 1;
    let vector = { x: desired.x / length * speed, y: desired.y / length * speed };
    const next = { x: enemy.position.x + vector.x, y: enemy.position.y + vector.y };
    const outside = next.x < mapBounds.minX || next.x > mapBounds.maxX || next.y < mapBounds.minY || next.y > mapBounds.maxY;
    if (outside || collisionOnPath(previous, next, enemy.altitude || 0, enemy.altitude || 0)) {
      enemy.active = false; enemy.crashed = true;
      return;
    }
    const playerPosition = planeFor(state.current).position;
    if (pointSegmentDistance(playerPosition, previous, next) < 0.32) {
      state.flightStatus = 'crashed';
      state.outcome = 'Srážka s nepřátelským letadlem.';
      enemy.active = false; enemy.crashed = true;
      return;
    }
    enemy.position = next;
    enemy.movementVector = { x: next.x - previous.x, y: next.y - previous.y };
  }
  function arcadeRandom() { return state.playMode === 'arcade' ? state.arcadeRandom() : Math.random(); }

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
    if (state.playMode === 'arcade' && state.movingTargets.some(target => target.active && target.aiControlled && pointSegmentDistance(target.position, plane.position, destination) < 0.32)) {
      return { status: 'crashed', outcome: 'Srážka s nepřátelským letadlem.' };
    }
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
      if (speed === 0 && onRunway(destination)) {
        const outstanding = [...(state.targets || []), ...(state.movingTargets || [])].some(target => target.active && target.required !== false);
        if (outstanding) return { status: 'crashed', outcome: 'Mise nedokončena. Znič všechny povinné cíle před přistáním.' };
        return { status: 'landed', outcome: 'Úspěšné přistání!' };
      }
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
    document.querySelector('.section-heading h1').textContent = state.playMode === 'arcade' ? 'Arcade' : 'Váš tah';
    document.querySelector('#activeName').textContent = player.name;
    document.querySelector('#activeDot').style.background = player.color;
    document.querySelector('#turnBadge').textContent = '1P';
    const modeSelect = document.querySelector('#gameMode');
    modeSelect.value = state.mode;
    modeSelect.disabled = state.moves.length > 0 || !!animation || !!levelDefinition.flightModeLocked;
    const weatherSelect = document.querySelector('#weatherMode');
    weatherSelect.value = state.weather;
    weatherSelect.disabled = state.moves.length > 0 || !!animation || !!levelDefinition.weatherLocked;
    document.querySelector('#flightHelp').textContent = state.shooting
      ? 'Ťukni na cíl v útočné výseči. Po výstřelu letadlo pokračuje stejným vektorem.'
      : state.playMode === 'arcade'
        ? 'Leť, sestřeluj cíle a přistaň pro doplnění zásob. Běh končí až havárií.'
      : state.mode === 'advance'
        ? 'Táhni na vybraném bodu nahoru/dolů pro změnu výšky o 1. Výška 0 mimo letiště znamená havárii.'
        : 'Rozjeď se po dráze 0 → 1 → 2. Ve vzduchu rychlost 1 znamená havárii; přistání: 2 → 1 → 0 na dráze.';
    document.querySelector('#boardHelp').textContent = state.playMode === 'arcade'
      ? `SEED ${state.arcadeSeed}${state.shooting ? ' · VYBER CÍL' : ''}`
      : state.shooting ? 'Střelba · vyber cíl v útočné výseči' : 'Ťukni na jeden z 9 bodů';
    document.querySelector('#finishTurn').hidden = state.mode === 'advance';
    const runwayButton = document.querySelector('#runwayAxis');
    runwayButton.textContent = state.runwayAxis === 'horizontal' ? 'Dráha: vodorovná ↔' : 'Dráha: svislá ↕';
    runwayButton.disabled = state.moves.length > 0 || state.flightStatus !== 'ground' || !!animation || !!runwayFor()?.fixed;
    const statusElement = document.querySelector('#flightStatus');
    statusElement.textContent = state.outcome || state.message;
    statusElement.classList.toggle('hidden', !state.outcome && !state.message);
    statusElement.classList.toggle('is-crashed', state.flightStatus === 'crashed' || state.flightStatus === 'failed');
    const failed = state.flightStatus === 'crashed' || state.flightStatus === 'failed';
    const landed = state.flightStatus === 'landed';
    const gameOverPanel = document.querySelector('#gameOverPanel');
    gameOverPanel.hidden = !failed && !landed;
    gameOverPanel.classList.toggle('is-success', landed);
    document.querySelector('.game-over-mark').textContent = landed ? '✓' : '✕';
    document.querySelector('#gameOverTitle').textContent = landed ? 'Mise dokončena' : state.flightStatus === 'failed' ? 'Mise selhala' : 'Letadlo havarovalo';
    document.querySelector('#gameOverMessage').textContent = landed
      ? `${state.outcome} Celkové skóre: ${state.score}.`
      : state.outcome || 'Let už nemůže pokračovat.';
    const count = state.moves.length;
    document.querySelector('#moveCount').textContent = `${count} ${count === 1 ? 'tah' : count >= 2 && count <= 4 ? 'tahy' : 'tahů'}`;
    document.querySelector('#fuelCount').textContent = state.fuel;
    document.querySelector('#ammoCount').textContent = state.ammo;
    document.querySelector('#scoreCount').textContent = state.score;
    // Keep the hint out of the target cluster, which is centered on the board.
    document.querySelector('#emptyState').classList.add('hidden');
    document.querySelector('#undo').disabled = count === 0 || !!animation;
    document.querySelector('#undo').hidden = state.playMode === 'arcade';
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
    const targetPoints = liveTargets().map(target => target.position);
    const points = [...plane.trail, ...runwayEnds, ...obstaclePoints, ...mapCorners, ...targetPoints, { x: z.x - 1, y: z.y - 1 }, { x: z.x + 1, y: z.y + 1 }];
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
  function drawAircraft(position, vector, color = '#111714', scaleFactor = 1) {
    const p = screen(position);
    const runway = runwayFor();
    const heading = Math.hypot(vector.x, vector.y) > 0
      ? Math.atan2(vector.y, vector.x)
      : (runway.axis || state.runwayAxis) === 'horizontal' ? 0 : Math.PI / 2;
    const size = Math.min(28, Math.max(8, view.scale * 0.65)) * scaleFactor;
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
    ctx.fillStyle = color;
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
    const range = Math.max(0, weapon.range - Math.abs(altitude - (plane.targetAltitude || 0)));
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
    const size = Math.min(28, Math.max(16, view.scale * 0.72));
    const vector = target.movementVector;
    const heading = Math.hypot(vector.x, vector.y) ? Math.atan2(vector.y, vector.x) : 0;
    const inRange = targetInWedge(plane, target);
    const stroke = inRange ? '#8f1717' : '#a92727';
    if (target.kind === 'aircraft') {
      ctx.beginPath(); ctx.arc(p.x, p.y, size * 0.48, 0, Math.PI * 2);
      ctx.fillStyle = '#df343426'; ctx.fill(); ctx.strokeStyle = '#c32e2e'; ctx.lineWidth = inRange ? 2.5 : 1.5; ctx.stroke();
      drawAircraft(target.position, vector, inRange ? '#8f1717' : '#c32e2e', 0.68);
      return;
    }
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(heading); ctx.scale(size, size);
    ctx.lineWidth = 0.055; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, 0, 0.57, 0, Math.PI * 2);
    ctx.fillStyle = '#df343426'; ctx.fill(); ctx.strokeStyle = '#c32e2e'; ctx.lineWidth = inRange ? 0.11 : 0.07; ctx.stroke();
    if (target.kind === 'boat') {
      ctx.beginPath(); ctx.moveTo(0.48, 0.03); ctx.lineTo(0.3, 0.28); ctx.lineTo(-0.38, 0.28); ctx.lineTo(-0.5, 0.03); ctx.lineTo(-0.34, -0.2); ctx.lineTo(0.34, -0.2); ctx.closePath();
      ctx.fillStyle = '#d9413b'; ctx.fill(); ctx.strokeStyle = stroke; ctx.stroke();
      ctx.fillStyle = '#fff0e9'; ctx.fillRect(-0.13, -0.17, 0.3, 0.2);
    } else {
      const length = target.kind === 'truck' ? 0.86 : 0.66;
      ctx.fillStyle = '#d9413b'; ctx.strokeStyle = stroke;
      ctx.beginPath(); ctx.rect(-length / 2, -0.2, length, 0.4); ctx.fill(); ctx.stroke();
      if (target.kind === 'truck') {
        ctx.beginPath(); ctx.rect(length * 0.14, -0.16, 0.24, 0.32); ctx.fillStyle = '#ffe8df'; ctx.fill(); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.rect(0.02, -0.14, 0.2, 0.28); ctx.fillStyle = '#ffe8df'; ctx.fill(); ctx.stroke();
      }
      ctx.fillStyle = '#542c2c';
      [-0.28, 0.18].forEach(x => { ctx.fillRect(x, -0.24, 0.13, 0.07); ctx.fillRect(x, 0.17, 0.13, 0.07); });
    }
    ctx.restore();
  }
  function drawTargets() {
    const plane = planeFor(state.current);
    liveTargets().forEach(target => {
      const p = screen(target.position);
      if (target.kind === 'house') {
        const size = Math.min(22, Math.max(12, view.scale * 0.44));
        const inRange = targetInWedge(plane, target);
        ctx.save(); ctx.translate(p.x, p.y); ctx.scale(size, size);
        ctx.beginPath(); ctx.arc(0, 0.06, 0.68, 0, Math.PI * 2);
        ctx.fillStyle = '#df343426'; ctx.fill(); ctx.strokeStyle = '#c32e2e'; ctx.lineWidth = inRange ? 0.12 : 0.08; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-0.48, -0.05); ctx.lineTo(0, -0.48); ctx.lineTo(0.48, -0.05); ctx.lineTo(0.4, 0.03); ctx.lineTo(0.4, 0.42); ctx.lineTo(-0.4, 0.42); ctx.lineTo(-0.4, 0.03); ctx.closePath();
        ctx.fillStyle = '#ffe8e1'; ctx.fill(); ctx.strokeStyle = inRange ? '#8f1717' : '#a92727'; ctx.lineWidth = 0.09; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-0.53, -0.02); ctx.lineTo(0, -0.55); ctx.lineTo(0.53, -0.02); ctx.lineTo(0.42, 0.08); ctx.lineTo(0, -0.32); ctx.lineTo(-0.42, 0.08); ctx.closePath();
        ctx.fillStyle = '#d9413b'; ctx.fill(); ctx.strokeStyle = '#a92727'; ctx.stroke();
        ctx.fillStyle = '#b82f2c'; ctx.fillRect(-0.12, 0.16, 0.24, 0.26);
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

    (levelDefinition.decorations || []).filter(item => item.kind === 'lake' || item.kind === 'water').forEach(item => {
      const center = screen(item.center || item.position || { x: 0, y: 0 });
      const width = item.width || 6, height = item.height || 4;
      ctx.beginPath();
      ctx.ellipse(center.x, center.y, view.scale * width / 2, view.scale * height / 2, item.rotation || 0, 0, Math.PI * 2);
      ctx.fillStyle = '#e9f4fb'; ctx.fill(); ctx.strokeStyle = '#9ebdd499'; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(center.x - view.scale * 0.12, center.y + view.scale * 0.08, view.scale * width * 0.39, view.scale * height * 0.34, item.rotation || 0, 0.2, Math.PI * 1.8);
      ctx.strokeStyle = '#a9c6dc99'; ctx.lineWidth = 1; ctx.stroke();
    });

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
      const targetsBefore = (state.targets || []).map(target => ({ ...target, position: { ...target.position } }));
      state.moves.push({ player: state.current, playerId: state.players[state.current].id, aircraftId: aircraft.id, runwayId: aircraft.runwayId, from: animation.from, to: animation.to, altitudeFrom: animation.altitudeFrom, altitudeTo: animation.altitudeTo, statusBefore: state.flightStatus, outcomeBefore: state.outcome, targetDestroyedBefore: state.targetDestroyed, targetsBefore, fuelBefore, ammoBefore, scoreBefore, movingTargetsBefore, arcadeSpawnCountdownBefore: state.arcadeSpawnCountdown, arcadeEnemySerialBefore: state.arcadeEnemySerial });
      state.fuel = Math.max(0, state.fuel - 1);
      if (animation.shot) {
        state.ammo = Math.max(0, state.ammo - 1);
        const stationaryTarget = state.targets.find(target => target.id === animation.targetId);
        const hitTarget = stationaryTarget || state.movingTargets.find(target => target.id === animation.targetId);
        if (hitTarget) { hitTarget.active = false; hitTarget.destroyed = true; }
        state.score += animation.scoreAward;
        const hitName = hitTarget?.name || 'Cíl';
        state.message = `${hitName} zničen!`;
        if (state.playMode === 'arcade' && hitTarget?.aiControlled) state.arcadeSpawnCountdown = 2;
        recordArcadeBestScore();
      }
      const arcadeLanding = state.playMode === 'arcade' && result.status === 'landed';
      state.flightStatus = state.fuel === 0 && !arcadeLanding ? 'crashed' : arcadeLanding ? 'ground' : result.status;
      state.outcome = state.fuel === 0 && !arcadeLanding ? 'Došlo palivo. Letadlo havarovalo.' : arcadeLanding ? '' : result.outcome;
      if (arcadeLanding) {
        state.fuel = 50; state.ammo = 10;
        state.message = 'Přistání: palivo doplněno na 50, munice na 10.';
      }
      if (state.flightStatus === 'landed' && state.playMode === 'puzzle') {
        state.score += state.fuel;
        recordPuzzleBestScore();
      }
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
    if (state.playMode === 'arcade') return;
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
    state.targets = move.targetsBefore || createTargets();
    state.arcadeSpawnCountdown = move.arcadeSpawnCountdownBefore ?? state.arcadeSpawnCountdown;
    state.arcadeEnemySerial = move.arcadeEnemySerialBefore ?? state.arcadeEnemySerial;
    state.targetDestroyed = move.targetDestroyedBefore ?? false;
    state.shooting = false; state.message = '';
    save(); renderPlayers();
    if (fitMode) fitView(); else followCurrent();
  });
  document.querySelector('#toggleGrid').addEventListener('click', () => { state.grid = !state.grid; save(); renderPlayers(); draw(); });
  document.querySelector('#newGame').addEventListener('click', () => { if (!animation) dialog.showModal(); });
  document.querySelector('#openMenu').addEventListener('click', () => {
    if (animation) return;
    abandonCurrentGame();
    renderPlayers();
    showMenuScreen('home');
    if (!menuDialog.open) menuDialog.showModal();
  });
  menuDialog.addEventListener('cancel', event => event.preventDefault());
  document.querySelector('#failureRestart').addEventListener('click', resetLevel);
  document.querySelector('#failureSubmenu').addEventListener('click', openModeSubmenu);
  document.querySelector('#arcadeStart').addEventListener('click', startArcade);
  document.querySelectorAll('[data-open-menu]').forEach(button => {
    button.addEventListener('click', () => showMenuScreen(button.dataset.openMenu));
  });
  document.querySelectorAll('[data-menu-back]').forEach(button => {
    button.addEventListener('click', () => showMenuScreen('home'));
  });
  document.querySelector('#tutorialLevel1').addEventListener('click', () => startLevel('tutorial-01', 'tutorial'));
  document.querySelector('#tutorialLevel2').addEventListener('click', () => startLevel('tutorial-02', 'tutorial'));
  document.querySelector('#tutorialLevel3').addEventListener('click', () => startLevel('tutorial-03', 'tutorial'));
  document.querySelector('#puzzleLevel1').addEventListener('click', () => startLevel('puzzle-01', 'puzzle'));
  document.querySelector('#puzzleLevel2').addEventListener('click', () => startLevel('puzzle-02', 'puzzle'));
  document.querySelector('#puzzleLevel3').addEventListener('click', () => startLevel('puzzle-03', 'puzzle'));
  document.querySelector('#puzzleLevel4').addEventListener('click', () => startLevel('puzzle-04', 'puzzle'));
  document.querySelector('#puzzleLevel5').addEventListener('click', () => startLevel('puzzle-05', 'puzzle'));
  document.querySelector('#puzzleLevel6').addEventListener('click', () => startLevel('puzzle-06', 'puzzle'));
  document.querySelector('#puzzleLevel7').addEventListener('click', () => startLevel('puzzle-07', 'puzzle'));
  document.querySelector('#puzzleLevel8').addEventListener('click', () => startLevel('puzzle-08', 'puzzle'));
  document.querySelector('#puzzleLevel9').addEventListener('click', () => startLevel('puzzle-09', 'puzzle'));
  document.querySelector('#puzzleLevel10').addEventListener('click', () => startLevel('puzzle-10', 'puzzle'));
  document.querySelector('#confirmNew').addEventListener('click', event => {
    event.preventDefault(); resetLevel(); dialog.close();
  });
  new ResizeObserver(resize).observe(viewport);
  window.addEventListener('beforeinstallprompt', event => event.preventDefault());
  renderPlayers(); resize(); renderMenuSettings();
  loadLevelData().then(() => {
    if (puzzleStartedFromMenu) return;
    // Re-read storage after the level request, so a player who started immediately keeps their state.
    const restored = load();
    state = restored.levelId === levelDefinition.id ? restored : freshState();
    renderPlayers(); resize(); renderMenuSettings(); draw();
  }).catch(error => console.error('Inicializace levelu selhala:', error));
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
})();
