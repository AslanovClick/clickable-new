/* Общие настройки three.js. Шейдеры и цвета сцен подобраны без управления цветом (как в three r126):
   цвета и текстуры попадают в шейдеры как есть, на выходе нет sRGB-преобразования */
import { ColorManagement, LinearSRGBColorSpace, WebGLRenderer, type WebGLRendererParameters } from 'three'

// null — WebGL недоступен (тогда страница работает без 3D)
export function createRenderer(params: WebGLRendererParameters) {
  ColorManagement.enabled = false
  try {
    const renderer = new WebGLRenderer(params)
    renderer.outputColorSpace = LinearSRGBColorSpace
    renderer.setClearColor(0x000000, 0)
    return renderer
  } catch {
    return null
  }
}
