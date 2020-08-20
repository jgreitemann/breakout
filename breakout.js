var canvas = document.getElementById('myCanvas');
var ctx = canvas.getContext('2d');
var ballRadius = 12;
var x = canvas.width / 2;
var y = canvas.height - 30;
var v = 0;
var dx = 1;
var dy = -1;
var paddleHeight = 12;
var paddleWidth = 75;
var paddleX = (canvas.width - paddleWidth) / 2;
var rightPressed = false;
var leftPressed = false;
var brickColumnCount = 10;
var brickRowCount = 6;
var brickPadding = 10;
var brickTopMargin = 30;
var brickHorizontalMargin = 30;
var brickWidth = (canvas.width - 2 * brickHorizontalMargin -
                  (brickColumnCount - 1) * brickPadding) /
    brickColumnCount;
var brickHeight = 20;
var brickHWindow = 5;
var brickLWindow = 0.03;
var score = 0;
var lives = 3;

var palette = [
  {h: 0, s: .97, l: .45}, {h: 33, s: 1.0, l: .50}, {h: 56, s: 1.0, l: .48},
  {h: 138, s: 1.0, l: .25}, {h: 222, s: 1.0, l: .50}, {h: 292, s: .90, l: .35}
];

// palette = [{h: 120, s: 1.0, l: 0.2}, {h: 120, s: 0.6, l: 0.5}];

var bricks = [];
for (var r = 0; r < brickRowCount; r++) {
  bricks[r] = [];
  var ratio = r * (palette.length - 1) / (brickRowCount - 1);
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
      status: 1,
      color: `hsl(${brickH}deg, ${brickS * 100}%, ${brickL * 100}%)`
    };
  }
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
function collisionDetection() {
  for (var r = 0; r < brickRowCount; r++) {
    for (var c = 0; c < brickColumnCount; c++) {
      var b = bricks[r][c];
      if (b.status == 1) {
        if (x > b.x && x < b.x + brickWidth && y > b.y &&
            y < b.y + brickHeight) {
          dy = -dy;
          b.status = 0;
          score++;
          if (score == brickColumnCount * brickRowCount) {
            alert('YOU WIN, CONGRATS!');
            document.location.reload();
          }
        }
      }
    }
  }
}

function drawBall() {
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
      if (bricks[r][c].status == 1) {
        ctx.fillStyle = bricks[r][c].color;
        ctx.beginPath();
        ctx.rect(bricks[r][c].x, bricks[r][c].y, brickWidth, brickHeight);
        ctx.closePath();
        ctx.fill();
      }
    }
  }
}
function drawScore() {
  ctx.font = '16px Arial';
  ctx.fillStyle = 'black';
  ctx.fillText('Score: ' + score, 8, 20);
}
function drawLives() {
  ctx.font = '16px Arial';
  ctx.fillStyle = 'black';
  ctx.fillText('Lives: ' + lives, canvas.width - 65, 20);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBricks();
  drawBall();
  drawPaddle();
  drawScore();
  drawLives();
  collisionDetection();

  if (x + v * dx > canvas.width - ballRadius || x + v * dx < ballRadius) {
    dx = -dx;
  }
  if (y + v * dy < ballRadius) {
    dy = -dy;
  } else if (y + v * dy > canvas.height - ballRadius) {
    if (x > paddleX && x < paddleX + paddleWidth) {
      dy = -dy;
    } else {
      lives--;
      if (!lives) {
        alert('GAME OVER');
        document.location.reload();
      } else {
        x = canvas.width / 2;
        y = canvas.height - 30;
        dx = 1;
        dy = -1;
        paddleX = (canvas.width - paddleWidth) / 2;
      }
    }
  }

  if (rightPressed && paddleX < canvas.width - paddleWidth) {
    paddleX += 7;
  } else if (leftPressed && paddleX > 0) {
    paddleX -= 7;
  }

  x += v * dx;
  y += v * dy;
  requestAnimationFrame(draw);
}
