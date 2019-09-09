import { windowBehavior, addUser, addMessage, retrieveMessage, removeMessage, removeUser, retrieveCard, hasChannel, addChannel, fetchMessagesByChannel, retrieveUserByID, ownsChannel, deleteChannel, editChannel } from './utilities.js';
import User from './user.js';
import Message from './message.js';
import { thisUser, wipe, thisIcon, currentChannel, setCurrentChannel } from './obj-oriented-client.js';
import $ from 'jquery';

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
     * Connection class should not be instantiated; all attempts will be treated as invasion attempts
     * @private
     */
    constructor() {
        alert ('Warning: malicious code detected');
        if (!connection)
        {
            connection = new WebSocket('ws://10.10.66.51:3000');
            connection.onopen = () => connection.send(JSON.stringify({
                type: 'emergency',
                message: 'Connection instantiated'
            }));
            connection.close();
        }
        else
        {
            connection.send(JSON.stringify({
                type: 'emergency',
                message: 'Connection instantiated'
            }));
            connection.close();
        }
        try
        {
            location.reload();
            process.exit();
        }
        catch (err) {}
    }

    /**
     * Used to initialize the connection, polls the server to register a nickname
     * @param {String} username the username the client is registering with
     * @returns {Promise<User | null>} the user that is registered
     */
    static register(username)
    {
        /** @type {User | null} */
        let user = null;
        return new Promise((resolve, reject) => {
            connection = new WebSocket('ws://10.10.66.51:3000');
            connection.onerror = (evt) => {
                alert(`Error occured during connection establishment; refreshing now (Error: ${evt})`);
                location.reload();
            }
            connection.addEventListener('open', () => {
                connection.send(JSON.stringify({
                    type: 'registration',
                    name: username
                }));
                connection.addEventListener('message', (msg) => {
                    if (JSON.parse(msg.data).type === 'rejection')
                    {
                        $(document.body.children).remove();
                        $('<h3 id = "text" style = "color: rgb(115, 138, 219)">Please enter a username</h3>')
                            .appendTo(document.body);
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
                        $('<div id = "inputDiv" style = "background-color: crimson; border: 2px solid black; width: 250px; height: 50px"><input type = "file" name = "icon" id = "fileInput" style = "position: relative; top: 15px; left: 25px"/></div>')
                        .appendTo(document.body)
                        .on('dragenter', (evt) => {
                            evt.preventDefault();
                            evt.stopPropagation();
                    
                            editDiv.style.backgroundColor = 'seagreen';
                        }).on('dragover', (evt) => {
                            evt.preventDefault();
                            evt.stopPropagation();
                    
                            editDiv.style.backgroundColor = 'seagreen';
                        }).on('dragleave', (evt) => {
                            evt.preventDefault();
                            evt.stopPropagation();
                    
                            editDiv.style.backgroundColor = 'crimson';
                        }).one('drop', (evt) => {
                            evt.preventDefault();
                            evt.stopPropagation();
                    
                            editDiv.style.backgroundColor = 'seagreen';
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

                        document.addEventListener('keydown', windowBehavior);
                        
                        connection = null;
                        resolve(user);
                        return;
                    }
                    else if (JSON.parse(msg.data).type === 'success')
                    {
                        user = new User(username, thisIcon.src);
                        resolve(user);
                        connection.send(JSON.stringify({
                            type: 'update',
                            user: user
                        }));
                        connection.addEventListener('message', (msg) => {
                            switch (JSON.parse(msg.data).type)
                            {
                                case ('message'):
                                    if (JSON.parse(msg.data).message.author.id !== thisUser.id)
                                    {
                                        const dataMsg = JSON.parse(msg.data).message;
                                        let message = Message.CreateMessage(dataMsg.messageRaw, retrieveUserByID(dataMsg.author.id), dataMsg.id, dataMsg.edits, dataMsg.channel, dataMsg.attachments);
                                        addMessage(message);
                                        if (message.channel === currentChannel)
                                        {
                                            $(message.render()).insertBefore($('#inputRow'));
                                            window.scrollBy({ top: window.outerHeight });
                                            $('#messageBoard').scrollTop($('#messageBoard').height() * fetchMessagesByChannel(currentChannel).length / 14 + 600);
                                        }
                                    }
                                    break;
                                case ('delete'):
                                    if (!thisUser.check(JSON.parse(msg.data).creds))
                                    {
                                        const delMessage = retrieveMessage(JSON.parse(msg.data).id);
                                        if (delMessage.mentions.includes(`<@${thisUser.id}>`))
                                        {
                                            document.title = `${document.title.match(/\d+/) === null ? '' : parseInt(document.title.match(/\d+/)[0]) - 1 <= 0 ? '' : `${parseInt(document.title.match(/\d+/)[0]) - 1}🔴 `}🅱iscord`;
                                        }
                                        delMessage.delete(JSON.parse(msg.data).creds, true);
                                        removeMessage(JSON.parse(msg.data).id);
                                    }
                                    break;
                                case ('edit'):
                                    if (!thisUser.check(JSON.parse(msg.data).creds))
                                    {
                                        retrieveMessage(JSON.parse(msg.data).id).edit(JSON.parse(msg.data).creds, JSON.parse(msg.data).newMsgRaw);
                                    }
                                    break;
                                case ('join'):
                                    addUser(User.DummyUser(JSON.parse(msg.data).user.username, JSON.parse(msg.data).user.id, JSON.parse(msg.data).user.icon.src));
                                    if (JSON.parse(msg.data).user.id === 0 || JSON.parse(msg.data).user.id === 1) return;
                                    const tr = document.createElement('tr');
                                    tr.id = JSON.parse(msg.data).user.id;
                                    const icon = new Image(50, 50);
                                    icon.src = JSON.parse(msg.data).user.icon.src;
                                    $(icon).css('border', '3px solid black')
                                        .css('border-radius', '28px');
                                    icon.onload = () => tr.prepend(icon);
                                    const userEntry = document.createElement('td');
                                    userEntry.className = 'userEntry';
                                    userEntry.id = `${JSON.parse(msg.data).user.id}entry`;
                                    $(userEntry).css('width', '190px')
                                        .text(JSON.parse(msg.data).user.username)
                                        .on('contextmenu', (evt) => evt.preventDefault())
                                        .on('click', (evt) => {
                                            if (evt.target === userEntry && !evt.ctrlKey)
                                            {
                                                if (document.getElementById(`${JSON.parse(msg.data).user.id}info`) === null)
                                                {
                                                    const card = retrieveCard(JSON.parse(msg.data).user.id).render();
                                                    card.setAttribute('style', `left: ${evt.clientX + 225 > window.innerWidth ? evt.clientX - 225 : evt.clientX + 25}px; top: ${evt.clientY + 25}px`);
                                                    document.body.appendChild(card);
                                                    $(document).on('mousemove', (evt) => {
                                                        if (evt.target === userEntry)
                                                        {
                                                            card.setAttribute('style', `left: ${evt.clientX + 225 > window.innerWidth ? evt.clientX - 225 : evt.clientX + 25}px; top: ${evt.clientY + 25}px`);
                                                        }
                                                    });
                                                    $(userEntry).one('mouseout', (evt) => {
                                                        if (evt.target === userEntry)
                                                        {
                                                            document.body.removeChild(card);
                                                            $(document).off('mousemove');
                                                        }
                                                    });
                                                    $(userEntry).one('click', (evt) => {
                                                        if (evt.target === userEntry && evt.ctrlKey)
                                                        {
                                                            $(document).off('mousemove');
                                                            $(userEntry).off('mouseout');
                                                            $(document).one('click', () => {
                                                                document.body.removeChild(card);
                                                            });
                                                            evt.stopImmediatePropagation();
                                                        }
                                                    });
                                                }
                                                else
                                                {
                                                    document.body.removeChild(document.getElementById(`${JSON.parse(msg.data).user.id}info`));
                                                    $(document).off('mousemove');
                                                    $(userEntry).off('mouseout');
                                                }
                                            }
                                        });
                                    tr.appendChild(userEntry);
                                    document.getElementById('userList').appendChild(tr);
                                    break;
                                case ('disconnect'):
                                    removeUser(JSON.parse(msg.data).user.id); 
                                    $('#userList').children(`#${JSON.parse(msg.data).user.id}`).remove();
                                    break;
                                case ('createChannel'):
                                    if (hasChannel(JSON.parse(msg.data).name))
                                    {
                                        return;
                                    }
                                    $(`<tr id = "channel${JSON.parse(msg.data).name.replace(' ', '_')}"><td class = "channelEntry">${JSON.parse(msg.data).name}</td></tr>`).insertBefore($('#addChannelTR'))
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
                                                                            if (thisChannel === currentChannel)
                                                                            {
                                                                                $('#channelmain').children().click();
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
                                                                                alert("Please do not try to edit other peoples' channels!");
                                                                                return;
                                                                            }
                                                                            const newName = prompt('What would you like to rename the channel to?', $(this).siblings().text());
                                                                            if (newName === null)
                                                                            {
                                                                                return;
                                                                            }
                                                                            if (newName.trim().length === 0)
                                                                            {
                                                                                if (thisChannel === currentChannel)
                                                                                {
                                                                                    $('#channelmain').children().click();
                                                                                }
                                                                                deleteChannel(thisChannel);
                                                                                Connection.request('deleteChannel', {
                                                                                    name: thisChannel
                                                                                });
                                                                                $(this).parent().off().remove();
                                                                            }
                                                                            if (hasChannel(newName))
                                                                            {
                                                                                alert('Channel already exists with that name!');
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
                                    if (addChannel(JSON.parse(msg.data).name, retrieveUserByID(JSON.parse(msg.data).user.id)) === 1)
                                    {
                                        $('.channelEntry').addClass('selected');
                                        setCurrentChannel('main');
                                    }
                                    break;
                                case ('deleteChannel'):
                                    deleteChannel(JSON.parse(msg.data).name);
                                    $(`#channel${JSON.parse(msg.data).name.replace(' ', '_')}`).off().remove();
                                    break;
                                case ('editChannel'):
                                    editChannel(JSON.parse(msg.data).name, JSON.parse(msg.data).newName);
                                    $(`#channel${JSON.parse(msg.data).name.replace(' ', '_')}`).attr('id', `#channel${JSON.parse(msg.data).newName.replace(' ', '_')}`).children('td').text(JSON.parse(msg.data).newName);
                                    break;
                            }
                        });
                        connection.addEventListener('close', (evt) => {
                            if (evt.code === 4069 && evt.reason === 'Lost Connection')
                            {
                                alert('You have lost connection to the server; please refresh to reconnect!');
                            }
                            else
                            {
                                alert('Error: Socket Closed Unexpectedly');
                                console.log(evt.code, evt.reason);
                            }
                        });
                    }
                }, { once: true });
            }, { once: true });
        });
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
        if (connection.readyState === 0)
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
                    creds: options.creds
                }));
                break;
            case ('edit'):
                connection.send(JSON.stringify({
                    type: 'edit',
                    id: options.id,
                    newMsgRaw: options.newMsgRaw,
                    newMsgDisplay: options.newMsgDisplay,
                    oldMsgDisplay: options.oldMsgDisplay,
                    creds: options.creds
                }));
                break;
            case ('createChannel'):
                connection.send(JSON.stringify({
                    type: 'createChannel',
                    name: options.name,
                    user: thisUser
                }));
                break;
            case ('deleteChannel'):
                connection.send(JSON.stringify({
                    type: 'deleteChannel',
                    name: options.name
                }));
                break;
            case ('editChannel'):
                connection.send(JSON.stringify({
                    type: 'editChannel',
                    name: options.name,
                    newName: options.newName
                }));
                break;
        }
    }

    /**
     * Sends a message to the server
     * @param {Message} msg the message to send
     */
    static message(msg)
    {
        setTimeout(() => {
            connection.send(JSON.stringify({
                type: 'message',
                message: msg
            }));
        }, 250);
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