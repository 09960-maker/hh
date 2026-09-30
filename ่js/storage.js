// เก็บข้อมูลในเครื่องด้วย localStorage
const Store = {
  key: 'tcas70-planner',
  load() {
    try {
      const s = JSON.parse(localStorage.getItem(this.key));
      if (s) return s;
    } catch (e) {}
    return {scores: {}, goals: [], events: DEFAULT_EVENTS.slice(), checks: {}};
  },
  save(state) {
    try { localStorage.setItem(this.key, JSON.stringify(state)); } catch (e) {}
  }
};
