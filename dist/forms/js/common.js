function createDate(dateObject) {
    console.log(dateObject)
    let month = dateObject.getMonth() + 1;
    let date = dateObject.getDate()
    if (month < 10) {
        month = '0' + month
    }
    if (date < 10) {
        date = '0' + date
    }
    return `${dateObject.getFullYear()}-${month}-${date}`
}

function getTommorowDate() {
    const today = new Date();
    const tomorrow = new Date();
    return new Date(tomorrow.setDate(today.getDate() + 1))
}

function showSecondDate(event, className, dataName) {
    event.target.classList.add('hidden')
    document.querySelector('.' + className).classList.remove('hidden');

    document.querySelector(`[data-name="${dataName}"]`).removeEventListener('change', startDateListen)
}

function startDateListen(event) {
    document.querySelector(`[data-name="${event.target.dataset.name} end date"]`).value = event.target.value
}

function initializeDates(subscriptionTemplate) {

    subscriptionTemplate.schedule.forEach(function (name) {
        const el = document.querySelector(`[data-name="${name}"]`)
        el.addEventListener('change', startDateListen);

        document.querySelector(`[data-name="${name} end date"]`).value = el.value

    });
}


function getNewSchedule(subscriptionTemplate) {
    const newSchedules = []
    subscriptionTemplate.schedule.forEach(function (name) {
        const startDate = document.querySelector(`[data-name="${name}"]`);
        const startTime = document.querySelector(`[data-name="${name} start time"]`);
        const endDate = document.querySelector(`[data-name="${name} end date"]`);
        const endTime = document.querySelector(`[data-name="${name} end time"]`);

        newSchedules.push({
            name: name,
            startTime: parent.moment(startDate.value + ' ' + startTime.value)
                .valueOf(),
            endTime: parent.moment(endDate.value + ' ' + endTime.value).valueOf(),
        })

    })
    return newSchedules;
    
}

function getDropDownContent(office, template, indexName) {
    return new Promise(function (resolve, reject) {
        const result = {
            data: [],
            string: ''
        }
        const tx = parent.db.transaction(['children'])
        const keyRange = IDBKeyRange.only([office, template])
        tx.objectStore('children').index(indexName).openCursor(keyRange).onsuccess = function (event) {
            const cursor = event.target.result;
            if (!cursor) return;
            if (cursor.value.status === 'CANCELLED') {
                cursor.continue();
                return;
            }
            if(template === 'leave-type') {
                result.data.push(cursor.value)
            }
            result.string += ` <option value="${cursor.value.attachment.Name.value}">
                    ${cursor.value.attachment.Name.value}
                  </option>`
            cursor.continue();
        }
        tx.oncomplete = function () {
            return resolve(result)
        }

    })
}

function removeList(event) {

    event.target.parentNode.remove();

}

function createProductAmount(product) {
    const li = parent.createElement('li', {
        className: 'mdc-list-item'
    })
    li.dataset.product = product;

    li.innerHTML = `<span class="mdc-list-item__graphic material-icons" aria-hidden="true" style="
    margin-right: 10px;
    color:red
    ">clear</span>
    ${product}
    <input class="mdc-list-item__meta amount-input" aria-hidden="true" placeholder="Add Amount" type='number'>
    `
    return li;
}