import CallFrame from "/vendor/akiyatkin/waitshow/CallFrame.js"

let isVis = (el) => {
    var H = window.innerHeight
    var r = el.getBoundingClientRect(); var t = r.top; var b = r.bottom
    let vis = !!Math.max(0, t > 0 ? H - t : (b < H ? b : H))
    return vis
}
let inViewport = function (el, cb) {
    let test = () => {
        if (!isVis(el)) return
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