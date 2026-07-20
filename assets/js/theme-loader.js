(function() {
  const savedTheme = localStorage.getItem('theme');
  const preferredTheme = savedTheme ? savedTheme : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', preferredTheme);
})();
