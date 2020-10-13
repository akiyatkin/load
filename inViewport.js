import { CallFrame } from "/vendor/akiyatkin/waitshow/CallFrame.js"
import { isViewport } from "/vendor/akiyatkin/load/isViewport.js"

let second = false
const inViewport = (el, cb) => {
    return new Promise(resolve => {
        const handler = () => CallFrame(() => {
            if (!isViewport(el)) return
            window.removeEventListener('resize', handler)
            window.removeEventListener('scroll', handler)
            document.body.removeEventListener('click', init)
            document.body.removeEventListener('mouseover', init)
            if (cb) cb()
            resolve()
        })

        const init = () => {
            second = true
            handler()
            document.body.removeEventListener('click', init)
            document.body.removeEventListener('mouseover', init)
        }

        window.addEventListener('resize', handler)
        window.addEventListener('scroll', handler)
        
        //Дополнительной проверкой
        //if (Crumb.counter < 2) return handler()
        document.body.addEventListener('click', init)
        document.body.addEventListener('mouseover', init)

        //Первая проверка после активности или сразу при следующей проверке
        //if (Crumb.counter < 2) return handler()
        //document.body.addEventListener('click', init)
        //document.body.addEventListener('mouseover', init)
    })
}

export { inViewport }