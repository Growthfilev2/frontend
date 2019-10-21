function expenseView(sectionContent) {
    sectionContent.innerHTML = reimDom();
    sectionContent.dataset.view = 'reimbursements'

    getReportSubs('reimbursement').then(function(subs){
        const listEl = document.getElementById('suggested-list-reim')
        if (subs.length && listEl) {
            listEl.innerHTML = templateList(subs);
            const listInit = new mdc.list.MDCList(listEl)
            handleTemplateListClick(listInit)
        }
    }).catch(function(error) {
        console.log(error)
        handleError({
            message: error.message,
            body: {
                stack: error.stack || '',
                error: error
            }
        })
    })

    getReimMonthlyData().then(function(reimbursementData){
        console.log(reimbursementData)
        let month = monthlyString = '';
        const parent = document.getElementById('reimbursements')
        reimData.forEach(function (record) {
            if (month !== record.month) {
                monthlyString += `<div class="hr-sect hr-sect mdc-theme--primary mdc-typography--headline5 mdc-layout-grid__cell--span-12-desktop mdc-layout-grid__cell--span-4-phone mdc-layout-grid__cell--span-8-tablet">${moment(`${record.month + 1}-${record.year}`,'MM-YYYY').format('MMMM YYYY')}</div>`;
            };
            month = record.month;
            monthlyString += reimbursementCard(record);
        })
        if(parent)  {
            parent.innerHTML = monthlyString;
            toggleReportCard('.reim-card')
        }
    })
}


function reimbursementCard(data) {
    return `<div class='mdc-card mdc-card--outlined reim-card mdc-layout-grid__cell--span-6-desktop mdc-layout-grid__cell--span-4-phone mdc-layout-grid__cell--span-8-tablet'>
    <div class='mdc-card__primary-action'>
      <div class="demo-card__primary">
      <div class='left'>
          <div class="month-date-cont">
            <div class="day">${cardDate(data)}</div>
            <div class="date">${data.date}</div>
          </div>
          <div class="heading-container">
            <span class="demo-card__title mdc-typography">${convertAmountToCurrency(data.amount,data.currency)}</span>
            <h3 class="demo-card__subtitle mdc-typography mdc-typography--subtitle2 mb-0 card-office-title">${data.office}</h3>
          </div>
      </div>
      <div class='right'>
        <div class="dropdown-container dropdown">
          <i class="material-icons">keyboard_arrow_down</i>
        </div>
      </div>
      </div>
      <div class='detail-container hidden'>
      <div class='text-container'>
        ${data.reims.map(function(value){
            return `<div class='amount-container'>
                <div class='amount mdc-typography--headline6 mdc-theme--primary' data-claimId="${value.id}">
                    ${convertAmountToCurrency(value.amount,value.currency)}
                    <div class='mdc-typography--caption'>${value.type}</div>
                </div>
            </div>`
        }).join("")}
      </div>
      </div>
    </div>
</div>`
}



function convertAmountToCurrency(amount,currency) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency || 'INR'
    }).format(amount)
}


function reimCardRows(data) {

    const tr = createElement('tr', {
        className: 'data-table__row'
    })
    const nameTd = createElement('td', {
        className: 'data-table__cell',
        textContent: data.activityId ? data['claimType'] : `${data.name}`
    })
    tr.onclick = function () {
        if (data.activityId) {
            db.transaction('activity').objectStore('activity').get(data.activityId).onsuccess = function (event) {
                const activityRecord = event.target.result
                if (!activityRecord) return;
                const heading = createActivityHeading(activityRecord)
                showViewDialog(heading, activityRecord, 'view-form')
            }
            return
        }
        // km or daily
        const metaHeading = `${data.name}
        <p class='card-time mdc-typography--subtitle1 mb-0 mt-0'>(${data.template})</p>`
        const metaContent = `<div class='mdc-card reim-auto-card'>
        <h1 class='mdc-typography--subtitle1 mt-0'>${data.distanceTravelled ?`Distance Travelled : ${data.distanceTravelled} km` :'' }</h1>
        <h1 class='mdc-typography--subtitle1 mt-0 '>${data.amount ?`Amount : ${convertNumberToINR(Number(data.amount))}` :'' }</h1>
        <h1 class='mdc-typography--subtitle1 mt-0'>${data.location ? `Location : ${data.location}` :''} </h1>
        </div>`
        const dialog = new Dialog(metaHeading, metaContent, 'view-form').create();
        dialog.open();
        dialog.autoStackButtons = false;
        dialog.buttons_[1].classList.add("hidden");
    }

    const amountTd = createElement('td', {
        className: 'data-table__cell data-table__cell--numeric',
        textContent: convertNumberToINR(Number(data.amount))
    })

    const statusTd = createElement('td', {
        className: 'data-table__cell data-table__cell--numeric',
        textContent: data.status
    })

    if (data.status === 'CANCELLED') {
        statusTd.classList.add('mdc-theme--error')
        amountTd.textContent = convertNumberToINR(0)
    }
    if (data.status === 'CONFIRMED') {
        statusTd.classList.add('mdc-theme--success')
    }

    tr.appendChild(nameTd)
    tr.appendChild(amountTd)
    tr.appendChild(statusTd)
    return tr;
}

function commonCardHeading(value) {
    const day = moment(`${value.date}-${value.month + 1}-${value.year}`, 'DD-MM-YYYY').format('ddd')

    const card = createElement('div', {
        className: 'mdc-card reim-card mdc-layout-grid__cell--span-12'
    })
    const primary = createElement('div', {
        className: 'mdc-card__primary-action'
    })
    const demo = createElement('div', {
        className: 'demo-card__primary'
    })
    const monthlyDateCont = createElement('div', {
        className: 'month-date-cont'
    })

    const dayDiv = createElement('div', {
        className: 'day',
        textContent: day
    })
    const date = createElement('div', {
        className: 'date',
        textContent: value.date
    })
    const headingContainer = createElement('div', {
        className: 'heading-container'
    })
    const dropdownContainer = createElement("div",{
        className:'dropdown-container dropdown'
    })
    const dropDown = createElement('i', {
        className: 'material-icons',
        textContent: 'keyboard_arrow_down'
    })
    const dropdownMeta = createElement('h3', {
        className: 'mdc-typography--subtitle2  capitalize',
        textContent: `${value.template || value.type}`
    })
    dropdownContainer.appendChild(dropDown);
    dropdownContainer.appendChild(dropdownMeta);

    const heading = createElement('span', {
        className: 'demo-card__title mdc-typography',
        textContent: `${convertNumberToINR(value.amount,value.currency)}`
    })
    const subHeading = createElement('h3', {
        className: 'demo-card__subtitle mdc-typography mdc-typography--subtitle2 mb-0',
        textContent: `${value.office}`
    });
    
    monthlyDateCont.appendChild(dayDiv)
    monthlyDateCont.appendChild(date)

    demo.appendChild(monthlyDateCont)
    headingContainer.appendChild(heading)
    headingContainer.appendChild(subHeading)


    demo.appendChild(headingContainer)
    demo.appendChild(dropdownContainer)

    const detailSection = createElement('div', {
        className: 'card-detail-section hidden'
    })
    primary.appendChild(demo)
    primary.appendChild(detailSection);
    card.appendChild(primary)

    dropDown.onclick = function () {
        if (detailSection.classList.contains('hidden')) {
            dropDown.textContent = 'keyboard_arrow_up'
            detailSection.classList.remove('hidden')
        } else {
            dropDown.textContent = 'keyboard_arrow_down'
            detailSection.classList.add('hidden')
        }
    }
    return card;
}

function reimCards(dayRecord, body, totalAmount) {

    const day = moment(`${dayRecord.date}-${dayRecord.month + 1}-${dayRecord.year}`, 'DD-MM-YYYY').format('ddd')

    const card = createElement('div', {
        className: 'mdc-card reim-card mdc-layout-grid__cell--span-12'
    })
    const primary = createElement('div', {
        className: 'mdc-card__primary-action'
    })
    const demo = createElement('div', {
        className: 'demo-card__primary'
    })
    const monthlyDateCont = createElement('div', {
        className: 'month-date-cont'
    })

    const dayDiv = createElement('div', {
        className: 'day',
        textContent: day
    })
    const date = createElement('div', {
        className: 'date',
        textContent: dayRecord.date
    })
    const headingContainer = createElement('div', {
        className: 'heading-container'
    })
    const dropDown = createElement('i', {
        className: 'material-icons dropdown',
        textContent: 'keyboard_arrow_down'
    })


    const heading = createElement('span', {
        className: 'demo-card__title mdc-typography',
        textContent: `REIMBURSEMENTS : ${totalAmount}`
    })
    const subHeading = createElement('h3', {
        className: 'demo-card__subtitle mdc-typography mdc-typography--subtitle2 mb-0',
        textContent: `${dayRecord.office}`
    })
    const dataTabel = createElement('div', {
        className: 'data-table hidden'
    })
    const tabel = createElement('table', {
        className: 'data-table__table'
    })
    const head = createElement('thead')
    const primaryRow = createElement('tr', {
        className: 'data-table__header-row'
    })
    const claims = createElement('th', {
        className: 'data-table__header-cell ',
        textContent: 'Claim Type'
    })
    const amount = createElement('th', {
        className: 'data-table__header-cell cell-numeric',
        textContent: 'Amount'
    })
    const status = createElement('th', {
        className: 'data-table__header-cell cell-numeric',
        textContent: 'Status'
    })

    monthlyDateCont.appendChild(dayDiv)
    monthlyDateCont.appendChild(date)

    primaryRow.appendChild(claims)
    primaryRow.appendChild(amount)
    primaryRow.appendChild(status)
    head.appendChild(primaryRow)
    tabel.appendChild(head)
    tabel.appendChild(body)
    dataTabel.appendChild(tabel)
    demo.appendChild(monthlyDateCont)
    headingContainer.appendChild(heading)
    headingContainer.appendChild(subHeading)
    demo.appendChild(headingContainer)
    demo.appendChild(dropDown)

    primary.appendChild(demo)
    primary.appendChild(dataTabel)

    card.appendChild(primary)

    let isOpen = false
    dropDown.onclick = function () {
        isOpen = !isOpen;
        if (isOpen) {
            dropDown.textContent = 'keyboard_arrow_up'
            dataTabel.classList.remove('hidden')
        } else {
            dropDown.textContent = 'keyboard_arrow_down'
            dataTabel.classList.add('hidden')
        }
    }


    return card;

}

function reimCardDetails(data) {
    return `${data.amount ? `<span class='mdc-typography--headline6'>Amount : ${data.amount}</span>`:''}
${data.timestamp ? `<span class='mdc-typography--headline6'>Create On : ${moment(data.timestamp).format('DD MM YYYY hh:mm')}</span>`:''}
`
}

function reimDom() {
    return `<div class='reim-section'>
        <div class='mdc-layout-grid__inner'>
            <div id='text-container-reim' class='mdc-layout-grid__cell--span-12'></div>
            <div class='list-container mdc-layout-grid__cell--span-12'>
                <ul class='mdc-list subscription-list' id='suggested-list-reim'></ul>
            </div>
            <div id='reimbursements'></div>
    </div>`
}

function getReimMonthlyData() {
    return new Promise(function (resolve, reject) {

        const tx = db.transaction('reimbursement')
        const index = tx.objectStore('reimbursement').index('month')
        const result = [];
        index.openCursor(null, 'prev').onsuccess = function (event) {
            const cursor = event.target.result;
            if (!cursor) return;
            result.push(cursor.value);
            cursor.continue();
        }
        tx.oncomplete = function () {
            return resolve(result)
        }
        tx.onerror = function () {
            return reject(tx.error)
        }
    })
}