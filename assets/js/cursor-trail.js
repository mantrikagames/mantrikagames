(function() {
  const canvas = document.getElementById('cursor-trail-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let points = [];
  const maxPoints = 20;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  window.addEventListener('mousemove', (e) => {
    points.push({
      x: e.clientX,
      y: e.clientY,
      age: 0
    });
  });

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      ctx.strokeStyle = isDark ? 'rgba(212, 175, 55, 0.2)' : 'rgba(200, 155, 60, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    points.forEach(p => {
      p.age++;
    });

    points = points.filter(p => p.age < maxPoints);

    requestAnimationFrame(tick);
  }
  tick();
})();
