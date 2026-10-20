(function() {
  const savedTheme = localStorage.getItem('theme');
  const preferredTheme = savedTheme ? savedTheme : 'dark';
  document.documentElement.setAttribute('data-theme', preferredTheme);
})();
