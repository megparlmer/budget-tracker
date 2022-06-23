//db connection
let db;

//connection to IndexedDB database called 'budget_tracker'
const request = indexedDB.open('budget_tracker', 1);

//event listener will emit database if the version changes
request.onupgradeneeded = function(event) {
    //save reference to db
    const db = event.target.result;
    //create object store called 'budget_input' and set autoIncrement to true
    db.createObjectStore('budget_input', { autoIncrement: true });
};

request.onsuccess = function(event) {
    //when db is successfully created with its object store save reference to db in global variable
    db = event.target.result;
    //check if app is online
    if (navigator.onLine) {
        uploadBudget();
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
};

//this function executes if submit new budget is attempted and theres no internet
function saveRecord(record) {
    //open a new transaction with database
    const transaction = db.transaction(['budget_input'], 'readwrite');
    //access the object store
    const budgetObjectStore = transaction.objectStore('budget_input');
    //add record to object store with add method
    budgetObjectStore.add(record);
};

function uploadBudget() {
    //open transaction on db
    const transaction = db.transaction(['budget_input'], 'readwrite');
    //access object store
    const budgetObjectStore = transaction.objectStore('budget_input');
    //get all records from object store and set to a variable
    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function() {
        //if data in indexDB store, send to api
        if (getAll.result.length > 0) {
            fetch('api/budget', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse)
                }
                //open one more transaction
                const transaction = db.transaction(['budget_input'], 'readwrite');
                //access object store
                const budgetObjectStore = transaction.objectStore('budget_input');
                //clear object store
                budgetObjectStore.clear();

                alert('All saved budget items have been submitted');
            })
            .catch(err => {
                console.log(err);
            }) 
        }
    }
};

//listen for app coming online
window.addEventListener('online', uploadBudget);