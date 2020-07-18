let isViewport = el => {
    let H = window.innerHeight
    let r = el.getBoundingClientRect()
    let t = r.top 
    let b = r.bottom
    return !!Math.max(0, t > 0 ? H - t : (b < H ? b : H))
}

export { isViewport }