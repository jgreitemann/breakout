var canvas = document.getElementById('myCanvas');
var ctx = canvas.getContext('2d');

// Gameplay parameters
const ballRadius = 15;
const v = 8;
const paddleConvexity = 2;
const paddleHeight = 8;
const paddleWidth = 120;
const brickColumnCount = 10;
const brickRowCount = 6;
const brickPadding = 10;
const brickTopMargin = 30;
const brickHorizontalMargin = 30;
const brickHeight = 30;
const brickHWindow = 5;
const brickLWindow = 0.03;
const minCollisionTime = 1e-2;
const runoffHeight = 50;
const animationDelay = 20;
const fadeInIterations = 25;
const overlayDuration = 1000;
const overlayMaxAlpha = 0.5;

// Dependent constants
const brickWidth = (canvas.width - 2 * brickHorizontalMargin -
                    (brickColumnCount - 1) * brickPadding) /
    brickColumnCount;
const brickRadius =
    Math.sqrt(Math.pow(brickWidth / 2, 2) + Math.pow(brickHeight / 2, 2));
const brickSafetyZoneSq = Math.pow(brickRadius + ballRadius, 2);

// Game state
var overlayAlpha = 0.0;
var activeOverlays = [];
var overlayTexts = [];
var overlayIntervalID = null;
var whenOverlayVisible = [];
var whenOverlayHidden = [];
var t;
var rx, ry;
var nx, ny;
var paddleX = (canvas.width - paddleWidth) / 2;
var score;
var lives;
var bricks;
var leftPressed;
var rightPressed;
var nextColl;

var palette = [
  {h: 0, s: .97, l: .45}, {h: 33, s: 1.0, l: .50}, {h: 56, s: 1.0, l: .48},
  {h: 138, s: 1.0, l: .25}, {h: 222, s: 1.0, l: .50}, {h: 292, s: .90, l: .35}
];

// palette = [{h: 120, s: 1.0, l: 0.2}, {h: 120, s: 0.6, l: 0.5}];

function setIntervalCount(callback, delay, repetitions) {
  var counter = 0;
  var intervalID = setInterval(() => {
    callback(counter);
    if (++counter === repetitions) clearInterval(intervalID);
  }, delay);
  return intervalID;
}

function setIntervalPredicate(callback, delay) {
  var intervalID = setInterval(() => {
    if (!callback()) clearInterval(intervalID);
  }, delay);
  return intervalID;
}

function showOverlay(text) {
  activeOverlays.push(text);
  if (!overlayTexts.includes(text)) overlayTexts.push(text);
  if (overlayAlpha < 1) {
    if (overlayIntervalID) {
      clearInterval(overlayIntervalID);
      overlayIntervalID = null;
    }
    var startOverlayAlpha = overlayAlpha;
    overlayIntervalID = setIntervalCount(count => {
      overlayAlpha = startOverlayAlpha +
          (1 - startOverlayAlpha) * count / (fadeInIterations - 1);
      if (count === fadeInIterations - 1) {
        whenOverlayVisible.forEach(action => action());
        whenOverlayVisible = [];
        overlayIntervalID = null;
      }
    }, animationDelay, fadeInIterations);
  }
}

function hideOverlay(text) {
  {
    var pos = activeOverlays.indexOf(text);
    if (pos >= 0) activeOverlays.splice(pos, 1);
  }
  var removeText = () => {
    var pos = overlayTexts.indexOf(text);
    if (pos >= 0) overlayTexts.splice(pos, 1);
  };
  if (activeOverlays.length === 0) {
    if (overlayIntervalID) {
      clearInterval(overlayIntervalID);
      overlayIntervalID = null;
    }
    whenOverlayHidden.push(removeText);
    var startOverlayAlpha = overlayAlpha;
    overlayIntervalID = setIntervalCount(count => {
      overlayAlpha =
          startOverlayAlpha * (fadeInIterations - count - 1) / fadeInIterations;
      if (count === fadeInIterations - 1) {
        whenOverlayHidden.forEach(action => action());
        whenOverlayHidden = [];
        overlayIntervalID = null;
      }
    }, animationDelay, fadeInIterations);
  } else {
    removeText();
  }
}

function showOverlayFor(text, duration, whenVisible = null) {
  if (whenVisible)
    whenOverlayVisible.push(() => {
      whenVisible();
      setTimeout(() => hideOverlay(text), duration);
    });
  showOverlay(text);
}

function resetGame() {
  score = 0;
  lives = 3;

  bricks = [];
  for (var r = 0; r < brickRowCount; r++) {
    bricks[r] = [];
    var ratio =
        brickRowCount > 1 ? r * (palette.length - 1) / (brickRowCount - 1) : 0;
    var i = Math.floor(ratio);
    var j = Math.ceil(ratio);
    ratio -= i;
    for (var c = 0; c < brickColumnCount; c++) {
      var brickX = (c * (brickWidth + brickPadding)) + brickHorizontalMargin;
      var brickY = (r * (brickHeight + brickPadding)) + brickTopMargin;
      var brickH = palette[i].h * (1 - ratio) + palette[j].h * ratio;
      brickH += (brickHWindow * (2 * Math.random() - 1)) % 360;
      var brickS = palette[i].s * (1 - ratio) + palette[j].s * ratio;
      var brickL = palette[i].l * (1 - ratio) + palette[j].l * ratio;
      brickL += brickLWindow * (2 * Math.random() - 1);
      bricks[r][c] = {
        x: brickX,
        y: brickY,
        status: 0,
        skipFrames: Math.floor(fadeInIterations * Math.random()),
        color: {h: brickH, s: brickS, l: brickL}
      };
    }
  }
  setIntervalCount(count => {
    for (var r = 0; r < brickRowCount; r++) {
      for (var c = 0; c < brickColumnCount; c++) {
        var b = bricks[r][c];
        b.status =
            Math.min(1, Math.max(0, count - b.skipFrames) / fadeInIterations);
      }
    }
    if (count == 2 * fadeInIterations) nextColl = nextCollision();
  }, animationDelay, 2 * fadeInIterations + 1);
  resetRound();
}

function resetRound() {
  t = 0;
  rx = canvas.width / 2;
  ry = canvas.height - 3 * ballRadius - paddleHeight;
  var s = 4 * Math.random() - 2;
  ny = -1. / Math.sqrt(s * s + 1);
  nx = -s * ny;
  leftPressed = false;
  rightPressed = false;
  nextColl = nextCollision();
}

function keyDownHandler(e) {
  if (e.keyCode == 39) {
    rightPressed = true;
  } else if (e.keyCode == 37) {
    leftPressed = true;
  }
}

function keyUpHandler(e) {
  if (e.keyCode == 39) {
    rightPressed = false;
  } else if (e.keyCode == 37) {
    leftPressed = false;
  }
}

function mouseMoveHandler(e) {
  var relativeX = e.clientX - canvas.offsetLeft;
  if (relativeX > 0 && relativeX < canvas.width) {
    paddleX = relativeX - paddleWidth / 2;
  }
}

function blurHandler(e) {
  showOverlay('GAME PAUSED');
}

function focusHandler(e) {
  hideOverlay('GAME PAUSED');
}

function closestApproachSquared(px, py) {
  var dx = px - rx;
  var dy = py - ry;
  var parallel = dx * nx + dy * ny;
  dx -= parallel * nx;
  dy -= parallel * ny;
  return dx * dx + dy * dy;
}

function elasticBounce(px, py) {
  var dx = rx - px;
  var dy = ry - py;
  var parallel = (nx * dx + ny * dy) / Math.pow(ballRadius, 2);
  nx -= 2 * parallel * dx;
  ny -= 2 * parallel * dy;
  var norm = Math.sqrt(nx * nx + ny * ny);
  nx /= norm;
  ny /= norm;
}

function brickImpactAction(b) {
  return (px, py) => {
    elasticBounce(px, py);
    b.status -= 0.1;
    setIntervalPredicate(() => {
      b.status -= 0.1;
      if (b.status < 0) {
        b.status = 0;
        return false;
      }
      return true;
    }, animationDelay);
    score++;
    if (score == brickRowCount * brickColumnCount) {
      showOverlayFor('YOU WIN, CONGRATS!', overlayDuration, resetGame);
    }
  };
}

function paddleBounce(px, py) {
  var q = 2 * (px - paddleX) / paddleWidth - 1;
  if (q > -1 && q < 1) {
    var s = nx / ny + paddleConvexity * q;
    ny = -1. / Math.sqrt(s * s + 1);
    nx = -s * ny;
  }
}

function ballLost(px, py) {
  lives--;
  if (lives == 0) {
    showOverlayFor('GAME OVER!', overlayDuration, resetGame);
  } else {
    if (lives > 1) {
      showOverlayFor(`${lives} LIVES REMAINING`, overlayDuration, resetRound);
    } else {
      showOverlayFor('ONE LIFE REMAINING', overlayDuration, resetRound);
    }
  }
}

function pointCollision(px, py, R, func) {
  var dx = px - rx;
  var dy = py - ry;
  var parallel = dx * nx + dy * ny;
  var discriminant = parallel * parallel - (dx * dx + dy * dy) + R * R;
  if (discriminant < 0) return null;
  return {vt: parallel - Math.sqrt(discriminant), action: () => func(px, py)};
}

function edgeCollision(px, py, wx, wy, tx, ty, func) {
  var qx = px + tx;
  var qy = py + ty;
  var sx = qx - rx;
  var sy = qy - ry;
  var vt = (sy * wx - sx * wy) / (ny * wx - nx * wy);
  var alpha = (sy * nx - sx * ny) / (ny * wx - nx * wy);
  if (alpha < 0 || alpha > 1) return null;
  return {vt: vt, action: () => func(px + alpha * wx, py + alpha * wy)};
}

function nextCollision() {
  var collisions = [
    edgeCollision(0, 0, canvas.width, 0, 0, ballRadius, elasticBounce),
    edgeCollision(
        0, 0, 0, canvas.height + runoffHeight, ballRadius, 0, elasticBounce),
    edgeCollision(
        canvas.width, 0, 0, canvas.height + runoffHeight, -ballRadius, 0,
        elasticBounce),
    edgeCollision(
        0, canvas.height - paddleHeight, canvas.width, 0, 0, -ballRadius,
        paddleBounce),
    edgeCollision(
        0, canvas.height + runoffHeight, canvas.width, 0, 0, -ballRadius,
        ballLost)
  ];
  for (var r = 0; r < brickRowCount; r++) {
    for (var c = 0; c < brickColumnCount; c++) {
      var b = bricks[r][c];
      if (b.status == 1) {
        if (closestApproachSquared(
                b.x + brickWidth / 2, b.y + brickHeight / 2) <
            brickSafetyZoneSq) {
          var impact = brickImpactAction(b);
          collisions.push(
              pointCollision(b.x, b.y, ballRadius, impact),
              pointCollision(b.x, b.y + brickHeight, ballRadius, impact),
              pointCollision(b.x + brickWidth, b.y, ballRadius, impact),
              pointCollision(
                  b.x + brickWidth, b.y + brickHeight, ballRadius, impact),
              edgeCollision(b.x, b.y, brickWidth, 0, 0, -ballRadius, impact),
              edgeCollision(b.x, b.y, 0, brickHeight, -ballRadius, 0, impact),
              edgeCollision(
                  b.x + brickWidth, b.y, 0, brickHeight, ballRadius, 0, impact),
              edgeCollision(
                  b.x, b.y + brickHeight, brickWidth, 0, 0, ballRadius,
                  impact));
        }
      }
    }
  }
  return collisions.filter(col => col && col.vt >= minCollisionTime)
      .reduce((acc, col) => acc && acc.vt < col.vt ? acc : col, null);
}

function drawBall() {
  var x = rx + v * t * nx;
  var y = ry + v * t * ny;
  ctx.beginPath();
  ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = 'black';
  ctx.fill();
  ctx.closePath();
}

function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
  ctx.fillStyle = 'black';
  ctx.fill();
  ctx.closePath();
}

function drawBricks() {
  for (var r = 0; r < brickRowCount; r++) {
    for (var c = 0; c < brickColumnCount; c++) {
      var b = bricks[r][c];
      if (b.status > 0) {
        ctx.fillStyle = `hsla(${b.color.h}deg, ${b.color.s * 100}%, ${
            b.color.l * 100}%, ${b.status * 100}%)`;
        ctx.beginPath();
        ctx.rect(
            b.x + (1 - b.status) * brickWidth / 2,
            b.y + (1 - b.status) * brickHeight / 2, b.status * brickWidth,
            b.status * brickHeight);
        ctx.closePath();
        ctx.fill();
      }
    }
  }
}

function drawScore() {
  ctx.font = '16px Arial';
  ctx.fillStyle = 'black';
  ctx.textAlign = 'left';
  ctx.fillText('Score: ' + score, 8, 20);
}

function drawLives() {
  ctx.font = '16px Arial';
  ctx.fillStyle = 'black';
  ctx.textAlign = 'right';
  ctx.fillText('Lives: ' + lives, canvas.width - 8, 20);
}

function drawOverlay() {
  ctx.fillStyle = `rgba(0, 0, 0, ${overlayAlpha * overlayMaxAlpha})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = '42px Arial';
  ctx.fillStyle = `rgba(255, 255, 255, ${overlayAlpha})`;
  ctx.textAlign = 'center';
  for (var i = 0; i < overlayTexts.length; ++i) {
    ctx.fillText(
        overlayTexts[i], canvas.width / 2,
        canvas.height - paddleHeight - 150 + 50 * i);
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBricks();
  drawBall();
  drawPaddle();
  drawScore();
  drawLives();

  if (overlayAlpha > 0) {
    drawOverlay();
  }

  var remainingTime = 1 - overlayAlpha;
  while (nextColl && remainingTime > minCollisionTime) {
    if (t + remainingTime > nextColl.vt / v) {
      remainingTime = t + remainingTime - nextColl.vt / v;

      t = 0;
      rx += nextColl.vt * nx;
      ry += nextColl.vt * ny;

      nextColl.action();

      nextColl = nextCollision();
    } else {
      t += remainingTime;
      remainingTime = 0;
    }
  }

  if (rightPressed && paddleX < canvas.width - paddleWidth) {
    paddleX += 7;
  } else if (leftPressed && paddleX > 0) {
    paddleX -= 7;
  }

  requestAnimationFrame(draw);
}
