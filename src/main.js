import Phaser from 'phaser';
import './style.css';

const W = 960;
const H = 600;
const stations = [
  { x: 230, y: 335, label: '임무 통제', task: '통신 상태 점검 완료' },
  { x: 480, y: 335, label: '항법', task: '목적지 경로 확인 완료' },
  { x: 730, y: 335, label: '귀환 준비', task: '귀환 체크리스트 완료' },
];

class TrainingScene extends Phaser.Scene {
  constructor() { super('Training'); }

  preload() {
    this.load.image('nova', '/assets/nova.png');
  }

  create() {
    this.completed = new Set();
    this.cameras.main.setBackgroundColor('#080f20');
    const g = this.add.graphics();
    g.fillStyle(0x11243b).fillRoundedRect(48, 188, 864, 350, 22);
    g.lineStyle(3, 0x44758e).strokeRoundedRect(48, 188, 864, 350, 22);
    g.fillStyle(0x19354c).fillRect(80, 442, 800, 62);
    for (let x = 115; x < 865; x += 55) {
      g.lineStyle(1, 0x31516b).lineBetween(x, 442, x - 20, 504);
    }
    for (const [i, station] of stations.entries()) {
      g.fillStyle(0x1e405a).fillRoundedRect(station.x - 82, station.y - 64, 164, 118, 12);
      g.lineStyle(2, 0x69c7d0).strokeRoundedRect(station.x - 82, station.y - 64, 164, 118, 12);
      g.fillStyle(0x235f72).fillRoundedRect(station.x - 47, station.y - 42, 94, 50, 7);
      this.add.text(station.x, station.y - 17, String(i + 1).padStart(2, '0'), {
        fontFamily: 'monospace', fontSize: '26px', color: '#b5f4ef',
      }).setOrigin(0.5);
      this.add.text(station.x, station.y + 76, station.label, {
        fontFamily: 'sans-serif', fontSize: '20px', color: '#e5f2ff',
      }).setOrigin(0.5);
    }

    this.add.text(48, 37, 'JUNIOR ASTRONAUT', {
      fontFamily: 'monospace', fontSize: '29px', color: '#8ce5df', fontStyle: 'bold',
    });
    this.add.text(48, 78, 'MISSION TRAINER · 훈련 모듈 프로토타입', {
      fontFamily: 'sans-serif', fontSize: '17px', color: '#b6cbe0',
    });
    this.progress = this.add.text(910, 51, '', {
      fontFamily: 'monospace', fontSize: '19px', color: '#f8d87a',
    }).setOrigin(1, 0);
    this.status = this.add.text(W / 2, 551, '', {
      fontFamily: 'sans-serif', fontSize: '19px', color: '#eaf5ff',
    }).setOrigin(0.5);

    this.astronaut = this.add.image(110, 407, 'nova')
      .setDisplaySize(68, 102)
      .setOrigin(0.5, 0.75);

    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,R');
    this.keys.E.on('down', () => this.interact());
    this.keys.R.on('down', () => this.scene.restart());
    this.refreshStatus();
  }

  update(_time, delta) {
    const k = this.keys;
    const dx = Number(k.D.isDown || k.RIGHT.isDown) - Number(k.A.isDown || k.LEFT.isDown);
    const dy = Number(k.S.isDown || k.DOWN.isDown) - Number(k.W.isDown || k.UP.isDown);
    const length = Math.hypot(dx, dy) || 1;
    const speed = 240 * Math.min(delta, 50) / 1000;
    this.astronaut.x = Phaser.Math.Clamp(this.astronaut.x + dx / length * speed, 75, 885);
    this.astronaut.y = Phaser.Math.Clamp(this.astronaut.y + dy / length * speed, 380, 450);
    this.refreshStatus();
  }

  nearbyStation() {
    return stations.find(s => Math.hypot(this.astronaut.x - s.x, this.astronaut.y - s.y) < 105);
  }

  interact() {
    const station = this.nearbyStation();
    if (!station) return;
    this.completed.add(station.label);
    this.refreshStatus();
  }

  refreshStatus() {
    this.progress.setText(`완료 ${this.completed.size} / ${stations.length}`);
    if (this.completed.size === stations.length) {
      this.status.setText('훈련 완료! R을 눌러 다시 시작');
      return;
    }
    const station = this.nearbyStation();
    this.status.setText(station
      ? `${station.label}: ${this.completed.has(station.label) ? station.task : 'E를 눌러 점검'}`
      : '장치 가까이 이동해서 E를 눌러 점검하세요');
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: W,
  height: H,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: TrainingScene,
});
