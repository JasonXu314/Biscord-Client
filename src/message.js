import Connection from './connection.js';
import User from './user.js';
import { thisUser } from './obj-oriented-client.js';
import { innerBehavior } from './utilities.js';

export default class Message
{
    /**
     * To construct a message given input from the send field
     * @param {string} message text to be sent by the message
     * @param {User} sender the sender of the message
     */
    constructor(message, sender)
    {
        /**
         * The message conveyed by this Message
         * @type {string}
         */
        this.message = message;

        /**
         * The sender of this Message
         * @type {User}
         */
        this.author = sender;

        /**
         * The UUID of this message
         * @type {number}
         * @readonly
         */
        this.id = Date.now();

        /**
         * A list of people this Message mentions - should not be modified
         * @type {Array<string>}
         * @readonly
         */
        this.mentions = new Array(...message.match(/<@(?:\d){13}>/));

        /**
         * A list of messages this message conveyed in the past
         * Arranged in order of first edited to last edited
         * @type {Array<string>}
         * @readonly
         */
        this.edits = new [];

        this.element = document.createElement('tr');
        this.msg = document.createElement('td');
        this.msg.textContent = `${this.author.username}: ${this.message}`;
        this.msg.id = this.id;
        this.msg.classList.add('message');
        if (this.mentions.includes(`<@${thisUser.id}>`))
        {
            if (document.visibilityState === 'hidden')
            {
                document.title = `${document.title.match(/\d*/).length === 0 ? 1 : ++Number(document.title.match(/\d*/)[0])}\u1F534 \u1F171iscord`;
                document.addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'visible')
                    {
                        document.title = '\u1F171iscord';
                        window.scrollBy({
                            top: window.outerHeight
                        });
                    }
                }, { once: true });
            }
        }
        this.msg.addEventListener('auxclick', this.delete());
        msg.addEventListener('click', (evt) => {
            if (evt.target === this.msg)
            {
                this.element.removeChild(this.msg);
                let editor = document.createElement('input');
                editor.id = 'editor';
                const behavior = (evt) => {
                    if (evt.code === 'Enter')
                    {
                        this.edit(editor.value, {
                            username: thisUser.username,
                            id: thisUser.id
                        });
                    }
                };
                const escBehavior = (evt) => {
                    if (evt.code === 'Escape' && evt.target === editor)
                    {
                        if (document.getElementById(`${this.id}sub`) !== null)
                        {
                            let sub = this.element.removeChild(document.getElementById(`${this.id}sub`));
                            this.element.appendChild(msg);
                            this.element.appendChild(sub);
                            this.element.removeChild(editor);
                            document.removeEventListener('keydown', behavior);
                            document.removeEventListener('keydown', escBehavior);
                        }
                        else
                        {
                            this.element.removeChild(editor);
                            this.element.appendChild(msg);
                            document.removeEventListener('keydown', behavior);
                            document.removeEventListener('keydown', escBehavior);
                        }
                    }
                };
                document.addEventListener('keydown', escBehavior);
                this.element.appendChild(editor);
                editor.focus();
            }
        });
    }

    /**
     * Creates a message from given metadata, should only be used when creating dummy messages received from server
     * @param {string} message the text contained in the message
     * @param {UserShell} sender the user sending the message
     * @param {number} id the UUID of the message
     * @param {string[]} mentions the users mentioned by the message
     * @param {string[]} edits the edit history of the message
     */
    static CreateMessage(message, sender, id, mentions, edits)
    {
        const newMsg = new Message(message, User.DummyUser(sender.name, sender.id))
        newMsg.id = id;
        newMsg.mentions = mentions;
        newMsg.edits = edits;

        newMsg.element = document.createElement('tr');
        newMsg.msg = document.createElement('td');
        newMsg.msg.textContent = `${newMsg.author.username}: ${newMsg.message}`;
        newMsg.msg.id = newMsg.id;
        newMsg.msg.classList.add('message');
        if (newMsg.mentions.includes(`<@${thisUser.id}>`))
        {
            newMsg.msg.style = 'bgcolor:rgb(206, 184, 87)';
            if (document.visibilityState === 'hidden')
            {
                document.title = `${document.title.match(/\d*/).length === 0 ? 1 : ++Number(document.title.match(/\d*/)[0])}\u1F534 \u1F171iscord`;
                document.addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'visible')
                    {
                        document.title = '\u1F171iscord';
                        window.scrollBy({
                            top: window.outerHeight
                        });
                    }
                }, { once: true });
            }
        }
        if (edits.length !== 0)
        {
            const sub = document.createElement('sub');
            sub.textContent = `edited (${edits.length})`;
            sub.id = `${id}sub`;
            sub.addEventListener('mouseover', (evt) => {
                let display = document.createElement('div');
                display.id = 'editDiv';
                let editBoard = document.createElement('table');
                display.appendChild(editBoard);
                display.setAttribute('style', `top:${evt.pageY - 45}px;left:${evt.pageX - 45}px;position:absolute;`);
                editBoard.setAttribute('class', 'messageBoard');
                edits.forEach((editMsg) => {
                    let editTr = document.createElement('tr');
                    let editTd = document.createElement('td');
                    editTd.textContent = editMsg;
                    editTd.setAttribute('class', 'message');
                    editTr.appendChild(editTd);
                    editBoard.appendChild(editTr);
                });
                display.appendChild(editBoard);
                document.body.appendChild(display);
                document.addEventListener('mousemove', innerBehavior);
            });
            sub.addEventListener('mouseout', () => {
                document.body.removeChild(document.getElementById('editDiv'));
                document.removeEventListener('mousemove', innerBehavior)
            });
        }
        newMsg.msg.addEventListener('auxclick', newMsg.delete());
        msg.addEventListener('click', (evt) => {
            if (evt.target === newMsg.msg)
            {
                newMsg.element.removeChild(newMsg.msg);
                let editor = document.createElement('input');
                editor.id = 'editor';
                const behavior = (evt) => {
                    if (evt.code === 'Enter')
                    {
                        newMsg.edit(editor.value, {
                            username: thisUser.username,
                            id: thisUser.id
                        });
                    }
                };
                const escBehavior = (evt) => {
                    if (evt.code === 'Escape' && evt.target === editor)
                    {
                        if (document.getElementById(`${id}sub`) !== null)
                        {
                            let sub = newMsg.element.removeChild(document.getElementById(`${id}sub`));
                            newMsg.element.appendChild(msg);
                            newMsg.element.appendChild(sub);
                            newMsg.element.removeChild(editor);
                            document.removeEventListener('keydown', behavior);
                            document.removeEventListener('keydown', escBehavior);
                        }
                        else
                        {
                            newMsg.element.removeChild(editor);
                            newMsg.element.appendChild(msg);
                            document.removeEventListener('keydown', behavior);
                            document.removeEventListener('keydown', escBehavior);
                        }
                    }
                };
                document.addEventListener('keydown', escBehavior);
                newMsg.element.appendChild(editor);
                editor.focus();
            }
        });
        
        return newMsg;
    }

    /**
     * Function to render the message onto the DOM
     * @returns a DOM Element containing the message
     */
    render()
    {
        return this.element;
    }

    /**
     * Deletes this message
     * @param {UserCredentials} creds
     */
    delete(creds)
    {
        if (this.author.check(creds))
        {
            Connection.request('delete', {
                id: this.author.id,
                msgID: this.id
            });
            document.removeChild(this.element);
        }
        else
        {
            alert("Please do not try to delete other peoples' messages!");
        }
    }

    /**
     * Edits this message to say
     * @param {string} newMsg
     * @param {UserCredentials} creds
     */
    edit(newMsg, creds)
    {
        if (this.author.check(creds))
        {
            Connection.request('edit', {
                id: this.author.id,
                msgID: this.id,
                newMsg: newMsg,
                oldMsg: this.message
            });
            this.msg.textContent = newMsg;
            if (this.edits.length === 0)
            {
                const sub = document.createElement('sub');
                sub.textContent = `edited (${this.edits.length})`;
                sub.id = `${this.id}sub`;
                sub.addEventListener('mouseover', (evt) => {
                    let display = document.createElement('div');
                    display.id = 'editDiv';
                    let editBoard = document.createElement('table');
                    display.appendChild(editBoard);
                    display.setAttribute('style', `top:${evt.pageY - 45}px;left:${evt.pageX - 45}px;position:absolute;`);
                    editBoard.setAttribute('class', 'messageBoard');
                    edits.forEach((editMsg) => {
                        let editTr = document.createElement('tr');
                        let editTd = document.createElement('td');
                        editTd.textContent = editMsg;
                        editTd.setAttribute('class', 'message');
                        editTr.appendChild(editTd);
                        editBoard.appendChild(editTr);
                    });
                    display.appendChild(editBoard);
                    document.body.appendChild(display);
                    document.addEventListener('mousemove', innerBehavior);
                });
                sub.addEventListener('mouseout', () => {
                    document.body.removeChild(document.getElementById('editDiv'));
                    document.removeEventListener('mousemove', innerBehavior)
                });
            }
            this.edits.push(this.message);
            this.message = newMsg;
            this.refreshMentions();
        }
        else
        {
            alert("Please do not try to delete other peoples' messages!");
        }
    }

    /**
     * Used internally to update mentions of this message whenever an edit is made
     */
    refreshMentions()
    {
        this.mentions = new Array(...message.match(/<@(?:\d){13}>/));
        if (this.mentions.includes(`<@${thisUser.id}>`))
        {
            this.element.classList.add('mention');
            if (document.visibilityState === 'hidden')
            {
                document.title = `${document.title.match(/\d*/).length === 0 ? 1 : ++Number(document.title.match(/\d*/)[0])}🔴 🅱iscord`;
                document.addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'visible')
                    {
                        document.title = '🅱iscord';
                        window.scrollBy({
                            top: window.outerHeight
                        });
                    }
                }, { once: true });
            }
        }
        else
        {
            if (this.element.classList.contains('mention'))
            {
                this.element.classList.remove('mention');
            }
        }
    }
}