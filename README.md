# Arduino BOT

## 目標

* 以跟Messenger BOT對話的方式，達成操控Arduino家裡元件，或者從感應器取回所需的資料之功能

## 架構

Arduino <-> arduinoConnector.js <-> messenger BOT server <-> Messenger

## arduinoConnector.js

1. 使用Firmata （over TCP）來和Arduino連線，以達成控制和讀取數據的功能
2. 使用 [socket.IO](http://socket.io/) 與 messenger BOT server 連線以通訊

## messenger BOT server

1. 為一 socket.IO server，可讓各處的arduinoConnector.js 連上與messenger的指令互動
2. 用來嚮應，認證，接收訊息與各種來自於messenger的webhook，為一中繼站。

## Tutorial

### Arduino Connector

1. 先照著[這裡](https://github.com/pofat/firmataOverTCP)的說明進行設定，進行到將修改後的StandarFirmata燒錄完成的步驟即可。
2. 上述的動作中將Arduino的serial port設為送至linux，再透過 linux上的 ser2net 轉送至socket。
3. 將專案裡的arduinoServer下載至你的電腦
4. 進入路徑，先`npm install`安裝相關套件
5. 將arduinoConnector.js裡的`SOCKET.IO_SERVER_URL` 更改為你BOT server的URL(下一個步驟會做到），再將 `YOUR_ARDUINO_IP` 更改為 Arduino的IP
6. 最後以`node arduinoConnector.js` 執行，成功的話你會看到以下log
```
connected to server!
Connected to Socket.IO server
firmata over TCP is ready
...
johnny-five is ready
```
### Messenger BOT server

1. 你先需先建立一個粉絲頁，和將FB帳號註冊為開發者帳號
2. 再照著[這裡](https://developers.facebook.com/docs/messenger-platform/quickstart)的步驟進行設定和認證
3. `botServer`裡提供了一個 Messenger BOT的範例，你需要將`index.js`裡的`YOUR_FAN_PAGE_TOKEN` 替換成你的粉絲頁token
4. 你必需將這 server deploy在 **https** 的環境下，才能和messenger 互通，在此建議可使用[heroku](https://dashboard.heroku.com/)的服務。

### 操作

1. 以上皆完成後，可以在你的粉絲頁輸入「開燈」，「關燈」，「弄點氣氛吧」與「現在的溫溼度如何？」試試看吧！

## 聯絡我

* 若各位對這個專案有什麼問題或建議，歡迎發PR或[email](mailto:tjazzter@gmail.com)給我。
