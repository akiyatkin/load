let WebPCheck = callback => {
    let lossy = "UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA"
    let img = new Image();
    img.onload = () => callback((img.width > 0) && (img.height > 0))
    img.onerror = () => callback(false)
    img.src = "data:image/webp;base64," + lossy
}

export { WebPCheck }
