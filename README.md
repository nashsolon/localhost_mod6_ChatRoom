# CSE330 - Module 6 Chat Room
Name: Sasha Chackalackal, ID: 475454, Username: sashachack

Name: Nash Solon, ID: 477477, Username: nashsolon

link: 

## Overview
Note: If you download our files and then run on port 3456, you should be able to access our chat room  by typing in `node chat-server.js` and then continuing to the port on the web browser. We have added a gitignore file to ignore the node_modules directory.

- To login to our chat room. Provide yourself with a username and then click on the arrow to advance to the main room.
- All available rooms will be listed under the header Rooms
- To add a room, click on the plus sign in the top left hand corner of the room panel
    - Provide a room name and password if desired, then click on the arrow.
    - User will then be switched into their new room and given admin powers
- To see a list of users, open up the users panel by clicking on the hamburger button at the top right hand corner of the webpage
- To private message a user, open up the users panel and click on a user's name. You will be given an option to private message.
- Admin powers:
    - Admins need to click on a user name in the users panel to exercise their powers
    - Admins can ban users by clicking on the Ban User button after clicking a certain user name
    - Admins can temporariliy kick users by using the Kick User button


## Creative Portion
Standalone parts:
- Highlighted current room with green text in the rooms list
- Highlighted current user with green text (both in chat and also in the users list)
- Admin user denoted by (admin) on the users list
- Users cannot enter room or username with an already existing name
- Once the chat room log extends past the page, we implemented an automatric scrolling feature

Full parts:
- Typing feature
    - When up to three users are typing, other users can see their uesrnames and that they are typing
    - When more than three users are typing the other users see the number of users that are typing
- Censoring content
    - Upon creating a room, the creator can determine whether or not they want their room to be censored
    - If the room is censored, we chose a selection of words considered profane by the youtube banned words list and, if a user were to type one of these words, the       word would be censored with dashes. ex hello => h----
    - 
- Temporariliy kick a user from a room for a select duration of time
    - Here, the admin can kick a user from the room. However, the admin can select a certain amount of time they would like the user to be kicked for.
    - Admin can select from a drop down menu to select how long to kick for.
