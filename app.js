var started = false;
var gameIsOver = false;
// NAVIGATION WITH KEYS

var currentPos = 0; //pos 0-start, 1-controls etc..
var mainPage = true; // says if view is on the main page
var pages = ["main", "controls", "about"];
var anchorLinks = $('a');
$(window).keydown(function(e){
  if (!started){
		switch(e.which){
			case 40:
        if (mainPage){
          if (currentPos<2){
            anchorLinks.eq(currentPos).removeClass('flash');
            currentPos+=1;
            anchorLinks.eq(currentPos).addClass('flash');
          } else {
            anchorLinks.eq(currentPos).removeClass('flash');
            currentPos = 0;
            anchorLinks.eq(currentPos).addClass('flash');
          }
          break;
        }  
			case 38:
        if (mainPage){
          if (currentPos>0){
            anchorLinks.eq(currentPos).removeClass('flash');
            currentPos-=1;
            anchorLinks.eq(currentPos).addClass('flash');
          } else {
            anchorLinks.eq(currentPos).removeClass('flash');
            currentPos = 2;
            anchorLinks.eq(currentPos).addClass('flash');
          }
          break;
        }  
      case 13:
      case 32:
        if (mainPage){
          if (currentPos == 0) {
            game();
          } else if (currentPos == 1) {
            changeSection('main', pages[currentPos]);
            mainPage = false;
          } else if (currentPos == 2) {
            changeSection('main', pages[currentPos]);
            mainPage = false;
          }
        } else {
          changeSection(pages[currentPos], 'main');
          mainPage = true;
        }  
		}
  } else if (gameIsOver) {
    document.getElementById("main").style.display = "initial";
    document.getElementById("wrapper").style.display = "initial";
    document.getElementById("bg-image").style.display = "initial";
    document.getElementById("gameOver").style.display = "none";
    started = false;
    gameIsOver = false;
    background(0);
    resetGame();
  }
});



function changeSection(from, to) {
  document.getElementById(from).style.display = "none";
  document.getElementById(to).style.display = "initial";
}


function gameOver() {
  document.getElementById("gameOver").style.display = "initial";
  $('#score').text('');
  $('#finalScore').text(score);
  gameIsOver = true;

}

function game(){
    document.getElementById("main").style.display = "none";
    document.getElementById("wrapper").style.display = "none";
    document.getElementById("bg-image").style.display = "none";
    
    started = true;
}


// P5 GAME CODE

var ship;
var jet;
var score;
var asteroids;
var laserBeams;
var explosions;
var missiles;
var crashed;

function resetGame() {
  score = 0;
  crashed = false;
  ship = new Ship();
  jet = new Jet(ship.pos);
  asteroids = [];
  laserBeams = [];
  explosions = [];
  missiles = [];
  for (var i = 0; i < 5; i++) {
  	asteroids.push(new Asteroid());
  }
  stars = new Stars();
}

function setup() { 
  var canvas = createCanvas(900, 600);
  canvas.parent('game');
  resetGame();
} 

function draw() { 
  if(started){
    background(0, 160);
    // stars.show();
    for (var i = 0; i < asteroids.length; i++) {
      asteroids[i].update();
      asteroids[i].show();
      if (!crashed && ship.hit(asteroids[i])) {
        crashed = true;
        explosions.push(new Explosion(true, ship.pos));
      }
    }
    for (var j = 0; j < laserBeams.length; j++) {
      laserBeams[j].update();
      laserBeams[j].show();
      var flag = false;
      for (var i = asteroids.length-1; i >-1; i--) {
        if(laserBeams[j].hit(asteroids[i])) {
          score += asteroids[i].r * 100;
          explosions.push(new Explosion(true, asteroids[i].pos));
          asteroids[i].break();
          asteroids.splice(i,1);
          laserBeams.splice(j,1);
          j--;
          flag = true;
          break;
        }
      }
      if (flag == false && laserBeams[j].edges()) {
        laserBeams.splice(j,1);
        j--;
      }
    }
    for (var k = 0; k < explosions.length; k++) {
      explosions[k].update();
      explosions[k].show();
      if (explosions[k].particles.length == 0) {
        explosions.splice(k, 1);
        k--;
      }
    }
    for (var l = 0; l< missiles.length; l++) {
      missiles[l].getTarget();
      missiles[l].update();
      missiles[l].show();
      if (missiles[l].gotToCenter) {
        explosions.push(new Explosion(true, asteroids[missiles[l].targetIndex].pos, true));
        score += asteroids[missiles[l].targetIndex].r * 100;
        asteroids[missiles[l].targetIndex].break();
        asteroids.splice(missiles[l].targetIndex,1);
        missiles.splice(l,1);
        l--;

      }
    }
    jet.update();
    jet.show();
    ship.update();
    ship.show();
    $('#score').text(score);
    if (explosions.length == 0 && crashed &&
       missiles.length == 0 && laserBeams.length == 0){
      gameOver();
    }
  }
}

function Stars (pos) {
  this.stars = [];
  this.starsSz = [];
  
  for (var i = 0 ; i < 500; i++) {
  	this.stars.push(new p5.Vector(Math.floor(random(0, width)),Math.floor(random(0, height))));
    this.starsSz.push(random(2,4));
  }
  
  this.show = function () {
  	for (var i = 0 ; i< this.stars.length; i++) {
    	fill(80, 80, 100, 255);
      if (random() < 0.0002) {
      	ellipse(this.stars[i].x, this.stars[i].y, this.starsSz[i]+4);
      } else {
      	ellipse(this.stars[i].x, this.stars[i].y, this.starsSz[i]);
      }	
    }
  }
}


function Missile(pos, heading) {
	this.pos = pos.copy();
  this.heading = heading;
  this.targetFound = false;
  this.targetIndex = NaN;
  this.vel =  p5.Vector.fromAngle(ship.heading).mult(25);
  this.strength =0.8;
  this.gravityConstant = 300;
  this.gotToCenter = false;
  this.crosshairVisibility = 1;
  this.getTarget = function() {
  	if (this.targetFound == false) {
      var smallestDif = 40000;
      for (var i = 0; i < asteroids.length; i++) {
        
        //trzeba poprawic, problem z przypadkiem gdy statek ma np 359* a asteroida 5* (roznica daje 354, a powinna 6)
        push();
				translate(ship.pos.x, ship.pos.y);
        var a = atan2( asteroids[i].pos.y- ship.pos.y, asteroids[i].pos.x- ship.pos.x);
        var deg = (Math.floor(ship.heading * 180 / PI) + 360) % 360;
        var dega =(Math.floor(a * 180 / PI) + 360) % 360;
        pop();
        var difference  = Math.abs(deg  - dega);
        if (difference < smallestDif) {
        	smallestDif = difference;
          this.targetIndex = i;
        }
      }
      this.targetFound = true;
    }
  }
  
  this.update = function() {
  	if (this.targetFound && !this.gotToCenter) {
      var dir = p5.Vector.sub(asteroids[this.targetIndex].pos, this.pos);
      dir.setMag(this.strength);
			this.vel.add(dir);
      this.vel.mult(0.94);
      this.pos.add(this.vel);
      if (this.pos.dist(asteroids[this.targetIndex].pos) < asteroids[this.targetIndex].r * 0.5) {
        this.gotToCenter = true;
      }
    }
  }
  
  this.show = function () {
  	if (this.targetFound) {
      push();
      fill(250,20,20)
    	ellipse(this.pos.x, this.pos.y, 10);
			
      if (frameCount % 20 == 0) {
      	this.crosshairVisibility *= -1;
      }
      if (this.crosshairVisibility ==1) {
        noFill();
      	stroke(255,0,0, 120);
      	strokeWeight(3)
      	var ax = asteroids[this.targetIndex].pos.x;
      	var ay = asteroids[this.targetIndex].pos.y;
      	ellipse(ax, ay, 50);
      	ellipse(ax, ay, 30);
      	push();
      	translate(ax,ay);
      	rotate(asteroids[this.targetIndex].heading);
      	line(0, 0-30, 0, 0 + 30);
        line(0-30, 0, 0 + 30, 0);
      	pop();
        pop();
      }
      
			
    }
  }
}

function Explosion(explosion, pos, missile) {
  this.pos = pos.copy();
  if (explosion){
  	this.particles = [];
    if (missile) {
    	this.particlesNumber = 200;
      this.col = [Math.floor(random(255)),Math.floor(random(255)),Math.floor(random(255))];
    } else if (this.pos.x == ship.pos.x && this.pos.y == ship.pos.y) {
      this.particlesNumber = 300;
      this.col = [170, 1, 20];
    } else {
    	this.particlesNumber = 100;
      this.col = [255, 255, 255];
    }
    for (var i = 0; i < this.particlesNumber; i++) {
      this.particles.push(new Explosion(false, this.pos.copy(), missile));
    }
  } else {
    this.vel = p5.Vector.random2D().mult(random(-15,15));
    this.lifespan = random(150, 220);
    this.sz = Math.floor(random(4,8));
  }

	this.update = function() {
  	for (var i = 0; i < this.particles.length; i++) {
    	this.particles[i].pos.add(this.particles[i].vel);
      this.particles[i].lifespan -=25;
      if (this.particles[i].lifespan < 0) {
      	this.particles.splice(i, 1);
        i--;
      }
    }
  }
  	
  this.show = function () {
    
    push()
  		for (var i = 0; i < this.particles.length; i++) {
      	if (random()<0.2) {
          if (!missile && !crashed) {
          	fill(this.col);
          } else {
          	fill(Math.floor(random(255)),Math.floor(random(255)),Math.floor(random(255)));
          }
      	} else {
          	fill(this.col[0], this.col[1], this.col[2], this.particles[i].lifespan)
      	}
    		ellipse(this.particles[i].pos.x, this.particles[i].pos.y, this.particles[i].sz)
    	}
    pop();
  }
}
function Laser(pos, heading) {
	this.pos = pos.copy();
  this.heading = heading;
  this.vel = p5.Vector.fromAngle(this.heading).mult(8);
  this.rocket =
  this.update = function() {
    this.pos.add(this.vel);
  }
  this.show = function() {
    push();
    strokeWeight(4);
    stroke(255,20,20,255);
    point(this.pos.x, this.pos.y);
    pop();
  }
  this.hit = function(asteroid) {
  	if (this.pos.dist(asteroid.pos) < asteroid.r) {
    	return true;
    }
  }
  this.edges = function() {
  	if (this.pos.x > width ||
        this.pos.x < 0 ||
        this.pos.y > height ||
        this.pos.y < 0) {
    	return true;
    } else {
    	return false;
    }
  }
}
function Asteroid(r, pos, vel) {
  this.col = [Math.floor(random(255)),Math.floor(random(255)),Math.floor(random(255))];
  if (pos) {
    this.pos = pos.copy();
    this.r = r;
    this.vel = vel;
  } else {
    if (random()>0.5){
      if(random()>0.5){
        this.pos = createVector(-100, random(height));
      } else {
        this.pos = createVector(width + 100, random(height));
      }  
    } else {
      if(random()>0.5){
        this.pos = createVector(random(width), -100);
      } else {
        this.pos = createVector(random(width), height + 100);
      }  
    }
    this.r = Math.floor(random(40,90));
    this.vel = p5.Vector.random2D().mult(Math.floor(random(1,2)));
  }
  
  this.rotation = random(-PI/30, PI/30);
  this.heading = 0;
  this.total = [];
  this.pts = Math.floor(random(5,20));
  for (var i = 0; i < this.pts; i++){
  	this.total.push(Math.floor(random(this.r / 8,this.r / 2)));
  }
  
  this.show = function() {
    push();
    fill(0);
    if (!gameIsOver){
      stroke(255);
    } else {
      stroke(this.col[0],this.col[1],this.col[2], 180)
      if (frameCount % 40 == 0) {
        this.col = [Math.floor(random(255)),Math.floor(random(255)),Math.floor(random(255))];
      } 
    }
    
    strokeWeight(3)
    beginShape();
    
  	for (var i = 0; i < this.pts; i++) {
    	var angle = map(i, 0, this.pts, 0, TWO_PI);
      var x = (this.r-this.total[i])*cos(this.heading+angle);
      var y = (this.r-this.total[i])*sin(this.heading+angle);
      vertex(this.pos.x + x, this.pos.y + y)
    }
    endShape(CLOSE);
    pop();
  }
  this.update = function() {
  	this.pos.add(this.vel);
    this.heading += this.rotation;
    this.edges();
  }
  
  this.break = function() {
    var newR = Math.floor(this.r / 2);
    var newPos = this.pos;
    var newVelOne = this.vel.copy();
    var newVelTwo = this.vel.copy();
    newVelOne.rotate(PI/4)
    newVelTwo.rotate(-PI/4)
    if (newR > 10) {
      asteroids.push(new Asteroid(newR, newPos, newVelOne));
      asteroids.push(new Asteroid(newR, newPos, newVelTwo));
    } else if (random() < 0.4){
      asteroids.push(new Asteroid());
    }	
  }
  this.edges = function () {
  	if (this.pos.x>width+this.r) {
    	this.pos.x = 0-this.r;
    } else if (this.pos.x<0-this.r) {
    	this.pos.x = width+this.r;
    } else if (this.pos.y<0-this.r) {
    	this.pos.y = height+this.r;
    } else if (this.pos.y>height+this.r) {
    	this.pos.y = 0-this.r;
    }
  }
}
function Jet(){
	this.pos = ship.pos.copy();
  this.vel = createVector(0,0);
  this.particles = [];
  this.lifespan = 255;
  this.adding = false;
  
  this.set = function() {
    	if (this.adding && !crashed) {
      	this.particles.unshift(new Jet())
        this.particles.unshift(new Jet())
      } 	  
  }
  this.update = function() {
    this.set();
  	for (var i = this.particles.length-1; i>-1; i--) {
    	if (this.particles[i].lifespan <=0) {
      	this.particles.splice(i,1);
      } else {
        this.particles[i].lifespan -=15;
        var force = p5.Vector.fromAngle(ship.heading + PI + random(-1,1)).mult(0.9);
        this.particles[i].vel.add(force);
        this.particles[i].pos.add(this.particles[i].vel);
      }
    }
  }
  this.show = function() {
    push();
  	for (var i =0; i < this.particles.length; i++) {
    	fill(255,250,255,this.particles[i].lifespan);
      noStroke();
      ellipse(this.particles[i].pos.x, this.particles[i].pos.y, 4)
    }
    pop();
  }
  
}
function Ship() {
	this.pos = createVector(width/2, height/2);
  this.r = 10;
  this.heading = 0;
  this.rotation = 0;
  this.vel = createVector(0,0);
  this.isBoosting = false;
  this.laserLife = 255;
  this.boosting = function(b) {
  	this.isBoosting = b;
  }
  
  this.update = function() {
    if (frameCount % 10 == 0) {
    	this.laserLife += 10; 
			this.laserLife = constrain(this.laserLife, 0, 255)
    }
  	this.turn();
    this.edges();
    if (this.isBoosting) {
    	this.boost();
    }
    this.vel.mult(0.99);
    this.pos.add(this.vel);
  }
  
  this.show = function () {
    if (!crashed){
      push();
      translate(this.pos.x, this.pos.y);
      rotate(this.heading);
      fill(170, 1, 20, 255 - this.laserLife);
      strokeWeight(3);
      stroke(170, 1, 20, 220);
      triangle(0,-this.r, 0, this.r , this.r*2,  0);
      pop();
    }
  }
  
  this.edges = function () {
  	if (this.pos.x>width+this.r) {
    	this.pos.x = 0-this.r;
    } else if (this.pos.x<0-this.r) {
    	this.pos.x = width+this.r;
    } else if (this.pos.y<0-this.r) {
    	this.pos.y = height+this.r;
    } else if (this.pos.y>height+this.r) {
    	this.pos.y = 0-this.r;
    }
  }
  this.boost = function() {
    var force = p5.Vector.fromAngle(this.heading).mult(0.1);
  	this.vel.add(force);
  }
  
  this.turn = function(angle) {
  	this.heading += this.rotation;
    if (Math.abs(this.heading) >= TWO_PI) {
      if (this.heading > 0) {
      	this.heading -= TWO_PI;
      } else {
      	this.heading += TWO_PI;
      }
    }
  }
  this.setRotation = function(angle) {
  	this.rotation = angle;
  }
  this.hit = function(asteroid) {
  	if (this.pos.dist(asteroid.pos) < 0.9 * asteroid.r) {
    	return true;
    }
  }
}

function keyPressed() {
  if (!crashed) {
    if (keyCode == LEFT_ARROW) {
      ship.setRotation(-PI / 45)
    } else if (keyCode == RIGHT_ARROW) {
      ship.setRotation(PI / 45);
    } else if (keyCode == UP_ARROW) {
      ship.boosting(true);
      jet.adding = true;
    } else if (key == ' ' && ship.laserLife > 50) {
      laserBeams.push(new Laser(ship.pos, ship.heading));
      ship.laserLife -= 30;
    } else if (keyCode == CONTROL) {
      if (missiles.length ==0) {
        missiles.push(new Missile(ship.pos, ship.heading));
      }
    }    
  }
}

function keyReleased() {
	
  if (!keyIsDown(UP_ARROW)) {
  	ship.boosting(false)
    jet.adding = false;
  }
  if (key != ' '){
  	ship.setRotation(0);
  }
}

