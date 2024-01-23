const game = document.getElementById("game") as HTMLCanvasElement;
const foodCanvas = document.getElementById("food-canvas") as HTMLCanvasElement;
const ctx = game.getContext("2d") as CanvasRenderingContext2D;
const foodCtx = foodCanvas.getContext("2d") as CanvasRenderingContext2D;
const isMobile = window.matchMedia("only screen and (max-width: 760px)").matches;

const foodImage = document.getElementById("food-image") as HTMLImageElement;

const pauseText = document.getElementById("pause-text") as HTMLDivElement;
const scoreText = document.getElementById("score-text") as HTMLSpanElement;
const highScoreText = document.getElementById("high-score-text") as HTMLSpanElement;
const gameOverText = document.getElementById("game-over-text") as HTMLSpanElement;

const gameSound = document.getElementById("game-sound") as HTMLAudioElement;
const foodSound = document.getElementById("food-sound") as HTMLAudioElement;
const gameOverSound = document.getElementById("game-over-sound") as HTMLAudioElement;

const BORDER_REGION_PX = 48;
const HIGH_SCORE_KEY = "high-score";

function getHighScore(): number {
    return parseInt(localStorage.getItem(HIGH_SCORE_KEY) || "0");
}

function setHighScore(score: number) {
    localStorage.setItem(HIGH_SCORE_KEY, score.toString());
}

enum PointColors {
    "#990066", "#CC0066", "#FF0066",
    "#003366", "#333366", "#663366", "#993366", "#CC3366", "#FF3366",
    "#006666", "#336666", "#666666", "#996666", "#CC6666", "#FF6666",
    "#009966", "#339966", "#669966", "#999966", "#CC9966", "#FF9966",
    "#00CC66", "#33CC66", "#66CC66", "#99CC66", "#CCCC66", "#FFCC66",
    "#00FF66", "#33FF66", "#66FF66", "#99FF66", "#CCFF66", "#FFFF66",
};

class Coord {
    constructor(public x: number, public y: number) {
        this.x = x;
        this.y = y;
    }
}

class Point {
    constructor(public coord: Coord, public color: PointColors) {
        this.coord = coord;
        this.color = color;
    }
}

function getRandomColor(): PointColors {
    const numPoints = Object.keys(PointColors).length / 2;
    return Math.floor(Math.random() * numPoints);
}

function getRandomCoord(): Coord {
    // Ensure not in border region
    let coord = new Coord(Math.random() * game.width, Math.random() * game.height);
    while (true) {
        if (coord.x < BORDER_REGION_PX || coord.x > game.width - BORDER_REGION_PX ||
            coord.y < BORDER_REGION_PX || coord.y > game.height - BORDER_REGION_PX) {
            coord = new Coord(Math.random() * game.width, Math.random() * game.height);
        } else {
            return coord;
        }
    }
}

class Snake {
    points: Point[] = []; // head is at index 0
    headingAngle: number = 0; // radians (0 to 2pi )

    INITIAL_SIZE = 5;
    ANGLE_DELTA_RADIAN = 2.5 / (180 / Math.PI);
    MOVEMENT_DELTA_PX = isMobile ? 1 : 2;
    EYE_COLOR = "black";
    POINT_RADIUS = isMobile ? 10 : 15;
    DISTANCE_BETWEEN_POINTS = 2 * this.POINT_RADIUS - 5;

    constructor(initialPos: Coord) {
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
    calcMoveCoord(coord: Coord, angle: number, distance: number): Coord {
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
    pause: boolean;
    snake: Snake;
    heading_sign: number; // 1 or -1
    game_loop_interval: number;
    food: Point;;
    mouse_x: number;
    mouse_y: number

    UPDATE_SPEED_MS = 5;
    FOOD_SQUARE_SIZE = 64;

    constructor() {
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
        window.addEventListener("touchmove", (e) => this.handleTouch(e));
        window.addEventListener("click", () => this.togglePause());

        window.requestAnimationFrame(() => this.animate());

        scoreText.innerText = this.snake.getScore().toString();
        this.renderHighScore();
    }

    handleMouse(e: MouseEvent) {
        this.mouse_x = e.clientX;
        this.mouse_y = e.clientY;
    }

    handleTouch(e: TouchEvent) {
        this.mouse_x = e.touches[0].clientX;
        this.mouse_y = e.touches[0].clientY;
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
        } else {
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

    isTouchingFood(): boolean {
        const head_x = this.snake.points[0].coord.x;
        const head_y = this.snake.points[0].coord.y;

        const food_x = this.food.coord.x;
        const food_y = this.food.coord.y;

        const distance = Math.sqrt(Math.pow(head_x - food_x, 2) + Math.pow(head_y - food_y, 2));

        return distance < this.snake.POINT_RADIUS + (this.FOOD_SQUARE_SIZE + 5) / 2;
    }

    isTouchingWall(): boolean {
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
        } else {
            this.snake.reduceAngle();
        }
    }
}

new Game();