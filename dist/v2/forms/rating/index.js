
window.addEventListener('load',function(){
  
    parent.postMessage({name: 'resizeFrame',body:{
        height:document.body.scrollHeight,
        width:document.body.scrollWidth
    }},'*');
    
    [...this.document.querySelectorAll('.rating-star')].forEach(function(el){
        el.addEventListener('click',function(){
            console.log(el.previousSibling)
            const selectedRating = Number(el.dataset.rate)
            for (let index = 1; index < 6; index++) {
                const node = document.querySelector(`[data-rate="${index}"]`)
                if(index <= selectedRating) {
                    node.textContent = 'grade'
                    node.classList.add('marked')
                }
                else {
                    node.textContent = 'star_outline'
                    node.classList.remove('marked')
                }
            }
        })  
    })
    const upVote = document.getElementById('up')
    const downVote = document.getElementById('down')
    if(!upVote || !downVote) return
    upVote.addEventListener('click',function(){
        downVote.style.color = 'black'
        document.querySelector('.down-text').classList.add('hidden')

        if(upVote.style.color === 'green') {
            upVote.style.color = 'black'
            document.querySelector('.up-text').classList.add('hidden')

        }
        else {
          
            upVote.style.color = 'green'
            document.querySelector('.up-text').classList.remove('hidden')

        }
    })
    downVote.addEventListener('click',function(){
        upVote.style.color = 'black'
        document.querySelector('.up-text').classList.add('hidden')

        if(downVote.style.color === 'red') {
            downVote.style.color = 'black';
            document.querySelector('.down-text').classList.add('hidden')
        }
        else {
            downVote.style.color = 'red'
            document.querySelector('.down-text').classList.remove('hidden')
        }
    })
})
const form = document.getElementById('form');
form.addEventListener('submit',function(e){
    e.preventDefault()
    // parent.postMessage({name:'submit'},'*')
    document.querySelector('.feedback-card').innerHTML = `   <div class="success--container  center-abs" id="success-animation">
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130.2 130.2">
      <circle class="path circle" fill="none" stroke="#008000" stroke-width="6" stroke-miterlimit="10" cx="65.1"
        cy="65.1" r="62.1" />
      <polyline class="path check" fill="none" stroke="#008000" stroke-width="6" stroke-linecap="round"
        stroke-miterlimit="10" points="100.2,40.2 51.5,88.8 29.8,67.5 " />
    </svg>
    <p class="success-text">Thank you for your feedback</p>

  </div>`
    // document.getElementById('success-animation').classList.remove('hidden')
})
