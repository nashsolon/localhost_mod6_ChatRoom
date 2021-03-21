<?php
    //Preventing against session hijacking
    ini_set("session.cookie_httponly", 1);
    session_start();
    require 'database.php';

    //Because you are posting the data via fetch(), php has to retrieve it elsewhere.
    $json_str = file_get_contents('php://input');
    //This will store the data into an associative array
    $json_obj = json_decode($json_str, true);
        
    //Filtering inputs
    //Here, we are getting the stuff from ajax_register.js. This info is from the data const
    $username = (string)$json_obj['username'];
    $password = $json_obj['password'];

    //Filtering inputs. We use regex to make sure that our user is not using any
    //non-Alphanumeric characters or double .. and __.
    $username_pattern = "/^[a-zA-Z0-9]+([._]?[a-zA-Z0-9]+)*$/";
    $user_match = preg_match($username_pattern, $username);
    if(!$user_match)
    {
        echo json_encode(array(
            "success" => false,
            "message" => "Invalid username. Use only alphanumeric characters and single . or _",
            'match' => $user_match
        ));
        exit;
    }

    $pass_hash = password_hash($password, PASSWORD_DEFAULT);
    
    $user_taken = False;

    if($username == "" or $username == " " or $password == "" or $password == " ")
    {
        exit("Need to have a username and password");
    }

    // Ensuring no duplicate usernames
    $stmt = $mysqli->prepare("select username from users");
    if(!$stmt){
        printf("Query Prep Failed: %s\n", $mysqli->error);
        exit;
    }
    $stmt->execute();
    $result = $stmt->get_result();
    
    while($row = $result->fetch_assoc()){
        if($username == $row["username"])
        {
            // echo json object saying that the username was already taken
            echo json_encode(array(
                "success" => false,
                "message" => "Username is already taken"
            ));
            exit;
            
        }
    }
    
    
    $stmt->close();

    
    
    // This code adds a new user to the database 'users'
    $stmt = $mysqli->prepare("insert into users (username, password) values (?, ?, ?, ?)");
    if(!$stmt){
        printf("Query Prep Failed: %s\n", $mysqli->error);
        exit;
    }

    $stmt->bind_param('ssss', $username, $pass_hash);

    $stmt->execute();

    $stmt->close();

    $stmt = $mysqli->prepare("select id from users where username = ?");
    if(!$stmt){
        printf("Query Prep Failed: %s\n", $mysqli->error);
        exit;
    }

    $stmt->bind_param('s', $username);

    $stmt->execute();
    $stmt->bind_result($user_id);

    $stmt->fetch();

 

    $stmt->close();

    $_SESSION['user_id'] = $user_id;
    $_SESSION['username'] = $username;
   

    // Case for when then username is not taken
        echo json_encode(array(
            "success" => true,
            "session_username" => $_SESSION['username'],
            "pass_hash" => $pass_hash
        ));

?>