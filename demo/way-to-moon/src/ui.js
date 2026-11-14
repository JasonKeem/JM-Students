const TEXT = { fontFamily: 'system-ui, sans-serif', color: '#fff0d8' };

export class Dialogue {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    const shade = scene.add.rectangle(480, 469, 924, 126, 0x17202b, 0.91)
      .setStrokeStyle(2, 0xcfae86).setInteractive({ useHandCursor: true });
    this.name = scene.add.text(46, 414, '', { ...TEXT, fontSize: '18px', color: '#f4c98a', fontStyle: 'bold' });
    this.body = scene.add.text(46, 447, '', { ...TEXT, fontSize: '21px', lineSpacing: 8,
      wordWrap: { width: 860, useAdvancedWrap: true } });
    this.hint = scene.add.text(907, 514, '클릭 / SPACE  ▸', { ...TEXT, fontSize: '14px', color: '#d9bd9c' }).setOrigin(1, 0.5);
    this.root = scene.add.container(0, 0, [shade, this.name, this.body, this.hint]).setDepth(100).setVisible(false);
    shade.on('pointerdown', () => this.advance());
    this.onKey = (event) => {
      if (event.code === 'Space' || event.code === 'Enter') {
        if (this.active) { event.preventDefault(); this.advance(); }
      }
    };
    scene.input.keyboard.on('keydown', this.onKey);
    scene.events.once('shutdown', () => scene.input.keyboard.off('keydown', this.onKey));
  }

  show(lines, done = () => {}) {
    this.lines = lines;
    this.index = 0;
    this.done = done;
    this.active = true;
    this.root.setVisible(true);
    this.drawLine();
  }

  drawLine() {
    this.timer?.remove();
    const line = this.lines[this.index];
    this.name.setText(line.who);
    this.body.setText('');
    this.characters = Array.from(line.text);
    this.position = 0;
    this.hint.setVisible(false);
    this.timer = this.scene.time.addEvent({ delay: 26, loop: true, callback: () => {
      this.position = Math.min(this.position + 1, this.characters.length);
      this.body.setText(this.characters.slice(0, this.position).join(''));
      if (this.position === this.characters.length) {
        this.timer.remove();
        this.hint.setVisible(true);
      }
    } });
  }

  advance() {
    if (!this.active) return;
    if (this.position < this.characters.length) {
      this.timer?.remove();
      this.position = this.characters.length;
      this.body.setText(this.characters.join(''));
      this.hint.setVisible(true);
      return;
    }
    if (++this.index < this.lines.length) { this.drawLine(); return; }
    this.active = false;
    this.root.setVisible(false);
    this.done();
  }
}

export function choose(scene, title, options, done) {
  const veil = scene.add.rectangle(480, 270, 960, 540, 0x111827, 0.66).setInteractive();
  const card = scene.add.rectangle(480, 270, 670, 277, 0x202b36, 0.98).setStrokeStyle(2, 0xe9bf88);
  const heading = scene.add.text(480, 170, title, { ...TEXT, fontSize: '22px', align: 'center',
    wordWrap: { width: 610 } }).setOrigin(0.5);
  const items = [veil, card, heading];
  let finished = false;
  const select = (index) => {
    if (finished) return;
    finished = true;
    scene.input.keyboard.off('keydown', onKey);
    root.destroy();
    done(index);
  };
  options.forEach((option, index) => {
    const y = 238 + index * 75;
    const box = scene.add.rectangle(480, y, 590, 58, 0x364252, 1)
      .setStrokeStyle(1, 0xa9bfbc).setInteractive({ useHandCursor: true });
    box.on('pointerover', () => box.setFillStyle(0x566575));
    box.on('pointerout', () => box.setFillStyle(0x364252));
    box.on('pointerdown', () => select(index));
    items.push(box, scene.add.text(480, y, `${index + 1}.  ${option}`, {
      ...TEXT, fontSize: '18px', wordWrap: { width: 555 }, align: 'center',
    }).setOrigin(0.5));
  });
  const root = scene.add.container(0, 0, items).setDepth(200);
  const onKey = (event) => {
    const n = Number(event.key) - 1;
    if (n >= 0 && n < options.length) select(n);
  };
  scene.input.keyboard.on('keydown', onKey);
  scene.events.once('shutdown', () => scene.input.keyboard.off('keydown', onKey));
}

export class Hud {
  constructor(scene, chapter) {
    this.scene = scene;
    const panel = scene.add.rectangle(173, 78, 310, 116, 0x19232b, 0.89).setStrokeStyle(1, 0xd7b488);
    this.chapter = scene.add.text(36, 27, chapter, { ...TEXT, fontSize: '18px', color: '#f2ce94', fontStyle: 'bold' });
    this.objective = scene.add.text(36, 61, '', { ...TEXT, fontSize: '17px', lineSpacing: 7,
      wordWrap: { width: 280 } });
    this.resources = scene.add.text(775, 30, '⚡  전력   안정\n◉  산소   안정\n◆  물      충분', {
      ...TEXT, fontSize: '16px', lineSpacing: 7, backgroundColor: '#19232be6', padding: { x: 14, y: 10 },
    });
    panel.setDepth(30); this.chapter.setDepth(31); this.objective.setDepth(31); this.resources.setDepth(31);
  }
  setObjective(text) { this.objective.setText(text); }
  setResources(text) { this.resources.setText(text); }
}
