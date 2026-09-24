# My Hardware · Compute Capability Registry

一個不依賴框架的 GitHub Pages 硬體清冊。頁面把「仍擁有的設備」與「真正可投入工作的算力」分開呈現。

## 資料邊界

- Active compute pool：EVO-T1／RTX 5080、Ryzen 7 3700X／RTX 3060。
- Transferred：保留規格紀錄，但不納入工作排程或容量估算。
- Excluded：因散熱等限制排除於工作池。
- Supporting：顯示器、輸入、音訊與供電設備，不視為運算節點。

`data.json` 是公開頁面的資料來源；更新設備後，必須同步修正 `last_updated`、`status`、`schedulable` 與工作角色。

## 本機驗證

```powershell
npm.cmd test
npm.cmd run serve
```

預覽位址為 `http://127.0.0.1:4173/`。網站本身仍是純靜態檔案，`package.json` 只提供零相依的測試與預覽指令。

## 檔案

- `index.html`：語意化頁面結構與 SEO metadata。
- `styles.css`：共用視覺 tokens、桌機與手機版面。
- `app.js`：安全載入並渲染 `data.json`，不使用 `innerHTML`。
- `tests/site.test.mjs`：狀態真實性、資產完整性與 accessibility contract。

這是定期檢視的 hardware snapshot，不宣稱即時同步。商品圖片的來源與使用授權應另行維護。
