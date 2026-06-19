class Obstacle {
    constructor(x, y, width, height, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type; // "POTHOLE", "NO_ENTRY", "ANIMAL"
        
        if (this.type === "ANIMAL") {
            this.speedX = (Math.random() > 0.5 ? 1 : -1) * 0.8;
        } else {
            this.speedX = 0;
        }

        this.polygon = this.#createPolygon();
    }

    update(roadBorders) {
        if (this.type === "ANIMAL") {
            this.x += this.speedX;
            // Simple bounce if animal goes too far left or right (approximate road width)
            if (this.x < 30) this.speedX = Math.abs(this.speedX);
            if (this.x > 170) this.speedX = -Math.abs(this.speedX);
        }
        this.polygon = this.#createPolygon();
    }

    #createPolygon() {
        const points = [];
        points.push({ x: this.x - this.width/2, y: this.y - this.height/2 });
        points.push({ x: this.x + this.width/2, y: this.y - this.height/2 });
        points.push({ x: this.x + this.width/2, y: this.y + this.height/2 });
        points.push({ x: this.x - this.width/2, y: this.y + this.height/2 });
        return points;
    }

    draw(ctx) {
        ctx.save();
        if (this.type === "POTHOLE") {
            ctx.fillStyle = "#222222";
            ctx.shadowColor = "black";
            ctx.shadowBlur = 5;
        } else if (this.type === "NO_ENTRY") {
            ctx.fillStyle = "#ff4444";
        } else if (this.type === "ANIMAL") {
            ctx.fillStyle = "#8b4513";
        }
        
        ctx.beginPath();
        ctx.moveTo(this.polygon[0].x, this.polygon[0].y);
        for(let i=1; i<this.polygon.length; i++) {
            ctx.lineTo(this.polygon[i].x, this.polygon[i].y);
        }
        ctx.fill();

        if (this.type === "NO_ENTRY") {
            ctx.fillStyle = "white";
            ctx.fillRect(this.x - this.width/2 + 5, this.y - 2, this.width - 10, 4);
        } else if (this.type === "ANIMAL") {
            ctx.fillStyle = "black";
            // little eyes
            ctx.fillRect(this.x - 5, this.y - 2, 3, 3);
            ctx.fillRect(this.x + 2, this.y - 2, 3, 3);
        }
        ctx.restore();
    }
}
