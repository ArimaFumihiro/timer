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

// 各オーディオ要素のフェードアウトInterval IDを保持する変数
let bgmFadeInterval = null;
let seRiverFadeInterval = null;
let seBardFadeInterval = null;

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
const toggleBgm = document.getElementById('toggle-bgm'); // BGM切り替えボタン
const toggleRiver = document.getElementById('toggle-river'); // 川の音切り替えボタン
const toggleBard = document.getElementById('toggle-bard'); // 鳥の音切り替えボタン

//BGMトラックリスト
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

//SEの効果音リスト
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

  // === BGMのフェードアウトが進行中ならキャンセル ===
 if (bgmFadeInterval !== null) {
    clearInterval(bgmFadeInterval); // フェードアウトを停止
    bgmFadeInterval = null; // IDをクリア
  }

  let randomIndex;
  do {
    randomIndex = Math.floor(Math.random() * bgmTracks.length);
  } while (randomIndex === currentTrackIndex && playedTracks.length < bgmTracks.length);

  currentTrackIndex = randomIndex;
  const selectedTrack = bgmTracks[currentTrackIndex];
 
  //ボリュームを調整して音楽を流す
  bgmElement.src = selectedTrack;
  bgmElement.volume = bgmVolume; // ボリュームを設定
  bgmElement.play().catch(error => {
    console.error('BGM再生エラー:', error);
  });

  // 再生履歴を更新
  playedTracks.push(currentTrackIndex);
  if (playedTracks.length === bgmTracks.length) {
    playedTracks = []; // 全ての曲を再生したら履歴をリセット
  }
  
  //BGMボタンの表示を変える
  toggleBgm.textContent = '■';
  toggleBgm.style.fontSize = '1.8vh';  
  videoElement.loop = true;
  videoElement.play();
}

//森の音（環境音SE）を再生/停止する関数
function forestSounds(audioElement, toggle, vol) {
  // === SEのフェードアウトが進行中ならキャンセル ===
  let seFadeInterval = null;
  if (audioElement.id === seRiverElement.id) {
    seFadeInterval = seRiverFadeInterval;
  } else if (audioElement.id === seBardElement.id) {
    seFadeInterval = seBardFadeInterval;
  }

  if (seFadeInterval !== null) {
    clearInterval(seFadeInterval); // フェードアウトを停止
    // 対応するグローバル変数をnullに
    if (audioElement.id === seRiverElement.id) {
      seRiverFadeInterval = null;
    } else if (audioElement.id === seBardElement.id) {
      seBardFadeInterval = null;
    }
    
    audioElement.volume = vol; // 元のボリュームに戻す
    audioElement.pause();
    audioElement.currentTime = 0;
  }

  // === toggle の状態に基づいて再生/停止を判断 ===
  if (toggle === true) { // ONの場合
    // ボリュームを設定して再生開始
    audioElement.volume = vol; // ボリューム設定
    // 再生開始
    audioElement.play().catch(error => console.error('BGM再生エラー:', error));
    audioElement.loop = true; // ループ再生設定
  } else { // OFFの場合
    // toggleがfalseの場合、SEを停止する処理
    audioElement.pause();
    audioElement.currentTime = 0;
    audioElement.volume = vol; // 元のボリュームに戻す
  }
}

//BGMと環境音SEを再生する関数
function bgmSounds() {
  playRandomBGM(); // BGMをランダム再生
  forestSounds(seRiverElement, riverOn, riverVolume); //川の音を設定したvolumeで再生
  forestSounds(seBardElement, bardOn, bardVolume); //鳥の音を設定したvolumeで再生
  videoElement.play();
}

//全ての音をフェードアウトさせる関数
function allFadeOut() {
  fadeOutAudioElement(bgmElement);
  fadeOutAudioElement(seRiverElement);
  fadeOutAudioElement(seBardElement);
}

const FADE_OUT_DURATION = 1500; // フェードアウトの時間 (ミリ秒)

//音をフェードアウトさせる関数
function fadeOutAudioElement(audioElement) {
  // 新しいフェードアウトを開始する前に、そのオーディオ要素に既存のフェードアウトがあれば停止する
  if (audioElement.id === bgmElement.id && bgmFadeInterval) {
      clearInterval(bgmFadeInterval);
      bgmFadeInterval = null; // IDをクリア
  } else if (audioElement.id === seRiverElement.id && seRiverFadeInterval) {
      clearInterval(seRiverFadeInterval);
      seRiverFadeInterval = null; // IDをクリア
  } else if (audioElement.id === seBardElement.id && seBardFadeInterval) {
      clearInterval(seBardFadeInterval);
      seBardFadeInterval = null; // IDをクリア
  }
   
  let volume = audioElement.volume;
  if (volume <= 0) {
    stopAudioElementInternal(audioElement); // すでに無音なら停止後処理だけ行う
    return; // フェードアウト処理は行わない
  }

  const interval = 100; // 音量を下げる間隔 (ミリ秒)
  const step =Math.max(0.001, volume / (FADE_OUT_DURATION / interval));

  // フェードアウト処理を行うsetIntervalを設定
  const fadeOutInterval = setInterval(() => {
    if (volume > step) {
      volume -= step;
      audioElement.volume = volume;
    } else {
      audioElement.volume = 0; // 最後にきっちり0にする
      clearInterval(fadeOutInterval); // このフェードアウトのタイマーを停止

      // 対応するグローバルなInterval ID変数をnullに設定
      if (audioElement.id === bgmElement.id) {
        bgmFadeInterval = null;
      } else if (audioElement.id === seRiverElement.id) {
        seRiverFadeInterval = null;
      } else if (audioElement.id === seBardElement.id) {
        seBardFadeInterval = null;
      }

      stopAudioElementInternal(audioElement);
    }
  }, interval);

  if (audioElement.id === bgmElement.id) {
    bgmFadeInterval = fadeOutInterval;
  } else if (audioElement.id === seRiverElement.id) {
    seRiverFadeInterval = fadeOutInterval;
  } else if (audioElement.id === seBardElement.id) {
    seBardFadeInterval = fadeOutInterval;
  }
}

//フェードアウト後の処理をする関数
function stopAudioElementInternal(audioElement) {
  if (audioElement.id === bgmElement.id) {
    toggleBgm.textContent = '▶';
    toggleBgm.style.fontSize = '1.5vh';
    // 動画停止・ループ解除はカウントダウン中でない場合のみ行う
    if (!countdownInterval) {
      videoElement.pause();
      videoElement.loop = false;      
    }
  }
  // 共通の停止・リセット処理
  audioElement.pause(); // 音声を一時停止
  audioElement.currentTime = 0; // 再生位置を最初に戻す
  // === ボリュームを初期設定値に戻す ===
  if (audioElement.id === bgmElement.id) {
    audioElement.volume = bgmVolume;
  } else if (audioElement.id === seRiverElement.id) {
    audioElement.volume = riverVolume;
  } else if (audioElement.id === seBardElement.id) {
    audioElement.volume = bardVolume;
  } else {
    // その他要素の場合はデフォルトの1に戻すなど
    audioElement.volume = 1;
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

      // タイマー終了時の処理
      allFadeOut(); //音楽を止める
      clearInterval(countdownInterval);
      countdownStartedByButton = false; // フラグをリセット
      totalSeconds = 600;
      setTimeout(updateDisplay, 1000);
    } else {
      //0の表示と同時にアラームを鳴らす
      if (countdownStartedByButton && totalSeconds <= 1) {
        playSE('timerEnd');
      } else {
        if (countdownStartedByButton && totalSeconds <= 11 && totalSeconds > 1 && totalSeconds !== lastTickSecond) {
          playSE('tick');
          lastTickSecond = totalSeconds; // 再生した秒数を記録
        }
      }
      totalSeconds--; // 秒数を減らす
      updateDisplay(); // ディスプレイを更新
    }
  }, 1000);
}

//=================================================================================================================


//フェードアウトを停止する関数
function fadeOutStop() {
  if (bgmFadeInterval) {
    clearInterval(bgmFadeInterval); // 停止！
    bgmFadeInterval = null; // IDをクリア
    // === 強制停止後のリセット処理 ===
    bgmElement.volume = bgmVolume; // ボリュームを初期値に戻す
    bgmElement.pause(); // 停止
    bgmElement.currentTime = 0; // 再生位置をリセット
    // === リセット処理ここまで ===
  }
  // 効果音などのフェードアウトを停止
  if (seRiverFadeInterval) {
    clearInterval(seRiverFadeInterval); // 停止！
    seRiverFadeInterval = null; // IDをクリア
    // === 強制停止後のリセット処理 ===
    seRiverElement.volume = riverVolume; // ボリュームを初期値に戻す
    seRiverElement.pause(); // 停止
    seRiverElement.currentTime = 0; // 再生位置をリセット
    // === リセット処理ここまで ===
  }
  if (seBardFadeInterval) {
    clearInterval(seBardFadeInterval); // 停止！
    seBardFadeInterval = null; // IDをクリア
    // === 強制停止後のリセット処理 ===
    seBardElement.volume = bardVolume; // ボリュームを初期値に戻す
    seBardElement.pause(); // 停止
    seBardElement.currentTime = 0; // 再生位置をリセット
    // === リセット処理ここまで ===
  }
}

// 「START」ボタンがクリックされたときの処理を実行する関数
startButton.addEventListener('click', () => {
  //カウントダウン実行されていたら何もしない
  if (countdownInterval) {
    return;
  }

  // タイマー開始前に、全てのフェードアウトを強制停止
  if (bgmFadeInterval !== null || seRiverFadeInterval !== null || seBardFadeInterval !== null) {
    fadeOutStop(); // フェードアウト停止関数を呼び出し
  }

  // カウントダウン開始
  countdownStartedByButton = true; // スタートボタンで開始されたことを記録
  playSE('buttonClick'); // ボタンクリック音を鳴らす
  startCountdown(); // タイマーと動画のみ開始 
});

//カウントダウンを停止させる関数
function countdownStop() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
    countdownStartedByButton = false;
    videoElement.pause();
    videoElement.loop = false;
  }
}

//　「休憩」ボタンがクリックされたときの処理を実行する関数
breakButton.addEventListener('click', () => {
   //カウントダウン実行されていたら何もしない
  if (countdownInterval) {
    return;
  }

  // タイマー開始前に、全てのフェードアウトを強制停止
  if (bgmFadeInterval !== null || seRiverFadeInterval !== null || seBardFadeInterval !== null) {
    fadeOutStop(); // フェードアウト停止関数を呼び出し
  }

  playSE('buttonClick');
  breakTime(); // 休憩時間のセットと開始
});

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
  // カウントダウンを停止する
  countdownStop();
  //SEを鳴らす
  playSE('buttonClick');
  //音楽を止める
  allFadeOut(); // 全てフェードアウト

  const value = e.target.dataset.value;
  totalSeconds = parseInt(value, 10);
  updateDisplay();
}

// 「指定時間」ボタンがクリックされたときの処理を実行する関数
minutesButton1.addEventListener('click', fixedTime);
minutesButton2.addEventListener('click', fixedTime);
minutesButton3.addEventListener('click', fixedTime);
minutesButton4.addEventListener('click', fixedTime);

//任意の数値をディスプレイにセットする関数
function timerSet() {  
  // カウントダウンを停止する
  countdownStop();

  //音楽を止める
  allFadeOut();

  const inputMinutes = setMinutesInput.value;

  if (!isNaN(inputMinutes) && inputMinutes >= 0) {
    totalSeconds = Math.floor(inputMinutes * 60);
    updateDisplay();
    setMinutesInput.value = ''; // セット後入力欄をクリア   
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
    bgmSounds(); // BGMと全SEを再生
  } else {
    //音楽を止める
    allFadeOut(); // BGMと全SEをフェードアウト
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

//環境音SEをON,OFFする関数
function changeover(toggle, boolean, vol, audioElement) {
 let seFadeInterval = null;
 if (audioElement.id === seRiverElement.id) {
  seFadeInterval = seRiverFadeInterval;
 } else if (audioElement.id === seBardElement.id) {
  seFadeInterval = seBardFadeInterval;
 }

 if (seFadeInterval !== null) {
    clearInterval(seFadeInterval); // フェードアウトを停止
    // 対応するグローバル変数をnullに
    if (audioElement.id === seRiverElement.id) {
    seRiverFadeInterval = null;
    } else if (audioElement.id === seBardElement.id) {
    seBardFadeInterval = null;
    }
    // 強制停止されたら、ボリュームをON時の初期値に戻し、一旦停止する
    audioElement.volume = vol; // 元のボリュームに戻す
    audioElement.pause();
    audioElement.currentTime = 0;
  }

  boolean = !boolean; // ON/OFF状態を反転

  if (boolean === false) {
    toggle.textContent = 'off';
    toggle.style.fontSize = '1.5vh';

    // フェードアウト関数を呼び出す
    fadeOutAudioElement(audioElement);  
  } else {
    toggle.textContent = 'on';
    toggle.style.fontSize = '1.5vh';

    forestSounds(audioElement, boolean, vol);
  }
  
  return boolean;
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
