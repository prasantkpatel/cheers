let last_uid='000000000000000000000000', last_did='000000000000000000000000';

async function get_docs(update_cards) {
    let users = [], drinks = []
    console.log('last_uid:', last_uid);
    console.log('last_did:', last_did);
    await axios.get(`${window.location.origin}/users?last_uid=${last_uid}`)
    .then(res => {
        users = res.data;
        if(users[0]) last_uid = users[0]._id;
    })
    .catch(err => console.error(err));

    await axios.get(`${window.location.origin}/drinks?last_did=${last_did}`)
    .then(res => {
        drinks = res.data;
        if(drinks[0]) last_did = drinks[0]._id;
    })
    .catch(err => console.error(err));

    update_cards(users, drinks);
}

function update_cards(users, drinks) {
    let user_col = document.getElementById('user-col');
    let drinks_col = document.getElementById('wine-col');

    user_col.innerHTML='', drinks_col.innerHTML='';
    
    users.forEach(user => {
        user_col.innerHTML+=`<div class="card">
        <div class="v-div-1">
            <div class="h-div-1">  
                <img class="image" src=${user.picture.large} alt="failed_to_load">
            </div>
            <div class="h-div-2"></div>
        </div>
        <div class="v-div-2">
            <h1 class="name">${user.name.title}. ${user.name.first} ${user.name.last}</h1></br>
            <div id="email" class="text">Email: ${user.email}</div></br>
            <div id="username" class="text">Username: ${user.login.username}</div></br>
            <div id="password" class="text">Password: ${user.login.password}</div>
        </div>
        </div>`;
    });

    drinks.forEach(drink => {
        drinks_col.innerHTML+=`<div class="card">
        <div class="v-div-1">
            <div class="h-div-1">
                <img class="image" src=${drink.strDrinkThumb} alt="failed_to_load">
            </div>
            <div class="h-div-2"></div>
        </div>
        <div class="v-div-2">
          <h1 class="name">${drink.strDrink}</h1></br>
          <div class="text">Instructions: ${drink.strInstructions}</div></br>
        </div>
      </div>`;
    })
}

get_docs(update_cards);
const intervalId = setInterval(get_docs, 15000, update_cards);