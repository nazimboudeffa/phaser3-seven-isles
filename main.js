const config = {
  type: Phaser.AUTO,
  width: 640,
  height: 640,
  backgroundColor: '#001f3f',
  scene: {
    preload,
    create
  }
};

const game = new Phaser.Game(config);

const gridSize = 64;
const gridWidth = 10;
const gridHeight = 10;

function preload() {
  this.load.image('water', 'assets/kenney_pirate-pack/PNG/Default_size/Tiles/tile_73.png');
  this.load.image('corsair', 'assets/kenney_pirate-pack/PNG/Default_size/Ships/ship_4_64x64.png');
  this.load.image('pirate', 'assets/kenney_pirate-pack/PNG/Default_size/Ships/ship_2_64x64.png');
}

function create() {
  this.grid = [];
  this.shipGroup = this.add.group();
  this.placedCorsairCount = 0;
  this.maxCorsairs = 5;

  // ✅ Surbrillance visible
  this.hoverHighlight = this.add.rectangle(0, 0, gridSize, gridSize, 0xffff00, 0.2)
    .setStrokeStyle(2, 0xffff00)
    .setDepth(10)
    .setVisible(false);

  for (let row = 0; row < gridHeight; row++) {
    this.grid[row] = [];
    for (let col = 0; col < gridWidth; col++) {
      const x = col * gridSize;
      const y = row * gridSize;

      const tile = this.add.image(x, y, 'water').setOrigin(0);
      tile.setInteractive();

      // ➕ Associer coordonnées à l’objet tile
      tile.col = col;
      tile.row = row;

      tile.on('pointerover', () => {
        this.hoverHighlight.setPosition(x + gridSize / 2, y + gridSize / 2).setVisible(true);
      });

      tile.on('pointerout', () => {
        this.hoverHighlight.setVisible(false);
      });

      // ✅ Gestionnaire de clic générique
      tile.on('pointerdown', (pointer) => {
        console.log('Clic détecté sur tile', col, row);
        if (this.input.locked) return;

        const cell = this.grid[row][col];
        if (cell.hasShip && cell.type === 'corsair' && cell.shipSprite) {
          // Tourner de 90°
          cell.shipSprite.angle = (cell.shipSprite.angle + 90) % 360;
          console.log('🔄 Corsaire tourné à', cell.shipSprite.angle, 'degrés');
          return;
        }

        this.input.locked = true;
        placeCorsairShip(this, col, row);
        this.time.delayedCall(100, () => {
          this.input.locked = false;
        });
      });

      this.grid[row][col] = {
        hasShip: false,
        type: null
      };
    }
  }

  // 🏴‍☠️ Placer 5 navires pirates
  for (let i = 0; i < 5; i++) {
    placePirateShip.call(this);
  }

  this.battleButton = this.add.text(0, 0, '⚔️ Lancer la bataille', {
    font: '18px Arial',
    fill: '#ffffff',
    backgroundColor: '#660000',
    padding: { x: 10, y: 5 }
  }).setInteractive().setDepth(20);

  this.battleButton.on('pointerdown', () => {
    if (this.placedCorsairCount === 0) {
      console.log("⚠️ Aucun corsaire à engager.");
      return;
    }
    launchBattle.call(this);
  });

  this.score = 0;
  this.scoreText = this.add.text(250, 610, 'Score : 0', {
    font: '18px Arial',
    fill: '#ffffff',
    backgroundColor: '#003366',
    padding: { x: 10, y: 5 }
  }).setDepth(20);

}

function placePirateShip() {
  const maxAttempts = 100;
  let attempts = 0;
  let placed = false;

  while (!placed && attempts < maxAttempts) {
    attempts++;

    const col = Phaser.Math.Between(0, gridWidth - 1);
    const row = Phaser.Math.Between(0, gridHeight - 1);

    if (!this.grid[row][col].hasShip) {
      const x = col * gridSize;
      const y = row * gridSize;

      const ship = this.add.image(x + gridSize / 2, y + gridSize / 2, 'pirate').setOrigin(0.5);
      ship.setAngle(Phaser.Math.RND.pick([0, 90]));

      this.grid[row][col].hasShip = true;
      this.grid[row][col].type = 'pirate';

      this.shipGroup.add(ship);
      placed = true;
    }
  }

  if (!placed) {
    console.warn("Impossible de placer un navire pirate, grille pleine ?");
  }
}

// ✅ Placement corsaire avec logs et sécurité
function placeCorsairShip(scene, col, row) {
  console.log(`→ Tentative de placement corsaire à ${col}, ${row}`);

  if (scene.placedCorsairCount >= scene.maxCorsairs) {
    console.log('⚠️ Limite de corsaires atteinte');
    return;
  }

  const cell = scene.grid[row][col];
  if (cell.hasShip) {
    console.log(`❌ Case occupée par un ${cell.type}`);
    return;
  }

  const x = col * gridSize;
  const y = row * gridSize;

  const ship = scene.add.image(x + gridSize / 2, y + gridSize / 2, 'corsair').setOrigin(0.5);

  cell.hasShip = true;
  cell.type = 'corsair';
  cell.shipSprite = ship;

  scene.shipGroup.add(ship);
  scene.placedCorsairCount++;

  console.log(`✅ Corsaire placé (${scene.placedCorsairCount}/${scene.maxCorsairs})`);
}

function launchBattle() {
  console.log("🔥 Bataille lancée !");
  let kills = 0;

  for (let row = 0; row < gridHeight; row++) {
    for (let col = 0; col < gridWidth; col++) {
      const cell = this.grid[row][col];

      if (cell.type === 'corsair') {
        const directions = [
          { dx: 0, dy: -1 },
          { dx: 0, dy: 1 },
          { dx: -1, dy: 0 },
          { dx: 1, dy: 0 }
        ];

        for (const { dx, dy } of directions) {
          const newRow = row + dy;
          const newCol = col + dx;

          if (
            newRow >= 0 && newRow < gridHeight &&
            newCol >= 0 && newCol < gridWidth
          ) {
            const target = this.grid[newRow][newCol];
            if (target.type === 'pirate') {
              if (target.shipSprite) {
                target.shipSprite.destroy(); // Supprimer le sprite
              }
              this.grid[newRow][newCol] = {
                hasShip: false,
                type: null
              };
              kills++;
              console.log(`💥 Pirate coulé en ${newCol}, ${newRow}`);
            }
          }
        }
      }
    }
  }

  console.log(`🧨 Résultat : ${kills} pirate(s) éliminé(s)`);
  this.score += kills;
  this.scoreText.setText(`Score : ${this.score}`);

}