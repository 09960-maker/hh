const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let state = Store.load();
let tab = location.hash.slice(1) || 'home';
const save = () => Store.save(state);

function daysLeft(d) { return Math.ceil((new Date(d + 'T00:00:00') - new Date()) / 864e5); }

function renderScores() {
  let html = '', g = '';
  for (const c of COMPONENTS) {
    if (c.g !== g) { if (g) html += '</div>'; g = c.g; html += `<h2>${g}</h2><div class="card grid">`; }
    const max = c.max || 100;
    html += `<label for="s-${c.k}">${c.n}</label><input id="s-${c.k}" data-k="${c.k}" type="number" inputmode="decimal" min="0" max="${max}" step="${c.max ? 0.01 : 0.25}" value="${state.scores[c.k] ?? ''}">`;
  }
  $('#view').innerHTML = '<p class="muted">ยังไม่สอบ ใส่คะแนนที่คาดหวังเพื่อลองวางแผนได้</p>' + html + '</div>';
  document.querySelectorAll('[data-k]').forEach(el => el.oninput = () => {
    const max = el.max * 1;
    let v = parseFloat(el.value);
    if (!isNaN(v)) v = Math.min(Math.max(v, 0), max);
    state.scores[el.dataset.k] = isNaN(v) ? '' : v;
    save(); updateSummary();
  });
}

function goalCard(g) {
  const mine = Calc.weighted(g, state.scores);
  const diff = mine - g.min, st = Calc.status(diff);
  let need = '';
  if (diff < 0) {
    const rows = Calc.needs(g, state.scores, -diff).map(n =>
      n.req <= n.max ? `<li>${esc(n.n)} ต้องได้ ${n.req.toFixed(n.max === 4 ? 2 : 1)}</li>` : '').join('');
    need = `<details><summary>ต้องเพิ่มวิชาไหนเท่าไร</summary><ul class="need">${rows || '<li>เพิ่มวิชาเดียวไม่พอ ต้องเพิ่มหลายวิชา</li>'}</ul></details>`;
  }
  const tw = Calc.totalWeight(g), gc = Calc.gpaxCheck(g, state.scores);
  return `<div class="card"><div class="row"><strong>${esc(g.name)}</strong><span class="tag ${st.cls}">${st.t}</span></div>
  <div class="row"><span class="big">${mine.toFixed(2)}</span><span class="muted">เกณฑ์ปีก่อน ${g.min} (${diff >= 0 ? '+' : ''}${diff.toFixed(2)})</span></div>
  <div class="bar"><i style="width:${Math.min(mine, 100)}%"></i><b style="left:${Math.min(g.min, 100)}%"></b></div>
  ${gc ? `<p class="gl ${gc.cls}">${gc.t}</p>` : ''}${tw !== 100 ? `<p class="muted">สัดส่วนรวม ${tw}% (ควรเป็น 100%)</p>` : ''}${need}
  <button class="btn ghost" data-del="${g.id}">ลบ</button></div>`;
}

function renderGoals() {
  const wInputs = COMPONENTS.map(c => `<label for="w-${c.k}">${c.n}</label><input id="w-${c.k}" data-w="${c.k}" type="number" min="0" max="100" placeholder="%">`).join('');
  const list = state.goals.length ? state.goals.map(goalCard).join('') : '<p class="muted">ยังไม่มีเป้าหมาย เพิ่มคณะ/สาขาที่อยากเข้าด้านล่าง</p>';
  const cnt = {safe: 0, fight: 0, risk: 0};
  state.goals.forEach(g => cnt[Calc.status(Calc.weighted(g, state.scores) - g.min).cls]++);
  const msg = cnt.safe === 0 ? 'ยังไม่มีตัวเลือกปลอดภัย ลองเพิ่มสาขาที่เกณฑ์ต่ำกว่า' : cnt.risk > cnt.safe + cnt.fight ? 'เสี่ยงเยอะไป ควรเพิ่มตัวเลือกสำรอง' : 'รายการเป้าหมายค่อนข้างสมดุล';
  const verdict = state.goals.length ? `<div class="card">ภาพรวม: ปลอดภัย ${cnt.safe} · สู้ได้ ${cnt.fight} · เสี่ยง ${cnt.risk}. ${msg}</div>` : '';
  $('#view').innerHTML = verdict + list + `<h2>เพิ่มเป้าหมาย</h2><form class="card" id="gform">
  <div class="grid"><label for="gname">คณะ/สาขา</label><input id="gname" required placeholder="เช่น วิศวะ จุฬาฯ"><label for="gmin">คะแนนต่ำสุดปีก่อน</label><input id="gmin" type="number" step="0.01" min="0" max="100" required></div>
  <details><summary>สัดส่วนคะแนน (%)</summary><div class="grid">${wInputs}</div></details>
  <button class="btn" type="submit">เพิ่มเป้าหมาย</button></form>`;
  $('#gform').onsubmit = e => {
    e.preventDefault();
    const w = {};
    document.querySelectorAll('[data-w]').forEach(i => { const v = parseFloat(i.value); if (v > 0) w[i.dataset.w] = v; });
    if (!Object.keys(w).length) { alert('ใส่สัดส่วนคะแนนอย่างน้อย 1 วิชา'); return; }
    state.goals.push({id: 'g' + Date.now(), name: $('#gname').value.trim(), min: parseFloat($('#gmin').value), w});
    save(); render();
  };
  document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
    state.goals = state.goals.filter(g => g.id !== b.dataset.del); save(); render();
  });
}

function renderSchedule() {
  const ev = state.events.slice().sort((a, b) => a.date.localeCompare(b.date)).map(e => {
    const d = daysLeft(e.date);
    return `<div class="card row"><div><strong>${esc(e.title)}</strong><div class="muted">${e.date}</div></div><div class="row"><span class="days">${d >= 0 ? d + ' วัน' : 'ผ่านแล้ว'}</span><button class="btn ghost" data-ev="${e.id}">ลบ</button></div></div>`;
  }).join('');
  const chk = CHECKLIST.map(c => `<label class="chk ${state.checks[c.id] ? 'done' : ''}"><input type="checkbox" data-c="${c.id}" ${state.checks[c.id] ? 'checked' : ''}><span>${c.t}</span></label>`).join('');
  $('#view').innerHTML = `<p class="muted">วันที่ตั้งต้นอ้างอิงจากข่าว ควรเช็กกับ mytcas.com อีกครั้ง</p>${ev}
  <form class="card" id="eform"><div class="grid"><label for="et">ชื่อกำหนดการ</label><input id="et" required><label for="ed">วันที่</label><input id="ed" type="date" required></div><br><button class="btn" type="submit">เพิ่มกำหนดการ</button></form>
  <h2>เช็กลิสต์เตรียมตัว</h2><div class="card">${chk}</div>`;
  $('#eform').onsubmit = e => { e.preventDefault(); state.events.push({id: 'e' + Date.now(), title: $('#et').value.trim(), date: $('#ed').value}); save(); render(); };
  document.querySelectorAll('[data-ev]').forEach(b => b.onclick = () => { state.events = state.events.filter(e => e.id !== b.dataset.ev); save(); render(); });
  document.querySelectorAll('[data-c]').forEach(i => i.onchange = () => { state.checks[i.dataset.c] = i.checked; save(); render(); });
}

function updateSummary() {
  const next = state.events.filter(e => daysLeft(e.date) >= 0).sort((a, b) => a.date.localeCompare(b.date))[0];
  $('#summary').textContent = next ? `${next.title} อีก ${daysLeft(next.date)} วัน` : 'เพิ่มกำหนดการสอบของคุณ';
}

function render() {
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  ({home: renderHome, scores: renderScores, explore: renderExplore, goals: renderGoals, schedule: renderSchedule}[tab] || renderHome)();
  updateSummary();
}
document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => { tab = b.dataset.tab; location.hash = tab; render(); });
render();
