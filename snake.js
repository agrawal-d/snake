"use strict";
const game = document.getElementById("game");
const foodCanvas = document.getElementById("food-canvas");
const ctx = game.getContext("2d");
const foodCtx = foodCanvas.getContext("2d");
const foodImage = document.getElementById("food-image");
const pauseText = document.getElementById("pause-text");
const scoreText = document.getElementById("score-text");
const highScoreText = document.getElementById("high-score-text");
const gameOverText = document.getElementById("game-over-text");
const gameSound = document.getElementById("game-sound");
const foodSound = document.getElementById("food-sound");
const gameOverSound = document.getElementById("game-over-sound");
const BORDER_REGION_PX = 48;
const HIGH_SCORE_KEY = "high-score";
function getHighScore() {
    return parseInt(localStorage.getItem(HIGH_SCORE_KEY) || "0");
}
function setHighScore(score) {
    localStorage.setItem(HIGH_SCORE_KEY, score.toString());
}
var PointColors;
(function (PointColors) {
    PointColors[PointColors["#990066"] = 0] = "#990066";
    PointColors[PointColors["#CC0066"] = 1] = "#CC0066";
    PointColors[PointColors["#FF0066"] = 2] = "#FF0066";
    PointColors[PointColors["#003366"] = 3] = "#003366";
    PointColors[PointColors["#333366"] = 4] = "#333366";
    PointColors[PointColors["#663366"] = 5] = "#663366";
    PointColors[PointColors["#993366"] = 6] = "#993366";
    PointColors[PointColors["#CC3366"] = 7] = "#CC3366";
    PointColors[PointColors["#FF3366"] = 8] = "#FF3366";
    PointColors[PointColors["#006666"] = 9] = "#006666";
    PointColors[PointColors["#336666"] = 10] = "#336666";
    PointColors[PointColors["#666666"] = 11] = "#666666";
    PointColors[PointColors["#996666"] = 12] = "#996666";
    PointColors[PointColors["#CC6666"] = 13] = "#CC6666";
    PointColors[PointColors["#FF6666"] = 14] = "#FF6666";
    PointColors[PointColors["#009966"] = 15] = "#009966";
    PointColors[PointColors["#339966"] = 16] = "#339966";
    PointColors[PointColors["#669966"] = 17] = "#669966";
    PointColors[PointColors["#999966"] = 18] = "#999966";
    PointColors[PointColors["#CC9966"] = 19] = "#CC9966";
    PointColors[PointColors["#FF9966"] = 20] = "#FF9966";
    PointColors[PointColors["#00CC66"] = 21] = "#00CC66";
    PointColors[PointColors["#33CC66"] = 22] = "#33CC66";
    PointColors[PointColors["#66CC66"] = 23] = "#66CC66";
    PointColors[PointColors["#99CC66"] = 24] = "#99CC66";
    PointColors[PointColors["#CCCC66"] = 25] = "#CCCC66";
    PointColors[PointColors["#FFCC66"] = 26] = "#FFCC66";
    PointColors[PointColors["#00FF66"] = 27] = "#00FF66";
    PointColors[PointColors["#33FF66"] = 28] = "#33FF66";
    PointColors[PointColors["#66FF66"] = 29] = "#66FF66";
    PointColors[PointColors["#99FF66"] = 30] = "#99FF66";
    PointColors[PointColors["#CCFF66"] = 31] = "#CCFF66";
    PointColors[PointColors["#FFFF66"] = 32] = "#FFFF66";
})(PointColors || (PointColors = {}));
;
class Coord {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.x = x;
        this.y = y;
    }
}
class Point {
    constructor(coord, color) {
        this.coord = coord;
        this.color = color;
        this.coord = coord;
        this.color = color;
    }
}
function getRandomColor() {
    const numPoints = Object.keys(PointColors).length / 2;
    return Math.floor(Math.random() * numPoints);
}
function getRandomCoord() {
    // Ensure not in border region
    let coord = new Coord(Math.random() * game.width, Math.random() * game.height);
    while (true) {
        if (coord.x < BORDER_REGION_PX || coord.x > game.width - BORDER_REGION_PX ||
            coord.y < BORDER_REGION_PX || coord.y > game.height - BORDER_REGION_PX) {
            coord = new Coord(Math.random() * game.width, Math.random() * game.height);
        }
        else {
            return coord;
        }
    }
}
class Snake {
    constructor(initialPos) {
        this.points = []; // head is at index 0
        this.headingAngle = 0; // radians (0 to 2pi )
        this.INITIAL_SIZE = 5;
        this.ANGLE_DELTA_RADIAN = 2.5 / (180 / Math.PI); // 5 degrees
        this.MOVEMENT_DELTA_PX = 2;
        this.EYE_COLOR = "black";
        this.POINT_RADIUS = 15;
        this.DISTANCE_BETWEEN_POINTS = 2 * this.POINT_RADIUS - 5;
        this.points = [];
        for (let i = 0; i < this.INITIAL_SIZE; i++) {
            this.points.push(new Point(new Coord(initialPos.x - i * this.DISTANCE_BETWEEN_POINTS, initialPos.y), getRandomColor()));
        }
    }
    reduceAngle() {
        this.headingAngle = (this.headingAngle - this.ANGLE_DELTA_RADIAN) % (2 * Math.PI);
    }
    increaseAngle() {
        this.headingAngle = (this.headingAngle + this.ANGLE_DELTA_RADIAN) % (2 * Math.PI);
    }
    getScore() {
        return (this.points.length - this.INITIAL_SIZE) * 10;
    }
    // Calculate new coord based on angle and distance to move
    calcMoveCoord(coord, angle, distance) {
        return new Coord(coord.x + distance * Math.cos(angle), coord.y + distance * Math.sin(angle));
    }
    // Move the snake forward, from last point to first
    // For head: move in the direction of headingAngle
    // For non head: calculate angle between current point and next point, and move in that direction, ensuring distance between points is constant
    move() {
        // Move the head
        let head = this.points[0];
        let newHeadCoord = this.calcMoveCoord(head.coord, this.headingAngle, this.MOVEMENT_DELTA_PX);
        this.points[0] = new Point(newHeadCoord, head.color);
        // Move the rest of the body
        for (let i = 1; i < this.points.length; i++) {
            let prevPoint = this.points[i - 1];
            let currPoint = this.points[i];
            let angle = Math.atan2(currPoint.coord.y - prevPoint.coord.y, currPoint.coord.x - prevPoint.coord.x);
            let newCoord = this.calcMoveCoord(prevPoint.coord, angle, this.DISTANCE_BETWEEN_POINTS);
            this.points[i] = new Point(newCoord, currPoint.color);
        }
    }
}
class Game {
    ;
    constructor() {
        this.UPDATE_SPEED_MS = 5;
        this.FOOD_SQUARE_SIZE = 64;
        // Resize canvas to fit window
        game.width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        game.height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
        foodCanvas.width = game.width;
        foodCanvas.height = game.height;
        this.pause = false;
        this.togglePause();
        this.snake = new Snake(new Coord(100, 100));
        this.heading_sign = 1;
        this.game_loop_interval = -1;
        this.food = new Point(getRandomCoord(), getRandomColor());
        this.mouse_x = this.snake.points[0].coord.x;
        this.mouse_y = this.snake.points[0].coord.y;
        window.addEventListener("mousemove", (e) => this.handleMouse(e));
        window.addEventListener("click", () => this.togglePause());
        window.requestAnimationFrame(() => this.animate());
        scoreText.innerText = this.snake.getScore().toString();
        this.renderHighScore();
    }
    handleMouse(e) {
        this.mouse_x = e.clientX;
        this.mouse_y = e.clientY;
    }
    renderHighScore() {
        highScoreText.innerText = "HI " + getHighScore().toString();
    }
    togglePause() {
        this.pause = !this.pause;
        console.log("Play: " + this.pause);
        if (!this.pause) {
            this.game_loop_interval = setInterval(this.gameLoop.bind(this), this.UPDATE_SPEED_MS);
            window.requestAnimationFrame(() => this.animate());
            pauseText.style.display = "none";
            gameSound.play();
            this.drawFood();
        }
        else {
            clearInterval(this.game_loop_interval);
            pauseText.style.display = "block";
            gameSound.pause();
        }
    }
    drawSnake() {
        for (let point of this.snake.points) {
            ctx.beginPath();
            ctx.arc(point.coord.x, point.coord.y, this.snake.POINT_RADIUS, 0, 2 * Math.PI);
            ctx.fillStyle = PointColors[point.color];
            ctx.fill();
        }
        // Add eye inside the head
        let head = this.snake.points[0];
        ctx.beginPath();
        ctx.arc(head.coord.x + 5, head.coord.y - 2.5, this.snake.POINT_RADIUS / 2, 0, 2 * Math.PI);
        ctx.fillStyle = this.snake.EYE_COLOR;
        ctx.fill();
    }
    drawFood() {
        console.log("Drawn food");
        foodCtx.drawImage(foodImage, this.food.coord.x, this.food.coord.y, 32, 32);
    }
    animate() {
        ctx.clearRect(0, 0, game.width, game.height);
        if (this.pause) {
            return;
        }
        this.drawSnake();
        window.requestAnimationFrame(() => this.animate());
    }
    isTouchingFood() {
        const head_x = this.snake.points[0].coord.x;
        const head_y = this.snake.points[0].coord.y;
        const food_x = this.food.coord.x;
        const food_y = this.food.coord.y;
        const distance = Math.sqrt(Math.pow(head_x - food_x, 2) + Math.pow(head_y - food_y, 2));
        return distance < this.snake.POINT_RADIUS + (this.FOOD_SQUARE_SIZE + 5) / 2;
    }
    isTouchingWall() {
        const head_x = this.snake.points[0].coord.x;
        const head_y = this.snake.points[0].coord.y;
        return head_x < 0 || head_x > game.width || head_y < 0 || head_y > game.height;
    }
    gameOver() {
        gameOverSound.play();
        const isNewHighScore = this.snake.getScore() > getHighScore();
        setHighScore(Math.max(getHighScore(), this.snake.getScore()));
        this.renderHighScore();
        this.togglePause();
        gameOverText.style.display = "block";
        gameOverText.innerHTML = `<h1><img src="img/ghost.png" class="ghost" alt="Ghost">Game Over!</h1><p id="final-score">You scored ${this.snake.getScore()} points.</p>Click anywhere to restart.`;
        if (isNewHighScore) {
            gameOverText.innerHTML += "<p id=\"new-high-score\">🎆🎆🎆 You just got a New high score! 🎆🎆🎆</p>";
        }
        ctx.clearRect(0, 0, game.width, game.height);
        pauseText.style.display = "none";
        window.onclick = () => location.reload();
    }
    gameLoop() {
        this.changeHeading();
        this.snake.move();
        if (this.isTouchingFood()) {
            this.snake.points.push(this.food);
            foodCtx.clearRect(this.food.coord.x, this.food.coord.y, this.FOOD_SQUARE_SIZE, this.FOOD_SQUARE_SIZE);
            this.food = new Point(getRandomCoord(), getRandomColor());
            this.drawFood();
            scoreText.innerText = this.snake.getScore().toString();
            foodSound.currentTime = 0;
            foodSound.pause();
            foodSound.play();
        }
        if (this.isTouchingWall()) {
            this.gameOver();
        }
    }
    changeHeading() {
        // 1. Get heading w.r.t snake head
        // 2. Use the stored mouse coords.
        // 3. Depending on the shortest delta, either increase/decrease angle.
        const head_x = this.snake.points[0].coord.x;
        const head_y = this.snake.points[0].coord.y;
        let angle = Math.atan2(this.mouse_y - head_y, this.mouse_x - head_x);
        const headingAngle = this.snake.headingAngle;
        const delta = Math.abs(angle - headingAngle);
        if (delta > Math.PI) {
            angle = angle - 2 * Math.PI;
        }
        if (angle > headingAngle) {
            this.snake.increaseAngle();
        }
        else {
            this.snake.reduceAngle();
        }
    }
}
new Game();
