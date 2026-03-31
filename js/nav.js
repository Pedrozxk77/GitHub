function toggleNav() {
  const menu = document.getElementById('navMenu');
  const btn  = menu.querySelector('.nav-trigger');
  const open = menu.classList.toggle('open');
  btn.setAttribute('aria-expanded', open);
}

document.addEventListener('click', function (e) {
  const menu = document.getElementById('navMenu');
  if (!menu.contains(e.target)) {
    menu.classList.remove('open');
    menu.querySelector('.nav-trigger').setAttribute('aria-expanded', false);
  }
});
