# Junior Astronaut Mission Trainer

NASA Space Apps Challenge 팀의 Phaser 4 게임 시작점입니다. 현재 화면은 **프로토타입**으로, Nova를 이동시키고 세 훈련 장치를 점검할 수 있습니다. Nova 캐릭터 그림을 적용했으며, 실제 임무 데이터는 아직 적용하지 않았습니다.

## Codespaces에서 실행

1. 저장소의 **Code → Codespaces → Create codespace on main**을 선택합니다.
2. 터미널에서 아래 명령을 실행합니다.

   ```bash
   npm ci
   npm run dev
   ```

3. 나타나는 **포트 5173** 알림에서 **Open in Browser**를 선택합니다. 알림이 없다면 **Ports** 탭에서 5173 포트를 엽니다.

## 조작

- 방향키 또는 WASD: 이동
- E: 가까운 장치 점검
- R: 훈련 다시 시작

## 개발

```bash
npm run build
```

`src/main.js`에 게임 장면과 상호작용이 있습니다. `src/style.css`에 화면 바깥의 스타일이 있습니다. 배포하거나 NASA 데이터를 표시할 때는 출처와 사용한 데이터의 의미를 별도로 명시합니다.
