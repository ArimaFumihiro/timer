'use strict'

let countdownInterval; // setInterval の ID を保持
let totalSeconds = 600;
let countdownStartedByButton = false; // スタートボタンで開始されたかどうかのフラグ
let lastTickSecond = -1; // 前回「tick」を再生した秒数を記録
let playedTracks = [];
let currentTrackIndex = -1;
let riverOn = true;
let bardOn = true;
let bgmVolume = 0.2;
let riverVolume = 0.3;
let bardVolume = 0.2;
let fadingOut;

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
const toggleBgm = document.getElementById('toggle-bgm'); //SE切り替えボタンの要素を取得
const toggleRiver = document.getElementById('toggle-river'); //SE切り替えボタンの要素を取得
const toggleBard = document.getElementById('toggle-bard'); //SE切り替えボタンの要素を取得


//BGM
const bgmTracks = [
  './BGM/Cozy_break_time.mp3',
  './BGM/ix27m-not-feeling-well-today-230792.mp3',
  './BGM/jazz-at-dizzyx27s-303230.mp3',
  './BGM/Komorebi_Cafe.mp3',
  './BGM/sparkling-glasses-and-nocturnal-tunes-smooth-jazz-piano-314053.mp3',
  './BGM/un_cafe.mp3',
  './BGM/海辺のステップ.mp3',
  './BGM/路地裏の純喫茶.mp3',
  './BGM/Starlight_Cafe.mp3',
  './BGM/sensual-jazz.mp3',
  './BGM/lofi-chill-jazz.mp3',
  './BGM/lofi.mp3',
  './BGM/cafe-music.mp3',
];

//SE
const seAlarmTracks = {
  'buttonClick': './SE/button_click.mp3',
  'timerEnd': './SE/timer_end.mp3',
  'tick': './SE/tick.mp3' // 「ピッ」というSEのパス
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

  //BGMボタンの表示を変える
  toggleBgm.textContent = '■';
  toggleBgm.style.fontSize = '1.8vh';

  //ボリュームを調整して音楽を流す
  bgmElement.volume = bgmVolume;
  bgmElement.src = selectedTrack;
  bgmElement.play().catch(error => {
    console.error('BGM再生エラー:', error);
  });
  videoElement.loop = true;
  playedTracks.push(currentTrackIndex);

  if (playedTracks.length === bgmTracks.length) {
    playedTracks = []; // 全ての曲を再生したら履歴をリセット
  }
}

//森の音を再生する関数
function forestSounds(audioElement, toggle, vol) {
  if (toggle === true) {
    audioElement.volume = vol;
    audioElement.play().catch(error => console.error('BGM再生エラー:', error));
    audioElement.loop = true;
    videoElement.play();
  }
}

//BGMを再生する関数
function bgmSounds() {
  playRandomBGM(); // BGMをランダム再生
  forestSounds(seRiverElement, riverOn, riverVolume); //川の音をvolume0.3で再生
  forestSounds(seBardElement, bardOn, bardVolume); //鳥の音をvolume0.3で再生
}

const FADE_OUT_DURATION = 1500; // フェードアウトの時間 (ミリ秒)

//音をフェードアウトさせる関数
function fadeOutAudioElement(audioElement) {
  fadingOut = true;  
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
      fadingOut = null;
    }
  }, interval);
}

//音を止める関数
function stopAudioElementInternal(audioElement) {
  if (audioElement.id === bgmElement.id && !countdownInterval) {
    toggleBgm.textContent = '▶';
    toggleBgm.style.fontSize = '1.5vh';
    videoElement.pause();
    videoElement.loop = false;      
  } else if (audioElement.id === bgmElement.id) {
    toggleBgm.textContent = '▶';
    toggleBgm.style.fontSize = '1.5vh';
  }
  audioElement.pause();
  audioElement.currentTime = 0;
  audioElement.volume = 1;
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

//タイマーをスタートする関数==========================================================================================

function startCountdown() {
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
      clearInterval(countdownInterval);
      countdownStartedByButton = false; // フラグをリセット
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

//=================================================================================================================

//タイマー作動中を監視
const monitorInAction = () => countdownInterval ?  true : false;

//フェードアウト作動中を監視
const monitorInFading = () => fadingOut ?  true : false;


//カウントダウンを停止させる関数
function countdownStop() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
    countdownStartedByButton = false;
  }
}


//休憩時間をセットしてBGMを鳴らしタイマー実行する関数
function breakTime() {
  totalSeconds = 590; //休憩時間（秒）
  updateDisplay(); //ディスプレイにtotalSecondsを表示
  countdownStartedByButton = false; 
  startCountdown(); //カウントダウン実行
  bgmSounds() //BGM再生
}

//指定した時間をディスプレイに表示する関数
function fixedTime(e) {
  playSE('buttonClick');
  //音楽を止める
  fadeOutAudioElement(bgmElement);
  fadeOutAudioElement(seRiverElement);
  fadeOutAudioElement(seBardElement);

  // カウントダウンを停止する
  countdownStop()

  const value = e.target.dataset.value;
  totalSeconds = value;
  updateDisplay();
}


// 「指定時間」ボタンがクリックされたときの処理を実行する関数
minutesButton1.addEventListener('click', fixedTime);
minutesButton2.addEventListener('click', fixedTime);
minutesButton3.addEventListener('click', fixedTime);
minutesButton4.addEventListener('click', fixedTime);

//任意の数値をディスプレイにセットする関数
function timerSet() {
  //音楽を止める
  fadeOutAudioElement(bgmElement);
  fadeOutAudioElement(seRiverElement);
  fadeOutAudioElement(seBardElement);

  // カウントダウンを停止する
  countdownStop()

  const inputMinutes = setMinutesInput.value;

  if (!isNaN(inputMinutes) && inputMinutes >= 0) {
    totalSeconds = Math.floor(inputMinutes * 60);
    updateDisplay();
   
  } else {
    alert('有効な分数を入力してください。');
    setMinutesInput.value = '';
  }
}

// 「セット」ボタンがクリックされたときの処理を実行する関数
setButton.addEventListener('click', () => {
  playSE('buttonClick');
  timerSet();
});


// 「START」ボタンがクリックされたときの処理を実行する関数
startButton.addEventListener('click', () => {
  if (monitorInAction() === true || monitorInFading() === true) {
    return;
  }

  countdownStartedByButton = true; // スタートボタンで開始されたことを記録
  playSE('buttonClick');
  startCountdown();  
});

//　「休憩」ボタンがクリックされたときの処理を実行する関数
breakButton.addEventListener('click', () => {
  if (monitorInAction() === true || monitorInFading() === true) {
    return;
  } 
  playSE('buttonClick');
  breakTime();
});

// BGMの再生終了時に次の曲を再生するイベントリスナー
bgmElement.addEventListener('ended', playRandomBGM);

// ページ読み込み時に初期表示を 10:00 に設定
updateDisplay();

//▶ボタンでBGMを再生、停止する関数
toggleBgm.addEventListener('click', () => {
  playSE('buttonClick');
  videoElement.play();

  let icon = toggleBgm.textContent;
  if (icon === '▶') {
    bgmSounds()
    toggleBgm.textContent = '■';
    toggleBgm.style.fontSize = '1.8vh';
  } else {
    fadeOutAudioElement(bgmElement);
    fadeOutAudioElement(seRiverElement);
    fadeOutAudioElement(seBardElement);
  }
});

//川の音をON,OFF
toggleRiver.addEventListener('click', () => {
  playSE('buttonClick');
  riverOn = changeover(toggleRiver, riverOn, riverVolume, seRiverElement);
});
//鳥の音をON,OFF
toggleBard.addEventListener('click', () => {
  playSE('buttonClick');
  bardOn = changeover(toggleBard, bardOn, bardVolume, seBardElement);
});

//森の音をON,OFFする関数
function changeover(toggle, boolean, vol, audioElement) {
  boolean = !boolean; // ローカル変数 boolean を反転
  if (boolean === false) {
    toggle.textContent = 'off';
    fadeOutAudioElement(audioElement);  
  } else {
    toggle.textContent = 'on';
    toggle.style.fontSize = '1.5vh';
  }
  if (countdownInterval) {    
    forestSounds(audioElement, boolean, vol);
  }
  return boolean
}

//エンターキーでフルスクリーン
document.addEventListener(
  'keydown',
  (e) => {
    if (e.key === 'Enter') {
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


