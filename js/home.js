// หน้าภาพรวม: GPAX, สรุปเป้าหมาย, ก้าวต่อไป
function renderHome() {
  const rows = state.goals.map(g => {
    const diff = Calc.weighted(g, state.scores) - g.min;
    return {g, diff, st: Calc.status(diff), gc: Calc.gpaxCheck(g, state.scores)};
  }).sort((a, b) => b.diff - a.diff);
  const gp = parseFloat(state.scores.gpax);
  const pass = rows.filter(r => r.gc && r.gc.ok).length;
  const safe = rows.filter(r => r.st.cls === 'safe').length;
  const near = rows.filter(r => r.diff < 0).sort((a, b) => b.diff - a.diff)[0];
  let tip = 'เลือกมหาวิทยาลัยและคณะที่สนใจ แล้วแอปจะคำนวณให้ทันที';
  if (rows.length && near) {
    const n = Calc.needs(near.g, state.scores, -near.diff).find(x => x.req <= x.max);
    tip = `${near.g.name} ขาดอีก ${(-near.diff).toFixed(1)} คะแนน` + (n ? ` ลองดัน ${n.n} ให้ถึง ${n.req.toFixed(n.max === 4 ? 2 : 0)}` : ' ต้องเพิ่มหลายวิชาพร้อมกัน');
  } else if (rows.length) tip = 'ทุกเป้าหมายถึงเกณฑ์แล้ว ลองเพิ่มคณะที่ท้าทายขึ้น';
  const list = rows.map(r => `<div class="card"><div class="row"><strong>${esc(r.g.name)}</strong><span class="tag ${r.st.cls}">${r.st.t}</span></div>
    <div class="bar"><i style="width:${Math.max(0, Math.min(100, Calc.weighted(r.g, state.scores) / r.g.min * 100))}%"></i></div>
    <span class="muted">${r.diff >= 0 ? 'เกินเกณฑ์ ' : 'ขาด '}${Math.abs(r.diff).toFixed(1)} คะแนน${r.gc ? ' · ' + r.gc.t : ''}</span></div>`).join('');
  $('#view').innerHTML = `<section class="hero"><div class="muted-l">GPAX ของคุณ</div>
    <div class="row"><input id="hg" class="hgin" type="number" inputmode="decimal" step="0.01" min="0" max="4" placeholder="0.00" value="${isNaN(gp) ? '' : gp}" aria-label="GPAX"><span class="hmax">/ 4.00</span></div>
    <div class="stats"><div><b>${rows.length}</b>เป้าหมาย</div><div><b>${pass}</b>ผ่านเกรดขั้นต่ำ</div><div><b>${safe}</b>คะแนนปลอดภัย</div></div></section>
    <div class="card tip"><strong>ก้าวต่อไป</strong><p>${esc(tip)}</p>${rows.length ? '' : '<button class="btn" id="go">เลือกมหาวิทยาลัย</button>'}</div>${list}`;
  $('#hg').oninput = e => {
    const v = parseFloat(e.target.value);
    state.scores.gpax = isNaN(v) ? '' : Math.min(Math.max(v, 0), 4);
    save(); clearTimeout(window._t); window._t = setTimeout(render, 600);
  };
  const go = $('#go'); if (go) go.onclick = () => { tab = 'explore'; render(); };
}
