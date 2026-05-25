// ── Tab Switching ───────────────────────────────────────────
const tabBtns   = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {

    // Update active button
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Show correct panel
    const target = btn.dataset.tab;
    tabPanels.forEach(panel => {
      panel.classList.remove('active');
    });
    document.getElementById(`tab-${target}`).classList.add('active');

    // Re-setup scrollama when switching to abby's tab
    if (target === 'abby') setupScrollama();
  });
});

// ── Scrollama ───────────────────────────────────────────────
function setupScrollama() {
  const scroller = scrollama();

  scroller
    .setup({
      step: '#tab-abby .scroll-section',
      offset: 0.4,
      debug: false
    })
    .onStepEnter(response => {
      const id = response.element.id;

      if (id === 'section-now')       drawKeeling();
      if (id === 'section-history')   drawHistorical();
      if (id === 'section-futures')   drawFan();
      if (id === 'section-adventure') drawAdventure();
    });
}

// Initialize on page load
setupScrollama();