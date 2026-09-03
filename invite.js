(function () {
  document.documentElement.classList.add('js-enabled');

  var DESTINATION = 'main.html';
  var openBtn = document.getElementById('open-btn');
  var opening = document.getElementById('opening');
  var hasNavigated = false;

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function goToInvitation() {
    if (hasNavigated) return;
    hasNavigated = true;
    window.location.href = DESTINATION;
  }

  function openInvitation() {
    if (hasNavigated) return;

    if (prefersReducedMotion()) {
      goToInvitation();
      return;
    }

    opening.classList.add('is-leaving');
    setTimeout(goToInvitation, 620);
  }

  openBtn.addEventListener('click', openInvitation);
})();
