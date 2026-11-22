// ---- living scene ----
const scene=document.getElementById('scene');
const add=(cls,css,parent=scene)=>{const e=document.createElement('div');e.className='px '+cls;e.style.cssText=css;parent.appendChild(e)};
const r=(a,b)=>a+Math.random()*(b-a);
// water glints
for(let i=0;i<22;i++) add('glint',`left:${r(3,95)}%;top:${r(86,98)}%;width:${r(10,26)}px;animation-delay:-${r(0,5)}s;animation-duration:${r(4,8)}s`);
// fireflies
for(let i=0;i<14;i++) add('fly',`left:${r(4,96)}%;top:${r(40,80)}%;--dx:${r(-40,40)}px;--dy:${r(-30,30)}px;animation-duration:${r(5,10)}s,${r(2,4)}s;animation-delay:-${r(0,6)}s,-${r(0,3)}s`);
// falling leaves from the right trees
for(let i=0;i<7;i++) add('leaf',`left:${r(72,92)}%;top:${r(25,45)}%;animation-duration:${r(9,16)}s;animation-delay:-${r(0,14)}s`);
// fishing line reaches down into the lake
const line=document.getElementById('line');
function sizeLine(){
  const top=line.getBoundingClientRect().top+scrollY;
  const work=document.getElementById('work').getBoundingClientRect().top+scrollY;
  line.style.height=Math.max(60,work-top+70)+'px';
}
// bubbles
const lake=document.getElementById('lake');
for(let i=0;i<16;i++){const e=document.createElement('div');e.className='bubble';const s=r(6,20);
  e.style.cssText=`left:${r(0,100)}%;width:${s}px;height:${s}px;animation-duration:${r(14,30)}s;animation-delay:-${r(0,20)}s`;lake.appendChild(e)}
lake.style.overflow='hidden';
// depth meter
const dEl=document.getElementById('d');
function depth(){
  const m=Math.max(0,Math.round((scrollY+innerHeight*.5-lake.offsetTop)/40));
  dEl.textContent=m+'m';
}
addEventListener('scroll',depth,{passive:true});
addEventListener('resize',()=>{sizeLine();depth()});
addEventListener('load',()=>{sizeLine();depth()});
sizeLine();depth();

// cursor water ripples
if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
  let lastRipple=0;
  addEventListener('pointermove',event=>{
    if(event.pointerType==='touch'||performance.now()-lastRipple<55)return;
    lastRipple=performance.now();
    const ripple=document.createElement('span');
    ripple.className='cursor-ripple';
    ripple.style.left=event.clientX+'px';
    ripple.style.top=event.clientY+'px';
    document.body.appendChild(ripple);
    ripple.addEventListener('animationend',()=>ripple.remove());
  });
}

// fish swimming behind the project and about sections
const fishTypes=['🐟','🐠','🐡'];
for(let i=0;i<7;i++){
  const fish=document.createElement('span');
  fish.className='lake-fish'+(i%2?' reverse':'');
  fish.textContent=fishTypes[i%fishTypes.length];
  fish.style.top=(18+i*11)+'%';
  fish.style.setProperty('--duration',(18+i*3)+'s');
  fish.style.animationDelay=-r(0,18)+'s';
  lake.appendChild(fish);
}

// reveal projects and deeper content as it enters the viewport
document.querySelectorAll('.card,.sec h2,.sec .sub,.about,.floor').forEach(el=>el.classList.add('reveal'));
const revealObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
},{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>revealObserver.observe(el));

// generated river and underwater ambience; starts only after a user presses the button
const soundToggle=document.getElementById('sound-toggle');
let audioContext,masterGain,surfaceGain,underwaterGain,underwaterDepth=0;
function createNoiseSource(seconds){
  const buffer=audioContext.createBuffer(1,audioContext.sampleRate*seconds,audioContext.sampleRate);
  const data=buffer.getChannelData(0);
  let previous=0;
  for(let i=0;i<data.length;i++){
    const white=Math.random()*2-1;
    previous=(previous+(.02*white))/1.02;
    data[i]=previous*3.5;
  }
  const source=audioContext.createBufferSource();
  source.buffer=buffer;
  source.loop=true;
  source.start();
  return source;
}
function initAmbient(){
  if(audioContext)return;
  audioContext=new (window.AudioContext||window.webkitAudioContext)();
  masterGain=audioContext.createGain();
  masterGain.gain.value=0;
  surfaceGain=audioContext.createGain();
  surfaceGain.gain.value=.9;
  underwaterGain=audioContext.createGain();
  underwaterGain.gain.value=0;
  masterGain.connect(audioContext.destination);
  surfaceGain.connect(masterGain);
  underwaterGain.connect(masterGain);

  // River layer: flowing pink noise with sparkling high notes.
  const river=audioContext.createBiquadFilter();
  river.type='bandpass';
  river.frequency.value=900;
  river.Q.value=.55;
  createNoiseSource(4).connect(river).connect(surfaceGain);

  [1108,1479,1760].forEach((frequency,index)=>{
    const shimmer=audioContext.createOscillator();
    const shimmerGain=audioContext.createGain();
    shimmer.type='sine';
    shimmer.frequency.value=frequency;
    shimmerGain.gain.value=.0025/(index+1);
    const shimmerPan=audioContext.createStereoPanner();
    shimmerPan.pan.value=(index-1)*.45;
    shimmer.connect(shimmerGain).connect(shimmerPan).connect(surfaceGain);
    shimmer.start();
  });

  // Underwater layer: deep drones, muffled noise, and slow movement.
  const underwaterMuffler=audioContext.createBiquadFilter();
  underwaterMuffler.type='lowpass';
  underwaterMuffler.frequency.value=220;
  underwaterMuffler.Q.value=.7;
  createNoiseSource(5).connect(underwaterMuffler).connect(underwaterGain);

  [55,82.4,110].forEach((frequency,index)=>{
    const drone=audioContext.createOscillator();
    const droneGain=audioContext.createGain();
    drone.type=index===0?'sine':index===1?'triangle':'sine';
    drone.frequency.value=frequency;
    droneGain.gain.value=index===0?.035:.018;
    drone.connect(droneGain).connect(underwaterGain);
    drone.start();

    const lfo=audioContext.createOscillator();
    const lfoGain=audioContext.createGain();
    lfo.frequency.value=.035+index*.018;
    lfoGain.gain.value=index===0?7:3;
    lfo.connect(lfoGain).connect(drone.frequency);
    lfo.start();
  });
}
function playBubble(){
  if(!audioContext||soundToggle.getAttribute('aria-pressed')!=='true'||underwaterDepth<.25)return;
  const now=audioContext.currentTime;
  const bubble=audioContext.createOscillator();
  const bubbleGain=audioContext.createGain();
  bubble.type='sine';
  bubble.frequency.setValueAtTime(280+r(80,220),now);
  bubble.frequency.exponentialRampToValueAtTime(520+r(80,180),now+.09);
  bubbleGain.gain.setValueAtTime(.0001,now);
  bubbleGain.gain.exponentialRampToValueAtTime(.018*underwaterDepth,now+.025);
  bubbleGain.gain.exponentialRampToValueAtTime(.0001,now+.18);
  bubble.connect(bubbleGain).connect(underwaterGain);
  bubble.start(now);bubble.stop(now+.2);
}
function scheduleBubble(){
  if(audioContext&&soundToggle.getAttribute('aria-pressed')==='true')playBubble();
  setTimeout(scheduleBubble,r(1200,3600));
}
scheduleBubble();
function updateAmbient(){
  if(!audioContext||soundToggle.getAttribute('aria-pressed')!=='true')return;
  const lakeTop=lake.getBoundingClientRect().top+scrollY;
  const position=(scrollY+innerHeight*.5-lakeTop)/(innerHeight*.7);
  underwaterDepth=Math.max(0,Math.min(1,position));
  const now=audioContext.currentTime;
  masterGain.gain.setTargetAtTime(.16,now,.3);
  surfaceGain.gain.setTargetAtTime(1-underwaterDepth*.82,now,.35);
  underwaterGain.gain.setTargetAtTime(.12+underwaterDepth*.88,now,.35);
}
soundToggle.addEventListener('click',()=>{
  initAmbient();
  audioContext.resume();
  const turningOn=soundToggle.getAttribute('aria-pressed')!=='true';
  soundToggle.setAttribute('aria-pressed',String(turningOn));
  soundToggle.querySelector('.sound-label').textContent=turningOn?'Sound on':'Sound off';
  soundToggle.setAttribute('aria-label',turningOn?'Turn ambient lake sound off':'Turn ambient lake sound on');
  const now=audioContext.currentTime;
  masterGain.gain.setTargetAtTime(turningOn?.16:0,now,.25);
  if(turningOn)updateAmbient();
});
addEventListener('scroll',updateAmbient,{passive:true});

// secret cat: synthesized meow and hearts
const cat=document.getElementById('easter-cat');
cat.addEventListener('click',()=>{
  if(!audioContext)initAmbient();
  audioContext.resume();
  const now=audioContext.currentTime;
  const meow=audioContext.createOscillator();
  const meowGain=audioContext.createGain();
  meow.type='triangle';
  meow.frequency.setValueAtTime(520,now);
  meow.frequency.exponentialRampToValueAtTime(780,now+.12);
  meow.frequency.exponentialRampToValueAtTime(430,now+.32);
  meowGain.gain.setValueAtTime(.0001,now);
  meowGain.gain.exponentialRampToValueAtTime(.12,now+.04);
  meowGain.gain.exponentialRampToValueAtTime(.0001,now+.38);
  meow.connect(meowGain).connect(audioContext.destination);
  meow.start(now);meow.stop(now+.4);

  const rect=cat.getBoundingClientRect();
  for(let i=0;i<10;i++){
    const heart=document.createElement('span');
    heart.className='heart-pop';
    heart.textContent=['♡','♥','💗'][i%3];
    heart.style.left=(rect.left+rect.width/2+r(-12,12))+'px';
    heart.style.top=(rect.top+r(-5,8))+'px';
    heart.style.setProperty('--drift',r(-70,70)+'px');
    heart.style.setProperty('--turn',r(-35,35)+'deg');
    heart.style.animationDelay=(i*.07)+'s';
    document.body.appendChild(heart);
    heart.addEventListener('animationend',()=>heart.remove());
  }
});
