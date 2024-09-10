import BLOCKS from "./blocks.js";

// DOM
const playground = document.querySelector(".playground > ul");
const gameText = document.querySelector(".game-text");
const scoreDisplay = document.querySelector(".score");
const restartButton = document.querySelector(".game-text > button");

// Setting
const GAME_ROWS = 20; // 게임 필드의 행(세로) 개수
const GAME_COLS = 10; // 게임 필드의 열(가로) 개수

let score = 0; // 게임 점수를 저장하는 변수
let duration = 500; // 블록이 떨어지는 속도(500ms)
let downInterval; // 블록이 자동으로 내려오는 인터벌을 저장하는 변수
let tempMovingItem; // 현재 움직이고 있는 블록의 상태를 저장하는 임시 객체
let level = 1; // 현재 레벨
let lines = 0; // 지운 라인 수

const movingItem = {
  // 현재 움직이고 있는 블록의 상태를 저장하는 객체
  type: "", // 블록의 모양 (예: "tree" 블록)
  direction: 0, // 블록의 현재 회전 방향 (0은 기본 상태)
  top: 0, // 블록의 현재 세로 위치 (위에서 몇 번째 행에 있는지)
  left: 3, // 블록의 현재 가로 위치 (왼쪽에서 몇 번째 열에 있는지)
};

init(); // 게임 초기화를 위한 함수 호출

// functions
function init() {
  tempMovingItem = {
    ...movingItem,
  };
  // tempMovingItem에 현재 블록 상태를 복사해 저장합니다. (스프레드 문법을 사용해 참조가 아닌 복사를 수행)
  for (let i = 0; i < GAME_ROWS; i++) {
    prependNewLine(); // 게임 필드의 각 행을 생성합니다.
  }
  generateNewBlock(); // 현재 블록을 게임 필드에 렌더링합니다.
}

function prependNewLine() {
  // 새로운 행을 게임 필드에 추가하는 함수

  const li = document.createElement("li"); // 새로운 li 요소(한 행)를 생성합니다.
  const ul = document.createElement("ul"); // 그 행에 들어갈 열을 담을 ul 요소를 생성합니다.

  for (let j = 0; j < GAME_COLS; j++) {
    // 각 열을 생성합니다. (총 10개의 열이 한 행에 들어가게 됩니다)
    const matrix = document.createElement("li");
    // 각 셀(게임 블록을 나타낼 빈 칸)로 사용할 li 요소를 생성합니다.
    ul.prepend(matrix); // 열을 ul 요소에 추가합니다.
  }

  li.prepend(ul); // 생성된 ul(한 행)을 li에 추가합니다.
  playground.prepend(li); // 생성된 행을 게임 필드(playground)에 추가합니다.
}

function renderBlocks(moveType = "") {
  // 현재 움직이고 있는 블록을 화면에 렌더링하는 함수

  const { type, direction, top, left } = tempMovingItem;
  // tempMovingItem 객체에서 블록의 모양, 방향, 위치 정보를 추출합니다.

  const movingBlocks = document.querySelectorAll(".moving");
  // 현재 "moving" 클래스를 가진 모든 블록(움직이고 있는 블록)을 선택합니다.

  movingBlocks.forEach((moving) => {
    // 선택한 모든 블록에 대해
    moving.classList.remove(type, "moving");
    // 해당 블록의 "type"(모양)과 "moving" 클래스를 제거하여 기존 블록을 지웁니다.
  });

  // forech 문은 중간에 중지 못해서 some 사용
  BLOCKS[type][direction].some((block) => {
    // 현재 블록의 모양과 방향에 따른 좌표 배열을 순회합니다.
    const x = block[0] + left; // 블록의 가로 위치 (좌표에 현재 블록의 left 위치를 더함)
    const y = block[1] + top; // 블록의 세로 위치 (좌표에 현재 블록의 top 위치를 더함)
    // const target = playground.childNodes[y].childNodes[0].childNodes[x];
    const target = playground.childNodes[y]
      ? playground.childNodes[y].childNodes[0].childNodes[x]
      : null;
    const isAvailable = checkEmpty(target);
    if (isAvailable) {
      // 블록이 위치할 타겟 셀을 선택합니다. (좌표에 맞는 셀을 선택)
      target.classList.add(type, "moving");
      // 해당 셀에 블록의 모양(type)과 "moving" 클래스를 추가하여 화면에 나타냅니다.
    } else {
      // 타겟이 유효하지 않으면 (범위를 벗어났거나) 이동을 취소하고 원래 상태로 되돌립니다.
      tempMovingItem = { ...movingItem };
      if (moveType === "retry") {
        showGameoverText();
      }
      setTimeout(() => {
        clearInterval(downInterval);
        renderBlocks("retry");
        if (moveType === "top") {
          seizeBlock();
        }
        // 0ms 지연 후 다시 블록을 렌더링합니다. (이는 재귀적으로 계속 렌더링을 시도)
      }, 0);
      return true;
    }
  });
  movingItem.left = left;
  movingItem.top = top;
  movingItem.direction = direction;
}

function seizeBlock() {
  const movingBlocks = document.querySelectorAll(".moving");
  movingBlocks.forEach((moving) => {
    moving.classList.remove("moving");
    moving.classList.add("seized");
  });
  checkMatch();
}

function checkMatch() {
  const childNodes = playground.childNodes;
  let linesCleared = 0; // 한 번에 몇 줄을 지웠는지 기록

  childNodes.forEach((child) => {
    let matched = true;
    child.children[0].childNodes.forEach((li) => {
      if (!li.classList.contains("seized")) {
        matched = false;
      }
    });

    if (matched) {
      child.remove(); // 줄을 제거
      prependNewLine();
      linesCleared++; // 한 줄 지울 때마다 카운트 증가
      score += 100; // 점수는 한 줄당 100점 추가
      lines++; // 지운 라인 수 증가
      scoreDisplay.innerText = score; // 점수 업데이트
      document.querySelector(".lines").innerText = lines; // 라인 업데이트
    }
  });

  // 레벨 시스템: 10줄 지울 때마다 레벨이 1씩 상승
  if (lines >= level * 10) {
    level++;
    document.querySelector(".level").innerText = level; // 레벨 업데이트
    duration -= 50; // 레벨이 올라갈 때마다 블록이 떨어지는 속도가 빨라짐
  }

  generateNewBlock(); // 새 블록을 생성합니다.
}

function generateNewBlock() {
  clearInterval(downInterval);
  downInterval = setInterval(() => {
    moveBlock("top", 1);
  }, duration);

  // BLOCKS 는 Object 이기 떄문에 반복문을 돌리기 위해서 entries 사용
  const blockArray = Object.entries(BLOCKS);
  const randomIndex = Math.floor(Math.random() * blockArray.length);
  movingItem.type = blockArray[randomIndex][0];
  movingItem.top = 0;
  movingItem.left = 3;
  movingItem.direction = 0;
  tempMovingItem = {
    ...movingItem,
  };
  renderBlocks();
}

function checkEmpty(target) {
  if (!target || target.classList.contains("seized")) {
    return false;
  }
  return true;
}

function moveBlock(moveType, amount) {
  // 블록을 좌우 또는 아래로 이동시키는 함수
  tempMovingItem[moveType] += amount;
  // moveType (left 또는 top)에 따라 amount만큼 위치를 변경합니다.
  renderBlocks(moveType);
  // 변경된 위치에 따라 다시 블록을 렌더링합니다.
}

function changeDirction() {
  const direction = tempMovingItem.direction;
  direction === 3
    ? (tempMovingItem.direction = 0)
    : (tempMovingItem.direction += 1);
  renderBlocks();
}

function dropBlock() {
  clearInterval(downInterval);
  downInterval = setInterval(() => {
    moveBlock("top", 1);
  }, 8);
}

function showGameoverText() {
  gameText.style.display = "flex";
}

// event handling
document.addEventListener("keydown", (e) => {
  // 키보드가 눌렸을 때 발생하는 이벤트를 처리하는 함수

  switch (e.keyCode) {
    case 39:
      // 오른쪽 화살표 키가 눌리면 블록을 오른쪽으로 한 칸 이동
      moveBlock("left", 1);
      break;
    case 37:
      // 왼쪽 화살표 키가 눌리면 블록을 왼쪽으로 한 칸 이동
      moveBlock("left", -1);
      break;
    case 40:
      // 아래쪽 화살표 키가 눌리면 블록을 아래로 한 칸 이동
      moveBlock("top", 1);
      break;
    case 38:
      changeDirction();
      break;
    case 32:
      dropBlock();
      break;
    default:
      // 그 외의 키는 아무 동작도 하지 않음
      break;
  }
});

restartButton.addEventListener("click", () => {
  playground.innerHTML = "";
  gameText.style.display = "none";
  init();
});
