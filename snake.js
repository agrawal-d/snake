"use strict";
const game = document.getElementById("game");
const ctx = game.getContext("2d");
const pauseText = document.getElementById("pause-text");
const foodImage = document.getElementById("food-image");
const scoreText = document.getElementById("score-text");
const gameOverText = document.getElementById("game-over-text");
const BORDER_REGION_PX = 48;
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
        this.FOOD_SQUARE_SIZE = 32;
        // Resize canvas to fit window
        game.width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        game.height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
        this.pause = false;
        this.up_key = false;
        this.down_key = false;
        this.togglePause();
        this.snake = new Snake(new Coord(100, 100));
        this.heading_sign = 1;
        this.game_loop_interval = -1;
        this.food = new Point(getRandomCoord(), getRandomColor());
        document.addEventListener("keydown", (e) => this.handleKeydown(e));
        document.addEventListener("keyup", (e) => this.handleKeyup(e));
        window.requestAnimationFrame(() => this.animate());
        window.addEventListener("click", () => this.togglePause());
        scoreText.innerText = this.snake.getScore().toString();
    }
    togglePause() {
        this.pause = !this.pause;
        console.log("Play: " + this.pause);
        if (!this.pause) {
            this.game_loop_interval = setInterval(this.gameLoop.bind(this), this.UPDATE_SPEED_MS);
            window.requestAnimationFrame(() => this.animate());
            pauseText.style.display = "none";
        }
        else {
            clearInterval(this.game_loop_interval);
            pauseText.style.display = "block";
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
        console.log(this.food.coord);
        ctx.drawImage(foodImage, this.food.coord.x, this.food.coord.y, 32, 32);
    }
    animate() {
        ctx.clearRect(0, 0, game.width, game.height);
        this.drawSnake();
        this.drawFood();
        if (this.pause) {
            return;
        }
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
    gameLoop() {
        this.changeHeading();
        this.snake.move();
        if (this.isTouchingFood()) {
            this.snake.points.push(this.food);
            this.food = new Point(getRandomCoord(), getRandomColor());
            scoreText.innerText = this.snake.getScore().toString();
        }
        if (this.isTouchingWall()) {
            this.togglePause();
            gameOverText.style.display = "block";
            gameOverText.innerHTML = `<h1>Game Over!</h1><p id="final-score">You scored ${this.snake.getScore()} points.</p><br/>Click anywhere to restart.`;
            pauseText.style.display = "none";
            window.onclick = () => location.reload();
        }
    }
    // Depending on which key is pressed, call snake's reduceAngle or increaseAngle
    // Only determine which method to call if more than one key is pressed
    changeHeading() {
        const current_angle_deg = this.snake.headingAngle * 180 / Math.PI;
        if (this.up_key) {
            this.snake.reduceAngle();
        }
        else if (this.down_key) {
            this.snake.increaseAngle();
        }
    }
    handleKeyup(e) {
        if (e.key === "ArrowUp" || e.key === "w") {
            this.up_key = false;
        }
        if (e.key === "ArrowDown" || e.key === "s") {
            this.down_key = false;
        }
    }
    handleKeydown(e) {
        if (e.key === "ArrowUp" || e.key === "w") {
            this.up_key = true;
        }
        if (e.key === "ArrowDown" || e.key === "s") {
            this.down_key = true;
        }
    }
}
new Game();
