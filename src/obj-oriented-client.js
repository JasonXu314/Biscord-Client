import { windowBehavior, addMessage, fetchMessagesByChannel, fetchUserLatestMessage, hasChannel, addChannel } from './utilities.js';
import Connection from './connection.js';
import User from './user.js';
import Message from './message.js';
import $ from 'jquery';

/**
 * The user using this client
 * @type {User}
 */
export let thisUser;

/**
 * The current channel the user is viewing
 * @type {string}
 */
export let currentChannel = 'main';
export const thisIcon = new Image();

export function setCurrentChannel(channel)
{
    if (hasChannel(channel))
    {
        currentChannel = channel;
    }
}

export function wipe()
{
    $('#join').off();
    $('#input').off();
    $('#inputDiv').off().remove();

    const username = document.getElementById('input').value;
    if (username.length > 36)
    {
        alert('Usernames must be 36 characters or less!');
        return;
    }
    Connection.register(username).then(user => {
        thisUser = user;
        currentChannel = 'main';

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

        $('<span id = "dummySpan" style = "display:none"></span>').appendTo(document.body);
        $('<table id = "messageBoard" class = "messageBoard"></table>').appendTo(document.body);
        $('<tr id = "inputRow"></tr>').appendTo($('#messageBoard'));
        const input = $('<input id = "input" name = "message" type = "text" autocomplete = "off"/>').appendTo('#inputRow').on('keydown', (evt) => {
            if (evt.target === input && evt.key === 'ArrowUp')
            {
                if (fetchUserLatestMessage(thisUser))
                {
                    fetchUserLatestMessage(thisUser).edit({
                        id: thisUser.id,
                        username: thisUser.username
                    });
                }
            }
        }).on('keyup', function(evt) {
            if (evt.target === this)
            {
                $('#dummySpan').text($(this).val());
                $(this).width($('#dummySpan').width() - 35 < 200 ? 200 : $('#dummySpan').width() - 35);
            }
        }).get(0);
        const button = $('<button id = "submit">Send</button>').appendTo('#inputRow').get(0);
        input.focus();
        $('<table id = "userList"></table>').appendTo(document.body);
        $('<table id = "channelList"></table>').appendTo(document.body);
        $('<tr><td class = "channelEntry selected">main</td></tr>').appendTo($('#channelList')).children().on('click', function(evt) {
            if (evt.target === this)
            {
                fetchMessagesByChannel(currentChannel).forEach((msg) => {
                    $(msg.element).remove();
                });
                $('.selected').get(0).classList.remove('selected');
                currentChannel = this.textContent;
                this.classList.add('selected');
                fetchMessagesByChannel(currentChannel).forEach((msg) => {
                    $(msg.render()).insertBefore($('#inputRow'));
                });
                document.getElementById('input').focus();
            }
        });
        $('<tr id = "addChannelTR"><td id = "addChannel">+</td></tr>').on('click', () => {
            const newName = prompt('What would you like to name the new channel?', 'New Channel');
            if (newName === null)
            {
                return;
            }
            if (hasChannel(newName))
            {
                alert('There already exists a channel with that name!');
                return;
            }
            $(`<tr><td class = "channelEntry">${newName}</td></tr>`).insertBefore($('#addChannelTR')).children().on('click', function(evt) {
                if (evt.target === this)
                {
                    fetchMessagesByChannel(currentChannel).forEach((msg) => {
                        $(msg.element).remove();
                    });
                    $('.selected').get(0).classList.remove('selected');
                    currentChannel = this.textContent;
                    this.classList.add('selected');
                    fetchMessagesByChannel(currentChannel).forEach((msg) => {
                        $(msg.render()).insertBefore($('#inputRow'));
                    });
                    document.getElementById('input').focus();
                }
            });
            addChannel(newName);
            Connection.request('createChannel', { name: newName });
            document.getElementById('input').focus();
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
            if (input.value.trim().length > 2000)
            {
                alert('Character limit is 2000!');
                return;
            }
            let message = new Message(input.value.trim(), thisUser, currentChannel);
            $(message.render()).insertBefore(inputRow);
            input.value = '';
            input.focus();
            Connection.message(message);
            addMessage(message);
            window.scrollBy({ top: window.outerHeight });
            $('#messageBoard').scrollTop($('#messageBoard').height() * fetchMessagesByChannel(currentChannel).length / 14 + 600);
        });
    });
}

window.addEventListener('load', () => {
    document.getElementById('join').addEventListener('click', () => wipe());
    document.getElementById('input').focus();

    const iconDiv = document.getElementById('inputDiv');

    $(iconDiv).on('dragenter', (evt) => {
        evt.preventDefault();
        evt.stopPropagation();

        iconDiv.style.backgroundColor = 'seagreen';
    }).on('dragover', (evt) => {
        evt.preventDefault();
        evt.stopPropagation();

        iconDiv.style.backgroundColor = 'seagreen';
    }).on('dragleave', (evt) => {
        evt.preventDefault();
        evt.stopPropagation();

        iconDiv.style.backgroundColor = 'crimson';
    }).one('drop', (evt) => {
        evt.preventDefault();
        evt.stopPropagation();

        iconDiv.style.backgroundColor = 'seagreen';
        document.getElementById('fileInput').files = evt.originalEvent.dataTransfer.files;
        document.getElementById('fileInput').dispatchEvent(new Event('change'));
    });

    $('#fileInput').on('change', () => {
        if (!(['png', 'jpg'].includes(document.getElementById('fileInput').files[0].name.split('.')[document.getElementById('fileInput').files[0].name.split('.').length - 1])))
        {
            alert('Only .png and.jpg files are supported for icons!');
            return;
        }
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
        $('#messageBoard').scrollTop($('#messageBoard').height() * fetchMessagesByChannel(currentChannel).length / 14 + 600);
    }
});