import { Ship, Bullet, Saucer } from './entities.js';
import { sound } from './audio.js';

const canvas = document.getElementById('screen');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

let ship, bullets, enemies, score, lives, highscore, paused;
let keys = {};
let overlay = document.getElementById('overlay');
let startBtn = document.getElementById('startBtn');
let howBtn = document.getElementById('howBtn');
let howDiv = document.getElementById('how');

const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const highEl = document.getElementById('highscore');

function resetGame() {
  ship = new Ship(W/2, H/2);
  bullets = [];
  enemies = [];
  score = 0;
  lives = 3;
  paused = false;
  spawnWave(3);
  loadHigh();
  updateUI();
}

function spawnWave(n) {
  for (let i=0;i<n;i++) {
    enemies.push(new Saucer(W,H, Math.random()<0.6 ? 'small' : 'big'));
  }
}

function loadHigh() {
  highscore = parseInt(localStorage.getItem('cs_high') || '0', 10);
  highEl.textContent = 'HIGH: ' + highscore;
}

function saveHigh() {
  if (score > highscore) {
    localStorage.setItem('cs_high', String(score));
    highscore = score;
    highEl.textContent = 'HIGH: ' + highscore;
  }
}

function updateUI() {
  scoreEl.textContent = 'SCORE: ' + score;
  livesEl.textContent = 'LIVES: ' + lives;
}

function rectClear() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0,0,W,H);
}

function distance(a,b) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return Math.sqrt(dx*dx+dy*dy);
}

function spawnExplosion(x,y) {
  // simple flash
  ctx.beginPath();
  ctx.arc(x,y,24,0,Math.PI*2);
  ctx.fillStyle = 'rgba(255,200,50,0.12)';
  ctx.fill();
  sound.beep(300,0.09,'sine',0.15);
}

function update() {
  // handle inputs
  if (keys['ArrowLeft']) ship.rotate(-1);
  if (keys['ArrowRight']) ship.rotate(1);
  if (keys['ArrowUp']) ship.applyThrust();
  if (keys['Space']) {
    if (ship.canFire() && bullets.length < 6) {
      const b = new Bullet(ship.x + Math.cos(ship.angle)*20, ship.y + Math.sin(ship.angle)*20, ship.angle);
      bullets.push(b);
      ship.fire();
    }
  }

  ship.update(W,H);
  bullets.forEach((b,i) => {
    b.update(W,H);
    if (b.life <= 0) bullets.splice(i,1);
  });

  enemies.forEach((e, ei) => {
    e.update();
    // collisions: bullet -> enemy
    bullets.forEach((b, bi) => {
      if (distance(b,e) < e.radius + b.radius) {
        bullets.splice(bi,1);
        e.hp--;
        spawnExplosion(e.x,e.y);
        score += e.score;
        updateUI();
        saveHigh();
        if (e.hp <= 0) {
          enemies.splice(ei,1);
          // spawn replacement with some chance
          if (Math.random() < 0.6) enemies.push(new Saucer(W,H, Math.random()<0.6 ? 'small' : 'big'));
        }
      }
    });

    // collisions: ship -> enemy
    if (distance(ship,e) < e.radius + ship.radius - 4) {
      spawnExplosion(ship.x, ship.y);
      sound.beep(80,0.25,'sawtooth',0.15);
      // reset ship position & lose life
      lives--;
      updateUI();
      ship.x = W/2; ship.y = H/2; ship.vx = ship.vy = 0;
      if (lives <= 0) {
        saveHigh();
        gameOver();
      }
    }
  });

  // wave progression: if few enemies, add more
  if (enemies.length < 2) {
    spawnWave(1 + Math.floor(Math.random()*3));
  }
}

function drawGrid() {
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.strokeStyle = '#66a3ff';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x,0);
    ctx.lineTo(x,H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0,y);
    ctx.lineTo(W,y);
    ctx.stroke();
  }
  ctx.restore();
}

function draw() {
  rectClear();

  // optional faint grid for retro look
  drawGrid();

  // draw ship / bullets / enemies
  ship.draw(ctx);
  bullets.forEach(b => b.draw(ctx));
  enemies.forEach(e => e.draw(ctx));

  // HUD crosshair-ish
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.translate(W/2, H/2);
  ctx.beginPath();
  ctx.arc(0,0,250,0,Math.PI*2);
  ctx.stroke();
  ctx.restore();
}

let lastTime = 0;
function loop(ts) {
  if (!lastTime) lastTime = ts;
  const delta = ts - lastTime;
  lastTime = ts;

  if (!paused && overlay.classList.contains('hidden')) {
    update();
    draw();
  } else {
    // draw once so canvas isn't empty under overlay
    if (overlay.classList.contains('visible')) draw();
  }

  requestAnimationFrame(loop);
}

function gameOver() {
  paused = true;
  overlay.classList.remove('hidden');
  overlay.classList.add('visible');
  overlay.querySelector('h1').textContent = 'GAME OVER';
  overlay.querySelector('#subtitle').textContent = `SCORE: ${score} — HIGH: ${highscore}`;
  startBtn.textContent = 'PLAY AGAIN';
}

function showTitle() {
  overlay.classList.remove('hidden');
  overlay.classList.add('visible');
  overlay.querySelector('h1').textContent = 'COMPUTER SPACE';
  overlay.querySelector('#subtitle').textContent = 'A 1971 arcade inspired remake';
  startBtn.textContent = 'START';
}

startBtn.addEventListener('click', () => {
  overlay.classList.remove('visible');
  overlay.classList.add('hidden');
  paused = false;
  if (lives <= 0 || score === 0) resetGame();
});

howBtn.addEventListener('click', () => {
  if (howDiv.style.display === 'none') howDiv.style.display = 'block'; else howDiv.style.display = 'none';
});

// input handlers
window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'KeyP') paused = !paused;
  // prevent scroll on arrows/space
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

window.addEventListener('load', () => {
  resetGame();
  showTitle();
  requestAnimationFrame(loop);
});