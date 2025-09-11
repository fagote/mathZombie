// =======================
// Seletores da UI
// =======================
const answerInput = document.getElementById("answer");
const submitButton = document.getElementById("submit-btn");
const scoreElement = document.getElementById("score");
const phaseElement = document.getElementById("phase");
const livesElement = document.getElementById("lives");
const userModal = document.getElementById("userModal");
const startBtn = document.getElementById("start-btn");

// Canvas
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Imagens
const zombieImg = new Image();
zombieImg.src = "assets/zombie.png";

const cannon = new Image();
cannon.src = "assets/cannon.png";

const laserImg = new Image();
laserImg.src = "assets/laser.png";

const vidaImg = new Image();
vidaImg.src = "assets/vida.png";

// Sons
const laserSound = new Audio("effects/laser.mp3");
const explosionSound = new Audio("effects/explosion.mp3");

// =======================
// Constantes
// =======================
const PLAYER_W = 60;
const PLAYER_H = 60;
const CANVAS_W = canvas.width;
const CANVAS_H = canvas.height;

// =======================
// Estado do jogo
// =======================
let score = 0;
let lives = 5;
let phase = 1;
let zombies = [];
let lasers = [];
let running = true;

// Dados do usuário
let userData = {
  name: "",
  age: 0,
  hits: 0,
  misses: 0
};

// Mensagens
let messageElement = document.createElement("p");
document.body.appendChild(messageElement);

updateHUD();

// =======================
// Classes
// =======================
class Zombie {
  constructor(x, y, question, answer) {
    this.x = x;
    this.y = y;
    this.width = 50;
    this.height = 70;
    this.question = question;
    this.answer = answer;
    this.speed = 1 + Math.random() * phase;
    this._targeted = false;
  }

  draw() {
    ctx.drawImage(zombieImg, this.x, this.y, this.width, this.height);
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText(this.question, this.x, this.y - 5);
  }

  update() {
    this.y += this.speed;
  }
}

class Laser {
  constructor(startX, startY, targetZombie) {
    this.x = startX;
    this.y = startY;
    this.target = targetZombie;
    this.speed = 12;
    this.done = false;
  }

  update(delta) {
    if (!this.target || zombies.indexOf(this.target) === -1) {
      this.done = true;
      return;
    }

    const tx = this.target.x + this.target.width / 2;
    const ty = this.target.y + this.target.height / 2;
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    const step = this.speed * (delta / 16);

    if (dist <= step) {
      this.x = tx;
      this.y = ty;
      this.done = true;
      return;
    }

    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;
  }

  draw() {
    if (!this.target) return;

    const tx = this.target.x + this.target.width / 2;
    const ty = this.target.y + this.target.height / 2;
    const angle = Math.atan2(ty - this.y, tx - this.x);

    const sizeW = 80;
    const sizeH = 40;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);
    ctx.drawImage(laserImg, -sizeW / 2, -sizeH / 2, sizeW, sizeH);
    ctx.restore();
  }
}

// =======================
// Funções do jogo
// =======================
function generateQuestion() {
  let a = Math.floor(Math.random() * (5 * phase)) + 1;
  let b = Math.floor(Math.random() * (5 * phase)) + 1;
  let question, answer;

  if (phase === 1) {
    question = `${a} + ${b}`;
    answer = a + b;
  } else if (phase === 2) {
    if (Math.random() > 0.5) {
      question = `${a} + ${b}`;
      answer = a + b;
    } else {
      question = `${a} - ${b}`;
      answer = a - b;
    }
  } else if (phase === 3) {
    question = `${a} × ${b}`;
    answer = a * b;
  } else {
    const op = ["+", "-", "×"][Math.floor(Math.random() * 3)];
    if (op === "+") {
      question = `${a} + ${b}`;
      answer = a + b;
    } else if (op === "-") {
      question = `${a} - ${b}`;
      answer = a - b;
    } else {
      question = `${a} × ${b}`;
      answer = a * b;
    }
  }

  return { question, answer };
}

function spawnZombie() {
  const { question, answer } = generateQuestion();
  const x = Math.random() * (canvas.width - 50);
  zombies.push(new Zombie(x, 0, question, answer));
}

function checkAnswer() {
  if (!running) return;

  const raw = answerInput.value.trim();
  if (raw === "") return;

  const user = Number(raw);
  if (Number.isNaN(user)) {
    messageElement.textContent = "Digite um número válido.";
    return;
  }

  let bestIdx = -1;
  let bestY = -Infinity;
  for (let i = 0; i < zombies.length; i++) {
    const z = zombies[i];
    if (z.answer === user && !z._targeted && z.y > bestY) {
      bestY = z.y;
      bestIdx = i;
    }
  }

  if (bestIdx !== -1) {
    const target = zombies[bestIdx];
    target._targeted = true;

    const playerX = CANVAS_W / 2;
    const playerY = CANVAS_H - PLAYER_H;

    lasers.push(new Laser(playerX, playerY, target));

    try { laserSound.currentTime = 0; laserSound.play(); } catch (e) {}
    messageElement.textContent = "✅ Laser disparado!";

    userData.hits++; // registrar acerto
  } else {
    messageElement.textContent = "❌ Nenhum zumbi com essa resposta.";
    userData.misses++; // registrar erro
  }

  answerInput.value = "";
  answerInput.focus();
}

function updateHUD() {
  scoreElement.textContent = `Pontuação: ${score}`;
  phaseElement.textContent = `Fase: ${phase}`;

  livesElement.innerHTML = "";
  for (let i = 0; i < lives; i++) {
    const heart = document.createElement("img");
    heart.src = "assets/vida.png";
    heart.width = 24;
    heart.height = 24;
    heart.style.marginRight = "5px";
    livesElement.appendChild(heart);
  }
}

let lastTime = performance.now();

function gameLoop(now) {
  const delta = now - lastTime;
  lastTime = now;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Jogador
  ctx.drawImage(cannon, CANVAS_W / 2 - PLAYER_W / 2, CANVAS_H - PLAYER_H, PLAYER_W, PLAYER_H);

  // Zumbis
  zombies.forEach((zombie, index) => {
    zombie.update();
    zombie.draw();

    if (zombie.y > CANVAS_H - PLAYER_H) {
      lives--;
      updateHUD();
      zombies.splice(index, 1);

      if (lives <= 0) {
        running = false;
        alert(`💀 Game Over!\nPontuação: ${score}\nNome: ${userData.name}\nIdade: ${userData.age}`);
        document.location.reload();
      }
    }
  });

  // Lasers
  for (let i = lasers.length - 1; i >= 0; i--) {
    const l = lasers[i];
    l.update(delta);
    l.draw();

    if (l.done) {
      const idx = zombies.indexOf(l.target);
      if (idx !== -1) {
        try { explosionSound.currentTime = 0; explosionSound.play(); } catch (e) {}
        zombies.splice(idx, 1);
        score++;
        updateHUD();
        messageElement.textContent = "💥 Zumbi destruído!";

        if (score % 10 === 0) {
          phase++;
          updateHUD();
          messageElement.textContent = `🚀 Você passou para a fase ${phase}!`;
        }
      }
      lasers.splice(i, 1);
    }
  }

  if (running) requestAnimationFrame(gameLoop);
}

// =======================
// Eventos
// =======================
submitButton.addEventListener("click", checkAnswer);
answerInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") checkAnswer();
});

// =======================
// Modal de usuário
// =======================
startBtn.addEventListener("click", () => {
  const name = document.getElementById("name").value.trim();
  const age = parseInt(document.getElementById("age").value);

  if (!name || !age) {
    alert("Preencha nome e idade!");
    return;
  }

  userData.name = name;
  userData.age = age;

  // Fechar modal
  userModal.style.display = "none";

  // Mostrar jogo
  document.getElementById("gameCanvas").style.display = "block";
  document.getElementById("controls").style.display = "flex";
  document.querySelector(".hud").style.display = "flex";

  answerInput.focus();

  // iniciar spawn de zumbis e loop
  setInterval(spawnZombie, 2500);
  gameLoop(lastTime);
});
