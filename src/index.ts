// Vectors
class Vector {
    private x: number;
    private y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    // Getters
    xval() { return this.x; }
    yval() { return this.y; }

    // Vector Addition
    add(other: Vector) {
        return new Vector(
            this.x + other.x,
            this.y + other.y
        );
    }

    // Vector Subtraction
    sub(other: Vector) {
        return new Vector(
            this.x - other.x,
            this.y - other.y
        );
    }

    // Scalar Multiplication
    mul(other: number): Vector {
        return new Vector(
            other * this.x,
            other * this.y
        );
    }

    // Vector Magnitude
    size(): number {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }
}

// Mouse
class Mouse {
    public down: boolean;
    public clickpos: Vector
    public clicktime: number;
    public releasepos: Vector
    public releasetime: number;
    public pos: Vector;

    constructor() {
        this.down = false;
        this.clickpos = ZERO_VEC;
        this.releasepos = ZERO_VEC;
        this.pos = ZERO_VEC;
    }
}

// Physical Objects
interface PObject {
    posval(): Vector;
    massval(): number;
    step(): void;
}

// Particles
class Particle implements PObject {
    private pos: Vector;
    private vel: Vector;
    private mass: number;

    private current_force: Vector = ZERO_VEC;

    constructor(pos: Vector, vel: Vector, mass: number) {
        this.pos = pos;
        this.vel = vel;
        this.mass = mass;
    }

    step() {
        // Sum up gravitational forces
        pobject_array.forEach(pobject => {
            this.applyForce(this.gravitationalForce(pobject))
        });

        // Update velocity and position
        let acc = this.current_force.mul(1 / this.mass);
        this.vel = this.vel.add(acc.mul(dt));
        this.pos = this.pos.add(this.vel.mul(dt));

        this.current_force = ZERO_VEC;
    }

    // Getters
    posval(): Vector { return this.pos; }
    massval(): number { return this.mass; }

    // Add force to total for the current step
    applyForce(force: Vector) {
        this.current_force = this.current_force.add(force);
    }

    // Calculate gravity between two objects
    gravitationalForce(other: PObject): Vector {
        let r_vec = other.posval().sub(this.pos);
        let r = Math.max(r_vec.size(), massToRadius(this.mass) + massToRadius(other.massval()));
        return r_vec.mul(G * this.mass * other.massval() / (r ** 3));
    }
}

class Renderer {
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;

    private bg_color: string = "#0F0F0F";

    constructor(element_id: string) {
        this.canvas = document.getElementById(element_id) as HTMLCanvasElement;
        this.context = this.canvas.getContext("2d");

        // Resize window and draw background
        this.fitCanvasToWindow();
        this.drawBackground();

        // Set frame update function
        setInterval(this.step.bind(this), SECOND / FPS);
    }

    // Event listeners in 
    addListener(event: string, listener: (e: MouseEvent) => void) {
        this.canvas.addEventListener(event, listener);
    }

    step() {
        // Resize window and draw background
        this.fitCanvasToWindow()
        this.drawBackground();

        let step_size = 30;

        for (let i = 0; i < this.canvas.width; i += step_size) {
            for (let j = 0; j < this.canvas.height; j += step_size) {
                let x = i + step_size/2;
                let y = j + step_size/2;
                let force = ZERO_VEC;
                pobject_array.forEach(pobject => {
                    let r_vec = pobject.posval().sub(new Vector(x, y));
                    let r = r_vec.size();
                    force = force.add(r_vec.mul(G * pobject.massval() / (r ** 3)));
                });
                this.context.fillStyle = `rgb(${force.size()*2/3}, 0, ${force.size()})`
                this.context.fillRect(i, j, step_size, step_size);
            }
        }

        // Update and draw PObjects
        pobject_array.forEach(pobject => {
            pobject.step();
            this.drawPObject(pobject);
        });

        // Draw Particle being created
        if (mouse.down) {
            this.drawPObject(new Particle(mouse.clickpos, ZERO_VEC, Date.now() - mouse.clicktime));
        }
    }

    fitCanvasToWindow() {
        this.canvas.width = window.innerWidth + 1;
        this.canvas.height = window.innerHeight + 1;
    }

    drawBackground() {
        this.context.fillStyle = this.bg_color;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawPObject(pobject: PObject) {
        let pos = pobject.posval();
        let mass = pobject.massval();

        this.context.strokeStyle = "#ffffff";
        this.context.fillStyle = "#1f1f1f";

        this.context.beginPath();
        this.context.arc(pos.xval(), pos.yval(), massToRadius(mass), 0, 2 * PI);
        this.context.fill();
        this.context.stroke();
        this.context.fillStyle = "#ffffff";
    }
}

class Physics {
    public renderer: Renderer;

    constructor() {
        this.renderer = new Renderer("canvas");
    }

    createParticle(pos: Vector, vel: Vector, mass: number) {
        pobject_array.push(new Particle(pos, vel, mass));
    }
}

class UserInput {
    private physics: Physics;

    constructor() {
        this.physics = new Physics();
        mouse = new Mouse();

        this.physics.renderer.addListener("mousedown", event => {
            mouse.down = true;
            mouse.clickpos = new Vector(event.x, event.y);
            mouse.clicktime = Date.now();
        });

        this.physics.renderer.addListener("mousemove", event => {
            mouse.pos = new Vector(event.x, event.y);
        });

        this.physics.renderer.addListener("mouseup", event => {
            mouse.down = false;
            mouse.releasepos = new Vector(event.x, event.y);
            mouse.releasetime = Date.now();

            let vel = mouse.releasepos.sub(mouse.clickpos).mul(1 / 5);
            let mass = (mouse.releasetime - mouse.clicktime)

            this.physics.createParticle(mouse.clickpos, vel, mass);
        });
    }
}

// Time constants
const SECOND = 1000;
const FPS = 60;

// Physical constants
const dt = 1 / FPS;
const G = 5 * 10 ** 2;

// Mathematical constants
const PI = Math.PI;
const ZERO_VEC = new Vector(0, 0);

// Global objects
let pobject_array: PObject[] = new Array();
let mouse = new Mouse();

// Drawing
function massToRadius(m: number) { return Math.sqrt(m); }

// Start app
window.onload = () => {
    new UserInput();
};