import { CallFrame } from "/vendor/akiyatkin/waitshow/CallFrame.js"
import { isViewport } from "/vendor/akiyatkin/load/isViewport.js"

let inViewport = function (el, cb) {
    let test = () => {
        if (!isViewport(el)) return
        window.removeEventListener('resize', handler)
        window.removeEventListener('scroll', handler)
        cb()
    }
    let handler = () => CallFrame(test)

    window.addEventListener('resize', handler)
    window.addEventListener('scroll', handler)
    
    //Первая проверка после активности
    let init = () => {
        handler()
        document.body.removeEventListener('click', init)
        document.body.removeEventListener('mouseover', init)
    }
    document.body.addEventListener('click', init)
    document.body.addEventListener('mouseover', init)
}

export { inViewport }