const game = document.getElementById("game") as HTMLCanvasElement;
const ctx = game.getContext("2d") as CanvasRenderingContext2D;

enum PointColors {
    "white",
    "red",
    "green",
    "blue",
    "yellow",
    "orange",
    "purple",
    "pink",
    "brown",
    "grey",
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

class Snake {
    points: Point[] = []; // head is at index 0
    headingAngle: number = 0; // radians (0 to 2pi )
    ANGLE_DELTA_RADIAN = 1 / (180 / Math.PI); // 5 degrees
    MOVEMENT_DELTA_PX = 2;
    EYE_COLOR = "yellow";
    POINT_RADIUS = 15;
    DISTANCE_BETWEEN_POINTS = 2 * this.POINT_RADIUS;

    constructor(initialPos: Coord) {
        this.points = [];
        for (let i = 0; i < 30; i++) {
            this.points.push(new Point(new Coord(initialPos.x - i * this.DISTANCE_BETWEEN_POINTS, initialPos.y), getRandomColor()));
        }
    }

    reduceAngle() {
        this.headingAngle = (this.headingAngle - this.ANGLE_DELTA_RADIAN) % (2 * Math.PI);
    }

    increaseAngle() {
        this.headingAngle = (this.headingAngle + this.ANGLE_DELTA_RADIAN) % (2 * Math.PI);
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
    play: boolean = false;
    snake: Snake;
    up_key: boolean = false;
    down_key: boolean = false;
    heading_sign: number = 1; // 1 or -1
    game_loop_interval: number = -1;
    UPDATE_SPEED_MS = 5;

    constructor() {
        // Resize canvas to fit window
        game.width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        game.height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

        this.snake = new Snake(new Coord(100, 100));
        document.addEventListener("keydown", (e) => this.handleKeydown(e))
        document.addEventListener("keyup", (e) => this.handleKeyup(e))
        window.requestAnimationFrame(() => this.animate());
        window.addEventListener("click", () => this.togglePlay());

    }

    togglePlay() {
        this.play = !this.play;
        console.log("Play: " + this.play);
        if (this.play) {
            this.game_loop_interval = setInterval(this.gameLoop.bind(this), this.UPDATE_SPEED_MS);
        } else {
            clearInterval(this.game_loop_interval);
        }
    }

    animate() {
        ctx.clearRect(0, 0, game.width, game.height);

        for (let point of this.snake.points) {
            ctx.beginPath();
            ctx.arc(point.coord.x, point.coord.y, this.snake.POINT_RADIUS, 0, 2 * Math.PI);
            ctx.fillStyle = PointColors[point.color];
            ctx.fill();
        }

        // Add eye inside the head
        let head = this.snake.points[0];
        ctx.beginPath();
        ctx.arc(head.coord.x, head.coord.y, this.snake.POINT_RADIUS / 2, 0, 2 * Math.PI);
        ctx.fillStyle = this.snake.EYE_COLOR;
        ctx.fill();

        window.requestAnimationFrame(() => this.animate());
    }

    gameLoop() {
        this.changeHeading();
        this.snake.move();
    }

    // Depending on which key is pressed, call snake's reduceAngle or increaseAngle
    // Only determine which method to call if more than one key is pressed
    changeHeading() {
        const current_angle_deg = this.snake.headingAngle * 180 / Math.PI;

        if (this.up_key) {
            this.snake.reduceAngle();
        } else if (this.down_key) {
            this.snake.increaseAngle();
        }
    }

    handleKeyup(e: KeyboardEvent): any {
        if (e.key === "ArrowUp" || e.key === "w") {
            this.up_key = false;
        }

        if (e.key === "ArrowDown" || e.key === "s") {
            this.down_key = false;
        }
    }

    handleKeydown(e: KeyboardEvent): any {
        if (e.key === "ArrowUp" || e.key === "w") {
            this.up_key = true;
        }

        if (e.key === "ArrowDown" || e.key === "s") {
            this.down_key = true;
        }
    }
}

new Game();