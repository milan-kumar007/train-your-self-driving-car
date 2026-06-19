const carCanvas=document.getElementById("carCanvas");
carCanvas.width=200;
const networkCanvas=document.getElementById("networkCanvas");
networkCanvas.width=300;

const carCtx = carCanvas.getContext("2d");
const networkCtx = networkCanvas.getContext("2d");

const road=new Road(carCanvas.width/2,carCanvas.width*0.9);

const N=100;
const cars=generateCars(N);
let bestCar=cars[0];

try {
    if(localStorage.getItem("bestBrain")){
        const parsedBrain = JSON.parse(localStorage.getItem("bestBrain"));
        // Basic validation of brain structure to prevent injection attacks
        if(parsedBrain && Array.isArray(parsedBrain.levels)) {
            for(let i=0;i<cars.length;i++){
                cars[i].brain=JSON.parse(localStorage.getItem("bestBrain"));
                if(i!=0){
                    NeuralNetwork.mutate(cars[i].brain,0.1);
                }
            }
        } else {
            console.warn("Invalid brain structure detected in localStorage. Discarding.");
            localStorage.removeItem("bestBrain");
        }
    }
} catch (e) {
    console.error("Corrupted brain data in localStorage:", e);
    localStorage.removeItem("bestBrain");
}

let generation = localStorage.getItem("generation") ? parseInt(localStorage.getItem("generation")) : 1;
if(document.getElementById("genDisplay")){
    document.getElementById("genDisplay").innerText = generation;
}

// Attach event listeners safely without inline onclick
if(document.getElementById('saveBtn')) document.getElementById('saveBtn').addEventListener('click', save);
if(document.getElementById('downloadBtn')) document.getElementById('downloadBtn').addEventListener('click', downloadModel);
if(document.getElementById('discardBtn')) document.getElementById('discardBtn').addEventListener('click', discard);
if(document.getElementById('reloadBtn')) document.getElementById('reloadBtn').addEventListener('click', () => location.reload());

const obstacles = [
    new Obstacle(road.getLaneCenter(1), -200, 20, 20, "POTHOLE"),
    new Obstacle(road.getLaneCenter(0), -400, 60, 10, "NO_ENTRY"),
    new Obstacle(50, -600, 15, 10, "ANIMAL"),
    new Obstacle(150, -800, 15, 10, "ANIMAL")
];

const traffic=[
    new Car(road.getLaneCenter(1),-100,30,50,"DUMMY",2,getRandomColor()),
    new Car(road.getLaneCenter(0),-300,30,50,"RASH",3,getRandomColor()),
    new Car(road.getLaneCenter(2),-300,30,50,"DUMMY",2,getRandomColor()),
    new Car(road.getLaneCenter(0),-500,30,50,"DUMMY",2,getRandomColor()),
    new Car(road.getLaneCenter(1),-500,30,50,"RASH",3,getRandomColor()),
    new Car(road.getLaneCenter(1),-700,30,50,"DUMMY",2,getRandomColor()),
    new Car(road.getLaneCenter(2),-700,30,50,"DUMMY",2,getRandomColor()),
    // Stationary roadblock to force braking/overtaking
    new Car(road.getLaneCenter(1),-900,30,50,"DUMMY",0,getRandomColor()), 
    new Car(road.getLaneCenter(0),-1000,30,50,"RASH",3,getRandomColor()),
    new Car(road.getLaneCenter(2),-1000,30,50,"DUMMY",2,getRandomColor()),
];

animate();

function save(){
    localStorage.setItem("bestBrain",
        JSON.stringify(bestCar.brain));
    localStorage.setItem("generation", generation + 1);
    
    // Visual feedback
    const btn = document.getElementById('saveBtn');
    if(btn) {
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="icon">✅</span> Saved!';
        setTimeout(() => btn.innerHTML = originalText, 1500);
    }
}

function downloadModel() {
    if (!bestCar) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bestCar.brain, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "bestBrain.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function discard(){
    localStorage.removeItem("bestBrain");
    localStorage.removeItem("generation");
    
    // Visual feedback
    const btn = document.getElementById('discardBtn');
    if(btn) {
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="icon">✅</span> Discarded!';
        setTimeout(() => btn.innerHTML = originalText, 1500);
    }
}

function generateCars(N){
    const cars=[];
    for(let i=1;i<=N;i++){
        cars.push(new Car(road.getLaneCenter(1),100,30,50,"AI"));
    }
    return cars;
}

function animate(time){
    try {
        for(let i=0;i<obstacles.length;i++){
            obstacles[i].update();
        }
        for(let i=0;i<traffic.length;i++){
            traffic[i].update(road.borders, traffic, obstacles);
        }
        for(let i=0;i<cars.length;i++){
            cars[i].update(road.borders, traffic, obstacles);
        }
        bestCar=cars.find(
            c=>c.y==Math.min(
                ...cars.map(c=>c.y)
            ));

        if(document.getElementById("aliveDisplay")){
            const aliveCars = cars.filter(c => !c.damaged).length;
            document.getElementById("aliveDisplay").innerText = aliveCars;
        }

        carCanvas.height=window.innerHeight;
        networkCanvas.height=window.innerHeight;

        carCtx.save();
        carCtx.translate(0,-bestCar.y+carCanvas.height*0.7);

        road.draw(carCtx);
        for(let i=0;i<obstacles.length;i++){
            obstacles[i].draw(carCtx);
        }
        for(let i=0;i<traffic.length;i++){
            traffic[i].draw(carCtx);
        }
        carCtx.globalAlpha=0.2;
        for(let i=0;i<cars.length;i++){
            cars[i].draw(carCtx);
        }
        carCtx.globalAlpha=1;
        bestCar.draw(carCtx,true);

        carCtx.restore();

        networkCtx.lineDashOffset=-time/50;
        Visualizer.drawNetwork(networkCtx,bestCar.brain);
        requestAnimationFrame(animate);
    } catch(err) {
        // Sanitize error output to prevent DOM XSS
        const sanitizedMsg = err.message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const sanitizedStack = err.stack ? err.stack.replace(/</g, "&lt;").replace(/>/g, "&gt;") : "";
        document.body.innerHTML = `<div style="color:white; background:red; padding:20px; z-index:9999; position:absolute; top:0; left:0; right:0; font-family:monospace; font-size:16px;"><b>Error in animate loop:</b><br>${sanitizedMsg}<br><br>${sanitizedStack.replace(/\n/g, '<br>')}</div>` + document.body.innerHTML;
        throw err;
    }
}