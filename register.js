function registerAjax(event) {
    const username = document.getElementById("create_user").value; // Get the username from the form
    const password = document.getElementById("create_pass").value; // Get the password from the form
    // Make a URL-encoded string for passing POST data: 
    //WANT TO CLARFIY WHAT IS GOING ON HERE. I DON'T REALLY KNOW
    const data = {
        'username': username,
        'password': password,
        
    };

    fetch("php_register.php", {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'content-type': 'application/json'
            }
        })
        .then(res => res.json())
        .then(function(response) {
            const register_object = response;
            if (register_object.success == true) {
               

            } else {
                console.log(`You were not logged in ${register_object.message}`);
            }

        })
        .catch(err => console.error(err));

}
document.getElementById("register_button").addEventListener("click", registerAjax, false); // Bind the AJAX call to button click