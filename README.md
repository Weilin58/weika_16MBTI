# 高維度整合人格量表

這個專案是以 [Vite](https://vite.dev/) + TypeScript 建立的單頁式應用程式。下方整理了常見的疑問與部署方式。

## 為什麼直接打開 `index.html` 會是空白頁？

專案的 `index.html` 會透過 ES Module 動態載入 `dist/assets/index.js` 或在開發模式下載入 `/src/main.ts`【F:index.html†L16-L35】。當你直接使用瀏覽器開啟本機的 HTML 檔(`file:///`)，這些模組載入會失敗：

- `import('/src/main.ts')` 會被解讀成從你的電腦根目錄載入 `/src/main.ts`，而不是專案資料夾內的檔案。
- Vite 開發時需要開啟 Dev Server 來處理這些模組路徑與轉譯。

因此直接開啟 `index.html` 會因為無法載入模組而停在空白頁面。請使用下方的方式啟動開發伺服器或部署到靜態主機。

## 本機開發方式

1. 安裝相依套件：
   ```bash
   npm install
   ```
2. 啟動開發伺服器：
   ```bash
   npm run dev
   ```
3. 依照終端機輸出的網址 (預設為 `http://localhost:5173`) 於瀏覽器開啟，即可看到應用程式。

## 建置與部署到 GitHub Pages

1. 先執行建置產生靜態檔案：
   ```bash
   npm run build
   ```
   這會在 `dist/` 內輸出靜態資源，其中 `vite.config.ts` 已將 `base` 設為相對路徑 `./`，方便部署到 GitHub Pages 等子路徑。【F:vite.config.ts†L1-L17】
2. 將 `dist/` 內容部署到 GitHub Pages，例如：
   - 使用 GitHub Pages 的 `gh-pages` 分支：把 `dist/` 內容推送到 `gh-pages` 分支，並在專案設定中選擇該分支作為 Pages 來源。
   - 或使用 GitHub Actions (如 `actions/deploy-pages`) 自動化 `npm ci && npm run build`，再把 `dist/` 發佈到 Pages。
3. 部署後透過 `https://<帳號>.github.io/<倉庫名稱>/` 存取即可正常顯示。

## 發布前檢查

- 若調整了專案目錄名稱或 Pages 路徑，記得同步調整 `vite.config.ts` 的 `base` 設定。
- 更新程式碼後重新執行 `npm run build` 以確保最新內容被部署。

