function animateNumber(elementId, targetValue, suffix = '') {
  const el = document.getElementById(elementId);
  if (!el) return;

  const currentText = el.textContent || '';
  const currentVal = parseFloat(currentText.replace(/[^\d.]/g, '')) || 0;
  const targetVal = parseFloat(targetValue) || 0;

  if (currentVal === targetVal) {
    el.textContent = targetVal + suffix;
    return;
  }

  const duration = 350;
  const startTime = performance.now();

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    const eased = progress * (2 - progress); // easeOutQuad
    const val = Math.round(currentVal + (targetVal - currentVal) * eased);
    el.textContent = val + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = targetVal + suffix;
    }
  }
  requestAnimationFrame(update);
}
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}