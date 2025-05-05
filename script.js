'use strict'

let countdownInterval; // setInterval の ID を保持
let totalSeconds = 60;
let countdownStartedByButton = false; // スタートボタンで開始されたかどうかのフラグ
let lastTickSecond = -1; // 前回「tick」を再生した秒数を記録
let playedTracks = [];
let currentTrackIndex = -1;

const timerDisplay = document.getElementById('timer'); //タイマー表示ディスプレイ
const minutesButton1 = document.getElementById('minutes-button1'); //時間指定ボタン１
const minutesButton2 = document.getElementById('minutes-button2'); //時間指定ボタン２
const minutesButton3 = document.getElementById('minutes-button3'); //時間指定ボタン３
const minutesButton4 = document.getElementById('minutes-button4'); //時間指定ボタン４
const setMinutesInput = document.getElementById('set-minutes'); //時間選択
const setButton = document.getElementById('set-button'); //時間セットボタン
const startButton = document.getElementById('start-button'); //スタートボタン
const breakButton = document.getElementById('setBreak'); //休憩ボタン
const videoElement = document.getElementById('video'); //動画要素を取得
const bgmElement = document.getElementById('bgm'); // BGM要素を取得
const seElement = document.getElementById('se'); // SE鳥の要素を取得
const seRiverElement = document.getElementById('se_river'); // SE川の要素を取得
const seBardElement = document.getElementById('se_bard'); // SE鳥の要素を取得

//BGM
const bgmTracks = [
  './Cozy_break_time.mp3',
  './ix27m-not-feeling-well-today-230792.mp3',
  './jazz-at-dizzyx27s-303230.mp3',
  './Komorebi_Cafe.mp3',
  './sparkling-glasses-and-nocturnal-tunes-smooth-jazz-piano-314053.mp3',
  './un_cafe.mp3',
  './海辺のステップ.mp3',
  './路地裏の純喫茶.mp3'
];

//SE
const seAlarmTracks = {
  'buttonClick': './button_click.mp3',
  'timerEnd': './timer_end.mp3',
  'tick': './tick.mp3' // 「ピッ」というSEのパス
};

//SEを鳴らす関数
function playSE(seName) {
  if (seAlarmTracks[seName]) {
    seElement.src = seAlarmTracks[seName];
    seElement.play().catch(error => {
      console.error('SE再生エラー:', error);
    });
  } else {
    console.warn(`SE "${seName}" は定義されていません。`);
  }
}

//BGMをランダム再生する関数
function playRandomBGM() {
  if (bgmTracks.length === 0) {
    return; // 再生する曲がない場合
  }

  let randomIndex;
  do {
    randomIndex = Math.floor(Math.random() * bgmTracks.length);
  } while (randomIndex === currentTrackIndex && playedTracks.length < bgmTracks.length);

  currentTrackIndex = randomIndex;
  const selectedTrack = bgmTracks[currentTrackIndex];

  bgmElement.volume = 0.2;
  bgmElement.src = selectedTrack;
  bgmElement.play().catch(error => {
    console.error('BGM再生エラー:', error);
  });

  playedTracks.push(currentTrackIndex);

  if (playedTracks.length === bgmTracks.length) {
    playedTracks = []; // 全ての曲を再生したら履歴をリセット
  }
}

const FADE_OUT_DURATION = 2000; // フェードアウトの時間 (ミリ秒)

//音をフェードアウトさせる関数
function fadeOutAudioElement(audioElement) {
  let volume = audioElement.volume;
  const interval = 50; // 音量を下げる間隔 (ミリ秒)
  const step = volume / (FADE_OUT_DURATION / interval);

  const fadeOutInterval = setInterval(() => {
    if (volume > 0) {
      volume -= step;
      audioElement.volume = Math.max(0, volume);
    } else {
      clearInterval(fadeOutInterval);
      stopAudioElementInternal(audioElement);
    }
  }, interval);
}

//音を止める関数
function stopAudioElementInternal(audioElement) {
  audioElement.pause();
  audioElement.currentTime = 0;
  audioElement.volume = 1;
}


function timerSet() {
  // カウントダウンが動作中の場合は停止する
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
    countdownStartedByButton = false;
    videoElement.pause();
    videoElement.loop = false;
  }

  const inputMinutes = setMinutesInput.value;

  if (!isNaN(inputMinutes) && inputMinutes >= 0) {
    totalSeconds = inputMinutes * 60;
    updateDisplay();
    fadeOutAudioElement(bgmElement);
    fadeOutAudioElement(seRiverElement);
    fadeOutAudioElement(seBardElement);
  } else {
    alert('有効な分数を入力してください。');
    setMinutesInput.value = '';
  }
}

//ディスプレイ表示を変更する関数
function updateDisplay() {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');
  timerDisplay.textContent = `${formattedMinutes}:${formattedSeconds}`;
  if (minutes === 0 && seconds <= 10) {
    timerDisplay.classList.add('almost-over');
  } else {
    timerDisplay.classList.remove('almost-over');
  }
}

//タイマーをスタートする関数
function startCountdown() {
  // すでにタイマーが動いている場合は何もしない
  if (countdownInterval) {
    return;
  }

  // タイマー開始時に動画をループ再生開始
  videoElement.loop = true;
  videoElement.play();

  countdownInterval = setInterval(() => {
    if (totalSeconds <= 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;
      timerDisplay.textContent = '00:00';
      console.log('タイマー終了！');
      if (countdownStartedByButton) { // スタートボタンで開始された場合のみ終了SEを再生
        playSE('timerEnd');
      }
      // タイマー終了時の処理
      fadeOutAudioElement(bgmElement);
      fadeOutAudioElement(seRiverElement);
      fadeOutAudioElement(seBardElement);
      countdownStartedByButton = false; // フラグをリセット
      videoElement.pause();
      videoElement.loop = false;
    } else {
      if (countdownStartedByButton && totalSeconds <= 11 && totalSeconds > 1 && totalSeconds !== lastTickSecond) {
        playSE('tick');
        lastTickSecond = totalSeconds; // 再生した秒数を記録
      }
      totalSeconds--;
      updateDisplay();
    }
  }, 1000);
}

//休憩時間をセットする
function breakTime() {
  // すでにタイマーが動いている場合は何もしない
  if (countdownInterval) {
    return;
  }
  
  totalSeconds = 590;
  updateDisplay();
  countdownStartedByButton = false;
  startCountdown();
  playRandomBGM(); // 休憩時間開始時にBGMを再生

  // 川の音をループ再生開始
  seRiverElement.play().catch(error => {
    console.error('BGM再生エラー:', error);
  });
  seRiverElement.volume = 0.3;
  seRiverElement.loop = true;

  // 鳥の音をループ再生開始
  seBardElement.play().catch(error => {
    console.error('BGM再生エラー:', error);
  });
  seBardElement.volume = 0.3;
  seBardElement.loop = true;
}

function fixedTime(e) {
  playSE('buttonClick');
  // カウントダウンが動作中の場合は停止する
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
    countdownStartedByButton = false;
    videoElement.pause();
     videoElement.loop = false;
  }
  const value = e.target.dataset.value;
  totalSeconds = value;
  updateDisplay();
  fadeOutAudioElement(bgmElement);
  fadeOutAudioElement(seRiverElement);
  fadeOutAudioElement(seBardElement);
}


// 「指定時間」ボタンがクリックされたときの処理
minutesButton1.addEventListener('click', fixedTime);
minutesButton2.addEventListener('click', fixedTime);
minutesButton3.addEventListener('click', fixedTime);
minutesButton4.addEventListener('click', fixedTime);

// 「セット」ボタンがクリックされたときの処理
setButton.addEventListener('click', () => {
  playSE('buttonClick');
  timerSet();
});

// 「START」ボタンがクリックされたときの処理
startButton.addEventListener('click', () => {
  countdownStartedByButton = true; // スタートボタンで開始されたことを記録
  playSE('buttonClick');
  startCountdown();  
});

//　「休憩」ボタンがクリックされたときの処理
breakButton.addEventListener('click', () => {
  playSE('buttonClick');
  breakTime();
});

// BGMの再生終了時に次の曲を再生するイベントリスナー
bgmElement.addEventListener('ended', playRandomBGM);

// ページ読み込み時に初期表示を 00:00 に設定
updateDisplay();


//フルスクリーン
document.addEventListener(
  "keydown",
  (e) => {
    if (e.key === "Enter") {
      toggleFullScreen();
    }
  },
  false,
);

function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
  }
}
