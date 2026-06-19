import './styles.css'

export const APP_TITLE = '杖剑传说·4v4阵容图'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('Missing #app root element')
}

app.innerHTML = `<main class="app-shell"><h1>${APP_TITLE}</h1></main>`
