import { sound } from './audio.js';

// Basic vector helper
function wrap(value, max) {
  if (value < 0) return value + max;
  if (value >= max) return value - max;
  return value;
}

export class Ship {
  constructor(x,y) {
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.angle = -Math.PI/2; // facing up
    this.radius = 14;
    this.thrust = 0;
    this.cooldown = 0;
  }

  rotate(dir) { this.angle += dir * 0.08; }
  applyThrust() {
    const acc = 0.18;
    this.vx += Math.cos(this.angle) * acc;
    this.vy += Math.sin(this.angle) * acc;
    this.thrust = 6; // for flame drawing
  }

  update(width, height) {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.995;
    this.vy *= 0.995;
    this.x = wrap(this.x, width);
    this.y = wrap(this.y, height);
    if (this.cooldown > 0) this.cooldown--;
    if (this.thrust > 0) this.thrust = Math.max(0, this.thrust - 0.5);
  }

  canFire() { return this.cooldown === 0; }
  fire() { this.cooldown = 12; sound.beep(1200,0.03,'square',0.06); }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // ship triangular hull
    ctx.beginPath();
    ctx.moveTo(18,0);
    ctx.lineTo(-12,10);
    ctx.lineTo(-6,0);
    ctx.lineTo(-12,-10);
    ctx.closePath();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

    // small inner detail
    ctx.beginPath();
    ctx.moveTo(-6,0);
    ctx.lineTo(6,0);
    ctx.stroke();

    // flame when thrusting
    if (this.thrust > 0) {
      ctx.beginPath();
      ctx.moveTo(-12,0);
      ctx.lineTo(-24 - this.thrust*2, -6);
      ctx.lineTo(-24 - this.thrust*2, 6);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,140,0,0.9)';
      ctx.fill();
    }

    ctx.restore();
  }
}

export class Bullet {
  constructor(x,y,angle) {
    this.x = x; this.y = y;
    this.vx = Math.cos(angle) * 8;
    this.vy = Math.sin(angle) * 8;
    this.life = 60;
    this.radius = 2.5;
  }

  update(width, height) {
    this.x += this.vx; this.y += this.vy;
    this.x = wrap(this.x, width); this.y = wrap(this.y, height);
    this.life--;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
    ctx.fillStyle = 'white';
    ctx.fill();
  }
}

export class Saucer {
  constructor(width, height, size='small') {
    this.width = width; this.height = height;
    this.size = size; // 'small' or 'big'
    const edge = Math.random() < 0.5 ? 0 : 1; // spawn on vertical or horizontal edge
    if (edge === 0) {
      this.x = Math.random() * width;
      this.y = Math.random() < 0.5 ? 0 : height;
    } else {
      this.x = Math.random() < 0.5 ? 0 : width;
      this.y = Math.random() * height;
    }
    this.vx = (Math.random()-0.5) * (size==='small' ? 2.5 : 1.5);
    this.vy = (Math.random()-0.5) * (size==='small' ? 2.5 : 1.5);
    this.radius = size==='small' ? 18 : 28;
    this.angle = Math.random()*Math.PI*2;
    this.hp = size==='small' ? 1 : 2;
    this.score = size==='small' ? 100 : 50;
  }

  update() {
    this.x += this.vx; this.y += this.vy;
    // bounce off bounds softly
    if (this.x < 0 || this.x > this.width) this.vx *= -1;
    if (this.y < 0 || this.y > this.height) this.vy *= -1;
    this.angle += 0.02 * (this.vx>0?1:-1);
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    // saucer body
    ctx.beginPath();
    ctx.ellipse(0,0,this.radius, this.radius*0.6, 0, 0, Math.PI*2);
    ctx.strokeStyle = 'white';
    ctx.lineWidth=2;
    ctx.stroke();

    // dome
    ctx.beginPath();
    ctx.ellipse(0, -this.radius*0.25, this.radius*0.5, this.radius*0.35, 0, 0, Math.PI);
    ctx.stroke();

    ctx.restore();
  }
}