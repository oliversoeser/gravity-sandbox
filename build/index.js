var Vector = (function () {
    function Vector(x, y) {
        this.x = x;
        this.y = y;
    }
    Vector.prototype.xval = function () { return this.x; };
    Vector.prototype.yval = function () { return this.y; };
    Vector.prototype.add = function (other) {
        return new Vector(this.x + other.x, this.y + other.y);
    };
    Vector.prototype.sub = function (other) {
        return new Vector(this.x - other.x, this.y - other.y);
    };
    Vector.prototype.mul = function (other) {
        return new Vector(other * this.x, other * this.y);
    };
    Vector.prototype.size = function () {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    };
    return Vector;
}());
var Mouse = (function () {
    function Mouse() {
        this.down = false;
        this.clickpos = ZERO_VEC;
        this.releasepos = ZERO_VEC;
        this.pos = ZERO_VEC;
    }
    return Mouse;
}());
var Particle = (function () {
    function Particle(pos, vel, mass) {
        this.current_force = ZERO_VEC;
        this.pos = pos;
        this.vel = vel;
        this.mass = mass;
    }
    Particle.prototype.step = function () {
        var _this = this;
        pobject_array.forEach(function (pobject) {
            _this.applyForce(_this.gravitationalForce(pobject));
        });
        var acc = this.current_force.mul(1 / this.mass);
        this.vel = this.vel.add(acc.mul(dt));
        this.pos = this.pos.add(this.vel.mul(dt));
        this.current_force = ZERO_VEC;
    };
    Particle.prototype.posval = function () { return this.pos; };
    Particle.prototype.massval = function () { return this.mass; };
    Particle.prototype.applyForce = function (force) {
        this.current_force = this.current_force.add(force);
    };
    Particle.prototype.gravitationalForce = function (other) {
        var r_vec = other.posval().sub(this.pos);
        var r = Math.max(r_vec.size(), massToRadius(this.mass) + massToRadius(other.massval()));
        return r_vec.mul(G * this.mass * other.massval() / (Math.pow(r, 3)));
    };
    return Particle;
}());
var Renderer = (function () {
    function Renderer(element_id) {
        this.bg_color = "#0F0F0F";
        this.canvas = document.getElementById(element_id);
        this.context = this.canvas.getContext("2d");
        this.fitCanvasToWindow();
        this.drawBackground();
        setInterval(this.step.bind(this), SECOND / FPS);
    }
    Renderer.prototype.addListener = function (event, listener) {
        this.canvas.addEventListener(event, listener);
    };
    Renderer.prototype.step = function () {
        var _this = this;
        this.fitCanvasToWindow();
        this.drawBackground();
        pobject_array.forEach(function (pobject) {
            pobject.step();
            _this.drawPObject(pobject);
        });
        if (mouse.down) {
            this.drawPObject(new Particle(mouse.clickpos, ZERO_VEC, Date.now() - mouse.clicktime));
        }
    };
    Renderer.prototype.fitCanvasToWindow = function () {
        this.canvas.width = window.innerWidth + 1;
        this.canvas.height = window.innerHeight + 1;
    };
    Renderer.prototype.drawBackground = function () {
        this.context.fillStyle = this.bg_color;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    };
    Renderer.prototype.drawPObject = function (pobject) {
        var pos = pobject.posval();
        var mass = pobject.massval();
        this.context.strokeStyle = "#ffffff";
        this.context.beginPath();
        this.context.arc(pos.xval(), pos.yval(), massToRadius(mass), 0, 2 * PI);
        this.context.stroke();
    };
    return Renderer;
}());
var Physics = (function () {
    function Physics() {
        this.renderer = new Renderer("canvas");
    }
    Physics.prototype.createParticle = function (pos, vel, mass) {
        pobject_array.push(new Particle(pos, vel, mass));
    };
    return Physics;
}());
var UserInput = (function () {
    function UserInput() {
        var _this = this;
        this.physics = new Physics();
        mouse = new Mouse();
        this.physics.renderer.addListener("mousedown", function (event) {
            mouse.down = true;
            mouse.clickpos = new Vector(event.x, event.y);
            mouse.clicktime = Date.now();
        });
        this.physics.renderer.addListener("mousemove", function (event) {
            mouse.pos = new Vector(event.x, event.y);
        });
        this.physics.renderer.addListener("mouseup", function (event) {
            mouse.down = false;
            mouse.releasepos = new Vector(event.x, event.y);
            mouse.releasetime = Date.now();
            var vel = mouse.releasepos.sub(mouse.clickpos).mul(1 / 5);
            var mass = (mouse.releasetime - mouse.clicktime);
            _this.physics.createParticle(mouse.clickpos, vel, mass);
        });
    }
    return UserInput;
}());
var SECOND = 1000;
var FPS = 60;
var dt = 1 / FPS;
var G = 5 * Math.pow(10, 2);
var PI = Math.PI;
var ZERO_VEC = new Vector(0, 0);
var pobject_array = new Array();
var mouse = new Mouse();
function massToRadius(m) { return Math.sqrt(m); }
window.onload = function () {
    new UserInput();
};
