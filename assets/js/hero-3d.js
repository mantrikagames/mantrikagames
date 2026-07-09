(function() {
  const hero = document.getElementById('hero');
  if (!hero) return;

  const content = hero.querySelector('.hero-content');
  if (!content) return;

  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const width = rect.width;
    const height = rect.height;
    
    const rotateX = ((y / height) - 0.5) * -8;
    const rotateY = ((x / width) - 0.5) * 8;
    
    content.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  hero.addEventListener('mouseleave', () => {
    content.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
  });
})();
