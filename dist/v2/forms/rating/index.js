
window.addEventListener('load',function(){
  
 
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
<<<<<<< HEAD
        document.querySelector('.down-text').classList.add('hidden')

        if(upVote.style.color === 'green') {
            upVote.style.color = 'black'
            document.querySelector('.up-text').classList.add('hidden')
=======
        document.querySelector('.down-text').setAttribute('hidden',true)

        if(upVote.style.color === 'green') {
            upVote.style.color = 'black'
            document.querySelector('.up-text').setAttribute('hidden',true)
>>>>>>> b05d573c696215acf69eaaf3c25473d175597543

        }
        else {
          
            upVote.style.color = 'green'
<<<<<<< HEAD
            document.querySelector('.up-text').classList.remove('hidden')
=======
            document.querySelector('.up-text').removeAttribute('hidden')
>>>>>>> b05d573c696215acf69eaaf3c25473d175597543

        }
    })
    downVote.addEventListener('click',function(){
        upVote.style.color = 'black'
<<<<<<< HEAD
        document.querySelector('.up-text').classList.add('hidden')

        if(downVote.style.color === 'red') {
            downVote.style.color = 'black';
            document.querySelector('.down-text').classList.add('hidden')
        }
        else {
            downVote.style.color = 'red'
            document.querySelector('.down-text').classList.remove('hidden')
=======
        document.querySelector('.up-text').setAttribute('hidden',true)

        if(downVote.style.color === 'red') {
            downVote.style.color = 'black';
            document.querySelector('.down-text').setAttribute('hidden',true)
        }
        else {
            downVote.style.color = 'red'
            document.querySelector('.down-text').removeAttribute('hidden')
>>>>>>> b05d573c696215acf69eaaf3c25473d175597543
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
<<<<<<< HEAD
    // document.getElementById('success-animation').classList.remove('hidden')
=======
    // document.getElementById('success-animation').removeAttribute('hidden')
>>>>>>> b05d573c696215acf69eaaf3c25473d175597543
})
