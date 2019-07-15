function createDate(dateObject) {
    console.log(dateObject)
    let month = dateObject.getMonth() +1;
    let date = dateObject.getDate()
    if(month < 10) {
        month = '0'+month
    }
    if(date < 10) {
        date = '0'+date
    }
    return `${dateObject.getFullYear()}-${month}-${date}`
}

function getTommorowDate(){
    const today = new Date();
    const tomorrow = new Date();
    return  new Date(tomorrow.setDate(today.getDate() +1))
}