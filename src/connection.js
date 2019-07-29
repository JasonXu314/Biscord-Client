import { windowBehavior } from './utilities.js';
import { wipe } from './client.js';
import User from './user.js';
import Message from './message.js';
import { thisUser } from './obj-oriented-client.js';

/**
 * Connection to the server
 * @type {WebSocket}
 * @readonly once set
 */
let connection = null;

/**
 * Guardian class for the connection; controls what requests/messages are sent to the server
 */
export default class Connection
{
    /**
     * Connection class should not be instantiated
     * @private
     */
    constructor() {}

    /**
     * Used to initialize the connection, polls the server to register a nickname
     * @param {String} username the username the client is registering with
     * @returns {Promise<User>} the user that is registered
     */
    async static register(username)
    {
        let user = null;
        let finished = false;

        connection = new WebSocket('ws://localhost:3000');
        connection.send(JSON.stringify({
            type: 'registration',
            name: username
        }));
        connection.addEventListener('message', (msg) => {
            if (JSON.parse(msg.data).type === 'rejection')
            {
                Array(...document.body.children).forEach((elmnt) => elmnt.parentElement.removeChild(elmnt));
                let h3 = document.createElement('h3');
                h3.textContent = 'Please enter a username';
                h3.id = 'text';
                document.body.appendChild(h3);
                let h4 = document.createElement('h4');
                h4.textContent = JSON.parse(msg.data).reason;
                h4.classList.add('errorMsg');
                h4.id = 'h4';
                document.body.appendChild(h4);
                let input = document.createElement('input');
                input.id = 'input';
                input.name = 'username';
                input.type = 'text';
                document.body.appendChild(input);
                let button = document.createElement('button');
                button.id = 'join';
                button.textContent = 'Join';
                button.addEventListener('click', () => wipe());
                document.body.appendChild(button);
                input.focus();

                document.addEventListener('keydown', windowBehavior);
                
                connection = null;
                finished = true;
            }
            else if (JSON.parse(msg.data).type === 'success')
            {
                user = new User(username);
                finished = true;
                connection.addEventListener('message', (msg) => {
                    switch (JSON.parse(msg.data).type)
                    {
                        case ('message'):
                            if (JSON.parse(msg.data).id !== thisUser.id)
                            {
                                let message = new Message(...JSON.parse(msg.data).message)
                            }
                    }
                });
            }
        }, true);
        
        while (!finished) {}
        return user;
    }

    /**
     * Submits a request to the server, based on the type of request passed to it
     * @param {string} type 
     * @param {MyRequest} options 
     */
    static request(type, options)
    {
        if (connection === null)
        {
            alert('User has not been registered yet!');
            return;
        }
        if (connection.readyState === 1)
        {
            alert('Connection has not been established yet!');
            return;
        }
        switch (type)
        {
            case ('delete'):
                connection.send(JSON.stringify({
                    type: 'delete',
                    id: options.id,
                    msgID: options.msgID
                }));
                break;
            case ('edit'):
                connection.send(JSON.stringify({
                    type: 'edit',
                    id: options.id,
                    msgID: options.msgID,
                    newMsg: options.newMsg,
                    oldMsg: options.oldMsg
                }))
                break;
        }
    }

    /**
     * Sends a message to the server
     * @param {Message} msg the message to send
     */
    static message(msg)
    {
        connection.send(JSON.stringify({
            type: 'message',
            sender: JSON.stringify(thisUser),
            message: JSON.stringify(msg),
            id: msg.id
        }));
    }

    /**
     * Alerts the server to an emergency, usually that something is wrong
     */
    static alert(cause)
    {
        connection.send(JSON.stringify({
            type: 'emergency',
            message: cause
        }));
    }
}