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

export const thisIcon = new Image();

export function wipe()
{
    $('#join').off();
    $('#input').off();
    $('#inputDiv').off().remove();

    const username = document.getElementById('input').value;
    Connection.register(username).then(user => {
        thisUser = user;

        if (thisUser === null)
        {
            return;
        }

        $('#text').remove();
        $('#input').remove();
        $('#join').remove();

        if (Array(...document.body.children).find((elmnt) => elmnt.id === 'h4') !== undefined)
        {
            document.body.removeChild(document.getElementById('h4'));
        }

        $('<table id = "messageBoard" class = "messageBoard"></table>').appendTo(document.body);
        $('<tr id = "inputRow"></tr>').appendTo($('#messageBoard'));
        const input = $('<input id = "input" name = "message" type = "text" autocomplete = "off"/>').appendTo('#inputRow').get(0);
        const button = $('<button id = "submit">Send</button>').appendTo('#inputRow').get(0);
        input.focus();
        $('<table id = "userList"></table>').appendTo(document.body);
        $('<table id = "channelList"></table>').appendTo(document.body);
        $('<tr><td class = "channelEntry selected">main</td></tr>').appendTo($('#channelList'));
        $('<tr><td id = "addChannel">+</td></tr>').on('click', () => {
            const newName = prompt('What would you like to name the new channel?', 'New Channel');
            $(`<tr><td class = "channelEntry">${newName}</td></tr>`).insertBefore($('#addChannel'));
        }).appendTo('#channelList');
    
        $(document).off('keydown');
        $(document).on('keydown', (evt) => {
            if (evt.keyCode === 13 && evt.target === input)
            {
                button.dispatchEvent(new MouseEvent('click'));
            }
        });
    
        $(button).on('click', () => {
            if (input.value.trim().length === 0) return;
            let message = new Message(input.value.trim(), thisUser);
            $(message.render()).insertBefore(inputRow);
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

    const editDiv = document.getElementById('inputDiv');

    $(editDiv).on('dragenter', (evt) =>{
        evt.preventDefault();
        evt.stopPropagation();

        editDiv.style.backgroundColor = 'crimson';
    });

    $(editDiv).on('dragover', (evt) => {
        evt.preventDefault();
        evt.stopPropagation();

        editDiv.style.backgroundColor = 'crimson';
    });

    $(editDiv).on('dragleave', (evt) => {
        evt.preventDefault();
        evt.stopPropagation();

        editDiv.style.backgroundColor = 'seagreen';
    });

    $(editDiv).on('drop', (evt) => {
        evt.preventDefault();
        evt.stopPropagation();

        editDiv.style.backgroundColor = 'seagreen';
        document.getElementById('fileInput').files = evt.originalEvent.dataTransfer.files;
        document.getElementById('fileInput').dispatchEvent(new Event('change'));
    });

    $('#fileInput').on('change', () => {
        const fr = new FileReader();
        fr.addEventListener('load', () => {
            thisIcon.src = fr.result;
        });
        fr.readAsDataURL(document.getElementById('fileInput').files[0]);
    });

    $(document).on('keydown', windowBehavior);
});

window.addEventListener('contextmenu', (evt) => {
    if (evt.target.classList.contains('message'))
    {
        evt.preventDefault();
    }
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible')
    {
        window.scrollBy({ top: window.outerHeight });
    }
});