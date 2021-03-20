<?php
    ini_set("session.cookie_httponly", 1);
    session_start();

    
    require 'database.php'; 

    //Because you are posting the data via fetch(), php has to retrieve it elsewhere.
    $json_str = file_get_contents('php://input');
    //This will store the data into an associative array
    $json_obj = json_decode($json_str, true);


    $username = (string)$json_obj['username'];
    $pwd_guess = (string)$json_obj['password'];
    

    // Use a prepared statement
    $stmt = $mysqli->prepare("SELECT id, password FROM users WHERE username=?");
    
    // Bind the parameter
    $stmt->bind_param('s', $username);
    
    $stmt->execute();
    
    // Bind the results
    $stmt->bind_result($user_id, $pwd_hash);
    $stmt->fetch();
    
    // Compare the submitted password to the actual password hash
    if(password_verify($pwd_guess, $pwd_hash))
    {
        // Login succeeded! 
        
        session_start();
        $_SESSION['username'] = $username;
        $_SESSION['user_id'] = $user_id;
        //echo $_SESSION['username'];
        
        $_SESSION['token'] = bin2hex(openssl_random_pseudo_bytes(32)); 
    
        echo json_encode(array(
            "success" => true,
            "session_username" => $_SESSION['username'],
            "session_id" => $_SESSION['user_id'],
            'token' => $_SESSION['token']
            
        ));
        exit;
    }
    
    // login failed
    else
    {
        echo json_encode(array(
            "success" => false,
            "message" => "Incorrect Username or Password"
        ));
        exit;
    }
    
    
    

?>