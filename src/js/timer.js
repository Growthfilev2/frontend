self.addEventListener('message',(event)=>{
    if(event.data.type === 'read') {
        setInterval(()=>{
            self.postMessage(event.data)
        },4000)
    }
})