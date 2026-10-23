// Copyright © 2026 Christopher Snow.
const sidebar = document.querySelector('.sidebar');
const navigation = sidebar?.querySelector('nav');

if (navigation) {
  const phone = matchMedia('(max-width: 760px)');
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'course-contents-toggle';
  toggle.hidden = true;
  toggle.textContent = 'Course contents';
  const symbol = document.createElement('span');
  symbol.setAttribute('aria-hidden', 'true');
  toggle.append(symbol);
  navigation.id ||= 'course-navigation';
  toggle.setAttribute('aria-controls', navigation.id);
  navigation.before(toggle);
  let expanded = false;

  function render() {
    toggle.hidden = !phone.matches;
    navigation.hidden = phone.matches && !expanded;
    toggle.setAttribute('aria-expanded', String(expanded));
    symbol.textContent = expanded ? '▴' : '▾';
  }

  toggle.addEventListener('click', () => {
    expanded = !expanded;
    render();
  });
  sidebar.addEventListener('keydown', event => {
    if (event.key === 'Escape' && phone.matches && expanded) {
      expanded = false;
      render();
      toggle.focus();
    }
  });
  navigation.addEventListener('click', event => {
    if (phone.matches && event.target.closest('a')) {
      expanded = false;
      render();
    }
  });
  phone.addEventListener('change', render);
  render();
}
