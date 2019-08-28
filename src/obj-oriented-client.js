import { windowBehavior, addMessage, fetchMessagesByChannel, fetchUserLatestMessage, hasChannel, addChannel, canCreate, ownsChannel, deleteChannel, editChannel } from './utilities.js';
import FileSaver from 'file-saver';
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
    const username = document.getElementById('input').value.trim();
    if (username.length > 36)
    {
        alert('Usernames must be 36 characters or less!');
        return;
    }
    if (username.length === 0)
    {
        alert('You must enter a username!');
        return;
    }

    $('#join').off();
    $('#input').off();
    $('#inputDiv').off().remove();

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
        $('<div id = "fileDiv" style = "background-color: crimson; border: 2px solid black; width: 175px;"><input id = "fileInput" type = "file" multiple/></div>')
            .appendTo('#inputRow')
            .on('dragenter', function(evt) {
                evt.preventDefault();
                evt.stopPropagation();
        
                this.style.backgroundColor = 'seagreen';
            }).on('dragover', function(evt) {
                evt.preventDefault();
                evt.stopPropagation();
        
                this.style.backgroundColor = 'seagreen';
            }).on('dragleave', function(evt) {
                evt.preventDefault();
                evt.stopPropagation();
        
                this.style.backgroundColor = 'crimson';
            }).one('drop', function(evt) {
                evt.preventDefault();
                evt.stopPropagation();
        
                this.style.backgroundColor = 'seagreen';
                document.getElementById('fileInput').files = evt.originalEvent.dataTransfer.files;
                document.getElementById('fileInput').dispatchEvent(new Event('change'));
            }).children()
            .on('change', () => {
                const file = document.getElementById('fileInput').files[0];
                if (!['.txt', '.png', '.jpg', '.pdf', '.csv'].includes(file.name.slice(file.name.lastIndexOf('.'))))
                {
                    alert('Warning: Sending a file that is not explicitly supported may have unforseen consequences; 🅱️iscord currently only directly supports .txt, .png, .jpb, .pdf, and .csv files');
                }
            });
        input.focus();
        $('<table id = "userList"></table>').appendTo(document.body);
        $('<table id = "channelList"></table>').appendTo(document.body);
        $('<tr id = "addChannelTR"><td id = "addChannel">+</td></tr>').on('click', () => {
            const newName = prompt('What would you like to name the new channel?', 'New Channel');
            if (newName === null || newName.trim().length === 0)
            {
                return;
            }
            if (hasChannel(newName))
            {
                alert('There already exists a channel with that name!');
                return;
            }
            if (!canCreate())
            {
                alert('You have reached the 5 channel limit!');
                return;
            }
            $(`<tr id = "channel${newName.replace(' ', '_')}"><td class = "channelEntry">${newName}</td></tr>`).insertBefore($('#addChannelTR'))
                .children().on('mouseenter', function(evt) {
                    let fadeInID;
                    let fadeOutID;
                    if (evt.target === this && !$(this).siblings().hasClass('optionsDiv'))
                    {
                        let onMenu = false;
                        const optionsDiv = $('<div class = "optionsDiv">⋮</div>')
                            .css('height', '18px')
                            .css('width', '15px')
                            .css('top', `${$(this).parent().position().top + ($(this).parent().height() - $(this).height())/2 - 6}px`)
                            .css('left', `${$(this).parent().position().left + $(this).parent().width() - 37}px`)
                            .css('opacity', 0)
                            .on('mouseenter', function(evt) {
                                if (evt.target === this)
                                {
                                    onMenu = true;
                                }
                            })
                            .on('mouseout', function(evt) {
                                if (evt.target === this)
                                {
                                    onMenu = false;
                                    if ($(this).children().hasClass('optionsTable'))
                                    {
                                        if (!($(this).siblings().is($(evt.relatedTarget)) || $(this).children().is(evt.relatedTarget)))
                                        {
                                            $(this).siblings().mouseout();
                                        }
                                    }
                                    else if (!$(this).siblings().is($(evt.relatedTarget)))
                                    {
                                        $(this).siblings().mouseout();
                                    }
                                }
                            })
                            .on('click', function expand(evt) {
                                if (evt.target === this)
                                {
                                    $(this)
                                        .css('height', '')
                                        .css('width', '')
                                        .append($('<table class = "optionsTable"></table>')
                                            .append($('<tr><td class = "channelOption">Delete</td></tr>').children()
                                                .on('click', () => {
                                                    const thisChannel = $(this).siblings().text();
                                                    if (!ownsChannel(thisChannel))
                                                    {
                                                        alert("Please do not try to delete other peoples' channels!");
                                                        return;
                                                    }
                                                    deleteChannel(thisChannel);
                                                    Connection.request('deleteChannel', {
                                                        name: thisChannel
                                                    });
                                                    $(this).parent().off().remove();
                                                }).parent())
                                            .append($('<tr><td class = "channelOption">Edit</td></tr>').children()
                                                .on('click', () => {
                                                    const thisChannel = $(this).siblings().text();
                                                    if (!ownsChannel(thisChannel))
                                                    {
                                                        alert("Please do not try to delete other peoples' channels!");
                                                        return;
                                                    }
                                                    const newName = prompt('What would you like to name the new channel?', $(this).siblings().text());
                                                    if (newName === null)
                                                    {
                                                        return;
                                                    }
                                                    if (newName.trim().length === 0)
                                                    {
                                                        alert('Please enter a name for the channel!');
                                                        return;
                                                    }
                                                    editChannel(thisChannel, newName);
                                                    $(this).siblings().text(newName);
                                                    Connection.request('editChannel', {
                                                        name: thisChannel,
                                                        newName: newName
                                                    });
                                                    $(this).siblings().mouseout();
                                                }).parent()))
                                            .off('click', expand);
                                }
                            })
                            .appendTo($(this).parent());
                        fadeInID = setInterval(() => {
                            optionsDiv.css('opacity', `${parseFloat(optionsDiv.css('opacity')) + 0.01}`);
                            if (parseFloat(optionsDiv.css('opacity')) === 1)
                            {
                                clearInterval(fadeInID);
                            }
                        }, 5);
                        $(this).on('mouseout', function mouseOutBehavior(evt) {
                            if (evt.target === this)
                            {
                                setTimeout(() => {
                                    if (!onMenu)
                                    {
                                        fadeOutID = setInterval(() => {
                                            clearInterval(fadeInID);
                                            optionsDiv.css('opacity', `${parseFloat(optionsDiv.css('opacity')) - 0.01}`);
                                            if (parseFloat(optionsDiv.css('opacity')) === 0)
                                            {
                                                clearInterval(fadeOutID);
                                                optionsDiv.remove();
                                                $(this).off('mouseout', mouseOutBehavior);
                                            }
                                        }, 5);
                                    }
                                }, 5);
                            }
                        });
                    }
                    else
                    {
                        clearInterval(fadeOutID);
                        const optionsDiv = $(this).children().has('.optionsDiv');
                        fadeInID = setInterval(() => {
                            optionsDiv.css('opacity', `${parseFloat(optionsDiv.css('opacity')) + 0.01}`);
                            if (parseFloat(optionsDiv.css('opacity')) === 1)
                            {
                                clearInterval(fadeInID);
                            }
                        }, 5);
                    }
                })
                .on('click', function(evt) {
                    if (evt.target === this)
                    {
                        fetchMessagesByChannel(currentChannel).forEach((msg) => {
                            $(msg.element).remove();
                        });
                        $('.selected').removeClass('selected');
                        setCurrentChannel(this.textContent);
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