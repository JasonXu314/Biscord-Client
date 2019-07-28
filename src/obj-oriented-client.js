import { windowBehavior } from './utilities.js';
import Connection from './connection.js';
import User from './user.js';
import Message from './message.js';

/**
 * The user using this client
 * @type {User}
 */
export let thisUser;

function wipe()
{
    const username = document.getElementById('input').value;
    thisUser = await Connection.register(username);

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

    const button = document.createElement('button');
    button.setAttribute('id', 'submit');
    button.textContent = 'Send';

    const inputRow = document.createElement('tr');
    inputRow.appendChild(input);
    inputRow.appendChild(button);

    const board = document.createElement('table');
    board.setAttribute('class', 'messageBoard');
    board.setAttribute('id', 'messageBoard');
    board.appendChild(inputRow);
    document.body.appendChild(board);

    document.removeEventListener('keydown', windowBehavior);
    document.addEventListener('keydown', (evt) => {
        if (evt.keyCode === 13 && evt.target === input)
        {
            button.dispatchEvent(new MouseEvent('click'));
        }
    });

    button.addEventListener('click', () => {
        let message = new Message(input.value, thisUser);
        board.appendChild(message.render());
    })
}

window.addEventListener('load', () => {
    document.getElementById('join').addEventListener('click', wipe());
    document.getElementById('input').focus();

    document.addEventListener('keydown', windowBehavior);
});

window.addEventListener('contextmenu', (evt) => {
    if (evt.target.className === 'message')
    {
        evt.preventDefault();
    }
});