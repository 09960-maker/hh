// หน้าเลือกมหาวิทยาลัย/คณะ
let exUni = 'ทั้งหมด', exQ = '';
function progCard(p) {
  const goal = {w: p.w, min: p.min, gpax: p.gpax};
  const gc = Calc.gpaxCheck(goal, state.scores);
  const mine = Calc.weighted(goal, state.scores), st = Calc.status(mine - p.min);
  const added = state.goals.some(g => g.id === p.id);
  const hasScore = Object.keys(p.w).some(k => parseFloat(state.scores[k]) > 0);
  return `<div class="card"><strong>${p.f}</strong><div class="muted">${p.u}</div>
  <div class="pills"><span class="tag ${gc.cls}">${gc.ok === undefined ? 'GPAX ≥ ' + p.gpax.toFixed(2) : gc.ok ? 'ผ่านเกรดขั้นต่ำ' : 'เกรดไม่ถึง'}</span>
  ${hasScore ? `<span class="tag ${st.cls}">คะแนน${st.t}</span>` : ''}</div>
  <p class="muted">เกรดขั้นต่ำ ~${p.gpax.toFixed(2)} · คะแนนต่ำสุดปีก่อน ~${p.min}</p>
  <button class="btn ${added ? 'ghost off' : ''}" data-add="${p.id}" ${added ? 'disabled' : ''}>${added ? 'เพิ่มแล้ว' : 'เพิ่มเป็นเป้าหมาย'}</button></div>`;
}
function exList() {
  const l = PROGRAMS.filter(p => (exUni === 'ทั้งหมด' || p.u === exUni) && (p.f + p.u).includes(exQ));
  $('#exlist').innerHTML = l.length ? l.map(progCard).join('') : '<p class="muted">ไม่พบคณะที่ค้นหา ลองคำอื่น</p>';
  document.querySelectorAll('[data-add]').forEach(b => b.onclick = () => {
    const p = PROGRAMS.find(x => x.id === b.dataset.add);
    state.goals.push({id: p.id, name: `${p.f} ${p.u}`, min: p.min, w: p.w, gpax: p.gpax});
    save(); exList();
  });
}
function renderExplore() {
  const unis = ['ทั้งหมด', ...new Set(PROGRAMS.map(p => p.u))];
  $('#view').innerHTML = `<p class="muted">ค่าเกรดและคะแนนเป็นค่าประมาณเพื่อวางแผน ตรวจเกณฑ์จริงที่ mytcas.com</p>
  <input id="exq" type="search" placeholder="ค้นหาคณะ เช่น วิศวกรรม" value="${esc(exQ)}" aria-label="ค้นหาคณะ">
  <div class="chips">${unis.map(u => `<button class="chip ${u === exUni ? 'on' : ''}" data-u="${esc(u)}">${esc(u)}</button>`).join('')}</div><div id="exlist"></div>`;
  $('#exq').oninput = e => { exQ = e.target.value.trim(); exList(); };
  document.querySelectorAll('[data-u]').forEach(b => b.onclick = () => { exUni = b.dataset.u; renderExplore(); });
  exList();
}
