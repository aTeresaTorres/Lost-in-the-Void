/* Reveal on scroll — suave, respeta prefers-reduced-motion */
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!reduce){
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.style.opacity = 1;
        e.target.style.transform = 'translateY(0)';
        io.unobserve(e.target);
      }
    });
  }, {threshold:0.15});

  document.querySelectorAll('.character').forEach(el=>{
    el.style.opacity = 0;
    el.style.transform = 'translateY(40px)';
    el.style.transition = 'opacity 1s ease, transform 1s ease';
    io.observe(el);
  });
}