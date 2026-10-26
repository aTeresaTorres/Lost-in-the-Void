/* Typing */
const phrases = [
  "Una historia que está tomando forma",
  "Pronto, en algún lugar entre las páginas",
  "Escribiendo el siguiente capítulo",
  "Algo se está gestando en la oscuridad"
];
const typeEl = document.getElementById('typeText');
let pIndex = 0, cIndex = 0, deleting = false;

function typeLoop(){
  const current = phrases[pIndex];
  if(!deleting){
    typeEl.textContent = current.slice(0, cIndex++);
    if(cIndex > current.length){
      deleting = true;
      setTimeout(typeLoop, 1800);
      return;
    }
  } else {
    typeEl.textContent = current.slice(0, cIndex--);
    if(cIndex < 0){
      deleting = false;
      pIndex = (pIndex + 1) % phrases.length;
      cIndex = 0;
    }
  }
  setTimeout(typeLoop, deleting ? 35 : 65);
}
typeLoop();

/* Progreso — ahora 7% */
const fill = document.getElementById('progressFill');
const pct  = document.getElementById('progressPct');
let target = 0;
setTimeout(()=>{
  target = 7;
  fill.style.width = target + '%';
  let n = 0;
  const tick = setInterval(()=>{
    n += 1;
    pct.textContent = Math.min(n, target) + '%';
    if(n >= target) clearInterval(tick);
  }, 90);
}, 800);

/* Form */
function handleSubmit(){
  const email = document.getElementById('emailInput').value.trim();
  const toast = document.getElementById('toast');
  if(!email) return;
  document.getElementById('emailInput').value = '';
  toast.classList.add('show');
  setTimeout(()=> toast.classList.remove('show'), 4000);
}