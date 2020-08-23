const ballInaccuracy = 20;
const paddleTranslationFactor = 1;
const historyLength = 8;

var histoX = [], histoY = [];
var targetX, targetY;
var paddleControlTimeoutID = null;

function gameTickUpdate(x, y) {
  x += ballInaccuracy * (2 * Math.random() - 1);
  y += ballInaccuracy * (2 * Math.random() - 1);

  histoX.push(x);
  histoY.push(y);
  if (histoX.length > historyLength) histoX.shift();
  if (histoY.length > historyLength) histoY.shift();

  if (histoX.length > 1 && histoY.length) {
    var dx = 0, dy = 0;
    var N = Math.min(histoX.length, histoY.length);
    for (var i = 1; i < N; ++i) {
      dx += histoX[i] - histoX[i - 1];
      dy += histoY[i] - histoY[i - 1];
    }
    dx /= N - 1;
    dy /= N - 1;

    targetX = canvas.width / 2;
    targetY = canvas.height - paddleHeight - ballRadius;
    if (dy > 0) {
      targetX = x - dx / dy * (y - targetY);
      targetX += 1000 * canvas.width;
      var div = targetX / canvas.width;
      targetX %= canvas.width;
      if (Math.floor(div) % 2 != 0) {
        targetX = canvas.width - targetX;
      }
    }

    var translation = targetX - (paddleX + paddleWidth / 2);

    if (translation > 0) {
      rightPressed = true;
      leftPressed = false;
    } else {
      leftPressed = true;
      rightPressed = false;
    }

    clearTimeout(paddleControlTimeoutID);
    var translationDuration = Math.abs(translation) * paddleTranslationFactor;
    paddleControlTimeoutID = setTimeout(() => {
      rightPressed = false;
      leftPressed = false;
    }, translationDuration);
  }
}