export async function resizeImage(file: File, maxSize = 1200){
  return new Promise<File>((resolve, reject) => {
    const img = document.createElement('img')
    const reader = new FileReader()
    reader.onload = function(e){
      img.src = e.target?.result as string
      img.onload = function(){
        const canvas = document.createElement('canvas')
        let w = img.width
        let h = img.height
        if (Math.max(w,h) > maxSize){
          if (w > h){ h = Math.round(h * (maxSize / w)); w = maxSize } else { w = Math.round(w * (maxSize / h)); h = maxSize }
        }
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img,0,0,w,h)
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('Failed to resize'))
          const newFile = new File([blob], file.name, { type: blob.type })
          resolve(newFile)
        }, 'image/jpeg', 0.85)
      }
      img.onerror = reject
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
