
const inActive = new Promise(resolve => {
    const base = document.activeElement
    const init = () => {
        // document.body.removeEventListener('click', init)
        // document.body.removeEventListener('mouseover', init)
        // window.removeEventListener('click', init)
        window.removeEventListener('mouseover', init)
        // window.removeEventListener('resize', init)
        //window.removeEventListener('keypress', init)
        window.removeEventListener('touchstart', init)
        //window.removeEventListener('scroll', init)
        //if (base) base.removeEventListener('blur', init)
        resolve()
    }
    // document.body.addEventListener('click', init)
    // document.body.addEventListener('mouseover', init)

    // window.addEventListener('click', init)
    window.addEventListener('mouseover', init)
    // window.addEventListener('resize', init)
    //window.addEventListener('keypress', init)
    window.addEventListener('touchstart', init)
    
    //if (base) base.addEventListener('blur', init)
    //window.addEventListener('scroll', init)
})

export { inActive }