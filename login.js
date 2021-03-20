function loginAjax() {
    const username = document.getElementById("user").value; // Get the username from the form
    const password = document.getElementById("pass").value; // Get the password from the form

    // Make a URL-encoded string for passing POST data:
    const data = {
        'username': username,
        'password': password
    };

    fetch("login_validator.php", {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'content-type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(function(response) {
            const login_object = response;
            if (login_object.success) {
                
                console.log('You were logged in successfully');
                console.log('Your session username is ' + login_object.session_username);
                console.log('Your session id is ' + login_object.session_id);
                $('#user_display').text(escapeHtml(login_object.session_username));
                console.log("csrf token is: " + login_object.token);
                //Adding the csrf token to the node with id add_csrf_token and edit_csrf_token
                $('#add_csrf_token').val(login_object.token);
                $('#edit_csrf_token').val(login_object.token);

                
                $('#reg_button').hide();
                $('#login_button').hide();
                $('#logout_button').show();
                logged_in = true;
                //$('#login_button').hide();
                display_popup(".login_popup", false);
                $('#incorrect_password').hide();
                refresh_html();


            } else {
                console.log(`You were not logged in ${login_object.message}`);
                $('#incorrect_password').show();
                $('#incorrect_password').text("Incorrect username or password");
            }
        })
        .catch(err => console.error(err));
}
