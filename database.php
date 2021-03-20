<?php
    // Content of database.php
    // This connects the database to our php
    $mysqli = new mysqli('localhost', 'nashphp', 'PASSWORD', 'chat_room');

    if($mysqli->connect_errno) {
        printf("Connection Failed: %s\n", $mysqli->connect_error);
        exit;
    }
?>