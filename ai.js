const ballInaccuracy = 2;
const paddleTranslationFactor = 1;

var prevX, prevY;
var targetX, targetY;
var paddleControlTimeoutID = null;

function gameTickUpdate(x, y) {
  x += ballInaccuracy * (2 * Math.random() - 1);
  y += ballInaccuracy * (2 * Math.random() - 1);
  if (prevX && prevY) {
    var dx = x - prevX;
    var dy = y - prevY;

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
  prevX = x;
  prevY = y;
}