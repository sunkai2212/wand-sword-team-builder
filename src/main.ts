import './styles.css'
import { mountApp } from './ui/app'

export const APP_TITLE = '杖剑传说·4v4阵容图'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('Missing #app root element')
}

mountApp(app)
