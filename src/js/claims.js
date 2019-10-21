function expenseView(sectionContent) {
    sectionContent.innerHTML = reimDom();
    sectionContent.dataset.view = 'reimbursements'
    Promise.all([getReportSubs('reimbursement'), getReimMonthlyData()]).then(function (result) {
        const subs = result[0]
        const reimData = result[1]
        if (!subs.length && !reimData.length) {
            if (document.getElementById('text-container-reim')) {
                document.getElementById('text-container-reim').innerHTML = `<h3 class="info-text mdc-typography--headline4 mdc-theme--secondary">You Cannot Apply For Claim</h3>`
            }
            return
        }

        const listEl = document.getElementById('suggested-list-reim')
        if (subs.length && listEl) {
            listEl.innerHTML = templateList(subs);
            const listInit = new mdc.list.MDCList(document.getElementById('suggested-list-reim'))
            handleTemplateListClick(listInit)
        }
        let month = '';

        const frag = document.createDocumentFragment()

        reimData.forEach(function (dayRecord) {
            if (month !== dayRecord.month) {
                frag.appendChild(createElement('div', {
                    className: 'hr-sect hr-sect mdc-theme--primary mdc-typography--headline5 mdc-layout-grid__cell--span-12',
                    textContent: moment(`${dayRecord.month + 1}-${dayRecord.year}`, 'MM-YYYY').format('MMMM YYYY')
                }))
            };
            month = dayRecord.month;
            let totalAmount = 0;
            const body = createElement('tbody', {
                className: 'data-table__content'
            })
            dayRecord.reimbursements.forEach(function (data) {
                if (data.status !== 'CANCELLED') {
                    totalAmount += Number(data.amount);
                };
                body.appendChild(reimCardRows(data))
            })
            const card = reimCards(dayRecord, body, convertNumberToINR(totalAmount));
            frag.appendChild(card)
            console.log(totalAmount)
        })

        const parent = document.querySelector('.reim-section .mdc-layout-grid__inner');
        if (parent) {
            parent.appendChild(frag)
        }
    }).catch(function (error) {
        console.log(error)
        handleError({
            message: error.message,
            body: {
                stack: error.stack || '',
                error: error
            }
        })
    })
}

function convertNumberToINR(amount,currency) {
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
    </div>`
}

function getReimMonthlyData() {
    return new Promise(function (resolve, reject) {

        const tx = db.transaction('reports')
        const index = tx.objectStore('reports').index('month')
        const result = [];
        index.openCursor(null, 'prev').onsuccess = function (event) {
            const cursor = event.target.result;
            if (!cursor) return;

            if (!cursor.value.reimbursements) {
                cursor.continue();
                return;
            };
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