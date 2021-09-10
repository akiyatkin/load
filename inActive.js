
const inActive = new Promise(resolve => {
    const init = () => {
        // document.body.removeEventListener('click', init)
        // document.body.removeEventListener('mouseover', init)
        window.removeEventListener('click', init)
        window.removeEventListener('mouseover', init)
        window.removeEventListener('resize', init)
        //window.removeEventListener('scroll', init)
        resolve()
    }
    // document.body.addEventListener('click', init)
    // document.body.addEventListener('mouseover', init)

    window.addEventListener('click', init)
    window.addEventListener('mouseover', init)
    window.addEventListener('resize', init)
    //window.addEventListener('scroll', init)
})

export { inActive }