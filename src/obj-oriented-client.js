import { windowBehavior, addMessage } from './utilities.js';
import Connection from './connection.js';
import User from './user.js';
import Message from './message.js';
import $ from 'jquery';

/**
 * The user using this client
 * @type {User}
 */
export let thisUser;

export function setUser(user)
{
    thisUser = user;
}

export function wipe()
{
    $('#join').off();
    $('#input').off();

    const username = document.getElementById('input').value;
    Connection.register(username).then(user => {
        thisUser = user;

        if (thisUser === undefined)
        {
            return;
        }

        document.body.removeChild(document.getElementById('text'));
        document.body.removeChild(document.getElementById('input'));
        document.body.removeChild(document.getElementById('join'));

        if (Array(...document.body.children).find((elmnt) => elmnt.id === 'h4') !== undefined)
        {
            document.body.removeChild(document.getElementById('h4'));
        }
    
        const input = document.createElement('input');
        input.setAttribute('id', 'input');
        input.setAttribute('name', 'message');
        input.setAttribute('type', 'text');
        input.autocomplete = 'off';
    
        const button = document.createElement('button');
        button.setAttribute('id', 'submit');
        button.textContent = 'Send';
    
        const inputRow = document.createElement('tr');
        inputRow.appendChild(input);
        inputRow.appendChild(button);
        inputRow.id = 'inputRow';
    
        const board = document.createElement('table');
        board.setAttribute('class', 'messageBoard');
        board.setAttribute('id', 'messageBoard');
        board.appendChild(inputRow);
        document.body.appendChild(board);
        input.focus();
    
        document.removeEventListener('keydown', windowBehavior);
        document.addEventListener('keydown', (evt) => {
            if (evt.keyCode === 13 && evt.target === input)
            {
                button.dispatchEvent(new MouseEvent('click'));
            }
        });
    
        button.addEventListener('click', () => {
            if (input.value.trim().length === 0) return;
            let message = new Message(input.value.trim(), thisUser);
            board.insertBefore(message.render(), inputRow);
            input.value = '';
            input.focus();
            Connection.message(message);
            addMessage(message);
        });
    });
}

window.addEventListener('load', () => {
    document.getElementById('join').addEventListener('click', () => wipe());
    document.getElementById('input').focus();

    document.addEventListener('keydown', windowBehavior);
});

window.addEventListener('contextmenu', (evt) => {
    if (evt.target.classList.contains('message'))
    {
        evt.preventDefault();
    }
});