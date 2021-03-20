function registerAjax(event) {
    const username = document.getElementById("create_user").value; // Get the username from the form
    const password = document.getElementById("create_pass").value; // Get the password from the form
    const first_name = document.getElementById("create_first").value;
    const last_name = document.getElementById("create_last").value;
    // Make a URL-encoded string for passing POST data: 
    //WANT TO CLARFIY WHAT IS GOING ON HERE. I DON'T REALLY KNOW
    const data = {
        'username': username,
        'password': password,
        'first_name': first_name,
        'last_name': last_name
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
                //If we register a user successfully, then we are logged in as well.
                console.log('Manipulate DOM to show Calender. Registration successful');
                $('#user_display').text(escapeHtml(register_object.session_username));
                console.log("csrf token is: " + register_object.token);
                $('#add_csrf_token').val(register_object.token);
                $('#edit_csrf_token').val(register_object.token);
                $('#share_calendar').text('Share Calendar');


                $('#reg_button').hide();
                $('#login_button').hide();
                $('#logout_button').show();
                display_popup(".reg_popup", false);
                logged_in = true;
                refresh_html();

            } else {
                console.log(`You were not logged in ${register_object.message}`);
                console.log('0 if no match, 1 if match, false if error: ' + register_object.match);
            }

        })
        .catch(err => console.error(err));

}
document.getElementById("register_button").addEventListener("click", registerAjax, false); // Bind the AJAX call to button click