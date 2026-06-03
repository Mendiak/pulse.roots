import { state } from './state.js';

export function initThemeToggle() {
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (!themeToggleBtn) return;

  const themeIcon = themeToggleBtn.querySelector('i');

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
    state.colorScale = d3.scaleOrdinal(d3.schemeTableau10);
    themeIcon.classList.replace('bi-moon', 'bi-sun');
    themeToggleBtn.setAttribute('aria-label', 'Switch to Dark Mode');
    updateD3Colors(true);
  } else {
    document.body.classList.remove('light-mode');
    state.colorScale = d3.scaleOrdinal(d3.schemeTableau10);
    d3.selectAll('.node text').style('fill', '#fff');
    d3.selectAll('.link').attr('stroke', d => {
      const topLevelAncestor = d.target.ancestors().find(ancestor => ancestor.depth === 1);
      return topLevelAncestor ? state.colorScale(topLevelAncestor.data.name) : 'rgba(255, 255, 255, 0.2)';
    });
    themeIcon.classList.replace('bi-sun', 'bi-moon');
    themeToggleBtn.setAttribute('aria-label', 'Switch to Light Mode');
  }

  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');

    state.colorScale = d3.scaleOrdinal(d3.schemeTableau10);
    updateD3Colors(isLight);

    if (isLight) {
      themeIcon.classList.replace('bi-moon', 'bi-sun');
      themeToggleBtn.setAttribute('aria-label', 'Switch to Dark Mode');
    } else {
      themeIcon.classList.replace('bi-sun', 'bi-moon');
      themeToggleBtn.setAttribute('aria-label', 'Switch to Light Mode');
    }
  });
}

function updateD3Colors(isLight) {
  const linkColor = d => {
    const topLevelAncestor = d.target.ancestors().find(ancestor => ancestor.depth === 1);
    return topLevelAncestor ? state.colorScale(topLevelAncestor.data.name) : (isLight ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)');
  };

  d3.selectAll('.node circle').style('fill', d => {
    const topLevelAncestor = d.ancestors().find(ancestor => ancestor.depth === 1);
    if (topLevelAncestor) {
      return state.colorScale(topLevelAncestor.data.name);
    }
    return '#999';
  });

  d3.selectAll('.link').attr('stroke', linkColor);
  d3.selectAll('.node text').style('fill', isLight ? '#0f172a' : '#fff');
}

export function initFullscreen() {
  const fullscreenBtn = document.getElementById('fullscreen-btn');

  if (fullscreenBtn && document.fullscreenEnabled) {
    const fullscreenIcon = fullscreenBtn.querySelector('i');

    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
      } else {
        document.exitFullscreen();
      }
    });

    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement) {
        fullscreenIcon.classList.replace('bi-fullscreen', 'bi-fullscreen-exit');
        fullscreenBtn.setAttribute('aria-label', 'Exit Fullscreen');
      } else {
        fullscreenIcon.classList.replace('bi-fullscreen-exit', 'bi-fullscreen');
        fullscreenBtn.setAttribute('aria-label', 'Enter Fullscreen');
      }
    });
  } else if (fullscreenBtn) {
    fullscreenBtn.style.display = 'none';
  }
}

export function initShuffle() {
  const shuffleBtn = document.getElementById('shuffle-button');
  if (!shuffleBtn) return;

  shuffleBtn.addEventListener('click', async () => {
    const allNodes = d3.selectAll('.clickable-node').data();

    if (allNodes.length > 0) {
      const randomNode = allNodes[Math.floor(Math.random() * allNodes.length)];

      const nodeSelection = d3.selectAll('.clickable-node')
        .filter(d => d === randomNode);

      const nodeColor = nodeSelection.select('circle').style('fill');
      const { showInfoPanel } = await import('./panel.js');
      showInfoPanel(randomNode.data, nodeColor);

      const nodeElement = nodeSelection.node();
      if (nodeElement) {
        const { highlightBranch } = await import('./tree.js');
        highlightBranch(nodeElement, randomNode);
      }
    }
  });
}
