window.onload = function init() {
  // called after the page is entirely loaded

    //test();

    fpsContainer = document.getElementById("fpsContainer");
    canvas = document.getElementById("myCanvas");
    ctx = canvas.getContext('2d');
    canvas.width = canvas.getBoundingClientRect().width;
    canvas.height = canvas.getBoundingClientRect().height;
    WIDTH = canvas.width;
    HEIGHT = canvas.height;

  // Add the listener to the main, window object, and update the states
  window.addEventListener('keydown', function(event){
    if (event.keyCode === 37) {
      input.left = true;
    } else if (event.keyCode === 38) {
      input.up = true;
    } else if (event.keyCode === 39) {
      input.right = true;
    } else if (event.keyCode === 32) {
      input.space = true;
    } else if (event.keyCode === 13) {
      input.enter = true;
    } else {
      return;
    }
    if (event.target == document.body) {
      event.preventDefault();
    }
  }, false);
  // If the key is released, change the states object
  window.addEventListener('keyup', function(event){
    if (event.keyCode === 37) {
      input.left = false;
    } else if (event.keyCode === 38) {
      input.up = false;
    } else if (event.keyCode === 39) {
      input.right = false;
    } else if (event.keyCode === 32) {
      input.space = false;
    } else if (event.keyCode === 13) {
      input.enter = false;
    }
  }, false);

  imageCollection = loadImages(
    ["player", "asteroid", "missile"],
    ["img/player.png", "img/asteroid2.png", "img/missile.svg"]
  );
};

var imageCollection;

function loadImages(names, files) {
  var i, numLoading = names.length;
  const onload = () => --numLoading === 0 && requestAnimationFrame(mainloop);
  const images = {};
  for (i = 0; i <= names.length; i++) {
    const img = images[names[i]] = new Image;
    img.src = files[i];
    img.onload = onload;
  }
  return images;
}

// vars for counting frames/s, used by the measureFPS function
var frameCount = 0;
var lastTime = 0;
var fpsContainer;
var fps;
var measureFPS = function(newTime){
  // test for the very first invocation
  if(lastTime === undefined) {
    lastTime = newTime;
    return;
  }
  // calculate the delta between last & current frame
  var diffTime = newTime - lastTime;
  if (diffTime >= 1000) {
    fps = frameCount;
    frameCount = 0;
    lastTime = newTime;
  }
  // and display it in an element we appended to the
  // document in the start() function
  fpsContainer.innerHTML = 'FPS: ' + fps;
  frameCount++;
};

function drawGameOverScreen() {
  ctx.save();
  ctx.font = "40px Consolas";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText("Game Over", WIDTH / 2, 0.35 * HEIGHT);
  ctx.fillText("Final Score: " + score, WIDTH / 2, 0.5 * HEIGHT);
  ctx.font = "36px Consolas";
  ctx.fillText("Press Enter to continue...", WIDTH / 2, 0.70 * HEIGHT);
  ctx.restore();
}

const states = {
  TITLE: 'Title',
  PLAY: 'Play',
  GAME_OVER: 'Game Over'
}

function drawTitleScreen() {
  ctx.save();
  ctx.font = "40px Consolas";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText("Gravity Dash", WIDTH / 2, 0.4 * HEIGHT);
  ctx.font = "36px Consolas";
  ctx.fillText("Press Enter to play...", WIDTH / 2, 0.70 * HEIGHT);
  ctx.restore();
}

function clearCanvas() {
  ctx.save();
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.restore();
}

function drawScore() {
  ctx.save();
  ctx.fillStyle = "white";
  ctx.font = "20px Consolas";
  ctx.textAlign = "right";
  ctx.fillText("Score: " + score, WIDTH - 10, 20);
  ctx.restore();
}

function initGame() {
  score = 0;
  planets = [];
  asteroids = [];
  missiles = [];
  player = new Player();
  generatePlanets();
}

function generatePlanets() {
  let count = 0;
  let amount = 2 + Math.random() * 3;
  while (count < amount) {
    let p = new Planet();

    if (p.physics.distSqr(player.physics) <= 15000) { // dont generate planets close to the player
      continue;
    }
    let skip = false; //don't generate planets that collide with each other
    for (let i = 0; i < planets.length; i++) {
      if (planets[i].physics.collides(p.physics)) {
        skip = true;
        break;
      }
    }
    if (skip) {
      continue;
    }
    planets.push(p);
    count++;
  }
}

function drawPlanets() {
  for (let i = 0; i < planets.length; i++) {
    planets[i].draw();
  }
}

function drawAsteroids() {
  for (let i = 0; i < asteroids.length; i++) {
    asteroids[i].draw();
  }
}

var player;
var state = states.TITLE;
var ctx;
var canvas;
var WIDTH;
var HEIGHT;
var score;
var planets;
var asteroids = [];
var missiles = [];
var lastPTime;
var delta;
var stopwatchTime = performance.now() - 300;
// vars for handling inputs
var input = {};
function mainloop(time) {
  delta = (lastPTime - performance.now()) / 1000;
  clearCanvas();
  switch(state) {
    case states.TITLE:
      drawTitleScreen();
      if (input.enter && ((performance.now() - stopwatchTime) >= 300)) {
        state = states.PLAY;
        initGame();
      }
      break;
    case states.GAME_OVER:
      drawGameOverScreen();
      if (input.enter) {
        stopwatchTime = performance.now();
        state = states.TITLE;
      }
      break;
    case states.PLAY:
      addAsteroids();
      checkCollisions();
      handlePlayerInput();
      handlePhysics();
      drawPlanets();
      drawAsteroids();
      drawMissiles();
      player.draw();
      drawScore();
      score++;
      break;
  }


  // compute FPS, called each frame, uses the high resolution time parameter
  // given by the browser that implements the requestAnimationFrame API
  measureFPS(time);
  // call back itself every 60th of second
  lastPTime = performance.now();
  requestAnimationFrame(mainloop);
}

function drawMissiles() {
  for (let i = 0; i < missiles.length; i++) {
    missiles[i].draw();
  }
}

function ranBool() {
  return Math.random() < 0.5;
}

function addAsteroids() {
  if (asteroids.length >= maxAsteroids) {
    return;
  }
  let scale = 1 + asteroids.length;
  if (50 * Math.random() * scale < 1) {
    let asteroid = new Asteroid();
    let p = asteroid.physics;
    if (ranBool()) { // left/right
      if (ranBool()) {
        p.x = WIDTH + 1;
        p.vx = 10 + Math.random() * asteroidStartSpeed;
      } else {
        p.x = -1;
        p.vx = -10 - Math.random() * asteroidStartSpeed;
      }
      p.y = Math.random() * HEIGHT;
      p.vy = -0.5 + Math.random();
    } else { // down/up
      if (ranBool()) {
        p.y = -1;
        p.vy = -10 - Math.random() * asteroidStartSpeed;
      } else {
        p.y = HEIGHT + 1;
        p.vy = 10 + Math.random() * asteroidStartSpeed;
      }
      p.x = Math.random() * WIDTH;
      p.vx = -0.5 + Math.random();
    }
    asteroids.push(asteroid);
  }
}

function gameOver() {
  state = states.GAME_OVER;
}

function checkCollisions() {
  //actual collisions
  for (let j = 0; j < planets.length; j++) {
    if (player.physics.collides(planets[j].physics)) {
      gameOver();
      return;
    }
    for (let i = asteroids.length - 1; i >= 0; i--) {
      if (asteroids[i].physics.collides(planets[j].physics)) {
        asteroids.splice(i, 1);
      }
    }
    for (let i = missiles.length - 1; i >= 0; i--) {
      if (missiles[i].physics.collides(planets[j].physics)) {
        missiles.splice(i, 1);
      }
    }
  }

  for (let i = asteroids.length - 1; i >= 0; i--) {
    for (let j = missiles.length - 1; j >= 0; j--) {
      if (asteroids[i].physics.collides(missiles[j].physics)) {
        asteroids.splice(i, 1);
        missiles.splice(j, 1);
        score += 1000;
        break;
      }
    }
  }

  for (let i = 0; i < asteroids.length; i++) {
    if (asteroids[i].physics.collides(player.physics)) {
      gameOver();
      return;
    }
  }
  for (let i = 0; i < missiles.length; i++) {
    if (missiles[i].physics.collides(player.physics)) {
      gameOver();
      return;
    }
  }


  //bounding checks
  for (let i = 0; i < asteroids.length; i++) {
    if (asteroids[i].physics.x < 0) {
      asteroids[i].physics.x = WIDTH;
    } else if (asteroids[i].physics.x > WIDTH) {
      asteroids[i].physics.x = 0;
    }
    if (asteroids[i].physics.y < 0) {
      asteroids[i].physics.y = HEIGHT;
    } else if (asteroids[i].physics.y > HEIGHT) {
      asteroids[i].physics.y = 0;
    }
  }

  for (let i = 0; i < missiles.length; i++) {
    if (missiles[i].physics.x < 0) {
      missiles[i].physics.x = WIDTH;
    } else if (missiles[i].physics.x > WIDTH) {
      missiles[i].physics.x = 0;
    }
    if (missiles[i].physics.y < 0) {
      missiles[i].physics.y = HEIGHT;
    } else if (missiles[i].physics.y > HEIGHT) {
      missiles[i].physics.y = 0;
    }
  }

  if (player.physics.x < 0) {
    player.physics.x = WIDTH;
  } else if (player.physics.x > WIDTH) {
    player.physics.x = 0;
  }
  if (player.physics.y < 0) {
    player.physics.y = HEIGHT;
  } else if (player.physics.y > HEIGHT) {
    player.physics.y = 0;
  }
}

class Entity {
  constructor() {
    if (new.target === Entity) {
      throw new TypeError("Cannot construct Entity instances directly");
    }
    if (this.draw === undefined) {
      // or maybe test typeof this.method === "function"
      throw new TypeError("Must override draw");
    }
  }

  draw() {}
}

class Player extends Entity {
  constructor() {
    super();
    this.physics = new PhysicsObject(imageCollection["player"].width / 2, imageCollection["player"].height / 2, 10,WIDTH/2, HEIGHT/2, 0, 0, 180, 0, 1, false, true);
  }

  draw() {
    ctx.save();
    let playerImage = imageCollection["player"];
    ctx.translate(this.physics.cx(), this.physics.cy());
    ctx.rotate(this.physics.rot * Math.PI / 180);
    ctx.drawImage(playerImage, -this.physics.xoffset, -this.physics.yoffset);
    ctx.restore();
  }
}

class Asteroid extends Entity {
  constructor() {
    super();
    this.physics = new PhysicsObject(imageCollection["asteroid"].width / 2, imageCollection["asteroid"].height / 2, 15,0, 0, 0, 0, 0, 0, 5, false, true);
  }

  draw() {
    ctx.save();
    let asteroidImage = imageCollection["asteroid"];
    ctx.translate(this.physics.cx(), this.physics.cy());
    ctx.rotate(this.physics.rot * Math.PI / 180);
    ctx.drawImage(asteroidImage, -this.physics.xoffset, -this.physics.yoffset);
    ctx.restore();
  }
}

class Planet extends Entity {
  constructor() {
    super();
    this.physics = new PhysicsObject(0, 0, 30,WIDTH * 0.1 + Math.random() * 0.8 * WIDTH, HEIGHT * 0.1 + Math.random() * 0.8 * HEIGHT, 0, 0, 0, 0, 100, true, false);
  }

  draw() {
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.physics.x, this.physics.y, 30, 0, 2 * Math.PI, false);
    ctx.fillStyle = 'green';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#003300';
    ctx.stroke();
    ctx.restore();
  }
}

class PhysicsObject {
  constructor(xoffset, yoffset, radius, x, y, vx, vy, rot, rotv, mass, hasGravity, applyGravity) {
    this.xoffset = xoffset;
    this.yoffset = yoffset;
    this.radius = radius;
    this.x = x; //center of object
    this.y = y; //center of object
    this.vx = vx; // velocity
    this.vy = vy; // velocity
    this.rot = rot; //rotation of object
    this.rotv = rotv; //angular velocity
    this.mass = mass;
    this.hasGravity = hasGravity; // if this object's mass effects other objects with it's gravity
    this.applyGravity = applyGravity; // if other object's gravity affect this object
  }

  cx() {
    return this.x + this.xoffset;
  }

  cy() {
    return this.y + this.yoffset;
  }

  distSqr(other) {
    return distSqr(this.cx(), this.cy(), other.cx(), other.cy());
  }

  collides(other) {
    return this.distSqr(other) - this.radius * this.radius - other.radius * other.radius <= 0;
  }

  speedSqr() {
    return (this.vx * this.vx + this.vy + this.vy)
  }
}

function distSqr(x, y, x2, y2) {
  return (x - x2) * (x - x2) + (y - y2) * (y - y2)
}

function handlePlayerInput() {
  let p = player.physics;
  if (input.space) {
    p.vx += playerBoostSpeed * delta * Math.sin(p.rot * Math.PI / 180);
    p.vy += -playerBoostSpeed * delta * Math.cos(p.rot * Math.PI / 180);
  }
  if (input.left) {
    p.rotv -= playerRotSpeed * delta;
  } else if (input.right) {
    p.rotv += playerRotSpeed * delta;
  }
  if (input.enter) {
    fireMissile();
  }
}

function fireMissile() {
  if (performance.now() - stopwatchTime < 300) {
    return;
  }
  let m = new Missile();
  m.physics.rot = player.physics.rot;
  m.physics.vx = player.physics.vx - missileSpeed * Math.sin(Math.PI * m.physics.rot / 180);
  m.physics.vy = player.physics.vy + missileSpeed * Math.cos(Math.PI * m.physics.rot / 180);
  m.physics.x = player.physics.cx() + 20 * Math.sin(Math.PI * m.physics.rot / 180) - m.physics.xoffset;
  m.physics.y = player.physics.cy() - 20 * Math.cos(Math.PI * m.physics.rot / 180) - m.physics.yoffset;
  missiles.push(m);
  stopwatchTime = performance.now();
}

class Missile extends Entity {
  constructor() {
    super();
    this.physics = new PhysicsObject(imageCollection["missile"].width / 2, imageCollection["missile"].height / 2, 10, 0, 0, 0, 0, 0, 0, 0.02,false, true);
  }

  draw() {
    ctx.save();
    let missileImage = imageCollection["missile"];
    ctx.translate(this.physics.cx(), this.physics.cy());
    ctx.rotate(((this.physics.rot + 90) * Math.PI / 180) % 360);
    ctx.drawImage(missileImage, -this.physics.xoffset, -this.physics.yoffset);
    ctx.restore();
  }
}

function getRotationForVelocity(x, y) {
  return 180 * -Math.atan2(x, y) / Math.PI;
}

function handlePhysics() {
  //apply gravity
  for (let i = 0; i < planets.length; i++) {
    gravityInteract(player.physics, planets[i].physics);
    for (let j = 0; j < asteroids.length; j++) {
      gravityInteract(planets[i].physics, asteroids[j].physics);
    }
    for (let j = 0; j < missiles.length; j++) {
      gravityInteract(planets[i].physics, missiles[j].physics);
    }
  }
  for (let i = 0; i < asteroids.length; i++) {
    asteroids[i].physics.x += delta * asteroids[i].physics.vx;
    asteroids[i].physics.y += delta * asteroids[i].physics.vy;
    asteroids[i].physics.rot = getRotationForVelocity(asteroids[i].physics.vx, asteroids[i].physics.vy);
  }
  for (let i = 0; i < missiles.length; i++) {
    missiles[i].physics.x += delta * missiles[i].physics.vx;
    missiles[i].physics.y += delta * missiles[i].physics.vy;
    missiles[i].physics.rot = getRotationForVelocity(missiles[i].physics.vx, missiles[i].physics.vy);
  }

  player.physics.x += delta * player.physics.vx;
  player.physics.y += delta * player.physics.vy;
  player.physics.rot += delta * player.physics.rotv;
}

function gravityInteract(o1, o2) {
  if (o1.applyGravity && o2.hasGravity || o2.applyGravity && o1.hasGravity) {
    let distSqr = Math.max(1, o1.distSqr(o2));
    let force = Math.min(MAX_FORCE, gravityConst * o1.mass * o2.mass / distSqr);
    if (o1.applyGravity && o2.hasGravity) {
      let angle = angleFromTo(o1, o2);
      o1.vx += force * delta * Math.sin(angle) / o1.mass;
      o1.vy -= force * delta * Math.cos(angle) / o1.mass;
    }
    if (o2.applyGravity && o1.hasGravity) {
      let angle = angleFromTo(o2, o1);
      o2.vx += force * delta * Math.sin(angle) / o2.mass;
      o2.vy -= force * delta * Math.cos(angle) / o2.mass;
    }
  }
}

function angleFromTo(o1, o2) {
  return -Math.atan2(o1.cx() - o2.cx(), o1.cy() - o2.cy());
}

const playerRotSpeed = 200;
const playerBoostSpeed = 300;
const gravityConst = 4000;
const MAX_FORCE = 300;
const asteroidStartSpeed = 100;
const maxAsteroids = 5;
const missileSpeed = 200;
