import Phaser from 'phaser';
import { Dialogue, Hud, choose } from './ui.js';
import './style.css';

const W = 960, H = 540;
const say = (who, text) => ({ who, text });
const progress = { garden: false, hubSeen: false };

class Boot extends Phaser.Scene {
  constructor() { super('boot'); }
  preload() {
    for (const name of ['title', 'campus', 'garden', 'observatory', 'prince', 'lumi'])
      this.load.image(name, '/assets/' + name + '.png');
    this.load.spritesheet('walk', '/assets/walk.png', { frameWidth: 543, frameHeight: 724 });
  }
  create() {
    this.anims.create({ key: 'walking', frames: this.anims.generateFrameNumbers('walk', { start: 0, end: 3 }),
      frameRate: 9, repeat: -1 });
    this.scene.start('title');
  }
}

function createHero(scene, x, y) {
  const hero = scene.add.sprite(x, y, 'prince').setDisplaySize(94, 119).setOrigin(0.54, 1).setDepth(12);
  hero.walking = false;
  return hero;
}
function walk(scene, hero, keys, delta, min, max) {
  const dir = Number(keys.D.isDown || keys.RIGHT.isDown) - Number(keys.A.isDown || keys.LEFT.isDown);
  if (dir) {
    hero.x = Phaser.Math.Clamp(hero.x + dir * 205 * Math.min(delta, 50) / 1000, min, max);
    hero.setFlipX(dir < 0);
    if (!hero.walking) {
      hero.play('walking').setDisplaySize(94, 119).setOrigin(0.54, 1);
      hero.walking = true;
    }
  } else if (hero.walking) {
    hero.anims.stop();
    hero.setTexture('prince').setDisplaySize(94, 119).setOrigin(0.54, 1);
    hero.walking = false;
  }
}
function createLumi(scene, x, y) {
  const drone = scene.add.image(x, y, 'lumi').setDisplaySize(62, 70).setDepth(13);
  scene.tweens.add({ targets: drone, y: y - 9, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  return drone;
}
function createPrompt(scene) {
  const bg = scene.add.rectangle(0, 0, 160, 42, 0xffe8c7, 0.97).setStrokeStyle(2, 0x72564c)
    .setInteractive({ useHandCursor: true });
  const label = scene.add.text(0, 0, '', { fontFamily: 'system-ui', fontSize: '17px',
    color: '#503f38', fontStyle: 'bold' }).setOrigin(0.5);
  const root = scene.add.container(0, 0, [bg, label]).setDepth(40).setVisible(false);
  return { hide: () => root.setVisible(false), show: (x, y, text, action) => {
    root.setPosition(x, y).setVisible(true); label.setText(text);
    bg.removeAllListeners('pointerdown'); bg.on('pointerdown', action);
  } };
}
function fadeTo(scene, next) {
  scene.cameras.main.fadeOut(530, 25, 30, 48);
  scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => scene.scene.start(next));
}

class Title extends Phaser.Scene {
  constructor() { super('title'); }
  create() {
    this.cameras.main.fadeIn(550, 25, 30, 48);
    this.add.image(W / 2, H / 2, 'title').setDisplaySize(W, H);
    this.add.text(944, 526, 'PLAYABLE PROTOTYPE  ·  01', { fontFamily: 'serif', fontSize: '11px',
      color: '#f4d8b4', backgroundColor: '#2b344488', padding: { x: 9, y: 5 } }).setOrigin(1);
    let started = false;
    const begin = () => { if (!started) { started = true; fadeTo(this, 'hub'); } };
    this.input.once('pointerdown', begin);
    this.input.keyboard.once('keydown-SPACE', begin);
    this.input.keyboard.once('keydown-ENTER', begin);
  }
}

class Hub extends Phaser.Scene {
  constructor() { super('hub'); }
  create() {
    this.cameras.main.setZoom(1).centerOn(W / 2, H / 2).fadeIn(650, 25, 30, 48);
    this.add.image(W / 2, H / 2, 'campus').setDisplaySize(W, H);
    this.busy = true;
    this.dialogue = new Dialogue(this);
    const heading = this.add.text(26, 18, 'THE WAY TO THE MOON  /  훈련소 전체 지도', {
      fontFamily: 'Georgia, serif', fontSize: '20px', fontStyle: 'bold', color: '#ffe6bc',
      backgroundColor: '#172337dd', padding: { x: 15, y: 10 },
    }).setDepth(90).setAlpha(0);
    const help = this.add.text(944, 516, '건물을 클릭해 이동  ·  Esc 제목으로', {
      fontFamily: 'system-ui', fontSize: '15px', color: '#fff1da',
      backgroundColor: '#172337d9', padding: { x: 12, y: 8 },
    }).setOrigin(1).setDepth(90).setAlpha(0);
    this.labels = [heading, help];
    const spots = [
      { id: 'hangar', x: 105, y: 351, w: 175, h: 140, title: '발사 준비동', unlocked: false },
      { id: 'mission', x: 203, y: 244, w: 192, h: 104, title: '관제실', unlocked: false },
      { id: 'garden', x: 309, y: 350, w: 206, h: 142, title: '작은 온실', unlocked: true },
      { id: 'workshop', x: 529, y: 370, w: 175, h: 126, title: '제작실', unlocked: false },
      { id: 'observatory', x: 745, y: 180, w: 191, h: 241, title: '달 전망대', unlocked: progress.garden },
    ];
    this.spots = spots.map((spot) => this.createSpot(spot));
    this.input.keyboard.once('keydown-ESC', () => this.scene.start('title'));
    this.time.delayedCall(progress.hubSeen ? 430 : 1450, () => {
      this.tweens.add({ targets: this.labels, alpha: 1, duration: 420 });
      this.spots.forEach(({ marker, tag }) => this.tweens.add({ targets: [marker, tag], alpha: 1, duration: 450 }));
      if (!progress.hubSeen) {
        progress.hubSeen = true;
        this.dialogue.show([
          say('루미', '여기가 달로 가는 길을 준비하는 훈련소예요. 건물을 눌러 직접 둘러봐요.'),
          say('루미', '먼저 작은 온실에서 생명과 자원을 돌보는 연습을 시작해 볼까요?'),
        ], () => { this.busy = false; });
      } else this.busy = false;
    });
  }
  createSpot(spot) {
    const marker = this.add.circle(spot.x, spot.y, 24, 0xffdba1, 0.25)
      .setStrokeStyle(2, 0xffefc9, 0.85).setDepth(55).setAlpha(0);
    const tag = this.add.text(spot.x, spot.y - 38,
      `${spot.unlocked ? '✦' : '◇'}  ${spot.title}${spot.unlocked ? '' : '  ·  준비 중'}`, {
        fontFamily: 'system-ui', fontSize: '16px', fontStyle: 'bold', color: '#fff0d7',
        backgroundColor: '#1a283be6', padding: { x: 10, y: 6 },
      }).setOrigin(0.5).setDepth(56).setAlpha(0);
    this.tweens.add({ targets: marker, scale: 1.18, duration: 1100, yoyo: true,
      repeat: -1, ease: 'Sine.easeInOut' });
    const hit = this.add.zone(spot.x, spot.y, spot.w, spot.h)
      .setInteractive({ useHandCursor: true }).setDepth(54);
    hit.on('pointerover', () => { marker.setFillStyle(0xffdba1, 0.45); tag.setScale(1.07); });
    hit.on('pointerout', () => { marker.setFillStyle(0xffdba1, 0.25); tag.setScale(1); });
    hit.on('pointerdown', () => this.selectSpot(spot));
    return { marker, tag, hit };
  }
  selectSpot(spot) {
    if (this.busy) return;
    if (!spot.unlocked) {
      this.busy = true;
      const message = spot.id === 'observatory'
        ? '전망대는 온실 훈련을 마치면 열려요. 먼저 작은 온실로 가 볼까요?'
        : `${spot.title}은 다음 챕터를 위해 준비 중이에요. 지금은 온실과 전망대를 둘러볼 수 있어요.`;
      this.dialogue.show([say('루미', message)], () => { this.busy = false; });
      return;
    }
    this.busy = true;
    this.spots.forEach(({ hit }) => hit.disableInteractive());
    this.tweens.add({ targets: this.labels, alpha: 0, duration: 200 });
    this.spots.forEach(({ marker, tag }) => this.tweens.add({ targets: [marker, tag], alpha: 0, duration: 200 }));
    this.cameras.main.pan(spot.x, spot.y, 1050, 'Sine.easeInOut');
    this.cameras.main.zoomTo(2.35, 1050, 'Sine.easeInOut');
    this.time.delayedCall(950, () => fadeTo(this, spot.id));
  }
}

function addMapReturn(scene) {
  const button = scene.add.text(478, 16, '⌂  훈련소 전체 지도', {
    fontFamily: 'system-ui', fontSize: '15px', color: '#ffe9c8',
    backgroundColor: '#1b283ae6', padding: { x: 12, y: 8 },
  }).setOrigin(0.5, 0).setDepth(80).setInteractive({ useHandCursor: true });
  button.on('pointerdown', () => fadeTo(scene, 'hub'));
  scene.input.keyboard.once('keydown-M', () => fadeTo(scene, 'hub'));
}

class Garden extends Phaser.Scene {
  constructor() { super('garden'); }
  create() {
    this.cameras.main.fadeIn(530, 25, 30, 48);
    this.add.image(W / 2, H / 2, 'garden').setDisplaySize(W, H);
    this.hero = createHero(this, 390, 451);
    this.lumi = createLumi(this, 452, 332);
    this.hud = new Hud(this, '01  ·  화성 온실의 작은 정원');
    addMapReturn(this);
    this.dialogue = new Dialogue(this);
    this.prompt = createPrompt(this);
    this.keys = this.input.keyboard.addKeys('A,D,LEFT,RIGHT,E,ESC');
    this.keys.E.on('down', () => this.interact());
    this.keys.ESC.on('down', () => this.scene.start('title'));
    this.phase = 'intro'; this.busy = true;
    this.add.text(920, 348, '→', { fontFamily: 'serif', fontSize: '38px', color: '#ffe8c8' })
      .setOrigin(0.5).setAlpha(0.6);
    this.talk([
      say('어린왕자', '내 장미가 있는 별에서 달까지, 길은 얼마나 멀까?'),
      say('루미 · 훈련 안내 로봇', '길을 찾기 전에 작은 생명을 돌보는 연습부터 해요. 이곳은 미래의 화성 온실을 상상한 훈련 장면이에요.'),
      say('어린왕자', '그렇다면 이 장미에게 필요한 것부터 살펴볼게.'),
    ], () => this.setPhase('rose'));
  }
  setPhase(phase) {
    this.phase = phase;
    if (phase === 'exit') progress.garden = true;
    this.hud.setObjective({
      rose: '□  장미에게 물을 주자\n□  전력 상태를 확인하자',
      console: '✓  장미에게 물을 주었어\n□  전력 상태를 확인하자',
      exit: '✓  장미에게 물을 주었어\n✓  전력을 확인했어\n→  오른쪽 전망대로 가자',
    }[phase]);
  }
  talk(lines, done = () => {}) {
    this.busy = true; this.prompt.hide();
    this.dialogue.show(lines, () => { this.busy = false; done(); });
  }
  update(_time, delta) {
    if (!this.busy) walk(this, this.hero, this.keys, delta, 58, 905);
    this.lumi.x += (this.hero.x + 64 - this.lumi.x) * 0.025;
    if (this.busy) { this.prompt.hide(); return; }
    const targets = {
      rose: [657, 314, 95, 'E  물 주기'],
      console: [153, 344, 86, 'E  전력 점검'],
      exit: [870, 344, 76, 'E  전망대로'],
    };
    const t = targets[this.phase];
    if (t && Math.abs(this.hero.x - t[0]) < t[2]) this.prompt.show(t[0], t[1], t[3], () => this.interact());
    else this.prompt.hide();
  }
  interact() {
    if (this.busy) return;
    if (this.phase === 'rose' && Math.abs(this.hero.x - 657) < 95) this.waterRose();
    else if (this.phase === 'console' && Math.abs(this.hero.x - 153) < 86) this.powerCheck();
    else if (this.phase === 'exit' && this.hero.x > 794) {
      this.busy = true; progress.garden = true; fadeTo(this, 'hub');
    }
  }
  waterRose() {
    this.busy = true; this.prompt.hide();
    this.tweens.add({ targets: this.hero, angle: -7, duration: 240, yoyo: true });
    for (let i = 0; i < 17; i++) {
      const drop = this.add.circle(621 + Phaser.Math.Between(-12, 15), 345, Phaser.Math.Between(2, 4),
        0x9ad6df, 0.95).setDepth(15);
      this.tweens.add({ targets: drop, x: 645 + Phaser.Math.Between(-20, 25),
        y: 390 + Phaser.Math.Between(-12, 10), alpha: 0, duration: 480 + i * 25,
        delay: i * 55, onComplete: () => drop.destroy() });
    }
    this.time.delayedCall(1150, () => {
      this.hud.setResources('⚡  전력   안정\n◉  산소   안정\n◆  물      사용 중');
      this.talk([
        say('어린왕자', '물을 많이 붓는 것보다 꼭 필요한 만큼 주는 게 좋겠어.'),
        say('루미', '맞아요. 물과 전력을 아껴 쓰는 연습도 우주 임무의 일부예요. 왼쪽 장치를 확인해 볼까요?'),
      ], () => this.setPhase('console'));
    });
  }
  powerCheck() {
    this.busy = true; this.prompt.hide();
    choose(this, '전력이 부족하다는 알림이 떴어. 무엇을 먼저 확인할까?',
      ['전력 공급과 사용 상태를 확인한다', '산소 장치를 바로 꺼 버린다'], (answer) => {
        if (answer === 0) {
          this.hud.setResources('⚡  전력   점검 완료\n◉  산소   안정\n◆  물      절약 중');
          this.talk([
            say('루미', '좋은 판단이에요! 생명 유지 장치를 함부로 끄지 않고 공급과 사용 상태부터 살폈어요.'),
            say('어린왕자', '장미를 돌보듯 이곳의 모든 것을 살펴야 하는구나. 이제 달을 보러 가자.'),
          ], () => this.setPhase('exit'));
        } else {
          this.talk([say('루미', '산소 장치는 중요해요. 먼저 전력이 어디서 오고 어디에 쓰이는지 확인해 보자.')],
            () => this.powerCheck());
        }
      });
  }
}

class Observatory extends Phaser.Scene {
  constructor() { super('observatory'); }
  create() {
    this.cameras.main.fadeIn(530, 25, 30, 48);
    this.add.image(W / 2, H / 2, 'observatory').setDisplaySize(W, H);
    this.hero = createHero(this, 106, 454);
    this.lumi = createLumi(this, 164, 329);
    this.hud = new Hud(this, '02  ·  달을 바라보는 전망대');
    addMapReturn(this);
    this.hud.setObjective('□  망원경으로 달을 관찰하자');
    this.hud.resources.setVisible(false);
    this.dialogue = new Dialogue(this);
    this.prompt = createPrompt(this);
    this.keys = this.input.keyboard.addKeys('A,D,LEFT,RIGHT,E,ESC');
    this.keys.E.on('down', () => this.interact());
    this.keys.ESC.on('down', () => this.scene.start('title'));
    this.busy = true; this.phase = 'intro';
    this.talk([
      say('어린왕자', '달이 저기 보인다. 가까운 것 같으면서도 아주 멀어 보여.'),
      say('루미', '한 번 본 모습만으로 길을 정하지 말고, 달의 위치와 모양이 어떻게 달라지는지 관찰해 봐요.'),
    ], () => { this.phase = 'telescope'; });
  }
  talk(lines, done = () => {}) {
    this.busy = true; this.prompt.hide();
    this.dialogue.show(lines, () => { this.busy = false; done(); });
  }
  update(_time, delta) {
    if (!this.busy) walk(this, this.hero, this.keys, delta, 58, 874);
    this.lumi.x += (this.hero.x + 64 - this.lumi.x) * 0.025;
    if (!this.busy && this.phase === 'telescope' && Math.abs(this.hero.x - 777) < 96)
      this.prompt.show(774, 336, 'E  달 관찰', () => this.interact());
    else this.prompt.hide();
  }
  interact() {
    if (this.busy || this.phase !== 'telescope' || Math.abs(this.hero.x - 777) >= 96) return;
    this.busy = true; this.prompt.hide();
    choose(this, '달로 가는 길을 계획하려면 어떤 기록이 도움이 될까?',
      ['시간에 따른 달의 위치와 모양을 기록한다', '한 번 본 위치를 언제나 같다고 생각한다'], (answer) => {
        if (answer === 0) {
          this.hud.setObjective('✓  달을 관찰하고 기록했어');
          this.talk([
            say('루미', '잘했어요. 관찰하고 기록하는 것이 탐험의 첫걸음이에요.'),
            say('어린왕자', '달로 가는 길은 멀리 있는 줄 알았어. 하지만 장미를 돌보고 하늘을 살피는 작은 일에서 시작되는구나.'),
            say('루미', '오늘의 훈련은 여기까지. 다음 여정은 우리 함께 만들어 가요.'),
          ], () => fadeTo(this, 'ending'));
        } else this.talk([say('루미', '달은 시간에 따라 하늘에서 보이는 위치와 모습이 달라져요. 여러 번 관찰해 볼까요?')]);
      });
  }
}

class Ending extends Phaser.Scene {
  constructor() { super('ending'); }
  create() {
    this.cameras.main.fadeIn(850, 22, 29, 47);
    this.add.image(W / 2, H / 2, 'observatory').setDisplaySize(W, H);
    this.add.rectangle(W / 2, H / 2, W, H, 0x111a2d, 0.68);
    const glow = this.add.circle(813, 91, 42, 0xffdfad, 0.08);
    this.tweens.add({ targets: glow, scale: 1.5, alpha: 0.23, duration: 2400, yoyo: true, repeat: -1 });
    const titleStyle = { fontFamily: 'Georgia, serif', color: '#ffebcf' };
    this.add.text(W / 2, 177, 'THE WAY TO THE MOON', { ...titleStyle, fontSize: '44px' }).setOrigin(0.5);
    this.add.text(W / 2, 248, '첫 번째 길을 찾았습니다', { fontFamily: 'system-ui', fontSize: '26px',
      color: '#f8d7aa' }).setOrigin(0.5);
    this.add.text(W / 2, 298, '장미를 돌보고 · 전력을 살피고 · 달을 관찰했어요', {
      fontFamily: 'system-ui', fontSize: '19px', color: '#e1d7ce' }).setOrigin(0.5);
    const button = this.add.rectangle(W / 2, 383, 204, 54, 0xffe4bb, 0.94).setStrokeStyle(2, 0x8a6857)
      .setInteractive({ useHandCursor: true });
    this.add.text(W / 2, 383, '다시 시작', { fontFamily: 'system-ui', fontSize: '20px',
      color: '#4d3c38' }).setOrigin(0.5);
    button.on('pointerdown', () => this.scene.start('title'));
    this.input.keyboard.once('keydown-R', () => this.scene.start('title'));
    this.add.text(W / 2, 503, 'CHAPTER 01  ·  PLAYABLE PROTOTYPE', {
      fontFamily: 'serif', fontSize: '14px', color: '#d7bb9e' }).setOrigin(0.5);
  }
}

new Phaser.Game({ type: Phaser.AUTO, parent: 'game', width: W, height: H,
  backgroundColor: '#1b2432',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [Boot, Title, Hub, Garden, Observatory, Ending] });
