import { windowBehavior, addUser, addMessage, retrieveMessage, removeMessage, removeUser, retrieveCard, hasChannel, addChannel, fetchMessagesByChannel } from './utilities.js';
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
            connection.addEventListener('open', () => {
                connection.send(JSON.stringify({
                    type: 'registration',
                    name: username
                }));
                connection.addEventListener('message', (msg) => {
                    if (JSON.parse(msg.data).type === 'rejection')
                    {
                        $(document.body.children).remove();
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
                                        console.log('message');
                                        let message = Message.CreateMessage(JSON.parse(msg.data).message.messageRaw, {
                                            username: JSON.parse(msg.data).message.author.username,
                                            id: JSON.parse(msg.data).message.author.id,
                                            icon: JSON.parse(msg.data).message.author.icon
                                        }, JSON.parse(msg.data).message.id, JSON.parse(msg.data).message.edits, JSON.parse(msg.data).message.channel);
                                        if (JSON.parse(msg.data).message.channel === currentChannel)
                                        {
                                            $(message.render()).insertBefore($('#inputRow'));
                                            window.scrollBy({ top: window.outerHeight });
                                            $('#messageBoard').scrollTop($('#messageBoard').height() * fetchMessagesByChannel(currentChannel).length / 14 + 600);
                                        }
                                        addMessage(message);
                                    }
                                    break;
                                case ('delete'):
                                    console.log('delete');
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
                                    console.log('edit');
                                    if (!thisUser.check(JSON.parse(msg.data).creds))
                                    {
                                        retrieveMessage(JSON.parse(msg.data).id).edit(JSON.parse(msg.data).creds, JSON.parse(msg.data).newMsgRaw);
                                    }
                                    break;
                                case ('join'):
                                    console.log('join');
                                    addUser(User.DummyUser(JSON.parse(msg.data).user.username, JSON.parse(msg.data).user.id, JSON.parse(msg.data).user.icon.src));
                                    const tr = document.createElement('tr');
                                    tr.id = JSON.parse(msg.data).user.id;
                                    const icon = new Image(50, 50);
                                    icon.src = JSON.parse(msg.data).user.icon.src;
                                    $(icon).css('border', '3px solid black');
                                    icon.onload = () => tr.prepend(icon);
                                    const userEntry = document.createElement('td');
                                    userEntry.className = 'userEntry';
                                    userEntry.textContent = JSON.parse(msg.data).user.username;
                                    userEntry.id = `${JSON.parse(msg.data).user.id}entry`;
                                    $(userEntry).css('width', '190px');
                                    $(userEntry).on('contextmenu', (evt) => evt.preventDefault());
                                    $(userEntry).on('click', (evt) => {
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
                                    console.log('disconnect');
                                    removeUser(JSON.parse(msg.data).user.id);
                                    document.getElementById('userList').removeChild(document.getElementById(JSON.parse(msg.data).user.id));
                                    break;
                                case ('createChannel'):
                                    if (hasChannel(JSON.parse(msg.data).name))
                                    {
                                        return;
                                    }
                                    $(`<tr><td class = "channelEntry">${JSON.parse(msg.data).name}</td></tr>`).insertBefore($('#addChannelTR')).children().on('click', function(evt) {
                                        if (evt.target === this)
                                        {
                                            fetchMessagesByChannel(currentChannel).forEach((msg) => {
                                                $(msg.element).remove();
                                            });
                                            $('.selected').get(0).classList.remove('selected');
                                            setCurrentChannel(this.textContent);
                                            this.classList.add('selected');
                                            fetchMessagesByChannel(currentChannel).forEach((msg) => {
                                                $(msg.render()).insertBefore($('#inputRow'));
                                            });
                                            document.getElementById('input').focus();
                                        }
                                    });
                                    addChannel(JSON.parse(msg.data).name);
                                    break;
                                case ('ping'):
                                    connection.send(JSON.stringify({ type: 'pong' }));
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
                    name: options.name
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
        connection.send(JSON.stringify({
            type: 'message',
            message: msg
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