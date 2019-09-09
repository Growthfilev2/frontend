function expenseView() {

    const sectionContent = document.querySelector('.tabs-section .data-container');
    if (!sectionContent) return;
    sectionContent.innerHTML = reimDom();

    Promise.all([getReportSubs('reimbursement'), getReimMonthlyData()]).then(function (result) {
        console.log(result);
        const subs = result[0]
        const reimData = result[1]

        if (!subs.length && !reimData.length) {
            document.getElementById('text-container-reim').innerHTML = `<h3 class="info-text mdc-typography--headline4 mdc-theme--secondary">You Cannot Apply For Claim</h3>`
            return
        }

        const listEl = document.getElementById('suggested-list-reim')
        if (subs.length && listEl) {
            listEl.innerHTML = templateList(subs);
            const listInit = new mdc.list.MDCList(document.getElementById('suggested-list-reim'))
            handleTemplateListClick(listInit)
        }

        let month = '';
        let monthlyString = '';
        reimData.forEach(function (record) {
            if (month !== record.month) {
                monthlyString += `<div class="hr-sect hr-sect mdc-theme--primary mdc-typography--headline5">${moment(`${record.month + 1}-${record.year}`,'MM-YYYY').format('MMMM YYYY')}</div>`  
            };
            month = record.month;
            
            record.reimbursements.forEach(function(data){
                monthlyString += reimCards(record,data);
            })
        })

        if (document.getElementById('monthly-stat-reim')) {
            document.getElementById('monthly-stat-reim').innerHTML = monthlyString
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

function reimCards(dayRecord,data) {
const div = createElement('div',{
    className:'mdc-card mdc-card--outlined'
})
div.onclick = function(){
    db.transaction('activity').objectStore('activity').get(data.activityId).onsuccess = function(event){
        const activityRecord = event.target.result;
        if(!activityRecord) return;
        const heading = createActivityHeading(activityRecord)
        showViewDialog(heading, activityRecord, 'view-form');
    }
}
const day = moment(`${dayRecord.date}-${dayRecord.month + 1}-${dayRecord.year}`, 'DD-MM-YYYY').format('ddd')
div.innerHTML = `<div class="month-container mdc-elevation--z2">
<div class="month-date-cont">
  <span class='day'>${day}</span>
  <p class='date'>${dayRecord.date}</p>
</div>
<div class='reim-details'>
${reimCardDetails(data)}
<ul class='mdc-list mdc-list--two-line'>
    ${viewSchedule({schedule:[{
        name:'Date',
        startTime:data.startTime,
        endTime:data.endTime
    }]})}
</ul>
${data.details ? `<p class='mdc-typography-body1'>${data.details}</p>`:''}
</div>
</div>`
return div.outerHTML;
}

function reimCardDetails (data){
return `${data.amount ? `<span class='mdc-typography--headline6'>Amount : ${data.amount}</span>`:''}
${data.timestamp ? `<span class='mdc-typography--headline6'>Create On : ${moment(data.timestamp).format('DD MM YYYY hh:mm')}</span>`:''}
`
}

function reimDom() {
    return `<div class='reim-section'>
        <div class='mdc-layout-grid__inner'>
            <div id='text-container-reim'></div>
            <div class='list-container mdc-layout-grid__cell--span-12'>
                <ul class='mdc-list subscription-list' id='suggested-list-reim'></ul>
            </div>
        <div id='monthly-stat-reim'></div>
    </div>`
}

function getReimMonthlyData() {
    return new Promise(function (resolve, reject) {

        const tx = db.transaction('reports')
        const store = tx.objectStore('reports')
        const result = [];
        store.openCursor().onsuccess = function (event) {
            const cursor = event.target.result;
            if (!cursor) return;

            if (!cursor.value.reimbursements) {
                cursor.continue();
                return;
            }
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