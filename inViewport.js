import { CallFrame } from "/vendor/akiyatkin/waitshow/CallFrame.js"
import { isViewport } from "/vendor/akiyatkin/load/isViewport.js"

let second = false
let inViewport = (el, cb) => {
    return new Promise(resolve => {
        let test = () => {
            if (!isViewport(el)) return
            window.removeEventListener('resize', handler)
            window.removeEventListener('scroll', handler)
            if (cb) cb()
            resolve()
        }
        let handler = () => CallFrame(test)
    
        window.addEventListener('resize', handler)
        window.addEventListener('scroll', handler)
        
        //Первая проверка после активности или если были переходы по сайту
        if (second) return handler()
        let init = () => {
            second = true
            handler()
            document.body.removeEventListener('click', init)
            document.body.removeEventListener('mouseover', init)
        }
        document.body.addEventListener('click', init)
        document.body.addEventListener('mouseover', init)
    })
}

export { inViewport }