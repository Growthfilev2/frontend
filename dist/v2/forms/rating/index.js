const customerNumber = document.getElementById("customer-number");
const editName = document.getElementById('edit-name');
const feedback = document.getElementById('feedback');
const skipRatingbtn = document.getElementById('skip-rating');
const productsSection = document.querySelector('.products-section');
const contactBtn = document.getElementById('contact-btn')
let reviewerNumber = new mdc.textField.MDCTextField(document.getElementById('contact-number'))
let reviewerName =  new mdc.textField.MDCTextField(document.getElementById('contact-name'));
const selectedProducts = {};
let productDialog;
const iti = phoneFieldInit(reviewerNumber.input_);
let customerName;
let dutyCustomer;
window.addEventListener('load',function(){
    window.mdc.autoInit();
   
    contactBtn.addEventListener('click',function(){
      
       callContact('setContactForCustomer'); 
    });
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
  
})



function getRating() {
    return [...document.querySelectorAll('.rating-star.marked')].length;
}

function setCustomerName(name) {
    document.querySelector('#customer-name .text').textContent = name
}
function setContact(contactObject){
    document.querySelector('.contact-container').removeAttribute('hidden')
    reviewerNumber.value = contactObject.phoneNumber;
    reviewerName.value = contactObject.displayName;
}

function init(template, data) {
    console.log(data);
    console.log(template)
    const products = data.products;
    customerName = data.customer.location;
    dutyCustomer = data.customer;

    setCustomerName(dutyCustomer.location);
    editName.addEventListener('click', function () {
        chooseCustomer(data.customers);
    })
    // const canEditProducts = data.canEditProduct;
    if(!data.canEditCustomer) {
        editName.remove();
    }

    if (products.length) {
        loadProducts(products)
    };

    skipRatingbtn.addEventListener('click', function () {
        parent.postMessage({
            name: 'markDutyFinished',
            body:{
                dutyId:data.dutyId,
                office:template.office
            }
        }, parentOrigin)
    });

    const form = document.getElementById('form');
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const copy = JSON.parse(JSON.stringify(template));
        const rating = getRating();
        if (!rating) {
            showSnacksApiResponse('Please give rating');
            return
        }
        if(!reviewerName.value || !reviewerNumber.value) {
            showSnacksApiResponse("Please add a customer contact");
            return
        }
        copy.attachment['Reviewer Name'].value = reviewerName.value || '';

        if(reviewerNumber.value) {
            if(!isPhoneNumberValid(iti)) {
                setHelperInvalid(reviewerNumber, 'Please enter a valid phone number')
                return;
            }
            setHelperValid(reviewerNumber);
            copy.attachment['Reviewer Number'].value = iti.getNumber(intlTelInputUtils.numberFormat.E164);
        }
     
        copy.share = [];
        copy.attachment['Creator Rating'].value = rating
        copy.attachment['Creator Feedback'].value = feedback.value;
        copy.attachment.Customer.value = customerName;
        copy.dutyId = data.dutyId;
        const productArray = [];
        Object.keys(selectedProducts).forEach(function (product) {
            productArray.push(selectedProducts[product])
        })
        if (productArray.length == 0) {
            productArray.push({
                name: '',
                rate: '',
                date: '',
                quantity: ''
            })
        }
        copy.attachment.Products.value = productArray;
        copy.venue = [{
            venueDescriptor: template.venue[0],
            location:  dutyCustomer.location,
            address:  dutyCustomer.address,
            geopoint: {
                latitude:  dutyCustomer.latitude,
                longitude:  dutyCustomer.longitude
            }
        }]
       
        parent.postMessage({
            name: 'sendFormToParent',
            body: copy
        }, parentOrigin);
    })
}

function loadProducts(products) {

    const addProductsBtn = createButton("Add product", '', 'add');
    addProductsBtn.classList.add('mdc-button--raised', 'product-btn');
    addProductsBtn.addEventListener('click', function (evt) {
        evt.preventDefault();
        openProductScreen(products);
       

    })
    const ul = createElement('ul', {
        className: 'mdc-list mdc-list--two-line mdc-list--avatar-list',
        id: 'product-list'
    })
    productsSection.appendChild(addProductsBtn);
    productsSection.appendChild(ul);
}

function openProductScreen(products, selectedProduct) {
    productDialog = new Dialog("New product", createProductScreen(products, selectedProduct)).create('simple')
    productDialog.open();
}

function createProductScreen(products, savedProduct = {
    rate: '',
    date: '',
    quantity: '',
    name: ''
}) {
    const div = createElement('div', {
        className: 'product-choose-container'
    })
    const name = createProductSelect(products);
    if (savedProduct.name) {
        name.value = savedProduct.name
    }
    const rate = new mdc.textField.MDCTextField(textField({
        id: 'rate',
        label: 'Rate',
        type: 'number',
        value: savedProduct.rate || ''
    }));
    const quantity = new mdc.textField.MDCTextField(textField({
        id: 'quantity',
        label: 'Quantity',
        type: 'number',
        value: savedProduct.quantity || ''
    }));
    const date = new mdc.textField.MDCTextField(textField({
        id: 'date',
        type: 'date',
        label: 'Date',
        value: savedProduct.data || createDate(new Date())
    }));
    div.appendChild(name.root_);
    div.appendChild(rate.root_);
    div.appendChild(quantity.root_);
    div.appendChild(date.root_);
    const actionButtons = createElement('div', {
        className: 'dialog-action-buttons'
    })
    const cancel = createButton('cancel');
    cancel.addEventListener('click', function (e) {
        e.preventDefault();
        productDialog.close();
    })
    const save = createButton('save');
    save.classList.add("mdc-button--raised");
    actionButtons.appendChild(cancel);
    actionButtons.appendChild(save);
    save.addEventListener('click', function (e) {
        e.preventDefault();

        productDialog.close();
        if (!name.value) {
            showSnacksApiResponse('Please select a product name');
            return
        }
        if (document.querySelector(`[data-product-name="${name.value}"]`)) {
            document.querySelector(`[data-product-name="${name.value}"]`).remove()
        }
        const selectedProduct = {
            rate: Number(rate.value),
            date: date.value,
            quantity: Number(quantity.value),
            name: name.value
        }
        selectedProducts[name.value] = selectedProduct
        appendProducts(products, selectedProduct);
    })
    div.appendChild(actionButtons)
    return div;

}

function appendProducts(products, selectedProduct) {
    const productList = document.getElementById('product-list');
    const li = createElement('li', {
        className: 'mdc-list-item pl-0',
    })
    li.dataset.productName = selectedProduct.name;

    const clearIcon = createElement('span', {
        className: 'mdc-list-item__graphic material-icons mdc-theme--error',
        textContent: 'delete'
    })
    clearIcon.addEventListener('click', function () {
        li.remove();
        delete selectedProducts[selectedProduct.name];
    })
    const text = createElement("span", {
        className: 'mdc-list-item__text'
    })
    const primaryText = createElement('span', {
        className: 'mdc-list-item__primary-text',
        style: 'text-align:left',
        textContent: selectedProduct.name
    })
    const secondaryText = createElement('span', {
        className: 'mdc-list-item__secondary-text',
        style: 'text-align:left',
        textContent: selectedProduct.quantity ? 'Quantity : ' + selectedProduct.quantity : ''
    })
    text.appendChild(primaryText)
    text.appendChild(secondaryText);
    text.addEventListener('click', function () {
        openProductScreen(products, selectedProduct)
    })
    const meta = createElement('span', {
        className: 'mdc-list-item__meta mdc-theme--primary',
        style: 'font-size:18px',
        textContent: selectedProduct.rate ? convertNumberToINR(selectedProduct.rate) : ''
    })
    li.appendChild(clearIcon)
    li.appendChild(text)
    li.appendChild(meta);

    productList.appendChild(li);
}

function createProductSelect(products) {

    const select = createElement('div', {
        className: 'mdc-select full-width',

    })
    select.innerHTML = `<i class="mdc-select__dropdown-icon"></i>
                        <select class="mdc-select__native-control">
                            ${products.map(function(product){
                                return `<option value="${product.attachment.Name.value}">${product.attachment.Name.value}</option>`
                            }).join("")}
                        </select>
                        <label class="mdc-floating-label">Choose product</label>
                        <div class="mdc-line-ripple"></div>`;

    return new mdc.select.MDCSelect(select);
}

function chooseCustomer(customers) {
    const container = createElement('div', {
        className: 'choose-customer-container'
    })
    const searchField = new mdc.textField.MDCTextField(textField({
        label: 'Search customer'
    }));
    searchField.root_.classList.add('mt-10')
    const ul = createElement('ul', {
        className: 'mdc-list mdc-list--two-line customer-list'
    });
    const ulInit = new mdc.list.MDCList(ul)


    searchField.input_.addEventListener('input', function (e) {
        const value = e.target.value.toLowerCase().trim();
        // if (!value) return;
        ulInit.listElements.forEach(function (li) {
            if (li.dataset.location.toLowerCase().indexOf(value) > -1) {
                li.removeAttribute('hidden')
            } else {
                li.setAttribute('hidden', true)
            }
        })


    })
    container.appendChild(searchField.root_)
    customers.forEach(function (data, index) {

        const li = createElement('li', {
            className: 'mdc-list-item'
        })
        li.innerHTML = `<span class='mdc-list-item__text'>
                <span class='mdc-list-item__primary-text'>${data.location}</span>
                <span class='mdc-list-item__secondary-text'>${data.address}</span>
            </span>`
        li.dataset.location = data.location;             
        li.addEventListener('click',function(){
            document.getElementById('dialog-container').innerHTML = ''
            customerName = data.location
            setCustomerName(data.location)
        })
        ul.appendChild(li);
    })
    container.appendChild(ul)
    const close = createButton('close');
    close.classList.add('mdc-button--outlined');
    container.appendChild(close);
    close.addEventListener('click',function(){
        document.getElementById('dialog-container').innerHTML = ''
    })
    const customerDialog = new Dialog("Choose customer", container).create('simple');            
    customerDialog.open();
}



