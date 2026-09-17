
const c = document.getElementById("game"),
  x = c.getContext("2d"),
  W = c.width,
  H = c.height;

let running = false,
  paused = false,
  score = 0,
  lives = 3,
  level = 1,
  frame = 0,
  keys = {},
  touchFire = false;

let bullets = [],
  enemies = [],
  particles = [],
  stars = [];

/* =========================
   FORMASI & SERANGAN BABI
========================= */

let formationOffset = 0;
let formationDirection = 1;
let formationSpeed = 0.8;

let attackDelay = 50;
let nextAttackTimer = 0;

/* =========================
   PLAYER
========================= */

let player = {
  x: W / 2,
  y: H - 90,
  w: 46,
  h: 54,
  speed: 5,
  fire: 0,
  inv: 0
};

/* =========================
   STARS
========================= */

for (let i = 0; i < 100; i++) {
  stars.push({
    x: Math.random() * W,
    y: Math.random() * H,
    s: Math.random() * 2 + 0.3,
    v: Math.random() * 1.8 + 0.3,
    a: Math.random() * 0.8 + 0.2
  });
}

/* =========================
   RESET GAME
========================= */

function reset() {
  score = 0;
  lives = 3;
  level = 1;
  frame = 0;

  bullets = [];
  enemies = [];
  particles = [];

  formationOffset = 0;
  formationDirection = 1;

  attackDelay = 50;
  nextAttackTimer = 50;

  player = {
    x: W / 2,
    y: H - 90,
    w: 46,
    h: 54,
    speed: 5,
    fire: 0,
    inv: 0
  };

  spawnWave();
}

/* =========================
   SPAWN WAVE
========================= */

function spawnWave() {
  enemies = [];

  formationOffset = 0;
  formationDirection = 1;

  formationSpeed = 0.8 + level * 0.05;

  nextAttackTimer = 50;

  let rows = Math.min(
    5,
    3 + Math.floor(level / 2)
  );

  let attackOrder = 0;

  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < 7; col++) {

      let startX = 53 + col * 54;
      let startY = 92 + r * 45;

      enemies.push({
        x: startX,
        y: startY,

        startX: startX,
        startY: startY,

        fallSpeed: 0,

        /* Kecepatan normal saat turun */
        maxFallSpeed:
          1.5 + level * 0.05,

        /* Kecepatan saat mengejar pesawat */
        attackSpeed:
          2.2 + level * 0.08,

        phase:
          Math.random() * Math.PI * 2,

        attacking: false,

        /* Urutan serangan */
        attackOrder: attackOrder
      });

      attackOrder++;
    }
  }
}

/* =========================
   TEXT
========================= */

function text(t, px, py, size, fill) {
  x.font = `bold ${size}px Arial`;
  x.fillStyle = fill;
  x.textAlign = "center";
  x.fillText(t, px, py);
}

/* =========================
   DRAW SHIP
========================= */

function drawShip(px, py) {
  x.save();

  x.translate(px, py);

  x.shadowBlur = 18;
  x.shadowColor = "#ff3b00";

  x.fillStyle = "#e53935";

  x.beginPath();

  x.moveTo(0, -28);
  x.lineTo(20, 15);
  x.lineTo(9, 12);
  x.lineTo(15, 27);
  x.lineTo(0, 19);
  x.lineTo(-15, 27);
  x.lineTo(-9, 12);
  x.lineTo(-20, 15);

  x.closePath();

  x.fill();

  /* Api pesawat */

  x.shadowBlur = 8;
  x.fillStyle = "#ffcf33";

  x.beginPath();

  x.moveTo(-7, 25);
  x.lineTo(
    0,
    40 + Math.random() * 8
  );
  x.lineTo(7, 25);

  x.closePath();

  x.fill();

  /* Kaca */

  x.fillStyle = "#b9ecff";

  x.beginPath();

  x.arc(
    0,
    -10,
    7,
    0,
    Math.PI * 2
  );

  x.fill();

  x.restore();
}

/* =========================
   DRAW PIG
========================= */

function drawPig(e) {
  x.save();

  x.translate(e.x, e.y);

  /*
    Kalau babi sedang menyerang,
    beri sedikit efek cahaya
  */

  if (e.attacking) {
    x.shadowBlur = 20;
    x.shadowColor = "#ff4040";
  } else {
    x.shadowBlur = 12;
    x.shadowColor = "#70ff45";
  }

  x.fillStyle = "#8ee63e";

  /* Kepala babi */

  x.beginPath();

  x.arc(
    0,
    0,
    13,
    Math.PI,
    0
  );

  x.lineTo(11, 11);
  x.lineTo(5, 7);
  x.lineTo(0, 12);
  x.lineTo(-5, 7);
  x.lineTo(-11, 11);

  x.closePath();

  x.fill();

  /* Mata */

  x.fillStyle = "#eaffcf";

  x.fillRect(
    -7,
    -1,
    4,
    5
  );

  x.fillRect(
    3,
    -1,
    4,
    5
  );

  /* Hidung */

  x.fillStyle = "#ff9b9b";

  x.beginPath();

  x.ellipse(
    0,
    7,
    6,
    4,
    0,
    0,
    Math.PI * 2
  );

  x.fill();

  /* Lubang hidung */

  x.fillStyle = "#542020";

  x.beginPath();

  x.arc(
    -2,
    7,
    1.3,
    0,
    Math.PI * 2
  );

  x.arc(
    2,
    7,
    1.3,
    0,
    Math.PI * 2
  );

  x.fill();

  x.restore();
}

/* =========================
   PARTICLE EXPLOSION
========================= */

function burst(
  px,
  py,
  col,
  n = 14
) {
  for (let i = 0; i < n; i++) {

    let a =
      Math.random() *
      Math.PI *
      2;

    let s =
      Math.random() * 4 + 1;

    particles.push({
      x: px,
      y: py,

      vx:
        Math.cos(a) * s,

      vy:
        Math.sin(a) * s,

      life:
        30 +
        Math.random() * 20,

      col
    });
  }
}

/* =========================
   SHOOT
========================= */

function shoot() {
  if (player.fire > 0) return;

  player.fire = 10;

  bullets.push({
    x: player.x,
    y: player.y - 30,
    vy: -10
  });
}

/* =========================
   MULAI BABI BERIKUTNYA
========================= */

function startNextPig() {

  if (!enemies.length) return;

  /*
    Cari babi dengan attackOrder
    paling kecil yang belum menyerang.
  */

  let nextPig = null;

  for (let e of enemies) {

    if (!e.attacking) {

      if (
        nextPig === null ||
        e.attackOrder <
          nextPig.attackOrder
      ) {
        nextPig = e;
      }
    }
  }

  if (nextPig) {

    nextPig.attacking = true;

    /*
      Mulai dari posisi formasi
      lalu bergerak mengejar pesawat.
    */

    nextPig.fallSpeed = 0;
  }
}

/* =========================
   UPDATE
========================= */

function update() {

  if (!running || paused) return;

  frame++;

  /* =====================
     STARS
  ===================== */

  stars.forEach(s => {

    s.y += s.v;

    if (s.y > H) {
      s.y = -2;
    }

  });

  /* =====================
     PLAYER MOVEMENT
  ===================== */

  if (
    keys.ArrowLeft ||
    keys.a
  ) {
    player.x -= player.speed;
  }

  if (
    keys.ArrowRight ||
    keys.d
  ) {
    player.x += player.speed;
  }

  player.x = Math.max(
    28,
    Math.min(
      W - 28,
      player.x
    )
  );

  /* =====================
     SHOOT
  ===================== */

  if (
    keys[" "] ||
    keys.Space ||
    touchFire
  ) {
    shoot();
  }

  if (player.fire > 0) {
    player.fire--;
  }

  if (player.inv > 0) {
    player.inv--;
  }

  /* =====================
     BULLETS
  ===================== */

  bullets.forEach(b => {
    b.y += b.vy;
  });

  bullets =
    bullets.filter(
      b => b.y > -10
    );

  /* =====================
     FORMATION
  ===================== */

  if (enemies.length) {

    formationOffset +=
      formationSpeed *
      formationDirection;

    if (
      formationOffset >= 45
    ) {
      formationOffset = 45;
      formationDirection = -1;
    }

    if (
      formationOffset <= -45
    ) {
      formationOffset = -45;
      formationDirection = 1;
    }

    /* =====================
       DELAY SERANGAN
    ===================== */

    if (nextAttackTimer > 0) {
      nextAttackTimer--;
    }

    /*
      Jika tidak ada babi yang
      sedang menyerang, mulai
      babi berikutnya.
    */

    let someoneAttacking =
      enemies.some(
        e => e.attacking
      );

    if (
      !someoneAttacking &&
      nextAttackTimer <= 0
    ) {
      startNextPig();
    }

    /* =====================
       GERAKAN SEMUA BABI
    ===================== */

    enemies.forEach(e => {

      /* ===================
         BABI DI FORMASI
      =================== */

      if (!e.attacking) {

        e.x =
          e.startX +
          formationOffset +
          Math.sin(
            frame * 0.04 +
            e.phase
          ) * 3;

        /*
          Babi yang belum menyerang
          tetap turun perlahan.
        */

        e.fallSpeed +=
          0.002 +
          level * 0.0001;

        e.fallSpeed =
          Math.min(
            e.fallSpeed,
            e.maxFallSpeed
          );

        e.y +=
          e.fallSpeed;

        return;
      }

      /* ===================
         BABI MENYERANG
      =================== */

      /*
        Hitung arah menuju pesawat.
      */

      let dx =
        player.x - e.x;

      let dy =
        player.y - e.y;

      let distance =
        Math.sqrt(
          dx * dx +
          dy * dy
        );

      if (distance > 0) {

        /*
          Kecepatan dibuat lebih
          cepat agar terasa tegang.
        */

        let speed =
          e.attackSpeed;

        /*
          Perlahan semakin cepat
          ketika mendekati pesawat.
        */

        if (distance < 180) {
          speed += 0.8;
        }

        e.x +=
          (dx / distance) *
          speed;

        e.y +=
          (dy / distance) *
          speed;
      }

    });
  }

  /* =====================
     TABRAKAN BABI DENGAN PESAWAT
  ===================== */

  if (player.inv <= 0) {

    for (
      let i = enemies.length - 1;
      i >= 0;
      i--
    ) {

      let e = enemies[i];

      if (
        Math.abs(
          e.x - player.x
        ) < 30 &&

        Math.abs(
          e.y - player.y
        ) < 35
      ) {

        enemies.splice(i, 1);

        burst(
          e.x,
          e.y,
          "#7cff50",
          20
        );

        hitPlayer();

        /*
          Babi berikutnya menyerang
          setelah jeda singkat.
        */

        nextAttackTimer =
          attackDelay;

        break;
      }
    }
  }

  /* =====================
     BULLET VS PIG
  ===================== */

  for (
    let i = enemies.length - 1;
    i >= 0;
    i--
  ) {

    let e = enemies[i];

    for (
      let j = bullets.length - 1;
      j >= 0;
      j--
    ) {

      let b = bullets[j];

      if (
        Math.abs(
          b.x - e.x
        ) < 20 &&

        Math.abs(
          b.y - e.y
        ) < 20
      ) {

        bullets.splice(j, 1);

        enemies.splice(i, 1);

        score += 100;

        burst(
          e.x,
          e.y,
          "#7cff50"
        );

        /*
          Kalau babi yang menyerang
          ditembak, berikan jeda
          sebelum babi berikutnya.
        */

        if (e.attacking) {

          nextAttackTimer =
            attackDelay;
        }

        break;
      }
    }
  }

  /* =====================
     NEXT LEVEL
  ===================== */

  if (!enemies.length) {

    level++;

    score += 500;

    spawnWave();

    burst(
      W / 2,
      160,
      "#fff",
      35
    );
  }

  /* =====================
     PARTICLES
  ===================== */

  particles.forEach(p => {

    p.x += p.vx;
    p.y += p.vy;

    p.vx *= 0.97;
    p.vy *= 0.97;

    p.life--;
  });

  particles =
    particles.filter(
      p => p.life > 0
    );

  /* =====================
     UI
  ===================== */

  document.getElementById(
    "score"
  ).textContent = score;

  document.getElementById(
    "lives"
  ).textContent = lives;
}

/* =========================
   HIT PLAYER
========================= */

function hitPlayer() {

  lives--;

  player.inv = 120;

  burst(
    player.x,
    player.y,
    "#ff5b22",
    30
  );

  if (lives <= 0) {
    gameOver();
  }
}

/* =========================
   GAME OVER
========================= */

function gameOver() {

  running = false;

  document.getElementById(
    "title"
  ).textContent =
    "GAME OVER";

  document.getElementById(
    "msg"
  ).innerHTML =
    `Skor akhir: <b>${score}</b><br>` +
    `Level: <b>${level}</b>`;

  document.getElementById(
    "start"
  ).textContent =
    "MAIN LAGI";

  document.getElementById(
    "overlay"
  ).classList.remove(
    "hidden"
  );
}

/* =========================
   DRAW
========================= */

function draw() {

  /* =====================
     BACKGROUND
  ===================== */

  let g =
    x.createLinearGradient(
      0,
      0,
      0,
      H
    );

  g.addColorStop(
    0,
    "#08030e"
  );

  g.addColorStop(
    0.55,
    "#190719"
  );

  g.addColorStop(
    1,
    "#05030a"
  );

  x.fillStyle = g;

  x.fillRect(
    0,
    0,
    W,
    H
  );

  /* =====================
     BORDER
  ===================== */

  x.fillStyle =
    "#ffd32a";

  x.shadowBlur = 20;
  x.shadowColor =
    "#ffd32a";

  x.fillRect(
    4,
    0,
    3,
    H
  );

  x.fillRect(
    W - 7,
    0,
    3,
    H
  );

  x.shadowBlur = 0;

  /* =====================
     STARS
  ===================== */

  stars.forEach(s => {

    x.globalAlpha = s.a;

    x.fillStyle = "#fff";

    x.beginPath();

    x.arc(
      s.x,
      s.y,
      s.s,
      0,
      Math.PI * 2
    );

    x.fill();

  });

  x.globalAlpha = 1;

  /* =====================
     RADIAL LIGHT
  ===================== */

  let rg =
    x.createRadialGradient(
      W * 0.5,
      H * 0.5,
      10,
      W * 0.5,
      H * 0.5,
      230
    );

  rg.addColorStop(
    0,
    "#ff205022"
  );

  rg.addColorStop(
    0.5,
    "#c0006020"
  );

  rg.addColorStop(
    1,
    "transparent"
  );

  x.fillStyle = rg;

  x.fillRect(
    0,
    180,
    W,
    430
  );

  /* =====================
     PIGS
  ===================== */

  enemies.forEach(
    drawPig
  );

  /* =====================
     BULLETS
  ===================== */

  bullets.forEach(b => {

    x.shadowBlur = 12;
    x.shadowColor = "#fff";

    x.fillStyle = "#fff";

    x.fillRect(
      b.x - 2,
      b.y - 10,
      4,
      14
    );

    x.shadowBlur = 0;

  });

  /* =====================
     PLAYER
  ===================== */

  if (
    player.inv % 10 < 6
  ) {

    drawShip(
      player.x,
      player.y
    );

  }

  /* =====================
     PARTICLES
  ===================== */

  particles.forEach(p => {

    x.globalAlpha =
      Math.max(
        0,
        p.life / 45
      );

    x.fillStyle =
      p.col;

    x.fillRect(
      p.x,
      p.y,
      3,
      3
    );

  });

  x.globalAlpha = 1;

  /* =====================
     LEVEL
  ===================== */

  text(
    "LEVEL " + level,
    W / 2,
    35,
    14,
    "#ffe27a"
  );
}

/* =========================
   GAME LOOP
========================= */

function loop() {

  update();

  draw();

  requestAnimationFrame(
    loop
  );
}

/* =========================
   START BUTTON
========================= */

document.getElementById(
  "start"
).onclick = () => {

  reset();

  running = true;

  paused = false;

  document.getElementById(
    "overlay"
  ).classList.add(
    "hidden"
  );
};

/* =========================
   PAUSE BUTTON
========================= */

document.getElementById(
  "pause"
).onclick = () => {

  if (!running) return;

  paused = !paused;

  document.getElementById(
    "pause"
  ).textContent =
    paused
      ? "▶"
      : "Ⅱ";
};

/* =========================
   KEYBOARD
========================= */

addEventListener(
  "keydown",
  e => {

    keys[e.key] = true;

    if (
      [
        " ",
        "ArrowLeft",
        "ArrowRight"
      ].includes(e.key)
    ) {
      e.preventDefault();
    }

    if (
      e.key === "p" ||
      e.key === "P"
    ) {

      document
        .getElementById(
          "pause"
        )
        .click();

    }

  }
);

addEventListener(
  "keyup",
  e => {

    keys[e.key] = false;

  }
);

/* =========================
   TOUCH CONTROL
========================= */

function bind(id, key) {

  let el =
    document.getElementById(
      id
    );

  el.addEventListener(
    "pointerdown",
    e => {

      e.preventDefault();

      keys[key] = true;

    }
  );

  [
    "pointerup",
    "pointercancel",
    "pointerleave"
  ].forEach(t => {

    el.addEventListener(
      t,
      () => {

        keys[key] = false;

      }
    );

  });
}

bind(
  "left",
  "ArrowLeft"
);

bind(
  "right",
  "ArrowRight"
);

/* =========================
   FIRE BUTTON
========================= */

let fire =
  document.getElementById(
    "fire"
  );

fire.addEventListener(
  "pointerdown",
  e => {

    e.preventDefault();

    touchFire = true;

  }
);

[
  "pointerup",
  "pointercancel",
  "pointerleave"
].forEach(t => {

  fire.addEventListener(
    t,
    () => {

      touchFire = false;

    }
  );

});

/* =========================
   INIT
========================= */

reset();

draw();

loop();

