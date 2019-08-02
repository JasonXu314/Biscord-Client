import Connection from './connection.js';
import User from './user.js';
import { thisUser } from './obj-oriented-client.js';
import { innerBehavior, retrieveUserByID, retrieveUserByName } from './utilities.js';

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
        this.messageRaw = message.replace(/@[a-zA-Z0-9_-]+/g, (substring) => retrieveUserByName(substring.slice(1)) === undefined ? substring : `<@${retrieveUserByName(substring.slice(1)).id}>`);

        /**
         * The message conveyed by this Message when rendered on-screen
         * Converts all mentions to the username of the respective User
         * @type {string}
         */
        this.messageDisplay = message.replace(/<@(?:\d){13}>/g, (substring) => `@${retrieveUserByID(parseInt(substring.slice(2, -1))).username}`);

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
        this.mentions = this.messageRaw.match(/<@(?:\d){13}>/g) === null ? [] : new Array(...this.messageRaw.match(/<@(?:\d){13}>/g));

        /**
         * A list of messages this message conveyed in the past
         * Arranged in order of first edited to last edited
         * @type {Array<string>}
         * @readonly
         */
        this.edits = [];

        this.element = document.createElement('tr');
        this.msg = document.createElement('td');
        this.element.appendChild(this.msg);
        this.msg.textContent = `${this.author.username}: ${this.messageDisplay}`;
        this.element.id = this.id;
        this.msg.classList.add('message');
        if (this.mentions.includes(`<@${thisUser.id}>`))
        {
            this.msg.classList.add('mention');
            if (document.visibilityState === 'hidden')
            {
                document.title = `${document.title.match(/\d+/) === null ? 1 : parseInt(document.title.match(/\d+/)[0]) + 1}🔴 🅱iscord`;
                document.addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'visible')
                    {
                        document.title = '🅱iscord';
                    }
                }, { once: true });
            }
        }
        this.msg.addEventListener('auxclick', (evt) => {
            if (evt.target === this.msg)
            {
                window.addEventListener('contextmenu', (evt) => evt.preventDefault(), { once: true });
                this.delete({ username: thisUser.username, id: thisUser.id });
            }
        });
        this.msg.addEventListener('click', (evt) => {
            if (evt.target === this.msg)
            {
                this.edit({
                    username: thisUser.username,
                    id: thisUser.id
                });
            }
        });
    }

    /**
     * Creates a message from given metadata, should only be used when creating dummy messages received from server
     * @param {string} message the text contained in the message
     * @param {UserShell} sender the user sending the message
     * @param {number} id the UUID of the message
     * @param {string[]} edits the edit history of the message
     */
    static CreateMessage(message, sender, id, edits)
    {
        const newMsg = new Message(message, User.DummyUser(sender.username, sender.id))
        newMsg.id = id;
        newMsg.edits = edits;

        newMsg.element = document.createElement('tr');
        newMsg.msg = document.createElement('td');
        newMsg.element.appendChild(newMsg.msg);
        newMsg.msg.textContent = `${newMsg.author.username}: ${newMsg.messageDisplay}`;
        newMsg.element.id = id;
        newMsg.msg.classList.add('message');

        if (this.mentions.includes(`<@${thisUser.id}>`))
        {
            this.msg.classList.add('mention');
        }

        if (edits.length !== 0)
        {
            const sub = document.createElement('sub');
            sub.textContent = `edited (${edits.length})`;
            sub.id = `${newMsg.id}sub`;
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
        newMsg.msg.addEventListener('auxclick', (evt) => {
            if (evt.target === newMsg.msg)
            {
                window.addEventListener('contextmenu', (evt) => evt.preventDefault(), { once: true });
                newMsg.delete({ username: thisUser.username, id: thisUser.id });
            }
        });
        newMsg.msg.addEventListener('click', (evt) => {
            if (evt.target === newMsg.msg)
            {
                newMsg.edit({
                    username: thisUser.username,
                    id: thisUser.id
                });
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
                id: this.id,
                creds: creds
            });
            document.getElementById('messageBoard').removeChild(this.element);
        }
        else
        {
            alert("Please do not try to delete other peoples' messages!");
        }
    }

    /**
     * Tries to edit this message
     * @param {UserCredentials} creds credentials of the user trying to edit the message
     * @param {string} newMsg the message to edit it to (use only upon receiving 'edit' signal from server)
     */
    edit(creds, newMsg)
    {
        if (!newMsg)
        {
            if (this.author.check(creds))
            {
                let editor = document.createElement('input');
                editor.id = 'editor';
                editor.autocomplete = 'off';
                const behavior = (evt) => {
                    if (evt.code === 'Enter' && evt.target === editor)
                    {
                        const newMsg = editor.value.trim();
                        
                        if (newMsg === undefined) return;

                        Connection.request('edit', {
                            id: this.id,
                            newMsg: newMsg,
                            oldMsg: this.messageRaw,
                            creds: {
                                username: this.author.username,
                                id: this.author.id
                            }
                        });
                        
                        this.edits.push(this.messageRaw);
                        this.messageRaw = newMsg;
                        this.messageDisplay = this.messageRaw.replace(/<@(?:\d){13}>/, (substring) => retrieveUserByID(substring.slice(2, -1)));
                        this.msg.textContent = `${this.author.username}: ${this.messageDisplay}`;
                        this.refreshMentions();
                        this.element.replaceChild(this.msg, editor);
            
                        if (this.edits.length === 1)
                        {
                            const sub = document.createElement('sub');
                            sub.textContent = 'edited (1)';
                            sub.id = `${this.id}sub`;
                            sub.addEventListener('mouseover', (evt) => {
                                let display = document.createElement('div');
                                display.id = 'editDiv';
                                let editBoard = document.createElement('table');
                                display.appendChild(editBoard);
                                display.setAttribute('style', `top:${evt.pageY - 45}px;left:${evt.pageX - 45}px;position:absolute;`);
                                editBoard.setAttribute('class', 'messageBoard');
                                this.edits.forEach((editMsg) => {
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
                            this.element.appendChild(sub);
                        }
                        else
                        {
                            document.getElementById(`${this.id}sub`).textContent = `edited (${this.edits.length})`;
                            this.element.appendChild(this.element.removeChild(document.getElementById(`${this.id}sub`)));
                        }
                    }
                };
                editor.addEventListener('keydown', behavior);
                const escBehavior = (evt) => {
                    if (evt.code === 'Escape' && evt.target === editor)
                    {
                        if (document.getElementById(`${this.id}sub`) !== null)
                        {
                            let sub = this.element.removeChild(document.getElementById(`${this.id}sub`));
                            this.element.appendChild(this.msg);
                            this.element.appendChild(sub);
                            this.element.removeChild(editor);
                            document.removeEventListener('keydown', behavior);
                            document.removeEventListener('keydown', escBehavior);
                        }
                        else
                        {
                            this.element.removeChild(editor);
                            this.element.appendChild(this.msg);
                            document.removeEventListener('keydown', behavior);
                            document.removeEventListener('keydown', escBehavior);
                        }
                    }
                };
                document.addEventListener('keydown', escBehavior);
                this.element.replaceChild(editor, this.msg);
                editor.focus();
            }
            else
            {
                alert("Please do not try to edit other peoples' messages!");
            }
        }
        else
        {

        }
    }

    /**
     * Used internally to update mentions of this message whenever an edit is made
     */
    refreshMentions()
    {
        this.mentions = this.messageRaw.match(/<@(?:\d){13}>/g) === null ? [] : new Array(...this.messageRaw.match(/<@(?:\d){13}>/g));
        if (this.mentions.includes(`<@${thisUser.id}>`))
        {
            this.element.classList.add('mention');
            if (document.visibilityState === 'hidden')
            {
                document.title = `${document.title.match(/\d*/).length === 0 ? 1 : parseInt(document.title.match(/\d*/)[0]) + 1}🔴 🅱iscord`;
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