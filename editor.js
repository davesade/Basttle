(() => {
  const storageKey = 'basttle-level-editor-v1';
  const canvas = document.querySelector('#editorCanvas');
  const ctx = canvas.getContext('2d');
  const canvasWrap = document.querySelector('#canvasWrap');
  const yamlOutput = document.querySelector('#yamlOutput');
  let dpr = 1;
  let geometry = null;
  let selectedId = null;
  let saveTimer = 0;

  const f16 = { id: 'f16', name: 'F-16', outline: { width: 2, height: 2 }, altitudeStep: 1, weapon: { range: 3, ammo: 999 }, mobility: 2, default: true };
  function freshLevel() {
    return {
      schemaVersion: 1,
      id: `level-${Date.now().toString(36)}`,
      name: 'Nový level',
      grid: { width: 31, height: 31 },
      playerCount: 1,
      modes: ['puzzle'],
      entities: [],
      aircraftTypes: [{ ...f16, outline: { ...f16.outline }, weapon: { ...f16.weapon } }],
      generation: { obstacleDensity: 4, enemyPlaneCount: 3 }
    };
  }
  let state = loadLevel();

  function loadLevel() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (saved && saved.grid && Array.isArray(saved.entities)) return normalizeLevel(saved);
    } catch (_) { /* Start a new level if local storage is unavailable or invalid. */ }
    return freshLevel();
  }
  function normalizeLevel(level) {
    const base = freshLevel();
    const normalized = {
      ...base, ...level,
      grid: { ...base.grid, ...(level.grid || {}) },
      generation: { ...base.generation, ...(level.generation || {}) },
      entities: Array.isArray(level.entities) ? level.entities : [],
      aircraftTypes: Array.isArray(level.aircraftTypes) ? level.aircraftTypes : base.aircraftTypes,
      modes: Array.isArray(level.modes) && level.modes.length ? level.modes : ['puzzle']
    };
    if (!normalized.aircraftTypes.some(aircraft => aircraft.id === 'f16')) normalized.aircraftTypes.unshift({ ...f16, outline: { ...f16.outline }, weapon: { ...f16.weapon } });
    normalized.grid.width = oddDimension(normalized.grid.width);
    normalized.grid.height = oddDimension(normalized.grid.height);
    normalized.playerCount = clamp(Number(normalized.playerCount) || 1, 1, 8);
    return normalized;
  }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function oddDimension(value) {
    let n = clamp(Math.round(Number(value) || 31), 9, 101);
    if (n % 2 === 0) n += n === 101 ? -1 : 1;
    return n;
  }
  function saveLevel() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
      document.querySelector('#saveStatus').textContent = 'Uloženo lokálně';
    } catch (_) {
      document.querySelector('#saveStatus').textContent = 'Lokální úložiště nedostupné';
    }
  }
  function changed() {
    document.querySelector('#levelName').value = state.name;
    document.querySelector('#gridWidth').value = state.grid.width;
    document.querySelector('#gridHeight').value = state.grid.height;
    document.querySelector('#playerCount').value = state.playerCount;
    document.querySelectorAll('input[name="mode"]').forEach(input => { input.checked = state.modes.includes(input.value); });
    document.querySelector('#obstacleDensity').value = state.generation.obstacleDensity;
    document.querySelector('#densityValue').value = state.generation.obstacleDensity;
    document.querySelector('#enemyPlaneCount').value = state.generation.enemyPlaneCount;
    sizeCanvas(); renderAircraft(); updateObjectCount(); saveLevel();
  }
  function updateObjectCount() {
    const count = state.entities.length;
    document.querySelector('#objectCount').textContent = `${count} ${count === 1 ? 'objekt' : count >= 2 && count <= 4 ? 'objekty' : 'objektů'}`;
    document.querySelector('#removeSelected').disabled = !selectedId;
  }
  function sizeCanvas() {
    const rect = canvasWrap.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const pad = 20;
    const cell = Math.min((rect.width - pad * 2) / state.grid.width, (rect.height - pad * 2) / state.grid.height);
    const mapWidth = cell * state.grid.width;
    const mapHeight = cell * state.grid.height;
    geometry = { x: (rect.width - mapWidth) / 2, y: (rect.height - mapHeight) / 2, cell, width: mapWidth, height: mapHeight };
    draw();
  }
  function pointAt(x, y) {
    return { x: geometry.x + (x + 0.5) * geometry.cell, y: geometry.y + (y + 0.5) * geometry.cell };
  }
  function gridPosition(event) {
    const rect = canvas.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    const x = Math.floor((localX - geometry.x) / geometry.cell);
    const y = Math.floor((localY - geometry.y) / geometry.cell);
    if (x < 0 || y < 0 || x >= state.grid.width || y >= state.grid.height) return null;
    return { x, y };
  }
  function line(x1, y1, x2, y2, color, width = 1) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
  }
  function drawTerrain(entity, center, cell) {
    const x = center.x; const y = center.y; const r = Math.max(2, cell * 0.45);
    if (entity.type === 'water') {
      ctx.fillStyle = '#e4f2fa'; ctx.fillRect(x - cell / 2, y - cell / 2, cell, cell);
      line(x - r, y - r * .25, x + r, y - r * .25, '#9bc8df', Math.max(1, cell * .04));
      line(x - r * .7, y + r * .3, x + r * .7, y + r * .3, '#9bc8df', Math.max(1, cell * .04));
    } else if (entity.type === 'forest') {
      ctx.fillStyle = '#dcebdc'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      [[-.22,-.12],[.18,-.18],[0,.22]].forEach(([dx,dy]) => { ctx.beginPath(); ctx.moveTo(x + cell * dx, y + cell * (dy - .2)); ctx.lineTo(x + cell * (dx - .16), y + cell * (dy + .12)); ctx.lineTo(x + cell * (dx + .16), y + cell * (dy + .12)); ctx.closePath(); ctx.fillStyle = '#638d69'; ctx.fill(); });
    } else if (entity.type === 'village') {
      ctx.fillStyle = '#e9e4d4'; ctx.fillRect(x-r,y-r,2*r,2*r);
      [[-.22,-.12],[.18,.12]].forEach(([dx,dy]) => { const hx=x+cell*dx,hy=y+cell*dy; ctx.fillStyle='#fff';ctx.fillRect(hx-cell*.12,hy-cell*.09,cell*.24,cell*.2);ctx.beginPath();ctx.moveTo(hx-cell*.15,hy-cell*.09);ctx.lineTo(hx,hy-cell*.2);ctx.lineTo(hx+cell*.15,hy-cell*.09);ctx.fillStyle='#ae8270';ctx.fill(); });
    } else if (entity.type === 'city') {
      ctx.fillStyle = '#eaf0f4'; ctx.fillRect(x-r,y-r,2*r,2*r);
      [[-.3,-.2,.22,.48],[.05,-.1,.2,.62],[.27,.08,.18,.38]].forEach(([dx,dy,w,h])=>{ctx.fillStyle='#9eb3c1';ctx.fillRect(x+cell*dx,y+cell*dy,cell*w,cell*h);});
    } else if (entity.type === 'river') {
      line(x-cell*.47,y-cell*.3,x-cell*.12,y-cell*.08,'#90c5df',Math.max(2,cell*.14));
      line(x-cell*.12,y-cell*.08,x+cell*.15,y+cell*.2,'#90c5df',Math.max(2,cell*.14));
      line(x+cell*.15,y+cell*.2,x+cell*.47,y+cell*.36,'#90c5df',Math.max(2,cell*.14));
    } else if (entity.type === 'bridge') {
      line(x-cell*.45,y,x+cell*.45,y,'#9d8a6e',Math.max(2,cell*.16));
      line(x-cell*.45,y-cell*.2,x+cell*.45,y-cell*.2,'#7e9aae',Math.max(1,cell*.035));
      line(x-cell*.45,y+cell*.2,x+cell*.45,y+cell*.2,'#7e9aae',Math.max(1,cell*.035));
    }
  }
  function drawEntity(entity) {
    const { cell } = geometry; const p = pointAt(entity.x, entity.y); const s = Math.max(3, cell * .72);
    if (['water','forest','village','city','river','bridge'].includes(entity.type)) { drawTerrain(entity, p, cell); return; }
    ctx.save();
    if (selectedId === entity.id) { ctx.beginPath(); ctx.arc(p.x,p.y,s*.78,0,Math.PI*2);ctx.strokeStyle='#e28c45';ctx.lineWidth=Math.max(1.5,cell*.07);ctx.stroke(); }
    if (entity.type === 'mountain') {
      ctx.beginPath();ctx.moveTo(p.x-s*.55,p.y+s*.38);ctx.lineTo(p.x,p.y-s*.58);ctx.lineTo(p.x+s*.58,p.y+s*.38);ctx.closePath();ctx.fillStyle='#e4e0d4';ctx.fill();ctx.strokeStyle='#8d9aa0';ctx.lineWidth=Math.max(1,cell*.045);ctx.stroke();
      ctx.beginPath();ctx.moveTo(p.x-s*.14,p.y-s*.28);ctx.lineTo(p.x,p.y-s*.58);ctx.lineTo(p.x+s*.16,p.y-s*.25);ctx.fillStyle='#fff';ctx.fill();
    } else if (entity.type === 'skyscraper') {
      ctx.fillStyle='#dce8ef';ctx.fillRect(p.x-s*.36,p.y-s*.48,s*.72,s*.96);ctx.strokeStyle='#7894a7';ctx.lineWidth=Math.max(1,cell*.04);ctx.strokeRect(p.x-s*.36,p.y-s*.48,s*.72,s*.96);
      for(let i=-1;i<=1;i++)line(p.x+i*s*.15,p.y-s*.3,p.x+i*s*.15,p.y+s*.3,'#8ab0c8',Math.max(1,cell*.035));
    } else if (entity.type === 'wind-turbine') {
      line(p.x,p.y+s*.42,p.x,p.y-s*.05,'#748b9a',Math.max(1.5,cell*.06));ctx.beginPath();ctx.arc(p.x,p.y-s*.08,s*.08,0,Math.PI*2);ctx.fillStyle='#3478b3';ctx.fill();
      for(let i=0;i<3;i++){const a=-Math.PI/2+i*Math.PI*2/3;line(p.x,p.y-s*.08,p.x+Math.cos(a)*s*.42,p.y-s*.08+Math.sin(a)*s*.42,'#6f8999',Math.max(1.5,cell*.055));}
    } else if (entity.type === 'runway') {
      const vertical=entity.axis==='vertical';const length=Math.min(entity.length||5,vertical?state.grid.height:state.grid.width);
      ctx.fillStyle='#637888';ctx.fillRect(p.x-(vertical?cell*.2:length*cell*.48),p.y-(vertical?length*cell*.48:cell*.2),vertical?cell*.4:length*cell*.96,vertical?length*cell*.96:cell*.4);
      if(vertical){line(p.x,p.y-length*cell*.35,p.x,p.y+length*cell*.35,'#fff',Math.max(1,cell*.035));}else{line(p.x-length*cell*.35,p.y,p.x+length*cell*.35,p.y,'#fff',Math.max(1,cell*.035));}
    } else if (entity.type === 'carrier') {
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-Math.PI/2);ctx.beginPath();ctx.moveTo(0,-s*.58);ctx.lineTo(s*.34,-s*.3);ctx.lineTo(s*.3,s*.48);ctx.lineTo(-s*.3,s*.48);ctx.lineTo(-s*.34,-s*.3);ctx.closePath();ctx.fillStyle='#9aaeb9';ctx.fill();ctx.strokeStyle='#526e80';ctx.lineWidth=Math.max(1,cell*.04);ctx.stroke();ctx.fillStyle='#eaf2f7';ctx.fillRect(-s*.18,-s*.1,s*.36,s*.46);ctx.restore();
    } else if (entity.type === 'enemy-plane') {
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate((entity.heading||0)*Math.PI/180);ctx.beginPath();ctx.moveTo(s*.58,0);ctx.lineTo(-s*.2,-s*.18);ctx.lineTo(-s*.05,0);ctx.lineTo(-s*.2,s*.18);ctx.closePath();ctx.fillStyle='#bd655b';ctx.fill();ctx.strokeStyle='#8a4843';ctx.lineWidth=Math.max(1,cell*.035);ctx.stroke();ctx.restore();
    } else if (entity.type === 'vehicle' || entity.type === 'ship') {
      ctx.save();ctx.translate(p.x,p.y);if(entity.type==='ship')ctx.rotate(-Math.PI/2);ctx.beginPath();ctx.rect(-s*.43,-s*.22,s*.86,s*.44);ctx.fillStyle=entity.type==='ship'?'#b7cbd5':'#d8b991';ctx.fill();ctx.strokeStyle='#7b8f9a';ctx.stroke();ctx.restore();
    } else if (entity.type === 'strategic-target') {
      ctx.beginPath();ctx.rect(p.x-s*.36,p.y-s*.36,s*.72,s*.72);ctx.fillStyle='#e9c77b';ctx.fill();ctx.strokeStyle='#a27d35';ctx.lineWidth=Math.max(1,cell*.05);ctx.stroke();line(p.x-s*.2,p.y,p.x+s*.2,p.y,'#9b7839',Math.max(1,cell*.04));line(p.x,p.y-s*.2,p.x,p.y+s*.2,'#9b7839',Math.max(1,cell*.04));
    } else {
      ctx.beginPath();ctx.moveTo(p.x,p.y-s*.42);ctx.lineTo(p.x+s*.42,p.y+s*.32);ctx.lineTo(p.x-s*.42,p.y+s*.32);ctx.closePath();ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#9b9e96';ctx.lineWidth=Math.max(1,cell*.04);ctx.stroke();
      if(entity.type==='house'){line(p.x-s*.48,p.y-s*.1,p.x,p.y-s*.5,'#a17e69',Math.max(1,cell*.05));line(p.x,p.y-s*.5,p.x+s*.48,p.y-s*.1,'#a17e69',Math.max(1,cell*.05));}
    }
    ctx.restore();
  }
  function draw() {
    if (!geometry) return;
    const rect = canvas.getBoundingClientRect();
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,rect.width,rect.height);
    const {x,y,width,height,cell}=geometry;
    ctx.fillStyle='#fff';ctx.fillRect(x,y,width,height);
    const terrainTypes=['water','forest','village','city','river','bridge'];
    const entities=state.entities.slice();
    entities.filter(entity=>terrainTypes.includes(entity.type)).forEach(drawEntity);
    ctx.strokeStyle='#d4e6f4';ctx.lineWidth=1;
    for(let col=0;col<=state.grid.width;col++){const px=x+col*cell;ctx.beginPath();ctx.moveTo(px,y);ctx.lineTo(px,y+height);ctx.stroke();}
    for(let row=0;row<=state.grid.height;row++){const py=y+row*cell;ctx.beginPath();ctx.moveTo(x,py);ctx.lineTo(x+width,py);ctx.stroke();}
    entities.filter(entity=>!terrainTypes.includes(entity.type)).forEach(drawEntity);
    ctx.strokeStyle='#6e9ec1';ctx.lineWidth=1.5;ctx.strokeRect(x,y,width,height);
  }
  function entityDefaults(type, position) {
    const entity={id:`entity-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`,type,...position};
    if(type==='runway'){entity.axis=document.querySelector('#runwayAxis').value;const axisMax=entity.axis==='horizontal'?state.grid.width:state.grid.height;entity.length=Math.min(clamp(Number(document.querySelector('#runwayLength').value)||5,3,15),axisMax);if(entity.length%2===0)entity.length=Math.min(entity.length+1,axisMax);}
    if(type==='mountain')entity.altitude=5;
    if(type==='skyscraper')entity.altitude=3;
    if(type==='wind-turbine')entity.altitude=2;
    if(type==='house')entity.altitude=0;
    if(type==='strategic-target')entity.points=10;
    if(type==='enemy-plane')Object.assign(entity,{aircraftTypeId:'f16',altitude:0,heading:Math.floor(Math.random()*8)*45});
    if(type==='vehicle'||type==='ship')Object.assign(entity,{movementVector:{x:0,y:0},points:2});
    return entity;
  }
  function handleCanvasPointer(event) {
    if(event.pointerType==='mouse'&&event.button!==0)return;
    const position=gridPosition(event);if(!position)return;
    document.querySelector('#cursorPosition').textContent=`Souřadnice: ${position.x}, ${position.y}`;
    const atCell=state.entities.filter(entity=>entity.x===position.x&&entity.y===position.y);
    const existing=atCell[atCell.length-1];
    const tool=document.querySelector('#toolSelect').value;
    if(tool==='erase'){
      if(existing){state.entities=state.entities.filter(entity=>entity!==existing);selectedId=null;changed();}
      return;
    }
    if(existing){selectedId=existing.id;draw();updateObjectCount();return;}
    const entity=entityDefaults(tool,position);state.entities.push(entity);selectedId=entity.id;changed();
  }
  canvas.addEventListener('pointerdown',event=>{event.preventDefault();canvas.setPointerCapture(event.pointerId);handleCanvasPointer(event);});
  canvas.addEventListener('pointermove',event=>{const position=geometry&&gridPosition(event);if(position)document.querySelector('#cursorPosition').textContent=`Souřadnice: ${position.x}, ${position.y}`;});

  function renderAircraft() {
    const list=document.querySelector('#aircraftList');list.replaceChildren();
    state.aircraftTypes.forEach(aircraft=>{
      const row=document.createElement('div');row.className='aircraft-item';
      const description=document.createElement('div');
      const name=document.createElement('strong');name.textContent=aircraft.name;
      const stats=document.createElement('small');stats.textContent=`Pohyb ${aircraft.mobility} · dostřel ${aircraft.weapon.range} · munice ${aircraft.weapon.ammo}`;
      description.append(name,stats);row.append(description);
      const remove=document.createElement('button');remove.type='button';remove.textContent='Smazat';remove.disabled=aircraft.default;
      remove.addEventListener('click',()=>{state.aircraftTypes=state.aircraftTypes.filter(item=>item.id!==aircraft.id);changed();});
      row.append(remove);list.append(row);
    });
  }
  function addAircraft() {
    const name=document.querySelector('#aircraftName').value.trim();
    if(!name){document.querySelector('#aircraftName').focus();return;}
    const value=id=>{const field=document.getElementById(id);return clamp(Number(field.value)||0,Number(field.min)||0,Number(field.max)||999);};
    state.aircraftTypes.push({id:`aircraft-${Date.now().toString(36)}`,name,outline:{width:value('aircraftOutlineWidth'),height:value('aircraftOutlineHeight')},altitudeStep:value('aircraftAltitudeStep'),weapon:{range:value('aircraftWeaponRange'),ammo:value('aircraftAmmo')},mobility:clamp(value('aircraftMobility'),1,5)});
    document.querySelector('#aircraftName').value='';changed();
  }
  function randomPosition(occupied, safeCenter=false) {
    for(let attempt=0;attempt<2000;attempt++){
      const p={x:Math.floor(Math.random()*state.grid.width),y:Math.floor(Math.random()*state.grid.height)};
      if(safeCenter&&Math.abs(p.x-Math.floor(state.grid.width/2))<4&&Math.abs(p.y-Math.floor(state.grid.height/2))<4)continue;
      const key=`${p.x},${p.y}`;if(occupied.has(key))continue;occupied.add(key);return p;
    }
    return null;
  }
  function generateLevel() {
    const area=state.grid.width*state.grid.height;
    const occupied=new Set();
    const center={x:Math.floor(state.grid.width/2),y:Math.floor(state.grid.height/2)};
    const length=Math.min(5,state.grid.width%2?state.grid.width:state.grid.width-1);
    const entities=[{id:'runway-main',type:'runway',...center,axis:'horizontal',length}];
    for(let dx=-Math.floor(length/2);dx<=Math.floor(length/2);dx++)occupied.add(`${center.x+dx},${center.y}`);
    const obstacleCount=Math.round(area*state.generation.obstacleDensity/100);
    const obstacles=['mountain','mountain','mountain','skyscraper','wind-turbine','house'];
    for(let i=0;i<obstacleCount;i++){
      const position=randomPosition(occupied,true);if(!position)break;
      entities.push(entityDefaults(obstacles[Math.floor(Math.random()*obstacles.length)],position));
    }
    const decorationCount=Math.max(4,Math.round(area/100));
    const decorations=['water','forest','village','city','river','bridge'];
    for(let i=0;i<decorationCount;i++){
      const position=randomPosition(occupied,true);if(!position)break;
      entities.push(entityDefaults(decorations[Math.floor(Math.random()*decorations.length)],position));
    }
    const enemyCount=clamp(Number(state.generation.enemyPlaneCount)||0,0,20);
    for(let i=0;i<enemyCount;i++){
      const position=randomPosition(occupied,false);if(!position)break;
      entities.push(entityDefaults('enemy-plane',position));
    }
    state.entities=entities;state.name='Vygenerovaný level';selectedId=null;changed();
  }
  function getLevelData() {
    return {
      schemaVersion:state.schemaVersion,
      id:state.id,
      name:state.name,
      grid:{...state.grid},
      playerCount:state.playerCount,
      modes:[...state.modes],
      entities:state.entities.map(entity=>JSON.parse(JSON.stringify(entity))),
      aircraftTypes:state.aircraftTypes.map(aircraft=>JSON.parse(JSON.stringify(aircraft))),
      generation:{...state.generation}
    };
  }
  function yamlText() { return stringifyYaml(getLevelData()); }
  function exportLevel() {
    const blob=new Blob([yamlText()],{type:'application/yaml'});
    const url=URL.createObjectURL(blob);const link=document.createElement('a');
    const safeName=state.name.toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-|-$/g,'')||'basttle-level';
    link.href=url;link.download=`${safeName}.yaml`;link.click();URL.revokeObjectURL(url);
  }
  async function copyYaml() {
    const text=yamlText();yamlOutput.hidden=false;yamlOutput.value=text;
    try{await navigator.clipboard.writeText(text);document.querySelector('#saveStatus').textContent='YAML zkopírován';}
    catch(_){yamlOutput.focus();yamlOutput.select();document.querySelector('#saveStatus').textContent='YAML označen ke zkopírování';}
  }
  function importFile(file) {
    const reader=new FileReader();
    reader.onload=()=>{try{state=normalizeLevel(parseYaml(String(reader.result)));selectedId=null;yamlOutput.hidden=true;changed();document.querySelector('#saveStatus').textContent='Level načten';}catch(_){document.querySelector('#saveStatus').textContent='Soubor není platný YAML level';}};
    reader.readAsText(file);
  }

  document.querySelector('#levelName').addEventListener('input',event=>{state.name=event.target.value||'Nový level';saveLevel();});
  document.querySelector('#gridWidth').addEventListener('change',event=>{state.grid.width=oddDimension(event.target.value);selectedId=null;changed();});
  document.querySelector('#gridHeight').addEventListener('change',event=>{state.grid.height=oddDimension(event.target.value);selectedId=null;changed();});
  document.querySelector('#playerCount').addEventListener('change',event=>{state.playerCount=clamp(Number(event.target.value)||1,1,8);changed();});
  document.querySelectorAll('input[name="mode"]').forEach(input=>input.addEventListener('change',()=>{const modes=[...document.querySelectorAll('input[name="mode"]:checked')].map(item=>item.value);state.modes=modes.length?modes:['puzzle'];if(!modes.length)document.querySelector('input[name="mode"][value="puzzle"]').checked=true;saveLevel();}));
  document.querySelector('#obstacleDensity').addEventListener('input',event=>{state.generation.obstacleDensity=Number(event.target.value);document.querySelector('#densityValue').value=event.target.value;saveLevel();});
  document.querySelector('#enemyPlaneCount').addEventListener('change',event=>{state.generation.enemyPlaneCount=clamp(Number(event.target.value)||0,0,20);event.target.value=state.generation.enemyPlaneCount;saveLevel();});
  document.querySelector('#addAircraft').addEventListener('click',addAircraft);
  document.querySelector('#generateLevel').addEventListener('click',generateLevel);
  document.querySelector('#removeSelected').addEventListener('click',()=>{state.entities=state.entities.filter(entity=>entity.id!==selectedId);selectedId=null;changed();});
  document.querySelector('#newLevel').addEventListener('click',()=>{state=freshLevel();selectedId=null;changed();yamlOutput.hidden=true;});
  document.querySelector('#exportLevel').addEventListener('click',exportLevel);
  document.querySelector('#copyYaml').addEventListener('click',copyYaml);
  document.querySelector('#importLevel').addEventListener('change',event=>{const file=event.target.files?.[0];if(file)importFile(file);event.target.value='';});
  document.querySelector('#densityValue').value=state.generation.obstacleDensity;
  changed();
  new ResizeObserver(sizeCanvas).observe(canvasWrap);
  window.addEventListener('keydown',event=>{if((event.key==='Delete'||event.key==='Backspace')&&selectedId){state.entities=state.entities.filter(entity=>entity.id!==selectedId);selectedId=null;changed();}});
})();
