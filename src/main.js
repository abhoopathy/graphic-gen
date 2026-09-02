import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

// Inject @font-face at runtime so paths use the correct base URL
// (works for both dev / and GitHub Pages /graphic-gen/)
const base = import.meta.env.BASE_URL.replace(/\/$/, '')
const style = document.createElement('style')
style.textContent = `
@font-face {
  font-family: 'Empirica NYCMayor';
  src:
    url('${base}/fonts/EmpiricaNYCMayor-Black.woff2') format('woff2'),
    url('${base}/fonts/EmpiricaNYCMayor-Black.woff')  format('woff'),
    url('${base}/fonts/EmpiricaNYCMayor-Black.otf')   format('opentype'),
    url('${base}/fonts/EmpiricaNYCMayor-Black.ttf')   format('truetype');
  font-weight: 800;
  font-style: normal;
  font-display: block;
}
`
document.head.appendChild(style)

const app = mount(App, {
  target: document.getElementById('app'),
})

export default app

