const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const toast = document.getElementById('toast');
const copyDialog = document.getElementById('copy-dialog');
let toastTimer;
let pointerFrame;

document.getElementById('year').textContent = new Date().getFullYear();

function notify(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('visible');
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3200);
}

async function copyLink(url, button) {
  try {
    await navigator.clipboard.writeText(url);
    notify('Havola nusxalandi');
    if (button) {
      button.classList.add('copied');
      setTimeout(() => button.classList.remove('copied'), 1800);
    }
  } catch {
    // Clipboard permissions can be denied. Keep manual copying available.
    const input = document.getElementById('copy-value');
    input.value = url;
    copyDialog.showModal();
    input.focus();
    input.select();
  }
}

document.querySelectorAll('[data-copy]').forEach(button => {
  button.addEventListener('click', () => copyLink(button.dataset.copy, button));
});
document.getElementById('close-dialog').addEventListener('click', () => copyDialog.close());

const pageUrl = new URL(location.href);
pageUrl.search = '';
pageUrl.hash = '';
document.getElementById('share').addEventListener('click', async () => {
  if (navigator.share) {
    try {
      await navigator.share({ title: 'REYDER — Video Editor', url: pageUrl.href });
    } catch (error) {
      if (error.name !== 'AbortError') await copyLink(pageUrl.href);
    }
  } else {
    await copyLink(pageUrl.href);
  }
});

document.addEventListener('pointermove', event => {
  if (reduceMotion.matches || !finePointer.matches) return;
  cancelAnimationFrame(pointerFrame);
  pointerFrame = requestAnimationFrame(() => {
    document.documentElement.style.setProperty('--x', `${event.clientX}px`);
    document.documentElement.style.setProperty('--y', `${event.clientY}px`);
  });
});

document.querySelectorAll('.social-row').forEach(row => {
  let frame;
  const reset = () => {
    cancelAnimationFrame(frame);
    ['--mx', '--my', '--rx', '--ry', '--lx', '--ly'].forEach(name => row.style.removeProperty(name));
  };
  row.addEventListener('pointermove', event => {
    if (reduceMotion.matches || !finePointer.matches) return;
    // Use the untransformed layout box to avoid feedback from the tilt itself.
    const bounds = row.parentElement.getBoundingClientRect();
    const x = event.clientX - bounds.left - row.offsetLeft;
    const y = event.clientY - bounds.top - row.offsetTop;
    const dx = Math.max(-.5, Math.min(.5, x / row.offsetWidth - .5));
    const dy = Math.max(-.5, Math.min(.5, y / row.offsetHeight - .5));
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      row.style.setProperty('--mx', `${dx * 8}px`);
      row.style.setProperty('--my', `${dy * 6}px`);
      row.style.setProperty('--rx', `${-dy * 6}deg`);
      row.style.setProperty('--ry', `${dx * 5}deg`);
      row.style.setProperty('--lx', `${x}px`);
      row.style.setProperty('--ly', `${y}px`);
    });
  });
  row.addEventListener('pointerleave', reset);
  row.addEventListener('pointercancel', reset);
  reduceMotion.addEventListener('change', reset);
  finePointer.addEventListener('change', reset);
});

document.querySelectorAll('.social').forEach(link => {
  link.addEventListener('pointerdown', event => {
    if (reduceMotion.matches) return;
    const bounds = link.getBoundingClientRect();
    const dot = document.createElement('span');
    dot.className = 'ripple';
    dot.style.left = `${event.clientX - bounds.left - 10}px`;
    dot.style.top = `${event.clientY - bounds.top - 10}px`;
    link.append(dot);
    dot.addEventListener('animationend', () => dot.remove(), { once: true });
  });
});
